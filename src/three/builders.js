import * as THREE from 'three';
import {
  TAU, S, smoothstep, sampleSections, loftSections, loftCurve, collarOnSurface, lapelOnSurface, frontStrip, frontZ
} from './geometry.js';
import { clothMaterial, trimMaterial, hangerMaterial } from './textures.js';

/* Every garment is built with the centre of the rail at the origin, hanging
   straight down. +z is the front of the garment, +x runs along the rail. */

const mesh = (geo, mat, name) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  return m;
};

const seedOf = (id) => [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) & 0xffff;

/* How each kind of cloth hangs: amplitude of the drape folds (metres) and how
   far apart they are. Heavier, softer cloth folds more; stiff cloth less. */
const HANG_STYLE = {
  weave: { amp: 0.0042, fx: 2.8, fy: 2.0, ripple: 0.003, crease: 0.0045 },
  wool: { amp: 0.0042, fx: 2.4, fy: 1.7, ripple: 0.002, crease: 0.0035 },
  knit: { amp: 0.0075, fx: 3.2, fy: 2.4, ripple: 0.004, crease: 0.006 },
  poplin: { amp: 0.0034, fx: 3.6, fy: 2.8, ripple: 0.0025, crease: 0.004 },
  leather: { amp: 0.0068, fx: 3.4, fy: 2.0, ripple: 0.003, crease: 0.007 }
};

/* ---------- hanger ---------- */

function hanger({ hang, bar }) {
  const g = new THREE.Group();
  const r = 0.022;
  // hook: an open loop over the rail, gap at the bottom
  const gap = 0.9;
  const hook = new THREE.TorusGeometry(r, 0.0032, 10, 48, TAU - gap);
  hook.rotateZ(-Math.PI / 2 + gap / 2);
  hook.rotateY(Math.PI / 2);
  g.add(mesh(hook, hangerMaterial));
  // neck from the hook down to the garment
  const len = hang - r;
  const rod = new THREE.CylinderGeometry(0.0032, 0.0032, len, 10);
  rod.translate(0, -r - len / 2, 0);
  g.add(mesh(rod, hangerMaterial));
  if (bar) {
    // trouser bar with two clips
    const b = new THREE.BoxGeometry(bar, 0.011, 0.011);
    b.translate(0, -hang + 0.012, 0);
    g.add(mesh(b, hangerMaterial));
    for (const side of [-1, 1]) {
      const clip = new THREE.BoxGeometry(0.03, 0.05, 0.026);
      clip.translate(side * (bar / 2 - 0.02), -hang - 0.004, 0);
      g.add(mesh(clip, hangerMaterial));
    }
  }
  return g;
}

/* ---------- shirts, jackets and coats ---------- */

function sleeveGeometry(side, P, style, seed) {
  const R = P.sleeveR ?? 0.062;
  const len = P.sleeve;
  const sh = P.shoulder;
  // a relaxed arm: slightly forward at the elbow and cuff
  const pts = [
    new THREE.Vector3(side * (sh - 0.04), -0.085, 0),
    new THREE.Vector3(side * (sh + 0.012), -0.2, 0.006),
    new THREE.Vector3(side * (sh + 0.05), -len * 0.62, 0.026),
    new THREE.Vector3(side * (sh + 0.062), -len - 0.04, 0.04)
  ];
  const cuff = P.cuffR ?? 0.04;
  return loftCurve(pts, (t) => {
    // a small cap that swells into the upper arm, tapers to the cuff, with a
    // slightly proud cuff band at the end
    const cap = 0.62 + 0.38 * Math.min(1, t / 0.16);
    const body = R + (cuff - R) * Math.pow(t, 0.8) + 0.01 * Math.sin(Math.PI * Math.min(1, t * 1.6));
    const band = 0.0055 * smoothstep(0.885, 0.9, t);
    const rx = body * cap + band;
    return { rx, rz: rx * 0.78 };
  }, {
    segs: 56,
    radial: 40,
    drape: { amp: style.amp * 0.8, fx: style.fx, fy: style.fy * 1.6, crease: style.crease, seed: seed + (side > 0 ? 3 : 17) }
  });
}

