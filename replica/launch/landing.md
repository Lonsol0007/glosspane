# Landing page

Built at `/welcome` (`app/src/app/welcome/page.tsx`), linked from More as
"About Glosspane". Passes the accessibility scan, including contrast, in the
e2e suite. No testimonials, user counts, ratings or logos: there are none yet.

| section | content |
| --- | --- |
| Hero | **Read any comic in your language.** Glosspane is a comic reader that translates the page you are on, in place. Your files, your device, your own API key. Button: "Add a chapter and try it". Under it: "Free. No account. Translation needs an Anthropic API key." |
| Problem | "The chapter exists. You just cannot read it." Two paragraphs, paraphrased from the research: reader apps only show what someone already translated and tend to live on one kind of phone; translation tools are desktop programs built for people making releases. |
| How it works | 1 Add your files. 2 Open a chapter. 3 Press Translate. |
| Features | Fixes first: translate where you read (fix 4), fix what the machine got wrong, any device with a browser (fix 1), nothing to break (fix 2). Then parity: yours to keep, organised your way. |
| Price | One card: Free, with the plain statement that translation is billed by Anthropic on the reader's key. |
| Questions | Does it come with comics; what does translation cost; where does my page go; how good is it; does it cover the artwork; which files; moving devices. Each answer states the limit as well as the feature. |
| Final call | "Open the chapter you could not read." |

## Before this page goes public

- **Replace the hero screenshot.** `app/public/shot-translated.png` is the
  real interface, but the page in it is a sample drawn for testing and the
  translation in it came from a stubbed response, not from the model. A
  product screenshot on a sales page has to show a real result. Capture one
  after the live test, on a page you have the right to show.
- Decide whether `/welcome` or the library is the front door. Today the
  library is `/`, so a first-time visitor lands on an empty shelf with a
  pointer to Add. For paid traffic, send people to `/welcome`.
- No social preview image exists yet (see the logo brief).
