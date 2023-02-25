export function convertToChartData(harmonicMatrix) {
    let convertedMatrix = [];

    for (let harmonicRow of harmonicMatrix) {
        addNoteHarmonics(harmonicRow, convertedMatrix);
    }

    return convertedMatrix;
}

function addNoteHarmonics(harmonicRow, convertedMatrix) {
    let rootNoteName = harmonicRow.note;

    for (let frequencyInstance of harmonicRow.harmonics) {

        let foundFrequency = findFrequencyInData(convertedMatrix, frequencyInstance);

        if (foundFrequency) {//adding new root nome attribute to existing frequency
            foundFrequency[rootNoteName] = frequencyInstance.volume;

        } else {//creating new frequency
            let newFrequency = {
                frequency: frequencyInstance.frequency,
                [rootNoteName]: frequencyInstance.volume
            };
            convertedMatrix.push(newFrequency);

        }
    }
}
function findFrequencyInData(diffData, frequencyInstance) {
    return diffData.find((elem) => elem.frequency == frequencyInstance.frequency);
}
