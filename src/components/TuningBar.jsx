import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import {findTemperament, temperaments} from "../service/temperaments";
import {findKey, keys} from "../service/spelling";

// The three tuning settings worth reaching for while something is sounding,
// written short enough to sit in the sound bar. The rest of the tuning — the
// pitch of A4, and how accidentals are spelled — is set once and left alone,
// so it stays in the options drawer.
//
// Changing any of these is heard without the music stopping: the voices glide
// onto the new tuning rather than starting again, which is the whole point of
// having them out here.
export default function TuningBar({tuning, onChange}) {
    let temperament = findTemperament(tuning.temperamentId);
    let key = findKey(tuning.keyId);

    return <Stack direction="row" spacing={1} useFlexGap sx={{alignItems: 'center', flexShrink: 0}}>
        <Tooltip title={`Temperament: ${temperament.label}`}>
            <TextField select
                       size="small"
                       value={tuning.temperamentId}
                       onChange={(event) => onChange({...tuning, temperamentId: event.target.value})}
                       slotProps={{
                           select: {renderValue: (id) => findTemperament(id).short},
                           htmlInput: {'aria-label': 'Temperament'},
                       }}
                       sx={compact}>
                {temperaments.map((option) => (
                    <MenuItem key={option.id} value={option.id} sx={describedOption}>
                        <ListItemText primary={option.label} secondary={option.description}/>
                    </MenuItem>
                ))}
            </TextField>
        </Tooltip>

        <Tooltip title={temperament.retunesByKey
            ? `Key: ${key.label}. Sets the tonic the ratios are built from, and how notes are spelled.`
            : `Key: ${key.label}. In equal temperament the key only decides how notes are spelled.`}>
            <TextField select
                       size="small"
                       value={tuning.keyId}
                       onChange={(event) => onChange({...tuning, keyId: event.target.value})}
                       slotProps={{
                           select: {renderValue: (id) => findKey(id).short},
                           htmlInput: {'aria-label': 'Key'},
                       }}
                       sx={compact}>
                {keys.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                ))}
            </TextField>
        </Tooltip>

        <Tooltip title="Snap partials to notes: moves every partial onto the nearest note of this temperament instead of its natural multiple of the fundamental. Nothing is off by any cents, so nothing beats.">
            <ToggleButton value="snap"
                          size="small"
                          selected={Boolean(tuning.snap)}
                          onChange={() => onChange({...tuning, snap: !tuning.snap})}
                          sx={snapButton}>
                Snap
            </ToggleButton>
        </Tooltip>
    </Stack>;
}

// Snap changes what every partial is, so it should be impossible to leave on
// by accident: switched on it fills with the accent colour rather than taking
// the faint grey wash a toggle button has by default.
const snapButton = {
    px: 1.25,
    py: 0.5,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    '&.Mui-selected': {
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderColor: 'primary.main',
        fontWeight: 600,
        '&:hover': {bgcolor: 'primary.dark'},
    },
};

// wide enough for the longest short label, and no wider; tighter still on a
// phone, where every pixel decides whether the bar takes two rows or three
const compact = {
    minWidth: {xs: 78, sm: 92},
    '& .MuiSelect-select': {py: 0.75, fontSize: '0.8125rem'},
};

// two-line options: label on top, explanation underneath, wrapping as needed
const describedOption = {
    whiteSpace: 'normal',
    maxWidth: 320,
    alignItems: 'flex-start',
    '& .MuiListItemText-secondary': {fontSize: '0.75rem'},
};
