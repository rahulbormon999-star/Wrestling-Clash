// src/ModelLoader.ts
// Loads a Mixamo-exported, glTF/GLB-converted model. If /models/fighter.glb
// doesn't exist yet, this will throw and MatchManager falls back to the
// placeholder capsule — so it's safe to deploy before the model file exists.
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
