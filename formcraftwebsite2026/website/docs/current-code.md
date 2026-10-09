# Current code: how the Formcraft website works

> **Living document.** It explains the code in `formcraftwebsite2026/website/` as it is
> *right now*, so anyone (Claude Code, a developer, the founders) can understand it
> without reading every file. `CLAUDE.md` loads it into every Claude Code session.
>
> - `docs/build-plan.md` says what we are building. This file says what exists.
> - Claude Code updates this file **in the same commit** as any code change (see
>   "How to keep this file up to date").
>
> Baseline written: 2026-10-09 from a full read of the code · Last updated: 2026-10-09
> · Phase: **0, in progress** (1 of 10 tasks done)

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
| Framework | React 19 (`react`, `react-dom` ^19.2), StrictMode | same |
| Routing | `react-router-dom` ^6.30, `BrowserRouter`, routes written in `App.jsx` | same version; routes in `src/routes.jsx`, lazy-loaded |
| Build | Vite ^8.2 with `@vitejs/plugin-react` | same |
| Lint | oxlint (`npm run lint`), React hooks rules | same |
| Firebase SDK | `firebase` ^11; **only Auth and Analytics used** | current major; Auth, Firestore, Storage, Functions |
| Firebase project files | none (no `firebase.json`, `.firebaserc`, rules, `functions/`) | all present (P0.2, Phase 2–3) |
| Firebase project | `fromcraft-2026` (spelling: "fromcraft"), config hard-coded | from `VITE_FIREBASE_*` env vars |
| Language | JavaScript + JSX, no TypeScript | same |
| Styling | ~2,000 lines of plain CSS, one file per component; global rules leak from `Shop.css` | tokens + shared styles in `src/styles/`, component CSS scoped by class prefix |
| State | `user` passed as a prop; cart state inside `CraftPage` | `AuthContext`, `CartContext` |
| Data | hard-coded in `src/components/data/products.jsx`, prices in dollars | `src/data/products.js` (UGX) in Phase 0, Firestore `products` in Phase 3 |
| Tests | none | rules tests from Phase 3 |

Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

---

## File map (today)

```
website/
├─ index.html                 # <div id="root">, loads src/main.jsx; title "Formcraft"
├─ vite.config.js             # react() plugin only
├─ .oxlintrc.json
├─ public/favicon.svg         # still the Vite logo; replaced in P0.6
└─ src/
   ├─ main.jsx                # mounts <App/> in StrictMode
   ├─ App.jsx                 # auth state, router, header, sign-in popup
   ├─ config/firebase.jsx     # initializeApp + exports auth; starts Analytics
   ├─ components/
   │  ├─ Header.jsx/.css      # logo + nav + account dropdown
   │  ├─ Footer.jsx           # EMPTY file
   │  ├─ auth.jsx/.css        # full-screen "Sign in with Google" overlay
   │  ├─ data/products.jsx    # hard-coded products, collections, companies, testimonials
   │  └─ craft/               # the shop page's sections
   │     ├─ Hero.jsx/.css
   │     ├─ FeaturedProducts.jsx/.css   # product grid + product modal
   │     ├─ FeaturedCollections.jsx/.css
   │     ├─ Companies.jsx/.css
   │     ├─ CommunitySection.jsx/.css
   │     ├─ Testimonials.jsx/.css
   │     └─ Cart.jsx/.css               # floating draggable cart
   ├─ pages/
   │  ├─ Home.jsx/.css        # "/"
   │  ├─ Services.jsx/.css    # "/services"
   │  ├─ Portfolio.jsx/.css   # "/portfolio"
   │  ├─ Shop.jsx/.css        # "/shop" (component is named CraftPage)
   │  ├─ Blog.jsx/.css        # "/blog"
   │  ├─ AboutUs.jsx/.css     # "/about"
   │  └─ Construction.jsx/.css  # "under construction" placeholder, not routed
```

### Planned moves (Phase 0)

| From | To | Task |
| --- | --- | --- |
| ~~`src/App.css`, `src/assets/*` (react.svg, vite.svg, hero.png), `public/icons.svg`, template `README.md`~~ | deleted (none were referenced) | P0.1 ✓ |
| `src/config/firebase.jsx` | `src/config/firebase.js` | P0.2 |
| global rules in `Shop.css`, `FeaturedProducts.css` | `src/styles/base.css`, `components.css` | P0.3 |
| `src/components/auth.jsx/.css` | `src/components/auth/SignInDialog.jsx/.css` | P0.4 |
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

### Start-up and app shell (`main.jsx`, `App.jsx`)

`main.jsx` mounts `<App/>` inside `StrictMode`. `App.jsx` subscribes to Firebase's `onAuthStateChanged` and keeps the result in a `user` state. It **renders nothing** until Firebase reports the auth state, so the first paint waits on a network call. Then it renders `<Header>`, the matching route, and, if the visitor is **not** signed in, opens the sign-in overlay after 2 seconds. The `user` object is passed as a prop to every page. Routes are written inline in `App.jsx`: `/`, `/services`, `/portfolio`, `/shop`, `/blog`, `/about`. There is no 404 route.

