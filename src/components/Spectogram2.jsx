import {Axis, BarSeries, Legend, Plot} from "react-plot";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {CUTOFF_DB} from "../service/instruments";
import {tuningColor} from "../service/tuning";
import scrollShadows from "./scrollShadows";
import useContainerWidth from "./useContainerWidth";

// The model gives levels relative to each note's loudest partial (0 dB). The
// plot draws them as bars rising from the audibility cutoff, so a taller bar
// is a louder partial; the axis is labelled in those relative dB.
const REFERENCE_DB = 80;
const FLOOR_DB = REFERENCE_DB + CUTOFF_DB;
// past this many partials the note labels overlap and are dropped
const MAX_LABELLED_PARTIALS = 40;
// one colour per note, in a fixed order, shared by bars, markers and legend
const SERIES_COLOURS = ['#d32f2f', '#1976d2', '#2e7d32', '#7b1fa2', '#ef6c00', '#00838f', '#5d4037', '#c2185b'];
const LEGEND_ROW_PX = 13;
// the plot fills its container; below this width it scrolls sideways instead
const MIN_PLOT_WIDTH = 560;

export function Spectogram2({harmonicMatrix}) {
    let series = convertToPlotData(harmonicMatrix);
    let partialCount = series.reduce((sum, row) => sum + row.length, 0);
    let labelled = partialCount <= MAX_LABELLED_PARTIALS;
    let [containerRef, containerWidth] = useContainerWidth();
    let plotWidth = Math.max(MIN_PLOT_WIDTH, Math.floor(containerWidth));

    return <Box sx={{mt: 2}}>
        <Typography variant="overline" component="h2"
                    sx={{display: 'block', lineHeight: 1.5, color: 'text.secondary'}}>
            Spectrum
        </Typography>
        {/* note labels and numbers must not be machine-translated */}
        <Box ref={containerRef} translate="no" sx={{overflowX: 'auto', ...scrollShadows}}>
            {/* react-plot draws the bottom legend inside the plot box, so the
                bottom margin stays tiny and the height grows with the legend */}
            <Plot width={plotWidth} height={232 + LEGEND_ROW_PX * series.length}
                  margin={{left: 60, right: 40, top: 20, bottom: 4}}>
                {series.map((row, index) => {
                    let colour = SERIES_COLOURS[index % SERIES_COLOURS.length];
                    return <BarSeries key={index}
                                      data={row}
                                      displayMarkers
                                      lineStyle={{stroke: colour}}
                                      markerStyle={{fill: colour}}
                                      label={`${harmonicMatrix[index].noteName} · ${harmonicMatrix[index].instrument.label}`}
                                      pointLabel={labelled ? ({nearestNote}) => nearestNote : undefined}
                                      pointLabelStyle={{fill: ({cents}) => tuningColor(cents), fontSize: 11}}/>;
                })}
                <Axis position="left"
                      label="Level (dB, relative)"
                      min={FLOOR_DB} max={REFERENCE_DB + 5}
                      tickLabelFormat={(value) => `${Math.round(value - REFERENCE_DB)}`}/>
                <Axis position="bottom" label="Frequency (Hz)" paddingStart={20} paddingEnd={50}/>
                <Legend position="bottom" showHide labelStyle={{fontSize: 12}}/>
            </Plot>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
            One bar per partial; height is its level in dB below the note's loudest partial. Labels name the
            nearest note, coloured by how far off it is. Click a legend entry to hide or show that note.
            {!labelled && ' Labels are hidden while there are this many partials.'}
        </Typography>
    </Box>;
}

function convertToPlotData(harmonicMatrix) {
    return harmonicMatrix.map((harmonicRow) => harmonicRow.harmonics.map((partial) => ({
        x: partial.frequency,
        y: REFERENCE_DB + partial.levelDb,
        nearestNote: partial.nearestNote,
        cents: partial.cents,
    })));
}
