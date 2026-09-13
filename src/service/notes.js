export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const OCTAVES = 11; // C0 .. E10 (125 notes)
export const NOTE_COUNT = 125;

// Note names in pitch order, C0, C#0, ... E10; the same in every tuning.
export const noteNames = Array.from({length: NOTE_COUNT},
    (_, index) => NOTE_NAMES[index % 12] + Math.floor(index / 12));

// "C#4" -> 4
export function octaveOf(note) {
    return Number(note.replace(/^[A-G]#?/, ''));
}

// "C#4" -> 1 (chromatic degree, C = 0)
export function degreeOf(note) {
    return NOTE_NAMES.indexOf(note.replace(/\d+$/, ''));
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
