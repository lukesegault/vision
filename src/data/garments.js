/* The pieces on the rotating rack, in order around the ring.

   type     'shirt' (shirts, jackets, coats), 'sweater' or 'trousers'
   fabric   'weave', 'wool', 'knit', 'poplin' or 'leather'
   color    cloth colour (the weave bakes its own, so it is the base pink)
   params   proportions in metres; see src/three/builders.js for each key
   model    optional: a .glb in public/ (for example 'models/overshirt.glb')
            that replaces the built-in garment once loaded. It is scaled to
            params.length and hung from the hook; see src/three/models.js.

   The first two pieces are the hero outfit and start at the front. */
export const RACK = [
  {
    id: 'intrecciato-overshirt',
    type: 'shirt',
    fabric: 'weave',
    color: '#d89ba5',
    name: 'Intrecciato overshirt',
    note: 'Woven suede, rose',
    params: { length: 0.72, shoulder: 0.236, chest: 0.24, hem: 0.248, depth: 0.072, sleeve: 0.6, buttons: 5 }
  },
  {
    id: 'intrecciato-trousers',
    type: 'trousers',
    fabric: 'weave',
    color: '#d89ba5',
    name: 'Intrecciato trousers',
    note: 'Woven suede, rose',
    params: { waist: 0.168, hip: 0.188, length: 1.0, knee: 0.098, hem: 0.092, flare: 0.004 }
  },
  {
    id: 'overcoat',
    type: 'shirt',
    fabric: 'wool',
    color: '#34353a',
    name: 'Double-breasted overcoat',
    note: 'Charcoal wool',
    params: {
      length: 1.12, shoulder: 0.262, chest: 0.272, hem: 0.318, depth: 0.092, sleeve: 0.7,
      sleeveR: 0.074, buttons: 4, double: true, pockets: true, lapels: true, lapelWide: 0.1, collarPoint: 0.1, collarSpread: 0.34
    }
  },
  {
    id: 'knit',
    type: 'sweater',
    fabric: 'knit',
    color: '#e6e0d3',
    name: 'Crewneck knit',
    note: 'Ecru merino',
    params: { length: 0.66, shoulder: 0.24, chest: 0.25, hem: 0.236, depth: 0.082, sleeve: 0.58 }
  },
  {
    id: 'tailored-trousers',
    type: 'trousers',
    fabric: 'wool',
    color: '#1b1b1d',
    name: 'Tailored trousers',
    note: 'Black wool',
    params: { waist: 0.165, hip: 0.182, length: 1.0, knee: 0.096, hem: 0.088, flare: 0 }
  },
  {
    id: 'poplin-shirt',
    type: 'shirt',
    fabric: 'poplin',
    color: '#f4f3ef',
    name: 'Poplin shirt',
    note: 'White cotton',
    params: { length: 0.76, shoulder: 0.232, chest: 0.234, hem: 0.246, depth: 0.066, sleeve: 0.6, buttons: 6 }
  },
  {
    id: 'car-coat',
    type: 'shirt',
    fabric: 'wool',
    color: '#a98456',
    name: 'Car coat',
    note: 'Camel wool',
    params: {
      length: 0.96, shoulder: 0.255, chest: 0.262, hem: 0.292, depth: 0.088, sleeve: 0.68,
      sleeveR: 0.07, buttons: 5, pockets: true, collarPoint: 0.09, collarSpread: 0.3
    }
  },
  {
    id: 'wide-trousers',
    type: 'trousers',
    fabric: 'wool',
    color: '#8d8e90',
    name: 'Wide trousers',
    note: 'Grey flannel',
    params: { waist: 0.172, hip: 0.2, length: 1.02, knee: 0.128, hem: 0.138, flare: 0.012 }
  },
  {
    id: 'blazer',
    type: 'shirt',
    fabric: 'wool',
    color: '#c7c6c1',
    name: 'Unlined blazer',
    note: 'Pale grey wool',
    params: {
      length: 0.8, shoulder: 0.246, chest: 0.252, hem: 0.262, depth: 0.076, sleeve: 0.62,
      buttons: 2, pockets: true, lapels: true, collarPoint: 0.085, collarSpread: 0.36
    }
  },
  {
    id: 'leather-overshirt',
    type: 'shirt',
    fabric: 'leather',
    color: '#171515',
    name: 'Leather overshirt',
    note: 'Black calf leather',
    params: { length: 0.7, shoulder: 0.24, chest: 0.246, hem: 0.254, depth: 0.074, sleeve: 0.6, buttons: 5 }
  }
];

/* Angle between neighbouring pieces on the ring. */
export const STEP = (Math.PI * 2) / RACK.length;
