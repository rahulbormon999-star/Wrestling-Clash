// src/TouchControls.ts
import { Fighter } from './Fighter';
import { Joystick } from './Joystick';

const ICONS = {
  punch: `<svg viewBox="0 0 32 32" width="26" height="26"><circle cx="16" cy="19" r="9" fill="white"/><rect x="12" y="4" width="4" height="11" rx="2" fill="white"/><rect x="18" y="6" width="4" height="10" rx="2" fill="white"/><rect x="7" y="9" width="4" height="10" rx="2" fill="white"/></svg>`,
  kick: `<svg viewBox="0 0 32 32" width="26" height="26"><path d="M6 26 L6 14 Q6 8 12 8 L20 8 L20 14 L14 14 L14 20 L26 20 L26 26 Z" fill="white"/></svg>`,
  grab: `<svg viewBox="0 0 32 32" width="26" height="26"><rect x="13" y="14" width="6" height="14" rx="3" fill="white"/><rect x="6" y="10" width="4" height="12" rx="2" fill="white"/><rect x="11" y="6" width="4" height="14" rx="2" fill="white"/><rect x="16" y="6" width="4" height="14" rx="2" fill="white"/><rect x="21" y="9" width="4" height="12" rx="2" fill="white"/></svg>`,
  throw: `<svg viewBox="0 0 32 32" width="26" height="26"><path d="M4 20 Q16 4 28 12" stroke="white" stroke-width="3" fill="none"/><path d="M22 8 L28 12 L24 18" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pin: `<svg viewBox="0 0 32 32" width="26" height="26"><rect x="4" y="22" width="24" height="4" rx="2" fill="white"/><path d="M16 4 L16 18" stroke="white" stroke-width="3"/><path d="M9 12 L16 20 L23 12" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  break: `<svg viewBox="0 0 32 32" width="26" height="26"><path d="M10 4 L14 14 L8 16 L18 28" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export class TouchControls {
  private joystick: Joystick;

  constructor(private player: Fighter) {
    this.joystick = new Joystick();
    this.buildActionButtons();
  }

  get moveVector() {
    return this.joystick.vector;
  }

  private buildActionButtons(): void {
    const actions = [
      { icon: ICONS.punch, label: 'Punch', right: '150px', bottom: '90px', onClick: () => this.player.punch() },
      { icon: ICONS.kick, label: 'Kick', right: '150px', bottom: '20px', onClick: () => this.player.kick() },
      { icon: ICONS.grab, label: 'Grab', right: '80px', bottom: '90px', onClick: () => this.player.grab() },
      { icon: ICONS.throw, label: 'Throw', right: '80px', bottom: '20px', onClick: () => this.player.throwOpponent() },
      { icon: ICONS.pin, label: 'Pin', right: '10px', bottom: '90px', onClick: () => this.player.attemptPin() },
      { icon: ICONS.break, label: 'Break', right: '10px', bottom: '20px', onClick: () => this.player.breakPin() },
    ];
    for (const a of actions) {
      const btn = document.createElement('button');
      btn.innerHTML = a.icon;
      btn.setAttribute('aria-label', a.label);
      Object.assign(btn.style, {
        position: 'fixed', right: a.right, bottom: a.bottom, width: '58px', height: '58px',
        borderRadius: '50%', border: 'none', background: 'rgba(59,130,246,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '10', touchAction: 'none',
      });
      btn.addEventListener('click', a.onClick);
      document.body.appendChild(btn);
    }
  }
}
