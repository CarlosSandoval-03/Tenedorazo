import { describe, expect, it } from "vitest";
import { DAMAGE_SCALE, DAMAGE_THRESHOLD } from "../config";
import { damageFromImpact } from "./damage";

describe("damageFromImpact", () => {
  it("does nothing up to the threshold", () => {
    expect(damageFromImpact(0, 1)).toBe(0);
    expect(damageFromImpact(DAMAGE_THRESHOLD, 2)).toBe(0);
  });

  it("scales the excess by the fragility", () => {
    const strength = DAMAGE_THRESHOLD + 100;

    expect(damageFromImpact(strength, 1)).toBeCloseTo(100 * DAMAGE_SCALE);
    expect(damageFromImpact(strength, 0.5)).toBeCloseTo(50 * DAMAGE_SCALE);
  });
});
