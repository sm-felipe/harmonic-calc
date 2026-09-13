import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

// What is shown on the results side. Lives in the options drawer.
export default function DisplayOptions({display, onChange}) {
    return <Stack spacing={1}>
        <Typography variant="overline" sx={{lineHeight: 1.5, color: 'text.secondary'}}>Display</Typography>
        <FormControlLabel
            control={<Switch checked={display.showWave}
                             onChange={(event) => onChange({...display, showWave: event.target.checked})}/>}
            label="Show wave"/>
        <Typography variant="caption" color="text.secondary" sx={{pl: 0.5}}>
            Draws one wavelength of the resulting sound under the spectrum.
        </Typography>
    </Stack>;
}
