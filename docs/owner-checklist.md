# Owner checklist: what Formcraft needs to do to launch

> For Emlyn, Peter and Esther. Everything the code can't do by itself: decisions, accounts, payments and
> one-time setup. Work top to bottom; each item says why it matters and roughly how long it takes.
> Claude Code on the office computer can do the command-line steps with you (they're marked **[CC]**).
> Last updated: 2026-10-25.

## 1. Decisions to make first (no cost)

| # | Decision | Why it matters | Where it's used |
| --- | --- | --- | --- |
| 1.1 | **Domain** — decided 2026-10-25: **formcraftdesignconstruction.com** (bought at Hostinger). The bare address is the main one; `www.` redirects to it. Update the social posters, business cards and bios to match. | Google, link previews, email delivery and the sitemap all use one address. Changing it later loses search ranking. | `src/data/seo.js` (`SITE_URL`) |
| 1.2 | **Public email** — formcraftdesign@gmail.com or formcraft@gmail.com (both appear in your materials), or a domain email like hello@formcraftdesignconstruction.com (Hostinger sells email on the domain)? | Shown on every page, in the footer, in Google's business listing. One address everywhere. | Admin → Site details |
| 1.3 | **Firebase project** — decided: **`formcraft2027`**. Create it in console.firebase.google.com (Add project → project ID `formcraft2027`), add a Web app, and give Claude Code its config to paste into `.env.local`. If that ID is taken, pick the closest free one and say which. | Project ids can never be renamed; the code already points at `formcraft2027`. | `.env.local`, `.firebaserc` |
| 1.4 | **Region** — confirm the Firestore location of the project (ideally `africa-south1`, Johannesburg). Functions must use the same region. | Speed for Ugandan visitors; can't be changed after the database is created. | `functions/index.js`, `VITE_FUNCTIONS_REGION` |
| 1.5 | **Team sign-in emails** — the Google accounts Peter Isingoma and Esther Ahumuza will use. | They become admins. | Admin → Team |
| 1.6 | **Posting targets** — posts per week per platform (agree with Esther). | "Generate the year" fills the calendar to these targets. | Admin → Studio → Channels |
| 1.7 | **Occasion colours** — approve the small seasonal palette (holiday/awareness accents) for the brand guide. | Seasonal site themes stay off until approved. | Admin → Studio → Occasions |
| 1.8 | **WhatsApp business number, office address, opening hours.** | WhatsApp buttons only appear once a number is set. | Admin → Site details |
| 1.10 | **Animation timing** — watch the opening, the Home model build and the page reveals, then set them in Admin → Motion (sliders, 1× = default). | The opening uses the saved timing from a visitor's second visit on. | Admin → Motion |
| 1.9 | **Prices** — products, template home plans, design fees shown publicly, tree price + planting partner. | The site shows "UGX [price]" until real prices exist. Never guessed. | Admin → Content |

## 2. Accounts and payments

| # | Account | What to do | Cost (check current pricing) |
| --- | --- | --- | --- |
| 2.1 | **Domain registrar** | Done: Hostinger. Keep the Hostinger login safe and turn on **auto-renew** (an expired domain takes the site and any domain email down). | Yearly fee |
| 2.2 | **Google Cloud billing → Firebase Blaze plan** | console.firebase.google.com → project → Upgrade → Blaze. Add a card. **Set a budget alert** (e.g. US$10/month) in Google Cloud → Billing → Budgets. Needed for Cloud Functions (spam protection, team roles, scheduled posting, payments later). | Pay-as-you-go with a free monthly allowance; a site this size usually costs little. The budget alert emails you before anything surprising. |
| 2.3 | **Buffer** (social publishing) | buffer.com → sign up → connect Instagram, Facebook, LinkedIn, X, TikTok, Pinterest. Choose a plan that allows a full year's queue (the free plan has small limits). Then create an API token (developers.buffer.com) for step 3.9. | Free plan, or paid per channel per month. |
| 2.4 | **Meta Business Suite** | Make sure Instagram @formcraft.ug is a Business/Creator account linked to the Formcraft Facebook Page (Buffer needs this to post to Instagram). | Free |
| 2.5 | **Google Search Console** | search.google.com/search-console → add the domain → verify with a DNS record → submit `https://<domain>/sitemap.xml`. | Free |
| 2.6 | **Google Business Profile** | business.google.com → create "Formcraft Design and Construction Co. Ltd", category architect / construction company, Kampala, phone, website, photos of real work. Often the biggest single win for "architect Kampala" searches. | Free |
| 2.7 | **Google Analytics 4** | Firebase console → Analytics → enable (creates a GA4 property); copy the Measurement ID into `.env.local`. Only loads after a visitor accepts cookies. | Free |
| 2.8 | **reCAPTCHA Enterprise key (App Check)** | Firebase console → App Check → register the web app with reCAPTCHA Enterprise → copy the site key. Stops bots spamming forms. | Free tier is generous |
| 2.9 | **Brevo** (newsletters, later) | brevo.com → sign up when you want to send emails to subscribers. Until then, export subscribers from Admin → Leads. | Free tier, then paid |
| 2.10 | **Flutterwave** (Phase 3 payments) | Business account for MTN/Airtel mobile money and cards. Needed before the shop, tree donations and course payments go live. | Per-transaction fees |
| 2.11 | **Lawyer review** | Have the privacy policy (`/privacy`) checked against Uganda's Data Protection and Privacy Act 2019, and register with the Personal Data Protection Office (PDPO) if required. Add the registration number to the policy. | Legal fee |

## 3. One-time setup (in this order)

1. **[CC] Pull the latest code** on the office computer: `git pull` on branch `paper-edition`, then `npm install` and `npm --prefix functions install`.
2. **[CC] Fill `.env.local`** (never commit it) — add the new lines to the existing Firebase values:
   ```bash
   VITE_FUNCTIONS_REGION=africa-south1          # from 1.4
   VITE_FIREBASE_MEASUREMENT_ID=G-...           # from 2.7
   VITE_RECAPTCHA_SITE_KEY=...                  # from 2.8 (App Check)
   VITE_FUNCTIONS_ENABLED=true                  # after step 3.6 (team roles on sign-in)
   VITE_FORMS_VIA_FUNCTIONS=true                # after step 3.6 (forms through the protected function)
   ```
3. **[CC] Check everything locally**: `npm run lint`, `npm run build`, `npm run preview`, and the emulators (see `docs/handoff.md`).
4. **Blaze plan** (2.2) — required before step 6.
5. **[CC] Deploy the security rules and indexes**: `firebase deploy --only firestore:rules,firestore:indexes,storage`.
6. **[CC] Deploy the functions**: `firebase deploy --only functions`. (Functions: `submitLead`, `claimTeamRole`, `onTeamChange`, and the studio's Buffer publisher.)
7. **[CC] Make Emlyn the owner**: sign in once on the site with formcraftinc@gmail.com, then
   `node scripts/set-admin.js formcraftinc@gmail.com --owner` (the owner is the only one who manages Admin → Team) (needs a service-account key file — Firebase console → Project settings → Service accounts → Generate key; keep it out of the repo). Sign out and back in.
8. **Add Peter and Esther** in Admin → Team (full access; their emails from 1.5). Their access switches on the next time they sign in.
9. **[CC] Buffer token**: `firebase functions:secrets:set BUFFER_TOKEN` (paste the token from 2.3), redeploy functions, then Admin → Studio → Channels → map each channel to its Buffer channel.
10. **Firestore clean-up rule**: Google Cloud → Firestore → TTL → add a policy on collection `rateLimits`, field `expiresAt` (old spam-protection counters delete themselves).
11. **Nightly backups**: Google Cloud → Firestore → Disaster recovery / Backups → create a daily backup schedule (keep 7–14 days).
12. **Lock the web API key**: Google Cloud → APIs & Services → Credentials → the Browser key → Application restrictions → HTTP referrers → add `https://formcraftdesignconstruction.com/*`, `https://www.formcraftdesignconstruction.com/*`, `https://formcraft2027.web.app/*`, `https://formcraft2027.firebaseapp.com/*`, `http://localhost:5173/*`.
13. **Admin 2-step sign-in**: Emlyn, Peter and Esther turn on 2-Step Verification on their Google accounts (myaccount.google.com → Security).
14. **[CC] First deploy of the site**: `npm run build:deploy && firebase deploy --only hosting` (only when you say go; `build:deploy` stops if it can't read which pages are switched off).
15. **Connect formcraftdesignconstruction.com** (after the first deploy; about 15 minutes of clicks, then up to a day of waiting):
    1. Firebase console → project `formcraft2027` → **Hosting** → **Add custom domain** → type
       `formcraftdesignconstruction.com` → leave "redirect" off → Continue. Firebase shows the records to add: a **TXT**
       record (proves you own the domain) and one or two **A** records (point the domain at Firebase). Keep that page open.
    2. In another tab: **hpanel.hostinger.com** → **Domains** → formcraftdesignconstruction.com → **DNS / Nameservers** →
       **DNS records**. (If Hostinger says the domain uses other nameservers, switch to Hostinger's own first.)
    3. **Delete** Hostinger's existing **A** record for `@` (it points at Hostinger's parking page) and any **AAAA** record
       for `@`. Two A records pointing to different places would make the site appear and vanish at random.
       **Don't touch MX or email records** if you use (or will use) Hostinger email.
    4. **Add** each record Firebase showed: Type, Name `@` (Hostinger's word for the bare domain), the value exactly as
       Firebase gives it, TTL left as it is.
    5. Back in Firebase, press **Verify**. It can take minutes to a few hours (up to 24). Firebase then makes the HTTPS
       certificate by itself; the site may show a certificate warning for that hour or so, which is normal.
    6. Add the second domain: **Add custom domain** → `www.formcraftdesignconstruction.com` → tick **Redirect** to
       `formcraftdesignconstruction.com`. In Hostinger, delete any existing `www` CNAME record and add what Firebase shows.
    7. **Authentication** → **Settings** → **Authorized domains** → add `formcraftdesignconstruction.com` and
       `www.formcraftdesignconstruction.com` (without them, "Sign in with Google" fails on the new address).
    8. Check: open https://formcraftdesignconstruction.com and https://www.formcraftdesignconstruction.com (the second
       should land on the first), and sign in once.
16. **Search Console + sitemap** (2.5) and **Business Profile** (2.6) once the domain is live.
17. **After a week live**:
    - Check the browser console for "Content-Security-Policy" reports; if clean, switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `firebase.json`. **[CC]**
    - Turn on App Check **enforcement** for Storage and Functions (Firebase console → App Check), and set `ENFORCE_APP_CHECK=true` for the functions. **[CC]**
18. **Automatic deploys (optional)**: ask Claude Code to add a GitHub Actions deploy job with a Firebase service-account secret, so merging to `main` publishes the site. There's no GitHub CI any more (removed to save money); Claude Code on the office computer runs `npm run check` before every push instead.

## 4. Content only you can provide

- Real project facts approved by clients: client names (with permission), locations, years, briefs, results.
- Photos: finished projects, the workshop, the team (portraits), artisans (with consent).
- The **template home catalogue** PDF (the free download that collects emails) — upload in Admin → Content → Free downloads.
- Template home designs: names, floor areas, architects, plan prices, build-from estimates, renders and plans.
- Products: prices, dimensions, materials, lead times, stock.
- Testimonials — only real ones, with written permission (template FMC-MKT-TST).
- Helpline numbers for sensitive awareness days, confirmed before each post (register care notes).
- The holiday and awareness post images (PNG files from the template library, codes FMC-MKT-HOL / AWR / DAY) — upload them in Admin → Studio; files named with their template code are matched automatically.

## Good to know: switching a page off

Pages are pre-built into the site's HTML at each build. After switching a page **off** in Admin → Pages, ask Claude Code
to rebuild and deploy, so the old pre-built copy of that page is replaced (the live site already shows "opens soon"
once it has loaded, but the HTML would still hold the page until then).

## 5. Weekly routine (once live)

- **Monday**: Admin → Leads — follow up new quotes and messages, set their status.
- **Monday**: Admin → Studio → This week — check and approve the week's posts; confirm any movable dates (Eid, Easter).
- **Daily** (if not using Buffer): Admin → Studio → Today — download, post, mark as posted.
- **Monthly**: export subscribers (CSV) for newsletters; check Search Console for search terms people use.
