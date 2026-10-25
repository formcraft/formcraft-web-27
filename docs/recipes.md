# Recipes: how to do common jobs

Step-by-step instructions for everyday changes. After any of them, run `npm run check:fast` (or the full
`npm run check`) and look at the screenshots in `check-report/index.html`. See [checks.md](checks.md).

---

## Change a price, a product, a project or a post (no code)

Sign in on the live site with a team account → **Admin → Content** → pick the list (Shop products, Template home
designs, Projects, Developments, Journal posts, Courses, Events) → **Edit** or **Add**. Photos can be uploaded
there. Untick "Show on the site" to hide something without deleting it.

The first time you use a list, **Import the starter list** copies the built-in examples from `src/data/` so you can
edit them. From then on the site shows what's in Firestore.

## Change the phone number, WhatsApp, email, address or opening hours (no code)

**Admin → Site details.** They appear in the footer, the Contact page and the Privacy page at once. Fields left
empty simply don't show.

## Turn a feature off or on (no code)

**Admin → Features**: the opening animation, the email sign-up prompt, the plant-a-tree button, the 3D model on Home
(off = everyone sees the 2D drawing) and the falling paper scraps. Visitors get the change on their next page load
(the opening animation from their second visit). To add a switch for new code: an entry in `src/data/features.js`,
then `useFeature("key")` where the feature is shown.

## Turn a page off or on (no code)

**Admin → Pages.** A page that's off disappears from the header, footer and home page for visitors, and its
address shows a "not open yet" page. The team still sees it, marked "Hidden".

## Add a new page

1. Create `src/pages/MyPage.jsx`:
   ```jsx
   import { usePageMeta } from "../hooks/usePageMeta";
   import { PageHero } from "../components/page/PageHero";
   import "./MyPage.css";

   // MyPage: what this page is for, in one sentence.
   export const MyPage = () => {
       usePageMeta("My page", "One sentence for Google and link previews (up to 155 characters).");
       return (
           <div className="mypage">
               <PageHero eyebrow="Section" title="The headline." lead="One or two sentences." sheet="A900" />
           </div>
       );
   };
   ```
   and `src/pages/MyPage.css` (classes start with `.mypage-`).
2. Add it to the list in `src/routes.jsx`: `["/my-page", "MyPage"],`.
3. If the admin should be able to switch it off, add it to `src/data/pages.js`.
4. Give it a title, description and preview in `src/data/seo.js` (`ROUTES`), and a sheet number in
   `src/data/sheets.js` (shown in the footer's title block).
5. To link it from the menu, add it to `src/data/nav.js`.
6. **Renamed an existing page?** Add a redirect from the old address at the bottom of `src/routes.jsx`, so old
   links keep working.

## Read something from the visitor's device in a component

Pages are pre-rendered, so React's first render must match the built HTML. Don't read storage, the clock, the screen
or the edition while rendering; use `useDeviceState(() => readValue(), fallback)` (`src/hooks/useHydration.js`): the
build and the first render use `fallback`, the device's value follows straight after. For markup that differs by
edition, render both and let the CSS pick (`[data-theme="night"] …`). `npm run check` fails on a mismatch.

## Change a colour

Only in `src/styles/tokens.css`. Brand colours are the `--fc-…` tokens, and the day and night values of each
theme colour (`--ink`, `--sheet`, …) are set there too. Never write a colour code anywhere else (CSS or JSX):
use the token name, e.g. `color: var(--fc-rust);`. Brand rules: use #F1F1F1 instead of white and #171D1A instead
of black; division pages keep navy and orange and add only their own accent.

## Change the words on a page (no code)

**Admin → Copy** (signed in as a team member). Pick the page, find the text (search, or the filters), change it,
then **Save draft** and open **Preview drafts on the page** to see it in place (only the team sees drafts). When it
reads well, **Publish**: visitors see it on their next page load. **Back to the original** undoes it; every change
is listed under "Recent changes". Use `**bold**`, `*italic*` and line breaks; nothing else. Headings and
paragraphs can be made a size smaller or larger. Stay within the character limit shown. Pages not in Admin → Copy
yet (everything except Home, until copy step B) are changed in code, below.

## Add or change text (code)

For a page in the copy register (`src/data/copy.js`), change the built-in wording there; it's what visitors see
until someone publishes an edit in Admin. To put a page into Admin → Copy: add its entries to `COPY` (ids never
reused), then in the page `const t = useCopy("<page key>")` and `{t("id")}` (or `t.str("id")` for alt text and
labels). Keep the defaults identical to today's text and compare before and after. Otherwise edit the page's file
in `src/pages/`. Keep the voice in `CLAUDE.md` ("Writing on the site"): quietly confident,
plain, no hard selling. **Never invent** a fact, price, client, number or quote. When something isn't known yet,
leave a placeholder the visitor won't see:

```jsx
import { Todo } from "../components/ui/Todo";

<p className="body">
    Collect from the workshop in Kampala. <Todo>TODO: workshop address and opening hours.</Todo>
</p>
```

Signed-in team members see that note as "To fill in: …". For text that comes from data (which may start with
"TODO"), use `<Fact text={item.summary} />` or `<PartFact text={…} />`. `npm run check` fails if a visitor could
see a raw placeholder.

## Add an image

Save it as WebP in `public/images/` twice: `name.webp` (about 1600 px wide) and `name-800.webp` (800 px wide, for
phones). Then use `<Photo name="name" alt="what the image shows" />`. With no image yet, leave out `name`:
the frame shows "Photo coming soon".

## Add an icon

Add its shapes (drawn on a 24 × 24 grid) to `PATHS` in `src/components/ui/Icon.jsx`, then use
`<Icon name="myIcon" />`. Icons take the colour of the text around them.

## Give someone admin rights

**Only the owner** (Emlyn Atochon) adds people to the team. Once the paid plan and Cloud Functions are on:
**Admin → Team** (everyone gets the same full access unless the owner picks a limited role). Until then, on the
developer's computer:
```bash
npm install --no-save firebase-admin
node scripts/set-admin.js formcraftinc@gmail.com --owner        # once: the owner
node scripts/set-admin.js person@example.com                    # full team access
node scripts/set-admin.js person@example.com --role marketing   # a limited role (or --role editor)
```
The person signs out and back in to pick it up. (Against the emulators, put
`FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` in front.)

## Publish the site (only when the owner says go)

```bash
npm run check                                              # must pass
SITE_URL=https://<the domain> npm run build
firebase deploy --only hosting                             # the site
firebase deploy --only firestore:rules,firestore:indexes,storage   # when the rules changed
```
