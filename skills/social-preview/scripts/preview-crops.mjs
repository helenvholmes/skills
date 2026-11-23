#!/usr/bin/env node
// A page showing a share image the way previews crop and shrink it, so you can
// see what survives before anyone shares the link.
//
//   node preview-crops.mjs <image> <out.html> [--title "…"] [--desc "…"] [--domain example.com]
//
// <image> is a local file or a URL. Open the page in a browser (or screenshot
// it) and look at each version:
//
//   Full size, with guides   the 1200×630 canvas with the centre square and a
//                            2:1 crop marked, and a 60px margin
//   Wide card                about 500px wide at 1.91:1, the size most feeds and
//                            chat apps show a large card
//   Phone feed               about 340px wide: the smallest the wide card gets
//   Square thumbnail         the centre square at 120px and 64px, which chat
//                            apps and X's small card use
//
// Crops differ between platforms and change over time; these are the shapes
// that matter, not pixel-exact copies of any one app.

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : "";
};
const title = opt("--title");
const desc = opt("--desc");
const domain = opt("--domain");
const [image, out] = args;
if (!image || !out) {
  console.error('Usage: node preview-crops.mjs <image> <out.html> [--title "…"] [--desc "…"] [--domain example.com]');
  process.exit(1);
}

const types = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const src = /^https?:\/\//.test(image)
  ? image
  : `data:${types[extname(image).toLowerCase()] || "image/png"};base64,${(await readFile(image)).toString("base64")}`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const text = (domain || title || desc)
  ? `<div class="text">${domain ? `<span class="domain">${esc(domain)}</span>` : ""}${title ? `<b>${esc(title)}</b>` : ""}${desc ? `<span>${esc(desc)}</span>` : ""}</div>`
  : "";

const page = `<!doctype html><meta charset="utf-8"><title>Share preview crops</title>
<style>
  body { margin: 0; padding: 32px; font: 14px/1.4 system-ui, sans-serif; background: #f3f3f1; color: #1d1d1b; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #666; margin: 40px 0 10px; }
  h2:first-child { margin-top: 0; }
  .guides { position: relative; width: 1200px; max-width: 100%; aspect-ratio: 1200 / 630; }
  .guides img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .guides i { position: absolute; border: 2px dashed #e5007e; pointer-events: none; }
  .sq { top: 0; bottom: 0; left: 50%; aspect-ratio: 1; transform: translateX(-50%); }
  .two { left: 0; right: 0; top: 50%; aspect-ratio: 2; transform: translateY(-50%); border-color: #0aa !important; }
  .margin { inset: 9.5% 5%; border-color: #f80 !important; }
  .legend span { margin-right: 18px; }
  .card { background: #fff; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; }
  .card img { display: block; width: 100%; aspect-ratio: 1.91; object-fit: cover; }
  .text { padding: 10px 12px; display: grid; gap: 2px; }
  .text b { font-weight: 600; }
  .text span { color: #555; }
  .domain { font-size: 12px; text-transform: lowercase; }
  .row { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
  .thumb { display: flex; gap: 10px; align-items: center; background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 8px; max-width: 420px; }
  .thumb img { aspect-ratio: 1; object-fit: cover; border-radius: 6px; flex: none; }
</style>
<h2>Full size, with guides</h2>
<div class="guides"><img src="${src}" alt=""><i class="sq"></i><i class="two"></i><i class="margin"></i></div>
<p class="legend"><span style="color:#e5007e">- - centre square (thumbnail crop)</span><span style="color:#0aa">- - 2:1 crop</span><span style="color:#f80">- - 60px margin</span></p>
<div class="row">
  <div><h2>Wide card, 500px</h2><div class="card" style="width:500px"><img src="${src}" alt="">${text}</div></div>
  <div><h2>Phone feed, 340px</h2><div class="card" style="width:340px"><img src="${src}" alt="">${text}</div></div>
</div>
<h2>Square thumbnail, 120px and 64px</h2>
<div class="row">
  <div class="thumb"><img src="${src}" alt="" width="120">${text}</div>
  <div class="thumb"><img src="${src}" alt="" width="64">${text}</div>
</div>
`;
await writeFile(out, page);
console.log(`Wrote ${out}`);
