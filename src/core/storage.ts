// localStorage can be missing (tests) or throw (blocked storage); then nothing persists, and the
// game still plays.
export function readStored(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Blocked storage only stops the value from persisting.
  }
}
