import {useEffect, useRef, useState} from "react";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {HarmonicPlayer} from "../service/audioPlayer";

export default function Player({harmonicMatrix}) {
    let [playing, setPlaying] = useState(false);
    let [volume, setVolume] = useState(100);
    let [error, setError] = useState(null);
    let playerRef = useRef(null);
    let volumeRef = useRef(volume);
    volumeRef.current = volume;

    let noteCount = harmonicMatrix.length;
    let hasNotes = noteCount > 0;

    // follow the sound while playing (gliding gains when only levels change,
    // restarting otherwise); stop when asked to or when the last note is removed
    useEffect(() => {
        if (playing && hasNotes) {
            try {
                player(playerRef).update(harmonicMatrix, volumeRef.current / 100);
                player(playerRef).whenRunning().then((running) => {
                    if (!running) {
                        setError('The browser did not let the sound start. Check its autoplay or sound settings and press Play again.');
                        setPlaying(false);
                    }
                });
            } catch (failure) {
                setError('This browser cannot play sound here (Web Audio is unavailable).');
                setPlaying(false);
            }
        } else if (playing) {
            setPlaying(false);
        } else if (playerRef.current) {
            playerRef.current.stop();
        }
    }, [playing, hasNotes, harmonicMatrix]);

    // space bar toggles play/stop when nothing else has the keyboard
    useEffect(() => {
        function onKeyDown(event) {
            if (event.code !== 'Space' || event.repeat) return;
            let target = event.target;
            if (target && target !== document.body && target.closest('input, textarea, select, button, [role="button"], [role="slider"], [role="combobox"], [contenteditable]')) {
                return;
            }
            event.preventDefault();
            setPlaying((current) => current ? false : hasNotes);
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [hasNotes]);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume / 100);
        }
    }, [volume]);

    useEffect(() => () => {
        if (playerRef.current) {
            playerRef.current.close();
        }
    }, []);

    let label = playing ? '■ Stop' : hasNotes ? `▶ Play ${noteCount} note${noteCount === 1 ? '' : 's'}` : '▶ Play';
    let hint = !hasNotes ? 'Pick a note first' : playing ? 'Stop (space bar)' : 'Play the selected notes (space bar)';

    return <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
        <Tooltip title={hint}>
            <span>
                <Button variant="contained"
                        color={playing ? 'error' : 'primary'}
                        disabled={!playing && !hasNotes}
                        onClick={() => setPlaying(!playing)}
                        sx={{minWidth: 96, flexShrink: 0, whiteSpace: 'nowrap'}}>
                    {label}
                </Button>
            </span>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">Volume</Typography>
        <Slider aria-label="Volume"
                value={volume}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                onChange={(event, value) => setVolume(value)}
                sx={{flexGrow: 1}}/>
        <Snackbar open={error !== null} autoHideDuration={8000} onClose={() => setError(null)}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
            <Alert severity="warning" onClose={() => setError(null)} sx={{maxWidth: 480}}>{error}</Alert>
        </Snackbar>
    </Stack>;
}

function player(playerRef) {
    if (!playerRef.current) {
        playerRef.current = new HarmonicPlayer();
    }
    return playerRef.current;
}
