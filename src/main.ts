// src/main.ts
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from '@babylonjs/core';
import { MatchManager } from './MatchManager';
import { buildArena, buildReferee } from './Arena';
import { showStartOverlay } from './OrientationGate';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): { scene: Scene; matchManager: MatchManager } {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 14, new Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 8;
  camera.upperRadiusLimit = 24;

  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  buildArena(scene);
  buildReferee(scene);

  const matchManager = new MatchManager(scene);
  return { scene, matchManager };
}

const { scene, matchManager } = createScene();

let running = false;
showStartOverlay(() => { running = true; });

let lastTime = performance.now();
engine.runRenderLoop(() => {
  const now = performance.now();
  const deltaSeconds = (now - lastTime) / 1000;
  lastTime = now;
  if (running) matchManager.update(deltaSeconds);
  scene.render();
});

window.addEventListener('resize', () => engine.resize());
