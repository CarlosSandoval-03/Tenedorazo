import { Block } from "../entities/Block";
import type { Destructible } from "../entities/Destructible";
import { Ground } from "../entities/Ground";
import { Roach } from "../entities/Roach";
import type { BodyHandle, ShapeDef, World } from "../physics/World";
import type { BlockDef, LevelDef } from "../types";

export interface BuiltLevel {
  ground: Ground[];
  blocks: Block[];
  roaches: Roach[];
  // Every body that impacts can break, to its entity.
  destructibles: Map<BodyHandle, Destructible>;
}

// Bodies are created in the order the data lists them, so a level builds the same every time.
export function buildLevel(world: World, def: LevelDef): BuiltLevel {
  const ground = def.ground.map(
    ({ x, y, width, height }) =>
      new Ground(world, { center: { x, y }, width, height }),
  );
  const blocks = def.blocks.map(
    (block) =>
      new Block(world, {
        material: block.material,
        shape: shapeOf(block),
        position: { x: block.x, y: block.y },
        angle: block.angle,
      }),
  );
  const roaches = def.roaches.map(
    ({ kind, x, y }) => new Roach(world, kind, { x, y }),
  );
  const destructibles = new Map<BodyHandle, Destructible>(
    [...blocks, ...roaches].map((target) => [target.body, target]),
  );
  return { ground, blocks, roaches, destructibles };
}

function shapeOf(block: BlockDef): ShapeDef {
  if (block.shape === "circle")
    return { type: "circle", radius: block.width / 2 };
  return { type: "box", width: block.width, height: block.height };
}
