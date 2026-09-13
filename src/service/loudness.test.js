import {loudnessColor} from './loudness';
import {CUTOFF_DB} from './instruments';

test('loudness colour fades from dark teal at 0 dB to pale grey-green at the cutoff', () => {
    expect(loudnessColor(0)).toBe('hsl(160 70% 28%)');
    expect(loudnessColor(CUTOFF_DB)).toBe('hsl(160 15% 70%)');
    expect(loudnessColor(CUTOFF_DB / 2)).toBe('hsl(160 43% 49%)');
});

test('levels outside the range are clamped', () => {
    expect(loudnessColor(5)).toBe(loudnessColor(0));
    expect(loudnessColor(CUTOFF_DB - 20)).toBe(loudnessColor(CUTOFF_DB));
});
