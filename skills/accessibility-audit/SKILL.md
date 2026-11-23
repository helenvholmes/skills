---
name: accessibility-audit
description: Audit a website against WCAG 2.2 AA the way a careful human tester would — an automated axe scan of every page in every theme and colour scheme, contrast measured for the whole palette including hover and focus states, a real keyboard pass with actual key presses, semantic HTML (the right element for each job: buttons, links, headings, lists, forms), pointer target size (24×24 CSS px), reflow at 320px, the browser's default text size, and reduced motion — then fix contrast with the closest passing colour. Use this whenever the user asks for an accessibility or a11y audit, WCAG or ADA compliance, contrast checks, keyboard or screen reader support, tap or click target size, or "is this accessible?", even if they only mention one of those.
---

# Accessibility audit

Automated tools catch maybe a third of real problems, and they miss whole classes of them silently (contrast during a fade-in, focus that lands somewhere invisible). This skill pairs axe with the measurements and keyboard testing that catch the rest. Read `../audit/references/principles.md` first if it's there: deliberate design choices get reported differently.

The scripts referred to below are in `scripts/`. Run the `.mjs` ones with Node. The `.js` ones are snippets for the page itself: paste them into whatever runs JavaScript in the page for you (a browser automation tool, or the devtools console).

## 1. Map what to test

- Every page, including the 404 page, and any page reachable only by URL.
- Every theme × colour scheme. If the site picks a theme per visit or at random, find the mechanism (often `localStorage` or a `data-` attribute on `<html>`) so you can force each one. A site that moves to the next theme on every load needs the stored value set to the one *before* the theme you want.
- Each state with different colours: default, hover, focus, active, visited, disabled, selected text.

## 2. Automated scan, every combination

Use `scripts/axe-sweep.js`. It loads each page in a hidden same-origin iframe, turns off animations and transitions (otherwise axe reports contrast as "incomplete" for anything mid-fade), injects axe-core, and returns the violations. Edit the `PAGES` list and the `setTheme` hook at the top. Then run it once per colour scheme, switching the scheme with your browser tool's emulation (an iframe inherits the scheme of its tab).

If injecting axe fails, the site probably has a Content-Security-Policy, often as a `<meta>` tag. That's good for the site and bad for testing. Don't weaken the real policy: make a production build, copy it to a scratch folder, strip the CSP `<meta>` from the copy's HTML, serve that copy locally, and scan it. The copy is what ships, minus the policy.

Read every violation; don't just count them. Note which ones axe got right but described vaguely, and which are false positives (rare, but say why).

axe checks contrast only for what's on screen in its 1280×800 frame. Fixed, sticky and scroll-revealed elements (footers especially) may never be in view during the scan, so a pass there means nothing: check their colours directly in step 3.

## 3. Contrast for the palette, not just the page

axe only checks the colours currently on screen. Theme variables, hover and focus colours, and alternate themes need checking directly. List every text-on-background pair the design uses, in every theme, and measure them:

```bash
node scripts/contrast.mjs '#c95e46' '#f9f3ef'  '#f9f5ef' '#8e3a27'
```

It takes pairs (foreground, background) and prints each ratio with pass or fail for normal text (4.5:1), large text (3:1) and AAA. Remember the non-text pairs too: a focus indicator needs 3:1 against what's next to it, and a hover or focus *fill* that's the only sign of focus needs 3:1 against the unfocused background. That last one is easy to miss in dark themes, where a dark brand colour on a dark page can drop to 1.4:1.

Very small text (under about 10px) can pass contrast and still be hard to read. Report it as a design note, not a failure.

## 4. A real keyboard pass

Press Tab for real, one key at a time; don't call `.focus()` from a script. Programmatic focus doesn't trigger `:focus-visible`, so you'd be testing a state real users never see.

1. Run `scripts/focus-log.js` on the page. It records each element that receives focus, whether it's on screen, and whether it's actually the topmost thing at its own position.
2. Press Tab through the whole page. The log reads each stop the moment focus arrives, so speed doesn't matter.
3. Read the log back, and take a screenshot at any stop it flags.

Look for:

