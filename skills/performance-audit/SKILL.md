---
name: performance-audit
description: Make a website as fast as it can be — first prune the pages, fonts, assets, components and packages it no longer uses, then measure exactly what each page downloads (gzipped JavaScript, CSS, fonts, images), find what loads everywhere that shouldn't, and say plainly when the framework itself is the floor and a different stack would be lighter. Use this whenever the user asks about speed, performance, page weight, bundle size, Lighthouse or Core Web Vitals, "why is this slow", or whether to change frameworks.
---

# Performance audit

Most sites that feel heavy are carrying things they no longer use. Measuring before pruning gives misleading numbers and fixes in the wrong order, so this audit prunes first. Read `../audit/references/principles.md` first if it's there.

## 1. Find what's unused

Start from what visitors can reach, not from what's in the repo:

- **Pages:** which routes are linked from the current site? Old pages that nothing links to still build, ship, and sit in the sitemap. List them.
- **Fonts:** which font families does the current design use? Check what's loaded and preloaded on each page against that. Preloading fonts a page doesn't use is common and costly.
- **Assets:** images, videos and files in the public folder that no current page references.
- **Components and packages:** components only used by unreachable pages, and dependencies only those components import.

Present the list and ask before deleting. Removing a page means deciding where its URL goes: a permanent redirect to an archived copy, to the nearest current page, or a 404. Check every redirect destination actually returns a page.

## 2. Measure each page

After pruning, build for production and measure what a modern browser downloads per page, gzipped (or brotli, if that's what the host serves):

| What | How |
|---|---|
| JavaScript | Sum the scripts each page loads, including chunks loaded on startup. Exclude legacy polyfills modern browsers skip. |
| CSS | Sum the stylesheets. |
| Fonts | Count the preloaded and immediately used files, and their size. |
| Images | Above-the-fold images, and whether the rest lazy-load. |
| HTML | The page itself. |

Use the build output and the files themselves (`gzip -c file | wc -c`), or the browser's network panel with cache disabled. Give real numbers in a table; "the bundle is large" isn't a finding.

## 3. Find what loads where it shouldn't

- **Heavy libraries on every page** that only one feature uses. A barrel file (an `index.ts` that re-exports everything) often pulls a WebGL or charting library into every page that imports anything from it.
- **Features that can't run on a device but load anyway:** a hover effect downloaded on phones, a desktop-only preview loaded at narrow widths. Load these on demand, behind a check for the capability (`matchMedia('(hover: hover)')`, a width, WebGL support), and ideally only on first use.
- **Animation libraries doing what CSS can.** Fades and staggered entrances in CSS cost nothing to download and run off the main thread.
- **Images:** oversized files, no modern format (WebP or AVIF) with a fallback, missing `width`/`height` (layout shift), above-the-fold images lazy-loaded (they should load eagerly), below-the-fold ones not.
- **Fonts:** whole families where one weight or a variable font would do; no `font-display`; the main font not preloaded.

## 4. The framework floor

Some frameworks ship a fixed runtime before any of the site's own code: a client-side router, a hydration runtime, the UI library itself. Measure that floor. If the site is mostly static content and the floor is most of the JavaScript, say so with numbers, and name a lighter option that suits the site (for a mostly-static site, a framework that ships no JavaScript by default and adds it only for interactive pieces). Give an honest comparison: what each page would weigh, what moving costs (which parts port easily, which need decisions), and what features map to what. The author is open to changing stacks when the numbers justify it.

## 5. Report and fix

Use the shape in `../audit/SKILL.md` when running inside an audit. Lead with the per-page table, then the biggest wins first. After fixing, re-measure and show before and after.

Note anything that needs a real device: the numbers above are download sizes; how fast a mid-range phone runs the JavaScript is a separate question, and a fast laptop hides it.
