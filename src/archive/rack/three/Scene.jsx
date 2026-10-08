import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Rack, { RING_R } from './Rack.jsx';
import Effects from './Effects.jsx';
import ContactShadows from './ContactShadows.jsx';
import { studioEnvironment } from './studio.js';

const FOV = 28;
const ELEVATION = THREE.MathUtils.degToRad(9);
const TARGET_Y = 1.02;
const WHITE = new THREE.Color('#ffffff');

/* Fit the whole rack inside a generous margin, whatever the screen shape. */
function useFit() {
  const { camera, size, scene } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const small = size.width < 720;
    // phones: let the ring spill past the edges so the front pieces stay large
    const fracH = small ? 0.62 : 0.68;
    const fracW = small ? 1.3 : 0.64;
    const dH = 2.5 / (fracH * 2 * tan);
    const dW = (RING_R * 2 + 0.9) / (fracW * aspect * 2 * tan);
    const d = Math.max(dH, dW);
    camera.fov = FOV;
    camera.position.set(0, TARGET_Y + d * Math.sin(ELEVATION), d * Math.cos(ELEVATION));
    camera.lookAt(0, TARGET_Y, 0);
    camera.updateProjectionMatrix();
    // let the far side of the rack fade into the white page
    scene.fog = new THREE.Fog(WHITE, d - 0.2, d + RING_R * 2 + 2.5);
  }, [camera, size.width, size.height, scene]);
}

export default function Scene({ ctrl, onFront, reduced, quality }) {
  const { gl, scene } = useThree();
  const high = quality === 'high';
  useFit();

  // Development only: window.__vision.cam = { pos: [x, y, z], target: [x, y, z] }
  // lets a test script frame a single garment.
  useFrame(({ camera }) => {
    const cam = import.meta.env.DEV && ctrl.cam;
    if (!cam) return;
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
  });

  // Several passes render the scene each frame (colour, ambient occlusion,
  // depth of field, floor shadow). Refresh the shadow map once, not per pass.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  useFrame(() => { gl.shadowMap.needsUpdate = true; }, -2);

  useEffect(() => {
    scene.background = WHITE;
    const env = studioEnvironment(gl);
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      {/* key light: casts the soft shadows between garments and onto the floor */}
      <directionalLight
        position={[2.4, 8.5, 4.6]}
        intensity={2.2}
        color="#fff6ea"
        castShadow
        shadow-mapSize={high ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-2.7}
        shadow-camera-right={2.7}
        shadow-camera-top={3.2}
        shadow-camera-bottom={-2.2}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
        shadow-normalBias={0.014}
        shadow-radius={high ? 7 : 4}
      />
      <hemisphereLight args={['#ffffff', '#dcdce2', 0.22]} />
      <directionalLight position={[-3, 3, -6]} intensity={0.55} color="#eef2ff" />

      <ContactShadows />

      <Rack ctrl={ctrl} onFront={onFront} reduced={reduced} />
      {high && <Effects />}
    </>
  );
}
