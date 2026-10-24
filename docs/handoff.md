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
| 3 Lint | ☑ 2026-10-24 (round 3) | Passes; 2 warnings (`only-export-components`): `admin/InboxPanel.jsx:14`, `page/Photo.jsx:6`. |
| 4 Build | ☑ 2026-10-24 (round 3) | Passes. Main JS **81 kB** gz; first visit ≈ 126 kB JS (main + Auth 22 + app core 9.5 + `usePageMeta` 13). Firestore SDK (162 kB) and three.js (142 kB) are lazy, not preloaded; main only has the REST URL. |
| 5 Check by eye | ☑ 2026-10-24 (round 3) | All 27 routes at 360/768/1440 in both editions: no sideways scroll, one h1, meta description, no JS errors. Every form field labelled. Admin and Account usable by keyboard. Findings below. |
| 6 three.js | ☑ 2026-10-24 (partial) | Renders day and night; reduced motion → SVG, no three.js download. Home main thread blocked ~12 s with one 8 s task (headless, software WebGL — real phone needed). |
| 7 Emulators | ☑ 2026-10-24 (round 3) | Forms write `messages`/`quotes`. Admin claim set with `set-admin.js`; page switch, product import, edit and photo upload work. Snapshot in `emulator-data/` (git-ignored). |
| 8 Docs | ☑ 2026-10-24 | `current-code.md` status line, known issues, change log. |
| 9 PR | ☑ 2026-10-24 | Opened as a draft (branch still being written). Not merged or deployed. |

## ▶ Tasks for the local Claude Code — start here (round 4, 2026-10-24)

The cloud session has read the owner brief (`docs/owner-brief-hero-and-speed.md`) and the round-3
results. Its reply is in "From the cloud session (round 4)" below. **Please do these now, in order,
commit after each, and write results under "From the local machine" (round 4):**

1. `git pull` (branch `paper-edition`), `npm install`, `npm run lint`, `npm run build`. Record the main
   chunk size and any lint findings. Fix lint findings that are plain mistakes; list the rest.
2. **Home freeze, before/after.** Same method as round 3 (headless, then throttled 3G + 4× CPU): first
   paint, longest task, total blocked time until the model shows, then frame rate. The scene now builds in
   steps (it yields between sections and compiles shaders with `compileAsync`). In the cloud's software-
   WebGL run the longest task dropped from 8.1 s to 4.3 s; tell us where the remaining long task is
   (Performance panel → which function).
3. **Real-GPU stills.** `npm run dev`, `npx --yes playwright@1 install chromium` (once),
   `node scripts/render-hotel-stills.mjs` → commit the four `public/images/hotel-*.webp`.
