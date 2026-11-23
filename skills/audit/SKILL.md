---
name: audit
description: Run every pre-ship check on a website or web app — accessibility, motion, layout across breakpoints, unused code, performance and security, then a design critique — and return one report ranked by severity, then fix only what the user approves. Use this whenever the user asks to audit, QA, review, check, or "go over" a site before shipping or after a big change (a redesign, a stack migration, a new page), asks "did we miss anything?", or wants to re-run the audits they ran before. Prefer it over running the individual check skills one by one when the request covers more than one area.
---

# Audit

One command that runs all the checks this plugin has and reports back once. The individual checks are separate skills, so each can also be run on its own:

| Skill | What it covers |
|---|---|
| `layout-check` | Every width from 320px to 2560px with the real content: no sideways scroll, nothing overlapping, columns that line up |
| `accessibility-audit` | WCAG 2.2 AA: automated scan of every page in every theme, palette contrast, a real keyboard pass, semantic HTML, reflow, text size, reduced motion |
| `motion-review` | Whether each animation has a reason, works with reduced motion, doesn't flicker, and never makes someone wait |
| `prune` | Unused pages, components, assets, fonts, exports and packages, code that never runs, and tests that never run or test code that's gone |
| `performance-audit` | Measuring what each page downloads, once pruned, and what's loaded that shouldn't be |
| `security-audit` | Dependency advisories, lockfile drift, headers and CSP, secrets, private pages |
| `design-critique` | Weighted suggestions, not failures: hierarchy, spacing, type, grids, colour and detail, judged against the author's taste first |

Before starting, read `references/principles.md`. It describes how this author wants audits done, and it overrides generic best practice wherever they disagree. The single most important rule: decisions the author made on purpose are not findings.

## 1. Understand the project

Spend a few minutes learning the site before testing it. You need to know:

- **The stack** and how to run it: a dev server, and a production build you can serve locally.
- **Every page.** Read the routes, not just the nav: orphaned pages still ship. Note redirects and rewrites too.
- **Every theme.** Light and dark at minimum, and any others (some sites rotate colour themes per visit, or have a high-contrast mode). Find how the theme is chosen so you can force each one.
- **What's out of scope but linked.** Archived versions, subdomains, sections served from other projects. List them under "Not checked". If the user asks for them too, give each front page a quick axe scan in a short separate table, not a full audit.
- **What the author decided on purpose.** Read code comments, the README, CLAUDE.md or similar, and recent commit messages. Timings, easings, sizes and colours that come with a reason ("matches the design", "from the Figma file", "300ms so the change is seen") are decisions. Keep a list; you'll need it to avoid reporting them.

## 2. Run the checks

Run each check skill in this order, following its own instructions. Layout comes first because overflow and broken breakpoints distort every later measurement; prune comes before performance because unused files and packages distort its numbers; security barely needs the browser. The design critique comes last, once the problems are known, so it doesn't suggest polish for something already failing.

1. `layout-check`
2. `accessibility-audit`
3. `motion-review`
4. `prune`
5. `performance-audit`
6. `security-audit`
7. `design-critique`, adding its suggestions after the findings

Skip a check only when it truly can't apply (no motion at all on the site, say), and say in the report that you skipped it and why.

Then sweep every page for the basics: small things no single check owns, and easy to ship without because nothing breaks. File these findings under `Basics`.

- **Favicon.** Every page links one (`<link rel="icon">`), the file it points to loads, and it reads at 16px on both light and dark browser tabs. An SVG favicon with an `apple-touch-icon` PNG (180×180, no transparency) covers today's browsers and phones' home screens. Without a link, browsers request `/favicon.ico` and log a 404, so either link one or serve that path. Pages that are separate sites (examples, demos) can have their own icon or none; don't give them the main site's.

