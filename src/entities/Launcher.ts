import type p5 from "p5";
import { PALETTE } from "../config";
import type { Vec } from "../core/math";
import { Entity } from "./Entity";
import type { Ingredient } from "./Ingredient";

// The fork, in px from the band's rest point.
const PRONG_GAP = 36;
const TINE_WIDTH = 6;
const PRONG_ABOVE_REST = 14;
// The inner tines are shorter than the outer prongs, which hold the band.
const INNER_TINE_DROP = 6;
const CROSSBAR_HEIGHT = 8;
const NECK_BELOW_REST = 34;
const NECK_LENGTH = 18;
const HANDLE_WIDTH = 14;
const SHINE_ALPHA = 140;
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

  // A table fork standing on its handle: the handle down to the counter's top (level y = 0), a
  // neck widening into the crossbar, two outer prongs for the band and two shorter inner tines.
  private drawFork(p: p5): void {
    const { x, y } = this.rest;
    const crossbarY = y + NECK_BELOW_REST;
    const neckBottom = crossbarY + NECK_LENGTH;
    const halfSpan = PRONG_GAP / 2 + TINE_WIDTH / 2;

    p.rectMode(p.CORNERS);
    p.stroke(PALETTE.outline);
    p.strokeWeight(OUTLINE_WEIGHT);
    p.fill(PALETTE.fork.metal);
    p.rect(
      x - HANDLE_WIDTH / 2,
      neckBottom - 4,
      x + HANDLE_WIDTH / 2,
      0,
      7,
      7,
      2,
      2,
    );
    p.quad(
      x - HANDLE_WIDTH / 2,
      neckBottom,
      x + HANDLE_WIDTH / 2,
      neckBottom,
      x + halfSpan,
      crossbarY,
      x - halfSpan,
      crossbarY,
    );
    for (const tineX of [
      -PRONG_GAP / 2,
      -PRONG_GAP / 6,
      PRONG_GAP / 6,
      PRONG_GAP / 2,
    ]) {
      const isInner = Math.abs(tineX) < PRONG_GAP / 2;
      const top = y - PRONG_ABOVE_REST + (isInner ? INNER_TINE_DROP : 0);
      p.rect(
        x + tineX - TINE_WIDTH / 2,
        top,
        x + tineX + TINE_WIDTH / 2,
        crossbarY,
        3,
        3,
        0,
        0,
      );
    }
    p.rect(
      x - halfSpan,
      crossbarY - CROSSBAR_HEIGHT,
      x + halfSpan,
      crossbarY,
      2,
    );
    this.drawShine(p, neckBottom);
  }

  private drawShine(p: p5, neckBottom: number): void {
    const shine = p.color(PALETTE.flash);
    shine.setAlpha(SHINE_ALPHA);
    p.stroke(shine);
    p.strokeWeight(2);
    const x = this.rest.x - HANDLE_WIDTH / 4;
    p.line(x, neckBottom + 6, x, -10);
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