4. **Opening animation** in a real browser (it's skipped for automated browsers): 360 px and desktop,
   day and night; full (first visit) / quick (later visit) / none (same tab session) / reduced-motion fade.
   Does the mark land on the header logo? Any flash of the page before the sheet? Tap skips?
5. **Views and zoom** on the live model: Front / Back / Cutaway / Site buttons, + / − / reset, Ctrl +
   wheel zooms, plain wheel scrolls the page, pinch on a phone zooms, one-finger vertical swipe scrolls.
   To force the live model on a weak machine: `localStorage.setItem("fc-3d-level", JSON.stringify({level:"full", at: Date.now()}))`.
6. **Device levels.** Clear `fc-3d-level` and check which level each test device gets (Chrome DevTools:
   Network "Slow 3G" → standard; Save-Data or "2G" → lite with "Tap to explore the model"). Note the WebGL
   renderer string of the office machine and the owner's phone.
7. **Help the owner test on a real phone** over the local network: `npm run dev -- --host`, open the
   address on the phone. Check: no flicker at load or while scrolling, the opening animation, the
   still → live handover, tap-to-explore, the plant-a-tree pop-up.
8. Round-3 items still open on the cloud side (offline Home, product gallery, plant-a-tree pop-up, the two
   lint warnings) are being fixed in the next cloud commits; re-check them when they land.

Owner decisions the brief asked for (please ask the owner and write the answers here):
- **A.** The owner's front, back and landscape models: export as **glTF binary (`.glb`)**, Y-up, metres,
  ideally under 15 MB each, textures ≤ 2048 px. Put them in `assets-src/models/` (git LFS not needed under
  50 MB) or share the folder path. Until then the scene uses the concept model.
- **B.** "Tap to explore the model" button on lite devices: keep? (built; easy to remove)
- **C.** Performance Monitoring (anonymous speed data to Google, one line in the privacy page): yes/no?

## Owner brief: Home hero, skies, 3D views and device levels (read first)

**`docs/owner-brief-hero-and-speed.md`** (2026-10-24). It replaces the earlier "still image → 3D" proposal. In short:
- Landscape and sky show at once, and the building fades into them.
- You design the landscapes and skies: Home gets its own sky, the other pages share one.
- Front / Back / Cutaway / Site views, plus zoom (buttons on desktop, pinch on touch).
- Full / Standard / Lite device levels, decided by browser signals and a live frame check.
- Fix the build freeze.

Please reply below under "From the cloud session" with agree / change / object per section, and list the
tasks you want the local side to take.

## Owner request: plant-a-tree as a small pop-up, not a centre window

Raised by the owner on 2026-10-24: the plant-a-tree window shouldn't cover the centre of the page; it
should be a small pop-up window.

**Today:** `DonateFab` opens `Drawer side="center"`: a 560 px panel in the middle of the screen, the
whole page dimmed and blurred behind it (`::backdrop`), and on phones a bottom sheet up to 92 % of the
screen tall.

**Wanted (please confirm or answer before building)**
- A small card **anchored to the button**, bottom-right, opening upward from it (about 320–360 px
  wide; on phones the full width minus 16 px gutters, sitting just above the button, not full height).
- **The page stays visible and usable:** no dim or blur over the whole page. Escape and a × close it,
  focus returns to the button, and Tab stays inside while it's open.
- **Short content** so it fits: the live counter, quick picks 1 / 5 / 10 trees, the (TODO) price and
  one "Plant" button, plus a "More options" link to `/donate` for species, the donor-wall name and
  the rest. `/donate` keeps the full form.
- Keep the cart button above it on phones so they never overlap (as now).
- The `Drawer` component stays for the cart. This is either a new `Popover` in `components/ui/` or a
  `side="corner"` variant: your call.

## From the local machine (for the cloud session)

Latest: 2026-10-24, **round 4 on `a5c5955`** (your task list). Draft PR: https://github.com/formcraft/formcraft-web-27/pull/1
Tasks 1–3 are done; 4 was checked on `d9d6802` (the intro code hasn't changed since); 5–7 are next.

### Owner, on the still → live handover (2026-10-24, please treat as a requirement)

> The blend between the picture and the 3D model should be seamless. It should not wait for a click,
> except maybe on a device that is very slow. The angle the image is taken from should be the angle the
> 3D model fades in at, and then it starts moving the way it does, fluidly. It should be hard for anyone
> to tell there was a still image; by the time someone looks twice, the 3D should have loaded.

**Measured on this PC (NVIDIA, live level, day, 1600 × 1000):** the still and the first live frame differ by
**0.6 %** on average. The building, its angle and its light don't move at the switch, so the requirement is
met here. Three things still give it away:
1. The **labels** ("Built", "Cutaway") appear all at once with the live canvas. Fade them in after the
   handover.
2. The **floating paper scraps** sit in different places in the still and the live frame (they drift).
   Start them from the positions in the still, or leave them out of the still.
3. After the fade the model **barely moves** (2 % change in 3 s). If the owner expects it to start
   turning on its own, give it a slow idle turn from the still's angle.

Also keep in mind: the night sky follows the Kampala clock, so a night still taken at one hour won't match
the live sky at another (see the round-4 notes below).

On this machine the live 3D started automatically on both GPUs (Intel and NVIDIA) with no stored level;
"Tap to explore" wasn't needed.

### Round 4 results

1. **Lint and build:** both pass. Main JS **80 kB** gz. three.js (140 kB) and the Firestore SDK (162 kB) are
   separate and not preloaded. Three `only-export-components` warnings: `admin/InboxPanel.jsx:14`,
   `page/Photo.jsx:6`, `scene/HotelScene.jsx:77` (new). None is a plain mistake, so I left them for you.
2. **Home freeze, before → after.** `fc-3d-level` forced to full; preview build; intro skipped.

   | Setup | Model shown | Longest task (round 3: 8.1 s) | Blocked before model | Frame rate |
   | --- | --- | --- | --- | --- |
   | Headless Edge (Intel UHD 630), fast | 3.2 s | **0.91 s** | 1.6 s | 34 fps |
   | Headless, 3G + 4× CPU | 11.6 s | **1.27 s** | 4.1 s | 15 fps |
   | Visible Edge, NVIDIA Quadro T1000 | 4.4 s | **0.80 s** | 1.9 s | 29 fps |

   (Correction to rounds 2–3: headless Edge here uses the Intel GPU, not software WebGL.)

   **Where the remaining long task is** (CPU profile of the longest main-thread task, dev build for real names):
   - *Intel run, 587 ms:* the **first `WebGLRenderer.render`** in `frame` (`hotelDay.js:1722`). 80 % is
     `WebGLProgram.getUniforms → onFirstUse`: program link status and uniforms resolved synchronously at first
     use. 30 % of the task is under `WebGLShadowMap.render`. So the shadow-depth programs (and any program
     whose defines change at the first frame) aren't covered by `compileAsync`. Warm them too (compile with
     the shadow pass included, or draw the first frame with shadows off and turn them on a frame later).
   - *NVIDIA run, 691 ms:* the start of `createHotelScene`. 43 % is `getContext` (context creation, slow on
     this driver), and about 49 % is **`canvasTex` (`hotelDay.js:121`) generating paper noise in JS on the
     main thread** (`pulp` :150, `hash` :90, `vnoise` :94, `fbm` :100). The WebP paper textures added in
     `d9d6802` could replace this, or generate it in a worker or smaller.
3. **Stills:** re-rendered from `a5c5955` on the NVIDIA GPU and committed (`818221a` and the follow-up).
   `scripts/render-hotel-stills.mjs` needs these to work on Windows:
   a) `--force_high_performance_gpu` (otherwise the Intel iGPU is used);
   b) hide the scrollbar (`html{scrollbar-width:none}`), or the headed window adds a grey strip;
   c) a Node-only WebP step (no `python3` here; I used `sharp`).
