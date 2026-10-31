import { describe, expect, it } from "vitest";
import {
  add,
  clamp,
  clampLength,
  length,
  normalize,
  rotate,
  scale,
  sub,
  vec,
} from "./math";

describe("vector helpers", () => {
  it("adds, subtracts, and scales", () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual(vec(4, 6));
    expect(sub(vec(1, 2), vec(3, 4))).toEqual(vec(-2, -2));
    expect(scale(vec(1, -2), 3)).toEqual(vec(3, -6));
  });

  it("measures and normalizes", () => {
    expect(length(vec(3, 4))).toBe(5);
    expect(normalize(vec(0, 5))).toEqual(vec(0, 1));
    expect(normalize(vec(0, 0))).toEqual(vec(0, 0));
  });

  it("rotates a quarter turn", () => {
    const turned = rotate(vec(1, 0), Math.PI / 2);

    expect(turned.x).toBeCloseTo(0);
    expect(turned.y).toBeCloseTo(1);
  });

  it("clamps the length and keeps the direction", () => {
    expect(clampLength(vec(30, 40), 10)).toEqual(vec(6, 8));
    expect(clampLength(vec(3, 4), 10)).toEqual(vec(3, 4));
  });

  it("clamps a number", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
  });
});
