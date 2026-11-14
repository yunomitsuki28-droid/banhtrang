// Lightweight Web Audio API sound effects for Bánh Tráng Master (no external audio assets needed)

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  tone(freq, duration = 0.08, type = 'triangle', gainVal = 0.08, freqEnd = null) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playPour() {
    this.tone(360, 0.09, 'sine', 0.09, 520);
  }

  playShake() {
    this.tone(180 + Math.random() * 90, 0.045, 'sawtooth', 0.035, 110);
  }

  playRoll() {
    this.tone(240, 0.1, 'triangle', 0.07, 420);
  }

  playSnip(perfect = true) {
    if (perfect) {
      this.tone(880, 0.06, 'triangle', 0.09, 1320);
    } else {
      this.tone(420, 0.07, 'square', 0.05, 300);
    }
  }

  playFan() {
    this.tone(140, 0.08, 'sine', 0.06, 220);
  }

  playRotate() {
    this.tone(520, 0.07, 'triangle', 0.08, 660);
  }

  playSuccess() {
    this.tone(523.25, 0.09, 'triangle', 0.09);
    setTimeout(() => this.tone(659.25, 0.09, 'triangle', 0.09), 75);
    setTimeout(() => this.tone(783.99, 0.16, 'triangle', 0.1), 150);
  }

  playFail() {
    this.tone(240, 0.14, 'sawtooth', 0.09, 120);
    setTimeout(() => this.tone(160, 0.2, 'sawtooth', 0.09, 95), 110);
  }
}

export const sfx = new SoundFX();
