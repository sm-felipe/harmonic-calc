import './App.css';
import {useMemo, useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";
import Player from "./components/Player";
import InstrumentGroup from "./components/InstrumentGroup";
import TopBar from "./components/TopBar";
import OptionsDrawer from "./components/OptionsDrawer";
import TuningOptions from "./components/TuningOptions";
import DisplayOptions from "./components/DisplayOptions";
import Waveform from "./components/Waveform";
import Divider from '@mui/material/Divider';
import {buildTuningContext, defaultTuning} from "./service/temperaments";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {defaultInstrument, findInstrument} from "./service/instruments";

//TODO plot das ondas
//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO instruções e créditos (TET12, 440Hz, OHR, de onde peguei presets de instrumentos, etc)
//TODO refactor: organizar classes e functions

let nextGroupId = 1;

function newGroup() {
    return {id: nextGroupId++, instrumentId: defaultInstrument.id, notes: [], harmonicLevels: defaultInstrument.defaultLevels};
}

function App() {
    let [groups, setGroups] = useState(() => [newGroup()]);
    let [menuOpen, setMenuOpen] = useState(false);
    let [tuning, setTuning] = useState(defaultTuning);
    let [display, setDisplay] = useState({showWave: false});

    // frequency and name of every pitch in the chosen tuning; changing it
    // re-tunes and re-spells fundamentals, nearest-note matches and the player
    let tuningContext = useMemo(() => buildTuningContext(tuning), [tuning]);

    // memoised so the player only restarts when the sound actually changes
    let harmonicMatrix = useMemo(
        () => groups.flatMap((group) =>
            calculateHarmonicMatrix(group.notes, findInstrument(group.instrumentId), tuningContext, group.harmonicLevels)),
        [groups, tuningContext]);

    function updateGroup(updated) {
        setGroups(groups.map((group) => group.id === updated.id ? updated : group));
    }

    function removeGroup(id) {
        setGroups(groups.filter((group) => group.id !== id));
    }

    // Desktop: player above the selectors in a left column, results on the
    // right. Phone: selectors first to invite interaction, then table, chart
    // and the player last.
    return <>
        <TopBar onMenuClick={() => setMenuOpen(true)}/>
        <OptionsDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
            <TuningOptions tuning={tuning} onChange={setTuning}/>
            <Divider sx={{my: 3}}/>
            <DisplayOptions display={display} onChange={setDisplay}/>
        </OptionsDrawer>
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
                                     noteNames={tuningContext.names}
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
                {display.showWave && <Waveform harmonicMatrix={harmonicMatrix}/>}
            </Box>
        </Box>
    </>;
}

export default App;
