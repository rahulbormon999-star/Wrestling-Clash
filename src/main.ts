// src/main.ts
// Phase 0: just prove the pipeline works — a 3D box on a floor, camera you
// can orbit with touch. Everything after this (fighters, combat, physics)
// builds on top of this same Engine/Scene setup.
import { Engine, Scene, ArcRotateCamera, HemisphericLight,
         Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): Scene {
  const scene = new Scene(engine);

  // ArcRotateCamera is touch-friendly out of the box — one-finger drag to
  // orbit, pinch to zoom — good default for a mobile-first game.
  const camera = new ArcRotateCamera(
    'camera', -Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene
  );
  camera.attachControl(canvas, true);

  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  // Placeholder "ring" floor — real arena model comes later.
  const floor = MeshBuilder.CreateGround('ring', { width: 10, height: 10 }, scene);
  const floorMat = new StandardMaterial('ringMat', scene);
  floorMat.diffuseColor = new Color3(0.6, 0.1, 0.1);
  floor.material = floorMat;

  // Placeholder fighter — a box, standing in for Fighter capsule/model.
  const fighter = MeshBuilder.CreateBox('fighter', { size: 1.2 }, scene);
  fighter.position.y = 0.6;

  return scene;
}

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});
