# Ideas log: owner ideas and proposals for the cloud session to sort

> **Owner's standing rule (2026-10-24):** every idea discussed with the local Claude Code is written here,
> so the cloud session can sort, schedule or answer it. Nothing stays only in chat.
>
> **For the cloud session:** for each entry, set **Status** (`new` → `accepted` / `changed` / `declined` →
> `in progress` → `done in <commit>`) and add a line under **Cloud notes**. Ask the owner through
> `docs/handoff.md` when an entry needs a decision. Newest first.
>
> **Local side:** add an entry for every idea, keep its status in step with the commits, link to fuller
> write-ups (the owner brief, handoff sections) instead of repeating them.

| # | Idea | Area | Status | Where |
| --- | --- | --- | --- | --- |
| 25 | Admin section tidy: text that doesn't match, wording not well organised; the full site test covers the admin screens signed in (emulators) as well as smoothness, data richness, flexibility and UI | Admin, checks | **asked by owner**; **cloud proposal in `docs/handoff.md`** (one status list for leads — a real bug today —, Leads as the one place for contacts, menu label = heading, "Social planner" instead of "Studio", grouped menu, "team" wording); local side builds; covered by the full site test after the sky features | `docs/handoff.md` |
| 24 | Admin → Features: switch site features on and off, **each weather scene on its own (partly, overcast, mist, rain, storm; clear day/night always on; off scenes fall back to the nearest calmer one; owner 2026-10-24)** (sky: sun/moon drag, fluid stars/clouds, wind, weather scenes, live sync, storm; also opening animation, email prompt, plant-a-tree button, Home 3D model). Saved in `settings/site.features`; a feature that's off loads no code | Admin, all pages | **asked by owner**; design answered by the cloud (brief Q9): build before Sky 1, list + never-off list + dependencies | `docs/brief-living-sky.md` |
| 23 | Living sky that matches Kampala's weather: wind (trees sway, clouds drift; Admin → Motion "Wind strength" slider 0–2× scaling the real wind), overcast / rain / storm scenes (soft cloud glow, never bright flashes; behind the hero text), synced automatically every 30 min by a Cloud Function (MET Norway proposed: free incl. commercial with a credit line, terms to confirm; Open-Meteo's free tier is non-commercial) into one public record; Admin "Weather": Auto / clear / rain / storm. Page heroes first, Home 3D later | All page heroes, Admin, functions | **discussed with owner**, **approved by the owner** (storm yes); design brief to the cloud: `docs/brief-living-sky.md`; **design answered by the cloud** (Q3–Q8); **weather shapes written by the cloud** (`sky/weatherShapes.js`, C3) and a scene tester for the owner; local wires it in (L7) | chat 2026-10-24 |
| 22 | Drag the moon (night) or the sun (day) around the sky: stars part around the moon like water and flow back behind it; clouds drift aside from the sun; on release it glides back to its Kampala-clock place. Stars move to a canvas (springs + push), runs only while dragging/settling; reduced motion: drag only, stars still. **Owner: a secret: no hint, tooltip or mention anywhere visitors can read (site text, Journal, posts, SEO); only a subtle glow on hover** | All page heroes (Home 3D later) | **approved by the owner**; **design answered by the cloud** (Q1, Q2, Q10); **engine written by the cloud** (`src/components/scene/sky/`, C2 in `docs/work-split.md`) and a tuner page for the owner; local wires it in (L4) | chat 2026-10-24 |
| 21 | Admin → Copy: every piece of text on the site editable from Admin (length limits, preview, drafts, history, size presets), plus a simpler permission model: one owner (Emlyn Atochon) assigns permissions; everyone else on the team gets the same full access for now; roles such as blog writers with review added later | Admin, all pages, marketing | **in progress**: pilot (Home, owner model) on `try/copy-pilot` for the owner to try | chat 2026-10-24; plan to be written into the build plan on go |
| 20 | Pre-render the public pages at build time so phones show the page before the JavaScript runs (Lighthouse mobile 41–61 today; most of it is ~4.7 s render delay from client-side rendering) | Speed, SEO | **proposed by local side**, needs the owner's go-ahead (build-plan Phase 5) | §19–20 below |
| 19 | UI beauty pass: email prompt out of the way, drawing-sheet photo placeholders, Home/Stores/About phone fixes | All pages | **done** (UI beauty pass commit) | §19–20 below |
| 18 | Documentation anyone can follow: guides in `docs/`, a plain-English header on every file, inputs/outputs on every export, a documentation standard in `CLAUDE.md` | All code | **proposed by owner**, local side, waiting for go-ahead | §16–18 below |
| 17 | Full review of code and graphics: text overlapping, panels covering text while scrolling; clean and neat everywhere | All pages | **proposed by owner**, local side | §16–18 below |
| 16 | Offline checks (GitHub Actions is blocked by billing): `npm run check` with lint, build, SEO files, size budget, every route × 3 widths × 2 editions in local Chrome, overlap detection while scrolling, screenshot report; `check:speed` with local Lighthouse | Tooling | **proposed by owner**, local side | §16–18 below |
| 15 | Opening tear rips from one side, like a page torn out of a pad | Opening | **done** in the Home commit | handoff round 5 |
| 14 | Animation timing settings in Admin | Admin, all pages | **done**: Admin → Motion | handoff round 5 |
| 13 | Background first, then the 3D builds on it; 2D drawing only for the slowest devices; crisp everywhere; controls as a minimal left rail | Home | **done** in the Home commit | handoff round 5 |
| 12 | Paper scraps falling like stones, visible again and kept that way | Home 3D | **done** in the Home commit after `cc73970` (own seed, near layer, colours, speed) | §12 below |
| 11 | Paper texture that really pops (concrete-paper you can almost feel) | Home 3D | **built (cloud)**: paper sized in metres of wall + a normal map (`scripts/make-hotel-textures.py`); to verify on the Intel and NVIDIA GPUs and at 360 px (handoff round 6) | handoff "Owner decisions 2026-10-24" |
| 10 | Ultra as a real level for strong desktop GPUs, not only a dev preview | Home 3D, speed | accepted for later; `ultra` ported as a dev preview | §10 |
| 9 | Dev-only quality preview: Auto / Ultra / Best / Mid-range phone / Slow phone / No 3D | Dev tooling | **done** (ported from `try/auto-live`; "No 3D" is now "2D drawing") | handoff round 5 |
| 8 | No "Tap to explore": the model always comes in by itself, later on slow devices | Home 3D, speed | **done**: most devices build the 3D (slow connections later); only the slowest get the 2D drawing; never a tap | handoff round 5 (owner correction) |
| 7 | Seamless still → live: same angle, model moving at once, labels fade in, scraps start where the still has them | Home 3D | **changed**: no still any more; background first, then the model builds; labels after the build | handoff round 5 |
| 6 | Start the 3D after the opening animation, so its build can't freeze the intro | Opening, speed | **done** (`introDone()` in `HotelScene.jsx`) | §6 |
| 5 | Stills script that works on Windows (NVIDIA flag, hidden scrollbar, Node-only WebP) | Tooling | **declined**: stills removed | handoff round 5 |
| 4 | Measure real visitors (web-vitals / Performance Monitoring) | Speed | waiting for owner (C) | owner brief §5 |
| 3 | Device levels with a live frame check, remembered per device | Speed | done in `a5c5955`; now full / standard / 2D, never downscaled | owner brief §4 |
| 2 | Front / Back / Cutaway / Site views, zoom, reset | Home 3D | done in `a5c5955` | owner brief §3 |
| 1 | Sky and landscape first, building fades in; Home's own sky; one shared sky for other pages; all-round landscape from the owner's models | Home, all heroes | accepted; shared sky done in `ffff37a`; models waiting for owner (A) | owner brief §1–2 |

