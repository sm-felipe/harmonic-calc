import {Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import React from "react";

const data = [
    {
        frequency: 16,
        uv: 1,
    },
    {
        frequency: 32,
        uv: 1,
        pv: 1,
    },
    {
        frequency: 49,
        uv: 1,
    },
    {
        frequency: 65,
        uv: 1,
        pv: 1,
    },
    {
        frequency: 81,
        uv: 1,
        pv: 1,
    },
    {
        frequency: 98,
        pv: 1,
    },
    {
        frequency: 114,
        uv: 1,
        pv: 1,
    }
];

export function Spectogram({harmonicMatrix}) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                width={500}
                height={300}
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                {/*<CartesianGrid strokeDasharray="3 3" />*/}
                <XAxis dataKey="frequency" type="number"  />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pv" stackId="a" fill="#8884d8" />
                <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    );
}
