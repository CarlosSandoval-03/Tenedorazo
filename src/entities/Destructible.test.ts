import type p5 from "p5";
import { describe, expect, it } from "vitest";
import { HIT_FLASH_FRAMES } from "../config";
import { BodyHandle } from "../physics/World";
import { DAMAGE_STATE, Destructible } from "./Destructible";

class Target extends Destructible {
  draw(_p: p5): void {}
}

function target(hp = 100): Target {
  return new Target(new BodyHandle(), { hp, fragility: 1, score: 0 });
}

describe("Destructible", () => {
  it("cracks, breaks, and dies as it loses hp", () => {
    const block = target();

    expect(block.damageState()).toBe(DAMAGE_STATE.intact);
    block.damage(50);
    expect(block.damageState()).toBe(DAMAGE_STATE.cracked);
    block.damage(30);
    expect(block.damageState()).toBe(DAMAGE_STATE.broken);
    expect(block.alive).toBe(true);
    block.damage(20);
    expect(block.alive).toBe(false);
  });

  it("flashes for a few ticks on a hit, and not on zero damage", () => {
    const block = target();

    block.damage(0);
    expect(block.isFlashing).toBe(false);
    block.damage(1);
    for (let i = 0; i < HIT_FLASH_FRAMES - 1; i++) block.update();
    expect(block.isFlashing).toBe(true);
    block.update();

    expect(block.isFlashing).toBe(false);
  });

  it("never breaks with infinite hp", () => {
    const jelly = target(Infinity);

    jelly.damage(1e9);

    expect(jelly.alive).toBe(true);
    expect(jelly.damageState()).toBe(DAMAGE_STATE.intact);
    expect(jelly.isFlashing).toBe(true);
  });
});
