# Pricing

## What the originals charge

| product | price | source | read |
| --- | --- | --- | --- |
| Mihon | free, open source (Apache-2.0) | https://github.com/mihonapp/mihon | 2026-11-11 |
| Koharu | free, open source (MIT / Apache-2.0); runs on the user's own hardware, or the user's own provider keys | https://github.com/koharu-rs/koharu | 2026-11-11 |
| Paid alternatives | **not read.** No pricing page of any paid reader or translation service was opened for this document, so none is quoted. Read two or three before setting a paid price. | — | to do |

What the research said about price: nothing. 0 of 161 items complain about
price or billing, because both originals are free. That cuts both ways:
there is no pricing pain to fix, and the audience is used to paying nothing.

## What a translated page costs the reader

Translation is billed by Anthropic to the reader's own key. List prices per
million tokens (from Anthropic's published table as cached 2026-11-03; check
the live page before quoting them anywhere):

| model | input | output |
| --- | --- | --- |
| Claude Opus 5.5 (default) | $4.00 | $20.00 |
| Claude Sonnet 5.5 | $2.00 | $10.00 |
| Claude Haiku 5.5 | $0.10 | $0.50 |

**The cost per page has not been measured**, because no live call was made.
It depends on image size, how much text is on the page and how much the model
reasons. Measure it on 20 real pages per model before putting any per-page or
per-chapter figure on the site. Until then the site says only "you pay
Anthropic for what you use", which is true.

## Recommendation

**Launch free, bring-your-own-key, one tier.**

- The audience pays nothing today, and the main claim (translation in the
  reader) is unproven demand. Charging before that is tested measures the
  wrong thing.
- It costs you almost nothing to run: static hosting plus one small function
  that forwards requests. The reader carries the model cost.
- It keeps you out of handling other people's page images on your own bill.

**The paid tier to test second**, only if people use translation and say the
key is the obstacle:

| tier | for | what | model |
| --- | --- | --- | --- |
| Free | anyone with their own key | everything in the app today | free |
| Plus | readers who do not want an API account | translation without a key, as a monthly page allowance; sync across devices when it exists | flat monthly, annual at two months free; price set from measured cost per page plus margin |

Not three tiers: there is no third group yet.

If Plus is built: Stripe Checkout to subscribe, the Customer Portal to
change or cancel in one click, a renewal reminder email, and usage shown in
the app so nobody is surprised. Stripe products to create (by you, in test
mode first): one product "Plus", two prices (monthly, annual). Hosted
translation also means you become the party sending readers' pages to the
provider, which changes the privacy policy and needs a look from a lawyer
given what the pages may be.

## One thing to decide before any money changes hands

Readers will translate pages of commercially published comics. A free tool
that works on files the reader holds, for their own reading, is one
position. Selling translation of those pages as a service is a different
one. Get advice in your country before launching a paid tier.
