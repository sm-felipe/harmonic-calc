import {useEffect, useMemo, useRef, useState} from "react";
import HarmonicTable from "./components/HarmonicTable";
import {calculateHarmonicMatrix} from "./service/HarmonicMatrix";
import {Spectogram2} from "./components/Spectogram2";
import Player from "./components/Player";
import InstrumentGroup from "./components/InstrumentGroup";
import TopBar from "./components/TopBar";
import OptionsDrawer from "./components/OptionsDrawer";
import TuningOptions from "./components/TuningOptions";
import DisplayOptions from "./components/DisplayOptions";
import References from "./components/References";
import Waveform from "./components/Waveform";
import QuickStart from "./components/QuickStart";
import {loadExample} from "./service/examples";
import {decodeState, encodeState} from "./service/urlState";
import Divider from '@mui/material/Divider';
import {buildTuningContext} from "./service/temperaments";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import {defaultInstrument, findInstrument} from "./service/instruments";

//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO refactor: organizar classes e functions
//TODO actually read MusicXML music sheets

let nextGroupId = 1;

function newGroup() {
    return {id: nextGroupId++, instrumentId: defaultInstrument.id, notes: [], harmonicLevels: defaultInstrument.defaultLevels};
}

// the configuration comes from the link when there is one
function stateFromUrl() {
    let fromUrl = decodeState(window.location.search);
    let groups = fromUrl.groups.length
        ? fromUrl.groups.map((group) => ({...newGroup(), ...group}))
        : [newGroup()];
    return {groups, tuning: fromUrl.tuning, display: fromUrl.display};
}

// What counts as a step worth a history entry: everything except the custom
// instrument's slider levels, which change continuously while dragging.
function historyKey({groups, tuning, display}) {
    return encodeState({groups: groups.map(({harmonicLevels, ...group}) => group), tuning, display});
}

function App() {
    let [initial] = useState(stateFromUrl);
    let [groups, setGroups] = useState(initial.groups);
    let [menuOpen, setMenuOpen] = useState(false);
    let [tuning, setTuning] = useState(initial.tuning);
    let [display, setDisplay] = useState(initial.display);
    let lastHistoryKey = useRef(historyKey(initial));
    let restoring = useRef(false);

    // Keep the address bar in sync so the current link reproduces the screen.
    // Structural changes push a history entry, so the browser's Back button
    // steps through what the visitor did instead of leaving the site; level
    // drags only replace the current entry.
    useEffect(() => {
        let query = encodeState({groups, tuning, display});
        let url = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
        let key = historyKey({groups, tuning, display});
        let changed = url !== window.location.pathname + window.location.search + window.location.hash;
        if (restoring.current) {
            restoring.current = false;
        } else if (changed && key !== lastHistoryKey.current) {
            window.history.pushState(null, '', url);
        } else if (changed) {
            window.history.replaceState(null, '', url);
        }
        lastHistoryKey.current = key;
    }, [groups, tuning, display]);

    // Back / Forward: rebuild the screen from the address the browser moved to
    useEffect(() => {
        function onPopState() {
            let state = stateFromUrl();
            restoring.current = true;
            setGroups(state.groups);
            setTuning(state.tuning);
            setDisplay(state.display);
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

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

    function clearAll() {
        setGroups([newGroup()]);
    }

    function pickExample(example) {
        let loaded = loadExample(example, newGroup);
        setGroups(loaded.groups);
        setTuning(loaded.tuning);
    }

    // Desktop: player above the selectors in a left column; table, spectrum
    // and wave on the right. Phone: selectors first to invite interaction,
    // then the player, the spectrum, the table and the wave.
    return <>
        <TopBar onMenuClick={() => setMenuOpen(true)}/>
        <OptionsDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
            <TuningOptions tuning={tuning} onChange={setTuning}/>
            <Divider sx={{my: 3}}/>
            <DisplayOptions display={display} onChange={setDisplay}/>
            <Divider sx={{my: 3}}/>
            <References/>
        </OptionsDrawer>
        <Box sx={{
            p: 2,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)'},
            gridTemplateRows: {md: 'auto 1fr'},
            gridTemplateAreas: {
                xs: '"selectors" "player" "results"',
                md: '"player results" "selectors results"',
            },
        }}>
            <Box sx={{gridArea: 'player', pr: {md: 1}}}>
                <Player harmonicMatrix={harmonicMatrix}/>
            </Box>
            {/* one column on phones and in the desktop side column; two side by side on tablets */}
            <Box sx={{
                gridArea: 'selectors',
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'minmax(0, 1fr)'},
                alignItems: 'start',
            }}>
                {groups.map((group, index) => (
                    <InstrumentGroup key={group.id}
                                     index={index}
                                     group={group}
                                     noteNames={tuningContext.names}
                                     canRemove={groups.length > 1}
                                     onChange={updateGroup}
                                     onRemove={() => removeGroup(group.id)}/>
                ))}
                <Tooltip title="Add another instrument with its own notes, to mix timbres" describeChild>
                    <Button variant="outlined" onClick={() => setGroups([...groups, newGroup()])}
                            sx={{gridColumn: '1 / -1'}}>
                        + Add instrument
                    </Button>
                </Tooltip>
                {(harmonicMatrix.length > 0 || groups.length > 1) && (
                    <Button variant="text" color="inherit" size="small" onClick={clearAll}
                            sx={{gridColumn: '1 / -1', color: 'text.secondary'}}>
                        Clear all and start over
                    </Button>
                )}
            </Box>
            <Box sx={{gridArea: 'results', minWidth: 0, display: 'flex', flexDirection: 'column'}}>
                {harmonicMatrix.length === 0
                    ? <QuickStart onPick={pickExample}/>
                    : <>
                        <Box sx={{order: {xs: 2, md: 1}}}>
                            <HarmonicTable harmonicMatrix={harmonicMatrix}/>
                        </Box>
                        <Box sx={{order: {xs: 1, md: 2}, mb: {xs: 2, md: 0}}}>
                            <Spectogram2 harmonicMatrix={harmonicMatrix}/>
                        </Box>
                        {display.showWave && (
                            <Box sx={{order: 3}}>
                                <Waveform harmonicMatrix={harmonicMatrix} cycles={display.waveCycles}/>
                            </Box>
                        )}
                    </>}
            </Box>
        </Box>
    </>;
}

export default App;
