# Current code: what exists today and how to build on it

> Written 2026-10-09 from a full read of `formcraftwebsite2026/website/`.
> Purpose: brief Claude Code (or any developer) on the existing React code so the
> build plan can be rewritten around it instead of replacing it.

---

## Prompt for Claude Code

**Status: done 2026-10-09.** `build-plan.md` and `CLAUDE.md` were updated from this
prompt; Phase 0 in the plan is the summary of "Problems to fix" below. Kept for the record.

> We are keeping the existing React + Vite code in this folder as the base of the
> Formcraft website. Read `docs/current-code.md` (this file) and `docs/build-plan.md`.
>
> 1. **Update `docs/build-plan.md`** so it matches a React app instead of a plain-JS
>    multi-page site. Keep everything that is framework-independent: the brand
>    system, site map, Firebase services, Flutterwave payment flow, Firestore data
>    model, security rules, open questions and the five phases. Change the parts
>    that assume vanilla JS: the stack line, the folder structure, `vite.config.js`
>    (single entry + React plugin, not one input per page), the `firebase.js`
>    example (move to `src/config/firebase.js`), "pages work without JavaScript"
>    (replace with a realistic React equivalent; see "Rendering" below), and the
>    Hosting setup (single-page app rewrite **yes**).
> 2. **Update `CLAUDE.md`** to match: React 19 + React Router + Vite, JSX, no
>    TypeScript unless asked; where components, pages, styles and data live; and
>    keep every rule in "Rules that must never be broken" unchanged.
> 3. **Add a "Phase 0: bring the existing code in line" section** to the plan, built
>    from the "Problems" list below, and put it before Phase 1.
> 4. Do not rewrite working components from scratch. Reuse and restyle them;
>    rename or move files only when the plan's structure needs it, and say so.
> 5. Show me the plan diff before changing any code.

---

## What the code is

A **single-page React app** created from the Vite React template.

| | |
| --- | --- |
| Framework | React 19 (`react`, `react-dom` ^19.2), StrictMode |
| Routing | `react-router-dom` ^6.30, `BrowserRouter` (client-side URLs like `/shop`) |
| Build | Vite ^8.2 with `@vitejs/plugin-react` |
| Lint | oxlint (`npm run lint`), React hooks rules |
| Firebase | `firebase` ^11; **only Auth and Analytics are used** |
| Language | JavaScript + JSX, no TypeScript |
| Tests | None |
| Firebase project files | None yet (no `firebase.json`, `.firebaserc`, rules or `functions/`) |

Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

### File map

```
website/
├─ index.html                 # <div id="root">, loads src/main.jsx; title "formcraft"
├─ vite.config.js             # react() plugin only
├─ public/favicon.svg, icons.svg   # Vite template icons, not Formcraft logos
└─ src/
   ├─ main.jsx                # mounts <App/> in StrictMode
   ├─ App.jsx                 # auth state, router, header, sign-in popup
   ├─ App.css                 # Vite template leftovers; NOT imported anywhere
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
   └─ assets/hero.png, react.svg, vite.svg   # template images, unused
```

About 2,000 lines of CSS, one plain `.css` file per component (no CSS modules,
no Tailwind).

### How it behaves

**App shell (`App.jsx`).** Subscribes to `onAuthStateChanged`. Renders nothing
until Firebase reports the auth state. Then renders `<Header>`, the route, and,
if the visitor is **not** signed in, opens the sign-in overlay after 2 seconds.
The `user` object is passed as a prop to every page.

**Sign-in (`auth.jsx`).** A full-screen overlay: "Welcome to FormCraft, please
sign in to continue", one "Sign in with Google" button (`signInWithPopup`).
There is no close button, so a signed-out visitor cannot use the site after
2 seconds without a Google account. Errors only go to the console.

**Header (`Header.jsx`).** Text logo "📝 FormCraft". Nav links: Home, Services,
Portfolio, Shop, Blog, About Us; the link for the current page is **removed**
from the menu. Links are `<a>` tags with `onClick` and no `href`. When signed in,
a 👤 button opens a dropdown: email, "Settings" (does nothing), "Logout"
(`signOut`, back to `/`). No mobile menu; the nav just shrinks.

**Home (`/`).** "Welcome to FormCraft", "Logged in as: email" or "Welcome
Visitor", and three cards (Create Form, View Forms, Analytics) with buttons that
do nothing. Styled with inline styles and Google blue `#4285F4`.

