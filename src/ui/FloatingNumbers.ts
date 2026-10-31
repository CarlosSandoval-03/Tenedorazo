import type p5 from "p5";
import { PALETTE } from "../config";
import type { Vec } from "../core/math";

const LIFE_FRAMES = 60;
const RISE_PER_FRAME = 0.8;
const TEXT_SIZE = 20;

interface FloatingNumber {
  readonly text: string;
  position: Vec;
  age: number;
}

// Score numbers that float up from what was destroyed, and fade.
export class FloatingNumbers {
  private numbers: FloatingNumber[] = [];

  spawn(value: number, at: Vec): void {
    this.numbers.push({ text: `+${value}`, position: at, age: 0 });
  }

  update(): void {
    for (const number of this.numbers) {
      number.age++;
      number.position = {
        x: number.position.x,
        y: number.position.y - RISE_PER_FRAME,
      };
    }
    this.numbers = this.numbers.filter((number) => number.age < LIFE_FRAMES);
  }

  draw(p: p5): void {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TEXT_SIZE);
    p.strokeWeight(4);
    for (const number of this.numbers) {
      const alpha = 255 * (1 - number.age / LIFE_FRAMES);
      const fill = p.color(PALETTE.ui.text);
      const outline = p.color(PALETTE.outline);
      fill.setAlpha(alpha);
      outline.setAlpha(alpha);
      p.fill(fill);
      p.stroke(outline);
      p.text(number.text, number.position.x, number.position.y);
    }
  }
}
