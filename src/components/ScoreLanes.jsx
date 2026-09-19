import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {instruments} from "../service/instruments";
import {formatDuration} from "./ScoreLoader";
import scrollShadows from "./scrollShadows";
import useContainerWidth from "./useContainerWidth";

// One lane per part, notes as blocks along a shared time axis: enough to see
// where each voice enters, how the parts sit against each other and where the
// playhead is, without being a score. The score itself comes separately.
//
// Each lane is scaled to its own part's range rather than the whole score's.
// Spread over the range of a four-part piece, a single lane's notes would be a
// couple of pixels apart and the contour would vanish; within its own range,
// each part's shape stays legible. The register is given in the label instead.
const LANE_HEIGHT = 44;
const LANE_GAP = 4;
const AXIS_HEIGHT = 18;
const NOTE_RADIUS = 2;
const MIN_NOTE_WIDTH = 2;
// a part that barely moves would otherwise have every note filling its lane
const MIN_RANGE_SEMITONES = 7;
const CONTROLS_WIDTH = 168;
const MIN_LANE_WIDTH = 320;
const TICK_LABEL_WIDTH = 30;

const LANE_COLOURS = ['#1976d2', '#d32f2f', '#2e7d32', '#7b1fa2', '#ef6c00', '#00838f', '#5d4037', '#c2185b'];

