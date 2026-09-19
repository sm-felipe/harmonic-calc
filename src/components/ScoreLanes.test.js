import {fireEvent, render, screen} from '@testing-library/react';
import ScoreLanes from './ScoreLanes';
import {indexOfNote} from '../service/notes';

const score = {
    title: 'Test',
    parts: [
        {staffN: '1', name: 'Superius', instrumentId: 'voice-a', transposeSemitones: 0},
        {staffN: '2', name: 'Bassus', instrumentId: 'voice-a', transposeSemitones: 0},
    ],
    notes: [
        {ids: ['n1'], partIndex: 0, pitchIndex: indexOfNote('C5'), startMs: 0, endMs: 1000},
        {ids: ['n2'], partIndex: 0, pitchIndex: indexOfNote('D5'), startMs: 1000, endMs: 2000},
        {ids: ['n3'], partIndex: 1, pitchIndex: indexOfNote('C3'), startMs: 0, endMs: 2000},
    ],
    changes: [{timeMs: 0, notes: [0, 2]}, {timeMs: 1000, notes: [1, 2]}, {timeMs: 2000, notes: []}],
    durationMs: 2000,
    pageCount: 1,
};

function lanes(props = {}) {
    let view = render(<ScoreLanes score={score} onInstrumentChange={jest.fn()} {...props}/>);
    // the lane drawing, not the arrow icons the selects render
    let svg = view.container.querySelector('svg[role="img"]');
    return {
        ...view,
        svg,
        // lane backgrounds have no opacity attribute; notes do
        notes: [...svg.querySelectorAll('rect')].filter((rect) => rect.hasAttribute('opacity')),
        playhead: svg.querySelector('line[stroke="#212529"]'),
    };
}

test('every part gets a lane, named, and every note a block', () => {
    let {notes} = lanes();
    expect(screen.getByText('Superius')).toBeInTheDocument();
    expect(screen.getByText('Bassus')).toBeInTheDocument();
    expect(notes).toHaveLength(3);
});

test('the parts are told apart by colour, and a part keeps one colour throughout', () => {
    let {notes} = lanes();
    let [first, second, bass] = notes.map((rect) => rect.getAttribute('fill'));
    expect(first).toBe(second);          // both belong to the Superius
    expect(bass).not.toBe(first);
});

test('notes sounding now are solid and the rest are dimmed', () => {
    let {notes} = lanes({sounding: [0, 2]});
    expect(notes.map((rect) => rect.getAttribute('opacity'))).toEqual(['1', '0.55', '1']);
});

test('the playhead sits where the position says, proportionally', () => {
    let atStart = lanes({positionMs: 0});
    expect(Number(atStart.playhead.getAttribute('x1'))).toBe(0);

    let halfway = lanes({positionMs: 1000});
    let width = Number(halfway.svg.getAttribute('width'));
    expect(Number(halfway.playhead.getAttribute('x1'))).toBeCloseTo(width / 2, 6);
});

test('clicking the lanes seeks to that moment', () => {
    let onSeek = jest.fn();
    let {svg} = lanes({onSeek});
    // jsdom gives every element a zero-sized box, so drive the maths directly
    svg.getBoundingClientRect = () => ({left: 0, width: 200, top: 0, height: 100});

    fireEvent.click(svg, {clientX: 50});
    expect(onSeek).toHaveBeenCalledWith(500);

    fireEvent.click(svg, {clientX: -20});
    expect(onSeek).toHaveBeenLastCalledWith(0);       // never before the start

    fireEvent.click(svg, {clientX: 400});
    expect(onSeek).toHaveBeenLastCalledWith(2000);    // nor past the end
});

test('a lane offers the timbre it was guessed with, and reports a change', () => {
    let onInstrumentChange = jest.fn();
    lanes({onInstrumentChange});

    let select = screen.getByLabelText('Instrument for Superius');
    expect(select).toHaveValue('voice-a');

    fireEvent.change(select, {target: {value: 'trumpet'}});
    expect(onInstrumentChange).toHaveBeenCalledWith(0, 'trumpet');
});

test('a timbre already chosen for a part wins over the guess', () => {
    lanes({partChoices: {1: 'bassoon'}});
    expect(screen.getByLabelText('Instrument for Bassus')).toHaveValue('bassoon');
    expect(screen.getByLabelText('Instrument for Superius')).toHaveValue('voice-a');
});

test('a part that never sounds does not break the drawing', () => {
    let silent = {...score, parts: [...score.parts, {staffN: '3', name: 'Quintus', instrumentId: 'voice-a', transposeSemitones: 0}]};
    expect(() => render(<ScoreLanes score={silent} onInstrumentChange={jest.fn()}/>)).not.toThrow();
    expect(screen.getByText('Quintus')).toBeInTheDocument();
});
