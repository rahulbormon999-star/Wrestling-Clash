// src/main.ts
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from '@babylonjs/core';
import { MatchManager } from './MatchManager';
import { buildArena, buildReferee } from './Arena';
import { showStartOverlay } from './OrientationGate';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): { scene: Scene; matchManager: MatchManager; camera: ArcRotateCamera } {
  const scene = new Scene(engine);

  buildArena(scene);
  buildReferee(scene);

  const matchManager = new MatchManager(scene);

  const camera = new ArcRotateCamera(
    'camera', -Math.PI / 2, Math.PI / 2.6, 9, matchManager.fighterA.mesh.position.clone(), scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 14;
  camera.lowerBetaLimit = 0.4;
  camera.upperBetaLimit = Math.PI / 2.2;
  camera.wheelPrecision = 40;
  camera.pinchPrecision = 150;
  camera.panningSensibility = 0;
  camera.minZ = 0.3;

  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  return { scene, matchManager, camera };
}

const { scene, matchManager, camera } = createScene();

let running = false;
showStartOverlay(() => { running = true; });

let lastTime = performance.now();
engine.runRenderLoop(() => {
  const now = performance.now();
  const deltaSeconds = (now - lastTime) / 1000;
  lastTime = now;
  if (running) matchManager.update(deltaSeconds);
  camera.target.copyFrom(matchManager.fighterA.mesh.position);
  scene.render();
});

window.addEventListener('resize', () => engine.resize());
