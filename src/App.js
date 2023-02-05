import './App.css';
import noteFrequencyMap from './notes';
import {useState} from "react";

function calculateHarmonic(noteFrequency, harmonicNumber) {
    return noteFrequency * harmonicNumber;
}

function App() {
    let [selectedNotes, setSelectedNotes] = useState([]);

    let notesMap = noteFrequencyMap(440);

    return (
        <>
            <div className={'flex-container'}>
                <div className={'flex-child'}>
                    <h1>Options</h1>
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
                        {selectedNotes.map((note) => {
                                return <tr key={note}>
                                    <td>{note + '(' + notesMap[note] + ')'}</td>
                                    <td>{calculateHarmonic(notesMap[note], 1)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 2)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 3)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 4)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 5)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 6)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 7)}</td>
                                    <td>{calculateHarmonic(notesMap[note], 8)}</td>
                                </tr>
                            }
                        )}
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
