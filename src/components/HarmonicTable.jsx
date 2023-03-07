export default function HarmonicTable({harmonicMatrix}) {
    return <div style={{maxWidth: '80px'}}>

        <h1>Selected Notes</h1>
        <table border={1}>
            <thead>
            <tr>
                <th>Note</th>
                <th>1st harm</th>
                <th>2nd harm</th>
                <th>3rd harm</th>
                <th>4th harm</th>
                <th>5th harm</th>
                <th>6th harm</th>
                <th>7th harm</th>
                <th>8th harm</th>
            </tr>
            </thead>
            <tbody>
            {harmonicMatrix.map((harmonicRow, index) => {
                return <tr key={harmonicRow + index}>
                    {harmonicRow.harmonics.map((frequency) => {
                        let harmonic = frequency.frequency;
                        return <td
                            key={harmonic}>
                            {(harmonic > 22000 ? '(OHR) ' : harmonic.toFixed(2))
                                + (harmonic < 20 ? '(OHR) ' : ' ')
                                + frequency.nearestNote + '(' + frequency.nearestNoteFrequency.toFixed(2) + ')'}
                        </td>
                    })}
                </tr>
            })}
            </tbody>
        </table>
    </div>;
}

