import {fireEvent, render, screen} from '@testing-library/react';
import Lissajous, {explain, pairFrom} from './Lissajous';
import {calculateHarmonicMatrix} from '../service/HarmonicMatrix';
import {describeFigure} from '../service/lissajous';
import {findInstrument} from '../service/instruments';
import {indexOfNote} from '../service/notes';
import {buildTuningContext, defaultTuning} from '../service/temperaments';

const equal = buildTuningContext(defaultTuning);
const justFromA = buildTuningContext({...defaultTuning, temperamentId: 'just', keyId: 'A'});

function chord(names, tuning = equal) {
    return calculateHarmonicMatrix(names.map(indexOfNote), findInstrument('voice-a'), tuning);
}

let frames;
beforeEach(() => {
    frames = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
    window.requestAnimationFrame.mockRestore();
    window.cancelAnimationFrame.mockRestore();
});

test('one note is not enough, and the figure says what it needs', () => {
    render(<Lissajous harmonicMatrix={chord(['A3'])}/>);
    expect(screen.getByText(/needs two different notes/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

test('two parts on the same note are one note, not a pair', () => {
    let unison = [...chord(['A3']), ...calculateHarmonicMatrix([indexOfNote('A3')], findInstrument('trumpet'))];
    render(<Lissajous harmonicMatrix={unison}/>);
    expect(screen.getByText(/needs two different notes/i)).toBeInTheDocument();
});

test('a pure fifth closes and stands still, so nothing needs animating', () => {
    let {container} = render(<Lissajous harmonicMatrix={chord(['A3', 'E4'], justFromA)}/>);

    expect(screen.getByText(/A3 across, E4 up · 3:2/)).toBeInTheDocument();
    expect(screen.getByText(/exactly 3:2, so the figure closes on itself and stands still/i)).toBeInTheDocument();
    expect(container.querySelector('path').getAttribute('d')).toMatch(/^M/);
    expect(frames).toHaveLength(0);
    // with nothing turning, there is no speed to choose
    expect(screen.queryByRole('group', {name: /speed/i})).not.toBeInTheDocument();
});

test('a tempered fifth turns, is drawn frame by frame, and names the beat', () => {
    let {container} = render(<Lissajous harmonicMatrix={chord(['A3', 'E4'])}/>);

    expect(screen.getByText(/2\.0 cents narrow of 3:2/)).toBeInTheDocument();
    expect(screen.getByText(/once every 1\.3 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/A3's 3rd harmonic and E4's 2nd/)).toBeInTheDocument();

    expect(frames.length).toBeGreaterThan(0);
    let before = container.querySelector('path').getAttribute('d');
    frames.shift()(performance.now() + 400);
    expect(container.querySelector('path').getAttribute('d')).not.toBe(before);
});

test('with three notes or more, the pair can be chosen', () => {
    render(<Lissajous harmonicMatrix={chord(['A3', 'C#4', 'E4'])}/>);
    // the two lowest to begin with
    expect(screen.getByText(/A3 across, C#4 up/)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText('Second note'));
    fireEvent.click(screen.getByRole('option', {name: 'E4'}));
    expect(screen.getByText(/A3 across, E4 up · 3:2/)).toBeInTheDocument();
});

test('choosing for one side what the other has swaps them rather than pairing a note with itself', () => {
    render(<Lissajous harmonicMatrix={chord(['A3', 'C#4', 'E4'])}/>);
    fireEvent.mouseDown(screen.getByLabelText('First note'));
    fireEvent.click(screen.getByRole('option', {name: 'C#4'}));
    // the lower of the two still goes across
    expect(screen.getByText(/A3 across, C#4 up/)).toBeInTheDocument();
});

describe('keeping the chosen pair when the chord changes under it', () => {
    test.each([
        [[0, 1], 4, [0, 1]],
        [[2, 3], 4, [2, 3]],
        [[2, 3], 2, [1, 0]],   // the chord thinned out: stay inside it, and keep two notes
        [[1, 1], 3, [1, 0]],
    ])('%j among %i notes becomes %j', (ranks, count, expected) => {
        expect(pairFrom(ranks, count)).toEqual(expected);
    });
});

test('the explanation says which way off the interval is, and how fast it turns', () => {
    let third = describeFigure(220, 220 * Math.pow(2, 4 / 12));
    let text = explain(third, {noteName: 'A3'}, {noteName: 'C#4'});
    expect(text).toMatch(/13\.7 cents wide of 5:4/);
    expect(text).toMatch(/8\.7 times a second/);
    expect(text).toMatch(/A3's 5th harmonic and C#4's 4th/);
});
