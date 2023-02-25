import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import React from "react";

export function Spectogram({harmonicMatrix}) {
    let convertedMatrix = convertToChartData(harmonicMatrix);

    console.log(convertedMatrix);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                width={500}
                height={300}
                data={convertedMatrix}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="frequency" type="number"/>
                <YAxis/>
                <Tooltip/>
                <Legend/>
                {harmonicMatrix.map((harmonicRow) => {
                    return <Bar dataKey={harmonicRow.note} stackId="a" fill={randomColor()}/>
                    }
                )}
            </BarChart>
        </ResponsiveContainer>
    );
}

function convertToChartData(harmonicMatrix) {
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

function randomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}