---

## §19–20 UI beauty pass and pre-rendering (local side, 2026-10-24)

**Owner:** "...Smoothness checks. And then UI beauty."

**Done (§19):** see the "UI beauty pass" row in `docs/current-code.md`.

**Proposed (§20):** pre-render each public route into its HTML at build time (the SEO step already writes a
folder per route; it would also write the page's markup), then let React take over. Expected: it removes most
of the ~4.7 s render delay Lighthouse measured (to be measured again after). Risks: the 3D Home and auth-aware
parts must render the same on the server and in the browser; best done after Phase 1 content settles.
**Waiting for the owner.**

**Cloud notes:**

---

## §16–18 Offline checks, full review, documentation (owner, 2026-10-24)

**Owner:** "Let us build offline checks, because I am broke. Then read through the entire codebase and the
graphics of the site; I'm seeing a lot of text mismatching, some windows as I'm scrolling on the new version.
I want it fully clean and neat. Add professional-level documentation to the code so that even a child could
understand it, to share with developers or review in the future."

**Context:** GitHub Actions runs on `paper-edition` all fail before starting: "recent account payments have
failed or your spending limit needs to be increased". Not a code problem.

**Plan (local side, in this order, once the owner approves):**
1. **Offline checks.** `npm run check` runs:
   - lint and build, plus the SEO output (a folder per route, `sitemap.xml`, `robots.txt`);
   - a main-JS size budget;
   - every route at 360/768/1440 × day/night in the installed Chrome (`playwright-core`, no browser
     download): sideways overflow, text overlapping text or fixed elements (header, control rail,
     plant-a-tree button) at several scroll positions, one h1, title and description, JS errors,
     broken images and links;
   - an HTML screenshot report.

   `npm run check:speed` runs local Lighthouse. Proposed: switch `.github/workflows/ci.yml` to manual only.
2. **Full review:** `docs/audit.md` with findings and screenshots by page and severity. Layout and CSS fixes
   by the local side; 3D scene and page-design fixes by the cloud session (to be confirmed by the owner).
3. **Documentation:**
   - guides in `docs/` (start here, architecture with a diagram, folder guide, glossary, recipes);
   - a plain-English header on every file, inputs and outputs on every exported component and function,
     and comments on the tricky parts (3D build, payments, rules);
   - a documentation standard in `CLAUDE.md` for all future code.

**Coordination asked of the cloud session:** the local side will work **one folder at a time** and announce
it in `docs/handoff.md` before starting. Please avoid editing that folder until its commit lands (or pull
and rebase on it), and follow the documentation standard in new code once it's in `CLAUDE.md`.

**Cloud notes:**

## §12 Paper scraps falling like stones (2026-10-24)

**Owner:** "Earlier, the 3D image had nice simple small pieces of paper falling around like stone. They were
minimal but really interesting. On the new version they are static, or they are not there."

**What the local side found:**
- The scrap code in `hotelDay.js` / `hotelNight.js` is unchanged since `18a16bf`: 34 pieces (12 on
  phones), 0.25–0.7 m, 25 % rust, 13 % navy, the rest white, falling 0.2–0.55 m/s. They do still move. Three
  frames 2 s apart in Chrome show them falling.
- What changed is **where they land**. They take their positions from the shared `rnd()` sequence (seed
  12345). The trees, greenery and other details added since Phase 1 call `rnd()` first, so the same code
  now draws a different set of positions. In Phase 1 a few dark navy and orange pieces happened to fall close
  to the camera near the headline. Now none do, and most in view are small pale tan or white pieces that
  vanish against the white day sky.
- They look static on the still picture (frozen in the image) and wherever the live scene didn't start (the
  old "Tap to explore" level).

