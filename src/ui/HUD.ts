import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE } from "../config";
import { drawIngredientLook } from "../entities/ingredientLooks";
import type { ProjectileKind } from "../types";

const MARGIN = 28;
const ICON_SPACING = 40;
const ICON_SCALE = 0.75;
const HINT_Y = 72;
const HINT_SIZE = 22;

// The ingredients left, the next one first, as small icons along the top left.
export function drawHUD(
  p: p5,
  ingredientsLeft: readonly ProjectileKind[],
): void {
  ingredientsLeft.forEach((kind, i) => {
    p.push();
    p.translate(MARGIN + i * ICON_SPACING, MARGIN);
    p.scale(ICON_SCALE);
    drawIngredientLook(p, kind);
    p.pop();
  });
}

// The pantry's one-line hint, under the top edge.
export function drawHint(p: p5, hint: string): void {
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(HINT_SIZE);
  p.stroke(PALETTE.outline);
  p.strokeWeight(4);
  p.fill(PALETTE.ui.text);
  p.text(hint, CANVAS_WIDTH / 2, HINT_Y);
}
