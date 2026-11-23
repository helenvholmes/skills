#!/usr/bin/env node
// Builds the audit report page from the audit's findings.
//
//   node build-report.mjs <report.json> <out.html> [--standalone]
//
// Checks the JSON against the format in references/report-format.md, then puts
// it into assets/report.html. The result is ready to publish as an Artifact,
// which supplies the <!doctype>, <head> and <body> itself. With --standalone it
// adds them, for opening the file directly in a browser instead.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const standalone = args.includes("--standalone");
const [input, output] = args.filter((a) => a !== "--standalone");
if (!input || !output) {
  console.error("Usage: node build-report.mjs <report.json> <out.html> [--standalone]");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(input, "utf8"));
} catch (error) {
  console.error(`Couldn't read ${input} as JSON: ${error.message}`);
  process.exit(1);
}

const SEVERITIES = ["serious", "moderate", "minor"];
const WEIGHTS = ["heavy", "medium", "light"];
const AREAS = ["Layout", "Accessibility", "Motion", "Prune", "Performance", "Security", "Basics", "Design"];
const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;
const IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_IMAGE = 600 * 1024; // characters of data URI, about 450KB of image
const problems = [];
const need = (cond, message) => cond || problems.push(message);
const critique = data.kind === "critique";

need(data.kind === undefined || ["audit", "critique"].includes(data.kind), 'kind must be "audit" or "critique"');
need(typeof data.site === "string" && data.site, "site: the site's name or address is required");
need(typeof data.date === "string" && data.date, "date: required, e.g. 2026-11-13");
need(typeof data.summary === "string" && data.summary, "summary: one or two sentences are required");
need(Array.isArray(data.findings), "findings: must be a list (it can be empty)");
(data.findings || []).forEach((f, i) => {
  const at = `findings[${i}]`;
  need(f.title, `${at}.title is required`);
  need(AREAS.includes(f.area), `${at}.area must be one of ${AREAS.join(", ")}`);
  if (f.area === "Design") {
    need(WEIGHTS.includes(f.weight), `${at}.weight must be one of ${WEIGHTS.join(", ")} (Design findings are weighted suggestions)`);
  } else {
    need(!critique, `${at}.area must be Design in a critique`);
    need(SEVERITIES.includes(f.severity), `${at}.severity must be one of ${SEVERITIES.join(", ")}`);
    const c = f.concept || {};
    need(
      typeof c.name === "string" && c.name && typeof c.rule === "string" && c.rule,
      `${at}.concept needs a name and a rule, e.g. { "name": "Concentric radii", "rule": "Inner radius equals outer radius minus the padding" }`,
    );
  }
  for (const key of ["image", "after"]) {
    if (f[key] === undefined) continue;
    const img = f[key] || {};
    need(typeof img.src === "string" && IMAGE.test(img.src), `${at}.${key}.src must be a base64 data URI (png, jpeg or webp)`);
    need(typeof img.src !== "string" || img.src.length <= MAX_IMAGE, `${at}.${key}.src is too large: crop it tighter or save it as jpeg`);
    need(typeof img.alt === "string" && img.alt, `${at}.${key}.alt is required: describe what the crop shows`);
  }
  if (f.after !== undefined) need(f.image, `${at}.after needs an image to compare against: the screenshot from before the fix`);
  if (f.wontFix !== undefined) {
    need(f.wontFix === true || (typeof f.wontFix === "string" && f.wontFix), `${at}.wontFix must be true or the reason, as text`);
    need(f.after === undefined, `${at} can't be both fixed (after) and wontFix`);
  }
  if (f.table) {
    need(Array.isArray(f.table.columns) && Array.isArray(f.table.rows), `${at}.table needs columns and rows`);
    (f.table.rows || []).forEach((r, j) =>
      need(r.length === f.table.columns.length, `${at}.table.rows[${j}] has ${r.length} cells for ${f.table.columns.length} columns`),
    );
  }
  (f.swatches || []).forEach((s, j) => {
    for (const k of ["fg", "bg", "suggest", "suggestOn"]) {
      if (s[k] !== undefined) need(HEX.test(s[k]), `${at}.swatches[${j}].${k} must be a hex colour`);
    }
    need(s.fg && s.bg, `${at}.swatches[${j}] needs fg and bg`);
  });
});
for (const area of Object.keys(data.checks || {})) {
  need(AREAS.includes(area), `checks.${area}: not one of ${AREAS.join(", ")}`);
}
for (const k of ["good", "notChecked"]) {
  if (data[k] !== undefined) need(Array.isArray(data[k]), `${k} must be a list`);
}
if (problems.length) {
  console.error(`The report data has ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, "..", "assets", "report.html"), "utf8");
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Inside <script>, "</" could end the block early; "<\/" means the same in JSON.
const json = JSON.stringify(data).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");

let page = template
  .replace("{{TITLE}}", escHtml(`${data.site} ${critique ? "design critique" : "audit"}`))
  .replace("{{DATA}}", () => json);
if (standalone) {
  // No explicit <head>/<body>: the browser puts the title, links and styles
  // in the head and starts the body at the first element that belongs there.
  page = `<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${page}\n</html>\n`;
}
writeFileSync(output, page);

// Fixed findings (those with an after screenshot) and won't-fix ones are
// counted on their own.
const open = data.findings.filter((f) => !f.after && !f.wontFix);
const fixedCount = data.findings.filter((f) => f.after).length;
const wontFixCount = data.findings.filter((f) => f.wontFix).length;
const tally = (list, key) =>
  list.map((v) => [v, open.filter((f) => f[key] === v).length]).filter(([, n]) => n).map(([v, n]) => `${n} ${v}`);
const findings = open.filter((f) => f.area !== "Design").length;
const suggestions = open.length - findings;
const parts = [];
if (findings || !suggestions) parts.push(`${findings} open findings${findings ? ` (${tally(SEVERITIES, "severity").join(", ")})` : ""}`);
if (suggestions) parts.push(`${suggestions} open suggestions (${tally(WEIGHTS, "weight").join(", ")})`);
if (fixedCount) parts.push(`${fixedCount} fixed`);
if (wontFixCount) parts.push(`${wontFixCount} won't fix`);
console.log(`Wrote ${output}: ${parts.join(", ")}.`);