### Firebase (`config/firebase.jsx`)

Calls `initializeApp` with the config for project `fromcraft-2026` written directly in the file, exports `auth`, and starts Analytics as soon as the module loads (also in development). No Firestore, Storage or Functions. The file has a `.jsx` extension but contains no JSX. The web config is not a secret, but it should come from env vars so dev/prod projects can differ.

### Sign-in (`components/auth.jsx`)

A full-screen overlay: "Welcome to FormCraft, please sign in to continue" and one "Sign in with Google" button using `signInWithPopup`. There is **no close button**, so a signed-out visitor can't use the site after 2 seconds without a Google account. Errors go to the console only; the visitor sees nothing.

### Header (`components/Header.jsx`)

Text logo "📝 FormCraft". Nav links: Home, Services, Portfolio, Shop, Blog, About Us. The link for the current page is **removed** from the menu. Links are `<a>` tags with `onClick` and no `href`, so they can't be focused with the keyboard, opened in a new tab, or followed by search engines. When signed in, a 👤 button opens a dropdown with the email, "Settings" (does nothing) and "Logout" (`signOut`, then navigate to `/`). No mobile menu; the nav just shrinks.

### Footer (`components/Footer.jsx`)

Empty file. Nothing renders below the pages.

### Pages

- **Home (`/`).** "Welcome to FormCraft", "Logged in as: email" or "Welcome Visitor", and three cards (Create Form, View Forms, Analytics) whose buttons do nothing. Inline styles, Google blue `#4285F4`.
- **Services (`/services`), About (`/about`), Portfolio (`/portfolio`).** Static text written for a **form-builder software product** (form design, data collection, analytics, integrations, "enterprise-grade security", pricing plans). Portfolio shows six emoji placeholder cards ("Project 1" to "Project 6"). None of it describes Formcraft Design and Construction.
- **Blog (`/blog`).** A featured post and three post cards, hard-coded in the component, Unsplash images, copy about "design subscriptions". Posts don't open. The layout (featured + grid) is reusable for a Journal.
- **Construction (not routed).** An "under construction" placeholder. Its name clashes with the planned Construction division page.

### Shop (`/shop`, `pages/Shop.jsx`, component `CraftPage`)

The most developed page and the base for Stores. `Shop.css` defines its own `:root` theme (`--color-primary: #c47a4a` terracotta, Inter font) plus global `.container`, `.section` and `.btn` classes, which leak into every page once the shop has loaded. Sections, top to bottom:

- **Hero:** "Handmade pieces. A community that makes them." Two buttons scroll to products and to the community section.
- **FeaturedProducts:** shows 8 random products from `data/products.jsx` and **reshuffles every 14 seconds**, moving cards under the visitor's cursor. Hovering shows name and price; clicking a card (a `<div>`) opens a modal with image, price, description, colour and size options, quantity and "Add to Cart — $xx.xx". The modal doesn't trap focus or close on Escape.
- **FeaturedCollections:** three collection cards ("Earth & Clay, By Amina"…); "Explore →" does nothing.
- **Companies:** "Trusted by makers, studios & brands" with `via.placeholder.com` logos (Design Milk, Kinfolk…). Invented.
- **CommunitySection:** text and three buttons (Join, Read Our Story, Donate / Support) that do nothing.
- **Testimonials:** three quotes with `pravatar.cc` avatars. Invented.
- **Cart:** a floating 🛒 button with item count, draggable with the mouse only (not touch). Opens a panel with items, +/−, remove, subtotal in **dollars**, and a Checkout button that does nothing. Cart state lives in `CraftPage` memory, so it's lost when the visitor leaves `/shop`. Adding the same product with the same colour and size increases the quantity instead of adding a new line; this merge logic is worth keeping.

### Data (`components/data/products.jsx`)

Exports 9 products (ids 4–9 are copies of the same "Linen Tea Towel Set"), 3 collections, 4 companies and 3 testimonials. Product shape: `id`, `name`, `price` (dollars), `images`, `description`, `colors`, `sizes`. Nothing reads or writes Firestore. Mapping to the plan's `products` fields: `name` → `title`, `price` → `priceUGX` (needs real UGX prices), plus new `slug`, `division`, `category`, `stock`, `isDigital`, `active`.

### Styles

One plain `.css` file per component, no CSS modules or Tailwind. No shared token file. Colours are hard-coded per file (terracotta in the shop, Google blue on Home). `.btn` is defined in `FeaturedProducts.css`. No Formcraft fonts are loaded.

---

## What to keep

- **React + React Router + Vite** and the one-file-per-page layout (`pages/X.jsx` + `X.css`).
- **Firebase Auth wiring** (`onAuthStateChanged` → user), the Header account dropdown and logout. Move the user into `AuthContext`; add Email/Password in Phase 4.
- **Shop page structure:** Hero → products → collections → community, plus the product modal (options + quantity) and the cart panel layout. This becomes Stores.
- **Cart merge logic** (same product + options → more quantity, +/−, remove), moved into `CartContext`.
- **Product data shape** (name, price, images, description, colours, sizes), reshaped to the plan's fields.
- **Blog layout** (featured post + grid), if the Journal is kept.

