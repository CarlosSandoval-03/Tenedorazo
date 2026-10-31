import type p5 from "p5";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "../config";

const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 140;
const PANEL_ALPHA = 220;
const TITLE_SIZE = 40;
const HINT_SIZE = 18;

// A line over the middle of the screen, with a smaller hint under it.
export function drawBanner(p: p5, title: string, hint: string): void {
  const panel = p.color(PALETTE.ui.panel);
  panel.setAlpha(PANEL_ALPHA);
  p.rectMode(p.CENTER);
  p.noStroke();
  p.fill(panel);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 16);

  p.textAlign(p.CENTER, p.CENTER);
  p.fill(PALETTE.ui.text);
  p.textSize(TITLE_SIZE);
  p.text(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);
  p.fill(PALETTE.ui.dim);
  p.textSize(HINT_SIZE);
  p.text(hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 34);
}
