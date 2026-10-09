# Formcraft website (formcraft-web-27)

Website for Formcraft Design and Construction Co. Ltd, Kampala, Uganda: an integrated design-build firm (BIM/CAD design studio, construction, concrete, furniture and joinery) working with artisans and creatives. Tagline: "Designing spaces. Empowering communities."

## The plan

Always follow the current build plan. When the plan and this file disagree, the plan wins.

@docs/build-plan.md

If the user says the plan changed, re-read `docs/build-plan.md` before continuing. `docs/current-code.md` describes the code as it was when we decided to build on it, and lists the Phase 0 fixes in detail.

## Stack (do not change without asking)

- **React 19 + React Router + Vite**, a single-page app. JavaScript and JSX; no TypeScript, Next.js, Tailwind or UI kits unless asked.
- **Firebase**: Hosting, Auth, Firestore, Storage, Cloud Functions (Node, JavaScript). Use the modular Firebase JS SDK (`import { getFirestore } from "firebase/firestore"`), never the old namespaced `firebase.firestore()` style. All Firebase setup lives in `src/config/firebase.js`; components import `auth`, `db`, `storage`, `functions` from there.
- Payments: **Flutterwave** (MTN/Airtel mobile money + cards, UGX). Not Stripe.
- Every new page gets a route in `src/routes.jsx` and is loaded with `React.lazy`.

## Commands

```bash
npm run dev                 # local site, localhost:5173
npm run lint                # oxlint
firebase emulators:start    # Auth, Firestore, Functions, Storage locally
npm run build               # build to dist/
firebase deploy             # only when the user asks
```

Develop against the emulators. Never run `firebase deploy` or touch production data unless the user asks.

## Rules that must never be broken

- **Prices and money are server-side.** The browser sends product ids and quantities only. Cloud Functions read prices from Firestore, create orders, and are the only code that writes `orders`, `donations`, `enrolments` and `stats`.
- **Secrets stay in Cloud Functions secrets** (`FLW_SECRET_KEY`, `FLW_WEBHOOK_HASH`). Never put secret keys in front-end code, `.env` files that get committed, or the repo. Only public `VITE_FIREBASE_*` config goes in `.env.local`.
- **Verify every Flutterwave webhook**: check the hash header, then re-verify the transaction by id before marking anything paid.
- Money is whole **UGX integers**. Timestamps use `serverTimestamp()`.
- Admin access uses the custom claim `admin: true`, not hard-coded emails.
- When you change data access, update `firestore.rules` / `storage.rules` in the same change.

## Brand (from Brand Guide v01)

- Colours come only from `src/styles/tokens.css` (`--fc-navy`, `--fc-orange`, `--fc-rust`, `--fc-white`, `--fc-black`, plus division accents `--fc-studio`, `--fc-stores`, `--fc-construction`, `--fc-concrete`). Never hard-code other hex values, in CSS or in inline `style={{}}`.
- Use #F1F1F1 instead of pure white and #171D1A instead of pure black.
- Fonts: **Satoshi** for body and UI, **Clash Grotesk** for display headlines, self-hosted `.woff2` in `public/fonts/`. No other fonts.
- Division pages keep the parent navy/orange and add only their own accent.
- Tints in 20% steps; any tint under 60% used as a background gets dark text.
- Logos: SVGs in `public/logos/`. Don't redraw, recolour or stretch them.
- Never reword the tagline.

## Writing on the site

Quietly confident, plain, honest, no hard selling, contractions are fine. Professional pages (Studio, Construction, Concrete, Invest) lead with process, scope and numbers. Shop pages: plain and warm, no jargon. Community pages: invitational ("Formcraft sets the market for the work — you focus on the craft"). Don't invent facts, figures, clients or testimonials; leave a clear `TODO:` placeholder instead.

## Code style

- Pages in `src/pages/` (`PageName.jsx` + `PageName.css`); shared layout in `src/components/layout/`; shop pieces in `src/components/shop/`; small reusable UI in `src/components/ui/`; app-wide state in `src/context/` (`AuthContext`, `CartContext`); helpers in `src/lib/`.
- Function components and hooks only. Named exports for components (`export const Header = …`), matching the existing code.
- One plain CSS file per component, classes prefixed with the component name (`.header-…`, `.cart-…`). Global styles only in `src/styles/` (`tokens.css`, `base.css`, `components.css`), imported once in `main.jsx`. No `:root` or bare `.btn` / `.container` rules in component CSS.
- Get the signed-in user from `useAuth()`, not a `user` prop. Never block the whole site behind sign-in; only account, checkout, community posting and admin need it.
- Navigation uses React Router `<Link>` / `<NavLink>` with real `href`s, never `<a onClick>` or clickable `<div>`s.
- Each route sets its own `<title>` and meta description.
- Mobile first: test at 360px wide, touch as well as mouse. Keep it light for mobile data (WebP images, `loading="lazy"`, lazy-loaded routes).
- Accessible by default: semantic HTML, `<button>` for actions, labelled form fields and icon buttons, visible focus states, alt text, Escape closes modals and drawers.
