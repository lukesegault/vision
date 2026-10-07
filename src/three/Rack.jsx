import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RACK, STEP } from '../data/garments.js';
import { buildGarment } from './builders.js';

export const RING_R = 1.5;
export const RING_Y = 1.95;
const COUNT = RACK.length;
const BASE_SPEED = -0.1; // rad/s, one turn in about a minute

const wrap = (a) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

const metal = new THREE.MeshStandardMaterial({ color: '#171717', metalness: 0.85, roughness: 0.32 });

/* The rotating ring and the garments hanging from it. `ctrl` is a plain
   mutable object shared with the page (drag, buttons, caption). */
export default function Rack({ ctrl, onFront, reduced }) {
  const ring = useRef();
  const garments = useMemo(() => RACK.map(buildGarment), []);
  const spokes = useMemo(() => [0, 1, 2].map((k) => (k * Math.PI * 2) / 3 + STEP / 2), []);

  useFrame((_, delta) => {
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
      <mesh position={[0, 0.015, 0]} material={metal}>
        <cylinderGeometry args={[0.36, 0.38, 0.03, 64]} />
      </mesh>
      <mesh position={[0, (RING_Y + 0.1) / 2, 0]} material={metal}>
        <cylinderGeometry args={[0.016, 0.016, RING_Y + 0.1, 20]} />
      </mesh>

      {/* rotating ring */}
      <group ref={ring} position={[0, RING_Y, 0]}>
        <mesh rotation-x={Math.PI / 2} material={metal}>
          <torusGeometry args={[RING_R, 0.012, 16, 220]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={metal}>
          <cylinderGeometry args={[0.05, 0.05, 0.07, 32]} />
        </mesh>
        {spokes.map((a) => (
          <group key={a} rotation-y={a}>
            <mesh position={[0, 0, RING_R / 2]} rotation-x={Math.PI / 2} material={metal}>
              <cylinderGeometry args={[0.006, 0.006, RING_R, 10]} />
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
