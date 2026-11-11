# Parity report

Date: 2026-11-11

## Verdict: not shippable yet, for one reason

Feature parity is **90.8 / 100** (58 features counted, 28 of 31 must-haves done).
The three must-haves marked partial are the three provider-backed translation
steps (detect, read, translate). The code is built and its tests pass against
a stubbed provider, but **no live model call has been made**: this environment
had no API key. Until one page is translated for real with your key and the
boxes land on the bubbles, those rows stay partial and the verdict stays here.

Everything from Mihon's core loop that was in scope is done.

## Feature score by area

| area | score | features |
| --- | --- | --- |
| library, history, updates, categories, data, more | 100 | 16 |
| reader | 98.2 | 11 |
| series | 93.5 | 10 |
| browse | 92.9 | 3 |
| translation | 78.8 | 14 |
| settings | 75.0 | 2 |
| onboarding, security | 0 | 2 (both could-haves) |

## Missing, in build order

1. [must] Verify detect / OCR / translate against the live provider (needs your key).
2. [should] Chapter list: sort by chapter number and by date.
3. [could] Export a translated page as an image.
4. [could] Onboarding, colour themes, replace cover, stage picker.
5. [could] App lock: not possible in a web page; would need the native wrapper.

## Layout

Reference: the original's four store screenshots (`replica/screens/store-*.png`).

| screen | tool score | read |
| --- | --- | --- |
| S01 library, mobile | 16.0, "different" | Not a fair comparison: the reference shows 11 full-colour covers, the clone 3 sample series, so the edge maps share little. By eye the structure matches: top bar with title and three actions, 3-column cover grid, unread badge top-left of each cover, five-tab bottom bar. |

No same-state reference screenshots exist for the other screens, so they were
not scored. The layout score is not what holds this back, and after the
rebrand the look is meant to differ.

## Behaviour differences

| flow | original | clone | keep or fix |
| --- | --- | --- | --- |
| F01 add a series | install an extension, browse a source, add, download | pick files, confirm the title (3 clicks) | keep: the clone is local-only by design |
| F02 open and read | library, series, chapter (2 taps) | same, 2 | keep |
| F02 resume | resume button or history | same | keep |
| F06 backup | file includes library and progress; chapters re-download from sources | file includes library and progress; pages come back by adding the files again, matched automatically | keep, and say so in the UI (done) |
| F07 translate | not in Mihon. In Koharu: import pages into a project, pick stages, run, export | in the reader: open the panel, press Translate (2 clicks), overlay appears on the page being read | keep: this is the reason the product exists |
| cleanup | Koharu inpaints with a local model | clone paints the text box with the surrounding colour | keep for v1; weak on text over artwork, flagged in limitations |
| selection | long-press a cover | a Select button in the top bar | keep: long-press is unreliable on the web |

## Top five next

1. One live translation with your key, on a real page; tune the box handling if they come back tight or loose.
2. Chapter sort by number and date.
3. Export translated page.
4. First-run onboarding (three steps: theme, add files, add key).
5. A native wrapper if app-store distribution or app lock matter.
