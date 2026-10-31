# Tenedorazo

A 2D physics puzzle game in the slingshot genre, set in a kitchen. The Cook is on holiday, the roaches have built forts out of the dishes, and the pantry's ingredients fling themselves from a fork slingshot to take the kitchen back. Glass shatters, cast iron shrugs, jelly bounces, and popcorn pops.

> **Status:** MVP: five levels, one per place of the kitchen, playable from the Title to the Ending, in English and Spanish. What comes next is in [docs/implementation-plan.md](docs/implementation-plan.md#after-the-mvp).

## Tech stack

- [TypeScript](https://www.typescriptlang.org/) (strict mode) and [Vite](https://vite.dev/)
- [p5.js](https://p5js.org/) in instance mode, for drawing and input
- [Matter.js](https://brm.io/matter-js/) for the physics
- [Vitest](https://vitest.dev/) for tests, GitHub Actions for CI, deploys to GitHub Pages, and release zips

## Run from source

Requirements: Node.js 22.12 or newer and pnpm 12 (`corepack enable` picks the pinned version).

```sh
pnpm install   # also turns on the git hooks
pnpm dev       # http://localhost:5173
```

| Command | Does |
| ------- | ---- |
| `pnpm dev` | Dev server with hot reload. |
| `pnpm typecheck` | Type-check the project. |
| `pnpm test` | Run the tests. |
| `pnpm build` | Type-check and build to `dist/`. |
| `pnpm preview` | Serve the build. |

## Documentation

The design and technical documents are in [docs/](docs/README.md).

## License

[PolyForm Noncommercial 1.0.0](LICENSE).
