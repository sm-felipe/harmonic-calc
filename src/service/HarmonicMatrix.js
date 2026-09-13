import {notesMap} from "../App";
import {audiblePartials, defaultInstrument} from "./instruments";
import {centsOff} from "./tuning";

export function calculateHarmonicMatrix(selectedNotes, instrument = defaultInstrument) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let harmonicRow = new HarmonicRow(note, instrument);
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

class HarmonicRow {
    note;
    harmonics = [];

    constructor(note, instrument) {
        this.note = note;
        let fundamental = notesMap[note];
        // only the audible partials; harmonic numbers may have gaps
        for (let partial of audiblePartials(instrument, fundamental)) {
            this.harmonics.push(new Frequency(fundamental * partial.harmonicNumber, partial));
        }
    }
}

class Frequency {
    frequency;
    nearestNote = '';
    nearestNoteFrequency;
    // 1 = fundamental, 2 = octave, ...
    harmonicNumber;
    // level relative to the loudest partial of the note, in dB (0 = loudest)
    levelDb;
    // how far the partial is from its nearest equal-tempered note, in cents
    cents;

    constructor(frequency, {harmonicNumber, levelDb}) {
        this.frequency = frequency;
        this.harmonicNumber = harmonicNumber;
        this.levelDb = levelDb;
        let nearestNote = findNearestNote(frequency);
        this.nearestNote = nearestNote.note;
        this.nearestNoteFrequency = nearestNote.nearestNoteFrequency;
        this.cents = centsOff(frequency, nearestNote.nearestNoteFrequency);
    }
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
