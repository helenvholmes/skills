#!/usr/bin/env node
// The passing colour nearest to one that fails contrast.
//
//   node fit-aa.mjs <colour> <against> [<against> ...] [--ratio 4.5]
//
// <colour> is the one to change; each <against> is a colour it must contrast
// with (its backgrounds, and any text drawn on it). Keeps the colour's hue and
// chroma in OKLCH and moves only its lightness, darker and lighter, until every
// pair reaches the ratio (default 4.5, AA for normal text; 3 for large text and
// non-text; 7 for AAA). Chroma is reduced only where the colour would leave the
// sRGB gamut. Prints the nearest candidate in each direction and recommends the
// one that moved least. The result is checked after rounding to whole RGB
// values, so it passes exactly as written in CSS.

import {
  contrast,
  fromOklch,
  parseArg,
  parseColor,
  toHex,
  toOklch,
  toTriplet,
} from "./color.mjs";

const args = process.argv.slice(2);
let ratio = 4.5;
const r = args.indexOf("--ratio");
if (r !== -1) {
  ratio = Number(args[r + 1]);
  args.splice(r, 2);
}
if (args.length < 2 || !(ratio > 1)) {
  console.error(
    "Usage: node fit-aa.mjs <colour> <against> [<against> ...] [--ratio 4.5]",
  );
  process.exit(1);
}

const original = parseArg(args[0]);
const against = args.slice(1).map(parseArg);
const passes = (rgb) => against.every((a) => contrast(rgb, a) >= ratio);

const [L0, C0, H] = toOklch(original);
const STEP = 0.0005;

function search(direction) {
  for (let L = L0; L >= 0 && L <= 1; L += direction * STEP) {
    let C = C0;
    let rgb;
    while (!(rgb = fromOklch([L, C, H])) && C > 1e-4) C *= 0.98;
    if (!rgb) continue;
    // Round to what CSS will actually use before testing.
    const rounded = parseColor(toHex(rgb));
    if (passes(rounded)) return { C, L, rgb: rounded };
  }
  return null;
}

const describe = (label, hit) => {
  if (!hit) return console.log(`${label}: none reaches ${ratio}:1`);
  const ratios = against
    .map((a, i) => `${args[i + 1]} ${contrast(hit.rgb, a).toFixed(2)}`)
    .join(", ");
  const moved = (hit.L - L0) * 100;
  const chroma = hit.C < C0 - 1e-4 ? `, chroma ${((hit.C / C0) * 100).toFixed(0)}% of original` : "";
  console.log(
    `${label}: ${toHex(hit.rgb)} (rgb ${toTriplet(hit.rgb)}), ` +
      `lightness ${moved >= 0 ? "+" : ""}${moved.toFixed(1)}${chroma}; ${ratios}`,
  );
};

if (passes(original)) {
  console.log(`${args[0]} already reaches ${ratio}:1 against everything.`);
  process.exit(0);
}

const darker = search(-1);
const lighter = search(1);
describe("Darker ", darker);
describe("Lighter", lighter);

const best = [darker, lighter]
  .filter(Boolean)
  .sort((a, b) => Math.abs(a.L - L0) - Math.abs(b.L - L0))[0];
if (best) {
  console.log(`Nearest: ${toHex(best.rgb)} (was ${toHex(original)})`);
} else {
  console.log(
    "No lightness of this hue passes against all of these. The backgrounds may be too close to each other: check them in pairs.",
  );
  process.exit(2);
}
