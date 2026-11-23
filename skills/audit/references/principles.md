# Principles

How this author wants their work audited. Where these disagree with generic advice, including other people's design or animation skills, these win. Each rule comes from a real decision on a real project.

## Decisions made on purpose are not findings

If the author chose a value deliberately, don't recommend changing it. Evidence of a decision: a code comment giving a reason, a value that matches a design file, a README or CLAUDE.md note, a commit message, or the author having said so.

Examples of what this rules out:

- Suggesting a 300ms hover colour transition become 200ms because "hover should feel instant". The author picked 300ms so the colour change is seen happening.
- Adding a crossfade or blur to smooth a hard cut between two images. A hard cut can be the intended effect.
- Swapping an easing curve for a "better" one when the current one was chosen.

What you *should* still report about a deliberate choice: anything that makes it fail for someone. A deliberate colour that fails contrast, a deliberate animation that flickers, a deliberate px size that ignores the user's text-size setting. Report the failure and its cost, and offer the smallest change that fixes it while keeping the intent (the closest passing colour, not a new palette). Say plainly that it's a deliberate choice and the call is theirs.

## A finding needs evidence and a name

Every finding rests on something you measured or saw: a number, a screenshot, a tool's output. A finding without evidence is a guess. Either verify it, or list it under "needs checking".

Every finding also names the concept it breaks, and that concept's rule. "The corners look off" leaves whoever applies the fix to guess; "the nested radius isn't concentric: inner radius is outer radius minus padding" tells them exactly what to change. Use the term a designer or engineer would search for (concentric radii, optical alignment, type scale, measure, focus order, layout shift, cache busting), then state the rule precisely enough that the fix follows from it. If you can't name a concept, the finding may be a preference rather than a problem: say so, or drop it.

## Test with the real content

The author hand-writes their content. Invented worst cases — a 300-character title, an empty list, a name in a script the site will never contain — aren't findings for content the author controls. What matters is that the real content works at every width.

Worst-case testing still applies where other people supply the content: forms, comments, user profiles, anything from a CMS someone else edits, anything from an API.

## Inside a row, the content stays still

When the pointer moves over a list row, card or link, the row's own text and layout shouldn't move: no sliding, nudging or growing text. Colour can change, and an element can appear (a thumbnail wiping in, an arrow), but what was already there stays where it was. Moving from one row to the next shouldn't flicker either: if something disappears and reappears while the pointer crosses between rows, that's a bug.

## Respect the person, not just the guideline

- **Reduced motion means gentler, not none.** Keep fades, drop movement and scaling. A soft fade still helps people follow what changed.
- **Keyboard actions never wait for animation.** If a click plays an exit animation before navigating, Enter on a focused link should go immediately.
- **Hidden things don't run.** An animation or listener for something off screen should sleep until it's visible.

## Fix the cause, at the smallest scale

- Prefer the closest fix that passes over a redesign: the nearest AA colour, one extra attribute, one CSS rule.
- Prune before measuring. Unused pages, fonts, assets and packages distort every performance number; remove them (with redirects for old URLs) and then measure.
- The author is open to changing the stack when the framework itself is the floor. Say so with numbers when it is.

## Work so it can be undone

Show changes before committing them. Make each fix separately so any one can be reverted. Don't leave test scaffolding behind. Don't commit or push unasked.
