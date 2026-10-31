import { BLAST_DAMAGE, type BlastSpec } from "../config";
import { distance, normalize, scale, sub, type Vec } from "../core/math";
import type { Destructible } from "../entities/Destructible";
import { blastFalloff } from "../physics/blast";
import type { BodyHandle, World } from "../physics/World";

export interface Blast extends BlastSpec {
  readonly at: Vec;
}

// Blasts wait for the end of the step that requested them. A pressure cooker a blast destroys
// queues its own for the next tick, so a chain unfolds one tick at a time and never recurses.
export class Blasts {
  private pending: Blast[] = [];

  request(blast: Blast): void {
    this.pending.push(blast);
  }

  // Runs the blasts requested so far; the ones requested meanwhile wait for the next call.
  run(world: World, targets: ReadonlyMap<BodyHandle, Destructible>): Blast[] {
    const blasts = this.pending;
    this.pending = [];
    for (const blast of blasts) explode(world, targets, blast);
    return blasts;
  }
}

// Every dynamic body in range is pushed away from the center and, if it can break, hurt. Line
// of sight is ignored.
function explode(
  world: World,
  targets: ReadonlyMap<BodyHandle, Destructible>,
  blast: Blast,
): void {
  for (const body of world.dynamicBodies()) {
    const position = world.position(body);
    const falloff = blastFalloff(distance(position, blast.at), blast.radius);
    if (falloff === 0) continue;

    const away = normalize(sub(position, blast.at));
    world.applyImpulse(body, scale(away, blast.strength * falloff));
    const target = targets.get(body);
    target?.damage(BLAST_DAMAGE * falloff * target.fragility);
  }
}
