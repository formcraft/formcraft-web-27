# Current code: how the Formcraft website works

> **Living document.** It explains the code in this repo as it is
> *right now*, so anyone (Claude Code, a developer, the founders) can understand it
> without reading every file. `CLAUDE.md` loads it into every Claude Code session.
>
> - `docs/build-plan.md` says what we are building. This file says what exists.
> - Claude Code updates this file **in the same commit** as any code change (see
>   "How to keep this file up to date").
>
> Baseline written: 2026-10-09 from a full read of the code · Last updated: 2026-10-24
> · Phase: **Launch track: L1–L2 done; L3 funnel, L4 lead data, L5 SEO, L6 marketing studio, L7 team accounts built** (functions not deployed yet); every designed page built; admin control room
> (branch `paper-edition`; the latest commits were compiled with esbuild only — run lint/build locally, see `docs/handoff.md`)

---

## How to keep this file up to date (for Claude Code)

After every change to the code, before committing:

1. **Status line** at the top: date, phase, tasks done.
2. **At a glance:** change a row if the stack, a version or a tool changed.
3. **File map:** add, move or delete entries so the tree matches the disk. Mark moves `(was …)` until the phase ends.
4. **How it works today:** rewrite the paragraph for every part whose behaviour changed. Describe what it does now, not what it used to do; the old behaviour belongs in the change log.
5. **Phase 0 checklist:** set the status of the task and of each problem it fixed.
6. **Change log:** add one row (newest first).
7. **Known issues:** add anything found but not fixed; remove what's fixed.

Write plainly. Name files and components exactly. Don't describe planned features here as if they exist.

---

## At a glance

| | Today | Target (from the plan) |
| --- | --- | --- |
| Framework | React 19, StrictMode | same |
| Routing | `react-router-dom` ^6.30; table in `src/routes.jsx`, every page `React.lazy`, prefetched on link hover/focus/touch | same |
| Build | Vite ^8 with `@vitejs/plugin-react` | same |
| Lint | oxlint (`npm run lint`) | same |
| Firebase SDK | `firebase` ^12; Auth eager; Firestore, Storage, Functions on demand; public reads over the Firestore REST API (no SDK) | same |
| Firebase project files | `firebase.json` (SPA rewrite, cache and security headers), `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `functions/` (written, not deployed: needs Blaze) | same |
| Firebase project | `formcraft2027` (`.firebaserc`, `.env.local`); keys from the new project still to paste in | `formcraft2027` |
| Styling | tokens + shared styles in `src/styles/`, one CSS file per component, coarse paper textures | same |
| State | `AuthContext` (user, role), `ThemeContext`, `CartContext`, `SiteContext` (page switches, contact details, motion timing) | same |
| Content | `useContent()`: Firestore collection if the admin added items, else starter data in `src/data/` | Firestore |
| Offline / caching | service worker `public/sw.js` (production only), localStorage content cache, long cache headers | same |
| Tests | none | rules tests from Phase 3 |

Scripts: `npm run check` / `check:fast` / `check:speed` (offline checks, see `scripts/check/`), `npm run dev`, `npm run build` (Vite, then `scripts/seo-pages.mjs` writes per-route HTML heads, sitemap and robots), `npm run og` (preview images, needs Playwright), `npm run lint`, `npm run preview`. Texture generator: `python3 scripts/make-textures.py public/textures`. Admin claim: `node scripts/set-admin.js you@example.com`.

---

## File map (today)

```
formcraft-web-27/
├─ index.html                 # edition before first paint (saved choice, else Kampala clock); opening animation (#fci); preloads
├─ firebase.json  .firebaserc  firestore.rules  storage.rules  firestore.indexes.json  .env.example
├─ .claude/skills/  emil-design-eng  review-animations  animation-vocabulary  apple-design  (motion and UI craft rules, MIT, Formcraft notes on top)
├─ docs/  build-plan.md  current-code.md  handoff.md  owner-checklist.md (accounts, payments, setup only the owner can do)
├─ functions/  index.js (submitLead, claimTeamRole, onTeamChange)  studio.js (bufferChannels, publishApprovedPosts)  package.json   # need Blaze
├─ scripts/check/  index.mjs (npm run check) lib.mjs page-checks.mjs click-checks.mjs report.mjs speed.mjs (npm run check:speed)
├─ scripts/   set-admin.js (admin/role claims)  make-textures.py (paper textures)  seo-pages.mjs (per-route heads, sitemap)  make-og.mjs (preview images)
├─ public/
│  ├─ sw.js        service worker (offline cache, fast repeat visits)
│  ├─ fonts/  logos/  images/ (WebP renders, 1600 + -800)  og/ (34 link-preview cards, JPEG)
│  ├─ textures/    paper, navy, black, orange: 768 px tileable coarse paper (shown at 384 px);
│  │               hotel-paper(-512).webp, hotel-bump-512.webp: baked textures for the 3D model
└─ src/
   ├─ main.jsx (registers sw.js in production)  App.jsx  routes.jsx (lazy pages, PageGate, redirects, prefetchRoute)
   ├─ config/firebase.js
   ├─ context/     contexts.js  AuthContext  ThemeContext  CartContext  SiteContext
   ├─ styles/      tokens.css  fonts.css  base.css  components.css
   ├─ data/        pages.js (every page + on/off defaults)  nav.js (header groups)  content.js (admin collections + fields)
   │               products.js  templates.js  projects.js  developments.js  posts.js  courses.js  events.js  sheets.js
   │               downloads.js  contact.js  seo.js (titles, keywords, JSON-LD)  motion.js (animation timing)
   │               socialPlatforms.js  socialChannels.js  occasions.js  socialTopics.js  team.js  (Marketing Studio)
   ├─ hooks/       useAuth  useTheme  useCart  useSite (+ useShowLink)  useContent (+ useContentItem)  useCollection
   │               useDocument  usePublicDoc  usePageMeta  useReveal  useSky
   ├─ lib/         money.js  forms.js  storage.js  images.js  firestoreRest.js  adminContent.js  skyClock.js
   │               attribution.js (where visitors came from)  analytics.js (after consent)  track.js (contact clicks)  studio.js
   ├─ components/
   │  ├─ layout/   Layout  Header  ThemeSwitch  Footer  DonateFab  PageGate  PageSkeleton  ConsentBanner
   │  ├─ page/     PageHero  Section  Photo
   │  ├─ scene/    HotelScene (+ HotelControls rail, dev preview switch; hotel/hotelDay|hotelNight|build|compat.js)  Hotel2D (+ hotel2dGeometry.js)
   │  │            PaperLayers  Sky (shared hero sky, sun/moon, stars)
   │  │            sceneGeometry.js (hills, motifs, trees, star field)
   │  ├─ admin/    PagesPanel  ContentPanel  AdminField  InboxPanel (+ inboxes.js)  LeadsPanel  LeadCharts  LinkBuilderPanel
   │  │            DetailsPanel  MotionPanel  TeamPanel  studio/ (StudioPanel and its tabs, Composer)
   │  ├─ shop/     ProductCard  CartButton  CartDrawer
   │  ├─ forms/    QuoteForm  Honeypot  SubscribeForm  SubscribePrompt
   │  ├─ auth/     SignInDialog
   │  └─ ui/       Icon  Logo  TornEdge  Reveal/Kinetic  Drawer  Popover (small corner pop-up)
   └─ pages/       Home  Studio  Construction  Concrete  Templates  TemplateDesign  Projects  ProjectPage
                   Stores  ProductPage  Checkout  OrderConfirmed  Community  Academy  Journal  Post
                   Invest  RealEstate  RealEstateProject  Donate  DonateThanks  About  Contact
                   Account  SignIn  Admin  Links  Privacy  ComingSoon (unused, kept for later)  NotFound   (each .jsx + .css)
