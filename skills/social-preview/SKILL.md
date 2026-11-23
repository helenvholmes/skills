---
name: social-preview
description: Get a website ready to be shared — the Open Graph and X card tags every page needs, a share image (1200×630) made from the site's own design that still reads when a feed shrinks it to a phone column or a chat app crops it to a square, and a check of what a link-preview crawler actually sees, including the image's real size. Use this whenever someone asks about social previews, link previews, share cards, unfurls, OG tags or og:image, Twitter/X cards, "what shows up when I paste my link", a launch or announcement, or why a shared link shows no picture, the wrong picture or an old one.
---

# Social preview

When someone pastes a link into a post, a chat or a Slack channel, a crawler fetches the page and builds a card from its tags: a title, a line of description, the domain and an image. That card is often the first thing anyone sees of the site, and it's made by a robot that doesn't run JavaScript, doesn't wait, and caches what it saw for days. This skill makes sure the robot finds the right things, and that the image survives the sizes it's actually shown at.

Read `../audit/references/principles.md` first if it's there. Two of its rules shape this skill: the author's design decisions stand (the card is built from their palette and type, not a new look), and nothing changes until the author picks it.

## 1. Find every page that gets shared

List the pages people will link to: the home page, every article, case study and project page, and anything announced on its own (a launch page, a talk, a PDF). Note how the pages are built (static HTML, a framework's head API, a CMS field) so the tags can come from the same place as the rest of the page's content, not a hand-copied list that drifts.

A page whose tags are added by client-side JavaScript has none as far as crawlers are concerned. If the site renders in the browser, the tags must be in the HTML the server sends: prerendering, server rendering, or a static `<head>`.

## 2. Check what a crawler sees

Run `scripts/check-preview.mjs` on each page, against what's served, not the source:

```bash
node scripts/check-preview.mjs https://example.com/writing/post
node scripts/check-preview.mjs dist/index.html --origin http://localhost:4321
```

It reads the HTML without running scripts, prints the title, description, URL and image a preview would use and where each came from, then downloads the image and reads its real size from the file. `--origin` lets a local build stand in for production when the tags point at the live domain. Lines marked `BROKEN` stop the preview working; `NOTE` lines make it worse. It exits 1 on anything broken, so it can run in CI.

The concepts to name in findings:

- **Open Graph metadata.** Every shared page has `og:title`, `og:description`, `og:url`, `og:type` (`website`, or `article` for posts) and `og:image`, plus `og:image:width`, `og:image:height` and `og:image:alt`. `og:site_name` is worth adding on sites with many pages. X reads these too; add `twitter:card` set to `summary_large_image`, or it shows a small square thumbnail.
- **Per-page tags.** Each page says what *it* is. The same title and description on every page means every shared article looks like the home page. Titles fit in about 60 characters (previews cut the rest), descriptions in one or two sentences, and both lose the site-wide suffix that `<title>` often carries.
- **Absolute image URLs.** `og:image` and `og:url` are full `https://` URLs on the production domain. A relative path, `localhost`, or a preview deployment's URL that later disappears all leave the card blank.
- **Image format and size.** PNG or JPEG (WebP works on most platforms; SVG and AVIF aren't reliably shown). About 1.91:1, 1200×630 being the standard. Under 1 MB is comfortable, over 5 MB is refused by some platforms. The declared width and height match the file: they let the first share show the image straight away instead of after the platform has measured it.
- **Reachable.** The image and page return 200 to a stranger: not behind a login, a preview-deployment password, or a `robots.txt` rule that blocks crawlers.

## 3. Look at the image the way it's shown

A share image is designed at 1200×630 and almost never seen at that size. Run `scripts/preview-crops.mjs` and screenshot the page it writes:

```bash
node scripts/preview-crops.mjs public/og-image.png /tmp/crops.html --title "…" --desc "…" --domain example.com
```

It shows the image full size with guides (the centre square, a 2:1 crop and a 60px margin), as a 500px wide card, at 340px as in a phone feed, and as the 120px and 64px square thumbnails chat apps use. Judge the image there, not in the design file:

- **Legible at phone size.** At 340px wide the card is shown at 28% of its size, so text needs to be about 40px or larger on the 1200px canvas to stay readable (around 11px on screen). Anything smaller is texture, not words: cut it, or make it bigger.
- **Few words.** The title and description already sit under the image as text. The image's job is recognition: the name or mark, and at most one short line. Repeating the title in the image is fine; a paragraph is not.
- **Safe area.** Keep everything at least 60px from every edge, and inside the 2:1 band: some platforms trim the top and bottom.
- **The square crop.** Chat apps and X's small card cut the centre square out of the wide image. Whatever must survive that (a mark, a monogram, the first word of the name) goes in the middle. If the design can't put it there, say so, and consider a mark that reads on its own.
- **Contrast.** Text on the image meets 4.5:1 against what's behind it, measured with `../accessibility-audit/scripts/contrast.mjs`. Text over a photo needs a solid or scrimmed area behind it, checked where the text actually sits.
- **Both themes.** The image is shown on white feeds and dark ones. An image whose background is the page's own light colour can disappear into a white card; give it its own colour or a clear edge.

## 4. Make the image from the site itself

When the site needs a share image, build it from the site's own design: its colours, typefaces and a layout the author would recognise, not a template. The author's decisions stand here as everywhere: use their palette and type, and suggest, don't impose, any change to them.

1. **Write it as an HTML page** 1200×630 that loads the site's own font files (self-hosted ones by `file://` path, so the render doesn't depend on a network) and uses its colour values.
2. **Render it** at exactly 1200×630 with a device scale factor of 1, after `document.fonts.ready`, and confirm every font reports `loaded`. A fallback font in a share image is easy to miss and ships for months.
3. **Save it as PNG** for flat colour and type, JPEG for photographs, next to the site's other static assets, with a stable name. Then run steps 2 and 3 on it.
4. **Keep the source.** Save the HTML template in the repo or describe how it was made in a comment, so the image can be regenerated when the name, tagline or design changes.

For sites with many pages, one card per page beats one for the whole site: generate them at build time from each page's title (a template rendered by a headless browser, or the framework's own image route), falling back to the site card for pages without one.

## 5. After shipping: caches

Platforms cache a page's card for days, sometimes weeks, so a fixed tag doesn't fix links already shared. Tell the author:

- Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/) and LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) fetch the page again and show what they see. Use them after every change to the tags or image.
- Other platforms have no refresh button. A new image filename (`og-image-2.png`) makes every platform fetch it fresh for new shares; changing the bytes behind the same URL may not.
- Test with a real share in a private message to yourself before announcing anything.

## 6. Report and fix

Inside `audit`, these are findings under `Basics`, in the shape in `../audit/SKILL.md`: no share image, a broken or relative image URL, or tags missing so the card falls back to nothing are **moderate** (every share of the site looks broken); the rest are **minor**. Give the image's crops as the finding's `image` (a screenshot of the preview-crops page), and once fixed, the same crops as `after`. On its own, use the same headings: Serious, Moderate, Minor, Already good, Not checked. Under "Not checked", list the platforms you couldn't see a real share on.

Change nothing until the author picks. Make each fix on its own: tags in one change, the image in another, so either can be reverted. Never commit or push unless asked.
