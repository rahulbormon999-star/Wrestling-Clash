// src/MatchManager.ts
import { Scene, Vector3, Color3 } from '@babylonjs/core';
import { Fighter } from './Fighter';
import { AIController } from './AIController';
import { RefereeAI } from './RefereeAI';
import { HealthUI } from './HealthUI';
import { TouchControls } from './TouchControls';
import { loadCharacterModel } from './ModelLoader';

export class MatchManager {
  public fighterA: Fighter;
  public fighterB: Fighter;
  private aiController: AIController;
  private referee: RefereeAI;
  private healthUI: HealthUI;
  private controls: TouchControls;
  private matchOver = false;

  constructor(private scene: Scene) {
    this.fighterA = new Fighter('player', scene, new Vector3(-2, 0.9, 0), new Color3(0.8, 0.2, 0.2), true);
    this.fighterB = new Fighter('ai', scene, new Vector3(2, 0.9, 0), new Color3(0.2, 0.4, 0.9), false);
    this.fighterA.opponent = this.fighterB;
    this.fighterB.opponent = this.fighterA;

    this.aiController = new AIController(this.fighterB);

    this.referee = new RefereeAI(this.fighterA, this.fighterB);
    this.referee.onMatchWon = (winner) => this.onMatchWon(winner);
    this.healthUI = new HealthUI(this.fighterA, this.fighterB);
    this.referee.onCount = (n) => this.healthUI.showCount(n);

    this.controls = new TouchControls(this.fighterA, (label) => this.healthUI.showActionLabel(label));

    this.fighterA.onHit = (amount) => this.healthUI.showHitTaken(amount);
    this.fighterB.onHit = (amount) => this.healthUI.showHitDealt(amount);

    this.attachModels();
  }

  private async attachModels(): Promise<void> {
    try {
      const player = await loadCharacterModel(this.scene, '/models/fighter.glb');
      this.fighterA.setVisualModel(player.root, player.animationGroups, 1);
    } catch (e) {
      console.warn('Player model failed to load, using placeholder rig', e);
    }
    try {
      const ai = await loadCharacterModel(this.scene, '/models/fighter.glb');
      this.fighterB.setVisualModel(ai.root, ai.animationGroups, 1);
    } catch (e) {
      console.warn('AI model failed to load, using placeholder rig', e);
    }
  }

  update(deltaSeconds: number): void {
    if (this.matchOver) return;
    this.fighterA.update(deltaSeconds, this.controls.moveVector);
    this.fighterB.update(deltaSeconds);
    this.aiController.update(deltaSeconds);
    this.referee.update(deltaSeconds);
    this.healthUI.update();
  }

  private onMatchWon(winner: Fighter): void {
    this.matchOver = true;
    alert('Match Over! Winner: ' + (winner === this.fighterA ? 'You' : 'AI Opponent'));
  }
}
