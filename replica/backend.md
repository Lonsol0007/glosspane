# Backend

The clone is local-first, like the original: no accounts, no server database.
The backend is two translation routes and a health check.

## What exists

| part | status | where |
| --- | --- | --- |
| Data store | IndexedDB, 7 stores mirroring `schema.sql` | `app/src/lib/db.ts`, `repo.ts` |
| POST /api/translate | page image in, text blocks out (detect + OCR + translate in one Claude vision call, structured output) | `app/src/app/api/translate/route.ts`, `src/lib/server/translator.ts` |
| POST /api/translate/text | retranslate lines of text | `app/src/app/api/translate/text/route.ts` |
| GET /api/health | liveness, and whether a server key is configured | `app/src/app/api/health/route.ts` |
| Jobs | chapter translation runs in the browser, one page at a time, stoppable | `app/src/lib/translate.ts` |
| Backup | JSON export and merge-restore, validated with zod | `repo.ts` |

Provider: Anthropic, official SDK, the reader's own key per request. Default
model `claude-opus-5-5`; Sonnet 5.5 and Haiku 5.5 selectable. Refusal fallback
is switched on for Opus and Sonnet (`fallbacks: "default"`, beta
`server-side-fallback-2026-07-01`), so a declined page is retried on a
fallback model inside the same call.

## Not built, on purpose

- **Auth, sync, Postgres.** Nothing is stored server-side. `schema.sql` is ready for Supabase with row level security if sync is added.
- **Payments.** No paid tier exists yet; pricing is decided in `launch/`. If one is added: Stripe Checkout and the Customer Portal, test mode first.
- **Email.** No accounts, nothing to send.

## You need to do

- Nothing to run it: `cd app && npm run dev`, add your Anthropic API key in Settings.
- Leave `ANTHROPIC_API_KEY` unset on any public deployment. Setting it lets anyone who can open the site translate on your bill.

## Security checklist

- [x] secrets only in env vars, `.env*` in `.gitignore`, nothing in client bundles (the only server secret is optional and never sent to the client; `/api/health` exposes only whether it exists)
- [x] input validated on the server with zod on both routes: image size and alphabet, media type, model allow-list, language restricted to letters (tested with an injection string)
- [x] the reader's key is validated for shape, used for one request, never logged or stored; error messages never echo it
- [ ] authorisation with a second user: not applicable, there are no users or stored records
- [x] rate limits on both routes (per IP, per instance: best-effort on serverless)
- [ ] webhooks verify signatures: not applicable, none
- [x] uploads: none reach the server except one page image per translation, capped at 5 MB, not stored
- [x] no user data in URLs or logs
- [x] `npm audit`: 0 vulnerabilities at install
- [x] privacy policy lists every processor (Vercel, Anthropic): `/privacy`
- [x] page text is treated as data: the system prompt says so, and output is constrained to a schema
- [x] security headers: nosniff, frame deny, no-referrer
- [ ] Content-Security-Policy: not set. Worth adding before launch, since the API key lives in localStorage and any script injection could read it.
