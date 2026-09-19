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
import scrollShadows from "./scrollShadows";
import {formatCents, tuningColor} from "../service/tuning";
import {loudnessColor} from "../service/loudness";

/**
 * `minRows` keeps the table at a settled height when the notes under it come
 * and go: a piece that is sometimes in three parts and sometimes in four would
 * otherwise grow and shrink a row at a time, and everything below it — the
 * spectrum above all — would jump up and down with every chord.
 */
export default function HarmonicTable({harmonicMatrix, minRows = 0}) {
    // one column per harmonic number up to the highest audible one; inaudible
    // partials (below the cutoff) leave their cell empty
    let columnCount = Math.max(9, ...harmonicMatrix.map((row) => lastHarmonicNumber(row)));
    let headers = Array.from({length: columnCount}, (_, index) => columnLabel(index));
    let padding = Math.max(0, minRows - harmonicMatrix.length);

    return <Box sx={{mb: 2}}>
        <Typography variant="overline" component="h2"
                    sx={{display: 'block', lineHeight: 1.5, mb: 0.5, color: 'text.secondary'}}>
            Selected notes
        </Typography>
        {/* the table never wraps: it grows to the right and scrolls horizontally */}
        <TableContainer component={Paper} variant="outlined" sx={{overflowX: 'auto', ...scrollShadows}}>
            <Table size="small" sx={{width: 'max-content', minWidth: '100%', whiteSpace: 'nowrap'}}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={instrumentColumn}>Instrument</TableCell>
                        {headers.map((header, column) => (
                            <Tooltip key={header} title={columnHint(column)} placement="top">
                                <TableCell align={column === 0 ? 'left' : 'right'}>{header}</TableCell>
                            </Tooltip>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {harmonicMatrix.map((harmonicRow, rowIndex) => {
                        let byHarmonicNumber = new Map(
                            harmonicRow.harmonics.map((frequency) => [frequency.harmonicNumber, frequency]));
                        return <TableRow key={rowIndex + ':' + harmonicRow.note} hover>
                            {/* its own column rather than a fourth line under the
                                fundamental, which made every row a line taller */}
                            <Tooltip title={harmonicRow.instrument.label} placement="top" enterDelay={300}>
                                <TableCell sx={{...instrumentColumn, verticalAlign: 'top'}}>
                                    {/* the row is three lines tall anyway, so the name
                                        wraps into that rather than being cut short */}
                                    <Typography variant="caption" color="text.secondary" sx={instrumentName}>
                                        {harmonicRow.instrument.label}
                                    </Typography>
                                </TableCell>
                            </Tooltip>
                            {headers.map((header, column) => {
                                let frequency = byHarmonicNumber.get(column + 1);
                                return <TableCell key={header} align="right" sx={{verticalAlign: 'top'}}>
                                    {frequency && <PartialCell frequency={frequency} fundamental={harmonicRow.harmonics[0]}/>}
                                </TableCell>;
                            })}
                        </TableRow>;
                    })}
                    {harmonicMatrix.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={columnCount + 1} align="center"
                                       sx={{color: 'text.secondary', py: 3}}>
                                Pick one or more notes to see their harmonics
                            </TableCell>
                        </TableRow>
                    )}
                    {/* blank rows built the same way as real ones, so the height
                        they hold is exactly the height a note would take */}
                    {Array.from({length: padding}, (_, index) => (
                        <TableRow key={`empty-${index}`} aria-hidden="true">
                            <TableCell sx={{...instrumentColumn, verticalAlign: 'top'}}>
                                <Typography variant="caption" sx={{display: 'block'}}>&nbsp;</Typography>
                            </TableCell>
                            <TableCell sx={{verticalAlign: 'top'}}><EmptyCell/></TableCell>
                            {headers.slice(1).map((header) => <TableCell key={header}/>)}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        {harmonicMatrix.length > 0 && <ColourLegend/>}
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
    let snapped = frequency.snapped ? ` Snapped onto the note from its natural ${frequency.naturalFrequency.toFixed(2)} Hz.` : '';
    return `${what}: ${frequency.frequency.toFixed(2)} Hz, ${tuning} ${frequency.nearestNote} (${frequency.nearestNoteFrequency.toFixed(2)} Hz).${snapped} Level ${frequency.levelDb.toFixed(0)} dB relative to the note's loudest partial.`;
}

const numeric = {
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
};

// The instrument stays in view as the harmonics scroll past, held to a width
// so it cannot crowd them out; longer names than three lines will hold are cut,
// and the tooltip carries the whole of it either way.
const instrumentColumn = {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    bgcolor: 'background.paper',
    borderRight: 1,
    borderColor: 'divider',
    maxWidth: 132,
    minWidth: 132,
};

const instrumentName = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
    whiteSpace: 'normal',
    lineHeight: 1.35,
};

// a partial cell's worth of nothing, to hold a blank row open
function EmptyCell() {
    return <Box sx={{display: 'grid', gridTemplateColumns: 'auto max-content', columnGap: 0.75, alignItems: 'baseline'}}>
        <Box component="span" sx={numeric}>&nbsp;</Box><span/>
        <Box component="span" sx={numeric}>&nbsp;</Box><span/>
        <Box component="span" sx={{...numeric, fontSize: '0.75rem'}}>&nbsp;</Box><span/>
    </Box>;
}

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
