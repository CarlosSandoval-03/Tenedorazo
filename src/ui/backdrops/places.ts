import type p5 from "p5";
import { CANVAS_WIDTH, FLOOR_SCREEN_Y } from "../../config";
import type { Place } from "../../levels/places";

export interface BackdropColors {
  readonly wall: string;
  readonly grout: string;
  readonly shape: string;
  readonly near: string;
  readonly accent: string;
  readonly glow: string;
}

type Layer = (p: p5, colors: BackdropColors, offset: number) => void;

// Each place's far and near furniture, drawn in screen px and shifted left by `offset`. The
// coordinates in these functions are the illustrations themselves, so they stay inline.
export const PLACE_LAYERS: Record<Place, { far: Layer; near: Layer }> = {
  counter: { far: drawCounterWindow, near: drawCabinets },
  sink: { far: drawBlindsWindow, near: drawTapAndRack },
  stove: { far: drawRangeHood, near: drawPotsAndFlame },
  fridge: { far: drawFridgeShelves, near: drawBottles },
  pantry: { far: drawPantryShelves, near: drawJars },
};

const GLOW_RINGS = 6;
const GLOW_ALPHA = 10;

// Calls draw at every x = k × period + start that can show on screen, so a layer never ends.
function repeatAcross(
  period: number,
  start: number,
  offset: number,
  draw: (x: number) => void,
): void {
  const first = Math.floor((offset - start - period) / period);
  for (let k = first; ; k++) {
    const x = start + k * period - offset;
    if (x > CANVAS_WIDTH + period) return;
    draw(x);
  }
}

// A soft light: rings of low alpha, widest first.
function drawGlow(
  p: p5,
  color: string,
  x: number,
  y: number,
  size: number,
): void {
  const fill = p.color(color);
  fill.setAlpha(GLOW_ALPHA);
  p.noStroke();
  p.fill(fill);
  for (let i = GLOW_RINGS; i > 0; i--) p.circle(x, y, (size * i) / GLOW_RINGS);
}

function drawCounterWindow(
  p: p5,
  colors: BackdropColors,
  offset: number,
): void {
  repeatAcross(960, 620, offset, (x) => {
    p.noStroke();
    p.fill(colors.accent);
    p.rect(x, 70, 200, 150, 6);
    drawGlow(p, colors.glow, x + 150, 110, 70);
    p.fill(colors.glow);
    p.circle(x + 150, 110, 18);
    // The frame and its cross.
    p.noFill();
    p.stroke(colors.shape);
    p.strokeWeight(10);
    p.rect(x, 70, 200, 150, 6);
    p.line(x + 100, 70, x + 100, 220);
    p.line(x, 145, x + 200, 145);
  });
  repeatAcross(960, 180, offset, (x) => {
    p.stroke(colors.shape);
    p.strokeWeight(4);
    p.line(x - 60, 96, x + 120, 96);
    // A ladle and a whisk hang from the rail.
    p.line(x, 96, x, 190);
    p.noStroke();
    p.fill(colors.shape);
    p.arc(x, 190, 40, 36, 0, p.PI, p.CHORD);
    p.noFill();
    p.stroke(colors.shape);
    p.strokeWeight(3);
    p.line(x + 70, 96, x + 70, 140);
    p.ellipse(x + 70, 170, 26, 60);
  });
}

function drawCabinets(p: p5, colors: BackdropColors, offset: number): void {
  repeatAcross(330, 0, offset, (x) => {
    p.noStroke();
    p.fill(colors.near);
    p.rect(x, -8, 300, 64, 6);
    p.stroke(colors.wall);
    p.strokeWeight(3);
    p.line(x + 150, 0, x + 150, 56);
    p.noStroke();
    p.fill(colors.wall);
    p.circle(x + 136, 42, 7);
    p.circle(x + 164, 42, 7);
  });
}

function drawBlindsWindow(p: p5, colors: BackdropColors, offset: number): void {
  repeatAcross(1000, 520, offset, (x) => {
    p.noStroke();
    p.fill(colors.accent);
    p.rect(x, 60, 240, 170, 6);
    drawGlow(p, colors.glow, x + 120, 120, 120);
    p.stroke(colors.shape);
    p.strokeWeight(5);
    for (let y = 72; y < 160; y += 14) p.line(x + 6, y, x + 234, y);
    p.noFill();
    p.strokeWeight(10);
    p.rect(x, 60, 240, 170, 6);
  });
}

