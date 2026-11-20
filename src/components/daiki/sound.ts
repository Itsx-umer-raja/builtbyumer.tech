"use client";

/**
 * Web Audio ambient engine ported from the supplied reference:
 * user-gesture gated, low-pass filtered drone with slow breathing,
 * plus small UI blips when enabled. No audio files needed.
 */
export class SoundEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  on = false;
  ambientStarted = false;

  async init() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  async toggle(): Promise<boolean> {
    await this.init();
    if (!this.ctx || !this.master) return this.on;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    if (this.on) {
      this.startAmbient();
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(0.14, t + 1.2);
    } else {
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(0, t + 0.8);
    }
    return this.on;
  }

  private startAmbient() {
    if (this.ambientStarted || !this.ctx || !this.master) return;
    this.ambientStarted = true;
    const ctx = this.ctx;

    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 900;
    filt.Q.value = 0.5;
    filt.connect(this.master);

    // A soft, slowly breathing chord (A minor 9) — pure sines, gentle detune
    const freqs = [110, 164.81, 220, 246.94, 329.63];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 7;

      const g = ctx.createGain();
      g.gain.value = 0.05 / (i * 0.7 + 1);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.02 + i * 0.013;
      const lg = ctx.createGain();
      lg.gain.value = 0.018 / (i * 0.5 + 1);
      lfo.connect(lg).connect(g.gain);
      lfo.start();

      o.connect(g).connect(filt);
      o.start();
    });

    // Soft "air" layer — filtered noise swelling like a distant tide
    const n = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = n.getChannelData(c);
      let l = 0;
      for (let i = 0; i < d.length; i++) {
        l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = l * 3.2;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = n;
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 420;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    const nlfo = ctx.createOscillator();
    nlfo.frequency.value = 0.05;
    const nlg = ctx.createGain();
    nlg.gain.value = 0.035;
    nlfo.connect(nlg).connect(ng.gain);
    nlfo.start();
    noise.connect(nf).connect(ng).connect(filt);
    noise.start();
  }

  blip(freq = 560, dur = 0.16, vol = 0.028) {
    if (!this.on || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
}
