import {useEffect, useRef, useState} from "react";
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {HarmonicPlayer} from "../service/audioPlayer";

export default function Player({harmonicMatrix}) {
    let [playing, setPlaying] = useState(false);
    let [volume, setVolume] = useState(100);
    let playerRef = useRef(null);
    let volumeRef = useRef(volume);
    volumeRef.current = volume;

    let hasNotes = harmonicMatrix.length > 0;

    // follow the sound while playing (gliding gains when only levels change,
    // restarting otherwise); stop when asked to or when the last note is removed
    useEffect(() => {
        if (playing && hasNotes) {
            player(playerRef).update(harmonicMatrix, volumeRef.current / 100);
        } else if (playing) {
            setPlaying(false);
        } else if (playerRef.current) {
            playerRef.current.stop();
        }
    }, [playing, hasNotes, harmonicMatrix]);

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

    return <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
        <Button variant="contained"
                color={playing ? 'error' : 'primary'}
                disabled={!playing && !hasNotes}
                onClick={() => setPlaying(!playing)}
                sx={{minWidth: 96, flexShrink: 0}}>
            {playing ? '■ Stop' : '▶ Play'}
        </Button>
        <Typography variant="body2" color="text.secondary">Volume</Typography>
        <Slider aria-label="Volume"
                value={volume}
                min={0}
                max={100}
                onChange={(event, value) => setVolume(value)}
                sx={{flexGrow: 1}}/>
    </Stack>;
}

function player(playerRef) {
    if (!playerRef.current) {
        playerRef.current = new HarmonicPlayer();
    }
    return playerRef.current;
}
