import type p5 from "p5";
import {
  CANVAS_WIDTH,
  HAT_REVEAL_FRAMES,
  PALETTE,
  UNUSED_INGREDIENT_BONUS,
} from "../config";
import type { Scene } from "../core/Scene";
import { t } from "../i18n";
import { LEVELS } from "../levels";
import type { LevelProgress } from "../state";
import type { LevelDef } from "../types";
import {
  pointsToNextHat,
  totalScore,
  unusedBonus,
  type ScoreBreakdown,
} from "../systems/Scoring";
import { drawHatRow, HAT_SPACING } from "../ui/Hat";
import { drawBackdrop } from "../ui/backdrops";
import { Menu, rowCenters, type ButtonSpec } from "../ui/Menu";
import { placeOf } from "../levels/places";
import { EndingScene } from "./EndingScene";
import type { GameContext } from "./GameContext";
import { GameScene } from "./GameScene";
import { LevelSelectScene } from "./LevelSelectScene";

const TITLE_Y = 64;
const TITLE_SIZE = 48;
const HATS_Y = 146;
const HAT_SIZE = 48;
const HAT_LABEL_SIZE = 18;
const LINE_SIZE = 20;
const BREAKDOWN_Y = 236;
const LINE_GAP = 28;
const SCORE_SIZE = 30;
const BUTTON_Y = 474;
const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 56;
const BUTTON_GAP = 24;

export interface LevelResult {
  level: LevelDef;
  isWon: boolean;
  breakdown: ScoreBreakdown;
  hats: number;
  best: LevelProgress | undefined;
  isFirstWin: boolean;
}

// Cleared or out of ingredients; the hats one by one, each with what it asks for; where the score
// came from and how far the next hat was. Retry, Next (if won), Levels.
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
    const { isWon } = this.result;
    drawBackdrop(p, placeOf(this.result.level.id));
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(isWon ? PALETTE.ui.gold : PALETTE.ui.text);
    p.textSize(TITLE_SIZE);
    p.text(t(isWon ? "result.won" : "result.lost"), CANVAS_WIDTH / 2, TITLE_Y);

    this.drawHats(p);
    this.drawBreakdown(p);
    this.menu.draw(p);
  }

  // The hats appear one by one; under each, the score it asks for.
  private drawHats(p: p5): void {
    const { hats, level } = this.result;
    const revealed = Math.min(hats, Math.floor(this.ticks / HAT_REVEAL_FRAMES));
    drawHatRow(p, { x: CANVAS_WIDTH / 2, y: HATS_Y }, HAT_SIZE, revealed);

    const requirements = [t("result.hatWin"), ...level.stars.map(String)];
    p.noStroke();
    p.fill(PALETTE.ui.dim);
    p.textSize(HAT_LABEL_SIZE);
    requirements.forEach((requirement, i) => {
      const x = CANVAS_WIDTH / 2 + (i - 1) * HAT_SIZE * HAT_SPACING;
      p.text(requirement, x, HATS_Y + HAT_SIZE * 0.85);
    });
  }

  // The roaches, the fort, and the ingredients left; the total; the best and what was missing.
  private drawBreakdown(p: p5): void {
    const { breakdown, best, isWon, level } = this.result;
    const score = totalScore(breakdown);
    const lines = [
      t("result.roaches", { points: breakdown.roaches }),
      t("result.fort", { points: breakdown.fort }),
    ];
    if (isWon)
      lines.push(
        t("result.leftovers", {
          count: breakdown.ingredientsLeft,
          bonus: UNUSED_INGREDIENT_BONUS,
          points: unusedBonus(breakdown.ingredientsLeft),
        }),
      );

    p.noStroke();
    p.fill(PALETTE.ui.text);
    p.textSize(LINE_SIZE);
    lines.forEach((line, i) =>
      p.text(line, CANVAS_WIDTH / 2, BREAKDOWN_Y + i * LINE_GAP),
    );
    const totalY = BREAKDOWN_Y + lines.length * LINE_GAP + 8;
    p.textSize(SCORE_SIZE);
    p.text(t("result.score", { score }), CANVAS_WIDTH / 2, totalY);

    const notes: string[] = [];
    const missing = pointsToNextHat(score, level.stars);
    if (isWon && missing !== undefined)
      notes.push(t("result.missing", { points: missing }));
    if (best) notes.push(t("result.best", { score: best.bestScore }));
    p.fill(PALETTE.ui.dim);
    p.textSize(LINE_SIZE);
    p.text(notes.join("   ·   "), CANVAS_WIDTH / 2, totalY + 36);
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
      onPress: () =>
        context.scenes.change(
          new LevelSelectScene(context, placeOf(result.level.id)),
        ),
    });

    const centers = rowCenters(actions.length, {
      width: BUTTON_WIDTH,
      gap: BUTTON_GAP,
      y: BUTTON_Y,
    });
    return actions.map((action, i) => ({
      ...action,
      center: centers[i],
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    }));
  }
}
