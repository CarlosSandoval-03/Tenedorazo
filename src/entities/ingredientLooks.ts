import type p5 from "p5";
import { INGREDIENTS, PALETTE } from "../config";
import type { ProjectileKind } from "../types";
import { drawSilhouette } from "./blockLooks";

const OUTLINE_WEIGHT = 3;
const EYE_SIZE = 7;
const PUPIL_SIZE = 3.5;

// Centered on the origin, facing right (the way it flies). The launcher and the HUD use it too.
export function drawIngredientLook(p: p5, kind: ProjectileKind): void {
  const { shape } = INGREDIENTS[kind];
  p.rectMode(p.CENTER);
  p.stroke(PALETTE.ingredients.outline);
  p.strokeWeight(OUTLINE_WEIGHT);
  p.fill(PALETTE.ingredients[kind]);
  if (kind === "popcorn") drawPuffs(p);
  else drawSilhouette(p, shape);

  p.noStroke();
  DETAILS[kind](p);
  const size = shape.type === "circle" ? shape.radius : shape.height / 2;
  drawEyes(p, size);
}

const DETAILS: Record<ProjectileKind, (p: p5) => void> = {
  meatball: (p) => {
    p.fill(PALETTE.ingredients.detail);
    p.circle(-6, 5, 5);
    p.circle(-1, -8, 4);
    p.circle(4, 7, 3);
  },
  peaPod: (p) => {
    p.fill(PALETTE.ingredients.pea);
    for (const x of [-11, -1, 9]) p.circle(x, 3, 9);
  },
  chili: (p) => {
    // The green stem at the back.
    p.fill(PALETTE.ingredients.pea);
    p.rect(-18, -2, 8, 6, 2);
  },
  cheese: (p) => {
    p.fill(PALETTE.wood.fill);
    p.circle(-8, 6, 7);
    p.circle(2, 11, 4);
    p.circle(-10, -6, 4);
  },
  popcorn: () => {},
  pea: () => {},
};

function drawPuffs(p: p5): void {
  p.circle(-4, 2, 13);
  p.circle(4, 3, 12);
  p.circle(0, -4, 13);
}

// Two eyes near the front, scaled to the body.
function drawEyes(p: p5, size: number): void {
  const scale = Math.min(1, size / 10);
  const x = size * 0.45;
  for (const dx of [-EYE_SIZE * 0.55, EYE_SIZE * 0.55]) {
    p.fill(PALETTE.ingredients.eyeWhite);
    p.circle(x + dx * scale, -size * 0.3, EYE_SIZE * scale);
    p.fill(PALETTE.outline);
    p.circle(x + dx * scale + 1, -size * 0.3, PUPIL_SIZE * scale);
  }
}
