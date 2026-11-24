// Is text still readable when someone selects it? Paste into the page, or run
// it with the browser tool's JavaScript runner, on each page in each theme and
// colour scheme.
//
// People select text to copy it, to keep their place while reading, and to
// have it read aloud, so selected text has to stay readable. The browser's own
// selection colours are built to work with any page. A site's ::selection
// rule replaces them, and that's where it breaks: a background set without a
// text colour, so brand-coloured links vanish into a brand-coloured highlight;
// a light-theme highlight left in place for the dark theme; a translucent
// highlight that washes text out; one colour for the whole page that doesn't
// suit the dark code block inside it.
//
// The same goes for the other highlights an author can style: ::target-text
// (the passage a #:~:text= link scrolls to), ::highlight() (custom
// highlights, often search results), and <mark>.
//
// Returns { rules, defaultSelection, pairs, failing, marks, cantSelect, leads }:
//   rules             the stylesheet rules that style a highlight, with their
//                     declarations. Cross-origin sheets can't be read and are
//                     counted in `unreadableSheets`.
//   defaultSelection  true when no ::selection rule was found, so the
//                     browser's own colours apply and `pairs` is empty.
//   pairs             each distinct selected-text colour on selected-highlight
//                     colour, worst first, with its contrast ratio, the ratio
//                     it needs (4.5, or 3 for large text), how many elements
//                     use it, and a few to find it by. A translucent highlight
//                     is blended with what's under it first.
//   failing           the pairs below what they need.
//   marks             the same for <mark> elements, which aren't selections
//                     but are read the same way.
//   cantSelect        prose with user-select: none, which can't be selected,
//                     copied or read aloud from a selection at all.
//   leads             things a number can't settle: highlights over a
//                     background image or gradient, gradient text
//                     (background-clip: text with a transparent fill, which
//                     often turns into a blank box when selected), and
//                     ::selection rules with no background or no colour.
//
// The numbers come from getComputedStyle(element, "::selection"), which
// Chromium resolves per element. Treat them as leads and confirm by looking:
// select the text for real and screenshot it (see SKILL.md).
(() => {
  // Turn any CSS colour (oklch, color-mix, named, ...) into [r, g, b, a].
  const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 })
    .getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    if (!css || css === "transparent") return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top, under) => {
    const a = top[3] + under[3] * (1 - top[3]);
    if (!a) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a);
  };
  const lum = ([r, g, b]) => {
    const c = [r, g, b].map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") +
    (c[3] < 1 ? ` (${Math.round(c[3] * 100)}% opaque)` : "");

  const name = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") +
    (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
  const snippet = (el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 50);

  // 1. Which highlight rules does the site have?
  const HIGHLIGHT = /::(-moz-)?selection|::target-text|::highlight\(/;
  const rules = [];
  let unreadableSheets = 0;
  const walk = (list, where) => {
    for (const r of list) {
      if (r.selectorText && HIGHLIGHT.test(r.selectorText)) {
        rules.push({ selector: r.selectorText, where: where || undefined, css: r.style.cssText });
      }
      if (r.cssRules) walk(r.cssRules, r.conditionText || r.media?.mediaText || r.name || where);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, ""); } catch { unreadableSheets++; }
  }
  const selectionRules = rules.filter((r) => /selection/.test(r.selector));
  const defaultSelection = selectionRules.length === 0;

  // 2. The background behind an element: composite translucent layers up the
  // tree until something opaque. Stops at a background image or gradient.
  const canvasColour = () => {
    for (const el of [document.body, document.documentElement]) {
      const c = rgba(getComputedStyle(el).backgroundColor);
      if (c[3] > 0) return c;
    }
    const dark = matchMedia("(prefers-color-scheme: dark)").matches &&
      /dark/.test(getComputedStyle(document.documentElement).colorScheme);
    return dark ? [18, 18, 18, 1] : [255, 255, 255, 1];
  };
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== "none") return { image: name(n) };
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let bg = layers.length && layers.at(-1)[3] >= 1 ? layers.pop() : canvasColour();
    while (layers.length) bg = over(layers.pop(), bg);
    return { colour: bg };
  };

  // checkVisibility doesn't depend on the window's size, so this works in a
  // hidden or collapsed browser pane too.
  const visible = (el) => el.checkVisibility
    ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    : el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  // Elements that hold text of their own.
  const textual = [...document.body.querySelectorAll("*")].filter((el) =>
    !el.closest("script, style, noscript, template, svg") &&
    [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim()) && visible(el));

  const large = (s) => {
    const px = parseFloat(s.fontSize);
    return px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
  };

  const groups = new Map();
  const add = (map, key, el, entry) => {
    const g = map.get(key) || { ...entry, count: 0, examples: [] };
    g.count++;
    if (g.examples.length < 4) g.examples.push(`${name(el)} "${snippet(el)}"`);
    map.set(key, g);
  };
  const leads = [];
  const lead = (kind, el, detail) => {
    if (leads.filter((l) => l.kind === kind).length < 12) leads.push({ kind, element: name(el), text: snippet(el), detail });
  };

  for (const el of textual) {
    const s = getComputedStyle(el);

    if (s.backgroundClip === "text" || s.webkitBackgroundClip === "text") {
      if (rgba(s.webkitTextFillColor || s.color)[3] === 0) {
        lead("gradient-text", el, "transparent fill over background-clip: text; select it and look");
        continue;
      }
    }

    if (defaultSelection || s.userSelect === "none") continue;
    const sel = getComputedStyle(el, "::selection");
    let fg = rgba(sel.color);
    const hl = rgba(sel.backgroundColor);
    const under = backdrop(el);
    if (under.image) { lead("over-image", el, `highlight sits over the background image on ${under.image}`); continue; }
    if (hl[3] === 0) { lead("no-highlight-background", el, "::selection has no background; select it and look"); continue; }
    const shown = over(hl, under.colour);
    if (fg[3] < 1) fg = over(fg, shown);
    const need = large(s) ? 3 : 4.5;
    const key = `${hex(fg)}|${hex(shown)}|${need}`;
    add(groups, key, el, {
      text: hex(fg), highlight: hex(hl), shown: hl[3] < 1 ? hex(shown) : undefined,
      ratio: ratio(fg, shown), need,
    });
  }

  const marks = new Map();
  for (const el of document.querySelectorAll("mark")) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const under = backdrop(el.parentElement || el);
    if (under.image) { lead("over-image", el, `<mark> over the background image on ${under.image}`); continue; }
    const bg = over(rgba(s.backgroundColor), under.colour);
    const fg = over(rgba(s.color), bg);
    const need = large(s) ? 3 : 4.5;
    add(marks, `${hex(fg)}|${hex(bg)}|${need}`, el, { text: hex(fg), highlight: hex(bg), ratio: ratio(fg, bg), need });
  }

  const cantSelect = [];
  for (const el of textual) {
    if (getComputedStyle(el).userSelect !== "none") continue;
    if (el.closest('button, a, label, summary, [role="button"], [role="tab"], [role="menuitem"], input, select, nav')) continue;
    if (cantSelect.some((c) => c.el.contains(el))) continue;
    if (el.textContent.trim().length < 40) continue;
    cantSelect.push({ el, element: name(el), text: snippet(el) });
  }

  for (const r of selectionRules) {
    const has = (p) => new RegExp(`(^|;)\\s*${p}\\s*:`).test(r.css);
    if (!has("color")) leads.push({ kind: "rule-without-color", rule: r.selector,
      detail: "sets no color, so each element keeps its own text colour on the new highlight" });
    if (!has("background(-color)?")) leads.push({ kind: "rule-without-background", rule: r.selector,
      detail: "sets no background" });
  }

  const sort = (m) => [...m.values()].sort((a, b) => a.ratio / a.need - b.ratio / b.need);
  const pairs = sort(groups);
  return {
    rules, unreadableSheets, defaultSelection,
    pairs, failing: pairs.filter((p) => p.ratio < p.need),
    marks: sort(marks),
    cantSelect: cantSelect.map(({ element, text }) => ({ element, text })),
    leads,
  };
})();
