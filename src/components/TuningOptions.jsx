import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {accidentalOptions, findTemperament, referencePitches} from "../service/temperaments";

// What is left of the tuning once the temperament, the key and the snap have
// moved out to the sound bar: the pitch A is measured from, and how accidentals
// are spelled. Both are settled once for a piece rather than compared by ear
// while it plays, so the drawer is the right place for them.
export default function TuningOptions({tuning, onChange}) {
    let temperament = findTemperament(tuning.temperamentId);
    let accidentals = accidentalOptions.find((option) => option.id === tuning.accidentals) || accidentalOptions[0];

    return <Stack spacing={2}>
        <Typography variant="overline" sx={{lineHeight: 1.5, color: 'text.secondary'}}>Tuning</Typography>
        <Typography variant="caption" color="text.secondary" sx={{mt: -1}}>
            Temperament, key and snap are in the bar at the foot of the window, where they can be changed
            while the music plays.
        </Typography>
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
    </Stack>;
}

// two-line options: label on top, explanation underneath, wrapping as needed
const describedOption = {
    whiteSpace: 'normal',
    maxWidth: 320,
    alignItems: 'flex-start',
    '& .MuiListItemText-secondary': {fontSize: '0.75rem'},
};
