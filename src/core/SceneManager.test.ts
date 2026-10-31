import { describe, expect, it } from "vitest";
import { MAX_STEPS_PER_FRAME } from "../config";
import type { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";

function countingScene(timeScale = 1) {
  const scene = {
    updates: 0,
    timeScale,
    enter() {},
    update() {
      scene.updates++;
    },
    draw() {},
    exit() {},
  } satisfies Scene & { updates: number };
  return scene;
}

function runOneSecond(manager: SceneManager, hz: number): void {
  for (let i = 0; i < hz; i++) manager.frame(1000 / hz);
}

describe("SceneManager", () => {
  it.each([60, 75, 144, 30])("runs 60 ticks per second at %d Hz", (hz) => {
    const manager = new SceneManager(() => {});
    const scene = countingScene();
    manager.change(scene);

    runOneSecond(manager, hz);

    expect(scene.updates).toBeGreaterThanOrEqual(59);
    expect(scene.updates).toBeLessThanOrEqual(60);
  });

  it("drops the ticks owed past the cap", () => {
    const manager = new SceneManager(() => {});
    const scene = countingScene();
    manager.change(scene);

    manager.frame(1000);
    manager.frame(1000 / 60);

    expect(scene.updates).toBe(MAX_STEPS_PER_FRAME + 1);
  });

  it("slows down with the scene's time scale", () => {
    const manager = new SceneManager(() => {});
    const scene = countingScene(0.25);
    manager.change(scene);

    runOneSecond(manager, 60);

    expect(scene.updates).toBe(15);
  });

  it("ends every tick", () => {
    let ended = 0;
    const manager = new SceneManager(() => ended++);
    manager.change(countingScene());

    runOneSecond(manager, 30);

    expect(ended).toBe(60);
  });
});
