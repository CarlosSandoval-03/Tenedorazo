import type p5 from "p5";
import { FLOOR_SCREEN_Y } from "../config";
import { scale, sub, type Vec } from "../core/math";
import { LEVELS } from "../levels";
import type { BodyHandle } from "../physics/World";
import type { GameContext } from "../scenes/GameContext";
import { GameScene } from "../scenes/GameScene";
import { INGREDIENT_KINDS } from "../types";
import { drawImpacts, drawOutlines, drawPanel } from "./debugDraw";
import { levelAsBuilt } from "./levelAsBuilt";

// The velocity a drag gives the pushed body, per px dragged (1/s).
const PUSH_SCALE = 6;
const SLOW_SPEED = 0.25;

interface Push {
  body: BodyHandle;
  from: Vec;
}

// Dev-only tools. They reach the game scene through its fields and World's public API, and the
// fixed tick through the scene manager's speed.
export class DebugTools {
  private readonly context: GameContext;
  private readonly heldKeys = new Set<string>();
  private showOutlines = false;
  private showImpacts = false;
  private isSlow = false;
  private isPaused = false;
  private hasInfiniteIngredients = false;
  private push: Push | null = null;

  constructor(context: GameContext, canvas: EventTarget) {
    this.context = context;
    this.applyUrl();
    window.addEventListener("keydown", (event) => this.onKeyDown(event.code));
    window.addEventListener("keyup", (event) =>
      this.heldKeys.delete(event.code),
    );
    canvas.addEventListener("pointerdown", () => this.startPush());
    window.addEventListener("pointerup", () => this.endPush());
  }

  // Before the frame's ticks: keeps the queue full while ingredients are infinite.
  update(): void {
    const scene = this.gameScene();
    if (!scene || !this.hasInfiniteIngredients || scene.queue.length > 0)
      return;
    scene.addToQueue(scene.level.ingredients);
  }

  draw(p: p5): void {
    const scene = this.gameScene();
    if (!scene) return;
    p.push();
    p.translate(0, FLOOR_SCREEN_Y);
    if (this.showOutlines) drawOutlines(p, scene);
    if (this.showImpacts) drawImpacts(p, scene);
    p.pop();
    drawPanel(p, scene, this.flags());
  }

  // &reset=debug erases the sandbox, &unlock=all opens every level in it, &level=3-1 opens that
  // level directly, and &ingredients=popcorn,cheese replaces its queue.
  private applyUrl(): void {
    const params = new URLSearchParams(location.search);
    const { progress } = this.context;
    if (params.get("reset") === "debug") progress.clear();
    if (params.get("unlock") === "all")
      for (const level of LEVELS)
        if (!progress.of(level.id)) progress.recordWin(level.id, 0, 1);

    const level = LEVELS.find(({ id }) => id === params.get("level"));
    if (!level) return;
    const ingredients = params
      .get("ingredients")
      ?.split(",")
      .flatMap((name) => INGREDIENT_KINDS.filter((kind) => kind === name));
    const queue = ingredients?.length ? ingredients : level.ingredients;
    this.context.scenes.change(
      new GameScene(this.context, { ...level, ingredients: queue }),
    );
  }

  private onKeyDown(code: string): void {
    this.heldKeys.add(code);
    const action = this.keyActions()[code];
    action?.();
  }

  private keyActions(): Record<string, () => void> {
    return {
      Digit1: () => (this.showOutlines = !this.showOutlines),
      Digit2: () => (this.showImpacts = !this.showImpacts),
      Digit3: () => this.togglePause(),
      Digit4: () => this.stepOnce(),
      Digit5: () => this.toggleSlow(),
      Digit6: () =>
        (this.hasInfiniteIngredients = !this.hasInfiniteIngredients),
      Digit7: () => this.removeRoaches(),
      Digit9: () => this.copyLevel(),
    };
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.applySpeed();
  }

  private stepOnce(): void {
    if (this.isPaused) this.context.scenes.tick();
  }

  private toggleSlow(): void {
    this.isSlow = !this.isSlow;
    this.applySpeed();
  }

  private applySpeed(): void {
    const speed = this.isSlow ? SLOW_SPEED : 1;
    this.context.scenes.setSpeed(this.isPaused ? 0 : speed);
  }

  private removeRoaches(): void {
    for (const roach of this.gameScene()?.roaches ?? []) roach.destroy();
  }

  private copyLevel(): void {
    const scene = this.gameScene();
    if (!scene) return;
    const json = JSON.stringify(levelAsBuilt(scene), null, 2);
    navigator.clipboard
      .writeText(json)
      .then(() => console.info(`Copied level ${scene.level.id} as built`))
      .catch(() => console.info(json));
  }

  private startPush(): void {
    const scene = this.gameScene();
    if (!scene || !this.heldKeys.has("Digit8")) return;
    const from = this.levelPointer();
    const body = scene.world.bodyAt(from);
    if (body) this.push = { body, from };
  }

  // The drag from the press to the release becomes the body's push.
  private endPush(): void {
    const scene = this.gameScene();
    const push = this.push;
    this.push = null;
    if (!scene || !push || !scene.world.has(push.body)) return;
    const drag = sub(this.levelPointer(), push.from);
    scene.world.addVelocity(push.body, scale(drag, PUSH_SCALE));
  }

  private flags(): string {
    const on: string[] = [];
    if (this.isPaused) on.push("paused");
    if (this.isSlow) on.push("slow");
    if (this.hasInfiniteIngredients) on.push("infinite");
    return on.join(" ");
  }

  private levelPointer(): Vec {
    return sub(this.context.input.pointer, { x: 0, y: FLOOR_SCREEN_Y });
  }

  private gameScene(): GameScene | undefined {
    const scene = this.context.scenes.current;
    return scene instanceof GameScene ? scene : undefined;
  }
}
