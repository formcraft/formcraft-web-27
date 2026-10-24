# Checking the work

All checks run on the developer's own computer, for free, in the Chrome (or Edge) already installed. There is
no paid online CI. Run them before every commit; the rule in `CLAUDE.md` is that `npm run check` passes with
no errors.

| Command | Time | What it checks |
| --- | --- | --- |
| `npm run lint` | seconds | the code, for mistakes (oxlint) |
| `npm run build` | seconds | that the site builds; also writes the per-page SEO files |
| `npm run check:fast` | ~6 min | everything below, at phone and desktop sizes only |
| `npm run check` | ~12 min | the full check |
| `npm run check:smooth` | ~5 min | how smooth each page feels |
| `npm run check:speed` | ~4 min | Google Lighthouse scores |

## `npm run check`: the full offline check

Steps, in order (the code is in `scripts/check/`, one file per part):
1. **Lint** and **build**.
2. **CSS collisions** (`css-collisions.mjs`): fails if two stylesheets style the same class name. A clash once
   made every section heading on the site collapse over its text.
3. **Files**: a page for every address in the sitemap, plus `sitemap.xml` and `robots.txt`.
4. **Size budget**: the first JavaScript a phone downloads stays under 250 kB (gzipped).
5. **Every page** (`page-checks.mjs`) at 360, 768 and 1440 px wide, in the day and night editions, in Chrome with the
   **internet blocked** (so the result depends only on the site). It scrolls each page like a visitor, then flags:
   - text sitting on top of other text, running off the screen, or cut off by its box;
   - floating pieces (plant-a-tree button, pop-ups) colliding or covering text;
   - not exactly one main heading; a missing title or description;
   - broken images; script errors;
   - **placeholders a visitor could see** ("TODO", "[price]");
   - accessibility problems found by axe (contrast, labels, …).
6. **Clicks** (`click-checks.mjs`): uses the site like a visitor:
   - old addresses redirect; the 404 page offers a way back;
   - Tab starts at "Skip to content"; the phone menu opens and closes with Escape;
   - the day/night switch works and is remembered;
   - the cart: add, change the quantity, close;
   - the plant-a-tree pop-up stays by its button;
   - the cookie notice remembers its answer;
   - empty forms show what's missing;
   - the home page's model or drawing loads and its view buttons work.
7. **Links**: every link between pages is followed; none may land on the 404 page.
8. **Report**: `check-report/index.html` with every finding and screenshots of every page.

**Errors** fail the check (exit code 1). **Warnings** are worth a look but don't fail it.

Options: `--fast`, `--no-build` (reuse `dist/`), `--only /path` (repeat for more pages), `--no-axe`, `--no-shots`,
`--headed` (watch the browser).

## `npm run check:smooth`

For each page, as a desktop and as a mid-range phone (360 px wide, processor slowed 4×):
- **layout shift (CLS)**: content jumping while it loads (good: under 0.1);
- **blocking time**: how long the page is frozen while loading;
- **scrolling**: real mouse-wheel scrolling with every frame timed (frames per second, share of slow frames,
  the worst frame).

Results go to `check-report/smooth.json`. For a closer look at one page:
- `node scripts/check/shift-detail.mjs /page` lists which elements shift;
- `node scripts/check/scroll-profile.mjs /page` shows where scrolling time goes.

## `npm run check:speed`

Google Lighthouse (mobile) for a few key pages: Performance, Accessibility, Best practices, SEO. Reports go to
`check-report/speed/`. Lighthouse is downloaded by `npx` the first time.

## Before publishing

Run `npm run check` (no errors), then look through `check-report/index.html` at phone and desktop in both
editions. Then build with the real domain: `SITE_URL=https://… npm run build`.