function drawTapAndRack(p: p5, colors: BackdropColors, offset: number): void {
  repeatAcross(1200, 300, offset, (x) => {
    // A gooseneck tap rising behind the counter.
    p.noFill();
    p.stroke(colors.near);
    p.strokeWeight(14);
    p.line(x, FLOOR_SCREEN_Y, x, 330);
    p.arc(x + 40, 330, 80, 80, p.PI, p.TWO_PI);
    p.line(x + 80, 330, x + 80, 360);
  });
  repeatAcross(1200, 760, offset, (x) => {
    // The dish rack: a row of upright wires.
    p.stroke(colors.near);
    p.strokeWeight(4);
    for (let i = 0; i <= 8; i++)
      p.line(x + i * 20, 400, x + i * 20, FLOOR_SCREEN_Y);
    p.line(x, 440, x + 160, 440);
  });
}

function drawRangeHood(p: p5, colors: BackdropColors, offset: number): void {
  repeatAcross(1100, 520, offset, (x) => {
    p.noStroke();
    p.fill(colors.shape);
    p.quad(x + 70, 0, x + 230, 0, x + 300, 120, x, 120);
    p.fill(colors.accent);
    p.rect(x + 10, 120, 280, 14, 4);
    drawGlow(p, colors.accent, x + 150, 140, 160);
  });
}

function drawPotsAndFlame(p: p5, colors: BackdropColors, offset: number): void {
  repeatAcross(720, 220, offset, (x) => {
    p.stroke(colors.near);
    p.strokeWeight(4);
    p.line(x - 40, 120, x + 160, 120);
    p.noStroke();
    p.fill(colors.near);
    for (const [dx, size] of [
      [0, 56],
      [110, 44],
    ] as const) {
      p.rect(x + dx - 3, 120, 6, 30);
      p.circle(x + dx, 150 + size / 2, size);
    }
  });
  repeatAcross(1100, 840, offset, (x) => {
    // A pilot flame, the one blue light in the room.
    drawGlow(p, colors.glow, x, FLOOR_SCREEN_Y - 10, 120);
    p.noStroke();
    p.fill(colors.glow);
    p.ellipse(x, FLOOR_SCREEN_Y - 12, 10, 20);
  });
}

function drawFridgeShelves(
  p: p5,
  colors: BackdropColors,
  offset: number,
): void {
  repeatAcross(1400, 480, offset, (x) => drawGlow(p, colors.glow, x, 0, 520));
  p.stroke(colors.shape);
  p.strokeWeight(8);
  for (const y of [170, 320]) p.line(0, y, CANVAS_WIDTH, y);
}

function drawBottles(p: p5, colors: BackdropColors, offset: number): void {
  p.noStroke();
  p.fill(colors.near);
  repeatAcross(260, 40, offset, (x) => {
    p.rect(x, 316 - 90, 34, 90, 8);
    p.rect(x + 11, 316 - 112, 12, 26, 3);
    for (let i = 0; i < 3; i++) p.ellipse(x + 80 + i * 26, 316 - 14, 22, 28);
  });
  repeatAcross(330, 160, offset, (x) => {
    p.rect(x, 166 - 54, 60, 54, 10);
    p.rect(x + 4, 166 - 64, 52, 12, 4);
  });
}

function drawPantryShelves(
  p: p5,
  colors: BackdropColors,
  offset: number,
): void {
  repeatAcross(480, 0, offset, (x) => {
    p.noStroke();
    p.fill(colors.shape);
    p.rect(x, 0, 16, FLOOR_SCREEN_Y);
  });
  p.noStroke();
  p.fill(colors.accent);
  for (const y of [150, 300]) p.rect(0, y, CANVAS_WIDTH, 14);
  repeatAcross(1300, 480, offset, (x) => {
    p.stroke(colors.shape);
    p.strokeWeight(2);
    p.line(x, 0, x, 40);
    drawGlow(p, colors.glow, x, 50, 260);
    p.noStroke();
    p.fill(colors.glow);
    p.arc(x, 50, 36, 26, p.PI, p.TWO_PI, p.CHORD);
  });
}

function drawJars(p: p5, colors: BackdropColors, offset: number): void {
  p.noStroke();
  p.fill(colors.near);
  for (const [shelfY, start] of [
    [150, 60],
    [300, 170],
  ] as const) {
    repeatAcross(230, start, offset, (x) => {
      p.rect(x, shelfY - 62, 44, 62, 10);
      p.rect(x + 4, shelfY - 72, 36, 12, 3);
      p.rect(x + 70, shelfY - 48, 34, 48, 3);
      p.rect(x + 120, shelfY - 40, 60, 40, 16);
    });
  }
}
