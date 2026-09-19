// src/Arena.ts
import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';

export function buildArena(scene: Scene): void {
  const mat = MeshBuilder.CreateBox('ringMat', { width: 8, height: 0.6, depth: 8 }, scene);
  mat.position.y = 0.3;
  const matMaterial = new StandardMaterial('ringMatMat', scene);
  matMaterial.diffuseColor = new Color3(0.6, 0.08, 0.08);
  mat.material = matMaterial;

  const ground = MeshBuilder.CreateGround('ground', { width: 30, height: 30 }, scene);
  const groundMaterial = new StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new Color3(0.15, 0.15, 0.18);
  ground.material = groundMaterial;

  const postMaterial = new StandardMaterial('postMat', scene);
  postMaterial.diffuseColor = new Color3(0.9, 0.9, 0.1);
  const corners = [
    new Vector3(4, 1.5, 4), new Vector3(-4, 1.5, 4),
    new Vector3(4, 1.5, -4), new Vector3(-4, 1.5, -4),
  ];
  for (const pos of corners) {
    const post = MeshBuilder.CreateCylinder('post', { height: 3, diameter: 0.25 }, scene);
    post.position = pos;
    post.material = postMaterial;
  }

  const ropeMaterial = new StandardMaterial('ropeMat', scene);
  ropeMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9);
  const ropeHeights = [1.0, 1.5, 2.0];
  const sides: [Vector3, Vector3][] = [
    [new Vector3(-4, 0, 4), new Vector3(4, 0, 4)],
    [new Vector3(-4, 0, -4), new Vector3(4, 0, -4)],
    [new Vector3(4, 0, -4), new Vector3(4, 0, 4)],
    [new Vector3(-4, 0, -4), new Vector3(-4, 0, 4)],
  ];
  for (const h of ropeHeights) {
    for (const [a, b] of sides) {
      const length = Vector3.Distance(a, b);
      const rope = MeshBuilder.CreateBox('rope', { width: length, height: 0.06, depth: 0.06 }, scene);
      rope.position = a.add(b).scale(0.5);
      rope.position.y = h;
      rope.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
      rope.material = ropeMaterial;
    }
  }
}

export function buildReferee(scene: Scene): void {
  const referee = MeshBuilder.CreateCapsule('referee', { height: 1.8, radius: 0.35 }, scene);
  referee.position = new Vector3(0, 0.9, 3);
  const refMat = new StandardMaterial('refMat', scene);
  refMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
  referee.material = refMat;
}
