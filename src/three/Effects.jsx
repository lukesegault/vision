import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RING_R } from './Rack.jsx';

const FOCUS_POINT = new THREE.Vector3(0, 1.25, RING_R);

/* The "camera": multisampled render, ambient occlusion in the folds and
   under collars and sleeves, and a gentle depth of field that keeps the front
   of the rack sharp and softens the far side. */
export default function Effects({ depthOfField = true }) {
  const { gl, scene, camera, size } = useThree();

  const { composer, bokeh } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    composer.addPass(new RenderPass(scene, camera));

    const ao = new GTAOPass(scene, camera, size.width, size.height);
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = 1;
    ao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.6, thickness: 1.5, scale: 1.1, samples: 14, distanceFallOff: 1 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 7, radiusExponent: 1, rings: 2, samples: 16 });
    ao.normalMaterial.side = THREE.DoubleSide;
    composer.addPass(ao);

    let bokeh = null;
    if (depthOfField) {
      bokeh = new BokehPass(scene, camera, { focus: 8, aperture: 0.00008, maxblur: 0.007 });
      bokeh._materialDepth.side = THREE.DoubleSide;
      composer.addPass(bokeh);
    }

    composer.addPass(new OutputPass());
    return { composer, bokeh };
  }, [gl, scene, camera, depthOfField]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  // Priority 1 takes over rendering from R3F's default loop.
  useFrame(() => {
    if (bokeh) bokeh.uniforms.focus.value = camera.position.distanceTo(FOCUS_POINT);
    composer.render();
  }, 1);

  return null;
}
