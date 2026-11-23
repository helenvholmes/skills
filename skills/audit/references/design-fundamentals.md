# Design fundamentals

The classic principles `design-critique` falls back on when `design-taste.md` says nothing. They come third in the order of authority: the author's taste, then these, then any other general advice. Where the taste file disagrees with a fundamental, the taste file wins and the fundamental isn't raised.

Each section gives the idea in a sentence or two, then the **lenses**: concrete things to look for on a rendered page. A suggestion that rests on a fundamental names it, briefly, in the form `Rams: as little design as possible`, `Gestalt: proximity`, `Norman: feedback` or `Optical: concentric radii`, so the author can tell a borrowed rule from their own.

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

## Don Norman: how controls tell you what they do

After Don Norman, [*The Design of Everyday Things*](https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things). The rest of this file is about how a page looks at rest; this section is about what happens when someone uses it. Content states (empty, loading, error) belong to Rams' "Thorough"; this is about the controls:

- **Signifiers.** A control shows what it does before anyone touches it. Lenses: a link with no underline or colour difference from the text around it, an icon-only button with no label or tooltip, a clickable card with nothing that says it's clickable.
- **Feedback.** Every action gets a visible response, and quickly. Lenses: a submit button that does nothing visible while the request runs, a copy button with no "copied", a toggle whose new state you have to guess.
- **States.** Hover, focus, pressed, disabled and in progress each look different, and each looks like the same control. Lenses: a disabled button that looks enabled (or the reverse), a pressed state identical to hover, a focus style on some controls and not others.
- **Mapping.** A control sits next to what it changes, and moves the way its effect moves. Lenses: a filter bar far from the list it filters, a "next" arrow pointing the wrong way for the reading direction.
- **Constraints.** Actions that can't work aren't offered, rather than failing afterwards. Lenses: a form that accepts a value only to reject it on submit, a date picker that allows dates that will be refused.
- **Conventions (Jakob's law).** People spend most of their time on other sites, so they expect yours to work the same way: the logo goes home, the nav is where they look for it, underlined text is a link. Lenses: a familiar pattern changed for no gain, a convention followed in one place and broken in another.
- **Target size and distance (Fitts's law).** Bigger, closer targets are faster to hit. Lenses: small controls that are used often, related actions placed far apart, a close button tucked in a corner far from where the pointer already is. WCAG 2.2 sets the floor at 24×24 CSS px (criterion 2.5.8).

Sources: Don Norman, [*The Design of Everyday Things*](https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things); Jakob Nielsen, [Jakob's law](https://www.nngroup.com/videos/jakobs-law-internet-ux/); Paul Fitts, [Fitts's law](https://en.wikipedia.org/wiki/Fitts%27s_law).

## Typography

After Robert Bringhurst, [*The Elements of Typographic Style*](https://en.wikipedia.org/wiki/The_Elements_of_Typographic_Style). Type exists to honour the content. How type is *set* (measure, leading, letter-spacing, figures, faked styles, justification, marks) mostly has a right answer, so the `typesetting` check owns it, with its rules in `../../typesetting/references/rules.md`. What's left here is the part that's taste:

- **A scale.** Sizes come from a consistent ratio, with enough contrast between steps to read as different. Lenses: sizes a pixel or two apart, more sizes than the hierarchy has levels.
- **Restraint.** A few typefaces and weights, each with a job. Lenses: a third family with no clear role, a weight used once.

## Grids

After [Josef Müller-Brockmann](https://en.wikipedia.org/wiki/Josef_M%C3%BCller-Brockmann), *Grid Systems in Graphic Design*. A grid makes a page ordered and makes many pages read as one system:

- **One grid, used consistently.** Lenses: content widths that change from section to section for no reason, gutters that differ between similar components.
- **Alignment is structure.** Lenses: elements that float free of every column line, images and text that start on different edges.
- **Rhythm.** Vertical spacing comes from a scale, so the page has a beat. Lenses: gaps that are all slightly different, spacing that jumps rather than steps.
- **Breaking the grid on purpose.** A deliberate break is a strong move only when everything else holds to the grid. Lenses: breaks that look accidental because nothing else is strict.

## Optical adjustments

Geometry and perception disagree, and the eye wins. These are long-standing craft conventions rather than one author's rules, so cite them as `Optical: <name>`:

- **Concentric radii.** A rounded element inside another rounded element shares its centre: inner radius equals outer radius minus the padding between them. Lenses: a button or image inside a card whose corners look pinched or bulging, the same radius used at every level of nesting.
- **Optical centring.** Shapes that aren't symmetric get nudged until they look centred, rather than centred by their box. Lenses: a play triangle that sits left of centre in its circle, an arrow or chevron that looks off-centre in its button.
- **Icons beside text.** An icon lines up with the text next to it by cap height or x-height, not by the boxes they sit in. Lenses: icons that sit high or low against a label, icons a visibly different weight from the text they sit next to.
- **Optical sizing.** Type cut for small sizes is sturdier and more open than type cut for display. A variable font's `opsz` axis should match the size it's set at. Lenses: display text that looks spindly or overly sturdy, small text that looks cramped, `font-optical-sizing: none` set with no reason given.

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
