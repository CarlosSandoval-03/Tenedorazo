import type p5 from "p5";
import { CANVAS_WIDTH, ENDING_LINE_FRAMES, PALETTE } from "../config";
import { clamp } from "../core/math";
import type { Scene } from "../core/Scene";
import { t, type MessagePath } from "../i18n";
import { drawBackdrop } from "../ui/backdrops";
import { drawWrapped } from "../ui/text";
import type { GameContext } from "./GameContext";
import { TitleScene } from "./TitleScene";

const TEXT_WIDTH = 760;
const TEXT_SIZE = 30;
const FADE_FRAMES = 30;

// Each page fades in, holds, and fades out; a click or Enter skips to the next.
const PAGES: readonly (readonly MessagePath[])[] = [
  ["ending.line1"],
  ["ending.line2"],
  ["ending.line3"],
  ["ending.note", "ending.signature"],
  [
    "title.name",
    "ending.creditsPhysics",
    "ending.creditsFont",
    "ending.thanks",
  ],
];
const LINE_GAP = 56;

// After the Queen falls the first time: the Cook's return, the closing lines, the credits, then
// back to the Title.
export class EndingScene implements Scene {
  private readonly context: GameContext;
  private page = 0;
  private ticks = 0;

  constructor(context: GameContext) {
    this.context = context;
  }

  enter(): void {}

  update(): void {
    const { input } = this.context;
    this.ticks++;
    const wantsNext =
      input.wasReleased("pointer") || input.wasPressed("confirm");
    if (wantsNext || this.ticks >= ENDING_LINE_FRAMES) this.nextPage();
  }

  draw(p: p5): void {
    const lines = PAGES[this.page] ?? [];
    drawBackdrop(p, "counter");
    const fade =
      Math.min(this.ticks, ENDING_LINE_FRAMES - this.ticks) / FADE_FRAMES;
    const color = p.color(PALETTE.ui.text);
    color.setAlpha(255 * clamp(fade, 0, 1));
    p.noStroke();
    p.fill(color);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TEXT_SIZE);
    const top = 270 - ((lines.length - 1) * LINE_GAP) / 2;
    lines.forEach((path, i) =>
      drawWrapped(
        p,
        t(path),
        { x: CANVAS_WIDTH / 2, y: top + i * LINE_GAP },
        TEXT_WIDTH,
      ),
    );
  }

  exit(): void {}

  private nextPage(): void {
    this.page++;
    this.ticks = 0;
    if (this.page >= PAGES.length)
      this.context.scenes.change(new TitleScene(this.context));
  }
}
