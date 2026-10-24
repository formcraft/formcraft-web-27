# Design brief for the cloud session: the living sky (ideas #22 and #23, 2026-10-24)

> From the local Claude Code, at the owner's request. **The owner's split:** the cloud session designs the look
> and feel; the local side writes most of the code from that design, checks it and keeps the site fast.
> Please design, reply under each question below (and add sketches, values or a small prototype on a `try/`
> branch if that's quicker), commit, push and tell the owner. The local side builds from your reply.
> `git pull` first: latest local commit `cd3426e`.
>
> **Cloud session, 2026-10-24: answered below (all 10).** Short version: water-like springs with one soft
> overshoot; the sun and moon are paper pieces you lift; sway in three groups per tree row with gusts that
> travel; rain as cut-paper slivers; torn-paper cloud decks; a tracing-paper mist scene; MET Norway (CC BY 4.0)
> mapped by symbol code; one canvas for stars *or* rain; `?sky=` links for everyone so `npm run check` can test
> every scene; Features panel before Sky 1; real moon phases (a Kampala "boat moon").

## What the owner asked for (chat, 2026-10-24, approved: "I like all")

1. **Drag the moon (night) and the sun (day)** around the sky of the page heroes.
   - Night: the **stars react like a fluid**: they part around the moon as it moves and flow back behind it.
   - Day: the **clouds drift aside** from the sun the same way.
   - **The moon is a secret** (owner: "leave the moon as a secret, don't tell anyone"): no hint, tooltip or
     mention anywhere visitors can read (site text, Journal, posts, SEO). At most a subtle glow under a mouse.
2. **Wind** in the day (and night) scenes: trees sway, clouds drift. **Admin → Motion slider "Wind
   strength"**. It scales the real wind.
3. **Weather scenes:** clear, partly cloudy, overcast, **rain** and **storm** (owner said yes to storm).
4. **The scenes match Kampala's weather, syncing automatically.**
5. **A tester the owner can click to change the weather** (and wind, time of day) to see every scene.
6. **Turn features on and off in Admin** (owner, 2026-10-24: "I should be able to turn features on and off in
   the admin panel").
7. **Keep the standard:** fast, responsive, smooth on a mid-range phone. A full site test runs after these land.

## Constraints (from CLAUDE.md, the checks and earlier rounds)

- **Colours only from `tokens.css`** (add sky/weather tokens there, day and night). The paper-cut style stays:
  shapes cut from textured paper, not photo-real effects.
- **Never cover the hero text.** Weather stays behind the headline; contrast stays AA in every scene (the
  offline check measures it).
- **No bright flashes** (seizure risk): a storm is at most a soft glow inside the clouds, slow, and none with
  reduced motion.
- **Reduced motion:** sun and moon can still be dragged; stars, clouds and rain stay still (a static rain
  texture or none, your call); no wind sway.
- **Speed budget:** nothing runs while the hero is off screen (`useOnScreen`, PageHero `data-paused`); clear,
  windless sky with no drag = zero animation frames; one canvas per hero at most; fewer particles on phones
  and on slow devices; no layout shift (CLS stays ~0); `check:smooth` slow frames shouldn't get worse.
- **Touch:** touching the sun/moon drags it; swiping anywhere else still scrolls the page.
- **No sound.**
- **Home** keeps its own 3D sky; weather on Home (rain over the model, wind in its trees) is a later step.

## How the local side plans to build it (please check it fits your design)

- **Stars move to a canvas** in `Sky.jsx` (today they're three merged SVG paths, so they can't move one by
  one): same seeded positions, sizes and twinklers. Each star sits on a damped spring to its home and is pushed
  by the moon within a radius. The loop runs only while dragging or settling.
- **Sun/moon drag:** `SkyBody` gets pointer handlers; on release it glides back to its Kampala-clock place.
- **Wind:** CSS transforms on tree groups per hill in `PaperLayers` (compositor-only), cloud drift speed; one
  variable `--wind` (0–2) set from the weather × the Admin slider.
- **Rain/overcast/storm:** a canvas layer behind the hero text plus SVG cloud variants; sky tint via tokens.
- **Weather data:** a scheduled Cloud Function (every 30 min) reads Kampala's current weather and writes
  one public document (proposed `stats/weather`: `{ kind: clear|partly|overcast|rain|storm, windMs, at }`).
  Visitors read it over REST (no third-party request from their browsers) and cache it. Source proposed:
  **MET Norway** (free for commercial use with a credit line; terms to confirm); **Open-Meteo's free tier is
  non-commercial**. Needs Blaze; until then Admin sets the weather by hand.
- **Admin → Motion:** "Wind strength" slider (0–2×) and "Weather": Auto (Kampala live) / clear / partly /
  overcast / rain / storm (`settings/site.motion.wind`, `settings/site.weather`).
- **Feature switches:** a new **Admin → Features** panel, like Admin → Pages: one switch per feature, saved in
  `settings/site.features` (the document every page already reads, so no extra request), cached on the device,
  admin-only to change. Sky: sun/moon dragging, fluid stars/clouds, wind, weather scenes, live Kampala sync,
  storm glow. Also the site's other optional pieces: opening animation, email prompt, plant-a-tree button, Home
  3D model (off = the 2D drawing), cookie banner stays on (legal). A feature that's off loads no code for it.
  The secret moon is listed plainly as "Drag the sun and moon" (Admin only, visitors never see this panel).
- **Tester:** a "Sky tester" panel to click through weather, wind and day/night, shown in `npm run dev` (next
  to the 3D preview panel) **and** to signed-in team members on the live site (so the owner can show it in a
  meeting). It changes only that browser's view, never the site setting. Plus `?sky=rain` style links for the
  team.

## Questions for you (design)

1. **Fluid feel.** Push radius, strength, spring stiffness and damping for the stars (and clouds by day):
   how far they part, how fast they close, any wobble? A short description or numbers.
   **Reply (cloud):** Think "a stone pulled through still water", not "magnets". Stars part ahead of the moon,
   slide along its sides, and close in behind it a beat later with one soft overshoot.
   - **Model per star:** home `h`, position `p`, velocity `v`, mass `m = 0.6 + r` (bigger stars feel heavier,
     so tiny ones scatter further, which gives depth for free).
     `a = k·(h − p) − c·v + push + wake`, integrated with a fixed 1/120 s step (two sub-steps per 60 Hz frame).
   - **Spring:** `k = 18 s⁻²` (ω ≈ 4.2), `c = 2·ζ·ω` with **ζ = 0.7** → closes in ~1 s with one small,
     visible overshoot. That overshoot is the "fluid" bit; at ζ ≥ 0.9 it reads as rubber.
   - **Push:** radius `Rp = max(90 px, 2.8 × the moon's disc radius on screen)`.
     For `d < Rp`: `push = 2400 px/s² · (1 − d/Rp)² · unit(p − moon) / m`. The squared falloff is a soft edge,
     not a hard ring.
   - **Wake:** `wake = 0.35 · vMoon · (1 − d/(1.6·Rp))₊`. Stars near the moon are dragged along a little, then
     swirl back. This is what makes it look like water, not a force field.
   - **Limits:** no star moves more than `1.6·Rp` from home; the moon's speed is clamped at 2500 px/s.
   - **Sparkle:** a disturbed star brightens by up to +25 % alpha, in proportion to its speed, then fades
     back. Twinklers keep twinkling while they move.
   - **Clouds (day, and at night when there are clouds):** each cloud is one rigid paper piece on its own
     spring:
     - `k = 5 s⁻²`, ζ = 0.85: slow and heavy;
     - push radius = cloud half-width + 1.8 × the sun's radius, strength 600 px/s²;
     - offset at most 140 px, plus a tilt of up to ±2° away from the sun.
     The offset is added on top of any wind drift.
   - **Stopping:** the loop stops when nothing is dragged and every star is within 0.3 px of home and slower than
     2 px/s. A clear, windless sky then draws zero frames, as the brief asks.
   - **Canvas mapping:** the canvas must use the same `xMidYMin slice` mapping as today's SVG (`W × SKY_H`
     viewBox), so stars land exactly where they are now. Keep the existing mask that fades stars into the
     horizon glow.

2. **The moon and sun while dragged.** Do they change (glow, size, the rings around the sun, craters)? How
   do they glide back on release (duration, curve)? Should the sky gradient or the sun's glow follow the sun?
   **Reply (cloud):** The sun and moon are paper cut-outs. Dragging one is **lifting a piece of paper off
   the sheet.**
   - **Pick up** (pointer down on the disc only):
     - `scale 1 → 1.08` over 180 ms with `--fc-ease-out`;
     - a lift shadow appears under it (new token `--body-lift`: day `rgba(23,29,26,.18)`, night
       `rgba(0,0,0,.45)`, used as `drop-shadow(0 8px 12px var(--body-lift))`);
     - the 60 s position transition is switched off while held.
   - **Rings:** the sun's three rings (and the moon's faint ones) trail the disc like ripples. Each ring
     follows on its own spring: ring 1 `k = 220`, ring 2 `k = 140`, ring 3 `k = 90`, all ζ = 0.6. When the disc
     stops they wobble once and settle.
   - **Craters and moon face:** no change.
   - **Rubber band:** the body can go anywhere in the hero, **including down behind the hills**: it sinks
     behind the paper hills, which is lovely. Past the hero's edges it moves 35 % of the pointer's distance.
   - **Glow follows the sun:** the warm `--sky-glow` gains a radial patch that follows the body's x with a small
     lag. It warms as the body goes lower: a sunset feel when you pull the sun down, a moonrise feel at night.
     Put it in one element moved by `transform` (compositor only). The edition never changes because of a
     drag.
   - **Release:**
     - a flick (> 600 px/s) carries on with friction (`v · e^(−5t)`);
     - then it **rests 1.2 s** where it landed, so the stars or clouds visibly close in;
     - then it **glides home** to its Kampala-clock spot on a critically damped spring (`k = 12 s⁻²`, ζ = 1,
       about 1.3 s).
     Use a spring rather than a CSS transition, so grabbing it again mid-glide just continues (interruptible).
     Scale goes back to 1 as it lands.
   - **The secret, in practice:**
     - nothing on screen invites a drag. No tooltip, no title, no `cursor: grab` at rest;
     - `cursor: grabbing` only while held;
     - with a fine pointer, hovering the disc fades in a soft halo over 200 ms (`--body-glow`: day
       `rgba(255,174,97,.35)`, night `rgba(244,241,232,.18)`). That is the only hint;
     - the body stays `aria-hidden` and isn't focusable (it's decorative; nothing depends on it);
     - `touch-action: none` on the disc only, so swipes anywhere else scroll.
     - Pointer capture is on, and any second touch is ignored while dragging.
     - Don't put the words "drag", "moon" or "secret" in any visitor text, alt text, meta or Journal copy.
       Code comments are fine (private repo, stripped from the build). In `settings/site` use a neutral key
       (`skyBodies`), because that document is publicly readable.

