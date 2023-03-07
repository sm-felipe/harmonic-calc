import {Axis, BarSeries, LineSeries, Plot, ScatterSeries} from "react-plot";

export function Spectogram2({harmonicMatrix}) {
    //each line is a series
    let convertedMatrix = convertToPlotData(harmonicMatrix);

    let seriesElems = [];
    convertedMatrix.forEach((harmonicRow, index) => {
        let fill = randomColor();
        seriesElems.push(<ScatterSeries key={index + 'scatter'}
                                        data={harmonicRow}
                                        label={harmonicMatrix[index].note}
                                        markerStyle={{
                                            fill: fill,
                                            stroke: fill,
                                        }}
                                        pointLabel={({nearestNote }) => nearestNote}
        />)
        seriesElems.push(<BarSeries key={index + 'bar'}
                                    data={harmonicRow}
                                    label={harmonicMatrix[index].note}
        />)
    });


    return <Plot width={900} height={300} margin={{
        left: 40,
        right: 40,
        top: 40,
        bottom: 40
    }}>
        {seriesElems}
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
                nearestNote : frequencyInstance.nearestNote
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
