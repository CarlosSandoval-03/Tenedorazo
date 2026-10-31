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
const JELLY_ALPHA = 200;
const JELLY_CORNER_RADIUS = 10;
const VALVE_WIDTH = 10;
const VALVE_HEIGHT = 12;
const FLASH_ALPHA = 200;
const HIGHLIGHT_ALPHA = 70;
const HIGHLIGHT_INSET = 3;
const SHADE_ALPHA = 60;
const END_CAP = 3;
const RIVET_SIZE = 4;

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
  jelly: drawJelly,
  pressureCooker: drawPressureCooker,
};

function drawGlass(p: p5, shape: ShapeDef): void {
  const fill = p.color(PALETTE.glass.fill);
  fill.setAlpha(GLASS_ALPHA);
  p.fill(fill);
  drawSilhouette(p, shape);

  // The lip at each short end, and one shine line along the long side.
  const { width, height } = boundsOf(shape);
  const isUpright = height >= width;
  p.stroke(PALETTE.glass.shine);
  p.strokeWeight(2);
  if (isUpright) {
    p.line(-width / 2 + 3, -height / 2 + 4, width / 2 - 3, -height / 2 + 4);
    p.line(-width / 4, -height / 3, -width / 4, height / 4);
  } else {
    p.line(-width / 2 + 4, -height / 2 + 3, -width / 2 + 4, height / 2 - 3);
    p.line(-width / 3, -height / 4, width / 4, -height / 4);
  }
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
  drawWoodEnds(p, width, height);
  drawHighlight(p, shape);
}

// The cut ends show darker end grain, and the long side a knot.
function drawWoodEnds(p: p5, width: number, height: number): void {
  p.noStroke();
  p.fill(PALETTE.wood.grain);
  if (width >= height) {
    p.rect(-width / 2 + END_CAP, 0, END_CAP, height - 4);
    p.rect(width / 2 - END_CAP, 0, END_CAP, height - 4);
    p.ellipse(width / 5, 0, Math.min(10, width / 6), height / 3);
  } else {
    p.rect(0, -height / 2 + END_CAP, width - 4, END_CAP);
    p.rect(0, height / 2 - END_CAP, width - 4, END_CAP);
    p.ellipse(0, height / 5, width / 3, Math.min(10, height / 6));
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
  if (shape.type === "box") drawRivets(p, width, height);
  drawHighlight(p, shape);
}

function drawRivets(p: p5, width: number, height: number): void {
  p.noStroke();
  p.fill(PALETTE.castIron.rim);
  const x = width / 2 - RIM_INSET * 2;
  const y = height / 2 - RIM_INSET * 2;
  for (const [dx, dy] of [
    [-x, -y],
    [x, -y],
    [-x, y],
    [x, y],
  ])
    p.circle(dx, dy, RIVET_SIZE);
}

function drawJelly(p: p5, shape: ShapeDef): void {
  const fill = p.color(PALETTE.jelly.fill);
  fill.setAlpha(JELLY_ALPHA);
  p.fill(fill);
  const { width, height } = boundsOf(shape);
  if (shape.type === "circle") p.circle(0, 0, width);
  else p.rect(0, 0, width, height, JELLY_CORNER_RADIUS);

  // A soft shine in the top left corner, and the deeper color pooling at the bottom.
  p.noStroke();
  p.fill(PALETTE.jelly.shine);
  p.ellipse(-width / 4, -height / 4, width / 4, height / 6);
  const shade = p.color(PALETTE.outline);
  shade.setAlpha(SHADE_ALPHA);
  p.fill(shade);
  p.rect(0, height / 2 - height / 8, width - 8, height / 4 - 4, 6);
}

function drawPressureCooker(p: p5, shape: ShapeDef): void {
  const { width, height } = boundsOf(shape);
  // The valve sits on top, so it turns with the pot.
  p.fill(PALETTE.steel.valve);
  p.rect(0, -height / 2, VALVE_WIDTH, VALVE_HEIGHT, 2);

  p.fill(PALETTE.steel.fill);
  drawSilhouette(p, shape);
  p.noFill();
  p.stroke(PALETTE.steel.rim);
  p.strokeWeight(2);
  p.line(
    -width / 2 + RIM_INSET,
    -height / 6,
    width / 2 - RIM_INSET,
    -height / 6,
  );
  p.line(-width / 2 + RIM_INSET, height / 6, width / 2 - RIM_INSET, height / 6);
  // The handles on either side of the lid.
  p.noStroke();
  p.fill(PALETTE.outline);
  p.rect(-width / 2 + RIM_INSET + 3, -height / 6, 6, 4, 2);
  p.rect(width / 2 - RIM_INSET - 3, -height / 6, 6, 4, 2);
  drawHighlight(p, shape);
}

// One highlight per shape, along its top edge, as if lit from above.
function drawHighlight(p: p5, shape: ShapeDef): void {
  const light = p.color(PALETTE.flash);
  light.setAlpha(HIGHLIGHT_ALPHA);
  p.noFill();
  p.stroke(light);
  p.strokeWeight(2);
  const { width, height } = boundsOf(shape);
  if (shape.type === "circle") {
    p.arc(
      0,
      0,
      width - HIGHLIGHT_INSET * 2,
      height - HIGHLIGHT_INSET * 2,
      p.PI * 1.1,
      p.PI * 1.6,
    );
    return;
  }
  const y = -height / 2 + HIGHLIGHT_INSET;
  p.line(
    -width / 2 + HIGHLIGHT_INSET + 2,
    y,
    width / 2 - HIGHLIGHT_INSET - 2,
    y,
  );
}

export function drawSilhouette(p: p5, shape: ShapeDef): void {
  if (shape.type === "circle") p.circle(0, 0, shape.radius * 2);
  else p.rect(0, 0, shape.width, shape.height, CORNER_RADIUS);
}

function boundsOf(shape: ShapeDef): { width: number; height: number } {
  if (shape.type === "circle")
    return { width: shape.radius * 2, height: shape.radius * 2 };
  return { width: shape.width, height: shape.height };
}
