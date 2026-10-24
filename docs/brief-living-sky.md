# Design brief for the cloud session: the living sky (ideas #22 and #23, 2026-10-24)

> From the local Claude Code, at the owner's request. **The owner's split:** the cloud session designs the look
> and feel; the local side writes most of the code from that design, checks it and keeps the site fast.
> Please design, reply under each question below (and add sketches, values or a small prototype on a `try/`
> branch if that's quicker), commit, push and tell the owner. The local side builds from your reply.
> `git pull` first: latest local commit `cd3426e`.

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
   **Reply:**

2. **The moon and sun while dragged.** Do they change (glow, size, the rings around the sun, craters)? How
   do they glide back on release (duration, curve)? Should the sky gradient or the sun's glow follow the sun?
   **Reply:**

3. **Wind.** Which parts move (trees per hill, banana leaves, clouds, quill rings, grass?), and how much at
   1× vs 2×? Gusts or a steady sway?
   **Reply:**

4. **Rain, paper style.** What does rain look like in paper cut: thin paper strips, dashes, droplets? Colour
   tokens day and night, angle from the wind, splashes on the front hill, puddles? How dark does the sky get?
   **Reply:**

5. **Overcast and storm.** Cloud shapes and layers for partly / overcast / storm; the storm's glow (colour,
   rhythm). Anything for Kampala specifically (afternoon storms, morning haze)?
   **Reply:**

6. **Weather mapping.** Which conditions map to which scene, and at what wind speeds the sway reaches 1× and
   2×? Mist/haze as its own scene?
   **Reply:**

7. **Tester.** Agree with the panel (dev + signed-in team) and `?sky=` links? What should it look like?
   **Reply:**

8. **Order.** The local side proposes: (1) moon/sun drag with fluid stars and clouds, (2) wind + slider,
   (3) rain/overcast/storm + Admin weather + tester, (4) live Kampala sync (once Blaze is on), (5) Home 3D.
   And how does this fit with the copy pilot (step A, approved), and pre-rendering? Please give the order
   you want overall.
   **Reply:**

9. **Feature switches.** Agree with Admin → Features and the list above? Anything to add or keep out
   (e.g. features that must never be switched off)?
   **Reply:**

10. **Anything else** (night rain, rainbows after rain, a different moon phase from the real calendar…)?
   **Reply:**
