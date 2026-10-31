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
  RESULT_DELAY_FRAMES,
  SHAKE_DECAY,
  SHAKE_MAX,
  SHAKE_SCALE,
} from "../config";
import { ZERO, length, lerp, sub, type Vec } from "../core/math";
import { createRandom, randomBetween } from "../core/random";
import type { Scene } from "../core/Scene";
import type { Block } from "../entities/Block";
import type { Destructible } from "../entities/Destructible";
import type { Ground } from "../entities/Ground";
import { Ingredient } from "../entities/Ingredient";
import { Launcher } from "../entities/Launcher";
import type { Roach } from "../entities/Roach";
import { t } from "../i18n";
import { buildLevel } from "../levels/buildLevel";
import { placeNumber } from "../levels/places";
import { World, type BodyHandle, type Impact } from "../physics/World";
import { DEBRIS_LOOKS, Debris, type DebrisLook } from "../systems/Debris";
import { Blasts } from "../systems/Blasts";
import { hatsFor, totalScore, unusedBonus } from "../systems/Scoring";
import { SHOT, Shot, type ShotEvent, type ShotInput } from "../systems/Shot";
import { applyImpactDamage } from "../systems/impactDamage";
import {
  INGREDIENT_KINDS,
  type IngredientKind,
  type LevelDef,
  type ProjectileKind,
} from "../types";
import { drawAimPreview } from "../ui/AimPreview";
import { FloatingNumbers } from "../ui/FloatingNumbers";
import { drawHint, drawHUD, isOnPauseButton } from "../ui/HUD";
import { drawKitchen } from "../ui/Kitchen";
import { PauseMenu } from "../ui/PauseMenu";
import type { GameContext } from "./GameContext";
import { LevelSelectScene } from "./LevelSelectScene";
import { ResultScene } from "./ResultScene";

// The hop into the band starts on the counter, this far left of the fork, and peaks this high.
const HOP_START_OFFSET = 56;
const HOP_HEIGHT = 40;

type ScorePart = "roaches" | "fort";

