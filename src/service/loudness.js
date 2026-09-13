import {CUTOFF_DB} from "./instruments";

// Colour for a partial's level relative to the loudest partial of its note.
// A sequential scale: the loudest partial is a dark, saturated teal and the
// colour fades towards a pale grey-green at the cutoff, so the eye reads
// "strong colour = strong partial". Teal is far from the blue/violet/red used
// by the tuning scale, so the two never get confused within a cell.
export function loudnessColor(levelDb, cutoffDb = CUTOFF_DB) {
    let t = Math.min(1, Math.max(0, levelDb / cutoffDb)); // 0 = loudest, 1 = at the cutoff
    let saturation = 70 - t * 55;
    let lightness = 28 + t * 42;
    return `hsl(160 ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`;
}
