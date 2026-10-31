import type p5 from "p5";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "../config";

const TILE_SIZE = 48;

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
