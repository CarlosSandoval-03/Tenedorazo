import type p5 from "p5";
import { PALETTE } from "../config";
import { drawHat } from "./Hat";

// The bar runs a little past the 3-hat threshold, so that mark never sits at its very end.
const OVERSHOOT = 1.15;
const BAR_HEIGHT = 10;
const HAT_SIZE = 18;
const PENDING_ALPHA = 110;

export interface ScoreBarState {
  // Scored so far.
  score: number;
  // What a win right now would add: the bonus for the ingredients still left.
  pendingBonus: number;
  stars: readonly [number, number];
}

// The score against the level's hat thresholds: a hat mark at each, gold once the score passes it.
export function drawScoreBar(
  p: p5,
  box: { left: number; top: number; width: number },
  state: ScoreBarState,
): void {
  const { left, top, width } = box;
  const max = state.stars[1] * OVERSHOOT;
  const xAt = (points: number) => left + (width * Math.min(points, max)) / max;

  p.rectMode(p.CORNERS);
  p.noStroke();
  p.fill(PALETTE.ui.panel);
  p.rect(left, top, left + width, top + BAR_HEIGHT, BAR_HEIGHT / 2);
  const pending = p.color(PALETTE.ui.gold);
  pending.setAlpha(PENDING_ALPHA);
  p.fill(pending);
  p.rect(
    left,
    top,
    xAt(state.score + state.pendingBonus),
    top + BAR_HEIGHT,
    BAR_HEIGHT / 2,
  );
  p.fill(PALETTE.ui.gold);
  p.rect(left, top, xAt(state.score), top + BAR_HEIGHT, BAR_HEIGHT / 2);

  for (const threshold of state.stars) {
    const x = xAt(threshold);
    p.stroke(PALETTE.ui.text);
    p.strokeWeight(2);
    p.line(x, top - 2, x, top + BAR_HEIGHT + 2);
    const center = { x, y: top + BAR_HEIGHT + HAT_SIZE * 0.75 };
    drawHat(p, center, HAT_SIZE, state.score >= threshold);
  }
}
