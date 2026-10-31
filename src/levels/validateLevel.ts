import {
  BLOCK_UNIT,
  MATERIALS,
  ROACHES,
  UNUSED_INGREDIENT_BONUS,
} from "../config";
import { INGREDIENT_KINDS, type LevelDef } from "../types";

// Touching is fine on the grid; anything deeper than this is an overlap (px).
const OVERLAP_TOLERANCE = 0.5;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Piece {
  name: string;
  box: Box;
  isGround: boolean;
}

// Every problem with a level, each naming the level and the body; empty when it is fine.
export function validateLevel(def: LevelDef): string[] {
  const pieces = piecesOf(def);
  const problems = [
    ...checkContent(def),
    ...checkBounds(def, pieces),
    ...checkOverlaps(pieces),
    ...checkSizes(def),
    ...checkHats(def),
    ...checkQueue(def),
  ];
  return problems.map((problem) => `${def.id}: ${problem}`);
}

// The score for destroying everything with one ingredient used: no level can give more.
export function maxScore(def: LevelDef): number {
  const blocks = def.blocks.reduce(
    (sum, block) => sum + MATERIALS[block.material].score,
    0,
  );
  const roaches = def.roaches.reduce(
    (sum, roach) => sum + ROACHES[roach.kind].score,
    0,
  );
  const spare = Math.max(0, def.ingredients.length - 1);
  return blocks + roaches + spare * UNUSED_INGREDIENT_BONUS;
}

function checkContent(def: LevelDef): string[] {
  const problems: string[] = [];
  if (def.roaches.length === 0) problems.push("no roaches");
  if (def.ingredients.length === 0) problems.push("no ingredients");
  return problems;
}

function checkBounds(def: LevelDef, pieces: readonly Piece[]): string[] {
  return pieces
    .filter((piece) => !piece.isGround)
    .filter(
      ({ box }) =>
        box.left < -OVERLAP_TOLERANCE ||
        box.right > def.width + OVERLAP_TOLERANCE ||
        box.bottom > OVERLAP_TOLERANCE,
    )
    .map((piece) => `${piece.name} is outside the level or below the floor`);
}

// An AABB check is enough on the grid, where nothing is rotated.
function checkOverlaps(pieces: readonly Piece[]): string[] {
  const problems: string[] = [];
  pieces.forEach((a, i) => {
    for (const b of pieces.slice(i + 1))
      if (overlaps(a.box, b.box)) problems.push(`${a.name} overlaps ${b.name}`);
  });
  return problems;
}

function checkSizes(def: LevelDef): string[] {
  return def.blocks
    .map((block, i) => ({ block, i }))
    .filter(
      ({ block }) =>
        block.width % BLOCK_UNIT !== 0 || block.height % BLOCK_UNIT !== 0,
    )
    .map(({ i }) => `block ${i} is not sized on the ${BLOCK_UNIT} px grid`);
}

function checkHats(def: LevelDef): string[] {
  const [twoHats, threeHats] = def.stars;
  const problems: string[] = [];
  if (twoHats >= threeHats) problems.push("the hat thresholds don't rise");
  if (threeHats > maxScore(def))
    problems.push(
      `the 3-hat score is above the best possible ${maxScore(def)}`,
    );
  return problems;
}

// Place n has unlocked the first n ingredients.
function checkQueue(def: LevelDef): string[] {
  const place = Number.parseInt(def.id, 10);
  const unlocked: readonly string[] = INGREDIENT_KINDS.slice(0, place);
  return def.ingredients
    .filter((kind) => !unlocked.includes(kind))
    .map((kind) => `${kind} isn't unlocked in place ${place}`);
}

function piecesOf(def: LevelDef): Piece[] {
  return [
    ...def.ground.map((ground, i) => ({
      name: `ground ${i}`,
      box: boxAround(ground.x, ground.y, ground.width, ground.height),
      isGround: true,
    })),
    ...def.blocks.map((block, i) => ({
      name: `block ${i} (${block.material})`,
      box: boxAround(block.x, block.y, block.width, block.height),
      isGround: false,
    })),
    ...def.roaches.map((roach, i) => {
      const diameter = ROACHES[roach.kind].radius * 2;
      return {
        name: `roach ${i} (${roach.kind})`,
        box: boxAround(roach.x, roach.y, diameter, diameter),
        isGround: false,
      };
    }),
  ];
}

function boxAround(x: number, y: number, width: number, height: number): Box {
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function overlaps(a: Box, b: Box): boolean {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > OVERLAP_TOLERANCE && height > OVERLAP_TOLERANCE;
}
