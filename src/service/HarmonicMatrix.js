class Frequency {
    frequency;

    constructor(frequency) {
        this.frequency = frequency;
    }
}

export function calculateHarmonicMatrix(selectedNotes, notesMap) {
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
