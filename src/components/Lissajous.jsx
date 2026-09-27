import {useEffect, useMemo, useRef, useState} from "react";
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {describeFigure, fundamentalsOf, sampleFigure} from "../service/lissajous";

// Two notes' fundamentals, one across and one up. A pure interval closes the
// figure and holds it still; a tempered one turns it, at the rate of the beat
// between the harmonics the two notes nearly share. See lissajous.js.
//
// The drawing moves every animation frame, so it bypasses React: the path is
// written straight into the DOM, and React only re-renders when the notes or
// the choices change.

const SIZE = 240;
const MARGIN = 0.08;
// Equal-tempered thirds turn nine to twelve times a second, a blur at sixty
// frames; slowed down they can be watched turning. The caption always gives
// the real rate.
const SPEEDS = [
    {value: 1, label: 'Real time'},
    {value: 1 / 4, label: '¼'},
    {value: 1 / 16, label: '1⁄16'},
];

export default function Lissajous({harmonicMatrix}) {
    let notes = useMemo(() => fundamentalsOf(harmonicMatrix), [harmonicMatrix]);
    // chosen by place in the chord, lowest first, so that a score changing
    // chords under the figure keeps showing the same pair of voices
    let [ranks, setRanks] = useState([0, 1]);
    let [speed, setSpeed] = useState(1);
    let path = useRef(null);
    let phase = useRef(0);

    let [first, second] = pairFrom(ranks, notes.length);
    let lower = notes[Math.min(first, second)];
    let upper = notes[Math.max(first, second)];
    let figure = useMemo(
        () => lower && upper ? describeFigure(lower.frequency, upper.frequency) : null,
        [lower, upper]);

    useEffect(() => {
        if (!figure || !path.current) {
            return undefined;
        }
        let draw = () => path.current && path.current.setAttribute('d', toPath(sampleFigure(figure, phase.current)));
        let still = figure.driftHz === 0 || prefersStillness();
        if (still) {
            draw();
            return undefined;
        }
        let last = performance.now();
        let frame = requestAnimationFrame(function turn(now) {
            // the phase advances rather than being read off the clock, so that
            // changing the speed slows the figure down instead of jumping it
            phase.current += (now - last) / 1000 * speed;
            last = now;
            draw();
            frame = requestAnimationFrame(turn);
        });
        return () => cancelAnimationFrame(frame);
    }, [figure, speed]);

    if (notes.length < 2) {
        return <Box sx={{mt: 2}}>
            <Heading/>
            <Typography variant="body2" color="text.secondary">
                A Lissajous figure needs two different notes: one drives the curve across, the other up.
            </Typography>
        </Box>;
    }

    return <Box sx={{mt: 2}}>
        <Heading/>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{alignItems: {sm: 'flex-start'}}}>
            <Box component="svg"
                 role="img"
                 aria-label={describe(figure, lower, upper)}
                 viewBox={`${-1 - MARGIN} ${-1 - MARGIN} ${2 + 2 * MARGIN} ${2 + 2 * MARGIN}`}
                 sx={{
                     display: 'block',
                     width: '100%',
                     maxWidth: SIZE,
                     aspectRatio: '1',
                     flexShrink: 0,
                     border: 1,
                     borderColor: 'divider',
                     borderRadius: 1,
                     bgcolor: 'background.paper',
                     color: 'primary.main',
                 }}>
                <line x1={-1} y1={0} x2={1} y2={0} stroke="currentColor" strokeOpacity={0.15}
                      strokeWidth={1} vectorEffect="non-scaling-stroke"/>
                <line x1={0} y1={-1} x2={0} y2={1} stroke="currentColor" strokeOpacity={0.15}
                      strokeWidth={1} vectorEffect="non-scaling-stroke"/>
                <path ref={path} fill="none" stroke="currentColor" strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke" strokeLinejoin="round"/>
            </Box>

            <Stack spacing={1.5} sx={{minWidth: 0}}>
                {notes.length > 2 && (
                    <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                        <NotePicker label="First note" notes={notes} value={first}
                                    onChange={(rank) => setRanks([rank, rank === second ? first : second])}/>
                        <Typography variant="body2" color="text.secondary">and</Typography>
                        <NotePicker label="Second note" notes={notes} value={second}
                                    onChange={(rank) => setRanks([rank === first ? second : first, rank])}/>
                    </Stack>
                )}
                <Typography variant="body2" translate="no" sx={{fontWeight: 600}}>
                    {lower.noteName} across, {upper.noteName} up · {figure.p}:{figure.q}
                </Typography>
                <Typography variant="body2" color="text.secondary">{explain(figure, lower, upper)}</Typography>
                {figure.driftHz > 0 && !prefersStillness() && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" component="div" sx={{mb: 0.5}}>
                            Speed of the drawing
                        </Typography>
                        <ToggleButtonGroup exclusive size="small" value={speed}
                                           onChange={(event, chosen) => chosen && setSpeed(chosen)}
                                           aria-label="Speed of the drawing">
                            {SPEEDS.map((option) => (
                                <ToggleButton key={option.value} value={option.value}
                                              sx={{textTransform: 'none', px: 1.25, py: 0.25}}>
                                    {option.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                )}
            </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
            Each note's fundamental as a pure sine, one driving the curve across and the other up. A figure
            that closes and stays still is an interval in an exact ratio; one that turns is tempered, and turns
            at the rate you hear it beat.
        </Typography>
    </Box>;
}

function Heading() {
    return <Typography variant="overline" component="h2"
                       sx={{display: 'block', lineHeight: 1.5, mb: 0.5, color: 'text.secondary'}}>
        Lissajous figure
    </Typography>;
}

function NotePicker({label, notes, value, onChange}) {
    return <TextField select size="small" value={value}
                      onChange={(event) => onChange(Number(event.target.value))}
                      slotProps={{htmlInput: {'aria-label': label}}}
                      sx={{minWidth: 80}}>
        {notes.map((note, rank) => (
            <MenuItem key={note.note} value={rank} translate="no">{note.noteName}</MenuItem>
        ))}
    </TextField>;
}

// the two chosen places in the chord, kept inside it and kept apart
export function pairFrom([first, second], count) {
    let a = Math.min(first, count - 1);
    let b = Math.min(second, count - 1);
    if (a === b) {
        b = a === 0 ? 1 : a - 1;
    }
    return [a, b];
}

function toPath(points) {
    // y is drawn downwards in SVG, so it is turned over to point up
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(4)},${(-y).toFixed(4)}`).join('');
}

function prefersStillness() {
    return typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The sentence under the figure: what ratio the two notes are near, how far
 * off it they are, and so how fast the figure turns — and which two harmonics
 * are beating, because that is where the turning comes from.
 */
export function explain(figure, lower, upper) {
    if (figure.driftHz === 0) {
        return `${lower.noteName} and ${upper.noteName} are exactly ${figure.p}:${figure.q}, so the figure closes on itself and stands still.`;
    }
    let off = Math.abs(figure.cents);
    let direction = figure.cents > 0 ? 'wide' : 'narrow';
    let rate = figure.driftHz >= 1
        ? `${figure.driftHz.toFixed(1)} times a second`
        : `once every ${(1 / figure.driftHz).toFixed(1)} seconds`;
    return `${lower.noteName} and ${upper.noteName} are ${off.toFixed(1)} cents ${direction} of ${figure.p}:${figure.q}, `
        + `so the figure turns ${rate}: the beat between ${lower.noteName}'s ${ordinal(figure.p)} harmonic `
        + `and ${upper.noteName}'s ${ordinal(figure.q)}.`;
}

function describe(figure, lower, upper) {
    return `Lissajous figure of ${lower.noteName} and ${upper.noteName}, near ${figure.p}:${figure.q}, `
        + (figure.driftHz === 0 ? 'standing still' : `turning ${figure.driftHz.toFixed(2)} times a second`);
}

function ordinal(n) {
    if (n === 1) {
        return 'fundamental';
    }
    let tens = n % 100;
    let suffix = tens >= 11 && tens <= 13 ? 'th' : {1: 'st', 2: 'nd', 3: 'rd'}[n % 10] || 'th';
    return `${n}${suffix}`;
}
