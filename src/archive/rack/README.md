# Archived: 3D clothing rack hero

The rotating 3D rack of procedurally modelled garments (woven rose suede
outfit, plaster and realistic looks, studio lighting, swinging physics).
It is kept here, unchanged, in case it comes back.

- `RackHero.jsx`: the self-contained hero component.
- `Stage.jsx`, `three/`: the scene, garments, fabrics and post-processing.
- `garments.js`: the pieces on the rack.

To preview it, open the site with `?hero=rack`. To make it the default again,
render `RackHero` instead of `TextileGrid` in `src/App.jsx`. The 3D libraries
(`three`, `@react-three/fiber`) stay in `package.json`; remove them if the rack
is retired for good.
