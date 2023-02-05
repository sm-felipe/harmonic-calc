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
