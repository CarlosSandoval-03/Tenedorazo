import { DAMAGE_STATES, HIT_FLASH_FRAMES } from "../config";
import type { BodyHandle } from "../physics/World";
import { Entity } from "./Entity";

export const DAMAGE_STATE = {
  intact: "intact",
  cracked: "cracked",
  broken: "broken",
} as const;
export type DamageState = (typeof DAMAGE_STATE)[keyof typeof DAMAGE_STATE];

export interface Toughness {
  readonly hp: number;
  readonly fragility: number;
}

// Anything with a body that impacts can break: blocks and roaches.
export abstract class Destructible extends Entity {
  readonly body: BodyHandle;
  readonly maxHp: number;
  readonly fragility: number;
  hp: number;
  private flashFrames = 0;

  constructor(body: BodyHandle, toughness: Toughness) {
    super();
    this.body = body;
    this.maxHp = toughness.hp;
    this.hp = toughness.hp;
    this.fragility = toughness.fragility;
  }

  get isFlashing(): boolean {
    return this.flashFrames > 0;
  }

  damage(amount: number): void {
    if (amount <= 0) return;
    this.hp -= amount;
    this.flashFrames = HIT_FLASH_FRAMES;
    if (this.hp <= 0) this.alive = false;
  }

  damageState(): DamageState {
    const fraction = this.hp / this.maxHp;
    if (fraction < DAMAGE_STATES.broken) return DAMAGE_STATE.broken;
    if (fraction < DAMAGE_STATES.cracked) return DAMAGE_STATE.cracked;
    return DAMAGE_STATE.intact;
  }

  update(): void {
    if (this.flashFrames > 0) this.flashFrames--;
  }
}
