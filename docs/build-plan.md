# Formcraft Website Build Plan

> **What to build.** Source of truth for scope and features. Edit this file when the plan changes;
> `CLAUDE.md` loads it into every Claude Code session.
> Companion docs: `CLAUDE.md` (rules that are never broken) and `docs/current-code.md`
> (what the code does today, kept up to date by Claude Code after every change).
> Last updated: 2026-10-24 · Current phase: **Launch track** (Phase 0 and the Phase 1 pages are built; see "Launch track" below)

Build formcraft as a fast React single-page app (Vite) on Firebase (Hosting, Auth, Firestore, Storage, Cloud Functions) with a pitch-style home page, four division pages, a shop, a members' community, an investors page and a floating plant-a-tree donate button.

We build on the existing React code (at the root of the `formcraft-web-27` repo) rather than starting again. `docs/current-code.md` describes that code; Phase 0 below brings it in line with this plan.

## Assumptions

- **Front end:** React 19 + React Router 6 (stay on 6.30 through Phase 0; moving to v7 is its own task later) + Vite, single-page app, JavaScript/JSX (no TypeScript). Plain CSS file per component plus shared styles in `src/styles/`.
- **Rendering:** client-side for now. Each route is lazy-loaded and sets its own `<title>` and meta description. Revisit pre-rendering public routes in Phase 5 if SEO needs it.
- **Back end:** Firebase: Hosting, Authentication, Firestore, Storage, Cloud Functions (Node, JavaScript). Functions need the pay-as-you-go **Blaze** plan.
- **Market:** Uganda first, prices in UGX, mobile money as the main way to pay.
- **Content source:** the Formcraft Company Profile and Brand Guide v01. Anything not in them is a `TODO:` placeholder, never invented.

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

**Type.** Satoshi for body text and UI (Light, Regular, Bold, Black); Clash Grotesk for display headlines. Both are free from Fontshare. Self-host the `.woff2` files in `public/fonts/`, declared in `src/styles/fonts.css`.

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

### Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | |
| `/about` | About | exists (`AboutUs.jsx`) |
| `/studio`, `/construction`, `/concrete` | Division pages | new |
| `/stores`, `/stores/:slug` | Stores, ProductPage | from `Shop.jsx` |
| `/projects`, `/projects/:slug` | Projects, ProjectPage | from `Portfolio.jsx` |
| `/community`, `/academy`, `/invest` | | new |
| `/donate`, `/donate/thank-you` | Donate, DonateThanks | new |
| `/contact`, `/account`, `/admin` | | new; `/account` and `/admin` need sign-in |
| `/journal` | Journal | only if kept (open question); from `Blog.jsx` |
| `*` | NotFound | new |

**Redirects for old paths** (so existing links keep working): `/shop` → `/stores`, `/portfolio` → `/projects`, `/services` → `/studio`, `/blog` → `/journal` (or `/` if the Journal is dropped).

## Architecture

```
Visitor's browser (React app built by Vite, Firebase JS SDK)
   │
   ├──► Firebase Hosting        serves the built site over a CDN; every path → /index.html
   ├──► Firebase Auth           email + Google sign-in; admin custom claim
   ├──► Firestore               products, orders, members, forms
   ├──► Storage                 images, plan PDFs, uploads
   └──► Cloud Functions         createCheckout (callable), flutterwaveWebhook (HTTP)
              │  ▲
     pay link ▼  │ webhook
           Flutterwave          MTN / Airtel mobile money, cards, UGX

GitHub (formcraft-web-27) ── push to main ──► GitHub Actions ──► firebase deploy
```

The browser talks to Firebase directly for everything public. Anything involving money, prices or roles goes through Cloud Functions, which hold the Flutterwave keys and are the only code allowed to write orders and donations.

## Page-by-page breakdown

"Builds on" names the existing component to reuse.

