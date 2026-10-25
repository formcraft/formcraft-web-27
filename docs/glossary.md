# Words used in this project

In alphabetical order. If a word in the code or the docs isn't here, it should be: add it.

**Admin / team roles.** Signed-in Formcraft staff. Everyone on the team has the same full access (claim
`admin`, role "team"); the **owner** (claim `owner`) is the only one who manages Admin → Team. Limited roles
`marketing` (Studio, leads, content) and `editor` (drafts) exist for later. Stored as a *custom claim* on the
person's account, set only from the server (`scripts/set-admin.js` or Admin → Team).

**Copy / copy register.** The words on the site. The *register* (`src/data/copy.js`) lists every piece the team
can edit in Admin → Copy, with its built-in wording and length limit. A *draft* is an unpublished edit (team only,
previewed with `?preview=draft`); *publishing* makes it public.

**Records / Leads (admin).** *Leads* are people who contacted Formcraft (messages, quote requests, investor
requests, subscribers), worked in Admin → Leads with one status list. *Records* are the read-only lists of orders,
donations and members.

**Social planner.** Admin → Social planner (formerly "Studio"): the social media calendar, posts, channels and
occasions. Not to be confused with **Studio**, Formcraft's design division and its page.

**Pre-rendering / hydration.** *Pre-rendering*: the build saves each page's finished HTML, so it shows before the
JavaScript arrives. *Hydration*: React then adopts that HTML instead of drawing the page again. See
`docs/architecture.md`.

**Build.** Turning the source code into the finished site in `dist/` (`npm run build`): files are combined,
shrunk and given unique names so browsers can cache them safely.

**Chunk.** A piece of the built JavaScript. Each page is its own chunk, downloaded only when visited.

**CLS (layout shift).** How much content jumps around while a page loads. Google calls under 0.1 "good".
Measured by `npm run check:smooth`.

**Component.** A reusable piece of screen, written as a JavaScript function that returns what to show,
e.g. `ProductCard`. File names match the component (`ProductCard.jsx` + `ProductCard.css`).

**Context / provider.** An app-wide notice board (e.g. who is signed in). A *provider* holds it; any component
reads it with a *hook* such as `useAuth()`.

**Custom claim.** A small label on a signed-in person's account (e.g. `admin: true`) that only the server can
set. The database rules trust it, which is why nobody can make themselves an admin.

**Day / night edition.** The site's two looks: light paper by day, navy paper at night. It follows Kampala's
clock until the visitor uses the switch in the header.

**Emulators.** Local copies of Firebase (Auth, Firestore, Storage) for testing without touching real data
(`firebase emulators:start`).

**Firestore.** Firebase's database. Data is stored as *documents* (records) inside *collections* (lists),
e.g. the collection `products` holds one document per product.

**Hook.** A function whose name starts with `use` that a component calls to read or remember something,
e.g. `useCart()`.

**JSX.** The HTML-like way React components describe what to show: `<p className="lead">Hello</p>`.

**Lazy loading.** Downloading code or images only when they're needed (a page when it's visited, an image when
it scrolls near).

**Lighthouse.** Google's free page-quality test (performance, accessibility, best practices, SEO).
`npm run check:speed` runs it locally.

**Lint.** An automatic read-through of the code that catches mistakes (`npm run lint`, using oxlint).

**Normal map.** A picture whose colours describe which way each tiny bit of a surface faces, so the 3D
lighting can show bumps (the paper's tooth) without extra shapes. The Home model's paper has one
(`hotel-normal-512.webp`, drawn by `scripts/make-hotel-textures.py`).

**Placeholder / TODO.** A clear marker where a fact is still missing (never a made-up value). Visitors see a true
fallback; signed-in team members see "To fill in: …". See `src/lib/pending.js`.

**React.** The library the site's screens are built with: the page is described as components, and React keeps
the screen in step with the data.

**Route.** An address on the site (`/stores`, `/projects/karwani-complex`) and the page it shows. The list is in
`src/routes.jsx`.

**Security rules.** The database's and file storage's own gatekeepers (`firestore.rules`, `storage.rules`):
who may read or write what. They run on Google's side, so they hold even if someone edits the site's code.

**Service worker.** A small script (`public/sw.js`) the browser keeps that saves copies of the site's files, for
fast repeat visits and offline use.

**SEO.** Search-engine optimisation: making each page understandable to Google (titles, descriptions,
sitemap). Handled by `src/data/seo.js` and `scripts/seo-pages.mjs`.

**Tokens.** The named brand values (colours, sizes) in `src/styles/tokens.css`, e.g. `--fc-orange`. Styles use
the names, never raw colour codes.

**UGX.** Uganda shillings. Prices are whole numbers of shillings, shown with `formatUGX()` as "UGX 120,000".

**Vite.** The tool that runs the local site (`npm run dev`) and builds the finished one.
