// 1 at the center, falling linearly to 0 at the radius and beyond.
export function blastFalloff(distance: number, radius: number): number {
  return Math.max(0, 1 - distance / radius);
}
