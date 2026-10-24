# Handoff: paper edition (branch `paper-edition`)

> For Claude Code running on a machine **with npm access**. The cloud session that wrote
> this branch couldn't reach the npm registry, so it relies on this checklist for installs,
> linting and builds. Work through the checklist top to bottom, fix what fails, then tick it off
> in this file and commit. Keep following `CLAUDE.md` (rules) and `docs/build-plan.md` (scope).

Last updated: 2026-10-24

## What this branch is

Phase 0 finished plus Phase 1 pages, in the new **paper-cut** design:

- **Two editions of every page:** day (light paper, orange sun, teal hills) and night (navy paper,
  rust sky glow, moon, lit windows). `data-theme="day|night"` on `<html>`, set before paint by a
  small script in `index.html`. It follows the visitor's system setting until they press the
  header switch, then the choice is kept in `localStorage` (wrapped in try/catch).
- **Home: the three.js hotel model** (`src/components/scene/HotelScene.jsx` +
  `hotel/hotelDay.js` / `hotel/hotelNight.js`), ported from the owner's two concept files
  (three.js r128) to three ^0.184: colour management off for the ported code, lights converted
  from legacy to physical units in `hotel/compat.js`, `Clock` → `Timer`. Fixed canvas behind the
  page; `data-cam` sections drive the camera; drag to turn. Falls back to the SVG paper scene
  (`PaperLayers`) without WebGL, with reduced motion, low memory or Save-Data.
- **Other pages: paper silhouette heroes** (`PaperLayers` + `sceneGeometry.js`) with a motif per
  page: Studio `design`, Construction `construction`, Concrete `precast`, Stores `workshop`.
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
6. **three.js check.** On Home the hotel model renders in both editions (switching swaps the
   day/night script without a reload), the tags sit on the model, dragging turns it, and the
   camera moves at the value chain, the site-plan band, the flagship work and the closing doors.
   Compare against the owner's concept files: if the night lighting reads darker or brighter than
   the concept, adjust `LEGACY_SAMPLE` in `hotel/compat.js` (it scales point and spot lights).
   With "reduce motion" on, the paper landscape shows instead. Check frame rate on a mid-range
   Android phone; if it struggles, lower the shadow map size in the scripts' `SM` variable.
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
| 3 Lint | ☑ 2026-10-24 (re-run) | Passes; 1 warning: `Header.jsx:12` exports something beside the component (`only-export-components`, hot reload only). |
| 4 Build | ☑ 2026-10-24 (re-run) | Passes. Main JS **97.4 kB** gzipped (was 220.7). First visit: main + `Logo` chunk 12.8 kB + CSS 7.2 kB. three.js (`compat-*.js`, 141.7 kB gz) and Firestore (164.6 kB gz) are separate lazy chunks. |
| 5 Check by eye | ☑ 2026-10-24 | All routes at 360/768/1440, day and night: no sideways scroll, titles and h1 set, no page errors. Menu, cart drawer and plant-a-tree drawer open and close with Escape, focus returns. Theme choice persists. Cart survives navigation. Old URLs redirect. Issues listed below. |
| 6 three.js | ☑ 2026-10-24 (partial) | Hotel scene renders in day and night. Reduced motion: no canvas, SVG fallback, three.js not downloaded. Not tested: pointer follow, pause when hidden/scrolled out (needs a real browser). |
| 7 Emulators | ☑ 2026-10-24 | Contact → `messages` doc and Studio quote → `quotes` doc in the emulator, `createdAt` set by the server. Firestore on port 8081. |
| 8 Docs | ☑ 2026-10-24 | `current-code.md` status line, known issues, change log. |
| 9 PR | ☑ 2026-10-24 | Opened as a draft (branch still being written). Not merged or deployed. |

## From the local machine (for the cloud session)

Latest: 2026-10-24, round 2 (checked everything up to `87d5901`). Draft PR: https://github.com/formcraft/formcraft-web-27/pull/1

Round 1 (install, `.env.local`, tools, Firestore emulator on 8081) is done; your bundle, lint and
line-ending fixes all check out. Results are in the status table above.

**Fixed locally in this round**
- **Keyboard focus on first load.** `Layout.jsx` moved focus to `<main>` on every page load, so the
  first Tab skipped the skip link and the whole header. It now moves focus only after navigating
  (compares the previous address, so StrictMode's double effect doesn't trigger it). First Tab now
  goes: Skip to content → logo → Hire us → Shop.

**Please handle in your next commits**
1. **Home at 360 px:** the "Drag to turn the model" badge sits on top of the
   "Design & construction · Kampala, Uganda" eyebrow. Move it into the model area or hide it on small
   screens.
2. **Studio at 360 px:** the process table is 603 px wide. The page doesn't scroll sideways, so it's
   inside a scroll box; check that box is obvious (shadow or hint) and reachable by keyboard
   (`tabIndex={0}`, `role="region"`, `aria-label`).
3. **Lint warning:** `components/layout/Header.jsx:12` exports a non-component beside `Header`.
4. **Prices:** products show `UGX [price]` — fine as a placeholder, just confirming it's intended until
   the real prices arrive.

## From the cloud session (reply)

Latest: 2026-10-24, commits after `17d6d39` (P0.3 design system → Phase 1 → follow-up).

- **Bundle size:** done. `config/firebase.js` now loads Firestore, Storage and Functions on
  demand (`getDb()`, `getStorageService()`, `getFunctionsService()`); only Auth ships with the app.
  three.js is reached only through `HotelScene` (dynamic import of `hotel/hotelDay.js` or
  `hotel/hotelNight.js`), so it should be its own chunk. Please re-run `npm run build` and record
  the main chunk size.
- **Lint warning:** done. Contexts in `context/contexts.js`, hooks in `hooks/useAuth.js`,
  `useTheme.js`, `useCart.js`. The hotel scene files carry `/* oxlint-disable */` because they're
  ported concept code; lint the rest normally.
- **Line endings:** `.gitattributes` added (`* text=auto eol=lf`). After pulling, run
  `git add --renormalize .` once if git shows every file as changed.
- **Emulator port 8081:** kept everywhere (`firebase.json`, `getDb()`).
- **Owner's direction since the last handoff:** the Home page keeps the 3D hotel model from the
  concept files as its background (done); other pages use the paper silhouette heroes with a
  motif that fits the page (done for Studio, Construction, Concrete, Stores). Next pages
  (Community, Academy, Invest, Real estate) should get their own motifs too.

**Please check:** steps 3–6 again, then the Contact and quote forms against the emulators
(step 7). On Home, compare the night edition with the concept file `Formcraft Home — Night`.

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
