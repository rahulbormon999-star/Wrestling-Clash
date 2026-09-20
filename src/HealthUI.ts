// src/HealthUI.ts
import { Fighter } from './Fighter';

export class HealthUI {
  private playerBarFill: HTMLDivElement;
  private opponentLabel: HTMLDivElement;
  private countLabel: HTMLDivElement;
  private actionLabel: HTMLDivElement;
  private damageLayer: HTMLDivElement;

  constructor(private player: Fighter, private opponent: Fighter) {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', top: '10px', left: '10px', color: 'white',
      fontFamily: '-apple-system, system-ui, sans-serif', zIndex: '10',
      background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '12px',
    });
    container.innerHTML = `
      <div style="font-size:12px;letter-spacing:1px;opacity:0.8;">YOU</div>
      <div style="width:180px;height:14px;background:#222;border-radius:8px;overflow:hidden;margin:4px 0;border:1px solid rgba(255,255,255,0.2);">
        <div id="player-health-fill" style="height:100%;background:linear-gradient(90deg,#22c55e,#4ade80);width:100%;transition:width 0.2s;"></div>
      </div>
      <div id="opponent-label" style="font-size:12px;margin-top:4px;opacity:0.85;">Opponent: Looking strong</div>
    `;
    document.body.appendChild(container);
    this.playerBarFill = container.querySelector('#player-health-fill') as HTMLDivElement;
    this.opponentLabel = container.querySelector('#opponent-label') as HTMLDivElement;

    const titleTag = document.createElement('div');
    Object.assign(titleTag.style, {
      position: 'fixed', top: '10px', right: '10px', color: 'white',
      fontFamily: '-apple-system, system-ui, sans-serif', fontSize: '13px',
      fontWeight: 'bold', letterSpacing: '2px', opacity: '0.6', zIndex: '10',
    });
    titleTag.textContent = 'WRESTLING CLASH';
    document.body.appendChild(titleTag);

    this.countLabel = this.makeCenterLabel('72px', '40%');
    this.actionLabel = this.makeCenterLabel('22px', '65%');

    this.damageLayer = document.createElement('div');
    Object.assign(this.damageLayer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '18' });
    document.body.appendChild(this.damageLayer);
  }

  private makeCenterLabel(fontSize: string, top: string): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', top, left: '50%', transform: 'translate(-50%,-50%)',
      color: 'white', fontSize, fontWeight: 'bold', fontFamily: 'sans-serif',
      textShadow: '0 0 12px black', zIndex: '20', display: 'none',
    });
    document.body.appendChild(el);
    return el;
  }

  showCount(n: number): void {
    this.countLabel.textContent = String(n) + '!';
    this.countLabel.style.display = 'block';
    setTimeout(() => { this.countLabel.style.display = 'none'; }, 500);
  }

  showActionLabel(label: string): void {
    this.actionLabel.textContent = label.toUpperCase();
    this.actionLabel.style.display = 'block';
    setTimeout(() => { this.actionLabel.style.display = 'none'; }, 350);
  }

  showHitTaken(amount: number): void {
    this.spawnFloatingText('-' + amount, '#ef4444', '35%', '30%');
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', inset: '0', background: 'rgba(255,0,0,0.2)', pointerEvents: 'none', zIndex: '15' });
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 150);
  }

  showHitDealt(amount: number): void {
    this.spawnFloatingText('-' + amount, '#facc15', '35%', '70%');
  }

  private spawnFloatingText(text: string, color: string, top: string, left: string): void {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', top, left, transform: 'translate(-50%,0)',
      color, fontSize: '28px', fontWeight: 'bold', fontFamily: 'sans-serif',
      textShadow: '0 0 8px black', zIndex: '19', transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
    });
    el.textContent = text;
    this.damageLayer.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-40px)'; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 650);
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
