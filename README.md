# Glosspane

A comic reader for files you already have, with in-page translation. Web app and Android app.

## Download for Android

**[Download glosspane-0.1.0.apk](https://github.com/Lonsol0007/glosspane/releases/download/v0.1.0/glosspane-0.1.0.apk)** (3.7 MB, Android 7.0 or newer)

Open the file on your phone and allow installing from this source when Android asks.
All releases: [Releases](https://github.com/Lonsol0007/glosspane/releases).

This is an early test build. Translation has not yet been verified against the live model.

## What it does

- Reads `.cbz` and `.zip` archives and loose page images that you add. It includes no comics and connects to no catalogue or download source.
- Library with categories, search, sorting and filters; series pages; history; bookmarks; notes.
- Reader with right-to-left, left-to-right, vertical and long-strip modes, and your place remembered in every chapter.
- Translates the page you are on, in place: the text is read, translated and set back over the page. Every line can be corrected.
- Everything is stored on your device. One backup file moves your library, progress and translations.

## Translation

Translation uses your own Anthropic API key, entered under More, Settings, Translation. Anthropic bills you for what you use.

## Repository layout

| folder | contents |
| --- | --- |
| `app/` | the Next.js web app, with the Android wrapper in `app/android/` |
| `replica/` | planning, test plan, parity report, research, brand and launch documents |

To run the web app: see [app/README.md](app/README.md).