**Proposal:**
1. **Their own seeded random** (separate seed), so other scene changes never move them again.
2. **A deliberate near layer:** about 6 larger pieces placed between the camera's hero view and the building,
   around the headline area, plus about 28 further back for depth. Respawn the near ones inside the hero
   frustum.
3. **Contrast:** more navy and rust, fewer white (e.g. 35 % rust, 30 % navy, 35 % white); at night, rust and
   white against the navy.
4. **Feel:** they drop like stones with a slow tumble, never many at once. Slightly faster (e.g.
   0.35–0.7 m/s), so the movement reads in the first seconds.
5. **Phones:** about 12 pieces, the near layer kept.
6. **Still match:** the stills capture them at their start positions (`env.still` on `try/auto-live` already
   freezes them in capture mode); they start falling as the live model fades in.

**Open:** the owner may have a screenshot of the Phase 1 look (how many, which colours). The local side
can render a comparison of Phase 1 (`18a16bf`) against now on request.

**Cloud notes:** done as proposed (points 1–5); point 6 no longer applies (no stills). They're hidden during
the opening build and start falling when it ends. Near pieces respawn in the hero view.

## §10 Ultra as a real level

On the NVIDIA Quadro T1000 the Ultra preview runs at 29 fps at 2880 × 1800 (2× pixels, 4096 px shadows,
antialiasing). Strong desktop GPUs could get it for real, e.g. when the WebGL renderer name matches a
discrete GPU (NVIDIA/AMD/Apple M-series) and the frame check stays smooth at full. Not on the Intel UHD 630
(5 fps).

**Cloud notes:** agreed for later. Ported as a dev preview level; promote it once round 5 has fps numbers
for the new build sequence.

## §6 Start the 3D after the opening animation

The night first visit took 9–11 s, because the overlay's timers stalled while the night scene was being
built. Waiting for `#fci` to be removed before calling `createHotelScene` (or yielding more in the build)
keeps the opening smooth. The still covers the hero meanwhile.

**Cloud notes:** done: `HotelScene` waits for `fci-run` to go (max 8 s) before loading the scene.
