import type p5 from "p5";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "../config";
import type { Scene } from "../core/Scene";
import { drawIngredientLook } from "../entities/ingredientLooks";
import { LANGUAGES, language, setLanguage, t } from "../i18n";
import { INGREDIENT_KINDS } from "../types";
import { drawKitchen } from "../ui/Kitchen";
import { Menu } from "../ui/Menu";
import type { GameContext } from "./GameContext";
import { LevelSelectScene } from "./LevelSelectScene";

const TITLE_Y = 150;
const TITLE_SIZE = 72;
const TAGLINE_SIZE = 26;
const BUTTON_WIDTH = 280;
const BUTTON_HEIGHT = 56;
const COUNTER_TOP = CANVAS_HEIGHT - 64;
const PANTRY_SPACING = 70;

// The title over the dark kitchen, the pantry lined up on the counter; Play and Language.
export class TitleScene implements Scene {
  private readonly context: GameContext;
  private readonly menu: Menu;

  constructor(context: GameContext) {
    this.context = context;
    const button = (y: number, label: () => string, onPress: () => void) => ({
      label,
      onPress,
      center: { x: CANVAS_WIDTH / 2, y },
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    });
    this.menu = new Menu([
      button(
        280,
        () => t("title.play"),
        () => this.play(),
      ),
      button(
        352,
        () => t("title.language"),
        () => switchLanguage(),
      ),
    ]);
  }

  enter(): void {}

  update(): void {
    this.menu.update(this.context.input);
  }

  draw(p: p5): void {
    drawKitchen(p);
    drawCounter(p);
    drawPantry(p);

    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(PALETTE.ui.gold);
    p.textSize(TITLE_SIZE);
    p.text(t("title.name"), CANVAS_WIDTH / 2, TITLE_Y);
    p.fill(PALETTE.ui.text);
    p.textSize(TAGLINE_SIZE);
    p.text(t("title.tagline"), CANVAS_WIDTH / 2, TITLE_Y + 60);
    this.menu.draw(p);
  }

  exit(): void {}

  private play(): void {
    this.context.scenes.change(new LevelSelectScene(this.context));
  }
}

function switchLanguage(): void {
  const next = (LANGUAGES.indexOf(language()) + 1) % LANGUAGES.length;
  setLanguage(LANGUAGES[next]);
}

function drawCounter(p: p5): void {
  p.noStroke();
  p.rectMode(p.CORNER);
  p.fill(PALETTE.counter.body);
  p.rect(0, COUNTER_TOP, CANVAS_WIDTH, CANVAS_HEIGHT - COUNTER_TOP);
  p.fill(PALETTE.counter.top);
  p.rect(0, COUNTER_TOP, CANVAS_WIDTH, 8);
}

// The five ingredients, standing on the counter in unlock order.
function drawPantry(p: p5): void {
  const left =
    CANVAS_WIDTH / 2 - (PANTRY_SPACING * (INGREDIENT_KINDS.length - 1)) / 2;
  INGREDIENT_KINDS.forEach((kind, i) => {
    p.push();
    p.translate(left + i * PANTRY_SPACING, COUNTER_TOP - 22);
    p.scale(1.2);
    drawIngredientLook(p, kind);
    p.pop();
  });
}
