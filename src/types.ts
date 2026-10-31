export const MATERIAL_KINDS = [
  "glass",
  "wood",
  "castIron",
  "jelly",
  "pressureCooker",
] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const ROACH_KINDS = ["roach", "capped", "colander", "queen"] as const;
export type RoachKind = (typeof ROACH_KINDS)[number];

// In unlock order: place n brings the n-th ingredient.
export const INGREDIENT_KINDS = [
  "meatball",
  "peaPod",
  "chili",
  "cheese",
  "popcorn",
] as const;
export type IngredientKind = (typeof INGREDIENT_KINDS)[number];

// What flies: the ingredients, and the peas a pod splits into.
export type ProjectileKind = IngredientKind | "pea";

export interface LevelPoint {
  x: number;
  y: number;
}

// Level space: x grows right from the level's left edge, y grows down, the floor's top is y = 0.
export interface LevelDef {
  // "2-3": place 2, level 3.
  id: string;
  width: number;
  // The band's rest position.
  launcher: LevelPoint;
  // The queue, in launch order.
  ingredients: IngredientKind[];
  // The scores for 2 and 3 hats.
  stars: [number, number];
  ground: GroundDef[];
  blocks: BlockDef[];
  roaches: RoachDef[];
}

// Static counter stone, by its center.
export interface GroundDef extends LevelPoint {
  width: number;
  height: number;
}

export interface BlockDef extends LevelPoint {
  shape: "box" | "circle";
  material: MaterialKind;
  // Circles use the width as the diameter.
  width: number;
  height: number;
  // Radians.
  angle?: number;
}

export interface RoachDef extends LevelPoint {
  kind: RoachKind;
}