4. **Opening animation** (Edge, `navigator.webdriver` hidden, 360 and 1440, both editions):
   - Modes are right: full, then none on the same tab, quick on a new tab, fade with reduced motion.
     A tap cuts full from about 3.5 s to about 2 s.
   - The mark lands on the header logo in 7 of 8 runs (0 px off). 360 night quick ends 4–5 px off, because
     it's removed before its 0.5 s fly finishes.
   - **Night first visit took 9–11 s** (day about 3.5 s): the tear starts at 1.5 s, but the overlay's timers
     didn't run while the night scene was built. Re-check after the build fixes above. Consider starting
     the 3D only after `#fci` is gone.
   - Not checkable from automation: whether there's a visible flash of the page before the sheet. That
     needs the owner's eyes (task 7).

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

## From the cloud session (round 3)

Latest: 2026-10-24. New since round 2:

- **Every designed page** is built and routed (Templates, template design, Checkout, Order confirmed,
  Community, Academy, Journal, Post, Invest, Real estate, development page, Donate, Thank you, Account,
  Sign in, Admin). All are switched **on** so the owner can see them.
- **Admin control room** at `/admin`: page on/off switches (Firestore `settings/site`), content editor
  for products, template designs, projects, developments, Journal posts, courses and events (photo
  uploads to Storage `public/content/…`), inbox for messages, quotes and investor leads.
- **Rules changed** (`firestore.rules`): `templates`, `developments`, `settings` (public read, admin
  write); admin update on `messages`, `investorLeads`, `members`; donors read their own `donations`.
  Deploy the rules to the emulator before testing (they load from the file automatically).
- **Speed:** public pages read Firestore over REST (no SDK); Home 3D loads when idle, renders only
  while visible, adapts its resolution; service worker `public/sw.js` (production builds only); new
  cache headers in `firebase.json`.
- **Look:** coarse paper textures (regenerate with `python3 scripts/make-textures.py public/textures`),
  torn edges cut from the same paper, green tree silhouettes, page motifs (plots, estate, forest,
  academy, market), sun/moon following Kampala time, edition following the Kampala clock until the
  visitor chooses, small round plant-a-tree button.
- Round-2 items: drag hint moved at 360 px; Studio table is a labelled, focusable scroll region with
  scroll shadows; the `Header.jsx` lint warning is gone (`data/nav.js`, `ThemeSwitch.jsx`); `UGX [price]`
  placeholders are intended until real prices arrive.

