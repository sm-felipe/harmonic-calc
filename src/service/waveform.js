import {amplitudeFromDb} from "./audioPlayer";

// The waveform that the player produces: every audible partial of every
// selected note summed as a sine, all starting in phase, with the amplitude
// its level in dB calls for. A few periods of the lowest fundamental are
// sampled; a single note repeats exactly every period, a chord does not
// (its true period is the beat cycle of all the notes), but the lowest
// note's wavelength is a well-defined, readable unit either way. Three
// cycles show the repetition without hiding the detail; more show beating.

export const DEFAULT_CYCLES = 3;
export const CYCLE_OPTIONS = [1, 2, 3, 4, 6, 8];
const SAMPLES_PER_CYCLE = 300;

export function sampleWaveform(harmonicMatrix, cycles = DEFAULT_CYCLES, samplesPerCycle = SAMPLES_PER_CYCLE) {
    let partials = [];
    let lowest = null;
    for (let row of harmonicMatrix) {
        for (let partial of row.harmonics) {
            partials.push({frequency: partial.frequency, amplitude: amplitudeFromDb(partial.levelDb)});
            let fundamental = partial.frequency / partial.harmonicNumber;
            if (!lowest || fundamental < lowest.frequency) {
                lowest = {frequency: fundamental, noteName: row.noteName};
            }
        }
    }
    if (partials.length === 0) {
        return null;
    }

    let period = 1 / lowest.frequency;
    let sampleCount = cycles * samplesPerCycle;
    let samples = new Array(sampleCount + 1);
    let peak = 0;
    for (let i = 0; i <= sampleCount; i++) {
        let t = cycles * period * i / sampleCount;
        let y = 0;
        for (let {frequency, amplitude} of partials) {
            y += amplitude * Math.sin(2 * Math.PI * frequency * t);
        }
        samples[i] = y;
        peak = Math.max(peak, Math.abs(y));
    }
    // normalised to ±1 so the shape, not the loudness, fills the plot
    let scale = peak > 0 ? 1 / peak : 1;
    return {
        period,
        cycles,
        lowestNote: lowest.noteName,
        partialCount: partials.length,
        samples: samples.map((y) => y * scale),
    };
}
