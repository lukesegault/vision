import * as THREE from 'three';

/* A photographic studio, built from a few emissive panels, used as the
   image-based light. Large softboxes give cloth the soft, wrapped lighting
   and gentle reflections of a real shoot, and there is nothing to download. */
export function studioEnvironment(renderer) {
  const room = new THREE.Scene();

  const white = (v) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(v), side: THREE.DoubleSide });

  // bounce: a large pale room
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(0.62), side: THREE.BackSide }));
  shell.position.y = 6;
  room.add(shell);

  const panel = (w, h, pos, look, v) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), white(v));
    m.position.set(...pos);
    m.lookAt(...look);
    room.add(m);
  };

  panel(9, 9, [0, 10, 1], [0, 0, 0], 7);     // overhead softbox
  panel(3, 9, [-8, 5, 3], [0, 1.5, 0], 5);   // key strip, camera left
  panel(3, 9, [8, 5, 2], [0, 1.5, 0], 2.6);  // fill strip, camera right
  panel(10, 5, [0, 3, 10], [0, 1.5, 0], 1.6); // broad front fill
  panel(2.2, 8, [-5, 5, -9], [0, 1.5, 0], 6); // rim strip, back left
  panel(2.2, 8, [5, 5, -9], [0, 1.5, 0], 4);  // rim strip, back right
  panel(24, 24, [0, -0.01, 0], [0, 5, 0], 0.9); // bright floor bounce

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.025);
  pmrem.dispose();
  room.traverse((o) => {
    if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
  });
  return target.texture;
}
