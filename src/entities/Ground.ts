import type p5 from "p5";
import { COUNTER, PALETTE } from "../config";
import type { Vec } from "../core/math";
import type { World } from "../physics/World";
import { Entity } from "./Entity";

const TOP_BAND = 8;

export interface GroundSpec {
  center: Vec;
  width: number;
  height: number;
}

// Static counter stone: floor, shelves, counter edges.
export class Ground extends Entity {
  private readonly spec: GroundSpec;

  constructor(world: World, spec: GroundSpec) {
    super();
    this.spec = spec;
    world.createBody({
      isStatic: true,
      shape: { type: "box", width: spec.width, height: spec.height },
      position: spec.center,
      material: COUNTER,
    });
  }

  draw(p: p5): void {
    const { center, width, height } = this.spec;
    const left = center.x - width / 2;
    const top = center.y - height / 2;

    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(PALETTE.counter.body);
    p.rect(left, top, width, height);
    p.fill(PALETTE.counter.top);
    p.rect(left, top, width, TOP_BAND);
  }
}
