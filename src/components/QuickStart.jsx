import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {examples} from "../service/examples";

// What the visitor sees before picking any note: what the app does, and
// three examples that fill the selectors with one click.
export default function QuickStart({onPick}) {
    return <Paper variant="outlined" sx={{p: {xs: 2, md: 3}}}>
        <Typography variant="h6" component="h2" sx={{mb: 0.5}}>See and hear the harmonic series</Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Pick notes and an instrument on the left. The table lists every audible partial with the note it is
            closest to and how far off it is; the chart shows their levels; Play sums them into sound.
            Or start from an example:
        </Typography>
        <Stack spacing={1.5}>
            {examples.map((example) => (
                <Button key={example.id}
                        variant="outlined"
                        onClick={() => onPick(example)}
                        sx={{justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none', py: 1.25}}>
                    <Stack>
                        <Typography variant="subtitle2" component="span">{example.title}</Typography>
                        <Typography variant="caption" component="span" color="text.secondary">
                            {example.description}
                        </Typography>
                    </Stack>
                </Button>
            ))}
        </Stack>
    </Paper>;
}
