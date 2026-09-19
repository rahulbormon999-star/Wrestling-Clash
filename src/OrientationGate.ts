// src/OrientationGate.ts
// Browsers only allow orientation-lock after a user gesture + fullscreen
// (a security restriction, not something we can bypass) — so we show a
// "Tap to Start" button; tapping it requests fullscreen + landscape lock
// together. If the browser/OS doesn't support locking (some don't), we
// fall back to just asking the player to rotate their phone.
export function showStartOverlay(onStart: () => void): void {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: '#000', color: 'white',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: '100', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px',
  });
  overlay.innerHTML = `
    <h1 style="font-size:22px;">🤼 Dev-Onix Wrestling</h1>
    <p style="font-size:14px;color:#aaa;">নিচের বাটনে চাপুন — গেম landscape মোডে শুরু হবে</p>
    <button id="start-btn" style="margin-top:16px;padding:14px 32px;font-size:18px;font-weight:bold;
      background:#3b82f6;color:white;border:none;border-radius:10px;">Start Match</button>
  `;
  document.body.appendChild(overlay);

  document.getElementById('start-btn')!.addEventListener('click', async () => {
    try {
      await document.documentElement.requestFullscreen();
      // @ts-ignore — TypeScript's lib doesn't know 'landscape' as a lock type yet
      await (screen.orientation as any).lock('landscape');
    } catch {
      // Not supported on this browser/OS — that's fine, rotate prompt below covers it.
    }
    overlay.remove();
    onStart();
    watchOrientation();
  });
}

function watchOrientation(): void {
  const rotatePrompt = document.createElement('div');
  Object.assign(rotatePrompt.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.95)', color: 'white',
    display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: '99',
    fontSize: '18px', textAlign: 'center', fontFamily: 'sans-serif',
  });
  rotatePrompt.textContent = '📱 ফোনটা কাত করুন (landscape mode)';
  document.body.appendChild(rotatePrompt);

  const check = () => {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    rotatePrompt.style.display = isPortrait ? 'flex' : 'none';
  };
  window.matchMedia('(orientation: portrait)').addEventListener('change', check);
  check();
}
