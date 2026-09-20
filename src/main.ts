// src/main.ts
import { Engine, Scene, FollowCamera, HemisphericLight, Vector3 } from '@babylonjs/core';
import { MatchManager } from './MatchManager';
import { buildArena, buildReferee } from './Arena';
import { showStartOverlay } from './OrientationGate';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): { scene: Scene; matchManager: MatchManager } {
  const scene = new Scene(engine);

  buildArena(scene);
  buildReferee(scene);

  const matchManager = new MatchManager(scene);

  // Free-Fire-style third-person camera: always follows the PLAYER fighter.
  // Zoom (pinch/wheel) changes `radius`, the distance from that moving
  // target — not from a fixed world point, which is what made zoom feel
  // "stuck in one place" with the old ArcRotateCamera.
  const camera = new FollowCamera('camera', new Vector3(0, 6, -10), scene);
  camera.lockedTarget = matchManager.fighterA.mesh;
  camera.radius = 8;
  camera.heightOffset = 4;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.08;
  camera.maxCameraSpeed = 20;
  camera.lowerRadiusLimit = 4;
  camera.upperRadiusLimit = 18;
  camera.attachControl(canvas, true);

  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

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
