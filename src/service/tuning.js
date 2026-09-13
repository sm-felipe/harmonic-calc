// Deviation of a frequency from a reference note, in cents (1/100 of an
// equal-tempered semitone), and a colour scale for it.

export const MAX_CENTS = 50; // half a semitone: the farthest a frequency can be from its nearest note

export function centsOff(frequency, referenceFrequency) {
    return 1200 * Math.log2(frequency / referenceFrequency);
}

// Blue when the frequency sits on the note, shading through violet to red at
// a quarter tone away. Hue runs the short way round the wheel (blue 215° →
// magenta → red 360°) so the scale never passes through green, which a
// tuner would read as "in tune".
export function tuningColor(cents) {
    let t = Math.min(1, Math.abs(cents) / MAX_CENTS);
    let hue = 215 + t * 145;
    let saturation = 65 + t * 15;
    let lightness = 45 - t * 3;
    return `hsl(${hue.toFixed(0)} ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`;
}

export function formatCents(cents) {
    let rounded = Math.round(cents);
    if (rounded === 0) {
        return '0¢';
    }
    return (rounded > 0 ? '+' : '−') + Math.abs(rounded) + '¢';
}
