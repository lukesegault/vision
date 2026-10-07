import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import Rack, { RING_R } from './Rack.jsx';

const FOV = 28;
const ELEVATION = THREE.MathUtils.degToRad(9);
const TARGET_Y = 1.02;

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
    // let the back of the rack fade into the white page
    scene.fog = new THREE.Fog('#ffffff', d - 0.4, d + RING_R * 2 + 1.2);
  }, [camera, size.width, size.height, scene]);
}

/* A soft, baked contact shadow: a blurred ring under the rack. */
function GroundShadow() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const half = 4.2; // plane is 8.4 m wide
    ctx.filter = 'blur(16px)';
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    ctx.beginPath();
    ctx.arc(256, 256, (RING_R / half) * 256, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.17)';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(256, 256, (RING_R / half) * 256, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.arc(256, 256, (0.38 / half) * 256, 0, Math.PI * 2);
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} renderOrder={-1}>
      <planeGeometry args={[8.4, 8.4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} fog={false} />
    </mesh>
  );
}

export default function Scene({ ctrl, onFront, reduced }) {
  const { gl, scene } = useThree();
  useFit();

  // Development only: window.__vision.cam = { pos: [x, y, z], target: [x, y, z] }
  // lets a test script frame a single garment.
  useFrame(({ camera }) => {
    const cam = import.meta.env.DEV && ctrl.cam;
    if (!cam) return;
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
  });

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9d9de', 0.85]} />
      <directionalLight position={[3.5, 6, 6]} intensity={1.45} color="#fffaf3" />
      <directionalLight position={[-5, 3, 2]} intensity={0.55} color="#eef2ff" />
      <directionalLight position={[0, 4, -6]} intensity={0.5} />
      <GroundShadow />
      <Rack ctrl={ctrl} onFront={onFront} reduced={reduced} />
    </>
  );
}
