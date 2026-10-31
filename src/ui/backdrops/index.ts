import type p5 from "p5";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOOR_SCREEN_Y,
  PALETTE,
} from "../../config";
import type { Place } from "../../levels/places";
import { PLACE_LAYERS, type BackdropColors } from "./places";

const TILE_SIZE = 48;
const COUNTER_TOP_BAND = 8;
// How far each layer moves for each px the camera moves: the far wall least.
const FAR_PARALLAX = 0.2;
const NEAR_PARALLAX = 0.5;

// The night kitchen behind a scene: the place's wall of tiles, its far furniture, and its near
// furniture, each layer sliding a little as the camera moves.
export function drawBackdrop(p: p5, place: Place, cameraLeft = 0): void {
  const colors: BackdropColors = PALETTE.backdrops[place];
  const layers = PLACE_LAYERS[place];
  p.push();
  p.rectMode(p.CORNER);
  p.background(colors.wall);
  drawTiles(p, colors, cameraLeft * FAR_PARALLAX);
  layers.far(p, colors, cameraLeft * FAR_PARALLAX);
  layers.near(p, colors, cameraLeft * NEAR_PARALLAX);
  p.pop();
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

function drawTiles(p: p5, colors: BackdropColors, offset: number): void {
  p.stroke(colors.grout);
  p.strokeWeight(2);
  const shift = offset % TILE_SIZE;
  for (let x = TILE_SIZE - shift; x < CANVAS_WIDTH; x += TILE_SIZE)
    p.line(x, 0, x, CANVAS_HEIGHT);
  for (let y = TILE_SIZE; y < CANVAS_HEIGHT; y += TILE_SIZE)
    p.line(0, y, CANVAS_WIDTH, y);
}
