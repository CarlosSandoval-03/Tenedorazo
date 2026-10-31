import {
  CANVAS_WIDTH,
  FOLLOW_AHEAD,
  INTRO_HOLD_FRAMES,
  PAN_SPEED,
  ROACHES,
  ZOOM_STEP,
  type Action,
} from "../config";
import { Camera, type CameraView } from "../core/Camera";
import type { Input } from "../core/Input";
import type { Vec } from "../core/math";
import type { LevelDef } from "../types";
import { SHOT, type ShotState } from "./Shot";

export interface Situation {
  shotState: ShotState;
  // The launched ingredient's x while it flies.
  flightX: number | undefined;
  // Whether the pointer is pulling the band, so a drag aims instead of panning.
  isGrabbing: boolean;
}

interface Drag {
  from: Vec;
  view: CameraView;
}

// Decides what the camera frames each tick. A wide level opens on its fort and pans back to the
// fork; the flight is followed, the fort framed while it settles, then the view returns to the
// fork. While aiming, the player can pan (drag, A / D) and zoom (wheel, W / S); their framing
// holds until the next launch.
export class CameraDirector {
  readonly camera: Camera;
  private readonly fortCenterX: number;
  private introFrames: number;
  private isPlayerFraming = false;
  private drag: Drag | null = null;

  constructor(level: LevelDef) {
    this.fortCenterX = fortCenterOf(level);
    const isWide = level.width > CANVAS_WIDTH;
    this.introFrames = isWide ? INTRO_HOLD_FRAMES : 0;
    this.camera = new Camera(level.width, { left: 0, zoom: 1 });
    if (isWide) this.camera.jumpTo(this.camera.centeredOn(this.fortCenterX));
  }

  update(input: Input<Action>, situation: Situation): void {
    if (this.introFrames > 0) this.introFrames--;
    if (input.wasPressed("pointer")) this.introFrames = 0;
    if (isAiming(situation.shotState))
      this.applyPlayerFraming(input, situation);
    if (!this.isPlayerFraming) this.camera.aimAt(this.target(situation));
    this.camera.update();
  }

  // A launch hands the framing back to the director.
  onLaunch(): void {
    this.isPlayerFraming = false;
    this.drag = null;
  }

  private target(situation: Situation): CameraView {
    const home = { left: 0, zoom: this.camera.view.zoom };
    if (this.introFrames > 0) return this.camera.centeredOn(this.fortCenterX);
    if (situation.shotState === SHOT.flying && situation.flightX !== undefined)
      return this.camera.centeredOn(situation.flightX + FOLLOW_AHEAD);
    if (situation.shotState === SHOT.settling)
      return this.camera.centeredOn(this.fortCenterX);
    return home;
  }

  private applyPlayerFraming(input: Input<Action>, situation: Situation): void {
    this.dragPan(input, situation);
    const { left, zoom } = this.camera.view;
    let pan = 0;
    if (input.isDown("panLeft")) pan -= PAN_SPEED / zoom;
    if (input.isDown("panRight")) pan += PAN_SPEED / zoom;
    if (pan !== 0) this.frame({ left: left + pan, zoom });
    if (input.wasPressed("zoomIn")) this.zoomBy(ZOOM_STEP);
    if (input.wasPressed("zoomOut")) this.zoomBy(-ZOOM_STEP);
  }

  // A drag that doesn't pull the band moves the view with the pointer.
  private dragPan(input: Input<Action>, situation: Situation): void {
    if (input.wasPressed("pointer") && !situation.isGrabbing)
      this.drag = { from: input.pointer, view: this.camera.view };
    if (!input.isDown("pointer") || situation.isGrabbing) {
      this.drag = null;
      return;
    }
    if (!this.drag) return;
    const { from, view } = this.drag;
    const moved = (input.pointer.x - from.x) / view.zoom;
    if (moved !== 0) this.frame({ left: view.left - moved, zoom: view.zoom });
  }

  // Zooms around the screen's center.
  private zoomBy(step: number): void {
    const { left, zoom } = this.camera.view;
    const centerX = left + this.camera.visibleWidth / 2;
    this.frame(this.camera.centeredOn(centerX, zoom + step));
  }

  private frame(view: CameraView): void {
    this.isPlayerFraming = true;
    this.camera.jumpTo(view);
  }
}

function isAiming(state: ShotState): boolean {
  return state === SHOT.loading || state === SHOT.aiming;
}

// The middle of everything the roaches built, by x.
function fortCenterOf(level: LevelDef): number {
  const edges = [
    ...level.blocks.flatMap(({ x, width }) => [x - width / 2, x + width / 2]),
    ...level.roaches.flatMap(({ x, kind }) => [
      x - ROACHES[kind].radius,
      x + ROACHES[kind].radius,
    ]),
  ];
  return (Math.min(...edges) + Math.max(...edges)) / 2;
}
