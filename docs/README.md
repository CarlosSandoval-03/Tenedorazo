# Tenedorazo — Overview

The idea of the game in one page. Every other document goes deeper into one part of it. The title is *Tenedorazo*, a blow with a fork: one word, the same in English and Spanish (**Decision**, [implementation-plan.md › Decisions](implementation-plan.md#decisions)).

## The idea

A 2D physics puzzle game in the slingshot genre, set in a kitchen. The Cook has gone on holiday and locked the kitchen. While they are away, a plague of cockroaches moves in and builds forts out of everything left on the drying rack: glasses, cutting boards, cast-iron pans, a wobbling jelly. The pantry's ingredients, about to be forgotten, decide to take the kitchen back: they tie a rubber band to a fork and fling themselves at the forts.

**A level** is a side view of one corner of the kitchen: the fork slingshot on the left, a fort of dishes on the right, the roaches inside it. The player pulls back, aims, and releases; the physics does the rest. A level is cleared when every roach is gone, rated with one to three chef's hats.

**A run** crosses five places of the kitchen, the counter, the sink, the stove, the fridge, and the pantry, each with one new ingredient and one new kitchen material. The last fort, in the pantry, hides the Queen of the roaches.

## Pillars

1. **The physics is the game.** Every outcome comes from the simulation: no scripted collapses, no fake damage. A good shot looks good because it *is* good.
2. **The kitchen behaves like a kitchen.** Each material and ingredient does what the real thing would: glass shatters, cast iron shrugs, jelly bounces, popcorn pops, a cheese wheel rolls. The theme is in the mechanics, not painted on top.
3. **Readable cause and effect.** The player always sees why a fort fell: the aim preview, the impact flash, the crack on the dish that took the hit.
4. **Fair and repeatable.** Same level, same shot, same result. Losing is the player's aim, never the engine's randomness.
5. **Small and complete.** Five places, each with one new ingredient or material, polished end to end.

## Documents

| Document | Answers |
| -------- | ------- |
| [narrative.md](narrative.md) | The kitchen, the ingredients, the roaches, the story by place, and every scene. |
| [gameplay.md](gameplay.md) | How it plays: the shot, ingredients and their abilities, materials, roaches, scoring, controls. |
| [physics.md](physics.md) | How the simulation works: engine, units, the fixed step, bodies, stability, impact damage, blasts, settling, determinism. |
| [level-design.md](level-design.md) | The level format, how levels are built and validated, and the difficulty curve. |
| [text-and-language.md](text-and-language.md) | What the player reads, the voice, fonts, English and Spanish. |
| [art-direction.md](art-direction.md) | How it looks and sounds and why: style, palette, readability, juice. |
| [assets.md](assets.md) | Which files exist and how they were made. |
| [technical.md](technical.md) | How it's built: stack, architecture, conventions, rendering, tooling, git, CI and deploy. |
| [implementation-plan.md](implementation-plan.md) | What to build now: each step, when it's done, and the decisions still open. |
| [debug.md](debug.md) | How to test without replaying: start a level from the URL, the debug panel. |

**Reading order:** this overview → gameplay → physics → technical → the current step of the plan. The rest as needed.

**Keeping it current:**
- A confirmed or changed decision goes into the plan, then into the document it belongs to.
- Diagrams are [Mermaid](https://mermaid.js.org/) blocks, which GitHub renders; update a diagram in the same change as the text it illustrates.
- Texts go into `src/i18n/`, in both languages.
