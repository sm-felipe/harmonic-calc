// Notes are identified by a pitch index: 0 = C0, 1 = C#0/Db0, ... 124 = E10.
// How a pitch is spelled (D# or Eb) depends on the key and the temperament,
// see spelling.js; how it is tuned depends on the temperament, see
// temperaments.js. This module only knows about the indices themselves.

export const NOTE_COUNT = 125;

export const pitchIndices = Array.from({length: NOTE_COUNT}, (_, index) => index);

export function octaveOf(index) {
    return Math.floor(index / 12);
}

export function degreeOf(index) {
    return index % 12;
}

const LETTER_DEGREES = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};

/**
 * Pitch index of a note written as letter, accidentals and octave: "C#4",
 * "Eb3", "B#3" (= C4), "Cb4" (= B3). Accepts # / b / ♯ / ♭ and any case.
 * Returns undefined when the text is not a note.
 */
export function indexOfNote(text) {
    let match = /^([A-Ga-g])([#♯b♭]*)(\d+)$/.exec(text.trim());
    if (!match) {
        return undefined;
    }
    let [, letter, accidentals, octave] = match;
    let degree = LETTER_DEGREES[letter.toUpperCase()];
    let shift = 0;
    for (let mark of accidentals) {
        shift += (mark === '#' || mark === '♯') ? 1 : -1;
    }
    let index = Number(octave) * 12 + degree + shift;
    return index >= 0 && index < NOTE_COUNT ? index : undefined;
}

// Landmarks shown next to the octave headers in the note picker, to help
// people find their way around. Not every octave needs one.
export const octaveHints = {
    0: 'E0 ≈ 20 Hz, lowest audible · A0, lowest piano key',
    2: 'E2, lowest guitar string',
    4: 'C4, middle C · A4 = 440 Hz',
    6: 'C6, soprano high C',
    8: 'C8, highest piano key',
    10: 'D#10 ≈ 20 kHz, highest audible',
};
