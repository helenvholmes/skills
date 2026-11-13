---
name: security-audit
description: Check a website or web app for the security problems that actually ship — known vulnerabilities in the dependencies that reach production, a lockfile out of step with package.json, risky framework features switched on but unused, missing security headers and Content-Security-Policy, secrets in the repo or its history, and private pages that can be indexed or opened without a password. Use this whenever the user asks for a security audit or review, asks whether a site is safe or secure, mentions CVEs, npm audit, Dependabot, headers or CSP, or is about to publish a page with personal information on it.
---

# Security audit

Read `../audit/references/principles.md` first if it's there. Report only what you've verified; say plainly what you couldn't see (production's actual installed versions, for instance, depend on how the host installs).

## 1. Dependencies

- **Is there a lockfile at all?** Check it's committed, not just present: look in `.gitignore` too. Without one, every install resolves the version ranges fresh, so a deploy can ship dependency versions nobody tested, and the audit can't say what production runs. That's a finding on its own: commit the lockfile and install with `npm ci` (or the equivalent). To audit anyway, generate a lockfile in a scratch copy (`npm install --package-lock-only`) and say the result is an approximation.
- **What's actually installed.** Compare `package.json` with the lockfile. Automated bumps sometimes change one without the other, so the installed version can be older than it looks. Then check how the host installs (`npm ci` follows the lockfile; `npm install` follows `package.json`) to know which one production uses.
- **Advisories that reach visitors.** Run the package manager's audit (`npm audit --omit=dev`, or the equivalent), and separate production dependencies from build and development tools. A critical advisory in a test runner isn't the same as one in the framework that serves pages.
- **Advisories against features in use.** For each advisory in the framework, check whether the site uses the affected feature (rewrites, image optimisation, server actions, middleware). Those come first.
- The fix is usually an upgrade with a regenerated lockfile. Say which version.

## 2. Features switched on but unused

Frameworks often enable things by default that carry their own risks: an image optimisation service, server-side rendering paths, API routes. If the site doesn't need one, turning it off removes a whole class of problems. Leftovers count too: allowed remote image hosts, CORS origins or redirects nothing uses any more.

## 3. Headers

Check what the live site actually sends (`curl -sI`), not just what config files say, and check `<meta http-equiv>` tags in the HTML too.

- **Content-Security-Policy:** a policy that allows only the site's own scripts, with hashes for any inline scripts, blocks most injected code. Static site frameworks can often generate one with the hashes at build time. A policy in a `<meta>` tag only covers what comes after it, so it should be the first thing in `<head>`, before any inline script.
- **`frame-ancestors 'none'`** (in the CSP header, since it doesn't work in a `<meta>` tag), to stop other sites embedding the page.
- **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy`**, and **HSTS**. Many hosts add HSTS themselves, so confirm it in the live response rather than assuming either way.

When proposing a CSP, check every page still works with it: inline scripts and styles, third-party embeds and analytics are what usually break.

## 4. Secrets

- Search the working tree and the git history for keys, tokens and passwords (`git log -p` with patterns like `api[_-]?key`, `secret`, `token`, `password`, and known prefixes such as `sk-`, `ghp_`, `AKIA`).
- Check `.env` files are ignored, and that nothing secret is in files bundled for the browser (anything prefixed for public use in the framework's env conventions is visible to everyone).
- A secret found in history is exposed even if it's since been deleted: it needs revoking, not just removing.

## 5. Private and personal content

Pages carrying personal information (references' contact details, private notes, unreleased work) need both:

- **Not indexed:** `noindex` in a robots meta tag or `X-Robots-Tag` header, left out of the sitemap, and not linked from public pages. `robots.txt` alone isn't enough; it's a request, and it advertises the path.
- **Not openable without access:** real authentication or at least a password checked on the server. A password checked only in browser JavaScript, or content hidden with CSS, is visible to anyone who views the source.

## 6. Everything else visitors can touch

- Forms and any user input: validated on the server, protected against cross-site request forgery where it changes anything.
- `target="_blank"` links: `rel="noopener"` (modern browsers imply it, but older ones don't).
- Inline HTML from content (`dangerouslySetInnerHTML`, `set:html`, `v-html`): escaped, or from a source the author controls.
- Third-party scripts: each one can do anything on the page. List them.

## 7. Report

Use the shape in `../audit/SKILL.md` when running inside an audit. Put anything exploitable that reaches production under Serious, with the specific advisory or evidence. Development-only advisories go under Minor with a note that they never ship.
