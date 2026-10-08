/* Which art direction the rack is rendered in.

   plaster    every garment is one matte, chalky neutral, like a sculpture,
              and only the hero outfit (the woven pieces) carries colour.
   realistic  the original fabric-accurate look, with each piece in its own
              colour and weave.

   Plaster is the default. Add ?look=realistic to the address to compare. */
export const LOOK = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('look') === 'realistic'
  ? 'realistic'
  : 'plaster';
export const isPlaster = LOOK === 'plaster';

/* The plaster tones: tops are lightest, coats a step down, trousers darker,
   so neighbouring pieces separate without any colour. */
export function plasterTone(spec) {
  if (spec.type === 'trousers') return '#d2cdc1';
  if (spec.type === 'sweater') return '#ebe7de';
  if (spec.params.length > 0.9 || spec.params.lapels) return '#dfdacd';
  return '#e8e4da';
}
