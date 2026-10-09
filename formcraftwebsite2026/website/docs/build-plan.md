# Formcraft Website Build Plan

> Source of truth for the Formcraft website. Edit this file when the plan changes;
> `CLAUDE.md` loads it into every Claude Code session.
> Last updated: 2026-10-09

Build formcraft as a fast React single-page app (Vite) on Firebase (Hosting, Auth, Firestore, Storage, Cloud Functions) with a pitch-style home page, four division pages, a shop, a members' community, an investors page and a floating plant-a-tree donate button.

We build on the existing React code in this folder rather than starting again. `docs/current-code.md` describes that code; Phase 0 below brings it in line with this plan.

## Assumptions

- **Front end:** React 19 + React Router 6 + Vite, single-page app, JavaScript/JSX (no TypeScript). Plain CSS files per component plus shared tokens.
- **Rendering:** client-side for now. Each route sets its own title and meta and is lazy-loaded so the first download stays small. Revisit pre-rendering in Phase 5 if SEO needs it.
- **Back end:** Firebase: Hosting, Authentication, Firestore, Storage, Cloud Functions. Functions need the pay-as-you-go **Blaze** plan.
- **Market:** Uganda first, prices in UGX, mobile money as the main way to pay.
- **Content source:** the Formcraft Company Profile and Brand Guide v01.

## Brand system for the web

All values live in `src/styles/tokens.css`. Values come from the Brand Guide (pages 27–35).

| Token | Name in guide | Hex | Use on the site |
| --- | --- | --- | --- |
| `--fc-navy` | Formcraft Dark Navy | #1C252D | Header, footer, dark sections, body text on light |
| `--fc-orange` | Formcraft Orange | #FFAE61 | Primary buttons, links, donate button |
| `--fc-rust` | (listed as "Formcraft White") | #D15334 | Hover states, sale tags, highlights |
| `--fc-white` | Formcraft White | #F1F1F1 | Page background (never pure #FFF) |
| `--fc-black` | Midnight Black | #171D1A | Deepest backgrounds, footer |
| `--fc-studio` | Formcraft Green | #7FC7BE | Studio (design / BIM) pages |
| `--fc-stores` | Formcraft Blue | #7FC7BE (needs its own value, see open questions) | Stores (shop) pages |
| `--fc-construction` | Formcraft Brown | #A85522 | Construction pages |
| `--fc-concrete` | Formcraft Gray | #94989B | Concrete pages |

**Type.** Satoshi for body text and UI (Light, Regular, Bold, Black); Clash Grotesk for display headlines. Both are free from Fontshare. Self-host the `.woff2` files in `public/fonts/`.

**Rules:** each division page keeps the parent navy/orange and adds only its own accent colour; tints in 20% steps for hovers; any tint under 60% used as a background takes dark text; the tagline "Designing spaces. Empowering communities." is never reworded.

**Voice.** Quietly confident, plain, no selling. Professional pages lead with process and numbers; shop pages speak plainly and warmly; community pages are invitational ("Formcraft sets the market for the work — you focus on the craft").

**Logos.** SVGs in `public/logos/`: the main Formcraft lockup in the header, the FC logo mark as favicon and app icon, each sub-brand lockup at the top of its division page.

## Site map

```
Home (the pitch)
├─ Hire us   (clients, developers)    → Studio · BIM, Construction, Concrete, Projects
├─ Shop      (buyers 25+)             → Stores, Product pages, Cart & checkout, My account
├─ Join      (artisans, students)     → Community, Directory, Jobs board, Academy
└─ Back us   (investors, donors)      → Invest, Investor pack, Plant a tree, Donor wall

On every page: header, footer, About, Contact, floating Plant-a-tree button
```

The home page ends with the four doors as buttons, and the header menu mirrors the same four groups.

## Architecture

