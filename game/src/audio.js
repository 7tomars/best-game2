// Shardlight — procedural sound. Every effect is synthesised with WebAudio when
// it plays: no audio files, no network, nothing to load. The context resumes on
// the first user gesture, as browsers require.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
    return this.muted;
  }

  tone({ freq = 440, type = 'sine', dur = 0.15, gain = 0.5, slide = 0, delay = 0 }) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.2, gain = 0.4, delay = 0, lowpass = 1200 }) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(env).connect(this.master);
    src.start(t0);
  }

  bolt() {
    this.tone({ freq: 880, type: 'square', dur: 0.09, gain: 0.16, slide: -340 });
    this.tone({ freq: 1320, type: 'sine', dur: 0.12, gain: 0.12, slide: -500, delay: 0.02 });
  }

  hit() {
    this.noise({ dur: 0.07, gain: 0.22, lowpass: 2400 });
    this.tone({ freq: 220, type: 'triangle', dur: 0.08, gain: 0.2, slide: -60 });
  }

  shadeDown() {
    this.tone({ freq: 330, type: 'sawtooth', dur: 0.32, gain: 0.16, slide: -240 });
    this.noise({ dur: 0.25, gain: 0.14, lowpass: 900, delay: 0.05 });
  }

  lanternGnaw() {
    this.tone({ freq: 92, type: 'triangle', dur: 0.18, gain: 0.3, slide: -30 });
  }

  hurt() {
    this.tone({ freq: 150, type: 'square', dur: 0.2, gain: 0.28, slide: -70 });
    this.noise({ dur: 0.14, gain: 0.2, lowpass: 700 });
  }

  daybreak() {
    // A sunrise in one chord: low sun swelling into a bright shimmer.
    this.tone({ freq: 130.8, type: 'sine', dur: 1.15, gain: 0.4, slide: 65 });
    this.tone({ freq: 261.6, type: 'triangle', dur: 0.9, gain: 0.3, slide: 130, delay: 0.08 });
    this.tone({ freq: 523.2, type: 'sine', dur: 1.0, gain: 0.26, slide: 260, delay: 0.18 });
    this.tone({ freq: 1046.5, type: 'sine', dur: 1.1, gain: 0.18, delay: 0.3 });
    this.noise({ dur: 0.9, gain: 0.1, lowpass: 5200, delay: 0.15 });
  }

  waveClear() {
    [523.2, 659.2, 783.9].forEach((freq, i) =>
      this.tone({ freq, type: 'sine', dur: 0.34, gain: 0.22, delay: i * 0.11 }));
  }

  waveRise() {
    this.tone({ freq: 196, type: 'sine', dur: 0.5, gain: 0.28, slide: 40 });
  }

  gameOver() {
    this.tone({ freq: 110, type: 'sawtooth', dur: 1.6, gain: 0.3, slide: -55 });
    this.tone({ freq: 55, type: 'sine', dur: 2.1, gain: 0.32, delay: 0.25 });
  }

  victory() {
    [392, 523.2, 659.2, 783.9, 1046.5].forEach((freq, i) =>
      this.tone({ freq, type: 'triangle', dur: 0.5, gain: 0.24, delay: i * 0.14 }));
  }

  uiClick() {
    this.tone({ freq: 660, type: 'sine', dur: 0.06, gain: 0.18 });
  }
}
