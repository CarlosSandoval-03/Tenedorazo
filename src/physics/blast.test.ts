import { describe, expect, it } from "vitest";
import { blastFalloff } from "./blast";

describe("blastFalloff", () => {
  it("is full at the center and gone at the radius", () => {
    expect(blastFalloff(0, 100)).toBe(1);
    expect(blastFalloff(50, 100)).toBe(0.5);
    expect(blastFalloff(100, 100)).toBe(0);
    expect(blastFalloff(250, 100)).toBe(0);
  });
});
