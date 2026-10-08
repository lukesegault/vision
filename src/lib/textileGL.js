/* A live, touchable photograph.

   Each textile photograph is drawn by a small WebGL shader. At rest it is
   identical to the photo. While the pointer is over it, the shader:

   - relights the fabric from the pointer, using the photograph's own light and
     dark detail as relief, so highlights slide across weaves and folds;
   - adds the behaviours that make each material what it is: sequins and metal
     discs glint, chainmail ripples, shearling drifts and bends under the hand,
     velvet's pile flattens along the stroke.

   The strength of each behaviour is set per tile (`fx` in src/data/textiles.js),
   so leather, metal, fur and velvet each move like themselves. Nothing runs
   unless the pointer is over the tile. */

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTex;
uniform vec4 uCrop;     // visible window of the photo: scale xy, offset zw
uniform vec2 uTexel;    // one texel, in texture units
uniform vec2 uMouse;    // pointer in tile space, y up
uniform vec2 uVel;      // pointer velocity, tile widths per second
uniform float uHover;   // 0 at rest, 1 under the pointer
uniform float uEnergy;  // how lively the pointer has been, 0..1
uniform float uTime;
uniform vec4 uA;        // bump, fold, diffuse, gloss
uniform vec4 uB;        // shine, metal, glitter, glitter cells
uniform vec4 uC;        // glitter threshold, sheen, nap, warp
uniform float uRipple;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float height(vec2 p, float lod) { return luma(textureLod(uTex, p, lod).rgb); }
vec2 gradient(vec2 p, float k, float lod) {
  vec2 e = uTexel * k;
  return vec2(height(p + vec2(e.x, 0.0), lod) - height(p - vec2(e.x, 0.0), lod),
              height(p + vec2(0.0, e.y), lod) - height(p - vec2(0.0, e.y), lod));
}

