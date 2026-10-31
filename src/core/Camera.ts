import type p5 from "p5";
import {
  CAMERA_EASE,
  CANVAS_WIDTH,
  FLOOR_SCREEN_Y,
  MAX_ZOOM,
  MIN_ZOOM,
} from "../config";
import { clamp, lerp, type Vec } from "./math";

export interface CameraView {
  // Level px at the screen's left edge.
  readonly left: number;
  readonly zoom: number;
}

// What the level's camera shows: a left edge and a zoom, eased toward a target each tick. The
// floor's line stays at FLOOR_SCREEN_Y, so zooming scales the level around it and the counter
// never leaves the bottom of the screen.
export class Camera {
  readonly levelWidth: number;
  #view: CameraView;
  #target: CameraView;

  constructor(levelWidth: number, start: CameraView) {
    this.levelWidth = levelWidth;
    this.#view = this.clamped(start);
    this.#target = this.#view;
  }

  get view(): CameraView {
    return this.#view;
  }

  get visibleWidth(): number {
    return CANVAS_WIDTH / this.#view.zoom;
  }

  // The view that puts a level x at the screen's center.
  centeredOn(x: number, zoom = this.#target.zoom): CameraView {
    return { left: x - CANVAS_WIDTH / zoom / 2, zoom };
  }

  aimAt(target: CameraView): void {
    this.#target = this.clamped(target);
  }

  // Jumps at once, for the player's own pan and zoom.
  jumpTo(view: CameraView): void {
    this.#view = this.clamped(view);
    this.#target = this.#view;
  }

  update(): void {
    this.#view = {
      left: lerp(this.#view.left, this.#target.left, CAMERA_EASE),
      zoom: lerp(this.#view.zoom, this.#target.zoom, CAMERA_EASE),
    };
  }

  toLevel(screen: Vec): Vec {
    const { left, zoom } = this.#view;
    return {
      x: left + screen.x / zoom,
      y: (screen.y - FLOOR_SCREEN_Y) / zoom,
    };
  }

  // Everything drawn after this is in level space.
  applyTo(p: p5): void {
    const { left, zoom } = this.#view;
    p.translate(0, FLOOR_SCREEN_Y);
    p.scale(zoom);
    p.translate(-left, 0);
  }

  // Inside the level when it is wider than the view; centered on it when it is narrower.
  private clamped(view: CameraView): CameraView {
    const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM);
    const visible = CANVAS_WIDTH / zoom;
    const left =
      visible >= this.levelWidth
        ? (this.levelWidth - visible) / 2
        : clamp(view.left, 0, this.levelWidth - visible);
    return { left, zoom };
  }
}
