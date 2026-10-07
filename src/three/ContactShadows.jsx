import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

/* Soft floor shadows, the way a studio floor under a big overhead softbox
   looks: a depth render of everything above the floor, taken from beneath it,
   then blurred. Shadows are darkest where something is close to the floor and
   fade out with height. Real-time and view independent, so it follows the
   rack as it turns. */
export default function ContactShadows({ size = 7.5, far = 2.8, resolution = 512, blur = 3.4, opacity = 0.62 }) {
  const { gl, scene } = useThree();
  const plane = useRef();

  const rig = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(resolution, resolution);
    rt.texture.generateMipmaps = false;
    const rtBlur = rt.clone();

    const camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, far);
    camera.rotation.x = Math.PI / 2; // look up from the floor

    const depth = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
    depth.depthTest = false;
    depth.depthWrite = false;
    depth.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) );'
      );
    };

    const hBlur = new THREE.ShaderMaterial({ ...HorizontalBlurShader, uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms), depthTest: false });
    const vBlur = new THREE.ShaderMaterial({ ...VerticalBlurShader, uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms), depthTest: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(size, size));
    quad.visible = false;
    quad.position.z = -1;
    camera.add(quad);

    return { rt, rtBlur, camera, depth, hBlur, vBlur, quad };
  }, [resolution, size, far]);

  useEffect(() => () => {
    rig.rt.dispose();
    rig.rtBlur.dispose();
    rig.depth.dispose();
    rig.hBlur.dispose();
    rig.vBlur.dispose();
  }, [rig]);

  const blurPass = (amount) => {
    const { quad, camera, rt, rtBlur, hBlur, vBlur } = rig;
    quad.visible = true;
    quad.material = hBlur;
    hBlur.uniforms.tDiffuse.value = rt.texture;
    hBlur.uniforms.h.value = (amount * 1) / 256;
    gl.setRenderTarget(rtBlur);
    gl.render(quad, camera);
    quad.material = vBlur;
    vBlur.uniforms.tDiffuse.value = rtBlur.texture;
    vBlur.uniforms.v.value = (amount * 1) / 256;
    gl.setRenderTarget(rt);
    gl.render(quad, camera);
    quad.visible = false;
  };

  // Runs before the main render (negative priority).
  useFrame(() => {
    const { rt, camera, depth } = rig;
    const prev = {
      target: gl.getRenderTarget(), bg: scene.background, fog: scene.fog,
      override: scene.overrideMaterial, shadows: gl.shadowMap.enabled, clear: gl.getClearAlpha(), visible: plane.current.visible
    };
    plane.current.visible = false;
    scene.background = null;
    scene.fog = null;
    scene.overrideMaterial = depth;
    gl.shadowMap.enabled = false;
    gl.setClearAlpha(0);
    gl.setRenderTarget(rt);
    gl.clear();
    gl.render(scene, camera);
    scene.overrideMaterial = prev.override;
    blurPass(blur);
    blurPass(blur * 0.4);

    gl.setRenderTarget(prev.target);
    gl.setClearAlpha(prev.clear);
    gl.shadowMap.enabled = prev.shadows;
    scene.background = prev.bg;
    scene.fog = prev.fog;
    plane.current.visible = prev.visible;
  }, -1);

  return (
    <mesh ref={plane} rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} scale-y={-1} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={rig.rt.texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
