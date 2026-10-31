import type p5 from "p5";
import { CANVAS_WIDTH, PALETTE, type Action } from "../config";
import type { Input } from "../core/Input";
import type { Vec } from "../core/math";

const CORNER_RADIUS = 12;
const FOCUS_WEIGHT = 4;
const LABEL_SIZE = 24;

export interface ButtonSpec {
  // Read at draw time, so a language switch shows at once.
  readonly label: () => string;
  readonly center: Vec;
  readonly width: number;
  readonly height: number;
  readonly onPress: () => void;
  readonly isEnabled?: boolean;
  // Extra content under the label, such as a level's hats.
  readonly drawContent?: (p: p5, center: Vec) => void;
}

// A set of buttons the pointer and the keyboard both drive: hover or arrows move the focus, a
// click (press and release on the same button) or Enter presses it.
export class Menu {
  private readonly buttons: readonly ButtonSpec[];
  private focus: number;
  private pressedIndex = -1;

  constructor(buttons: readonly ButtonSpec[]) {
    this.buttons = buttons;
    this.focus = Math.max(0, buttons.findIndex(isEnabled));
  }

  update(input: Input<Action>): void {
    const hovered = this.indexAt(input.pointer);
    if (hovered >= 0) this.focus = hovered;
    if (input.wasPressed("pointer")) this.pressedIndex = hovered;
    if (input.wasReleased("pointer")) {
      const isClick = hovered >= 0 && hovered === this.pressedIndex;
      this.pressedIndex = -1;
      if (isClick) return this.press(hovered);
    }
    if (input.wasPressed("next")) this.moveFocus(1);
    if (input.wasPressed("previous")) this.moveFocus(-1);
    if (input.wasPressed("confirm")) this.press(this.focus);
  }

  draw(p: p5): void {
    this.buttons.forEach((button, i) =>
      drawButton(p, button, i === this.focus),
    );
  }

  private press(index: number): void {
    const button = this.buttons[index];
    if (button && isEnabled(button)) button.onPress();
  }

  // Skips disabled buttons, wrapping around.
  private moveFocus(step: 1 | -1): void {
    const count = this.buttons.length;
    for (let i = 1; i <= count; i++) {
      const index = (this.focus + step * i + count) % count;
      const button = this.buttons[index];
      if (!button || !isEnabled(button)) continue;
      this.focus = index;
      return;
    }
  }

  private indexAt(point: Vec): number {
    return this.buttons.findIndex(
      (button) =>
        isEnabled(button) &&
        Math.abs(point.x - button.center.x) <= button.width / 2 &&
        Math.abs(point.y - button.center.y) <= button.height / 2,
    );
  }
}

function isEnabled(button: ButtonSpec): boolean {
  return button.isEnabled ?? true;
}

// A disabled button is drawn dim and without its content.
function drawButton(p: p5, button: ButtonSpec, isFocused: boolean): void {
  const { center, width, height } = button;
  const isOn = isEnabled(button);
  p.push();
  p.rectMode(p.CENTER);
  p.fill(PALETTE.ui.panel);
  p.stroke(isFocused && isOn ? PALETTE.ui.gold : PALETTE.ui.dim);
  p.strokeWeight(isFocused && isOn ? FOCUS_WEIGHT : 2);
  p.rect(center.x, center.y, width, height, CORNER_RADIUS);

  p.noStroke();
  p.fill(isOn ? PALETTE.ui.text : PALETTE.ui.dim);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(LABEL_SIZE);
  const labelY = button.drawContent ? center.y - height / 4 : center.y;
  p.text(button.label(), center.x, labelY);
  if (isOn) button.drawContent?.(p, center);
  p.pop();
}

// The centers of `count` items of `width` in a row, `gap` apart, centered on the screen.
export function rowCenters(
  count: number,
  item: { width: number; gap: number; y: number },
): Vec[] {
  const rowWidth = count * item.width + (count - 1) * item.gap;
  const left = (CANVAS_WIDTH - rowWidth) / 2 + item.width / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: left + i * (item.width + item.gap),
    y: item.y,
  }));
}
