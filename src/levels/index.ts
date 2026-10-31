import {
  INGREDIENT_KINDS,
  MATERIAL_KINDS,
  ROACH_KINDS,
  type LevelDef,
  type LevelPoint,
} from "../types";
import level1x1 from "./1-1.json";
import level2x1 from "./2-1.json";
import level3x1 from "./3-1.json";

// A level file as JSON types it: every kind is a plain string until it is checked.
interface RawLevel {
  id: string;
  width: number;
  launcher: LevelPoint;
  ingredients: string[];
  stars: number[];
  ground: { x: number; y: number; width: number; height: number }[];
  blocks: (LevelPoint & {
    shape: string;
    material: string;
    width: number;
    height: number;
    angle?: number;
  })[];
  roaches: (LevelPoint & { kind: string })[];
}

// In play order.
export const LEVELS: readonly LevelDef[] = [level1x1, level2x1, level3x1].map(
  parseLevel,
);

// Narrows the JSON's strings to the game's kinds; an unknown kind is a broken file.
export function parseLevel(raw: RawLevel): LevelDef {
  const [twoHats, threeHats, ...extra] = raw.stars;
  if (twoHats === undefined || threeHats === undefined || extra.length > 0)
    throw new Error(`${raw.id}: stars must be two scores`);

  return {
    ...raw,
    stars: [twoHats, threeHats],
    ingredients: raw.ingredients.map((kind) =>
      oneOf(INGREDIENT_KINDS, kind, `${raw.id}: ingredient`),
    ),
    blocks: raw.blocks.map((block, i) => ({
      ...block,
      shape: oneOf(
        ["box", "circle"] as const,
        block.shape,
        `${raw.id}: block ${i} shape`,
      ),
      material: oneOf(
        MATERIAL_KINDS,
        block.material,
        `${raw.id}: block ${i} material`,
      ),
    })),
    roaches: raw.roaches.map((roach, i) => ({
      ...roach,
      kind: oneOf(ROACH_KINDS, roach.kind, `${raw.id}: roach ${i} kind`),
    })),
  };
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string,
  what: string,
): T {
  const match = allowed.find((option) => option === value);
  if (match === undefined) throw new Error(`${what} "${value}" is unknown`);
  return match;
}
