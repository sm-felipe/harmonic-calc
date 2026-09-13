import {audiblePartials, defaultInstrument} from "./instruments";
import {centsOff} from "./tuning";
import {defaultNotesMap} from "./temperaments";

// `notesMap` is the frequency of every note name in the current tuning; it
// decides both the fundamentals and which note each partial is nearest to.
export function calculateHarmonicMatrix(selectedNotes, instrument = defaultInstrument, notesMap = defaultNotesMap) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let harmonicRow = new HarmonicRow(note, instrument, notesMap);
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

class HarmonicRow {
    note;
    instrument;
    harmonics = [];

    constructor(note, instrument, notesMap) {
        this.note = note;
        this.instrument = instrument;
        let fundamental = notesMap[note];
        // only the audible partials; harmonic numbers may have gaps
        for (let partial of audiblePartials(instrument, fundamental)) {
            this.harmonics.push(new Frequency(fundamental * partial.harmonicNumber, partial, notesMap));
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

    constructor(frequency, {harmonicNumber, levelDb}, notesMap) {
        this.frequency = frequency;
        this.harmonicNumber = harmonicNumber;
        this.levelDb = levelDb;
        let nearestNote = findNearestNote(frequency, notesMap);
        this.nearestNote = nearestNote.note;
        this.nearestNoteFrequency = nearestNote.nearestNoteFrequency;
        this.cents = centsOff(frequency, nearestNote.nearestNoteFrequency);
    }
}

function findNearestNote(noteFrequency, notesMap) {
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
