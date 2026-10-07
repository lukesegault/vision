import * as THREE from 'three';

export const TAU = Math.PI * 2;

const sgnPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const perimeter = (a, b) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/* A cross-section of a garment: a superellipse (n > 2 is boxier) at height y.
   hw / hd are the half width and half depth, cx / cz shift the centre and
   `fold` adds gentle vertical drape. */
export const S = (o) => ({ cx: 0, cz: 0, n: 2.6, fold: 0, phase: 0, ...o });

const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

/* Smoothly resample a short list of control sections into `rows` sections. */
export function sampleSections(controls, rows) {
  const n = controls.length;
  const keys = Object.keys(controls[0]);
  const out = [];
  for (let r = 0; r < rows; r++) {
    const s = (r / (rows - 1)) * (n - 1);
    const i = Math.min(Math.floor(s), n - 2);
    const t = s - i;
    const sec = {};
    for (const k of keys) {
      const p = (j) => controls[Math.max(0, Math.min(n - 1, j))][k];
      sec[k] = catmull(p(i - 1), p(i), p(i + 1), p(i + 2), t);
    }
    out.push(sec);
  }
  return out;
}

/* Z of the front surface at height y, for placing placket and buttons. */
export function frontZ(sections, y) {
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i];
    const b = sections[i + 1];
    if (y <= a.y && y >= b.y) {
      const t = (a.y - y) / (a.y - b.y || 1);
      return (a.cz + a.hd) * (1 - t) + (b.cz + b.hd) * t;
    }
  }
  const last = sections[sections.length - 1];
  return last.cz + last.hd;
}

function gridGeometry(pos, uv, rows, cols) {
  const idx = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// The first and last column are the same line in space; average their
// normals so there is no shading seam.
function weldSeam(g, rows, cols) {
  const n = g.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    const a = i * cols;
    const b = a + cols - 1;
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, v.x, v.y, v.z);
    n.setXYZ(b, v.x, v.y, v.z);
  }
  n.needsUpdate = true;
}

/* Loft a tube-like garment body through a stack of sections (top to bottom).
   The seam sits at the back centre; UVs are in metres, measured from the
   front centre, so fabric textures keep a true scale. */
export function loftSections(sections, { radial = 96, foldFreq = 7 } = {}) {
  const rows = sections.length;
  const cols = radial + 1;
  const pos = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const acc = new Float32Array(cols);
  for (let i = 0; i < rows; i++) {
    const sec = sections[i];
    for (let j = 0; j < cols; j++) {
      const f = j / radial;
      const th = -Math.PI / 2 + f * TAU;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const e = 2 / sec.n;
      const fold = 1 + sec.fold * Math.sin(foldFreq * th + sec.phase + i * 0.35);
      const k = (i * cols + j) * 3;
      pos[k] = sec.cx + sec.hw * sgnPow(c, e) * fold;
      pos[k + 1] = sec.y;
      pos[k + 2] = sec.cz + sec.hd * sgnPow(s, e) * fold;
    }
    // true distance around the section, measured from the front centre, so
    // the fabric keeps its real scale on the flat front as well as the sides
    acc[0] = 0;
    for (let j = 1; j < cols; j++) {
      const a = (i * cols + j - 1) * 3;
      const b = a + 3;
      acc[j] = acc[j - 1] + Math.hypot(pos[b] - pos[a], pos[b + 2] - pos[a + 2]);
    }
    const front = acc[radial >> 1];
    for (let j = 0; j < cols; j++) {
      const q = (i * cols + j) * 2;
      uv[q] = acc[j] - front;
      uv[q + 1] = -sec.y;
    }
  }
  const g = gridGeometry(pos, uv, rows, cols);
  weldSeam(g, rows, cols);
  return g;
}

/* Loft an elliptical tube along a path: sleeves and similar. radii(t) gives
   { rx, rz } for t in 0..1 along the path. */
export function loftCurve(points, radii, { segs = 28, radial = 28, foldAmp = 0.01, foldFreq = 5 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const length = curve.getLength();
  const cols = radial + 1;
  const rows = segs + 1;
  const pos = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const ref = new THREE.Vector3(0, 0, 1);
  const p = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    const t = i / segs;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, T);
    N.crossVectors(ref, T).normalize();
    B.crossVectors(T, N);
    const { rx, rz } = radii(t);
    const per = perimeter(rx, rz);
    for (let j = 0; j < cols; j++) {
      const f = j / radial;
      const th = f * TAU;
      const fold = 1 + foldAmp * Math.sin(foldFreq * th + t * 9);
      const ex = Math.cos(th) * rx * fold;
      const ez = Math.sin(th) * rz * fold;
      const k = (i * cols + j) * 3;
      pos[k] = p.x + N.x * ex + B.x * ez;
      pos[k + 1] = p.y + N.y * ex + B.y * ez;
      pos[k + 2] = p.z + N.z * ex + B.z * ez;
      const q = (i * cols + j) * 2;
      uv[q] = (f - 0.5) * per;
      uv[q + 1] = t * length;
    }
  }
  const g = gridGeometry(pos, uv, rows, cols);
  weldSeam(g, rows, cols);
  return g;
}

/* Interpolated section at height y (clamped to the neck above, hem below). */
function sectionAt(sections, y) {
  const first = sections[0];
  const last = sections[sections.length - 1];
  if (y >= first.y) return first;
  if (y <= last.y) return last;
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i];
    const b = sections[i + 1];
    if (y <= a.y && y >= b.y) {
      const t = (a.y - y) / (a.y - b.y || 1);
      const l = (k) => a[k] * (1 - t) + b[k] * t;
      return { y, hw: l('hw'), hd: l('hd'), cx: l('cx'), cz: l('cz'), n: l('n') };
    }
  }
  return last;
}

