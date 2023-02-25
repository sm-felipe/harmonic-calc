import {notesMap} from "../App";

class Frequency {
    frequency;
    nearestNoteTxt;
    volume = 0.5;

    constructor(frequency) {
        this.frequency = frequency;
        this.nearestNoteTxt = findNearestNoteFrequency(frequency);
    }
}

export function calculateHarmonicMatrix(selectedNotes) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let baseNoteFrequency = notesMap[note];
        let harmonicRow = [];
        harmonicRow.push(new Frequency(baseNoteFrequency));
        for (let i = 1; i <= 8; i++) {
            let harmonic = calculateHarmonic(baseNoteFrequency, i);
            harmonicRow.push(new Frequency(harmonic));
        }
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

function calculateHarmonic(noteFrequency, harmonicNumber) {
    return noteFrequency * (harmonicNumber + 1);
}

function findNearestNoteFrequency(noteFrequency) {
    let nearestNoteFrequency = 0;
    let nearestNote = '';
    for (let [note, frequency] of Object.entries(notesMap)) {
        if (Math.abs(noteFrequency - frequency) < Math.abs(noteFrequency - nearestNoteFrequency)) {
            nearestNoteFrequency = frequency;
            nearestNote = note;
        }
    }
    return nearestNote + '(' + nearestNoteFrequency.toFixed(2) + ')';
}
