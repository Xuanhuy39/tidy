# Tidy Up!

A cozy 3D sorting puzzle for the browser, built with three.js, TypeScript and Vite.

Tap the clutter in a room to tidy it. Each item flies into the open box for its category (Snacks, Stationery, Electronics …). If no open box takes it, it waits in the tray. When a box fills it closes and the next category's box opens in its place, pulling any matching items out of the tray. Items with something resting on top can't be picked until that's cleared. The tray holds 5 items; filling the last slot loses the level (a booster can rescue you).

Boosters: **Return** puts the last 3 tray items back in the room (2 per level), the locked **+** tray slots add space, **Extra box** opens a third box early, and **Hint** points at a good move (3 per level, free). Finish without Return/slots/box for 3 stars.

The game always plays in a portrait phone-shaped frame (9:16); on a PC it sits centred in the window.

Levels: **Study Nook** (17 items), **Cozy Kitchen** (22), **Messy Bedroom** (26). All items and rooms are built procedurally from three.js primitives with a cel-shaded, outlined look, so there are no model or texture files.

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. (On this PC, PowerShell blocks plain `npm`; use `npm.cmd run dev`.)

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                                       |
| `npm test`        | Rule tests, plus a solver that proves every level can be won     |
| `npm run build`   | Type-check and build the static site into `dist/`                |
| `npm run preview` | Serve the built `dist/` locally                                  |

URL options:

- `?level=2` opens level 2 directly (skips the menu).
- `?unlock` unlocks every level in the menu.

## Project layout

| Path                    | What's there                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `src/game/logic.ts`     | The rules (no rendering), the solver and a casual-player simulation  |
| `src/game/levels.ts`    | Level data: categories in order, and where each item sits            |
| `src/scene/models.ts`   | The 58 item models (review them at `/gallery.html` in dev)           |
| `src/scene/rooms.ts`    | Room furniture and the surfaces items rest on                        |
| `src/scene/stage.ts`    | Camera framing, picking and 3D animation                             |
| `src/scene/thumbs.ts`   | Renders each model to a small icon for the boxes and tray            |
| `src/ui/hud.ts`         | Boxes, tray, boosters, overlays                                      |
| `src/main.ts`           | Ties it together: input, event sequencing, menus                     |

To add a level, add a `LevelDef` to `src/game/levels.ts` (each item rests on a room `surface` or `on:` another item) and run `npm test`; it fails if the level can't be won.

## Deploy

Live at **https://huynx-tidy.vercel.app** (Vercel project `huy-nx/huynx-tidy`).

Source: https://github.com/Xuanhuy39/tidy. The repo is connected to the Vercel project, so every push to `main` deploys to production and every other branch gets a preview URL. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the tests and build on GitHub as a check.

Manual deploy from this folder: `vercel deploy --prod --scope huy-nx`.

`npm run build` also produces a plain static site in `dist/` with relative paths, so it can be hosted anywhere.
