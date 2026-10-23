/** Tiny synthesized sound effects; no audio files needed. */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Browsers only allow audio after a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; delay?: number; vol?: number; slide?: number } = {}): void {
    if (this.muted || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(freq * opts.slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  pick(): void {
    this.tone(520, 0.12, { type: 'triangle', slide: 1.8, vol: 0.25 });
  }
  box(): void {
    this.tone(660, 0.1, { type: 'sine', vol: 0.25 });
    this.tone(990, 0.16, { type: 'sine', delay: 0.05, vol: 0.18 });
  }
  tray(): void {
    this.tone(300, 0.1, { type: 'triangle', slide: 0.8, vol: 0.28 });
  }
  blocked(): void {
    this.tone(180, 0.18, { type: 'square', slide: 0.7, vol: 0.08 });
  }
  complete(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', delay: i * 0.07, vol: 0.22 }));
  }
  open(): void {
    this.tone(400, 0.14, { type: 'sine', slide: 1.5, vol: 0.18 });
  }
  booster(): void {
    [392, 523, 659].forEach((f, i) => this.tone(f, 0.18, { type: 'sine', delay: i * 0.05, vol: 0.2 }));
  }
  click(): void {
    this.tone(800, 0.05, { type: 'sine', vol: 0.12 });
  }
  win(): void {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', delay: i * 0.11, vol: 0.22 }));
  }
  lose(): void {
    [392, 330, 262].forEach((f, i) => this.tone(f, 0.35, { type: 'triangle', delay: i * 0.16, vol: 0.2 }));
  }
}

export const sfx = new Sfx();
