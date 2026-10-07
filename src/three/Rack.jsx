import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RACK, STEP } from '../data/garments.js';
import { buildGarment } from './builders.js';
import { loadGarmentModel } from './models.js';

export const RING_R = 1.5;
export const RING_Y = 1.95;
const COUNT = RACK.length;
const BASE_SPEED = -0.1; // rad/s, one turn in about a minute
const G = 9.8;
const MAX_SWING = 0.2; // radians

const wrap = (a) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const metal = new THREE.MeshStandardMaterial({ color: '#151515', metalness: 0.9, roughness: 0.3 });

/* The rotating ring and the garments hanging from it. `ctrl` is a plain
   mutable object shared with the page (drag, buttons, caption).

   Each garment is a small damped pendulum hung from the rail. When the ring
   speeds up, slows down or is dragged, the pieces swing and settle, and a
   faint breeze keeps them from ever being perfectly still. */
export default function Rack({ ctrl, onFront, reduced }) {
  const ring = useRef();
  const garments = useMemo(() => RACK.map(buildGarment), []);
  const spokes = useMemo(() => [0, 1, 2].map((k) => (k * Math.PI * 2) / 3 + STEP / 2), []);
  const physics = useRef({
    prevAng: null, omega: 0, alpha: 0,
    // swing along the rail (a) and in and out (b), per garment
    items: garments.map((g) => ({ a: 0, va: 0, b: 0, vb: 0, L: 0.34 + g.userData.length * 0.34, seed: g.userData.seed % 97 }))
  }).current;

  if (import.meta.env.DEV) ctrl.phys = physics;

  // Pieces with a `model` (a .glb file in public/) swap in once it has loaded.
  useEffect(() => {
    RACK.forEach((spec, i) => {
      if (!spec.model) return;
      loadGarmentModel(spec, garments[i]).catch((err) => {
        console.warn(`Could not load ${spec.model}; keeping the built-in model.`, err);
      });
    });
  }, [garments]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (ctrl.snap !== null) {
      ctrl.ang += (ctrl.snap - ctrl.ang) * (1 - Math.exp(-5 * dt));
      if (Math.abs(ctrl.snap - ctrl.ang) < 0.0004) {
        ctrl.ang = ctrl.snap;
        ctrl.snap = null;
        ctrl.hold = 2.5;
      }
    } else if (!ctrl.dragging) {
      ctrl.vel *= Math.exp(-2.4 * dt);
      ctrl.ang += ctrl.vel * dt;
      if (ctrl.hold > 0) ctrl.hold -= dt;
      else if (!reduced && !ctrl.paused) ctrl.ang += BASE_SPEED * dt;
    }
    if (ring.current) ring.current.rotation.y = ctrl.ang;

    // angular velocity and acceleration of the ring, lightly smoothed
    if (physics.prevAng !== null && dt > 0) {
      const w = (ctrl.ang - physics.prevAng) / dt;
      const a = (w - physics.omega) / dt;
      physics.alpha += (a - physics.alpha) * 0.35;
      physics.omega = w;
    }
    physics.prevAng = ctrl.ang;

    const t = state.clock.elapsedTime;
    const aTan = clamp(RING_R * physics.alpha, -18, 18);      // m/s^2 along the rail
    const aCen = clamp(RING_R * physics.omega * physics.omega * 0.6, 0, 9); // outward swing
    garments.forEach((g, i) => {
      const s = physics.items[i];
      const damp = 1.7;
      // pendulum: theta'' = -(g/L) theta - c theta' - a/L
      s.va += (-(G / s.L) * s.a - damp * s.va - aTan / s.L * 0.5) * dt;
      s.vb += (-(G / s.L) * s.b - damp * s.vb - aCen / s.L) * dt;
      s.a = clamp(s.a + s.va * dt, -MAX_SWING, MAX_SWING);
      s.b = clamp(s.b + s.vb * dt, -MAX_SWING, MAX_SWING);
      const breeze = reduced ? 0 : 1;
      g.rotation.z = s.a + breeze * 0.0035 * Math.sin(t * 0.55 + s.seed);
      g.rotation.x = s.b + breeze * 0.003 * Math.sin(t * 0.43 + s.seed * 1.7);
    });

    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const d = Math.abs(wrap(i * STEP + ctrl.ang));
      if (d < bd) { bd = d; best = i; }
    }
    if (best !== ctrl.front) {
      ctrl.front = best;
      onFront(best);
    }
  });

  return (
    <group>
      {/* static stand */}
      <mesh position={[0, 0.015, 0]} material={metal} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.38, 0.03, 96]} />
      </mesh>
      <mesh position={[0, 0.035, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.03, 32]} />
      </mesh>
      <mesh position={[0, (RING_Y + 0.1) / 2, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.016, 0.016, RING_Y + 0.1, 24]} />
      </mesh>

      {/* rotating ring */}
      <group ref={ring} position={[0, RING_Y, 0]}>
        <mesh rotation-x={Math.PI / 2} material={metal} castShadow>
          <torusGeometry args={[RING_R, 0.012, 20, 320]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={metal} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.07, 40]} />
        </mesh>
        {spokes.map((a) => (
          <group key={a} rotation-y={a}>
            <mesh position={[0, 0, RING_R / 2]} rotation-x={Math.PI / 2} material={metal} castShadow>
              <cylinderGeometry args={[0.006, 0.006, RING_R, 12]} />
            </mesh>
            {/* collar where the spoke meets the ring */}
            <mesh position={[0, 0, RING_R - 0.02]} rotation-x={Math.PI / 2} material={metal} castShadow>
              <cylinderGeometry args={[0.014, 0.014, 0.04, 16]} />
            </mesh>
          </group>
        ))}
        {garments.map((g, i) => {
          const a = i * STEP;
          return (
            <group key={RACK[i].id} position={[RING_R * Math.sin(a), 0, RING_R * Math.cos(a)]} rotation-y={a}>
              <primitive object={g} />
            </group>
          );
        })}
      </group>
    </group>
  );
}
