
// A procedural audio synthesizer using Web Audio API with Melodic Sequencing
// No external assets required.

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  
  // Sequencing state
  private nextNoteTime: number = 0;
  private timerID: number | undefined;
  private currentLevel: number = 1;
  private isPlaying: boolean = false;

  // Scales (Frequencies in Hz)
  // C Minor Pentatonic (Deep, Mystery)
  private readonly SCALE_L1 = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63]; 
  // G Major (Happy, Winning, Upward)
  private readonly SCALE_L2 = [196.00, 246.94, 293.66, 392.00, 493.88, 587.33];
  // Diminished/Chaos (Tension)
  private readonly SCALE_L3 = [110.00, 116.54, 123.47, 130.81, 155.56, 311.13, 622.25];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getLevelSettings(level: number) {
    if (level === 1) {
      return { scale: this.SCALE_L1, tempo: 0.4, type: 'triangle' as OscillatorType, gain: 0.1 };
    } else if (level === 2) {
      return { scale: this.SCALE_L2, tempo: 0.25, type: 'square' as OscillatorType, gain: 0.05 };
    } else {
      return { scale: this.SCALE_L3, tempo: 0.15, type: 'sawtooth' as OscillatorType, gain: 0.04 };
    }
  }

  private scheduleNote() {
    if (!this.ctx || !this.isPlaying) return;

    const settings = this.getLevelSettings(this.currentLevel);
    
    // Lookahead: schedule notes up to 0.1s in advance
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
        this.playNote(this.nextNoteTime, settings);
        // Add some rhythm variation
        const rhythmVar = Math.random() > 0.7 ? 2 : 1; 
        this.nextNoteTime += settings.tempo * rhythmVar;
    }
    
    this.timerID = window.setTimeout(() => this.scheduleNote(), 25);
  }

  private playNote(time: number, settings: any) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = settings.type;

    // Pick a random note from the scale
    const noteIndex = Math.floor(Math.random() * settings.scale.length);
    let freq = settings.scale[noteIndex];
    
    // Occasionally change octave
    if (Math.random() > 0.8) freq *= 2;
    if (Math.random() > 0.9) freq /= 2;

    osc.frequency.setValueAtTime(freq, time);

    // Envelope (ADSR-ish)
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(settings.gain, time + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + settings.tempo - 0.05); // Decay

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + settings.tempo);
  }

  public startLevelMusic(level: number) {
    this.init();
    this.currentLevel = level;
    
    if (this.isPlaying) return; // Already playing
    
    if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.isPlaying = true;
        this.scheduleNote();
    }
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.timerID) {
        clearTimeout(this.timerID);
    }
  }

  public playWinSound() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.8);
  }
}

export const audioService = new AudioService();
