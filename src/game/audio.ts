export type BgmMode = 'NONE' | 'CHILL_LOFI' | 'CHAOTIC_RAID';

export class GameAudio {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastSirenStep: number = -1;

  // Dynamic background music loop state
  private bgmGain: GainNode | null = null;
  private bgmNoiseBuffer: AudioBuffer | null = null;
  private bgmMode: BgmMode = 'NONE';
  private bgmStep: number = 0;
  private bgmNextTime: number = 0;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncBgmGain(0);
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.syncBgmGain(0);
    return this.muted;
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.ensureBgmBus();
  }

  private ensureBgmBus(): GainNode | null {
    if (!this.ctx) return null;
    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0;
      this.bgmGain.connect(this.ctx.destination);
    }
    if (!this.bgmNoiseBuffer) {
      const len = Math.floor(this.ctx.sampleRate * 0.25);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.bgmNoiseBuffer = buf;
    }
    return this.bgmGain;
  }

  private syncBgmGain(target: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    const effective = this.muted ? 0 : target;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setTargetAtTime(effective, now, 0.08);
  }

  public stopBgm(): void {
    this.bgmMode = 'NONE';
    this.syncBgmGain(0);
  }

  public updateBgm(mode: BgmMode, ducked = false): void {
    if (this.muted || mode === 'NONE') {
      if (this.bgmMode !== 'NONE') {
        this.bgmMode = 'NONE';
      }
      this.syncBgmGain(0);
      return;
    }

    if (!this.ctx || this.ctx.state === 'suspended') {
      return;
    }
    const bus = this.ensureBgmBus();
    if (!bus) return;

    const now = this.ctx.currentTime;
    if (mode !== this.bgmMode) {
      this.bgmMode = mode;
      this.bgmStep = 0;
      this.bgmNextTime = now + 0.03;
    }

    const baseVol = mode === 'CHAOTIC_RAID' ? 0.25 : 0.22;
    this.syncBgmGain(ducked ? baseVol * 0.52 : baseVol);

    if (this.bgmNextTime < now - 0.15) {
      this.bgmNextTime = now + 0.02;
    }

    const lookahead = 0.14;
    while (this.bgmNextTime < now + lookahead) {
      if (this.bgmMode === 'CHILL_LOFI') {
        this.scheduleChillLofiStep(this.ctx, bus, this.bgmStep, this.bgmNextTime);
        // 76 BPM -> 16th note = 60 / 76 / 4 ≈ 0.197s, with subtle lo-fi swing on odd 16ths
        const baseStep = 60 / 76 / 4;
        const swingOffset = this.bgmStep % 2 === 0 ? 0.022 : -0.022;
        this.bgmNextTime += baseStep + swingOffset;
        this.bgmStep = (this.bgmStep + 1) % 64;
      } else {
        this.scheduleChaoticRaidStep(this.ctx, bus, this.bgmStep, this.bgmNextTime);
        // 164 BPM -> 16th note = 60 / 164 / 4 ≈ 0.091s driving breakbeat energy
        this.bgmNextTime += 60 / 164 / 4;
        this.bgmStep = (this.bgmStep + 1) % 32;
      }
    }
  }

  private scheduleChillLofiStep(
    ctx: AudioContext,
    bus: GainNode,
    step: number,
    time: number
  ): void {
    // 4-bar lo-fi jazz progression (16 steps per bar = 64 steps): Dm9 -> G13 -> Cmaj9 -> A7alt
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    const chords: number[][] = [
      [146.83, 261.63, 329.63, 349.23, 440.0], // Dm9 (D3 C4 E4 F4 A4)
      [196.0, 293.66, 329.63, 349.23, 440.0], // G13 (G3 D4 E4 F4 A4)
      [130.81, 246.94, 293.66, 329.63, 392.0], // Cmaj9 (C3 B3 D4 E4 G4)
      [110.0, 261.63, 311.13, 392.0, 466.16], // A7alt (A2 C4 Eb4 G4 Bb4)
    ];

    // Warm Rhodes-style electric piano chords on beat 1 (and soft anticipation on step 14)
    if (stepInBar === 0 || stepInBar === 14) {
      const chord = stepInBar === 14 ? chords[(bar + 1) % 4] : chords[bar];
      const dur = stepInBar === 0 ? 2.4 : 0.42;
      const amp = stepInBar === 0 ? 0.065 : 0.032;
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        // Subtle lo-fi tape pitch warmth
        osc.detune.setValueAtTime((Math.sin(step + i) * 6), time);
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1150, time);
        filter.frequency.exponentialRampToValueAtTime(520, time + dur);
        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime(i === 0 ? amp * 1.3 : amp, time + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(filter);
        filter.connect(g);
        g.connect(bus);
        osc.start(time);
        osc.stop(time + dur + 0.03);
      });
    }

    // Gentle Vietnamese/Lo-fi pentatonic street melody plucks
    const melodyMap: Record<number, number> = {
      2: 587.33, // D5
      6: 659.25, // E5
      10: 523.25, // C5
      18: 659.25, // E5
      22: 783.99, // G5
      27: 659.25, // E5
      34: 587.33, // D5
      38: 523.25, // C5
      42: 440.0, // A4
      50: 523.25, // C5
      54: 587.33, // D5
      59: 440.0, // A4
    };
    const melFreq = melodyMap[step];
    if (melFreq) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(melFreq, time);
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.055, time + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
      osc.connect(g);
      g.connect(bus);
      osc.start(time);
      osc.stop(time + 0.45);
    }

    // Soft lo-fi kick on 0, 7, 10
    if (stepInBar === 0 || stepInBar === 7 || stepInBar === 10) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(112, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.14);
      g.gain.setValueAtTime(stepInBar === 0 ? 0.24 : 0.16, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(g);
      g.connect(bus);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    // Brushed lo-fi snare on beats 2 & 4 (step 4 & 12)
    if ((stepInBar === 4 || stepInBar === 12) && this.bgmNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.bgmNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1650;
      filter.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      src.connect(filter);
      filter.connect(g);
      g.connect(bus);
      src.start(time);
      src.stop(time + 0.12);
    }

    // Swung eighth-note soft hi-hat
    if (stepInBar % 2 === 0 && this.bgmNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.bgmNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6200;
      const g = ctx.createGain();
      const vel = stepInBar % 4 === 0 ? 0.036 : 0.022;
      g.gain.setValueAtTime(vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
      src.connect(filter);
      filter.connect(g);
      g.connect(bus);
      src.start(time);
      src.stop(time + 0.04);
    }
  }

  private scheduleChaoticRaidStep(
    ctx: AudioContext,
    bus: GainNode,
    step: number,
    time: number
  ): void {
    // 2-bar high-tempo chaotic street chase loop (164 BPM, 32 16th-note steps)
    const stepInBar = step % 16;

    // Driving Phrygian/minor street chase bassline (D2, Eb2, F2, G2, Ab2)
    const bassPattern = [
      73.42, 0, 73.42, 87.31, 73.42, 0, 98.0, 103.83,
      73.42, 0, 73.42, 77.78, 87.31, 98.0, 103.83, 110.0,
    ];
    const bassFreq = bassPattern[stepInBar];
    if (bassFreq > 0) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(640, time);
      filter.frequency.exponentialRampToValueAtTime(240, time + 0.085);
      g.gain.setValueAtTime(0.16, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      osc.connect(filter);
      filter.connect(g);
      g.connect(bus);
      osc.start(time);
      osc.stop(time + 0.095);
    }

    // Chaotic street horn / siren stabs on urgent off-beats
    const stabSteps: Record<number, number[]> = {
      0: [293.66, 440.0, 587.33],
      6: [311.13, 466.16, 622.25],
      10: [293.66, 415.3, 587.33],
      14: [349.23, 523.25, 698.46],
      18: [293.66, 440.0],
      22: [311.13, 466.16],
      26: [349.23, 523.25],
      30: [415.3, 622.25],
    };
    const stab = stabSteps[step];
    if (stab) {
      stab.forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.96, time + 0.075);
        filter.type = 'bandpass';
        filter.frequency.value = 1350;
        filter.Q.value = 1.4;
        g.gain.setValueAtTime(0.048, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(filter);
        filter.connect(g);
        g.connect(bus);
        osc.start(time);
        osc.stop(time + 0.085);
      });
    }

    // Punchy breakbeat kick (steps 0, 3, 8, 10, 14)
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 10 || (step >= 16 && stepInBar === 14)) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(44, time + 0.085);
      g.gain.setValueAtTime(0.28, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(g);
      g.connect(bus);
      osc.start(time);
      osc.stop(time + 0.11);
    }

    // Sharp snapping snare + chaotic turnaround fills
    const isSnare = stepInBar === 4 || stepInBar === 12 || (step >= 28 && step % 2 === 0);
    if (isSnare && this.bgmNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.bgmNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2100;
      filter.Q.value = 0.85;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.14, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.085);
      src.connect(filter);
      filter.connect(g);
      g.connect(bus);
      src.start(time);
      src.stop(time + 0.09);
    }

    // Rapid 16th-note frantic hi-hat drive
    if (this.bgmNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.bgmNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(step % 2 === 0 ? 0.055 : 0.028, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.028);
      src.connect(filter);
      filter.connect(g);
      g.connect(bus);
      src.start(time);
      src.stop(time + 0.032);
    }
  }

  private getCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      this.unlock();
    }
    if (!this.ctx || this.ctx.state === 'suspended') {
      return null;
    }
    return this.ctx;
  }

  public playSlice(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playRollTick(progress: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240 + progress * 3.2, now);
    osc.frequency.exponentialRampToValueAtTime(160 + progress * 2.5, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDropTopping(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.07);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playSqueezeTick(percent: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 + percent * 4.5, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSeasonResult(isGood: boolean): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (isGood) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.06);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    }
  }

  public playShake(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 600;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playServeSuccess(accuracy: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = accuracy >= 0.8 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playServeFail(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [330, 293.66, 246.94, 196];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  public playSirenPulse(elapsed: number): void {
    const step = Math.floor(elapsed * 4);
    if (step === this.lastSirenStep) return;
    this.lastSirenStep = step;

    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const high = step % 2 === 0;
    osc.frequency.setValueAtTime(high ? 820 : 580, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playChairBreak(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPickup(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playRaidWin(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  public playBillSnap(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
    oscGain.gain.setValueAtTime(0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playCashChing(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1) Mechanical register drawer thud
    const drawerOsc = ctx.createOscillator();
    const drawerGain = ctx.createGain();
    drawerOsc.type = 'triangle';
    drawerOsc.frequency.setValueAtTime(210, now);
    drawerOsc.frequency.exponentialRampToValueAtTime(85, now + 0.065);
    drawerGain.gain.setValueAtTime(0.2, now);
    drawerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    drawerOsc.connect(drawerGain);
    drawerGain.connect(ctx.destination);
    drawerOsc.start(now);
    drawerOsc.stop(now + 0.08);

    // 2) Crisp metallic "CHING!" bell harmonics (double shimmer)
    const bellNotes = [
      { freq: 1567.98, delay: 0.04, dur: 0.24, vol: 0.16 }, // G6
      { freq: 2093.0, delay: 0.085, dur: 0.48, vol: 0.22 }, // C7
      { freq: 3135.96, delay: 0.085, dur: 0.42, vol: 0.12 }, // G7
      { freq: 4186.01, delay: 0.09, dur: 0.34, vol: 0.07 }, // C8
    ];

    bellNotes.forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + delay;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }

  public playScissorSnip(accent = false): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crisp metallic scissor "snip!" blade snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(accent ? 2150 : 1720, now);
    osc.frequency.exponentialRampToValueAtTime(accent ? 980 : 760, now + 0.05);

    gain.gain.setValueAtTime(accent ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    const bufSize = Math.floor(ctx.sampleRate * 0.025);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(accent ? 0.11 : 0.07, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  public playRhythmHit(perfect: boolean): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = perfect ? [880, 1318.5] : [659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.03;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(perfect ? 0.14 : 0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playParryClash(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    [1046.5, 1567.98, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'square' : 'triangle';
      const t = now + idx * 0.02;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.28, t + 0.18);
      gain.gain.setValueAtTime(idx === 0 ? 0.12 : 0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  public playWireZap(ok: boolean): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = ok ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(ok ? 740 : 170, now);
    osc.frequency.exponentialRampToValueAtTime(ok ? 1180 : 95, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playShurikenThrow(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playSwordSlash(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.14);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    const bufSize = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2100;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  public playBlockClang(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    [1174.66, 1760, 2637.02].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, now + 0.22);
      gain.gain.setValueAtTime(i === 0 ? 0.12 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  public playDodgeWhoosh(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.11);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playMysticBell(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chimes = [587.33, 880.0, 1174.66, 1760.0];
    chimes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playTarotFlip(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.14);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}
