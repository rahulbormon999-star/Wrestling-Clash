// src/RefereeAI.ts
// The "AI Referee" from the spec: neutral, rule-following pin counting.
// A human_referee.ts later can call the same onMatchWon callback from a
// second player's input — MatchManager won't need to care which is active.
import { Fighter, FighterState } from './Fighter';

export class RefereeAI {
  private counting = false;
  private pinCountTimer = 0;
  private pinningFighter: Fighter | null = null;
  private pinnedFighter: Fighter | null = null;
  public onMatchWon: ((winner: Fighter) => void) | null = null;

  constructor(private fighterA: Fighter, private fighterB: Fighter) {}

  update(deltaSeconds: number): void {
    this.checkForPin();
    if (this.counting) this.runCount(deltaSeconds);
  }

  private checkForPin(): void {
    if (this.counting) return;
    if (this.fighterA.state === FighterState.PINNING && this.fighterB.state === FighterState.PINNED) {
      this.startCount(this.fighterA, this.fighterB);
    } else if (this.fighterB.state === FighterState.PINNING && this.fighterA.state === FighterState.PINNED) {
      this.startCount(this.fighterB, this.fighterA);
    }
  }

  private startCount(pinning: Fighter, pinned: Fighter): void {
    this.counting = true;
    this.pinCountTimer = 0;
    this.pinningFighter = pinning;
    this.pinnedFighter = pinned;
    console.log('Referee: pin detected, starting count');
  }

  private runCount(deltaSeconds: number): void {
    if (this.pinningFighter!.state !== FighterState.PINNING || this.pinnedFighter!.state !== FighterState.PINNED) {
      this.counting = false;
      console.log('Referee: pin broken, count stopped');
      return;
    }
    const previousCount = Math.floor(this.pinCountTimer);
    this.pinCountTimer += deltaSeconds;
    const currentCount = Math.floor(this.pinCountTimer);
    if (currentCount > previousCount && currentCount <= 3) console.log('Referee:', currentCount, '!');

    if (this.pinCountTimer >= 3) {
      this.counting = false;
      console.log('Referee: THREE! Match over.');
      this.onMatchWon?.(this.pinningFighter!);
    }
  }
}
