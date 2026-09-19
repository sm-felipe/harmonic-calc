import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {examples} from "../service/examples";

// What the visitor sees before picking any note: what the app does, and a few
// examples that fill the selectors with one click. The last one opens a score
// instead, which has to be fetched and read, so it can be busy for a moment.
export default function QuickStart({onPick, busyId = null, error = null}) {
    return <Paper variant="outlined" sx={{p: {xs: 2, md: 3}}}>
        <Typography variant="h6" component="h2" sx={{mb: 0.5}}>See and hear the harmonic series</Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Pick notes and an instrument on the left. The table lists every audible partial with the note it is
            closest to and how far off it is; the chart shows their levels; Play sums them into sound.
            Or start from an example:
        </Typography>
        <Stack spacing={1.5}>
            {examples.map((example) => {
                let busy = busyId === example.id;
                return <Button key={example.id}
                               variant="outlined"
                               disabled={busyId !== null && !busy}
                               onClick={() => onPick(example)}
                               sx={{justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none', py: 1.25}}>
                    <Stack sx={{minWidth: 0}}>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography variant="subtitle2" component="span">{example.title}</Typography>
                            {busy && <CircularProgress size={14}/>}
                        </Stack>
                        <Typography variant="caption" component="span" color="text.secondary">
                            {busy ? 'Reading the score…' : example.description}
                        </Typography>
                        {example.credit && (
                            <Typography variant="caption" component="span" color="text.disabled" sx={{mt: 0.5}}>
                                {example.credit}
                            </Typography>
                        )}
                    </Stack>
                </Button>;
            })}
        </Stack>
        {error && <Alert severity="warning" sx={{mt: 2}}>{error}</Alert>}
    </Paper>;
}
