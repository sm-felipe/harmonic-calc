import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {findTemperament, referencePitches, temperaments, tonicOptions} from "../service/temperaments";

// Tuning system, its reference note (when the system has one) and the
// pitch of A4. Lives in the options drawer.
export default function TuningOptions({tuning, onChange}) {
    let temperament = findTemperament(tuning.temperamentId);

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
        <Stack direction="row" spacing={2}>
            {temperament.needsTonic && (
                <TextField select
                           label="Reference note"
                           value={tuning.tonic}
                           onChange={(event) => onChange({...tuning, tonic: event.target.value})}
                           sx={{flex: 1}}>
                    {tonicOptions.map((note) => (
                        <MenuItem key={note} value={note}>{note}</MenuItem>
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
    </Stack>;
}

// two-line options: label on top, explanation underneath, wrapping as needed
const describedOption = {
    whiteSpace: 'normal',
    maxWidth: 320,
    alignItems: 'flex-start',
    '& .MuiListItemText-secondary': {fontSize: '0.75rem'},
};
