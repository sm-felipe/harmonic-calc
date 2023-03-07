import {notesMap} from "../App";

export function calculateHarmonicMatrix(selectedNotes) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let harmonicRow = new HarmonicRow(note);
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

class HarmonicRow {
    note;
    harmonics = [];

    constructor(note) {
        this.note = note;
        this.harmonics.push(new Frequency(notesMap[note]));
        for (let i = 1; i <= 8; i++) {
            let harmonic = calculateHarmonic(notesMap[note], i);
            this.harmonics.push(new Frequency(harmonic));
        }
    }
}

class Frequency {
    frequency;
    nearestNote = '';
    nearestNoteFrequency;
    volume = 0.5;

    constructor(frequency) {
        this.frequency = frequency;
        let nearestNote = findNearestNote(frequency);
        this.nearestNote = nearestNote.note;
        this.nearestNoteFrequency = nearestNote.nearestNoteFrequency;
    }
}

function calculateHarmonic(noteFrequency, harmonicNumber) {
    return noteFrequency * (harmonicNumber + 1);
}

function findNearestNote(noteFrequency) {
    let nearestNoteFrequency = 0;
    let nearestNote = '';
    for (let [note, frequency] of Object.entries(notesMap)) {
        if (Math.abs(noteFrequency - frequency) < Math.abs(noteFrequency - nearestNoteFrequency)) {
            nearestNoteFrequency = frequency;
            nearestNote = note;
        }
    }
    return {
        note: nearestNote,
        nearestNoteFrequency: nearestNoteFrequency
    };
}
