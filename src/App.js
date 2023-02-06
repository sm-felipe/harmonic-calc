import './App.css';
import noteFrequencyMap from './notes';
import {useState} from "react";

let notesMap = noteFrequencyMap(440);
function calculateHarmonic(noteFrequency, harmonicNumber) {
    let number = noteFrequency * (harmonicNumber + 1);
    if(number > 22000 || number < 20) return 'OHR';
    return number;
}

function findNearestNoteFrequency(noteFrequency, notesMap) {
    let nearestNoteFrequency = 0;
    let nearestNote = '';
    for (let [note, frequency] of Object.entries(notesMap)) {
        if (Math.abs(noteFrequency - frequency) < Math.abs(noteFrequency - nearestNoteFrequency)) {
            nearestNoteFrequency = frequency;
            nearestNote = note;
        }
    }
    return nearestNote + '(' + nearestNoteFrequency.toFixed(2) + ')';
}

function App() {
    let [selectedNotes, setSelectedNotes] = useState([]);

    let harmonicMatrix = [];
    selectedNotes.map((note) => {
        let noteFrequency = notesMap[note];
        let harmonicRow = [];
        for (let i = 1; i <= 8; i++) {
            let harmonic = calculateHarmonic(noteFrequency, i);
            harmonicRow.push(harmonic);
        }
        harmonicMatrix.push(harmonicRow);
    });

    return (
        <>
            <div className={'flex-container'} style={{maxWidth: '80px'}}>
                <div className={'flex-child'}>
                    <select multiple={true}
                            onChange={selectNotes()}
                            style={{height: '90vh', width: '40px'}}>
                        {Object.entries(notesMap).map(([note]) => {
                            return <option key={note}
                                           value={note}>{note}</option>
                        })
                        }
                    </select>
                </div>
                <div className={'flex-child'}>
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
                        {harmonicMatrix.map((harmonicRow) => {
                            return <tr key={harmonicRow}>
                                {harmonicRow.map((harmonic) => {
                                    return <td key={harmonic}>{harmonic.toFixed(2) + ' ' + findNearestNoteFrequency(harmonic, notesMap)}</td>
                                })}
                            </tr>
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    function selectNotes() {
        return (e) => {
            let selectedOptions = e.target.selectedOptions;
            let selectedNotes = [];
            for (let i = 0; i < selectedOptions.length; i++) {
                selectedNotes.push(selectedOptions[i].value);
            }
            setSelectedNotes(selectedNotes);
        };
    }
}


export default App;
