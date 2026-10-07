import * as THREE from 'three';

/* Procedural fabric. Everything is generated in the browser, so the project
   has no image or model files to load. UVs are in metres, so each texture's
   `tile` is the real-world size of one repeat. Each fabric bakes a colour map
   and a normal map (from a height field with fibre-level grain). */

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

/* Run `sample(x, y, out)` per pixel; out = [r, g, b, height] (0..255, 0..1).
   Returns a colour map and a normal map. `strength` scales the relief. */
function bake(size, sample, { tile, strength }) {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  };
  const colorCanvas = mk();
  const normalCanvas = mk();
  const cctx = colorCanvas.getContext('2d');
  const nctx = normalCanvas.getContext('2d');
  const cimg = cctx.createImageData(size, size);
  const nimg = nctx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  const out = [0, 0, 0, 0];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      sample(x, y, out);
      const p = (y * size + x) * 4;
      cimg.data[p] = out[0];
      cimg.data[p + 1] = out[1];
      cimg.data[p + 2] = out[2];
      cimg.data[p + 3] = 255;
      heights[y * size + x] = out[3];
    }
  }

  // central differences, wrapping at the edges so the tile stays seamless
  const at = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const p = (y * size + x) * 4;
      nimg.data[p] = (-dx * inv * 0.5 + 0.5) * 255;
      nimg.data[p + 1] = (dy * inv * 0.5 + 0.5) * 255;
      nimg.data[p + 2] = (inv * 0.5 + 0.5) * 255;
      nimg.data[p + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  nctx.putImageData(nimg, 0, 0);

  const tex = (canvas, isColor) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / tile, 1 / tile);
    t.anisotropy = 8;
    if (isColor) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(colorCanvas, true), normal: tex(normalCanvas, false) };
}

/* Intrecciato: a diagonal basket weave of flat strips with a suede nap. The
   lattice repeats every `cells` strips, so the texture tiles seamlessly. */
function weave(base, tile = 0.092) {
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
    const strip = profile * dip * clamp01(edge / 0.09);
    const nap = Math.random();
    // washed, mottled suede: slow variation that is periodic in the tile
    const mottle =
      1 +
      0.07 * Math.sin((TAU * x * 2) / size + 1.3) * Math.sin((TAU * y * 3) / size + 0.4) +
      0.05 * Math.sin((TAU * (x * 5 + y * 3)) / size);
    const shade = (0.66 + 0.4 * strip) * (0.9 + 0.2 * hash2(ci, cj)) * mottle * (0.94 + 0.12 * nap);
    out[0] = Math.min(255, br * shade);
    out[1] = Math.min(255, bg * shade);
    out[2] = Math.min(255, bb * shade);
    out[3] = strip * 0.9 + nap * 0.1;
  }, { tile, strength: 2.6 });
}

/* Woollen cloth: a fine diagonal twill under soft fibre noise. Greyscale,
   tinted by the material colour. */
function wool(tile = 0.2) {
  const size = 512;
  return bake(size, (x, y, out) => {
    const tw = 0.5 + 0.5 * Math.sin((TAU * (x + y)) / 8);
    const n = Math.random();
    out[0] = out[1] = out[2] = 255 * (0.86 + 0.07 * tw + 0.07 * n);
    out[3] = 0.55 * tw + 0.45 * n;
  }, { tile, strength: 2.4 });
}

/* Knitwear: columns of V stitches. */
function knit(tile = 0.32) {
  const size = 512;
  const p = 16;
  return bake(size, (x, y, out) => {
    const phase = x / p + Math.abs(((y / p) % 1) - 0.5) * 0.9;
    const h = 0.5 + 0.5 * Math.cos(TAU * phase);
    const n = Math.random();
    out[0] = out[1] = out[2] = 255 * (0.72 + 0.28 * h) * (0.96 + 0.08 * n);
    out[3] = h * 0.85 + n * 0.15;
  }, { tile, strength: 4 });
}

/* Cotton poplin and leather share a near-flat grain. */
function grain(amount, tile, strength) {
  const size = 256;
  return bake(size, (x, y, out) => {
    const n = Math.random();
    out[0] = out[1] = out[2] = 255 * (1 - amount + amount * n);
    out[3] = n;
  }, { tile, strength });
}

const cache = new Map();
const once = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
};

const tint = (hex, toward, amount) => new THREE.Color(hex).lerp(new THREE.Color(toward), amount);
// sheen on dark cloth must stay subtle or it turns grey
const luma = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
const sheenFor = (hex, k) => k * (0.25 + 0.75 * Math.min(1, luma(hex) * 3));

/* Physically based cloth. `sheen` is the soft, fibre-scattered rim light that
   makes wool, cotton and suede read as fabric rather than plastic. */
export function clothMaterial({ fabric, color }) {
  return once(`cloth:${fabric}:${color}`, () => {
    const common = { side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, metalness: 0 };
    switch (fabric) {
      case 'weave': {
        const t = once(`tex:weave:${color}`, () => weave(color));
        return new THREE.MeshPhysicalMaterial({
          ...common, map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(0.9, 0.9),
          roughness: 0.95, sheen: 0.45, sheenRoughness: 0.8, sheenColor: tint(color, '#ffffff', 0.35)
        });
      }
      case 'knit': {
        const t = once('tex:knit', () => knit());
        return new THREE.MeshPhysicalMaterial({
          ...common, color, map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(1.3, 1.3),
          roughness: 1, sheen: sheenFor(color, 0.9), sheenRoughness: 0.6, sheenColor: tint(color, '#ffffff', 0.5)
        });
      }
      case 'leather': {
        const t = once('tex:leather', () => grain(0.35, 0.1, 2));
        return new THREE.MeshPhysicalMaterial({
          ...common, color, normalMap: t.normal, normalScale: new THREE.Vector2(0.55, 0.55),
          roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.42
        });
      }
      case 'poplin': {
        const t = once('tex:poplin', () => grain(0.06, 0.12, 0.6));
        return new THREE.MeshPhysicalMaterial({
          ...common, color, map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(0.4, 0.4),
          roughness: 0.74, sheen: sheenFor(color, 0.5), sheenRoughness: 0.5, sheenColor: tint(color, '#ffffff', 0.6)
        });
      }
      default: {
        const t = once('tex:wool', () => wool());
        return new THREE.MeshPhysicalMaterial({
          ...common, color, map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(0.9, 0.9),
          roughness: 0.92, sheen: sheenFor(color, 0.8), sheenRoughness: 0.6, sheenColor: tint(color, '#ffffff', 0.32)
        });
      }
    }
  });
}

export const trimMaterial = once('trim', () => new THREE.MeshPhysicalMaterial({
  color: '#1c1616', roughness: 0.28, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2
}));
export const hangerMaterial = once('hanger', () => new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.38, metalness: 0.7 }));