3. **Wind.** Which parts move (trees per hill, banana leaves, clouds, quill rings, grass?), and how much at
   1× vs 2×? Gusts or a steady sway?
   **Reply (cloud):** A **steady sway with occasional gusts that travel across the screen**. Moving parts:
   - **Trees (per hill):**
     - split each tree row into **three groups by x position** (left, middle, right third), each still two
       paths, one per shade;
     - each group sways by `skewX` around its base line; the bases stay put and the tops move;
     - steady lean in the wind's direction `0.4° × wind`, plus an oscillation of
       **near ±1.2°, mid ±0.8°, far ±0.5°** at 1× (doubled at 2×);
     - periods 5.3 s / 6.1 s / 7.4 s per group, so the groups never fall into step.
     **Speed note:** in Chrome, a transform on an element *inside* an SVG repaints the whole SVG; only a
     transform on an element of its own is handed to the compositor. So render each group as its own small
     `<svg>`, cropped to the group's bounding box (keeps each GPU layer small), with `will-change: transform`.
     That's 9 small layers on desktop. Phones use one group per row (3 layers), same amplitude. If
     `check:smooth` gets worse anyway, sway only the near row.
   - **Gusts** (wind ≥ 0.6):
     - every 8–20 s (random), a gust multiplies the sway by 1.6 for 2.5 s;
     - it starts on the windward side and reaches the next third 0.35 s later, then the last 0.35 s after that;
     - one small JS timer toggles `.is-gust` on the hero, and only while the hero is on screen.
   - **Clouds:** they drift sideways at `4 px/s × wind` (desktop scale), wrapping around with a 1 s fade at the
     edges. No vertical bob.
   - **Site puffs and smoke** (construction motif `puffs`): lean `6° × wind` downwind.
   - **Rain:** its angle follows the wind (see Q4).
   - **Not moving:** quill rings, hills, buildings, the city, banana leaves (they're part of the tree paths;
     not worth splitting) and the paper-scrap layer, which is Home only.
   - **Direction:** take the east–west part of the wind and treat the viewer as facing north, so an easterly
     wind blows right → left. Calm (`wind = 0`) sets `animation: none` on all sway: zero frames.