function buildShirtLike(spec, parts) {
  const P = spec.params;
  const cloth = clothMaterial(spec);
  const style = HANG_STYLE[spec.fabric] ?? HANG_STYLE.wool;
  const seed = seedOf(spec.id);
  const L = P.length;
  const controls = [
    S({ y: 0.02, hw: 0.078, hd: 0.05, n: 2 }),
    S({ y: 0.0, hw: 0.13, hd: 0.056, n: 2.2 }),
    S({ y: -0.04, hw: P.shoulder, hd: 0.064, n: 2.4 }),
    S({ y: -0.11, hw: P.chest, hd: P.depth, n: 2.8 }),
    S({ y: -L * 0.5, hw: P.chest * 1.01, hd: P.depth * 0.96, n: 3.0, fold: 0.003 }),
    S({ y: -L, hw: P.hem, hd: P.depth * 0.9, n: 3.0, fold: 0.01 })
  ];
  const sections = sampleSections(controls, 44);
  parts.add(mesh(loftSections(sections, { drape: { ...style, seed } }), cloth, 'body'));

  parts.add(mesh(sleeveGeometry(1, P, style, seed), cloth, 'sleeve-r'));
  parts.add(mesh(sleeveGeometry(-1, P, style, seed), cloth, 'sleeve-l'));

  parts.add(mesh(collarOnSurface(sections, {
    point: P.collarPoint ?? 0.082,
    spread: P.collarSpread ?? 0.26
  }), cloth, 'collar'));

  if (P.lapels) {
    // a touch lighter than the body so the edge reads
    const lapelMat = cloth.clone();
    if (lapelMat.color) lapelMat.color.multiplyScalar(1.08);
    for (const side of [-1, 1]) {
      parts.add(mesh(lapelOnSurface(sections, {
        side, top: -0.045, bottom: -(P.double ? 0.34 : 0.26),
        wideTop: P.lapelWide ?? 0.085, wideBottom: P.double ? 0.045 : 0.022
      }), lapelMat, 'lapel'));
    }
  }

  // front closure
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(cloth.color ?? '#ffffff').multiplyScalar(0.7), roughness: 1, side: THREE.DoubleSide });
  if (P.double) {
    parts.add(mesh(frontStrip(sections, { x: 0, width: 0.006, yTop: -0.06, yBottom: -L + 0.02, lift: 0.002 }), trimMaterial));
  } else if (spec.fabric === 'weave') {
    parts.add(mesh(frontStrip(sections, { x: 0, width: 0.036, yTop: -0.05, yBottom: -L + 0.01 }), cloth, 'placket'));
  } else {
    parts.add(mesh(frontStrip(sections, { x: 0, width: 0.004, yTop: -0.05, yBottom: -L + 0.01, lift: 0.001 }), dark, 'seam'));
  }

  const nBut = P.buttons ?? 5;
  const top = P.double ? 0.2 : 0.14;
  const bottom = P.double ? L - 0.25 : L - 0.12;
  const btnGeo = new THREE.CylinderGeometry(0.0088, 0.0092, 0.0055, 24).rotateX(Math.PI / 2);
  const xs = P.double ? [-0.08, 0.08] : [0];
  for (const x of xs) {
    for (let k = 0; k < nBut; k++) {
      const y = nBut === 1 ? -top : -(top + ((bottom - top) * k) / (nBut - 1));
      const b = mesh(btnGeo, trimMaterial, 'button');
      b.position.set(x, y, frontZ(sections, y) + 0.004);
      parts.add(b);
    }
  }

  if (P.pockets) {
    const pocket = new THREE.BoxGeometry(0.13, 0.036, 0.009);
    for (const x of [-1, 1]) {
      const y = -L * 0.66;
      const m = mesh(pocket, cloth, 'pocket');
      m.position.set(x * (P.chest * 0.52), y, frontZ(sections, y) + 0.0035);
      parts.add(m);
    }
  }
}

/* ---------- sweater ---------- */

function buildSweater(spec, parts) {
  const P = spec.params;
  const cloth = clothMaterial(spec);
  const style = HANG_STYLE[spec.fabric];
  const seed = seedOf(spec.id);
  const L = P.length;
  const controls = [
    S({ y: 0.02, hw: 0.082, hd: 0.054, n: 2 }),
    S({ y: 0.0, hw: 0.135, hd: 0.06, n: 2.1 }),
    S({ y: -0.04, hw: P.shoulder, hd: 0.07, n: 2.2 }),
    S({ y: -0.12, hw: P.chest, hd: P.depth, n: 2.4 }),
    S({ y: -L * 0.55, hw: P.chest * 1.0, hd: P.depth, n: 2.5, fold: 0.005 }),
    S({ y: -L + 0.08, hw: P.hem * 1.02, hd: P.depth * 0.95, n: 2.4, fold: 0.009 }),
    S({ y: -L + 0.02, hw: P.hem * 0.94, hd: P.depth * 0.88, n: 2.3, fold: 0.012 }),
    S({ y: -L, hw: P.hem * 0.94, hd: P.depth * 0.88, n: 2.3, fold: 0.012 })
  ];
  parts.add(mesh(loftSections(sampleSections(controls, 48), { drape: { ...style, seed } }), cloth, 'body'));
  const sleeveP = { ...P, sleeveR: 0.066, cuffR: 0.036 };
  parts.add(mesh(sleeveGeometry(1, sleeveP, style, seed), cloth));
  parts.add(mesh(sleeveGeometry(-1, sleeveP, style, seed), cloth));
  // crew neckband
  const band = sampleSections([
    S({ y: 0.046, hw: 0.083, hd: 0.058, n: 2, fold: 0.01 }),
    S({ y: 0.03, hw: 0.088, hd: 0.06, n: 2 }),
    S({ y: 0.004, hw: 0.092, hd: 0.064, n: 2 })
  ], 6);
  parts.add(mesh(loftSections(band), cloth, 'neckband'));
}

