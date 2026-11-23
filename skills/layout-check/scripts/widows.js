// Finds headings and paragraphs whose last line is a single word (a widow
// or orphan, depending on who you ask). Paste into the page's console, or run
// it with the browser tool's JavaScript runner, at each width you test.
//
// Returns one entry per offender: the element, its last two lines, and the
// text-wrap value it currently has. An empty list means nothing to fix.
(() => {
  const lines = (el) => {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const re = /\S+/g;
      let m;
      while ((m = re.exec(node.data))) {
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rect = range.getClientRects()[0];
        if (!rect) continue;
        const top = Math.round(rect.top);
        const last = out[out.length - 1];
        if (!last || Math.abs(last.top - top) > 4) out.push({ top, words: [] });
        out[out.length - 1].words.push(m[0]);
      }
    }
    return out.map((l) => l.words.join(" "));
  };

  const selector = "h1, h2, h3, h4, p, li, dt, dd, blockquote, figcaption";
  return [...document.querySelectorAll(selector)]
    // Skip hidden and decorative text, and anything rotated or moved by a
    // transform: its words sit at different heights, so it isn't wrapping.
    .filter(
      (el) =>
        el.offsetParent &&
        !el.closest("[aria-hidden='true']") &&
        getComputedStyle(el).transform === "none",
    )
    .map((el) => ({ el, l: lines(el) }))
    .filter(({ l }) => l.length > 1 && l[l.length - 1].split(" ").length === 1)
    .map(({ el, l }) => ({
      element: `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}`,
      ending: l.slice(-2).join(" / "),
      textWrap: getComputedStyle(el).textWrap,
    }));
})();
