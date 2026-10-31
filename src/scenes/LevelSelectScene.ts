import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE } from "../config";
import type { Scene } from "../core/Scene";
import { t } from "../i18n";
import { LEVELS } from "../levels";
import { placeOf, type Place } from "../levels/places";
import type { LevelDef } from "../types";
import { drawHatRow } from "../ui/Hat";
import { drawBackdrop } from "../ui/backdrops";
import { Menu, rowCenters, type ButtonSpec } from "../ui/Menu";
import type { GameContext } from "./GameContext";
import { GameScene } from "./GameScene";
import { PlaceSelectScene } from "./PlaceSelectScene";

const TITLE_Y = 90;
const TITLE_SIZE = 48;
const CARD_WIDTH = 168;
const CARD_HEIGHT = 150;
const CARD_GAP = 24;
const CARD_Y = 280;
const HAT_SIZE = 20;
const BACK_CENTER = { x: 110, y: 470 };

// The levels of one place, with their hats; locked ones dimmed.
export class LevelSelectScene implements Scene {
  private readonly context: GameContext;
  private readonly place: Place;
  private readonly menu: Menu;

  constructor(context: GameContext, place: Place) {
    this.context = context;
    this.place = place;
    const levels = LEVELS.filter((level) => placeOf(level.id) === place);
    const centers = rowCenters(levels.length, {
      width: CARD_WIDTH,
      gap: CARD_GAP,
      y: CARD_Y,
    });
    this.menu = new Menu([
      ...levels.map((level, i) => this.levelCard(level, centers[i])),
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
    drawBackdrop(p, this.place);
    p.noStroke();
    p.fill(PALETTE.ui.text);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TITLE_SIZE);
    p.text(t(`places.${this.place}`), CANVAS_WIDTH / 2, TITLE_Y);
    this.menu.draw(p);
  }

  exit(): void {}

  private levelCard(
    level: LevelDef,
    center: { x: number; y: number },
  ): ButtonSpec {
    const { progress } = this.context;
    const index = LEVELS.indexOf(level);
    return {
      label: () => level.id,
      onPress: () =>
        this.context.scenes.change(new GameScene(this.context, level)),
      center,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      isEnabled: progress.isUnlocked(
        index,
        LEVELS.map(({ id }) => id),
      ),
      drawContent: (p, cardCenter) =>
        drawHatRow(
          p,
          { x: cardCenter.x, y: cardCenter.y + 30 },
          HAT_SIZE,
          progress.of(level.id)?.hats ?? 0,
        ),
    };
  }

  private back(): void {
    this.context.scenes.change(new PlaceSelectScene(this.context));
  }
}