```
Visitor's browser (React app built by Vite, Firebase JS SDK)
   │
   ├──► Firebase Hosting        serves the built site over a CDN
   ├──► Firebase Auth           email + Google sign-in; admin custom claim
   ├──► Firestore               products, orders, members, forms
   ├──► Storage                 images, plan PDFs, uploads
   └──► Cloud Functions         createCheckout, flutterwaveWebhook
              │  ▲
     pay link ▼  │ webhook
           Flutterwave          MTN / Airtel mobile money, cards, UGX

GitHub (formcraft-web-27) ── push to main ──► GitHub Actions ──► firebase deploy
```

The browser talks to Firebase directly for everything public. Anything involving money, prices or roles goes through Cloud Functions, which hold the Flutterwave keys and are the only code allowed to write orders and donations.

## Page-by-page breakdown

Routes are lower-case paths (`/studio`, `/stores`, `/stores/:slug`, `/projects`, `/community`, `/account`, …). "Builds on" names the existing component to reuse.

| Page | Who it's for | What's on it | Firebase pieces |
| --- | --- | --- | --- |
| **Home (the pitch)** · builds on `Home.jsx` (content replaced) | Everyone | Hero with tagline + short film/stills · "The problem" (designers and artisans working apart, *okwekoza*) · "One value chain" strip linking the four divisions · flagship projects (Karwani Complex, Lydia Residential, Lucy's Kitchen, Ggaba Apartments) · impact counters (artisans, trees planted, projects) · roadmap 2023 → 2028 · doors: Hire us / Shop / Join / Back us | Firestore `stats` doc for live counters |
| **About** · builds on `AboutUs.jsx` | Clients, investors, press | Founding story, Emlyn Atochon and Peter Isingoma, five core values, management philosophy | Static |
| **Studio** (design / BIM) | Developers, engineers, homeowners | Pre-construction package, BIM/CAD sub-contracting, template home designs (50×100 ft plots), BIM process diagram, "Request a quote" form | `quotes`, Storage for drawing uploads |
| **Construction** | Developers, homeowners | Build services, site process, safety, project gallery | `projects` |
| **Concrete** | Contractors, civil engineers | Precast columns, beams, lintels, pavers, facade panels, green concrete · B2B supply enquiry with quantities | `quotes` (type: b2b) |
| **Stores** (shop) · builds on `Shop.jsx` + `components/craft/*` | Consumers 25+, walk-in clients | Furniture collections, joinery, merch (tote, bottles, helmets, vests), template house plans as digital downloads. Keep the existing hero → products → collections → community layout, product modal and cart panel; add a product page at `/stores/:slug` | `products`, `orders`, Storage |
| **Projects** · builds on `Portfolio.jsx` | Everyone | Filterable portfolio by division, with case studies | `projects` |
| **Community** | Artisans, creatives, students | Member sign-up, artisan directory, jobs/commissions board, events and workshops, training programmes | Auth, `members`, `jobs`, `events` |
| **Academy** | Students | BIM/CAD courses, workshop sessions, internships; paid or free enrolment | `courses`, `enrolments` |
| **Invest** | Investors, member-investors | Vision, market, roadmap, 2028 targets ($1M revenue, 20% reinvested in artisans), property schemes, "Request the investor pack" (gated PDF) | `investorLeads`, private Storage |
| **Donate / Plant a tree** | Everyone | Floating button on every page → pick trees, live tree counter, donor wall | `donations`, `stats` |
| **Contact** | Everyone | Form, WhatsApp link, map of Kampala office, socials (@formcraft.ug, @formcraft_ug, LinkedIn formcraftinc) | `messages` |
| **Account** | Signed-in users | Orders, downloads, enrolments, member profile, donations | Auth + per-user queries |
| **Admin** | Formcraft team | Add/edit products, projects, events; see orders, quotes, donations, leads | Custom claim `admin: true` |
| **Journal** (optional) · builds on `Blog.jsx` | Everyone | Project stories, community news, workshop write-ups. Keep only if the team will post regularly (open question) | `posts` (admin writes) |
| **404** | Everyone | Plain "page not found" with links to the four doors | Static |

Keep the site fast on mobile data: lazy-load each route, load Firebase services only where a page needs them, render page text immediately (don't wait for auth before showing anything), and show skeletons rather than blank screens while Firestore data loads.

## Shop, payments and the plant-a-tree button

Use **Flutterwave** as the main gateway: MTN and Airtel mobile money in UGX plus cards, confirmed by webhook ([docs](https://developer.flutterwave.com/docs/uganda)). **Pesapal** is the local alternative ([API 3.0](https://www.pesapal.com/blog/pesapal-upgrades-to-a-new-api-pesapal-30)). Don't use Stripe: it doesn't onboard Uganda-registered businesses.

**Payment flow (same for orders, courses and donations):**

1. Browser sends the cart (product ids + quantities only) to the Cloud Function `createCheckout`.
2. The function reads real prices from Firestore, writes an `orders` doc with `status: "pending"`, and asks Flutterwave for a payment link. Never trust prices from the browser.
3. Customer pays on the Flutterwave page (mobile money prompt or card).
4. Flutterwave calls `flutterwaveWebhook`. It checks the secret hash, re-verifies the transaction by id, then sets the order to `paid`, or for a donation adds the trees to `stats/public`.
5. Customer lands on `/account` (orders) or `/donate/thank-you`. These pages read the order/donation status from Firestore; they never mark anything paid themselves.

Secret keys live only in Cloud Functions secrets (`FLW_SECRET_KEY`, `FLW_WEBHOOK_HASH`), never in front-end code.

**Cart (`src/context/CartContext.jsx`):** move the existing cart logic out of `Shop.jsx` into a context so it survives navigation. Keep the current behaviour (same product + colour + size merges, +/−, remove). Store `{ productId, color, size, qty }` only, never prices; display prices come from the `products` docs. `localStorage` for guests, copied to `users/{uid}/cart` on sign-in. The existing `Cart.jsx` panel becomes the cart drawer; drop mouse-only dragging in favour of a fixed, touch-friendly button. Digital products are delivered as short-lived signed Storage links after payment.

**Floating plant-a-tree button (`src/components/layout/DonateFab.jsx`):**

- Rendered once in the app layout so it shows on every page. Fixed bottom-right, `--fc-orange`, leaf icon + "Plant a tree". On pages with a cart, the cart button sits above it so they never overlap on phones.
- Opens a drawer: 1 / 5 / 10 / custom trees, optional name for the donor wall, pay with mobile money or card.
- After payment: thank-you with a certificate image and the live counter going up.
- Price per tree is set once a planting partner is agreed (open question).

A `cause` field on donations lets the same flow carry other causes later (artisan tool fund, student bursaries).

## Firestore data model

Money is stored as whole UGX integers. Timestamps use `serverTimestamp()`.

| Collection | Key fields | Who can write |
| --- | --- | --- |
| `users/{uid}` | name, email, phone, roles[] (client, member, student, investor), createdAt | The user (own doc); roles only by admin/functions |
| `users/{uid}/cart/{itemId}` | productId, color, size, qty | The user |
| `members/{uid}` | displayName, trade, bio, skills[], location, portfolio[] (Storage paths), approved | The user; `approved` only by admin |
| `products/{id}` | title, slug, division, category, priceUGX, description, images[], colors[], sizes[], stock, isDigital, filePath, active | Admin |
| `orders/{id}` | uid, items[{productId, title, qty, priceUGX}], totalUGX, status (pending, paid, shipped, cancelled), txRef, flwTxId, delivery{} | Cloud Functions only |
| `donations/{id}` | uid?, displayName, trees, amountUGX, cause, status, txRef, showOnWall | Cloud Functions only |
| `stats/public` | treesPlanted, artisans, projectsDone, studentsTrained | Cloud Functions only |
| `projects/{id}` | title, slug, division, client, location, year, summary, images[], featured | Admin |
| `quotes/{id}` | type (studio, construction, b2b), name, contact, plotSize, budgetUGX, message, files[], status | Anyone creates; admin updates |
| `jobs/{id}` | postedBy, title, trade, budgetUGX, deadline, status | Approved members and admin |
| `events/{id}` | title, date, venue, capacity, priceUGX | Admin |
| `courses/{id}` | title, level, priceUGX, sessions[] | Admin |
| `enrolments/{id}` | uid, courseId, status | Cloud Functions only |
| `investorLeads/{id}` | name, org, email, ticketSize, message | Anyone creates; admin reads |
| `messages/{id}` | name, email, subject, body | Anyone creates; admin reads |
| `posts/{id}` (if Journal kept) | title, slug, category, excerpt, body, image, publishedAt, featured | Admin |

Admins get a custom claim (`admin: true`) set with an Admin SDK script, not an email list in the rules.

## Folder structure

Target layout. Items marked *(exists)* are in the repo today; moves are listed in Phase 0.

```
website/   (repo: formcraft-web-27, path formcraftwebsite2026/website)
├─ CLAUDE.md
├─ docs/  build-plan.md (this file)  current-code.md
├─ index.html                  # <div id="root">, title "Formcraft" (exists)
├─ vite.config.js              # React plugin (exists)
├─ .oxlintrc.json              # (exists)
├─ .env.example                # VITE_FIREBASE_* keys (public config only)
├─ src/
│  ├─ main.jsx                 # imports styles/, renders <App/> (exists)
│  ├─ App.jsx                  # providers + layout + <Routes> (exists)
│  ├─ routes.jsx               # route table, React.lazy per page
│  ├─ config/firebase.js       # was firebase.jsx; exports auth, db, storage, functions
│  ├─ context/
│  │  ├─ AuthContext.jsx       # useAuth(): user, isAdmin, loading, signIn/out
│  │  └─ CartContext.jsx       # useCart(): items, add, update, remove (logic from Shop.jsx)
│  ├─ styles/  tokens.css  base.css  components.css  fonts.css
│  ├─ components/
│  │  ├─ layout/   Header.jsx  Footer.jsx  DonateFab.jsx  Layout.jsx
│  │  ├─ auth/     SignInDialog.jsx         # was components/auth.jsx
│  │  ├─ shop/     Hero  ProductGrid  ProductModal  Collections  CartDrawer …
│  │  │                                     # was components/craft/*
│  │  └─ ui/       Button.jsx  Modal.jsx  Drawer.jsx  FormField.jsx  Counter.jsx
│  ├─ pages/
│  │  ├─ Home  About  Studio  Construction  Concrete
│  │  ├─ Stores  ProductPage  Projects  ProjectPage
│  │  ├─ Community  Academy  Invest  Donate  DonateThanks  Contact
│  │  ├─ Account  Admin  Journal (optional)  NotFound
│  │  └─ (each as PageName.jsx + PageName.css)
│  ├─ hooks/   useDocument.js  useCollection.js  usePageMeta.js
│  └─ lib/     money.js (formatUGX)  forms.js  checkout.js (calls createCheckout)
├─ public/  fonts/  logos/  images/  favicon.svg
├─ functions/
│  ├─ src/index.js             # createCheckout, flutterwaveWebhook, onUserCreate, setAdmin
│  └─ package.json
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ firebase.json               # hosting rewrites ** → /index.html
├─ .firebaserc
└─ ../../.github/workflows/deploy.yml   # at repo root; working-directory formcraftwebsite2026/website
```

## Setup instructions

Needs Node.js 20+, Git and a Google account. The React app already exists, so there is no scaffold step.

1. **Firebase project.** The existing code points at project `fromcraft-2026` (see open questions). In console.firebase.google.com, open it (or create the final one), make sure a Web app exists and copy its config. Enable Authentication (Email/Password + Google), Firestore and Storage. Pick the Firestore location nearest Kampala (e.g. `africa-south1` if offered; it can't be changed later) and deploy Functions to the same region. Upgrade to Blaze and set a budget alert.
2. **Install.**
   ```bash
   cd formcraftwebsite2026/website
   npm install
   npm install firebase@latest react-router-dom@latest
   npm install -g firebase-tools
   ```
   Check the React Router release notes before jumping a major version; v6 code works as-is if you stay on 6.
3. **Firebase CLI.**
   ```bash
   firebase login
   firebase init   # Firestore, Functions (JavaScript), Hosting, Storage, Emulators
   ```
   Hosting public directory: `dist`. Configure as a single-page app (rewrite all URLs to `/index.html`): **yes**. GitHub deploys: **yes**.
4. **Config** in `.env.local` (never commit it; commit `.env.example` with empty values). Move the values that are currently hard-coded in `src/config/firebase.jsx` here:
   ```bash
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=
   VITE_FUNCTIONS_REGION=
   ```
5. **`src/config/firebase.js`** (replaces `firebase.jsx`):
   ```js
   import { initializeApp } from "firebase/app";
   import { getAuth, connectAuthEmulator } from "firebase/auth";
   import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
   import { getStorage, connectStorageEmulator } from "firebase/storage";
   import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

   const env = import.meta.env;
   export const app = initializeApp({
     apiKey: env.VITE_FIREBASE_API_KEY,
     authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: env.VITE_FIREBASE_APP_ID,
     measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
   });
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   export const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION);

   if (env.DEV) {
     connectAuthEmulator(auth, "http://localhost:9099");
     connectFirestoreEmulator(db, "localhost", 8080);
     connectStorageEmulator(storage, "localhost", 9199);
     connectFunctionsEmulator(functions, "localhost", 5001);
   }

   // Analytics only in production, loaded lazily
   if (env.PROD && env.VITE_FIREBASE_MEASUREMENT_ID) {
     import("firebase/analytics").then(({ getAnalytics }) => getAnalytics(app));
   }
   ```
6. **`vite.config.js`** stays a single entry with the React plugin. Routes are added in `src/routes.jsx`, not here:
   ```jsx
   // src/routes.jsx
   import { lazy } from "react";
   const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
   const Stores = lazy(() => import("./pages/Stores").then((m) => ({ default: m.Stores })));
   const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));
   // …one line per page; App.jsx wraps <Routes> in <Suspense>
   export const routes = [
     { path: "/", element: <Home /> },
     { path: "/stores", element: <Stores /> },
     { path: "*", element: <NotFound /> },
   ];
   ```
7. **Run locally with emulators:**
   ```bash
   npm run dev                 # localhost:5173
   firebase emulators:start    # Auth, Firestore, Functions, Storage
   ```
8. **Payment secrets** (Flutterwave test keys first):
   ```bash
   firebase functions:secrets:set FLW_SECRET_KEY
   firebase functions:secrets:set FLW_WEBHOOK_HASH
   ```
   Set the Flutterwave webhook URL to the deployed `flutterwaveWebhook`.
9. **Admin:** run once with the Admin SDK: `admin.auth().setCustomUserClaims(uid, { admin: true })`.
10. **Deploy:**
    ```bash
    npm run build
    firebase deploy
    ```
    After that, merges to `main` deploy through `.github/workflows/deploy.yml`; pull requests get preview links.
11. **Domain:** Hosting → Add custom domain, add the DNS records; HTTPS is automatic.

## Security rules starter (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin()  { return signedIn() && request.auth.token.admin == true; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    // Public catalogue: anyone reads, only admin writes
    match /products/{id} { allow read: if true; allow write: if isAdmin(); }
    match /projects/{id} { allow read: if true; allow write: if isAdmin(); }
    match /events/{id}   { allow read: if true; allow write: if isAdmin(); }
    match /courses/{id}  { allow read: if true; allow write: if isAdmin(); }
    match /stats/{id}    { allow read: if true; allow write: if false; } // functions only

    // Users and their carts
    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create, update: if isOwner(uid)
        && !request.resource.data.diff(resource == null ? {} : resource.data)
             .affectedKeys().hasAny(['roles']);
      match /cart/{item} { allow read, write: if isOwner(uid); }
    }

    // Community profiles: public once approved
    match /members/{uid} {
      allow read: if resource.data.approved == true || isOwner(uid) || isAdmin();
      allow create, update: if isOwner(uid)
        && request.resource.data.approved == (resource == null ? false : resource.data.approved);
      allow delete: if isAdmin();
    }

    // Money: written only by Cloud Functions (Admin SDK bypasses rules)
    match /orders/{id}      { allow read: if isOwner(resource.data.uid) || isAdmin(); allow write: if false; }
    match /enrolments/{id}  { allow read: if isOwner(resource.data.uid) || isAdmin(); allow write: if false; }
    match /donations/{id}   { allow read: if resource.data.showOnWall == true || isAdmin(); allow write: if false; }

    // Forms: anyone submits, only admin reads
    match /quotes/{id}        { allow create: if true; allow read, update: if isAdmin(); }
    match /investorLeads/{id} { allow create: if true; allow read: if isAdmin(); }
    match /messages/{id}      { allow create: if true; allow read: if isAdmin(); }

    // Jobs board: approved members post
    match /jobs/{id} {
      allow read: if true;
      allow create: if signedIn()
        && get(/databases/$(db)/documents/members/$(request.auth.uid)).data.approved == true;
      allow update: if isAdmin()
        || (isOwner(resource.data.postedBy)
            && request.resource.data.postedBy == resource.data.postedBy);
      allow delete: if isAdmin() || isOwner(resource.data.postedBy);
    }

    // Journal (only if kept)
    match /posts/{id} { allow read: if true; allow write: if isAdmin(); }
  }
}
```

Form collections (`quotes`, `investorLeads`, `messages`) accept writes from anyone, so add field checks to their `create` rules (required keys, string lengths, no `status` set by the visitor) as well as App Check.

Add Firebase **App Check** (reCAPTCHA Enterprise) before launch. Storage rules follow the same pattern: public read for product and project images, owner-only for member uploads, admin-only for the investor pack.

## Build phases

A short Phase 0 to clean up the existing code, then five phases of roughly two weeks each; each phase ends live. Full detail for Phase 0 is in `docs/current-code.md` ("Problems to fix").

0. **Bring the existing code in line (week 0, ~1 week).** Reuse, don't rewrite: the existing Shop sections, product modal, cart logic and auth wiring stay.
   - *Clean out:* delete Vite template leftovers (`App.css`, `assets/react.svg`, `assets/vite.svg`, unused `hero.png`, `public/icons.svg`, template `README.md`); set `<title>Formcraft</title>`.
   - *Brand base:* add `src/styles/tokens.css`, `base.css`, `components.css`, fonts; import once in `main.jsx`. Move the global `:root`, `.container`, `.section`, `.btn` rules out of `Shop.css` / `FeaturedProducts.css`. Replace hard-coded colours, Inter and inline styles (Home's `#4285F4`) with tokens.
   - *Firebase:* `config/firebase.jsx` → `config/firebase.js` reading `VITE_FIREBASE_*`, exporting `db`/`storage`/`functions`, emulators in dev, Analytics only in production. Add `.env.example`, `firebase.json` (SPA rewrite), rules files.
   - *Auth:* remove the 2-second forced sign-in overlay; add `AuthContext` + `useAuth()`; sign-in opens on demand (account, checkout, community, admin) and can be closed. Stop passing `user` to every page. Render pages immediately instead of a blank screen while auth loads.
   - *Layout and nav:* `Header` with `<NavLink>` and real `href`s, current page shown as active (not removed), the four-door grouping, a mobile menu, the logo SVG. Build `Footer` (currently empty). Add `Layout`, `routes.jsx` with lazy routes, and a 404.
   - *Shop → Stores:* rename route `/shop` → `/stores` (redirect the old path); `components/craft/` → `components/shop/`. Cart logic into `CartContext` (persists across pages, localStorage); fixed touch-friendly cart button instead of mouse-drag; stable product order (no 14 s reshuffle); prices as UGX via `lib/money.js`; de-duplicate the copied tea-towel products.
   - *Honest content:* remove invented testimonials, "Trusted by" logos, collection makers and placeholder images (`via.placeholder.com`, `pravatar.cc`); use `TODO:` placeholders until real content arrives. Rename `pages/Construction.jsx` (an "under construction" placeholder) to `ComingSoon.jsx`.
   - *Accessibility:* replace clickable `<div>`/`<article>`/`<a onClick>` with `<button>`/`<Link>`, label icon buttons (🛒 👤 ×), Escape and focus trapping in the product modal.
   - *Done when:* `npm run lint` and `npm run build` pass, no forced sign-in, every link works with the keyboard, no colour outside `tokens.css`, cart survives navigation.
1. **Foundation and pitch (weeks 1–2).** Home (pitch content replaces the form-builder cards), About (rewrite `AboutUs.jsx` from the Company Profile), four division pages (Studio, Construction, Concrete, Stores), Projects (from `Portfolio.jsx`), Contact form. Deploy to Firebase Hosting.
2. **Leads (weeks 3–4).** Quote forms with file upload, investor pack request, App Check, admin page for submissions, email alerts to the team.
3. **Shop and donations (weeks 5–6).** Products move from `data/products.jsx` into Firestore (`products`), product page `/stores/:slug`, cart synced to `users/{uid}/cart`, Flutterwave checkout (test mode), webhook, account page, floating plant-a-tree button and live counter. Switch to live keys after real test payments.
4. **Community and academy (weeks 7–8).** Sign-in, member profiles with admin approval, artisan directory, jobs board, events, course enrolment.
5. **Polish (weeks 9–10).** WebP images and lazy loading, SEO titles and Open Graph images (decide whether to pre-render public routes for SEO), Analytics, accessibility (contrast on orange buttons, keyboard navigation), Lighthouse 90+ on mobile.

**Done means:** works on a mid-range Android phone on 3G, every form lands in Firestore, a test payment turns an order to `paid`, and the rules block a signed-out user from reading orders.

## Open questions and brand-guide fixes

- [ ] **Formcraft Blue = Formcraft Green:** the guide gives both #7FC7BE. Stores needs its own blue.
- [ ] **"Formcraft White" listed twice:** page 27 labels the rust #D15334 as "Formcraft White"; the real white is #F1F1F1. Name the rust.
- [ ] **Orange hex vs RGB:** #FFAE61 doesn't match RGB 250, 171, 102 (= #FAAB66). Pick one.
- [ ] **Division names:** confirm Studio, Construction, Concrete and Stores, and whether Craft Studio furniture sits under Stores.
- [ ] **Tree price and partner:** which planting partner, how many UGX per tree.
- [ ] **Delivery:** areas served and how delivery is priced.
- [ ] **Domain:** which domain (e.g. formcraft.co.ug) and who controls DNS.
- [ ] **Contact email:** formcraftdesign@gmail.com or a domain email at launch.
- [ ] **Firebase project:** the code uses `fromcraft-2026` (spelled "fromcraft"). Keep it, or create a correctly named project before any real data goes in? The project id can't be renamed later.
- [ ] **Region:** confirm the Firestore location of the existing project and use the same region for Functions (`VITE_FUNCTIONS_REGION`).
- [ ] **Journal / blog:** keep the existing Blog page as a Journal (project stories, community news) only if someone will post regularly; otherwise drop it.
- [ ] **Shop products:** the current demo products (mugs, rattan baskets, tea towels) are placeholders. Get the real Stores catalogue, prices in UGX and photos.