---

## Phase 0 checklist

Status: `To do` · `In progress` · `Done (date, commit)`. Task ids match the plan.

| # | Problem | Fix | Task | Status |
| --- | --- | --- | --- | --- |
| 1 | Home, Services, About, Portfolio describe a form-builder SaaS | Rewrite from the Company Profile; `TODO:` where facts are missing (full rewrite in Phase 1) | P0.9 | To do |
| 2 | Terracotta + Inter (shop) and `#4285F4` (Home) break the Brand Guide | `tokens.css` + fonts; replace hard-coded colours and inline styles | P0.3 | To do |
| 3 | Emoji logo, Vite favicon | Formcraft SVG logo and FC mark from `public/logos/` | P0.6 | To do |
| 4 | Invented testimonials, "Trusted by" logos, collection makers, blog posts | Remove; `TODO:` placeholders | P0.9 | To do |
| 5 | Prices in dollars | Whole UGX integers, `formatUGX` → "UGX 120,000" | P0.7 | To do |
| 6 | Forced sign-in overlay after 2 s, can't be closed | Remove auto-popup; sign-in on demand, closable | P0.4 | To do |
| 7 | Cart lost on navigation; Checkout dead; mouse-only drag | `CartContext` + localStorage; fixed touch-friendly button; Checkout "Coming soon" until Phase 3 | P0.8 | To do |
| 8 | Products reshuffle every 14 s | Stable order | P0.7 | To do |
| 9 | Buttons that do nothing (Home cards, Explore, Join, Donate, Settings, Read Our Story) | Real routes or remove | P0.9 | To do |
| 10 | Blank screen until auth answers | Render immediately; gate only what needs the user | P0.4 | To do |
| 11 | Routes don't match the site map; no 404; `Construction.jsx` name clash | `routes.jsx`, redirects, `NotFound`, `ComingSoon.jsx` | P0.5 | To do |
| 12 | `Footer.jsx` empty | Build footer | P0.6 | To do |
| 13 | Header links have no `href`; current page removed; no mobile menu | `<NavLink>`, active state, four doors, mobile menu | P0.6 | To do |
| 14 | Clickable `<div>`/`<article>`, unlabeled icon buttons, modal without focus trap/Escape | `<button>`/`<Link>`, `aria-label`, focus trap + Escape | P0.10 | To do |
| 15 | Vite template leftovers; title "formcraft" | Delete; title "Formcraft" | P0.1 | Done (2026-10-09) |
| 16 | `Shop.css` `:root`, global `.container`/`.section`/`.btn` leak | Move to `src/styles/`; prefix component classes | P0.3 | To do |
| 17 | Firebase config inline, Analytics at load, `.jsx` extension | `firebase.js`, env vars, emulators in dev, Analytics in prod only | P0.2 | To do |
| 18 | Firebase SDK ^11 | Update to current major | P0.2 | To do |
| 19 | External placeholder images (Unsplash, via.placeholder.com, pravatar.cc) | Formcraft photos or `TODO:`; WebP, `loading="lazy"` | P0.9 | To do |
| 20 | No `firebase.json`, rules, functions, `.env.example`, CI | Set up per plan (SPA rewrite) | P0.2 | To do |

| Task | Status |
| --- | --- |
| P0.1 Clean out | Done (2026-10-09) |
| P0.2 Firebase config | To do |
| P0.3 Brand base | To do |
| P0.4 Auth | To do |
| P0.5 Layout and routing | To do |
| P0.6 Header and footer | To do |
| P0.7 Shop → Stores | To do |
| P0.8 Cart | To do |
| P0.9 Honest content | To do |
| P0.10 Accessibility | To do |

---

## Known issues and notes

- Firebase project id is `fromcraft-2026` (misspelled). Decide before real data goes in; ids can't be renamed (open question in the plan).
- The Firebase web API key is in the repo history. It isn't a secret, but restrict it to the site's domains in Google Cloud console.
- No tests. Rules tests arrive in Phase 3.
- Logos and fonts aren't in `public/` yet; P0.3 and P0.6 need the files copied in from the brand assets.

---

## Change log

Newest first. One row per commit or task.

| Date | Task | What changed | Files |
| --- | --- | --- | --- |
| 2026-10-09 | P0.1 | Deleted unused Vite template files (`App.css`, `assets/react.svg`, `assets/vite.svg`, `assets/hero.png`, `public/icons.svg`, template `README.md`). Page title is now "Formcraft". | `index.html`, deleted files |
| 2026-10-09 | — | Decided to build on the existing React code. Baseline of this file written from a full read of the code. `build-plan.md` and `CLAUDE.md` moved from plain JS to React; Phase 0 added. No code changed yet. | `docs/build-plan.md`, `docs/current-code.md`, `CLAUDE.md` |
