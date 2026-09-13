import {fireEvent, render, screen, waitForElementToBeRemoved, within} from '@testing-library/react';
import App from './App';

test('starts with one instrument group, the player and the results', () => {
    render(<App/>);
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^notes$/i)).toHaveLength(1);
    expect(screen.getByText(/Hypothetical/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /play/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /remove/i})).not.toBeInTheDocument();
});

test('add instrument creates a paired instrument/notes group that can be removed', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /add instrument/i}));

    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(2);
    expect(screen.getAllByLabelText(/^notes$/i)).toHaveLength(2);
    expect(screen.getByText('Instrument 2')).toBeInTheDocument();
    let removeButtons = screen.getAllByRole('button', {name: /remove instrument/i});
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(1);
    expect(screen.queryByRole('button', {name: /remove instrument/i})).not.toBeInTheDocument();
});

test('notes from every group end up in the table, labelled with their instrument', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /add instrument/i}));
    let [firstNotes, secondNotes] = screen.getAllByLabelText(/^notes$/i);

    pickNote(firstNotes, 'A4');
    pickNote(secondNotes, 'A4');

    let rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByText('440.00').length).toBeGreaterThan(0);
    expect(within(rows[1]).getAllByText('440.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hypothetical \(linear decay\)/)).toHaveLength(2 + 2);
});

function pickNote(input, note) {
    fireEvent.mouseDown(input);
    fireEvent.change(input, {target: {value: note}});
    fireEvent.click(screen.getByRole('option', {name: note}));
    fireEvent.keyDown(input, {key: 'Escape'});
}

test('the hamburger menu opens and closes the options drawer', async () => {
    render(<App/>);
    expect(screen.queryByRole('heading', {name: 'Options'})).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    expect(screen.getByRole('heading', {name: 'Options'})).toBeInTheDocument();
    expect(screen.getByLabelText(/temperament/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/A4 \(Hz\)/i)).toBeInTheDocument();
    // equal temperament has no reference note
    expect(screen.queryByLabelText(/reference note/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /close menu/i}));
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', {name: 'Options'}));
});

test('note options are grouped by octave', () => {
    render(<App/>);
    let input = screen.getByLabelText(/^notes$/i);
    fireEvent.mouseDown(input);
    fireEvent.change(input, {target: {value: 'A'}});

    let listbox = screen.getByRole('listbox');
    let headers = within(listbox).getAllByText(/^Octave \d+$/).map((header) => header.textContent);
    expect(headers.slice(0, 3)).toEqual(['Octave 0', 'Octave 1', 'Octave 2']);
    expect(within(listbox).getByRole('option', {name: 'A4'})).toBeInTheDocument();
    // landmark hints sit next to some octave headers
    expect(within(listbox).getByText(/middle C/)).toBeInTheDocument();
    expect(within(listbox).getByText(/highest piano key/)).toBeInTheDocument();
});

test('changing the temperament re-tunes notes already on screen', () => {
    render(<App/>);
    pickNote(screen.getByLabelText(/^notes$/i), 'A3');
    // the open drawer hides the page from the accessibility tree, hence `hidden`
    let fifthHarmonic = () => within(screen.getAllByRole('row', {hidden: true})[1]).getAllByRole('cell', {hidden: true})[4];
    expect(within(fifthHarmonic()).getByText('−14¢')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    fireEvent.mouseDown(screen.getByLabelText(/temperament/i));
    fireEvent.click(screen.getByRole('option', {name: /just intonation/i}));
    expect(screen.getByLabelText(/reference note/i)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(/reference note/i));
    fireEvent.click(screen.getByRole('option', {name: 'A'}));
    // with A as the tonic, the 5th harmonic of A3 is exactly C#6
    expect(within(fifthHarmonic()).getByText('0¢')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(/A4 \(Hz\)/i));
    fireEvent.click(screen.getByRole('option', {name: /^415 Hz/}));
    expect(within(screen.getAllByRole('row', {hidden: true})[1]).getAllByText('207.50').length).toBeGreaterThan(0);
});
