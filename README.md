# Vision

A single-page portfolio for a menswear personal stylist, on a white page with generous margins, floating pill navigation and glass menus.

Built with React and Vite. The hero is the **Tactile Archive Grid**: two 2 x 2 grids of textile macro photographs, framed like swatches in an atelier. (The earlier 3D clothing-rack hero is archived, see below.)

## Run it

```sh
npm install
npm run dev        # development server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## What is on the page

- **Tactile Archive Grid**: two perfectly square 2 x 2 grids, centred vertically, with three equal spaces (left margin, middle, right margin) so the composition stays balanced at any screen width. On phones the grids stack, and a grid with no photographs yet stays hidden so a filled one gets the screen.
- **Floating pills**: brand, Work and About, with a background blur.
- **Work menu**: a glass table of projects (number, title, categories, year). Choosing a row opens a full-screen project sheet. The centre of the page shrinks, fades and blurs while a menu is open.
- **About menu**: information, services, selected clients, collaborators and contact.

### How the swatches move

- **Breathing**: each photograph scales between 1 and 1.03 over a slow, very subtle cycle (17 to 25 seconds), each at its own pace and phase so they never move in step.
- **Hover or keyboard focus**: the other seven swatches recede (faded, desaturated, a touch softer) while the chosen one comes forward with a little more contrast, and its texture pans gently with the pointer. The caption names the swatch.
- **Easing**: everything uses one sharp curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for a crisp, deliberate feel, never bouncy. The swatches also appear with a clean cut, wiped in one after another.
- **Reduced motion**: with reduced motion enabled in the system settings, the breathing, panning and reveal are switched off.

## Add your photographs

Put images in `public/textiles/`. The grid is defined in `src/data/textiles.js`: each tile names its file, its caption and (optionally) a `focus` point for the square crop, for example `focus: '50% 30%'`.

| Grid | Files |
| --- | --- |
| Left | `leather-woven.jpg`, `floral.jpg`, `leather-draped.jpg`, `velvet.jpg` |
| Right | `snakeskin.jpg`, `shearling.jpg`, `denim.jpg`, `chainmail.jpg` |

Tiles read top-left, top-right, bottom-left, bottom-right. A tile with no file shows a quiet placeholder naming the file it is waiting for, so a grid can be filled one image at a time. To use a different file name, change `file` in `src/data/textiles.js`.

Use photographs of at least 1000px on the short side so they stay sharp on large screens. Squares crop from the middle by default, so keep the interesting part of the fabric centred.

## Edit the content

| What | Where |
| --- | --- |
| The textile grids (files, captions, crops) | `src/data/textiles.js` |
| Projects in the Work menu and their sheets | `src/data/projects.js` |
| Information, services, clients, collaborators, contact | `src/data/about.js` |
| Name, tagline and page title | `src/components/Header.jsx`, `index.html` |
| Colours, type, spacing and grid size | `src/styles.css` (variables at the top; `--g` sets the grid size) |

All text and credits in the data files are sample content (including the client and collaborator names). Replace them with your own before publishing. Project photos go in `public/projects/`, named after each project's `id`, for example `intrecciato-study-1.jpg`.

## Archived: the 3D clothing rack

The rotating 3D rack of garments (woven rose suede outfit, studio lighting, plaster and realistic looks) is kept in `src/archive/rack/`, unchanged. Open the site with `?hero=rack` to preview it. See `src/archive/rack/README.md` for how to bring it back as the default. Its libraries (`three`, `@react-three/fiber`) are still in `package.json`; remove them if the rack is retired for good.

## Publish

`npm run build` produces a static `dist/` folder with relative paths, so it works on any static host, including a GitHub Pages project sub-path. For Netlify or Cloudflare Pages, use the build command `npm run build` and the publish directory `dist`.

## Notes

- Fonts (Archivo) load from Google Fonts. To self-host, download the font files and replace the `<link>` in `index.html` with `@font-face` rules.
- Hover effects need a mouse. On touch screens, tapping a swatch gives the same state.
