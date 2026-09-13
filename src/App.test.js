import {fireEvent, render, screen, waitForElementToBeRemoved, within} from '@testing-library/react';
import App from './App';

test('starts with one instrument group, the player and the results', () => {
    render(<App/>);
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^notes$/i)).toHaveLength(1);
    expect(screen.getByText(/Custom \(adjustable harmonics\)/)).toBeInTheDocument();
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
    expect(screen.getAllByText(/Custom \(adjustable harmonics\)/)).toHaveLength(2 + 2);
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
    expect(screen.getByLabelText(/^key$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/A4 \(Hz\)/i)).toBeInTheDocument();
    // equal temperament lets you force sharps or flats
    expect(screen.getByLabelText(/accidentals/i)).toBeInTheDocument();

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
    // unequal temperaments decide the spelling themselves
    expect(screen.queryByLabelText(/accidentals/i)).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(/^key$/i));
    fireEvent.click(screen.getByRole('option', {name: /^A major/}));
    // with A as the tonic, the 5th harmonic of A3 is exactly C#6
    expect(within(fifthHarmonic()).getByText('0¢')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(/A4 \(Hz\)/i));
    fireEvent.click(screen.getByRole('option', {name: /^415 Hz/}));
    expect(within(screen.getAllByRole('row', {hidden: true})[1]).getAllByText('207.50').length).toBeGreaterThan(0);
});

test('spelling follows the key, and a note can be found by either spelling', () => {
    render(<App/>);
    let input = screen.getByLabelText(/^notes$/i);
    // around C the chain spells the minor third as Eb; typing D# finds it too
    fireEvent.mouseDown(input);
    fireEvent.change(input, {target: {value: 'D#4'}});
    fireEvent.click(screen.getByRole('option', {name: 'Eb4'}));
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(within(screen.getAllByRole('row')[1]).getByText('Eb4')).toBeInTheDocument();

    // in E major the same pitch is D#
    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    fireEvent.mouseDown(screen.getByLabelText(/^key$/i));
    fireEvent.click(screen.getByRole('option', {name: /^E major/}));
    expect(within(screen.getAllByRole('row', {hidden: true})[1]).getByText('D#4')).toBeInTheDocument();

    // forcing flats in equal temperament overrides the key
    fireEvent.mouseDown(screen.getByLabelText(/accidentals/i));
    fireEvent.click(screen.getByRole('option', {name: /^Flats/}));
    expect(within(screen.getAllByRole('row', {hidden: true})[1]).getByText('Eb4')).toBeInTheDocument();
});

test('the custom instrument has collapsed harmonic level sliders that drive the table', () => {
    render(<App/>);
    pickNote(screen.getByLabelText(/^notes$/i), 'A4');
    let secondHarmonic = () => within(screen.getAllByRole('row')[1]).getAllByRole('cell')[1];
    expect(within(secondHarmonic()).getByText('-3 dB')).toBeInTheDocument();

    // collapsed by default: the sliders are not visible until the section is expanded
    expect(screen.queryByRole('slider', {name: /harmonic 2 level/i})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /harmonic levels/i}));
    let slider = screen.getByRole('slider', {name: /harmonic 2 level/i});
    expect(slider).toHaveValue('-3');

    fireEvent.change(slider, {target: {value: -12}});
    expect(within(secondHarmonic()).getByText('-12 dB')).toBeInTheDocument();

    // sliding to the bottom switches the harmonic off
    fireEvent.change(slider, {target: {value: -30}});
    expect(secondHarmonic()).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole('button', {name: /^odd only$/i}));
    expect(secondHarmonic()).toBeEmptyDOMElement();
    expect(within(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[2]).getByText('-6 dB')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /^linear$/i}));
    expect(within(secondHarmonic()).getByText('-3 dB')).toBeInTheDocument();
});

test('"Show wave" in the options draws one wavelength of the resulting sound', async () => {
    render(<App/>);
    pickNote(screen.getByLabelText(/^notes$/i), 'A3');
    expect(screen.queryByRole('img', {name: /one wavelength/i})).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    fireEvent.click(screen.getByLabelText(/show wave/i));
    let wave = screen.getByRole('img', {name: /3 wavelengths of A3, 9 partials/i, hidden: true});
    expect(wave).toBeInTheDocument();
    expect(screen.getByText(/3 wavelengths of A3, 4\.55 ms each/, {hidden: true})).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(/cycles/i));
    fireEvent.click(screen.getByRole('option', {name: '8'}));
    expect(screen.getByRole('img', {name: /8 wavelengths of A3/i, hidden: true})).toBeInTheDocument();

    // it follows the sound: switching a harmonic off changes the partial count
    fireEvent.click(screen.getByRole('button', {name: /close menu/i}));
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', {name: 'Options'}));
    fireEvent.click(screen.getByRole('button', {name: /harmonic levels/i}));
    fireEvent.change(screen.getByRole('slider', {name: /harmonic 2 level/i}), {target: {value: -30}});
    expect(screen.getByRole('img', {name: /8 partials/i})).toBeInTheDocument();
});
