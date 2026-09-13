import {Axis, BarSeries, Plot} from "react-plot";
import {CUTOFF_DB} from "../service/instruments";
import {tuningColor} from "../service/tuning";

// The model gives levels relative to each note's loudest partial (0 dB). The
// plot shows them as bars rising from the audibility cutoff, so a taller bar
// is a louder partial: y = REFERENCE_DB + levelDb, loudest partial at REFERENCE_DB.
const REFERENCE_DB = 80;
const FLOOR_DB = REFERENCE_DB + CUTOFF_DB;

export function Spectogram2({harmonicMatrix, instrument}) {
    //each line is a series
    let convertedMatrix = convertToPlotData(harmonicMatrix);

    let seriesElems = [];
    convertedMatrix.forEach((harmonicRow, index) => {
        seriesElems.push(<BarSeries key={index + 'bar'}
                                    data={harmonicRow}
                                    displayMarkers={true}
                                    label={harmonicMatrix[index].noteName + ' · ' + harmonicMatrix[index].instrument.label}
                                    pointLabel={({nearestNote}) => nearestNote}
                                    pointLabelStyle={{
                                        fill: ({cents}) => tuningColor(cents),
                                    }}
        />)
    });


    //TODO make the plot width responsive instead of scrolling (recharts ResponsiveContainer)
    return <div style={{overflowX: 'auto'}}>
        <Plot width={900} height={300} margin={{
            left: 40,
            right: 40,
            top: 40,
            bottom: 40
        }}>
            {seriesElems}
            <Axis position="left" label={`dB (loudest partial = ${REFERENCE_DB})`}
                  min={FLOOR_DB} max={REFERENCE_DB + 5}/>
            <Axis position="bottom" label="Frequency" paddingStart={20}
                  paddingEnd={50}/>{/*    TODO configurable padding */}
        </Plot>
    </div>
}

function convertToPlotData(harmonicMatrix) {
    let converted = [];
    for (let harmonicRow of harmonicMatrix) {
        let convertedRow = [];
        for (let i = 0; i < harmonicRow.harmonics.length; i++) {
            let frequencyInstance = harmonicRow.harmonics[i];
            let point = {
                x: frequencyInstance.frequency,
                y: REFERENCE_DB + frequencyInstance.levelDb,
                nearestNote: frequencyInstance.nearestNote,
                cents: frequencyInstance.cents
            }
            convertedRow.push(point);
        }
        converted.push(convertedRow);
    }

    return converted;
}

