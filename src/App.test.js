import {fireEvent, render, screen, within} from '@testing-library/react';
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
