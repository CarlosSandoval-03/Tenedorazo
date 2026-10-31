import type { PhysicalMaterial } from "./physics/World";

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const TICK_MS = 1000 / 60;
// Past this many ticks in one frame, the owed ticks are dropped: the game slows down instead.
export const MAX_STEPS_PER_FRAME = 4;

// px/s², pointing down.
export const GRAVITY = 1000;
// Matter updates per tick: halving the step is what keeps fast bodies from tunneling.
export const SUBSTEPS = 2;
// Raised from Matter's 6 and 4 until every level stands still on its own.
export const POSITION_ITERATIONS = 20;
export const VELOCITY_ITERATIONS = 16;

// A body slower than both counts as still (px/s, rad/s).
export const SETTLE_SPEED = 6;
export const SETTLE_SPIN = 0.1;

// Where the floor's top (level y = 0) sits on the screen.
export const FLOOR_SCREEN_Y = CANVAS_HEIGHT - 64;

export const BLOCK_UNIT = 16;

export type SurfaceKind = "glass" | "wood" | "castIron" | "counter";

export const MATERIALS: Readonly<Record<SurfaceKind, PhysicalMaterial>> = {
  glass: { density: 0.0008, friction: 0.4, restitution: 0.1 },
  wood: { density: 0.0012, friction: 0.7, restitution: 0.05 },
  castIron: { density: 0.004, friction: 0.8, restitution: 0.02 },
  counter: { density: 0, friction: 0.9, restitution: 0 },
};

export const PALETTE = {
  room: { wall: "#14232a", grout: "#11201f" },
  counter: { top: "#8a817a", body: "#6b6460" },
  outline: "#0e1417",
  glass: { fill: "#bfe9f0", shine: "#ffffff" },
  wood: { fill: "#c98b45", grain: "#8a5a2b" },
  castIron: { fill: "#2b2d31", rim: "#7d8790" },
  ui: { text: "#fff1cc", dim: "#8a9a9e", gold: "#f5c242", panel: "#0e1a1f" },
} as const;

export const KEYS = {
  pointer: ["Pointer"],
} as const;

export type Action = keyof typeof KEYS;
