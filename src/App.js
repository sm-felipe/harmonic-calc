import './App.css';
import noteFrequencyMap from './service/notes';
import {useMemo, useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";
import Player from "./components/Player";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import {defaultInstrument, findInstrument, instruments} from "./service/instruments";

export let notesMap = noteFrequencyMap(440);

const noteOptions = Object.keys(notesMap);

//TODO plot das ondas
//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO colorir as notas da série harmonica de acordo com quão desafinadas estão
//TODO volume de overtones
//TODO instruções e créditos (TET12, 440Hz, OHR, de onde peguei presets de instrumentos, etc)
//TODO refactor: organizar classes e functions

function App() {
    let [selectedNotes, setSelectedNotes] = useState([]);
    let [instrumentId, setInstrumentId] = useState(defaultInstrument.id);
    let instrument = findInstrument(instrumentId);
    // memoised so the player only restarts when the sound actually changes
    let harmonicMatrix = useMemo(
        () => calculateHarmonicMatrix(selectedNotes, instrument),
        [selectedNotes, instrument]);

    return (
        <Stack direction={{xs: 'column', md: 'row'}}
               spacing={2}
               sx={{p: 2}}>
            <Stack spacing={2} sx={{width: {xs: '100%', md: 280}, flexShrink: 0}}>
                <TextField select
                           label="Instrument"
                           value={instrumentId}
                           onChange={(event) => setInstrumentId(event.target.value)}
                           helperText={instrument.description}>
                    {instruments.map((option) => (
                        <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                    ))}
                </TextField>
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
                <Player harmonicMatrix={harmonicMatrix}/>
            </Stack>
            <Box sx={{flexGrow: 1, minWidth: 0}}>
                <HarmonicTable harmonicMatrix={harmonicMatrix}/>
                {/*<Spectogram harmonicMatrix={harmonicMatrix}/>*/}
                <Spectogram2 harmonicMatrix={harmonicMatrix} instrument={instrument}/>
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
