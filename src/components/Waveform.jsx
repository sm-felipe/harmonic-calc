import {useMemo} from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {sampleWaveform} from "../service/waveform";

const WIDTH = 600;
const HEIGHT = 180;
const PADDING = 8;

// One wavelength of the sound the player makes, drawn as a static curve.
// Recomputed whenever the harmonic matrix changes, like the spectrum chart.
export default function Waveform({harmonicMatrix}) {
    let wave = useMemo(() => sampleWaveform(harmonicMatrix), [harmonicMatrix]);

    if (!wave) {
        return null;
    }

    let midY = HEIGHT / 2;
    let amplitude = midY - PADDING;
    let path = wave.samples.map((y, i) => {
        let x = WIDTH * i / (wave.samples.length - 1);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(midY - y * amplitude).toFixed(1)}`;
    }).join(' ');
    let periodMs = wave.period * 1000;
    let partials = `${wave.partialCount} partial${wave.partialCount === 1 ? '' : 's'}`;

    return <Box sx={{mt: 2}}>
        <Typography variant="overline" component="h2"
                    sx={{display: 'block', lineHeight: 1.5, mb: 0.5, color: 'text.secondary'}}>
            Resulting wave
        </Typography>
        <Box component="svg"
             role="img"
             aria-label={`One wavelength of ${wave.lowestNote}, ${partials} summed`}
             viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
             preserveAspectRatio="none"
             sx={{
                 display: 'block',
                 width: '100%',
                 height: {xs: 140, md: HEIGHT},
                 border: 1,
                 borderColor: 'divider',
                 borderRadius: 1,
                 bgcolor: 'background.paper',
                 color: 'primary.main',
             }}>
            <line x1={0} y1={midY} x2={WIDTH} y2={midY} stroke="currentColor" strokeOpacity={0.25} strokeWidth={1}/>
            <path d={path} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"/>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>
            One wavelength of {wave.lowestNote}: {periodMs.toFixed(2)} ms
            {' · '}{partials} summed in phase, amplitude normalised
        </Typography>
    </Box>;
}
