export default function HarmonicTable({harmonicMatrix}) {
    // one column per harmonic number up to the highest audible one; inaudible
    // partials (below the cutoff) leave their cell empty
    let columnCount = Math.max(9, ...harmonicMatrix.map((row) => lastHarmonicNumber(row)));
    let headers = Array.from({length: columnCount}, (_, index) => columnLabel(index));

    return <div style={{overflowX: 'auto'}}>

        <h1>Selected Notes</h1>
        <table border={1}>
            <thead>
            <tr>
                {headers.map((header) => <th key={header}>{header}</th>)}
            </tr>
            </thead>
            <tbody>
            {harmonicMatrix.map((harmonicRow, index) => {
                let byHarmonicNumber = new Map(
                    harmonicRow.harmonics.map((frequency) => [frequency.harmonicNumber, frequency]));
                return <tr key={harmonicRow.note + index}>
                    {headers.map((header, column) => {
                        let frequency = byHarmonicNumber.get(column + 1);
                        if (!frequency) {
                            return <td key={header}/>;
                        }
                        let harmonic = frequency.frequency;
                        return <td
                            key={header}>
                            {(harmonic > 22000 ? '(OHR) ' : harmonic.toFixed(2))
                                + (harmonic < 20 ? '(OHR) ' : ' ')
                                + frequency.nearestNote + '(' + frequency.nearestNoteFrequency.toFixed(2) + ')'}
                            <br/>
                            <small>{frequency.levelDb.toFixed(0)} dB</small>
                        </td>
                    })}
                </tr>
            })}
            </tbody>
        </table>
    </div>;
}

function lastHarmonicNumber(row) {
    return row.harmonics.length ? row.harmonics[row.harmonics.length - 1].harmonicNumber : 0;
}

function columnLabel(index) {
    if (index === 0) {
        return 'Note';
    }
    return ordinal(index) + ' harm';
}

function ordinal(n) {
    let mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) {
        return n + 'th';
    }
    switch (n % 10) {
        case 1: return n + 'st';
        case 2: return n + 'nd';
        case 3: return n + 'rd';
        default: return n + 'th';
    }
}
