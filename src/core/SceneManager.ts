import type p5 from "p5";
import { MAX_STEPS_PER_FRAME, TICK_MS } from "../config";
import type { Scene } from "./Scene";

// Runs the current scene on a fixed tick: the time between frames fills an accumulator, and each
// whole tick stored runs one update(). The step never depends on the frame rate.
export class SceneManager {
  // 1 is normal time, 0 pauses the ticks; the scene's own slow motion multiplies it.
  private speed = 1;
  private scene: Scene | null = null;
  private accumulator = 0;
  private readonly endTick: () => void;

  // endTick runs after every update, so per-tick input (a press) is consumed by exactly one tick.
  constructor(endTick: () => void) {
    this.endTick = endTick;
  }

  get current(): Scene | null {
    return this.scene;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  change(next: Scene): void {
    this.scene?.exit();
    this.scene = next;
    this.accumulator = 0;
    next.enter();
  }

  // Returns the number of ticks run, for the tests.
  frame(elapsedMs: number): number {
    const timeScale = this.scene?.timeScale ?? 1;
    this.accumulator += elapsedMs * timeScale * this.speed;

    let ticks = 0;
    while (this.accumulator >= TICK_MS && ticks < MAX_STEPS_PER_FRAME) {
      this.tick();
      this.accumulator -= TICK_MS;
      ticks++;
    }

    // A slow machine slows down instead of catching up in a burst.
    this.accumulator %= TICK_MS;
    return ticks;
  }

  // One tick regardless of the accumulator, for stepping while paused.
  tick(): void {
    this.scene?.update();
    this.endTick();
  }

  draw(p: p5): void {
    this.scene?.draw(p);
  }
}
