# Typesetting rules

How type should be set on a web page, after Robert Bringhurst and *The Chicago Manual of Style*. Unlike the design fundamentals, these mostly have a right answer: a straight quote or a faked italic is wrong whatever anyone's taste. Where a rule is a matter of taste instead, it says so.

Each rule gives the idea, the **lenses** (what to look for on the rendered page), and the **fix**. Cite a rule by its section and name, for example `Marks: curly quotes` or `Figures: tabular in columns`.

These are summaries in this repo's own words. Read the sources for the full argument.

## Lines

- **Measure.** Comfortable reading lines run about 45–75 characters, around 66 for a single column. Lenses: body text running the full width of a wide screen, or squeezed under about 40 characters at a phone width. Fix: a `max-inline-size` in `ch` on the text column (around `66ch`), not a fixed pixel width.
- **Leading.** Line spacing grows with line length and shrinks as type gets bigger. Lenses: headings set at body line-height and looking loose; long lines set tight, so the eye loses its place going back to the start. Fix: a unitless `line-height`, lower for headings (about 1.1–1.25) than body (about 1.4–1.6), opened up a little for long measures.
- **Letter-spacing.** Capitals and small text get a little more space; large display type gets a little less. Lowercase body text is left alone. Lenses: tracked-out lowercase; all-caps labels set tight; big headings that look gappy. Fix: positive `letter-spacing` in `em` on caps and small labels (about `0.05em`), slightly negative on display sizes.
- **Widows and runts.** `layout-check` owns these, because they move with width: see its "Widows and orphans" step.

## Figures

- **Tabular in columns, proportional in text.** Numbers that sit in columns or change in place (tables, prices, scores, timers, counters) use tabular figures, which are all one width, so digits line up and don't jitter. Running text uses the font's default proportional figures. Lenses: a column of numbers whose digits don't line up; a counter or timer whose width wobbles as it ticks. Fix: `font-variant-numeric: tabular-nums` on those elements only.

## Real styles

- **No faked bold or italic.** When a page asks for a weight or style the font hasn't loaded, the browser fakes it: italic by slanting the roman, bold by smearing it. Lenses: italics that are just tilted upright letters (look at the *a* and *f*, which change shape in a true italic); bold that looks blurry or heavier than the font's own bold. Check by comparing each weight and style the page uses against the faces in `document.fonts`. Fix: load the real face; set `font-synthesis: none` so a missing face shows up as wrong rather than as a passable fake.
- **Optical sizing on.** Covered in `design-fundamentals.md` under "Optical adjustments".

## Justification and hyphenation

- **Justify only with hyphenation.** Justified text without hyphenation opens uneven gaps between words, which line up into rivers down the column, worst on narrow screens. Lenses: gappy justified paragraphs at phone widths. Fix: `text-align: start`, or keep the justification and add `hyphens: auto`, which needs a correct `lang` attribute on the page to work.
- **Hyphenation needs a language.** Lenses: `hyphens: auto` set, but no `lang` on `<html>`, or the wrong one, so nothing hyphenates or words break in the wrong places. Fix: set `lang` to the content's language.

## Paragraphs

- **One signal for a new paragraph.** Either a first-line indent or space between paragraphs, not both, and no indent on the first paragraph after a heading. Lenses: indented paragraphs with space between them too; an indent straight after a heading. Fix: remove one of the two; for indents, `p + p { text-indent: 1em; margin-block-start: 0; }`. Which signal to use is the author's taste.

## Kerning and ligatures

- **Left on in text, off in tracked caps.** Fonts carry kerning and standard ligatures (*fi*, *fl*) so letter pairs sit evenly. Browsers apply them by default, so the finding is something switching them off. Ligatures should go off in letter-spaced text, where they'd stay joined while everything else spreads out. Lenses: `font-kerning: none` or `font-variant-ligatures: none` on body text; a joined *fi* in a tracked-out caps label. Fix: remove the override in text; `font-variant-ligatures: none` on letter-spaced elements.

## Marks

Small marks the reader never notices when they're right, and notices as sloppiness when they're wrong. Check them on the rendered page, not only in the source, because fonts and CSS change how they sit. Skip code (`code`, `pre`, `kbd`, `samp`), which keeps the plain characters it needs.

- **Em dashes close up.** An em dash in a sentence touches the words on both sides: "the result—not the tool". Ranges take an en dash, also unspaced: "2019–2024". Lenses: spaced em dashes ("the result — not the tool"); a hyphen or double hyphen standing in for a dash ("the result - not the tool", "the result--not the tool"); a hyphen in a range ("2019-2024"). Fix: the right character, in the source.
- **Curly quotes and apostrophes, facing the right way.** Quotation marks and apostrophes are curly (“ ” ‘ ’), not the straight marks a keyboard types. An apostrophe that stands in for missing letters always curls like a closing quote, even at the start of a word. Feet and inches take primes (′ ″), not quote marks. Lenses: straight `"` and `'` in body copy, headings or buttons; a backwards apostrophe in "‘90s" or "‘til" (should be "’90s", "’til"). Fix: the right character in the source, or a build step that converts them (most static-site generators have a "smart quotes" or typographer option), checked afterwards for apostrophes at the start of words, which converters often get backwards.
- **Real symbols, not stand-ins.** A multiplication sign for dimensions and multiples, a minus sign for negative numbers, and an ellipsis as one character. Lenses: "1920x1080" or "3x faster" (should be "1920×1080", "3× faster"); a hyphen as a minus ("-5°" for "−5°"); three full stops for "…". Fix: the right character, in the source.
- **Non-breaking spaces where a break would mislead.** A number stays on the line with its unit, and short fixed phrases stay together. Lenses: "10" at the end of one line and "km" at the start of the next; "p." split from its page number; a currency code split from its amount. Fix: a no-break space (U+00A0, or `&nbsp;`) in those spots only. This is for meaning, not for fixing a stranded last word: hand-placed `&nbsp;`s for widows break when the width or copy changes, which is why `layout-check` fixes those with CSS.
- **Hanging punctuation.** Opening quotation marks, bullets and similar marks sit in the margin, so the letters line up with the text edge and the left edge reads as straight. Lenses: a pull quote or blockquote whose first line looks indented by its opening quote mark; list bullets that push the text in so it no longer lines up with the paragraphs around it. Fix: `hanging-punctuation: first` where the browser supports it (only Safari, as of writing), and a negative `text-indent` the width of the mark (about `-0.4em` for a curly quote; check it at the actual font) on elements that always start with one.

Sources: Robert Bringhurst, [*The Elements of Typographic Style*](https://en.wikipedia.org/wiki/The_Elements_of_Typographic_Style), on lines, figures, styles, justification, paragraphs, kerning and hanging punctuation; [*The Chicago Manual of Style*](https://www.chicagomanualofstyle.org/) on dashes, quotation marks, symbols and spacing.
