import FormControlLabel from '@mui/material/FormControlLabel';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {accidentalOptions, findTemperament, referencePitches, temperaments} from "../service/temperaments";
import {keys} from "../service/spelling";

// Tuning system, key, pitch of A4 and, in equal temperament only, how
// accidentals are spelled. Lives in the options drawer.
export default function TuningOptions({tuning, onChange}) {
    let temperament = findTemperament(tuning.temperamentId);
    let accidentals = accidentalOptions.find((option) => option.id === tuning.accidentals) || accidentalOptions[0];

    return <Stack spacing={2}>
        <Typography variant="overline" sx={{lineHeight: 1.5, color: 'text.secondary'}}>Tuning</Typography>
        <TextField select
                   label="Temperament"
                   value={tuning.temperamentId}
                   onChange={(event) => onChange({...tuning, temperamentId: event.target.value})}
                   helperText={temperament.description}
                   slotProps={{select: {renderValue: (id) => findTemperament(id).label}}}>
            {temperaments.map((option) => (
                <MenuItem key={option.id} value={option.id} sx={describedOption}>
                    <ListItemText primary={option.label} secondary={option.description}/>
                </MenuItem>
            ))}
        </TextField>
        <TextField select
                   label="Key"
                   value={tuning.keyId}
                   onChange={(event) => onChange({...tuning, keyId: event.target.value})}
                   helperText={temperament.retunesByKey
                       ? 'Sets the tonic the ratios are built from, and how notes are spelled.'
                       : 'In equal temperament the key only decides how notes are spelled.'}>
            {keys.map((key) => (
                <MenuItem key={key.id} value={key.id}>{key.label}</MenuItem>
            ))}
        </TextField>
        <Stack direction="row" spacing={2}>
            {!temperament.retunesByKey && (
                <TextField select
                           label="Accidentals"
                           value={accidentals.id}
                           onChange={(event) => onChange({...tuning, accidentals: event.target.value})}
                           sx={{flex: 1}}
                           slotProps={{select: {renderValue: (id) => accidentalOptions.find((option) => option.id === id).label}}}>
                    {accidentalOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id} sx={describedOption}>
                            <ListItemText primary={option.label} secondary={option.description}/>
                        </MenuItem>
                    ))}
                </TextField>
            )}
            <TextField select
                       label="A4 (Hz)"
                       value={tuning.a4}
                       onChange={(event) => onChange({...tuning, a4: Number(event.target.value)})}
                       sx={{flex: 1}}
                       slotProps={{select: {renderValue: (hz) => `${hz} Hz`}}}>
                {referencePitches.map((pitch) => (
                    <MenuItem key={pitch.hz} value={pitch.hz} sx={describedOption}>
                        <ListItemText primary={`${pitch.hz} Hz`} secondary={pitch.description}/>
                    </MenuItem>
                ))}
            </TextField>
        </Stack>
        <FormControlLabel
            control={<Switch checked={Boolean(tuning.snap)}
                             onChange={(event) => onChange({...tuning, snap: event.target.checked})}/>}
            label="Snap partials to notes"/>
        <Typography variant="caption" color="text.secondary" sx={{pl: 0.5, mt: -1}}>
            Moves every partial onto the nearest note of this temperament instead of its natural multiple of the
            fundamental. Nothing is off by any cents, so nothing beats: compare the sound with the switch off.
        </Typography>
    </Stack>;
}

// two-line options: label on top, explanation underneath, wrapping as needed
const describedOption = {
    whiteSpace: 'normal',
    maxWidth: 320,
    alignItems: 'flex-start',
    '& .MuiListItemText-secondary': {fontSize: '0.75rem'},
};
