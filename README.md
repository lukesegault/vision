# Vision

A portfolio website for a personal styling project. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add your photos

Every image slot shows a tonal placeholder until a real photo exists. Drop a file into `assets/images/` using one of these names and it replaces the placeholder automatically:

| File | Where it appears |
| --- | --- |
| `hero.jpg` | Large image at the top of the home page |
| `portrait.jpg` | About section |
| `look-01.jpg` to `look-08.jpg` | The eight looks in the work grid and lightbox |

Use JPG, around 1600px on the long edge and under 500 KB each so the site stays fast.

## Edit your work

Looks are defined in `js/content.js`. Each entry has a title, category, year, description, credits, and the `image` path. To add a look, copy one block and give it a new `id` and image name. Filter buttons are generated from the categories you use.

Set `ratio` to the photo's width divided by its height (`3 / 4` portrait, `1` square, `3 / 2` landscape) so the grid reserves the right space before the image loads.

## Edit the text

The headline, about text, services and contact details are in `index.html`. Search for these placeholders and replace them:

- `Vision` and `Vision Styling` (name)
- `hello@example.com` (email)
- the Instagram and Pinterest links in the contact section
- `Paris`, `English, French` (location and languages)
- `Your Name`, `Photographer`, `Model` in `js/content.js`

Colors and fonts are CSS variables at the top of `css/styles.css`.

## Publish

Any static host works. For GitHub Pages: repository Settings, Pages, then deploy from the branch you want to publish. Netlify and Cloudflare Pages also work with no configuration (no build command, publish directory `/`).
