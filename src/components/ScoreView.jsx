import {useEffect, useRef, useState} from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useContainerWidth from "./useContainerWidth";

// The score as it is written: staves, clefs, key signatures, beams, ties and
// text, engraved by Verovio, with the notes sounding at the playhead picked out
// in colour.
//
// Two things make this cheap enough to keep in step with the music. The layout
// is redone only when the width changes — redoLayout keeps every element id, so
// the map from notes to ids that musicXml.js built stays good — and the
// highlight is a class added to a handful of elements, which costs nothing
// next to rebuilding the spectrum.

// Verovio measures its page in tenths of a millimetre and then scales it, so
// this is the factor from a width in pixels to the page width it wants.
// 50 puts about ten bars on a line of a four-voice score, which is close to
// what a printed edition does; 40 crams in thirteen and the noteheads get small.
const SCALE = 50;
const UNITS_PER_PIXEL = 100 / SCALE;
// the height of an A4 page in Verovio's units, which at this scale takes about
// three systems of a four-voice score
const PAGE_HEIGHT_UNITS = 2970;
// Below this the staves are too small to read: on a phone the score keeps this
// width and is panned sideways instead, which is more use than a legible-in-
// theory reflow that puts one bar on a line.
const MIN_SCORE_WIDTH_PX = 700;
// running the whole piece on one line needs a page with no bounds to speak of;
// Verovio then sizes the drawing to the music rather than to this
const UNBOUNDED_PAGE_UNITS = 60000;
// where the note being sung is held as the score slides past, as a fraction of
// the width: a third in leaves what is coming visible
const FOLLOW_ANCHOR = 1 / 3;
const SOUNDING_COLOUR = '#d32f2f';

export default function ScoreView({score, sounding = [], following = false, continuous = false}) {
    let [containerRef, containerWidth] = useContainerWidth();
    let [page, setPage] = useState(1);
    let [pageCount, setPageCount] = useState(score.pageCount);
    let [markup, setMarkup] = useState('');
    let host = useRef(null);

    // Lay the piece out to the width there is, then draw the page. Both belong
    // to one effect because the page count is only known after the re-layout.
    useEffect(() => {
        if (!containerWidth) {
            return;
        }
        let toolkit = score.toolkit;
        // The page grows to the systems it holds, up to this height: pinning it
        // shorter leaves a four-voice system alone on each page with half a page
        // of white under it, because one system with its lyrics is tall.
        // The height is passed every time rather than left out, because
        // setOptions merges into whatever the toolkit already carries.
        toolkit.setOptions(continuous
            ? {
                scale: SCALE,
                breaks: 'none',
                pageWidth: UNBOUNDED_PAGE_UNITS,
                pageHeight: UNBOUNDED_PAGE_UNITS,
                adjustPageHeight: true,
            }
            : {
                scale: SCALE,
                breaks: 'auto',
                pageWidth: Math.round(Math.max(containerWidth, MIN_SCORE_WIDTH_PX) * UNITS_PER_PIXEL),
                pageHeight: PAGE_HEIGHT_UNITS,
                adjustPageHeight: true,
            });
        toolkit.redoLayout();
        let count = toolkit.getPageCount();
        setPageCount(count);
        setMarkup(toolkit.renderToSVG(Math.min(page, count), {}));
    }, [score, containerWidth, page, continuous]);

    // Turn the page for the music rather than making the reader do it. Keyed
    // off the first sounding note, so paging by hand while stopped stays put.
    let leading = sounding.length ? score.notes[sounding[0]].ids[0] : null;
    useEffect(() => {
        if (!leading) {
            return;
        }
        let where = score.toolkit.getPageWithElement(leading);
        if (where > 0) {
            setPage(where);
        }
    }, [score, leading]);

    // Mark what is sounding, and take the marks off again when it changes.
    // While the piece plays, bring the line being sung into view as well: a
    // page holds several systems and the one in hand is often below the fold.
    useEffect(() => {
        let root = host.current;
        if (!root) {
            return undefined;
        }
        let marked = [];
        for (let index of sounding) {
            for (let id of score.notes[index].ids) {
                let element = root.querySelector(`#${CSS.escape(id)}`);
                if (element) {
                    element.classList.add('sounding');
                    marked.push(element);
                }
            }
        }
        if (following && marked.length) {
            bringIntoView(containerRef.current, marked[0]);
        }
        return () => marked.forEach((element) => element.classList.remove('sounding'));
        // `following` deliberately absent: starting to play should not scroll
        // on its own, only the next note that sounds should
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [score, sounding, markup]);

    return <Box>
        <Box ref={containerRef}
             sx={{
                 overflowX: 'auto',
                 '& svg': {display: 'block'},
                 // the glyphs are <use> references, so the colour has to reach them
                 '& .sounding, & .sounding use, & .sounding rect, & .sounding path, & .sounding ellipse': {
                     fill: SOUNDING_COLOUR,
                 },
             }}>
            <div ref={host} dangerouslySetInnerHTML={{__html: markup}}/>
        </Box>
        {pageCount > 1 && (
            <Stack direction="row" spacing={1} sx={{alignItems: 'center', mt: 1}}>
                <Button size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Typography variant="caption" color="text.secondary" translate="no">
                    Page {Math.min(page, pageCount)} of {pageCount}
                </Typography>
                <Button size="small" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button>
            </Stack>
        )}
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
            The score as written, engraved from the file itself. Notes sounding at the playhead are red.
            {continuous
                ? ' Every part runs on one line, as the lanes do, and the score slides past as the piece plays.'
                : ' The page turns itself to follow the music.'}
        </Typography>
    </Box>;
}

/**
 * Keeps an element in sight as the music moves on. A score on one line is held
 * inside its own sideways scroller, so that is nudged along; a page of a score
 * is taller than the window instead, so the window is what scrolls.
 */
function bringIntoView(scroller, element) {
    if (!scroller || !element.getBoundingClientRect) {
        return;
    }
    if (scroller.scrollWidth > scroller.clientWidth) {
        let box = scroller.getBoundingClientRect();
        let mark = element.getBoundingClientRect();
        scroller.scrollLeft += mark.left - box.left - box.width * FOLLOW_ANCHOR;
    } else if (element.scrollIntoView) {
        element.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
}
