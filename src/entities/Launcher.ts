import type p5 from "p5";
import { PALETTE } from "../config";
import type { Vec } from "../core/math";
import { Entity } from "./Entity";
import type { Ingredient } from "./Ingredient";

// The fork, in px from the band's rest point.
const PRONG_GAP = 36;
const PRONG_WIDTH = 8;
const PRONG_ABOVE_REST = 14;
const NECK_BELOW_REST = 34;
const HANDLE_WIDTH = 12;
const OUTLINE_WEIGHT = 3;
const BAND_WEIGHT = 5;

export interface LoadedIngredient {
  ingredient: Ingredient;
  // Where it sits: the rest point, a pulled point, or along the hop into the band.
  position: Vec;
}

// The fork slingshot: a handle down to the counter, two prongs, and the rubber band between them.
export class Launcher extends Entity {
  readonly rest: Vec;
  // Null while nothing sits in the band.
  private loaded: LoadedIngredient | null = null;

  constructor(rest: Vec) {
    super();
    this.rest = rest;
  }

  // The scene, which owns the queue, says each tick what sits in the band and where.
  hold(loaded: LoadedIngredient | null): void {
    this.loaded = loaded;
  }

  // The band's back half goes behind the ingredient and its front half over it.
  draw(p: p5): void {
    this.drawFork(p);
    const loaded = this.loaded;
    if (!loaded) {
      this.drawBand(p, this.prongTip(-1), this.prongTip(1));
      return;
    }
    this.drawBand(p, this.prongTip(-1), loaded.position);
    loaded.ingredient.drawAt(p, loaded.position, 0);
    this.drawBand(p, this.prongTip(1), loaded.position);
  }

  private drawFork(p: p5): void {
    const { x, y } = this.rest;
    const neckY = y + NECK_BELOW_REST;

    p.rectMode(p.CORNERS);
    p.stroke(PALETTE.outline);
    p.strokeWeight(OUTLINE_WEIGHT);
    p.fill(PALETTE.fork.metal);
    // The handle runs down to the counter's top (level y = 0).
    p.rect(x - HANDLE_WIDTH / 2, neckY, x + HANDLE_WIDTH / 2, 0);
    p.rect(x - PRONG_GAP / 2, neckY - PRONG_WIDTH, x + PRONG_GAP / 2, neckY);
    for (const side of [-1, 1] as const) {
      const tip = this.prongTip(side);
      p.rect(
        tip.x - PRONG_WIDTH / 2,
        y - PRONG_ABOVE_REST,
        tip.x + PRONG_WIDTH / 2,
        neckY,
      );
    }
  }

  private drawBand(p: p5, from: Vec, to: Vec): void {
    p.stroke(PALETTE.fork.band);
    p.strokeWeight(BAND_WEIGHT);
    p.line(from.x, from.y, to.x, to.y);
  }

  private prongTip(side: -1 | 1): Vec {
    return { x: this.rest.x + (side * PRONG_GAP) / 2, y: this.rest.y };
  }
}
