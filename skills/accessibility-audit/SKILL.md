---
name: accessibility-audit
description: Audit a website against WCAG 2.2 AA the way a careful human tester would — an automated axe scan of every page in every theme and colour scheme, contrast measured for the whole palette including hover and focus states, a real keyboard pass with actual key presses, reflow at 320px, the browser's default text size, and reduced motion — then fix contrast with the closest passing colour. Use this whenever the user asks for an accessibility or a11y audit, WCAG or ADA compliance, contrast checks, keyboard or screen reader support, or "is this accessible?", even if they only mention one of those.
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

## 6. Reflow, zoom and text size

- **320px wide** (WCAG reflow): nothing scrolls sideways, nothing is cut off.
- **Text size:** run `scripts/text-size.js`. It simulates a visitor whose browser default text size is 24px instead of 16px, and reports which text scales and which is stuck. Text set in `px` ignores this setting. Page zoom still works, so this isn't a WCAG failure, but it's a real cost for people who set a larger default. Report it, and if the px sizes are deliberate (to match a design), say so and leave the call to the author.

## 7. Reduced motion

Turn on reduced-motion emulation and walk the site. Movement and scaling should stop; opacity fades can stay. Infinite animations should stop. Anything that follows the cursor or reacts to scroll should calm down or stop. `motion-review` covers motion in more depth.

Some browser tools can emulate the colour scheme but not reduced motion. If yours can't, review the CSS (`prefers-reduced-motion` queries) and every script that animates, and say under "Not checked" that reduced motion was reviewed in code, not watched.

## 8. Fixing contrast: the closest passing colour

When a colour fails, don't pick a replacement by eye. Use:

```bash
node scripts/fit-aa.mjs '#b89343' '#f9f5ef' '#f9f5ef'
```

The first colour is the one to change; the rest are every colour it must contrast with (its backgrounds, and any text that sits on it). The script keeps the colour's hue and chroma in OKLCH, moves only its lightness, tries both darker and lighter, and returns the passing colour nearest the original. Add `--ratio 3` for large text or non-text, or `--ratio 7` for AAA. It shows how far each candidate moved, so you can tell the author exactly how much their colour changed.

When you apply a fitted colour, leave a comment next to it with the original value and why it changed.

## 9. Report

Use the shape in `../audit/SKILL.md` if you're running as part of an audit; otherwise the same headings: Serious, Moderate, Minor, Already good, Not checked. For contrast, a table of every theme with its ratios beats prose. Always list under "Not checked" what only a person can test: a screen reader (VoiceOver: Cmd+F5 on macOS, triple-click the side button on iPhone), a forced-colours or high-contrast mode, and voice control.

## Out-of-scope pages

If the site links to sections it doesn't build (archived versions, other projects on subpaths or subdomains), list them under "Not checked" as out of scope. If the user asks for them too, scan each front page with axe and report the results in a short separate table. Don't fix them unless asked; they often belong to other repos.
