import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './three/Scene.jsx';
import { RACK } from './garments.js';

const pad = (n) => String(n).padStart(2, '0');

/* The 3D rack, plus the captions around it. Drag (or swipe) to spin the rack;
   the arrows step to the previous and next piece. */
// A lighter pipeline for phones and small screens: shadows, no post-processing.
const detectQuality = () => {
  if (typeof window === 'undefined') return 'high';
  const q = new URLSearchParams(window.location.search).get('quality');
  if (q === 'low' || q === 'high') return q;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || weak || Math.min(window.innerWidth, window.innerHeight) < 600 ? 'low' : 'high';
};

export default function Stage({ ctrl, front, onFront, onStep, reduced }) {
  const quality = useMemo(detectQuality, []);
  const drag = useRef({ x: 0, t: 0 });
  const piece = RACK[front] ?? RACK[0];

  const onDown = (e) => {
    if (e.target.closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, t: performance.now() };
    ctrl.dragging = true;
    ctrl.snap = null;
  };
  const onMove = (e) => {
    if (!ctrl.dragging) return;
    const now = performance.now();
    const dx = e.clientX - drag.current.x;
    const dt = Math.max(1, now - drag.current.t) / 1000;
    const d = dx * 0.0042;
    ctrl.ang += d;
    ctrl.vel = ctrl.vel * 0.5 + (d / dt) * 0.5;
    drag.current = { x: e.clientX, t: now };
  };
  const onUp = () => {
    if (!ctrl.dragging) return;
    ctrl.dragging = false;
    ctrl.vel = Math.max(-4, Math.min(4, ctrl.vel));
    ctrl.hold = 1.8;
  };

  return (
    <div className="stage-inner" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <Canvas
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        shadows="percentage"
        camera={{ fov: 28, near: 0.1, far: 60 }}
        gl={{ antialias: quality !== 'high', toneMapping: THREE.NoToneMapping }}
        role="img"
        aria-label="A rotating clothing rack with menswear garments, including a woven rose suede overshirt and trousers"
      >
        <Scene ctrl={ctrl} onFront={onFront} reduced={reduced} quality={quality} />
      </Canvas>

      <div className="caps">
        <p className="cap cap-left">Menswear<br />Personal styling</p>
        <div className="cap cap-center" aria-live="off">
          <span className="cap-count">{pad(front + 1)} / {pad(RACK.length)}</span>
          <strong key={piece.id} className="cap-name">{piece.name}</strong>
          <span className="cap-note">{piece.note}</span>
        </div>
        <div className="cap cap-right">
          <button type="button" className="arrow" onClick={() => onStep(-1)} aria-label="Previous piece">
            <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M5 1L1 5l4 4M1 5h14" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
          <button type="button" className="arrow" onClick={() => onStep(1)} aria-label="Next piece">
            <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M11 1l4 4-4 4M15 5H1" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
