/* The Tactile Archive: two 2 x 2 grids of textile macro photographs.

   `fx` tunes how each fabric reacts to the pointer (all optional, see
   FX_DEFAULTS in src/lib/textileGL.js for what each one does). The settings
   below give each material its own behaviour: leather catches long highlights,
   metal glints and ripples, fur drifts and bends, velvet's pile flattens.

   A tile with `video: 'name'` plays public/textiles/name.webm (or .mp4) once
   over its still on hover, holds the last frame while the pointer stays, and
   fades back to the still when it leaves. The still should be the first frame
   of the film so nothing jumps; the film replaces the shader effect on that
   tile.

   Each tile reads its image from public/textiles/<file>. A tile whose file is
   missing shows a quiet placeholder naming the file it is waiting for, so a
   grid can be filled one image at a time. `focus` is where the square crop
   sits inside the photograph (CSS object-position), which matters because the
   photographs are not square. */
export const TEXTILES = {
  left: [
    { id: 'leather-woven', file: 'leather-woven.jpg', fx: { bump: 1.4, fold: 0.25, diffuse: 0.45, gloss: 0.55, shine: 34 }, name: 'Woven leather', note: 'Aubergine, interlaced', alt: 'Close-up of interlaced woven leather in deep aubergine brown' },
    { id: 'floral', file: 'floral.jpg', fx: { bump: 0.9, diffuse: 0.15, gloss: 0.2, glitter: 0.7, glitterCells: 70, glitterFrom: 0.55, sheen: 0.1 }, name: 'Floral embellishment', note: 'Pink, beaded and sequinned', alt: 'Close-up of pink floral embellishments' },
    { id: 'leather-draped', file: 'leather-draped.jpg', fx: { bump: 1.1, fold: 0.9, diffuse: 0.5, gloss: 0.55, shine: 18 }, focus: '50% 58%', name: 'Draped leather', note: 'Black, full grain', alt: 'Close-up of draped black leather' },
    { id: 'velvet', file: 'velvet.jpg', fx: { bump: 0.6, diffuse: 0.15, gloss: 0, sheen: 0.55, nap: 0.7 }, name: 'Velvet', note: 'Sage green', alt: 'Close-up of soft green velvet' }
  ],
  right: [
    { id: 'snakeskin', file: 'snakeskin-still.jpg', video: 'snakeskin', name: 'Snakeskin', note: 'Printed, pale blue', alt: 'Close-up of a snakeskin pattern in pale blue and grey' },
    { id: 'shearling', file: 'shearling-still.jpg', video: 'shearling', fx: { bump: 0.8, diffuse: 0.25, gloss: 0.08, shine: 8, warp: 0.012 }, name: 'Shearling', note: 'Cream, curled', alt: 'Close-up of textured cream shearling' },
    { id: 'denim', file: 'denim.jpg', fx: { bump: 1.4, diffuse: 0.3, gloss: 0.12, shine: 12 }, name: 'Woven denim', note: 'Indigo, interlaced', alt: 'Close-up of interlaced woven indigo denim' },
    { id: 'chainmail', file: 'chainmail-still.jpg', video: 'chainmail', name: 'Chainmail', note: 'Silver, metal mesh', alt: 'Close-up of draped silver chainmail' }
  ]
};
