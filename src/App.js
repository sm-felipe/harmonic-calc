import './App.css';
import noteFrequencyMap from './service/notes';
import {useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

export let notesMap = noteFrequencyMap(440);

const noteOptions = Object.keys(notesMap);

//TODO plot das ondas
//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO colorir as notas da série harmonica de acordo com quão desafinadas estão
//TODO player com volume control
//TODO volume de overtones
//TODO presets de instrumentos controlando os volumes dos harmonicos
//TODO instruções e créditos (TET12, 440Hz, OHR, de onde peguei presets de instrumentos, etc)
//TODO refactor: organizar classes e functions

function App() {
    let [selectedNotes, setSelectedNotes] = useState([]);
    let harmonicMatrix = calculateHarmonicMatrix(selectedNotes);

    return (
        <Stack direction={{xs: 'column', md: 'row'}}
               spacing={2}
               sx={{p: 2}}>
            <Box sx={{width: {xs: '100%', md: 280}, flexShrink: 0}}>
                <Autocomplete multiple
                              autoHighlight
                              disableCloseOnSelect
                              limitTags={8}
                              options={noteOptions}
                              value={selectedNotes}
                              onChange={selectNotes()}
                              renderInput={(params) => (
                                  <TextField {...params}
                                             label="Notes"
                                             placeholder="Type a note, e.g. A4"/>
                              )}/>
            </Box>
            <Box sx={{flexGrow: 1, minWidth: 0}}>
                <HarmonicTable harmonicMatrix={harmonicMatrix}/>
                {/*<Spectogram harmonicMatrix={harmonicMatrix}/>*/}
                <Spectogram2 harmonicMatrix={harmonicMatrix}/>
            </Box>
        </Stack>
    );

    function selectNotes() {
        // keep rows in pitch order, no matter the order the notes were picked in
        return (event, notes) => {
            setSelectedNotes([...notes].sort(
                (a, b) => noteOptions.indexOf(a) - noteOptions.indexOf(b)));
        };
    }
}


export default App;
