import type p5 from "p5";
import { FLOOR_SCREEN_Y, type Action } from "../config";
import type { Input } from "../core/Input";
import { scale, sub, type Vec } from "../core/math";
import type { SceneManager } from "../core/SceneManager";
import type { BodyHandle } from "../physics/World";
import { GameScene } from "../scenes/GameScene";

// The velocity a drag gives the pushed body, per px dragged (1/s).
const PUSH_SCALE = 6;
const STILL_ALPHA = 70;

interface Push {
  body: BodyHandle;
  from: Vec;
}

// Dev-only tools. They reach the game scene through its fields and World's public API.
export class DebugTools {
  private readonly scenes: SceneManager;
  private readonly input: Input<Action>;
  private readonly heldKeys = new Set<string>();
  private showOutlines = false;
  private push: Push | null = null;

  constructor(scenes: SceneManager, input: Input<Action>, canvas: EventTarget) {
    this.scenes = scenes;
    this.input = input;
    window.addEventListener("keydown", (event) => this.onKeyDown(event.code));
    window.addEventListener("keyup", (event) =>
      this.heldKeys.delete(event.code),
    );
    canvas.addEventListener("pointerdown", () => this.startPush());
    window.addEventListener("pointerup", () => this.endPush());
  }

  draw(p: p5): void {
    const scene = this.gameScene();
    if (!scene || !this.showOutlines) return;

    p.push();
    p.translate(0, FLOOR_SCREEN_Y);
    p.noFill();
    p.strokeWeight(1);
    for (const body of scene.world.handles()) {
      const color = p.color("#7dff7a");
      if (scene.world.isBodyStill(body)) color.setAlpha(STILL_ALPHA);
      p.stroke(color);
      p.beginShape();
      for (const { x, y } of scene.world.vertices(body)) p.vertex(x, y);
      p.endShape(p.CLOSE);
    }
    p.pop();
  }

  private onKeyDown(code: string): void {
    this.heldKeys.add(code);
    if (code === "Digit1") this.showOutlines = !this.showOutlines;
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

  private levelPointer(): Vec {
    return sub(this.input.pointer, { x: 0, y: FLOOR_SCREEN_Y });
  }

  private gameScene(): GameScene | undefined {
    const scene = this.scenes.current;
    return scene instanceof GameScene ? scene : undefined;
  }
}
