// Plays a score read by musicXml.js, with the same additive synthesis the
// static player uses: every note is built from calculateHarmonicMatrix, so it
// sounds in the chosen temperament, with its part's timbre, and the spectrum on
// screen is the spectrum being heard.
//
// Where HarmonicPlayer holds one chord for as long as it is asked to, this one
// has to make notes come and go, which changes two things:
//
//   * each note gets a voice of its own — an envelope with a short attack and
//     release, so a note that ends does not click and one that begins does not
//     restart the others. HarmonicPlayer's single shared voice cannot express
//     that, which is why this is a separate player rather than a mode of it;
//   * notes are created shortly before they sound, not all at once. A piece of
//     a thousand notes would otherwise mean tens of thousands of oscillators
//     alive at the same moment. A timer runs every TICK_MS and schedules
//     whatever falls inside the next LOOKAHEAD_SECONDS, which is the usual way
//     of pairing a coarse timer with the audio clock: the timer only decides
//     *what* to schedule, while every actual start and stop is placed on the
//     sample-accurate clock and so is immune to the timer's jitter.

import {amplitudeFromDb, createAudioGraph, defaultContextFactory, mixScale, whenContextRuns} from "./audioPlayer";
import {calculateHarmonicMatrix} from "./HarmonicMatrix";
import {defaultInstrument, findInstrument} from "./instruments";

const TICK_MS = 25;
const LOOKAHEAD_SECONDS = 0.1;
const ATTACK_SECONDS = 0.02;
const RELEASE_SECONDS = 0.08;
// a moment of slack before the first note, so that starting does not already
// leave the opening chord in the past
const LEAD_IN_SECONDS = 0.08;

export class ScorePlayer {
    context = null;
    master = null;
    voices = [];          // {endsAt, envelope, oscillators} per sounding note
    timer = null;
    score = null;
    parts = [];           // {instrument, customLevels} per part
    tuningContext = null;
    notes = [];           // the notes still to schedule, in starting order
    next = 0;
    startedAt = null;     // context time the playhead was at offsetMs
    offsetMs = 0;
    voiceScale = 1;
    onEnded = null;       // called once when the last note has died away

    constructor(createContext = defaultContextFactory) {
        this.createContext = createContext;
    }

    get playing() {
        return this.timer !== null;
    }

    /** Where the playhead is, in milliseconds from the start of the piece. */
    get positionMs() {
        if (!this.context || this.startedAt === null) {
            return this.offsetMs;
        }
        return this.offsetMs + Math.max(0, (this.context.currentTime - this.startedAt) * 1000);
    }

    /**
     * Starts the piece, optionally from part-way through.
     *
     * `parts` gives the timbre of each part as {instrumentId, harmonicLevels},
     * positionally, and falls back to what the score itself suggested.
     */
    start(score, {tuningContext, parts = [], volume = 1, fromMs = 0} = {}) {
        this.stop();
        this.ensureContext();

        this.score = score;
        this.tuningContext = tuningContext;
        this.parts = score.parts.map((part, index) => {
            let chosen = parts[index] || {};
            return {
                instrument: findInstrument(chosen.instrumentId || part.instrumentId) || defaultInstrument,
                customLevels: chosen.harmonicLevels,
            };
        });

        // A note already sounding when we drop in should be picked up part-way
        // rather than skipped, so the test is on where it ends.
        this.notes = score.notes.filter((note) => note.endMs > fromMs);
        this.next = 0;
        this.offsetMs = fromMs;
        this.startedAt = this.context.currentTime + LEAD_IN_SECONDS;

        // Voices add in power, so the fullest chord in the piece decides how
        // loud a single one may be. Thinner textures then sound thinner, which
        // is what they should do, and nothing has to be renormalised mid-piece
        // the way the static player's mix scale is.
        let polyphony = score.changes.reduce((most, change) => Math.max(most, change.notes.length), 1);
        this.voiceScale = 1 / Math.sqrt(polyphony);

        this.setVolume(volume);
        this.timer = setInterval(() => this.tick(), TICK_MS);
        this.tick();
    }

