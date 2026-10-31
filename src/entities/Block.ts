import type p5 from "p5";
import { MATERIALS } from "../config";
import { drawInPose } from "../core/drawing";
import type { Vec } from "../core/math";
import type { Blast } from "../systems/Blasts";
import type { ShapeDef, World } from "../physics/World";
import type { MaterialKind } from "../types";
import { drawBlockLook, drawDamage, drawFlash } from "./blockLooks";
import { Destructible } from "./Destructible";

// The jelly's wobble: how far it squashes, how fast it rings (rad/tick), how soon it calms (ticks).
const WOBBLE_AMPLITUDE = 0.15;
const WOBBLE_SPEED = 0.7;
const WOBBLE_DECAY = 18;

export interface BlockSpec {
  material: MaterialKind;
  shape: ShapeDef;
  position: Vec;
  angle?: number;
}

export class Block extends Destructible {
  readonly material: MaterialKind;
  readonly shape: ShapeDef;
  private readonly world: World;

  constructor(world: World, spec: BlockSpec) {
    const material = MATERIALS[spec.material];
    const body = world.createBody({
      isStatic: false,
      shape: spec.shape,
      position: spec.position,
      angle: spec.angle,
      material,
    });
    super(body, material);
    this.world = world;
    this.material = spec.material;
    this.shape = spec.shape;
  }

  // The blast it makes now that it is destroyed, if its material explodes.
  blastOnDestroy(): Blast | undefined {
    const blast = MATERIALS[this.material].blast;
    if (!blast) return undefined;
    return { ...blast, at: this.world.position(this.body) };
  }

  draw(p: p5): void {
    const position = this.world.position(this.body);
    drawInPose(p, position, this.world.angle(this.body), () => {
      if (this.isUnbreakable) this.wobble(p);
      drawBlockLook(p, this.material, this.shape);
      drawDamage(p, this.shape, this.damageState());
      if (this.isFlashing) drawFlash(p, this.shape);
    });
  }

  // A draw-only spring: squash and stretch that rings down after each hit.
  private wobble(p: p5): void {
    const t = this.ticksSinceHit;
    if (t === Infinity) return;
    const amount =
      WOBBLE_AMPLITUDE *
      Math.sin(t * WOBBLE_SPEED) *
      Math.exp(-t / WOBBLE_DECAY);
    p.scale(1 + amount, 1 - amount);
  }
}
