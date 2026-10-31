import type p5 from "p5";
import {
  DAMAGE_THRESHOLD,
  DEBRIS_SEED,
  FINAL_SLOWMO,
  FINAL_SLOWMO_FRAMES,
  FLOOR_SCREEN_Y,
  INGREDIENTS,
  KILL_MARGIN,
  KILL_Y,
  LEVEL_START_GRACE,
  MIN_PULL,
  PREVIEW_DOT_SPACING,
  PREVIEW_DOTS,
  SHAKE_DECAY,
  SHAKE_MAX,
  SHAKE_SCALE,
} from "../config";
import { ZERO, length, lerp, sub, type Vec } from "../core/math";
import { createRandom, randomBetween } from "../core/random";
import type { Scene } from "../core/Scene";
import { Block, type BlockSpec } from "../entities/Block";
import type { Destructible } from "../entities/Destructible";
import { Ground } from "../entities/Ground";
import { Ingredient } from "../entities/Ingredient";
import { Launcher } from "../entities/Launcher";
import { Roach } from "../entities/Roach";
import { t } from "../i18n";
import { damageFromImpact } from "../physics/damage";
import { World, type BodyHandle, type Impact } from "../physics/World";
import { DEBRIS_LOOKS, Debris, type DebrisLook } from "../systems/Debris";
import { SHOT, Shot, type ShotEvent, type ShotInput } from "../systems/Shot";
import type { IngredientKind, RoachKind } from "../types";
import { drawAimPreview } from "../ui/AimPreview";
import { drawBanner } from "../ui/Banner";
import { drawHUD } from "../ui/HUD";
import { drawKitchen } from "../ui/Kitchen";
import type { GameContext } from "./GameContext";

const LEVEL_WIDTH = 960;
const LAUNCHER_REST = { x: 160, y: -96 };
const TEST_QUEUE: IngredientKind[] = Array(3).fill("meatball");

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

