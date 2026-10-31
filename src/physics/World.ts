import Matter from "matter-js";
import {
  GRAVITY,
  POSITION_ITERATIONS,
  SETTLE_SPEED,
  SETTLE_SPIN,
  SUBSTEPS,
  TICK_MS,
  VELOCITY_ITERATIONS,
} from "../config";
import { length, type Vec } from "../core/math";

export interface PhysicalMaterial {
  readonly density: number;
  readonly friction: number;
  readonly restitution: number;
}

export type ShapeDef =
  | { readonly type: "box"; readonly width: number; readonly height: number }
  | { readonly type: "circle"; readonly radius: number };

export interface BodyDef {
  isStatic: boolean;
  shape: ShapeDef;
  // px, the center.
  position: Vec;
  // radians.
  angle?: number;
  material: PhysicalMaterial;
  // px/s, at creation.
  velocity?: Vec;
  frictionAir?: number;
}

// A new contact's strength: the closing speed along the normal times the pair's reduced mass.
export interface Impact {
  readonly a: BodyHandle;
  readonly b: BodyHandle;
  readonly strength: number;
  readonly point: Vec;
}

// Opaque: the rest of the game keeps and compares handles, and only World opens them.
export class BodyHandle {
  declare private readonly brand: never;
}

// Matter measures velocity per 1/60 s, whatever the step; outside, everything is per second.
const MATTER_VELOCITY_MS = 1000 / 60;
const PER_SECOND = 1000 / MATTER_VELOCITY_MS;
const SUBSTEP_MS = TICK_MS / SUBSTEPS;

// The only module that sees Matter.js.
export class World {
  private readonly engine = createEngine();
  private readonly bodies = new Map<BodyHandle, Matter.Body>();
  private readonly handlesById = new Map<number, BodyHandle>();
  // The largest impact of each pair in the current tick, by pair id.
  private readonly impacts = new Map<string, Impact>();

  constructor() {
    // collisionStart fires before the solver, while the bodies still have their incoming velocities.
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) this.recordImpact(pair);
    });
  }

  createBody(def: BodyDef): BodyHandle {
    const body = createMatterBody(def);
    const handle = new BodyHandle();
    this.bodies.set(handle, body);
    this.handlesById.set(body.id, handle);
    Matter.Composite.add(this.engine.world, body);
    return handle;
  }

  remove(handle: BodyHandle): void {
    const body = this.bodies.get(handle);
    if (!body) return;
    Matter.Composite.remove(this.engine.world, body);
    this.bodies.delete(handle);
    this.handlesById.delete(body.id);
  }

  has(handle: BodyHandle): boolean {
    return this.bodies.has(handle);
  }

  // One 1/60 s tick, as SUBSTEPS equal updates.
  step(): void {
    this.impacts.clear();
    stepEngine(this.engine);
  }

  // The impacts of the last tick, handed over once.
  takeImpacts(): Impact[] {
    const impacts = [...this.impacts.values()];
    this.impacts.clear();
    return impacts;
  }

  // The engine's own flight of a body alone in an empty world: one position per tick.
  predictFlight(def: BodyDef, ticks: number): Vec[] {
    const engine = createEngine();
    const body = createMatterBody(def);
    Matter.Composite.add(engine.world, body);

    const positions: Vec[] = [];
    for (let i = 0; i < ticks; i++) {
      stepEngine(engine);
      positions.push({ x: body.position.x, y: body.position.y });
    }
    return positions;
  }

  position(handle: BodyHandle): Vec {
    const { x, y } = this.body(handle).position;
    return { x, y };
  }

  angle(handle: BodyHandle): number {
    return this.body(handle).angle;
  }

  // px/s.
  velocity(handle: BodyHandle): Vec {
    const { x, y } = Matter.Body.getVelocity(this.body(handle));
    return { x: x * PER_SECOND, y: y * PER_SECOND };
  }

  // rad/s.
  angularVelocity(handle: BodyHandle): number {
    return Matter.Body.getAngularVelocity(this.body(handle)) * PER_SECOND;
  }

  // A discrete change of motion (a push, an ability), never a per-frame drive.
  addVelocity(handle: BodyHandle, change: Vec): void {
    const body = this.body(handle);
    const current = Matter.Body.getVelocity(body);
    Matter.Body.setVelocity(body, {
      x: current.x + change.x / PER_SECOND,
      y: current.y + change.y / PER_SECOND,
    });
  }

  setFrictionAir(handle: BodyHandle, frictionAir: number): void {
    this.body(handle).frictionAir = frictionAir;
  }

  isBodyStill(handle: BodyHandle): boolean {
    if (this.isStatic(handle)) return true;
    return (
      length(this.velocity(handle)) < SETTLE_SPEED &&
      Math.abs(this.angularVelocity(handle)) < SETTLE_SPIN
    );
  }

  isStill(): boolean {
    return this.handles().every((handle) => this.isBodyStill(handle));
  }

  handles(): BodyHandle[] {
    return [...this.bodies.keys()];
  }

  isStatic(handle: BodyHandle): boolean {
    return this.body(handle).isStatic;
  }

  // The outline in world px, for debug drawing.
  vertices(handle: BodyHandle): Vec[] {
    return this.body(handle).vertices.map(({ x, y }) => ({ x, y }));
  }

  // The topmost dynamic body under a point, if any.
  bodyAt(point: Vec): BodyHandle | undefined {
    for (const [handle, body] of [...this.bodies].reverse()) {
      if (body.isStatic) continue;
      if (Matter.Vertices.contains(body.vertices, point)) return handle;
    }
    return undefined;
  }

  mass(handle: BodyHandle): number {
    return this.body(handle).mass;
  }

  private recordImpact(pair: Matter.Pair): void {
    const a = this.handlesById.get(pair.bodyA.id);
    const b = this.handlesById.get(pair.bodyB.id);
    const support = pair.collision.supports[0];
    if (!a || !b || !support) return;

    const strength = closingSpeed(pair) * reducedMass(pair.bodyA, pair.bodyB);
    const previous = this.impacts.get(pair.id);
    if (previous && previous.strength >= strength) return;
    this.impacts.set(pair.id, {
      a,
      b,
      strength,
      point: { x: support.x, y: support.y },
    });
  }

  private body(handle: BodyHandle): Matter.Body {
    const body = this.bodies.get(handle);
    if (!body) throw new Error("The body was removed from the world");
    return body;
  }
}

