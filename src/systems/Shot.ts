import {
  GRAB_RADIUS,
  LAUNCH_SPEED,
  LOAD_FRAMES,
  MAX_PULL,
  MIN_PULL,
  SETTLE_FRAMES,
  SETTLE_TIMEOUT,
} from "../config";
import {
  ZERO,
  clampLength,
  distance,
  launchVelocity,
  length,
  sub,
  type Vec,
} from "../core/math";

export const SHOT = {
  loading: "loading",
  aiming: "aiming",
  flying: "flying",
  settling: "settling",
  spent: "spent",
} as const;
export type ShotState = (typeof SHOT)[keyof typeof SHOT];

export interface ShotInput {
  // Level px.
  pointer: Vec;
  wasPointerPressed: boolean;
  wasPointerReleased: boolean;
  wasAbilityPressed: boolean;
}

export type ShotEvent =
  // pull: where the ingredient was released, from the band's rest.
  | { type: "launch"; pull: Vec; velocity: Vec }
  | { type: "ability" }
  | { type: "settled" };

// What the shot needs from the world: whether everything has stopped moving.
export interface StillnessProbe {
  isStill(): boolean;
}

// One shot, from the hop into the band to the world settling. It decides when things happen;
// the scene does them, so the shot never sees the engine or p5.
export class Shot {
  #state: ShotState = SHOT.spent;
  // From the dragged ingredient back to the band's rest, in px.
  #pull: Vec = ZERO;
  private isGrabbed = false;
  // Ticks spent in the current phase: the hop while loading, the time since launch after it.
  private frames = 0;
  private stillFrames = 0;
  private readonly world: StillnessProbe;
  private readonly rest: Vec;

  constructor(world: StillnessProbe, rest: Vec) {
    this.world = world;
    this.rest = rest;
  }

  get state(): ShotState {
    return this.#state;
  }

  get pull(): Vec {
    return this.#pull;
  }

  // The pointer holds the ingredient in the band.
  get isGrabbing(): boolean {
    return this.isGrabbed;
  }

  // 0 to 1 through the hop into the band.
  get loadProgress(): number {
    return this.#state === SHOT.loading ? this.frames / LOAD_FRAMES : 1;
  }

  // The velocity a release would launch with right now.
  get aimVelocity(): Vec {
    return launchVelocity(this.#pull, LAUNCH_SPEED);
  }

  load(): void {
    this.#state = SHOT.loading;
    this.frames = 0;
    this.#pull = ZERO;
  }

  update(input: ShotInput): ShotEvent | undefined {
    switch (this.#state) {
      case SHOT.loading:
        return this.updateLoading();
      case SHOT.aiming:
        return this.updateAiming(input);
      case SHOT.flying:
        return this.updateFlying(input);
      case SHOT.settling:
        return this.updateSettling();
      case SHOT.spent:
        return undefined;
    }
  }

  // The ingredient hit something or left the level: its ability is gone.
  hit(): void {
    if (this.#state === SHOT.flying) this.#state = SHOT.settling;
  }

  private updateLoading(): undefined {
    this.frames++;
    if (this.frames >= LOAD_FRAMES) this.#state = SHOT.aiming;
    return undefined;
  }

  private updateAiming(input: ShotInput): ShotEvent | undefined {
    if (
      input.wasPointerPressed &&
      distance(input.pointer, this.rest) <= GRAB_RADIUS
    )
      this.isGrabbed = true;
    if (!this.isGrabbed) return undefined;

    this.#pull = clampLength(sub(this.rest, input.pointer), MAX_PULL);
    if (!input.wasPointerReleased) return undefined;
    return this.release();
  }

  private release(): ShotEvent | undefined {
    this.isGrabbed = false;
    const pull = this.#pull;
    const velocity = this.aimVelocity;
    this.#pull = ZERO;
    // A short pull is a change of mind: the ingredient stays in the band.
    if (length(pull) < MIN_PULL) return undefined;

    this.#state = SHOT.flying;
    this.frames = 0;
    this.stillFrames = 0;
    return { type: "launch", pull, velocity };
  }

  private updateFlying(input: ShotInput): ShotEvent | undefined {
    this.frames++;
    if (!input.wasAbilityPressed) return undefined;
    this.#state = SHOT.settling;
    return { type: "ability" };
  }

  private updateSettling(): ShotEvent | undefined {
    this.frames++;
    this.stillFrames = this.world.isStill() ? this.stillFrames + 1 : 0;
    if (this.stillFrames < SETTLE_FRAMES && this.frames < SETTLE_TIMEOUT)
      return undefined;
    this.#state = SHOT.spent;
    return { type: "settled" };
  }
}