**Please check (round 3)**
1. `npm run lint` and `npm run build`; record the main chunk size and that `firebase/firestore` is not in it.
2. All new routes at 360 / 768 / 1440 in both editions; tab through Admin, Account tabs and the forms.
3. Make yourself admin against the emulators:
   `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/set-admin.js you@example.com`
   (after signing in once with the emulator's Google sign-in; `npm install --no-save firebase-admin`).
   Then on `/admin`: turn a page off and check its links disappear for a signed-out window; import the
   starter products, edit one, upload a photo, check `/stores` shows it.
4. `npm run build && npm run preview`: the service worker registers (DevTools → Application), a reload
   offline still shows the site.
5. Home on a mid-range phone: frame rate and how quickly the text appears.

## From the cloud session (round 4)

Latest: 2026-10-24. The owner approved the **Launch track** (see `docs/build-plan.md`): L1 speed and
opening, L2 security, L3 funnel, L4 admin data, L5 SEO, L6 marketing studio, L7 team accounts. The owner's
own to-do list is `docs/owner-checklist.md`.

New in this round (L1 + L2 groundwork; later commits add L3–L7):
- **Opening animation** in `index.html` (inline, runs before the app). Skipped for `navigator.webdriver`,
  so Playwright/Lighthouse never see it; to test it by hand, open the site in a normal window (clear
  sessionStorage `fc-intro` and localStorage `fc-intro-seen` to see the full version again).
- **Home**: still pictures of the hotel (`public/images/hotel-*.webp`) show first; live 3D fades in over
  them. They were rendered here with software WebGL — please re-render them on the office machine with the
  real GPU: `npm run dev`, then `npx --yes playwright@1 install chromium` (once) and
  `node scripts/render-hotel-stills.mjs`. Commit the four WebP files.
- Phones: "Tap to explore the model" on slower devices; no blur over the canvas; layer sized `100lvh`.
- `firebase.json`: security headers, report-only CSP, `cleanUrls`, `functions` source.
- `functions/` (not deployed — Blaze needed): run `npm --prefix functions install` and
  `node --check functions/index.js`; with the emulators: `firebase emulators:start` (functions on 5001).
- `.github/workflows/ci.yml` + `lighthouserc.json`: lint, build and Lighthouse on push/PR.


### Reply to the owner brief (cloud session, 2026-10-24)

1. **Hero — agree, with one change.** No second landscape and no gap: the page now shows a **still picture
   of the 3D scene's own first frame** (landscape *and* building, `public/images/hotel-*.webp`) at once and
   keeps it underneath; the live canvas fades in over it after its first frame is drawn. So the instant
   view and the 3D scene can't drift apart (they're the same render), and there's nothing to remove after
   the fade. `PaperLayers` is no longer used on Home. A separate transparent building cut-out isn't needed
   with this approach. When the owner's landscape models arrive (A), the stills are re-rendered from them.
2. **Skies — agree.** The other pages get one shared sky (being built now: day gradient + Kampala-clock
   sun + few clouds; night navy → faint city glow, a few hundred small stars, a handful twinkling, the moon,
   no twinkle with reduced motion). Home's sky comes from the 3D scene (and its still).
3. **Views and zoom — agree, built.** Front / Back / Cutaway / Site buttons, + / − and reset; Ctrl + wheel
   and pinch zoom; plain wheel and one-finger swipes scroll the page; zoom limits 0.6×–1.6×. The scroll-
   driven views stay: the view you pick replaces the page-top view, the rest of the scroll story is
   unchanged. A full 360° turn by dragging stays limited until the all-round landscape exists (A); the
   Back view already shows the rear.
4. **Device levels — agree, built.** Full / Standard / Lite (+ Still without WebGL) from connection, memory,
   cores, screen and the WebGL renderer name, then a live frame check: if frames stay too slow even at the
   lowest resolution, it drops to Lite; a smooth run is remembered. Result stored per device for 30 days
   (`fc-3d-level`). **Build freeze:** the scene build now yields between sections and compiles shaders
   asynchronously; more splitting follows once task 2 shows where the rest of the time goes.
5. **Measuring real visitors — waiting for the owner (C).** Ready to add `web-vitals` + the level/frame
   rate into Analytics (after cookie consent) or Firebase Performance Monitoring.
6. **Plant-a-tree pop-up, offline Home, product gallery, lint warnings — in progress in the cloud.**
- **D.** Full-turn landscape plus zoom within budget: yes, if the landscape is built as cheap layered
  cards / a backdrop dome with the true-3D items limited to the plot. First to cut if it's slow: the
  drifting paper scraps, then the night fireflies, then shadow resolution.

**Please check (round 4)**
1. `npm run lint`, `npm run build` (main chunk size; three.js and Firestore still separate chunks).
2. The opening animation in a real browser at 360 px and desktop, both editions: full (first visit),
   quick (second visit, new session), none (same session), reduced motion (fade). Tap skips. The mark should
   land on the header logo; tell the cloud session if it's off by more than a few pixels.
3. Home on a real phone: no flicker at load or while scrolling; the still → live handover is smooth.
4. Re-render the hotel stills (above).

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
