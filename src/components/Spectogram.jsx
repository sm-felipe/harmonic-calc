import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import React from "react";
import {convertToChartData} from "./BarChartFuncs";
import {convertToScartData} from "./ScatterGraph";

export function Spectogram({harmonicMatrix}) {
    let convertedMatrix = convertToChartData(harmonicMatrix);

    let scatterData = convertToScartData(harmonicMatrix);
    console.log(scatterData);

    return (
        <>
            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart
                    width={500}
                    height={300}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis type="number" dataKey="frequency" name="frequency" unit="hz"/>
                    <YAxis type="number" dataKey="volume" name="volume" unit="db"/>
                    <Tooltip cursor={{strokeDasharray: '3 3'}}/>
                    <Legend/>
                    {scatterData.map((harmonicRow) => {
                            return <Scatter key={harmonicRow[0].rootNoteName} name={harmonicRow[0].rootNoteName} data={harmonicRow} line fill={randomColor()}/>
                        }
                    )}
                </ScatterChart>
            </ResponsiveContainer>
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
                            return <Bar key={harmonicRow.note} dataKey={harmonicRow.note} stackId="a" fill={randomColor()}/>
                        }
                    )}
                </BarChart>
            </ResponsiveContainer>

        </>

    );
}

function randomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}
