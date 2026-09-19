import Autocomplete, {createFilterOptions} from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {findInstrument, instruments} from "../service/instruments";
import HarmonicLevels from "./HarmonicLevels";
import {octaveHints, octaveOf, pitchIndices} from "../service/notes";
import {searchNamesOf} from "../service/spelling";

// One instrument and the notes it plays. Several groups can be combined so
// that, say, a bassoon holds the bass while voices sing the upper parts.
export default function InstrumentGroup({index, group, noteNames, canRemove, onChange, onRemove}) {
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
            <Autocomplete multiple
                          autoHighlight
                          disableCloseOnSelect
                          limitTags={8}
                          options={pitchIndices}
                          getOptionLabel={(note) => noteNames[note]}
                          filterOptions={filterByAnySpelling}
                          groupBy={(note) => octaveOf(note)}
                          renderGroup={renderOctaveGroup}
                          renderOption={renderNoteOption}
                          slotProps={{listbox: {sx: compactNoteList}, chip: {translate: 'no'}}}
                          value={group.notes}
                          onChange={(event, notes) => onChange({...group, notes: sortByPitch(notes)})}
                          renderInput={(params) => (
                              <TextField {...params}
                                         label="Notes"
                                         placeholder="Type a note, e.g. A4"/>
                          )}/>
            <TextField select
                       label="Instrument"
                       value={group.instrumentId}
                       onChange={(event) => onChange({...group, instrumentId: event.target.value})}
                       helperText={instrument.description}>
                {instruments.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                ))}
            </TextField>
            {instrument.customizable && (
                <HarmonicLevels levels={group.harmonicLevels || instrument.defaultLevels}
                                open={Boolean(group.showLevels)}
                                onChange={(harmonicLevels) => onChange({...group, harmonicLevels})}/>
            )}
        </Stack>
    </Paper>;
}

// Group header "Octave N" with an optional landmark hint on the right. Uses
// MUI's own class names so the compact styles below still apply.
function renderOctaveGroup({key, group, children}) {
    let hint = octaveHints[group];
    return <li key={key}>
        <div className="MuiAutocomplete-groupLabel">
            <span className="octave-name">Octave {group}</span>
            {hint && <span className="octave-hint">{hint}</span>}
        </div>
        <ul className="MuiAutocomplete-groupUl">{children}</ul>
    </li>;
}

// Each octave as a 6-column grid (C..F over F#..B) with compact cells, so a
// whole octave takes three short rows instead of twelve tall ones.
const compactNoteList = {
    maxHeight: '60vh',
    py: 0,
    '& .MuiAutocomplete-groupLabel': {
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
        lineHeight: 1.4,
        py: 0.5,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        backgroundColor: 'background.paper',
        position: 'sticky',
        top: -1,
    },
    '& .octave-name': {
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    '& .octave-hint': {
        textTransform: 'none',
        letterSpacing: 0,
        fontWeight: 400,
        color: 'text.secondary',
        whiteSpace: 'normal',
        textAlign: 'right',
        marginLeft: 'auto',
    },
    '& .MuiAutocomplete-groupUl': {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        px: 0.5,
        pb: 0.5,
    },
    // MUI indents grouped options with a more specific selector, so match it
    '& .MuiAutocomplete-groupUl .MuiAutocomplete-option': {
        minHeight: 28,
        px: 0,
        py: 0,
        justifyContent: 'center',
        fontSize: '0.75rem',
        borderRadius: 1,
    },
};

// note names must survive browser translation ("A4" is not a paper size)
function renderNoteOption(props, note, state, ownerState) {
    let {key, ...rest} = props;
    return <li key={key} {...rest} translate="no">{ownerState.getOptionLabel(note)}</li>;
}

// typing "Eb4" or "D#4" finds the same pitch, whatever the current spelling
const filterByAnySpelling = createFilterOptions({
    stringify: (note) => searchNamesOf(note).join(' '),
});

// keep rows in pitch order, no matter the order the notes were picked in
function sortByPitch(notes) {
    return [...notes].sort((a, b) => a - b);
}