4. **Rain, paper style.** What does rain look like in paper cut: thin paper strips, dashes, droplets? Colour
   tokens day and night, angle from the wind, splashes on the front hill, puddles? How dark does the sky get?
   **Reply (cloud):** **Rain is cut paper too: thin paper slivers**, like strips trimmed off with a knife.
   No droplets or blur.
   - **Drop shape:** a rounded stroke.
     - near layer: 1.5 px wide, 14–26 px long, 900 px/s;
     - far layer: 1 px wide, 8–12 px long, 600 px/s, fainter.
   - **Colours** (new tokens):

     | Token | Day | Night |
     | --- | --- | --- |
     | `--rain` | `rgba(28,37,45,.30)` | `rgba(241,241,241,.20)` |
     | `--rain-far` | `rgba(28,37,45,.16)` | `rgba(241,241,241,.10)` |

     Night rain is pale strips against the navy, and the lit city windows stay lit.
   - **Angle:** `tan θ = 0.18 × wind`, so about 10° at 1× and 20° at 2×; the direction follows the wind.
   - **Counts (near + far, desktop):**

     | Rain | Near | Far |
     | --- | --- | --- |
     | Light | 90 | 120 |
     | Rain | 160 | 220 |
     | Heavy | 240 | 320 |

     Phones ÷ 2.5. Lite devices: far layer only, 60 drops. Canvas pixel ratio `min(dpr, 1.5)`.
   - **Splashes:**
     - only where near drops meet the **front hill's top edge**: sample that ridge into a y-per-8 px table once;
     - a splash is a tiny paper "V" (two 3 px strokes) that pops for 180 ms;
     - at most 12 at once.
   - **No puddles.** Instead, **wet paper**: while it rains, the near and front hills take a slightly darker
     overlay (`--wet`: day `rgba(23,29,26,.07)`, night `rgba(0,0,0,.12)`). Wet paper goes darker, which says
     "rain" in the paper language.
   - **Sky darkness:** see the washes under Q5.
     - By day the sun stays behind the clouds at 35 % opacity, and at night the moon at 40 %; stars are hidden.
       Both bodies can still be dragged out (the clouds part as above).
     - Rule for the local check: if a scene fails AA behind the headline, **lighten that scene's wash**, never
       the text.
   - **One canvas covers both stars and rain.** Stars and rain never show together (rain needs cloud cover,
     which hides the stars), so the single canvas switches its stacking:
     - star mode sits behind the clouds and hills;
     - rain mode sits in front of the hills and behind the hero text.

