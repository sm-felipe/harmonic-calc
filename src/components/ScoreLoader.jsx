import {useRef, useState} from "react";
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {readScore} from "../service/musicXml";

// Opening a score pulls in the engraving engine, which is several megabytes, so
// the wait is worth saying out loud the first time.
export default function ScoreLoader({score, onLoad, onClear}) {
    let [reading, setReading] = useState(false);
    let [error, setError] = useState(null);
    let input = useRef(null);

    async function open(file) {
        if (!file) {
            return;
        }
        setReading(true);
        setError(null);
        try {
            onLoad(await readScore(file));
        } catch (failure) {
            setError(failure.message || 'That file could not be read as a music score.');
        } finally {
            setReading(false);
            if (input.current) {
                input.current.value = '';   // so the same file can be chosen again
            }
        }
    }

    return <Stack spacing={1}>
        <Stack direction="row" spacing={2} useFlexGap
               sx={{alignItems: 'center', flexWrap: 'wrap'}}>
            <Tooltip title="Open a MusicXML file (.musicxml, .xml or .mxl) exported from MuseScore, Finale or Sibelius"
                     describeChild>
                <span>
                    <Button variant="outlined"
                            component="label"
                            disabled={reading}
                            startIcon={reading ? <CircularProgress size={16}/> : null}>
                        {reading ? 'Reading score…' : score ? 'Open another score' : 'Open a score'}
                        <input ref={input}
                               type="file"
                               hidden
                               accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml"
                               onChange={(event) => open(event.target.files[0])}/>
                    </Button>
                </span>
            </Tooltip>

            {score && (
                <>
                    <Box sx={{minWidth: 0}}>
                        <Typography variant="subtitle2" noWrap>{score.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {score.parts.length} part{score.parts.length === 1 ? '' : 's'}
                            {' · '}{score.notes.length} notes
                            {' · '}{formatDuration(score.durationMs)}
                        </Typography>
                    </Box>
                    <Button variant="text" color="inherit" size="small" onClick={onClear}
                            sx={{color: 'text.secondary', ml: 'auto'}}>
                        Close score
                    </Button>
                </>
            )}
            {!score && !reading && (
                <Typography variant="caption" color="text.secondary">
                    The notes of each part are laid out below, and Play works through the piece.
                </Typography>
            )}
        </Stack>

        {error && <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>}
    </Stack>;
}

export function formatDuration(milliseconds) {
    let total = Math.round(milliseconds / 1000);
    let minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
