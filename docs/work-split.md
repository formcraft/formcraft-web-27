# Who does what: cloud session and local Claude Code (2026-10-24)

> Owner's request: "choose your share of work and send the md to Code's part of the workload."
> The cloud session wrote this; the local Claude Code works from it. Rules from `CLAUDE.md` apply to both
> (commit per task, no AI attribution, docs in the same commit, pull and reconcile around every push).

## The split in one line

**Cloud: design and self-contained pieces.** It writes new modules that don't touch the app's wiring, plus the 3D
scenes and the look.
**Local: wiring, checks and everything that needs npm, a real browser or the emulators.** It plugs those modules in,
keeps the site fast and correct, and runs the owner's click-throughs.

## File ownership (to avoid merge conflicts)

| Owner | Files |
| --- | --- |
| **Cloud only** | `src/components/scene/sky/*` (new folder), `src/components/scene/hotel/*`, `scripts/make-hotel-textures.py`, `functions/weather.js` (new), `docs/brief-living-sky.md` |
| **Cloud, once** | One marked block in `src/styles/tokens.css` (`/* weather (cloud) */`, day and night). After that it belongs to local like the rest of the file. |
| **Local only** | Everything else: `src/pages/*`, `src/components/admin/*`, `layout/*`, `Sky.jsx`, `PaperLayers.jsx`, `sceneGeometry.js`, `firestore.rules`, `storage.rules`, `scripts/check/*`, `src/data/features.js`, routes, `functions/index.js` |
| **Shared docs** | `docs/handoff.md` (each side writes its own section), `docs/ideas.md` (status column), `docs/current-code.md` (each side adds its own change-log rows; pull first) |

If either side needs to change a file the other owns, write the change into `docs/handoff.md` as a request instead.

## Cloud session's share (in this order)

| # | Task | Gives local |
| --- | --- | --- |
| C1 | **Living sky tuner**: a private page where the owner drags the sun and moon and tunes the springs. **Done**; the owner's numbers are in `SKY_DEFAULTS`. | Final numbers for C2 |
| C2 | **Done.** **`src/components/scene/sky/skyPhysics.js` + `moonPhase.js`**: the stars/clouds/sun-and-moon engine from the tuner as plain JavaScript (no React), with the contract below. Plus the moon phase, the lit shape and the equator "boat moon" turn. | Something to wire into `Sky.jsx` (L4) |
| C3 | **Done.** **`sky/weatherShapes.js` + the weather token block**: torn-paper cloud decks, the storm cloud and its glow timing, the mist "vellum" band, the rain-sliver and splash drawer (canvas), wet-paper overlay. Plus a tuner page for the scenes so the owner can see them first. | Shapes and drawers for L7 |
| C4 | **Done.** **`functions/weather.js`** (+ `weatherMap.js`, tested): MET Norway sync every 30 min (User-Agent, `If-Modified-Since`, 4-decimal lat/lon), symbol → scene mapping as a pure, tested function, writes `stats/weather` and a private `weatherMeta/kampala`. Written, not deployed. | Something to test in the emulator (L9) |
| C5 | **Home 3D look**: paper tuning on feedback, the night edition, later rain and wind on the model (Sky 5). | — |
| C6 | **Design reviews on request**: admin wording (done in `handoff.md`), page visuals, copy organisation. | Lists in `handoff.md` |

## Local Claude Code's share (in this order)

