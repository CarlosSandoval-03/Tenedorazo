import type p5 from "p5";
import { INGREDIENTS, LANDED_FRICTION_AIR, PALETTE } from "../config";
import { drawInPose } from "../core/drawing";
import type { Vec } from "../core/math";
import type { BodyDef, BodyHandle, World } from "../physics/World";
import { drawSilhouette } from "./blockLooks";
import type { IngredientKind } from "../types";
import { Entity } from "./Entity";

const OUTLINE_WEIGHT = 3;

// A pantry ingredient. It has no body while it waits or sits in the band; the launch creates one.
export class Ingredient extends Entity {
  readonly kind: IngredientKind;
  body: BodyHandle | null = null;
  private readonly world: World;

  constructor(world: World, kind: IngredientKind) {
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
}

// Centered on the origin; the HUD draws its icons with it too.
export function drawIngredientLook(p: p5, kind: IngredientKind): void {
  p.rectMode(p.CENTER);
  p.stroke(PALETTE.ingredients.outline);
  p.strokeWeight(OUTLINE_WEIGHT);
  p.fill(PALETTE.ingredients[kind]);
  drawSilhouette(p, INGREDIENTS[kind].shape);
}
