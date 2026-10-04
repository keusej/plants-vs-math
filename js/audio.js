/**
 * Plants vs. Math - Web Audio API Sound Synthesizer
 * 100% self-contained synthesized sounds with no external audio file dependencies.
 */

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.35;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.currentNoteIndex = 0;
        this.unlocked = false;
        this.unlockedMedia = false;
        this.setupUnlockListeners();
    }

    setupUnlockListeners() {
        const events = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'];
        const unlockHandler = () => {
            this.unlock();
        };
        events.forEach(e => {
            window.addEventListener(e, unlockHandler, { capture: true, passive: true });
            document.addEventListener(e, unlockHandler, { capture: true, passive: true });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.ctx) {
                if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
                    this.ctx.resume().catch(() => {});
                }
            }
        });
    }

    unlock() {
        // 1. Tell iOS AudioSession this is playback (games/media, plays through silent switch when possible)
        if (typeof navigator !== 'undefined' && navigator.audioSession) {
            try {
                navigator.audioSession.type = 'playback';
            } catch (_) {}
        }

        // 2. Initialize AudioContext if not yet created
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }

        // 3. Resume AudioContext if suspended or interrupted
        if (this.ctx) {
            if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
                this.ctx.resume().catch(() => {});
            }

            // 4. Play silent 1-sample buffer to unlock WebKit audio hardware pipeline
            try {
                const buffer = this.ctx.createBuffer(1, 1, 22050);
                const source = this.ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(this.ctx.destination);
                source.start(0);
            } catch (_) {}
        }

        // 5. HTML5 Audio silent track trick to promote iOS WebKit audio channel to media category
        if (!this.unlockedMedia) {
            try {
                const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
                silentAudio.volume = 0.01;
                const p = silentAudio.play();
                if (p && typeof p.then === 'function') {
                    p.then(() => {
                        silentAudio.pause();
                        this.unlockedMedia = true;
                    }).catch(() => {});
                } else {
                    this.unlockedMedia = true;
                }
            } catch (_) {}
        }

        this.unlocked = true;
    }

    init() {
        this.unlock();
    }

    ready() {
        if (this.muted) return false;
        this.unlock();
        if (!this.ctx) return false;
        if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
            this.ctx.resume().catch(() => {});
        }
        return true;
    }

    toggleMute() {
        this.unlock();
        this.muted = !this.muted;
        if (this.muted && this.isMusicPlaying) {
            this.stopBGM();
        } else if (!this.muted && !this.isMusicPlaying) {
            this.startBGM();
        }
        return this.muted;
    }

    // Peashooter firing "pop / thwack"
    playShoot(isFire = false, isIce = false) {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Pop oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (isFire) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);
            gain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        } else if (isIce) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(280, now + 0.15);
            gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
            gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Sub puff noise
        this.playNoise(0.06, 0.4, 600);
    }

    // Super Pea rapid-fire plasma pop
    playSuperPeaShoot() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Punchy bright high-tech pea pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(this.sfxVolume * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);

        this.playNoise(0.03, 0.35, 1600);
    }

    // Pea hit splat
    playHit(isArmor = false) {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        if (isArmor) {
            // Metallic clang for bucket/cone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
            gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } else {
            // Wet splat
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
            gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    }

    // Zombie groan
    playZombieGroan() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(115, now + 0.4);
        osc.frequency.linearRampToValueAtTime(75, now + 0.9);

        // Low pass filter for muffled monster throat
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.95);
    }

    // Zombie chomp attack
    playChomp() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
        this.playNoise(0.05, 0.5, 800);
    }

    // Correct answer chime (scales up pitch with combo streak)
    playCorrect(streak = 1) {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Base pentatonic note progression
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
        const baseFreq = notes[Math.min(streak - 1, notes.length - 1)];

        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(baseFreq * 2, now);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.18);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.35);
        osc2.stop(now + 0.35);
    }

    // Wrong answer buzzer
    playWrong() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Lawnmower engine starting and zooming
    playLawnmower() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, now);
        osc.frequency.linearRampToValueAtTime(240, now + 0.4);
        osc.frequency.linearRampToValueAtTime(180, now + 2.0);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.9, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.0);
    }

    // Sun points collection chime
    playSunCollect() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.15); // B5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now + 0.05); // E6
        osc2.frequency.exponentialRampToValueAtTime(1975.53, now + 0.22); // B6

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.04);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
    }

    // Cherry Bomb fuse & swelling sizzle
    playCherrySizzle() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.8);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.6, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
        this.playNoise(0.8, 0.4, 1800);
    }

    // Cherry Bomb big boom explosion
    playCherryExplode() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Low frequency sub-thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

        gain.gain.setValueAtTime(this.sfxVolume * 1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);

        // Big explosion white noise burst
        this.playNoise(0.65, 0.9, 1200);
    }

    // Super Hot Chili Pepper (Jalapeno) fuse & fiery sizzle
    playChiliSizzle() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Rising fiery saw tone with pitch bend
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 1.0);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.75, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.05);

        // Crackling fiery hiss
        this.playNoise(1.0, 0.5, 2400);
    }

    // Super Hot Chili Pepper screen-clearing inferno blast!
    playChiliExplode() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Massive seismic sub-thump
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.exponentialRampToValueAtTime(20, now + 0.95);

        gain1.gain.setValueAtTime(this.sfxVolume * 1.0, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.95);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.95);

        // Distorted roaring saw wave for fire blast
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(360, now);
        filter.frequency.linearRampToValueAtTime(110, now + 0.85);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(95, now);
        osc2.frequency.exponentialRampToValueAtTime(28, now + 0.9);

        gain2.gain.setValueAtTime(this.sfxVolume * 0.9, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        osc2.connect(filter);
        filter.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.9);

        // Huge firestorm noise roar
        this.playNoise(1.0, 1.0, 1600);
    }

    // Plant placement thud (Potato Mine or other plants)
    playPlant() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

        gain.gain.setValueAtTime(this.sfxVolume * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        this.playNoise(0.08, 0.45, 600);
    }

    // Plant upgrade chime (Double Shot / Repeater)
    playUpgrade() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Bright rising arpeggio: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0, now + idx * 0.05);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.7, now + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.16);
        });
    }

    // Potato Mine "SPUDOW!" detonation
    playPotatoExplode() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        // Sharp initial pop/crack
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(340, now);
        popOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        popGain.gain.setValueAtTime(this.sfxVolume * 1.0, now);
        popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        popOsc.connect(popGain);
        popGain.connect(this.ctx.destination);

        popOsc.start(now);
        popOsc.stop(now + 0.4);

        // Punchy comic explosion noise
        this.playNoise(0.45, 0.95, 1600);
    }

    // Boss Gargantuar entrance roar
    playBossRoar() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

        // Lowpass filter for deep throat growl
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.9, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
        this.playNoise(0.7, 0.4, 400);
    }

    // Heavy boss footstep thud
    playBossThud() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Imp fling / throw sound
    playImpThrow() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Fanfare when wave starts or warning
    playWaveWarning() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;

        const chords = [220, 261.63, 329.63, 440];
        chords.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(this.sfxVolume * 0.5, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.5);
        });
    }

    // Victory Fanfare
    playVictory() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.15 },
            { f: 659.25, d: 0.15 },
            { f: 783.99, d: 0.15 },
            { f: 1046.50, d: 0.45 }
        ];

        let offset = 0;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + offset);
            gain.gain.setValueAtTime(this.sfxVolume * 0.8, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.01, now + offset + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + note.d);
            offset += note.d * 0.9;
        });
    }

    // Game Over Sound
    playGameOver() {
        if (!this.ready()) return;
        const now = this.ctx.currentTime;
        const notes = [293.66, 277.18, 261.63, 246.94];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.35);

            gain.gain.setValueAtTime(this.sfxVolume * 0.7, now + idx * 0.35);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.35 + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.35);
            osc.stop(now + idx * 0.35 + 0.4);
        });
    }

    // Noise helper for splat & puff
    playNoise(duration = 0.1, volume = 0.3, cutoff = 1000) {
        if (!this.ready()) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cutoff;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // Playful Garden Background Music Synthesizer
    startBGM() {
        if (!this.ready() || this.isMusicPlaying) return;
        this.isMusicPlaying = true;

        // Catchy, cute garden pizzicato pattern
        const melody = [
            261.63, 329.63, 392.00, 523.25,
            392.00, 329.63, 293.66, 349.23,
            440.00, 349.23, 392.00, 329.63,
            261.63, 196.00, 220.00, 246.94
        ];
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (!this.isMusicPlaying || this.muted) return;
            if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
                this.ctx.resume().catch(() => {});
            }
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = melody[step % melody.length];
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(this.musicVolume * 0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.23);
            step++;
        }, 260);
    }

    stopBGM() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Global audio instance
window.soundEffects = new SoundEffects();
