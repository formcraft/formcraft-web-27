# Formcraft website

The website of **Formcraft Design and Construction Co. Ltd**, Kampala, Uganda: an integrated design-build firm
(BIM/CAD design studio, construction, precast concrete, furniture and joinery) working with local artisans.

> *Designing spaces. Empowering communities.*

Private property of Atochon / Formcraft. Not open source.

---

## Start here

| If you want to… | Read |
| --- | --- |
| understand what the site is and how it fits together | [docs/architecture.md](docs/architecture.md) |
| find your way around the folders | [docs/folders.md](docs/folders.md) |
| look up a word (route, hook, Firestore, emulator…) | [docs/glossary.md](docs/glossary.md) |
| do a common job (add a page, a product, change a colour…) | [docs/recipes.md](docs/recipes.md) |
| check your work before you commit | [docs/checks.md](docs/checks.md) |
| know the rules everyone (people and AI) follows | [CLAUDE.md](CLAUDE.md) |
| see what's planned | [docs/build-plan.md](docs/build-plan.md) |
| see what exists today, file by file | [docs/current-code.md](docs/current-code.md) |
| see what the owner still has to do before launch | [docs/owner-checklist.md](docs/owner-checklist.md) |

## Run it on your computer

You need **Node.js 20 or newer** and **Git**. For the database emulators you also need **Java 21** and the
Firebase command-line tools (`npm install -g firebase-tools`).

```bash
npm install                 # once: downloads the libraries the site uses
cp .env.example .env.local  # once: then fill in the Firebase web-app values (ask the owner)
npm run dev                 # the site at http://localhost:5173 (changes appear as you save)
```

Optional, for forms, sign-in and the admin page without touching real data:

```bash
firebase emulators:start --import=emulator-data   # local copies of Auth, Firestore and Storage
```

## The everyday commands

```bash
npm run dev          # local site with live reload
npm run lint         # read the code for mistakes
npm run build        # build the finished site into dist/
npm run check        # the full offline quality check (lint, build, every page in Chrome, clicks, links)
npm run check:fast   # the same, quicker (fewer screen sizes)
npm run check:smooth # how smooth each page feels (layout shift, scrolling)
npm run check:speed  # Google Lighthouse scores, run locally
```

Nothing is published to the internet unless the owner asks for it (`firebase deploy`).

## Built with

React 19 · React Router 6 · Vite · plain CSS · three.js (the 3D model on the home page) ·
Firebase (Hosting, Auth, Firestore, Storage, Cloud Functions) · Flutterwave for payments (UGX, mobile money and cards).
