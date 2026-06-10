// Sonnerie d'alerte synthétique (Web Audio API) — pas besoin de fichier audio.
// - warning : double bip court (ton doux)
// - critical : sirène alternée plus longue

let ctxRef: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctxRef) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    ctxRef = new AC();
  }
  return ctxRef;
}

function beep(freq: number, durationMs: number, when = 0, volume = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.linearRampToValueAtTime(0, t0 + durationMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.05);
}

export function playWarning() {
  beep(660, 180, 0);
  beep(660, 180, 0.25);
}

export function playCritical() {
  // Sirène : 4 alternances haut/bas
  for (let i = 0; i < 4; i++) {
    beep(880, 260, i * 0.6, 0.22);
    beep(523, 260, i * 0.6 + 0.3, 0.22);
  }
}

/** Réveille le contexte audio après une interaction utilisateur (politique navigateur). */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}
