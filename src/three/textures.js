import * as THREE from 'three';

/* Procedural fabric textures. Everything is generated in the browser, so the
   project has no image or model files to load. UVs are in metres, so each
   texture's `tile` is the real-world size of one repeat. */

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function hash2(i, j) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Run `sample(x, y, out)` per pixel; out = [r, g, b, height] in 0..255 / 0..1.
function bake(size, sample, { tile, srgb = true }) {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  };
  const colorCanvas = mk();
  const heightCanvas = mk();
  const cctx = colorCanvas.getContext('2d');
  const hctx = heightCanvas.getContext('2d');
  const cimg = cctx.createImageData(size, size);
  const himg = hctx.createImageData(size, size);
  const out = [0, 0, 0, 0];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      sample(x, y, out);
      const p = (y * size + x) * 4;
      cimg.data[p] = out[0];
      cimg.data[p + 1] = out[1];
      cimg.data[p + 2] = out[2];
      cimg.data[p + 3] = 255;
      const h = clamp01(out[3]) * 255;
      himg.data[p] = himg.data[p + 1] = himg.data[p + 2] = h;
      himg.data[p + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  hctx.putImageData(himg, 0, 0);
  const tex = (canvas, isColor) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / tile, 1 / tile);
    t.anisotropy = 8;
    if (isColor && srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(colorCanvas, true), bump: tex(heightCanvas, false) };
}

/* Intrecciato: a diagonal basket weave of flat strips. The lattice repeats
   every `cells` strips, so the texture tiles without a visible seam. */
function weave(base, tile = 0.12) {
  const size = 1024;
  const cells = 4;
  const s = size / (cells * Math.SQRT2);
  const [br, bg, bb] = hexToRgb(base);
  return bake(size, (x, y, out) => {
    const u = (x + y + 1) / Math.SQRT2;
    const v = (x - y) / Math.SQRT2;
    const fu = u / s;
    const fv = v / s;
    const i = Math.floor(fu);
    const j = Math.floor(fv);
    const a = fu - i;
    const b = fv - j;
    const ci = ((i % cells) + cells) % cells;
    const cj = ((j % cells) + cells) % cells;
    const top = ((i + j) & 1) === 0;
    const along = top ? a : b;
    const across = top ? b : a;
    const edge = Math.min(across, 1 - across);
    const profile = Math.pow(Math.sin(Math.PI * across), 0.5);
    const dip = 0.5 + 0.5 * Math.pow(Math.sin(Math.PI * along), 0.6);
    const h = profile * dip * clamp01(edge / 0.09);
    // washed, mottled suede: slow variation that is periodic in the tile
    const mottle =
      1 +
      0.07 * Math.sin((TAU * x * 2) / size + 1.3) * Math.sin((TAU * y * 3) / size + 0.4) +
      0.05 * Math.sin((TAU * (x * 5 + y * 3)) / size);
    const shade = (0.66 + 0.4 * h) * (0.9 + 0.2 * hash2(ci, cj)) * mottle * (0.97 + 0.06 * Math.random());
    out[0] = Math.min(255, br * shade);
    out[1] = Math.min(255, bg * shade);
    out[2] = Math.min(255, bb * shade);
    out[3] = h;
  }, { tile });
}

/* Woollen cloth: a fine diagonal twill under soft noise. Greyscale, tinted by
   the material colour. */
function wool(tile = 0.2) {
  const size = 512;
  return bake(size, (x, y, out) => {
    const tw = 0.5 + 0.5 * Math.sin((TAU * (x + y)) / 8);
    const n = Math.random();
    const v = 255 * (0.84 + 0.08 * tw + 0.08 * n);
    out[0] = out[1] = out[2] = v;
    out[3] = 0.5 * tw + 0.5 * n;
  }, { tile });
}

/* Knitwear: columns of V stitches. */
function knit(tile = 0.32) {
  const size = 512;
  const p = 16;
  return bake(size, (x, y, out) => {
    const phase = x / p + Math.abs(((y / p) % 1) - 0.5) * 0.9;
    const h = 0.5 + 0.5 * Math.cos(TAU * phase);
    const v = 255 * (0.74 + 0.26 * h) * (0.97 + 0.06 * Math.random());
    out[0] = out[1] = out[2] = v;
    out[3] = h;
  }, { tile });
}

/* Poplin and leather share a near-flat grain. */
function grain(amount, tile = 0.16) {
  const size = 256;
  return bake(size, (x, y, out) => {
    const n = Math.random();
    const v = 255 * (1 - amount + amount * n);
    out[0] = out[1] = out[2] = v;
    out[3] = n;
  }, { tile });
}

const cache = new Map();
const once = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
};

/* Materials for each fabric. `color` tints greyscale fabrics; the weave bakes
   its own colour. */
export function clothMaterial({ fabric, color }) {
  return once(`cloth:${fabric}:${color}`, () => {
    const common = { side: THREE.DoubleSide };
    switch (fabric) {
      case 'weave': {
        const t = once(`tex:weave:${color}`, () => weave(color));
        return new THREE.MeshStandardMaterial({
          ...common, map: t.map, bumpMap: t.bump, bumpScale: 2.2, roughness: 0.92, metalness: 0
        });
      }
      case 'knit': {
        const t = once('tex:knit', () => knit());
        return new THREE.MeshStandardMaterial({
          ...common, color, map: t.map, bumpMap: t.bump, bumpScale: 2.4, roughness: 1, metalness: 0
        });
      }
      case 'leather': {
        const t = once('tex:leather', () => grain(0.35, 0.1));
        return new THREE.MeshPhysicalMaterial({
          ...common, color, bumpMap: t.bump, bumpScale: 0.6, roughness: 0.42, metalness: 0,
          clearcoat: 0.3, clearcoatRoughness: 0.45
        });
      }
      case 'poplin': {
        const t = once('tex:poplin', () => grain(0.06, 0.12));
        return new THREE.MeshStandardMaterial({
          ...common, color, map: t.map, roughness: 0.72, metalness: 0
        });
      }
      default: {
        const t = once('tex:wool', () => wool());
        return new THREE.MeshStandardMaterial({
          ...common, color, map: t.map, bumpMap: t.bump, bumpScale: 1.4, roughness: 0.94, metalness: 0
        });
      }
    }
  });
}

export const trimMaterial = once('trim', () => new THREE.MeshStandardMaterial({ color: '#1d1717', roughness: 0.35, metalness: 0.1 }));
export const hangerMaterial = once('hanger', () => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4, metalness: 0.5 }));

export const edgeMaterial = once('edge', () => new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false }));
