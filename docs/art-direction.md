# Art Direction

How the game looks and sounds, and why.

## Style

**Decision (open, proposed):** flat vector shapes drawn by p5, with a thick dark outline and one highlight per shape, like a cartoon cookbook. Reasons: bodies rotate to any angle, which turns pixel art jagged; p5 shapes cost no asset pipeline; damage states are drawn cracks, not new files. After the MVP, illustrations (Title, Intro, Ending) are the only images; in the MVP there are none.

The kitchen is at night: dim, warm, lit by the fridge's light and the stove's pilot flame. What the player plays with is lit; the room behind is not.

**Backdrops** (`ui/backdrops/`): each place has its own, in two parallax layers behind the level, so a screenshot tells the place without the HUD. The far layer moves at a fifth of the camera's speed, the near one at half.

| Place | Far layer | Near layer | Its one light |
| ----- | --------- | ---------- | ------------- |
| Counter | A window with the moon, a rail with a ladle and a whisk | Upper cabinets | The moon |
| Sink | A window with blinds | A gooseneck tap and the dish rack | The window |
| Stove | The range hood | Hanging pots, the pilot flame | The blue pilot flame |
| Fridge | Its shelves | Bottles, eggs, jars | The fridge's lamp |
| Pantry | Wooden shelves and their posts | Jars, cans, sacks | A hanging lamp |

## Readability rules

1. **Materials read at a glance, even in grayscale.** Each has its own hue *and* its own shape language: glass pale and translucent with a shine line; wood mid-tone with grain; cast iron near-black and chunky with a handle; jelly saturated, translucent, wobbling; pressure cooker steel with a valve.
2. **Roaches pop.** Violet shells with lilac highlights and yellow eyes: the only violet in the game, never used by a material or an ingredient.
3. **Ingredients pop too.** A cream outline around every ingredient sets them apart from the fort, and each has eyes that blink; the roaches' antennae twitch.
4. **Damage is visible.** Three states per block (intact, cracked, broken) and a white flash on every hit.
5. **The background stays quiet.** Low contrast, cool and dark tiles, two parallax layers; never a material's or roach's hue.
6. **The aim preview** is cream dots, high-contrast against the dark room, never mistaken for debris.

## Palette

**Decision (open, proposed):** recorded as named groups in `config.ts` (`PALETTE`); hex values fixed when the style is confirmed.

| Group | Proposed | Use |
| ----- | -------- | --- |
| Room | Dark teal and slate tiles | Background, far layer |
| Counter | Warm gray stone | Static ground, shelves |
| Glass | Pale cyan, white shine | Glasses, plates |
| Wood | Honey and walnut | Boards, spoons |
| Cast iron | Charcoal, cold gray rim | Pans, pots |
| Jelly | Raspberry, translucent | Jelly blocks |
| Steel | Silver, red valve | Pressure cookers |
| Roaches | Violet, lilac, yellow eyes | Every roach |
| Ingredients | Each its own, cream outline | Meatball brown, pea green, chili orange, cheese yellow, popcorn white |
| UI | Cream on dark, hats in gold | HUD, menus |

## Juice

- Screen shake by impulse, capped (`SHAKE_MAX`).
- Debris in the material's colors when a block breaks: shards, splinters, chunks; visual only.
- Squash and stretch on the ingredient at launch and on its first hit.
- One highlight per shape along its top edge, and the lower side of each ingredient in shade.
- Jelly wobbles on every hit (a draw-only spring, driven by the time since its last impact).
- Slow motion when the last roach goes.

## Sound

- The rubber band stretching and snapping; impacts by material (glass clinks and shatters, wood knocks, cast iron clangs, jelly squelches), with volume by impulse; the pea pod's pop, the chili's sizzle, the cheese rolling, the popcorn's pop, the pressure cooker's whistle and bang; roaches squeaking; win and lose stings; UI clicks.
- **Decision (open):** the source and license of sounds. Record every file in [assets.md](assets.md).
