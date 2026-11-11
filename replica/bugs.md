# Bugs

All reproduced by a test. Nothing is committed to git yet, so "fixed" points at the file, not a commit.

| ID | sev | status | summary |
| --- | --- | --- | --- |
| BUG-001 | S3 | fixed | Chapter number "10.5" parsed as 10 |
| BUG-002 | S3 | fixed | Restored chapters claimed pages they did not have |
| BUG-003 | S4 | fixed | Read rows on the New screen failed contrast |
| BUG-004 | S4 | fixed | History link's accessible name did not contain its visible text |
| BUG-005 | S3 | fixed | Radios and switches could not be clicked on the control itself, only on the label text |
| BUG-006 | S4 | fixed | Screens outside the tab bar had no main landmark; an empty h1 on the series and search bars |
| BUG-007 | S4 | fixed | Translated text clipped at the bottom of a bubble (descenders) |
| BUG-008 | S4 | fixed | On wide screens the proofreading panel dimmed the page being proofread |

## BUG-001 Chapter number "10.5" parsed as 10
Steps: import a chapter named `Vol.2 Ch. 10.5`. Expected: chapter number 10.5. Actual: 10, because ".5" was treated as a file extension.
Evidence: `util.test.ts > parseChapterNumber`. Fix: `stripExt` only strips known extensions (`src/lib/util.ts`).

## BUG-002 Restored chapters claimed pages they did not have
Steps: back up, delete everything, restore, open the series. Expected: chapters say their pages are missing. Actual: "3 pages", and opening one showed an empty reader.
Evidence: e2e F06-H1. Fix: restore sets `pageCount` to 0 for chapters it creates (`src/lib/repo.ts`); importing the file again sets it.

## BUG-003 Read rows failed contrast
Steps: read a chapter, open New. Actual: the row was dimmed with opacity, dropping text below 4.5:1.
Evidence: axe `color-contrast` in F05-H1. Fix: read rows use the muted text token instead of opacity.

## BUG-004 History link name mismatch
Evidence: axe `label-content-name-mismatch` in F03-H1. Fix: removed the aria-label; the visible title and chapter are the name.

## BUG-005 Controls not clickable on the control
Steps: click the track of a switch or the pill of a segmented option, away from its text. Actual: nothing, the hidden input was 1 px.
Evidence: 5 e2e tests timed out on `check()`. Fix: the input now covers the whole control (`src/components/ui.tsx`).

## BUG-006 Landmarks and empty heading
Evidence: axe `landmark-one-main`, `region`, `empty-heading`. Fix: `<main>` on every screen; the top bar renders no h1 when it has no title.

## BUG-007, BUG-008
Seen in `replica/clone-screens/T01-translate-panel-desktop.png` (first capture). Fixed in `Translation.tsx` (fit margin) and `ui.tsx` (no backdrop on wide screens). Not re-captured after the fix; the e2e suite still passes.

## To check (not reproduced, not confirmed)

- **Live model output.** Box tightness, vertical text and text over artwork are untested against a real model. If boxes come back tight, original glyphs will peek out around the fill.
- **Offline.** There is a web manifest but no service worker, so the app shell is not cached; a cold start with no network will not load. Reading already-open pages works.
- **Very large chapters.** All of a chapter's pages get object URLs at once. Fine at 30 pages; not measured at 300.
- **Storage eviction.** `navigator.storage.persist()` is requested on first import; whether the browser grants it was not checked.
- **Rate limiter.** Per server instance, so on serverless it is best-effort only.
