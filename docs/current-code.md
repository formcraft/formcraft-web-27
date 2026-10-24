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
> · Phase: **0 done; every designed page built; admin control room, page switches, content in Firestore**
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
| Firebase project files | `firebase.json` (SPA rewrite, cache headers), `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`; no `functions/` yet | functions in Phase 3 |
| Firebase project | `fromcraft-2026`, config from `VITE_FIREBASE_*` | open question |
| Styling | tokens + shared styles in `src/styles/`, one CSS file per component, coarse paper textures | same |
| State | `AuthContext`, `ThemeContext`, `CartContext`, `SiteContext` (page switches) | same |
| Content | `useContent()`: Firestore collection if the admin added items, else starter data in `src/data/` | Firestore |
| Offline / caching | service worker `public/sw.js` (production only), localStorage content cache, long cache headers | same |
| Tests | none | rules tests from Phase 3 |

Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`. Texture generator: `python3 scripts/make-textures.py public/textures`. Admin claim: `node scripts/set-admin.js you@example.com`.

---

## File map (today)

```
formcraft-web-27/
├─ index.html                 # picks the edition before first paint (saved choice, else Kampala clock); meta, font preloads
├─ firebase.json  .firebaserc  firestore.rules  storage.rules  firestore.indexes.json  .env.example
├─ docs/  build-plan.md  current-code.md  handoff.md
├─ scripts/   set-admin.js (admin custom claim)  make-textures.py (paper textures)
├─ public/
│  ├─ sw.js        service worker (offline cache, fast repeat visits)
│  ├─ fonts/  logos/  images/ (WebP renders, 1600 + -800)
│  └─ textures/    paper, navy, black, orange: 768 px tileable coarse paper (shown at 384 px)
└─ src/
   ├─ main.jsx (registers sw.js in production)  App.jsx  routes.jsx (lazy pages, PageGate, redirects, prefetchRoute)
   ├─ config/firebase.js
   ├─ context/     contexts.js  AuthContext  ThemeContext  CartContext  SiteContext
   ├─ styles/      tokens.css  fonts.css  base.css  components.css
   ├─ data/        pages.js (every page + on/off defaults)  nav.js (header groups)  content.js (admin collections + fields)
   │               products.js  templates.js  projects.js  developments.js  posts.js  courses.js  events.js  sheets.js
   ├─ hooks/       useAuth  useTheme  useCart  useSite (+ useShowLink)  useContent (+ useContentItem)  useCollection
   │               useDocument  usePublicDoc  usePageMeta  useReveal  useSky
   ├─ lib/         money.js  forms.js  storage.js  images.js  firestoreRest.js  adminContent.js  skyClock.js
   ├─ components/
   │  ├─ layout/   Layout  Header  ThemeSwitch  Footer  DonateFab  PageGate  PageSkeleton
   │  ├─ page/     PageHero  Section  Photo
   │  ├─ scene/    HotelScene (+ hotel/*.js)  PaperLayers  sceneGeometry.js (hills, motifs, trees)
   │  ├─ admin/    PagesPanel  ContentPanel  AdminField  InboxPanel
   │  ├─ shop/     ProductCard  CartButton  CartDrawer
   │  ├─ forms/    QuoteForm
   │  ├─ auth/     SignInDialog
   │  └─ ui/       Icon  Logo  TornEdge  Reveal/Kinetic  Drawer
   └─ pages/       Home  Studio  Construction  Concrete  Templates  TemplateDesign  Projects  ProjectPage
                   Stores  ProductPage  Checkout  OrderConfirmed  Community  Academy  Journal  Post
                   Invest  RealEstate  RealEstateProject  Donate  DonateThanks  About  Contact
                   Account  SignIn  Admin  ComingSoon (unused, kept for later)  NotFound   (each .jsx + .css)
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
Signed out → sign-in card; signed in without the claim → how to get it (`scripts/set-admin.js`). Admins get a side menu: **Overview**; **Pages** (switches, grouped like the site map); **Content** (one panel per collection: live list via `useCollection`, add/edit form built from the field list, photo uploads to Storage `public/content/<collection>/`, hide via "Show on the site", delete with confirmation, "Import the starter list" to copy `src/data/` into Firestore); **Inbox** (messages, quotes, investor leads with a status the team sets; orders, donations and members read-only). Nothing on this page can mark a payment paid.

### Firebase and data access
`config/firebase.js` loads Auth eagerly and Firestore/Storage/Functions on demand; the Firestore emulator is on 8081. Public reads use `lib/firestoreRest.js` (it also passes the server's `Date` header to the sky clock). Forms (`lib/forms.js`): `sendMessage`, `sendQuote` (+ drawing upload), `sendInvestorLead`, `sendInterest` (sign-ups, course and event places, newsletter → `messages` with a `[topic]` subject). Rules added in this round: `templates`, `developments` and `settings` are public read / admin write; admins can update or delete `messages`, update `investorLeads`, approve `members`; donors can read their own `donations`.

### Pages
All copy comes from the owner's designs and the Company Profile; anything unknown is a `TODO:` or `[placeholder]`.
- **Home**: the three.js hotel model (see Scene), value chain, flagship projects, counters from `stats/public` (REST), roadmap, four doors (filtered by page switches).
- **Studio / Construction / Concrete / About / Contact / Projects / project pages**: as before; Projects and project pages now read `useContent("projects")` (brief and "what we did" fields).
- **Templates** (`/templates`, `/templates/:slug`): template home designs with type and bedroom filters, what's included, plans-only vs plans-and-build, designer royalties, quote form. "Buy the plans" waits for Phase 3 payments.
- **Stores / product pages**: `useContent("products")`; the cart drawer links to **Checkout** (`/checkout`: cart review, delivery details, MTN / Airtel / card choice; the pay button stays disabled until Flutterwave runs server-side) and **Order confirmed** (`/checkout/confirmed`, status read from Firestore only).
- **Community** (market motif): why join, directory and jobs previews (samples), events from `useContent("events")`, sign-up via `sendInterest`. **Academy**: courses from `useContent("courses")`, workshops, internships, enrolment interest. **Journal / Post**: `useContent("posts")`, category filter, newsletter; post bodies support blank-line paragraphs, `## ` subheadings and `- ` lists.
- **Invest**, **Real estate** and development pages: vision, 2028 targets, roadmap, investor levels (all terms TODO), investor-pack and interest forms (`sendInvestorLead`).
- **Donate / Thank you**: tree picker, live counter, donor wall samples; payment off until a partner and price are agreed.
- **Account** (orders and enrolments filtered by `uid`, downloads, donations, profile), **Sign in** (Google; email in Phase 4), **Admin**.

### Scene: sky, hills, trees, motifs
`PaperLayers` draws the paper landscape. The **sun (day edition) or moon (night edition) follows Kampala's clock** (`lib/skyClock.js`: sunrise 06:45, sunset 18:55 EAT, corrected by the server time when known): it rises on the left, is overhead at noon/midnight and sets on the right. It's placed in screen space so it's always in view, and rests low and rust-coloured when it's below the horizon. **Trees** (broadleaf, umbrella acacia, cypress and banana) are cut from the same sheet as their hill: small on the middle hills, a belt on the near hill and two big ones framing the front. Motifs per page: `design`, `construction`, `precast`, `workshop`, `plots` (template homes on pegged plots), `estate`, `forest` (staked saplings in front of grown trees), `academy`, `market`; others use the `city` skyline. With no saved choice, **the edition itself follows Kampala's clock** (day 06:45–18:55) and switches at dusk and dawn.

### Home 3D scene and speed
`HotelScene` paints the paper landscape first, waits for the browser to be idle, then loads the day or night three.js script. The scripts render only while a see-through `.home-window` section is on screen, refresh shadows every third frame, cap the pixel ratio (1.25 phones, 1.5 desktop), turn off antialiasing on phones, use 1024/2048 shadow maps, and drop the pixel ratio further (down to 0.75) if frames keep running slow.

### Caching
`public/sw.js` (production only): pages network-first with an offline copy; `/assets/` cache-first; fonts, textures, logos and images stale-while-revalidate (images capped at 160). Firebase Hosting: `/assets`, fonts and textures cached for a year (textures are versioned with `?v=`), logos 30 days, images 30 days + stale-while-revalidate, `index.html` and `sw.js` no-cache. Content and page switches are cached in localStorage.

### Paper and textures
`public/textures/*.webp` are generated by `scripts/make-textures.py`: 768 px seamless tiles with pulp clouds, a coarse cold-press tooth lit from the top left, long fibres, short hairs, flecks and bark inclusions; shown at 384 px (`--tex-size`) so the grain stays sharp. The tint overlays in `tokens.css` were thinned so the texture shows. Each sheet's torn top edge (`TornEdge`) is now cut from the same textured paper (`--edge-tex`, clipped to the tear in pixels) with a pale fibre line and loose hairs along the tear.

### Plant-a-tree button
`DonateFab` is a 50 px round orange button in the bottom-right corner with a leaf; "Plant a tree" shows as a tooltip on hover or focus (and stays the button's accessible name).

## Phase 0 checklist

Status: `To do` · `In progress` · `Done (date, commit)`. Task ids match the plan.

| # | Problem | Fix | Task | Status |
| --- | --- | --- | --- | --- |
| 2026-10-24 | local check | Round 3 checks of `f651610`: lint, build, all routes, forms, admin (claim via `scripts/set-admin.js`, page switches, product import/edit/upload), service worker and offline. No code changes; findings in `docs/handoff.md`. | docs |
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

- Firebase project id is `fromcraft-2026` (misspelled). Decide before real data goes in; ids can't be renamed (open question in the plan).
- The Firebase web API key is in the repo history. It isn't a secret, but restrict it to the site's domains in Google Cloud console.
- No tests. Rules tests arrive in Phase 3.
- The latest commits (all pages, admin, textures, sky, service worker) were compiled with esbuild and checked in a headless browser only; run `npm run lint` and `npm run build` locally, and try Admin with a real admin account against the emulators.
- `useContent` replaces the starter list as soon as a collection has **any** Firestore document, so importing or adding one item hides the rest of the starter list (the Admin page says so).
- The service worker only registers in production builds. After a deploy, returning visitors get the new site on the next navigation (pages are network-first); bump `VERSION` in `public/sw.js` when its caching rules change.
- The Home 3D scene doesn't follow the Kampala sky clock yet (its day and night scripts keep their own lighting); the paper scenes do.
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
