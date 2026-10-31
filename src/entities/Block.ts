import type p5 from "p5";
import { MATERIALS, type SurfaceKind } from "../config";
import { drawInPose } from "../core/drawing";
import type { Vec } from "../core/math";
import type { BodyHandle, ShapeDef, World } from "../physics/World";
import { drawBlockLook } from "./blockLooks";
import { Entity } from "./Entity";

export interface BlockSpec {
  material: Exclude<SurfaceKind, "counter">;
  shape: ShapeDef;
  position: Vec;
  angle?: number;
}

export class Block extends Entity {
  readonly body: BodyHandle;
  readonly material: BlockSpec["material"];
  readonly shape: ShapeDef;
  private readonly world: World;

  constructor(world: World, spec: BlockSpec) {
    super();
    this.world = world;
    this.material = spec.material;
    this.shape = spec.shape;
    this.body = world.createBody({
      isStatic: false,
      shape: spec.shape,
      position: spec.position,
      angle: spec.angle,
      material: MATERIALS[spec.material],
    });
  }

  draw(p: p5): void {
    drawInPose(
      p,
      this.world.position(this.body),
      this.world.angle(this.body),
      () => drawBlockLook(p, this.material, this.shape),
    );
  }
}
