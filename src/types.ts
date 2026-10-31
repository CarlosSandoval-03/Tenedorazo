export const MATERIAL_KINDS = ["glass", "wood", "castIron"] as const;
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
