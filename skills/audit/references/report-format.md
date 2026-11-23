# Report format

The audit report is written as JSON, then turned into a page by `scripts/build-report.mjs`. Writing data rather than prose keeps every report in the same shape, and the page adds what text can't: real colour swatches, filters by check, and a way to pick which findings to fix.

```json
{
  "site": "example.com",
  "date": "2026-11-13",
  "source": "Dev server at localhost:4321, production build in dist/",
  "summary": "One or two sentences: the overall state and the one or two things that matter most.",
  "scope": {
    "Pages": ["/", "/about", "/blog", "404"],
    "Themes": "Light and dark",
    "Widths": "20 widths from 320 to 2560px"
  },
  "checks": {
    "Motion": { "note": "Reviewed in code: the browser couldn't emulate reduced motion" },
    "Security": { "skipped": "Static files only, no dependencies" }
  },
  "findings": [
    {
      "severity": "serious",
      "area": "Accessibility",
      "title": "Body text fails contrast in the light theme",
      "concept": { "name": "Text contrast", "rule": "Body text needs 4.5:1 against its background; large text needs 3:1." },
      "wcag": "1.4.3",
      "yourCall": true,
      "body": "One or more paragraphs. Supports `code`, **bold** and [links](https://example.com).",
      "list": ["Optional bullet points"],
      "swatches": [
        { "label": "Light: ink on paper", "fg": "#c95e46", "bg": "#f9f3ef", "suggest": "#b94f38" }
      ],
      "table": { "columns": ["Theme", "Ratio"], "rows": [["Light", "3.69"]] },
      "evidence": "What was measured, and how.",
      "fix": "The smallest change that fixes it.",
      "where": ["src/styles/global.css:16"]
    }
  ],
  "good": ["What was checked and holds up, one item per line."],
  "notChecked": ["What needs a person or a device, and what was out of scope."],
  "ask": "Tick what you'd like fixed, then paste the request back here."
}
```

## Fields

- **kind**: `audit` (the default) or `critique`. A critique report comes from `design-critique` on its own: the page is titled as a design critique, shows only the Design check, and every finding must be a Design suggestion.
- **site, date, summary** are required. `source` says what was tested (dev server, build, live site).
- **scope**: any labelled facts about what was covered. Each value is text or a list.
- **checks**: optional notes per check, keyed by `Layout`, `Accessibility`, `Motion`, `Prune`, `Performance`, `Security`, `Basics` or `Design`. `note` adds a line under the check's counts; `skipped` replaces the counts with the reason it didn't run. The page counts findings per check on its own.
- **findings**: the list, in the order you want them numbered. Numbering runs across the whole report, so "fix 3 and 7" is unambiguous.
  - `severity`: `serious`, `moderate` or `minor`, as defined in the audit skill. Required for every area except `Design`.
  - `area`: which check found it, one of the eight above (`Basics` for the basics sweep, `Design` for `design-critique`).
  - `weight`: for `Design` findings only, which are suggestions rather than problems: `heavy`, `medium` or `light`, as defined in `design-critique`. They're shown in their own Suggestions groups after the audit's findings, and the boxes read "Apply" and "Won't apply" rather than "Fix this" and "Won't fix".
  - `basis`: for `Design` findings, where the suggestion comes from, shown as a tag: `Your taste`, a named fundamental such as `Gestalt: proximity`, or `General advice`.
  - `image`: a cropped screenshot of what the finding is about, `{ "src", "alt", "caption" }`. `src` must be a base64 `data:` URI (png, jpeg or webp, under about 450KB), since the published page can't reach local files. `alt` is required and says what the crop shows; `caption` is optional, usually the width and theme.
  - `after`: once a finding is fixed, a screenshot of the same thing after the fix, in the same shape as `image`. It needs `image` as its before. Take it at the same width, theme, state and crop, so the only difference is the fix. The page shows the two side by side (stacked on narrow screens), tags the finding "Fixed", drops its "Fix this" box, and moves it out of its severity group into a Fixed group, so it no longer counts toward the totals. It keeps its number. A fix you can't see (a header, a dependency) has no `after`: give the new numbers in `evidence` instead.
  - `wontFix`: once the user decides to leave a finding as it is, `true`, or their reason as text when they gave one ("The brand red is fixed by the style guide"). Never set it on your own judgment: only the user can turn a finding down. The page tags the finding "Won't fix" (or "Won't apply" for a suggestion), shows the reason, drops its boxes, and moves it into a Won't fix group after the Fixed one, so it no longer counts toward the totals. It keeps its number. A finding can't have both `wontFix` and `after`.
  - `concept`: the named concept the finding breaks and the rule that fixes it, `{ "name", "rule" }`. Required for every area except `Design`, where `basis` does this job. Name the concept a designer or engineer would search for, not the symptom: `Concentric radii` with the rule "Inner radius equals outer radius minus the padding between them", not "Corners look off". The rule should be specific enough that the fix follows from it. For a WCAG failure, the concept is the criterion's idea (`Text contrast`) and the rule is its threshold ("4.5:1 for body text, 3:1 for large text").
  - `title`: what's wrong, in a plain sentence.
  - `yourCall`: `true` when the fix touches something the author chose on purpose (a colour from the design file, a deliberate size). The page marks it "Your call".
  - `wcag`: the success criterion, when there is one.
  - `body`, `list`, `table`, `evidence`, `fix`, `where`: all optional. Use what the finding needs. `where` holds file paths with line numbers, or page and width.
  - `swatches`: for contrast findings. Each shows the real colours with the measured ratio. `needs` sets the ratio to meet (default 4.5; 3 for large text and non-text). `suggest` adds the nearest passing colour from `fit-aa.mjs`, shown on the same background, or on `suggestOn` if it sits on a different one.
- **good** and **notChecked**: lists of short lines.
- **ask**: the closing question.

Text fields support only `code`, **bold** and [links](https://…). Everything else is shown as written, so HTML in a finding is displayed, never run.
