import './App.css';
import noteFrequencyMap from './service/notes';
import {useMemo, useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";
import Player from "./components/Player";
import InstrumentGroup from "./components/InstrumentGroup";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {defaultInstrument, findInstrument} from "./service/instruments";

export let notesMap = noteFrequencyMap(440);

const noteOptions = Object.keys(notesMap);

//TODO plot das ondas
//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO instruções e créditos (TET12, 440Hz, OHR, de onde peguei presets de instrumentos, etc)
//TODO refactor: organizar classes e functions

let nextGroupId = 1;

function newGroup() {
    return {id: nextGroupId++, instrumentId: defaultInstrument.id, notes: []};
}

function App() {
    let [groups, setGroups] = useState(() => [newGroup()]);

    // memoised so the player only restarts when the sound actually changes
    let harmonicMatrix = useMemo(
        () => groups.flatMap((group) => calculateHarmonicMatrix(group.notes, findInstrument(group.instrumentId))),
        [groups]);

    function updateGroup(updated) {
        setGroups(groups.map((group) => group.id === updated.id ? updated : group));
    }

    function removeGroup(id) {
        setGroups(groups.filter((group) => group.id !== id));
    }

    // Desktop: player above the selectors in a left column, results on the
    // right. Phone: selectors first to invite interaction, then table, chart
    // and the player last.
    return (
        <Box sx={{
            p: 2,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)'},
            gridTemplateRows: {md: 'auto 1fr'},
            gridTemplateAreas: {
                xs: '"selectors" "results" "player"',
                md: '"player results" "selectors results"',
            },
        }}>
            <Box sx={{gridArea: 'player', pr: {md: 1}}}>
                <Player harmonicMatrix={harmonicMatrix}/>
            </Box>
            <Stack spacing={2} sx={{gridArea: 'selectors'}}>
                {groups.map((group, index) => (
                    <InstrumentGroup key={group.id}
                                     index={index}
                                     group={group}
                                     noteOptions={noteOptions}
                                     canRemove={groups.length > 1}
                                     onChange={updateGroup}
                                     onRemove={() => removeGroup(group.id)}/>
                ))}
                <Button variant="outlined" onClick={() => setGroups([...groups, newGroup()])}>
                    + Add instrument
                </Button>
            </Stack>
            <Box sx={{gridArea: 'results', minWidth: 0}}>
                <HarmonicTable harmonicMatrix={harmonicMatrix}/>
                {/*<Spectogram harmonicMatrix={harmonicMatrix}/>*/}
                <Spectogram2 harmonicMatrix={harmonicMatrix}/>
            </Box>
        </Box>
    );
}

export default App;
