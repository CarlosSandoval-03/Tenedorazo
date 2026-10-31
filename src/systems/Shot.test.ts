import { describe, expect, it } from "vitest";
import {
  LAUNCH_SPEED,
  LOAD_FRAMES,
  MAX_PULL,
  SETTLE_FRAMES,
  SETTLE_TIMEOUT,
} from "../config";
import type { Vec } from "../core/math";
import { SHOT, Shot, type ShotEvent, type ShotInput } from "./Shot";

const REST = { x: 160, y: -96 };

function setup(isStill = () => true) {
  const shot = new Shot({ isStill }, REST);
  shot.load();
  for (let i = 0; i < LOAD_FRAMES; i++) shot.update(idle(REST));
  return shot;
}

function idle(pointer: Vec): ShotInput {
  return {
    pointer,
    wasPointerPressed: false,
    wasPointerReleased: false,
    wasAbilityPressed: false,
  };
}

function drag(shot: Shot, to: Vec): ShotEvent | undefined {
  shot.update({ ...idle(REST), wasPointerPressed: true });
  shot.update(idle(to));
  return shot.update({ ...idle(to), wasPointerReleased: true });
}

describe("Shot", () => {
  it("hops into the band, then aims", () => {
    const shot = new Shot({ isStill: () => true }, REST);
    shot.load();

    for (let i = 0; i < LOAD_FRAMES - 1; i++) shot.update(idle(REST));
    expect(shot.state).toBe(SHOT.loading);
    shot.update(idle(REST));

    expect(shot.state).toBe(SHOT.aiming);
  });

  it("launches opposite to the drag, clamped to the max pull", () => {
    const shot = setup();

    const event = drag(shot, { x: REST.x - 500, y: REST.y });

    expect(event).toEqual({
      type: "launch",
      pull: { x: MAX_PULL, y: 0 },
      velocity: { x: MAX_PULL * LAUNCH_SPEED, y: 0 },
    });
    expect(shot.state).toBe(SHOT.flying);
  });

  it("cancels a short pull and keeps aiming", () => {
    const shot = setup();

    const event = drag(shot, { x: REST.x - 4, y: REST.y });

    expect(event).toBeUndefined();
    expect(shot.state).toBe(SHOT.aiming);
  });

  it("ignores a press far from the band", () => {
    const shot = setup();
    const far = { x: REST.x + 300, y: REST.y };

    shot.update({ ...idle(far), wasPointerPressed: true });
    const event = shot.update({ ...idle(far), wasPointerReleased: true });

    expect(event).toBeUndefined();
  });

  it("uses the ability once, then settles", () => {
    const shot = setup();
    drag(shot, { x: REST.x - 80, y: REST.y });

    const event = shot.update({ ...idle(REST), wasAbilityPressed: true });
    const again = shot.update({ ...idle(REST), wasAbilityPressed: true });

    expect(event).toEqual({ type: "ability" });
    expect(again).toBeUndefined();
    expect(shot.state).toBe(SHOT.settling);
  });

  it("settles once the world stays still long enough", () => {
    const shot = setup();
    drag(shot, { x: REST.x - 80, y: REST.y });
    shot.hit();

    const events = Array.from({ length: SETTLE_FRAMES }, () =>
      shot.update(idle(REST)),
    );

    expect(events.at(-1)).toEqual({ type: "settled" });
    expect(shot.state).toBe(SHOT.spent);
  });

  it("settles on the timeout when the world never stops", () => {
    const shot = setup(() => false);
    drag(shot, { x: REST.x - 80, y: REST.y });
    shot.hit();

    let settledAt = 0;
    for (let i = 1; i <= SETTLE_TIMEOUT && !settledAt; i++)
      if (shot.update(idle(REST))) settledAt = i;

    expect(settledAt).toBe(SETTLE_TIMEOUT);
  });
});
