import type p5 from "p5";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE, type Action } from "../config";
import type { Input } from "../core/Input";
import { t } from "../i18n";
import { Menu } from "./Menu";

const OVERLAY_ALPHA = 170;
const TITLE_SIZE = 44;
const BUTTON_WIDTH = 240;
const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 72;

export interface PauseActions {
  resume: () => void;
  restart: () => void;
  levels: () => void;
}

// The pause overlay: Resume, Restart, Levels.
export class PauseMenu {
  private readonly menu: Menu;

  constructor(actions: PauseActions) {
    const centerX = CANVAS_WIDTH / 2;
    const firstY = CANVAS_HEIGHT / 2 - BUTTON_GAP / 2;
    const button = (i: number, label: () => string, onPress: () => void) => ({
      label,
      onPress,
      center: { x: centerX, y: firstY + i * BUTTON_GAP },
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    });
    this.menu = new Menu([
      button(0, () => t("pause.resume"), actions.resume),
      button(1, () => t("pause.restart"), actions.restart),
      button(2, () => t("pause.levels"), actions.levels),
    ]);
  }

  update(input: Input<Action>): void {
    this.menu.update(input);
  }

  draw(p: p5): void {
    const overlay = p.color(PALETTE.ui.panel);
    overlay.setAlpha(OVERLAY_ALPHA);
    p.noStroke();
    p.fill(overlay);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.fill(PALETTE.ui.text);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TITLE_SIZE);
    p.text(
      t("pause.title"),
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 - BUTTON_GAP * 1.8,
    );
    this.menu.draw(p);
  }
}
