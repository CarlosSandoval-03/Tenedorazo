import type { PhysicalMaterial, ShapeDef } from "./physics/World";
import type { MaterialKind, ProjectileKind, RoachKind } from "./types";

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

// The self-collapse test: a level left alone this many ticks must not move more than the tolerance.
export const SETTLE_CHECK_FRAMES = 300;
export const SETTLE_TOLERANCE = 2;

// A blast pushes every dynamic body within its radius away from its center.
export interface BlastSpec {
  readonly radius: number;
  // The impulse at the center (mass × px/s), falling off to 0 at the radius.
  readonly strength: number;
}

export interface MaterialSpec extends PhysicalMaterial {
  // Infinity for a material that never breaks.
  readonly hp: number;
  // How much of an impact's or blast's damage this side takes.
  readonly fragility: number;
  // Scored when a block of it is destroyed.
  readonly score: number;
  // The blast it makes when destroyed, if it explodes.
  readonly blast?: BlastSpec;
}

// The damage at a blast's center, scaled by the falloff and the target's fragility.
export const BLAST_DAMAGE = 80;
export const POP_BLAST: BlastSpec = { radius: 128, strength: 2400 };
export const COOKER_BLAST: BlastSpec = { radius: 160, strength: 3000 };

export const MATERIALS: Readonly<Record<MaterialKind, MaterialSpec>> = {
  glass: {
    density: 0.0008,
    friction: 0.4,
    restitution: 0.1,
    hp: 10,
    fragility: 1.5,
    score: 100,
  },
  wood: {
    density: 0.0012,
    friction: 0.7,
    restitution: 0.05,
    hp: 80,
    fragility: 1,
    score: 200,
  },
  castIron: {
    density: 0.004,
    friction: 0.8,
    restitution: 0.02,
    hp: 200,
    fragility: 0.5,
    score: 500,
  },
  // Bounces everything that hits it, since Matter keeps a pair's larger restitution.
  jelly: {
    density: 0.0009,
    friction: 0.9,
    restitution: 0.9,
    hp: Infinity,
    fragility: 1,
    score: 0,
  },
  pressureCooker: {
    density: 0.002,
    friction: 0.6,
    restitution: 0.1,
    hp: 12,
    fragility: 1,
    score: 300,
    blast: COOKER_BLAST,
  },
};

// The static counter stone under every level.
export const COUNTER: PhysicalMaterial = {
  density: 0,
  friction: 0.9,
  restitution: 0,
};

export interface RoachSpec extends PhysicalMaterial {
  readonly hp: number;
  readonly fragility: number;
  readonly radius: number;
  readonly score: number;
}

const ROACH_BODY = { density: 0.001, friction: 0.8, restitution: 0.25 };
const ROACH_HP = 20;
// Squishy: a falling board is enough to squash a plain one.
const ROACH_FRAGILITY = 2;

export const ROACHES: Readonly<Record<RoachKind, RoachSpec>> = {
  roach: {
    ...ROACH_BODY,
    hp: ROACH_HP,
    fragility: ROACH_FRAGILITY,
    radius: 16,
    score: 1000,
  },
  capped: {
    ...ROACH_BODY,
    hp: ROACH_HP * 2,
    fragility: ROACH_FRAGILITY,
    radius: 16,
    score: 1500,
  },
  colander: {
    ...ROACH_BODY,
    hp: ROACH_HP * 4,
    fragility: ROACH_FRAGILITY,
    radius: 16,
    score: 2500,
  },
  queen: {
    ...ROACH_BODY,
    hp: ROACH_HP * 10,
    fragility: ROACH_FRAGILITY,
    radius: 32,
    score: 10000,
  },
};

// Each ingredient left at the end of a won level.
export const UNUSED_INGREDIENT_BONUS = 2000;

// Damage = max(0, impact − DAMAGE_THRESHOLD) × DAMAGE_SCALE × fragility; resting contact stays below.
export const DAMAGE_THRESHOLD = 60;
export const DAMAGE_SCALE = 0.1;
// Below these hp fractions a block shows cracked, then broken.
export const DAMAGE_STATES = { cracked: 0.66, broken: 0.33 } as const;
export const HIT_FLASH_FRAMES = 6;
// No damage while a fresh fort settles by a fraction of a pixel.
export const LEVEL_START_GRACE = 30;

// Screen shake: px per unit of the tick's largest impact, capped, decaying each tick.
export const SHAKE_SCALE = 0.004;
export const SHAKE_MAX = 8;
export const SHAKE_DECAY = 0.85;

// The last roach going slows time to FINAL_SLOWMO for FINAL_SLOWMO_FRAMES ticks.
export const FINAL_SLOWMO = 0.3;
export const FINAL_SLOWMO_FRAMES = 45;

