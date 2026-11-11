# Architecture: a rebuild of Mihon's core reader, with Koharu-style translation

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript, installable as a PWA | pack default; one codebase for phone and desktop browsers |
| styling | Tailwind, tokens from replica-design | pack default |
| database | IndexedDB in the browser, through Dexie | the original is on-device with no account; page images are hundreds of MB and belong on the device, not a server |
| cloud database | none in v1. `schema.sql` is written for Postgres so sync can be added without a redesign | one database at a time |
| auth | none in v1 | the original has no accounts; nothing is stored server-side |
| payments | none in v1 | pricing is decided in replica-launch; Stripe Checkout if a paid tier is chosen |
| email | none | no accounts |
| jobs | in-browser queue for chapter translation | work is per-device and must be stoppable |
| files | IndexedDB blobs; archives unpacked in the browser with fflate | user's files never leave the device except a page sent for translation |
| translation | Claude vision through one server route; the user's own API key, sent per request, never stored server-side | detection + OCR + translation in one multimodal call replaces Koharu's three local models |
| hosting | Vercel | pack default; the one route is a serverless function |

## Schema

Tables: 8. Access rules: v1 is single-user on-device, so there is no
cross-user access to guard. `schema.sql` carries a `user_id` on every owned
table and row level security policies, ready for Supabase if sync is added.
The Dexie stores in `src/lib/db.ts` mirror these tables one to one (numeric
auto-increment ids locally, same columns).

See `replica/schema.sql`.

Hard constraints from recon:
- one history row per chapter (`unique (chapter_id)`), so re-reading updates rather than duplicates
- one translation per page per language (`unique (chapter_id, page_index, target_lang)`), so reruns upsert
- a series is unique per `(source, url)`, so importing the same file twice does not duplicate it
- category names are unique case-insensitively

## API

Server routes (the only server code):

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/translate | detect text regions, OCR and translate one page | anyone with their own provider key (header `x-api-key`), rate limited per IP | `{ image: base64, mediaType, targetLang, sourceLang?, model?, stages[] }`, image <= 5 MB | `{ blocks: [{ bbox:[x,y,w,h] 0..1, source, sourceLang, translation }] }` | F07, F08 |
| POST /api/translate/text | translate or retranslate text blocks without an image | same | `{ texts: string[], targetLang, context? }` | `{ translations: string[] }` | F09 |
| GET /api/health | liveness | anyone | — | `{ ok: true }` | deploy |

Client data layer (functions in `src/lib/repo.ts`, called from screens):

| function | does | flow |
| --- | --- | --- |
| importFiles(files) | unpack archives, create manga, chapters, pages | F01 |
| getLibrary(filter, sort) | favourites with unread counts and categories | F02, F04 |
| getManga(id), getChapters(mangaId) | series page | F02 |
| setChapterRead / setBookmark / markPreviousRead | progress | F05 |
| saveProgress(chapterId, page) | last page read, history upsert, read when on last page | F02, F03 |
| getHistory(), removeHistory(), clearHistory() | history | F03 |
| getUpdates() | chapters by fetch date | — |
| categories CRUD, setMangaCategories | organise | F04 |
| exportBackup(), restoreBackup(file) | JSON backup without page images | F06 |
| getTranslation / saveTranslation / updateBlock / deleteBlock | translation cache and proofreading | F07-F09 |

Webhooks in: none. Webhooks out: none.
Jobs: `translateChapter` — in-browser, sequential, one page at a time, cancellable; commits each page as it finishes.

## The parts that bite

- storage: browsers evict IndexedDB under pressure. Call `navigator.storage.persist()` on first import and show usage in settings.
- file size limits: unpack archives streaming-free but one at a time; reject archives over 1 GB with a clear message; pages sent for translation are downscaled to 1568 px on the long edge and re-encoded as JPEG to stay under 5 MB.
- idempotency: importing the same archive twice hits the `(source, url)` uniqueness and updates instead of duplicating; rerunning translation upserts and keeps blocks the user edited.
- races: page turns fire fast. Progress writes are last-write-wins on `last_page_read`; the chapter job checks a cancel flag between pages and discards a result that arrives after stop.
- rate limits: provider 429s are surfaced with retry-after; the route has its own per-IP limit so a public deploy cannot be used as an open proxy for abuse (it still needs the caller's key).
- secrets: the provider key lives in the browser's localStorage and is sent only to the app's own route over HTTPS. The route never logs it. A server-side `ANTHROPIC_API_KEY` is optional for a private deploy.
- model output: a vision model returns approximate boxes. Boxes are clamped, tiny or overlapping ones merged, and every block is editable (T03).
- offline: reading works offline once the app shell is cached; translation needs the network and says so.
- time zones: history and updates group by the device's local day; timestamps are stored in UTC.
- GDPR deletion: "Clear database" deletes everything; nothing exists server-side.
- content: translation of copyrighted pages is the user's own use of files they hold. The app ships no content and no sources.

## Build order

1. Vertical slice: S04 import -> S01 library -> S06 detail -> S07 reader (paged LTR) with progress. Tables: manga, chapter, page, history.
2. Must-haves: reading modes and tap zones (S07, S08), history (S03), categories (S09), library search and sort, theme, backup (S11), translation F07/F08 (T01, T02, T04, `/api/translate`).
3. Should-haves: updates (S02), filters and display modes, selection actions, bookmarks, proofreading (T03, `/api/translate/text`), incognito, storage and clear data. Then could-haves: stats (S12), onboarding (S13), notes, export page.
4. Fixes from replica-entrepreneur.