const OUTCOME = {
  playing: "playing",
  won: "won",
  lost: "lost",
} as const;
export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export class GameScene implements Scene {
  readonly level: LevelDef;
  world = new World();
  blocks: Block[] = [];
  roaches: Roach[] = [];
  shot: Shot;
  outcome: Outcome = OUTCOME.playing;
  // Scored so far, by part; the bonus for ingredients left comes only with a win.
  private scored: Record<ScorePart, number> = { roaches: 0, fort: 0 };
  queue: IngredientKind[] = [];
  // The last tick's impacts, kept for the shake and the debug view.
  lastImpacts: readonly Impact[] = [];
  // The ingredient in the band, then in flight until its shot settles.
  private loaded: Ingredient | null = null;
  private flying: Ingredient[] = [];
  private destructibles = new Map<BodyHandle, Destructible>();
  private debris = new Debris(DEBRIS_SEED);
  private blasts = new Blasts();
  private shakeRandom = createRandom(DEBRIS_SEED);
  private shake = 0;
  private shakeOffset = ZERO;
  private preview: Vec[] = [];
  private floatingNumbers = new FloatingNumbers();
  // Open while the game is paused.
  private pauseMenu: PauseMenu | null = null;
  // Ticks left between the level's end and its Result.
  private resultDelay = 0;
  private ground: Ground[] = [];
  private launcher: Launcher;
  private ticks = 0;
  private slowmoFrames = 0;
  // The place's new ingredient, while its hint shows; the hint shows once per attempt.
  private hintFor: IngredientKind | null = null;
  private wasHintShown = false;
  private readonly context: GameContext;

  constructor(context: GameContext, level: LevelDef) {
    this.context = context;
    this.level = level;
    this.shot = new Shot(this.world, level.launcher);
    this.launcher = new Launcher(level.launcher);
  }

  get score(): number {
    return this.scored.roaches + this.scored.fort;
  }

  get timeScale(): number {
    return this.slowmoFrames > 0 ? FINAL_SLOWMO : 1;
  }

  enter(): void {
    this.start();
  }

  // One tick, in order: pause and restart, input and the shot, the step, what the step did, then
  // the level's end.
  update(): void {
    if (this.updatePause()) return;
    if (this.context.input.wasPressed("restart")) {
      this.start();
      return;
    }
    if (this.outcome === OUTCOME.playing)
      this.handleShotEvent(this.shot.update(this.shotInput()));

    this.world.step();
    this.ticks++;
    this.applyImpacts(this.world.takeImpacts());
    this.runBlasts();
    this.removeOutOfBounds();
    this.removeDestroyed();

    this.updateEffects();
    this.checkWin();
    this.countDownToResult();
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
    this.floatingNumbers.draw(p);
    p.pop();

    const ingredientsLeft = this.ingredientsLeft();
    drawHUD(p, {
      ingredientsLeft,
      score: this.score,
      pendingBonus: unusedBonus(ingredientsLeft.length),
      stars: this.level.stars,
    });
    if (this.hintFor) drawHint(p, t(`hints.${this.hintFor}`));
    this.pauseMenu?.draw(p);
  }

  exit(): void {}

  // Throws the old world away and builds the level again from scratch.
  private start(): void {
    this.world = new World();
    const built = buildLevel(this.world, this.level);
    this.ground = built.ground;
    this.blocks = built.blocks;
    this.roaches = built.roaches;
    this.destructibles = built.destructibles;
    this.launcher = new Launcher(this.level.launcher);
    this.shot = new Shot(this.world, this.level.launcher);
    this.queue = [...this.level.ingredients];
    this.flying = [];
    this.debris = new Debris(DEBRIS_SEED);
    this.blasts = new Blasts();
    this.shakeRandom = createRandom(DEBRIS_SEED);
    this.shake = 0;
    this.ticks = 0;
    this.slowmoFrames = 0;
    this.hintFor = null;
    this.wasHintShown = false;
    this.outcome = OUTCOME.playing;
    this.scored = { roaches: 0, fort: 0 };
    this.floatingNumbers = new FloatingNumbers();
    this.pauseMenu = null;
    this.loadNext();
  }

  // Esc or the pause button opens the pause menu; while it is open, nothing else runs. Returns
  // whether the game is paused.
  private updatePause(): boolean {
    const { input } = this.context;
    if (this.pauseMenu) {
      if (input.wasPressed("pause")) this.pauseMenu = null;
      else this.pauseMenu.update(input);
      return true;
    }
    const wantsPause =
      input.wasPressed("pause") ||
      (input.wasPressed("pointer") && isOnPauseButton(input.pointer));
    if (!wantsPause) return false;
    this.pauseMenu = new PauseMenu({
      resume: () => (this.pauseMenu = null),
      restart: () => this.start(),
      levels: () =>
        this.context.scenes.change(new LevelSelectScene(this.context)),
    });
    return true;
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
    if (event?.type === "ability") this.useAbility();
    if (event?.type === "settled") this.endShot();
  }

  // Only the launched ingredient is in flight when its ability fires.
  private useAbility(): void {
    this.flying[0]?.useAbility({
      spawn: (projectile) => this.flying.push(projectile),
      blast: (blast) => this.blasts.request(blast),
    });
    this.flying = this.flying.filter((ingredient) => ingredient.alive);
  }

  private launch(pull: Vec, velocity: Vec): void {
    const ingredient = this.loaded;
    if (!ingredient) return;
    ingredient.launch(sub(this.level.launcher, pull), velocity);
    this.flying.push(ingredient);
    this.loaded = null;
  }

  // The spent ingredients go with a puff, so they never prop up a fort later. Then the next one
  // loads, unless the roaches are gone (a win) or the queue is empty (a loss).
  private endShot(): void {
    for (const ingredient of this.flying) this.removeIngredient(ingredient);
    this.flying = [];
    if (this.roaches.length === 0) return;
    if (!this.loadNext()) this.end(OUTCOME.lost);
  }

  private end(outcome: Outcome): void {
    this.outcome = outcome;
    this.resultDelay = RESULT_DELAY_FRAMES;
  }

  private loadNext(): boolean {
    const kind = this.queue.shift();
    this.hintFor = null;
    if (!kind) return false;
    this.loaded = new Ingredient(this.world, kind);
    this.shot.load();
    this.showHintFor(kind);
    return true;
  }

  // Place n brings the n-th ingredient, the one its levels teach.
  private showHintFor(kind: IngredientKind): void {
    const place = placeNumber(this.level.id);
    if (this.wasHintShown || kind !== INGREDIENT_KINDS[place - 1]) return;
    this.hintFor = kind;
    this.wasHintShown = true;
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
    this.lastImpacts = impacts;
    for (const impact of impacts) this.endFlightOnHit(impact);
    if (this.ticks > LEVEL_START_GRACE)
      applyImpactDamage(impacts, this.destructibles);
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
      position.x > this.level.width + KILL_MARGIN
    );
  }

  // Bodies at 0 hp leave the world only now, after the step, never inside it.
  // A destroyed pressure cooker queues its blast for the next tick.
  private removeDestroyed(): void {
    const hadRoaches = this.roaches.length > 0;
    this.blocks = this.prune(this.blocks, "fort", (block) => {
      const blast = block.blastOnDestroy();
      if (blast) this.blasts.request(blast);
      return DEBRIS_LOOKS[block.material];
    });
    this.roaches = this.prune(
      this.roaches,
      "roaches",
      () => DEBRIS_LOOKS.roach,
    );
    if (hadRoaches && this.roaches.length === 0)
      this.slowmoFrames = FINAL_SLOWMO_FRAMES;
  }

  // Each destroyed target scores and leaves debris. onDestroyed runs while its body is still in
  // the world, and returns the debris.
  private prune<T extends Destructible>(
    targets: T[],
    part: ScorePart,
    onDestroyed: (target: T) => DebrisLook,
  ): T[] {
    for (const target of targets) {
      if (target.alive) continue;
      const position = this.world.position(target.body);
      this.debris.burst(position, onDestroyed(target));
      this.addScore(part, target.score, position);
      this.world.remove(target.body);
      this.destructibles.delete(target.body);
    }
    return targets.filter((target) => target.alive);
  }

  private addScore(part: ScorePart, points: number, at: Vec): void {
    if (points === 0) return;
    this.scored = { ...this.scored, [part]: this.scored[part] + points };
    this.floatingNumbers.spawn(points, at);
  }

  private runBlasts(): void {
    for (const blast of this.blasts.run(this.world, this.destructibles)) {
      this.debris.burst(blast.at, DEBRIS_LOOKS.blast);
      this.addShake(blast.strength);
    }
  }

  private updateEffects(): void {
    for (const target of this.destructibles.values()) target.update();
    this.debris.update();
    this.floatingNumbers.update();
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
    if (!isShotOut) this.end(OUTCOME.won);
  }

  private countDownToResult(): void {
    if (this.outcome === OUTCOME.playing) return;
    this.resultDelay--;
    if (this.resultDelay <= 0) this.showResult();
  }

  // A won level pays for the ingredients left, and saves its best score and hats.
  private showResult(): void {
    const { progress, scenes } = this.context;
    const isWon = this.outcome === OUTCOME.won;
    const breakdown = {
      ...this.scored,
      ingredientsLeft: isWon ? this.ingredientsLeft().length : 0,
    };
    const score = totalScore(breakdown);
    const hats = isWon ? hatsFor(score, this.level.stars) : 0;
    const recorded = isWon
      ? progress.recordWin(this.level.id, score, hats)
      : undefined;
    scenes.change(
      new ResultScene(this.context, {
        level: this.level,
        isWon,
        breakdown,
        hats,
        best: recorded?.best ?? progress.of(this.level.id),
        isFirstWin: recorded?.isFirstWin ?? false,
      }),
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
      return sub(this.level.launcher, this.shot.pull);

    const t = this.shot.loadProgress;
    const start = {
      x: this.level.launcher.x - HOP_START_OFFSET,
      y: -this.loadedRadius(),
    };
    return {
      x: lerp(start.x, this.level.launcher.x, t),
      y:
        lerp(start.y, this.level.launcher.y, t) -
        Math.sin(t * Math.PI) * HOP_HEIGHT,
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
        sub(this.level.launcher, this.shot.pull),
        this.shot.aimVelocity,
      ),
      PREVIEW_DOTS * PREVIEW_DOT_SPACING,
    );
  }

  private ingredientsLeft(): ProjectileKind[] {
    return this.loaded ? [this.loaded.kind, ...this.queue] : [...this.queue];
  }
}
