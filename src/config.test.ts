import { describe, expect, it } from "vitest";
import {
  INGREDIENTS,
  MAX_LAUNCH_SPEED,
  MIN_BODY_SIZE,
  SUBSTEPS,
  TICK_MS,
} from "./config";

describe("config", () => {
  // Without continuous collision, a body must not jump past a thin plate in one update.
  it("keeps the fastest launch from tunneling", () => {
    const pxPerUpdate = (MAX_LAUNCH_SPEED * TICK_MS) / 1000 / SUBSTEPS;

    expect(pxPerUpdate).toBeLessThan(MIN_BODY_SIZE);
  });

  it("never makes an ingredient smaller than the smallest body", () => {
    for (const { shape } of Object.values(INGREDIENTS)) {
      const size =
        shape.type === "circle"
          ? shape.radius * 2
          : Math.min(shape.width, shape.height);
      expect(size).toBeGreaterThanOrEqual(MIN_BODY_SIZE);
    }
  });
});
