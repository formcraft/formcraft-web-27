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
| 12 | Paper scraps falling like stones, visible again and kept that way | Home 3D | **new**, owner choosing: try on a branch first, or brief only | §12 below |
| 11 | Paper texture that really pops (concrete-paper you can almost feel) | Home 3D | sent, needs design | handoff "Owner decisions 2026-10-24" |
| 10 | Ultra as a real level for strong desktop GPUs, not only a dev preview | Home 3D, speed | idea | §10 |
| 9 | Dev-only quality preview: Auto / Ultra / Best / Mid-range phone / Slow phone / No 3D | Dev tooling | built on `try/auto-live` | handoff, branch |
| 8 | No "Tap to explore": the model always comes in by itself, later on slow devices | Home 3D, speed | **decided by owner**, built on `try/auto-live` | handoff |
| 7 | Seamless still → live: same angle, model moving at once, labels fade in, scraps start where the still has them | Home 3D | partly on `try/auto-live` (motion, capture freeze); labels open | handoff round 4 |
| 6 | Start the 3D after the opening animation, so its build can't freeze the intro | Opening, speed | idea | §6 |
| 5 | Stills script that works on Windows (NVIDIA flag, hidden scrollbar, Node-only WebP) | Tooling | idea | handoff round 4 |
| 4 | Measure real visitors (web-vitals / Performance Monitoring) | Speed | waiting for owner (C) | owner brief §5 |
| 3 | Device levels with a live frame check, remembered per device | Speed | done in `a5c5955`, revised on `try/auto-live` | owner brief §4 |
| 2 | Front / Back / Cutaway / Site views, zoom, reset | Home 3D | done in `a5c5955` | owner brief §3 |
| 1 | Sky and landscape first, building fades in; Home's own sky; one shared sky for other pages; all-round landscape from the owner's models | Home, all heroes | accepted; shared sky done in `ffff37a`; models waiting for owner (A) | owner brief §1–2 |

---

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

**Cloud notes:**

## §10 Ultra as a real level

On the NVIDIA Quadro T1000 the Ultra preview runs at 29 fps at 2880 × 1800 (2× pixels, 4096 px shadows,
antialiasing). Strong desktop GPUs could get it for real, e.g. when the WebGL renderer name matches a
discrete GPU (NVIDIA/AMD/Apple M-series) and the frame check stays smooth at full. Not on the Intel UHD 630
(5 fps).

**Cloud notes:**

## §6 Start the 3D after the opening animation

The night first visit took 9–11 s, because the overlay's timers stalled while the night scene was being
built. Waiting for `#fci` to be removed before calling `createHotelScene` (or yielding more in the build)
keeps the opening smooth. The still covers the hero meanwhile.

**Cloud notes:**
