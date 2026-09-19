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
import {loadExample, readExampleScore} from "./service/examples";
import {decodeState, encodeState} from "./service/urlState";
import Divider from '@mui/material/Divider';
import {buildTuningContext} from "./service/temperaments";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {defaultInstrument, findInstrument} from "./service/instruments";
import ScoreLoader from "./components/ScoreLoader";
import ScoreLanes from "./components/ScoreLanes";
import ScoreView from "./components/ScoreView";
import {changeIndexAt, groupsAt} from "./service/musicXml";
import useScorePlayer from "./components/useScorePlayer";

//TODO error bars https://react-plot.zakodium.com/series/barSeries#3-errorbars
//TODO refactor: organizar classes e functions

const NOTHING_SOUNDING = [];

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

    // An opened score is session state, not part of the link: a piece cannot go
    // in a query string, and the playhead moving would otherwise fill the
    // browser's history. The hand-picked groups above carry on untouched.
    let [score, setScore] = useState(null);
    let [partChoices, setPartChoices] = useState({});   // partIndex -> instrument id
    let [volume, setVolume] = useState(1);
    let [scoreView, setScoreView] = useState('lanes');
    let [exampleBusy, setExampleBusy] = useState(null);
    let [exampleError, setExampleError] = useState(null);

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
    let manualMatrix = useMemo(
        () => groups.flatMap((group) =>
            calculateHarmonicMatrix(group.notes, findInstrument(group.instrumentId), tuningContext, group.harmonicLevels)),
        [groups, tuningContext]);

    // what each part is heard and analysed as, the score's own guess unless a
    // lane was changed
    let scoreParts = useMemo(
        () => score ? score.parts.map((part, index) => ({instrumentId: partChoices[index] || part.instrumentId})) : [],
        [score, partChoices]);

    let transport = useScorePlayer(score, {tuningContext, parts: scoreParts, volume});
    let positionMs = transport.positionMs;

    // The playhead moves every animation frame, but the sound only changes at
    // the moments the score says it does. Keying off that index instead of the
    // position keeps the table, the spectrum and the wave from being rebuilt
    // sixty times a second for a chord that has not changed.
    let changeIndex = score ? changeIndexAt(score, positionMs) : -1;
    let sounding = score && changeIndex >= 0 ? score.changes[changeIndex].notes : NOTHING_SOUNDING;

    let scoreMatrix = useMemo(
        () => score ? groupsAt(score, positionMs, partChoices).flatMap((group) =>
            calculateHarmonicMatrix(group.notes, findInstrument(group.instrumentId), tuningContext)) : [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [score, changeIndex, partChoices, tuningContext]);

    let harmonicMatrix = score ? scoreMatrix : manualMatrix;

    function updateGroup(updated) {
        setGroups(groups.map((group) => group.id === updated.id ? updated : group));
    }

    function removeGroup(id) {
        setGroups(groups.filter((group) => group.id !== id));
    }

    function clearAll() {
        setGroups([newGroup()]);
    }

    function openScore(loaded) {
        setScore(loaded);
        setPartChoices({});
    }

    function closeScore() {
        setScore(null);
        setPartChoices({});
    }

    // An example is either a handful of notes or a whole score; the score has
    // to be fetched and read, which takes a moment and can fail.
    async function pickExample(example) {
        if (example.scoreFile) {
            setExampleBusy(example.id);
            setExampleError(null);
            try {
                openScore(await readExampleScore(example));
            } catch (failure) {
                setExampleError(failure.message || 'That example could not be opened.');
            } finally {
                setExampleBusy(null);
            }
            return;
        }
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
            gridTemplateRows: {md: 'auto auto 1fr'},
            gridTemplateAreas: {
                xs: '"score" "selectors" "player" "results"',
                md: '"score score" "player results" "selectors results"',
            },
        }}>
            <Box sx={{gridArea: 'score', minWidth: 0}}>
                <ScoreLoader score={score} onLoad={openScore} onClear={closeScore}/>
                {score && (
                    <Box sx={{mt: 2}}>
                        {/* the toggle is the section heading: lanes to find your way
                            around the piece, the score to read what is written, and
                            the same score on one line when the parts should line up
                            the way the lanes do */}
                        <ToggleButtonGroup exclusive
                                           size="small"
                                           value={scoreView}
                                           onChange={(event, chosen) => chosen && setScoreView(chosen)}
                                           sx={{mb: 1}}>
                            <ToggleButton value="lanes">Parts</ToggleButton>
                            <ToggleButton value="score">Score</ToggleButton>
                            <ToggleButton value="continuous">One line</ToggleButton>
                        </ToggleButtonGroup>
                        {scoreView === 'lanes'
                            ? <ScoreLanes score={score}
                                          positionMs={positionMs}
                                          sounding={sounding}
                                          partChoices={partChoices}
                                          onInstrumentChange={(index, instrumentId) =>
                                              setPartChoices({...partChoices, [index]: instrumentId})}
                                          onSeek={transport.seek}/>
                            : <ScoreView score={score}
                                         sounding={sounding}
                                         following={transport.playing}
                                         continuous={scoreView === 'continuous'}/>}
                    </Box>
                )}
            </Box>
            <Box sx={{gridArea: 'player', pr: {md: 1}}}>
                <Player harmonicMatrix={harmonicMatrix}
                        transport={score ? transport : null}
                        onVolumeChange={setVolume}/>
            </Box>
            {/* one column on phones and in the desktop side column; two side by side on tablets.
                An open score drives the results, so the hand-picked notes step aside until it
                is closed rather than sitting there looking as though they still did something. */}
            <Box sx={{
                display: score ? 'none' : 'grid',
                gridArea: 'selectors',
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
                    ? (score
                        ? <Typography variant="body2" color="text.secondary" sx={{py: 4}}>
                            Nothing is sounding at the playhead. Press Play, or click the lanes where
                            the parts have notes.
                        </Typography>
                        : <QuickStart onPick={pickExample} busyId={exampleBusy} error={exampleError}/>)
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
