import {sampleWaveform} from './waveform';

test('no notes, no wave', () => {
    expect(sampleWaveform([])).toBeNull();
});

test('a single partial is one cycle of a sine over its own period', () => {
    let wave = sampleWaveform([{noteName: 'A4', harmonics: [{frequency: 440, harmonicNumber: 1, levelDb: 0}]}], 1, 8);
    expect(wave.period).toBeCloseTo(1 / 440, 9);
    expect(wave.lowestNote).toBe('A4');
    expect(wave.samples.map((y) => Math.round(y * 1000) / 1000))
        .toEqual([0, 0.707, 1, 0.707, 0, -0.707, -1, -0.707, -0]);
});

test('levels weigh the partials and the window is the lowest fundamental, even if that fundamental is switched off', () => {
    let quietOctave = sampleWaveform([{
        noteName: 'A3',
        harmonics: [{frequency: 220, harmonicNumber: 1, levelDb: 0}, {frequency: 440, harmonicNumber: 2, levelDb: -40}],
    }], 1, 8);
    let loudOctave = sampleWaveform([{
        noteName: 'A3',
        harmonics: [{frequency: 220, harmonicNumber: 1, levelDb: 0}, {frequency: 440, harmonicNumber: 2, levelDb: 0}],
    }], 1, 8);
    // with a quiet octave the wave is still nearly a sine: the quarter-period sample is near the peak
    expect(quietOctave.samples[2]).toBeGreaterThan(0.95);
    // with an equally loud octave the peak moves earlier in the cycle
    expect(loudOctave.samples[1]).toBeGreaterThan(loudOctave.samples[2]);

    let noFundamental = sampleWaveform([{
        noteName: 'A3',
        harmonics: [{frequency: 440, harmonicNumber: 2, levelDb: 0}, {frequency: 660, harmonicNumber: 3, levelDb: -6}],
    }]);
    expect(noFundamental.period).toBeCloseTo(1 / 220, 9);
    expect(noFundamental.partialCount).toBe(2);
});

test('several notes share one window: the lowest note\'s wavelength', () => {
    let wave = sampleWaveform([
        {noteName: 'E5', harmonics: [{frequency: 659.26, harmonicNumber: 1, levelDb: 0}]},
        {noteName: 'A4', harmonics: [{frequency: 440, harmonicNumber: 1, levelDb: 0}]},
    ]);
    expect(wave.period).toBeCloseTo(1 / 440, 9);
    expect(wave.lowestNote).toBe('A4');
    expect(Math.max(...wave.samples.map(Math.abs))).toBeCloseTo(1, 6);
});

test('several cycles repeat the single-note wave exactly; three is the default', () => {
    let matrix = [{noteName: 'A4', harmonics: [{frequency: 440, harmonicNumber: 1, levelDb: 0}]}];
    let three = sampleWaveform(matrix, 3, 4);
    expect(three.cycles).toBe(3);
    expect(three.samples.map((y) => Math.round(y * 1000) / 1000 + 0)).toEqual([0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0]);
    expect(sampleWaveform(matrix).cycles).toBe(3);
});
