# Design fundamentals

The classic principles `design-critique` falls back on when `design-taste.md` says nothing. They come third in the order of authority: the author's taste, then these, then any other general advice. Where the taste file disagrees with a fundamental, the taste file wins and the fundamental isn't raised.

Each section gives the idea in a sentence or two, then the **lenses**: concrete things to look for on a rendered page. A suggestion that rests on a fundamental names it, briefly, in the form `Rams: as little design as possible` or `Gestalt: proximity`, so the author can tell a borrowed rule from their own.

These are summaries in this repo's own words. Read the sources for the full argument.

## Dieter Rams: ten principles of good design

All ten, in Rams' order, with what each means for a web page:

- **Innovative.** New where it makes something possible or easier, never as an end in itself. Lenses: a novel interaction that makes people relearn something familiar (hijacked scrolling, navigation hidden behind a gesture); a platform feature left unused where it would plainly help.
- **Useful.** The design serves what the page is for, and anything that distracts from that works against it. Lenses: what visitors came for pushed below an intro or decoration; sections that answer no one's question; a hero that could sit on any site.
- **Aesthetic.** How it looks is part of how well it works, because people spend time with it. Lenses: rough edges noticed before the content (uneven spacing, image treatments that don't match, type that fights itself); quality that drops from the home page to the inner pages.
- **Understandable.** The page explains itself. Lenses: what the page is for and what the call to action is is clear in the first viewport, without reading the small print.
- **Unobtrusive.** In tools, the design stays out of the way of the task. Lenses: chrome competing with content, colour or weight spent on controls rather than on what the user came for.
- **Honest.** The design doesn't pretend. Lenses: something styled as a button that isn't one, a link that looks like plain text, an image of an interface standing in for the real thing.
- **Long-lasting.** It avoids fashion, so it doesn't look dated next year. Lenses: an effect that pins the site to this year's trend where the content will outlive it; content that goes stale on its own (a hard-coded copyright year, a "new" badge, a design trend from a year you can name).
- **Thorough down to the last detail.** The details are part of the design. Lenses: states left unstyled (empty, loading, error, long content), mismatched radii or icon sizes, one-off spacing.
- **Environmentally friendly.** It uses no more than it needs. For a page that means weight and work. Lenses: autoplaying video, images far larger than they're shown, fonts loaded and never used, animation running off screen. `performance-audit` and `motion-review` measure these; a critique names the principle and points there rather than measuring again.
- **As little design as possible.** Every element earns its place. Lenses: decoration that carries no meaning (a border, shadow, icon or divider that would go unmissed), two elements doing one job, a style used once.

Source: Dieter Rams, ["Ten principles for good design"](https://www.vitsoe.com/us/about/good-design) (Vitsœ).

## Gestalt grouping

People read relationships from position and likeness before they read any words. Most judgments about hierarchy and spacing come down to these:

- **Proximity.** Things close together read as a group. Lenses: a label nearer the wrong field, a heading closer to the section above it than the one it introduces, even spacing everywhere so nothing groups.
- **Similarity.** Things that look alike read as alike. Lenses: two different kinds of thing styled the same, or one kind styled two ways.
- **Alignment and continuity.** Shared edges read as structure. Lenses: near-misses (elements a few pixels off a shared edge), ragged left edges between sections.
- **Figure and ground.** One thing reads as in front. Lenses: a background busy enough to compete with the text on it, cards or panels that don't separate from the page.
- **Common region.** A shared background or border makes a group. Lenses: boxes drawn around things that proximity alone would have grouped.

Source: the Gestalt psychologists (Wertheimer, Koffka, Köhler), as applied to layout. See [principles of grouping](https://en.wikipedia.org/wiki/Principles_of_grouping).

## Typography

After Robert Bringhurst, [*The Elements of Typographic Style*](https://en.wikipedia.org/wiki/The_Elements_of_Typographic_Style). Type exists to honour the content, and most of its quality is in rhythm and proportion:

- **Measure.** Comfortable reading lines run about 45–75 characters, around 66 for a single column. Lenses: body text that runs the full width of a wide screen, or squeezes under about 40 characters.
- **Leading.** Line spacing grows with line length and shrinks as type gets bigger. Lenses: headings set at body line-height (too loose), long lines set tight.
- **A scale.** Sizes come from a consistent ratio, with enough contrast between steps to read as different. Lenses: sizes a pixel or two apart, more sizes than the hierarchy has levels.
- **Restraint.** A few typefaces and weights, each with a job. Lenses: a third family with no clear role, a weight used once.
- **Small text and capitals.** Letter-spacing opens up for capitals and small sizes, and closes for large display sizes. Lenses: tracked-out lowercase, tight all-caps labels.

## Grids

After [Josef Müller-Brockmann](https://en.wikipedia.org/wiki/Josef_M%C3%BCller-Brockmann), *Grid Systems in Graphic Design*. A grid makes a page ordered and makes many pages read as one system:

- **One grid, used consistently.** Lenses: content widths that change from section to section for no reason, gutters that differ between similar components.
- **Alignment is structure.** Lenses: elements that float free of every column line, images and text that start on different edges.
- **Rhythm.** Vertical spacing comes from a scale, so the page has a beat. Lenses: gaps that are all slightly different, spacing that jumps rather than steps.
- **Breaking the grid on purpose.** A deliberate break is a strong move only when everything else holds to the grid. Lenses: breaks that look accidental because nothing else is strict.

## Colour

After Josef Albers, [*Interaction of Color*](https://yalebooks.yale.edu/book/9780300179354/interaction-of-color/). Colour is relative: the same value looks different against different neighbours, so judge it on the page, never as a hex value in isolation:

- **Context.** Lenses: an accent that reads well on one background and muddy on another, a grey that turns warm or cool beside a strong colour.
- **Quantity.** How much of a colour is used changes what it means. Lenses: an accent used so often it stops signalling anything.
- **Value before hue.** Hierarchy comes mostly from lightness contrast. Lenses: two elements different in hue but equal in value, so neither leads.
- **Both themes.** In dark mode, colours need re-balancing, not just inverting. Lenses: saturated colours that glow on dark backgrounds, shadows that vanish.

## Data and charts

After Edward Tufte, [*The Visual Display of Quantitative Information*](https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/). Use this section only when the page has charts, tables or other data displays:

- **Data-ink.** Most of the ink should show data. Lenses: heavy gridlines, borders on every cell, 3D effects, legends that could be direct labels.
- **Show the comparison.** A display should make the comparison that matters easy. Lenses: values that belong together split across charts with different scales.
