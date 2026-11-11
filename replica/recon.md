# Recon map: Mihon (Android) + Koharu translation (desktop)

Scope: Mihon's core reading loop (library, series page, reader, history, updates,
categories, backup, settings) rebuilt as a web app that reads the user's own
files, plus an in-reader translation pipeline modelled on Koharu's workflow
(detect, OCR, translate, clean up, typeset, proofread).
For: a product to ship under its own name.
Date: 2026-11-11

Note on sources: both projects are open source (Mihon Apache-2.0, Koharu
MIT/Apache-2.0) and the user asked for the repositories to be read, so the
repos were used as documentation of behaviour. No code, strings, icons or
assets were copied; the clone is written fresh on a different stack.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Mihon repo | https://github.com/mihonapp/mihon | screens under `app/.../ui`, schema under `data/.../sqldelight` |
| 2 | Mihon site and docs | https://mihon.app | feature list, guides, FAQ |
| 3 | Mihon changelog | https://github.com/mihonapp/mihon/blob/main/CHANGELOG.md | what changed recently |
| 4 | Koharu repo | https://github.com/koharu-rs/koharu | pipeline crates, UI package |
| 5 | Koharu docs | https://koharu.rs | guides: projects, processing, review, cleanup, typesetting, export |

## Core loop

Add a series to the library, open a chapter, read it page by page with
progress remembered, and (new) read it in your own language by translating
the page in place.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Library | `/` bottom nav | grid of saved series by category | category tabs, cover grid, unread badge, search, filter/sort/display sheet, selection bar | empty, filled, searching, no results, selection mode |
| S02 | Updates | `/updates` | recently added chapters grouped by day | date headers, chapter rows, refresh | empty, filled |
| S03 | History | `/history` | recently read chapters, resume | date headers, rows with resume and delete, search, clear all | empty, filled, confirm clear |
| S04 | Browse | `/browse` | add content: sources list (Local) and import | source rows, import dropzone, progress | empty, importing, error (bad file) |
| S05 | More | `/more` | entry to settings, categories, stats, backup, about | list rows, toggles (downloaded only, incognito) | filled |
| S06 | Series detail | `/manga/[id]` | cover, metadata, chapter list, start/resume | header with cover, favourite button, description expander, genre chips, chapter rows (read, bookmark), sort/filter sheet, FAB resume, selection bar, notes | loading, filled, no chapters, selection mode, not found |
| S07 | Reader | `/reader/[chapterId]` | read pages | page viewer (paged LTR/RTL/vertical, webtoon), top bar, bottom bar with page slider, prev/next chapter, tap zones | loading, page error, first/last page, chapter transition, menu hidden |
| S08 | Reader settings sheet | from S07 | reading mode, scale, background, tap zones | segmented controls, toggles, sliders | filled |
| S09 | Categories | `/more/categories` | create, rename, reorder, delete categories | list, add dialog, reorder handles | empty, filled, duplicate name error |
| S10 | Settings | `/settings/[section]` | appearance, library, reader, translation, data, about | preference rows, switches, selects, search | filled |
| S11 | Backup and restore | `/settings/data` | export library to a file, restore from it | buttons, file picker, result summary | idle, done, invalid file |
| S12 | Stats | `/more/stats` | counts and reading time | stat tiles | empty, filled |
| S13 | Onboarding | first run | theme, where files live, done | stepper | steps 1-3 |
| S14 | Global search | search from S01/S04 | find a series by title | search field, results | empty, results, none |
| S15 | Download queue | Mihon only | queue of remote downloads | — | not cloned (no remote sources) |
| S16 | Extensions / migration / tracking | Mihon only | third-party sources and trackers | — | not cloned, see out of scope |
| T01 | Translate panel | from S07 | pick target language and stages, run on page or chapter | language select, stage chips, scope select, run/stop, progress | no key, idle, running, failed, done |
| T02 | Translated page overlay | S07 | translated text typeset over cleaned bubbles; toggle original | overlay blocks, toggle button | original, translated, partial |
| T03 | Proofread panel | from S07 | edit source text and translation per block, re-render | block list, text areas, retranslate, delete block | empty, filled, edited |
| T04 | Translation settings | `/settings/translation` | provider, key, model, default language, font, auto-translate | key field, selects | no key, key set |

## Flows

