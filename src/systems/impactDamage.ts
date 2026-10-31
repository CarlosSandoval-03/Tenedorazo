import type { Destructible } from "../entities/Destructible";
import { damageFromImpact } from "../physics/damage";
import type { BodyHandle, Impact } from "../physics/World";

// Both sides of each impact take damage by their own fragility. Ingredients and the counter
// aren't destructible, so only the other side of their hits is hurt.
export function applyImpactDamage(
  impacts: readonly Impact[],
  targets: ReadonlyMap<BodyHandle, Destructible>,
): void {
  for (const { a, b, strength } of impacts)
    for (const body of [a, b]) {
      const target = targets.get(body);
      target?.damage(damageFromImpact(strength, target.fragility));
    }
}
