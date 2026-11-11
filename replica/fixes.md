# What to fix, and the angle

## The sample, and its limits

161 items from 3 public sources, collected 2026-11-11 through official APIs:
60 Mihon GitHub issues (the 60 with the most thumbs-up), 30 Koharu GitHub
issues (same sort), 71 Hacker News comments that mention Mihon or its
predecessor. Full sheet: `reviews.csv`. Ranked report: `feedback.md`.

Read this with three cautions:

- **No star ratings.** Mihon is not on the App Store or Google Play, so there
  are no store reviews. Thumbs-up counts on issues are used as the weight instead.
- **It skews to power users.** People who file GitHub issues are not the
  average reader.
- **Reddit was not read.** The largest community for this app is there, and
  it is missing from the sample.
- The Hacker News comments are mostly about the predecessor app and are
  mostly praise; they are evidence for what people value, not what they hate.

## 1. What they hate

| # | problem | evidence |
| --- | --- | --- |
| 1 | **Content depends on third-party extensions that break.** Sources vanish, need migrating, hit bot checks. 59 of 161 items touch extensions or sources, across all 3 sources. | "Android 16 / One UI 8] Extensions stuck at "Pending" – cannot install from any repo" (12 thumbs-up) https://github.com/mihonapp/mihon/issues/2660 · "When updating versions or when sources no longer become supported you need to migrate titles to new sources." https://github.com/mihonapp/mihon/issues/14 |
| 2 | **Trackers break.** 10 items, 2 sources. | "Cannot add MyAnimeList tracking" (68 thumbs-up, the most on the tracker; closed) https://github.com/mihonapp/mihon/issues/298 |
| 3 | **Updates that make reading worse.** 21 items mention slowness, crashes or regressions, but they are spread over many unrelated causes. | "The new update has negatively impacted the reader's fluidity." (13 thumbs-up, open) https://github.com/mihonapp/mihon/issues/3017 |
| 4 | **Koharu: translated text layout needs hand-fixing.** 13 items, one source only, so thin. | "global font size setting in the toolbar to address inconsistent font sizes across various" (3 thumbs-up) https://github.com/koharu-rs/koharu/issues/528 · "Nested text detections create overlapping text boxes" https://github.com/koharu-rs/koharu/issues/1069 |

## 2. What is missing

| # | request | evidence |
| --- | --- | --- |
| 1 | **Sync across devices.** | "Add cross device syncing" (56 thumbs-up, open since 2024-11) https://github.com/mihonapp/mihon/issues/1432 |
| 2 | **Two pages side by side.** | "Reader: Add Double Page/Dual Page support" (29 thumbs-up; closed, so check the changelog before calling it missing) https://github.com/mihonapp/mihon/issues/28 |
| 3 | **Volumes as a unit.** | "Volume support across the app" (24 thumbs-up, open) https://github.com/mihonapp/mihon/issues/15 |
| 4 | **Editing a series' details.** | "Feature request: Edit manga details" (14 thumbs-up, open) https://github.com/mihonapp/mihon/issues/5 |
| 5 | **Better library grouping.** | "Sub-Categories feature" (12, open) https://github.com/mihonapp/mihon/issues/1152 · "Custom way to sort series in the library" (7, open) https://github.com/mihonapp/mihon/issues/2930 |
| 6 | **Reader comforts.** | "Page preview" (6, open) https://github.com/mihonapp/mihon/issues/2840 · "Feature request (reader): Automatic scroll" (5, open) https://github.com/mihonapp/mihon/issues/10 |
| 7 | **Koharu without installing a desktop app.** Thin: one issue, but its top one. | "Docker/headless support was removed after 0.61.2 – any plans to bring it back?" (9 thumbs-up, open) https://github.com/koharu-rs/koharu/issues/904 |

## 3. What is unsolved

| # | group or job | evidence |
| --- | --- | --- |
| 1 | **Anyone not on Android.** The app is Android only. 23 items touch platform, 3 sources. | "Tachiyomi makes Android significantly better for comics/manga than iOS." https://news.ycombinator.com/item?id=37226102 · "a lot of my friends have not switched to iOS because of it" https://news.ycombinator.com/item?id=38986013 |
| 2 | **Reading something that has not been translated.** Neither project does it: the reader shows what a source has, and the translator is a separate desktop editor for people making releases. 15 items touch translation, but none asks for exactly this, so this is a gap read from the two products, **not a counted demand**. | The two READMEs. Treat as a hypothesis to test at launch. |
| 3 | **People with their own files.** The local source is a side feature. 25 items touch local files and storage. | "Option to save comicinfo/metadata and poster on the manga root folder." (6, open) https://github.com/mihonapp/mihon/issues/652 |

## Fix plan

| # | build | size | skill | evidence | state |
| --- | --- | --- | --- | --- | --- |
| 1 | Runs on iPhone, iPad and desktop, installable | — | done by the stack | unsolved 1 | done; add a service worker so it opens offline (S, build) |
| 2 | No extensions to break: the user's files only | — | done by scope | hate 1 | done |
| 3 | Edit series details | — | build | missing 4, 14 | done |
| 4 | Translate in the reader, no desktop app or GPU | — | build, backend | unsolved 2, missing 7 | built, live check owed |
| 5 | Double-page spread mode | M | build | missing 2, 29 | not built |
| 6 | Sync across devices (accounts, Postgres; schema is ready) | L | backend | missing 1, 56 | not built |
| 7 | Group chapters by volume | M | build | missing 3, 24 | not built |
| 8 | One font-size control for translated text, and movable boxes | M | build | hate 4 (thin) | not built |

Pricing and billing: no complaints in the sample, because both originals are free. That shapes pricing in `launch/`.

## The angle

**A. Recommended**
For readers with comics in a language they cannot read, who today need a
desktop translation tool and a GPU just to get through a chapter, this app
translates the page in place while you read.
Evidence: unsolved 2 (a product gap, not a counted demand) and Koharu's top issue (9).
Why this one: it is the only thing here that neither original does, and it
is already built. It is also the least proven, so the launch should test it.

**B.**
For readers on iPhone, iPad or a laptop, who are told the good reader is
Android only, this app runs in any browser and installs to the home screen.
Evidence: platform theme, 23 items across 3 sources.
Risk: iOS already has native readers; "works in a browser" is weaker than "native".

**C.**
For people with their own files who are tired of sources that vanish and
extensions that break, this app reads what is on your device and nothing else.
Evidence: sources theme, 59 items across 3 sources.
Risk: most of those users want the sources to work, not to go away.

Lead with A, support with B ("on any device") and C ("your files, nothing to break").
Neither original's name goes in the app name, the listing or ads.
