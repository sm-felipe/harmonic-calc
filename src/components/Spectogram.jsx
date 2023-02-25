import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import React from "react";
import {convertToChartData} from "./BarChartFuncs";

export function Spectogram({harmonicMatrix}) {
    let convertedMatrix = convertToChartData(harmonicMatrix);

    return (
        <>
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
        </>

    );
}

function randomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}
