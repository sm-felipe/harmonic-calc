export function calculateHarmonicMatrix(selectedNotes, notesMap) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let baseNoteFrequency = notesMap[note];
        let harmonicRow = [];
        harmonicRow.push(baseNoteFrequency);
        for (let i = 1; i <= 8; i++) {
            let harmonic = calculateHarmonic(baseNoteFrequency, i);
            harmonicRow.push(harmonic);
        }
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

function calculateHarmonic(noteFrequency, harmonicNumber) {
    return noteFrequency * (harmonicNumber + 1);
}
