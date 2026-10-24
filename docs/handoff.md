# Handoff: paper edition (branch `paper-edition`)

> For Claude Code running on a machine **with npm access**. The cloud session that wrote
> this branch couldn't reach the npm registry, so nothing here has been installed, linted
> or built yet. Work through the checklist top to bottom, fix what fails, then tick it off
> in this file and commit. Keep following `CLAUDE.md` (rules) and `docs/build-plan.md` (scope).

Last updated: 2026-10-24

## What this branch is

Phase 0 finished plus Phase 1 pages, in the new **paper-cut** design:

- **Two editions of every page:** day (light paper, orange sun, teal hills) and night (navy paper,
  rust sky glow, moon, lit windows). `data-theme="day|night"` on `<html>`, set before paint by a
  small script in `index.html`. It follows the visitor's system setting until they press the
  header switch, then the choice is kept in `localStorage` (wrapped in try/catch).
- **three.js hero** (`src/components/scene/PaperScene.jsx`): layered, extruded paper shapes
  (Kampala hills, skyline, crane, sun or moon) that move with the pointer or a tilted phone.
  Loaded with `React.lazy` + dynamic `import("three")` only on pages that use it. Falls back
  to an SVG layered scene (`PaperSceneFallback.jsx`) when WebGL is missing,
  `prefers-reduced-motion` is set, the device is low-memory, or Save-Data is on.
- Paper textures (`public/textures/*.webp`), torn-edge section sheets, and a drawing
  **title-block footer** with a sheet number per page.
- Brand assets in `public/`: `fonts/` (Satoshi + Clash Grotesk variable `.woff2`), `logos/`
  (official SVGs; navy and white variants), `images/` (project renders as WebP, 1600 px and
  `-800` versions for `srcset`).

## Checklist (do in order)

1. **Install.** `npm install` (adds `three` ^0.184 and `firebase` ^12, already in
   `package.json`). Commit the updated `package-lock.json`.
   - If `three@^0.184.0` won't resolve, use the newest `0.18x` that does and note it here.
2. **Firebase env.** `cp .env.example .env.local` and fill in the web-app config of the
   Firebase project from the console (Project settings → Your apps). Without it the site still
   runs against a `demo-` project (emulators only) and logs a warning.
3. **Lint.** `npm run lint`. The `.oxlintrc.json` was fixed (react version `"19.2"`, no
   `parserOptions`); fix any real findings in the code.
4. **Build.** `npm run build`. Check the output: the three.js chunk must be its own lazy chunk,
   not in the main bundle. Main JS should stay well under 250 kB gzipped.
5. **Run and check by eye.** `npm run dev`, then at **360 px, 768 px and 1440 px**, in **both
   editions** (header switch), check: Home, Studio, Construction, Concrete, Stores (add to cart →
   drawer → quantities), a product page, Projects (filter), a project page, About, Contact, the
   404 page and the plant-a-tree button. Keyboard: Tab through the header, menu, cart drawer and
   dialogs; Escape closes them and focus returns to the button that opened them.
6. **three.js check.** On Home the hero scene renders, follows the pointer, swaps day ↔ night
   lighting without reloading, and stops animating when the tab is hidden or the hero scrolls out
   of view. With "reduce motion" on, the SVG fallback shows instead.
7. **Emulators (optional now, needed for forms).** `npm install -g firebase-tools`,
   `firebase emulators:start`, set `VITE_USE_EMULATORS=true`, send the Contact form and confirm a
   `messages` doc appears with `createdAt` set by the server.
8. **Docs.** Update `docs/current-code.md` if anything you changed differs from what it says
   (status line, file map, change log).
9. **Open the pull request** from `paper-edition` into `main` if it isn't open yet. Don't merge
   or deploy without the owner's go-ahead.

## Status

| Step | Done | Notes |
| --- | --- | --- |
| 1 Install | ☑ 2026-10-24 | three 0.184.0, firebase 12.19.0. `npm audit fix` (patch/minor only). Left: 4 high in `@grpc/grpc-js` (Node-only, via firebase) and 2 moderate in react-router 6 (fix needs v7). npm skipped the postinstall scripts of `@firebase/util` and `protobufjs`; not needed for the Vite build. |
| 2 Firebase env | ☑ 2026-10-24 | `.env.local` from the old `fromcraft-2026` config. `VITE_FUNCTIONS_REGION` left empty (TODO: region open question). |
| 3 Lint | ☑ 2026-10-24 | Passes; 1 warning (`useAuth` exported beside `AuthProvider`, hot reload only). |
| 4 Build | ☑ 2026-10-24 (partial) | Passes. Main JS 220.7 kB gzipped, mostly Firebase loaded eagerly in `config/firebase.js`; trim before adding pages. No three.js chunk yet (nothing imports it). Re-check when the scene lands. |
| 5 Check by eye | ☐ | Waiting for the layout, shop and Phase 1 commits. |
| 6 three.js | ☐ | Waiting for `PaperScene`. |
| 7 Emulators | ☐ | Not installed here: needs `firebase-tools` and Java 21+. Port 8080 clashes with the Revit MCP plugin on this machine. |
| 8 Docs | ☑ 2026-10-24 | `current-code.md` status line, known issues, change log. |
| 9 PR | ☑ 2026-10-24 | Opened as a draft (branch still being written). Not merged or deployed. |

## Still being written in the cloud session

The cloud session keeps pushing to this branch, one commit per task (`P0.3`, `P0.5/P0.6`,
`P0.7/P0.8`, `P1…`). Run `git pull` before starting, and check `git log` for the newest task.
If a task's commit isn't there yet, do the checklist for what is there.

## Known gaps (TODO, never invent)

- Prices, tree price and planting partner, delivery areas, street address, office hours,
  WhatsApp number, client names and project years are `TODO:` placeholders.
- "Formcraft Blue" for Stores still needs its own value (`--fc-stores` is #00B3E4 until the
  brand guide is fixed).
- Real portraits of the team, maker profiles and workshop photos aren't in the repo yet.