function createEngine(): Matter.Engine {
  return Matter.Engine.create({
    // Matter's gravity is px/ms² once scaled.
    gravity: { x: 0, y: 1, scale: GRAVITY / 1e6 },
    positionIterations: POSITION_ITERATIONS,
    velocityIterations: VELOCITY_ITERATIONS,
    // A sleeping stack never wakes when its support goes, and floats.
    enableSleeping: false,
  });
}

function stepEngine(engine: Matter.Engine): void {
  for (let i = 0; i < SUBSTEPS; i++) Matter.Engine.update(engine, SUBSTEP_MS);
}

// px/s along the contact normal; the sign doesn't matter, only how fast they meet.
function closingSpeed(pair: Matter.Pair): number {
  const va = Matter.Body.getVelocity(pair.bodyA);
  const vb = Matter.Body.getVelocity(pair.bodyB);
  const { normal } = pair.collision;
  const along = (va.x - vb.x) * normal.x + (va.y - vb.y) * normal.y;
  return Math.abs(along) * PER_SECOND;
}

// A static body is immovable, so the moving body's own mass takes the whole hit.
function reducedMass(a: Matter.Body, b: Matter.Body): number {
  if (a.isStatic) return b.mass;
  if (b.isStatic) return a.mass;
  return (a.mass * b.mass) / (a.mass + b.mass);
}

function createMatterBody(def: BodyDef): Matter.Body {
  const options: Matter.IChamferableBodyDefinition = {
    isStatic: def.isStatic,
    angle: def.angle ?? 0,
    friction: def.material.friction,
    restitution: def.material.restitution,
  };
  // A static body's mass is infinite; a density would only fight that.
  if (!def.isStatic) options.density = def.material.density;
  if (def.frictionAir !== undefined) options.frictionAir = def.frictionAir;

  const { x, y } = def.position;
  const body =
    def.shape.type === "box"
      ? Matter.Bodies.rectangle(
          x,
          y,
          def.shape.width,
          def.shape.height,
          options,
        )
      : Matter.Bodies.circle(x, y, def.shape.radius, options);

  if (def.velocity)
    Matter.Body.setVelocity(body, {
      x: def.velocity.x / PER_SECOND,
      y: def.velocity.y / PER_SECOND,
    });
  return body;
}
