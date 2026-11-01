/** Quiet sine envelopes: no sharp transients or overlapping completion melody. */
let audioCtx: AudioContext | null = null;
let lastTap = 0;
let activeVoice: OscillatorNode | null = null;
function tone(completed: boolean) {
  try {
    const now = performance.now();
    if (now - lastTap < 65) return;
    lastTap = now;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime;
    if (activeVoice) { try { activeVoice.stop(start); } catch {} }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 650;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(completed ? 392 : 260, start);
    osc.frequency.exponentialRampToValueAtTime(completed ? 330 : 205, start + .12);
    const duration = completed ? .38 : .16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(completed ? .045 : .028, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    activeVoice = osc;
    osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); if (activeVoice === osc) activeVoice = null; };
    osc.start(start); osc.stop(start + duration + .02);
  } catch { /* Sound is optional. */ }
}
export function playBeadClick() { tone(false); }
export function playCompletionChime() { tone(true); }
export function triggerHaptic(duration = 12) {
  if ('vibrate' in navigator) { try { navigator.vibrate(Math.min(duration, 20)); } catch {} }
}
