import { DAMAGE_SCALE, DAMAGE_THRESHOLD } from "../config";

// Gentle contacts (a fort settling, a block sliding) stay under the threshold and do nothing.
export function damageFromImpact(strength: number, fragility: number): number {
  return Math.max(0, strength - DAMAGE_THRESHOLD) * DAMAGE_SCALE * fragility;
}