**Services, About, Portfolio.** Static text written for a **form-builder
software product** (form design, data collection, analytics, integrations,
"enterprise-grade security", pricing plans). Portfolio is six emoji placeholder
cards ("Project 1" to "Project 6"). None of it describes Formcraft Design and
Construction.

**Blog (`/blog`).** A featured post and three post cards, hard-coded in the
component, Unsplash images. Copy is about "design subscriptions". Posts don't
open.

**Shop (`/shop`).** The most developed page, and the closest to the plan's
Stores page. Warm terracotta theme defined in `Shop.css` `:root`
(`--color-primary: #c47a4a`, Inter font). Sections, top to bottom:
- **Hero:** "Handmade pieces. A community that makes them." Two buttons scroll
  to products and to the community section.
- **FeaturedProducts:** shows 8 random products from `data/products.jsx` and
  **reshuffles every 14 seconds**. Hovering shows name and price; clicking opens
  a modal with image, price, description, colour and size options, quantity and
  "Add to Cart — $xx.xx".
- **FeaturedCollections:** three collection cards ("Earth & Clay, By Amina"…),
  "Explore →" does nothing.
- **Companies:** "Trusted by makers, studios & brands" logo strip using
  `via.placeholder.com` images (Design Milk, Kinfolk…).
- **CommunitySection:** text + three buttons (Join, Read Our Story,
  Donate / Support) that do nothing.
- **Testimonials:** three quotes with `pravatar.cc` avatars.
- **Cart:** floating 🛒 button with item count; draggable with the mouse; opens
  a panel with items, +/−, remove, subtotal in **dollars**, and a Checkout button
  that does nothing. Cart state lives in `CraftPage` memory only.

**Data.** Everything comes from `src/components/data/products.jsx`: 9 products
(ids 4–9 are the same "Linen Tea Towel Set" copied), 3 collections, 4 companies,
3 testimonials. Prices are dollars. Nothing reads or writes Firestore.

---

## What to keep

- **React + React Router + Vite** as the stack, and the one-folder-per-page
  layout (`pages/X.jsx` + `X.css`).
- **Firebase Auth wiring** in `App.jsx` (`onAuthStateChanged` → `user`), the
  Header's account dropdown and logout. Extend it to Email/Password as the plan
  says; move `user` into a React context instead of passing it to every page.
- **The Shop page structure**: Hero → products → collections → community →
  testimonials, plus the product modal (options + quantity) and the cart panel
  layout. This becomes the Stores page.
- **Cart logic** in `CraftPage` (merge same product + options, +/−, remove).
  Move it into a cart context so it survives navigation, persist it as the plan
  says (localStorage for guests, `users/{uid}/cart` when signed in).
- **The product data shape** (name, price, images, description, colors, sizes),
  mapped onto the plan's `products` collection (`title`, `priceUGX`, `images[]`,
  `division`, `category`, `stock`, `isDigital`, plus `colors[]`, `sizes[]`).
- **Blog page layout** (featured post + grid). The plan has no blog; decide
  whether to keep it (e.g. for project stories and community news) or drop it.

## Problems to fix (becomes Phase 0)

**Content and brand**
1. Home, Services, About and Portfolio describe a form-builder SaaS, not
   Formcraft Design and Construction. Rewrite from the Company Profile; use
   `TODO:` placeholders where facts are missing.
2. Shop colours (terracotta, Inter) and Home's `#4285F4` don't follow the Brand
   Guide. Create `src/styles/tokens.css` with the `--fc-*` tokens and fonts
   (Satoshi, Clash Grotesk) from the plan, import it once in `main.jsx`, and
   replace hard-coded hex values and inline styles.
3. Logo is an emoji and favicon is the Vite logo. Use the SVGs from
   `public/logos/` (to be added).
4. Testimonials, "Trusted by" company logos, collection makers ("By Amina") and
   blog posts are invented. CLAUDE.md forbids fake testimonials and clients:
   replace with real ones or `TODO:` placeholders.
5. Prices are in dollars. Switch to whole UGX integers, formatted as
   `UGX 120,000`.

**Behaviour**
6. The sign-in overlay blocks the whole site for signed-out visitors after 2 s
   and can't be closed. The plan only needs sign-in for account, community,
   checkout and admin. Remove the auto-popup; show sign-in on demand.
7. The cart is lost when you leave `/shop`, Checkout does nothing, and dragging
   works only with a mouse (not touch). Make the cart a fixed button that
   doesn't collide with the plant-a-tree button, keep state in context, wire
   Checkout to `createCheckout` later (Phase 3).