| # | Task | Notes |
| --- | --- | --- |
| L1 | **Merge `paper-edition` into `try/features` and `try/copy-pilot`**, run `npm run check`, and let the owner click through. Merge into `paper-edition` only after the owner's OK. | Only `docs/current-code.md` and `docs/ideas.md` conflict (keep both sides' rows) |
| L2 | **Admin tidy (#25)**, starting with the **one status list** bug (Leads and Inbox write the same `status` from different lists). Then the menu regrouping, menu label = heading, "Social planner", "team" wording. Add the signed-in admin pass to `npm run check`. | Cloud's proposal: `docs/handoff.md` |
| L3 | **Weather-scene switches** in Admin → Features (partly, overcast, mist, rain, storm; clear always on; fallback chain), per the brief's owner addition. | `src/data/features.js` |
| L4 | **Sky 1 wiring**: stars on a canvas in `Sky.jsx`, drag on `SkyBody`, using C2. Pause off screen, reduced motion, `check:smooth`, CLS. On its own `try/sky-1` branch. | Starts as soon as C2 lands; the contract below lets you start the canvas first |
| L5 | **Pre-rendering (#20)**, after copy step A is merged. | Biggest speed win left |
| L6 | **Sky 2: wind**: split each tree row into three groups (own small `<svg>` each), sway keyframes, gusts, the Admin "Wind strength" slider. | Numbers in the brief, Q3 |
| L7 | **Sky 3: weather scenes**: wire C3; Admin "Weather" select; the team's sky tester; `?sky=` links; per-scene contrast in `npm run check`. | |
| L8 | **Copy step B** (every other page into Admin → Copy). | |
| L9 | **Sky 4: live sync**: test C4 in the emulator; deploy only when the owner turns on Blaze and asks. | |
| L10 | **Every round**: `npm run check`, real-GPU checks for anything 3D, `docs/current-code.md`, results under your section in `handoff.md`. | |

## Contract for C2 (so L4 can start now)

```js
import { createSkyField } from "./sky/skyPhysics";
import { moonPhase, moonLitPath } from "./sky/moonPhase";

const field = createSkyField({
  stars,                 // [{ x, y, r, a }] in CSS px of the hero (homes)
  clouds,                // [{ x, y, w, h }] centres and sizes in CSS px (homes)
  discR,                 // the sun/moon disc radius in CSS px
  home: { x, y },        // the Kampala-clock place, CSS px
  bounds: { w, h },      // the hero size; dragging past it rubber-bands
  params,                // optional overrides of the design numbers (from the tuner)
  reduced,               // true: stars and clouds stay still; the drag still works
});
field.grab(x, y, t); field.drag(x, y, t); field.release(t);   // pointer events, t = performance.now()
field.setHome(x, y); field.setBounds(w, h);                    // on resize or when the clock moves it
const busy = field.step(dt);  // advance (fixed sub-steps inside); false = settled → stop requestAnimationFrame
field.body;    // { x, y, held }        → transform on SkyBody (scale 1.08 while held, via CSS)
field.rings;   // [{ x, y }] × 3        → the ring lag
field.stars;   // same array, with x, y, alpha (incl. sparkle) → draw on the canvas
field.clouds;  // [{ dx, dy, tilt }]    → transforms on the cloud pieces
moonPhase(date)            // → { age, fraction, waxing, name }
moonLitPath(phase, r = 44) // → { d, rotate } for the SVG clip of the lit part
```

**Wiring the drag (lesson from the tuner page, where the drag first failed inside the claude.ai viewer):**
- listen for `pointerdown` on the hero, not the disc, and start a drag only within 1.6 × the disc radius of its centre;
- follow `pointermove` / `pointerup` / `pointercancel` on `window`, with `setPointerCapture` inside a try/catch;
- set `user-select: none` on the hero and cancel `dragstart`, so a native text or image drag can't steal the
  gesture;
- use `touch-action: none` on the disc and on the hero only while dragging; everywhere else the page still scrolls.

No DOM, no timers, no React in these modules: the caller owns `requestAnimationFrame`, the canvas and the elements.
That keeps them easy to test and lets the local side decide how they fit the paper scene.

## Contract for C3 (weather, for L7)

```js
import { SCENES, fallbackScene, windFromMs, deckFor, puffsFor, stormCloud, mistBand, createStormGlow, createRain } from "./sky/weatherShapes";

const kind = fallbackScene(stats.kind, features.weather);  // switched-off scenes fall back to a calmer one
const sc = SCENES[kind];        // { wash, glowK, decks, puffs, storm, mist, rain, wet, stars, sun, moon, minWind }
const wind = windFromMs(stats.windMs, motion.wind, kind) * dir;  // dir = -1 for an easterly wind
deckFor(kind, w, h)             // [{ d, tone }] in drawing order; fill with var(--cloud-deck-back | -front | --cloud-storm-back | -front)
puffsFor(kind, w, h)            // [{ sheets: [{ d, tone: "back"|"front" }], cx, cy, w }]: layered paper clouds (owner's reference);
                                //   fill front var(--sc-cloud), back var(--cloud-back); each sheet filter: drop-shadow(0 5px 6px var(--cloud-shadow));
                                //   one <g> per cloud, drift 4 px/s × wind
stormCloud(w, h)                // { sheets, d, glow: { cx, cy, r } }; sheets toned storm-back / storm-front; clip the var(--storm-glow) gradient to d
mistBand({ w, h, horizon })     // { d, top, bottom }; fill with a vertical gradient of var(--mist); put it between the mid and near hills
const glow = createStormGlow(); glow.step(dt)            // → opacity 0–1 this frame (skip with reduced motion)
const rain = createRain({ w, h, amount: sc.rain, wind, budget, ridge: (x) => frontHillY(x) });
rain.step(dt); rain.draw(ctx, { near: css("--rain"), far: css("--rain-far") });
```

Layer order in the hero, back to front: sky gradient (opacity follows `glowK`), wash (`var(sc.wash)`), star canvas
(opacity `sc.stars`), the sun or moon (opacity `sc.sun` / `sc.moon`), storm glow + storm cloud, deck strips, puffs,
hills (with mist between mid and near, and a `var(--wet)` copy of the near and front hills when `sc.wet`), rain
canvas, hero text. With reduced motion: draw one still frame of rain, no glow, no drift.

**Cloud look (owner, 2026-10-24):** paper-cut clouds like the owner's reference picture: layered sheets with soft
shadows between them, white by day and navy-grey by night. The old one-piece `puffCloud` is gone; use `cloudGroup`
or `puffsFor`.

## Hand-over for C4 (live weather, for L3 and L9)

- **`functions/index.js`** (yours): add `export { syncKampalaWeather } from "./weather.js";` next to the studio line.
- **Admin → Features** (`src/data/features.js`, L3): add `liveWeather`, label "Live Kampala weather", default **off**,
  `needs` the weather-scenes switch. The function does nothing while it's off, so nothing is downloaded before Blaze.
- **Credit** while `liveWeather` is on: "Weather data: MET Norway (CC BY 4.0)" on `/privacy` and in the footer
  small print. Don't use the name "Yr" or its logo.
- **Rules:** nothing to add. `stats/*` is already public read and functions-only write; `weatherMeta/*` matches no
  rule, so nobody can read or write it from a browser. Add a rules test that confirms that.
- **Site side:** read `stats/weather` over REST and cache it. Treat it as stale after 3 h (use `at`) and show clear
  then. Map `windMs` with `windFromMs(windMs, motion.wind, kind)`; the direction sign comes from `windFromDeg`
  (east of north → the wind blows right → left, so negative).
- **Test:** `node --test functions/weatherMap.test.js`. In the emulator, turn `liveWeather` on in Firestore and run
  the schedule from the Functions emulator. The emulator makes a real request to api.met.no, so keep it to a few runs.