// Visual-only debris: how many pieces a break throws, and how long they last.
export const DEBRIS_PIECES = 10;
export const DEBRIS_FRAMES = 50;
export const DEBRIS_SPEED = 260;
export const DEBRIS_SEED = 20261030;

// Nothing smaller is ever created: a pea.
export const MIN_BODY_SIZE = 12;

export interface IngredientSpec extends PhysicalMaterial {
  readonly shape: ShapeDef;
}

export const INGREDIENTS: Readonly<Record<ProjectileKind, IngredientSpec>> = {
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
  pea: {
    shape: { type: "circle", radius: 6 },
    density: 0.004,
    friction: 0.5,
    restitution: 0.3,
  },
};

// The abilities. The pod splits into PEA_COUNT peas fanned PEA_SPREAD radians apart.
export const PEA_COUNT = 3;
export const PEA_SPREAD = 0.18;
// px/s added along the chili's heading.
export const CHILI_BOOST = 700;
// rad/s, clockwise: the wheel rolls on toward the fort when it lands.
export const CHEESE_SPIN = 28;

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
  // Each place's backdrop: quiet, dark, and never a material's or a roach's hue. shape is the
  // far furniture, near the closer one; accent is the one lit thing (a window, a flame, a lamp).
  backdrops: {
    counter: {
      wall: "#14232a",
      grout: "#11201f",
      shape: "#1b2e36",
      near: "#203740",
      accent: "#2c4a63",
      glow: "#e8d9a8",
    },
    sink: {
      wall: "#132629",
      grout: "#0f1f22",
      shape: "#1a3236",
      near: "#1f3b40",
      accent: "#2b4e5e",
      glow: "#cfe3e8",
    },
    stove: {
      wall: "#221c1c",
      grout: "#1a1616",
      shape: "#2b2423",
      near: "#342b29",
      accent: "#3a2f2c",
      glow: "#6fa8ff",
    },
    fridge: {
      wall: "#16262d",
      grout: "#132026",
      shape: "#1d313a",
      near: "#243b45",
      accent: "#2f4b57",
      glow: "#d8f1ff",
    },
    pantry: {
      wall: "#1f1a16",
      grout: "#181411",
      shape: "#2a221c",
      near: "#332a22",
      accent: "#3b3027",
      glow: "#e8c98a",
    },
  },
  counter: { top: "#8a817a", body: "#6b6460" },
  outline: "#0e1417",
  glass: { fill: "#bfe9f0", shine: "#ffffff" },
  wood: { fill: "#c98b45", grain: "#8a5a2b" },
  castIron: { fill: "#2b2d31", rim: "#7d8790" },
  jelly: { fill: "#e0336b", shine: "#ff8fb2" },
  steel: { fill: "#b9c2c9", rim: "#7f8a92", valve: "#d6403a" },
  roach: { shell: "#6a3fb5", highlight: "#b79cf0", eyes: "#ffd84a" },
  cap: { fill: "#d6403a", rim: "#8e2a22" },
  crown: { fill: "#f5c242", jewel: "#5fd0c8" },
  crack: "#0e1417",
  flash: "#ffffff",
  fork: { metal: "#c4ccd2", band: "#c8423c" },
  ingredients: {
    outline: "#fff1cc",
    meatball: "#8b4a2b",
    peaPod: "#5fae3c",
    chili: "#e8641c",
    cheese: "#f2c037",
    popcorn: "#fff4d6",
    pea: "#7cc24a",
    detail: "#3b2a1f",
    eyeWhite: "#ffffff",
  },
  preview: "#fff1cc",
  ui: { text: "#fff1cc", dim: "#8a9a9e", gold: "#f5c242", panel: "#0e1a1f" },
} as const;

// The camera: how fast it eases toward its target (per tick), the zoom range, the pan and zoom
// steps, how far ahead of a flight it looks (px), and the opening pan from the fort (ticks).
export const CAMERA_EASE = 0.08;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1;
export const PAN_SPEED = 12;
export const ZOOM_STEP = 0.1;
export const FOLLOW_AHEAD = 160;
export const INTRO_HOLD_FRAMES = 70;

export const KEYS = {
  pointer: ["Pointer"],
  ability: ["Space"],
  restart: ["KeyR"],
  pause: ["Escape"],
  back: ["Escape"],
  previous: ["ArrowUp", "ArrowLeft"],
  next: ["ArrowDown", "ArrowRight"],
  confirm: ["Enter", "Space"],
  panLeft: ["KeyA"],
  panRight: ["KeyD"],
  zoomIn: ["KeyW", "WheelUp"],
  zoomOut: ["KeyS", "WheelDown"],
} as const;

// The run: ticks between the level's end and its Result, between hats, and per Ending line.
export const RESULT_DELAY_FRAMES = 60;
export const HAT_REVEAL_FRAMES = 30;
export const ENDING_LINE_FRAMES = 150;

export type Action = keyof typeof KEYS;
