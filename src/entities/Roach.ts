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
const COLANDER_HOLES = [-0.5, -0.1, 0.3, 0.7];

// What each kind wears over its shell, in units of the radius.
const HEADGEAR: Record<RoachKind, (p: p5, weight: number) => void> = {
  roach: () => {},
  capped: drawBottleCap,
  colander: drawColander,
  queen: drawJarLidCrown,
};

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
      HEADGEAR[this.kind](p, OUTLINE_WEIGHT / this.radius);
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

function drawBottleCap(p: p5, weight: number): void {
  p.stroke(PALETTE.outline);
  p.strokeWeight(weight);
  p.fill(PALETTE.cap.fill);
  p.rect(-0.45, -0.95, 1.1, 0.32, 0.08);
  // The crimped rim.
  p.stroke(PALETTE.cap.rim);
  for (let x = -0.35; x < 0.6; x += 0.2) p.line(x, -0.9, x, -0.68);
}

function drawColander(p: p5, weight: number): void {
  p.stroke(PALETTE.outline);
  p.strokeWeight(weight);
  p.fill(PALETTE.steel.fill);
  p.arc(0.1, -0.05, 2.15, 1.8, p.PI, p.TWO_PI, p.CHORD);
  p.noStroke();
  p.fill(PALETTE.outline);
  for (const x of COLANDER_HOLES) p.circle(x, -0.45, 0.14);
}

function drawJarLidCrown(p: p5, weight: number): void {
  p.stroke(PALETTE.outline);
  p.strokeWeight(weight);
  p.fill(PALETTE.crown.fill);
  p.rect(-0.4, -1.05, 1, 0.38, 0.06);
  p.triangle(-0.4, -1.05, -0.25, -1.35, -0.1, -1.05);
  p.triangle(0.0, -1.05, 0.1, -1.4, 0.2, -1.05);
  p.triangle(0.3, -1.05, 0.45, -1.35, 0.6, -1.05);
  p.fill(PALETTE.crown.jewel);
  p.circle(0.1, -0.86, 0.18);
}
