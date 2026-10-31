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
