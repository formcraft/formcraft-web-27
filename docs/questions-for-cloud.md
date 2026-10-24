# Questions for the cloud session: copy editor, permissions, social calendar (2026-10-24)

> From the local Claude Code, at the owner's request. The owner has approved the plan below
> (ideas log #21) and will start building **once you've answered**. Please reply under each question
> (write "agree", "change: …" or "object: …" plus a line of why), commit, push, and tell the owner.
> Please `git pull` first: the latest local commit is `8a3c7da` (UI beauty pass).

## What the owner decided (chat, 2026-10-24)

1. **Admin → Copy.** Every piece of text on the site (headlines, paragraphs, buttons, form labels and
   messages, page titles and Google descriptions) can be edited from Admin: page by page, in the order it
   appears, with a length limit and counter per piece, "preview on the page", Save draft / Publish, history
   with "back to the original", filters (changed, missing facts, near the limit) and search.
   - **Text size:** presets only (Smaller · Standard · Larger, inside the brand type scale) plus bold. No
     free font sizes, so an edit can't break a layout or the Brand Guide.
   - **Locked:** the tagline and anything else the Brand Guide fixes. Missing facts stay team-only
     (`<Todo>` / `<Fact>`) until a real fact is typed.
2. **Permissions.** One **owner, Emlyn Atochon**, who alone manages Admin → Team and decides what each
   person can do. Everyone else on the team gets the **same full access** for now. The owner can later add
   roles without code changes (e.g. Blog writer, Reviewer, Sales), because the team will grow.
3. **Journal review.** Writers draft posts → In review → Approved → Published, with comments and
   "approved by" (the same pattern as Studio social posts).
4. **Social calendar.** The occasions calendar and its posts feed every channel: Instagram, Facebook, X,
   LinkedIn and TikTok through Buffer; **WhatsApp Status by hand** (no public API that we know of): a
   phone-friendly "Today" queue with "Save image", "Copy caption" and "Mark as posted"; Pinterest by hand
   for now. A calendar view shows occasions and posts side by side, coloured by channel and status, with a
   warning when an occasion has no post.

**Build order (proposed):** A. pilot: text register, `useCopy` helper, Admin → Copy and the new
permissions, Home converted, on a `try/` branch for the owner to review. B. the other pages and a
"check with live text" run in `npm run check`. C. Journal review, the calendar view and WhatsApp
"Today" queue, then later "edit on the page".

## Questions

### Copy editor

1. **Storage shape.** Proposal: defaults stay in the code (a register, `src/data/copy.js`: key like
   `home.hero.lead`, page, section, kind, max length, locked); saved edits in Firestore `copy/{pageKey}`
   (one small document per page), read over REST like `useContent` and cached in localStorage. Agree, or do
   you prefer one document or a subcollection per key (history)?
   **Reply:**

2. **History.** Proposal: `copy/{pageKey}/history/{autoId}` with key, old, new, who, when; "back to the
   original" just deletes the override. Agree?
   **Reply:**

3. **First-visit swap.** A first-time visitor sees the built-in text, then edited text swaps in after the
   REST read (returning visitors get the cached copy at once). Proposal: accept it for now, fold published
   edits back into the register from time to time, and remove it for good with pre-rendering (ideas #20).
   Would you rather read the copy document together with `settings/site` in `SiteContext`, or hide only
   edited strings until loaded?
   **Reply:**

4. **SEO heads.** `scripts/seo-pages.mjs` bakes titles and descriptions from `src/data/seo.js` at build time,
   and `usePageMeta` makes `seo.js` win on static routes. Proposal: page titles and descriptions become copy
   keys; the live page uses the edit, the pre-built head picks it up at the next build (the panel says so).
   Does that conflict with anything you have planned for SEO?
   **Reply:**

5. **Who converts the pages.** Step B touches about 30 page files (`src/pages/*`). Proposal: the local side
   does the pilot and step B, folder by folder, announced in `docs/handoff.md`; you avoid large edits to
   `src/pages/*` while it runs. Are you mid-way through anything in `src/pages/*` that we should wait for?
   **Reply:**

### Permissions

6. **Owner claim.** Proposal: a custom claim `owner: true` (set once with `scripts/set-admin.js --owner`,
   never from the website); everyone on the team keeps `admin: true`. Firestore rules: only `owner` writes
   `team/*` and the role definitions; `onTeamChange` / `claimTeamRole` copy the person's permissions into
   their claims. Does this fit how you wrote `functions/index.js` and the current `role: marketing|editor`
   claims? What would you change?
   **Reply:**

7. **Roles the owner can create.** Proposal: `settings/roles/{roleId}` = a label plus a list of permission
   names (`content`, `copy`, `studio`, `leads`, `inbox`, `journal.write`, `journal.review`, `team`…), and
   the rules check permissions from the claims (`request.auth.token.perms`). Claims are limited to 1000
   bytes, so permissions must stay short names. Agree, or would you keep fixed roles in code?
   **Reply:**

8. **Today's roles.** Moving everyone to full access drops `role: marketing` and `role: editor`. Any rules,
   Studio screens or functions that depend on those and need migrating (for example `isEditor` limits in
   `firestore.rules` and the Studio)?
   **Reply:**

### Social calendar and posting

9. **Buffer and TikTok.** `functions/studio.js` notes that TikTok and YouTube may need extra metadata.
   Have you confirmed what Buffer needs for TikTok? Anything else blocking automatic posting to Instagram,
   Facebook, X, LinkedIn and TikTok once the owner connects Buffer and switches on Blaze?
   **Reply:**

10. **WhatsApp Status.** We know of no API that posts a Status (the WhatsApp Business API sends messages,
    not Status). If you know otherwise, say so. Otherwise: agree with the "Today" queue on the phone (Save
    image, Copy caption, Mark as posted)?
    **Reply:**

11. **Calendar view.** Is the existing Studio Calendar the right place for the "occasions and posts side by
    side" view, or would you build it as a new tab?
    **Reply:**

### Other open items

12. **Pre-rendering (ideas #20).** Your view on pre-rendering the public routes at build time (Lighthouse
    mobile 41–61; ~4.7 s render delay)? It would also remove the copy swap. Before or after the copy editor?
    **Reply:**

13. **Branch `try/auto-live`.** You asked for it to be deleted after the port. OK for the local side to
    delete it on GitHub now?
    **Reply:**

14. **UI beauty pass (`8a3c7da`).** Any objection to the changes (email prompt bottom right and tucking
    away, `.placeholder` drawing-sheet tile, Home/Stores/About fixes)? See the change log row in
    `docs/current-code.md`.
    **Reply:**

15. **Anything we missed** in the plan above?
    **Reply:**
