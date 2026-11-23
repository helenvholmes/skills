---
name: design-critique
description: "Critique the visual and interaction design of a website's rendered pages — hierarchy, spacing, type, grids, colour, details and restraint — against the author's own taste first, then Dieter Rams, Gestalt grouping, Don Norman, Bringhurst, Müller-Brockmann, optical adjustments, Albers and Tufte, and return weighted suggestions (not failures) in the audit report, then apply only the ones the author picks. Use this whenever someone asks for a design critique, design review or design feedback on a site or page, asks \"does this look good?\", \"what would a designer change?\" or \"why does this feel off?\", or wants a visual polish pass before shipping."
---

# Design critique

Look at a site the way a careful designer would, and suggest the few changes that would make it better. A critique gives **suggestions**, not failures: nothing here is broken, and the author is free to turn every one down. Problems that fail someone (contrast below AA, overflow, flicker) belong to `accessibility-audit`, `layout-check` and `motion-review`; when you notice one, name it and point there.

## Order of authority

Read these before looking at anything, in this order. Each outranks the ones after it, and a lower source is never raised against a higher one:

1. `../audit/references/principles.md`: how this author wants their work reviewed. Decisions made on purpose are not suggestions.
2. `../audit/references/design-taste.md`: the author's own design rules. Where a rule here disagrees with a fundamental, the fundamental stays silent.
3. `../audit/references/design-fundamentals.md`: the classic principles and their **lenses**, the concrete things to look for.
4. Any other general advice (optical adjustments, platform conventions, your own experience).

Then list what the author decided on purpose, the way `audit` does: code comments giving a reason, values that match a design file, README or CLAUDE.md notes, commit messages, and anything they've said. A deliberate choice is off the table for a critique, even when a fundamental would argue against it. If you're unsure whether a choice was deliberate, ask rather than suggest.

## 1. Look at the real pages

Open every page on the rendered site, in every theme, at a phone width (375px), a laptop width (1440px) and one wide width (1920px or more). Look at the states too: hover and focus on links and buttons, open menus, empty and error states where the site has them. Judge the real content; placeholder pages are skipped and listed under `notChecked`.

Take a cropped screenshot of anything you might suggest changing, noting its width, theme and state. It becomes the suggestion's `image` and, later, the "before" beside its "after".

## 2. Apply every lens

Read each page against every rule in `design-taste.md`, then against every section of `design-fundamentals.md` (Data and charts only where the page has data). The critique is done when every page has been read against every rule and every section, not when you've found a few things to say.

A suggestion follows "A finding needs evidence and a name" in `principles.md`, and needs all of these, or it's a preference and gets dropped:

- **Evidence** from the page: the crop, plus a measured number where there is one (line length in characters, the spacing values that don't match, the radii, the count of type sizes). Measure in the browser rather than estimating from a screenshot.
- **A basis**: where it comes from, as a short tag. `Your taste` for a rule from `design-taste.md`; the fundamental in the form `Rams: as little design as possible`, `Norman: feedback` or `Optical: concentric radii`; or a named piece of general advice in the same form. Use `General advice` only when the advice has no name.
- **A concept and its rule**, specific enough that the change follows from it: `Concentric radii`, "Inner radius equals outer radius minus the padding between them". For a taste suggestion, the rule is the line from `design-taste.md`, quoted.
- **The smallest change** that follows the rule, kept within the author's existing system: their spacing scale, their palette, their type sizes. A critique sharpens the design that's there; it doesn't propose a new one.

### Weights

Every suggestion gets a **weight**: how much the page would improve if it were applied. Weight is about effect, not about how sure you are; a suggestion you're unsure of gets verified or dropped.

- **Heavy**: changes how the whole page reads or whether it does its job. What a visitor sees first, the hierarchy of a page, a fundamental broken the same way across the site. Worth doing before shipping.
- **Medium**: one section or component reads noticeably worse than it could. A visitor feels it without being able to name it: a group that doesn't group, a measure too long to read comfortably, a style used once.
- **Light**: a detail a careful eye catches. A radius that isn't concentric, an icon a pixel off the baseline, tracking on a small label.

Keep the critique short enough to act on: the heavy suggestions in full, and only the medium and light ones that are clearly worth the change. Five good suggestions beat twenty.

## 3. Report

Write the suggestions as JSON in the format in `../audit/references/report-format.md`, every one with `area: "Design"`, a `weight`, a `basis`, a `concept`, an `image` where it's visible, `evidence`, and the change in `fix`. Mark `yourCall` when the suggestion touches a value that might have been chosen on purpose.

- **On its own**, set `kind: "critique"`, save the JSON somewhere disposable (never in the project), build it with `node ../audit/scripts/build-report.mjs <critique.json> <critique.html>`, and show it the way `audit` shows its report (published as an Artifact with the icon `palette`, or `--standalone` in the browser, or Markdown grouped by weight).
- **Inside `audit`**, add the suggestions to the audit's own findings, after its problems; the report puts them in their own Suggestions groups.

In chat, give the summary, the link and the question. The page lets the author tick "Apply" or "Won't apply" on each suggestion and copy the request back.

## 4. Apply, and grow the taste file

Change nothing until the author picks. Then, for each suggestion they choose to apply:

- Make the change on its own, so it can be reverted alone, and take the after shot at the same width, theme, state and crop as `after`. Rebuild and republish to the same page.

For each one marked won't apply, set `wontFix` to `true`, or to their reason if they gave one, and change nothing.

A reason for turning a suggestion down is often taste. When the author gives one, or states a preference while reviewing ("I like the tight leading on headings"), offer to add it to `design-taste.md` as a rule, in their words, under a heading for its subject. Add it only when they say yes. That's how the taste file grows, and the next critique won't raise the same suggestion.

Never commit or push unless asked.
