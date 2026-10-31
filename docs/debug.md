# Debug tools

Tools for testing without replaying. They exist only on the dev server, and only with `?debug=true` in the URL.

## Availability

- `main.ts` loads `src/debug/` behind `import.meta.env.DEV`; the build replaces the check with `false` and drops the module, whatever the URL says.
- A debug session stores its progress under `forkfling.debug.*`, so it never touches the real saves (`forkfling.progress`).
- Nothing here is player-facing text: English only, outside `src/i18n/`.

## Start from the URL

| Parameter | Does |
| --------- | ---- |
| `&level=3-1` | Opens that level directly. |
| `&unlock=all` | Every level unlocked (in the sandbox). |
| `&ingredients=popcorn,cheese` | Replaces the level's queue. |
| `&reset=debug` | Erases the sandbox. |

## The panel

| Key | Does |
| --- | ---- |
| `1` | Debug draw: body outlines; still bodies dimmed. |
| `2` | Impacts: the impulse of each one, in raw units, where it happened. |
| `3` | Pause / resume the step. |
| `4` | One step while paused. |
| `5` | Slow motion (¼ time). |
| `6` | Infinite ingredients. |
| `7` | Remove every roach (test the win). |
| `8` | Hold, then drag from a body: on release it is pushed along the drag. |
| `9` | Copy the current level, as built, as JSON. |

The panel shows the shot's state, bodies awake / total, the step's largest impulse, roaches left, and the score.

## How it works

The tools reach the scene through its fields; the game has no debug hooks. They use `World`'s public API, never the engine directly.
