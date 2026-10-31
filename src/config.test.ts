import { describe, expect, it } from "vitest";
import {
  BLOCK_UNIT,
  CHILI_BOOST,
  INGREDIENTS,
  MAX_LAUNCH_SPEED,
  MIN_BODY_SIZE,
  SUBSTEPS,
  TICK_MS,
} from "./config";

function pxPerUpdate(speed: number): number {
  return (speed * TICK_MS) / 1000 / SUBSTEPS;
}

describe("config", () => {
  // Without continuous collision, a body must not jump past a thin plate in one update.
  it("keeps the fastest launch from tunneling", () => {
    expect(pxPerUpdate(MAX_LAUNCH_SPEED)).toBeLessThan(MIN_BODY_SIZE);
  });

  // The boosted chili is faster, so it needs the overlap of its own thickness and a plate's.
  it("keeps the boosted chili from tunneling through a plate", () => {
    const { shape } = INGREDIENTS.chili;
    const thickness =
      shape.type === "box" ? Math.min(shape.width, shape.height) : 0;

    expect(pxPerUpdate(MAX_LAUNCH_SPEED + CHILI_BOOST)).toBeLessThan(
      thickness + BLOCK_UNIT,
    );
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