- **Focus that's invisible.** No ring, or a ring the same colour as the background, or focus shown only by a fill that fails 3:1.
- **Focus that lands somewhere hidden.** Sticky headers covering the focused element, and especially fixed or "reveal" footers: if a footer's contents are `position: fixed` and uncovered by scrolling, the browser counts a focused link inside as already on screen and won't scroll to it. The log's `onTop: false` catches this. The fix is to scroll the container into view on `focusin`.
- **Order.** Does the order follow the reading order? Are there duplicate stops (an image link and a text link to the same place)? Make the redundant one `tabindex="-1"` and `aria-hidden="true"`.
- **Traps and dead ends.** Menus, dialogs and carousels that focus can't leave, or that don't return focus when closed.
- **Odd focus boxes.** A focus ring far wider than its text usually means a link stretched by flex layout, so clicking empty space activates it too.

## 5. Structure and names

Check by reading the rendered HTML and the accessibility tree:

- One `<h1>` per page, and headings that let someone skim. A list of items with names usually wants each name as a heading.
- `aria-label` only on elements that can take a name. On a plain `<p>`, `<span>` or `<div>` it's ignored, and if the visible text is also `aria-hidden`, nothing is announced at all. Use visually hidden text instead.
- Links that open a new tab say so to screen readers ("(opens in a new tab)" in visually hidden text).
- Decorative symbols in link text (← → ↗) wrapped in `aria-hidden`, so "← Back" isn't read as "left arrow Back".
- Images: alt text that says what the image shows, and `alt=""` for decoration. When a link wraps only an image, the link needs the name.
- `lang` on `<html>`, a distinct `<title>` per page.

## 6. The right element for the job

Steps 2 and 5 check that what's there is named and valid. This one asks whether it's the right element at all. A `<div>` with a click handler passes axe and still can't be reached by keyboard or announced as a control. HTML's own elements bring focus, keys, states and meaning for free, and each hand-built copy has to rebuild all of it.

Run `scripts/elements.js` on every page, and again with each menu, dialog and form open. It lists elements doing a job another element was made for, with a reason for each. Treat its list as leads: look at each one, and confirm the clickable ones by clicking and tabbing. It can't see everything, so read the markup as well for what's below.

Each rule, with the concept to name in the finding:

- **Action or destination.** A `<button>` does something on this page; an `<a href>` goes somewhere with a URL. Watch for `<a href="#">` or a link with no `href` that opens a menu, and a `<button>` whose only job is to navigate (it can't be opened in a new tab or copied).
- **Native before ARIA.** If an HTML element has the role built in, use it: `<button>` over `<div role="button" tabindex="0">`, `<dialog>` over a `role="dialog"` overlay, `<details>`/`<summary>` for a show-and-hide section, `<select>` or radios for a fixed set of options, `<input type="checkbox">` over `role="checkbox"`. A custom widget is only right when no element does the job, and then it needs the full keyboard pattern from the ARIA Authoring Practices.
- **Controls you can click are controls you can reach.** Anything that responds to a click is a button or link, or sits inside one. A card that's clickable all over keeps one real link (the title) and stretches its hit area with a pseudo-element, rather than a click handler on the card.
- **State on the control.** `aria-expanded` and `aria-pressed` go on the button that changes them, not on the panel or a wrapper.
- **Structure carries meaning.** Headings for anything people skim by, not bold text. `<ul>`/`<ol>` for lists, including nav links and card grids, not bullet characters or stacked `<div>`s. `<table>` with `<th>` and `scope` for data with rows and columns, and CSS grid, not a table, for layout. Landmarks once each where they fit: `<header>`, `<nav>`, `<main>`, `<footer>`, with `<article>` for self-contained items and `<aside>` for asides.
- **Forms say what they ask.** Every field has a `<label>`, not just a placeholder. Related radios or checkboxes sit in a `<fieldset>` with a `<legend>` that asks the question. The input type matches the data (`email`, `tel`, `url`, `number`, `search`), with `autocomplete` where it applies, so phones bring up the right keyboard and browsers can fill it in.
- **Smaller meanings.** `<time datetime>` for dates, `<figure>`/`<figcaption>` for captioned images, `<blockquote>` and `<cite>` for quotes, `<abbr title>` the first time an abbreviation appears, `<address>` for contact details. These are minor, so report them only when they're clearly missing, not one by one.

Severity follows who is blocked. A control that keyboard users can't reach, or that's announced as plain text, is **serious**. A fake heading or list, ungrouped choices or a placeholder label is **moderate**. A generic input type or a missing `<time>` is **minor**. In the fix, swap the element and remove what the native one makes redundant (`tabindex="0"`, the role, the keydown handler), and check that the styles still apply: buttons bring their own font, padding, border and background, so reset them.

## 7. Target size

The concept is **target size**: the smaller a pointer target, the harder it is to hit, especially with a tremor, a finger, or a mouse held in a cramped hand. The rule is WCAG 2.2 criterion 2.5.8 Target Size (Minimum), AA: every pointer target is at least 24×24 CSS px, or is spaced so that a 24px circle centred on it touches no other target and no other small target's circle. The criterion lets these through:

- **Inline:** a link in a sentence or paragraph, whose size the line height sets.
- **User agent:** a native control the browser sizes and the author hasn't restyled, like an unstyled checkbox.
- **Equivalent:** another control on the same page does the same thing and meets the size.
- **Essential:** the size or position is the information, like a pin on a map.

Run `scripts/target-size.js` on every page, at a desktop width and at a phone width, and again with each menu, dialog and form open. It measures every link, button, field and other control, and lists the ones under 24×24 with their rendered size and a verdict: `fail`, `pass: spacing`, `exception: inline`, or `check: user-agent`. A target under 24 whose real hit area is bigger (padding on a child, or a `::before`/`::after` stretched across it) isn't listed: the script probes a 24×24 square around each small target to find those. For each `check: user-agent`, look at the styles to confirm the author hasn't set its size. For each `fail`, look for an equivalent control or an essential reason before reporting it.

Report each failure as **moderate**, with the target, its size, and what's too close. Make it **serious** when the target is an icon-only control under 16px for something people need to do (closing a dialog, opening the menu) and nothing else on the page does the same job. Small targets that pass by spacing or an exception aren't findings, though crowded inline links (several in one line) are worth a design note.

The smallest fix grows the hit area without changing how the target looks, so a small icon the author chose stays small: `min-width`/`min-height: 24px` on a control whose box can grow, padding with an equal negative margin, or a `::before` with `inset: -4px` (or whatever reaches 24) on a positioned element. Where the targets are fine on their own but crowded, adding `gap` between them is the fix. If the small size is deliberate, report it all the same, say it's a deliberate choice, offer the invisible hit-area fix, and leave the call to the author.

## 8. Reflow, zoom and text size

- **320px wide** (WCAG reflow): nothing scrolls sideways, nothing is cut off.
- **Text size:** run `scripts/text-size.js`. It simulates a visitor whose browser default text size is 24px instead of 16px, and reports which text scales and which is stuck. Text set in `px` ignores this setting. Page zoom still works, so this isn't a WCAG failure, but it's a real cost for people who set a larger default. Report it, and if the px sizes are deliberate (to match a design), say so and leave the call to the author.

## 9. Reduced motion

Turn on reduced-motion emulation and walk the site. Movement and scaling should stop; opacity fades can stay. Infinite animations should stop. Anything that follows the cursor or reacts to scroll should calm down or stop. `motion-review` covers motion in more depth.

Some browser tools can emulate the colour scheme but not reduced motion. If yours can't, review the CSS (`prefers-reduced-motion` queries) and every script that animates, and say under "Not checked" that reduced motion was reviewed in code, not watched.

## 10. Fixing contrast: the closest passing colour

When a colour fails, don't pick a replacement by eye. Use:

```bash
node scripts/fit-aa.mjs '#b89343' '#f9f5ef' '#f9f5ef'
```

The first colour is the one to change; the rest are every colour it must contrast with (its backgrounds, and any text that sits on it). The script keeps the colour's hue and chroma in OKLCH, moves only its lightness, tries both darker and lighter, and returns the passing colour nearest the original. Add `--ratio 3` for large text or non-text, or `--ratio 7` for AAA. It shows how far each candidate moved, so you can tell the author exactly how much their colour changed.

When you apply a fitted colour, leave a comment next to it with the original value and why it changed.

## 11. Report

Use the shape in `../audit/SKILL.md` if you're running as part of an audit; otherwise the same headings: Serious, Moderate, Minor, Already good, Not checked. For contrast, a table of every theme with its ratios beats prose. Always list under "Not checked" what only a person can test: a screen reader (VoiceOver: Cmd+F5 on macOS, triple-click the side button on iPhone), a forced-colours or high-contrast mode, and voice control.

## Out-of-scope pages

If the site links to sections it doesn't build (archived versions, other projects on subpaths or subdomains), list them under "Not checked" as out of scope. If the user asks for them too, scan each front page with axe and report the results in a short separate table. Don't fix them unless asked; they often belong to other repos.
