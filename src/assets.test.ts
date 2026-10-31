import { describe, expect, it } from "vitest";
import { ASSET_PATHS } from "./assets";

// Vite lists the files without loading them.
const ON_DISK = Object.keys(import.meta.glob("/public/assets/**/*"))
  .map((path) => path.replace("/public/", ""))
  // License files travel with their assets but aren't loaded.
  .filter((path) => !path.endsWith("OFL.txt"));

describe("the asset list", () => {
  it("matches the files on disk", () => {
    expect(ON_DISK.sort()).toEqual(Object.values(ASSET_PATHS).sort());
  });
});
