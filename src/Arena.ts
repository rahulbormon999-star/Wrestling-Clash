// src/Arena.ts
// Builds a recognizable wrestling ring — elevated mat, 4 corner posts,
// 3 rope lines — entirely from primitives. Not final art, but shaped
// correctly, so it reads as "a ring" instead of a flat colored plane.
import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';

export function buildArena(scene: Scene): void {
  // Elevated ring mat (a real ring sits above ground level)
  const mat = MeshBuilder.CreateBox('ringMat', { width: 8, height: 0.6, depth: 8 }, scene);
  mat.position.y = 0.3;
  const matMaterial = new StandardMaterial('ringMatMat', scene);
  matMaterial.diffuseColor = new Color3(0.6, 0.08, 0.08);
  mat.material = matMaterial;

  // Ground around the ring, so the ring visually sits on something
  const ground = MeshBuilder.CreateGround('ground', { width: 30, height: 30 }, scene);
  const groundMaterial = new StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new Color3(0.15, 0.15, 0.18);
  ground.material = groundMaterial;

  // 4 corner posts
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

  // 3 rope lines between posts (simplified as horizontal boxes on each side)
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
  // Static for now — a real referee_ai.ts driving its position/animations
  // comes when the pin-count/DQ visuals are wired up.
  const referee = MeshBuilder.CreateCapsule('referee', { height: 1.8, radius: 0.35 }, scene);
  referee.position = new Vector3(0, 0.9, 3);
  const refMat = new StandardMaterial('refMat', scene);
  refMat.diffuseColor = new Color3(0.9, 0.9, 0.9); // white/black stripe look, simplified to white for now
  referee.material = refMat;
                                         }
