# Where everything lives

A map of the project. Every source file also starts with a short note saying what it is for.

```
formcraft-web-27/
├─ README.md               start here
├─ CLAUDE.md               the rules everyone follows (people and AI)
├─ index.html              the one HTML page the app starts from; picks day/night before anything shows
├─ package.json            the libraries the site uses, and the npm commands
├─ vite.config.js          settings for Vite, the tool that builds the site
├─ firebase.json           Firebase Hosting settings: security headers, caching, emulator ports
├─ .firebaserc             which Firebase project this folder belongs to (formcraft2027)
├─ firestore.rules         who may read and write each part of the database
├─ storage.rules           who may read and upload files
├─ firestore.indexes.json  database indexes for the queries the site runs
├─ .env.example            the settings file to copy to .env.local (never commit .env.local)
├─ docs/                   all the written documentation (this folder)
├─ public/                 files served as they are
├─ src/                    the site's code (below)
├─ functions/              code that runs on Google's servers (Cloud Functions)
├─ scripts/                tools developers run on their own computer
└─ emulator-data/          saved test data for the local emulators (not in Git)
```

## `src/`: the site's code

| Folder | What's in it | Examples |
| --- | --- | --- |
| `main.jsx`, `App.jsx`, `routes.jsx` | the start-up code, the app's outer shell, and the list of pages | |
| `pages/` | one file per page (`Name.jsx`) with its own styles (`Name.css`) | `Home.jsx`, `Stores.jsx`, `Contact.jsx`, `Admin.jsx` |
| `components/layout/` | what every page shares | `Header`, `Footer`, `Layout`, `DonateFab` (plant-a-tree), `ConsentBanner` |
| `components/page/` | building blocks for pages | `PageHero` (the top of a page), `Section`, `Photo` |
| `components/ui/` | small reusable pieces | `Icon`, `Logo`, `Drawer`, `Popover`, `Reveal`, `TornEdge`, `Todo` |
| `components/shop/` | the store | `ProductCard`, `CartButton`, `CartDrawer` |
| `components/forms/` | forms used on several pages | `QuoteForm`, `SubscribeForm`, `Honeypot` (spam trap) |
| `components/scene/` | the drawn scenery and the home page's model | `HotelScene` (3D), `Hotel2D`, `PaperLayers`, `Sky` |
| `components/admin/` | the admin page's panels | `ContentPanel`, `LeadsPanel`, `PagesPanel`, `studio/` (marketing calendar) |
| `components/auth/` | sign-in | `SignInDialog` |
| `context/` | app-wide information ("providers") | `AuthContext`, `CartContext`, `SiteContext`, `ThemeContext` |
| `hooks/` | small functions components call to read shared information | `useAuth`, `useCart`, `useContent`, `usePageMeta`, `useOnScreen` |
| `lib/` | helpers with no screen of their own | `money.js` (prices), `forms.js` (sending forms), `storage.js` (saving on the device), `pending.js` (missing facts) |
| `data/` | starter content and fixed lists, until it moves into Firestore | `products.js`, `projects.js`, `posts.js`, `nav.js` (the menu), `seo.js` (titles and descriptions) |
| `styles/` | shared styles, loaded once | `tokens.css` (colours), `fonts.css`, `base.css`, `components.css` |
| `config/firebase.js` | the one place Firebase is set up | |

## `public/`

Files copied into the built site unchanged:
- `fonts/`: Satoshi and Clash Grotesk.
- `logos/`: the official Formcraft and division logos (never redraw them).
- `images/`: renders and photos, each as `name.webp` (1600 px) and `name-800.webp` for phones.
- `textures/`: the paper backgrounds.
- `og/`: link-preview pictures.
- `sw.js`: the service worker that keeps a copy of the site for speed and offline use.

## `functions/`

Code that runs on Google's servers. It needs the paid Firebase plan, and isn't live yet:
- `index.js`: `submitLead` (checks and saves form submissions, with spam limits), `claimTeamRole` and
  `onTeamChange` (team roles).
- `studio.js`: posts approved social-media posts through Buffer.

## `scripts/`

| Script | What it does |
| --- | --- |
| `check/` | the offline checks (`npm run check`, `check:fast`, `check:smooth`, `check:speed`), see [checks.md](checks.md) |
| `seo-pages.mjs` | after a build: one HTML file per page with its own title and description, plus `sitemap.xml` and `robots.txt` |
| `set-admin.js` | gives a person the admin role (or marketing / editor) |
| `make-og.mjs` | draws the link-preview pictures |
| `make-textures.py` | draws the paper textures |
| `make-hotel-textures.py` | draws the paper and its relief (normal map) for the Home 3D model |
