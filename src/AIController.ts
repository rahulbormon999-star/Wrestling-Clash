// src/AIController.ts
import { Fighter, FighterState } from './Fighter';
import { Vector3 } from '@babylonjs/core';

export class AIController {
  private timer = 0;
  private readonly decisionInterval = 1.2;

  constructor(private fighter: Fighter) {}

  update(deltaSeconds: number): void {
    const opponent = this.fighter.opponent;
    if (!opponent || this.fighter.state === FighterState.KO) return;

    this.timer += deltaSeconds;
    if (this.timer >= this.decisionInterval) {
      this.timer = 0;
      this.decide();
    }

    if (this.fighter.state === FighterState.MOVING) {
      const dir = opponent.mesh.position.subtract(this.fighter.mesh.position);
      dir.y = 0;
      if (dir.length() > 0.01) {
        dir.normalize();
        this.fighter.mesh.position.addInPlace(dir.scale(this.fighter.moveSpeed * deltaSeconds));
        this.fighter.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  }

  private decide(): void {
    const fighter = this.fighter;
    const opponent = fighter.opponent!;
    const distance = Vector3.Distance(fighter.mesh.position, opponent.mesh.position);

    if (opponent.state === FighterState.GROUNDED && distance < 1.8) {
      fighter.attemptPin();
      return;
    }
    if (opponent.health < 20 && distance < 1.8) {
      fighter.kick();
      return;
    }
    if (distance > 1.8) {
      fighter.state = FighterState.MOVING;
    } else {
      fighter.state = FighterState.IDLE;
      const roll = Math.random();
      if (roll < 0.4) fighter.punch();
      else if (roll < 0.7) fighter.kick();
      else {
        fighter.grab();
        setTimeout(() => { if (fighter.state === FighterState.GRAPPLING) fighter.throwOpponent(); }, 600);
      }
    }
  }
}
