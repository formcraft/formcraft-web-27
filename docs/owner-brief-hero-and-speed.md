# Owner brief: Home hero, skies, 3D views and device levels

> From the owner, written up by the local Claude Code on 2026-10-24 after a review of the running site.
> **For the cloud session.** You design and build these (landscapes, skies, scene code). Read it, then
> answer in `docs/handoff.md` under "From the cloud session": agree / change / object per section, and
> list the **tasks you want the local side to do** (captures, checks, measurements). Nobody on the local
> side edits the scene code for this.
>
> This brief replaces the earlier "Proposal: Home hero, still image → 3D" in the handoff.

## Why

The owner wants the site to feel complete and fast at once: the full experience on devices that can
handle it, a smooth flow with no pops or blank moments, and the rest of the site's features kept intact.

What the local checks found on Home today (`f651610`):

- Two different landscapes: `PaperLayers` hills show first, then the 3D scripts (`hotelDay.js`,
  `hotelNight.js`) draw **their own** hills, so landscape A vanishes and landscape B fades in.
- A gap at the swap: `PaperLayers` unmounts when `ready` is true, while the canvas starts at
  `opacity: 0` and takes 0.9 s to fade in.
- The main thread is blocked about 8 s while the model is built (12.3 s in total, headless with
  software WebGL). This is the cost of **building** the model, not drawing it.
- `sceneGeometry.js` says it's shared "so both editions of the hero show the same landscape", but only
  `PaperLayers` imports it. The 3D scripts don't.

## 1. Hero: the landscape is there first, the building fades in

- **The sky and landscape show straight away** and never swap. The **building fades into them** once it's
  ready. No second landscape, no gap.
- **You design the landscape.** The owner has modelled the **front and back views and the landscape**.
  Build from those (see open question A).
- Because visitors can see the back (section 3), the landscape has to hold up **all the way round**, not
  only from the front. Sky and far hills can be cheap (a backdrop dome or layered cards); the plot,
  near trees, figures and the building's shadows stay true 3D.
- While the building loads, show a **placeholder of the building in place** (for example a transparent
  WebP cut-out from the starting camera), so the scene looks finished from the first paint. Then fade
  the live building in over it, and remove the placeholder only after the fade ends (`transitionend`).
- One set of shapes for both: the instant landscape and the 3D scene come from the same source
  (`sceneGeometry.js` or its successor), so they can't drift apart.
- Day/night switch: the new edition's landscape and placeholder appear at once, then its building
  fades in the same way.

## 2. Skies

- **Home gets its own sky**, designed for the 3D scene.
- **All other pages share one sky** (they already share the paper-hero design): one component used
  behind every page hero's motif.
- Put real care into both, but keep them restrained:
  - **Day:** soft gradient, warm at the horizon and clearer above, sun placed by the Kampala clock
    (already in the site), a few paper clouds at most.
  - **Night:** deep navy to a faint city glow at the horizon, a **modest** star field (a few hundred
    small stars, varied size and brightness, a few twinkling slowly), the moon. Not too many stars.
    Text on top must stay easy to read.
- Cheap to load: drawn in the page (gradient plus stars), no large images. Twinkling off with
  reduced motion.

## 3. 3D views and zoom

- **View buttons** on the model: *Front · Back · Cutaway · Site*. The camera moves smoothly to each.
  They work by keyboard and touch, with clear labels.
- **Zoom:**
  - Desktop: **+ / − buttons** (Ctrl + wheel is fine too). The plain mouse wheel keeps scrolling the
    page, because the camera already follows the page scroll and visitors must never get stuck in
    the model.
  - Touch: pinch on the model zooms it. One finger scrolls the page; a sideways drag turns the model.
  - Nearest and farthest limits, so nobody ends up inside a wall or loses the building.
  - A **reset view** button.
- Keep the scroll-driven camera views (hero, chain, plan, work, dusk) only if they still work with
  this. Your call; tell us.

## 4. Device levels: the full site where the device can take it

Decided on the visitor's device, from browser signals plus a short live check.

| Level | Who | What they get |
| --- | --- | --- |
| **Full** | Desktops, strong phones, good connection | Landscape at once, building fades in automatically, full resolution, shadows and effects |
| **Standard** | Mid-range phones, 3G | Same flow, building after idle, lower resolution, fewer effects |
| **Lite** | Save-Data, 2G/slow 3G, ≤ 2 GB memory, reduced motion, no WebGL | Landscape and the building placeholder only (still looks finished); a "Turn the model" button loads 3D on request (owner to confirm the button) |

- **Signals:**
  - `navigator.connection` (effective type, downlink, RTT, Save-Data): Chrome and Edge, Android
    included, not Safari.
  - `deviceMemory`: Chrome and Edge only.
  - `hardwareConcurrency`, screen size and pixel ratio.
  - WebGL renderer name, as a rough guide to the graphics chip.
- **The live check matters most** (and is the only good signal on iPhones). Measure frame time for the
  first couple of seconds, step down a level, or settle on the placeholder, if it's too slow.
- **Remember the result** per device in `localStorage` (try/catch), so return visits skip the guessing.
- **Fix the build freeze for every level.** Split model construction into small steps (yield between
  floors and meshes, or build off the main thread), so the page stays responsive while it builds.

## 5. Measuring real visitors (owner still deciding)

Proposed: **Firebase Performance Monitoring** (or `web-vitals` into the Firebase Analytics already
loaded in production). It reports anonymously:

- the level each device got,
- page-ready time and tap responsiveness,
- 3D frame rate,
- device and connection type.

After launch, this shows which devices actually visit and whether the levels are right. It sends
anonymous usage data to Google, so it may need a line in a privacy note.

## 6. Still open from earlier (already in the handoff)

- **Plant-a-tree:** a small pop-up anchored to the button, not a centre window (see "Owner request" in
  the handoff).
- **Round-3 fixes:**
  - Home blank offline (precache the entry bundle).
  - Extra product photos not shown.
  - Two lint warnings.

## Open questions

- **A. Model files (owner):** where are the front, back and landscape models? If they aren't already in
  the concept files you have, the owner needs to hand you an export. Say which format you want
  (e.g. glTF/GLB).
- **B. Owner:** "Turn the model" button on Lite: yes or no?
- **C. Owner:** add Performance Monitoring?
- **D. Cloud:** is the full-turn landscape plus zoom realistic within the speed budget? What will you
  cut first if it isn't?

## What the local side can take on (assign in your reply)

- Capture the building placeholder images from the starting camera, at the sizes you name.
- Measure each level on this machine (headless, throttled 3G with 4× CPU): first paint, freeze length,
  frame rate. Repeat after each push.
- Run lint, build, routes at 360/768/1440 in both editions, keyboard checks, and the emulator flows
  after each push.
- Help the owner test on a real mid-range phone over the local network (`npm run dev -- --host`).
