import {Axis, BarSeries, LineSeries, Plot, ScatterSeries} from "react-plot";

export function Spectogram2({harmonicMatrix}) {
    //each line is a series
    let convertedMatrix = convertToPlotData(harmonicMatrix);


    return <Plot width={900} height={300} margin={{
        left: 40,
        right: 40,
        top: 40,
        bottom: 40
    }}>
        {convertedMatrix.map((series, index) =>
            <ScatterSeries key={index}
                           data={series}
                           label={harmonicMatrix[index].note}
            />)
        }
        {convertedMatrix.map((series, index) =>
            <BarSeries key={index}
                           data={series}
                           label={harmonicMatrix[index].note}
            />)
        }
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
                y: frequencyInstance.volume - (i * 0.01)
            }
            convertedRow.push(point);
        }
        converted.push(convertedRow);
    }

    return converted;
}
