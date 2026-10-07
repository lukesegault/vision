# Vision

A portfolio website for a personal styling project. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

The design is stark black and white with one electric blue accent: oversized condensed type, mono labels, a dense grid, and an Index view that follows your cursor with image previews.

## Run it locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add your photos

Every image slot shows a placeholder until a real photo exists, and each placeholder prints the exact filename it is waiting for. Drop a file into `assets/images/` using that name and it replaces the placeholder automatically.

| File | Where it appears |
| --- | --- |
| `hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` | The three images under the headline |
| `portrait.jpg` | About section |
| `look-01.jpg` to `look-08.jpg` | The eight looks in the grid, the Index preview and the viewer |

Use JPG, around 1600px on the long edge and under 500 KB each so the site stays fast. Grid cards crop to 3:4 (the viewer shows the full frame), so keep the subject centered.

## Edit your work

Looks are defined in `js/content.js`. Each entry has a title, category, year, description, credits and the `image` path. To add a look, copy one block and give it a new `id` and image name. The filter buttons, counts and Index list are generated from the entries.

- `ratio` is the photo's width divided by its height (`3 / 4` portrait, `1` square, `3 / 2` landscape). The viewer uses it.
- `feature: true` makes one look span a large 2 x 2 cell in the grid. Use it on one look at a time.
- `tone` only changes the placeholder color.

## Edit the text

The headline, about text, services and contact details are in `index.html`. Search for these placeholders and replace them:

- `Vision` and `Vision Styling` (name)
- `hello@example.com` (email)
- the Instagram and Pinterest links in the contact section
- `Paris` and the clock label (location and time zone, also set in `js/main.js`)
- `English, French` (languages)
- `Now booking SS27` (availability, top bar and contact section)
- `Your Name`, `Photographer`, `Model` in `js/content.js`

Colors and fonts are CSS variables at the top of `css/styles.css`. The accent is `--accent`.

## Publish

Any static host works. For GitHub Pages: repository Settings, Pages, then deploy from the branch you want to publish. Netlify and Cloudflare Pages also work with no configuration (no build command, publish directory `/`).
