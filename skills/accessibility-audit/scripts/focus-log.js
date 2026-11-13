// Records every focus stop while you press Tab for real. Paste into the page,
// press Tab through it, then read back `window.__focusLog`.
//
// Real key presses matter: focus set from a script doesn't match
// :focus-visible, so it shows a state real keyboard users never see.
//
// For each stop it records:
//   name    the element's accessible name, roughly
//   inView  whether it's inside the window
//   onTop   whether it's the topmost thing at its own centre. false means
//           something covers it: a sticky header, or a fixed footer whose
//           contents the browser counts as on screen but which is hidden
//           until the page is scrolled. A focused element that's in view
//           but not on top is invisible to the person using the keyboard.
//   ring    the outline while the element has focus
//
// Each stop is read the moment focus arrives. By then the browser has already
// scrolled the element into view, and so has any focusin handler on the page
// (this listener is on the document, so it runs last). Reading later, after an
// animation frame or a timer, goes wrong when the tab is in the background:
// browsers pause or slow both there. On a page with smooth scrolling, the
// element may still be moving when it's read: check flagged stops by eye.

window.__focusLog = [];
document.addEventListener("focusin", (event) => {
  const el = event.target;
  const r = el.getBoundingClientRect();
  const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
  const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
  const hit = document.elementFromPoint(x, y);
  const cs = getComputedStyle(el);
  window.__focusLog.push({
    name: (el.getAttribute("aria-label") || el.textContent || el.tagName)
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40),
    inView: r.bottom > 0 && r.top < innerHeight,
    onTop: !!hit && (hit === el || el.contains(hit)),
    ring:
      cs.outlineStyle === "none" || cs.outlineColor === "rgba(0, 0, 0, 0)"
        ? "none (check for a fill, border or shadow instead)"
        : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
    width: Math.round(r.width),
  });
});
"Focus log ready: press Tab through the page, then read window.__focusLog";
