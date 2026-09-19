// src/Joystick.ts
// A round virtual joystick (Free Fire style): drag the knob away from
// center, direction + distance become an analog movement vector.
export class Joystick {
  public vector = { x: 0, y: 0 }; // x: -1(left)..1(right), y: -1(back)..1(forward)

  private base: HTMLDivElement;
  private knob: HTMLDivElement;
  private radius = 40;
  private activeTouchId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private mouseDown = false;

  constructor() {
    this.base = document.createElement('div');
    Object.assign(this.base.style, {
      position: 'fixed', left: '20px', bottom: '20px', width: '100px', height: '100px',
      borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
      border: '2px solid rgba(255,255,255,0.3)', zIndex: '10', touchAction: 'none',
    });
    document.body.appendChild(this.base);

    this.knob = document.createElement('div');
    Object.assign(this.knob.style, {
      position: 'absolute', left: '25px', top: '25px', width: '50px', height: '50px',
      borderRadius: '50%', background: 'rgba(59,130,246,0.9)',
    });
    this.base.appendChild(this.knob);

    this.base.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.base.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.base.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.base.addEventListener('mousedown', (e) => this.onMouseStart(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseEnd());
  }

  private getCenter(): void {
    const rect = this.base.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.getCenter();
    this.activeTouchId = e.changedTouches[0].identifier;
    this.updateFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.activeTouchId) this.updateFromPoint(t.clientX, t.clientY);
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.activeTouchId) {
        this.activeTouchId = null;
        this.reset();
      }
    }
  }

  private onMouseStart(e: MouseEvent): void {
    this.getCenter();
    this.mouseDown = true;
    this.updateFromPoint(e.clientX, e.clientY);
  }
  private onMouseMove(e: MouseEvent): void {
    if (this.mouseDown) this.updateFromPoint(e.clientX, e.clientY);
  }
  private onMouseEnd(): void {
    if (this.mouseDown) { this.mouseDown = false; this.reset(); }
  }

  private updateFromPoint(clientX: number, clientY: number): void {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), this.radius);
    const angle = Math.atan2(dy, dx);
    const cx = Math.cos(angle) * dist;
    const cy = Math.sin(angle) * dist;

    this.knob.style.left = 25 + cx + 'px';
    this.knob.style.top = 25 + cy + 'px';

    this.vector.x = cx / this.radius;
    this.vector.y = -cy / this.radius; // dragging up = forward
  }

  private reset(): void {
    this.knob.style.left = '25px';
    this.knob.style.top = '25px';
    this.vector.x = 0;
    this.vector.y = 0;
  }
}
