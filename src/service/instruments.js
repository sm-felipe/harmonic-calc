// Parametric spectral-envelope model of instrument timbres.
//
// Each preset describes how loud the n-th harmonic of a note is, in dB, as
// the sum of three effects that the acoustics literature separates:
//   1. a source spectrum that falls off at a fixed rate per octave of the
//      harmonic number (bowed strings ~ -6 dB/oct, the glottal source ~ -12);
//   2. formants / body resonances, fixed in absolute Hz, modelled as Gaussian
//      bumps on a log-frequency axis (this is why low notes of a bassoon or a
//      bass voice have a weak fundamental and strong middle harmonics);
//   3. a high-frequency cutoff (tone-hole cutoff, radiation losses).
// Optionally, even harmonics can be penalised below a given frequency, which
// is the closed-pipe behaviour of the clarinet's low register.
//
// Values are mf approximations distilled from Meyer, "Acoustics and the
// Performance of Music"; Fletcher & Rossing, "The Physics of Musical
// Instruments"; and Sundberg, "The Science of the Singing Voice". They are
// meant to reproduce the well-documented qualitative behaviour of each
// instrument, not a specific recording. Levels are normalised so that the
// strongest partial of every note sits at 0 dB.

export const MAX_PARTIAL_HZ = 10000;
// Partials at or below this level (relative to the loudest partial of the
// note) are dropped. The app is a listening exercise, so the cutoff is
// perceptual rather than analytic: 30 dB below the loudest partial a
// component is masked by its neighbours, barely changes the timbre, and beats
// against a near-coincident partial of another note with only ~6% depth,
// around the detection limit. At a comfortable playback level it also sits
// near the noise floor of a quiet room.
export const CUTOFF_DB = -30;

export const instruments = [
    {
        id: 'hypothetical',
        label: 'Hypothetical (linear decay)',
        description: 'Fundamental + 8 harmonics, each 3 dB quieter than the previous one. Not a real instrument.',
        fixedHarmonics: 9,
        dbPerHarmonic: -3,
    },
    {
        id: 'voice-a',
        label: 'Singing voice, vowel "a"',
        description: 'Glottal source (-12 dB/oct) plus lip radiation (+6 dB/oct), shaped by F1 ≈ 700 Hz, F2 ≈ 1100 Hz, F3 ≈ 2500 Hz and the singer\'s formant near 2.9 kHz. Low notes get their loudest partial near F1, not at the fundamental.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 700, gainDb: 30, widthOctaves: 1.0},
            {hz: 1100, gainDb: 22, widthOctaves: 0.8},
            {hz: 2500, gainDb: 18, widthOctaves: 0.8},
            {hz: 2900, gainDb: 18, widthOctaves: 0.6},
        ],
        cutoffHz: 5000, cutoffSlopeDb: -12,
        maxHarmonics: 40,
    },
    {
        id: 'voice-u',
        label: 'Singing voice, vowel "u"',
        description: 'Same source as "a", but F1 ≈ 300 Hz and F2 ≈ 700 Hz: a darker sound with energy concentrated in the first few harmonics.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 300, gainDb: 30, widthOctaves: 0.8},
            {hz: 700, gainDb: 20, widthOctaves: 0.8},
            {hz: 2300, gainDb: 12, widthOctaves: 0.8},
            {hz: 2900, gainDb: 15, widthOctaves: 0.6},
        ],
        cutoffHz: 5000, cutoffSlopeDb: -12,
        maxHarmonics: 40,
    },
    {
        id: 'flute',
        label: 'Flute',
        description: 'Fundamental dominates; harmonics fall fast and there is little energy above 2 kHz. High notes are almost sinusoidal.',
        sourceSlopeDb: -12,
        formants: [],
        cutoffHz: 2000, cutoffSlopeDb: -12,
        maxHarmonics: 12,
    },
    {
        id: 'oboe',
        label: 'Oboe',
        description: 'Rich conical-reed source with formants near 1100 Hz and 2700 Hz. The 2nd and 3rd harmonics of most notes are louder than the fundamental.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 1100, gainDb: 15, widthOctaves: 0.8},
            {hz: 2700, gainDb: 10, widthOctaves: 0.7},
        ],
        cutoffHz: 4500, cutoffSlopeDb: -18,
        maxHarmonics: 40,
    },
    {
        id: 'clarinet',
        label: 'Clarinet (low register)',
        description: 'Closed cylindrical pipe: even harmonics are ~20 dB weaker than their odd neighbours up to the tone-hole cutoff around 1.5 kHz, above which all harmonics appear.',
        sourceSlopeDb: -6,
        formants: [],
        evenHarmonicDb: -20, evenBelowHz: 1500,
        cutoffHz: 1800, cutoffSlopeDb: -15,
        maxHarmonics: 32,
    },
    {
        id: 'bassoon',
        label: 'Bassoon',
        description: 'Strong formant around 450-500 Hz: on low notes the 7th-9th harmonics are the loudest and the fundamental is weak.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 480, gainDb: 25, widthOctaves: 0.9},
            {hz: 1200, gainDb: 10, widthOctaves: 0.8},
        ],
        cutoffHz: 3000, cutoffSlopeDb: -15,
        maxHarmonics: 40,
    },
    {
        id: 'horn',
        label: 'French horn (mf)',
        description: 'Mellow spectrum with a formant near 340 Hz and steep roll-off above 1.5 kHz; low notes have a weak fundamental.',
        sourceSlopeDb: -9,
        formants: [{hz: 340, gainDb: 18, widthOctaves: 1.0}],
        cutoffHz: 1500, cutoffSlopeDb: -18,
        maxHarmonics: 32,
    },
    {
        id: 'trumpet',
        label: 'Trumpet (mf)',
        description: 'Bright source with a formant around 1200-1500 Hz. Louder playing shifts energy further into the upper harmonics.',
        sourceSlopeDb: -4,
        formants: [{hz: 1300, gainDb: 12, widthOctaves: 0.8}],
        cutoffHz: 5000, cutoffSlopeDb: -15,
        maxHarmonics: 40,
    },
    {
        id: 'trombone',
        label: 'Trombone (mf)',
        description: 'Like the trumpet an octave lower: formant near 500-600 Hz, cutoff around 3.5 kHz.',
        sourceSlopeDb: -5,
        formants: [{hz: 550, gainDb: 12, widthOctaves: 0.9}],
        cutoffHz: 3500, cutoffSlopeDb: -15,
        maxHarmonics: 40,
    },
    {
        id: 'tuba',
        label: 'Tuba (mf)',
        description: 'Formant around 200-250 Hz and little energy above 1.5 kHz, so the lowest notes have a weak fundamental.',
        sourceSlopeDb: -8,
        formants: [{hz: 230, gainDb: 15, widthOctaves: 1.0}],
        cutoffHz: 1500, cutoffSlopeDb: -15,
        maxHarmonics: 32,
    },
    {
        id: 'violin',
        label: 'Violin',
        description: 'Sawtooth-like bowed string (-6 dB/oct) filtered by the body: air resonance ≈ 280 Hz, wood resonances ≈ 500 Hz and the "bridge hill" around 2.5 kHz.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 280, gainDb: 10, widthOctaves: 0.4},
            {hz: 500, gainDb: 10, widthOctaves: 0.5},
            {hz: 2500, gainDb: 8, widthOctaves: 1.0},
        ],
        cutoffHz: 6000, cutoffSlopeDb: -12,
        maxHarmonics: 40,
    },
    {
        id: 'cello',
        label: 'Cello',
        description: 'Same bowed-string source as the violin, with body resonances near 100, 200 and 400 Hz and a lower bridge hill around 1.5 kHz.',
        sourceSlopeDb: -6,
        formants: [
            {hz: 100, gainDb: 8, widthOctaves: 0.4},
            {hz: 200, gainDb: 10, widthOctaves: 0.5},
            {hz: 400, gainDb: 8, widthOctaves: 0.6},
            {hz: 1500, gainDb: 6, widthOctaves: 1.0},
        ],
        cutoffHz: 4000, cutoffSlopeDb: -12,
        maxHarmonics: 40,
    },
];

