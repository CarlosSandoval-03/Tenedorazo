import { ZERO, type Vec } from "./math";

// The pointer and each wheel notch count as more keys, so a binding can mix them with keys.
export const POINTER_CODE = "Pointer";
export const WHEEL_UP_CODE = "WheelUp";
export const WHEEL_DOWN_CODE = "WheelDown";

export type Bindings<Action extends string> = Readonly<
  Record<Action, readonly string[]>
>;

interface InputOptions<Action extends string> {
  // Pointer presses start on the canvas; moves, releases, keys, and blur come from the window.
  canvas: EventTarget;
  window: EventTarget;
  // From the event's client px to the canvas's logical px.
  toLogical: (client: Vec) => Vec;
  bindings: Bindings<Action>;
}

// Pointer and keys as actions. Presses and releases are remembered until endFrame(), so a tick
// that runs after the event sees it even when no tick ran in the frame of the event.
export class Input<Action extends string> {
  #pointer: Vec = ZERO;
  private readonly bindings: Bindings<Action>;
  private readonly toLogical: (client: Vec) => Vec;
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();

  constructor(options: InputOptions<Action>) {
    this.bindings = options.bindings;
    this.toLogical = options.toLogical;
    this.listen(options.canvas, options.window);
  }

  // Logical canvas px.
  get pointer(): Vec {
    return this.#pointer;
  }

  isDown(action: Action): boolean {
    return this.bindings[action].some((code) => this.down.has(code));
  }

  wasPressed(action: Action): boolean {
    return this.bindings[action].some((code) => this.pressed.has(code));
  }

  wasReleased(action: Action): boolean {
    return this.bindings[action].some((code) => this.released.has(code));
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  private listen(canvas: EventTarget, window: EventTarget): void {
    canvas.addEventListener("pointerdown", (event) => {
      this.movePointer(event);
      this.press(POINTER_CODE);
    });
    window.addEventListener("pointermove", (event) => this.movePointer(event));
    window.addEventListener("pointerup", (event) => {
      this.movePointer(event);
      this.release(POINTER_CODE);
    });
    canvas.addEventListener("wheel", (event) => this.onWheel(event), {
      passive: false,
    });
    window.addEventListener("keydown", (event) => this.onKey(event, true));
    window.addEventListener("keyup", (event) => this.onKey(event, false));
    window.addEventListener("blur", () => this.releaseAll());
  }

  private movePointer(event: Event): void {
    const client = clientPoint(event);
    if (client) this.#pointer = this.toLogical(client);
  }

  private onKey(event: Event, isDown: boolean): void {
    const code = keyCode(event);
    if (!code) return;
    if (this.isBound(code)) event.preventDefault();
    if (isDown) this.press(code);
    else this.release(code);
  }

  // A notch is a press and a release at once: it shows as pressed for one tick.
  private onWheel(event: Event): void {
    if (!("deltaY" in event) || typeof event.deltaY !== "number") return;
    event.preventDefault();
    const code = event.deltaY < 0 ? WHEEL_UP_CODE : WHEEL_DOWN_CODE;
    this.press(code);
    this.release(code);
  }

  private press(code: string): void {
    // A held key repeats keydown; only the first one is a press.
    if (this.down.has(code)) return;
    this.down.add(code);
    this.pressed.add(code);
  }

  private release(code: string): void {
    if (!this.down.delete(code)) return;
    this.released.add(code);
  }

  private releaseAll(): void {
    for (const code of this.down) this.released.add(code);
    this.down.clear();
  }

  private isBound(code: string): boolean {
    return Object.values<readonly string[]>(this.bindings).some((codes) =>
      codes.includes(code),
    );
  }
}

function clientPoint(event: Event): Vec | undefined {
  if (!("clientX" in event) || !("clientY" in event)) return undefined;
  const { clientX, clientY } = event;
  if (typeof clientX !== "number" || typeof clientY !== "number")
    return undefined;
  return { x: clientX, y: clientY };
}

function keyCode(event: Event): string | undefined {
  if (!("code" in event) || typeof event.code !== "string") return undefined;
  return event.code;
}
