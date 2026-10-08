/* The Tactile Archive: two 2 x 2 grids of textile macro photographs.

   Each tile reads its image from public/textiles/<file>. A tile whose file is
   missing shows a quiet placeholder naming the file it is waiting for, so a
   grid can be filled one image at a time. `focus` is where the square crop
   sits inside the photograph (CSS object-position), which matters because the
   photographs are not square. */
export const TEXTILES = {
  left: [
    { id: 'leather-woven', file: 'leather-woven.jpg', name: 'Woven leather', note: 'Brown, hand woven', alt: 'Close-up of woven brown leather' },
    { id: 'floral', file: 'floral.jpg', name: 'Floral embellishment', note: 'Pink, appliqué', alt: 'Close-up of pink floral embellishments' },
    { id: 'leather-draped', file: 'leather-draped.jpg', name: 'Draped leather', note: 'Black', alt: 'Close-up of draped black leather' },
    { id: 'velvet', file: 'velvet.jpg', name: 'Velvet', note: 'Soft green', alt: 'Close-up of soft green velvet' }
  ],
  right: [
    { id: 'snakeskin', file: 'snakeskin.jpg', name: 'Snakeskin', note: 'Printed, pale blue', alt: 'Close-up of a snakeskin pattern in pale blue and grey' },
    { id: 'shearling', file: 'shearling.jpg', name: 'Shearling', note: 'Cream, curled', alt: 'Close-up of textured cream shearling' },
    { id: 'denim', file: 'denim.jpg', name: 'Woven denim', note: 'Indigo, interlaced', alt: 'Close-up of interlaced woven indigo denim' },
    { id: 'chainmail', file: 'chainmail.jpg', name: 'Chainmail', note: 'Silver, metal mesh', alt: 'Close-up of draped silver chainmail' }
  ]
};
