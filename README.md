# Vision

A single-page portfolio for a menswear personal stylist. The centrepiece is a 3D rack of garments that rotates on its own, on a white page with generous margins, with floating pill navigation and glass menus.

Built with React, Three.js (through React Three Fiber) and Vite. The garments are modelled in code, so there are no 3D files to download or manage.

## Run it

```sh
npm install
npm run dev        # development server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## What is on the page

- **Floating pills**: brand, Work and About, with a background blur.
- **Work menu**: a glass table of projects (number, title, categories, year). Choosing a row opens a full-screen project sheet. The centre of the page shrinks, fades and blurs while a menu is open.
- **About menu**: information, services, selected clients, collaborators and contact.
- **The rack**: ten pieces on a circular rail, turning slowly. Drag or swipe to spin it, use the arrow buttons (or the left and right arrow keys) to step between pieces. The caption at the bottom names the piece at the front. With reduced motion enabled in the system settings, it does not turn on its own.
- **Hero outfit**: a woven rose suede overshirt and trousers (inspired by intrecciato leatherwork) start at the front of the rack.

## Edit the content

| What | Where |
| --- | --- |
| Projects in the Work menu and their sheets | `src/data/projects.js` |
| Information, services, clients, collaborators, contact | `src/data/about.js` |
| The pieces on the rack (name, fabric, colour, proportions) | `src/data/garments.js` |
| Name, tagline and page title | `src/components/Header.jsx`, `index.html` |
| Colours, type and spacing | `src/styles.css` (variables at the top) |

All text and credits in these files are sample content (including the client and collaborator names). Replace them with your own.

### Project photos

Put images in `public/projects/`. Each project expects two files, named after its `id`, for example `intrecciato-study-1.jpg` and `intrecciato-study-2.jpg`. Until a file exists, the sheet shows a placeholder that names the file it is waiting for. A 4:5 portrait crop around 1600px tall works best.

### Changing the garments

Each entry in `src/data/garments.js` has a `type` (`shirt` for shirts, jackets and coats; `sweater`; `trousers`), a `fabric` (`weave`, `wool`, `knit`, `poplin` or `leather`), a `color`, and `params` in metres (length, shoulder width, sleeve length and so on). The meshes are built in `src/three/builders.js` and the procedural fabrics (including the woven suede) in `src/three/textures.js`. To add a piece, add an entry; the rack spaces itself out automatically.

## Publish

`npm run build` produces a static `dist/` folder with relative paths, so it works on any static host, including a GitHub Pages project sub-path. For Netlify or Cloudflare Pages, use the build command `npm run build` and the publish directory `dist`.

## Notes

- The 3D scene needs WebGL. Without it the menus and project sheets still work and a short message replaces the rack.
- Fonts (Archivo) load from Google Fonts. To self-host, download the font files and replace the `<link>` in `index.html` with `@font-face` rules.
- In development, `window.__vision` exposes the rack's controller for testing. It is removed from production builds.
