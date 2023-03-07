import {Axis, BarSeries, Plot} from "react-plot";

export function Spectogram2({harmonicMatrix}) {
    //each line is a series
    let convertedMatrix = convertToPlotData(harmonicMatrix);

    let seriesElems = [];
    convertedMatrix.forEach((harmonicRow, index) => {
        seriesElems.push(<BarSeries key={index + 'bar'}
                                    data={harmonicRow}
                                    displayMarkers={true}
                                    label={harmonicMatrix[index].note}
                                    pointLabel={({nearestNote}) => nearestNote}
                                    pointLabelStyle={{
                                        fill: ({isNoteInTune}) => isNoteInTune ? 'green' : 'red',
                                    }}
        />)
    });


    return <Plot width={900} height={300} margin={{
        left: 40,
        right: 40,
        top: 40,
        bottom: 40
    }}>
        {seriesElems}
        <Axis position="left" label="Decibels" paddingStart={0.01} paddingEnd={0.01}  />
        <Axis position="bottom" label="Frequency" paddingStart={20}
              paddingEnd={50}/>{/*    TODO configurable padding */}
    </Plot>
}

function convertToPlotData(harmonicMatrix) {
    let converted = [];
    for (let harmonicRow of harmonicMatrix) {
        let convertedRow = [];
        for (let i = 0; i < harmonicRow.harmonics.length; i++) {
            let frequencyInstance = harmonicRow.harmonics[i];
            let point = {
                x: frequencyInstance.frequency,
                y: frequencyInstance.volume - (i * 0.01),
                nearestNote: frequencyInstance.nearestNote,
                isNoteInTune: frequencyInstance.frequency - frequencyInstance.nearestNoteFrequency < 0.001
            }
            convertedRow.push(point);
        }
        converted.push(convertedRow);
    }

    return converted;
}

function randomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}
