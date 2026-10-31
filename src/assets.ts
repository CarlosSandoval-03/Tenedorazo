import type p5 from "p5";

// Relative, so the build runs under any path. The MVP's only asset is its font.
export const ASSET_PATHS = {
  font: "assets/fonts/Fredoka.ttf",
} as const;

export interface Assets {
  readonly font: p5.Font;
}

// A missing file rejects the load instead of leaving an asset undefined.
export async function loadAssets(p: p5): Promise<Assets> {
  const [font] = await Promise.all([p.loadFont(ASSET_PATHS.font)]);
  return { font };
}