8. Products reshuffle every 14 s, which moves things under the user's cursor.
   Show a stable order.
9. Many buttons do nothing (Home cards, Explore, Join, Donate, Settings,
   Read Our Story). Link them to real routes or remove them.
10. The app renders a blank screen until Firebase auth answers. Render the page
    immediately and only gate the parts that need the user.

**Structure and quality**
11. Routes don't match the plan's site map. Add: Studio, Construction, Concrete,
    Stores (current Shop), Projects (current Portfolio), Community, Academy,
    Invest, Donate, Contact, Account, Admin, and a 404 page. `Construction.jsx`
    is currently an "under construction" placeholder and isn't routed; rename it
    (e.g. `ComingSoon.jsx`) so the name is free for the real Construction page.
12. `Footer.jsx` is empty. Build the footer (About, Contact, socials, tagline).
13. Header links have no `href`, so they can't be focused with the keyboard,
    opened in a new tab, or read by search engines. Use React Router `<Link>` /
    `<NavLink>` and keep the current page in the menu (mark it active). Add a
    mobile menu. Group the menu into the plan's four doors (Hire us, Shop, Join,
    Back us).
14. Clickable `<div>`s and `<article>`s (logo, product cards, dropdown items)
    aren't keyboard-accessible. Use `<button>`/`<Link>`; add labels to icon-only
    buttons (🛒, 👤, ×). Product modal needs focus trapping and Escape to close.
15. Delete Vite template leftovers: `App.css`, `assets/react.svg`,
    `assets/vite.svg`, `assets/hero.png` (if unused), `public/icons.svg`,
    template `README.md`. `index.html` title should be "Formcraft".
16. `Shop.css` defines `:root` variables and global `.container`, `.section`,
    `.btn` classes; `.btn` lives in `FeaturedProducts.css`. These leak into every
    page once loaded. Move shared styles into `src/styles/` (tokens, base,
    components) and keep component CSS scoped by class prefix.
17. `config/firebase.jsx` holds the config inline and calls Analytics at load.
    Rename to `firebase.js` (no JSX in it), read config from `VITE_FIREBASE_*`
    env vars, export `db`, `storage`, `functions`, connect to emulators in dev,
    and load Analytics only in production. The Firebase project id is
    `fromcraft-2026` (note the spelling); confirm it's the one to keep.
18. Firebase JS SDK is ^11; update to the current major when touching it.
19. External images (Unsplash, via.placeholder.com, pravatar.cc) are
    placeholders, and via.placeholder.com is no longer reliable. Replace with
    Formcraft photos in Storage or `public/images/`, WebP, `loading="lazy"`.
20. No `firebase.json`, rules, functions, `.env.example`, or GitHub Actions yet.
    Set them up as in the plan's setup steps, with Hosting rewriting all paths to
    `/index.html` (required for `BrowserRouter`).

**Rendering.** The plan wanted pages readable without JavaScript. With a client
React app that isn't true by default. Pick one and record it in the plan:
(a) accept client rendering, but set per-route `<title>`/meta and keep bundles
small with `React.lazy` per route; or (b) pre-render static routes at build time
(e.g. `vite-react-ssg` or React Router's prerender). (a) is enough for Phase 1;
revisit (b) in Phase 5 for SEO.

## Suggested target structure (React)

```
website/
├─ CLAUDE.md
├─ docs/  build-plan.md  current-code.md
├─ index.html
├─ vite.config.js
├─ firebase.json  .firebaserc  firestore.rules  storage.rules  firestore.indexes.json
├─ .env.example
├─ functions/  src/index.js  package.json
├─ public/  fonts/  logos/  images/  favicon.svg
└─ src/
   ├─ main.jsx  App.jsx  routes.jsx
   ├─ config/firebase.js
   ├─ context/  AuthContext.jsx  CartContext.jsx
   ├─ styles/  tokens.css  base.css  components.css
   ├─ components/
   │  ├─ layout/  Header.jsx  Footer.jsx  DonateFab.jsx
   │  ├─ shop/    (current craft/ components, renamed)
   │  └─ ui/      Button.jsx  Modal.jsx  …
   ├─ pages/  Home  About  Studio  Construction  Concrete  Stores  ProductPage
   │          Projects  Community  Academy  Invest  Donate  Contact  Account
   │          Admin  NotFound
   └─ lib/  money.js (UGX formatting)  forms.js  checkout.js
```
