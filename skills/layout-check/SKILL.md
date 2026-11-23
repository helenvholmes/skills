---
name: layout-check
description: Check a website's layout at every width from 320px to 2560px using its real content — nothing scrolling sideways, nothing overlapping or cut off, columns and edges lining up, no headings or paragraphs ending on a single stranded word, and no awkward ranges between breakpoints where the design squeezes or looks off-centre. Use this whenever the user asks to check responsiveness, breakpoints, mobile or tablet layout, "does this work on phones", horizontal scrolling, overflow, widows or orphans, or says a width "looks off", even if they name only one size.
---

# Layout check

Breakpoint bugs hide *between* the sizes people test. A design that's right at 375px and 1280px can still squeeze into a narrow column at 650px or overflow by a few pixels at 640px exactly. This check sweeps the whole range with the site's real content and measures, rather than eyeballing a few screenshots.

Read `../audit/references/principles.md` first if it's there. In short: test the real content. The author writes it by hand, so invented worst cases (a 300-character title, an empty list) aren't findings for content they control. Worst-case data does matter where other people supply content: forms, user profiles, a CMS someone else edits, anything from an API.

## 1. Find the breakpoints

Read the CSS for every media query and container query, and the design tokens or Tailwind config for named breakpoints. Note any widths that come from JavaScript too (a `matchMedia` that switches a feature on at 1024px, say). Those are where layouts change, so they're where things break.

## 2. Sweep

Test every page at:

- **Standard widths:** 320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560
- **Both sides of every breakpoint you found:** 639 and 640, 1023 and 1024, and so on
- **The middle of each range between breakpoints,** where a fluid layout is most stretched or squeezed

Same-origin iframes of a fixed width are the most reliable way to sweep: create one per width, load the page in it, and measure inside it. Browser tools' viewport emulation can be dropped between calls without warning, so if you use it, check `innerWidth` before trusting a measurement. Use real window sizes (emulation or screenshots) for what iframes can't show, such as the browser's own scrollbars and short, landscape windows.

At each width, measure with JavaScript rather than judging by eye:

- `document.documentElement.scrollWidth > innerWidth` means something scrolls sideways. Find it: walk the elements and report any whose right edge passes the window's.
- Overlap: text under images, thumbnails, sticky elements or other text. Compare bounding boxes of the things that could collide.
- Alignment: do the header, content and footer share their left edge? Do columns that should match, match?
- Proportions: is the text column a readable width, or squeezed to a sliver or stretched past about 80 characters?

A scrollbar on Windows takes about 15px out of the window that `100vw` still counts, so `100vw` widths can overflow there even when they don't on a Mac. Size things from their container (`100%`) when it matters.

## 3. Look at the awkward ranges

Numbers catch overflow, but not "looks off". At the widths where the layout changes most (just above a breakpoint, and the widest screens), take a screenshot and look at the balance: content stranded to one side, a column far narrower than the design intends, padding that jumps instead of easing. If a range looks wrong, a fluid value (`clamp()`) that eases between the two layouts usually fixes it better than another breakpoint.

## 4. Widows and orphans

A heading or paragraph that ends on one word by itself looks like a mistake, and it moves with width: fine at 1280px, stranded at 1180px. At each width, run `scripts/widows.js` in the page. It lists every heading and paragraph whose last line is a single word, with its last two lines and current `text-wrap`.

The fix is CSS, not a library or hand-placed `&nbsp;`s, which break as soon as the width or the copy changes:

```css
h1, h2, h3, dt { text-wrap: balance; }
p, dd, li { text-wrap: pretty; }
```

`balance` evens out a heading's lines; `pretty` stops a paragraph's last line ending on one word. Browsers without support wrap as before, so there's nothing to fall back to. Leave alone any line break the author placed with `<br>`, and anything decorative or `aria-hidden`. If a short heading still strands a word after `balance`, the author's copy or a deliberate break is the answer, not a narrower box.

## 5. Things that move with width

- Features that switch on or off at a width (a hover preview that needs room, a menu that collapses): check both sides, and check that whatever replaces the feature fits too.
- Zoom: browser zoom at 200% on a 1280px laptop lands at a 640px layout. Whatever's wrong at 640px is wrong for those people too.
- Short windows: a phone in landscape is about 320–400px tall. Sticky or fixed elements taller than that can never be fully seen.

## 6. Report

Use the shape in `../audit/SKILL.md` when running inside an audit. A table of widths against what was measured (where text starts, column width, any overflow) is usually clearer than prose. Say which widths you tested, so the "Already good" section means something.

Clean up afterwards: delete any test pages or sample-data files you made, unless the user asks to keep them.
