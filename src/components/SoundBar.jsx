import {useEffect, useRef, useState} from "react";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Player from "./Player";
import TuningBar from "./TuningBar";

/**
 * Everything to do with the sound, fixed to the bottom of the window: what is
 * playing, how loud, and how it is tuned.
 *
 * It sits here rather than in the top bar because the top bar scrolls away, and
 * so did the Play button when it lived in the side column. The page is long —
 * score, spectrum, table, wave — and comparing two temperaments means listening,
 * changing, listening again. That is one gesture only if the transport and the
 * tuning are in the same place, and that place is still on screen after you have
 * scrolled down to watch the spectrum.
 *
 * A spacer of the bar's own height goes where the bar would have been, so the
 * fixed bar never covers the end of the page. It is measured rather than assumed
 * because the row wraps on a narrow screen.
 */
export default function SoundBar({harmonicMatrix, transport, tuning, onTuningChange, onVolumeChange}) {
    let bar = useRef(null);
    let [height, setHeight] = useState(0);

    useEffect(() => {
        let element = bar.current;
        if (!element) {
            return undefined;
        }
        setHeight(element.offsetHeight);
        let observer = new ResizeObserver(() => setHeight(element.offsetHeight));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return <>
        <Box sx={{height}} aria-hidden="true"/>
        <AppBar ref={bar}
                position="fixed"
                color="default"
                elevation={0}
                component="footer"
                sx={{top: 'auto', bottom: 0, borderTop: 1, borderColor: 'divider'}}>
            <Toolbar variant="dense"
                     sx={{
                         columnGap: {xs: 1, sm: 2},
                         rowGap: 1,
                         flexWrap: 'wrap',
                         py: 1,
                         px: {xs: 1.5, sm: 2},
                         minHeight: 'auto',
                         alignItems: 'center',
                     }}>
                <Player harmonicMatrix={harmonicMatrix}
                        transport={transport}
                        onVolumeChange={onVolumeChange}>
                    <TuningBar tuning={tuning} onChange={onTuningChange}/>
                </Player>
            </Toolbar>
        </AppBar>
    </>;
}
