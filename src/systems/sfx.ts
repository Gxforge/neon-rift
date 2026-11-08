/* ============================================================
   SFX sintetizados con WebAudio (sin archivos de audio)
   ============================================================ */
import { Store } from '../config';

type Wave = OscillatorType;

class SfxEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = Store.data.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    Store.data.muted = m;
    Store.save();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  private tone(freq: number, dur: number, wave: Wave = 'square', vol = 0.3,
    slideTo?: number, dest?: AudioNode) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest ?? this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.25, hp = 800) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }

  jump() { this.tone(220, 0.14, 'square', 0.16, 520); }
  dash() { this.noise(0.18, 0.2, 1200); this.tone(700, 0.12, 'sawtooth', 0.1, 200); }
  slash() { this.noise(0.09, 0.16, 2400); this.tone(900, 0.07, 'triangle', 0.1, 300); }
  hit() { this.noise(0.07, 0.2, 900); this.tone(150, 0.08, 'square', 0.14, 70); }
  hurt() { this.tone(160, 0.22, 'sawtooth', 0.22, 60); this.noise(0.12, 0.2, 400); }
  kill() { this.noise(0.16, 0.2, 500); this.tone(300, 0.16, 'square', 0.12, 90); }
  pickup() { this.tone(760, 0.06, 'square', 0.12); this.tone(1140, 0.08, 'square', 0.1); }
  coin() { this.tone(980, 0.05, 'square', 0.08); this.tone(1470, 0.07, 'square', 0.07); }
  heal() { this.tone(520, 0.1, 'sine', 0.16, 780); this.tone(780, 0.14, 'sine', 0.12, 1040); }
  mod() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.14), i * 70)); }
  ui() { this.tone(620, 0.05, 'square', 0.1); }
  portal() { [300, 400, 500, 700, 900].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 'sine', 0.1, f * 1.4), i * 80)); }
  spawn() { this.tone(120, 0.3, 'sawtooth', 0.08, 320); }
  explosion() { this.noise(0.4, 0.32, 180); this.tone(90, 0.35, 'sawtooth', 0.2, 40); }
  bossWarn() { [0, 180, 360].forEach(d => setTimeout(() => this.tone(180, 0.16, 'square', 0.2, 140), d)); }
  victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.16), i * 110)); }
  gameover() { [400, 340, 280, 180].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.14), i * 160)); }

  /* --- musica: arpegio synthwave en loop --- */
  startMusic(root = 110) {
    this.init();
    if (!this.ctx || this.musicTimer !== null) return;
    const seq = [0, 7, 12, 7, 3, 10, 15, 10, 5, 12, 17, 12, 3, 10, 15, 19];
    this.step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || Store.data.muted) return;
      const semi = seq[this.step % seq.length];
      const f = root * Math.pow(2, semi / 12);
      this.tone(f, 0.16, 'triangle', 0.13, undefined, this.musicGain ?? undefined);
      if (this.step % 4 === 0) this.tone(root / 2, 0.22, 'sine', 0.18, undefined, this.musicGain ?? undefined);
      if (this.step % 8 === 0) this.noise(0.05, 0.05, 3000);
      this.step++;
    }, 165);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const Sfx = new SfxEngine();