Collect findings as you go rather than writing a report per check. For each one, keep: what's wrong, the concept it breaks and that concept's rule, where (file and line, page, theme, width), the evidence (a measured number, a screenshot, a tool's output), who it affects, and the fix. A finding without evidence is a guess; either verify it or list it under "needs checking".

For any finding you can see on the page (an overflow, a contrast failure, a misaligned edge, a missing focus ring), take a cropped screenshot as you find it and note the width, theme and state you took it in. It goes in the report as the finding's `image`, and it's the "before" you'll compare against once it's fixed.

## 3. Report

The report is a page the user can read, filter and pick fixes from, built from data so every report has the same shape.

1. **Write the findings as JSON**, in the format in `references/report-format.md`. Save it somewhere disposable (a scratch or temp folder), never in the project.
2. **Build the page:** `node scripts/build-report.mjs <report.json> <report.html>`. The script checks the data and says exactly what's wrong if something doesn't fit; fix the JSON and run it again.
3. **Show it:**
   - If you have a tool for publishing Artifacts, publish `report.html` as one (icon: `checklist`; description: one sentence naming the site and the counts). It's private to the user unless they share it. Don't run a design pass on it: the template is the design.
   - Otherwise, build with `--standalone` and open the file in the user's browser.
   - If neither is possible, give the report as Markdown in the same shape: a summary, then Serious, Moderate, Minor, the design suggestions by weight, Already good and Not checked.
4. **In chat**, give the summary sentence, the link or file path, and the question. Don't paste the whole report again.

What goes in each section:

- **Serious:** failures that block someone from using the site, that fail WCAG AA, or real security holes.
- **Moderate:** real problems with a workaround, or that affect fewer people.
- **Minor:** polish, and small wins.
- **Suggestions:** the design critique's, grouped by weight after the problems, as `design-critique` defines them.
- **Already good:** what was checked and holds up. Keep it short, but include it: it tells the user what was covered.
- **Not checked:** what needs a person or a device you don't have (a screen reader, a high-contrast mode, a real phone), what a tool couldn't do (reduced-motion emulation, say), and anything out of scope that you noticed.

Within each finding, lead with what's wrong in plain words, then the number that proves it, then the fix. Give file paths with line numbers.

Name the concept behind every finding, and its rule. "The corners look off" leaves whoever applies the fix to guess; "the nested radius isn't concentric: inner radius is outer radius minus padding" tells them exactly what to change. Use the term a designer or engineer would search for (concentric radii, optical alignment, type scale, measure, focus order, layout shift, cache busting), then state the rule precisely enough that the fix follows from it. If you can't name a concept, the finding may be a preference rather than a problem: say so, or drop it.

Use a table when several items share the same columns (contrast ratios per theme, sizes per page), and swatches for every contrast finding. Separate the objective failures from the design calls: a colour that fails 4.5:1 is objective, but *which* colour replaces it is the author's call, so mark it `yourCall` and say what you'd pick and why.

Never put a secret's value in the report, even a dead one: name the file and commit instead.

## 4. Ask, then fix

Don't fix anything until the user says which findings to act on. Design suggestions picked to apply or not are handled as `design-critique` says, including its offer to add a reason to the taste file. The report page gives each finding a "Fix this" box and a "Won't fix" box, and copies a request like "Fix findings 1, 3 and 7, and mark finding 5 as won't fix, in the example.com audit"; the numbers match the report. Then:

- For each finding marked won't fix, change nothing in the code. Set its `wontFix` to `true`, or to the user's reason if they gave one (don't ask for one), and rebuild the report with the fixes below so it moves to the Won't fix group.

- Fix in small, separate changes the user could revert one at a time. This author likes to try a change, look at it, and back it out if it's wrong.
- For colour fixes, find the closest passing colour rather than inventing a new one (`accessibility-audit` has a script for this).
- After fixing, re-run the checks that produced the findings and say what changed, with the new numbers.
- For each fixed finding that has a before screenshot, take the after one at the same width, theme, state and crop, and add it as `after`. Rebuild the report and publish it to the same Artifact, so the user can see every change side by side without rerunning anything. If an after shot shows the fix didn't land, or broke something nearby, say so rather than adding it.
- Delete any scaffolding you made to test (demo pages, worst-case data files, temporary server configs) unless the user asks to keep it.
- Never commit, push, or deploy unless asked. When the user does ask, write commit messages that explain why, not just what.

## When the request is narrower

If the user asks for one area ("just check accessibility"), run that one skill directly; this skill is for "check everything". If they ask to re-run audits after a change, re-run all seven checks and the basics sweep, and compare against the earlier findings: what's fixed, what's new, what's still open.
