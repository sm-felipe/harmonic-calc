import {describeFigure, fundamentalsOf, nearestRatio, sampleFigure} from './lissajous';
import {calculateHarmonicMatrix} from './HarmonicMatrix';
import {findInstrument} from './instruments';
import {indexOfNote} from './notes';
import {buildTuningContext, defaultTuning} from './temperaments';

const A3 = 220;
const tempered = (semitones) => A3 * Math.pow(2, semitones / 12);

describe('the ratio an interval is near', () => {
    test.each([
        ['a fifth', 330, 3, 2],
        ['a fourth', 220 * 4 / 3, 4, 3],
        ['a major third', 275, 5, 4],
        ['a minor third', 264, 6, 5],
        ['an octave', 440, 2, 1],
        ['a twelfth', 660, 3, 1],
        ['a unison', 220, 1, 1],
    ])('%s is read as its simple ratio', (name, upper, p, q) => {
        let ratio = nearestRatio(A3, upper);
        expect([ratio.p, ratio.q]).toEqual([p, q]);
        expect(ratio.cents).toBeCloseTo(0, 6);
    });

    test('the tempered intervals are read as the pure ones they stand for', () => {
        expect(nearestRatio(A3, tempered(7))).toMatchObject({p: 3, q: 2});
        expect(nearestRatio(A3, tempered(4))).toMatchObject({p: 5, q: 4});
        expect(nearestRatio(A3, tempered(3))).toMatchObject({p: 6, q: 5});
    });

    test('how far off it is comes in cents, wide positive and narrow negative', () => {
        expect(nearestRatio(A3, tempered(7)).cents).toBeCloseTo(-1.955, 2);   // the tempered fifth is narrow
        expect(nearestRatio(A3, tempered(4)).cents).toBeCloseTo(13.686, 2);   // the tempered third is wide
    });
});

describe('how the figure moves', () => {
    test('an interval in an exact ratio stands still', () => {
        expect(describeFigure(A3, 330).driftHz).toBe(0);
        expect(describeFigure(A3, 440).driftHz).toBe(0);
        expect(describeFigure(A3, 275).driftHz).toBe(0);
    });

    test('a tempered fifth turns at the beat between the 3rd and the 2nd harmonics', () => {
        let figure = describeFigure(A3, tempered(7));
        // 3 × 220 = 660 against 2 × 329.63 = 659.26
        expect(figure.driftHz).toBeCloseTo(3 * 220 - 2 * tempered(7), 6);
        expect(figure.driftHz).toBeCloseTo(0.74, 2);
    });

    test('a tempered third turns far faster than a tempered fifth', () => {
        expect(describeFigure(A3, tempered(4)).driftHz).toBeCloseTo(8.73, 2);
        expect(describeFigure(A3, tempered(4)).driftHz).toBeGreaterThan(10 * describeFigure(A3, tempered(7)).driftHz);
    });

    test('an equal-tempered octave is still pure, so it stands still too', () => {
        expect(describeFigure(tempered(0), tempered(12)).driftHz).toBe(0);
    });
});

describe('the drawing', () => {
    test('one window is enough to close the figure of an exact ratio', () => {
        let figure = describeFigure(A3, 330);
        let points = sampleFigure(figure);
        let [first, last] = [points[0], points[points.length - 1]];
        expect(last[0]).toBeCloseTo(first[0], 6);
        expect(last[1]).toBeCloseTo(first[1], 6);
    });

    test('every point lies within the unit square', () => {
        let points = sampleFigure(describeFigure(A3, tempered(4)), 1.234);
        expect(points.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1)).toBe(true);
    });

    test('an exact ratio draws the same figure however many windows later', () => {
        let still = describeFigure(A3, 330);
        let now = sampleFigure(still, 0.37);
        let later = sampleFigure(still, 0.37 + 50 * still.window);
        later.forEach(([x, y], i) => {
            expect(x).toBeCloseTo(now[i][0], 6);
            expect(y).toBeCloseTo(now[i][1], 6);
        });
    });

    test('a tempered one has turned half way round after half its turning time', () => {
        let turning = describeFigure(A3, tempered(7));
        let halfTurn = Math.round(1 / turning.driftHz / 2 / turning.window) * turning.window;
        let now = sampleFigure(turning, 0);
        let later = sampleFigure(turning, halfTurn);
        let moved = Math.max(...later.map(([x, y], i) => Math.hypot(x - now[i][0], y - now[i][1])));
        expect(moved).toBeGreaterThan(0.5);
    });
});

describe('which notes there are to draw', () => {
    test('the fundamentals come lowest first, each note once', () => {
        let matrix = [
            ...calculateHarmonicMatrix([indexOfNote('E4'), indexOfNote('A3')], findInstrument('voice-a')),
            ...calculateHarmonicMatrix([indexOfNote('A3')], findInstrument('trumpet')),   // the same note again
        ];
        let notes = fundamentalsOf(matrix);
        expect(notes.map((note) => note.noteName)).toEqual(['A3', 'E4']);
        expect(notes[0].frequency).toBeCloseTo(220, 6);
    });

    test('a note whose fundamental has been switched off still has one to draw', () => {
        // the custom instrument with its first slider at the bottom
        let levels = [-30, 0, -3, -6, -9, -12, -15, -18, -21];
        let [row] = calculateHarmonicMatrix([indexOfNote('A3')], findInstrument('custom'), undefined, levels);
        expect(row.harmonics[0].harmonicNumber).toBe(2);
        expect(fundamentalsOf([row])[0].frequency).toBeCloseTo(220, 6);
    });

    test('snapping the partials does not move the notes they belong to', () => {
        let snapped = buildTuningContext({...defaultTuning, snap: true});
        let [row] = calculateHarmonicMatrix([indexOfNote('A3')], findInstrument('custom'), snapped);
        expect(fundamentalsOf([row])[0].frequency).toBeCloseTo(220, 6);
    });
});
