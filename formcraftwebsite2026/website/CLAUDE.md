# Formcraft website (formcraft-web-27)

Website for Formcraft Design and Construction Co. Ltd, Kampala, Uganda: an integrated design-build firm (BIM/CAD design studio, construction, concrete, furniture and joinery) working with artisans and creatives. Tagline: "Designing spaces. Empowering communities."

## The three docs

- **This file:** rules that are never broken, and how we work.
- **`docs/build-plan.md`:** what we are building, in what order. Wins on scope and features.
- **`docs/current-code.md`:** what the code does today. Wins on "what exists". You keep it up to date.

If they disagree: the rules in this file always win; then the plan for what to build; then `current-code.md` for what exists. If the plan contradicts a rule here, stop and ask.

@docs/build-plan.md

@docs/current-code.md

If the user says the plan changed, re-read `docs/build-plan.md` before continuing.

## How we work

1. **One task at a time.** Phase 0 tasks have ids (P0.1–P0.10). Do them in order unless told otherwise. Say which task you're on.
2. **Explain before big changes.** Before a change that touches more than ~3 files, deletes or moves files, or changes data access, list what you'll change and wait for a go-ahead. Small fixes can go straight ahead.
3. **Reuse, don't rewrite.** Build on the existing components (see "What to keep" in `current-code.md`). Rename or move files only when the plan's structure needs it, and say so.
4. **Check your work.** After each task: `npm run lint` and `npm run build` must pass. Open the page in `npm run dev` at 360px and desktop width and check it by keyboard.
5. **Update `docs/current-code.md` in the same commit**, following its "How to keep this file up to date" steps: status line, file map, how-it-works paragraphs, checklist, change log.
6. **Commit per task.** Message starts with the task id: `P0.4: AuthContext, remove forced sign-in`. Don't push or deploy unless asked.
7. **Missing facts → `TODO:`.** Never invent copy, prices, clients, testimonials, team members or numbers.

## Stack (do not change without asking)

- **React 19 + React Router 6 + Vite**, a single-page app. JavaScript and JSX; no TypeScript, Next.js, Tailwind or UI kits unless asked. Stay on React Router 6 until the plan says to upgrade.
- **Firebase**: Hosting, Auth, Firestore, Storage, Cloud Functions (Node, JavaScript). Use the modular Firebase JS SDK (`import { getFirestore } from "firebase/firestore"`), never the old namespaced `firebase.firestore()` style. All Firebase setup lives in `src/config/firebase.js`; components import `auth`, `db`, `storage`, `functions` from there and never call `initializeApp` themselves.
- Payments: **Flutterwave** (MTN/Airtel mobile money + cards, UGX). Not Stripe.
- Every new page gets a route in `src/routes.jsx` and is loaded with `React.lazy`. Renamed paths get a redirect so old links keep working.

## Commands

```bash
npm run dev                 # local site, localhost:5173
npm run lint                # oxlint
npm run build               # build to dist/
firebase emulators:start    # Auth, Firestore, Functions, Storage locally
firebase deploy             # only when the user asks
```

Develop against the emulators (`VITE_USE_EMULATORS=true` in `.env.local`). Never run `firebase deploy`, change the live Firebase project, or touch production data unless the user asks.

## Rules that must never be broken

- **Prices and money are server-side.** The browser sends product ids and quantities only. Cloud Functions read prices from Firestore, create orders, and are the only code that writes `orders`, `donations`, `enrolments` and `stats`.
- **Secrets stay in Cloud Functions secrets** (`FLW_SECRET_KEY`, `FLW_WEBHOOK_HASH`). Never put secret keys in front-end code, `.env` files that get committed, or the repo. Only public `VITE_*` config goes in `.env.local`, which is git-ignored.
- **Verify every Flutterwave webhook**: check the `verif-hash` header, then re-verify the transaction by id (status, currency, amount, tx_ref) before marking anything paid. Ignore repeats of an already-paid order.
- Money is whole **UGX integers**, shown only through `formatUGX` in `src/lib/money.js`. Timestamps use `serverTimestamp()`.
- Admin access uses the custom claim `admin: true`, not hard-coded emails.
- When you change data access, update `firestore.rules` / `storage.rules` in the same change, and make queries match the rules (e.g. orders filtered by `uid`).

## Brand (from Brand Guide v01)

- Colours come only from `src/styles/tokens.css` (`--fc-navy`, `--fc-orange`, `--fc-rust`, `--fc-white`, `--fc-black`, plus division accents `--fc-studio`, `--fc-stores`, `--fc-construction`, `--fc-concrete`). Never hard-code other hex values, in CSS or in inline `style={{}}`.
- Use #F1F1F1 instead of pure white and #171D1A instead of pure black.
- Fonts: **Satoshi** for body and UI, **Clash Grotesk** for display headlines, self-hosted `.woff2` in `public/fonts/`, declared in `src/styles/fonts.css`. No other fonts.
- Division pages keep the parent navy/orange and add only their own accent.
- Tints in 20% steps; any tint under 60% used as a background gets dark text.
- Logos: SVGs in `public/logos/`. Don't redraw, recolour or stretch them.
- Never reword the tagline.

## Writing on the site

Quietly confident, plain, honest, no hard selling, contractions are fine. Professional pages (Studio, Construction, Concrete, Invest) lead with process, scope and numbers. Shop pages: plain and warm, no jargon. Community pages: invitational ("Formcraft sets the market for the work — you focus on the craft"). Don't invent facts, figures, clients or testimonials; leave a clear `TODO:` placeholder instead.

## Code style

- **Where things live:** pages in `src/pages/` (`PageName.jsx` + `PageName.css`); shared layout in `src/components/layout/`; shop pieces in `src/components/shop/`; sign-in in `src/components/auth/`; small reusable UI in `src/components/ui/`; app-wide state in `src/context/` (`AuthContext`, `CartContext`); hooks in `src/hooks/`; helpers in `src/lib/`; static data in `src/data/` (until it moves to Firestore).
- Function components and hooks only. Named exports for components (`export const Header = …`), matching the existing code; the file name matches the component name.
- One plain CSS file per component, classes prefixed with the component name (`.header-…`, `.cart-…`). Global styles only in `src/styles/` (`tokens.css`, `fonts.css`, `base.css`, `components.css`), imported once in `main.jsx`. No `:root` or bare `.btn` / `.container` rules in component CSS.
- Get the signed-in user from `useAuth()`, not a `user` prop. Never block the whole site behind sign-in; only account, checkout, community posting and admin need it. Never render a blank screen while auth or data loads; show the page and a skeleton.
- Read Firestore through `useDocument` / `useCollection` in `src/hooks/`, not ad-hoc listeners in components. Unsubscribe on unmount.
- Navigation uses React Router `<Link>` / `<NavLink>` with real `href`s, never `<a onClick>` or clickable `<div>`s.
- Each route sets its own `<title>` and meta description with `usePageMeta`.
- Mobile first: test at 360px wide, touch as well as mouse. Keep it light for mobile data (WebP images, `loading="lazy"`, lazy-loaded routes).
- Accessible by default: semantic HTML, `<button>` for actions, labelled form fields and icon buttons, visible focus states, alt text, Escape closes modals and drawers, focus returns to the button that opened them.
- `localStorage` reads and writes are wrapped in try/catch; the app must work if storage is blocked.
