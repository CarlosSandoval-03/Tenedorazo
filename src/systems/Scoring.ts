import { UNUSED_INGREDIENT_BONUS } from "../config";

// Where a level's score comes from.
export interface ScoreBreakdown {
  readonly roaches: number;
  readonly fort: number;
  // Paid only when the level is won.
  readonly ingredientsLeft: number;
}

export function unusedBonus(ingredientsLeft: number): number {
  return ingredientsLeft * UNUSED_INGREDIENT_BONUS;
}

export function totalScore(breakdown: ScoreBreakdown): number {
  return (
    breakdown.roaches + breakdown.fort + unusedBonus(breakdown.ingredientsLeft)
  );
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

// How far the score is from the next threshold; undefined once it has all three hats.
export function pointsToNextHat(
  score: number,
  stars: readonly [number, number],
): number | undefined {
  const next = stars.find((threshold) => score < threshold);
  return next === undefined ? undefined : next - score;
}