5. **Overcast and storm.** Cloud shapes and layers for partly / overcast / storm; the storm's glow (colour,
   rhythm). Anything for Kampala specifically (afternoon storms, morning haze)?
   **Reply (cloud):** Paper language for each scene:
   - **Clear:** today's look (by day, two small clouds on the right).
   - **Partly:**
     - 4 paper clouds (`cloudCircles`, sizes 0.6–1.1);
     - kept to the right 55 % of the sky and the top 18 % band, away from the headline;
     - at night they're navy-grey paper (`--sc-cloud`) and hide the stars behind them.
   - **Overcast:**
     - two **torn-paper strips** across the top of the sky, reusing the `TornEdge` idea with a torn lower
       edge: the back one higher and lighter, the front one lower, darker, offset;
     - plus two puffy clouds;
     - the sun at 35 %.
   - **Storm:**
     - three strips, lower (the front one reaches about 40 % down the sky) and darker;
     - one tall, stacked **cumulonimbus** on the right, made of 3 stacked `cloudCircles` rows;
     - heavy rain, wind at least 1.2×.
   - **Storm glow, lit from inside:**
     - a radial gradient clipped to the tall cloud's shape, never the whole sky. Day colour `--storm-glow`
       `rgba(255,246,236,.55)`, night `rgba(157,180,214,.40)` (the scene's existing cool light);
     - rhythm: every 9–18 s (random), opacity 0 → 1 over **400 ms**, hold 150 ms, fade over 900 ms;
     - one time in three, a smaller second pulse follows 300 ms later;
     - no lightning bolts, and nothing on the rest of the sky;
     - this stays far under the WCAG 2.3.1 flash limits (it covers well under a quarter of the screen,
       changes brightness only a little, and is never faster than 1 per second);
     - reduced motion: no glow, only a static, faintly lit cloud.
   - **Kampala-specific: morning mist as its own scene, "vellum".** A sheet of **tracing paper** laid over the
     far and middle hills: a translucent horizontal band from the horizon up about 35 % of the sky, with a soft
     top edge (`--mist`: day `rgba(241,241,241,.55)`, night `rgba(42,53,64,.50)`). It's static: zero frames,
     very cheap, and very much a Kampala morning. Afternoon storms need nothing special; the live sync brings
     them.
   - **New tokens** (day / night, in `tokens.css`):

     | Token | Day | Night |
     | --- | --- | --- |
     | `--sky-wash-partly` | `rgba(127,199,190,.10)` | `rgba(28,37,45,.12)` |
     | `--sky-wash-overcast` | `rgba(148,152,155,.22)` (the brand's concrete grey) | `rgba(42,53,64,.35)` |
     | `--sky-wash-rain` | `rgba(28,37,45,.18)` | `rgba(9,13,18,.40)` |
     | `--sky-wash-storm` | `rgba(28,37,45,.30)` | `rgba(9,13,18,.55)` |
     | `--cloud-deck-back` | `#E4E6E6` | `#26313B` |
     | `--cloud-deck-front` | `#D2D6D7` | `#303C47` |
     | `--cloud-storm-back` | `#B9C0C4` | `#1E272F` |
     | `--cloud-storm-front` | `#9EA7AD` | `#2A3540` |

     All are tints of the navy, concrete grey and paper white, so they stay within the brand. Each wash is laid
     *over* the existing sky gradient, and the horizon glow drops to about a third under overcast, rain and
     storm.
   - **Changing scenes during a visit:** a 4 s crossfade; rain builds up to full density over 6 s.

6. **Weather mapping.** Which conditions map to which scene, and at what wind speeds the sway reaches 1× and
   2×? Mist/haze as its own scene?
   **Reply (cloud):** Agree with **MET Norway Locationforecast** (`/weatherapi/locationforecast/2.0/compact`).
   Checked the terms: the data is CC BY 4.0, so commercial use is fine with credit.
   - **Request rules:**
     - send an identifying `User-Agent`: `formcraft-web/1.0` plus the site URL (from `SITE_URL`), not a
       personal email;
     - honour `Expires`, and send `If-Modified-Since` with the exact previous `Last-Modified` value (keep it in
       a private doc such as `weatherMeta/kampala`, not in the public one);
     - lat/lon to 4 decimals (`0.3476, 32.5825`);
     - schedule every 30 min with a few random minutes added (their terms ask for that).
   - **Credit:** "Weather data: MET Norway (CC BY 4.0)" on `/privacy` and in the footer small print, only while
     live sync is on. It must not suggest MET endorses us, and we can't use the "Yr" name or logo.
   - **Mapping:** use `next_1_hours.summary.symbol_code`, with the `_day` / `_night` / `_polartwilight` suffix
     removed:

     | MET symbol | Scene |
     | --- | --- |
     | `clearsky`, `fair` | clear |
     | `partlycloudy` | partly |
     | `cloudy` | overcast |
     | `fog` | mist |
     | `lightrain*`, `lightsleet*` | rain, intensity light |
     | `rain*`, `rainshowers`, `sleet*` | rain |
     | `heavyrain*` | rain, intensity heavy |
     | anything containing `thunder` | storm |
     | snow (won't happen) | rain |

     Write `stats/weather` as `{ kind, intensity: 0.5|1|1.5, windMs, windFromDeg, symbol, at }`. The rules
     already fit: `stats/*` is public read and only functions write it.
   - **Wind:** `0` below 1 m/s, **1× at 4 m/s, 2× at 10 m/s**, linear between, then × the Admin slider (0–2),
     with the result capped at 2. Storm raises it to at least 1.2 before the slider. (Kampala is usually
     2–4 m/s, so a gentle sway most days, which is right.)
   - **Stale data:** if `at` is older than 3 h, show clear, so yesterday's rain never shows. **Auto without any
     data shows clear;** never fake "live" weather.
   - **Mist** is its own scene (Q5). The time of day still comes from the Kampala clock, not from the weather.

7. **Tester.** Agree with the panel (dev + signed-in team) and `?sky=` links? What should it look like?
   **Reply (cloud):** Agree: in dev next to the 3D preview, and for signed-in team members on the live site.
   Changes:
   - **Placement and look:**
     - in dev, put both in **one panel with two tabs, "3D" and "Sky"**, rather than two floating panels
       (bottom right, draggable and foldable as now);
     - for the team on the live site, a small paper tab at the **bottom left** labelled "Sky" that opens a
       card. It never appears for visitors.
   - **Controls (top to bottom):**
     - Weather: Auto · Clear · Partly · Overcast · Mist · Rain · Storm (segmented buttons);
     - Rain amount: Light / Rain / Heavy, shown when rain or storm is picked;
     - Wind: a 0–2 slider, plus "Gust now";
     - Sun/moon position along its path: Live, or a slider from rise to set;
     - Day / Night (uses the existing theme switch);
     - two preview toggles: "Phone budget" (phone particle counts) and "Reduced motion";
     - Reset.
     Under the controls, one status line: "Live Kampala: rain, 3.2 m/s, 14 min ago" (or "No live data —
     showing clear"). The panel affects only this browser tab (sessionStorage), never `settings/site`.
     **It never mentions dragging** (it's for the team, but a meeting screen is still a screen).
   - **`?sky=` links:** `?sky=rain&wind=1.5&t=0.8&budget=phone`. Let them work **for everyone**. They're
     harmless, change nothing saved, aren't linked anywhere, and the canonical tag drops them for SEO. That
     also lets the owner send an investor "the storm" link. Most importantly, **`npm run check` can screenshot
     every scene, day and night, and run the AA contrast check per scene**. Please add that to the check.

8. **Order.** The local side proposes: (1) moon/sun drag with fluid stars and clouds, (2) wind + slider,
   (3) rain/overcast/storm + Admin weather + tester, (4) live Kampala sync (once Blaze is on), (5) Home 3D.
   And how does this fit with the copy pilot (step A, approved), and pre-rendering? Please give the order
   you want overall.
   **Reply (cloud):** Overall order. Each step goes on its own `try/` branch for the owner to click through,
   and merges into `paper-edition` after the owner's OK:
   0. Finish round 5 (checks) and verify the new hotel paper (ideas #11, in the next cloud push).
   1. **Copy pilot step A** (already approved): keep going.
   2. **Admin → Features** (#24): small, and the foundation. Start with switches for what exists today
      (opening animation, email prompt, plant-a-tree button, Home 3D), so every sky step lands with its own
      switch.
   3. **Sky 1:** sun and moon drag with fluid stars and clouds, plus real moon phases (Q10).
   4. **Pre-rendering** (as agreed: after copy step A, before step B). It's the biggest speed win left. The
      sky needs nothing pre-rendered: the canvas draws after the app starts and fades in over 300 ms, and
      the gradient and hills are already in the HTML.
   5. **Sky 2:** wind, the Admin slider and gusts.
   6. **Sky 3:** clear / partly / overcast / mist / rain / storm, Admin "Weather", the tester, `?sky=` and the
      per-scene check.
   7. **Copy step B.**
   8. **Sky 4:** live Kampala sync (once Blaze is on).
   9. **Sky 5:** Home 3D (rain over the model, wind in its trees), after the owner's `.glb` models, if those
      are still coming.

9. **Feature switches.** Agree with Admin → Features and the list above? Anything to add or keep out
   (e.g. features that must never be switched off)?
   **Reply (cloud):** Agree with Admin → Features in `settings/site.features`, cached on the device.
   Details:
   - **The list:**
     - **Sky:** sun and moon dragging (key `skyBodies`), fluid stars/clouds, wind, weather scenes, live
       Kampala sync, storm glow;
     - **Site:** opening animation, email prompt, plant-a-tree button, Home 3D model (off = the 2D drawing),
       paper scraps on Home, the team's sky tester.
   - **Defaults:** everything on except live sync, which is off until Blaze.
   - **Never switchable:** cookie consent, the skip link and other accessibility pieces, respecting reduced
     motion, the 2D drawing (it's the fallback), sign-in, Admin, page switches and the Features panel itself.
     Also security: honeypots, headers, rules.
   - **Dependencies:** "Fluid stars/clouds" needs "dragging"; "Storm glow" needs "weather scenes"; "Live
     sync" needs "weather scenes". Show a dependent switch greyed out when its parent is off.
   - **Opening animation:** it runs from `index.html` before the app, so cache the features like Motion
     (`fc-site-features`). Then a switched-off opening stops from the visitor's second visit. That's the same
     note as Motion; say so under the switch.
   - **"Loads no code":** a lazy import behind the switch, the same pattern as Home 3D.

10. **Anything else** (night rain, rainbows after rain, a different moon phase from the real calendar…)?
   **Reply (cloud):**
   - **Real moon phase** (add to Sky 1, cheap): phase from the date, using a synodic month of 29.53059 days
     counted from the new moon of 2000-01-06 18:14 UTC. The lit shape is drawn as a circle with an elliptical
     terminator.
     - **Kampala detail:** on the equator the crescent lies almost flat, "boat moon". Rotate the lit edge to
       face where the sun is: an evening crescent is lit toward the lower west (right), a morning crescent
       toward the lower east (left).
     - New moon nights show only a faint rim, so the moon can still be found.
   - **Night rain:** yes, covered in Q4. Pale strips, the windows stay lit, the moon dims behind the clouds.
   - **Rainbow after rain** (later, needs brand approval like the occasion palette): when the live data goes
     from rain to clear or partly in the daytime, show a **Formcraft rainbow** for 30 min: five paper arcs in
     the brand and division colours (rust, orange, construction brown, studio green, stores blue). It only
     uses tokens, so it stays in the brand. Needs `prevKind` and `changedAt` in `stats/weather`.
   - **Not doing:** sound, lightning bolts, snow, radar maps, weather text on the site (the owner hasn't
     asked; and never claim "live" weather in visitor text).

## Owner addition (2026-10-24): switch weather scenes on and off one by one

> "I want to limit some scene changes. I should be able to turn off the thunderstorm or the rain and maybe leave
> the main, which is light daylight and nighttime."

- **Admin → Features** gets one switch per scene: Partly cloudy, Overcast, Mist, Rain, Storm, plus a master
  "Weather scenes" switch. **Clear day and clear night are always on** (the base; they can't be switched off).
- **Fallback:** when the live weather (or Admin "Weather") asks for a scene that's off, show the nearest calmer scene
  that's on: storm → rain → overcast → partly → clear (mist → partly → clear).
- Wind keeps its own slider; 0 = no wind.
- **The tester** still shows every scene to the team, marking switched-off ones "off for visitors".
- A scene that's off loads no code for visitors.
- Stored with the other switches in `settings/site.features` (e.g. `features.weather = { partly, overcast, mist, rain, storm }`).
