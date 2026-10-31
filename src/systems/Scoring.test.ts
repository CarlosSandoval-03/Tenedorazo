import { describe, expect, it } from "vitest";
import { UNUSED_INGREDIENT_BONUS } from "../config";
import { hatsFor, pointsToNextHat, totalScore, unusedBonus } from "./Scoring";

describe("hatsFor", () => {
  it("gives one hat for a win and one more per threshold reached", () => {
    expect(hatsFor(0, [3000, 5500])).toBe(1);
    expect(hatsFor(3000, [3000, 5500])).toBe(2);
    expect(hatsFor(5499, [3000, 5500])).toBe(2);
    expect(hatsFor(5500, [3000, 5500])).toBe(3);
  });
});

describe("pointsToNextHat", () => {
  it("measures to the next threshold, and stops at three hats", () => {
    expect(pointsToNextHat(1000, [3000, 5500])).toBe(2000);
    expect(pointsToNextHat(5000, [3000, 5500])).toBe(500);
    expect(pointsToNextHat(5500, [3000, 5500])).toBeUndefined();
  });
});

describe("totalScore", () => {
  it("adds the roaches, the fort, and the bonus per ingredient left", () => {
    const breakdown = { roaches: 3000, fort: 400, ingredientsLeft: 1 };

    expect(totalScore(breakdown)).toBe(3400 + UNUSED_INGREDIENT_BONUS);
    expect(unusedBonus(0)).toBe(0);
  });
});
