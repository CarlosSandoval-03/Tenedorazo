import { readStored, writeStored } from "./core/storage";

export interface LevelProgress {
  readonly bestScore: number;
  readonly hats: number;
}

export const PROGRESS_KEY = "forkfling.progress";
// Debug sessions save apart, so they never touch the real progress.
export const DEBUG_PROGRESS_KEY = "forkfling.debug.progress";

export interface RecordedResult {
  readonly best: LevelProgress;
  readonly isFirstWin: boolean;
}

// The player's progress by level id: best score and hats. Unlocks are derived from it.
export class SavedProgress {
  private readonly key: string;
  private levels: Record<string, LevelProgress>;

  constructor(key: string) {
    this.key = key;
    this.levels = parseProgress(readStored(key));
  }

  of(levelId: string): LevelProgress | undefined {
    return this.levels[levelId];
  }

  // Keeps the best score and the most hats, each on its own.
  recordWin(levelId: string, score: number, hats: number): RecordedResult {
    const previous = this.levels[levelId];
    const best = {
      bestScore: Math.max(score, previous?.bestScore ?? 0),
      hats: Math.max(hats, previous?.hats ?? 0),
    };
    this.levels = { ...this.levels, [levelId]: best };
    writeStored(this.key, JSON.stringify(this.levels));
    return { best, isFirstWin: previous === undefined };
  }

  // The first level is always open; each next one opens once the one before is won.
  isUnlocked(levelIndex: number, levelIds: readonly string[]): boolean {
    if (levelIndex === 0) return true;
    const previous = levelIds[levelIndex - 1];
    return previous !== undefined && this.of(previous) !== undefined;
  }

  clear(): void {
    this.levels = {};
    writeStored(this.key, JSON.stringify(this.levels));
  }
}

// Saved data is outside the game's control: anything malformed is dropped, never trusted.
export function parseProgress(
  json: string | null,
): Record<string, LevelProgress> {
  if (json === null) return {};
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null) return {};

  const levels: Record<string, LevelProgress> = {};
  for (const [id, value] of Object.entries(data))
    if (isLevelProgress(value)) levels[id] = value;
  return levels;
}

function isLevelProgress(value: unknown): value is LevelProgress {
  return (
    typeof value === "object" &&
    value !== null &&
    "bestScore" in value &&
    "hats" in value &&
    typeof value.bestScore === "number" &&
    typeof value.hats === "number"
  );
}
