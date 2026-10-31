import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE } from "../config";
import type { Scene } from "../core/Scene";
import { t } from "../i18n";
import { LEVELS } from "../levels";
import { PLACES, placeOf, type Place } from "../levels/places";
import { drawHat } from "../ui/Hat";
import { drawBackdrop } from "../ui/backdrops";
import { Menu, rowCenters, type ButtonSpec } from "../ui/Menu";
import type { GameContext } from "./GameContext";
import { LevelSelectScene } from "./LevelSelectScene";
import { TitleScene } from "./TitleScene";

const TITLE_Y = 90;
const TITLE_SIZE = 48;
const CARD_WIDTH = 168;
const CARD_HEIGHT = 150;
const CARD_GAP = 16;
const CARD_Y = 280;
const HAT_SIZE = 22;
const COUNT_SIZE = 20;
const BACK_CENTER = { x: 110, y: 470 };

// The five places of the kitchen, each with the hats won of all it holds; a place opens when its
// first level does.
export class PlaceSelectScene implements Scene {
  private readonly context: GameContext;
  private readonly menu: Menu;

  constructor(context: GameContext) {
    this.context = context;
    const centers = rowCenters(PLACES.length, {
      width: CARD_WIDTH,
      gap: CARD_GAP,
      y: CARD_Y,
    });
    this.menu = new Menu([
      ...PLACES.map((place, i) => this.placeCard(place, centers[i])),
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
    drawBackdrop(p, "counter");
    p.noStroke();
    p.fill(PALETTE.ui.text);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TITLE_SIZE);
    p.text(t("levelSelect.title"), CANVAS_WIDTH / 2, TITLE_Y);
    this.menu.draw(p);
  }

  exit(): void {}

  private placeCard(
    place: Place,
    center: { x: number; y: number },
  ): ButtonSpec {
    const { progress } = this.context;
    const ids = LEVELS.map(({ id }) => id);
    const levels = LEVELS.filter(({ id }) => placeOf(id) === place);
    const first = levels[0];
    const hats = levels.reduce(
      (sum, { id }) => sum + (progress.of(id)?.hats ?? 0),
      0,
    );
    return {
      label: () => t(`places.${place}`),
      onPress: () =>
        this.context.scenes.change(new LevelSelectScene(this.context, place)),
      center,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      isEnabled:
        first !== undefined && progress.isUnlocked(ids.indexOf(first.id), ids),
      drawContent: (p, cardCenter) => {
        drawHat(
          p,
          { x: cardCenter.x - 26, y: cardCenter.y + 30 },
          HAT_SIZE,
          hats > 0,
        );
        p.noStroke();
        p.fill(PALETTE.ui.text);
        p.textSize(COUNT_SIZE);
        p.text(
          `${hats}/${levels.length * 3}`,
          cardCenter.x + 16,
          cardCenter.y + 32,
        );
      },
    };
  }

  private back(): void {
    this.context.scenes.change(new TitleScene(this.context));
  }
}