```

### Planned moves (Phase 0)

| From | To | Task |
| --- | --- | --- |
| ~~`src/App.css`, `src/assets/*` (react.svg, vite.svg, hero.png), `public/icons.svg`, template `README.md`~~ | deleted (none were referenced) | P0.1 ✓ |
| `src/config/firebase.jsx` | `src/config/firebase.js` | P0.2 |
| global rules in `Shop.css`, `FeaturedProducts.css` | `src/styles/base.css`, `components.css` | P0.3 |
| ~~`src/components/auth.jsx/.css`~~ | `src/components/auth/SignInDialog.jsx/.css` | P0.4 ✓ |
| `src/pages/Construction.jsx/.css` | `src/pages/ComingSoon.jsx/.css` | P0.5 |
| `src/components/Header.*`, `Footer.jsx` | `src/components/layout/` | P0.6 |
| `src/components/craft/*` | `src/components/shop/*` (`FeaturedProducts` → `ProductGrid` + `ProductModal`, `FeaturedCollections` → `Collections`, `CommunitySection` → `CommunityBand`, `Cart` → `CartButton` + `CartDrawer`) | P0.7, P0.8 |
| `src/pages/Shop.jsx` (`CraftPage`) | `src/pages/Stores.jsx` (`Stores`) | P0.7 |
| `src/components/data/products.jsx` | `src/data/products.js` | P0.7 |
| `src/pages/Portfolio.*` | `src/pages/Projects.*` | Phase 1 |
| `src/pages/AboutUs.*` | `src/pages/About.*` | Phase 1 |
| `src/pages/Services.*` | deleted; `/services` redirects to `/studio` | Phase 1 |
| `src/components/craft/Companies.*`, `Testimonials.*` | removed in P0.9 (invented content); bring back only with real clients and quotes | P0.9 |

---

## How it works today

### App shell and routes
`main.jsx` loads the global styles and renders `<App/>`; in production it also registers `public/sw.js`. `App.jsx` nests `ThemeProvider > AuthProvider > SiteProvider > CartProvider > BrowserRouter > Layout > Suspense(PageSkeleton)`. `routes.jsx` maps every path to a lazily loaded page (`page(name)`), wraps each in `PageGate` (keyed by `pageForPath` from `data/pages.js`), keeps the old redirects (`/shop`, `/portfolio`, `/services`, `/blog`, `/plans`) and ends with `NotFound`. `prefetchRoute(href)` starts loading a page's code when a header link is hovered, focused or touched.

### Page switches (`data/pages.js`, `SiteContext`, `PageGate`)
`PAGES` lists every page with its paths, group, `defaultOn` and `locked` (Home, Contact, Sign in and Admin can't be turned off). `SiteProvider` reads Firestore `settings/site` `{ pages: { key: bool } }` over the REST API (no Firestore SDK on public pages), caches it in localStorage, and exposes `isOn(key)`, `canSee(key)` (admins see everything) and `setPage(key, on)` (admin only; the rules check the `admin` claim). `PageGate` shows a hidden page to admins under a "Hidden from visitors" strip, and visitors an "opens soon" sheet. `useShowLink()` filters links: the header (`data/nav.js` + `filterNav`), mobile menu, footer, home doors and the new pages all drop links to hidden pages. Everything is on by default.

### Content (`data/content.js`, `useContent`, admin)
`CONTENT` defines the collections the admin can edit — products, templates, projects, developments, posts, courses, events — each with a starter-data loader from `src/data/` and a field list for the admin form. `useContent(name)` shows cached or starter items at once, then lists the Firestore collection over REST; if it has any documents they replace the starter data. Items with `active: false` are hidden from visitors (admins see them tagged "Hidden"). Lists are cached per visit (5 minutes) and in localStorage. Images in `images[]` can be public/images names, `{ name, alt }` objects or Storage URLs (`lib/images.js`, `Photo`).

### Admin (`/admin`)
Open to the team: admins (claim `admin`), marketing (`role: "marketing"`) and editors (`role: "editor"`); each menu item lists the roles that see it (admins see all). **Marketing:** Leads, Studio, Link builder. **Site (admin):** Overview, Pages, Site details, Motion, Team. **Content** (admin, marketing). **Inbox** (admin). Editors see only Studio, limited to drafts. The header shows the admin icon to anyone on the team.
- **Leads** (`LeadsPanel`, `LeadCharts`): messages, quotes, investor leads and subscribers (newest 500 each) plus contact clicks (newest 1000) in one list; filters (type, source, status, date range, search); a status per lead (new, contacted, qualified, won, lost); KPI tiles; SVG charts (leads per week, by source, top pages, campaigns) each with a table view; CSV downloads (filtered list, all subscribers) with a BOM for Excel and formula injection blocked.
- **Link builder:** tagged links (utm source/medium/campaign) for each platform and page, base from `SITE_URL`.
- **Site details:** WhatsApp, phone, email, address, hours, socials (`settings/site.details`); WhatsApp buttons appear only once a number is set.
- **Motion** (`MotionPanel`): time scales 0.5×–3× for the opening animation, the tear, the Home model build and the page reveals (`settings/site.motion`, `data/motion.js`). SiteContext sets `--fc-motion` and `--fc-motion-build` on `<html>`; `index.html` reads the cached copy (`fc-site-motion`) so the opening animation follows it from a visitor's second visit.
- **Team** (`TeamPanel`): add people by email with a role (`team/{email}`); `onTeamChange` / `claimTeamRole` set the custom claims (once functions are deployed).
- **Studio** (`studio/StudioPanel`): see "Marketing Studio" below.
The older parts: **Overview**; **Pages** (switches, grouped like the site map); **Content** (one panel per collection: live list via `useCollection`, add/edit form built from the field list, photo uploads to Storage `public/content/<collection>/`, hide via "Show on the site", delete with confirmation, "Import the starter list" to copy `src/data/` into Firestore); **Inbox** (messages, quotes, investor leads with a status the team sets; orders, donations and members read-only). Nothing on this page can mark a payment paid.

### Funnel (L3)
`lib/attribution.js` keeps where a visitor came from (utm tags, which click id was present but never the id, referrer host, landing page): first touch (never overwritten) and last touch in localStorage `fc-source`. Every form adds `source` and `page` (`lib/forms.js`) and has a hidden honeypot field (`Honeypot`): if it's filled, the form pretends to succeed and saves nothing. With `VITE_FORMS_VIA_FUNCTIONS=true` every form goes through the `submitLead` function instead of writing Firestore directly. Email capture: `SubscribeForm` (inline, card, footer; consent required) writes `subscribers`; the card can offer a free download (`downloads` collection, edited in Admin → Content; template catalogue first, no file yet). `SubscribePrompt` slides up bottom right, above the plant-a-tree button, once a visitor has scrolled 55 % of a long page, at most every 14 days; it steps aside while the footer, a form on the page or a pop-up is showing. `/links` is the link-in-bio page; `/privacy` describes what is collected (legal parts TODO). `ConsentBanner` asks once; Analytics (`lib/analytics.js`) loads only after "Accept", in production, with a measurement id. `lib/track.js` counts clicks on phone, email, WhatsApp, social and `data-track="cta"` links into `clicks` (over REST, at most once per target per page view).

### SEO (L5)
`src/data/seo.js` is the single source: `SITE_URL` (default `https://formcraftdesign.com`, TODO confirm), organisation details, every route's title (≤ 60 chars), description (≤ 155), preview image, sitemap settings and noindex flag, and the JSON-LD builders. `usePageMeta(title, description, { image, noindex, canonical })` sets title, description, canonical, Open Graph, Twitter and robots tags; on static routes the values in `seo.js` win so the live page matches the pre-built HTML. After `vite build`, `scripts/seo-pages.mjs` writes a copy of `index.html` per route (and per starter product, template, project, post and development) with the right head, plus `sitemap.xml` and `robots.txt`; Firebase Hosting serves them through `cleanUrls`. Sample listings and private pages are noindex. `scripts/make-og.mjs` draws the 1200 × 630 preview cards in `public/og/` (paper, logo, page headline, title block).

### Marketing Studio (L6)
Admin → Studio plans social posts across an open-ended channel list (`data/socialPlatforms.js`: Instagram, Facebook, X, LinkedIn, TikTok, Pinterest and more; channels in `socialChannels`). Tabs: **Calendar** (month grid, agenda list on phones), **Queue** (today and upcoming, "Mark as posted"), **Generate** (fills the year with drafts from posting targets, the occasions calendar and the topic bank), **Bulk** (CSV import/export), **Channels** (targets, posting days, Buffer mapping), **Topics** (85 ideas in 13 pillars, `[placeholders]` where facts are needed), **Occasions** (54 from the Template Master Register with template codes FMC-MKT-HOL/AWR/DAY and care notes; Easter computed, Eid marked "confirm"), **Results** (leads per post and campaign via the tracked links' `utm_content` = post id). Posts go idea → draft → review → approved → published; approving needs every care note ticked, a date and a channel. `functions/studio.js` publishes approved posts through Buffer every few minutes once `BUFFER_TOKEN` is set (Pinterest by hand for now). Editors can only draft and send for review (`firestore.rules`).

### Firebase and data access
`config/firebase.js` loads Auth eagerly and Firestore/Storage/Functions on demand; the Firestore emulator is on 8081. Public reads use `lib/firestoreRest.js` (it also passes the server's `Date` header to the sky clock). Forms (`lib/forms.js`): `sendMessage`, `sendQuote` (+ drawing upload), `sendInvestorLead`, `sendInterest` (sign-ups, course and event places, newsletter → `messages` with a `[topic]` subject). Rules: content collections (products, projects, events, courses, templates, developments, downloads, posts) are public read, written by admins and marketing; `settings/site` public read, admin write; `settings/studio` team only; leads (`messages`, `quotes`, `investorLeads`, `subscribers`) anyone creates with checked fields (incl. `source` map and `page`), marketing reads and sets status; `clicks` anyone creates (bounded fields), marketing reads; `team` admin only (members read their own); Studio collections by role (`isEditor`, `isMarketing`); members approved by admins; donors read their own `donations`. Storage: `public/content/**` and `public/social/**` for the team, quote drawings readable by marketing.

### Pages
All copy comes from the owner's designs and the Company Profile; anything unknown is a `TODO:` or `[placeholder]`.
- **Home**: the three.js hotel model (see Scene), value chain, flagship projects, counters from `stats/public` (REST), roadmap, four doors (filtered by page switches).
- **Studio / Construction / Concrete / About / Contact / Projects / project pages**: as before; Projects and project pages now read `useContent("projects")` (brief and "what we did" fields).
- **Templates** (`/templates`, `/templates/:slug`): template home designs with type and bedroom filters, what's included, plans-only vs plans-and-build, designer royalties, quote form. "Buy the plans" waits for Phase 3 payments.
- **Stores / product pages**: `useContent("products")`; product pages have a photo gallery (`ProductGallery`: thumbnails, arrow keys, swipe on phones); the cart drawer links to **Checkout** (`/checkout`: cart review, delivery details, MTN / Airtel / card choice; the pay button stays disabled until Flutterwave runs server-side) and **Order confirmed** (`/checkout/confirmed`, status read from Firestore only).
- **Community** (market motif): why join, directory and jobs previews (samples), events from `useContent("events")`, sign-up via `sendInterest`. **Academy**: courses from `useContent("courses")`, workshops, internships, enrolment interest. **Journal / Post**: `useContent("posts")`, category filter, newsletter; post bodies support blank-line paragraphs, `## ` subheadings and `- ` lists.
- **Invest**, **Real estate** and development pages: vision, 2028 targets, roadmap, investor levels (all terms TODO), investor-pack and interest forms (`sendInvestorLead`).
- **Donate / Thank you**: tree picker, live counter, donor wall samples; payment off until a partner and price are agreed.
- **Account** (orders and enrolments filtered by `uid`, downloads, donations, profile), **Sign in** (Google; email in Phase 4), **Admin**.

### Scene: sky, hills, trees, motifs
Every page hero sits under one shared sky (`Sky.jsx`, drawn by `PageHero` behind the hills): a gradient from `--sky-top` to `--sky-mid` with a glow at the horizon (`--sky-glow`, `--sky-glow-2`, `--sky-band`); the night edition adds ~300 fixed stars and 12 slowly twinkling ones (`starField` in `sceneGeometry.js`, seeded per page, off with reduced motion). The sun or moon (`SkyBody`) lives in `Sky.jsx` too. `PaperLayers` draws the paper landscape on top (two soft clouds by day; the old birds and per-scene stars are gone). The **sun (day edition) or moon (night edition) follows Kampala's clock** (`lib/skyClock.js`: sunrise 06:45, sunset 18:55 EAT, corrected by the server time when known): it rises on the left, is overhead at noon/midnight and sets on the right. It's placed in screen space so it's always in view, and rests low and rust-coloured when it's below the horizon. **Trees** (broadleaf, umbrella acacia, cypress and banana) are cut from the same sheet as their hill: small on the middle hills, a belt on the near hill and two big ones framing the front. Motifs per page: `design`, `construction`, `precast`, `workshop`, `plots` (template homes on pegged plots), `estate`, `forest` (staked saplings in front of grown trees), `academy`, `market`; others use the `city` skyline. With no saved choice, **the edition itself follows Kampala's clock** (day 06:45–18:55) and switches at dusk and dawn.

### Opening animation (`index.html`)
Inline CSS and two small scripts, so it paints before the app's code arrives. The head script picks the edition and a mode: **full** on a first visit, **quick** on later visits, **none** again in the same session (sessionStorage `fc-intro`, localStorage `fc-intro-seen`), **fade** with reduced motion, never for bots (`navigator.webdriver` or crawler user agents). It also reads the cached Admin → Motion timing (`fc-site-motion`) and sets `--fc-motion`, `--fc-motion-build` and `--fci-k`. Full: a drawing sheet (paper texture, grid, border, a perforation near the top) → the FC mark fades in slowly (0.8 s) and pulses like a stamp at 0.8 s while "Designing spaces. Empowering communities." appears word by word → the mark glides to the header logo's exact position (the real logo is hidden with `.fci-hold` until then) → **the sheet is ripped off from the left**: the tear runs along the perforation (rAF, ~1.3 s at 1×), the torn part (`.fci-sheet-a`, clipped left of the tear front) swings down around the front while the rest (`.fci-sheet-b`) stays attached and the perforation is still drawn to its right, then the whole sheet falls away and the stub lifts off. The tear waits until the first page has rendered (`main#main` has content without `aria-busy`), at most 4–5 s; a tap or key press skips to it with a quicker rip; a CSS failsafe hides the sheet after 16 s whatever happens. Its few colours mirror `tokens.css` because it runs before the stylesheet loads (deliberate exception to the tokens rule).

### Home hero: 3D model or 2D drawing
`HotelScene` is a fixed layer behind the page. **The background shows first**: `--hotel-bg` (the 3D scene's own paper colour) plus one paper grain (`.hotel-scene-grain`, the site texture at its 384 px tile, multiply by day and soft-light at night) drawn at the screen's own resolution. Then one of:
- **3D** (most devices: `full`, `standard`, dev-only `ultra`): after the opening animation has gone (`introDone()`) and the browser is idle, the edition's script loads (`hotel/hotelDay.js` / `hotelNight.js`) with the baked paper textures. It draws at the screen's own sharpness (pixel ratio up to 2, `standard` up to 1.5, antialiasing only below 1.5×; `standard` also shrinks shadow maps; `ultra`: ≥ 2×, 4096 px shadows, paper drawn in code). It is compiled with everything visible, then **builds itself** (`hotel/build.js`): the torn backdrop sheets rise one by one, the board settles, the hotel goes up floor by floor (pieces drop in and settle, tall walls grow alongside), greenery grows from the ground, night lamps pop on; ~6 s at 1× (Admin → Motion "Home model building itself"), hurried if the visitor scrolls away or touches the model. Lights are never hidden (that would recompile shaders); the first frame skips the shadow pass so the first-use shader work is split over two frames. When done it sets `data-hotel-built` (labels fade in) and the paper scraps start falling. A slow idle turn (±9°) eases in after the build.
- **2D** (the slowest devices only; `Hotel2D.jsx`, `hotel2dGeometry.js`): the same model projected through the same hero camera as inline SVG — torn backdrop sheets, the hotel shaded by face with cast shadows, cutaway rooms, the "in design" wireframe bays as 1.25 px non-scaling lines, board, contour layers, greenery, figures; night windows, moon and stars. Its own ~5.8 s build (scaled by `--fc-motion-build`) and a soft scroll parallax (`--h2-y`). Colours from the `--hotel-*` tokens. ~100 kB of markup.

**Levels (owner, 2026-10-24: 3D for most devices, 2D only for the slowest).** `guessLevel()`: no WebGL / WebGL2, software graphics, the oldest phone GPUs (Mali-4xx, Adreno 3xx, PowerVR SGX, VideoCore), ≤ 1 GB memory or 2G → `2d`; reduced motion (model held still, no build), Save-Data, 3G, ≤ 4 GB, Mali-T / Adreno 4xx–5xx, or a small screen with < 6 cores → `standard` (pixel ratio up to 1.5, 1024 px shadows); else `full` (up to 2×). A remembered result (`fc-hotel-level`, 30 days) wins. **Frame check** (after the build and 120 settled frames): below ~30 fps the pixel ratio steps down by 0.5, never below 1× (remembered as `standard`); only if frames stay below ~20 fps at 1× does it hand over to the 2D drawing (remembered). In `npm run dev`, a **preview switch** (bottom left) forces Auto / Ultra / Best / Mid-range phone / Slow connection / 2D drawing (`fc-3d-preview`, never read in production; sets `env.fixed` so the frame check doesn't switch).
**Built in steps.** `createHotelScene(canvas, env)` is async: it yields between the materials, hotel, cutaway, trees, backdrop, lights and camera steps and stops early if the page is left (`env.signal`); shaders compile with `compileAsync` before the first frame.
**Views and zoom.** `HotelControls` is a slim vertical icon rail at the top left of the hero, shown once the 3D is ready: Front, Back, Cutaway, Site, zoom in/out, reset (names show beside the icons on hover or focus and are the buttons' accessible names). Pinch and Ctrl+wheel zoom too (0.6–1.6×, sprung); the plain wheel scrolls the page. The drag hint hides on phones once the model is ready.
**Paper scraps.** Their own seeded random; 6 near pieces (4 on phones) fall through the hero view and respawn there, the rest further back; 35 % rust / 30 % navy / 35 % white by day, rust and white at night; 0.35–0.7 m/s.
**Debug flag.** `?hoteldebug` logs each build step's time and exposes `window.__hotelDebug`.

### Security (L2 groundwork)
`firebase.json` sends security headers on every response: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`, HSTS, and a **report-only** Content-Security-Policy (switch to enforcing once the console shows no reports; see `docs/owner-checklist.md`). `cleanUrls` serves the pre-built pages. `functions/index.js` (deploy needs Blaze): `submitLead` (callable; validates and writes messages/quotes/investorLeads/subscribers with honeypot, per-connection and per-email rate limits in `rateLimits/`, App Check enforced when `ENFORCE_APP_CHECK=true`), `claimTeamRole` (sets a signed-in member's role from `team/{email}`), `onTeamChange` (keeps claims in step when an admin edits `team`). `AuthContext` exposes `role`, `isMarketing` and `isEditor`, and calls `claimTeamRole` after sign-in when `VITE_FUNCTIONS_ENABLED=true`. `scripts/set-admin.js` also takes `--role marketing|editor`.

### Caching
`public/sw.js` (production only, `VERSION` `fc-2026-10-24c`): on install it precaches the home page and the assets it references; the page also posts the list of resources it loaded (`main.jsx`), so those get cached too. Pages network-first with an offline copy (40 pages kept) and an offline fallback page; `/assets/` cache-first; fonts, textures, logos and images stale-while-revalidate (images capped at 160). Firebase Hosting: `/assets`, fonts and textures cached for a year (textures are versioned with `?v=`), logos 30 days, images 30 days + stale-while-revalidate, `index.html` and `sw.js` no-cache. Content and page switches are cached in localStorage.

### Paper and textures
`public/textures/*.webp` are generated by `scripts/make-textures.py`: 768 px seamless tiles with pulp clouds, a coarse cold-press tooth lit from the top left, long fibres, short hairs, flecks and bark inclusions; shown at 384 px (`--tex-size`) so the grain stays sharp. The tint overlays in `tokens.css` were thinned so the texture shows. Each sheet's torn top edge (`TornEdge`) is now cut from the same textured paper (`--edge-tex`, clipped to the tear in pixels) with a pale fibre line and loose hairs along the tear.

### Motion rules
Two kinds of motion. **UI motion** follows `.claude/skills/emil-design-eng`: curves `--fc-ease-out` (enter/exit, press, hover), `--fc-ease-in-out` (moving on screen) and `--fc-ease-drawer` (drawers and sheets) in `tokens.css`; buttons, icon buttons, the Links buttons and the plant-a-tree button give a little when pressed (`scale` .94–.98 on `:active`, 160 ms); hover lifts and image zooms only on devices with a real pointer (`@media (hover: hover) and (pointer: fine)`), so taps on phones don't leave things stuck "hovered"; cards lift in 250 ms; the cart drawer slides with the drawer curve; the plant-a-tree pop-up grows out of its corner (`transform-origin: 100% 100%`, 200 ms); the cookie banner and the subscribe slip come in within 300–350 ms. **Storytelling motion** (the opening sheet, the Home build, section reveals) keeps `--fc-ease` and the Admin → Motion timing. With reduced motion, movement stops but reveals still fade in (200 ms).

### Plant-a-tree button
`DonateFab` is a 50 px round orange button in the bottom-right corner with a leaf; "Plant a tree" shows as a tooltip on hover or focus (and stays the button's accessible name). It opens a small `Popover` anchored to the corner (focus trapped, Escape / × / outside click close it, focus returns to the button): the live tree counter, 1 / 5 / 10 tree picks, the price as `TODO` until a planting partner is agreed, a disabled "Plant" button and a "More options" link to `/donate`.

## Phase 0 checklist

Status: `To do` · `In progress` · `Done (date, commit)`. Task ids match the plan.

| # | Problem | Fix | Task | Status |
| --- | --- | --- | --- | --- |
| 1 | Home, Services, About, Portfolio describe a form-builder SaaS | Rewrite from the Company Profile; `TODO:` where facts are missing (full rewrite in Phase 1) | P0.9 | Done (2026-10-24) |
| 2 | Terracotta + Inter (shop) and `#4285F4` (Home) break the Brand Guide | `tokens.css` + fonts; replace hard-coded colours and inline styles | P0.3 | Done (2026-10-24) |
| 3 | Emoji logo, Vite favicon | Formcraft SVG logo and FC mark from `public/logos/` | P0.6 | Done (2026-10-24) |
| 4 | Invented testimonials, "Trusted by" logos, collection makers, blog posts | Remove; `TODO:` placeholders | P0.9 | Done (2026-10-24) |
| 5 | Prices in dollars | Whole UGX integers, `formatUGX` → "UGX 120,000" | P0.7 | Done (2026-10-24) |
| 6 | Forced sign-in overlay after 2 s, can't be closed | Remove auto-popup; sign-in on demand, closable | P0.4 | Done (2026-10-09) |
| 7 | Cart lost on navigation; Checkout dead; mouse-only drag | `CartContext` + localStorage; fixed touch-friendly button; Checkout "Coming soon" until Phase 3 | P0.8 | Done (2026-10-24) |
| 8 | Products reshuffle every 14 s | Stable order | P0.7 | Done (2026-10-24) |
| 9 | Buttons that do nothing (Home cards, Explore, Join, Donate, Settings, Read Our Story) | Real routes or remove | P0.9 | Done (2026-10-24) |
| 10 | Blank screen until auth answers | Render immediately; gate only what needs the user | P0.4 | Done (2026-10-09) |
| 11 | Routes don't match the site map; no 404; `Construction.jsx` name clash | `routes.jsx`, redirects, `NotFound`, `ComingSoon.jsx` | P0.5 | Done (2026-10-24) |
| 12 | `Footer.jsx` empty | Build footer | P0.6 | Done (2026-10-24) |
| 13 | Header links have no `href`; current page removed; no mobile menu | `<NavLink>`, active state, four doors, mobile menu | P0.6 | Done (2026-10-24) |
| 14 | Clickable `<div>`/`<article>`, unlabeled icon buttons, modal without focus trap/Escape | `<button>`/`<Link>`, `aria-label`, focus trap + Escape | P0.10 | Done (2026-10-24) |
| 15 | Vite template leftovers; title "formcraft" | Delete; title "Formcraft" | P0.1 | Done (2026-10-09) |
| 16 | `Shop.css` `:root`, global `.container`/`.section`/`.btn` leak | Move to `src/styles/`; prefix component classes | P0.3 | Done (2026-10-24) |
| 17 | Firebase config inline, Analytics at load, `.jsx` extension | `firebase.js`, env vars, emulators in dev, Analytics in prod only | P0.2 | Done (2026-10-24) |
| 18 | Firebase SDK ^11 | Update to current major | P0.2 | Done (2026-10-24) |
| 19 | External placeholder images (Unsplash, via.placeholder.com, pravatar.cc) | Formcraft photos or `TODO:`; WebP, `loading="lazy"` | P0.9 | Done (2026-10-24) |
| 20 | No `firebase.json`, rules, functions, `.env.example`, CI | Set up per plan (SPA rewrite) | P0.2 | Done (2026-10-24) |

| Task | Status |
| --- | --- |
| P0.1 Clean out | Done (2026-10-09) |
| P0.2 Firebase config | Done (2026-10-24) |
| P0.3 Brand base | Done (2026-10-24) |
| P0.4 Auth | Done (2026-10-09) |
| P0.5 Layout and routing | Done (2026-10-24) |
| P0.6 Header and footer | Done (2026-10-24) |
| P0.7 Shop → Stores | Done (2026-10-24) |
| P0.8 Cart | Done (2026-10-24) |
| P0.9 Honest content | Done (2026-10-24) |
| P0.10 Accessibility | Done (2026-10-24) |

---

## Known issues and notes

- Firebase project: the code now points at `formcraft2027` (owner's decision). The project still has to be created in the Firebase console and its web-app keys pasted into `.env.local` (the four key lines are marked TODO there); until then local work runs against the emulators.
- The Firebase web API key is in the repo history. It isn't a secret, but restrict it to the site's domains in Google Cloud console.
- No tests. Rules tests arrive in Phase 3.
- The latest commits (all pages, admin, textures, sky, service worker) were compiled with esbuild and checked in a headless browser only; run `npm run lint` and `npm run build` locally, and try Admin with a real admin account against the emulators.
- `useContent` replaces the starter list as soon as a collection has **any** Firestore document, so importing or adding one item hides the rest of the starter list (the Admin page says so).
- The service worker only registers in production builds. After a deploy, returning visitors get the new site on the next navigation (pages are network-first); bump `VERSION` in `public/sw.js` when its caching rules change.
- Pages not visited before are blank offline until a route error boundary is added (planned with the funnel work).
- The Home 3D scene doesn't follow the Kampala sky clock yet (its day and night scripts keep their own lighting); the paper scenes do.
- The 2D drawing's markup is ~100 kB (aim was 60 kB); check it on a mid-range Android (handoff round 5).
- The build sequence and the new frame check haven't been measured on real GPUs yet (handoff round 5).
- Functions are written but not deployed (Blaze plan needed). Until then forms write to Firestore directly, team roles come from `scripts/set-admin.js`, and Studio posts are published by hand (Queue → "Mark as posted").
- Items added only through Admin get no pre-built SEO page until the next build (the live page still sets its own head).
- Online unsubscribe isn't built; the privacy page tells people to ask by email.
- Rules for `subscribers`, `clicks`, the `source` map and the Studio collections haven't been tested in the emulator yet (handoff).
- `pages/ComingSoon.jsx` is no longer routed (hidden pages use `PageGate`); kept for later phases.
- The Firestore emulator runs on port **8081**, not the default 8080, because the Revit MCP plugin uses 8080 on the owner's machine. Keep `firebase.json` and `config/firebase.js` in step.
- `npm audit`: 4 high in `@grpc/grpc-js` (pulled in by `firebase`, Node-only, not in the browser build) and 2 moderate in `react-router` 6 (fixed only in v7, a later task).
- Bundle: Firestore, Storage and Functions load on demand; public pages read Firestore over REST, so the Firestore SDK loads only on Admin, Account, Checkout confirmation and form submits. three.js loads only with the Home hotel scene. Last local measure: main JS 97.4 kB gzipped (before this round); re-measure.
- Textures are ~105–130 kB each (three per page, cached for a year and by the service worker).
- The hotel scenes (`components/scene/hotel/`) are ported from the concept files written for three.js r128. Lights are converted to physical units in `hotel/compat.js`; the day edition was compared against the concept and matches; the night edition still needs a look on real hardware.
- The pages from the paper-edition commits were written in a session without npm: they were compiled with esbuild and checked in a headless browser at 390 and 1440 px in both editions, but `npm run lint` / `npm run build` need running locally (see `docs/handoff.md`).
- P0.4 was tested in Edge for opening, closing (×, Escape, backdrop), focus and no auto-popup. A real Google sign-in wasn't tested; try it once in the browser.

---

## Change log

Newest first. One row per commit or task.

| Date | Task | What changed | Files |
| --- | --- | --- | --- |
| 2026-10-24 | Opening timing | Owner: the start of the opening was a bit too fast. The mark now fades in over 0.8 s (was 0.4), the stamp comes at 0.8 s (was 0.38) and lasts 0.8 s, the tagline's words follow from 1.1 s, 200 ms apart (was 0.48 s, 150 ms); the glide and the tear move later to match (2.3 s and 3.0 s at 1×). The tear's own speed is unchanged. Measured in Chrome: stamp at ~0.9–1.1 s, tear at ~3.1 s, gone at ~5.4 s. | `index.html`, docs |
| 2026-10-24 | UI beauty pass | From visual tours of every main page at 1440 and 360 px, day and night. **Email prompt** moved from the bottom left (it sat over section headings on every page) to the bottom right, just above the plant-a-tree button; it steps aside while the footer or any form on the page is on screen and while a pop-up is open, and is shorter on phones. **Photo placeholders** are now a blank drawing sheet (faint grid, inset frame, FC mark, small caption) instead of diagonal hatching; About portraits are shorter on phones. Home: the flagship cards showed "[Lydia Residential photo]" to visitors (fixed, and the placeholder check now catches brackets React splits into several text nodes); "ISO 19650" and "IFC · IDS" stay on one line; a stronger paper fade and a soft halo keep the hero text readable over the model. Stores: the two promo tiles take a full row on phones. | `src/components/forms/SubscribePrompt.*`, `src/styles/components.css`, `src/pages/Home.*`, `src/pages/About.*`, `src/pages/Stores.css`, `scripts/check/page-checks.mjs`, docs |
| 2026-10-24 | Documentation | Guides for developers and the owner: `README.md` (start here), `docs/architecture.md` (how it all fits together, with a diagram), `docs/folders.md`, `docs/glossary.md`, `docs/recipes.md` (common jobs step by step), `docs/checks.md`. Documentation standard added to `CLAUDE.md`. Every source file has a plain-English header (219/219) and every export a comment (362/362), checked by `scripts/check/doc-coverage.mjs`. `devStatusLabel` no longer falls back to "[status]". Fresh full check: 0 errors (44 warnings: the plant-a-tree button passing over text while scrolling). | `README.md`, `docs/*`, `CLAUDE.md`, all of `src/`, `functions/index.js`, `scripts/check/doc-coverage.mjs` |
| 2026-10-24 | Smoothness pass | New `npm run check:smooth` (layout shift, blocking time and scroll frame timing per page, desktop and a 4×-slowed 360 px phone) plus diagnostics (`shift-detail.mjs`, `scroll-profile.mjs`). **Fixed:** the footer showed under the short loading skeleton and jumped away when the page arrived (CLS 0.39–0.98 on every page) → `#main` is at least one screen tall (CLS now 0–0.05); the hero scenery's endless animations pause off screen (`useOnScreen`, PageHero `data-paused`) so scrolling no longer repaints the shadowed landscape every frame; PaperLayers quill rings and trees merged into a few paths (hero 641 → 59 SVG elements, pages ~1,100 → ~530 elements, pixel-checked); Auth starts with `initializeAuth` and loads Google's pop-up helper only on sign-in (no gapi on every page); the edition's paper textures are always preloaded; preconnect to Firestore. Lighthouse mobile: Accessibility 100, SEO 100, Best practices 96, Performance 41–61 (the rest is client-side rendering; pre-rendering recommended). | `scripts/check/smooth.mjs`, `shift-detail.mjs`, `scroll-profile.mjs`, `src/styles/base.css`, `src/hooks/useOnScreen.js`, `src/components/page/PageHero.*`, `src/components/scene/PaperLayers.jsx`, `src/config/firebase.js`, `src/context/AuthContext.jsx`, `index.html`, `.oxlintrc.json`, `package.json` |
| 2026-10-24 | Presentation pass 1 | **Missing facts never show raw to visitors:** `src/lib/pending.js` (isPending, known, splitPending) and `src/components/ui/Todo.jsx` (`<Todo>`, `<Fact>`, `<PartFact>`): visitors see a true fallback or nothing; signed-in team members see a dashed "To fill in: …" note (`useSeesTodos`). Applied across every page: prices read "Price on request"; empty counters, sample listings (templates, developments, makers, jobs, donor wall, events without dates) and planned Journal posts are team-only, with honest empty states for visitors; `Photo` shows "Photo coming soon". Sitemap and noindex skip planned posts. **Fixes:** day `--ink-3` contrast (.62 → .68, AA on every light paper); missing `fmc-sheet-a1-800.webp`; Home tablet drag hint under the header; plant-a-tree button waits on phones until the visitor scrolls; admin marketing studio classes renamed `studio-*` → `mkt-*` (collided with the Studio page); cart kept Admin-added products on reload; product cards say "Choose options" when a product has several colours or sizes; Contact no longer promises a next-day reply; investment disclaimers stay visible. **Checks:** CSS collision scan, visible-placeholder rule, step timings, faster in-page scrolling. Docs: plain-English headers and JSDoc on the app shell, routes, hooks, helpers, contexts, UI, layout and shop. | `src/lib/pending.js`, `src/components/ui/Todo.*`, `src/hooks/useSeesTodos.js`, `src/pages/*`, `src/components/*`, `src/styles/tokens.css`, `src/data/*`, `scripts/check/*`, `scripts/seo-pages.mjs`, `public/images/fmc-sheet-a1-800.webp`, docs |
| 2026-10-24 | Motion craft | Emil Kowalski's design-engineering skills vendored into `.claude/skills/` (MIT, Formcraft notes on top; promotional "initial response" removed) and applied: strong ease-out / in-out / drawer curves as tokens; press feedback on buttons, icon buttons, Links buttons and the plant-a-tree button; hover motion gated to real pointers; card hover 350 → 250 ms; drawer curve on the cart drawer and phone sheets; plant-a-tree pop-up grows from its corner; cookie banner 450 → 300 ms, subscribe slip 500 → 350 ms; reduced motion keeps 200 ms fades on reveals. `CLAUDE.md` points at the skills. | `.claude/skills/*`, `src/styles/tokens.css`, `components.css`, `base.css`, `src/components/ui/Drawer.css`, `Popover.css`, `src/components/layout/DonateFab.css`, `Header.css`, `ConsentBanner.css`, `src/components/forms/SubscribePrompt.css`, `src/components/shop/ProductCard.css`, `src/pages/Home.css`, `Projects.css`, `Links.css`, `OrderConfirmed.css`, `CLAUDE.md`, docs |
| 2026-10-24 | Offline checks | `npm run check` (lint, build, SEO files, size budget, every route at 360/768/1440 day and night in local Chrome with the internet blocked: text on text, text off screen or cut off, floating pieces colliding or covering text, one h1, title and description, broken images, script errors, axe; 10 click checks; link check; HTML report with screenshots) and `check:speed` (local Lighthouse). GitHub Actions workflow and `lighthouserc.json` removed (billing). **Fixed:** `Hotel2D.css` named its root `.h2`, which collided with the site's `.h2` headings: `contain: strict` collapsed them, so headings ran over text, buttons and cards on Home, Studio and Templates. All its classes are now `hotel2d-*` and its night rules are scoped. Dev preview panel moved to the bottom right, above the plant-a-tree button; it can be dragged and folds to a tab. | `scripts/check/*`, `package.json`, `.gitignore`, `src/components/scene/Hotel2D.*`, `src/components/scene/HotelScene.*`, `CLAUDE.md`, docs |
| 2026-10-24 | L1 levels fix | Owner: the 2D drawing is only for the slowest devices. 2D now only for no WebGL2, software graphics, the oldest phone GPUs, ≤ 1 GB, 2G or frames under ~20 fps at 1×; reduced motion, Save-Data, 3G and mid-range GPUs get 3D `standard` (up to 1.5×). The frame check steps the pixel ratio down (not below 1×) before ever switching to 2D. Stored level renamed `fc-hotel-level`. | `src/components/scene/HotelScene.jsx`, `hotel/hotelDay.js`, `hotel/hotelNight.js`, docs |
| 2026-10-24 | L1 Home rework | Owner's new direction: no still pictures (deleted with their script); background first, then the 3D model builds itself (`hotel/build.js`); devices that can't draw it sharp get the 2D drawing (`Hotel2D`); always full sharpness, no downscaling; one screen-space paper grain; controls as a minimal left rail; opening sheet ripped off from the left; Motion timing applied to the opening, the build and the reveals. Ported from `try/auto-live`: dev preview switch, `ultra` dev level, frame-check thresholds, livelier idle turn. Paper scraps per ideas log §12. 3D starts after the opening animation. | `index.html`, `src/components/scene/*`, `src/pages/Home.*`, `src/styles/tokens.css`, `public/images/hotel-*` (deleted), `scripts/render-hotel-stills.mjs` (deleted), docs |
| 2026-10-24 | L3–L7 | Funnel: attribution, honeypots, `subscribers` + SubscribeForm/Prompt, free downloads, contact-click tracking (`clicks`), cookie consent + Analytics after consent, `/links`, `/privacy`, forms through `submitLead` behind `VITE_FORMS_VIA_FUNCTIONS`. Admin: Leads (charts, CSV), Link builder, Site details, Motion (animation timing), Team, Studio (marketing calendar, generate the year, CSV, Buffer publisher in `functions/studio.js`); roles admin/marketing/editor. SEO: `data/seo.js`, `usePageMeta` options, `scripts/seo-pages.mjs` (per-route heads, sitemap, robots) in `npm run build`, `public/og/` cards. Rules for all of it. Lint: `INBOXES` → `admin/inboxes.js`, `Photo` no longer exports `imageName`. | `src/lib/*`, `src/components/admin/*`, `src/components/forms/*`, `src/components/layout/*`, `src/context/SiteContext.jsx`, `src/data/*`, `src/pages/*`, `src/hooks/usePageMeta.js`, `src/styles/base.css`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `functions/*`, `scripts/*`, `public/og/*`, `package.json`, `.env.example`, `ci.yml`, docs |
| 2026-10-24 | L1 polish | Shared hero sky (`Sky.jsx`: gradient, glow, stars and twinkles at night, sun/moon) behind every page hero; new sky tokens. Plant-a-tree button opens a small corner `Popover` (counter, 1/5/10, TODO price) instead of the drawer. Product photo gallery. Service worker precaches the home page's assets and what each page loaded; offline fallback page. Hotel: baked textures always, `?hoteldebug` build-step timings. Also documents `a5c5955` (views and zoom, device levels with a live frame check, scene built in steps). | `src/components/scene/Sky.*`, `PaperLayers.*`, `sceneGeometry.js`, `src/components/page/PageHero.jsx`, `src/styles/tokens.css`, `src/components/ui/Popover.*`, `src/components/layout/DonateFab.*`, `src/pages/ProductPage.*`, `public/sw.js`, `src/main.jsx`, `src/components/scene/HotelScene.jsx`, `hotel/*.js`, docs |
| 2026-10-24 | local check | Round 4 checks of `d9d6802`. Hotel stills re-rendered on the NVIDIA GPU (scrollbar hidden, WebP via sharp). `functions/package-lock.json` added. Findings in `docs/handoff.md`. | `public/images/hotel-*.webp`, `functions/package-lock.json`, docs |
| 2026-10-24 | L1, L2 | Opening animation in `index.html` (drawing sheet → stamp → glide to the header logo → tear off the pad; full/quick/none/fade). Home: still pictures of the hotel shown first, 3D fades in over them; tap/still modes for slower phones; layer sized to `100lvh`; baked hotel textures; no blur on phones. Security headers + report-only CSP, `cleanUrls`. `functions/` (submitLead, claimTeamRole, onTeamChange); AuthContext roles; `set-admin.js --role`. CI workflow + Lighthouse budgets. Build plan: Launch track L1–L7. `docs/owner-checklist.md`. | `index.html`, `src/components/scene/HotelScene.*`, `hotel/*.js`, `src/pages/Home.*`, `Header.css`, `firebase.json`, `functions/*`, `src/context/AuthContext.jsx`, `scripts/set-admin.js`, `.github/workflows/ci.yml`, `lighthouserc.json`, `public/images/hotel-*`, `public/textures/hotel-*`, docs |
| 2026-10-24 | local check | Round 3 checks of `f651610`: lint, build, all routes, forms, admin (claim via `scripts/set-admin.js`, page switches, product import/edit/upload), service worker and offline. No code changes; findings in `docs/handoff.md`. | docs |
| 2026-10-24 | P1 paper & speed | Coarse paper textures (`scripts/make-textures.py`, 768 px tiles at 384 px, `?v=2`), thinner tint overlays, torn edges cut from the section's own textured paper with a fibre line. Sun/moon follow Kampala's clock (`lib/skyClock.js`, `useSky`); with no saved choice the edition follows the clock too. Green tree silhouettes on every scene (`plantTrees`, `treeShape`) and new motifs `plots`, `estate`, `forest`, `academy`, `market`. Plant-a-tree button is a 50 px circle. Home 3D: idle loading, paper landscape until ready, renders only while visible, adaptive pixel ratio, smaller shadow maps. Service worker `public/sw.js`, new Hosting cache headers. Round-2 fixes: drag hint at 360 px, Studio table region + scroll shadows. | `src/styles/*`, `src/components/scene/*`, `src/components/ui/TornEdge.jsx`, `src/components/layout/DonateFab.*`, `src/lib/skyClock.js`, `src/hooks/useSky.js`, `src/context/ThemeContext.jsx`, `index.html`, `public/textures/*`, `public/sw.js`, `src/main.jsx`, `firebase.json`, `src/pages/Home.*`, `src/pages/Studio.jsx` |
| 2026-10-24 | P1 all pages + admin | Every page from the design: Templates, TemplateDesign, Checkout, OrderConfirmed, Community, Academy, Journal, Post, Invest, RealEstate, RealEstateProject, Donate, DonateThanks, Account, SignIn, Admin (starter data in `src/data/`). Page switches (`data/pages.js`, `SiteContext`, `PageGate`, `useShowLink`; Firestore `settings/site`). Content layer (`data/content.js`, `useContent`, REST reads in `lib/firestoreRest.js`); Stores, product pages, Projects and project pages read it. Admin control room (pages, content editor with photo uploads, inbox). `useCollection`, `usePublicDoc`, `lib/images.js`, `lib/adminContent.js`, `scripts/set-admin.js`. Header groups moved to `data/nav.js`, `ThemeSwitch` to its own file (clears the lint warning); admin icon in the header for admins. Rules: `templates`, `developments`, `settings`; admin update on `messages`, `investorLeads`, `members`; donors read their own `donations`. | `src/pages/*`, `src/data/*`, `src/context/SiteContext.jsx`, `src/components/admin/*`, `src/components/layout/*`, `src/hooks/*`, `src/lib/*`, `src/routes.jsx`, `src/App.jsx`, `firestore.rules`, `scripts/set-admin.js` |
| 2026-10-24 | local check | `Layout` no longer moves focus to `<main>` on the first page load (only after navigating), so Tab starts at the skip link and header. Local checks of all routes, cart, drawers, redirects, reduced-motion fallback and the Contact/quote forms against the emulators; results in `docs/handoff.md`. | `src/components/layout/Layout.jsx`, docs |
| 2026-10-24 | P1 follow-up | Firestore, Storage and Functions load on demand from `config/firebase.js` (`getDb()`, `getStorageService()`, `getFunctionsService()`); `lib/forms.js` and `useDocument` use them. Contexts moved to `context/contexts.js`, hooks to `hooks/useAuth.js`, `useTheme.js`, `useCart.js` (clears the `only-export-components` warning). `.gitattributes` keeps LF line endings. | `src/config/firebase.js`, `src/lib/forms.js`, `src/hooks/*`, `src/context/*`, `.gitattributes` |
| 2026-10-24 | P0.9, P0.10, Phase 1 | Home rebuilt around the owner's three.js hotel model (day and night scripts ported from the concept files, lazy-loaded, camera driven by `data-cam` sections, drag to turn) with a paper-landscape fallback. Division pages get paper hero scenes with page motifs (design, construction, precast, workshop). New pages: Studio (process, package, rates, live fee calculator, BIM, 1D–7D, quote form), Construction (how we build, template builds, start a build), Concrete (products, green concrete, B2B supply), About, Projects (filter) and project pages, Contact (form to `messages`). All copy from the Company Profile and earlier designs; missing facts are `TODO:`. Old form-builder pages and invented content removed. Real `<Link>`s, labelled icon buttons, native dialogs (Escape, focus return). | `src/pages/*`, `src/components/scene/*`, `src/components/forms/*`, `src/data/projects.js`, `src/lib/forms.js`, `public/images/*` |
| 2026-10-24 | P0.7, P0.8 | Shop → Stores: `/stores` (`pages/Stores.jsx`: hero, collection with category filter, community, made to order) and `/stores/:slug` (`pages/ProductPage.jsx`). `src/data/products.js` holds the real Formcraft merch (oak armchair, desk organiser, tote, bottle, helmet, vest) in the Firestore shape, `priceUGX: null` until real prices exist; `formatUGX` shows "UGX [price]" for those. `CartContext` (`useCart()`): `{ productId, color, size, qty }` lines only, same-options merge, localStorage via `lib/storage.js`. `CartButton` in the header and `CartDrawer` (native dialog, quantities, remove, Checkout "coming soon"). Old `components/craft/*`, `components/data/products.jsx`, `pages/Shop.*` removed (invented testimonials and logos went with them). | `src/pages/Stores.*`, `src/pages/ProductPage.*`, `src/components/shop/*`, `src/context/CartContext.jsx`, `src/data/products.js`, `src/lib/money.js` |
| 2026-10-24 | P0.5, P0.6 | `src/routes.jsx`: every page lazy-loaded, redirects (`/shop`, `/portfolio`, `/services`, `/blog`), 404, `ComingSoon` for later-phase routes (was `pages/Construction.jsx`). `App.jsx`: Theme, Auth and Cart providers, `<Suspense>` with `PageSkeleton`. `components/layout/`: `Layout` (skip link, scroll and focus on navigation), `Header` (logo SVG, `<NavLink>` four-door groups with disclosure panels, mobile menu drawer, day/night switch, cart, account/sign-in, quote button), `Footer` (drawing title block with a sheet number per page), `DonateFab` (plant-a-tree drawer; payment off until a partner and price are agreed). Page shell pieces in `components/page/` (`PageHero`, `Section`, `Photo`). Old `components/Header.*` and `Footer.jsx` removed. Sign-in dialog restyled with tokens. | `src/routes.jsx`, `src/App.jsx`, `src/components/layout/*`, `src/components/page/*`, `src/pages/ComingSoon.jsx`, `src/pages/NotFound.jsx` |
| 2026-10-24 | P0.3 | Paper design system with **day and night editions**: `src/styles/tokens.css` (brand colours + every derived value; theme variables switch on `data-theme` on `<html>`), `fonts.css` (self-hosted Satoshi and Clash Grotesk variable `.woff2`), `base.css` (reset, layout helpers, type scale, motion, reduced motion), `components.css` (buttons, paper cards, photos, tags, forms, tables, torn edges). `ThemeContext` (`useTheme()`), theme picked before paint in `index.html`. UI pieces in `components/ui/`: `Icon`, `Logo`, `TornEdge`, `Reveal`/`Kinetic`, `Drawer` (native `<dialog>`). Hooks `useReveal`, `usePageMeta`; `lib/money.js` (`formatUGX`), `lib/storage.js`. Assets in `public/` (fonts, logos, textures, WebP renders); favicon is the FC mark. | `src/styles/*`, `src/context/ThemeContext.jsx`, `src/components/ui/*`, `src/hooks/*`, `src/lib/*`, `index.html`, `src/main.jsx`, `public/*` |
| 2026-10-24 | — | Firestore emulator moved from port 8080 to 8081 (Revit MCP plugin uses 8080). Installed firebase-tools and Java 21 locally; emulators start. | `firebase.json`, `src/config/firebase.js`, docs |
| 2026-10-24 | handoff | Local install on the owner's machine: `npm install` (three 0.184.0, firebase 12.19.0), `npm audit fix` (patch/minor only: vite 8.3.5, react-router-dom 6.30.6). Lint and build pass. `.env.local` filled from the old `fromcraft-2026` config (not committed). | `package-lock.json`, docs |
| 2026-10-24 | P0.2 | `config/firebase.jsx` → `config/firebase.js`: config from `VITE_FIREBASE_*` env vars (falls back to a `demo-` project with a console warning), exports `app`, `auth`, `db`, `storage`, `functions`, connects to the emulators when `VITE_USE_EMULATORS=true`, Analytics only in production. Added `.env.example`, `firebase.json` (SPA rewrite, cache headers, emulator ports), `.firebaserc`, `firestore.rules` (plan starter), `storage.rules`, `firestore.indexes.json`. `firebase` → ^12, added `three` ^0.184. Fixed `.oxlintrc.json` (react version "19.2", no `parserOptions`). | `src/config/firebase.js`, `package.json`, Firebase files, `.oxlintrc.json` |
| 2026-10-09 | — | Moved to the new repo `formcraft/formcraft-web-27` (private). Flattened: the app moved from `formcraftwebsite2026/website/` to the repo root, history kept. One root `.gitignore` covering deps, builds, all `.env*` except `.env.example`, Firebase/service-account keys, emulator data, logs and editor files. | `.gitignore`, all paths, docs |
| 2026-10-09 | P0.4 | Added `AuthContext` + `useAuth()`. Removed the forced sign-in overlay and the blank screen while auth loads. `auth.jsx` became `auth/SignInDialog.jsx`: native `<dialog>`, closes with ×/Escape/backdrop, shows errors. Header gets a "Sign in" button and uses `useAuth()`. Pages no longer take a `user` prop; Home reads `useAuth()`. | `App.jsx`, `context/AuthContext.jsx`, `components/auth/SignInDialog.*`, `components/Header.*`, `pages/*.jsx` |
| 2026-10-09 | P0.1 | Deleted unused Vite template files (`App.css`, `assets/react.svg`, `assets/vite.svg`, `assets/hero.png`, `public/icons.svg`, template `README.md`). Page title is now "Formcraft". | `index.html`, deleted files |
| 2026-10-09 | — | Decided to build on the existing React code. Baseline of this file written from a full read of the code. `build-plan.md` and `CLAUDE.md` moved from plain JS to React; Phase 0 added. No code changed yet. | `docs/build-plan.md`, `docs/current-code.md`, `CLAUDE.md` |
