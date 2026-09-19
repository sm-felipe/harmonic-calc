import {render} from '@testing-library/react';
import {Spectogram2} from './Spectogram2';
import {calculateHarmonicMatrix} from '../service/HarmonicMatrix';
import {findInstrument} from '../service/instruments';
import {indexOfNote} from '../service/notes';

function chartHeight(container) {
    return Number(container.querySelector('svg').getAttribute('height'));
}

function matrixOf(...names) {
    return calculateHarmonicMatrix(names.map(indexOfNote), findInstrument('voice-a'));
}

test('the chart grows a legend row per note', () => {
    let one = render(<Spectogram2 harmonicMatrix={matrixOf('A3')}/>);
    let three = render(<Spectogram2 harmonicMatrix={matrixOf('A3', 'C#4', 'E4')}/>);

    expect(chartHeight(three.container) - chartHeight(one.container)).toBe(26);   // two rows
});

test('room kept for the fullest chord holds the height steady as voices drop out', () => {
    let full = render(<Spectogram2 harmonicMatrix={matrixOf('A3', 'C#4', 'E4', 'A4')} minSeries={4}/>);
    let tall = chartHeight(full.container);

    let two = render(<Spectogram2 harmonicMatrix={matrixOf('A3', 'E4')} minSeries={4}/>);
    expect(chartHeight(two.container)).toBe(tall);

    let silent = render(<Spectogram2 harmonicMatrix={[]} minSeries={4}/>);
    expect(chartHeight(silent.container)).toBe(tall);
});

test('without a minimum the chart is only as tall as it needs to be', () => {
    let two = render(<Spectogram2 harmonicMatrix={matrixOf('A3', 'E4')}/>);
    let four = render(<Spectogram2 harmonicMatrix={matrixOf('A3', 'C#4', 'E4', 'A4')}/>);
    expect(chartHeight(four.container)).toBeGreaterThan(chartHeight(two.container));
});
