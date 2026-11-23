---
name: copywriting
description: "Write or review the words on a website (headlines, landing pages, calls to action, about pages, case study intros, link and button text) using classic copywriting principles from Schwartz, Ogilvy, Krug, Nielsen Norman Group, Orwell, Dunford and Sierra, and proven formulas such as AIDA, PAS, BAB, FAB and the 4 U's, then change only what the author picks. Use this whenever someone asks to write, rewrite, tighten or punch up copy, asks for a headline, tagline or call to action, asks whether their copy is clear or convincing, or says a page \"doesn't say what we do\"."
---

# Copywriting

Write and review the words on a site so a visitor gets what it is, who it's for and what to do next, fast. The principles behind every suggestion are in `../audit/references/copy-fundamentals.md`; read it before you start, along with `../audit/references/principles.md` if it's there.

The author's voice outranks the fundamentals. Before writing or reviewing anything, find it: a style or voice guide, notes in the README or CLAUDE.md, and the copy they've already written and kept. A deliberate voice (lowercase headings, a joke in the footer, a long personal intro) is a decision, not a finding.

How to work:

- **Their words are theirs.** Suggest and draft; change the site only for what they pick.
- **Facts come from them.** Numbers, customer names, quotes and results come from the author or the project, never from you. Where a line needs a fact you don't have, leave a marked gap (`[how many teams?]`) and ask.
- **Name the principle.** Every suggestion cites the fundamental it rests on, in the form `Krug: omit needless words`, and quotes the line it's about. That's what makes the rewrite follow from a rule rather than taste.
- **Real content only.** Placeholder and lorem ipsum pages are skipped and listed as skipped.

## 1. The brief

Answer these from the project before asking; ask, one at a time, only for what the project doesn't say:

- **Who is reading**, and which **stage of awareness** most of them arrive at (`Schwartz`). A portfolio's visitors are usually product-aware: they came for this person. A product's home page usually has to serve problem- or solution-aware visitors.
- **What they should do next**: the one action the page is for.
- **The positioning** (`Dunford`): the real alternative the reader would use otherwise, what's different here, and why that matters to them.

The brief is done when you can write each of these as one sentence. Show the sentences to the author before writing or reviewing anything: a wrong brief makes every later suggestion wrong.

## 2a. Writing: pick a formula, draft, cut

Pick the formula that fits the piece and the reader's stage. They're scaffolding for a first draft; the finished copy shouldn't read as a template.

| Formula | Shape | Fits |
|---|---|---|
| **4 U's** | Useful, Urgent, Unique, Ultra-specific: score a headline on each | Headlines, subject lines, button text |
| **AIDA** | Attention → Interest → Desire → Action | A page for readers who don't know the product yet (unaware, problem-aware) |
| **PAS** | Problem → Agitate (why it matters, what it costs) → Solution | Problem-aware readers; a landing page for one pain |
| **BAB** | Before (their world now) → After (their world with it) → Bridge (how this gets them there) | Case studies, testimonials, about pages, "how it works" |
| **FAB** | Feature → Advantage (what it makes possible) → Benefit (what the reader gets) | Feature lists, pricing tiers; turns a spec into `Sierra: sell the result` |

Then:

1. **Draft three versions of each headline and call to action**, deliberately different (a benefit, a specific number or fact, the reader's own words for the problem), and say which you'd pick and why. Choosing between versions finds the right line faster than revising one.
2. **Cut.** Run every draft through Orwell's six rules and `Krug: omit needless words`: cut half, then see what's left. Front-load headings and links (`NN/g: front-load`).
3. **Check it against the brief.** Each piece speaks to the reader's stage and leads to the one action.

## 2b. Reviewing: every piece, every lens

Read the copy on every page in the project, from the content files and on the rendered site, so you see what a visitor sees first. Cover each page's title and meta description, headings, body, calls to action, button and link text, image captions, and form labels and errors.

Apply every section of `copy-fundamentals.md` to each page. The review is done when every page has been read against every section, not when you've found a few things to say.

## 3. Report

In chat, one short block per page, the most important page first:

- **Page**: what's working, in one line
- The two or three changes that would help most. For each: the fundamental it rests on, the line quoted, and a suggested rewrite (for a headline, the three versions from 2a).

Then ask which to apply, as a question card if you can (list the changes, let them pick several). For each one they pick:

- If it needs a fact only they have, ask for it in plain text, one at a time.
- Make the change, one per commit, so any can be undone. If the site is running locally, they can see each one land.
