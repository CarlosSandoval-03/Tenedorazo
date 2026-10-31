# Implementation Plan

This document says **what** to build in each step, **how the pieces fit together**, and **how to tell when a step is finished**. The design comes from the other documents in `docs/` (overview: [README.md](README.md)). Where they leave a gap, this plan fills it with a proposal, marked **Decision**, collected in [Decisions](#decisions). An open decision can still change before you build the step that depends on it.

**The goal is an MVP as soon as possible:** all of the gameplay (five ingredients, five materials, four roaches) in **five levels, one per place**, on a single screen each, with flat p5 shapes, no sound, and the smallest flow that holds a run together. Everything else waits in [After the MVP](#after-the-mvp).

Every step ends with something playable and a version bump ([technical.md › Git](technical.md#git)).

| Step | Delivers | Version | Status |
| ---- | -------- | ------- | ------ |
| 0 | Scaffold: Vite, TypeScript, p5, Matter.js, hooks, CI and deploy; a box falling on a floor | `0.1.0` | Done |
| 1 | Physics sandbox: `World`, the fixed tick, a fort that stands still, debug draw | `0.2.0` | Done |
| 2 | The shot: the fork, pull, aim preview, launch, settle, the meatball | `0.3.0` | Done |
| 3 | Damage: impulses to hp, damage states, roaches, win and lose, restart, HUD | `0.4.0` | Done |
| 4 | Levels as data: loader, validation, the self-collapse test, level 1-1 from JSON | `0.5.0` | Done |
| 5 | Abilities and kitchen materials: the other four ingredients, jelly, pressure cookers, armored roaches and the Queen; levels 2-1 to 5-1 | `0.6.0` | Done |
| 6 | The run: Title, Level select, Result, Ending, score and hats, saved progress, pause | `0.7.0` | Done |
| — | **MVP**: the five levels playable from the Title to the Ending, deployed | `0.7.0` | Done (deploy pending the first push) |
| 7 | Visible hats: the hat bar in the HUD, the score breakdown in the Result | `0.8.0` | Done |
| 8 | Camera: levels wider than one screen, the opening pan, following the flight, pan and zoom | `0.9.0` | Next |
| 9 | The counter in full: the Place select and levels 1-2 to 1-4 | `0.10.0` | — |
| 10 | Look: a night kitchen per place with parallax, richer materials, ingredients, and roaches | `0.11.0` | — |

---

## Before you start

- Runtime conventions, architecture, rendering, git, and CI: [technical.md](technical.md).
- The simulation and its rules: [physics.md](physics.md).
- Mechanics and controls: [gameplay.md](gameplay.md). Level format: [level-design.md](level-design.md).
- The engine is **Matter.js**; how the code works around its weak points is in [physics.md](physics.md).
- The five MVP levels already exist in `src/levels/` (`1-1.json` to `5-1.json`), checked for overlaps, support, bounds, and hat thresholds. Their tuning happens in step 5, once they can be played.

---

## Step 0: Scaffold (`0.1.0`)

**Goal:** the toolchain works end to end, from a commit to the game deployed on GitHub Pages.

### Files

| File | In this step |
| ---- | ------------ |
| `.githooks/`, `.github/workflows/ci.yml`, `.prettierrc`, `.gitignore`, `pnpm-workspace.yaml`, `tsconfig.json` | **Already there.** The same setup as the previous project, with this project's commit scopes; the release zip takes the repository's name. |
| `package.json` | `"type": "module"`, `"private": true`, `"version": "0.1.0"`, `packageManager: "pnpm@12.3.4"`, `engines.node: ">=22.12"`. Scripts: `dev` (`vite`), `build` (`tsc && vite build --base=./`), `preview`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `prepare` (`git config core.hooksPath .githooks \|\| true`). Dev dependencies: `typescript`, `vite`, `vitest` at the versions in [technical.md › Stack](technical.md#stack); `@types/matter-js`; dependencies: `p5` and `matter-js`, exact. |
| `LICENSE` | PolyForm Noncommercial 1.0.0; CI copies it into the release zip. |
| `README.md` | What the game is, and `pnpm install`, `pnpm dev`. |
| `index.html`, `src/style.css` | A `#game` frame; the canvas letterboxed and centered on a dark page. |
| `src/main.ts` | Creates the p5 instance in `#game`, a 960 × 540 canvas; temporarily, one box falling onto a floor at a fixed 60 Hz, drawn as a rectangle. Step 1 replaces the body of this with the `SceneManager`. |
| `src/config.ts` | `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `TICK_MS`, `GRAVITY`, `SUBSTEPS`. |
| `src/core/display.ts` | `fitCanvas()`: the largest scale that fits the window, set as the canvas's CSS size only. |

### Done when
- [ ] `pnpm dev` shows a box falling and resting on the floor.
- [ ] `pnpm typecheck`, `pnpm test` (no tests yet: `vitest run --passWithNoTests` until step 1), and `pnpm build` pass.
- [ ] A commit with a bad message is rejected; a commit that doesn't typecheck is rejected.
- [ ] A push to `main` passes CI. The tag `v0.1.0` deploys the page to GitHub Pages and creates a release with the zip.

---

## Step 1: Physics sandbox (`0.2.0`)

**Goal:** the final architecture with a stable fort and no gameplay yet.

### Files

| File | In this step |
| ---- | ------------ |
| `core/Scene.ts`, `core/SceneManager.ts` (+ test) | The scene interface and the fixed tick ([physics.md › The step](physics.md#the-step)). The test drives `frame(ms)` with fake times: 60, 75, 144, and 30 Hz. |
| `core/Input.ts` (+ test) | Pointer and keys ([technical.md › Runtime conventions](technical.md#runtime-conventions)): `pointer` (logical screen px), `isDown(action)`, `wasPressed(action)`, `wasReleased(action)`, `endFrame()`. Tested with a plain `EventTarget`. |
| `core/math.ts` (+ test) | `Vec` helpers: `add`, `sub`, `scale`, `length`, `normalize`, `rotate`, `clampLength`. |
| `physics/World.ts` (+ test) | The Matter wrapper (below). |
| `entities/Entity.ts`, `entities/Block.ts` | `Block` holds a `BodyHandle` and its material, and draws itself from the body's pose. |
| `scenes/GameScene.ts` | Builds the floor and a hard-coded test fort; steps the world; draws. |
| `config.ts` | `MATERIALS` (density, friction, restitution for glass, wood, and cast iron), `COUNTER` (the static ground), `PALETTE`, `FLOOR_SCREEN_Y`, solver iterations, `MAX_STEPS_PER_FRAME`, `SETTLE_SPEED`, `SETTLE_SPIN`. |
| `debug/` | `?debug=true` only: `1` toggles body outlines, still bodies dimmed; `8` + click pushes the body under the pointer. |

### Specification

**World** — the only module that sees the engine:

```ts
type ShapeDef =
  | { type: "box"; width: number; height: number }
  | { type: "circle"; radius: number };

interface BodyDef {
  isStatic: boolean;
  shape: ShapeDef;
  position: Vec;              // px, center
  angle?: number;             // radians
  material: PhysicalMaterial; // { density, friction, restitution }
  velocity?: Vec;             // px/s, at creation
  frictionAir?: number;
}

class World {
  createBody(def: BodyDef): BodyHandle;
  remove(body: BodyHandle): void;
  step(): void;                       // one 1/60 s tick, SUBSTEPS updates
  position(body: BodyHandle): Vec;    // px
  angle(body: BodyHandle): number;
  velocity(body: BodyHandle): Vec;    // px/s
  isStill(): boolean;                 // every dynamic body under SETTLE_SPEED and SETTLE_SPIN
}
```

- `BodyHandle` is opaque: an object the rest of the code can keep, compare, and use as a `Map` key, never open.
- Removals requested during a step (there are none yet) are deferred to after it.
- The test: a box dropped on a static floor comes to rest at the right height (within 1 px) and `isStill()` turns true.

**The fixed level view.** **Decision:** in the MVP every level fits one 960 px screen and the view never moves, so there is no camera: `GameScene` translates its drawing by `(0, FLOOR_SCREEN_Y)` once, and converts the pointer the same way. Panning and zoom come after the MVP.

**Drawing.** Flat shapes from `PALETTE`, a dark outline, no images ([art-direction.md › Style](art-direction.md#style)).

### Done when
- [ ] The test fort (10–15 blocks of glass, wood, and cast iron, built on the 16 px grid) stands for 60 s without drifting, jittering, or sinking.
- [ ] With debug draw on, the whole fort shows still within a few seconds.
- [ ] Pushing a block in debug mode makes the fort fall believably.
- [ ] No file outside `physics/` imports the engine (search the imports).
- [ ] The game runs at the same speed on a 60 Hz and a 144 Hz screen.

---

## Step 2: The shot (`0.3.0`)

**Goal:** fling a meatball at the fort.

### Files

| File | In this step |
| ---- | ------------ |
| `entities/Launcher.ts` | The fork: two prongs and the band, drawn from the band's rest point to the pulled ingredient. |
| `entities/Ingredient.ts` | A kind, a body once launched, `useAbility()` (a no-op for the meatball). |
| `systems/Shot.ts` (+ test) | The state machine (below). |
| `core/math.ts` (+ test) | `launchVelocity(pull)`. |
| `physics/World.ts` (+ test) | `predictFlight(def, ticks)` ([physics.md › The aim preview](physics.md#the-aim-preview)); `takeImpacts()` already, so the shot knows the ingredient's first hit (step 3 turns impacts into damage). |
| `ui/AimPreview.ts` | Draws every `PREVIEW_DOT_SPACING`-th predicted position as a dot. |
| `config.ts` | `INGREDIENTS` (shape, size, density, friction, restitution per kind), `MAX_PULL`, `MIN_PULL`, `LAUNCH_SPEED`, `PREVIEW_DOTS`, `PREVIEW_DOT_SPACING`, `SETTLE_TIMEOUT`, `KILL_Y`. |

### Specification

**The shot's states** follow the diagram in [gameplay.md › The shot](gameplay.md#the-shot). `Shot` takes `{ isStill(): boolean }` and the pointer events; it never sees p5 or the engine.

- `loading`: `LOAD_FRAMES` frames for the hop into the band, then `aiming`.
- `aiming`: a press within `GRAB_RADIUS` of the band grabs the ingredient; the pull is `clampLength(rest − pointer, MAX_PULL)`. Release under `MIN_PULL` cancels and keeps aiming; otherwise launch with `launchVelocity(pull) = pull × LAUNCH_SPEED`, as the body's creation velocity, with `frictionAir: 0`.
- `flying`: a press or Space uses the ability once. The state moves to `settling` on the first impact, on the ability, or when the ingredient leaves the level.
- `settling`: wait until `isStill()` has held for `SETTLE_FRAMES` ticks in a row, or `SETTLE_TIMEOUT` frames since the launch. Then remove the spent ingredient and go back to `loading`, or report the queue as empty.

**Decision:** the preview is the engine's own flight in a scratch world ([physics.md › The aim preview](physics.md#the-aim-preview)), so the dots match the real flight exactly until the first contact. `World.test.ts` checks it: the same launch in an empty world, 60 ticks, within 0.01 px.

**Kill bounds:** any dynamic body below `KILL_Y` or past `[−KILL_MARGIN, width + KILL_MARGIN]` is removed after the step.

### Done when
- [ ] Drag, preview, release: the meatball follows the dots until it hits something.
- [ ] A meatball at full pull never passes through a 16 px plate (`config.test.ts` checks the speed bound).
- [ ] The shot settles, the spent meatball goes away, and the next one hops in.
- [ ] A short pull cancels; the meatball stays in the band.

---

## Step 3: Damage (`0.4.0`)

**Goal:** the fort breaks, the roaches die, and a level can be won or lost.

### Files

| File | In this step |
| ---- | ------------ |
| `physics/World.ts` | `takeImpacts(): Impact[]`, with `Impact = { a: BodyHandle; b: BodyHandle; strength: number; point: Vec }`, recorded in `collisionStart`, one per pair per tick, the largest ([physics.md › Impact damage](physics.md#impact-damage)). |
| `physics/damage.ts` (+ test) | `damageFromImpact(strength, fragility)`. |
| `entities/Destructible.ts` (+ test) | hp, `damage(amount)`, `damageState()` (intact, cracked, broken), the hit flash. |
| `entities/Block.ts`, `entities/Roach.ts` | Both extend `Destructible`; the roach draws its shell, eyes, and legs. |
| `systems/Debris.ts`, `core/random.ts` (+ test) | Visual-only shards, splinters, and chunks; a seeded mulberry32 generator. |
| `ui/HUD.ts` | The ingredients left, as small icons, top left. |
| `i18n/en.ts`, `es.ts`, `index.ts` (+ test) | Language detection and `t()`; the win and lose lines. |
| `config.ts` | `fragility` and `hp` per material, `ROACHES` (hp, radius, fragility), `DAMAGE_THRESHOLD`, `DAMAGE_SCALE`, `DAMAGE_STATES`, `HIT_FLASH_FRAMES`, `LEVEL_START_GRACE`, `SHAKE_MAX`, `FINAL_SLOWMO`. |

### Specification

- `GameScene.update()` order: input → shot → `world.step()` → apply impacts → remove the dead and the out-of-bounds → check the end. Each a named method.
- Damage rules: [physics.md › Impact damage](physics.md#impact-damage). Ingredients take none.
- **End of the level:** the last roach gone starts `FINAL_SLOWMO`, then waits for the world to settle and shows the win line; the last shot settled with roaches left shows the lose line. `R` restarts at any time, rebuilding the world from scratch.
- Screen shake: an offset from the largest impulse of the step, capped, decaying; drawn only, from `random.ts`.

### Done when
- [ ] The test fort takes no damage standing still, including while it loads.
- [ ] A light hit breaks glass and leaves cast iron intact; a roach crushed by a falling board dies.
- [ ] Blocks show cracks before they break, and flash on every hit.
- [ ] Clearing the roaches shows the win line in slow motion; running out shows the lose line.
- [ ] `R` rebuilds the level identically; the same shot twice gives the same result.

---

## Step 4: Levels as data (`0.5.0`)

**Goal:** `GameScene` plays any level file; level 1-1 is the first.

### Files

| File | In this step |
| ---- | ------------ |
| `types.ts` | `LevelDef` and its parts ([level-design.md › Format](level-design.md#format)). |
| `levels/index.ts` | Imports the JSON files (Vite imports JSON natively), narrows their kinds with `parseLevel`, and exports them, in order, as `LevelDef[]`; levels whose materials don't exist yet (4-1, 5-1) join in step 5. **Decision:** imported, not fetched, so a level is typed and bundled, and `validateLevel` checks it in the tests. |
| `levels/validateLevel.ts` (+ test) | The checks in [level-design.md › Validation](level-design.md#validation); the test runs them over every level. |
| `levels/settle.test.ts` | The self-collapse test over every level in `LEVELS`. |
| `levels/buildLevel.ts` | Creates the ground, blocks, and roaches in data order; returns the entities and the `Map<BodyHandle, Destructible>`. |
| `systems/impactDamage.ts` | `applyImpactDamage(impacts, targets)`: the one damage pass, shared by `GameScene` and the self-collapse test. |
| `scenes/GameScene.ts` | Takes a `LevelDef`; the hard-coded fort is gone. |
| `debug/` | `&level=1-1` opens a level directly; `9` copies the current level (as built) as JSON. |

### Done when
- [ ] Level 1-1 plays from its JSON, and is winnable with one meatball to spare.
- [ ] Editing a number in `1-1.json` changes the level after a reload, with no code change.
- [ ] A broken level (an overlap, a floating block) fails `pnpm test` with a message that names the level and the body.
- [ ] 1-1 passes the self-collapse test.

---

## Step 5: Abilities and kitchen materials (`0.6.0`)

**Goal:** every ingredient, material, and roach exists; all five levels are playable.

### Files

| File | In this step |
| ---- | ------------ |
| `entities/Ingredient.ts`, `entities/ingredientLooks.ts` | The four abilities, one method each, picked by kind; the pea is an ingredient kind without one. Each ingredient's look, with eyes. |
| `physics/World.ts` | `addVelocity(body, dv)`, `setAngularVelocity(body, w)`, `applyImpulse(body, impulse)`, `dynamicBodies()`. |
| `physics/blast.ts` (+ test) | `blastFalloff(distance, radius)`. |
| `systems/Blasts.ts` (+ test) | The blast queue: blasts requested in a step run after it; a pressure cooker destroyed by a blast queues its own for the next step. The test chains three cookers. |
| `entities/Block.ts` | Jelly: no hp, its wobble; pressure cooker: queues a blast when destroyed. |
| `entities/Roach.ts` | Capped, colander, and Queen looks. |
| `ui/HUD.ts`, `i18n/` | The one-line hint the first time a place's new ingredient loads. |
| `config.ts` | `PEA_COUNT`, `PEA_SPREAD`, `CHILI_BOOST`, `CHEESE_SPIN`, `POP_RADIUS`, `POP_STRENGTH`, `COOKER_BLAST_RADIUS`, `COOKER_BLAST_STRENGTH`, jelly and cooker in `MATERIALS`, the armored roaches and the Queen in `ROACHES`. |
| `debug/` | `&ingredients=popcorn,cheese` replaces a level's queue. |

### Specification

- What each ability does to the world: [physics.md › Abilities](physics.md#abilities). The ability runs on the frame of the press, between steps.
- The pea pod's peas are ingredients without an ability; the shot settles when all of them do.
- Blasts: [physics.md › Blasts](physics.md#blasts).
- **Tuning pass:** play 2-1 to 5-1 and adjust the numbers in `config.ts` first, the level files second, until each level is winnable with one ingredient to spare and its new ingredient is the obvious way to win it ([level-design.md › Difficulty curve](level-design.md#difficulty-curve)).

### Done when
- [ ] Each ability does what its row in [gameplay.md › Ingredients](gameplay.md#ingredients) says, and only once per flight.
- [ ] Jelly never breaks and bounces the meatball back; a pressure cooker set off by popcorn sets off its neighbor one step later.
- [ ] All five levels pass validation and the self-collapse test, with no skips left.
- [ ] Each level is winnable with one ingredient to spare.

---

## Step 6: The run (`0.7.0`) — MVP

**Goal:** the five levels as a game, from the Title to the Ending.

### Files

| File | In this step |
| ---- | ------------ |
| `systems/Scoring.ts` (+ test) | Score from destruction and the unused bonus; `hatsFor(score, stars)`. |
| `state.ts` (+ test) | Saved progress ([technical.md › Global state](technical.md#global-state)); `isUnlocked(levelIndex)` derived from it. |
| `assets.ts` (+ test) | Loads the font: the MVP's only asset. |
| `ui/Menu.ts`, `ui/Hat.ts`, `ui/FloatingNumbers.ts`, `ui/PauseMenu.ts` | A set of buttons driven by the pointer (hover, click) and the keyboard (arrows, Enter); the chef's hat; score numbers; the pause overlay (Resume, Restart, Levels). The win and lose banner of step 3 is gone: the Result scene replaces it. |
| `ui/HUD.ts` | Adds the score and a pause button, top right. |
| `scenes/TitleScene.ts` | Title, Play, Language. |
| `scenes/LevelSelectScene.ts` | Five buttons, one per place, with their hats; locked ones dimmed. |
| `scenes/ResultScene.ts` | Cleared or out of ingredients, the score, the hats one by one; Retry, Next (if won), Levels. |
| `scenes/EndingScene.ts` | After 5-1 is won the first time: the closing lines on screen, then the credits, then the Title. |
| `i18n/` | Every text of the flow. |

### Specification

- Scoring: [gameplay.md › Win, lose, and scoring](gameplay.md#win-lose-and-scoring). Values in `config.ts`: glass 100, wood 200, cast iron 500, pressure cooker 300, jelly 0; roach 1000, capped 1500, colander 2500, Queen 10000; unused ingredient 2000. The level files' hat thresholds were set from these values; if they change, the validation test flags a 3-hat score that is no longer reachable.
- **Decision:** the MVP has no Place select and no Intro: one Level select with five levels, named after their places.
- Unlocks: level `n` opens when level `n − 1` has been won at least once.

### Done when
- [ ] From a fresh browser: Title → Level select (only 1-1 open) → play → Result → Next, through 5-1, then the Ending.
- [ ] Reloading keeps the unlocks and the best hats; with storage blocked, the game still plays.
- [ ] Every text exists in both languages, and switching language in the Title changes them all.
- [ ] Esc pauses; Restart and Levels work from the pause.
- [ ] `v0.7.0` is tagged and deployed: the MVP is online.

---

## Step 7: Visible hats (`0.8.0`)

**Goal:** the player always knows what each hat asks for and how far away it is.

### Files

| File | In this step |
| ---- | ------------ |
| `systems/Scoring.ts` (+ test) | `ScoreBreakdown` (roaches, fort, ingredients left) and its total; `pointsToNextHat(score, stars)`. |
| `ui/ScoreBar.ts` | The hat bar under the score: the score so far, a lighter stretch for the bonus of the ingredients still left (what a win right now would add), and a hat mark at each threshold, gold once passed. |
| `scenes/GameScene.ts`, `scenes/ResultScene.ts` | The score kept by part; the Result lists the breakdown, shows each hat's requirement under it, and says how many points the next hat needed. |
| `i18n/` | The breakdown and requirement texts. |

### Done when
- [ ] While playing, the bar shows where the 2- and 3-hat thresholds are and how close the current score, with the ingredients left, is to each.
- [ ] A won level with 2 hats says how many points were missing for the third, and where the score came from.

---

## Step 8: Camera (`0.9.0`)

**Goal:** levels wider than one screen, framed so the player always sees what matters.

### Files

| File | In this step |
| ---- | ------------ |
| `core/Camera.ts` (+ test) | A left edge and a zoom, eased toward a target each tick; level ↔ screen conversion; clamped to the level's width. |
| `core/Input.ts` (+ test) | The wheel, as zoom in and out actions. |
| `scenes/GameScene.ts` | The camera's targets: the opening pan, the fork while aiming, the ingredient in flight, the fort while settling. Dragging away from the band, or A / D, pans; the wheel or W / S zooms. |
| `debug/` | Drawn through the camera. |
| `systems/CameraDirector.ts` | What the camera frames, from the shot's state and the player's pan and zoom; keeps `GameScene` to the game's rules. |
| `config.ts` | `INTRO_HOLD_FRAMES`, `CAMERA_EASE`, `MIN_ZOOM`, `MAX_ZOOM`, `PAN_SPEED`, `ZOOM_STEP`, `FOLLOW_AHEAD`; the pan and zoom keys in `KEYS`. |

### Specification

- **Decision:** the floor stays at `FLOOR_SCREEN_Y`; zooming scales the level around the floor's line, so the counter never leaves the bottom of the screen. The counter is drawn past the level's ends when the view is wider than the level.
- The player's pan and zoom hold until the next launch.

### Done when
- [ ] A level wider than the screen opens on its fort and pans back to the fork. (A launch tops out near 1150 px/s, which reaches about 1400 px past the fork on flat ground, so levels stay within about 1600 px unless a raised fork gives more range.)
- [ ] The flight is always on screen, and the collapse is framed while it settles.
- [ ] Every one-screen level plays exactly as before.

---

## Step 9: The counter in full (`0.10.0`)

**Goal:** the first place with its full curve: four levels.

### Files

| File | In this step |
| ---- | ------------ |
| `scenes/PlaceSelectScene.ts` | The five places with their hats; locked ones dimmed. |
| `scenes/LevelSelectScene.ts` | The levels of one place. |
| `levels/1-2.json` to `1-4.json` | The counter's curve ([level-design.md › Difficulty curve](level-design.md#difficulty-curve)), wider than one screen. |
| `scenes/GameScene.ts` | The place's hint only in its first level. |

### Done when
- [ ] Each new level passes validation and the self-collapse test, and is winnable with one meatball to spare.
- [ ] Unlocks run through the levels in order, across places.

---

## Step 10: Look (`0.11.0`)

**Goal:** the scenes and the things in them read as a kitchen at night, still drawn by p5 ([art-direction.md](art-direction.md)); no image files, and no AI-made assets.

### Files

| File | In this step |
| ---- | ------------ |
| `ui/Kitchen.ts` → `ui/backdrops/` | A backdrop per place, in two parallax layers behind the level: a far wall (tiles, a window with the night outside, the fridge's light or the stove's pilot flame) and a near layer of that place's furniture (the dish rack and tap, the stove's knobs, the fridge's shelves, the pantry's jars). Low contrast, never a material's or a roach's hue. |
| `entities/blockLooks.ts` | One highlight per shape and a cleaner silhouette per material: glass rims, wood end grain, a cast-iron handle, the cooker's lid and handles; damage that reads on each. |
| `entities/ingredientLooks.ts`, `entities/Roach.ts` | Shading and expressions: blinking eyes, the roaches' idle twitch, squash and stretch at launch and on the first hit. |
| `entities/Launcher.ts` | A fork that reads as a fork: tines, a curved neck, a handle. |

### Done when
- [ ] A screenshot of each place tells which place it is without the HUD.
- [ ] Every material still reads at a glance in grayscale ([art-direction.md › Readability rules](art-direction.md#readability-rules)).

---

## After the MVP

Not planned yet. Each one becomes a step when the one before is done, in the order that serves the game.

- **More levels:** the other places' curves, up to four levels each, as in step 9.
- **Illustrations:** the Title, the Intros, and the Ending.
- **Sound:** every sound in [art-direction.md › Sound](art-direction.md#sound).
- **Keyboard aiming:** arrows for angle and pull.
- **A level editor** behind `?debug=true`, if hand-writing levels gets slow.

---

## Decisions

| # | Decision | Step | Status |
| - | -------- | ---- | ------ |
| 1 | Physics engine: Matter.js, with the workarounds in [physics.md](physics.md) | 0 | Confirmed |
| 2 | Fixed 60 Hz step counted in frames; slow motion scales the time fed to the accumulator, never the step size | 1 | Open |
| 3 | Two substeps per tick against tunneling; sleeping off, settling by speed | 1 | Open |
| 4 | The engine isolated behind `physics/World`; plain `Vec` in px and px/s everywhere else | 1 | Confirmed |
| 5 | 960 × 540 canvas, scaled to fit, letterboxed | 0 | Open |
| 6 | MVP levels fit one screen; no camera until after the MVP | 1 | Replaced by 25 |
| 7 | The launch sets a creation velocity (mass-independent), not an impulse | 2 | Open |
| 8 | The aim preview is the engine's own flight in a scratch world | 2 | Open |
| 9 | The ingredient has no body until it is released; the spent one is removed when the shot settles | 2 | Open |
| 10 | Damage from the closing speed × reduced mass of each new contact, above a threshold, the largest per pair per tick, applied after the step | 3 | Open |
| 11 | No damage during `LEVEL_START_GRACE` frames | 3 | Open |
| 12 | Debris is visual only, never physics bodies | 3 | Open |
| 13 | Levels are JSON files imported by the bundle, with a validation test and a self-collapse test per level | 4 | Open |
| 14 | Hand-written levels on a 16 px grid; an editor only if needed | 4 | Open |
| 15 | Blasts ignore line of sight; chains unfold one step at a time | 5 | Open |
| 16 | Score for destruction, not damage | 6 | Open |
| 17 | MVP: five levels, one per place; no Place select, no Intro, no sound | 6 | Open |
| 18 | The kitchen theme: the pantry against the roaches, five places | — | Confirmed |
| 19 | Working title *Fork & Fling* | — | Open |
| 20 | Flat vector style drawn by p5; the palette in [art-direction.md › Palette](art-direction.md#palette) | 1 | Open |
| 21 | One rounded font (Fredoka, OFL) | 6 | Open |
| 22 | Two languages (en, es) from typed data files | 3 | Open |
| 23 | PolyForm Noncommercial 1.0.0, as in the previous project | 0 | Confirmed |
| 24 | The hat thresholds stay per level, and are shown: a hat bar while playing, a breakdown in the Result | 7 | Confirmed |
| 25 | Levels can be wider than one screen, with a camera (replaces 6 from step 8 on) | 8 | Confirmed |
| 26 | More levels one place at a time, the counter first, with a Place select | 9 | Confirmed |
| 27 | Better looks still drawn by p5, a backdrop per place with parallax | 10 | Confirmed |
