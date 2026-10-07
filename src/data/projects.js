/* The Work menu and project sheets. Sample content: replace with your own.
   Images live in public/projects/. Name them as listed in `images` and they
   appear automatically; until then the sheet shows a placeholder that names
   the file it is waiting for. */
export const PROJECTS = [
  {
    id: 'intrecciato-study',
    title: 'Intrecciato Study',
    categories: ['Editorial', 'Wardrobe'],
    year: 2026,
    role: 'Styling, sourcing',
    description:
      'A study in surface. A single woven rose suede outfit, shot against white, to test how far texture can carry a look without any other noise.',
    credits: { Styling: 'Your Name', Photography: 'Photographer', Model: 'Model' }
  },
  {
    id: 'quiet-tailoring',
    title: 'Quiet Tailoring',
    categories: ['Wardrobe'],
    year: 2026,
    role: 'Wardrobe direction',
    description:
      'A complete tailoring wardrobe for a client who dislikes logos. Seven pieces, one palette, cut to disappear and fit exactly.',
    credits: { Styling: 'Your Name', Photography: 'Photographer' }
  },
  {
    id: 'monolith-season',
    title: 'Monolith Season',
    categories: ['Campaign'],
    year: 2025,
    role: 'Creative styling',
    description:
      'Campaign styling built on strong silhouettes: long coats, wide trousers and a restricted range of black, stone and grey.',
    credits: { Styling: 'Your Name', Photography: 'Photographer', Casting: 'Casting Director' }
  },
  {
    id: 'grey-area',
    title: 'Grey Area',
    categories: ['Editorial', 'Campaign'],
    year: 2025,
    role: 'Styling',
    description:
      'An editorial exploring every shade between white and charcoal, with the structure of each garment doing the work colour usually does.',
    credits: { Styling: 'Your Name', Photography: 'Photographer', Model: 'Model' }
  },
  {
    id: 'the-uniform',
    title: 'The Uniform',
    categories: ['Wardrobe', 'Private client'],
    year: 2025,
    role: 'Wardrobe edit',
    description:
      'Reducing a full wardrobe to a considered daily uniform: fewer pieces, better proportions and a clear rule for every addition.',
    credits: { Styling: 'Your Name' }
  },
  {
    id: 'after-hours',
    title: 'After Hours',
    categories: ['Event'],
    year: 2025,
    role: 'Occasion styling',
    description:
      'Evening dressing for a gallery opening and a black-tie dinner: sharp lines, dark fabrics and one deliberate point of colour.',
    credits: { Styling: 'Your Name', Photography: 'Photographer' }
  },
  {
    id: 'structure-no-3',
    title: 'Structure No. 3',
    categories: ['Editorial'],
    year: 2024,
    role: 'Styling',
    description:
      'The third in a series on construction: shoulders, seams and hems treated as architecture.',
    credits: { Styling: 'Your Name', Photography: 'Photographer', Model: 'Model' }
  },
  {
    id: 'soft-armour',
    title: 'Soft Armour',
    categories: ['Campaign', 'Editorial'],
    year: 2024,
    role: 'Creative styling',
    description:
      'Leather and heavy wool styled against clean white sets. Protective in feeling, precise in finish.',
    credits: { Styling: 'Your Name', Photography: 'Photographer', Model: 'Model' }
  },
  {
    id: 'private-client-paris',
    title: 'Private Client, Paris',
    categories: ['Private client'],
    year: 2024,
    role: 'Personal styling',
    description:
      'A long-term styling relationship: seasonal edits, fittings and travel wardrobes for a client based between Paris and Milan.',
    credits: { Styling: 'Your Name' }
  },
  {
    id: 'capsule-01',
    title: 'Capsule 01',
    categories: ['Wardrobe'],
    year: 2023,
    role: 'Wardrobe direction',
    description:
      'The first capsule: twelve pieces that build thirty outfits, designed around one fixed silhouette.',
    credits: { Styling: 'Your Name' }
  }
].map((p) => ({ ...p, images: [`${p.id}-1.jpg`, `${p.id}-2.jpg`] }));
