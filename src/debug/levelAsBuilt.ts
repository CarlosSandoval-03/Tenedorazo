import type { GameScene } from "../scenes/GameScene";
import type { BlockDef, LevelDef } from "../types";

const DECIMALS = 100;

// The scene's level with every block and roach where it is now, to paste back into a file.
export function levelAsBuilt(scene: GameScene): LevelDef {
  const { world, level } = scene;
  const blocks = scene.blocks.map((block): BlockDef => {
    const { x, y } = world.position(block.body);
    const size =
      block.shape.type === "circle"
        ? { width: block.shape.radius * 2, height: block.shape.radius * 2 }
        : { width: block.shape.width, height: block.shape.height };
    const angle = round(world.angle(block.body));
    return {
      shape: block.shape.type,
      material: block.material,
      x: round(x),
      y: round(y),
      ...size,
      ...(angle === 0 ? {} : { angle }),
    };
  });
  const roaches = scene.roaches.map((roach) => {
    const { x, y } = world.position(roach.body);
    return { kind: roach.kind, x: round(x), y: round(y) };
  });
  return { ...level, blocks, roaches };
}

function round(value: number): number {
  return Math.round(value * DECIMALS) / DECIMALS;
}
