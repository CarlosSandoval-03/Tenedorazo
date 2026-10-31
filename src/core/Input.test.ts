import { describe, expect, it } from "vitest";
import { Input, POINTER_CODE } from "./Input";

function setup() {
  const canvas = new EventTarget();
  const window = new EventTarget();
  const input = new Input({
    canvas,
    window,
    toLogical: (client) => ({ x: client.x / 2, y: client.y / 2 }),
    bindings: { fire: ["Space", POINTER_CODE], pause: ["Escape"] },
  });
  return { canvas, window, input };
}

function pointerEvent(type: string, clientX: number, clientY: number): Event {
  return Object.assign(new Event(type), { clientX, clientY });
}

function keyEvent(type: string, code: string): Event {
  return Object.assign(new Event(type, { cancelable: true }), { code });
}

describe("Input", () => {
  it("presses on the canvas and releases on the window", () => {
    const { canvas, window, input } = setup();

    canvas.dispatchEvent(pointerEvent("pointerdown", 100, 40));

    expect(input.wasPressed("fire")).toBe(true);
    expect(input.isDown("fire")).toBe(true);
    expect(input.pointer).toEqual({ x: 50, y: 20 });

    input.endFrame();
    window.dispatchEvent(pointerEvent("pointerup", 300, 40));

    expect(input.wasPressed("fire")).toBe(false);
    expect(input.wasReleased("fire")).toBe(true);
    expect(input.isDown("fire")).toBe(false);
    expect(input.pointer).toEqual({ x: 150, y: 20 });
  });

  it("keeps a press until the frame ends", () => {
    const { window, input } = setup();

    window.dispatchEvent(keyEvent("keydown", "Escape"));

    expect(input.wasPressed("pause")).toBe(true);
    input.endFrame();
    expect(input.wasPressed("pause")).toBe(false);
    expect(input.isDown("pause")).toBe(true);
  });

  it("ignores key repeat and prevents the default of bound keys only", () => {
    const { window, input } = setup();
    const bound = keyEvent("keydown", "Space");
    const unbound = keyEvent("keydown", "KeyQ");

    window.dispatchEvent(bound);
    input.endFrame();
    window.dispatchEvent(keyEvent("keydown", "Space"));
    window.dispatchEvent(unbound);

    expect(input.wasPressed("fire")).toBe(false);
    expect(bound.defaultPrevented).toBe(true);
    expect(unbound.defaultPrevented).toBe(false);
  });

  it("releases everything on blur", () => {
    const { window, input } = setup();
    window.dispatchEvent(keyEvent("keydown", "Escape"));

    window.dispatchEvent(new Event("blur"));

    expect(input.isDown("pause")).toBe(false);
    expect(input.wasReleased("pause")).toBe(true);
  });
});
