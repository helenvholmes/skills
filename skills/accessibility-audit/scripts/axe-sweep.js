// Runs axe-core on every page × theme, from inside any page of the same site.
// Paste into whatever runs JavaScript in the page (a browser automation tool,
// or the devtools console) after editing the two settings below. Run it once
// per colour scheme, switching light/dark with your tool's emulation first:
// the iframes inherit the scheme of the tab.
//
// Each page loads in a hidden same-origin iframe with animations and
// transitions turned off, so text mid-fade doesn't come back as "incomplete".
// If axe won't load, the site has a Content-Security-Policy: scan a local copy
// of the production build with the CSP <meta> removed (see SKILL.md).

// ---- Settings -------------------------------------------------------------
// Paths to scan. Include the 404 page (any path that doesn't exist).
const PAGES = ["/", "/about", "/this-page-does-not-exist"];
// One entry per theme, each preparing the browser before a page loads. Use
// [null] for a site with one theme. Example for a site that keeps its theme
// in localStorage:
//   const THEMES = ["red", "blue"].map((t) => () => localStorage.setItem("theme", t));
const THEMES = [null];
// --------------------------------------------------------------------------

const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const scheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const results = {};

for (const path of PAGES) {
  for (const [t, setTheme] of THEMES.entries()) {
    if (setTheme) setTheme();
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;left:-3000px;width:1280px;height:800px";
    frame.src = path;
    document.body.append(frame);
    await new Promise((resolve) => (frame.onload = resolve));
    const win = frame.contentWindow;
    const doc = win.document;

    const still = doc.createElement("style");
    still.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
    doc.head.append(still);

    const key = `${scheme} ${path}${THEMES.length > 1 ? ` theme ${t}` : ""}`;
    try {
      await new Promise((resolve, reject) => {
        const s = doc.createElement("script");
        s.src = AXE;
        s.onload = resolve;
        s.onerror = reject;
        doc.head.append(s);
      });
      const { violations } = await win.axe.run(doc);
      results[key] = violations.length
        ? violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            count: v.nodes.length,
            help: v.help,
            examples: v.nodes.slice(0, 2).map((n) => ({
              target: n.target.join(" "),
              summary: n.failureSummary.replace(/\s+/g, " ").slice(0, 240),
            })),
          }))
        : "clean";
    } catch {
      results[key] = "axe could not load (Content-Security-Policy?)";
    }
    frame.remove();
  }
}

results;
