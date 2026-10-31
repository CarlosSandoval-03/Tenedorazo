import { UNUSED_INGREDIENT_BONUS } from "../config";

// Only a won level pays for the ingredients it didn't need.
export function unusedBonus(ingredientsLeft: number): number {
  return ingredientsLeft * UNUSED_INGREDIENT_BONUS;
}

// One hat for winning, then one for each threshold the score reaches.
export function hatsFor(
  score: number,
  stars: readonly [number, number],
): number {
  const [twoHats, threeHats] = stars;
  if (score >= threeHats) return 3;
  if (score >= twoHats) return 2;
  return 1;
}
