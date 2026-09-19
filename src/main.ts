// src/main.ts
import { Engine, Scene, ArcRotateCamera, HemisphericLight,
         Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { MatchManager } from './MatchManager';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): { scene: Scene; matchManager: MatchManager } {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 12, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;

  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  const floor = MeshBuilder.CreateGround('ring', { width: 10, height: 10 }, scene);
  const floorMat = new StandardMaterial('ringMat', scene);
  floorMat.diffuseColor = new Color3(0.6, 0.1, 0.1);
  floor.material = floorMat;

  const matchManager = new MatchManager(scene);
  return { scene, matchManager };
}

const { scene, matchManager } = createScene();

let lastTime = performance.now();
engine.runRenderLoop(() => {
  const now = performance.now();
  const deltaSeconds = (now - lastTime) / 1000;
  lastTime = now;
  matchManager.update(deltaSeconds);
  scene.render();
});

window.addEventListener('resize', () => engine.resize());
