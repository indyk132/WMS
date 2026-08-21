class SoundEffects {
    private ctx: AudioContext | null = null;

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
    }

    playTone(freq: number, type: OscillatorType, duration: number, delay = 0) {
        try {
            this.init();
            if (!this.ctx) return;

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
        this.playTone(880, 'sine', 0.15); 
    }

    playSuccess() {
        this.playTone(523.25, 'triangle', 0.15, 0); 
        this.playTone(659.25, 'triangle', 0.25, 0.08); 
    }

    playError() {
        this.playTone(180, 'sawtooth', 0.4);
        this.vibrate([150, 50, 150]);
    }

    playVictoryChime() {
        this.playTone(523.25, 'triangle', 0.12, 0); 
        this.playTone(659.25, 'triangle', 0.12, 0.08); 
        this.playTone(783.99, 'triangle', 0.12, 0.16); 
        this.playTone(1046.50, 'sine', 0.35, 0.24);
        this.vibrate([100, 50, 100, 50, 200]);
    }

    vibrate(pattern: number | number[] = [100, 50, 100]) {
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // ignore
            }
        }
    }
}

export const sounds = new SoundEffects();
export default sounds;
