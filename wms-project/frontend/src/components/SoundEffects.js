// Premium Web Audio API Sound Effects for Logistics OS Terminal
class SoundEffects {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
    }

    playTone(freq, type, duration, delay = 0) {
        try {
            this.init();
            if (!this.ctx) return;

            // Resume context if suspended (browser security)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + delay);
            osc.stop(this.ctx.currentTime + delay + duration);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    playBeep() {
        this.playTone(880, 'sine', 0.15); // Clear, clean high-pitch beep
    }

    playSuccess() {
        // Double ascending notification chime
        this.playTone(523.25, 'triangle', 0.15, 0); // C5
        this.playTone(659.25, 'triangle', 0.25, 0.08); // E5
    }

    playError() {
        // Deep buzzy alarm sound
        this.playTone(180, 'sawtooth', 0.4);
    }
}

export const sounds = new SoundEffects();
