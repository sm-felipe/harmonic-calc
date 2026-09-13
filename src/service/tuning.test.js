import {centsOff, formatCents, MAX_CENTS, tuningColor} from './tuning';

test('cents between a frequency and its nearest note', () => {
    expect(centsOff(440, 440)).toBe(0);
    expect(centsOff(440 * Math.pow(2, 1 / 24), 440)).toBeCloseTo(50);
    expect(centsOff(660, 659.2551)).toBeCloseTo(1.96, 1);   // 3rd harmonic of A3 vs E5
    expect(centsOff(1540, 1567.98)).toBeCloseTo(-31.2, 0);  // 7th harmonic of A3 vs G6
});

test('colour scale runs from blue in tune to red a quarter tone away', () => {
    expect(tuningColor(0)).toBe('hsl(215 65% 45%)');
    expect(tuningColor(MAX_CENTS)).toBe('hsl(360 80% 42%)');
    expect(tuningColor(-MAX_CENTS)).toBe(tuningColor(MAX_CENTS));
    expect(tuningColor(200)).toBe(tuningColor(MAX_CENTS));
    expect(tuningColor(25)).toBe('hsl(288 73% 44%)');
});

test('cents are formatted with an explicit sign', () => {
    expect(formatCents(0.3)).toBe('0¢');
    expect(formatCents(13.6)).toBe('+14¢');
    expect(formatCents(-31.2)).toBe('−31¢');
});
