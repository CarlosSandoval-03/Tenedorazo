import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE } from "../config";
import type { Vec } from "../core/math";
import { drawIngredientLook } from "../entities/ingredientLooks";
import type { ProjectileKind } from "../types";

const MARGIN = 28;
const ICON_SPACING = 40;
const ICON_SCALE = 0.75;
const HINT_Y = 72;
const HINT_SIZE = 22;
const SCORE_SIZE = 28;
const PAUSE_SIZE = 40;
const PAUSE_CENTER = { x: CANVAS_WIDTH - MARGIN - 4, y: MARGIN + 4 };

export interface HudState {
  ingredientsLeft: readonly ProjectileKind[];
  score: number;
}

// The ingredients left along the top left, the next one first; the score and the pause button
// along the top right.
export function drawHUD(p: p5, state: HudState): void {
  state.ingredientsLeft.forEach((kind, i) => {
    p.push();
    p.translate(MARGIN + i * ICON_SPACING, MARGIN);
    p.scale(ICON_SCALE);
    drawIngredientLook(p, kind);
    p.pop();
  });
  drawScore(p, state.score);
  drawPauseButton(p);
}

// The pause button is for touch; the keyboard has Esc.
export function isOnPauseButton(point: Vec): boolean {
  return (
    Math.abs(point.x - PAUSE_CENTER.x) <= PAUSE_SIZE / 2 &&
    Math.abs(point.y - PAUSE_CENTER.y) <= PAUSE_SIZE / 2
  );
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

function drawScore(p: p5, score: number): void {
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(SCORE_SIZE);
  p.stroke(PALETTE.outline);
  p.strokeWeight(4);
  p.fill(PALETTE.ui.text);
  p.text(String(score), PAUSE_CENTER.x - PAUSE_SIZE, PAUSE_CENTER.y);
}

function drawPauseButton(p: p5): void {
  const { x, y } = PAUSE_CENTER;
  p.rectMode(p.CENTER);
  p.stroke(PALETTE.ui.dim);
  p.strokeWeight(2);
  p.fill(PALETTE.ui.panel);
  p.rect(x, y, PAUSE_SIZE, PAUSE_SIZE, 8);
  p.noStroke();
  p.fill(PALETTE.ui.text);
  p.rect(x - 6, y, 6, PAUSE_SIZE / 2, 2);
  p.rect(x + 6, y, 6, PAUSE_SIZE / 2, 2);
}
