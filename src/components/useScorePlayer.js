import {useCallback, useEffect, useRef, useState} from "react";
import {ScorePlayer} from "../service/scorePlayer";

// Drives a ScorePlayer from React and reports where the playhead is.
//
// The position is read on animation frames rather than pushed from the player,
// because the audio clock is the truth and React only needs to catch up with
// it; nothing is scheduled from here. While the piece is stopped the loop does
// not run at all.
export default function useScorePlayer(score, {tuningContext, parts, volume = 1} = {}) {
    let playerRef = useRef(null);
    let [playing, setPlaying] = useState(false);
    let [positionMs, setPositionMs] = useState(0);
    let [error, setError] = useState(null);

    // The options are read inside callbacks that must not be rebuilt on every
    // render, so they are kept in a ref rather than in the dependency lists.
    let settings = useRef();
    settings.current = {tuningContext, parts, volume};

    let player = useCallback(() => {
        if (!playerRef.current) {
            playerRef.current = new ScorePlayer();
        }
        return playerRef.current;
    }, []);

    let play = useCallback((fromMs) => {
        if (!score) {
            return;
        }
        let {tuningContext: tuning, parts: chosen, volume: level} = settings.current;
        let from = fromMs ?? 0;
        try {
            let current = player();
            current.onEnded = () => {
                setPlaying(false);
                setPositionMs(score.durationMs);
            };
            current.start(score, {tuningContext: tuning, parts: chosen, volume: level, fromMs: from});
            setPlaying(true);
            setPositionMs(from);
            current.whenRunning().then((running) => {
                if (!running) {
                    setError('The browser did not let the sound start. Check its autoplay or sound settings and press Play again.');
                    current.stop();
                    setPlaying(false);
                }
            });
        } catch (failure) {
            setError('This browser cannot play sound here (Web Audio is unavailable).');
            setPlaying(false);
        }
    }, [score, player]);

    let stop = useCallback(() => {
        if (playerRef.current) {
            playerRef.current.stop();
            setPositionMs(playerRef.current.positionMs);
        }
        setPlaying(false);
    }, []);

    // Moving the playhead while the piece is sounding picks it up again from
    // there, which is what dropping a needle on a record does.
    let seek = useCallback((timeMs) => {
        setPositionMs(timeMs);
        if (playing) {
            play(timeMs);
        } else {
            // build the player if this is the first thing anyone does, so the
            // offset is held where the sound will start from rather than only
            // in React's state
            player().seek(timeMs);
        }
    }, [playing, play, player]);

    // follow the audio clock while sounding
    useEffect(() => {
        if (!playing) {
            return undefined;
        }
        let frame = requestAnimationFrame(function follow() {
            if (playerRef.current) {
                setPositionMs(playerRef.current.positionMs);
            }
            frame = requestAnimationFrame(follow);
        });
        return () => cancelAnimationFrame(frame);
    }, [playing]);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume);
        }
    }, [volume]);

    // Giving a part a different instrument changes the whole spectrum, so the
    // piece picks up again from where it is with the new timbre.
    let timbreKey = (parts || []).map((part) => part.instrumentId).join(',');
    useEffect(() => {
        if (playing && playerRef.current) {
            play(playerRef.current.positionMs);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timbreKey]);

    // A retuning is different: the same notes carry on, their partials only
    // move, so the voices glide across and the music is not interrupted. When a
    // voice cannot be expressed that way the player says so and we restart.
    //
    // The tuning is compared by identity, so the caller has to memoise it — an
    // unmemoised context would restart the piece on every render, and the
    // symptom would be continuous stuttering rather than an obvious error.
    useEffect(() => {
        if (!playing || !playerRef.current) {
            return;
        }
        if (!playerRef.current.retune(tuningContext)) {
            play(playerRef.current.positionMs);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tuningContext]);

    // A different piece, or none: never carry a playhead across.
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.stop();
        }
        setPlaying(false);
        setPositionMs(0);
    }, [score]);

    useEffect(() => () => {
        if (playerRef.current) {
            playerRef.current.close();
        }
    }, []);

    return {
        playing,
        positionMs,
        durationMs: score ? score.durationMs : 0,
        play,
        stop,
        seek,
        error,
        dismissError: () => setError(null),
    };
}
