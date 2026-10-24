# Formcraft website (formcraft-web-27)

Website for Formcraft Design and Construction Co. Ltd, Kampala, Uganda: an integrated design-build firm (BIM/CAD design studio, construction, concrete, furniture and joinery) working with artisans and creatives. Tagline: "Designing spaces. Empowering communities."

## The three docs

- **This file:** rules that are never broken, and how we work.
- **`docs/build-plan.md`:** what we are building, in what order. Wins on scope and features.
- **`docs/current-code.md`:** what the code does today. Wins on "what exists". You keep it up to date.

If they disagree: the rules in this file always win; then the plan for what to build; then `current-code.md` for what exists. If the plan contradicts a rule here, stop and ask.

@docs/build-plan.md

@docs/current-code.md

@docs/handoff.md

**Handoff:** if `docs/handoff.md` has unticked steps, start there (install, lint, build, check), then continue with the plan.

If the user says the plan changed, re-read `docs/build-plan.md` before continuing.

## How we work

1. **One task at a time.** Phase 0 tasks have ids (P0.1–P0.10). Do them in order unless told otherwise. Say which task you're on.
2. **Explain before big changes.** Before a change that touches more than ~3 files, deletes or moves files, or changes data access, list what you'll change and wait for a go-ahead. Small fixes can go straight ahead.
3. **Reuse, don't rewrite.** Build on the existing components (see "What to keep" in `current-code.md`). Rename or move files only when the plan's structure needs it, and say so.
4. **Check your work.** After each task: `npm run check` (or `npm run check:fast` for small changes) must pass with no errors; it runs lint and build too. Look at the screenshots in `check-report/index.html`. There is no GitHub CI (it was removed to save money); these checks run on this computer.
5. **Update `docs/current-code.md` in the same commit**, following its "How to keep this file up to date" steps: status line, file map, how-it-works paragraphs, checklist, change log.
6. **Cloud ↔ local handoff (owner's rule).** Before and after every push: `git pull`, read what the other Claude Code session added (`docs/handoff.md`, `docs/ideas.md`, new branches), reconcile it with your work (port, merge or answer), and leave clear numbered tasks for the other side in `docs/handoff.md`.
7. **Commit per task.** Message starts with the task id: `P0.4: AuthContext, remove forced sign-in`. Don't push or deploy unless asked. **No AI attribution** (owner's rule: this code is private property of Atochon): never add `Co-Authored-By: Claude`, `Claude-Session:`, "Generated with Claude Code" or similar lines to commits, pull requests or code.
8. **Missing facts → `TODO:`.** Never invent copy, prices, clients, testimonials, team members or numbers.

## How we think (adapted from the MIT-licensed [karpathy-guidelines](https://github.com/multica-ai/andrej-karpathy-skills))

These bias toward care over speed; for trivial fixes, use judgment.

1. **Think before coding.** State your assumptions. When the owner's words allow more than one reading, say which readings you see and ask (or, when the owner said to go ahead without them, pick one, say so at the top of the reply and in `docs/handoff.md`). Never quietly upgrade or narrow what was asked. If something is unclear or the docs disagree, stop and name it. If a simpler way exists, say so and push back when it's warranted.
2. **Simplicity first.** The least code that does what was asked: no extra features, no abstractions for one use, no settings nobody asked for, no handling for cases that can't happen. If 200 lines could be 50, rewrite it. Ask: would a senior engineer call this overcomplicated?
3. **Surgical changes.** Every changed line should trace back to the request. Don't reformat, re-comment or refactor code that isn't part of the task; match the existing style. Remove imports, variables and files your own change made unused; mention other dead code, don't delete it unasked. (The doc updates required by "How we work" are part of every task, not extra.)
4. **Goal-driven work.** Turn each task into checks you can run, and loop until they pass. For multi-step work, write a short plan where each step has its check, e.g. `1. Move the cart into CartContext → check: cart survives navigation at 360 px`. Our checks: `npm run check` (or `check:fast`; it runs lint and build), the screenshots in `check-report/`, the page by keyboard, rules tests in the emulator. Report what you checked and what you couldn't.

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
npm run check               # offline quality check: lint, build, every page × 3 sizes × day/night in local Chrome, clicks, links, report in check-report/
npm run check:fast          # the same with fewer sizes (about 3× quicker)
npm run check:speed         # Lighthouse scores, locally
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
- **Motion:** follow `.claude/skills/emil-design-eng` (Emil Kowalski's rules, MIT, with Formcraft notes at the top). UI motion (buttons, menus, drawers, pop-ups) stays under 300 ms with the `--fc-ease-out` / `--fc-ease-drawer` curves, press feedback (`scale: .97` on `:active`) and hover motion only inside `@media (hover: hover) and (pointer: fine)`. Storytelling motion (opening, Home build, reveals) stays calmer and is tuned in Admin → Motion. Before committing animation work, run the `review-animations` skill on it.

## Documentation standard (owner's request: "so that even a child could understand the code")

Every change keeps the code readable by someone new: a developer joining, or the owner reviewing later.
- **Every file starts with a short plain-English note:** what it is, what it's for, and anything surprising
  (why it's done this way). Two to six lines is usual.
- **Every exported component, hook and function gets a comment right above it:** what it does, its inputs
  (`@param`) and what it gives back (`@returns`), in JSDoc form. Give an example when it helps.
- **Tricky parts get a one-line "why"** at the spot: a workaround, a performance choice, a rule from the
  owner. Don't comment the obvious.
- **Plain words:** say "saves on the visitor's device", not "persists to client-side storage". Explain a
  technical term the first time, or add it to `docs/glossary.md`.
- **Placeholders for missing facts** use `<Todo>` / `<Fact>` / `<PartFact>` (`src/components/ui/Todo.jsx`),
  never a visible `className="todo"`.
- **Guides in `docs/` stay true:** `README.md`, `docs/architecture.md`, `docs/folders.md`, `docs/glossary.md`,
  `docs/recipes.md`, `docs/checks.md`. Update the one a change affects in the same commit.
