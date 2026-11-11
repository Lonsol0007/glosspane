# Test plan

Suites: `app/src/lib/*.test.ts` (Vitest, 26 tests) and `app/e2e/*.spec.ts`
(Playwright against the production build, 32 tests). Every e2e test fails on
a console error or a 5xx response; screens get an axe accessibility scan.

```bash
cd app
npx vitest run
npm run build && npx playwright test
```

Last run, 2026-11-11: 26 of 26 unit, 32 of 32 e2e.

| case | what | automated |
| --- | --- | --- |
| F01-H1 | empty library points to Add; an archive becomes a series with chapters and unread badge | yes |
| F01-E1 | same file twice adds nothing | yes |
| F01-E2 | second archive under the same title becomes a new chapter | yes |
| F01-E3 | loose images import as one chapter; long title with accents and emoji survives | yes |
| F01-N1 | non-archives and broken archives are named with a reason | yes |
| F01-N2 | blank title cannot be saved | yes |
| F01-E4 | archive over 1 GB is refused | no: code path only, not run |
| F01-E5 | device out of storage | no: manual |
| F02-H1 | start, turn pages (RTL keys), progress saved, resume | yes |
| F02-E1 | refresh mid-chapter keeps the page | yes |
| F02-H2 | last page marks read; next opens the next chapter; previous chapter | yes |
| F02-H3 | tap zones, slider, left-to-right, long strip | yes |
| F02-E3 | 390 px wide: page fits, no sideways scroll | yes |
| F02-N1 | missing chapter or series shows a not-found state | yes |
| F02-E4 | corrupt image inside a chapter shows the per-page error | no: manual |
| F03-H1 | history lists the chapter, resumes, clears | yes |
| F03-E1 | private reading writes no history or progress | yes |
| F04-H1 | category create, duplicate refused, assign, tabs, delete keeps series | yes |
| F04-H2 | search, no results, reverse sort, list layout, filter, clear filters | yes |
| F04-H3 | delete a series from selection mode | yes |
| F05-H1 | mark earlier as read, bookmark, unread filter, unread badge, updates, stats | yes |
| F05-H2 | edit details and notes | yes |
| F06-H1 | backup, delete everything, restore, re-import attaches pages and keeps progress | yes |
| F06-N1 | non-backup and non-JSON files are refused | yes |
| F06-N2 | backup from a newer version is refused | unit |
| F07-H1 | translate a page: overlay position, cleanup colour, toggle, cached after reload | yes, provider stubbed |
| F07-N1 | no key: panel explains, run disabled, link to settings | yes |
| F07-N2 | rejected key: message shown, chapter run stops after one call | yes, provider stubbed |
| F07-E2 | page with no text | yes, provider stubbed |
| F07-L1 | **live provider call on a real page** | **no: needs your API key** |
| F08-H1 | chapter run translates each page once and skips done pages | yes, provider stubbed |
| F08-E1 | stop ends the run and discards the page in flight | yes, provider stubbed |
| F09-H1 | proofread edit shows on the page, survives a rerun; delete a block | yes |
| F09-H2 | retranslate one block | yes, provider stubbed |
| API-N1 | route without a key: 401 | yes |
| API-N2 | invalid image, media type, language (including an injection attempt), model, short key: 400/401 before any provider call | yes |
| API-E1 | rate limit returns 429 with retry-after | no: code path only |
| theme | dark theme applies and persists | yes |
| offline | reading works with the network off after first load | no: no service worker yet, see bugs.md to-check |
| two tabs | progress written in two tabs at once | no: manual; last write wins by design |

## Manual pass still owed

- F07-L1 with a real key, on three real pages (Japanese vertical, Korean webtoon, a page with text over artwork).
- Install as a PWA on a phone and read a 200-page chapter.
- Screen reader pass on the reader (page images have alt text; overlay text is in the DOM).
