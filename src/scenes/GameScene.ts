import type p5 from "p5";
import { FLOOR_SCREEN_Y } from "../config";
import type { Scene } from "../core/Scene";
import { Block, type BlockSpec } from "../entities/Block";
import { Ground } from "../entities/Ground";
import { World } from "../physics/World";
import { drawKitchen } from "../ui/Kitchen";

// A hard-coded test fort on the 16 px grid, until levels come from data.
const TEST_FORT: BlockSpec[] = [
  box("castIron", 592, -48, 32, 96),
  box("wood", 672, -48, 16, 96),
  box("castIron", 752, -48, 32, 96),
  box("wood", 672, -104, 224, 16),
  box("glass", 608, -144, 32, 64),
  box("glass", 736, -144, 32, 64),
  box("glass", 672, -184, 160, 16),
  box("wood", 672, -224, 16, 64),
  box("wood", 672, -264, 96, 16),
  box("glass", 864, -32, 32, 64),
  box("glass", 864, -72, 96, 16),
  box("glass", 864, -112, 32, 64),
];

function box(
  material: BlockSpec["material"],
  x: number,
  y: number,
  width: number,
  height: number,
): BlockSpec {
  return {
    material,
    shape: { type: "box", width, height },
    position: { x, y },
  };
}

export class GameScene implements Scene {
  world = new World();
  blocks: Block[] = [];
  private ground: Ground[] = [];

  enter(): void {
    this.world = new World();
    this.ground = [
      new Ground(this.world, {
        center: { x: 480, y: 32 },
        width: 960,
        height: 64,
      }),
    ];
    this.blocks = TEST_FORT.map((spec) => new Block(this.world, spec));
  }

  update(): void {
    this.world.step();
  }

  draw(p: p5): void {
    drawKitchen(p);
    p.push();
    p.translate(0, FLOOR_SCREEN_Y);
    for (const ground of this.ground) ground.draw(p);
    for (const block of this.blocks) block.draw(p);
    p.pop();
  }

  exit(): void {}
}
