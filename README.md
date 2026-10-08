# Luke Segault

The website of Luke Segault, Styling + Curation: a single page on white with generous margins, floating pill navigation and glass menus.

Built with React and Vite. The hero is the **Tactile Archive Grid**: two 2 x 2 grids of textile macro photographs, framed like swatches in an atelier. (The earlier 3D clothing-rack hero is archived, see below.)

## Run it

```sh
npm install
npm run dev        # development server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## What is on the page

- **Tactile Archive Grid**: two perfectly square 2 x 2 grids, centred vertically and sized to the screen (about 39.5% of the width each, never taller than 68% of the height), with wide margins either side and a slightly narrower gap between them. On phones the grids stack, and a grid with no photographs yet stays hidden so a filled one gets the screen.
- **Floating pills**: name and tagline, Services and About, with a background blur.
- **Services menu**: a glass table of the six services (number, service, details). No pricing for now. The centre of the page shrinks, fades and blurs while a menu is open.
- **About menu**: a short description, and contact (Instagram, Paris / Remote).

### How the swatches move

- **Breathing**: each photograph scales between 1 and 1.03 over a slow, very subtle cycle (17 to 25 seconds), each at its own pace and phase so they never move in step.
- **Hover or keyboard focus**: the other seven swatches recede (faded, desaturated, a touch softer) while the chosen one comes forward with a little more contrast, and its texture pans gently with the pointer. The caption names the swatch.
- **Each fabric moves like itself.** Under the pointer, the photograph is relit from the pointer using its own light and dark detail as relief, and every material adds its own behaviour:
  - **Woven and draped leather**: soft highlights slide across the strips and along the folds, as if you were tilting the hide.
  - **Floral embellishment**: sequins and rhinestones twinkle as the light moves.
  - **Velvet**: a pool of light follows the pointer, and the pile looks flattened behind the stroke and raised ahead of it.
  - **Snakeskin**: real footage. Hovering plays a 3 second film of the leather being flexed: light sweeps across the scales and a fold lifts and passes over the surface, then it settles back. It holds its last frame while the pointer stays, and fades back to the still on leave.
  - **Shearling**: real footage. Hovering plays a 2.5 second film of the fur being stroked by an unseen hand (it starts moving within half a second), over the still. It holds its last frame while the pointer stays, and fades back to the still when the pointer leaves.
  - **Denim**: a soft sheen along the twill and the stitching.
  - **Chainmail**: real footage. Hovering plays a 6 second film of the heavy metal mesh swaying like a liquid, with the discs flashing one after another as a wave of light runs through it, then settling. It starts moving within about a quarter of a second, holds its last frame while the pointer stays, and fades back to the still on leave.
  
  At rest every swatch is exactly the photograph, and the effect eases out when the pointer leaves. Nothing runs unless the pointer is over a swatch.
- **Easing**: the CSS uses one sharp curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for a crisp, deliberate feel, never bouncy. The swatches also appear with a clean cut, wiped in one after another.
- **Fallbacks**: without WebGL the plain photographs are shown (the fade, pan and breathing still work). With reduced motion enabled in the system settings, the live effects, breathing, panning and reveal are all switched off.

### Real footage on a swatch

Any tile can play a film on hover instead of the shader effect. The shearling, snakeskin and chainmail tiles do this today. In `src/data/textiles.js`, a tile with `video: 'shearling'` plays `public/textiles/shearling.webm` (with `shearling.mp4` as a fallback for browsers that cannot play WebM) over its still. The still, `shearling-still.jpg`, is the first frame of the film so that nothing jumps when playback starts.

To prepare a new clip: pick the moment the movement starts and cut a few seconds from just before it (the film should react within about half a second of hovering), crop it square, remove the audio, and keep it under about 600 KB. The film plays once and holds its last frame, so it does not need to loop. For example, with ffmpeg (here cutting from 4.95 s for 2.45 s):

```sh
ffmpeg -ss 4.95 -t 2.45 -i clip.mp4 -an -vf "crop=720:720:280:0,scale=640:640" -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart name.mp4
ffmpeg -ss 4.95 -t 2.45 -i clip.mp4 -an -vf "crop=720:720:280:0,scale=640:640" -c:v libvpx-vp9 -crf 34 -b:v 0 name.webm
ffmpeg -ss 4.95 -i clip.mp4 -vf "crop=720:720:280:0,scale=640:640" -vframes 1 -q:v 2 name-still.jpg
```

(`crop=720:720:280:0` takes the centre square of a 1280 x 720 clip.) With reduced motion enabled, films do not play and the still stays.

The original photographs, `public/textiles/shearling.jpg`, `snakeskin.jpg` and `chainmail.jpg`, are no longer used. To go back to one, set `file` to it and remove `video` from that tile.

### Tuning a fabric

The reaction of each swatch is set by its `fx` entry in `src/data/textiles.js`. All values are optional; `FX_DEFAULTS` in `src/lib/textileGL.js` explains each one:

| Setting | What it does |
| --- | --- |
| `bump` | How much relief is read from the photograph (raise for deeper weaves) |
| `fold` | 0 for fine grain, 1 for broad folds |
| `diffuse` | How much the pointer's light changes the shading |
| `gloss`, `shine`, `metal` | Highlight strength, tightness, and how much it is tinted by the fabric |
| `glitter`, `glitterCells`, `glitterFrom` | Sparkle strength, size and the brightness a detail needs to sparkle |
| `sheen`, `nap` | A pool of light, and pile that flattens along the stroke (velvet) |
| `warp`, `ripple` | Fibres drifting and bending (fur), and ripples when touched (mesh) |

If a swatch looks over-processed, lower `bump` and `diffuse` first.

## Add your photographs

Put images in `public/textiles/`. The grid is defined in `src/data/textiles.js`: each tile names its file, its caption and (optionally) a `focus` point for the square crop, for example `focus: '50% 30%'`.

| Grid | Files |
| --- | --- |
| Left | `leather-woven.jpg`, `floral.jpg`, `leather-draped.jpg`, `velvet.jpg` |
| Right | `snakeskin-still.jpg` (with `snakeskin.webm` and `snakeskin.mp4`), `shearling-still.jpg` (with `shearling.webm` and `shearling.mp4`), `denim.jpg`, `chainmail-still.jpg` (with `chainmail.webm` and `chainmail.mp4`) |

Tiles read top-left, top-right, bottom-left, bottom-right. A tile with no file shows a quiet placeholder naming the file it is waiting for, so a grid can be filled one image at a time. To use a different file name, change `file` in `src/data/textiles.js`.

Use photographs of at least 1000px on the short side so they stay sharp on large screens. Squares crop from the middle by default, so keep the interesting part of the fabric centred.

## Edit the content

| What | Where |
| --- | --- |
| The textile grids (files, captions, crops) | `src/data/textiles.js` |
| The services (title and details) | `src/data/services.js` |
| The About description and contact | `src/data/about.js` |
| Name, tagline and page title | `src/components/Header.jsx`, `index.html` |
| Colours, type, spacing and grid size | `src/styles.css` (variables at the top; `--g` sets the grid size) |

The Work section with project pages was removed until there is a portfolio to show. It is in the git history (for example commit fe74697) if you want it back.

## Contact

The site shows only the Instagram handle and "Paris / Remote", so it carries no phone number or email address for bots to collect. To add contact details later, edit `src/data/about.js` and `AboutPanel` in `src/components/Header.jsx`. Anything written in a page is public to scrapers, so for an email address a contact form is safer than a plain `mailto:` link.

## Archived: the 3D clothing rack

The rotating 3D rack of garments (woven rose suede outfit, studio lighting, plaster and realistic looks) is kept in `src/archive/rack/`, unchanged. Open the site with `?hero=rack` to preview it. See `src/archive/rack/README.md` for how to bring it back as the default. Its libraries (`three`, `@react-three/fiber`) are still in `package.json`; remove them if the rack is retired for good.

## Publish

`npm run build` produces a static `dist/` folder with relative paths, so it works on any static host, including a GitHub Pages project sub-path. For Netlify or Cloudflare Pages, use the build command `npm run build` and the publish directory `dist`.

### GitHub Pages (set up)

`.github/workflows/pages.yml` builds the site and publishes it every time you push to `main` or `claude/adoring-johnson-3kyato`, and it can also be run by hand from the Actions tab ("Run workflow"). The site appears at `https://<your-username>.github.io/vision/`.

One-time setup: repository **Settings > Pages > Build and deployment > Source: GitHub Actions**. Do not accept GitHub's suggested "Jekyll" starter workflow on that page: it would build the repository as a Jekyll site and publish that over this one. If you later change the repository's default branch, add it to the `branches` list in the workflow.

The page contains `<meta name="robots" content="noindex, nofollow">` in `index.html`, which asks search engines not to list the site while it is a private preview. Remove that line when you are ready to launch.

## Notes

- The site is set in Helvetica at 10px. It uses the font already on the visitor's device (Helvetica Neue on Mac and iPhone, Arial where Helvetica is missing, such as Windows and Android), so nothing is downloaded. Helvetica is a licensed font and cannot be bundled with the site.
- Hover effects need a mouse. On touch screens, tapping a swatch gives the same effect and keeps it on until you tap another swatch or empty space.
- Only the swatches without a film (five of the eight) use their own small WebGL context. Browsers allow around sixteen, so the grid is comfortably inside the limit.
