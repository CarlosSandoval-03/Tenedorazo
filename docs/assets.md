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

| File | Size | Used for | Source | License |
| ---- | ---- | -------- | ------ | ------- |
| `Fredoka.ttf` | 159 KB | Every text in the game | Third party: the Fredoka Project Authors, from [google/fonts](https://github.com/google/fonts/tree/main/ofl/fredoka) | SIL OFL 1.1, in `OFL.txt` beside it |

## Drawn with p5

Everything in the game itself: each place's backdrop (`ui/backdrops/`), the fork and its band, every block, roach, and ingredient with its damage states, debris, the aim preview, floating numbers, the HUD, and the menus.

## How the assets were made

- **Fredoka:** the variable font (`Fredoka[wdth,wght].ttf`) downloaded unchanged from the google/fonts repository and renamed `Fredoka.ttf`; its `OFL.txt` is copied beside it, as the license requires. It covers the full Spanish set (Latin-1). p5 loads the variable font through the browser's FontFace API (it logs a harmless "No glyph data" warning first) and draws its default instance.
