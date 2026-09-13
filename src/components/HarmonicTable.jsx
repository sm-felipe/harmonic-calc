import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ColourLegend from "./ColourLegend";
import {formatCents, tuningColor} from "../service/tuning";
import {loudnessColor} from "../service/loudness";

export default function HarmonicTable({harmonicMatrix}) {
    // one column per harmonic number up to the highest audible one; inaudible
    // partials (below the cutoff) leave their cell empty
    let columnCount = Math.max(9, ...harmonicMatrix.map((row) => lastHarmonicNumber(row)));
    let headers = Array.from({length: columnCount}, (_, index) => columnLabel(index));

    return <Box sx={{mb: 2}}>
        <Typography variant="overline" component="h2"
                    sx={{display: 'block', lineHeight: 1.5, mb: 0.5, color: 'text.secondary'}}>
            Selected notes
        </Typography>
        {harmonicMatrix.length > 0 && <ColourLegend/>}
        {/* the table never wraps: it grows to the right and scrolls horizontally */}
        <TableContainer component={Paper} variant="outlined" sx={{overflowX: 'auto'}}>
            <Table size="small" sx={{width: 'max-content', minWidth: '100%', whiteSpace: 'nowrap'}}>
                <TableHead>
                    <TableRow>
                        {headers.map((header, column) => (
                            <Tooltip key={header} title={columnHint(column)} placement="top">
                                <TableCell align={column === 0 ? 'left' : 'right'}
                                           sx={column === 0 ? stickyColumn : undefined}>
                                    {header}
                                </TableCell>
                            </Tooltip>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {harmonicMatrix.map((harmonicRow, rowIndex) => {
                        let byHarmonicNumber = new Map(
                            harmonicRow.harmonics.map((frequency) => [frequency.harmonicNumber, frequency]));
                        return <TableRow key={rowIndex + ':' + harmonicRow.note} hover>
                            {headers.map((header, column) => {
                                let frequency = byHarmonicNumber.get(column + 1);
                                return <TableCell key={header}
                                                  align="right"
                                                  sx={{verticalAlign: 'top', ...(column === 0 ? stickyColumn : {})}}>
                                    {frequency && <PartialCell frequency={frequency} fundamental={harmonicRow.harmonics[0]}/>}
                                    {column === 0 && (
                                        <Typography variant="caption" color="text.secondary" noWrap
                                                    sx={{display: 'block', textAlign: 'left', mt: 0.5}}>
                                            {harmonicRow.instrument.label}
                                        </Typography>
                                    )}
                                </TableCell>;
                            })}
                        </TableRow>;
                    })}
                    {harmonicMatrix.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={columnCount} align="center"
                                       sx={{color: 'text.secondary', py: 3}}>
                                Pick one or more notes to see their harmonics
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>;
}

// Two right-aligned frequency lines with the same number of decimals, so the
// partial's frequency and its nearest note's line up digit by digit. The
// partial's frequency is coloured by how far apart they are, and its level
// by how loud it is. Hovering spells the whole thing out.
function PartialCell({frequency}) {
    let color = tuningColor(frequency.cents);
    let levelColor = loudnessColor(frequency.levelDb);
    // translate="no": note names, frequencies and units must survive browser translation
    return <Tooltip title={describePartial(frequency)} placement="top" enterDelay={300}>
    <Box translate="no"
                sx={{display: 'grid', gridTemplateColumns: 'auto max-content', columnGap: 0.75, alignItems: 'baseline'}}>
        <Box component="span" sx={{...numeric, fontWeight: 600, color}}>
            {frequency.frequency.toFixed(2)}
        </Box>
        <Box component="span" sx={{fontSize: '0.75rem', color, textAlign: 'left'}}>
            {formatCents(frequency.cents)}
        </Box>

        <Box component="span" sx={{...numeric, color: 'text.secondary'}}>
            {frequency.nearestNoteFrequency.toFixed(2)}
        </Box>
        <Box component="span" sx={{fontSize: '0.75rem', fontWeight: 600, textAlign: 'left'}}>
            {frequency.nearestNote}
        </Box>

        <Box component="span" sx={{...numeric, fontSize: '0.75rem', fontWeight: 600, color: levelColor}}>
            {frequency.levelDb.toFixed(0)} dB
        </Box>
        <span/>
    </Box>
    </Tooltip>;
}

function describePartial(frequency) {
    let n = frequency.harmonicNumber;
    let what = n === 1 ? 'Fundamental' : `${ordinal(n)} partial (${n} × the fundamental)`;
    let cents = Math.round(frequency.cents);
    let tuning = cents === 0 ? 'exactly on' : `${Math.abs(cents)} cents ${cents > 0 ? 'above' : 'below'}`;
    return `${what}: ${frequency.frequency.toFixed(2)} Hz, ${tuning} ${frequency.nearestNote} (${frequency.nearestNoteFrequency.toFixed(2)} Hz). Level ${frequency.levelDb.toFixed(0)} dB relative to the note's loudest partial.`;
}

const numeric = {
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
};

const stickyColumn = {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    bgcolor: 'background.paper',
    borderRight: 1,
    borderColor: 'divider',
};

function lastHarmonicNumber(row) {
    return row.harmonics.length ? row.harmonics[row.harmonics.length - 1].harmonicNumber : 0;
}

function columnLabel(index) {
    return index === 0 ? 'Fundamental' : `${index + 1}×`;
}

function columnHint(index) {
    if (index === 0) {
        return 'The note itself: its frequency, its name and its level. The instrument is written underneath.';
    }
    return `${ordinal(index + 1)} partial: ${index + 1} times the fundamental frequency`;
}

function ordinal(n) {
    let mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) {
        return n + 'th';
    }
    switch (n % 10) {
        case 1: return n + 'st';
        case 2: return n + 'nd';
        case 3: return n + 'rd';
        default: return n + 'th';
    }
}
