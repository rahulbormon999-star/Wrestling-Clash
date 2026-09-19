// src/RefereeAI.ts
import { Fighter, FighterState } from './Fighter';

export class RefereeAI {
  private counting = false;
  private pinCountTimer = 0;
  private pinningFighter: Fighter | null = null;
  private pinnedFighter: Fighter | null = null;
  public onMatchWon: ((winner: Fighter) => void) | null = null;
  public onCount: ((n: number) => void) | null = null;

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
  }

  private runCount(deltaSeconds: number): void {
    if (this.pinningFighter!.state !== FighterState.PINNING || this.pinnedFighter!.state !== FighterState.PINNED) {
      this.counting = false;
      return;
    }
    const previousCount = Math.floor(this.pinCountTimer);
    this.pinCountTimer += deltaSeconds;
    const currentCount = Math.floor(this.pinCountTimer);
    if (currentCount > previousCount && currentCount <= 3) this.onCount?.(currentCount);

    if (this.pinCountTimer >= 3) {
      this.counting = false;
      this.onMatchWon?.(this.pinningFighter!);
    }
  }
}
