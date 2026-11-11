# Deploy checklist: Glosspane

Date: 2026-11-11  Commit: none (work is uncommitted)  Go from user: not yet

**Status: not deployed.** One preflight gate fails, and deploying needs your
accounts and your go in any case.

## Preflight

- [x] e2e suite green: 33 passed / 33 (plus 26 / 26 unit tests)
- [x] no open S1 or S2 bugs (8 found, 8 fixed; see `bugs.md`)
- [ ] **parity: all must-haves done. FAILS: 28 of 31, feature score 90.8.** The three open must-haves are detect, read and translate against the live provider. They are built and pass against a stub; no real call has been made because there was no API key here.
- [x] rebrand sweep clean (`sweep.py` exit 0)
- [x] store listing passes (`listing.py` 0 errors, 0 warnings); not shipping to stores in v1
- [x] production build passes (`next build`, exit 0)
- [x] privacy policy and terms exist at `/privacy` and `/terms`, listing Vercel and Anthropic. Not yet live, and the contact line points at "the address published on this site": add a real one.
- [x] account deletion: no accounts. Settings, "Delete everything" removes all local data including the key (tested).
- [ ] favicon, titles, app icon are yours: yes, but the icon is a placeholder. No social preview image.
- [x] dependencies: `npm audit` 0 vulnerabilities
- [x] cookie banner: not needed, the app sets no cookies and runs no analytics

## To clear the failing gate

1. `cd app && npm run dev`
2. Settings, paste your Anthropic API key.
3. Add a real chapter, open it, press Translate on three different kinds of page.
4. If the boxes sit on the text and the translation reads right, set the three rows in `features.csv` to `yes` and rerun `parity.py`. If not, tell me what you see and I will fix it before anything ships.

## Production (when you say go)

No database, no Stripe, no OAuth, no email. That leaves:

- [ ] Commit the work and push `app/` to a GitHub repository you own.
- [ ] Vercel: import the repository, root directory `app`, framework Next.js. `main` deploys, pull requests get previews.
- [ ] Env vars: **none.** Leave `ANTHROPIC_API_KEY` unset on a public deployment. If it is set, anyone who opens the site translates on your bill.
- [ ] Function limits: `/api/translate` asks for up to 120 seconds (`maxDuration`). Check your Vercel plan allows that, or lower it and watch for timeouts on dense pages.
- [ ] Request size: the route accepts up to about 6.7 MB of JSON. Check the host's body limit; pages are downscaled to 1568 px JPEG first, so real requests are far smaller.

## Domain (after you buy it, at any registrar)

| record | name | value |
| --- | --- | --- |
| A | @ | the apex IP Vercel shows in the project's domain settings |
| CNAME | www | `cname.vercel-dns.com` |
| TXT | as asked | Vercel's verification value, if it asks |

- [ ] choose apex or www as canonical; redirect the other
- [ ] HTTPS valid (automatic on Vercel; check it)
- No email DNS needed: the app sends no email.

## Watch, first week

- [ ] error tracking on the two API routes: status codes and durations only, never bodies or keys
- [ ] uptime check on `/api/health`
- [ ] 429s and 5xx from `/api/translate`: the in-memory rate limit is per instance, so watch for abuse and move it to a shared store if needed
- [ ] the core flow on the live site, on a desktop and on your phone: add a file, read, translate a page, back up, restore

## Before a public launch (from `launch-plan.md`)

Service worker for offline start; Content-Security-Policy header; real hero
screenshot; name checks and legal advice on the name and on paid translation.

## Mobile

No native app. The web app installs to the home screen. A store release
would need a wrapper, developer accounts (yours), and the review questions
noted in `launch-plan.md`.
