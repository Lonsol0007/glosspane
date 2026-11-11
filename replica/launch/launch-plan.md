# Launch plan

## Before anything is announced

1. **Live translation test** with your key on real pages: Japanese vertical text, a Korean long-strip chapter, a page with text over artwork. Fix what it shows. This is the product; nothing else matters until it works.
2. **Measure cost per page** for each model (20 pages each) and write the number down.
3. **Real hero screenshot**, on a page you may show.
4. **Name checks** from `brand.md` run, and a lawyer's search before money is spent on the name.
5. **Service worker**, so the installed app opens without a network.
6. **Content-Security-Policy** header, because the API key sits in browser storage.
7. Error tracking on the two server routes only (status codes and timings, never request bodies or keys). No analytics in the reader: the privacy page promises none. If you add any, change that page first.

## Store listing

`listing.json` passes the linter (0 errors, 0 warnings; neither original's
name appears). It is ready for a later native wrapper, not for now: v1 is a
web app, and there is nothing to submit to Apple or Google.

If you do wrap it for the stores, expect questions. Apple's guideline 4.1
(copycats) is answered by the translation feature and your own brand, so
lead the screenshots with a translated page. Both stores also look hard at
apps for reading comic files; the listing says plainly that the app includes
no comics and no sources, and the review notes should include a sample file
you made yourself.

## Where to talk about it

Not verified as venues for this product; check each community's rules on
self-promotion before posting.

- **Hacker News, Show HN.** Lead with the fix: "a comic reader that translates the page in place, in the browser, with your own API key". Say what it does not do (no sources, no inpainting). The 71 comments in the research show this crowd knows the category.
- **Communities for language learners and for people who read untranslated comics.** The research did not read Reddit, so the specific threads are not listed here; find them before launch and read before posting.
- **The translation tool's own users** who asked for a version without a desktop install (its most-voted open issue). Do not post in that project's tracker; that is their space.

Nothing here targets the reader app's communities with "switch from" messaging.
The product is not a replacement for it: it has no sources.

## First ten users

By hand, one at a time: people you know who read comics in a language they
are learning, or who buy raw volumes. Watch each one import a file and press
Translate. Write down where they stop. The three things to learn:

1. Do they get past "add an API key"? If not, the paid tier in `pricing.md` is the product.
2. Is the translation good enough to keep reading, or do they proofread every bubble?
3. Do they come back for a second chapter?

## What would change the plan

- Fewer than half get past the API key: build hosted translation before anything else.
- Boxes miss the bubbles on real pages: the fill-with-colour cleanup is not enough, and a detection model or segmentation step is needed. That is a larger build.
- People ask for sources: that is a different product, and not one to build.
