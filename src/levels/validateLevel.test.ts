import { describe, expect, it } from "vitest";
import type { LevelDef } from "../types";
import { LEVELS } from ".";
import { validateLevel } from "./validateLevel";

const SMALL: LevelDef = {
  id: "1-9",
  width: 960,
  launcher: { x: 160, y: -96 },
  ingredients: ["meatball", "meatball"],
  stars: [1000, 1200],
  ground: [{ x: 480, y: 32, width: 960, height: 64 }],
  blocks: [
    { shape: "box", material: "wood", x: 640, y: -32, width: 16, height: 64 },
  ],
  roaches: [{ kind: "roach", x: 688, y: -16 }],
};

describe("validateLevel", () => {
  it.each(LEVELS.map((level) => [level.id, level] as const))(
    "passes level %s",
    (_id, level) => {
      expect(validateLevel(level)).toEqual([]);
    },
  );

  it("passes a small good level", () => {
    expect(validateLevel(SMALL)).toEqual([]);
  });

  it("names the bodies that overlap", () => {
    const level: LevelDef = {
      ...SMALL,
      roaches: [{ kind: "roach", x: 648, y: -16 }],
    };

    expect(validateLevel(level)).toEqual([
      "1-9: block 0 (wood) overlaps roach 0 (roach)",
    ]);
  });

  it("catches a body below the floor or past the edge", () => {
    const level: LevelDef = {
      ...SMALL,
      roaches: [{ kind: "roach", x: 952, y: -8 }],
    };

    expect(validateLevel(level)).toContain(
      "1-9: roach 0 (roach) is outside the level or below the floor",
    );
  });

  it("catches unreachable hats and a locked ingredient", () => {
    const level: LevelDef = {
      ...SMALL,
      ingredients: ["chili"],
      stars: [900, 99999],
    };

    expect(validateLevel(level)).toEqual([
      "1-9: the 3-hat score is above the best possible 1200",
      "1-9: chili isn't unlocked in place 1",
    ]);
  });
});
