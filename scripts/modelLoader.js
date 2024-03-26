import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
  loader = new GLTFLoader();

  models = {
    pickaxe: undefined,
  };

  loadModels(onLoad) {
    this.loader.load('/models/pickaxe.glb', (gltf) => {
      this.models.pickaxe = gltf.scene;
      onLoad(this.models);
    });
  }
}
