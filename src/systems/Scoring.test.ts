import { describe, expect, it } from "vitest";
import { UNUSED_INGREDIENT_BONUS } from "../config";
import { hatsFor, unusedBonus } from "./Scoring";

describe("hatsFor", () => {
  it("gives one hat for a win and one more per threshold reached", () => {
    expect(hatsFor(0, [3000, 5500])).toBe(1);
    expect(hatsFor(3000, [3000, 5500])).toBe(2);
    expect(hatsFor(5499, [3000, 5500])).toBe(2);
    expect(hatsFor(5500, [3000, 5500])).toBe(3);
  });
});

describe("unusedBonus", () => {
  it("pays per ingredient left", () => {
    expect(unusedBonus(0)).toBe(0);
    expect(unusedBonus(2)).toBe(2 * UNUSED_INGREDIENT_BONUS);
  });
});