export const defaultInstrument = instruments[0];

export function findInstrument(id) {
    return instruments.find((instrument) => instrument.id === id) || defaultInstrument;
}

/**
 * Audible partials of a note played on `instrument`, as
 * `{harmonicNumber, levelDb}` in ascending order. harmonicNumber 1 is the
 * fundamental. The loudest partial is 0 dB; partials at or below `cutoffDb`
 * are left out, so harmonic numbers may have gaps (e.g. the clarinet's even
 * harmonics).
 */
export function audiblePartials(instrument, fundamentalHz, cutoffDb = CUTOFF_DB) {
    let levels = instrument.fixedHarmonics
        ? Array.from({length: instrument.fixedHarmonics},
            (_, index) => (index * instrument.dbPerHarmonic) || 0)
        : normalisedLevels(instrument, fundamentalHz);

    return levels
        .map((levelDb, index) => ({harmonicNumber: index + 1, levelDb}))
        .filter((partial) => partial.levelDb > cutoffDb);
}

function normalisedLevels(instrument, fundamentalHz) {
    let levels = [];
    for (let n = 1; n <= instrument.maxHarmonics; n++) {
        let frequency = fundamentalHz * n;
        if (n > 1 && frequency > MAX_PARTIAL_HZ) {
            break;
        }
        levels.push(rawLevelDb(instrument, n, frequency));
    }
    let loudest = Math.max(...levels);
    return levels.map((level) => level - loudest);
}

function rawLevelDb(instrument, n, frequency) {
    let level = instrument.sourceSlopeDb * Math.log2(n);
    for (let formant of instrument.formants) {
        level += formantGainDb(formant, frequency);
    }
    if (instrument.cutoffHz && frequency > instrument.cutoffHz) {
        level += instrument.cutoffSlopeDb * Math.log2(frequency / instrument.cutoffHz);
    }
    if (instrument.evenHarmonicDb && n % 2 === 0 && frequency < instrument.evenBelowHz) {
        level += instrument.evenHarmonicDb;
    }
    return level;
}

// Gaussian bump on a log2 frequency axis; widthOctaves is the full width at half maximum.
function formantGainDb(formant, frequency) {
    let sigma = formant.widthOctaves / 2.355;
    let distance = Math.log2(frequency / formant.hz);
    return formant.gainDb * Math.exp(-0.5 * (distance / sigma) ** 2);
}
