import type p5 from "p5";
import {
  DEBRIS_FRAMES,
  DEBRIS_PIECES,
  DEBRIS_SPEED,
  GRAVITY,
  PALETTE,
  TICK_MS,
} from "../config";
import type { Vec } from "../core/math";
import { createRandom, randomBetween } from "../core/random";
import type { MaterialKind } from "../types";

const TICK_S = TICK_MS / 1000;
const MAX_SPIN = 12;

type PieceShape = "shard" | "splinter" | "chunk" | "puff";

export interface DebrisLook {
  readonly shape: PieceShape;
  readonly colors: readonly string[];
  readonly size: number;
}

// What each thing leaves behind when it breaks or goes.
export const DEBRIS_LOOKS: Readonly<
  Record<MaterialKind | "roach" | "puff", DebrisLook>
> = {
  glass: {
    shape: "shard",
    colors: [PALETTE.glass.fill, PALETTE.glass.shine],
    size: 8,
  },
  wood: {
    shape: "splinter",
    colors: [PALETTE.wood.fill, PALETTE.wood.grain],
    size: 12,
  },
  castIron: {
    shape: "chunk",
    colors: [PALETTE.castIron.fill, PALETTE.castIron.rim],
    size: 7,
  },
  roach: {
    shape: "chunk",
    colors: [PALETTE.roach.shell, PALETTE.roach.highlight],
    size: 6,
  },
  puff: { shape: "puff", colors: [PALETTE.ui.text], size: 10 },
};

interface Piece {
  position: Vec;
  velocity: Vec;
  angle: number;
  spin: number;
  life: number;
  readonly shape: PieceShape;
  readonly color: string;
  readonly size: number;
}

// Visual-only pieces: they fly and fade, and never touch the physics world.
export class Debris {
  private pieces: Piece[] = [];
  private readonly random: () => number;

  constructor(seed: number) {
    this.random = createRandom(seed);
  }

  burst(at: Vec, look: DebrisLook): void {
    for (let i = 0; i < DEBRIS_PIECES; i++)
      this.pieces.push(this.piece(at, look));
  }

  update(): void {
    for (const piece of this.pieces) {
      piece.velocity = {
        x: piece.velocity.x,
        y: piece.velocity.y + GRAVITY * TICK_S,
      };
      piece.position = {
        x: piece.position.x + piece.velocity.x * TICK_S,
        y: piece.position.y + piece.velocity.y * TICK_S,
      };
      piece.angle += piece.spin * TICK_S;
      piece.life--;
    }
    this.pieces = this.pieces.filter((piece) => piece.life > 0);
  }

  draw(p: p5): void {
    p.noStroke();
    for (const piece of this.pieces) {
      const color = p.color(piece.color);
      color.setAlpha((255 * piece.life) / DEBRIS_FRAMES);
      p.fill(color);
      p.push();
      p.translate(piece.position.x, piece.position.y);
      p.rotate(piece.angle);
      drawPiece(p, piece);
      p.pop();
    }
  }

  private piece(at: Vec, look: DebrisLook): Piece {
    const direction = randomBetween(this.random, -Math.PI, 0);
    const speed = randomBetween(this.random, 0.3, 1) * DEBRIS_SPEED;
    // A puff drifts up instead of flying apart.
    const isPuff = look.shape === "puff";
    return {
      position: at,
      velocity: isPuff
        ? { x: Math.cos(direction) * speed * 0.2, y: -GRAVITY * 0.2 }
        : { x: Math.cos(direction) * speed, y: Math.sin(direction) * speed },
      angle: randomBetween(this.random, 0, Math.PI * 2),
      spin: randomBetween(this.random, -MAX_SPIN, MAX_SPIN),
      life: DEBRIS_FRAMES,
      shape: look.shape,
      color: look.colors[Math.floor(this.random() * look.colors.length)],
      size: look.size * randomBetween(this.random, 0.6, 1.2),
    };
  }
}

function drawPiece(p: p5, piece: Piece): void {
  const { size } = piece;
  if (piece.shape === "shard")
    p.triangle(0, -size / 2, size / 2, size / 2, -size / 2, size / 3);
  else if (piece.shape === "splinter") p.rect(-size / 2, -1.5, size, 3);
  else if (piece.shape === "chunk") p.rect(-size / 2, -size / 2, size, size);
  else p.circle(0, 0, size);
}
