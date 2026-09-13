import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {findInstrument, instruments} from "../service/instruments";

// One instrument and the notes it plays. Several groups can be combined so
// that, say, a bassoon holds the bass while voices sing the upper parts.
export default function InstrumentGroup({index, group, noteOptions, canRemove, onChange, onRemove}) {
    let instrument = findInstrument(group.instrumentId);
    let instrumentLabel = `Instrument ${index + 1}`;

    return <Paper variant="outlined" sx={{p: 2}}>
        <Stack spacing={2}>
            <Stack direction="row" sx={{justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="subtitle2" color="text.secondary">{instrumentLabel}</Typography>
                {canRemove && (
                    <Button size="small" color="error" onClick={onRemove}
                            aria-label={`Remove ${instrumentLabel.toLowerCase()}`}>
                        Remove
                    </Button>
                )}
            </Stack>
            <TextField select
                       label="Instrument"
                       value={group.instrumentId}
                       onChange={(event) => onChange({...group, instrumentId: event.target.value})}
                       helperText={instrument.description}>
                {instruments.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                ))}
            </TextField>
            <Autocomplete multiple
                          autoHighlight
                          disableCloseOnSelect
                          limitTags={8}
                          options={noteOptions}
                          value={group.notes}
                          onChange={(event, notes) => onChange({...group, notes: sortByPitch(notes, noteOptions)})}
                          renderInput={(params) => (
                              <TextField {...params}
                                         label="Notes"
                                         placeholder="Type a note, e.g. A4"/>
                          )}/>
        </Stack>
    </Paper>;
}

// keep rows in pitch order, no matter the order the notes were picked in
function sortByPitch(notes, noteOptions) {
    return [...notes].sort((a, b) => noteOptions.indexOf(a) - noteOptions.indexOf(b));
}
