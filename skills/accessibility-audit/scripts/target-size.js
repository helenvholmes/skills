// Which pointer targets are smaller than 24×24 CSS px? Paste into the page, or
// run it with the browser tool's JavaScript runner, on each page (and again
// with any menu or dialog open, and at a phone width).
//
// WCAG 2.2 2.5.8 Target Size (Minimum), AA: every pointer target is at least
// 24×24 CSS px, unless one of these applies:
//   spacing     a 24px circle centred on the target touches no other target,
//               and no other undersized target's circle
//   inline      the target sits in a sentence or block of text, so the line
//               height limits it (a link in a paragraph)
//   user-agent  the browser sets the size and the author hasn't changed it (an
//               unstyled checkbox)
//   equivalent  another control on the same page does the same thing and
//               meets the size
//   essential   this size or position is essential to the information (a pin
//               on a map)
// The script works out spacing and inline itself, flags likely user-agent
// controls for you to confirm, and can't judge equivalent or essential: look
// at each failure for those.
//
// Size is the target's own box (padding included). When that box is under 24,
// the script also probes a 24×24 square around its centre with
// elementFromPoint: a hit area stretched by padding on a child, or by a
// ::before/::after pseudo-element, counts as the target, so those pass. The
// probe scrolls each undersized target into view and restores the scroll
// afterwards; anything covering it (a sticky header) makes the probe miss,
// which only ever leaves the measured box in place.
//
// Returns { floor, targets, undersized, counts, skipped }. Each entry in
// `undersized` has:
//   element  a short selector: tag, id, first class
//   text     its name or the start of its text, to find it on the page
//   size     rendered width × height in CSS px
//   verdict  "fail", "pass: spacing", "exception: inline", or
//            "check: user-agent" (confirm the author hasn't restyled it)
//   detail   what's too close, or which exception applies
//
// Run it in a tab with a real window size: in a hidden or collapsed pane
// everything measures 0 and nothing is reported.
(() => {
  const FLOOR = 24;
  const R = FLOOR / 2;
  const TARGET =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, label[for], label:has(input), ' +
    '[role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], ' +
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="slider"], ' +
    '[role="combobox"], [role="treeitem"], [onclick], [tabindex]:not([tabindex="-1"])';

  const describe = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
      typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : ""
    }${el.getAttribute("type") ? `[type="${el.getAttribute("type")}"]` : ""}`;
  const textOf = (el) =>
    (el.getAttribute("aria-label") || el.labels?.[0]?.textContent || el.textContent || el.getAttribute("title") ||
      el.querySelector("img")?.alt || el.value || "")
      .replace(/\s+/g, " ").trim().slice(0, 60);

  // Skip what no pointer can hit: not rendered, hidden, disabled, inert, or
  // clipped to a pixel (visually hidden skip links until they're focused).
  const skipped = { hidden: 0, disabled: 0, visuallyHidden: 0 };
  const hittable = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!el.getClientRects().length || s.visibility === "hidden" || s.pointerEvents === "none" || el.closest("[inert]")) {
      skipped.hidden++;
      return false;
    }
    if (el.disabled || el.getAttribute("aria-disabled") === "true") {
      skipped.disabled++;
      return false;
    }
    if (r.width <= 1 || r.height <= 1 || /rect\(0|inset\(50%/.test(s.clip + s.clipPath)) {
      skipped.visuallyHidden++;
      return false;
    }
    return true;
  };
  const targets = [...new Set(document.querySelectorAll(TARGET))].filter(hittable);
  const scrollX0 = scrollX, scrollY0 = scrollY;
  const page = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left + scrollX, top: r.top + scrollY, right: r.right + scrollX, bottom: r.bottom + scrollY, width: r.width, height: r.height };
  };
  const boxes = new Map(targets.map((el) => [el, page(el)]));

  // Inline: an inline-level target sharing its line box with ordinary text.
  const inline = (el) => {
    if (!getComputedStyle(el).display.startsWith("inline") || el.matches("input, select, textarea, button")) return false;
    let block = el.parentElement;
    while (block && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
    if (!block) return false;
    const own = [...block.querySelectorAll(TARGET)].reduce((t, a) => t + a.textContent.length, 0);
    return block.textContent.replace(/\s+/g, " ").trim().length - own > 20;
  };

  // User agent: a native control with its default appearance and no size of
  // the author's. Can't see the stylesheet's intent, so this is a lead.
  const userAgent = (el) =>
    el.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"], input[type="file"], select') &&
    getComputedStyle(el).appearance !== "none";

  // Does a 24×24 square around the centre all land on the target? Catches hit
  // areas grown by a pseudo-element or a child's padding.
  const probe = (el) => {
    el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (const dx of [-R + 1, 0, R - 1]) for (const dy of [-R + 1, 0, R - 1]) {
      const hit = document.elementFromPoint(cx + dx, cy + dy);
      if (!hit || !(hit === el || el.contains(hit))) return false;
    }
    return true;
  };

  const related = (a, b) => a.contains(b) || b.contains(a) ||
    (a.labels && [...a.labels].includes(b)) || (b.labels && [...b.labels].includes(a));
  const centre = (b) => [(b.left + b.right) / 2, (b.top + b.bottom) / 2];
  const circleHitsBox = ([x, y], b) => {
    const nx = Math.max(b.left, Math.min(x, b.right)), ny = Math.max(b.top, Math.min(y, b.bottom));
    return Math.hypot(x - nx, y - ny) < R;
  };

  const small = targets.filter((el) => {
    const b = boxes.get(el);
    return b.width < FLOOR - 0.5 || b.height < FLOOR - 0.5;
  }).filter((el) => !probe(el));
  scrollTo({ left: scrollX0, top: scrollY0, behavior: "instant" });
  const smallSet = new Set(small);

  const undersized = small.map((el) => {
    const b = boxes.get(el);
    const entry = { element: describe(el), text: textOf(el), size: `${Math.round(b.width)}×${Math.round(b.height)}` };
    if (inline(el)) return { ...entry, verdict: "exception: inline", detail: "in a line of text" };
    const c = centre(b);
    const near = targets.filter((o) => {
      if (o === el || related(el, o)) return false;
      const ob = boxes.get(o);
      if (circleHitsBox(c, ob)) return true;
      if (smallSet.has(o)) {
        const [ox, oy] = centre(ob);
        return Math.hypot(c[0] - ox, c[1] - oy) < FLOOR;
      }
      return false;
    });
    if (!near.length) return { ...entry, verdict: "pass: spacing", detail: "24px circle touches no other target" };
    if (userAgent(el)) return { ...entry, verdict: "check: user-agent", detail: "native control at its default appearance; confirm its size isn't the author's" };
    return {
      ...entry,
      verdict: "fail",
      detail: `24px circle overlaps ${near.slice(0, 3).map((o) => `${describe(o)} "${textOf(o).slice(0, 20)}"`).join(", ")}${near.length > 3 ? ` and ${near.length - 3} more` : ""}`,
    };
  });

  const counts = {};
  for (const u of undersized) counts[u.verdict] = (counts[u.verdict] || 0) + 1;
  return {
    floor: `${FLOOR}×${FLOOR} CSS px`,
    viewport: `${innerWidth}×${innerHeight}`,
    targets: targets.length,
    undersized: undersized.sort((a, b) => (a.verdict === "fail" ? -1 : 0) - (b.verdict === "fail" ? -1 : 0)),
    counts,
    skipped,
  };
})();
