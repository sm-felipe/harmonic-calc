import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import {CUSTOM_LEVEL_PRESETS, CUTOFF_DB} from "../service/instruments";

// Drawbar-style editor for the custom instrument: one vertical slider per
// partial, 0 dB at the top and "off" (the audibility cutoff) at the bottom.
// Collapsed by default so it stays out of the way of people who just want
// to pick notes.
export default function HarmonicLevels({levels, onChange}) {
    function setLevel(index, value) {
        let next = [...levels];
        next[index] = value;
        onChange(next);
    }

    return <Accordion disableGutters elevation={0} square
                      sx={{border: 1, borderColor: 'divider', borderRadius: 1, '&:before': {display: 'none'}}}>
        <AccordionSummary expandIcon={<ExpandIcon/>}
                          sx={{
                              minHeight: 30,
                              px: 1.5,
                              '&.Mui-expanded': {minHeight: 30},
                              '& .MuiAccordionSummary-content': {my: 0, '&.Mui-expanded': {my: 0}},
                          }}>
            <Typography variant="caption" noWrap sx={{lineHeight: '30px', minWidth: 0}}>
                Harmonic levels
                <Box component="span" sx={{color: 'text.secondary', ml: 1}}>adjust each partial</Box>
            </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{pt: 0, px: 1}}>
            {/* nine 24px columns fit the 300px side column; more would scroll sideways */}
            <Box sx={{overflowX: 'auto'}}>
                <Stack direction="row" sx={{justifyContent: 'space-between', width: 'max-content', minWidth: '100%'}}>
                    {levels.map((level, index) => (
                        <Stack key={index} sx={{alignItems: 'center', width: 24}}>
                            <Slider orientation="vertical"
                                    aria-label={`Harmonic ${index + 1} level`}
                                    value={level}
                                    min={CUTOFF_DB}
                                    max={0}
                                    step={1}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={formatLevel}
                                    onChange={(event, value) => setLevel(index, value)}
                                    sx={{height: 120, py: 0, '& .MuiSlider-thumb': {width: 16, height: 16}}}/>
                            <Typography variant="caption" color="text.secondary" sx={{mt: 0.5, lineHeight: 1}}>
                                {index + 1}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1, px: 1}}>
                dB below the loudest possible partial; the bottom of a slider switches the harmonic off.
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{mt: 1, px: 0.5, flexWrap: 'wrap'}}>
                {CUSTOM_LEVEL_PRESETS.map((preset) => (
                    <Button key={preset.id} size="small" onClick={() => onChange([...preset.levels])}>
                        {preset.label}
                    </Button>
                ))}
            </Stack>
        </AccordionDetails>
    </Accordion>;
}

function formatLevel(value) {
    return value <= CUTOFF_DB ? 'off' : `${value} dB`;
}

function ExpandIcon() {
    return <SvgIcon fontSize="small">
        <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </SvgIcon>;
}
