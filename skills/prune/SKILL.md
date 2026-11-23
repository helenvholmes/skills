---
name: prune
description: Find and remove what a project no longer uses — unused pages, components, assets and fonts, unused exports, unused dependencies, and code that never runs: branches that can't be reached, conditionals that always go one way, finished feature flags, and tests that never run or test code that's gone. Each candidate comes with its evidence, and nothing is deleted until the user picks it. Use this whenever the user asks to clean up a project, find dead or unused code, files or packages, asks "what can I delete?", mentions knip, depcheck or coverage gaps, or before measuring performance.
---

# Prune

Projects collect things nobody uses: a page from an old version of the site, a component its last caller stopped importing, a package added for an experiment, an `if` for a case that can no longer happen, a test still checking a function that was renamed away. Each one still builds, ships or runs, and makes the project harder to read and to measure. This skill finds them, proves each one is unused, and removes only what the user approves.

Read `../audit/references/principles.md` first if it's there. Two rules from it shape this skill: things kept on purpose are not findings, and every removal is its own change so it can be reverted.

The leading idea is **reachable**: something is used if you can get to it from an entry point. Work outward from the entry points, not inward from the files, because a file that imports another file proves nothing if neither is reachable.

## 1. Map the entry points

Before looking for anything unused, list everything that starts execution or gets requested from outside. Anything not reachable from this list is a candidate.

- **Routes and pages:** file-based routes, a router config, every page in the sitemap, and redirects and rewrites.
- **Build and framework conventions:** files the framework loads by name (`middleware.ts`, `layout.tsx`, `+page.svelte`, config files, `public/` files served by path), and the build tool's entry and input settings.
- **package.json:** `main`, `exports`, `bin`, and every script, including what CI and git hooks run.
- **Code loaded by string:** dynamic `import()` with a template path, `require` of a computed name, glob imports (`import.meta.glob`), CSS `url()`, assets named in Markdown, MDX, JSON or a CMS.
- **Outside callers:** URLs other sites link to, an API another repo calls, exports of a published package, webhooks, cron jobs. Unused by this repo isn't unused. Name these to the user rather than deciding.

Done when every way into the project is on the list and you can say where each came from.

## 2. Find unused files and exports

For a JavaScript or TypeScript project, run `npx knip` (it reads most framework conventions and reports unused files, exports and dependencies together); if it needs config, write a temporary `knip.json` from the entry points in step 1. Other languages have their own tools (`vulture` for Python, `staticcheck` or `deadcode` for Go, `cargo +nightly udeps` and compiler warnings for Rust). Treat the tool's list as leads, then confirm each one by searching the whole repo for its name, its file name without the extension, and its URL, since string-loaded code from step 1 is invisible to import graphs.

Check each kind:

- **Pages:** routes nothing on the current site links to. They still build, ship and sit in the sitemap.
- **Components and modules:** imported only by other unreachable files, or not at all.
- **Exports:** functions, types and constants exported but imported nowhere. An export used only inside its own file can lose the `export`; one used nowhere can go.
- **Assets:** images, videos and downloads in the public folder that no page, stylesheet or content file references.
- **Fonts:** compare the families and weights the current design uses with what each page loads and preloads. Preloaded fonts a page never uses are common and cost every visitor.

## 3. Find unused dependencies

Run `npx knip --dependencies` (or `npx depcheck`). Before calling a package unused, check the places import graphs miss: CLIs called from scripts or CI, plugins named as strings in config files (Babel, PostCSS, ESLint, Tailwind), peer dependencies another package needs, and `@types/*` packages for something still used. Also flag the reverse: packages imported in code but missing from `package.json`, which work only because something else installs them.

Note whether each package is in `dependencies` or `devDependencies`; one in the wrong list ships or installs where it shouldn't.

## 4. Find code that never runs

A file can be reachable while parts of it never run. Read for these:

- **Conditions that always go one way:** a check on a constant or an env var that is always set the same way, a feature flag that is fully rolled out or never turned on, a branch for a browser, platform or API version the project no longer supports.
- **Cases the types already rule out:** a `default:` or `else` after every case is handled, a null check on something that can't be null, a `catch` around code that can't throw.
- **Code after the exit:** statements after a `return` or `throw`, handlers for events nothing emits, options no caller passes.

**Coverage** shows what actually runs. Collect it two ways and compare:

- **From the tests:** run the suite with coverage on (`vitest --coverage`, `jest --coverage`, `pytest --cov`, `go test -cover`).
- **From real use:** click through every page of a production build while collecting browser coverage (Playwright's `page.coverage.startJSCoverage()`, or the Coverage panel in Chrome DevTools), and run the server under `c8` or with `NODE_V8_COVERAGE` set.

A line no test and no real use reaches is a strong lead. A line tests cover but real use never does may be dead code kept alive by its own tests. Coverage is evidence, never proof: an error handler or a rare branch is supposed to stay cold. Read each cold branch and say why it can't run, or move it to "needs the author".

## 5. Find dead tests

- **Tests that never run:** files outside the runner's include pattern, or with a name it doesn't match. List what the runner collects (`vitest list`, `jest --listTests`, `pytest --collect-only`, `go test -list .`) and compare it with the test files on disk.
- **Skipped tests:** `.skip`, `xit`, `xdescribe`, `@pytest.mark.skip`, `t.Skip()`, and `.only` left in, which silently skips everything else.
- **Tests of code that's gone:** tests that import a deleted or renamed module, mock a function that no longer exists, or exercise a helper only the test file defines. These pass while checking nothing.
- **Tests of dead code:** tests whose only subject is something steps 2 to 4 found unused. They go with the code.

## 6. Report

Sort every candidate by how sure you are:

- **Unused:** unreachable from every entry point, no string reference anywhere, and the tool and your search agree.
- **Probably unused:** one signal is missing (no import, but the name appears in a comment or a string; cold in coverage, but you couldn't prove the branch is impossible).
- **Needs the author:** reached from outside the repo, kept on purpose, or both. Evidence of on purpose: a comment giving a reason, a draft or archive the author keeps, a flag they plan to turn on, a note in the README or CLAUDE.md. List these separately, not as findings.

For each, give the path and line, what it is, the evidence (the tool's output, the search that found nothing, the coverage number), and what goes with it (its tests, its assets, a package only it imports). Group what must go together: a page, its components, its images and the package only they use come out as one removal.

When running inside `audit`, write these as findings in the shape in `../audit/SKILL.md`, under the `Prune` check: unused packages that ship to the browser and fonts preloaded on every page are Moderate, the rest Minor. Stop at the report: removal happens in the audit's fix step, once the user has picked.

## 7. Remove what the user picks

Delete nothing until the user says which candidates to remove. Then, one candidate or group at a time:

- **Pages:** decide with the user where each old URL goes: a permanent redirect to an archived copy or the nearest current page, or a 404. Request every redirect and check its destination returns a page.
- **Dependencies:** remove them with the package manager so the lockfile updates, then do a clean install.
- **After each removal:** run the build, the type check and the tests, and load any page the removed code touched. If anything breaks, the candidate wasn't unused: restore it and move it to "needs the author".

Finish by removing whatever you added to scan with (a temporary `knip.json`, a coverage folder, a package installed only to scan), unless the user wants to keep it. Report what was removed, grouped as it was removed, and what it saved: files, lines, packages, and the install and bundle size if they changed. Never commit unless asked.
