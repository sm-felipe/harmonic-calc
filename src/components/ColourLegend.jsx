import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {MAX_CENTS, tuningColor} from "../service/tuning";
import {loudnessColor} from "../service/loudness";
import {CUTOFF_DB} from "../service/instruments";

// Explains the two colour scales used in the table cells.
export default function ColourLegend() {
    let centsStops = [0, 12.5, 25, 37.5, 50].map((cents) => tuningColor(cents));
    let levelStops = [0, -7.5, -15, -22.5, -30].map((level) => loudnessColor(level));
    return <Stack direction="row" spacing={3} useFlexGap sx={{flexWrap: 'wrap', mb: 1, alignItems: 'center'}}>
        <Legend label="Partial frequency, coloured by distance from the nearest note"
                stops={centsStops} from="0¢ on the note" to={`${MAX_CENTS}¢ off`}/>
        <Legend label="Level, relative to the loudest partial of the note"
                stops={levelStops} from="0 dB" to={`${CUTOFF_DB} dB, cut off`}/>
    </Stack>;
}

function Legend({label, stops, from, to}) {
    return <Stack spacing={0.25}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
            <Typography variant="caption" translate="no">{from}</Typography>
            <Box aria-hidden sx={{
                width: 96, height: 8, borderRadius: 1,
                background: `linear-gradient(to right, ${stops.join(', ')})`,
            }}/>
            <Typography variant="caption" translate="no">{to}</Typography>
        </Stack>
    </Stack>;
}
