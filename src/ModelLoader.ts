// src/ModelLoader.ts
// Loads a Mixamo-exported, glTF/GLB-converted model and returns its root
// node so a Fighter can attach it. Mixamo models come out at roughly
// centimeter scale — 0.01 gets them close to Babylon's ~1-unit-per-meter
// world; nudge this per-model if a character looks too big/small in the ring.
import { Scene, TransformNode, SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export async function loadCharacterModel(scene: Scene, url: string): Promise<TransformNode> {
  const result = await SceneLoader.ImportMeshAsync('', '', url, scene);
  const root = new TransformNode('characterRoot', scene);
  for (const mesh of result.meshes) {
    if (!mesh.parent) mesh.parent = root;
  }
  return root;
}
