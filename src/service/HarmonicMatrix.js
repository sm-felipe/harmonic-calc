export function calculateHarmonicMatrix(selectedNotes, notesMap) {
    let harmonicMatrix = [];
    selectedNotes.forEach((note) => {
        let noteFrequency = notesMap[note];
        let harmonicRow = [];
        for (let i = 1; i <= 9; i++) {
            let harmonic = calculateHarmonic(noteFrequency, i);
            harmonicRow.push(harmonic);
        }
        harmonicMatrix.push(harmonicRow);
    });
    return harmonicMatrix;
}

function calculateHarmonic(noteFrequency, harmonicNumber) {
    let number = noteFrequency * (harmonicNumber + 1);
    if (number > 22000 || number < 20) return 'OHR';
    return number;
}