// z of the front surface at a given x on a section
function surfaceZ(sec, x) {
  const r = Math.min(0.999, Math.abs(x - sec.cx) / sec.hw);
  return sec.cz + sec.hd * Math.pow(1 - Math.pow(r, sec.n), 1 / sec.n);
}

/* A shirt or jacket collar that lies on the torso surface: a band around the
   neck that rises into a stand at the back and drops into two points at the
   front. Because it follows the body, it sits flat the way a real one does. */
export function collarOnSurface(sections, {
  back = 0.034, point = 0.088, lift = 0.018, spread = 0.26, thick = 0.006, broad = 0.5, radial = 72, rows = 6
} = {}) {
  const cols = radial + 1;
  const pos = new Float32Array((rows + 1) * cols * 3);
  const uv = new Float32Array((rows + 1) * cols * 2);
  const top = sections[0].y;
  for (let i = 0; i <= rows; i++) {
    const w = i / rows;
    for (let j = 0; j < cols; j++) {
      const f = j / radial;
      const th = Math.PI / 2 + spread + f * (TAU - 2 * spread);
      // 0 at the front centre, 1 at the back of the neck
      const d = Math.abs((((th - Math.PI / 2 + Math.PI) % TAU) + TAU) % TAU - Math.PI) / Math.PI;
      const front = 1 - smoothstep(0, broad, d);
      const drop = back + (point - back) * front;
      const y = top + lift * (1 - front * 0.6) - drop * w;
      const sec = sectionAt(sections, y);
      const e = 2 / sec.n;
      const x = sec.cx + sec.hw * sgnPow(Math.cos(th), e);
      const z = sec.cz + sec.hd * sgnPow(Math.sin(th), e);
      // push out along the (approximate) surface normal
      let nx = (x - sec.cx) / (sec.hw * sec.hw);
      let nz = (z - sec.cz) / (sec.hd * sec.hd);
      const hn = Math.hypot(nx, nz) || 1;
      nx /= hn;
      nz /= hn;
      const nl = Math.hypot(nx, 0.5, nz);
      const off = thick * (0.55 + 0.45 * w);
      const k = (i * cols + j) * 3;
      pos[k] = x + (nx / nl) * off;
      pos[k + 1] = y + (0.5 / nl) * off;
      pos[k + 2] = z + (nz / nl) * off;
      const q = (i * cols + j) * 2;
      uv[q] = x;
      uv[q + 1] = -y;
    }
  }
  return gridGeometry(pos, uv, rows + 1, cols);
}

/* A jacket lapel lying on the chest, widest at the collar and tapering to
   the top button. side is -1 (left) or 1 (right). */
export function lapelOnSurface(sections, {
  side, top = -0.02, bottom = -0.32, wideTop = 0.105, wideBottom = 0.03, thick = 0.006, rows = 14, cols = 8
}) {
  const pos = new Float32Array((rows + 1) * (cols + 1) * 3);
  const uv = new Float32Array((rows + 1) * (cols + 1) * 2);
  for (let i = 0; i <= rows; i++) {
    const v = i / rows;
    const y = top + (bottom - top) * v;
    const sec = sectionAt(sections, y);
    const inner = side * 0.004;
    const outer = side * (wideTop + (wideBottom - wideTop) * Math.pow(v, 0.85));
    for (let j = 0; j <= cols; j++) {
      const u = j / cols;
      const x = inner + (outer - inner) * u;
      const lift = thick * (0.5 + 0.7 * u);
      const k = (i * (cols + 1) + j) * 3;
      pos[k] = x;
      pos[k + 1] = y;
      pos[k + 2] = surfaceZ(sec, x) + lift;
      const q = (i * (cols + 1) + j) * 2;
      uv[q] = x;
      uv[q + 1] = -y;
    }
  }
  return gridGeometry(pos, uv, rows + 1, cols + 1);
}

/* A thin strip that follows the front surface (placket, fly). */
export function frontStrip(sections, { x = 0, width = 0.034, yTop, yBottom, lift = 0.0015 }) {
  const rows = 14;
  const pos = new Float32Array(rows * 2 * 3);
  const uv = new Float32Array(rows * 2 * 2);
  for (let i = 0; i < rows; i++) {
    const y = yTop + (yBottom - yTop) * (i / (rows - 1));
    const z = frontZ(sections, y) + lift;
    for (let s = 0; s < 2; s++) {
      const px = x + (s === 0 ? -width / 2 : width / 2);
      const k = (i * 2 + s) * 3;
      pos[k] = px;
      pos[k + 1] = y;
      pos[k + 2] = z;
      const q = (i * 2 + s) * 2;
      uv[q] = px;
      uv[q + 1] = -y;
    }
  }
  return gridGeometry(pos, uv, rows, 2);
}

/* A thin dark line along a row or column of a grid geometry. It stands in for
   the soft shadow a real collar or lapel casts on the garment beneath. */
export function edgeLine(geo, cols, { row = null, col = null, radius = 0.0016 }) {
  const pos = geo.attributes.position;
  const rows = pos.count / cols;
  const pts = [];
  if (row !== null) for (let j = 0; j < cols; j++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, row * cols + j));
  if (col !== null) for (let i = 0; i < rows; i++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i * cols + col));
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, pts.length * 2, radius, 5, false);
}
