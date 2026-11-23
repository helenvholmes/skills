# skills

Pre-flight skills for shipping on web: accessibility, motion, layout, typesetting, unused code, performance and security for sites, and case study and visual design/ux design review for pages. One command, `audit`, runs all of them and returns a single report ranked by severity, then fixes only what you approve. Heavily borrows from others' skills such as [poteto](https://github.com/poteto/how) and [emil](https://github.com/emilkowalski/skills) albeit with my own flavor.

| Skill | What it checks |
|---|---|
| `audit` | Runs everything below in order and reports once |
| `layout-check` | Every width from 320px to 2560px with your real content: sideways scrolling, overlap, alignment, widows and orphans, awkward ranges between breakpoints |
| `accessibility-audit` | WCAG 2.2 AA: axe on every page in every theme, palette contrast including hover and focus, a real keyboard pass, semantic HTML (the right element for each job), target size, reflow, text size, reduced motion. Fixes failing colours with the nearest passing one. |
| `motion-review` | Flicker, motion that makes people wait, reduced-motion support, frame drops, animations running off screen |
| `typesetting` | How the type is set, after Bringhurst and the Chicago Manual of Style: line length and leading, letter-spacing on capitals, tabular figures, faked bold or italic, justification without hyphenation, paragraph indents, kerning and ligatures, and the marks (curly quotes and apostrophes, dashes, ×, −, …, non-breaking spaces, hanging punctuation). The rules are in [`skills/typesetting/references/rules.md`](skills/typesetting/references/rules.md). |
| `prune` | What the project no longer uses: unused pages, components, assets, fonts, exports and packages, code that never runs (found by reading and by coverage), and tests that never run or test code that's gone. Removes only what you pick, with redirects for old pages. |
| `performance-audit` | Runs `prune` first, then measures what each page downloads and what loads where it shouldn't |
| `security-audit` | Production dependency advisories, lockfile drift and whether the lockfile installs cleanly on your host, unused risky features, headers and CSP, secrets, private pages |
| `design-critique` | Suggestions rather than failures: hierarchy, spacing, type, grids, colour and detail on the rendered pages, judged by your own taste in [`design-taste.md`](skills/audit/references/design-taste.md) first, then Rams, Gestalt, Norman, Bringhurst, Müller-Brockmann, optical adjustments, Albers and Tufte ([`design-fundamentals.md`](skills/audit/references/design-fundamentals.md)). Each suggestion is weighted heavy, medium or light and names its basis. Runs last in `audit`, or on its own as a design critique. |
| Basics sweep | Part of `audit`, not a skill of its own: small things every page needs, starting with a favicon that loads and reads at tab size |

And two for what a site says:

| Skill | What it does |
|---|---|
| `copywriting` | Writes or reviews the words on a site (headlines, calls to action, about pages, link and button text) using Schwartz's stages of awareness, Ogilvy, Krug, Nielsen Norman Group, Orwell, April Dunford's positioning and Kathy Sierra's *Badass*, with formulas (AIDA, PAS, BAB, FAB, the 4 U's) for drafting. Every suggestion names the principle behind it; the principles are in [`skills/audit/references/copy-fundamentals.md`](skills/audit/references/copy-fundamentals.md). |
| `review` | Reviews the case studies on a portfolio the way a hiring manager or client reads them, using Brian Lovin's [advice on presenting design work](https://brianlovin.com/writing/how-to-give-a-great-product-design-portfolio-presentation): context, the problem before the solution, constraints, what you tried, outcomes, and credit. Suggests the few changes that matter most and makes only the ones you pick. |

The report opens as a page: findings grouped by severity, real colour swatches for every contrast problem, filters by check, and boxes on each finding to tick what you want fixed, or what you're leaving as it is on purpose, and copy the request back to Claude. In Claude it's published as a private Artifact; elsewhere it opens in your browser. The skill writes the findings as data (`skills/audit/references/report-format.md`) and `skills/audit/scripts/build-report.mjs` builds the page, so every report has the same shape.

Every finding names the concept it breaks and the rule that fixes it ("Concentric radii: inner radius equals outer radius minus the padding"), not just the symptom, so the fix follows from the rule. Anything you can see on the page comes with a cropped screenshot. Once you've approved and Claude has fixed it, an after shot taken at the same width, theme and state sits beside it, the finding moves to a Fixed group, and the report republishes to the same page.

## The opinions

These skills come from auditing real projects, and they encode how I want my work reviewed. The main one: **a decision made on purpose is not a finding.** If a timing, colour or size was chosen deliberately, the skills don't suggest changing it to taste. They still report it when it fails someone (a colour below 4.5:1, an animation that flickers), and offer the smallest fix that keeps the intent.

The rest are in [`skills/audit/references/principles.md`](skills/audit/references/principles.md): test with the real content rather than invented worst cases, keep a row's text still on hover, treat reduced motion as gentler rather than none, prune before measuring, and make every fix separately so it can be undone.

Design taste lives in its own file, [`skills/audit/references/design-taste.md`](skills/audit/references/design-taste.md), which starts empty and grows: when you turn down a design suggestion with a reason, `design-critique` offers to add it as a rule, and the next critique won't raise it again.

If your opinions differ, fork it and edit those files.

## Install

In Claude Code:

```
/plugin marketplace add helenvholmes/skills
/plugin install helenvholmes@helenvholmes
```

Then ask for an audit in plain words ("audit this site before I ship it"), or call a skill directly, for example `/helenvholmes:audit` or `/helenvholmes:accessibility-audit`.

To run every skill at once, paste this into Claude:

```
Run every helenvholmes skill on this site. First /helenvholmes:audit, which covers layout, accessibility, motion, unused code, performance, security, the basics sweep and a design critique. Then, if the site has portfolio case studies, /helenvholmes:review on each one. Give me the audit report and the review, and don't change anything until I pick what to fix.
```

Or copy any folder from `skills/` into `~/.claude/skills/` to use it on its own, without the `helenvholmes:` prefix. Each check skill reads `../audit/references/principles.md` if it's there, so copy `audit` along with it to keep the opinions.

## What it needs

- A browser Claude can drive (the Claude desktop app's built-in browser, Claude in Chrome, or Playwright) for the layout, accessibility and motion checks.
- Node.js, for the colour scripts in `skills/accessibility-audit/scripts/`.
- The site running locally: a dev server, and ideally a production build.

## Scripts

The accessibility scripts also work on their own:

```bash
# Contrast for colour pairs (foreground, background)
node skills/accessibility-audit/scripts/contrast.mjs '#c95e46' '#f9f3ef'

# The passing colour nearest to a failing one, keeping its hue
node skills/accessibility-audit/scripts/fit-aa.mjs '#c95e46' '#f9f3ef' '#f9f5ef'
```

`axe-sweep.js`, `focus-log.js`, `text-size.js`, `elements.js` (elements doing a job another element was made for, like a clickable `<div>` or a link that's really a button) and `target-size.js` (pointer targets under 24×24 CSS px, and whether spacing or an exception saves them) run inside the page, as do `skills/layout-check/scripts/widows.js`, which lists headings and paragraphs whose last line is a single word, and `skills/typesetting/scripts/typesetting.js`, which measures how the type is set against the typesetting rules; each explains its use at the top.

## License

MIT
