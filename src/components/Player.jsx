import {useCallback, useEffect, useRef, useState} from "react";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {HarmonicPlayer} from "../service/audioPlayer";

/**
 * One Play button for both ways of making sound: the chord the selectors hold,
 * or, when a score is open, the piece itself.
 *
 * `transport` is what useScorePlayer returns. When it is given the button drives
 * that instead, and this component's own player is silenced: two things making
 * sound at once is never what anyone wants, and there is only one volume slider.
 */
export default function Player({harmonicMatrix, transport = null, onVolumeChange}) {
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
        if (transport) {
            if (playerRef.current) {
                playerRef.current.stop();   // the score has the sound now
            }
            return;
        }
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
    }, [playing, hasNotes, harmonicMatrix, transport]);

    let toggle = useCallback(() => {
        if (transport) {
            if (transport.playing) {
                transport.stop();
            } else {
                // pressing Play at the end starts the piece again rather than
                // playing the silence after it
                let from = transport.positionMs >= transport.durationMs ? 0 : transport.positionMs;
                transport.play(from);
            }
        } else {
            setPlaying((current) => current ? false : hasNotes);
        }
    }, [transport, hasNotes]);

    // space bar toggles play/stop when nothing else has the keyboard
    useEffect(() => {
        function onKeyDown(event) {
            if (event.code !== 'Space' || event.repeat) return;
            let target = event.target;
            if (target && target !== document.body && target.closest('input, textarea, select, button, [role="button"], [role="slider"], [role="combobox"], [contenteditable]')) {
                return;
            }
            event.preventDefault();
            toggle();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggle]);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume / 100);
        }
        if (onVolumeChange) {
            onVolumeChange(volume / 100);
        }
    }, [volume, onVolumeChange]);

    useEffect(() => () => {
        if (playerRef.current) {
            playerRef.current.close();
        }
    }, []);

    let sounding = transport ? transport.playing : playing;
    let canPlay = transport ? true : hasNotes;
    let label = sounding ? '■ Stop'
        : transport ? '▶ Play score'
            : hasNotes ? `▶ Play ${noteCount} note${noteCount === 1 ? '' : 's'}` : '▶ Play';
    let hint = !canPlay ? 'Pick a note first'
        : sounding ? 'Stop (space bar)'
            : transport ? 'Play the score from the playhead (space bar)' : 'Play the selected notes (space bar)';
    let shownError = error || (transport && transport.error) || null;

    function dismiss() {
        setError(null);
        if (transport) {
            transport.dismissError();
        }
    }

    // The clock takes room the narrow desktop column does not have, so the row
    // wraps and the volume control moves to a line of its own rather than
    // shrinking to a stub.
    return <Stack direction="row" spacing={2} useFlexGap
                  sx={{alignItems: 'center', flexWrap: 'wrap', rowGap: 1}}>
        <Tooltip title={hint}>
            <span>
                <Button variant="contained"
                        color={sounding ? 'error' : 'success'}
                        disabled={!sounding && !canPlay}
                        onClick={toggle}
                        sx={{minWidth: 96, flexShrink: 0, whiteSpace: 'nowrap'}}>
                    {label}
                </Button>
            </span>
        </Tooltip>
        {transport && (
            <Typography variant="body2" color="text.secondary" translate="no"
                        sx={{fontVariantNumeric: 'tabular-nums', flexShrink: 0}}>
                {clock(transport.positionMs)} / {clock(transport.durationMs)}
            </Typography>
        )}
        <Stack direction="row" spacing={1} useFlexGap
               sx={{alignItems: 'center', flexGrow: 1, minWidth: 160}}>
            <Typography variant="body2" color="text.secondary" sx={{flexShrink: 0}}>Volume</Typography>
            <Slider aria-label="Volume"
                    value={volume}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                    onChange={(event, value) => setVolume(value)}
                    sx={{flexGrow: 1, mx: 1.5}}/>   {/* room for the thumb at either end */}
        </Stack>
        <Snackbar open={Boolean(shownError)} autoHideDuration={8000} onClose={dismiss}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
            <Alert severity="warning" onClose={dismiss} sx={{maxWidth: 480}}>{shownError}</Alert>
        </Snackbar>
    </Stack>;
}

function clock(milliseconds) {
    let total = Math.max(0, Math.round(milliseconds / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function player(playerRef) {
    if (!playerRef.current) {
        playerRef.current = new HarmonicPlayer();
    }
    return playerRef.current;
}
