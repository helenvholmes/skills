---
name: motion-review
description: Review a website's animations and transitions for the problems people actually feel — flicker, motion that makes them wait, motion that ignores reduced-motion settings, animations that drop frames or keep running off screen — while leaving the author's deliberate timing, easing and effects alone. Use this whenever the user asks to review, audit, check or improve animations, transitions, hover effects, page transitions or motion, says something "flickers", "feels janky", "feels slow" or "feels off", or asks about reduced motion.
---

# Motion review

This review looks for motion that *fails* someone. It isn't a taste pass: if the author picked a timing, an easing curve or an effect on purpose, it stays, even if you'd have chosen differently. Read `../audit/references/principles.md` first if it's there.

How to tell a choice was deliberate: a code comment giving the reason, a value matching a design file, a note in the README or CLAUDE.md, or the author having said so. When in doubt, ask rather than "fix".

## 1. Inventory

Find every source of motion before judging any of it:

- CSS `transition` and `@keyframes` (including Tailwind classes like `transition-*`, `duration-*`, `animate-*`)
- JavaScript: `requestAnimationFrame` loops, the Web Animations API, animation libraries, scroll and pointer listeners that move things, canvas and WebGL
- Page transitions, entrances and exits
- Anything that follows the cursor or reacts to scroll

For each, note what triggers it, what it changes, how long it runs, and what the code says about why.

## 2. What to look for

**Flicker and jumps.** Move the pointer slowly from one interactive item to the next (list rows, cards, nav links) and watch for anything that disappears and reappears, shrinks and regrows, or snaps. Common causes: a gap between items that briefly counts as "not hovering"; an effect that restarts from zero on every new target; two transitions on the same element fighting. A *hard cut* the author chose is not flicker: a flicker is a change nobody intended.

**Content moving inside a row.** When the pointer is over a row, card or link, its own text and layout should stay where they are. Colour can change, and something can appear (a thumbnail, an icon), but existing text shouldn't slide, nudge or grow.

**Making people wait.** Navigation that waits for an exit animation should skip the wait for keyboard activation (Enter on a focused link reports `event.detail === 0`). Nothing should block input while it animates. An entrance that staggers a long list should cap its total delay, so item 40 doesn't arrive seconds late.

**Reduced motion.** With `prefers-reduced-motion: reduce` emulated, walk the whole site:

- Movement, scaling, parallax and rotation stop.
- Fades can stay: reduced motion means gentler, not none, and a short fade still helps people follow what changed. Removing *all* animation is acceptable but not required; removing fades that carry meaning (something appearing) is a slight loss.
- Infinite and looping animations stop.
- Cursor-following and scroll-linked effects stop or become static.
- JavaScript animations check the setting too. CSS media queries don't reach them.

**Off-screen and idle work.** Animations and listeners for things nobody can see should sleep: a `requestAnimationFrame` loop should stop when nothing is moving, and effects for elements off screen (including the contents of fixed footers that are hidden until scrolled to) should pause, for example behind an `IntersectionObserver`. Test it: put the pointer where the hidden element sits and count the updates.

**Frame drops.** Properties other than `transform` and `opacity` (and `filter`, with care) make the browser redo layout or paint every frame. Animating `width`, `height`, `top`, `left`, `margin` or `box-shadow` on large areas is the usual cause. Some libraries run `x`/`y`/`scale` on the main thread rather than handing them to the compositor; check the version. Note what you verified in the browser versus what you inferred from code, and say that a fast laptop hides problems a mid-range phone will show.

**Hover on touch.** Hover styles should apply only where hover exists (`@media (hover: hover)`), so a tapped item on a phone doesn't stay highlighted.

## 3. What not to report

- Durations, easing curves or effects the author chose on purpose, unless they cause one of the failures above. Then report the failure, not the taste: "this 300ms fade flickers when crossing the 4px gap between rows", not "300ms is too slow for hover".
- Smoothing a hard cut with a crossfade or blur, unless asked.
- "This would feel more alive with..." Adding motion is a different job; offer it only if the user asks for opportunities.

## 4. Proposing changes

When you do propose a change, give the exact values (property, duration, easing) and say what problem it fixes. Make changes one at a time and leave them uncommitted so the author can try each one and revert it. If the author tries a change and doesn't like it, revert it fully, including anything you bundled with it, and say what went back.

## 5. Report

Use the shape in `../audit/SKILL.md` when running inside an audit; otherwise: Serious (flicker, waiting, reduced motion ignored), Moderate (frame drops, off-screen work), Minor, Already good, and Not checked (real devices, especially a mid-range phone, for anything performance-related).
