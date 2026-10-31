# Level Design

How a level is described, built, validated, and paced. Mechanics: [gameplay.md](gameplay.md). Physics: [physics.md](physics.md).

## Format

Levels are JSON in `src/levels/`, one file per level (`2-3.json`), typed by `LevelDef` in `types.ts` and checked by `validateLevel`. Coordinates are px in level space: `x` grows right from the level's left edge, `y` grows down, and the floor's top is `y = 0`, so everything standing on it has a negative `y`.

```ts
type MaterialKind = "glass" | "wood" | "castIron" | "jelly" | "pressureCooker";
type RoachKind = "roach" | "capped" | "colander" | "queen";
type IngredientKind = "meatball" | "peaPod" | "chili" | "cheese" | "popcorn";

interface LevelDef {
  id: string;                     // "2-3": place 2, level 3
  width: number;                  // px; the camera and the kill bounds clamp to it
  launcher: Vec;                  // the band's rest position
  ingredients: IngredientKind[];  // the queue, in launch order
  stars: [number, number];        // score for 2 and 3 hats
  ground: GroundDef[];            // static: floor, shelves, counter edges
  blocks: BlockDef[];
  roaches: RoachDef[];
}

interface GroundDef {
  x: number;                      // center
  y: number;
  width: number;
  height: number;
}

interface BlockDef {
  shape: "box" | "circle";
  material: MaterialKind;
  x: number;                      // center
  y: number;
  width: number;                  // circles use width as the diameter
  height: number;
  angle?: number;                 // radians
}

interface RoachDef {
  kind: RoachKind;
  x: number;
  y: number;
}
```

## Building levels

**Decision (open):** hand-written JSON first, which is enough for the first place. An in-game editor behind `?debug=true` (place, move, rotate, change material, copy the JSON) only if hand-writing gets slow; until then, the debug panel copies the current level as JSON.

Sizes and positions snap to a grid of `BLOCK_UNIT` px (16), so pieces line up and touch exactly: overlapping bodies push apart on the first step and wreck the fort before the player shoots.

## Validation

`validateLevel(def)` is a pure function that returns a list of problems, and a test runs it over every level file:
- at least one roach and one ingredient;
- every body inside `width` and above the floor;
- no two bodies overlap (an AABB check is enough on the grid);
- every block is sized in whole `BLOCK_UNIT`s;
- the hat thresholds rise, and the 3-hat score is reachable (below the score for destroying everything);
- the ingredient queue only uses ingredients unlocked by that place.

And one simulation test per level: load it, step `SETTLE_CHECK_FRAMES` with no shot, and check that nothing took damage and nothing moved more than `SETTLE_TOLERANCE` px. A fort that collapses by itself is a broken level.

## Difficulty curve

- Each place opens with a level that teaches its new ingredient or material with almost no risk, then two that combine it with what came before, then a harder closer.
- Difficulty rises through structure (height, protection, roaches tucked behind cast iron) and a shorter queue, never through tougher physics numbers.
- Every level is winnable with one ingredient to spare; check it by playing it.
- Each place is built around its new thing: the sink's tall glass towers want the pea pod's spread; the stove's cast iron needs the chili's speed on its thin wooden joints; the fridge's jelly walls are rolled under by the cheese; the pantry's pressure cookers chain-react under the popcorn.

## The MVP levels

Five levels, `1-1.json` to `5-1.json`, one per place. Each is 960 px wide (one screen, so no camera), with the fork at `(160, −96)` and the fort between `x = 528` and `x = 928`, at most 240 px tall.

| Level | Place | Queue | The fort | Roaches |
| ----- | ----- | ----- | -------- | ------- |
| 1-1 | Counter | 3 meatballs | A wooden table with a glass on top; a glass with a plate beside it | 3 |
| 2-1 | Sink | 2 pea pods, 1 meatball | Three towers of glasses and plates, two of them two storeys | 3 |
| 3-1 | Stove | 3 chilis | Cast-iron pillars under a wooden board, a pan on top; a roach behind a thin wooden wall in front of the fort | 3, one capped, on the board beside the pan, so it falls when the board breaks |
| 4-1 | Fridge | 2 cheese wheels, 1 chili | A wall of jelly, a wooden table, a jelly at the back | 3, one with a colander on the table |
| 5-1 | Pantry | 2 popcorns, 1 chili, 1 cheese | The Queen's palace: cast-iron walls, a board, glasses, three pressure cookers | The Queen, one capped, one roach |

Each level was checked winnable with one ingredient to spare by a search over simulated shots (angles, pulls, and ability timings). The hat thresholds were set from the MVP's score values ([implementation-plan.md › Step 6](implementation-plan.md#step-6-the-run-070--mvp)): 2 hats for the roaches and half of the fort, 3 hats for the roaches, most of the fort, and one ingredient to spare.

## Readability

- A level is at most about 1600 px wide: the fastest launch reaches about 1400 px past the fork. Wider levels open with the camera on the fort and pan back to the fork.
- Every roach is at least partly visible from the fork.
