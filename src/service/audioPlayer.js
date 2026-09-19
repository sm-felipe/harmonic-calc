// Plays a harmonic matrix with the Web Audio API: one sine oscillator per
// audible partial, each with the gain its level in dB calls for, summed and
// scaled so the mix stays at a comparable loudness however many notes and
// partials are sounding. A limiter catches the occasional peak.

const FADE_SECONDS = 0.03;
// Long enough that a retuning is heard as the pitch moving rather than as a
// step, short enough that it is over before anyone calls it a portamento.
const GLIDE_SECONDS = 0.04;

export function amplitudeFromDb(levelDb) {
    return Math.pow(10, levelDb / 20);
}

// Scale that keeps the RMS of the whole mix roughly constant: sines of
// amplitude a_i add in power, so dividing by sqrt(sum a_i^2) makes a single
// sine and a forty-partial chord equally loud. 0.5 leaves headroom for peaks.
export function mixScale(harmonicMatrix) {
    let sumOfSquares = 0;
    for (let row of harmonicMatrix) {
        for (let partial of row.harmonics) {
            sumOfSquares += amplitudeFromDb(partial.levelDb) ** 2;
        }
    }
    return sumOfSquares > 0 ? 0.5 / Math.sqrt(sumOfSquares) : 0;
}

export class HarmonicPlayer {
    context = null;
    master = null;
    voice = null;
    oscillators = [];
    partials = [];   // {gain, oscillator} per oscillator, for in-place updates
    shape = [];      // note and harmonic number of each partial, in order

    constructor(createContext = defaultContextFactory) {
        this.createContext = createContext;
    }

    get playing() {
        return this.voice !== null;
    }

    start(harmonicMatrix, volume = 1) {
        this.stop();
        this.ensureContext();
        let context = this.context;
        let now = context.currentTime;

        let voice = context.createGain();
        voice.gain.setValueAtTime(0, now);
        voice.gain.linearRampToValueAtTime(mixScale(harmonicMatrix), now + FADE_SECONDS);
        voice.connect(this.master);

        for (let row of harmonicMatrix) {
            for (let partial of row.harmonics) {
                let oscillator = context.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = partial.frequency;
                let gain = context.createGain();
                gain.gain.value = amplitudeFromDb(partial.levelDb);
                oscillator.connect(gain);
                gain.connect(voice);
                oscillator.start(now);
                this.oscillators.push(oscillator);
                this.partials.push({gain, oscillator});
            }
        }
        this.shape = shapeOf(harmonicMatrix);
        this.voice = voice;
        this.setVolume(volume);
    }

    /**
     * Follow a changed matrix. As long as the same notes are sounding with the
     * same partials, the levels and the frequencies glide to their new values
     * without restarting: dragging a harmonic's slider is heard smoothly, and
     * so is retuning, which moves every partial at once. Only a change of the
     * notes themselves starts the sound again — gliding into a different chord
     * would be a portamento, not a chord change.
     */
    update(harmonicMatrix, volume = 1) {
        if (!this.playing || !this.sameShape(harmonicMatrix)) {
            this.start(harmonicMatrix, volume);
            return;
        }
        let now = this.context.currentTime;
        let index = 0;
        for (let row of harmonicMatrix) {
            for (let partial of row.harmonics) {
                this.partials[index].gain.gain.setTargetAtTime(amplitudeFromDb(partial.levelDb), now, 0.02);
                this.partials[index].oscillator.frequency.setTargetAtTime(partial.frequency, now, GLIDE_SECONDS);
                index++;
            }
        }
        this.voice.gain.cancelScheduledValues(now);
        this.voice.gain.setTargetAtTime(mixScale(harmonicMatrix), now, 0.02);
        this.setVolume(volume);
    }

    // The same notes carrying the same partials, whatever those are tuned to.
    sameShape(harmonicMatrix) {
        let shape = shapeOf(harmonicMatrix);
        return shape.length === this.shape.length
            && shape.every((entry, index) => entry === this.shape[index]);
    }

    // Resolves to whether the context is actually producing sound. Browsers
    // keep a context suspended until a user gesture allows it.
    whenRunning() {
        return whenContextRuns(this.context);
    }

    setVolume(volume) {
        if (this.master) {
            this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.02);
        }
    }

    stop() {
        if (!this.voice) {
            return;
        }
        let now = this.context.currentTime;
        let voice = this.voice;
        voice.gain.cancelScheduledValues(now);
        voice.gain.setValueAtTime(voice.gain.value, now);
        voice.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
        for (let oscillator of this.oscillators) {
            oscillator.stop(now + FADE_SECONDS);
        }
        this.oscillators = [];
        this.partials = [];
        this.shape = [];
        this.voice = null;
    }

    close() {
        this.stop();
        if (this.context) {
            this.context.close();
            this.context = null;
            this.master = null;
        }
    }

    ensureContext() {
        if (!this.context) {
            let graph = createAudioGraph(this.createContext);
            this.context = graph.context;
            this.master = graph.master;
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

/**
 * A fresh context with the output chain every player here shares: sound goes
 * through a master gain into a limiter, which catches the peaks that summed
 * sines throw up now and then. Returns {context, master}; connect to `master`.
 */
export function createAudioGraph(createContext = defaultContextFactory) {
    let context = createContext();
    let limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    limiter.connect(context.destination);
    let master = context.createGain();
    master.connect(limiter);
    return {context, master};
}

// Resolves to whether a context is actually producing sound. Browsers keep one
// suspended until a user gesture allows it.
export function whenContextRuns(context) {
    if (!context) {
        return Promise.resolve(false);
    }
    let resumed = context.state === 'running' ? Promise.resolve() : Promise.resolve(context.resume());
    return resumed.then(() => context.state === 'running', () => false);
}

export function defaultContextFactory() {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
}

// What a matrix is made of, ignoring what it is tuned to: the note of each row
// and the harmonic number of each of its partials.
function shapeOf(harmonicMatrix) {
    return harmonicMatrix.flatMap((row) => row.harmonics.map((partial) => `${row.note}:${partial.harmonicNumber}`));
}
