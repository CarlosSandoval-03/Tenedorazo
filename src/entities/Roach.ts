import type p5 from "p5";
import { PALETTE, ROACHES } from "../config";
import { drawInPose } from "../core/drawing";
import type { Vec } from "../core/math";
import type { World } from "../physics/World";
import type { RoachKind } from "../types";
import { drawDamage, drawFlash } from "./blockLooks";
import { Destructible } from "./Destructible";

const OUTLINE_WEIGHT = 3;
const LEG_WEIGHT = 2;

// Proportions of the roach's radius, seen from the side, facing the fork.
const SHELL_WIDTH = 1.9;
const SHELL_HEIGHT = 1.4;
const HEAD_X = -0.85;
const HEAD_SIZE = 0.75;
const EYE_SIZE = 0.3;
const LEG_XS = [-0.5, 0, 0.5];

export class Roach extends Destructible {
  readonly kind: RoachKind;
  private readonly radius: number;
  private readonly world: World;

  constructor(world: World, kind: RoachKind, position: Vec) {
    const spec = ROACHES[kind];
    const body = world.createBody({
      isStatic: false,
      shape: { type: "circle", radius: spec.radius },
      position,
      material: spec,
    });
    super(body, spec);
    this.world = world;
    this.kind = kind;
    this.radius = spec.radius;
  }

  draw(p: p5): void {
    const position = this.world.position(this.body);
    drawInPose(p, position, this.world.angle(this.body), () => {
      p.push();
      p.scale(this.radius);
      this.drawLegs(p);
      this.drawShell(p);
      this.drawHead(p);
      p.pop();
      // In px, outside the scale, so the cracks keep their stroke width.
      const shape = { type: "circle", radius: this.radius } as const;
      drawDamage(p, shape, this.damageState());
      if (this.isFlashing) drawFlash(p, shape);
    });
  }

  // Everything below is drawn in units of the radius.
  private drawLegs(p: p5): void {
    p.stroke(PALETTE.outline);
    p.strokeWeight(LEG_WEIGHT / this.radius);
    for (const x of LEG_XS) p.line(x, 0.2, x - 0.25, 1);
  }

  private drawShell(p: p5): void {
    p.stroke(PALETTE.outline);
    p.strokeWeight(OUTLINE_WEIGHT / this.radius);
    p.fill(PALETTE.roach.shell);
    p.ellipse(0.1, -0.05, SHELL_WIDTH, SHELL_HEIGHT);
    p.noFill();
    p.stroke(PALETTE.roach.highlight);
    p.arc(
      0.1,
      -0.05,
      SHELL_WIDTH * 0.7,
      SHELL_HEIGHT * 0.6,
      p.PI * 1.1,
      p.PI * 1.6,
    );
  }

  private drawHead(p: p5): void {
    p.stroke(PALETTE.outline);
    p.strokeWeight(OUTLINE_WEIGHT / this.radius);
    p.fill(PALETTE.roach.shell);
    p.circle(HEAD_X, 0.1, HEAD_SIZE);
    p.fill(PALETTE.roach.eyes);
    p.circle(HEAD_X - 0.1, 0, EYE_SIZE);
    // The antennae sweep up and forward.
    p.noFill();
    p.strokeWeight(LEG_WEIGHT / this.radius);
    p.bezier(
      HEAD_X,
      -0.2,
      HEAD_X - 0.2,
      -0.9,
      HEAD_X - 0.6,
      -1,
      HEAD_X - 0.9,
      -0.8,
    );
  }
}
