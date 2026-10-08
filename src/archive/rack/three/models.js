import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* Optional real garment models.

   Any entry in src/data/garments.js can name a glTF binary in public/, for
   example  model: 'models/overshirt.glb'. Once it loads it replaces the
   built-in garment on the rack. The model is scaled to the entry's
   params.length (so the units it was authored in do not matter), centred on
   the hook and hung from its top edge. Draco-compressed files work too. */

let loader;
function getLoader() {
  if (!loader) {
    loader = new GLTFLoader();
    // decoders ship with Three.js and are fetched only if a model needs them
    loader.setDRACOLoader(new DRACOLoader());
  }
  return loader;
}

export async function loadGarmentModel(spec, root) {
  const gltf = await getLoader().loadAsync(`${import.meta.env.BASE_URL}${spec.model}`);
  const model = gltf.scene;
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) o.material.side = THREE.DoubleSide;
    }
  });

  const holder = new THREE.Group();
  holder.add(model);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const height = spec.modelHeight ?? spec.params.length;
  model.scale.setScalar(height / size.y);

  const box = new THREE.Box3().setFromObject(holder);
  model.position.x -= (box.min.x + box.max.x) / 2;
  model.position.z -= (box.min.z + box.max.z) / 2;
  model.position.y -= box.max.y; // top edge at the origin
  holder.position.y = spec.modelDrop ?? 0;

  const body = root.userData.body;
  body.children.slice().forEach((child) => {
    child.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    body.remove(child);
  });
  body.add(holder);
}
