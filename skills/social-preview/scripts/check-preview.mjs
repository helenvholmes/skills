#!/usr/bin/env node
// What a link preview will show for a page, and what will stop it working.
//
//   node check-preview.mjs <url-or-html-file> [--origin <url>]
//
// Reads the page's HTML the way a link-preview crawler does: as served, with no
// JavaScript run, so tags a script adds never count. Lists the title,
// description, URL and image a preview would use (Open Graph first, then the
// twitter: tags, then <title> and the meta description), then fetches the image
// and reads its real size from the file.
//
// --origin swaps the scheme and host of absolute URLs in the tags for another,
// so you can check a local build whose tags point at production:
//   node check-preview.mjs dist/index.html --origin http://localhost:4321
//
// Exits 1 when something would break the preview, so it can run in CI.

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const oi = args.indexOf("--origin");
const origin = oi >= 0 ? args.splice(oi, 2)[1] : null;
const target = args[0];
if (!target) {
  console.error("Usage: node check-preview.mjs <url-or-html-file> [--origin <url>]");
  process.exit(1);
}

const isUrl = /^https?:\/\//.test(target);
const html = isUrl
  ? await (await fetch(target, { headers: { "user-agent": "link-preview-check" } })).text()
  : await readFile(target, "utf8");
const head = (html.match(/<head[\s>][\s\S]*?<\/head>/i) || [html])[0];

const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map((m) => [
      m[1].toLowerCase(),
      decode(m[3] ?? m[4]),
    ]),
  );
function decode(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

const meta = {};
for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
  const a = attrs(tag);
  const key = (a.property || a.name || "").toLowerCase();
  if (key && a.content !== undefined && !(key in meta)) meta[key] = a.content;
}
const canonical = [...head.matchAll(/<link\b[^>]*>/gi)]
  .map(([t]) => attrs(t))
  .find((a) => (a.rel || "").toLowerCase().split(/\s+/).includes("canonical"))?.href;
const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "");

const problems = [];
const notes = [];
const row = (label, value, from) =>
  console.log(`${label.padEnd(13)}${value ? value : "—"}${from ? `  (${from})` : ""}`);

const pick = (...keys) => {
  for (const k of keys) if (meta[k]) return [meta[k], k];
  return [null, null];
};
const [pTitle, tFrom] = meta["og:title"] ? [meta["og:title"], "og:title"] : meta["twitter:title"] ? [meta["twitter:title"], "twitter:title"] : [title || null, title ? "<title>" : null];
const [pDesc, dFrom] = pick("og:description", "twitter:description", "description");
const [pUrl, uFrom] = meta["og:url"] ? [meta["og:url"], "og:url"] : [canonical || null, canonical ? "canonical" : null];
const [pImage, iFrom] = pick("og:image", "og:image:url", "og:image:secure_url", "twitter:image");
const card = meta["twitter:card"];

console.log(`\nPreview for ${target}\n`);
row("Title", pTitle, tFrom);
row("Description", pDesc, dFrom);
row("URL", pUrl, uFrom);
row("Image", pImage, iFrom);
row("Image alt", meta["og:image:alt"] || meta["twitter:image:alt"]);
row("Site name", meta["og:site_name"]);
row("Type", meta["og:type"]);
row("X card", card);
console.log("");

if (!meta["og:title"]) notes.push("No og:title: platforms fall back to <title>, which often carries a site-wide suffix.");
if (!pDesc) notes.push("No description: most previews show the title alone.");
if (!meta["og:url"]) notes.push("No og:url: shares of the same page with different query strings count as different pages.");
if (!meta["og:type"]) notes.push('No og:type: Open Graph requires it ("website", or "article" for posts).');
if (pTitle && pTitle.length > 70) notes.push(`Title is ${pTitle.length} characters: most previews cut it around 60-70.`);
if (pDesc && pDesc.length > 200) notes.push(`Description is ${pDesc.length} characters: most previews show one to three lines.`);
if (pUrl && canonical && pUrl !== canonical) notes.push(`og:url (${pUrl}) and the canonical link (${canonical}) differ.`);
if (!card) notes.push('No twitter:card: X shows a small square thumbnail. Use "summary_large_image" for the wide card.');
else if (card === "summary" && pImage) notes.push('twitter:card is "summary": X crops the image to a small square. "summary_large_image" shows it wide.');
if (/<script\b/i.test(html) && !pImage && !meta["og:title"]) notes.push("No preview tags in the served HTML. If a script adds them, crawlers won't see them: they don't run JavaScript.");

if (!pImage) {
  problems.push("No og:image: previews show no picture, or a random one from the page.");
} else if (!/^https?:\/\//.test(pImage)) {
  problems.push(`og:image is relative (${pImage}): crawlers need an absolute https:// URL.`);
} else {
  if (pImage.startsWith("http://")) problems.push("og:image is http://: some platforms refuse images that aren't https.");
  if (!meta["og:image:alt"] && !meta["twitter:image:alt"]) notes.push("No og:image:alt: screen reader users hear nothing for the image in a preview.");
  const fetchUrl = origin ? pImage.replace(/^https?:\/\/[^/]+/, origin.replace(/\/$/, "")) : pImage;
  try {
    const res = await fetch(fetchUrl, { headers: { "user-agent": "link-preview-check" } });
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") || "?";
    const size = imageSize(buf);
    console.log(`Image fetch  ${res.status} ${type}, ${(buf.length / 1024).toFixed(0)} KB${size ? `, ${size.w}×${size.h} (${size.kind})` : ""}${fetchUrl !== pImage ? `  via ${fetchUrl}` : ""}`);
    if (!res.ok) problems.push(`Image returns ${res.status}.`);
    else if (!size) problems.push(`Image isn't PNG, JPEG, WebP or GIF (${type}). SVG and AVIF previews aren't shown by most platforms.`);
    else {
      const ratio = size.w / size.h;
      if (size.w < 600) problems.push(`Image is ${size.w}px wide: large cards need at least 600, ideally 1200×630.`);
      else if (Math.abs(ratio - 1.91) > 0.15) notes.push(`Image is ${ratio.toFixed(2)}:1. Wide cards are about 1.91:1 (1200×630), so platforms will crop it.`);
      const dw = meta["og:image:width"], dh = meta["og:image:height"];
      if (dw && dh && (+dw !== size.w || +dh !== size.h)) problems.push(`og:image:width/height say ${dw}×${dh}, the file is ${size.w}×${size.h}.`);
      if (!dw || !dh) notes.push("No og:image:width/height: the first share may show no image while the platform downloads it to measure.");
      if (buf.length > 5 * 1024 * 1024) problems.push("Image is over 5 MB: X won't show it.");
      else if (buf.length > 1024 * 1024) notes.push("Image is over 1 MB: slow on the first share. Most cards compress to under 300 KB.");
    }
  } catch (e) {
    problems.push(`Image couldn't be fetched: ${e.message}${origin ? "" : " (try --origin for a local build)"}.`);
  }
}

console.log("");
for (const p of problems) console.log(`BROKEN  ${p}`);
for (const n of notes) console.log(`NOTE    ${n}`);
if (!problems.length && !notes.length) console.log("Nothing to fix.");
process.exit(problems.length ? 1 : 0);

// Width and height from the file's own header, so a mislabelled or
// wrongly-declared image is caught.
function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47)
    return { kind: "PNG", w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 10 && b.toString("ascii", 0, 3) === "GIF")
    return { kind: "GIF", w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { kind: "WebP", w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { kind: "WebP", w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 ") return { kind: "WebP", w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return { kind: "JPEG", w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
