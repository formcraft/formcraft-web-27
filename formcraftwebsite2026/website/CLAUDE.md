# Formcraft website (formcraft-web-27)

Website for Formcraft Design and Construction Co. Ltd, Kampala, Uganda: an integrated design-build firm (BIM/CAD design studio, construction, concrete, furniture and joinery) working with artisans and creatives. Tagline: "Designing spaces. Empowering communities."

## The plan

Always follow the current build plan. When the plan and this file disagree, the plan wins.

@docs/build-plan.md

If the user says the plan changed, re-read `docs/build-plan.md` before continuing.

## Stack (do not change without asking)

- Plain JavaScript ES modules, built with **Vite** as a **multi-page** site. No React, Vue or other framework; no TypeScript unless asked.
- **Firebase**: Hosting, Auth, Firestore, Storage, Cloud Functions (Node, JavaScript). Use the modular Firebase JS SDK (`import { getFirestore } from "firebase/firestore"`), never the old namespaced `firebase.firestore()` style.
- Payments: **Flutterwave** (MTN/Airtel mobile money + cards, UGX). Not Stripe.
- Every new HTML page must be added to `build.rollupOptions.input` in `vite.config.js`.

## Commands

```bash
npm run dev                 # local site, localhost:5173
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

- Colours come only from `src/styles/tokens.css` (`--fc-navy`, `--fc-orange`, `--fc-rust`, `--fc-white`, `--fc-black`, plus division accents `--fc-studio`, `--fc-stores`, `--fc-construction`, `--fc-concrete`). Never hard-code other hex values.
- Use #F1F1F1 instead of pure white and #171D1A instead of pure black.
- Fonts: **Satoshi** for body and UI, **Clash Grotesk** for display headlines, self-hosted `.woff2` in `public/fonts/`. No other fonts.
- Division pages keep the parent navy/orange and add only their own accent.
- Tints in 20% steps; any tint under 60% used as a background gets dark text.
- Logos: SVGs in `public/logos/`. Don't redraw, recolour or stretch them.
- Never reword the tagline.

## Writing on the site

Quietly confident, plain, honest, no hard selling, contractions are fine. Professional pages (Studio, Construction, Concrete, Invest) lead with process, scope and numbers. Shop pages: plain and warm, no jargon. Community pages: invitational ("Formcraft sets the market for the work — you focus on the craft"). Don't invent facts, figures, clients or testimonials; leave a clear `TODO:` placeholder instead.

## Code style

- Small modules in `src/js/`; shared UI in `src/js/components/`; page entry scripts in `src/pages/`.
- Pages should still show their text and images without JavaScript; load interactive parts (cart, forms, counters, donate button) as modules.
- Mobile first: test at 360px wide. Keep pages light for mobile data (WebP images, lazy loading).
- Accessible by default: semantic HTML, labelled form fields, visible focus states, alt text on images.