/* ---------- trousers ---------- */

function buildTrousers(spec, parts) {
  const P = spec.params;
  const cloth = clothMaterial(spec);
  const style = HANG_STYLE[spec.fabric] ?? HANG_STYLE.wool;
  const seed = seedOf(spec.id);
  const Lg = P.length;
  const upper = sampleSections([
    S({ y: 0.0, hw: P.waist, hd: 0.074, n: 2.4 }),
    S({ y: -0.05, hw: P.waist * 1.04, hd: 0.082, n: 2.6 }),
    S({ y: -0.2, hw: P.hip, hd: 0.092, n: 2.5 }),
    S({ y: -0.34, hw: P.hip * 0.99, hd: 0.086, n: 2.4 })
  ], 20);
  parts.add(mesh(loftSections(upper, { drape: { ...style, amp: style.amp * 0.6, seed } }), cloth, 'hips'));

  // waistband sits slightly proud of the hips
  const band = sampleSections([
    S({ y: 0.0, hw: P.waist + 0.003, hd: 0.0775, n: 2.4 }),
    S({ y: -0.042, hw: P.waist * 1.04 + 0.003, hd: 0.0855, n: 2.6 })
  ], 3);
  parts.add(mesh(loftSections(band), cloth, 'waistband'));

  const legX = P.hip * 0.5;
  for (const side of [-1, 1]) {
    const leg = sampleSections([
      S({ y: -0.3, cx: side * legX, hw: P.hip * 0.5, hd: 0.087, n: 2.3 }),
      S({ y: -0.34, cx: side * legX, hw: P.hip * 0.49, hd: 0.088, n: 2.3 }),
      S({ y: -0.5, cx: side * (legX + 0.002), hw: P.hip * 0.495, hd: 0.085, n: 2.3 }),
      S({ y: -Lg * 0.62, cx: side * (legX + 0.005), hw: P.knee, hd: 0.076, n: 2.3, fold: 0.003 }),
      S({ y: -Lg, cx: side * (legX + 0.005 + P.flare), hw: P.hem, hd: 0.074, n: 2.3, fold: 0.01 })
    ], 52);
    parts.add(mesh(loftSections(leg, {
      radial: 72,
      drape: { ...style, amp: style.amp * 1.15, fy: style.fy * 0.9, seed: seed + (side > 0 ? 5 : 29) }
    }), cloth, 'leg'));
  }

  // fly, button and belt loops
  const z0 = frontZ(sampleSections([
    S({ y: 0, hw: P.waist, hd: 0.0775 }), S({ y: -0.042, hw: P.waist, hd: 0.0855 })
  ], 2), -0.02);
  const btn = mesh(new THREE.CylinderGeometry(0.0095, 0.0099, 0.0055, 24).rotateX(Math.PI / 2), trimMaterial, 'button');
  btn.position.set(0, -0.022, z0 + 0.0035);
  parts.add(btn);
  const loop = new THREE.BoxGeometry(0.014, 0.05, 0.007);
  for (const x of [-0.075, 0.075]) {
    const m = mesh(loop, cloth, 'loop');
    m.position.set(x, -0.022, z0 + 0.0025);
    parts.add(m);
  }
  const fly = frontStrip(upper, { x: 0.006, width: 0.004, yTop: -0.045, yBottom: -0.2, lift: 0.0016 });
  const flyMesh = mesh(fly, new THREE.MeshStandardMaterial({ color: '#000000', transparent: true, opacity: 0.22, roughness: 1, depthWrite: false }), 'fly');
  flyMesh.castShadow = false;
  parts.add(flyMesh);
}

/* ---------- entry point ---------- */

const HANG = { shirt: 0.125, sweater: 0.125, trousers: 0.18 };

export function buildGarment(spec) {
  const root = new THREE.Group();
  root.name = spec.id;
  const hang = HANG[spec.type];
  root.add(hanger({ hang, bar: spec.type === 'trousers' ? 0.36 : 0 }));

  const body = new THREE.Group();
  body.position.y = -hang;
  if (spec.type === 'trousers') buildTrousers(spec, body);
  else if (spec.type === 'sweater') buildSweater(spec, body);
  else buildShirtLike(spec, body);
  root.add(body);

  root.userData.spec = spec;
  root.userData.body = body;
  root.userData.hang = hang;
  root.userData.seed = seedOf(spec.id);
  root.userData.length = spec.type === 'trousers' ? spec.params.length + hang : spec.params.length + hang;
  return root;
}