    /**
     * Schedules everything starting within the lookahead and clears away what
     * has finished. Public because a test can drive it directly, moving the
     * context's clock by hand instead of waiting on a timer.
     */
    tick() {
        if (!this.context) {
            return;
        }
        let now = this.context.currentTime;
        let horizon = now + LOOKAHEAD_SECONDS;

        while (this.next < this.notes.length) {
            let note = this.notes[this.next];
            let at = this.timeOf(note.startMs);
            if (at > horizon) {
                break;
            }
            // never schedule in the past: a note we dropped into part-way, or
            // one the timer was late for, begins now and keeps its end
            this.addVoice(note, Math.max(at, now));
            this.next++;
        }

        this.voices = this.voices.filter((voice) => {
            if (voice.endsAt > now) {
                return true;
            }
            voice.envelope.disconnect();
            return false;
        });

        if (this.next >= this.notes.length && this.voices.length === 0) {
            this.finish();
        }
    }

    timeOf(scoreMs) {
        return this.startedAt + (scoreMs - this.offsetMs) / 1000;
    }

    addVoice(note, at) {
        let part = this.parts[note.partIndex] || {instrument: defaultInstrument};
        let [row] = calculateHarmonicMatrix(
            [note.pitchIndex], part.instrument, this.tuningContext, part.customLevels);
        if (!row || row.harmonics.length === 0) {
            return;
        }

        let context = this.context;
        let until = Math.max(this.timeOf(note.endMs), at + 0.01);
        let attack = Math.min(ATTACK_SECONDS, (until - at) / 2);
        let peak = mixScale([row]) * this.voiceScale;

        let envelope = context.createGain();
        envelope.gain.setValueAtTime(0, at);
        envelope.gain.linearRampToValueAtTime(peak, at + attack);
        envelope.gain.setValueAtTime(peak, until);
        envelope.gain.linearRampToValueAtTime(0, until + RELEASE_SECONDS);
        envelope.connect(this.master);

        let oscillators = [];
        for (let partial of row.harmonics) {
            let oscillator = context.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = partial.frequency;
            let gain = context.createGain();
            gain.gain.value = amplitudeFromDb(partial.levelDb);
            oscillator.connect(gain);
            gain.connect(envelope);
            oscillator.start(at);
            oscillator.stop(until + RELEASE_SECONDS);
            oscillators.push(oscillator);
        }

        this.voices.push({endsAt: until + RELEASE_SECONDS, envelope, oscillators});
    }

    finish() {
        let ended = this.playing;
        this.clearTimer();
        this.startedAt = null;
        this.offsetMs = this.score ? this.score.durationMs : 0;
        if (ended && this.onEnded) {
            this.onEnded();
        }
    }

    stop() {
        this.clearTimer();
        if (!this.context) {
            return;
        }
        let now = this.context.currentTime;
        for (let voice of this.voices) {
            // cut the scheduled envelope short and fade instead of dropping the
            // note, which would click
            holdGainAt(voice.envelope.gain, now);
            voice.envelope.gain.linearRampToValueAtTime(0, now + RELEASE_SECONDS);
            for (let oscillator of voice.oscillators) {
                oscillator.stop(now + RELEASE_SECONDS);
            }
        }
        this.voices = [];
        this.offsetMs = this.positionMs;
        this.startedAt = null;
    }

    clearTimer() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /** Puts the playhead somewhere without starting; use start({fromMs}) to play. */
    seek(scoreMs) {
        this.offsetMs = Math.max(0, scoreMs);
        this.startedAt = null;
    }

    setVolume(volume) {
        if (this.master) {
            this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.02);
        }
    }

    whenRunning() {
        return whenContextRuns(this.context);
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
 * Pins a gain to the value it actually has right now, ready to be ramped from.
 *
 * cancelScheduledValues drops the scheduled events but leaves the parameter on
 * the last value that was *set*, not the one the ramp had reached, so fading
 * from `gain.value` jumps first and clicks — audibly, and measurably as a peak
 * louder than the music. cancelAndHoldAtTime exists precisely for this; the
 * older pair is kept for browsers that lack it.
 */
function holdGainAt(gain, time) {
    if (gain.cancelAndHoldAtTime) {
        gain.cancelAndHoldAtTime(time);
    } else {
        gain.cancelScheduledValues(time);
        gain.setValueAtTime(gain.value, time);
    }
}
