export interface Vec {
  readonly x: number;
  readonly y: number;
}

export const ZERO: Vec = { x: 0, y: 0 };

export function vec(x: number, y: number): Vec {
  return { x, y };
}

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec, factor: number): Vec {
  return { x: v.x * factor, y: v.y * factor };
}

export function length(v: Vec): number {
  return Math.hypot(v.x, v.y);
}

export function distance(a: Vec, b: Vec): number {
  return length(sub(a, b));
}

// The zero vector has no direction, so it stays zero instead of becoming NaN.
export function normalize(v: Vec): Vec {
  const size = length(v);
  return size === 0 ? ZERO : scale(v, 1 / size);
}

export function rotate(v: Vec, angle: number): Vec {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

export function clampLength(v: Vec, max: number): Vec {
  const size = length(v);
  return size <= max ? v : scale(v, max / size);
}

// The pull points from the dragged ingredient back to the band's rest: the way it flies.
export function launchVelocity(pull: Vec, launchSpeed: number): Vec {
  return scale(pull, launchSpeed);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
