/**
 * UNLOCK 2026 — Sound System (Web Audio API)
 * Synthesized sounds — no external files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch { /* silent fail */ }
}

export const SFX = {
  correct() {
    beep(523, 0.1, 'sine', 0.12);
    setTimeout(() => beep(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => beep(784, 0.15, 'sine', 0.12), 160);
  },
  wrong() {
    beep(200, 0.15, 'sawtooth', 0.1);
    setTimeout(() => beep(150, 0.2, 'sawtooth', 0.1), 120);
  },
  combo() {
    beep(880, 0.08, 'sine', 0.1);
    setTimeout(() => beep(1047, 0.08, 'sine', 0.1), 60);
    setTimeout(() => beep(1319, 0.12, 'sine', 0.12), 120);
  },
  milestone() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => beep(f, 0.15, 'sine', 0.12), i * 100)
    );
  },
  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => beep(f, 0.2, 'triangle', 0.12), i * 120)
    );
  },
  gameover() {
    [400, 350, 300, 250].forEach((f, i) =>
      setTimeout(() => beep(f, 0.25, 'sawtooth', 0.08), i * 150)
    );
  },
  tick() { beep(600, 0.03, 'sine', 0.06); },
  match() { beep(700, 0.08, 'sine', 0.1); setTimeout(() => beep(900, 0.12, 'sine', 0.1), 80); },
  place() { beep(500, 0.05, 'sine', 0.08); },
  levelUp() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      setTimeout(() => beep(f, 0.2, 'sine', 0.15), i * 100)
    );
  },
};
