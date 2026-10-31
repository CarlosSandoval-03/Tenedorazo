import type { PhysicalMaterial, ShapeDef } from "./physics/World";

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

// Nothing smaller is ever created: a pea.
export const MIN_BODY_SIZE = 12;

export type IngredientKind =
  | "meatball"
  | "peaPod"
  | "chili"
  | "cheese"
  | "popcorn";

export interface IngredientSpec extends PhysicalMaterial {
  readonly shape: ShapeDef;
}

export const INGREDIENTS: Readonly<Record<IngredientKind, IngredientSpec>> = {
  meatball: {
    shape: { type: "circle", radius: 14 },
    density: 0.003,
    friction: 0.6,
    restitution: 0.3,
  },
  peaPod: {
    shape: { type: "box", width: 36, height: 18 },
    density: 0.002,
    friction: 0.5,
    restitution: 0.2,
  },
  chili: {
    shape: { type: "box", width: 32, height: 14 },
    density: 0.0035,
    friction: 0.4,
    restitution: 0.1,
  },
  cheese: {
    shape: { type: "circle", radius: 20 },
    density: 0.005,
    friction: 1,
    restitution: 0.1,
  },
  popcorn: {
    shape: { type: "circle", radius: 10 },
    density: 0.0015,
    friction: 0.5,
    restitution: 0.4,
  },
};

// Matter has no rolling resistance: after its first hit, air drag is what stops an ingredient rolling.
export const LANDED_FRICTION_AIR = 0.02;

// The shot. Pulls in px; LAUNCH_SPEED turns px of pull into px/s of launch.
export const MAX_PULL = 96;
export const MIN_PULL = 12;
export const LAUNCH_SPEED = 12;
export const MAX_LAUNCH_SPEED = MAX_PULL * LAUNCH_SPEED;
// How close to the band a press must start to grab the ingredient (px).
export const GRAB_RADIUS = 48;
// The hop from the ground into the band.
export const LOAD_FRAMES = 20;

// The aim preview: PREVIEW_DOTS dots, one every PREVIEW_DOT_SPACING ticks of flight.
export const PREVIEW_DOTS = 14;
export const PREVIEW_DOT_SPACING = 3;

// A shot is settled after SETTLE_FRAMES still ticks in a row, or SETTLE_TIMEOUT ticks after launch.
export const SETTLE_FRAMES = 30;
export const SETTLE_TIMEOUT = 600;

// Bodies below KILL_Y, or KILL_MARGIN past the level's sides, are removed (level px).
export const KILL_Y = 240;
export const KILL_MARGIN = 120;

export const PALETTE = {
  room: { wall: "#14232a", grout: "#11201f" },
  counter: { top: "#8a817a", body: "#6b6460" },
  outline: "#0e1417",
  glass: { fill: "#bfe9f0", shine: "#ffffff" },
  wood: { fill: "#c98b45", grain: "#8a5a2b" },
  castIron: { fill: "#2b2d31", rim: "#7d8790" },
  fork: { metal: "#c4ccd2", shade: "#8b969e", band: "#c8423c" },
  ingredients: {
    outline: "#fff1cc",
    meatball: "#8b4a2b",
    peaPod: "#5fae3c",
    chili: "#e8641c",
    cheese: "#f2c037",
    popcorn: "#fff4d6",
  },
  preview: "#fff1cc",
  ui: { text: "#fff1cc", dim: "#8a9a9e", gold: "#f5c242", panel: "#0e1a1f" },
} as const;

export const KEYS = {
  pointer: ["Pointer"],
  ability: ["Space"],
} as const;

export type Action = keyof typeof KEYS;
