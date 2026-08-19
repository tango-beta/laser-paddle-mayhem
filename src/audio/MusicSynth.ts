class MusicSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.35;
  private currentStep: number = 0;
  private timerId: number | null = null;
  private bpm: number = 124;
  private barCount: number = 0;

  // Chord progression in MIDI notes: Am -> F -> C -> G
  private chordRoots = [57, 53, 48, 55]; // A2, F2, C2, G2

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public start() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.barCount = 0;

    const stepTimeMs = (60 / this.bpm / 4) * 1000;
    this.timerId = window.setInterval(() => {
      this.tick();
    }, stepTimeMs);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private tick() {
    if (!this.isPlaying || !this.ctx || !this.masterGain || this.isMuted) {
      this.currentStep = (this.currentStep + 1) % 16;
      return;
    }

    const now = this.ctx.currentTime;
    const step = this.currentStep;
    const currentChordIndex = Math.floor(this.barCount / 2) % this.chordRoots.length;
    const rootMidi = this.chordRoots[currentChordIndex];

    // 1. Synthwave Bassline (Running 16th or 8th notes)
    if (step % 2 === 0 || (step % 4 === 3 && this.barCount % 2 === 1)) {
      const bassMidi = rootMidi - 12 + (step % 4 === 2 ? 7 : 0);
      this.playBassNote(this.midiToFreq(bassMidi), now);
    }

    // 2. Cyber Kick & Snare pulse
    if (step === 0 || step === 8) {
      this.playKick(now);
    } else if (step === 4 || step === 12) {
      this.playSnare(now);
    } else if (step % 2 === 1 && this.barCount % 2 === 1) {
      this.playHiHat(now);
    }

    // 3. Arpeggio Synth Pluck (Every 16th note)
    const arpNotes = [0, 7, 12, 15, 19, 15, 12, 7];
    const arpOffset = arpNotes[step % arpNotes.length];
    const arpeggioFreq = this.midiToFreq(rootMidi + 12 + arpOffset);
    this.playArp(arpeggioFreq, now);

    // Advance step
    this.currentStep = (this.currentStep + 1) % 16;
    if (this.currentStep === 0) {
      this.barCount = (this.barCount + 1) % 16;
    }
  }

  private playBassNote(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.12);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  private playArp(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.07);
  }

  private playHiHat(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.025;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.03);
  }
}

export const musicSynth = new MusicSynth();
