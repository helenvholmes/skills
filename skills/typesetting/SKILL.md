---
name: typesetting
description: Check how a website's type is set, after Bringhurst and the Chicago Manual of Style — line length and leading, letter-spacing on capitals, tabular figures in tables and counters, faked bold or italic, justification without hyphenation, paragraph indents, kerning and ligatures, and the small marks (curly quotes and apostrophes, em and en dashes, × and − and …, non-breaking spaces, hanging punctuation) — then fix only what the author approves. Use this whenever the user asks about typesetting, typography details, smart or curly quotes, dashes, apostrophes, tabular or old-style figures, faux bold or italic, justified text, rivers, hyphenation, kerning or ligatures, or says the text "looks a bit off", even if they name only one of these.
---

# Typesetting

Most of what makes type look professionally set is small and has a right answer: a curly apostrophe facing the right way, digits that line up in a column, an italic that's a real italic and not a slanted roman. These aren't matters of taste, so this check reports them as problems, the way `layout-check` does. The few typography questions that *are* taste (how many sizes a type scale has, how many typefaces) belong to `design-critique`.

Read these first:

1. `../audit/references/principles.md`, if it's there. Decisions the author made on purpose aren't findings: a deliberately tight heading or a chosen indent stays, unless it fails someone.
2. `references/rules.md`: every rule this check applies, each with its lenses and its fix.

Widows and runts aren't here: they move with width, so `layout-check` finds and fixes them while it sweeps every width.

## 1. Learn how the type is made

Before looking at the page, read how its type is set up, so you know where each fix would go:

- **The fonts.** Which families and which weights and styles are loaded (`@font-face` rules, a font service's link, `next/font` or similar), and whether they're variable fonts.
- **The base styles.** Where body and heading `line-height`, `letter-spacing`, `max-width` or `max-inline-size`, `text-align` and `font-variant-numeric` are set.
- **Where the words come from.** Hand-written HTML, Markdown or MDX, a CMS, or an API. Marks are fixed where the text lives. Find out whether a build step already converts quotes and dashes (a Markdown "smartypants" or "typographer" option, say), because then a straight quote on the page means the converter missed something or is switched off.
- **The language.** `lang` on `<html>`, which hyphenation and quote styles depend on.

Note anything the author decided on purpose: a comment beside a value, a note in the README or CLAUDE.md, a commit message.

## 2. Measure every page

On every page, in every theme, at a phone width (375px) and a laptop width (1440px), run `scripts/typesetting.js` in the page. It returns one list per section of the rules: marks with a snippet of their text, paragraphs whose measure falls outside 40–80 characters, the leading per element and size, capitals without letter-spacing, numbers that should be tabular, weights and styles the browser is faking, justified text without hyphenation, paragraph indents, and kerning or ligatures switched off.

The script finds candidates; you decide what's a finding. Check each one against the rule and the page:

- A straight quote in a quoted code sample, an `x` that's really the letter, or a hyphen that's really a hyphen ("x-ray", "-webkit-") isn't a finding.
- A measure outside the range may be a short caption or a deliberate pull quote.
- Leading is listed for every element so you can see the pattern. Flag a heading set at body leading, or long lines set tight, not every value.

## 3. Look at what the script can't judge

Take a screenshot and look closely, zoomed in where it helps, at:

- **Faked styles.** Confirm a reported faux italic or bold by eye: a true italic changes letter shapes (look at *a* and *f*); a slanted roman doesn't.
- **Rivers.** In justified text at a phone width, gaps that line up down the paragraph.
- **Hanging punctuation.** Blockquotes, pull quotes and lists, against the text edge around them.
- **Marks in context.** Dashes and apostrophes at the size and weight they're shown, since some fonts draw them badly.

Read the source as well as the page for marks, because the rendered page can hide a converter's mistakes, and the fix goes in the source either way.

## 4. Report

Use the shape in `../audit/SKILL.md` when running inside an audit, with `area: "Typesetting"`. Every finding names its rule as the concept, in the form the rules file gives (`Marks: curly quotes`, `Figures: tabular in columns`), with the rule itself and the count of places it applies.

Group repeated marks into one finding per rule, with a few examples and the count, rather than one finding per quote mark.

Severity:

- **Moderate:** faked bold or italic; body text outside the comfortable measure; justified text that rivers at phone widths; numbers that jitter or don't line up where people compare them.
- **Minor:** marks, letter-spacing, paragraph signals, kerning and ligatures.
- Typesetting is rarely **serious**. It becomes serious only when it breaks reading for someone: text squeezed too narrow to read, say.

## 5. Fix only what the author picks

Change nothing until the author says which findings to act on. Then:

- Fix each one on its own, so it can be reverted alone.
- Fix marks where the text lives: the HTML, Markdown or content files, or the converter's settings if the site has one. Never rewrite text inside `code`, `pre` or `kbd`.
- Use the smallest CSS that follows the rule, in the author's existing base styles: one `font-variant-numeric` on the elements that need it, not a new type system.
- After fixing, run `scripts/typesetting.js` again on the same pages and widths, and give the before and after counts.

Never commit or push unless asked.
