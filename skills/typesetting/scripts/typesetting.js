// Measures how the type on this page is set, against references/rules.md.
// Paste into the page's console, or run it with the browser tool's
// JavaScript runner. Run it once per page and theme; measure and leading
// also change with width, so run it at a phone and a laptop width.
//
// Returns an object with one key per section of the rules. Each list holds
// what to look at, with the element and a snippet of its text. It reports
// candidates, not verdicts: a straight quote inside a quoted code sample, or
// a deliberately tight heading, is still the author's call. Empty lists mean
// nothing was found.
(() => {
  const LIMIT = 25;
  const SKIP = "code, pre, kbd, samp, script, style, textarea, svg, [aria-hidden='true']";
  const TEXT = "h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, figcaption, td, th, a, button, label, span";

  const name = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
      el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : ""
    }`;
  // Visible to sighted readers: laid out, not hidden, and not shrunk to a
  // screen-reader-only box (1px, clipped).
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return el.getClientRects().length > 0 && cs.visibility !== "hidden" && r.width > 1 && r.height > 1 &&
      cs.clip !== "rect(0px, 0px, 0px, 0px)" && !/inset\(50%\)/.test(cs.clipPath);
  };
  const snippet = (s, i, len) => s.slice(Math.max(0, i - 20), i + len + 20).replace(/\s+/g, " ").trim();
  const capped = (list) => ({ count: list.length, items: list.slice(0, LIMIT) });

  // A page with no width (a hidden or minimised browser pane) wraps every line
  // after a word or two, which makes the measure meaningless.
  if (innerWidth < 300)
    return { error: `The window is ${innerWidth}px wide. Show the browser, or set a real viewport width, and run this again.` };

  // Every visible text node outside code and decoration.
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const el = n.parentElement;
    if (!el || !n.data.trim() || el.closest(SKIP) || !visible(el)) continue;
    nodes.push(n);
  }

  // Marks.
  const MARKS = [
    ["Straight double quote", /"/g],
    ["Straight apostrophe or single quote", /'/g],
    ["Backwards apostrophe", /‘(?=\d\ds\b|til\b|em\b|cause\b|n’)/gi],
    ["Spaced em dash", / — | — /g],
    ["Hyphen or double hyphen as a dash", /\w ?-- ?\w| - /g],
    ["Hyphen in a year range", /\b(1[0-9]|20)\d\d-(1[0-9]|20)?\d\d\b/g],
    ["Letter x as a multiplication sign", /\d ?x ?\d|\b\d+(\.\d+)?x\b/g],
    ["Hyphen as a minus sign", /(^|[\s(])-\d/g],
    ["Three full stops for an ellipsis", /\.\.\./g],
    ["Breakable space between a number and its unit", /\d (km|kg|mi|cm|mm|m|g|lbs?|oz|kB|KB|MB|GB|TB|px|ms|min|hrs?|h|s|%|°[CF]?)(?![\w])/g],
  ];
  const marks = Object.fromEntries(MARKS.map(([label]) => [label, []]));
  for (const node of nodes) {
    for (const [label, re] of MARKS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(node.data))) {
        marks[label].push({ element: name(node.parentElement), text: snippet(node.data, m.index, m[0].length) });
        if (m[0].length === 0) re.lastIndex++;
      }
    }
  }

  // Text elements, for the computed-style checks.
  const els = [...document.querySelectorAll(TEXT)].filter(
    (el) => visible(el) && !el.closest(SKIP) && [...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim()),
  );

  // Lines: measure (average characters per line) and leading.
  const lineCount = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top / 4)));
    return tops.size;
  };
  const measure = [];
  for (const el of document.querySelectorAll("p")) {
    if (!visible(el) || el.closest(SKIP)) continue;
    const text = el.textContent.replace(/\s+/g, " ").trim();
    const lines = lineCount(el);
    if (lines < 3) continue;
    const perLine = Math.round(text.length / lines);
    if (perLine > 80 || perLine < 40)
      measure.push({ element: name(el), charactersPerLine: perLine, lines, text: text.slice(0, 60) });
  }
  const leading = {};
  for (const el of els) {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight) / size;
    const key = `${el.tagName.toLowerCase()} ${size}px`;
    if (!leading[key]) leading[key] = { element: key, lineHeight: lh === null ? "normal" : +lh.toFixed(2), count: 0 };
    leading[key].count++;
  }

  // Letter-spacing on capitals and lowercase.
  const letterSpacing = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) / size;
    const text = el.textContent.trim();
    const caps = cs.textTransform === "uppercase" || (text.length > 3 && text === text.toUpperCase() && /[A-Z]/.test(text));
    if (caps && ls <= 0) letterSpacing.push({ element: name(el), issue: "Capitals with no added letter-spacing", letterSpacingEm: +ls.toFixed(3), text: text.slice(0, 40) });
    else if (!caps && ls > 0.05 && size < 32) letterSpacing.push({ element: name(el), issue: "Lowercase text tracked out", letterSpacingEm: +ls.toFixed(3), text: text.slice(0, 40) });
  }

  // Figures: tables and changing numbers without tabular figures.
  const figures = [];
  for (const table of document.querySelectorAll("table")) {
    if (!visible(table)) continue;
    const cells = [...table.querySelectorAll("td")].filter((td) => td.textContent.trim());
    const numeric = cells.filter((td) => /^[\s$€£¥+−-]*[\d.,]+\s*%?\s*$/.test(td.textContent));
    if (numeric.length && numeric.length / cells.length > 0.3) {
      const off = numeric.filter((td) => !getComputedStyle(td).fontVariantNumeric.includes("tabular-nums"));
      if (off.length) figures.push({ element: name(table), issue: "Numeric table cells without tabular figures", cells: off.length });
    }
  }
  for (const el of document.querySelectorAll("[class*='price' i], [class*='count' i], [class*='timer' i], [class*='score' i], [class*='stat' i], time, output, [role='timer']")) {
    if (!visible(el) || !/\d/.test(el.textContent)) continue;
    if (!getComputedStyle(el).fontVariantNumeric.includes("tabular-nums"))
      figures.push({ element: name(el), issue: "Changing or aligned number without tabular figures", text: el.textContent.trim().slice(0, 30) });
  }

  // Real styles: compare each weight and style in use with the font faces.
  // Every face the page declares, loaded or not: the browser loads a declared
  // face when text needs it, so only a face that's missing (or failed) is faked.
  const faces = [...document.fonts].filter((f) => f.status !== "error");
  const family = (cs) => cs.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
  const weightRange = (w) => {
    const [a, b] = String(w).split(/\s+/).map((x) => (x === "normal" ? 400 : x === "bold" ? 700 : +x));
    return [a, b ?? a];
  };
  const used = {};
  for (const el of els) {
    const cs = getComputedStyle(el);
    const key = `${family(cs)}|${cs.fontWeight}|${cs.fontStyle}`;
    if (!used[key]) used[key] = { family: family(cs), weight: +cs.fontWeight, style: cs.fontStyle, synthesis: cs.fontSynthesis, element: name(el), count: 0 };
    used[key].count++;
  }
  const fauxStyles = [];
  for (const u of Object.values(used)) {
    const mine = faces.filter((f) => f.family.replace(/^["']|["']$/g, "") === u.family);
    if (!mine.length) continue; // A system font or one the page doesn't declare: nothing to compare.
    const italic = u.style !== "normal";
    const sameStyle = mine.filter((f) => (f.style !== "normal") === italic);
    if (italic && !sameStyle.length)
      fauxStyles.push({ ...u, issue: "Italic requested, no italic face declared: the browser slants the roman" });
    const pool = sameStyle.length ? sameStyle : mine;
    const maxWeight = Math.max(...pool.map((f) => weightRange(f.weight)[1]));
    if (u.weight >= 600 && maxWeight < 600)
      fauxStyles.push({ ...u, issue: `Weight ${u.weight} requested, heaviest declared face is ${maxWeight}: the browser fakes the bold` });
  }

  // Justification and hyphenation.
  const lang = document.documentElement.lang || null;
  const justification = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.textAlign !== "justify") continue;
    justification.push({ element: name(el), hyphens: cs.hyphens, lang, issue: cs.hyphens !== "auto" ? "Justified without hyphenation" : !lang ? "Hyphenation set but no lang attribute" : null });
  }

  // Paragraph signals: indent and space together, or an indent after a heading.
  const paragraphs = [];
  for (const p of document.querySelectorAll("p + p")) {
    if (!visible(p)) continue;
    const cs = getComputedStyle(p);
    if (parseFloat(cs.textIndent) > 0 && parseFloat(cs.marginTop) > parseFloat(cs.fontSize) * 0.3)
      paragraphs.push({ element: name(p), issue: "Indent and space between paragraphs together", textIndent: cs.textIndent, marginTop: cs.marginTop });
  }
  for (const p of document.querySelectorAll("h1 + p, h2 + p, h3 + p, h4 + p")) {
    if (visible(p) && parseFloat(getComputedStyle(p).textIndent) > 0)
      paragraphs.push({ element: name(p), issue: "First paragraph after a heading is indented", textIndent: getComputedStyle(p).textIndent });
  }

  // Kerning and ligatures.
  const kerning = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.fontKerning === "none") kerning.push({ element: name(el), issue: "Kerning turned off" });
    const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
    if (ls === 0 && cs.fontVariantLigatures === "none") kerning.push({ element: name(el), issue: "Ligatures turned off in text that isn't letter-spaced" });
    if (ls > 0 && cs.fontVariantLigatures !== "none" && /f[filt]/i.test(el.textContent))
      kerning.push({ element: name(el), issue: "Ligatures left on in letter-spaced text", text: el.textContent.trim().slice(0, 40) });
  }

  return {
    page: location.pathname,
    width: innerWidth,
    lang,
    marks: Object.fromEntries(Object.entries(marks).filter(([, v]) => v.length).map(([k, v]) => [k, capped(v)])),
    lines: { measure: capped(measure), leading: Object.values(leading), letterSpacing: capped(letterSpacing) },
    figures: capped(figures),
    fauxStyles,
    justification: justification.filter((j) => j.issue),
    paragraphs: capped(paragraphs),
    kerning: capped(kerning),
  };
})();
