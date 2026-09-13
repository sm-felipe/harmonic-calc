export default function noteFrequencyMap(middleAFreq) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteFrequencyMap = {}
    const C0semitonesDistance = -57;
    for (let i = 0; i < 109 + 16; i++) {
        const note = notes[i % 12];
        const octave = Math.floor(i / 12);
        noteFrequencyMap[note + octave] = calculateNote(middleAFreq, C0semitonesDistance + i);
    }
    return noteFrequencyMap;
}
function calculateNote (middleAFreq, semitonesDistance) {
    return middleAFreq * Math.pow(2, semitonesDistance / 12);
}

// "C#4" -> 4
export function octaveOf(note) {
    return Number(note.replace(/^[A-G]#?/, ''));
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
