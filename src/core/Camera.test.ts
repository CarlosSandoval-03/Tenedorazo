import { describe, expect, it } from "vitest";
import { CANVAS_WIDTH, FLOOR_SCREEN_Y, MIN_ZOOM } from "../config";
import { Camera } from "./Camera";

describe("Camera", () => {
  it("keeps a one-screen level exactly in place", () => {
    const camera = new Camera(CANVAS_WIDTH, { left: 300, zoom: 1 });

    expect(camera.view).toEqual({ left: 0, zoom: 1 });
    expect(camera.toLevel({ x: 160, y: FLOOR_SCREEN_Y - 96 })).toEqual({
      x: 160,
      y: -96,
    });
  });

  it("stays inside a wide level, and centers a level narrower than the view", () => {
    const wide = new Camera(2000, { left: 5000, zoom: 1 });
    const zoomedOut = new Camera(CANVAS_WIDTH, { left: 0, zoom: MIN_ZOOM });

    expect(wide.view.left).toBe(2000 - CANVAS_WIDTH);
    expect(zoomedOut.view.left).toBe(
      (CANVAS_WIDTH - CANVAS_WIDTH / MIN_ZOOM) / 2,
    );
  });

  it("converts the screen to the level through the zoom", () => {
    const camera = new Camera(4000, { left: 400, zoom: 0.5 });

    expect(camera.toLevel({ x: 100, y: FLOOR_SCREEN_Y - 50 })).toEqual({
      x: 400 + 200,
      y: -100,
    });
  });

  it("eases toward its target", () => {
    const camera = new Camera(2000, { left: 0, zoom: 1 });

    camera.aimAt({ left: 1000, zoom: 1 });
    camera.update();
    const firstStep = camera.view.left;
    for (let i = 0; i < 300; i++) camera.update();

    expect(firstStep).toBeGreaterThan(0);
    expect(firstStep).toBeLessThan(1000);
    expect(camera.view.left).toBeCloseTo(1000);
  });
});
