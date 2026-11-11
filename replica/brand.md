# Brand

Angle (from `fixes.md`): translate the page in place while you read, on any device, from your own files.

## Name

Working name in the code: **Glosspane**. It is set in one place
(`app/src/lib/brand.ts`, plus `app/public/manifest.webmanifest`), so changing
it is a two-line edit. The name is your call; this is a recommendation.

A gloss is a translation written beside the original text; a pane is a panel
and a window. It says what the product does without using either original's
name, sound or meaning.

20 candidates considered: Glosspane, Inkgloss, Panelglot, Komaglot, Lettera,
Marginalia, Speechmark, Balloonist, Pagewise, Overleaf-style "Interleaf",
Glossa, Bubblewise, Sidenote, Readthrough, Tsumiki, Yomu, Honyaku, Kotoba,
Babelpanel, Subpanel.

Cut for being ordinary words already used by many products or known marks
(Marginalia, Interleaf, Glossa, Sidenote, Kotoba, Yomu), for being generic
Japanese words that say nothing to most buyers (Honyaku, Tsumiki), or for
sounding like a toy (Bubblewise, Balloonist).

### Shortlist and checks

Only the DNS row was run (2026-11-11, a name-server lookup, which shows
whether a domain currently resolves, not whether it can be bought). Every
other check is **to run**. Nothing here is legal clearance; have a trademark
lawyer search before you spend money on a name.

| check | Glosspane | Inkgloss | Panelglot | Komaglot | Lettera |
| --- | --- | --- | --- | --- | --- |
| US trademark (classes 9, 42) | to run | to run | to run | to run | to run |
| EU trademark | to run | to run | to run | to run | to run |
| Canada | to run | to run | to run | to run | to run |
| WIPO global | to run | to run | to run | to run | to run |
| .com resolves today | no | yes (in use or parked) | yes | no | not checked |
| .app resolves today | not checked | no | not checked | not checked | yes |
| App Store and Play search | to run | to run | to run | to run | to run |
| handles (X, Instagram, TikTok, GitHub) | to run | to run | to run | to run | to run |
| web search "name + comic reader" | to run | to run | to run | to run | to run |

## Palette

Role names are unchanged; values replaced in `design/tokens.json`,
`tokens.dark.json` and the app stylesheet. The original's launcher colour is a
blue (`#0058A0`); this palette is a persimmon accent on warm paper neutrals,
a different hue family. Contrast checker: 16 pairs, 0 failing AA, both themes.

| role | light | dark |
| --- | --- | --- |
| bg | `#fffbf8` | `#16130f` |
| surface | `#f6efe9` | `#201c18` |
| surface-2 | `#ebe2da` | `#2c2722` |
| border | `#dcd2c8` | `#3d3731` |
| border-input | `#7f756c` | `#9c8f84` |
| text | `#1f1b17` | `#ece1d8` |
| text-muted | `#52463c` | `#b8aa9d` |
| accent | `#8f4c00` | `#ffb77c` |
| on-accent | `#ffffff` | `#4a2800` |
| accent-soft / on | `#ffdcc0` / `#2e1500` | `#6c3a00` / `#ffdcc0` |
| danger | `#b3261e` | `#ffb4ab` |
| success | `#1b6e45` | `#7fd8a6` |

The reader itself stays black, grey or white by the reader's choice; brand
colour never sits on top of a page.

## Logo brief

- **Idea:** a page with a second, smaller pane laid over one corner: the gloss on the text.
- **Type:** symbol plus wordmark. The symbol alone is the app icon.
- **Must work** at 16 px (two shapes, no detail) and at 1024 px.
- **Colour:** persimmon pane on a paper page, on the dark background. One-colour version required.
- **Deliverables:** SVG; app icon 1024x1024 with no transparency; favicon set; social image 1200x630; maskable PWA icon with safe zone.
- **Must not resemble** either original's mark: no blue, no stylised book-with-letter, no mascot or character art. Put both originals' icons beside the drafts and check.
- A placeholder SVG that follows this idea is in `app/public/icon.svg`. It is a stand-in, not the logo.

## Voice

Plain, not cold. Exact, not technical. Calm, not cute.

| do | don't |
| --- | --- |
| Say where things are stored: "on this device" | "in the cloud", "securely" with no detail |
| Name the cost: "you pay Anthropic for what you use" | "AI-powered", "magic" |
| Say what an action leaves alone: "Your original files are not touched" | "Are you sure?" with no consequence |
| Use the reader's words: series, chapter, page | manga-only or source-app jargon: entries, extensions, scanlator |
| Give the next step in the error | bare "Something went wrong" |

The ten most-seen strings, as shipped:

| where | string |
| --- | --- |
| tagline | Read any comic in your language. |
| empty library | Nothing on the shelf yet. Add a .cbz or .zip file, or a set of page images, and it will show up here. |
| main action | Add your first series |
| add screen | Pick .cbz or .zip files (one per chapter), or a set of page images. Files stay on this device. |
| series button | Start / Resume |
| no key | Add an API key to translate. Translation runs on your own Anthropic API key. It is kept in this browser only. |
| running | Reading and translating the page… |
| translate error | The API key was rejected. Check the key in translation settings. |
| delete confirm | Their pages, progress and translations are removed from this device. Your original files are not touched. |
| end of chapter | You have reached the end of the last chapter. |

## Sweep

`python sweep.py . --config replica/brand.json` on 2026-11-11: clean. Avoid
list: both originals' names, their predecessor's name, their organisation
names; their domains; the original's launcher colours.

Checked by eye: favicon and app icon (placeholder, original artwork), page
titles (from `brand.ts`), web manifest. There are no email templates and no
social image yet.
