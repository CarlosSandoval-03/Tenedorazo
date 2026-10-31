import type p5 from "p5";
import {
  FLOOR_SCREEN_Y,
  INGREDIENTS,
  KILL_MARGIN,
  KILL_Y,
  MIN_PULL,
  PREVIEW_DOT_SPACING,
  PREVIEW_DOTS,
  type IngredientKind,
} from "../config";
import { length, lerp, sub, type Vec } from "../core/math";
import type { Scene } from "../core/Scene";
import { Block, type BlockSpec } from "../entities/Block";
import { Ground } from "../entities/Ground";
import { Ingredient } from "../entities/Ingredient";
import { Launcher } from "../entities/Launcher";
import { World } from "../physics/World";
import { SHOT, Shot, type ShotEvent, type ShotInput } from "../systems/Shot";
import { drawAimPreview } from "../ui/AimPreview";
import { drawKitchen } from "../ui/Kitchen";
import type { GameContext } from "./GameContext";

const LEVEL_WIDTH = 960;
const LAUNCHER_REST = { x: 160, y: -96 };
const TEST_QUEUE: IngredientKind[] = Array(5).fill("meatball");

// The hop into the band starts on the counter, this far left of the fork, and peaks this high.
const HOP_START_OFFSET = 56;
const HOP_HEIGHT = 40;

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
  shot = new Shot(this.world, LAUNCHER_REST);
  private ground: Ground[] = [];
  private launcher = new Launcher(LAUNCHER_REST);
  private queue: IngredientKind[] = [];
  // The ingredient in the band, then in flight until its shot settles.
  private loaded: Ingredient | null = null;
  private flying: Ingredient[] = [];
  private preview: Vec[] = [];
  private readonly context: GameContext;

  constructor(context: GameContext) {
    this.context = context;
  }

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
    this.launcher = new Launcher(LAUNCHER_REST);
    this.shot = new Shot(this.world, LAUNCHER_REST);
    this.queue = [...TEST_QUEUE];
    this.flying = [];
    this.loadNext();
  }

  // One tick: the shot reacts to input, the world steps, then the scene applies what happened.
  update(): void {
    this.handleShotEvent(this.shot.update(this.shotInput()));
    this.world.step();
    this.endFlightOnHit();
    this.removeOutOfBounds();
    this.updateLauncher();
    this.updatePreview();
  }

  draw(p: p5): void {
    drawKitchen(p);
    p.push();
    p.translate(0, FLOOR_SCREEN_Y);
    for (const ground of this.ground) ground.draw(p);
    for (const block of this.blocks) block.draw(p);
    drawAimPreview(p, this.preview);
    this.launcher.draw(p);
    for (const ingredient of this.flying) ingredient.draw(p);
    p.pop();
  }

  exit(): void {}

  private shotInput(): ShotInput {
    const { input } = this.context;
    return {
      pointer: sub(input.pointer, { x: 0, y: FLOOR_SCREEN_Y }),
      wasPointerPressed: input.wasPressed("pointer"),
      wasPointerReleased: input.wasReleased("pointer"),
      wasAbilityPressed:
        input.wasPressed("pointer") || input.wasPressed("ability"),
    };
  }

  private handleShotEvent(event: ShotEvent | undefined): void {
    if (event?.type === "launch") this.launch(event.pull, event.velocity);
    if (event?.type === "settled") this.endShot();
  }

  private launch(pull: Vec, velocity: Vec): void {
    const ingredient = this.loaded;
    if (!ingredient) return;
    ingredient.launch(sub(LAUNCHER_REST, pull), velocity);
    this.flying.push(ingredient);
    this.loaded = null;
  }

  // The spent ingredients go, so they never prop up a fort later.
  private endShot(): void {
    for (const ingredient of this.flying) ingredient.remove();
    this.flying = [];
    this.loadNext();
  }

  private loadNext(): void {
    const kind = this.queue.shift();
    if (!kind) return;
    this.loaded = new Ingredient(this.world, kind);
    this.shot.load();
  }

  private endFlightOnHit(): void {
    const impacts = this.world.takeImpacts();
    for (const ingredient of this.flying) {
      const isHit = impacts.some(
        ({ a, b }) => a === ingredient.body || b === ingredient.body,
      );
      if (!isHit) continue;
      ingredient.land();
      this.shot.hit();
    }
  }

  private removeOutOfBounds(): void {
    for (const block of this.blocks) {
      if (!this.isOutOfBounds(this.world.position(block.body))) continue;
      this.world.remove(block.body);
      block.alive = false;
    }
    this.blocks = this.blocks.filter((block) => block.alive);

    for (const ingredient of this.flying) {
      if (!ingredient.body) continue;
      if (!this.isOutOfBounds(this.world.position(ingredient.body))) continue;
      ingredient.remove();
      this.shot.hit();
    }
    this.flying = this.flying.filter((ingredient) => ingredient.alive);
  }

  private isOutOfBounds(position: Vec): boolean {
    return (
      position.y > KILL_Y ||
      position.x < -KILL_MARGIN ||
      position.x > LEVEL_WIDTH + KILL_MARGIN
    );
  }

  private updateLauncher(): void {
    this.launcher.loaded = this.loaded
      ? { ingredient: this.loaded, position: this.bandPosition() }
      : null;
  }

  // Along the hop while loading, then wherever the pull holds it.
  private bandPosition(): Vec {
    if (this.shot.state !== SHOT.loading)
      return sub(LAUNCHER_REST, this.shot.pull);

    const t = this.shot.loadProgress;
    const start = {
      x: LAUNCHER_REST.x - HOP_START_OFFSET,
      y: -this.loadedRadius(),
    };
    return {
      x: lerp(start.x, LAUNCHER_REST.x, t),
      y: lerp(start.y, LAUNCHER_REST.y, t) - Math.sin(t * Math.PI) * HOP_HEIGHT,
    };
  }

  private loadedRadius(): number {
    if (!this.loaded) return 0;
    const { shape } = INGREDIENTS[this.loaded.kind];
    return shape.type === "circle" ? shape.radius : shape.height / 2;
  }

  private updatePreview(): void {
    const ingredient = this.loaded;
    const isAiming =
      this.shot.state === SHOT.aiming && length(this.shot.pull) >= MIN_PULL;
    if (!ingredient || !isAiming) {
      this.preview = [];
      return;
    }
    this.preview = this.world.predictFlight(
      ingredient.bodyDef(
        sub(LAUNCHER_REST, this.shot.pull),
        this.shot.aimVelocity,
      ),
      PREVIEW_DOTS * PREVIEW_DOT_SPACING,
    );
  }
}
