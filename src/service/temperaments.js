import {degreeOf, NOTE_COUNT, octaveOf, indexOfNote} from "./notes";
import {buildNoteNames, findKey} from "./spelling";

// Tuning systems. Each one defines the twelve chromatic degrees of an octave
// as frequency ratios above the tonic of the chosen key. Equal temperament
// is the same from every tonic. Every system is then anchored so that A4
// sits exactly on the chosen reference pitch.
//
// The unequal systems use the historical twelve-note layout: a chain of
// fifths from three below the tonic (Eb in C) to eight above (G#), so the
// wolf fifth falls between G# and Eb, as on Renaissance and Baroque
// keyboards. The same chain decides how the notes are spelled.

const PYTHAGOREAN_FIFTH = 3 / 2;
const MEANTONE_FIFTH = Math.pow(5, 1 / 4); // four of them make a pure 5:4 major third

export const temperaments = [
    {
        id: 'equal',
        label: '12-tone equal temperament',
        description: 'Every semitone is 2^(1/12). All keys sound the same; fifths are 2 cents narrow, major thirds 14 cents wide. The key only decides how notes are spelled.',
        retunesByKey: false,
        spelling: 'chain',
        ratios: () => Array.from({length: 12}, (_, degree) => Math.pow(2, degree / 12)),
    },
    {
        id: 'pythagorean',
        label: 'Pythagorean',
        description: 'A chain of pure 3:2 fifths. Perfect fifths and fourths; major thirds are 81:64, 22 cents wider than the 5:4 of the harmonic series.',
        retunesByKey: true,
        spelling: 'chain',
        ratios: () => fifthChainRatios(PYTHAGOREAN_FIFTH),
    },
    {
        id: 'just',
        label: 'Just intonation (5-limit)',
        description: 'Simple ratios from the tonic: 5:4 major thirds, 6:5 minor thirds, 3:2 fifths. Pure in the home key, increasingly off as you move away from it.',
        retunesByKey: true,
        spelling: 'just',
        ratios: () => [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8],
    },
    {
        id: 'meantone',
        label: 'Quarter-comma meantone',
        description: 'Fifths narrowed by a quarter of the syntonic comma so that major thirds are pure 5:4. Sweet thirds in the common keys; a wolf fifth between G# and Eb.',
        retunesByKey: true,
        spelling: 'chain',
        ratios: () => fifthChainRatios(MEANTONE_FIFTH),
    },
];

export const defaultTemperament = temperaments[0];

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

// accidentals: 'auto' follows the key and temperament; 'sharps' / 'flats'
// force a spelling, which only makes sense in equal temperament
export const accidentalOptions = [
    {id: 'auto', label: 'Automatic', description: 'Spelled from the key: the chain of fifths around its tonic.'},
    {id: 'sharps', label: 'Sharps', description: 'Every accidental as a sharp: C#, D#, F#, G#, A#.'},
    {id: 'flats', label: 'Flats', description: 'Every accidental as a flat: Db, Eb, Gb, Ab, Bb.'},
];

// snap: move every partial onto the nearest note of the temperament instead
// of its natural multiple of the fundamental
export const defaultTuning = {temperamentId: 'equal', keyId: 'C', a4: 440, accidentals: 'auto', snap: false};

export function findTemperament(id) {
    return temperaments.find((temperament) => temperament.id === id) || defaultTemperament;
}

// Twelve degree ratios from a chain of fifths running from three fifths
// below the tonic to eight above, each reduced into the octave.
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

const A4 = indexOfNote('A4');

/** Frequency of every pitch index in the given tuning. */
export function buildNoteFrequencies({temperamentId, keyId, a4}) {
    let temperament = findTemperament(temperamentId);
    let ratios = temperament.ratios();
    let tonicDegree = temperament.retunesByKey ? findKey(keyId).tonicDegree : 0;

    // relative frequencies first, then scale so that A4 lands on `a4`
    let relative = Array.from({length: NOTE_COUNT}, (_, index) => {
        let stepsFromTonic = index - tonicDegree;
        let degree = ((stepsFromTonic % 12) + 12) % 12;
        let octave = Math.floor(stepsFromTonic / 12);
        return ratios[degree] * Math.pow(2, octave);
    });
    let scale = a4 / relative[A4];
    return relative.map((frequency) => frequency * scale);
}

/** Name of every pitch index in the given tuning. */
export function buildNoteNamesFor({temperamentId, keyId, accidentals}) {
    let temperament = findTemperament(temperamentId);
    let scheme = temperament.spelling;
    if (temperament.id === 'equal' && accidentals && accidentals !== 'auto') {
        scheme = accidentals;
    }
    return buildNoteNames(findKey(keyId), scheme);
}

/**
 * Everything the rest of the app needs to know about the current tuning:
 * the frequency and the name of every pitch index.
 */
export function buildTuningContext(tuning) {
    return {
        frequencies: buildNoteFrequencies(tuning),
        names: buildNoteNamesFor(tuning),
        snap: Boolean(tuning.snap),
    };
}

export const defaultTuningContext = buildTuningContext(defaultTuning);

export {degreeOf, octaveOf};
