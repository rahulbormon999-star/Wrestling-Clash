// src/TouchControls.ts
// On-screen D-pad + action buttons — plain DOM, no extra library needed.
import { Fighter } from './Fighter';

export interface MovementInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

export class TouchControls {
  public input: MovementInput = { forward: false, back: false, left: false, right: false };

  constructor(private player: Fighter) {
    this.buildDPad();
    this.buildActionButtons();
  }

  private buildDPad(): void {
    const positions: { key: keyof MovementInput; label: string; left: string; bottom: string }[] = [
      { key: 'forward', label: '▲', left: '70px', bottom: '90px' },
      { key: 'back', label: '▼', left: '70px', bottom: '20px' },
      { key: 'left', label: '◀', left: '10px', bottom: '55px' },
      { key: 'right', label: '▶', left: '130px', bottom: '55px' },
    ];
    for (const p of positions) {
      const btn = this.makeButton(p.label, { position: 'fixed', left: p.left, bottom: p.bottom, width: '50px', height: '50px' });
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.input[p.key] = true; });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); this.input[p.key] = false; });
      btn.addEventListener('mousedown', () => { this.input[p.key] = true; });
      btn.addEventListener('mouseup', () => { this.input[p.key] = false; });
      document.body.appendChild(btn);
    }
  }

  private buildActionButtons(): void {
    const actions: { label: string; right: string; bottom: string; onClick: () => void }[] = [
       // Action button positions — replace the `actions` array with:
{ label: 'Punch', right: '150px', bottom: '90px', onClick: () => this.player.punch() },
{ label: 'Kick', right: '150px', bottom: '20px', onClick: () => this.player.kick() },
{ label: 'Grab', right: '80px', bottom: '90px', onClick: () => this.player.grab() },
{ label: 'Throw', right: '80px', bottom: '20px', onClick: () => this.player.throwOpponent() },
{ label: 'Pin', right: '10px', bottom: '90px', onClick: () => this.player.attemptPin() },
{ label: 'Break', right: '10px', bottom: '20px', onClick: () => this.player.breakPin() },
    ];
    for (const a of actions) {
      const btn = this.makeButton(a.label, { position: 'fixed', right: a.right, bottom: a.bottom, width: '65px', height: '50px' });
      btn.addEventListener('click', a.onClick);
      document.body.appendChild(btn);
    }
  }

  private makeButton(label: string, style: Partial<CSSStyleDeclaration>): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      borderRadius: '8px', border: 'none', background: 'rgba(59,130,246,0.85)',
      color: 'white', fontWeight: 'bold', fontSize: '14px', zIndex: '10', touchAction: 'none',
    }, style);
    return btn;
  }
}