void main() {
  vec2 uv = vUv;
  float h = uHover;
  vec2 d = uv - uMouse;
  float dist = length(d);

  // ---- movement of the material itself ----
  vec2 disp = vec2(0.0);
  if (uC.w > 0.0) {
    // fibres drift in a slow breeze, and bend the way the hand moves
    vec2 n = vec2(vnoise(uv * 7.0 + uTime * 0.22), vnoise(uv * 7.0 + 17.3 - uTime * 0.18)) - 0.5;
    disp += n * uC.w * 2.0 * h;
    disp += uVel * exp(-dist * dist * 18.0) * uC.w * 0.9;
  }
  if (uRipple > 0.0 && dist > 0.0001) {
    // a heavy, liquid fabric ripples outward from where it is touched
    float ring = sin(dist * 42.0 - uTime * 10.0) * exp(-dist * 5.5);
    disp += (d / dist) * ring * uRipple * 0.007 * uEnergy;
  }

  vec2 tuv = uCrop.zw + clamp(uv + disp, 0.0, 1.0) * uCrop.xy;
  vec3 base = texture(uTex, tuv).rgb;

  // ---- relief from the photograph, lit by the pointer ----
  // smoothed relief: coarser than the photo's noise, so the surface stays clean
  vec2 g = mix(gradient(tuv, 3.0, 1.5), gradient(tuv, 12.0, 3.5), uA.y);
  vec3 N = normalize(vec3(-g * uA.x * 2.6, 1.0));
  vec3 L = normalize(vec3(uMouse, 0.4) - vec3(uv, 0.0));
  vec3 L0 = normalize(vec3(-0.35, 0.45, 0.8));          // where the photo was lit from
  float shade = clamp(dot(N, L) - dot(N, L0), -0.5, 0.5);
  vec3 col = base * (1.0 + uA.z * shade * h * 1.1);

  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float pool = 0.3 + 0.7 * exp(-dist * dist * 5.0);
  float spec = pow(max(dot(N, H), 0.0), uB.x) * uA.w * pool * h * 1.6;
  col += mix(vec3(1.0), clamp(base * 1.8, 0.0, 1.0), uB.y) * spec;

  // ---- glints: sequins, rhinestones, metal discs ----
  if (uB.z > 0.0) {
    float mask = smoothstep(uC.x, 1.0, luma(base));
    float r = hash21(floor(uv * uB.w));
    float tw = pow(max(0.0, sin(r * 6.2831 + dot(L.xy, vec2(23.0, 17.0)))), 14.0);
    col += vec3(1.0) * tw * mask * uB.z * h * (0.25 + 0.75 * exp(-dist * dist * 4.0));
  }

  // ---- velvet: a pool of light and a pile that flattens along the stroke ----
  if (uC.y > 0.0 || uC.z > 0.0) {
    float streak = vnoise(uv * vec2(70.0, 16.0) + 3.1);
    vec3 glow = mix(base, vec3(1.0), 0.55);
    col += glow * uC.y * exp(-dist * dist * 9.0) * (0.55 + 0.9 * streak) * h * 0.35;
    vec2 dir = normalize(uVel + vec2(0.0001));
    float trail = clamp(dot(d, dir) * 5.0, -1.0, 1.0);   // ahead of the hand is lighter, behind is darker
    col *= 1.0 + uC.z * trail * exp(-dist * dist * 10.0) * uEnergy * (0.6 + 0.8 * streak) * 0.5;
  }

  outColor = vec4(col, 1.0);
}`;

export const FX_DEFAULTS = {
  bump: 1.5,        // strength of relief read from the photograph
  fold: 0,          // 0 fine grain, 1 broad folds
  diffuse: 0.4,     // how much the pointer's light changes the shading
  gloss: 0.3,       // strength of highlights
  shine: 30,        // tightness of highlights (higher is sharper)
  metal: 0,         // 0 white highlights, 1 tinted by the fabric
  glitter: 0,       // sparkle on the brightest details
  glitterCells: 60, // size of the sparkles (higher is finer)
  glitterFrom: 0.6, // how bright a detail must be to sparkle
  sheen: 0,         // soft pool of light around the pointer
  nap: 0,           // pile that flattens along the stroke
  warp: 0,          // fibres drifting and bending under the hand
  ripple: 0         // ripples when the fabric is touched
};

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log);
  }
  return s;
}

const parseFocus = (f = '50% 50%') => f.split(/\s+/).map((v) => parseFloat(v) / 100);

/* Returns null if WebGL 2 is unavailable (the plain <img> then stays). */
export function createTextileSurface(canvas, { src, focus, fx, onReady, onFail }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn('Textile shader unavailable, using the plain photograph.', err);
    return null;
  }
  gl.useProgram(prog);

  const u = {};
  ['uTex', 'uCrop', 'uTexel', 'uMouse', 'uVel', 'uHover', 'uEnergy', 'uTime', 'uA', 'uB', 'uC', 'uRipple']
    .forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });

  const p = { ...FX_DEFAULTS, ...fx };
  gl.uniform4f(u.uA, p.bump, p.fold, p.diffuse, p.gloss);
  gl.uniform4f(u.uB, p.shine, p.metal, p.glitter, p.glitterCells);
  gl.uniform4f(u.uC, p.glitterFrom, p.sheen, p.nap, p.warp);
  gl.uniform1f(u.uRipple, p.ripple);
  gl.uniform1i(u.uTex, 0);

  const [fxFocus, fyFocus] = parseFocus(focus);
  const tex = gl.createTexture();
  let img = null;
  let ready = false;
  let disposed = false;

  const s = {
    hover: 0, hoverTarget: 0, energy: 0,
    mouse: [0.5, 0.5], target: [0.5, 0.5], prev: [0.5, 0.5], vel: [0, 0],
    raf: 0, last: 0
  };

  function layout() {
    const w = Math.max(1, canvas.offsetWidth);
    const h = Math.max(1, canvas.offsetHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    gl.viewport(0, 0, cw, ch);
    if (img) {
      // the window of the photograph that a square tile shows (object-fit: cover)
      const a = cw / ch;
      const A = img.naturalWidth / img.naturalHeight;
      const fx2 = A > a ? a / A : 1;
      const fy2 = A > a ? 1 : A / a;
      const offX = (1 - fx2) * fxFocus;
      const offY = (1 - fy2) * fyFocus;
      gl.uniform4f(u.uCrop, fx2, fy2, offX, 1 - offY - fy2);
    }
  }

  function draw(now) {
    if (!ready) return;
    gl.uniform2f(u.uMouse, s.mouse[0], s.mouse[1]);
    gl.uniform2f(u.uVel, s.vel[0], s.vel[1]);
    gl.uniform1f(u.uHover, s.hover);
    gl.uniform1f(u.uEnergy, s.energy);
    gl.uniform1f(u.uTime, ((now ?? performance.now()) / 1000) % 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now) {
    s.raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, (now - s.last) / 1000 || 0.016);
    s.last = now;

    // eased in and out; the long tail gives the same sharp, settled feel as the CSS
    s.hover += (s.hoverTarget - s.hover) * (1 - Math.exp(-dt / (s.hoverTarget ? 0.28 : 0.45)));

    // the pointer's light follows with a little weight, like a hand with mass
    const k = 1 - Math.exp(-dt / 0.07);
    s.mouse[0] += (s.target[0] - s.mouse[0]) * k;
    s.mouse[1] += (s.target[1] - s.mouse[1]) * k;
    const vx = (s.mouse[0] - s.prev[0]) / dt;
    const vy = (s.mouse[1] - s.prev[1]) / dt;
    const kv = 1 - Math.exp(-dt / 0.12);
    s.vel[0] += (vx - s.vel[0]) * kv;
    s.vel[1] += (vy - s.vel[1]) * kv;
    s.prev = [s.mouse[0], s.mouse[1]];
    const speed = Math.hypot(s.vel[0], s.vel[1]);
    s.energy = Math.max(s.energy * Math.exp(-dt / 0.7), Math.min(1, speed * 0.45));

    draw(now);

    if (s.hoverTarget || s.hover > 0.003 || s.energy > 0.003) {
      s.raf = requestAnimationFrame(tick);
    } else {
      s.hover = 0;
      s.energy = 0;
      s.vel = [0, 0];
      draw(now); // settle on the untouched photograph
    }
  }

  const run = () => {
    if (!s.raf && ready && !disposed) {
      s.last = performance.now();
      s.raf = requestAnimationFrame(tick);
    }
  };

  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    s.target = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };

  img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(u.uTexel, 1 / img.naturalWidth, 1 / img.naturalHeight);
    ready = true;
    layout();
    draw();
    onReady?.();
  };
  img.onerror = () => onFail?.();
  img.src = src;

  const ro = new ResizeObserver(() => { layout(); draw(); });
  ro.observe(canvas);

  return {
    enter(e) {
      point(e);
      s.mouse = [...s.target];
      s.prev = [...s.target];
      s.hoverTarget = 1;
      run();
    },
    move(e) {
      point(e);
      run();
    },
    leave() {
      s.hoverTarget = 0;
      run();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
    }
  };
}
