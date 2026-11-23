// Finds elements doing a job another element was made for: a <div> you can
// click, a link that's really a button, a role="button" where <button> would
// do, a heading that's only bold text. Paste into the page, or run it with the
// browser tool's JavaScript runner, on each page (and again with any menu or
// dialog open).
//
// axe checks that what's there is named and valid. It can't see click
// handlers, and it doesn't ask whether a different element was the right
// choice, so most of what this reports gets past it.
//
// Returns { found, counts }. Each entry in `found` has:
//   rule     which check it failed (see RULES below for what each means)
//   element  a short selector: tag, first class, id
//   text     the start of its text, to find it on the page
//   detail   what was seen, when there's more to say
//
// Hidden elements are skipped by measuring them, so run it in a tab with a
// real window size: in a hidden or collapsed pane everything measures 0 wide
// and nothing is reported.
//
// Every entry is a lead, not a verdict. Clickable things are found by
// `cursor: pointer` and onclick attributes, since a page can't read its own
// event listeners; look at each one before reporting it. Run in the devtools
// console instead and it also uses getEventListeners() to find click handlers
// that set no cursor.
(() => {
  const RULES = {
    "clickable-non-control": "Clickable, but not a control: keyboard and screen reader users can't reach or operate it. Use <button> for an action, <a href> for a destination.",
    "link-as-button": "A link with no destination: <a> without href, or href=\"#\" or \"javascript:\". If it does something, it's a <button>; if it goes somewhere, give it a real href.",
    "role-where-native-exists": "An ARIA role on an element where a native one does the job: <div role=\"button\"> needs tabindex, Enter and Space handling and more, all of which <button> has built in.",
    "positive-tabindex": "tabindex above 0 takes the element out of reading order. Use 0, or move it in the source.",
    "toggle-not-button": "aria-expanded or aria-pressed on something that isn't a button. These states belong on the control that changes them, which should be a <button> (or <details>/<summary> for a simple disclosure).",
    "fake-heading": "Looks like a heading (large, bold, short, on its own line) but isn't one, so it's missing from the headings people skim by. Check by eye: logos, prices and stats are fine as they are.",
    "fake-list": "Text that starts with a bullet or dash character, in an element that isn't a list item. Several in a row are a <ul>.",
    "layout-table": "A <table> with no header cells. If it lays out content rather than holding data, use CSS grid; if it holds data, mark the headers with <th> and scope.",
    "ungrouped-choices": "Radio buttons or checkboxes sharing a name but not in a <fieldset> with a <legend> (or role=\"group\"/\"radiogroup\" with a name), so the question they answer isn't announced.",
    "placeholder-as-label": "A field whose only label is its placeholder, which disappears as soon as someone types. Add a <label>.",
    "generic-input-type": "A text input whose name suggests a more specific type. type=\"email\", \"tel\", \"url\", \"number\" or \"search\" brings up the right phone keyboard and built-in checks.",
  };

  const NATIVE_FOR_ROLE = {
    button: "<button>", link: "<a href>", checkbox: '<input type="checkbox">', radio: '<input type="radio">',
    textbox: "<input> or <textarea>", heading: "<h1>–<h6>", list: "<ul> or <ol>", listitem: "<li>",
    navigation: "<nav>", main: "<main>", banner: "<header>", contentinfo: "<footer>", img: "<img>",
    table: "<table>", dialog: "<dialog>", separator: "<hr>", slider: '<input type="range">',
    combobox: "<select> (if the options are fixed)", group: "<fieldset>",
  };
  // An element that already has the role its tag would give it isn't a problem.
  const NATIVE_TAGS = {
    button: ["BUTTON"], link: ["A"], heading: ["H1", "H2", "H3", "H4", "H5", "H6"], list: ["UL", "OL"],
    listitem: ["LI"], navigation: ["NAV"], main: ["MAIN"], banner: ["HEADER"], contentinfo: ["FOOTER"],
    img: ["IMG", "SVG"], table: ["TABLE"], dialog: ["DIALOG"], separator: ["HR"], group: ["FIELDSET"],
    checkbox: ["INPUT"], radio: ["INPUT"], textbox: ["INPUT", "TEXTAREA"], slider: ["INPUT"], combobox: ["SELECT", "INPUT"],
  };
  const CONTROL =
    'a[href], button, input, select, textarea, summary, label, [contenteditable=""], [contenteditable="true"], ' +
    '[role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], ' +
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="slider"], ' +
    '[role="combobox"], [role="textbox"], [role="treeitem"], [role="gridcell"]';

  const found = [];
  const seen = new WeakMap(); // element → rules already reported for it
  const describe = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
      typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : ""
    }${el.getAttribute("name") ? `[name="${el.getAttribute("name")}"]` : ""}`;
  const textOf = (el) =>
    (el.getAttribute("aria-label") || el.labels?.[0]?.textContent || el.textContent || el.getAttribute("alt") || "")
      .replace(/\s+/g, " ").trim().slice(0, 60);
  const add = (rule, el, detail) => {
    const rules = seen.get(el) || new Set();
    if (rules.has(rule)) return;
    seen.set(el, rules.add(rule));
    found.push({ rule, element: describe(el), text: textOf(el), ...(detail ? { detail } : {}) });
  };
  const visible = (el) => {
    if (el.closest('[aria-hidden="true"], [hidden], [inert]')) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const all = [...document.body.querySelectorAll("*")].filter(visible);
  const listeners = typeof getEventListeners === "function" ? getEventListeners : null;
  const hasClick = (el) =>
    el.hasAttribute("onclick") ||
    (listeners && ["click", "mousedown", "mouseup", "pointerdown", "pointerup"].some((t) => listeners(el)[t]?.length));

  // Clickable things that aren't controls. cursor: pointer is inherited, so
  // only the element where it starts counts, and not when it holds or sits
  // inside a real control (a card with a link stretched across it is fine).
  for (const el of all) {
    if (el.matches(CONTROL) || el.closest(CONTROL) || el.querySelector(CONTROL)) continue;
    const pointer = getComputedStyle(el).cursor === "pointer";
    const parentPointer = el.parentElement && getComputedStyle(el.parentElement).cursor === "pointer";
    if (hasClick(el) || (pointer && !parentPointer)) {
      add("clickable-non-control", el, hasClick(el) ? "has a click handler" : "cursor: pointer");
    }
  }

  for (const a of document.querySelectorAll("a")) {
    if (!visible(a)) continue;
    const href = a.getAttribute("href");
    if (href === null) add("link-as-button", a, "no href");
    else if (href.trim() === "#" || /^\s*javascript:/i.test(href)) add("link-as-button", a, `href="${href.trim()}"`);
  }

  for (const el of document.querySelectorAll("[role]")) {
    if (!visible(el)) continue;
    const role = el.getAttribute("role").trim().split(/\s+/)[0];
    if (NATIVE_FOR_ROLE[role] && !(NATIVE_TAGS[role] || []).includes(el.tagName)) {
      add("role-where-native-exists", el, `role="${role}": use ${NATIVE_FOR_ROLE[role]}`);
    }
  }

  for (const el of document.querySelectorAll("[tabindex]")) {
    if (Number(el.getAttribute("tabindex")) > 0) add("positive-tabindex", el, `tabindex="${el.getAttribute("tabindex")}"`);
  }

  for (const el of document.querySelectorAll("[aria-expanded], [aria-pressed]")) {
    if (!visible(el)) continue;
    const ok = el.tagName === "BUTTON" || el.tagName === "SUMMARY" || el.getAttribute("role") === "button" ||
      ["combobox", "menuitem", "treeitem", "row", "tab", "link"].includes(el.getAttribute("role")) ||
      (el.tagName === "INPUT" && el.getAttribute("aria-expanded") !== null);
    if (!ok) add("toggle-not-button", el, el.hasAttribute("aria-expanded") ? "aria-expanded" : "aria-pressed");
  }

  // Bold, large, short text on its own line that isn't a heading.
  const bodySize = parseFloat(getComputedStyle(document.body).fontSize) || 16;
  for (const el of all) {
    if (/^H[1-6]$/.test(el.tagName) || el.closest('h1,h2,h3,h4,h5,h6,[role="heading"],button,a,label,legend,caption,th,summary,figcaption,dt')) continue;
    if (el.matches('[role="heading"]') || el.children.length) continue;
    const text = el.textContent.replace(/\s+/g, " ").trim();
    if (!text || text.length > 80 || /^[\d\s$€£%.,+\-–]+$/.test(text)) continue;
    const s = getComputedStyle(el);
    const block = ["block", "flex", "grid", "list-item"].includes(s.display) ||
      (el.parentElement && el.parentElement.children.length === 1 && el.parentElement.textContent.trim() === text);
    if (block && parseFloat(s.fontSize) >= bodySize * 1.25 && Number(s.fontWeight) >= 600) {
      add("fake-heading", el, `${s.fontSize}, weight ${s.fontWeight}`);
    }
  }

  for (const el of all) {
    if (el.closest("li") || el.children.length > 2) continue;
    const first = el.firstChild;
    if (first && first.nodeType === 3 && /^\s*[•·▪‣◦\-–—*]\s+\S/.test(first.data) && !/^\s*[\-–—]\s*\d/.test(first.data)) {
      add("fake-list", el);
    }
  }

  for (const t of document.querySelectorAll("table")) {
    if (visible(t) && !t.querySelector("th, [scope]") && t.getAttribute("role") !== "presentation") add("layout-table", t);
  }

  const groups = {};
  for (const input of document.querySelectorAll('input[type="radio"], input[type="checkbox"]')) {
    if (input.name) (groups[input.type + "|" + input.name] ||= []).push(input);
  }
  for (const inputs of Object.values(groups)) {
    if (inputs.length < 2) continue;
    const grouped = inputs.every((i) => i.closest('fieldset, [role="group"], [role="radiogroup"]'));
    if (!grouped) add("ungrouped-choices", inputs[0], `${inputs.length} × ${inputs[0].type} named "${inputs[0].name}"`);
  }

  for (const field of document.querySelectorAll("input, textarea")) {
    if (!visible(field) || ["hidden", "submit", "button", "reset", "checkbox", "radio", "image"].includes(field.type)) continue;
    const labelled = field.labels?.length || field.getAttribute("aria-label") || field.getAttribute("aria-labelledby") || field.title;
    if (!labelled && field.placeholder) add("placeholder-as-label", field, `placeholder "${field.placeholder}"`);
    if (field.tagName === "INPUT" && field.type === "text") {
      const hint = [field.name, field.id, field.autocomplete, field.placeholder].join(" ").toLowerCase();
      const want = /e-?mail/.test(hint) ? "email" : /\b(tel|phone|mobile)/.test(hint) ? "tel" :
        /\b(url|website|homepage)\b/.test(hint) ? "url" : /\bsearch\b|\bq\b/.test(hint) ? "search" :
        /\b(age|qty|quantity|amount)\b/.test(hint) ? "number" : null;
      if (want) add("generic-input-type", field, `type="text", looks like ${want}`);
    }
  }

  const counts = {};
  for (const f of found) counts[f.rule] = (counts[f.rule] || 0) + 1;
  return { found, counts, rules: Object.fromEntries(Object.keys(counts).map((r) => [r, RULES[r]])) };
})();
