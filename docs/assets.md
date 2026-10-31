# Asset Catalog

Every asset file, what uses it, and how it was made. The style draws almost everything with p5 ([art-direction.md › Style](art-direction.md#style)), so the MVP has a single asset: its font.

## Rules

- Every file is listed here and in `src/assets.ts`; `assets.test.ts` checks the two against the disk.
- Paths are relative (`assets/...`) so the build runs under any path.
- Each entry says: file, size, used by, source (made by hand / tool / third party), license.
- Damage states and recolors are made locally (ImageMagick, Pillow) from the base sprite, not drawn again.

## Illustrations (`public/assets/illustrations/`) — after the MVP

| File | Size | Used by | Source | License |
| ---- | ---- | ------- | ------ | ------- |
| | | | | |

## Sounds (`public/assets/sounds/`) — after the MVP

| File | Used by | Source | License |
| ---- | ------- | ------ | ------- |
| | | | |

## Fonts (`public/assets/fonts/`)

| File | Used for | License |
| ---- | -------- | ------- |
| | | |

## Drawn with p5

Everything in the game itself: the kitchen background, the fork and its band, every block, roach, and ingredient with its damage states, debris, the aim preview, floating numbers, the HUD, and the menus.

## How the assets were made

*To be written with the first asset: tools, settings, and post-processing commands.*