```
F01 Import a series
    S04 browse -> pick .cbz/.zip/images -> S06 series detail (added to library)
    happy path clicks: 3
    edge: not an archive, archive with no images, same file twice, huge file

F02 Read a chapter
    S01 library -> S06 detail -> S07 reader -> page turns -> last page -> next chapter
    happy path clicks: 2 to first page
    edge: resume at last page read, RTL direction, last chapter, corrupt page

F03 Resume from history
    S03 history -> S07 reader at saved page
    happy path clicks: 1

F04 Organise the library
    S09 create category -> S01 select series -> set categories -> tab appears
    edge: duplicate category name, deleting a category keeps the series

F05 Track progress
    S06 mark read/unread, bookmark, mark previous as read -> S01 unread badge changes

F06 Back up and restore
    S11 create backup -> file downloads -> clear data -> restore -> library is back
    edge: invalid file, backup from a newer version

F07 Translate a page (Koharu-style)
    S07 reader -> T01 run (detect + OCR + translate + cleanup) -> T02 overlay
    happy path clicks: 2
    edge: no API key, page has no text, provider error, stop mid-run, run again keeps edits

F08 Translate a chapter
    T01 scope = chapter -> progress per page -> T02 on every page

F09 Proofread
    T03 edit a block's translation -> overlay updates; retranslate one block; delete a block
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | filled, tonal, text, icon, FAB | default, hover, focus, disabled, loading | all |
| Bottom nav / nav rail | 5 destinations | active, inactive | S01-S05 |
| Top app bar | title, search, selection | default, searching, selection | all |
| Cover card | compact grid, comfortable grid, list | default, selected, with badge | S01, S14 |
| Tabs | scrollable | active, inactive | S01, S04 |
| List row | one-line, two-line, with trailing | default, read (dimmed), selected | S02, S03, S06, S10 |
| Bottom sheet | filter, sort, display, reader settings | open, closed | S01, S06, S07 |
| Dialog | confirm, text input | default, error | S03, S09 |
| Switch, checkbox (tri-state), radio, slider, segmented | — | on, off, excluded | S08, S10 |
| Chip | genre, stage | selected, unselected | S06, T01 |
| Toast / snackbar | info, error, undo | — | all |
| Empty state | icon + message + action | — | S01-S04 |
| Progress | linear, circular | determinate, indeterminate | S04, T01 |
| Page slider | LTR, RTL | — | S07 |
| Text overlay block | horizontal | default, selected | T02, T03 |

## Inferred data model

```
Manga     id, source, url, title, author, artist, description, genre[], status,
          cover, favorite, date_added, notes, viewer_flags, chapter_flags, last_update
          evidence: data/.../manga.sq, S06
          confidence: high

Chapter   id, manga_id, url, name, scanlator, chapter_number, source_order,
          read, bookmark, last_page_read, date_fetch, date_upload
          evidence: chapter.sq, S06, S07
          confidence: high

Category  id, name, order, flags          MangaCategory manga_id, category_id
          evidence: category.sq, manga_category.sq, S09
          confidence: high

History   id, chapter_id (unique), read_at, read_duration
          evidence: history.sq, S03
          confidence: high

Page      chapter_id, index, image blob, width, height
          evidence: reader loader; local source reads archives
          confidence: high (clone stores imported pages locally)

PageTranslation  chapter_id, page_index, target_lang, status, blocks[]
TextBlock        id, bbox (x,y,w,h as fractions), source_text, source_lang,
                 translation, edited flags, background colour, text colour
          evidence: Koharu scene components (text, spatial, analysis), guides/review
          confidence: medium (simplified: boxes instead of segmentation masks)

Preference  key, value        evidence: settings screens        confidence: high
```

Relationships: Manga 1-n Chapter, Chapter 1-n Page, Chapter 1-1 History,
Manga n-n Category, Page 1-n PageTranslation (one per language), PageTranslation 1-n TextBlock.

## Feature matrix

See `features.csv`. Must: 24, should: 17, could: 9, skip: 9.

## Out of scope (cannot or should not be cloned)

- **Extensions and remote sources.** Mihon ships no content; third-party
  extensions supply it, and most point at sites that host scans without a
  licence. The clone reads files the user already has. No scraper sources.
- **Tracker integrations** (MyAnimeList, AniList, Kitsu...). Possible later
  through their official OAuth APIs; needs app registrations.
- **Source migration, extension stores, download queue, WebView**: only exist
  to serve remote sources.
- **Koharu's local ML models** (RF-DETR detection, manga OCR, LaMa/FLUX
  inpainting, GGUF LLMs) and GPU runtimes. A browser cannot run them at usable
  speed. The clone does detection, OCR and translation with one multimodal
  model call through the user's own API key, and cleans bubbles by filling with
  the sampled background colour rather than generative inpainting.
- **Layered PSD export, WebGPU canvas editor, agent workflow** from Koharu.
- **Mihon's and Koharu's names, logos, icons and strings.**

## Size

Screens 18 in scope, flows 9, entities 8. Hard parts: storing hundreds of MB
of page images in the browser, a reader with four reading modes and correct
progress, and getting usable text boxes back from a vision model. Size: M.
