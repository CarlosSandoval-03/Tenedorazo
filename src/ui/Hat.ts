import type p5 from "p5";
import { PALETTE } from "../config";
import type { Vec } from "../core/math";

const OUTLINE_WEIGHT = 4;
// Hats in a row sit this many hat sizes apart.
export const HAT_SPACING = 1.4;

// A chef's hat: a puffy top over a band, gold when earned, dark when not.
export function drawHat(
  p: p5,
  center: Vec,
  size: number,
  isEarned: boolean,
): void {
  p.push();
  p.translate(center.x, center.y);
  p.scale(size / 2);
  p.rectMode(p.CORNERS);
  // The outline is the same shapes drawn fatter underneath, so the puffs merge into one silhouette.
  p.stroke(isEarned ? PALETTE.outline : PALETTE.ui.dim);
  p.strokeWeight(OUTLINE_WEIGHT / (size / 2));
  drawHatShapes(p);
  p.noStroke();
  p.fill(isEarned ? PALETTE.ui.gold : PALETTE.ui.panel);
  drawHatShapes(p);
  p.pop();
}

// Three hats in a row, the first `earned` of them gold.
export function drawHatRow(
  p: p5,
  center: Vec,
  size: number,
  earned: number,
): void {
  for (let i = 0; i < 3; i++) {
    const x = center.x + (i - 1) * size * HAT_SPACING;
    drawHat(p, { x, y: center.y }, size, i < earned);
  }
}

function drawHatShapes(p: p5): void {
  p.circle(-0.45, -0.2, 0.9);
  p.circle(0.45, -0.2, 0.9);
  p.circle(0, -0.45, 1);
  p.rect(-0.6, 0, 0.6, 0.75, 0.1);
}
