import {audiblePartials, CUTOFF_DB, defaultInstrument} from "./instruments";
import {centsOff} from "./tuning";
import {defaultTuningContext} from "./temperaments";

// `tuningContext` holds the frequency and the name of every pitch index in
// the current tuning; it decides the fundamentals, which note each partial
// is nearest to, and how notes are spelled.
// `customLevels` are the per-harmonic dB levels of the custom instrument.
export function calculateHarmonicMatrix(selectedNotes, instrument = defaultInstrument, tuningContext = defaultTuningContext, customLevels) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let harmonicRow = new HarmonicRow(note, instrument, tuningContext, customLevels);
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

class HarmonicRow {
    note;       // pitch index
    noteName;   // spelled in the current tuning, e.g. "Eb4"
    instrument;
    harmonics = [];

    constructor(note, instrument, tuningContext, customLevels) {
        this.note = note;
        this.noteName = tuningContext.names[note];
        this.instrument = instrument;
        let fundamental = tuningContext.frequencies[note];
        // only the audible partials; harmonic numbers may have gaps
        for (let partial of audiblePartials(instrument, fundamental, CUTOFF_DB, customLevels)) {
            this.harmonics.push(new Frequency(fundamental * partial.harmonicNumber, partial, tuningContext));
        }
    }
}

class Frequency {
    frequency;          // what sounds and is plotted: the natural multiple, or the nearest note when snapping
    naturalFrequency;   // harmonicNumber × fundamental, always
    nearestNote = '';   // name
    nearestNoteIndex;
    nearestNoteFrequency;
    // 1 = fundamental, 2 = octave, ...
    harmonicNumber;
    // level relative to the loudest partial of the note, in dB (0 = loudest)
    levelDb;
    // how far the partial is from its nearest note, in cents
    cents;

    constructor(frequency, {harmonicNumber, levelDb}, tuningContext) {
        this.naturalFrequency = frequency;
        this.harmonicNumber = harmonicNumber;
        this.levelDb = levelDb;
        let nearest = findNearestNote(frequency, tuningContext.frequencies);
        this.nearestNoteIndex = nearest;
        this.nearestNote = tuningContext.names[nearest];
        this.nearestNoteFrequency = tuningContext.frequencies[nearest];
        // snapping puts the partial exactly on its note: nothing left to be off by
        this.frequency = tuningContext.snap ? this.nearestNoteFrequency : frequency;
        this.cents = centsOff(this.frequency, this.nearestNoteFrequency);
    }

    get snapped() {
        return this.frequency !== this.naturalFrequency;
    }
}

function findNearestNote(noteFrequency, frequencies) {
    let nearest = 0;
    frequencies.forEach((frequency, index) => {
        if (Math.abs(noteFrequency - frequency) < Math.abs(noteFrequency - frequencies[nearest])) {
            nearest = index;
        }
    });
    return nearest;
}
