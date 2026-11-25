// All sound is synthesised with WebAudio: no audio files, no network, and the
// game stays silent until the player first interacts (browsers demand that).
export function createAudio() {
  return { context: null, muted: false, sizzleNodes: null };
}

/** Create the AudioContext on first user gesture; safe to call repeatedly. */
export function ensureAudio(audio) {
  if (audio.context) {
    if (audio.context.state === 'suspended') audio.context.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    audio.context = new Ctor();
  } catch {
    audio.context = null;
  }
}

function tone(audio, frequency, duration, type, volume, when = 0) {
  if (!audio.context || audio.muted) return;
  const start = audio.context.currentTime + when;
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.context.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBurst(audio, duration, volume, lowpass) {
  if (!audio.context || audio.muted) return;
  const start = audio.context.currentTime;
  const length = Math.max(1, Math.floor(audio.context.sampleRate * duration));
  const buffer = audio.context.createBuffer(1, length, audio.context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audio.context.createBufferSource();
  source.buffer = buffer;
  const filter = audio.context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = audio.context.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(audio.context.destination);
  source.start(start);
}

export const sfx = {
  pickup(audio) { tone(audio, 520, 0.07, 'triangle', 0.12); },
  place(audio) { tone(audio, 330, 0.07, 'triangle', 0.12); },
  chop(audio) { noiseBurst(audio, 0.06, 0.25, 1800); tone(audio, 180, 0.05, 'square', 0.08); },
  chopDone(audio) { tone(audio, 660, 0.09, 'triangle', 0.14); tone(audio, 880, 0.12, 'triangle', 0.12, 0.07); },
  sizzle(audio) { noiseBurst(audio, 0.25, 0.10, 5000); },
  grillDone(audio) { tone(audio, 740, 0.1, 'sine', 0.14); tone(audio, 990, 0.14, 'sine', 0.12, 0.08); },
  serve(audio) { tone(audio, 523, 0.1, 'triangle', 0.15); tone(audio, 659, 0.1, 'triangle', 0.15, 0.09); tone(audio, 784, 0.18, 'triangle', 0.15, 0.18); },
  wrong(audio) { tone(audio, 160, 0.22, 'sawtooth', 0.10); tone(audio, 120, 0.28, 'sawtooth', 0.08, 0.08); },
  walkout(audio) { tone(audio, 392, 0.15, 'sine', 0.12); tone(audio, 311, 0.25, 'sine', 0.12, 0.12); },
  newOrder(audio) { tone(audio, 880, 0.08, 'sine', 0.10); tone(audio, 1174, 0.12, 'sine', 0.08, 0.07); },
  rush(audio) { tone(audio, 587, 0.12, 'square', 0.08); tone(audio, 587, 0.12, 'square', 0.08, 0.16); tone(audio, 880, 0.2, 'square', 0.08, 0.32); },
  click(audio) { tone(audio, 700, 0.05, 'triangle', 0.10); },
};
