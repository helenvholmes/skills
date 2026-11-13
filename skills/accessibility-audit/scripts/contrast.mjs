#!/usr/bin/env node
// WCAG 2 contrast ratios for colour pairs.
//
//   node contrast.mjs <fg> <bg> [<fg> <bg> ...]
//
// Colours are hex (#rgb or #rrggbb) or space-separated "r g b" triplets, the
// form CSS variables often use ("201 94 70"). Prints each ratio and whether it
// passes for normal text (4.5:1), large text and non-text (3:1), and AAA (7:1).

import { contrast, parseArg } from "./color.mjs";

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error("Usage: node contrast.mjs <fg> <bg> [<fg> <bg> ...]");
  process.exit(1);
}

const mark = (ok) => (ok ? "pass" : "FAIL");
for (let i = 0; i < args.length; i += 2) {
  const [fg, bg] = [parseArg(args[i]), parseArg(args[i + 1])];
  const r = contrast(fg, bg);
  console.log(
    `${args[i]} on ${args[i + 1]}: ${r.toFixed(2)}:1  ` +
      `normal ${mark(r >= 4.5)} · large/non-text ${mark(r >= 3)} · AAA ${mark(r >= 7)}`,
  );
}
