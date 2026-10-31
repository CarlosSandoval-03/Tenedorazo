import type p5 from "p5";
import { CANVAS_WIDTH, HAT_REVEAL_FRAMES, PALETTE } from "../config";
import type { Scene } from "../core/Scene";
import { t } from "../i18n";
import { LEVELS } from "../levels";
import type { LevelProgress } from "../state";
import type { LevelDef } from "../types";
import { drawHatRow } from "../ui/Hat";
import { drawKitchen } from "../ui/Kitchen";
import { Menu, type ButtonSpec } from "../ui/Menu";
import { EndingScene } from "./EndingScene";
import type { GameContext } from "./GameContext";
import { GameScene } from "./GameScene";
import { LevelSelectScene } from "./LevelSelectScene";

const TITLE_Y = 110;
const TITLE_SIZE = 52;
const SCORE_Y = 190;
const SCORE_SIZE = 30;
const BEST_SIZE = 20;
const HATS_Y = 290;
const HAT_SIZE = 56;
const BUTTON_Y = 440;
const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 24;

export interface LevelResult {
  level: LevelDef;
  isWon: boolean;
  score: number;
  hats: number;
  best: LevelProgress | undefined;
  isFirstWin: boolean;
}

// Cleared or out of ingredients, the score, the hats one by one; Retry, Next (if won), Levels.
export class ResultScene implements Scene {
  private readonly context: GameContext;
  private readonly result: LevelResult;
  private readonly menu: Menu;
  private ticks = 0;

  constructor(context: GameContext, result: LevelResult) {
    this.context = context;
    this.result = result;
    this.menu = new Menu(this.buttons());
  }

  enter(): void {}

  update(): void {
    this.ticks++;
    this.menu.update(this.context.input);
  }

  draw(p: p5): void {
    const { isWon, score, best } = this.result;
    drawKitchen(p);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(isWon ? PALETTE.ui.gold : PALETTE.ui.text);
    p.textSize(TITLE_SIZE);
    p.text(t(isWon ? "result.won" : "result.lost"), CANVAS_WIDTH / 2, TITLE_Y);

    p.fill(PALETTE.ui.text);
    p.textSize(SCORE_SIZE);
    p.text(t("result.score", { score }), CANVAS_WIDTH / 2, SCORE_Y);
    if (best) {
      p.fill(PALETTE.ui.dim);
      p.textSize(BEST_SIZE);
      p.text(
        t("result.best", { score: best.bestScore }),
        CANVAS_WIDTH / 2,
        SCORE_Y + 36,
      );
    }
    const revealed = Math.min(
      this.result.hats,
      Math.floor(this.ticks / HAT_REVEAL_FRAMES),
    );
    drawHatRow(p, { x: CANVAS_WIDTH / 2, y: HATS_Y }, HAT_SIZE, revealed);
    this.menu.draw(p);
  }

  exit(): void {}

  // Next leads to the following level, or to the Ending after the last level's first win.
  private buttons(): ButtonSpec[] {
    const { context, result } = this;
    // By id: the level may be a copy, such as one with a debug queue.
    const index = LEVELS.findIndex(({ id }) => id === result.level.id);
    const next = LEVELS[index + 1];
    const isLast = index === LEVELS.length - 1;
    const actions: { label: () => string; onPress: () => void }[] = [
      {
        label: () => t("result.retry"),
        onPress: () =>
          context.scenes.change(new GameScene(context, result.level)),
      },
    ];
    if (result.isWon && next)
      actions.push({
        label: () => t("result.next"),
        onPress: () => context.scenes.change(new GameScene(context, next)),
      });
    if (result.isFirstWin && isLast)
      actions.push({
        label: () => t("result.next"),
        onPress: () => context.scenes.change(new EndingScene(context)),
      });
    actions.push({
      label: () => t("result.levels"),
      onPress: () => context.scenes.change(new LevelSelectScene(context)),
    });

    const rowWidth =
      actions.length * BUTTON_WIDTH + (actions.length - 1) * BUTTON_GAP;
    const left = (CANVAS_WIDTH - rowWidth) / 2 + BUTTON_WIDTH / 2;
    return actions.map((action, i) => ({
      ...action,
      center: { x: left + i * (BUTTON_WIDTH + BUTTON_GAP), y: BUTTON_Y },
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    }));
  }
}
