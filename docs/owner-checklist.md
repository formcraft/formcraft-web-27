# Owner checklist: what Formcraft needs to do to launch

> For Emlyn, Peter and Esther. Everything the code can't do by itself: decisions, accounts, payments and
> one-time setup. Work top to bottom; each item says why it matters and roughly how long it takes.
> Claude Code on the office computer can do the command-line steps with you (they're marked **[CC]**).
> Last updated: 2026-10-24.

## 1. Decisions to make first (no cost)

| # | Decision | Why it matters | Where it's used |
| --- | --- | --- | --- |
| 1.1 | **Domain** — formcraftdesign.com (on the social posters) or another (e.g. formcraft.co.ug)? | Google, link previews, email delivery and the sitemap all use one address. Changing it later loses search ranking. | `SITE_URL` / `VITE_SITE_URL` |
| 1.2 | **Public email** — formcraftdesign@gmail.com or formcraft@gmail.com (both appear in your materials), or a domain email like hello@formcraftdesign.com? | Shown on every page, in the footer, in Google's business listing. One address everywhere. | Admin → Site details |
| 1.3 | **Firebase project name** — the project is called `fromcraft-2026` (typo). Keep it or create a correctly spelled one **before** any real data goes in? | Project ids can never be renamed. Visitors never see it, but it appears in some links and in Google Cloud. | `.env.local`, `.firebaserc` |
| 1.4 | **Region** — confirm the Firestore location of the project (ideally `africa-south1`, Johannesburg). Functions must use the same region. | Speed for Ugandan visitors; can't be changed after the database is created. | `functions/index.js`, `VITE_FUNCTIONS_REGION` |
| 1.5 | **Team sign-in emails** — the Google accounts Peter Isingoma and Esther Ahumuza will use. | They become admins. | Admin → Team |
| 1.6 | **Posting targets** — posts per week per platform (agree with Esther). | "Generate the year" fills the calendar to these targets. | Admin → Studio → Channels |
| 1.7 | **Occasion colours** — approve the small seasonal palette (holiday/awareness accents) for the brand guide. | Seasonal site themes stay off until approved. | Admin → Studio → Occasions |
| 1.8 | **WhatsApp business number, office address, opening hours.** | WhatsApp buttons only appear once a number is set. | Admin → Site details |
| 1.9 | **Prices** — products, template home plans, design fees shown publicly, tree price + planting partner. | The site shows "UGX [price]" until real prices exist. Never guessed. | Admin → Content |

## 2. Accounts and payments

| # | Account | What to do | Cost (check current pricing) |
| --- | --- | --- | --- |
| 2.1 | **Domain registrar** | Register the domain from 1.1 and keep the DNS login. | Yearly fee (.com is usually cheaper than .co.ug). |
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
   VITE_SITE_URL=https://<your-domain>          # from 1.1
   VITE_FUNCTIONS_REGION=africa-south1          # from 1.4
   VITE_FIREBASE_MEASUREMENT_ID=G-...           # from 2.7
   VITE_RECAPTCHA_SITE_KEY=...                  # from 2.8 (App Check)
   VITE_FUNCTIONS_ENABLED=true                  # after step 3.6 (team roles on sign-in)
   VITE_FORMS_VIA_FUNCTIONS=true                # after step 3.6 (forms through the protected function)
   ```
   For the production build, also set `SITE_URL=https://<your-domain>` when running `npm run build`.
3. **[CC] Check everything locally**: `npm run lint`, `npm run build`, `npm run preview`, and the emulators (see `docs/handoff.md`).
4. **Blaze plan** (2.2) — required before step 6.
5. **[CC] Deploy the security rules and indexes**: `firebase deploy --only firestore:rules,firestore:indexes,storage`.
6. **[CC] Deploy the functions**: `firebase deploy --only functions`. (Functions: `submitLead`, `claimTeamRole`, `onTeamChange`, and the studio's Buffer publisher.)
7. **[CC] Make Emlyn the first admin**: sign in once on the site with formcraftinc@gmail.com, then
   `node scripts/set-admin.js formcraftinc@gmail.com` (needs a service-account key file — Firebase console → Project settings → Service accounts → Generate key; keep it out of the repo). Sign out and back in.
8. **Add Peter and Esther** in Admin → Team as admins (their emails from 1.5). Their access switches on the next time they sign in.
9. **[CC] Buffer token**: `firebase functions:secrets:set BUFFER_TOKEN` (paste the token from 2.3), redeploy functions, then Admin → Studio → Channels → map each channel to its Buffer channel.
10. **Firestore clean-up rule**: Google Cloud → Firestore → TTL → add a policy on collection `rateLimits`, field `expiresAt` (old spam-protection counters delete themselves).
11. **Nightly backups**: Google Cloud → Firestore → Disaster recovery / Backups → create a daily backup schedule (keep 7–14 days).
12. **Lock the web API key**: Google Cloud → APIs & Services → Credentials → the Browser key → Application restrictions → HTTP referrers → add `https://<domain>/*`, `https://<project>.web.app/*`, `https://<project>.firebaseapp.com/*`, `http://localhost:5173/*`.
13. **Admin 2-step sign-in**: Emlyn, Peter and Esther turn on 2-Step Verification on their Google accounts (myaccount.google.com → Security).
14. **[CC] First deploy of the site**: `SITE_URL=https://<domain> npm run build && firebase deploy --only hosting` (only when you say go).
15. **Custom domain**: Firebase console → Hosting → Add custom domain → add the DNS records at the registrar. HTTPS is automatic.
16. **Search Console + sitemap** (2.5) and **Business Profile** (2.6) once the domain is live.
17. **After a week live**:
    - Check the browser console for "Content-Security-Policy" reports; if clean, switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `firebase.json`. **[CC]**
    - Turn on App Check **enforcement** for Storage and Functions (Firebase console → App Check), and set `ENFORCE_APP_CHECK=true` for the functions. **[CC]**
18. **Automatic deploys (optional)**: ask Claude Code to add a GitHub Actions deploy job with a Firebase service-account secret, so merging to `main` publishes the site. Every push already runs lint, build and a speed check (`.github/workflows/ci.yml`).

## 4. Content only you can provide

- Real project facts approved by clients: client names (with permission), locations, years, briefs, results.
- Photos: finished projects, the workshop, the team (portraits), artisans (with consent).
- The **template home catalogue** PDF (the free download that collects emails) — upload in Admin → Content → Free downloads.
- Template home designs: names, floor areas, architects, plan prices, build-from estimates, renders and plans.
- Products: prices, dimensions, materials, lead times, stock.
- Testimonials — only real ones, with written permission (template FMC-MKT-TST).
- Helpline numbers for sensitive awareness days, confirmed before each post (register care notes).
- The holiday and awareness post images (PNG files from the template library, codes FMC-MKT-HOL / AWR / DAY) — upload them in Admin → Studio; files named with their template code are matched automatically.

## 5. Weekly routine (once live)

- **Monday**: Admin → Leads — follow up new quotes and messages, set their status.
- **Monday**: Admin → Studio → This week — check and approve the week's posts; confirm any movable dates (Eid, Easter).
- **Daily** (if not using Buffer): Admin → Studio → Today — download, post, mark as posted.
- **Monthly**: export subscribers (CSV) for newsletters; check Search Console for search terms people use.
