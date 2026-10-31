import type p5 from "p5";
import { drawIngredientLook } from "../entities/Ingredient";
import type { IngredientKind } from "../types";

const MARGIN = 28;
const ICON_SPACING = 40;
const ICON_SCALE = 0.75;

// The ingredients left, the next one first, as small icons along the top left.
export function drawHUD(
  p: p5,
  ingredientsLeft: readonly IngredientKind[],
): void {
  ingredientsLeft.forEach((kind, i) => {
    p.push();
    p.translate(MARGIN + i * ICON_SPACING, MARGIN);
    p.scale(ICON_SCALE);
    drawIngredientLook(p, kind);
    p.pop();
  });
}
