// Which text follows the browser's default text size? Paste into the page.
//
// Simulates a visitor who has raised their browser's default font size from
// 16px to 24px (1.5×), by scaling the root font size the way the browser
// would, then reports which text grew and which stayed put. Text set in px
// ignores the setting; rem and em follow it. Restores the page afterwards.

const SCALE = 1.5;
const root = document.documentElement;
const els = [...document.querySelectorAll("body *")].filter(
  (e) =>
    e.getClientRects().length &&
    [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()),
);
const before = new Map(els.map((e) => [e, parseFloat(getComputedStyle(e).fontSize)]));

// The root's size as authored (an inline style, or the stylesheet's value).
const authored = getComputedStyle(root).fontSize;
const rootRule = [...document.styleSheets]
  .flatMap((s) => {
    try {
      return [...s.cssRules];
    } catch {
      return [];
    }
  })
  .find((r) => r.selectorText === "html" && r.style?.fontSize)?.style.fontSize;
// If the root is relative (%, em, rem) or unset, it scales with the default.
const relative = !rootRule || /%|em$/.test(rootRule);
root.style.fontSize = relative
  ? `calc(${parseFloat(authored)}px * ${SCALE})`
  : rootRule; // a px root ignores the setting entirely

let scaled = 0;
const stuck = {};
for (const e of els) {
  const a = before.get(e);
  const b = parseFloat(getComputedStyle(e).fontSize);
  if (Math.abs(b - a * SCALE) < 0.5) scaled++;
  else {
    const key = `${e.tagName.toLowerCase()} ${a}px`;
    stuck[key] = (stuck[key] || 0) + 1;
  }
}
const sideways = root.scrollWidth > innerWidth;
root.style.fontSize = "";

({
  rootFontSize: rootRule || "(browser default)",
  textElements: els.length,
  scaled,
  stuck,
  scrollsSidewaysWhenLarger: sideways,
});
