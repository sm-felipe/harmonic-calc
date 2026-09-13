import {audiblePartials, CUSTOM_LEVEL_PRESETS, CUTOFF_DB, defaultInstrument, findInstrument, instruments} from './instruments';

const A4 = 440;
const Bb1 = 58.27;
const E2 = 82.41;
const E1 = 41.2;
const A2 = 110;
const D3 = 146.83;

function levels(instrumentId, fundamental) {
    return audiblePartials(findInstrument(instrumentId), fundamental);
}

function loudest(partials) {
    return partials.reduce((best, partial) => partial.levelDb > best.levelDb ? partial : best);
}

function level(partials, harmonicNumber) {
    let partial = partials.find((candidate) => candidate.harmonicNumber === harmonicNumber);
    return partial ? partial.levelDb : -Infinity;
}

test('custom instrument starts as the original 9 partials with a linear decay', () => {
    expect(defaultInstrument.id).toBe('custom');
    expect(audiblePartials(defaultInstrument, A4)).toEqual(
        [0, -3, -6, -9, -12, -15, -18, -21, -24].map((levelDb, index) => ({harmonicNumber: index + 1, levelDb})));
});

test('custom levels are used as given, not rescaled, and a level at the cutoff switches the harmonic off', () => {
    let partials = audiblePartials(defaultInstrument, A4, CUTOFF_DB, [-10, 0, CUTOFF_DB, -5]);
    expect(partials).toEqual([
        {harmonicNumber: 1, levelDb: -10},
        {harmonicNumber: 2, levelDb: 0},
        {harmonicNumber: 4, levelDb: -5},
    ]);
});

test('every preset has a unique id and normalises its loudest partial to 0 dB', () => {
    let ids = new Set(instruments.map((instrument) => instrument.id));
    expect(ids.size).toBe(instruments.length);
    for (let instrument of instruments) {
        let partials = audiblePartials(instrument, A4);
        expect(loudest(partials).levelDb).toBeCloseTo(0);
        expect(partials.length).toBeGreaterThan(1);
    }
});

test('partials at or below the cutoff are dropped, even in the middle of the series', () => {
    for (let instrument of instruments) {
        for (let partial of audiblePartials(instrument, E2)) {
            expect(partial.levelDb).toBeGreaterThan(CUTOFF_DB);
        }
    }
    // clarinet on A2: the 12th harmonic (an even one below the cutoff
    // frequency) is inaudible, its neighbours are not, leaving a gap
    let numbers = levels('clarinet', A2).map((partial) => partial.harmonicNumber);
    expect(numbers).toContain(11);
    expect(numbers).not.toContain(12);
    expect(numbers).toContain(13);
});

test('partials stop at 10 kHz', () => {
    let partials = levels('violin', E2);
    expect(partials[partials.length - 1].harmonicNumber * E2).toBeLessThanOrEqual(10000 + E2);
});

test('bassoon low Bb has its loudest partial around the 450-500 Hz formant', () => {
    let number = loudest(levels('bassoon', Bb1)).harmonicNumber;
    expect(number).toBeGreaterThanOrEqual(7);
    expect(number).toBeLessThanOrEqual(9);
});

test('oboe A4 has a 2nd harmonic louder than the fundamental', () => {
    let partials = levels('oboe', A4);
    expect(level(partials, 2)).toBeGreaterThan(level(partials, 1));
});

test('clarinet low register has weak even harmonics', () => {
    let partials = levels('clarinet', D3);
    expect(level(partials, 2)).toBeLessThan(level(partials, 1) - 10);
    expect(level(partials, 2)).toBeLessThan(level(partials, 3) - 10);
    expect(level(partials, 4)).toBeLessThan(level(partials, 5) - 10);
});

test('flute fundamental is the loudest partial and few harmonics survive the cutoff', () => {
    let partials = levels('flute', A4);
    expect(loudest(partials).harmonicNumber).toBe(1);
    expect(partials.length).toBeLessThanOrEqual(6);
});

test('bass voice on an open vowel is loudest near the first formant, not at the fundamental', () => {
    let number = loudest(levels('voice-a', E2)).harmonicNumber;
    expect(number).toBeGreaterThan(1);
    expect(number * E2).toBeGreaterThan(400);
    expect(number * E2).toBeLessThan(1000);
});

test('unknown ids fall back to the default instrument', () => {
    expect(findInstrument('nope')).toBe(defaultInstrument);
});

test('guitar plucked 15% along the string loses the harmonics with a node there', () => {
    let partials = levels('guitar', A2);
    // 1/0.15 ≈ 6.7, so the 6th and 7th sit in the first notch and the 13th in the second
    expect(level(partials, 6)).toBeLessThan(level(partials, 5) - 6);
    expect(level(partials, 7)).toBeLessThan(level(partials, 5) - 6);
    expect(level(partials, 13)).toBeLessThan(level(partials, 11) - 6);
    expect(loudest(partials).harmonicNumber).toBeLessThanOrEqual(3);
});

test('bowed double bass on its low E carries the note in the 2nd-3rd harmonics', () => {
    let number = loudest(levels('double-bass', E1)).harmonicNumber;
    expect(number).toBeGreaterThanOrEqual(2);
    expect(number).toBeLessThanOrEqual(4);
});

test('custom level presets cover nine harmonics; "fundamental + even" keeps 1, 2, 4, 6, 8', () => {
    expect(CUSTOM_LEVEL_PRESETS.every((preset) => preset.levels.length === 9)).toBe(true);
    let preset = CUSTOM_LEVEL_PRESETS.find((candidate) => candidate.id === 'fundamental-even');
    let numbers = audiblePartials(defaultInstrument, A4, CUTOFF_DB, preset.levels).map((partial) => partial.harmonicNumber);
    expect(numbers).toEqual([1, 2, 4, 6, 8]);
});
