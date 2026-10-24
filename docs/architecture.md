# How the Formcraft website works

A plain-English tour of the whole system: what runs where, how a page gets onto a visitor's screen,
where the information comes from and where it goes. No prior knowledge assumed; words in *italics*
are explained in [glossary.md](glossary.md).

## The big picture

```
 Visitor's phone or computer                       Google Firebase (the "back end")
 ┌──────────────────────────────┐                 ┌───────────────────────────────────────┐
 │ Browser                      │   1. files      │ Hosting   the site's files, worldwide │
 │  ├─ the site (React app)     │ ◄────────────── │           (HTML, JavaScript, images)  │
 │  ├─ service worker (sw.js)   │                 │                                       │
 │  │   keeps a copy for speed  │   2. content    │ Firestore the database: products,     │
 │  │   and offline use         │ ◄────────────── │           projects, posts, settings,  │
 │  └─ localStorage: cart,      │                 │           and everything forms send   │
 │     day/night, cookie choice │   3. forms      │                                       │
 │                              │ ──────────────► │ Storage   uploaded files and photos   │
 │                              │                 │                                       │
 │                              │   4. sign-in    │ Auth      Google sign-in; team roles  │
 │                              │ ◄─────────────► │                                       │
 │                              │                 │ Functions code that runs on Google's  │
 │                              │   5. checks     │           servers: spam checks, team  │
 │                              │ ◄─────────────► │           roles, scheduled posts,     │
 └──────────────────────────────┘                 │           (later) payments            │
                                                  └───────────────────────────────────────┘
                                                          │ later: payment links and confirmations
                                                          ▼
                                                     Flutterwave (MTN / Airtel mobile money, cards, UGX)
```

1. **Files.** Firebase *Hosting* serves the built site (the `dist/` folder from `npm run build`). Each page has
   its own small HTML file (written by `scripts/seo-pages.mjs`) so Google and link previews (WhatsApp,
   Facebook, LinkedIn) see the right title, description and picture for every page.
2. **Content.** Public pages read their content from *Firestore* with plain web requests (the REST API,
   `src/lib/firestoreRest.js`), which is much lighter than loading the full database library. If Firestore has
   nothing yet, the site shows the starter content written in `src/data/`.
3. **Forms.** Contact, quote, investor and email sign-up forms save to Firestore (`src/lib/forms.js`). The
   database's *security rules* (`firestore.rules`) let anyone *create* a submission but only the team *read* it.
   When the paid Firebase plan is on, forms go through the `submitLead` *Cloud Function* instead, which adds
   spam protection and rate limits.
4. **Sign-in.** Google sign-in through Firebase *Auth*. Nobody has to sign in to browse. Team members get
   a role (admin, marketing, editor) stored as a *custom claim* that only the server can set, so nobody can
   make themselves an admin.
5. **Payments (not live yet).** The browser will only ever send *what* someone wants to buy (product ids and
   quantities). A Cloud Function will look up the real prices, create the order and ask Flutterwave for a
   payment link; Flutterwave's confirmation goes to another function that checks it with Flutterwave before
   marking anything paid. The browser never decides a price and never marks anything paid.

## What happens when someone opens a page

1. The browser downloads `index.html` (or the page's own HTML file) and a small script in it picks the
   **day or night edition** before anything is drawn: the visitor's saved choice, or else Kampala's clock.
   It also starts fetching that edition's paper textures and, on a first visit, plays the short opening
   animation (a drawing sheet torn off a pad).
2. `src/main.jsx` loads the shared styles and starts the app (`src/App.jsx`).
3. `App.jsx` wraps everything in four *providers*, the app-wide "notice boards" any component can read:

   | Provider | Holds | Read it with |
   | --- | --- | --- |
   | ThemeProvider | day or night | `useTheme()` |
   | AuthProvider | who is signed in, and their role | `useAuth()` |
   | SiteProvider | admin settings: which pages are on, contact details, animation speed | `useSite()` |
   | CartProvider | the shopping cart (saved on the device) | `useCart()` |

4. The *router* (React Router) looks at the address and picks the page from `src/routes.jsx`. Each page's
   code is downloaded only when it's needed (*lazy loading*), so phones on slow data download less. While it
   downloads, a grey skeleton in the page's shape is shown, never a blank screen.
5. `Layout.jsx` draws what every page shares: the header, the footer (styled as a drawing's title block,
   with a sheet number per page), the plant-a-tree button, the cart drawer, the cookie notice and the
   occasional email sign-up prompt.
6. The page draws itself, reads its content (step 2 above) and animates its sections in as they scroll into
   view (`<Reveal>`).

## The home page's 3D model

`src/components/scene/HotelScene.jsx` decides what each device gets:
- **3D** (`full` or `standard` quality): a three.js paper model of a four-storey hotel builds itself floor by
  floor, then turns gently; visitors can drag, zoom and switch views (Front, Back, Cutaway, Site).
  The 3D code is a separate download that only starts after the page's text is on screen.
- **2D** (`Hotel2D.jsx`): a crisp SVG drawing of the same model, for the slowest devices.

A short frame-rate check after the build picks the level and remembers it on the device for 30 days.
In development only, a draggable panel (bottom right) switches between levels to preview every device.

## Missing facts

The rule: never invent prices, names, numbers or clients. When a fact is missing the code holds a
placeholder: a "TODO: …" note or a word in brackets like "[price]". Visitors never see these: they see a true
fallback ("Price on request", "Photo coming soon") or nothing. Signed-in team members see each one as a dashed
**"To fill in: …"** note, so walking the live site shows what's still needed. See `src/lib/pending.js` and
`src/components/ui/Todo.jsx`.

## Styles

Plain CSS, one file per component, with every class starting with the component's name (`.header-…`,
`.cart-…`). Shared pieces live in `src/styles/`:
- `tokens.css` holds the brand colours and sizes (the **only** place colours are defined), for day and night;
- `fonts.css` holds Satoshi and Clash Grotesk, served from the site itself;
- `base.css` holds layout helpers and the type scale;
- `components.css` holds buttons, cards, forms and other shared pieces.

`npm run check` fails if two stylesheets style the same class.

## The admin page

`/admin` is the team's control room (signed in, with a role):
- switch pages on and off;
- edit the contact details and animation speed;
- add and edit products, template homes, projects, developments, Journal posts, courses and events,
  with photos;
- read form submissions (messages, quotes, investor requests) and the email list;
- plan social-media posts (the "Studio": a marketing calendar).

Admin writes go through the Firebase library (`src/lib/adminContent.js`), and the security rules check the
person's role on every write.

## Checking the work

No paid online service is used. `npm run check` runs everything on the developer's own computer in the
installed Chrome: lint, build, every page at phone, tablet and desktop sizes in both editions, clicks through
the main journeys, every link, accessibility, and a screenshot report. See [checks.md](checks.md).