| Page | Who it's for | What's on it | Firebase pieces |
| --- | --- | --- | --- |
| **Home (the pitch)** · builds on `Home.jsx` (content replaced) | Everyone | Hero with tagline + short film/stills · "The problem" (designers and artisans working apart, *okwekoza*) · "One value chain" strip linking the four divisions · flagship projects (Karwani Complex, Lydia Residential, Lucy's Kitchen, Ggaba Apartments) · impact counters (artisans, trees planted, projects) · roadmap 2023 → 2028 · doors: Hire us / Shop / Join / Back us | Firestore `stats` doc for live counters |
| **About** · builds on `AboutUs.jsx` | Clients, investors, press | Founding story, Emlyn Atochon and Peter Isingoma, five core values, management philosophy | Static |
| **Studio** (design / BIM) | Developers, engineers, homeowners | Pre-construction package, BIM/CAD sub-contracting, template home designs (50×100 ft plots), BIM process diagram, "Request a quote" form | `quotes`, Storage for drawing uploads |
| **Construction** | Developers, homeowners | Build services, site process, safety, project gallery | `projects` |
| **Concrete** | Contractors, civil engineers | Precast columns, beams, lintels, pavers, facade panels, green concrete · B2B supply enquiry with quantities | `quotes` (type: b2b) |
| **Stores** (shop) · builds on `Shop.jsx` + `components/craft/*` | Consumers 25+, walk-in clients | Furniture collections, joinery, merch (tote, bottles, helmets, vests), template house plans as digital downloads. Keep the existing hero → products → collections → community layout, product modal and cart panel; add a product page at `/stores/:slug` | `products`, `orders`, Storage |
| **Projects** · builds on `Portfolio.jsx` | Everyone | Filterable portfolio by division, with case studies | `projects` |
| **Community** · reuses `CommunitySection` styling | Artisans, creatives, students | Member sign-up, artisan directory, jobs/commissions board, events and workshops, training programmes | Auth, `members`, `jobs`, `events` |
| **Academy** | Students | BIM/CAD courses, workshop sessions, internships; paid or free enrolment | `courses`, `enrolments` |
| **Invest** | Investors, member-investors | Vision, market, roadmap, 2028 targets ($1M revenue, 20% reinvested in artisans), property schemes, "Request the investor pack" (gated PDF) | `investorLeads`, private Storage |
| **Donate / Plant a tree** | Everyone | Floating button on every page → pick trees, live tree counter, donor wall | `donations`, `stats` |
| **Contact** | Everyone | Form, WhatsApp link, map of Kampala office, socials (@formcraft.ug, @formcraft_ug, LinkedIn formcraftinc) | `messages` |
| **Account** · reuses the Header account dropdown | Signed-in users | Orders, downloads, enrolments, member profile, donations | Auth + per-user queries |
| **Admin** | Formcraft team | Add/edit products, projects, events; see orders, quotes, donations, leads | Custom claim `admin: true` |
| **Journal** (optional) · builds on `Blog.jsx` | Everyone | Project stories, community news, workshop write-ups. Keep only if the team will post regularly (open question) | `posts` (admin writes) |
| **404** | Everyone | Plain "page not found" with links to the four doors | Static |

Keep the site fast on mobile data: lazy-load each route, load Firebase services only where a page needs them, render page text immediately (don't wait for auth before showing anything), and show skeletons rather than blank screens while Firestore data loads.

## Shop, payments and the plant-a-tree button

Use **Flutterwave** as the main gateway: MTN and Airtel mobile money in UGX plus cards, confirmed by webhook ([docs](https://developer.flutterwave.com/docs/uganda)). **Pesapal** is the local alternative ([API 3.0](https://www.pesapal.com/blog/pesapal-upgrades-to-a-new-api-pesapal-30)). Don't use Stripe: it doesn't onboard Uganda-registered businesses.

**Payment flow (same for orders, courses and donations):**

1. Browser calls the **callable** function `createCheckout` (`httpsCallable(functions, "createCheckout")` in `src/lib/checkout.js`) with `{ items: [{ productId, color, size, qty }] }` only.
2. The function reads real prices from Firestore, checks stock and `active`, writes an `orders` doc with `status: "pending"` and `txRef` = the order id, and asks Flutterwave for a hosted payment link (`redirect_url` = `/account?order=<id>`). It returns only the link.
3. Customer pays on the Flutterwave page (mobile money prompt or card).
4. Flutterwave calls the **HTTP** function `flutterwaveWebhook`. It:
   - rejects the call unless the `verif-hash` header equals the `FLW_WEBHOOK_HASH` secret;
   - re-fetches the transaction from Flutterwave's verify endpoint by id (never trusts the webhook body);
   - checks `status == "successful"`, `currency == "UGX"`, `amount >= order.totalUGX` and `tx_ref` matches;
   - does nothing if the order is already `paid` (Flutterwave can retry);
   - then, in a Firestore transaction, sets the order to `paid` (or for a donation, marks it paid and adds the trees to `stats/public`).
5. Customer lands on `/account` (orders) or `/donate/thank-you`. These pages read the status from Firestore; they never mark anything paid themselves.

Secret keys live only in Cloud Functions secrets (`FLW_SECRET_KEY`, `FLW_WEBHOOK_HASH`), never in front-end code. Check Flutterwave's docs for the current API version before writing the functions.

**Money display:** prices are whole UGX integers, shown with one helper so the format is the same everywhere:

```js
// src/lib/money.js
const ugx = new Intl.NumberFormat("en-UG", {
  style: "currency", currency: "UGX", currencyDisplay: "code", maximumFractionDigits: 0,
});
export const formatUGX = (amount) => ugx.format(amount); // "UGX 120,000"
```

**Cart (`src/context/CartContext.jsx`):** move the existing cart logic out of `Shop.jsx` into a context so it survives navigation. Keep the current behaviour (same product + colour + size merges, +/−, remove). Store `{ productId, color, size, qty }` only, never prices; display prices come from the product data. `localStorage` for guests (wrapped in try/catch), copied to `users/{uid}/cart` on sign-in. The existing `Cart.jsx` panel becomes `CartDrawer`; drop mouse-only dragging in favour of a fixed, touch-friendly button. Digital products are delivered as short-lived signed Storage links after payment.

**Floating plant-a-tree button (`src/components/layout/DonateFab.jsx`):**

- Rendered once in `Layout` so it shows on every page. Fixed bottom-right, `--fc-orange`, leaf icon + "Plant a tree". On pages with a cart, the cart button sits above it so they never overlap on phones.
- Opens a drawer: 1 / 5 / 10 / custom trees, optional name for the donor wall, pay with mobile money or card.
- After payment: thank-you with a certificate image and the live counter going up.
- Price per tree is set once a planting partner is agreed (open question). Until then the button opens the drawer with a `TODO:` price and no live payment.

A `cause` field on donations lets the same flow carry other causes later (artisan tool fund, student bursaries).

## Firestore data model

Money is stored as whole UGX integers. Timestamps use `serverTimestamp()`.

| Collection | Key fields | Who can write |
| --- | --- | --- |
| `users/{uid}` | name, email, phone, roles[] (client, member, student, investor), createdAt | The user (own doc); roles only by admin/functions |
| `users/{uid}/cart/{itemId}` | productId, color, size, qty | The user |
| `members/{uid}` | displayName, trade, bio, skills[], location, portfolio[] (Storage paths), approved | The user; `approved` only by admin |
| `products/{id}` | title, slug, division, category, priceUGX, description, images[], colors[], sizes[], stock, isDigital, filePath, active | Admin |
| `orders/{id}` | uid, items[{productId, title, color, size, qty, priceUGX}], totalUGX, status (pending, paid, shipped, cancelled), txRef, flwTxId, delivery{}, createdAt, paidAt | Cloud Functions only |
| `donations/{id}` | uid?, displayName, trees, amountUGX, cause, status, txRef, showOnWall, createdAt | Cloud Functions only |
| `stats/public` | treesPlanted, artisans, projectsDone, studentsTrained | Cloud Functions only |
| `projects/{id}` | title, slug, division, client, location, year, summary, images[], featured | Admin |
| `quotes/{id}` | type (studio, construction, b2b), name, contact, plotSize, budgetUGX, message, files[], status, createdAt | Anyone creates; admin updates |
| `jobs/{id}` | postedBy, title, trade, budgetUGX, deadline, status | Approved members and admin |
| `events/{id}` | title, date, venue, capacity, priceUGX | Admin |
| `courses/{id}` | title, level, priceUGX, sessions[] | Admin |
| `enrolments/{id}` | uid, courseId, status | Cloud Functions only |
| `investorLeads/{id}` | name, org, email, ticketSize, message, createdAt | Anyone creates; admin reads |
| `messages/{id}` | name, email, subject, body, createdAt | Anyone creates; admin reads |
| `posts/{id}` (if Journal kept) | title, slug, category, excerpt, body, image, publishedAt, featured | Admin |

Admins get a custom claim (`admin: true`) set with `scripts/set-admin.js`, not an email list in the rules.

**Queries must match the rules.** Firestore rejects a query that could return documents the rules would block, so: list orders with `where("uid", "==", user.uid)`, list members with `where("approved", "==", true)`, list donor-wall entries with `where("showOnWall", "==", true)`.

**Until Phase 3, products stay in a local file.** In Phase 0, move `components/data/products.jsx` to `src/data/products.js` and reshape each product to the `products` fields above (`title`, `slug`, `priceUGX`, `images[]`, …). Phase 3 then only needs `scripts/seed-products.js` to copy that file into Firestore.

## Folder structure

Target layout. Moves from today's code are listed in Phase 0 and tracked in `docs/current-code.md`.

```
formcraft-web-27/   (repo root)
├─ CLAUDE.md
├─ docs/  build-plan.md (this file)  current-code.md (living)
├─ index.html                  # <div id="root">, title "Formcraft"
├─ vite.config.js              # React plugin, single entry
├─ .oxlintrc.json
├─ .env.example                # VITE_* keys, empty values
├─ src/
│  ├─ main.jsx                 # imports styles/, renders <App/>
│  ├─ App.jsx                  # providers (Auth, Cart) + <BrowserRouter> + <Layout> + routes
│  ├─ routes.jsx               # route table, React.lazy per page, redirects, 404
│  ├─ config/firebase.js       # was firebase.jsx; exports app, auth, db, storage, functions
│  ├─ context/
│  │  ├─ AuthContext.jsx       # useAuth(): user, isAdmin, loading, signIn(), signOut(), openSignIn()
│  │  └─ CartContext.jsx       # useCart(): items, count, add, update, remove, clear
│  ├─ data/products.js         # moved from components/data; until Phase 3
│  ├─ styles/  tokens.css  fonts.css  base.css  components.css
│  ├─ components/
│  │  ├─ layout/   Layout.jsx  Header.jsx  Footer.jsx  DonateFab.jsx
│  │  ├─ auth/     SignInDialog.jsx         # was components/auth.jsx
│  │  ├─ shop/     Hero  ProductGrid  ProductModal  Collections  CommunityBand  CartButton  CartDrawer
│  │  │                                     # was components/craft/*
│  │  └─ ui/       Button.jsx  Modal.jsx  Drawer.jsx  FormField.jsx  Counter.jsx
│  ├─ pages/
│  │  ├─ Home  About  Studio  Construction  Concrete
│  │  ├─ Stores  ProductPage  Projects  ProjectPage
│  │  ├─ Community  Academy  Invest  Donate  DonateThanks  Contact
│  │  ├─ Account  Admin  Journal (optional)  ComingSoon  NotFound
│  │  └─ (each as PageName.jsx + PageName.css)
│  ├─ hooks/   useDocument.js  useCollection.js  usePageMeta.js
│  └─ lib/     money.js (formatUGX)  forms.js  checkout.js (calls createCheckout)
├─ public/  fonts/  logos/  images/  favicon.svg
├─ functions/
│  ├─ src/index.js             # createCheckout, flutterwaveWebhook, onUserCreate
│  └─ package.json
├─ scripts/  set-admin.js  seed-products.js     # run locally with the Admin SDK
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ firebase.json               # hosting: public dist, rewrites ** → /index.html
├─ .firebaserc
└─ .github/workflows/deploy.yml
```

## Setup instructions

Needs Node.js 20+, Git and a Google account. The React app already exists, so there is no scaffold step.

1. **Firebase project.** The project is `formcraft2027` (owner's decision, 2026-10-24; it replaces the misspelled `fromcraft-2026`). In console.firebase.google.com, open it (or create the final one), make sure a Web app exists and copy its config. Enable Authentication (Email/Password + Google), Firestore and Storage. Pick the Firestore location nearest Kampala (e.g. `africa-south1` if offered; it can't be changed later) and deploy Functions to the same region. Upgrade to Blaze and set a budget alert. In Google Cloud console → APIs & Services → Credentials, restrict the web API key to your domains (the key is public by design; the restriction stops misuse).
2. **Install.**
   ```bash
   npm install
   npm install firebase@latest
   npm install -g firebase-tools
   ```
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
   VITE_USE_EMULATORS=true
   ```
5. **`src/config/firebase.js`** (replaces `firebase.jsx`):
   ```js
   import { initializeApp, getApps, getApp } from "firebase/app";
   import { getAuth, connectAuthEmulator } from "firebase/auth";
   import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
   import { getStorage, connectStorageEmulator } from "firebase/storage";
   import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

   const env = import.meta.env;
   const firstLoad = getApps().length === 0; // guards against hot-reload re-initialising

   export const app = firstLoad
     ? initializeApp({
         apiKey: env.VITE_FIREBASE_API_KEY,
         authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
         projectId: env.VITE_FIREBASE_PROJECT_ID,
         storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
         messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
         appId: env.VITE_FIREBASE_APP_ID,
         measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
       })
     : getApp();
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   export const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION);

   if (firstLoad && env.DEV && env.VITE_USE_EMULATORS === "true") {
     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
     connectFirestoreEmulator(db, "localhost", 8081); // 8080 is used by the Revit MCP plugin
     connectStorageEmulator(storage, "localhost", 9199);
     connectFunctionsEmulator(functions, "localhost", 5001);
   }

   // Analytics only in production, loaded lazily
   if (env.PROD && env.VITE_FIREBASE_MEASUREMENT_ID) {
     import("firebase/analytics").then(({ getAnalytics }) => getAnalytics(app));
   }
   ```
6. **Routes** live in `src/routes.jsx`, not in `vite.config.js` (single entry):
   ```jsx
   // src/routes.jsx
   import { lazy } from "react";
   import { Navigate } from "react-router-dom";
   const page = (name) => lazy(() => import(`./pages/${name}.jsx`).then((m) => ({ default: m[name] })));
   const Home = page("Home");
   const Stores = page("Stores");
   const NotFound = page("NotFound");
   // …one line per page; App.jsx wraps <Routes> in <Suspense>

   export const routes = [
     { path: "/", element: <Home /> },
     { path: "/stores", element: <Stores /> },
     { path: "/shop", element: <Navigate to="/stores" replace /> },
     { path: "*", element: <NotFound /> },
   ];
   ```
7. **Run locally with emulators:**
   ```bash
   firebase emulators:start    # Auth, Firestore, Functions, Storage (emulator UI on localhost:4000)
   npm run dev                 # localhost:5173
   ```
8. **Payment secrets** (Flutterwave test keys first):
   ```bash
   firebase functions:secrets:set FLW_SECRET_KEY
   firebase functions:secrets:set FLW_WEBHOOK_HASH
   ```
   Set the same hash in the Flutterwave dashboard and point its webhook URL at the deployed `flutterwaveWebhook`.
9. **New-user setup:** `onUserCreate` creates `users/{uid}` with `roles: ["client"]`. Second-generation Functions have no plain "user created" trigger, so write it with `firebase-functions/v1` (`auth.user().onCreate`), which can sit beside v2 functions in the same file.
10. **Admin:** run once: `node scripts/set-admin.js you@example.com` (uses the Admin SDK: `getAuth().setCustomUserClaims(uid, { admin: true })`). Sign out and back in to pick up the claim.
11. **Deploy:**
    ```bash
    npm run build
    firebase deploy
    ```
    After that, merges to `main` deploy through `.github/workflows/deploy.yml`; pull requests get preview links.
12. **Domain:** Hosting → Add custom domain, add the DNS records; HTTPS is automatic.

## Security rules starter (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin()  { return signedIn() && request.auth.token.admin == true; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function str(field, max) { return request.resource.data[field] is string
                                 && request.resource.data[field].size() > 0
                                 && request.resource.data[field].size() <= max; }

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

    // Forms: anyone submits (checked fields only), only admin reads
    match /messages/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name', 'email', 'subject', 'body', 'createdAt'])
        && str('name', 120) && str('email', 200) && str('body', 5000)
        && request.resource.data.createdAt == request.time;
      allow read: if isAdmin();
    }
    match /quotes/{id} {
      allow create: if !('status' in request.resource.data)
        && str('name', 120) && str('contact', 200)
        && request.resource.data.createdAt == request.time;
      allow read, update: if isAdmin();
    }
    match /investorLeads/{id} {
      allow create: if str('name', 120) && str('email', 200)
        && request.resource.data.createdAt == request.time;
      allow read: if isAdmin();
    }

    // Jobs board: approved members post
    match /jobs/{id} {
      allow read: if true;
      allow create: if signedIn()
        && request.resource.data.postedBy == request.auth.uid
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

Forms write `createdAt: serverTimestamp()`, which the rules check against `request.time`. Add Firebase **App Check** (reCAPTCHA Enterprise) before launch. Storage rules follow the same pattern: public read for product and project images, owner-only for member uploads, admin-only for the investor pack. From Phase 3, test the rules against the emulator with `@firebase/rules-unit-testing` (a signed-out user can't read orders; a visitor can't set `status` on a quote).

## Build phases

A short Phase 0 to clean up the existing code, then five phases of roughly two weeks each; each phase ends live. Each Phase 0 task is one commit (message starts with its id, e.g. `P0.4: AuthContext, remove forced sign-in`). The problem numbers (#1–#20) point to the detailed list in `docs/current-code.md`, which also tracks each task's status.

### Phase 0: bring the existing code in line (~1 week)

Reuse, don't rewrite: the Shop sections, product modal, cart logic and auth wiring stay. Do the tasks in this order; each must leave `npm run lint` and `npm run build` passing.

| Id | Task | Fixes |
| --- | --- | --- |
| P0.1 | **Clean out.** Delete Vite template leftovers (`App.css`, `assets/react.svg`, `assets/vite.svg`, unused `hero.png`, `public/icons.svg`, template `README.md`); `<title>Formcraft</title>`. | #15 |
| P0.2 | **Firebase config.** `config/firebase.jsx` → `config/firebase.js` (setup step 5); `.env.example`; `.gitignore` covers `.env.local`; `firebase.json` with SPA rewrite; empty `firestore.rules`, `storage.rules`, `firestore.indexes.json` from the starter above. Update `firebase` to the current major. | #17, #18, #20 |
| P0.3 | **Brand base.** `src/styles/tokens.css`, `fonts.css`, `base.css`, `components.css`, imported once in `main.jsx`. Move global `:root`, `.container`, `.section`, `.btn` out of `Shop.css` / `FeaturedProducts.css`. Replace terracotta, Inter, `#4285F4` and inline styles with tokens. | #2, #16 |
| P0.4 | **Auth.** `AuthContext` + `useAuth()`. Remove the 2-second forced overlay; `SignInDialog` (from `auth.jsx`) opens on demand, can be closed (button + Escape), shows errors to the user. Render pages immediately while auth loads. Stop passing `user` as a prop. | #6, #10 |
| P0.5 | **Layout and routing.** `Layout` (Header, Footer, DonateFab placeholder), `routes.jsx` with lazy routes, redirects and `NotFound`. Rename `pages/Construction.jsx` → `ComingSoon.jsx` and use it for routes not built yet. | #11 |
| P0.6 | **Header and footer.** `<NavLink>` with real `href`s; current page marked active, not removed; four-door grouping; mobile menu; logo SVG and favicon. Build `Footer` (About, Contact, socials, tagline). | #3, #12, #13 |
| P0.7 | **Shop → Stores.** `/shop` → `/stores`; `components/craft/` → `components/shop/` (names in the folder structure); `CraftPage` → `Stores`. Products to `src/data/products.js` in the new shape, duplicates removed, UGX prices via `formatUGX`. Stable product order (no 14 s reshuffle). | #5, #8 |
| P0.8 | **Cart.** Logic from `CraftPage` into `CartContext` (persists across pages, localStorage). Fixed, touch-friendly `CartButton` + `CartDrawer`; no mouse dragging. Checkout button shows "Coming soon" until Phase 3. | #7 |
| P0.9 | **Honest content.** Remove invented testimonials, "Trusted by" logos, collection makers, form-builder copy and placeholder images (`via.placeholder.com`, `pravatar.cc`, Unsplash); use `TODO:` placeholders. Buttons that do nothing get a real route or are removed. | #1, #4, #9, #19 |
| P0.10 | **Accessibility.** Replace clickable `<div>`/`<article>`/`<a onClick>` with `<button>`/`<Link>`; label icon buttons (🛒 👤 ×); product modal traps focus and closes on Escape. | #14 |

*Phase 0 done when:* `npm run lint` and `npm run build` pass, no forced sign-in, every link works with the keyboard, no colour outside `tokens.css`, cart survives navigation, old URLs redirect, and `docs/current-code.md` describes the new code.

### Launch track (agreed with the owner, 2026-10-24)

Phase 0 is done and every designed page exists (pages can be switched on/off from Admin). Before the
remaining phases, the owner agreed this order so the site is fast, safe and works as the top of the
sales funnel. Everything stays easy to change after the owner's review on a phone.

| Step | What | Key decisions |
| --- | --- | --- |
| L1 | **Smooth opening and speed** | Opening animation in `index.html` (paints before the app loads): the drawing sheet, FC mark stamped with a pulse and the tagline, mark glides to the header logo and the wordmark joins it, then the sheet is ripped off the pad from one side, the tear running along the perforation (changed 2026-10-24), ~3.5 s; full on first visit, quick on later visits, none in the same session; tap/key skips; fade only with reduced motion; never shown to bots. Home (changed 2026-10-24): the paper background shows at once, then the 3D model builds itself on top (backdrop, board, floor by floor, trees) on most devices; only the slowest devices get a 2D paper-cut drawing of the same model. No still picture, no "Tap to explore". Animation timing is set in Admin → Motion. Fix the phone flicker (handover, address-bar resizes, blur on phones, textures baked as images). Targets: LCP < 2.5 s on 4G mid-range Android, CLS < 0.1, INP < 200 ms. |
| L2 | **Security** | Spam protection (honeypot now; App Check + `submitLead` callable function with rate limits once on Blaze), security headers in `firebase.json` (CSP report-only first), API key restricted to the domain, admins use 2-step Google accounts, nightly Firestore export, rules tests. |
| L3 | **Funnel** | Tagged links (first/last touch saved, attached to every lead), email capture (`subscribers`, consent, free downloads — template catalogue first), gentle scroll prompt, `/links` link-in-bio page, contact-click tracking, cookie consent + Analytics after consent, `/privacy`. Emails collected in Firestore and exported; Brevo later. |
| L4 | **Admin data** | One Leads screen (all forms + subscribers + clicks), status pipeline, charts, CSV export, link builder, editable site details (WhatsApp, address, socials). |
| L5 | **SEO** | Build-time HTML per route with title/description/canonical/Open Graph/JSON-LD (`scripts/seo-pages.mjs`), branded preview images (`public/og/`), sitemap and robots, keyword-led titles (clusters in `src/data/seo.js`), Google Business Profile and Search Console (owner). Domain: one setting (`SITE_URL`). |
| L6 | **Marketing studio** | Social media planning in Admin: open-ended channel list (Instagram, Facebook, X, LinkedIn, TikTok, Pinterest, more added in Admin), occasions calendar from the Template Master Register (~60 occasions, template codes FMC-MKT-HOL/AWR/DAY, care notes), topic bank and content pillars, posting targets per channel, "generate the year" drafts, bulk CSV import/export, approvals, publishing through Buffer (server-side secret) or a manual "today's posts" queue, results per post via tagged links. Occasions can also drive seasonal site themes (accent only; occasion palette needs brand approval). |
| L7 | **Team accounts** | Roles by custom claim: `admin` (everything), `role: marketing` (studio, leads, content), `role: editor` (drafts). Admins add people by email in Admin → Team; a Cloud Function sets the claim. Owner, co-founder and head of sales & marketing are admins. |

Caching: no Redis — Firebase Hosting CDN + pre-built pages + service worker + browser caches + localStorage content cache.

### Phases 1–5

1. **Foundation and pitch (weeks 1–2).** Home (pitch content replaces the form-builder cards), About (rewrite `AboutUs.jsx` from the Company Profile), four division pages (Studio, Construction, Concrete, Stores), Projects (from `Portfolio.jsx`), Contact form. Per-route `<title>`/meta via `usePageMeta`. First deploy to Firebase Hosting.
2. **Leads (weeks 3–4).** Quote forms with file upload, investor pack request, App Check, admin page for submissions, email alerts to the team.
3. **Shop and donations (weeks 5–6).** `scripts/seed-products.js` copies `src/data/products.js` into Firestore; Stores reads `products`; product page `/stores/:slug`; cart synced to `users/{uid}/cart`; Flutterwave checkout (test mode), webhook, account page, plant-a-tree drawer and live counter; rules tests. Switch to live keys after real test payments.
4. **Community and academy (weeks 7–8).** Email/Password sign-in, member profiles with admin approval, artisan directory, jobs board, events, course enrolment.
5. **Polish (weeks 9–10).** WebP images and lazy loading, Open Graph images, decide on pre-rendering public routes for SEO, Analytics, accessibility (contrast on orange buttons, keyboard navigation), Lighthouse 90+ on mobile, React Router v7 upgrade if wanted.

**Done means:** works on a mid-range Android phone on 3G, every form lands in Firestore, a test payment turns an order to `paid`, and the rules block a signed-out user from reading orders.

## Open questions and brand-guide fixes

- [x] **Domain:** decided 2026-10-25: **formcraftdesignconstruction.com** (Hostinger), bare address main, `www` redirects. `SITE_URL` set. Posters and cards still show formcraftdesign.com: update them.
- [ ] **Public email:** formcraftdesign@gmail.com, formcraft@gmail.com or a domain email (e.g. hello@formcraftdesignconstruction.com).
- [ ] **Team details:** sign-in emails for Peter Isingoma and Esther Ahumuza (head of sales & marketing).
- [ ] **Occasion palette:** colours for seasonal themes need brand approval before they go live.
- [ ] **Posting targets:** posts per week per channel (set in Admin → Studio).

- [ ] **Formcraft Blue = Formcraft Green:** the guide gives both #7FC7BE. Stores needs its own blue.
- [ ] **"Formcraft White" listed twice:** page 27 labels the rust #D15334 as "Formcraft White"; the real white is #F1F1F1. Name the rust.
- [ ] **Orange hex vs RGB:** #FFAE61 doesn't match RGB 250, 171, 102 (= #FAAB66). Pick one.
- [ ] **Division names:** confirm Studio, Construction, Concrete and Stores, and whether Craft Studio furniture sits under Stores.
- [ ] **Tree price and partner:** which planting partner, how many UGX per tree.
- [ ] **Delivery:** areas served and how delivery is priced.
- [x] **Domain:** formcraftdesignconstruction.com; DNS at Hostinger (the owner's account).
- [ ] **Contact email:** formcraftdesign@gmail.com or a domain email at launch.
- [x] **Firebase project:** decided 2026-10-24: a new project `formcraft2027` (the old `fromcraft-2026` was misspelled; ids can't be renamed). The code points at it; the owner creates it and pastes its web-app keys into `.env.local`.
- [ ] **Region:** confirm the Firestore location of the existing project and use the same region for Functions (`VITE_FUNCTIONS_REGION`).
- [ ] **Journal / blog:** keep the existing Blog page as a Journal (project stories, community news) only if someone will post regularly; otherwise drop it and redirect `/blog` to `/`.
- [ ] **Shop products:** the current demo products (mugs, rattan baskets, tea towels) are placeholders. Get the real Stores catalogue, prices in UGX and photos.
