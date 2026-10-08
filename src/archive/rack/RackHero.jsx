import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { RACK, STEP } from './garments.js';

// The 3D scene is the heavy part, so it loads after the page shell appears.
const Stage = lazy(() => import('./Stage.jsx'));

// If WebGL is unavailable the page still works; a short message replaces the rack.
class StageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <p className="stage-fallback">The 3D rack needs WebGL. Browse the work from the menu above.</p>;
    }
    return this.props.children;
  }
}

const TAU = Math.PI * 2;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/* The archived hero: the rotating 3D clothing rack. Self-contained, so it can
   be brought back by rendering it in place of the textile grid in App.jsx (or
   with ?hero=rack in the address). `inactive` pauses the arrow keys while a
   menu or project sheet is open. */
export default function RackHero({ inactive = false }) {
  // Shared with the 3D scene: angle, velocity and drag state change every
  // frame, so they live in a plain object rather than React state.
  const ctrl = useRef({
    ang: -STEP / 2, // the two rose pieces start side by side at the front
    vel: 0, snap: null, hold: 0, dragging: false, front: -1, paused: false
  }).current;
  if (import.meta.env.DEV) window.__vision = ctrl;

  const reduced = useReducedMotion();
  const [front, setFront] = useState(0);

  const step = useCallback((dir) => {
    const next = (ctrl.front + dir + RACK.length) % RACK.length;
    const target = -next * STEP;
    const k = Math.round((ctrl.ang - target) / TAU);
    ctrl.snap = target + k * TAU;
    ctrl.vel = 0;
  }, [ctrl]);

  // Arrow keys step through the rack when nothing else has focus
  useEffect(() => {
    const onKey = (e) => {
      if (inactive || e.target.closest?.('button, a, input')) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inactive, step]);

  return (
    <StageBoundary>
      <Suspense fallback={null}>
        <Stage ctrl={ctrl} front={front} onFront={setFront} onStep={step} reduced={reduced} />
      </Suspense>
    </StageBoundary>
  );
}
