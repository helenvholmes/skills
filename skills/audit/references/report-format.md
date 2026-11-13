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

- **site, date, summary** are required. `source` says what was tested (dev server, build, live site).
- **scope**: any labelled facts about what was covered. Each value is text or a list.
- **checks**: optional notes per check, keyed by `Layout`, `Accessibility`, `Motion`, `Performance` or `Security`. `note` adds a line under the check's counts; `skipped` replaces the counts with the reason it didn't run. The page counts findings per check on its own.
- **findings**: the list, in the order you want them numbered. Numbering runs across the whole report, so "fix 3 and 7" is unambiguous.
  - `severity`: `serious`, `moderate` or `minor`, as defined in the audit skill.
  - `area`: which check found it, one of the five above.
  - `title`: what's wrong, in a plain sentence.
  - `yourCall`: `true` when the fix touches something the author chose on purpose (a colour from the design file, a deliberate size). The page marks it "Your call".
  - `wcag`: the success criterion, when there is one.
  - `body`, `list`, `table`, `evidence`, `fix`, `where`: all optional. Use what the finding needs. `where` holds file paths with line numbers, or page and width.
  - `swatches`: for contrast findings. Each shows the real colours with the measured ratio. `needs` sets the ratio to meet (default 4.5; 3 for large text and non-text). `suggest` adds the nearest passing colour from `fit-aa.mjs`, shown on the same background, or on `suggestOn` if it sits on a different one.
- **good** and **notChecked**: lists of short lines.
- **ask**: the closing question.

Text fields support only `code`, **bold** and [links](https://…). Everything else is shown as written, so HTML in a finding is displayed, never run.
