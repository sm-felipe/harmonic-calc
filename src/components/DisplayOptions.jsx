import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {CYCLE_OPTIONS} from "../service/waveform";

// What is shown on the results side. Lives in the options drawer.
export default function DisplayOptions({display, onChange}) {
    return <Stack spacing={1}>
        <Typography variant="overline" sx={{lineHeight: 1.5, color: 'text.secondary'}}>Display</Typography>
        <Stack direction="row" spacing={2} sx={{alignItems: 'center', justifyContent: 'space-between'}}>
            <FormControlLabel
                control={<Switch checked={display.showWave}
                                 onChange={(event) => onChange({...display, showWave: event.target.checked})}/>}
                label="Show wave"/>
            {display.showWave && (
                <TextField select
                           size="small"
                           label="Cycles"
                           value={display.waveCycles}
                           onChange={(event) => onChange({...display, waveCycles: Number(event.target.value)})}
                           sx={{width: 96}}>
                    {CYCLE_OPTIONS.map((cycles) => (
                        <MenuItem key={cycles} value={cycles}>{cycles}</MenuItem>
                    ))}
                </TextField>
            )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{pl: 0.5}}>
            Draws a few wavelengths of the resulting sound under the spectrum. More cycles show the beating between notes.
        </Typography>
    </Stack>;
}
