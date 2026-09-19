// src/HealthUI.ts
// Per spec: your own health is exact, opponent's is only a rough visual read.
import { Fighter } from './Fighter';

export class HealthUI {
  private playerBarFill: HTMLDivElement;
  private opponentLabel: HTMLDivElement;

  constructor(private player: Fighter, private opponent: Fighter) {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', top: '16px', left: '16px', color: 'white',
      fontFamily: 'sans-serif', zIndex: '10',
    });
    container.innerHTML = `
      <div style="font-size:14px;">You</div>
      <div style="width:200px;height:16px;background:#333;border-radius:8px;overflow:hidden;margin:4px 0;">
        <div id="player-health-fill" style="height:100%;background:#22c55e;width:100%;"></div>
      </div>
      <div id="opponent-label" style="font-size:13px;margin-top:8px;">Opponent: Looking strong</div>
    `;
    document.body.appendChild(container);
    this.playerBarFill = container.querySelector('#player-health-fill') as HTMLDivElement;
    this.opponentLabel = container.querySelector('#opponent-label') as HTMLDivElement;
  }

  update(): void {
    this.playerBarFill.style.width = Math.max(0, this.player.health) + '%';
    this.opponentLabel.textContent = 'Opponent: ' + this.conditionText(this.opponent.health);
  }

  private conditionText(health: number): string {
    if (health > 70) return 'Looking strong';
    if (health > 40) return 'Getting tired';
    if (health > 10) return 'Badly hurt';
    return 'About to fall';
  }
}
