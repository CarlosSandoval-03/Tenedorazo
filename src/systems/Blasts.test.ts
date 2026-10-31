import { describe, expect, it } from "vitest";
import { COOKER_BLAST } from "../config";
import { Block } from "../entities/Block";
import type { Destructible } from "../entities/Destructible";
import { Ground } from "../entities/Ground";
import { World, type BodyHandle } from "../physics/World";
import { Blasts } from "./Blasts";

const SPACING = COOKER_BLAST.radius * 0.75;

function cookerAt(world: World, x: number): Block {
  return new Block(world, {
    material: "pressureCooker",
    shape: { type: "circle", radius: 24 },
    position: { x, y: -24 },
  });
}

describe("Blasts", () => {
  it("sets off a chain of cookers one tick at a time", () => {
    const world = new World();
    new Ground(world, { center: { x: 480, y: 32 }, width: 960, height: 64 });
    const cookers = [200, 200 + SPACING, 200 + SPACING * 2].map((x) =>
      cookerAt(world, x),
    );
    const targets = new Map<BodyHandle, Destructible>(
      cookers.map((cooker) => [cooker.body, cooker]),
    );
    const blasts = new Blasts();
    blasts.request({ ...COOKER_BLAST, at: { x: 200 - SPACING, y: -24 } });

    const destroyedAt: number[] = [];
    for (let tick = 1; tick <= 4; tick++) {
      world.step();
      blasts.run(world, targets);
      for (const [i, cooker] of cookers.entries()) {
        if (cooker.isAlive || !targets.has(cooker.body)) continue;
        destroyedAt[i] = tick;
        const blast = cooker.blastOnDestroy();
        if (blast) blasts.request(blast);
        world.remove(cooker.body);
        targets.delete(cooker.body);
      }
    }

    expect(destroyedAt).toEqual([1, 2, 3]);
  });

  it("pushes bodies away from the center", () => {
    const world = new World();
    const left = cookerAt(world, 400);
    const blasts = new Blasts();

    blasts.request({ ...COOKER_BLAST, at: { x: 450, y: -24 } });
    blasts.run(world, new Map());

    expect(world.velocity(left.body).x).toBeLessThan(0);
  });
});
