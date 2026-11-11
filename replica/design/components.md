# Components

Built in `app/src/components/ui.tsx`, shown in isolation at `/design`.
Icons: Lucide (ISC licence). Fonts: the system UI font; Comic Neue (OFL) is
named first for lettering and falls back to the system font if absent.
Tokens live in `tokens.json` / `tokens.dark.json` and are applied as CSS
custom properties in `app/src/app/globals.css`, mapped into Tailwind's theme
so components use `bg-surface text-muted`, never hex.

```
Button
  variants  filled, tonal, text, danger; IconButton (40px round)
  size      40px high, pill
  states    default, hover, focus-visible (2px accent ring), disabled (40%), loading (spinner, label kept)
  tokens    accent/on-accent, accent-soft/on-accent-soft, danger
  a11y      real <button>; IconButton needs a label, used as aria-label and tooltip; aria-pressed when it toggles
  used on   all

Bottom nav / nav rail
  5 destinations; bottom bar under 768px, 80px left rail above
  states    active (accent-soft pill behind the icon), inactive (muted)
  a11y      <nav aria-label="Main">, aria-current="page"
  used on   S01-S05

Top bar
  56px, sticky; title (h1) or nothing when the screen has its own heading; start slot for back/close; actions right
  variants  default, search (field replaces title), selection ("3 selected")

Cover
  2:3, radius md, object-cover; placeholder icon when there is no cover
  a11y      alt "Cover of {title}"

Cover card / list row (library)
  variants  comfortable grid (title under), compact grid (title on a gradient), list (40px cover + title)
  states    default, with unread badge, selectable (role=checkbox, 4px accent outline when on)

Tabs
  scrollable, 2px accent underline on the active tab; role=tablist/tab, aria-selected

List row
  two lines: title (medium) + detail (sm, muted); read rows use muted text, never opacity
  trailing  icon button or menu

Switch
  48x28 track; whole row is the click target; role=switch on a real checkbox; optional description line

Segmented
  pill options in a fieldset with a legend; radio inputs cover each pill

TextField, Select
  44px, 1px border-input (3:1 against bg); label above; error text below with role=alert, aria-invalid, aria-describedby

Chip
  32px, radius md; static or toggle (aria-pressed)

Dialog
  centred, max 448px, surface, radius lg; Escape and outside click close; focus moves in and returns
  variants  confirm (Keep / destructive action), form (Cancel / Save)

Sheet
  bottom sheet under 768px (max 85dvh), 400px side panel above with no backdrop so the page stays readable
  used on   library view, chapter filters, reader settings, translate + proofread

Menu
  from an icon button; role=menu/menuitem; Escape and outside click close

Toast
  bottom, above the tab bar; info 4s (role=status), error 7s (role=alert)

Empty state
  icon 56px, title lg, one line of body, optional action
  used on   library, new, history, categories, not-found

Progress
  4px linear; determinate or indeterminate; role=progressbar with a label

Page slider (reader)
  native range input; dir=rtl in right-to-left mode; aria-valuetext "Page 3 of 20"

Translation overlay block (T02)
  absolutely positioned by fractions of the page; background = sampled colour, text black or white by luminance
  text      auto-fitted to the box (binary search on font size), centred, semibold, line-height 1.15
  setting   opaque fill (cleanup on) or 70% fill (off); comic or plain lettering

Block editor (T03)
  card per text block: Original and Translation textareas, retranslate, delete, "edited" marker
```
