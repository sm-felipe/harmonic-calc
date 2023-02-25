export function convertToScartData(harmonicMatrix) {
    const datas = [];

    const volumeAccumulator = new Map();

    function getOrSetVolume(frequencyNumber, volumeAccumulator) {
        if (volumeAccumulator.has(frequencyNumber)) {
            return volumeAccumulator.get(frequencyNumber);
        }
        volumeAccumulator.set(frequencyNumber, 0);
        return 0;
    }

    for (let harmonicRow of harmonicMatrix) {
        const data = [];

        let rootNoteName = harmonicRow.note;

        for (let frequencyInstance of harmonicRow.harmonics) {
            let frequencyNumber = frequencyInstance.frequency;
            let accumulatedVolume = getOrSetVolume(frequencyNumber, volumeAccumulator);
            let point = {
                rootNoteName,
                frequency: frequencyNumber,
                volume: frequencyInstance.volume + accumulatedVolume,
            }

            volumeAccumulator.set(frequencyNumber, volumeAccumulator.get(frequencyNumber) + frequencyInstance.volume);
            data.push(point);
        }
        datas.push(data);
    }

    return datas;
}
