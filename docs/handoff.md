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

## Proposal: Home hero, still image → 3D (needs your agreement before anyone builds it)

Raised by the owner on 2026-10-24 after watching Home load. Matches the plan agreed with the owner in
the chat ("load a still image and fade into the 3D"). **Reply in "From the cloud session" with agree /
change / object for each point; nobody edits `HotelScene` for this until you've answered.**

**What happens today (measured locally)**
- `HotelScene` shows `PaperLayers` (torn-paper hills) while the 3D downloads. The 3D scripts
  (`hotelDay.js`, `hotelNight.js`) then draw their **own, different** torn-paper hills. So the visitor
  sees landscape A, A vanishes, landscape B fades in around the hotel.
- The swap has a gap: `PaperLayers` unmounts the moment `ready` is true, but the canvas starts at
  `opacity: 0` and fades over 0.9 s, so the hero is nearly empty for that moment.
- The ~8 s main-thread block (round 3, item 1) lands during this handover.

**Proposed**
1. **Still = the 3D scene's own first frame.** A render of the hotel *and its landscape* from the exact
   starting camera, one for day and one for night, so the fade looks like the model coming alive rather
   than a picture change. WebP at 800 and 1600 px (aim ≤ 80 kB each), `<link rel="preload">` for the
   current edition so it arrives with the text.
2. **Drop `PaperLayers` from Home.** The still replaces it, including as the fallback when 3D isn't used
   (reduced motion, Save-Data, low memory, no WebGL): those visitors see the real building, not
   generic hills. Other pages keep their paper heroes.
3. **Crossfade without a gap.** Canvas fades in over the still after the first frame is drawn; the
   still is removed only when that fade has finished (`transitionend`).
4. **Day/night switch:** swap the still instantly, then crossfade into the other scene the same way.
5. **Phones (proposal, owner still deciding):** until the freeze is fixed, phones keep the still and
   load the 3D only on a tap ("Turn the model") or on larger screens; desktop crossfades automatically.
6. **Making the stills, split between us:**
   - *You:* add a way to render the starting frame and stop (e.g. `?still=day|night` on Home, or a
     `createHotelScene(canvas, { still: true })` option) with the final starting camera, plus the
     `<picture>`/preload and crossfade code.
   - *Local:* run that on this machine at the needed sizes, save `public/images/hero-{day,night}-{800,1600}.webp`,
     check by eye with the owner, commit. (Headless here uses software WebGL; if it looks flat, the owner
     can capture in a real browser instead.)
   - Does the framing differ between portrait phones and desktop enough to need separate phone stills?
     Tell us the camera rule and we'll capture both if so.

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

Latest: 2026-10-24, **round 3** (checked `f651610`). Draft PR: https://github.com/formcraft/formcraft-web-27/pull/1
Rounds 1–2 are done and your round-2 fixes check out (drag hint, Studio table, Header lint, prices).

**Round 3 results**
- Lint and build pass (see status table). `firebase/firestore` is not in the main chunk.
- 27 routes × 3 widths × 2 editions: no overflow, one h1 each, meta descriptions, no JS errors.
  `settings/site` and `stats/public` 404 on an empty emulator (expected; defaults used).
- Admin (emulator, `formcraftinc@gmail.com` via `set-admin.js`): turning Academy off removes all
  3 links for a signed-out visitor and `/academy` shows "opens soon"; back on restores them.
  "Import the starter list" imported 6 products; edit + photo upload to Storage + Save → a fresh
  signed-out browser sees the new title on `/stores` and the product page.
- Service worker registers on `npm run preview` (static 31, pages 1, media 7 cached); `/about` and
  `/stores` reload offline.

**Please fix**
1. **Home freezes after it paints.** Text is up at 1.3 s, but one task blocks the main thread for
   8.1 s (12.3 s total) while the hotel scene starts; nothing is clickable meanwhile. Headless Edge
   uses software WebGL, so a real GPU will be faster, but please split the scene build into chunks
   (yield between floors/meshes, or build in a worker) and measure on a real mid-range phone.
2. **Offline Home is a blank page.** After one visit, going offline and reloading `/` shows nothing:
   the service worker doesn't have `/assets/index-*.js` because the first page load wasn't
   controlled. Precache the entry bundle and CSS at install (read them from `index.html` or a build
   manifest), and make sure Home renders without the 3D chunks. Even after three visits, `/` stayed
   blank offline while `/about` and `/stores` worked.
3. **Extra product photos never show.** Firestore holds `images: ["chair", "<storage url>"]`, but
   `/stores/:slug` renders only `images[0]`. Show a gallery (or thumbnails) for the rest.
4. **Lint warnings** in `admin/InboxPanel.jsx:14` and `page/Photo.jsx:6` (`only-export-components`).

**Not done here:** a real mid-range phone (step 5 of round 3). Pointer-follow and pause-when-hidden on
the 3D scene still need a person in a real browser.

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
