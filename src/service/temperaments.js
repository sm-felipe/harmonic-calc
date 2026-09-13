import {degreeOf, noteNames, NOTE_NAMES} from "./notes";

// Tuning systems. Each one defines the twelve chromatic degrees of an octave
// as frequency ratios above a reference note (the tonic). Equal temperament
// is the same from every tonic, so it has none. Every system is then anchored
// so that A4 sits exactly on the chosen reference pitch.
//
// The unequal systems use the historical twelve-note layout: a chain of
// fifths from Eb (three fifths below the tonic) to G# (eight above), so the
// wolf fifth falls between G# and Eb, as on Renaissance and Baroque keyboards.

const PYTHAGOREAN_FIFTH = 3 / 2;
const MEANTONE_FIFTH = Math.pow(5, 1 / 4); // four of them make a pure 5:4 major third

export const temperaments = [
    {
        id: 'equal',
        label: '12-tone equal temperament',
        description: 'Every semitone is 2^(1/12). All keys sound the same; fifths are 2 cents narrow, major thirds 14 cents wide.',
        needsTonic: false,
        ratios: () => Array.from({length: 12}, (_, degree) => Math.pow(2, degree / 12)),
    },
    {
        id: 'pythagorean',
        label: 'Pythagorean',
        description: 'A chain of pure 3:2 fifths. Perfect fifths and fourths; major thirds are 81:64, 22 cents wider than the 5:4 of the harmonic series.',
        needsTonic: true,
        ratios: () => fifthChainRatios(PYTHAGOREAN_FIFTH),
    },
    {
        id: 'just',
        label: 'Just intonation (5-limit)',
        description: 'Simple ratios from the tonic: 5:4 major thirds, 6:5 minor thirds, 3:2 fifths. Pure in the home key, increasingly off as you move away from it.',
        needsTonic: true,
        ratios: () => [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8],
    },
    {
        id: 'meantone',
        label: 'Quarter-comma meantone',
        description: 'Fifths narrowed by a quarter of the syntonic comma so that major thirds are pure 5:4. Sweet thirds in the common keys; a wolf fifth between G# and Eb.',
        needsTonic: true,
        ratios: () => fifthChainRatios(MEANTONE_FIFTH),
    },
];

export const defaultTemperament = temperaments[0];

export const tonicOptions = NOTE_NAMES;

// The reference pitches in common use.
export const referencePitches = [
    {hz: 415, description: 'Baroque pitch, a semitone below 440. Usual for period-instrument ensembles.'},
    {hz: 430, description: 'Classical pitch, close to what Mozart and Beethoven\'s orchestras used.'},
    {hz: 432, description: '"Verdi" pitch, proposed in 19th-century Italy and revived by the 432 Hz movement.'},
    {hz: 440, description: 'ISO 16 standard since 1955, the default for tuners and electronic instruments.'},
    {hz: 442, description: 'Common in European and many American symphony orchestras.'},
    {hz: 443, description: 'Berlin and Vienna orchestras, on the bright side of modern practice.'},
    {hz: 466, description: 'Renaissance and Baroque Chorton, a semitone above 440; typical of old church organs.'},
];

export const defaultTuning = {temperamentId: 'equal', tonic: 'C', a4: 440};

export function findTemperament(id) {
    return temperaments.find((temperament) => temperament.id === id) || defaultTemperament;
}

// Twelve degree ratios from a chain of fifths running from three fifths
// below the tonic (Eb when the tonic is C) to eight above (G#), each
// reduced into the octave.
function fifthChainRatios(fifth) {
    let ratios = new Array(12);
    for (let steps = -3; steps <= 8; steps++) {
        let ratio = Math.pow(fifth, steps);
        while (ratio >= 2) ratio /= 2;
        while (ratio < 1) ratio *= 2;
        ratios[((steps * 7) % 12 + 12) % 12] = ratio;
    }
    return ratios;
}

/**
 * Frequency of every note name, C0..E10, in the given tuning.
 * `tuning` is {temperamentId, tonic, a4}.
 */
export function buildNoteFrequencyMap({temperamentId, tonic, a4}) {
    let temperament = findTemperament(temperamentId);
    let ratios = temperament.ratios();
    let tonicDegree = temperament.needsTonic ? degreeOf(tonic) : 0;

    // relative frequencies first, then scale so that A4 lands on `a4`
    let relative = noteNames.map((note, index) => {
        let stepsFromTonic = index - tonicDegree;
        let degree = ((stepsFromTonic % 12) + 12) % 12;
        let octave = Math.floor(stepsFromTonic / 12);
        return ratios[degree] * Math.pow(2, octave);
    });
    let scale = a4 / relative[noteNames.indexOf('A4')];

    let map = {};
    noteNames.forEach((note, index) => {
        map[note] = relative[index] * scale;
    });
    return map;
}

export const defaultNotesMap = buildNoteFrequencyMap(defaultTuning);
