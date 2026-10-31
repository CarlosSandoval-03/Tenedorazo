import { describe, expect, it } from "vitest";
import { World } from "./World";

const STONE = { density: 0.001, friction: 0.8, restitution: 0 };

function worldWithFloor(): World {
  const world = new World();
  world.createBody({
    isStatic: true,
    shape: { type: "box", width: 960, height: 64 },
    position: { x: 480, y: 32 },
    material: STONE,
  });
  return world;
}

describe("World", () => {
  it("rests a dropped box on the floor", () => {
    const world = worldWithFloor();
    const box = world.createBody({
      isStatic: false,
      shape: { type: "box", width: 32, height: 32 },
      position: { x: 480, y: -200 },
      material: STONE,
    });

    for (let i = 0; i < 180; i++) world.step();

    expect(Math.abs(world.position(box).y - -16)).toBeLessThan(1);
    expect(world.isStill()).toBe(true);
  });

  it("reports velocity in px/s", () => {
    const world = new World();
    const ball = world.createBody({
      isStatic: false,
      shape: { type: "circle", radius: 8 },
      position: { x: 0, y: 0 },
      material: STONE,
      velocity: { x: 300, y: 0 },
      frictionAir: 0,
    });

    for (let i = 0; i < 60; i++) world.step();

    expect(world.position(ball).x).toBeCloseTo(300, 0);
    expect(world.velocity(ball).x).toBeCloseTo(300, 0);
  });
});

describe("World.predictFlight", () => {
  it("matches the real flight in an empty world", () => {
    const world = new World();
    const def = {
      isStatic: false,
      shape: { type: "circle", radius: 14 },
      position: { x: 160, y: -96 },
      material: STONE,
      velocity: { x: 700, y: -500 },
      frictionAir: 0,
    } as const;

    const predicted = world.predictFlight(def, 60);
    const body = world.createBody(def);
    for (let i = 0; i < 60; i++) world.step();

    const real = world.position(body);
    expect(Math.abs(real.x - predicted[59].x)).toBeLessThan(0.01);
    expect(Math.abs(real.y - predicted[59].y)).toBeLessThan(0.01);
  });
});

describe("World.takeImpacts", () => {
  it("records the landing, and nothing while resting", () => {
    const world = worldWithFloor();
    world.createBody({
      isStatic: false,
      shape: { type: "box", width: 32, height: 32 },
      position: { x: 480, y: -100 },
      material: STONE,
    });

    const landing: number[] = [];
    for (let i = 0; i < 120; i++) {
      world.step();
      for (const impact of world.takeImpacts()) landing.push(impact.strength);
    }
    let resting = 0;
    for (let i = 0; i < 120; i++) {
      world.step();
      resting += world.takeImpacts().length;
    }

    expect(landing[0]).toBeGreaterThan(0);
    expect(resting).toBe(0);
  });
});
