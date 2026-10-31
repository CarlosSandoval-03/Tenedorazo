import { describe, expect, it } from "vitest";
import { createRandom, randomBetween } from "./random";

describe("createRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRandom(42);
    const b = createRandom(42);

    const first = Array.from({ length: 5 }, a);

    expect(Array.from({ length: 5 }, b)).toEqual(first);
    expect(new Set(first).size).toBe(5);
  });

  it("stays in [0, 1) and within a range", () => {
    const random = createRandom(7);

    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      const ranged = randomBetween(random, -3, 3);
      expect(ranged).toBeGreaterThanOrEqual(-3);
      expect(ranged).toBeLessThan(3);
    }
  });
});
