import {render, screen, within} from '@testing-library/react';
import HarmonicTable from './HarmonicTable';
import {calculateHarmonicMatrix} from '../service/HarmonicMatrix';
import {findInstrument} from '../service/instruments';
import {tuningColor} from '../service/tuning';
import {indexOfNote} from '../service/notes';
import {loudnessColor} from '../service/loudness';

test('shows a hint when no note is selected, and readable column headers', () => {
    render(<HarmonicTable harmonicMatrix={[]}/>);
    expect(screen.getByText(/pick one or more notes/i)).toBeInTheDocument();
    let headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers).toEqual(['Fundamental', '2×', '3×', '4×', '5×', '6×', '7×', '8×', '9×']);
});

test('cells align the partial and nearest-note frequencies and colour the partial by cents', () => {
    let matrix = calculateHarmonicMatrix([indexOfNote('A3')], findInstrument('custom'));
    render(<HarmonicTable harmonicMatrix={matrix}/>);

    let row = screen.getAllByRole('row')[1];
    let cells = within(row).getAllByRole('cell');
    expect(cells).toHaveLength(9);

    // 7th harmonic of A3 = 1540 Hz, nearest note G6 = 1567.98 Hz, about -31 cents
    let seventh = cells[6];
    expect(within(seventh).getByText('1540.00')).toHaveStyle({color: tuningColor(matrix[0].harmonics[6].cents)});
    expect(within(seventh).getByText('1567.98')).toBeInTheDocument();
    expect(within(seventh).getByText('1567.98').closest('[translate="no"]')).not.toBeNull();
    // hovering spells the cell out
    expect(within(seventh).getByText('1540.00').closest('[aria-label]'))
        .toHaveAttribute('aria-label', expect.stringMatching(/7th partial \(7 × the fundamental\): 1540\.00 Hz, 31 cents below G6 \(1567\.98 Hz\)\. Level -18 dB/));
    // the legend explains the two colour scales
    expect(screen.getByText(/frequency colour/i)).toBeInTheDocument();
    expect(screen.getByText(/level colour/i)).toBeInTheDocument();
    expect(within(seventh).getByText('G6')).toBeInTheDocument();
    expect(within(seventh).getByText('−31¢')).toBeInTheDocument();
    expect(within(seventh).getByText('-18 dB')).toHaveStyle({color: loudnessColor(-18)});
    expect(within(cells[0]).getByText('0 dB')).toHaveStyle({color: loudnessColor(0)});

    // the fundamental is exactly on its note, so both frequency lines read the same
    expect(within(cells[0]).getByText('0¢')).toBeInTheDocument();
    let [partialLine, noteLine] = within(cells[0]).getAllByText('220.00');
    expect(partialLine).toHaveStyle({color: tuningColor(0)});
    expect(noteLine).toBeInTheDocument();
});

test('leaves empty cells for partials below the cutoff', () => {
    let matrix = calculateHarmonicMatrix([indexOfNote('A2')], findInstrument('clarinet'));
    render(<HarmonicTable harmonicMatrix={matrix}/>);
    let cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[11]).toBeEmptyDOMElement();
    expect(cells[10]).not.toBeEmptyDOMElement();
});