export default function ScoreLanes({score, positionMs = 0, sounding = [], partChoices = {}, onInstrumentChange, onSeek}) {
    let [containerRef, containerWidth] = useContainerWidth();
    let laneWidth = Math.max(MIN_LANE_WIDTH, Math.floor(containerWidth) - CONTROLS_WIDTH);
    let height = score.parts.length * (LANE_HEIGHT + LANE_GAP) - LANE_GAP;
    let duration = Math.max(score.durationMs, 1);
    let soundingSet = new Set(sounding);

    let ranges = score.parts.map((_, index) => rangeOf(score, index));
    let playheadX = (positionMs / duration) * laneWidth;

    function seekFrom(event) {
        if (!onSeek) {
            return;
        }
        let box = event.currentTarget.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(duration, ((event.clientX - box.left) / box.width) * duration)));
    }

    return <Box>
        <Typography variant="overline" component="h2"
                    sx={{display: 'block', lineHeight: 1.5, color: 'text.secondary'}}>
            Parts
        </Typography>
        <Box ref={containerRef} sx={{overflowX: 'auto', ...scrollShadows}}>
            <Box sx={{display: 'flex', minWidth: CONTROLS_WIDTH + MIN_LANE_WIDTH}}>
                <Box sx={{width: CONTROLS_WIDTH, flexShrink: 0, pr: 1}}>
                    {score.parts.map((part, index) => (
                        <Box key={index}
                             sx={{height: LANE_HEIGHT, mb: `${LANE_GAP}px`, display: 'flex',
                                  flexDirection: 'column', justifyContent: 'center', minWidth: 0}}>
                            <Typography variant="caption" noWrap
                                        sx={{fontWeight: 600, color: LANE_COLOURS[index % LANE_COLOURS.length]}}>
                                {part.name}
                            </Typography>
                            {/* a native select: compact, and on a phone it opens
                                the platform's own picker rather than a menu */}
                            <TextField select
                                       size="small"
                                       variant="standard"
                                       value={partChoices[index] || part.instrumentId}
                                       onChange={(event) => onInstrumentChange(index, event.target.value)}
                                       slotProps={{
                                           input: {disableUnderline: true},
                                           select: {native: true, 'aria-label': `Instrument for ${part.name}`},
                                       }}
                                       sx={{'& select': {py: 0, fontSize: '0.7rem', color: 'text.secondary'}}}>
                                {instruments.map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </TextField>
                        </Box>
                    ))}
                    <Box sx={{height: AXIS_HEIGHT}}/>
                </Box>

                <Box sx={{flexGrow: 1, minWidth: 0}}>
                    <svg width={laneWidth} height={height + AXIS_HEIGHT}
                         onClick={seekFrom}
                         style={{cursor: onSeek ? 'pointer' : 'default', display: 'block'}}
                         role="img"
                         aria-label={`${score.parts.length} parts over ${formatDuration(score.durationMs)}`}>
                        {score.parts.map((_, index) => (
                            <rect key={`lane-${index}`}
                                  x={0} y={index * (LANE_HEIGHT + LANE_GAP)}
                                  width={laneWidth} height={LANE_HEIGHT}
                                  rx={NOTE_RADIUS} fill="#f1f3f5"/>
                        ))}

                        {tickSeconds(score.durationMs)
                            .map((seconds) => ({seconds, x: (seconds * 1000 / duration) * laneWidth}))
                            // the last gridline can land close enough to the end
                            // that its label would hang off the edge
                            .filter(({x}) => x < laneWidth - TICK_LABEL_WIDTH)
                            .map(({seconds, x}) => (
                                <g key={`tick-${seconds}`}>
                                    <line x1={x} y1={0} x2={x} y2={height} stroke="#dee2e6" strokeWidth={1}/>
                                    <text x={x + 3} y={height + 13} fontSize={10} fill="#868e96">
                                        {formatDuration(seconds * 1000)}
                                    </text>
                                </g>
                            ))}

                        {score.notes.map((note, noteIndex) => {
                            let range = ranges[note.partIndex];
                            if (!range) {
                                return null;
                            }
                            let laneTop = note.partIndex * (LANE_HEIGHT + LANE_GAP);
                            let noteHeight = Math.max(3, LANE_HEIGHT / range.span);
                            let y = laneTop + LANE_HEIGHT
                                - ((note.pitchIndex - range.low + 0.5) / range.span) * LANE_HEIGHT
                                - noteHeight / 2;
                            let x = (note.startMs / duration) * laneWidth;
                            let width = Math.max(MIN_NOTE_WIDTH, ((note.endMs - note.startMs) / duration) * laneWidth);
                            let live = soundingSet.has(noteIndex);
                            return <rect key={note.ids[0] || noteIndex}
                                         x={x} y={y} width={width} height={noteHeight}
                                         rx={Math.min(NOTE_RADIUS, noteHeight / 2)}
                                         fill={LANE_COLOURS[note.partIndex % LANE_COLOURS.length]}
                                         opacity={live ? 1 : 0.55}/>;
                        })}

                        <line x1={playheadX} y1={0} x2={playheadX} y2={height}
                              stroke="#212529" strokeWidth={1.5}/>
                    </svg>
                </Box>
            </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
            Each lane is scaled to its own part's range, so the shape of the line stays readable; notes sounding
            now are the solid ones. Click anywhere on the lanes to move the playhead. Choosing an instrument
            changes the timbre that part is heard and analysed with.
        </Typography>
    </Box>;
}

// The pitch span drawn in a lane: the part's own range, opened up when the part
// hardly moves so that a held note does not fill the whole lane.
function rangeOf(score, partIndex) {
    let pitches = score.notes.filter((note) => note.partIndex === partIndex).map((note) => note.pitchIndex);
    if (pitches.length === 0) {
        return null;
    }
    let low = Math.min(...pitches);
    let high = Math.max(...pitches);
    let span = high - low + 1;
    if (span < MIN_RANGE_SEMITONES) {
        let padding = (MIN_RANGE_SEMITONES - span) / 2;
        low -= Math.floor(padding);
        span = MIN_RANGE_SEMITONES;
    }
    return {low, span};
}

// Round gridline steps that give roughly six to twelve marks, whatever the
// length of the piece.
function tickSeconds(durationMs) {
    let seconds = durationMs / 1000;
    let step = [1, 2, 5, 10, 15, 30, 60, 120, 300].find((candidate) => seconds / candidate <= 12) || 600;
    let ticks = [];
    for (let at = 0; at < seconds; at += step) {
        ticks.push(at);
    }
    return ticks;
}
