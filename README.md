# skills

Pre-flight skills for shipping on web: accessibility, motion, layout, performance and security. One command, `audit`, runs all of them and returns a single report ranked by severity, then fixes only what you approve. Heavily borrows from others' skills such as [poteto](https://github.com/poteto/how) and [emil](https://github.com/emilkowalski/skills) albeit with my own flavor.

| Skill | What it checks |
|---|---|
| `audit` | Runs everything below in order and reports once |
| `layout-check` | Every width from 320px to 2560px with your real content: sideways scrolling, overlap, alignment, awkward ranges between breakpoints |
| `accessibility-audit` | WCAG 2.2 AA: axe on every page in every theme, palette contrast including hover and focus, a real keyboard pass, reflow, text size, reduced motion. Fixes failing colours with the nearest passing one. |
| `motion-review` | Flicker, motion that makes people wait, reduced-motion support, frame drops, animations running off screen |
| `performance-audit` | Prunes unused pages, fonts, assets and packages, then measures what each page downloads and what loads where it shouldn't |
| `security-audit` | Production dependency advisories, lockfile drift, unused risky features, headers and CSP, secrets, private pages |

The report opens as a page: findings grouped by severity, real colour swatches for every contrast problem, filters by check, and a box on each finding to tick what you want fixed and copy the request back to Claude. In Claude it's published as a private Artifact; elsewhere it opens in your browser. The skill writes the findings as data (`skills/audit/references/report-format.md`) and `skills/audit/scripts/build-report.mjs` builds the page, so every report has the same shape.

## The opinions

These skills come from auditing real projects, and they encode how I want my work reviewed. The main one: **a decision made on purpose is not a finding.** If a timing, colour or size was chosen deliberately, the skills don't suggest changing it to taste. They still report it when it fails someone (a colour below 4.5:1, an animation that flickers), and offer the smallest fix that keeps the intent.

The rest are in [`skills/audit/references/principles.md`](skills/audit/references/principles.md): test with the real content rather than invented worst cases, keep a row's text still on hover, treat reduced motion as gentler rather than none, prune before measuring, and make every fix separately so it can be undone.

If your opinions differ, fork it and edit that file.

## Install

In Claude Code:

```
/plugin marketplace add helenvholmes/skills
/plugin install helenvholmes@helenvholmes
```

Then ask for an audit in plain words ("audit this site before I ship it"), or call a skill directly, for example `/helenvholmes:audit` or `/helenvholmes:accessibility-audit`.

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

`axe-sweep.js`, `focus-log.js` and `text-size.js` run inside the page; each explains its use at the top.

## License

MIT
