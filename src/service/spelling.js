import {degreeOf, NOTE_COUNT, octaveOf} from "./notes";

// Note names from positions on the chain of fifths.
//
// Every spelled note is a position on the line of fifths: ... Bb(-2) F(-1)
// C(0) G(1) D(2) A(3) E(4) B(5) F#(6) C#(7) ... Two positions twelve apart
// (Eb at -3, D# at 9) are the same key on a twelve-note keyboard, and the
// same pitch in equal temperament, but different pitches in Pythagorean or
// meantone tuning. Which of the two a key uses is decided by the tonality:
// the twelve notes are the chain from three fifths below the tonic to eight
// above, the Renaissance/Baroque layout (Eb..G# around C).

const LETTERS_BY_FIFTH = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

function mod(n, m) {
    return ((n % m) + m) % m;
}

export function nameOfFifthPosition(position) {
    let letter = LETTERS_BY_FIFTH[mod(position + 1, 7)];
    let accidentals = Math.floor((position + 1) / 7);
    return letter + (accidentals > 0 ? '#'.repeat(accidentals) : 'b'.repeat(-accidentals));
}

export function degreeOfFifthPosition(position) {
    return mod(position * 7, 12);
}

// The keys of the circle of fifths, from six flats to six sharps. `fifths`
// is the tonic's position on the line of fifths.
export const keys = Array.from({length: 13}, (_, i) => {
    let fifths = i - 6;
    let major = nameOfFifthPosition(fifths);
    let minor = nameOfFifthPosition(fifths + 3);
    return {
        id: major,
        fifths,
        tonicDegree: degreeOfFifthPosition(fifths),
        label: `${major} major / ${minor} minor`,
        // for the sound bar, where "C major / A minor" would not fit
        short: `${major}/${minor}m`,
    };
});

export const defaultKey = keys.find((key) => key.id === 'C');

export function findKey(id) {
    return keys.find((key) => key.id === id) || defaultKey;
}

// Positions relative to the tonic
export const CHAIN_POSITIONS = Array.from({length: 12}, (_, i) => i - 3);           // Eb .. G# around C
export const JUST_POSITIONS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];              // Db Eb F# Ab Bb: the 5-limit spellings
// Absolute positions (ignore the key): every chromatic note as a sharp / as a flat
const SHARP_POSITIONS = [0, 7, 2, 9, 4, -1, 6, 1, 8, 3, 10, 5];
const FLAT_POSITIONS = [0, -5, 2, -3, 4, -1, -6, 1, -4, 3, -2, 5];

/**
 * Names of the twelve chromatic degrees (C = 0) for a key and spelling
 * scheme. `scheme` is 'chain' (unequal temperaments and the default),
 * 'just', 'sharps' or 'flats'.
 *
 * Readability wins over strict chain spelling for notes outside the key's
 * scale: a chromatic note that would need a double accidental (F## in F#
 * major) or an accidental on a natural pitch (B# in E major, Cb in Ab
 * major) is spelled from the other end of the chain instead (G, C, B).
 * Diatonic notes keep their proper names, so F# major still has E#.
 */
export function degreeNames(key, scheme = 'chain') {
    let positions;
    if (scheme === 'sharps') {
        positions = SHARP_POSITIONS;
    } else if (scheme === 'flats') {
        positions = FLAT_POSITIONS;
    } else {
        let relative = scheme === 'just' ? JUST_POSITIONS : CHAIN_POSITIONS;
        positions = relative.map((position) => position + key.fifths);
    }

    let names = new Array(12);
    for (let position of positions) {
        let accidentals = Math.floor((position + 1) / 7);
        let diatonic = position >= key.fifths - 1 && position <= key.fifths + 5;
        let awkward = Math.abs(accidentals) >= 2 || (!diatonic && isAccidentalOnNatural(position));
        if (awkward) {
            position += accidentals > 0 ? -12 : 12;
        }
        names[degreeOfFifthPosition(position)] = nameOfFifthPosition(position);
    }
    return names;
}

// E#, B#, Cb, Fb: an accidental whose enharmonic is a plain natural
function isAccidentalOnNatural(position) {
    return position === 11 || position === 12 || position === -7 || position === -8;
}

/**
 * Name of every pitch index, e.g. "Eb4". The octave number follows the
 * letter, as in scientific pitch notation: B#3 is the pitch of C4 and Cb4
 * the pitch of B3.
 */
export function buildNoteNames(key, scheme = 'chain') {
    let names = degreeNames(key, scheme);
    return Array.from({length: NOTE_COUNT}, (_, index) => {
        let name = names[degreeOf(index)];
        let octave = octaveOf(index);
        if (name.startsWith('B#')) octave -= 1;
        if (name.startsWith('Cb')) octave += 1;
        return name + octave;
    });
}

// Every spelling a pitch may go by, for searching: "C#4 Db4"
export function searchNamesOf(index) {
    let sharps = degreeNames(defaultKey, 'sharps')[degreeOf(index)];
    let flats = degreeNames(defaultKey, 'flats')[degreeOf(index)];
    let octave = octaveOf(index);
    return sharps === flats ? [sharps + octave] : [sharps + octave, flats + octave];
}
