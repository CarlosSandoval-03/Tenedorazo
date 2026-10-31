import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE } from "../config";
import type { Scene } from "../core/Scene";
import { t } from "../i18n";
import { LEVELS } from "../levels";
import { placeOf } from "../levels/places";
import type { LevelDef } from "../types";
import { drawHatRow } from "../ui/Hat";
import { drawKitchen } from "../ui/Kitchen";
import { Menu, type ButtonSpec } from "../ui/Menu";
import type { GameContext } from "./GameContext";
import { GameScene } from "./GameScene";
import { TitleScene } from "./TitleScene";

const TITLE_Y = 90;
const TITLE_SIZE = 48;
const CARD_WIDTH = 168;
const CARD_HEIGHT = 150;
const CARD_GAP = 16;
const CARD_Y = 280;
const HAT_SIZE = 20;
const BACK_CENTER = { x: 110, y: 470 };

// The five levels, one per place, with their hats; locked ones dimmed.
export class LevelSelectScene implements Scene {
  private readonly context: GameContext;
  private readonly menu: Menu;

  constructor(context: GameContext) {
    this.context = context;
    this.menu = new Menu([
      ...LEVELS.map((level, i) => this.levelCard(level, i)),
      {
        label: () => t("levelSelect.back"),
        onPress: () => this.back(),
        center: BACK_CENTER,
        width: 160,
        height: 52,
      },
    ]);
  }

  enter(): void {}

  update(): void {
    if (this.context.input.wasPressed("back")) return this.back();
    this.menu.update(this.context.input);
  }

  draw(p: p5): void {
    drawKitchen(p);
    p.noStroke();
    p.fill(PALETTE.ui.text);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TITLE_SIZE);
    p.text(t("levelSelect.title"), CANVAS_WIDTH / 2, TITLE_Y);
    this.menu.draw(p);
  }

  exit(): void {}

  private levelCard(level: LevelDef, index: number): ButtonSpec {
    const { progress } = this.context;
    const rowWidth =
      LEVELS.length * CARD_WIDTH + (LEVELS.length - 1) * CARD_GAP;
    const left = (CANVAS_WIDTH - rowWidth) / 2 + CARD_WIDTH / 2;
    return {
      label: () => t(`places.${placeOf(level.id)}`),
      onPress: () =>
        this.context.scenes.change(new GameScene(this.context, level)),
      center: { x: left + index * (CARD_WIDTH + CARD_GAP), y: CARD_Y },
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      isEnabled: progress.isUnlocked(
        index,
        LEVELS.map(({ id }) => id),
      ),
      drawContent: (p, center) => {
        p.fill(PALETTE.ui.dim);
        p.textSize(20);
        p.text(level.id, center.x, center.y + 4);
        drawHatRow(
          p,
          { x: center.x, y: center.y + 44 },
          HAT_SIZE,
          progress.of(level.id)?.hats ?? 0,
        );
      },
    };
  }

  private back(): void {
    this.context.scenes.change(new TitleScene(this.context));
  }
}
