import type p5 from "p5";
import { MATERIALS } from "../config";
import { drawInPose } from "../core/drawing";
import type { Vec } from "../core/math";
import type { ShapeDef, World } from "../physics/World";
import type { MaterialKind } from "../types";
import { drawBlockLook, drawDamage, drawFlash } from "./blockLooks";
import { Destructible } from "./Destructible";

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

  draw(p: p5): void {
    const position = this.world.position(this.body);
    drawInPose(p, position, this.world.angle(this.body), () => {
      drawBlockLook(p, this.material, this.shape);
      drawDamage(p, this.shape, this.damageState());
      if (this.isFlashing) drawFlash(p, this.shape);
    });
  }
}
