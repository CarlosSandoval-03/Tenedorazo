import { describe, expect, it } from "vitest";
import {
  LEVEL_START_GRACE,
  SETTLE_CHECK_FRAMES,
  SETTLE_TOLERANCE,
} from "../config";
import { distance } from "../core/math";
import { World } from "../physics/World";
import { applyImpactDamage } from "../systems/impactDamage";
import { LEVELS } from ".";
import { buildLevel } from "./buildLevel";

// A fort left alone must stand: nothing hurt, nothing moved past the tolerance.
describe.each(LEVELS.map((level) => [level.id, level] as const))(
  "level %s left alone",
  (id, level) => {
    const world = new World();
    const built = buildLevel(world, level);
    const bodies = [
      ...built.blocks.map((block, i) => ({
        name: `block ${i} (${block.material})`,
        target: block,
      })),
      ...built.roaches.map((roach, i) => ({
        name: `roach ${i} (${roach.kind})`,
        target: roach,
      })),
    ].map((body) => ({ ...body, start: world.position(body.target.body) }));

    for (let tick = 1; tick <= SETTLE_CHECK_FRAMES; tick++) {
      world.step();
      const impacts = world.takeImpacts();
      if (tick > LEVEL_START_GRACE)
        applyImpactDamage(impacts, built.destructibles);
    }

    it("takes no damage", () => {
      const hurt = bodies
        .filter(({ target }) => target.hp < target.maxHp)
        .map(({ name }) => `${id}: ${name} took damage`);
      expect(hurt).toEqual([]);
    });

    it("stays where it was built", () => {
      const moved = bodies
        .map((body) => ({
          ...body,
          drift: distance(world.position(body.target.body), body.start),
        }))
        .filter(({ drift }) => drift > SETTLE_TOLERANCE)
        .map(
          ({ name, drift }) => `${id}: ${name} moved ${drift.toFixed(1)} px`,
        );
      expect(moved).toEqual([]);
    });
  },
);
