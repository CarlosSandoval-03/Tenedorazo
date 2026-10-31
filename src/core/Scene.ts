import type p5 from "p5";

export interface Scene {
  enter(): void;
  // One fixed tick of game logic.
  update(): void;
  draw(p: p5): void;
  exit(): void;
  // Below 1 the scene runs in slow motion: fewer ticks per second, never shorter ones.
  readonly timeScale?: number;
}
