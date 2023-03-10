import './App.css';
import noteFrequencyMap from './service/notes';
import {useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";

export let notesMap = noteFrequencyMap(440);



//TODO plot das ondas
//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO colorir as notas da série harmonica de acordo com quão desafinadas estão
//TODO player com volume control
//TODO volume de overtones
//TODO presets de instrumentos controlando os volumes dos harmonicos
//TODO instruções e créditos (TET12, 440Hz, OHR, de onde peguei presets de instrumentos, etc)
//TODO react select (ou outra lib visual) para escolher componentes
//TODO refactor: organizar classes e functions

function App() {
    let [selectedNotes, setSelectedNotes] = useState([]);
    let harmonicMatrix = calculateHarmonicMatrix(selectedNotes);

    return (
        <>
            <div className={'flex-container'}>
                <div className={'flex-child'} style={{maxWidth: '40px'}}>
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
                    <HarmonicTable harmonicMatrix={harmonicMatrix} />
                    {/*<Spectogram harmonicMatrix={harmonicMatrix}/>*/}
                    <Spectogram2 harmonicMatrix={harmonicMatrix}/>
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
