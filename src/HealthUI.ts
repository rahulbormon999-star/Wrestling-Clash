// src/HealthUI.ts
import { Fighter } from './Fighter';

export class HealthUI {
  private playerBarFill: HTMLDivElement;
  private opponentLabel: HTMLDivElement;
  private countLabel: HTMLDivElement;

  constructor(private player: Fighter, private opponent: Fighter) {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', top: '10px', left: '10px', color: 'white',
      fontFamily: 'sans-serif', zIndex: '10',
    });
    container.innerHTML = `
      <div style="font-size:13px;">You</div>
      <div style="width:180px;height:14px;background:#333;border-radius:8px;overflow:hidden;margin:4px 0;">
        <div id="player-health-fill" style="height:100%;background:#22c55e;width:100%;"></div>
      </div>
      <div id="opponent-label" style="font-size:12px;margin-top:4px;">Opponent: Looking strong</div>
    `;
    document.body.appendChild(container);
    this.playerBarFill = container.querySelector('#player-health-fill') as HTMLDivElement;
    this.opponentLabel = container.querySelector('#opponent-label') as HTMLDivElement;

    this.countLabel = document.createElement('div');
    Object.assign(this.countLabel.style, {
      position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
      color: 'white', fontSize: '72px', fontWeight: 'bold', fontFamily: 'sans-serif',
      textShadow: '0 0 12px black', zIndex: '20', display: 'none',
    });
    document.body.appendChild(this.countLabel);
  }

  showCount(n: number): void {
    this.countLabel.textContent = String(n) + '!';
    this.countLabel.style.display = 'block';
    setTimeout(() => { this.countLabel.style.display = 'none'; }, 500);
  }

  flashDamage(): void {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(255,0,0,0.25)',
      pointerEvents: 'none', zIndex: '15',
    });
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 150);
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
