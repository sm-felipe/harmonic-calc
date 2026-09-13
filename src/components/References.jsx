import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

// Where the numbers come from. Collapsed at the end of the options drawer.
const sections = [
    {
        title: 'Instrument presets',
        items: [
            {
                text: 'Jürgen Meyer, Acoustics and the Performance of Music (Springer, 2009).',
                note: 'Formant regions and spectral character of the orchestral instruments and the singing voice; the main source for the presets.',
            },
            {
                text: 'Neville H. Fletcher & Thomas D. Rossing, The Physics of Musical Instruments (Springer, 2nd ed. 1998).',
                note: 'Source spectra, body resonances, tone-hole cutoff, and the pluck-position comb used for the guitar.',
            },
            {
                text: 'Johan Sundberg, The Science of the Singing Voice (Northern Illinois University Press, 1987).',
                note: 'Glottal source slope, vowel formants and the singer\'s formant behind the two voice presets.',
            },
            {
                text: 'Music Acoustics, UNSW (Joe Wolfe et al.).',
                href: 'https://www.phys.unsw.edu.au/music/',
                note: 'Measured spectra of flute, clarinet, saxophone, brass and voice, note by note.',
            },
            {
                text: 'SHARC, the Sandell Harmonic Archive.',
                href: 'https://github.com/anton-k/sharc-timbre',
                note: 'Measured harmonic amplitudes for the orchestral instruments, for comparison with the modelled presets.',
            },
        ],
    },
    {
        title: 'Tuning',
        items: [
            {
                text: 'J. Murray Barbour, Tuning and Temperament: A Historical Survey (Michigan State College Press, 1951).',
                note: 'Pythagorean, just, meantone and equal temperament; the Eb..G# chain of fifths.',
            },
            {
                text: 'Bruce Haynes, A History of Performing Pitch: The Story of "A" (Scarecrow Press, 2002).',
                note: 'The reference pitches offered for A4.',
            },
            {
                text: 'ISO 16:1975, Acoustics — Standard tuning frequency.',
                href: 'https://www.iso.org/standard/3601.html',
                note: 'A4 = 440 Hz, the default.',
            },
        ],
    },
    {
        title: 'Perception and sound',
        items: [
            {
                text: 'Hugo Fastl & Eberhard Zwicker, Psychoacoustics: Facts and Models (Springer, 3rd ed. 2007).',
                note: 'Masking and the audibility of beats behind the -30 dB cutoff for partials.',
            },
            {
                text: 'Web Audio API (MDN).',
                href: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API',
                note: 'The player: one sine oscillator per partial.',
            },
        ],
    },
];

export default function References() {
    return <Accordion disableGutters elevation={0} square
                      sx={{border: 1, borderColor: 'divider', borderRadius: 1, '&:before': {display: 'none'}}}>
        <AccordionSummary expandIcon={<ExpandIcon/>}
                          sx={{minHeight: 36, '&.Mui-expanded': {minHeight: 36}, '& .MuiAccordionSummary-content': {my: 0.5, '&.Mui-expanded': {my: 0.5}}}}>
            <Typography variant="body2">References</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{pt: 0}}>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1.5}}>
                Presets are approximations distilled from these sources, not measurements of a particular instrument.
                Notes follow 12-tone equal temperament from A4 = 440 Hz unless changed above.
            </Typography>
            <Stack spacing={2}>
                {sections.map((section) => (
                    <Stack key={section.title} spacing={1}>
                        <Typography variant="overline" sx={{lineHeight: 1.5, color: 'text.secondary'}}>
                            {section.title}
                        </Typography>
                        {section.items.map((item) => (
                            <Typography key={item.text} variant="body2" component="div">
                                {item.href
                                    ? <Link href={item.href} target="_blank" rel="noopener noreferrer">{item.text}</Link>
                                    : item.text}
                                <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                    {item.note}
                                </Typography>
                            </Typography>
                        ))}
                    </Stack>
                ))}
            </Stack>
        </AccordionDetails>
    </Accordion>;
}

function ExpandIcon() {
    return <SvgIcon fontSize="small">
        <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </SvgIcon>;
}
