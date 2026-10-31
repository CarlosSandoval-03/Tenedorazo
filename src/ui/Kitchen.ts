import type p5 from "p5";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOOR_SCREEN_Y,
  PALETTE,
} from "../config";

const TILE_SIZE = 48;
const COUNTER_TOP_BAND = 8;

// The dark kitchen wall behind every scene: quiet, low-contrast tiles.
export function drawKitchen(p: p5): void {
  p.background(PALETTE.room.wall);
  p.stroke(PALETTE.room.grout);
  p.strokeWeight(2);
  for (let x = TILE_SIZE; x < CANVAS_WIDTH; x += TILE_SIZE)
    p.line(x, 0, x, CANVAS_HEIGHT);
  for (let y = TILE_SIZE; y < CANVAS_HEIGHT; y += TILE_SIZE)
    p.line(0, y, CANVAS_WIDTH, y);
}

// The counter under the whole screen, so it still reaches the edges when the camera zooms out
// past the level's ends; the level's own ground draws over it.
export function drawCounterBand(p: p5): void {
  p.noStroke();
  p.rectMode(p.CORNER);
  p.fill(PALETTE.counter.body);
  p.rect(0, FLOOR_SCREEN_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_SCREEN_Y);
  p.fill(PALETTE.counter.top);
  p.rect(0, FLOOR_SCREEN_Y, CANVAS_WIDTH, COUNTER_TOP_BAND);
}
