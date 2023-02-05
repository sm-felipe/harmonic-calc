import './App.css';
import noteFrequencyMap from './notes';

function App() {


    let notesMap = noteFrequencyMap(440);
    return (
        <>
            <div>
                <h1>Options</h1>
            </div>
            <select multiple={true} style={{height:'90vh', width: '40px'}}>
                {Object.entries(notesMap).map(([note, freq]) => {
                    return <option value={note}>{note}</option>
                })
                }

            </select>
            <div>

            </div>
        </>
    );
}


export default App;
