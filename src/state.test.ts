import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedProgress, parseProgress } from "./state";

const IDS = ["1-1", "2-1", "3-1"];

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe("SavedProgress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("opens each level once the one before is won", () => {
    const progress = new SavedProgress("test");

    expect(progress.isUnlocked(0, IDS)).toBe(true);
    expect(progress.isUnlocked(1, IDS)).toBe(false);
    progress.recordWin("1-1", 3000, 1);
    expect(progress.isUnlocked(1, IDS)).toBe(true);
    expect(progress.isUnlocked(2, IDS)).toBe(false);
  });

  it("keeps the best score and the most hats, and survives a reload", () => {
    const first = new SavedProgress("test");
    const firstWin = first.recordWin("1-1", 5000, 2);
    const second = first.recordWin("1-1", 4000, 3);

    expect(firstWin.isFirstWin).toBe(true);
    expect(second).toEqual({
      best: { bestScore: 5000, hats: 3 },
      isFirstWin: false,
    });
    expect(new SavedProgress("test").of("1-1")).toEqual(second.best);
  });

  it("still plays when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    const progress = new SavedProgress("test");

    progress.recordWin("1-1", 100, 1);

    expect(progress.isUnlocked(1, IDS)).toBe(true);
  });
});

describe("parseProgress", () => {
  it("drops anything malformed", () => {
    expect(parseProgress("not json")).toEqual({});
    expect(parseProgress('{"1-1":{"bestScore":"x","hats":1}}')).toEqual({});
    expect(parseProgress('{"1-1":{"bestScore":10,"hats":1}}')).toEqual({
      "1-1": { bestScore: 10, hats: 1 },
    });
  });
});
