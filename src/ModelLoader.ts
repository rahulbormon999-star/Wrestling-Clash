// src/ModelLoader.ts
import { Scene, TransformNode, SceneLoader, AnimationGroup } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export interface LoadedCharacter {
  root: TransformNode;
  animationGroups: AnimationGroup[];
}

export async function loadCharacterModel(scene: Scene, url: string): Promise<LoadedCharacter> {
  const result = await SceneLoader.ImportMeshAsync('', '', url, scene);
  const root = new TransformNode('characterRoot', scene);
  for (const mesh of result.meshes) {
    if (!mesh.parent) mesh.parent = root;
  }
  console.log('Loaded animation groups:', result.animationGroups.map(g => g.name));
  return { root, animationGroups: result.animationGroups };
}
