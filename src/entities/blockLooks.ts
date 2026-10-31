import type p5 from "p5";
import { PALETTE } from "../config";
import type { ShapeDef } from "../physics/World";
import type { MaterialKind } from "../types";
import { DAMAGE_STATE, type DamageState } from "./Destructible";

const OUTLINE_WEIGHT = 3;
const CORNER_RADIUS = 3;
const GLASS_ALPHA = 170;
const GRAIN_SPACING = 6;
const RIM_INSET = 4;
const CRACK_WEIGHT = 2;
const FLASH_ALPHA = 200;

// Crack polylines as fractions of the block's half size, so they fit any shape.
const CRACKS: Record<DamageState, readonly (readonly [number, number])[][]> = {
  intact: [],
  cracked: [
    [
      [-0.2, -1],
      [0.1, -0.4],
      [-0.1, 0.1],
    ],
  ],
  broken: [
    [
      [-0.2, -1],
      [0.1, -0.4],
      [-0.1, 0.1],
      [0.3, 0.7],
    ],
    [
      [1, -0.3],
      [0.4, 0],
      [0.5, 0.5],
    ],
    [
      [-1, 0.4],
      [-0.4, 0.2],
    ],
  ],
};

// How each material reads at a glance, centered on the origin of the body's frame.
export function drawBlockLook(
  p: p5,
  material: MaterialKind,
  shape: ShapeDef,
): void {
  p.rectMode(p.CENTER);
  p.stroke(PALETTE.outline);
  p.strokeWeight(OUTLINE_WEIGHT);
  LOOKS[material](p, shape);
}

// Cracks first appear and then spread as the hp drops.
export function drawDamage(p: p5, shape: ShapeDef, state: DamageState): void {
  if (state === DAMAGE_STATE.intact) return;
  const { width, height } = boundsOf(shape);
  p.noFill();
  p.stroke(PALETTE.crack);
  p.strokeWeight(CRACK_WEIGHT);
  for (const crack of CRACKS[state]) {
    p.beginShape();
    for (const [x, y] of crack) p.vertex((x * width) / 2, (y * height) / 2);
    p.endShape();
  }
}

export function drawFlash(p: p5, shape: ShapeDef): void {
  const flash = p.color(PALETTE.flash);
  flash.setAlpha(FLASH_ALPHA);
  p.noStroke();
  p.fill(flash);
  drawSilhouette(p, shape);
}

const LOOKS: Record<MaterialKind, (p: p5, shape: ShapeDef) => void> = {
  glass: drawGlass,
  wood: drawWood,
  castIron: drawCastIron,
};

function drawGlass(p: p5, shape: ShapeDef): void {
  const fill = p.color(PALETTE.glass.fill);
  fill.setAlpha(GLASS_ALPHA);
  p.fill(fill);
  drawSilhouette(p, shape);

  // One shine line along the long side.
  const { width, height } = boundsOf(shape);
  p.stroke(PALETTE.glass.shine);
  p.strokeWeight(2);
  if (height >= width) p.line(-width / 4, -height / 3, -width / 4, height / 4);
  else p.line(-width / 3, -height / 4, width / 4, -height / 4);
}

function drawWood(p: p5, shape: ShapeDef): void {
  p.fill(PALETTE.wood.fill);
  drawSilhouette(p, shape);

  // Grain runs along the board's long axis.
  const { width, height } = boundsOf(shape);
  p.stroke(PALETTE.wood.grain);
  p.strokeWeight(1);
  if (width >= height) {
    for (
      let y = -height / 2 + GRAIN_SPACING;
      y < height / 2;
      y += GRAIN_SPACING
    )
      p.line(-width / 2 + 4, y, width / 2 - 4, y);
  } else {
    for (let x = -width / 2 + GRAIN_SPACING; x < width / 2; x += GRAIN_SPACING)
      p.line(x, -height / 2 + 4, x, height / 2 - 4);
  }
}

function drawCastIron(p: p5, shape: ShapeDef): void {
  p.fill(PALETTE.castIron.fill);
  drawSilhouette(p, shape);

  // A cold rim just inside the outline makes the metal read as heavy.
  p.noFill();
  p.stroke(PALETTE.castIron.rim);
  p.strokeWeight(2);
  const { width, height } = boundsOf(shape);
  if (shape.type === "circle") p.circle(0, 0, width - RIM_INSET * 2);
  else
    p.rect(0, 0, width - RIM_INSET * 2, height - RIM_INSET * 2, CORNER_RADIUS);
}

export function drawSilhouette(p: p5, shape: ShapeDef): void {
  if (shape.type === "circle") p.circle(0, 0, shape.radius * 2);
  else p.rect(0, 0, shape.width, shape.height, CORNER_RADIUS);
}

export function boundsOf(shape: ShapeDef): { width: number; height: number } {
  if (shape.type === "circle")
    return { width: shape.radius * 2, height: shape.radius * 2 };
  return { width: shape.width, height: shape.height };
}
