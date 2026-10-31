# Text and Language

What the player reads, where, and in which language. The texts themselves live in `src/i18n/`.

## Voices

| Voice | Where | Tone |
| ----- | ----- | ---- |
| The kitchen (UI) | Menus, HUD, Result | Short and plain: `Play`, `Retry`, `Next`. |
| The pantry | Hints, Intro, Ending | Proud, a little dramatic, fond of kitchen puns, never more than two lines. |
| The Cook's notes | Intro and Ending illustrations | Handwritten notes on the fridge; homely. |

## Channels

| Channel | Where | Example |
| ------- | ----- | ------- |
| Menu labels | Title, selects, pause | `Play`, `Resume`, `Levels` |
| HUD | Game | Score, ingredients left (icons, no text) |
| Floating numbers | Game | `+500` (numbers only) |
| Result | Result scene | `Kitchen cleaned!`, `Out of ingredients` |
| Hints | A place's first level | `Tap in flight: the peas split up` |
| Intro and Ending | Before a place, after the Queen | One or two lines and a note |

## Writing

- Short. A hint fits on one line at the HUD size in both languages.
- Puns are welcome when they translate; when a pun doesn't survive into Spanish, write a different one, never a literal translation.
- Original text; no lines from other games.

## Typography

**Decision (open, proposed):** one rounded font, **Fredoka** (OFL), for everything; a handwritten OFL font for the Cook's notes, chosen with the Intro. Requirements for any font: an open license, the full Spanish set (á é í ó ú ñ ü ¿ ¡), readable at the HUD size. Record each font and its license in [assets.md](assets.md).

- Measure with `p.textWidth()` and wrap; never assume English widths. Spanish runs 20–30% longer.

## Languages

English and Spanish.

### Translation files

- `src/i18n/en.ts` is the source; `es.ts` is typed against it, so a missing key fails the typecheck. Edit both together.
- `t(path, params)` reads the current language; placeholders are `{name}`. `t()` only accepts paths to a single string, so a misspelled key fails the typecheck.
- Language: from `?lang=`, then the saved choice, else English. Switchable from the Title, and the choice is saved (`try/catch`, so blocked storage only stops it from persisting).
