import type p5 from "p5";
import { PALETTE, PREVIEW_DOT_SPACING } from "../config";
import { lerp, type Vec } from "../core/math";

const DOT_SIZE = 6;
const LAST_DOT_SIZE = 3;

// Every PREVIEW_DOT_SPACING-th predicted position as a dot, shrinking along the flight.
export function drawAimPreview(p: p5, flight: readonly Vec[]): void {
  p.noStroke();
  p.fill(PALETTE.preview);
  const dots = flight.filter((_, i) => (i + 1) % PREVIEW_DOT_SPACING === 0);
  dots.forEach((dot, i) => {
    const t = dots.length > 1 ? i / (dots.length - 1) : 0;
    p.circle(dot.x, dot.y, lerp(DOT_SIZE, LAST_DOT_SIZE, t));
  });
}
