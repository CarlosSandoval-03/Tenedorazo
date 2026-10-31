# Fork & Fling — Working rules for Claude

A 2D physics puzzle game in the slingshot genre, set in a kitchen: the pantry's ingredients fling themselves from a fork slingshot at the pests that built forts out of the dishes. This file holds only the rules to apply in every session. Everything else is project knowledge in `docs/`: read the relevant document when a task needs it, and never copy its content here.

## Where to look

| Need | Document |
| ---- | -------- |
| The idea, pillars, map of the docs | [docs/README.md](docs/README.md) |
| Story, characters, scenes | [docs/narrative.md](docs/narrative.md) |
| Mechanics, controls, projectiles, materials, scoring | [docs/gameplay.md](docs/gameplay.md) |
| Physics engine, units, step, bodies, damage, determinism | [docs/physics.md](docs/physics.md) |
| Level format, editor, difficulty curve | [docs/level-design.md](docs/level-design.md) |
| Every text, when it appears, fonts, languages | [docs/text-and-language.md](docs/text-and-language.md) |
| Palette, readability, visual rules, sound | [docs/art-direction.md](docs/art-direction.md) |
| Asset files and how they were made | [docs/assets.md](docs/assets.md) |
| Stack, structure, architecture, global state, rendering, git | [docs/technical.md](docs/technical.md) |
| Current step, specs, acceptance criteria, open decisions | [docs/implementation-plan.md](docs/implementation-plan.md) |
| Debug tools: start a level from the URL, the debug panel | [docs/debug.md](docs/debug.md) |

## Communication
- Talk to me in Spanish.
- All code, comments, identifiers, file names, and commit messages in English.

## Roles
- You implement the game, following the implementation plan, and create the commits as you go (one logical change each, the hooks enforced).
- I review, play, and decide. Ask me when a decision isn't covered by the plan or the docs.

## How to work with me
- Before large changes, briefly explain the plan and which files you'll touch.
- Work in small, playable increments.
- Run `pnpm typecheck` after changes and fix all type errors.
- Format every code snippet and edit as Prettier's defaults would: double quotes, semicolons, trailing commas (docs/technical.md › Code conventions).
- Don't add dependencies or change the architecture without asking.

## Invariants (always check code and proposals against these)
- TypeScript strict; p5.js in **instance mode** only, with the p5 instance passed explicitly, never global.
- `main.ts` stays minimal; scenes implement `enter/update/draw/exit`; entities extend `Entity`.
- **Tests run in Node:** modules import p5 only as a type, except `main.ts`.
- **The physics engine owns motion.** Entities never set their own position or velocity each frame; they read them from their body. Bodies change motion only at discrete events (the launch, an ability, a blast) and through debug tools.
- **The engine stays behind `physics/World`.** Only `src/physics/` imports Matter.js; the rest of the code sees `World`, `BodyHandle`, and plain `Vec`s in px and px/s.
- **Fixed step.** Physics advances at a fixed 60 Hz step, never by `deltaTime`. Same level + same launch = same result.
- Levels are data, not code (JSON in `src/levels/`). Every tunable number lives in `config.ts`; material properties live in the material table, not in entities.
- All player-facing text lives in `src/i18n/` in English and Spanish, never inline; edit both files together.
- The theme is expressed through mechanics: every material and projectile behaves like the real kitchen thing (glass shatters, jelly bounces, popcorn pops).
- The game is original: its own theme, characters, and art. Never a reskin of an existing slingshot game, its characters, or its names.

## Code quality
Apply these to every change, and to code you touch for another reason. Be critical: readable code beats short code, and neither excuses unclear names.
- **One responsibility per function.** A method does one thing at one level of abstraction; a long `update()` or `draw()` becomes a list of named steps. When a function keeps two jobs, say why in a comment.
- **Small and flat.** Aim for functions under ~30 lines and two levels of nesting at most. Prefer early returns and guard clauses to nested `if`/`else`.
- **One home per piece of logic.** Shared math (angles, vectors, clamps, easing, trajectory prediction) lives in `core/math.ts`; shared entity mechanics (hp, damage from impacts) live in a base class. Never copy a formula into a second file: extract it.
- **Names say what, not how.** Functions are verbs (`launchIngredient`, `drawAimPreview`), values are nouns, booleans read as predicates (`isStill`, `isOffscreen`). No abbreviations beyond the standard ones (`x`, `y`, `p`, `i`, `dx`).
- **At most four parameters.** Past that, pass an object.
- **State in `update`, pixels in `draw`.** `draw` never changes game or physics state, and game logic never draws, so the logic stays testable without p5.
- **Pure when possible.** Logic that can be a pure function (trajectory, damage from impulse, star rating, level validation) is one, and has a test.
- **No magic numbers.** Tunables go in `config.ts`; layout and drawing constants are named at the top of their module.
- **Types over checks.** No `any`, no casts or non-null assertions (`!`) in `src/` unless the type system can't express a guarantee the code makes; then say why. `readonly` for what never changes after construction.
- **Delete what is dead.** No unused exports, parameters, or branches kept "for later"; stubs only where the plan says a later step fills them.

## Comments
- A comment says why: an intent, a constraint, or a non-obvious decision the code can't show. Never restate what the code, a name, or a type already says.
- Complex functions (an orchestrating `update()` or `draw()`, a non-trivial algorithm) open with a short comment summing up what they do and in what order, and each logical block gets a one-line comment.
- Comments are self-contained: no references to docs, other files, tickets, or conversations.
- TSDoc (`/** */`) on an export only when its name and signature don't say enough; `//` for everything else.
- No commented-out code, section banners, or template boilerplate.

## Git
- Follow the commit rules in docs/technical.md › Git; the hooks enforce them. Never use `--no-verify`.
- Never push: no `git push` of branches or tags, and no changes to remotes. Only I push.
- When I ask for commit messages, check them against the `commit-msg` hook before giving them.

## Documentation
- `docs/` is the source of truth. When a decision, system, text, or asset changes, update the matching document in the same change.
- When I change a decision from the plan's "Decisions", update the plan, then the document it belongs to.
- No project file references this file. Project knowledge goes into `docs/`; this file only points to it.

## Assets
- Check docs/assets.md before proposing an asset: if it exists, use or adjust it.
- Don't generate assets with AI tools unless I explicitly ask.
- Make small or geometric changes (variants, damage states, recolors) locally with ImageMagick or Pillow.
- An added or replaced asset follows docs/art-direction.md and is recorded in docs/assets.md in the same change.
