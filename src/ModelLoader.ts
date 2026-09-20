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
  // Log available clip names once — if idle/walk/attack don't trigger, check
  // this list in the browser console and tell me the exact names so the
  // keyword matching in Fighter.ts can be corrected.
  console.log('Loaded animation groups:', result.animationGroups.map(g => g.name));
  return { root, animationGroups: result.animationGroups };
}