const TEST_ROACHES: { kind: RoachKind; position: Vec }[] = [
  { kind: "roach", position: { x: 632, y: -16 } },
  { kind: "roach", position: { x: 672, y: -128 } },
  { kind: "roach", position: { x: 864, y: -160 } },
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

export const OUTCOME = {
  playing: "playing",
  won: "won",
  lost: "lost",
} as const;
export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export class GameScene implements Scene {
  world = new World();
  blocks: Block[] = [];
  roaches: Roach[] = [];
  shot = new Shot(this.world, LAUNCHER_REST);
  outcome: Outcome = OUTCOME.playing;
  private ground: Ground[] = [];
  private launcher = new Launcher(LAUNCHER_REST);
  private queue: IngredientKind[] = [];
  // The ingredient in the band, then in flight until its shot settles.
  private loaded: Ingredient | null = null;
  private flying: Ingredient[] = [];
  private destructibles = new Map<BodyHandle, Destructible>();
  private debris = new Debris(DEBRIS_SEED);
  private shakeRandom = createRandom(DEBRIS_SEED);
  private shake = 0;
  private shakeOffset = ZERO;
  private preview: Vec[] = [];
  private ticks = 0;
  private slowmoFrames = 0;
  private readonly context: GameContext;

  constructor(context: GameContext) {
    this.context = context;
  }

  get timeScale(): number {
    return this.slowmoFrames > 0 ? FINAL_SLOWMO : 1;
  }

  enter(): void {
    this.start();
  }

  // One tick, in order: input and the shot, the step, what the step did, then the level's end.
  update(): void {
    if (this.context.input.wasPressed("restart")) {
      this.start();
      return;
    }
    if (this.outcome === OUTCOME.playing)
      this.handleShotEvent(this.shot.update(this.shotInput()));

    this.world.step();
    this.ticks++;
    this.applyImpacts(this.world.takeImpacts());
    this.removeOutOfBounds();
    this.removeDestroyed();

    this.updateEffects();
    this.checkWin();
    this.updateLauncher();
    this.updatePreview();
  }

  // The level in level space, shaken; then the HUD and any banner in screen space.
  draw(p: p5): void {
    drawKitchen(p);
    p.push();
    p.translate(this.shakeOffset.x, FLOOR_SCREEN_Y + this.shakeOffset.y);
    for (const ground of this.ground) ground.draw(p);
    for (const block of this.blocks) block.draw(p);
    for (const roach of this.roaches) roach.draw(p);
    drawAimPreview(p, this.preview);
    this.launcher.draw(p);
    for (const ingredient of this.flying) ingredient.draw(p);
    this.debris.draw(p);
    p.pop();

    drawHUD(p, this.ingredientsLeft());
    this.drawOutcome(p);
  }

  exit(): void {}

  // Throws the old world away and builds the level again from scratch.
  private start(): void {
    this.world = new World();
    this.ground = [
      new Ground(this.world, {
        center: { x: 480, y: 32 },
        width: 960,
        height: 64,
      }),
    ];
    this.blocks = TEST_FORT.map((spec) => new Block(this.world, spec));
    this.roaches = TEST_ROACHES.map(
      ({ kind, position }) => new Roach(this.world, kind, position),
    );
    this.destructibles = new Map(
      [...this.blocks, ...this.roaches].map((target) => [target.body, target]),
    );
    this.launcher = new Launcher(LAUNCHER_REST);
    this.shot = new Shot(this.world, LAUNCHER_REST);
    this.queue = [...TEST_QUEUE];
    this.flying = [];
    this.debris = new Debris(DEBRIS_SEED);
    this.shakeRandom = createRandom(DEBRIS_SEED);
    this.shake = 0;
    this.ticks = 0;
    this.slowmoFrames = 0;
    this.outcome = OUTCOME.playing;
    this.loadNext();
  }

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

  // The spent ingredients go with a puff, so they never prop up a fort later. Then the next one
  // loads, unless the roaches are gone (a win) or the queue is empty (a loss).
  private endShot(): void {
    for (const ingredient of this.flying) this.removeIngredient(ingredient);
    this.flying = [];
    if (this.roaches.length === 0) return;
    if (!this.loadNext()) this.outcome = OUTCOME.lost;
  }

  private loadNext(): boolean {
    const kind = this.queue.shift();
    if (!kind) return false;
    this.loaded = new Ingredient(this.world, kind);
    this.shot.load();
    return true;
  }

  private removeIngredient(ingredient: Ingredient): void {
    if (ingredient.body)
      this.debris.burst(
        this.world.position(ingredient.body),
        DEBRIS_LOOKS.puff,
      );
    ingredient.remove();
  }

  private applyImpacts(impacts: readonly Impact[]): void {
    for (const impact of impacts) {
      this.endFlightOnHit(impact);
      if (this.ticks <= LEVEL_START_GRACE) continue;
      this.damageSide(impact.a, impact.strength);
      this.damageSide(impact.b, impact.strength);
    }
    const largest = Math.max(0, ...impacts.map((impact) => impact.strength));
    this.addShake(largest);
  }

  // The ingredient's first hit ends its flight, and with it the chance to use its ability.
  private endFlightOnHit(impact: Impact): void {
    for (const ingredient of this.flying) {
      if (impact.a !== ingredient.body && impact.b !== ingredient.body)
        continue;
      ingredient.land();
      this.shot.hit();
    }
  }

  // Ingredients and the counter aren't destructible, so only the other side takes damage.
  private damageSide(body: BodyHandle, strength: number): void {
    const target = this.destructibles.get(body);
    target?.damage(damageFromImpact(strength, target.fragility));
  }

  private addShake(strength: number): void {
    const kick = Math.max(0, strength - DAMAGE_THRESHOLD) * SHAKE_SCALE;
    this.shake = Math.min(SHAKE_MAX, Math.max(this.shake, kick));
  }

  // Off the level counts as gone: a roach that falls off is as good as squashed.
  private removeOutOfBounds(): void {
    for (const target of this.destructibles.values())
      if (this.isOutOfBounds(this.world.position(target.body)))
        target.alive = false;

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

  // Bodies at 0 hp leave the world only now, after the step, never inside it.
  private removeDestroyed(): void {
    const hadRoaches = this.roaches.length > 0;
    this.blocks = this.prune(
      this.blocks,
      (block) => DEBRIS_LOOKS[block.material],
    );
    this.roaches = this.prune(this.roaches, () => DEBRIS_LOOKS.roach);
    if (hadRoaches && this.roaches.length === 0)
      this.slowmoFrames = FINAL_SLOWMO_FRAMES;
  }

  private prune<T extends Destructible>(
    targets: T[],
    lookOf: (target: T) => DebrisLook,
  ): T[] {
    for (const target of targets) {
      if (target.alive) continue;
      this.debris.burst(this.world.position(target.body), lookOf(target));
      this.world.remove(target.body);
      this.destructibles.delete(target.body);
    }
    return targets.filter((target) => target.alive);
  }

  private updateEffects(): void {
    for (const target of this.destructibles.values()) target.update();
    this.debris.update();
    if (this.slowmoFrames > 0) this.slowmoFrames--;

    this.shake *= SHAKE_DECAY;
    this.shakeOffset = {
      x: randomBetween(this.shakeRandom, -this.shake, this.shake),
      y: randomBetween(this.shakeRandom, -this.shake, this.shake),
    };
  }

  // The level is won once the roaches are gone and the shot that got them has settled.
  private checkWin(): void {
    if (this.outcome !== OUTCOME.playing || this.roaches.length > 0) return;
    const isShotOut =
      this.shot.state === SHOT.flying || this.shot.state === SHOT.settling;
    if (!isShotOut) this.outcome = OUTCOME.won;
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

  private ingredientsLeft(): IngredientKind[] {
    return this.loaded ? [this.loaded.kind, ...this.queue] : [...this.queue];
  }

  private drawOutcome(p: p5): void {
    if (this.outcome === OUTCOME.playing) return;
    const title = this.outcome === OUTCOME.won ? t("game.won") : t("game.lost");
    drawBanner(p, title, t("game.restartHint"));
  }
}
