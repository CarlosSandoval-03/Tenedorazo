import type p5 from "p5";
import {
  CHEESE_SPIN,
  CHILI_BOOST,
  INGREDIENTS,
  LANDED_FRICTION_AIR,
  PEA_COUNT,
  PEA_SPREAD,
  POP_BLAST,
} from "../config";
import { drawInPose } from "../core/drawing";
import { add, normalize, rotate, scale, type Vec } from "../core/math";
import type { BodyDef, BodyHandle, World } from "../physics/World";
import type { Blast } from "../systems/Blasts";
import type { ProjectileKind } from "../types";
import { Entity } from "./Entity";
import { drawIngredientLook } from "./ingredientLooks";

// The split peas start side by side, this far apart, so they never overlap.
const PEA_GAP = 16;

// What an ability can do beyond its own body: add projectiles, set off a blast.
export interface AbilityEffects {
  spawn(projectile: Ingredient): void;
  blast(blast: Blast): void;
}

// A pantry ingredient, or a pea. It has no body while it waits or sits in the band; the launch
// creates one.
export class Ingredient extends Entity {
  readonly kind: ProjectileKind;
  body: BodyHandle | null = null;
  private readonly world: World;

  constructor(world: World, kind: ProjectileKind) {
    super();
    this.world = world;
    this.kind = kind;
  }

  launch(position: Vec, velocity: Vec): void {
    this.body = this.world.createBody(this.bodyDef(position, velocity));
  }

  // The body a launch creates; the aim preview flies the same one.
  bodyDef(position: Vec, velocity: Vec): BodyDef {
    const spec = INGREDIENTS[this.kind];
    return {
      isStatic: false,
      shape: spec.shape,
      position,
      material: spec,
      velocity,
      // No air drag, so the flight matches the aim preview.
      frictionAir: 0,
    };
  }

  // Once per flight, between ticks. Each does what the real food would.
  useAbility(effects: AbilityEffects): void {
    const body = this.body;
    if (!body) return;
    switch (this.kind) {
      case "peaPod":
        return this.splitPod(body, effects);
      case "chili":
        return this.boostChili(body);
      case "cheese":
        return this.spinCheese(body);
      case "popcorn":
        return this.popKernel(body, effects);
      case "meatball":
      case "pea":
        return;
    }
  }

  // The flight is over: from now on it rolls to a stop instead of forever.
  land(): void {
    if (this.body) this.world.setFrictionAir(this.body, LANDED_FRICTION_AIR);
  }

  remove(): void {
    if (this.body) this.world.remove(this.body);
    this.alive = false;
  }

  draw(p: p5): void {
    if (!this.body) return;
    this.drawAt(p, this.world.position(this.body), this.world.angle(this.body));
  }

  // Also used by the launcher, while the ingredient sits in the band without a body.
  drawAt(p: p5, position: Vec, angle: number): void {
    drawInPose(p, position, angle, () => drawIngredientLook(p, this.kind));
  }

  // The siblings split up: the pod is replaced by peas fanned around its heading.
  private splitPod(body: BodyHandle, effects: AbilityEffects): void {
    const position = this.world.position(body);
    const velocity = this.world.velocity(body);
    const across = normalize({ x: -velocity.y, y: velocity.x });
    this.remove();

    for (let i = 0; i < PEA_COUNT; i++) {
      const offset = i - (PEA_COUNT - 1) / 2;
      const pea = new Ingredient(this.world, "pea");
      pea.launch(
        add(position, scale(across, offset * PEA_GAP)),
        rotate(velocity, offset * PEA_SPREAD),
      );
      effects.spawn(pea);
    }
  }

  private boostChili(body: BodyHandle): void {
    const heading = normalize(this.world.velocity(body));
    this.world.addVelocity(body, scale(heading, CHILI_BOOST));
  }

  private spinCheese(body: BodyHandle): void {
    this.world.setAngularVelocity(body, CHEESE_SPIN);
  }

  private popKernel(body: BodyHandle, effects: AbilityEffects): void {
    effects.blast({ ...POP_BLAST, at: this.world.position(body) });
    this.remove();
  }
}
