import {fireEvent, render, screen, waitForElementToBeRemoved, within} from '@testing-library/react';
import App from './App';

import {readFileSync} from 'fs';
import path from 'path';
import {loadVerovio} from './service/verovio';

jest.mock('./service/verovio');

const verovio = require('verovio');

let verovioToolkit;
beforeAll(async () => {
    verovioToolkit = await new Promise((resolve) => {
        (function poll() {
            try {
                let candidate = new verovio.toolkit();
                if (candidate.getVersion()) return resolve(candidate);
            } catch (notReadyYet) { /* still starting */ }
            setTimeout(poll, 50);
        })();
    });
});
beforeEach(() => loadVerovio.mockResolvedValue(verovioToolkit));

beforeEach(() => window.history.replaceState(null, '', '/'));

test('starts with one instrument group, the player and a quick start instead of results', () => {
    render(<App/>);
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^notes$/i)).toHaveLength(1);
    expect(screen.getByText(/Custom \(adjustable harmonics\)/)).toBeInTheDocument();
    // exact: an example's description mentions playing too
    expect(screen.getByRole('button', {name: '▶ Play'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /remove/i})).not.toBeInTheDocument();
    expect(screen.getByRole('heading', {name: /see and hear the harmonic series/i})).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('an example fills the selectors and the tuning in one click', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /A major chord, justly tuned/i}));

    expect(screen.queryByRole('heading', {name: /see and hear/i})).not.toBeInTheDocument();
    expect(screen.getByRole('heading', {name: /^spectrum$/i})).toBeInTheDocument();
    let rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getAllByText(/Singing voice, vowel "a"/).length).toBeGreaterThan(0);
    // just intonation from A: the 5th partial of A3 is exactly C#6
    expect(within(within(rows[0]).getAllByRole('cell')[4]).getByText('0¢')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    expect(screen.getByLabelText(/temperament/i)).toHaveTextContent(/just intonation/i);
    expect(screen.getByLabelText(/^key$/i)).toHaveTextContent(/A major/);
});

test('the two-group example creates two instrument boxes', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /odd harmonics only/i}));
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(2);
    expect(screen.getAllByRole('button', {name: /remove instrument/i})).toHaveLength(2);
    // the custom group's 2nd harmonic is off, the clarinet's is merely weak
    let rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getAllByRole('cell')[1]).toBeEmptyDOMElement();
    expect(within(rows[1]).getAllByRole('cell')[1]).not.toBeEmptyDOMElement();
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
    // each row names its instrument (the selectors and the chart legend say it too)
    expect(within(screen.getByRole('table')).getAllByText(/Custom \(adjustable harmonics\)/)).toHaveLength(2);
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

    // references sit collapsed at the end
    expect(screen.getByText(/Fletcher/)).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', {name: /references/i}));
    expect(screen.getByText(/Fletcher/)).toBeVisible();
    expect(screen.getByRole('link', {name: /UNSW/})).toHaveAttribute('href', 'https://www.phys.unsw.edu.au/music/');

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
    let caption = (content, element) => element.classList.contains('MuiTypography-caption')
        && /3 wavelengths of A3, 4\.55 ms each/.test(element.textContent);
    expect(screen.getByText(caption)).toBeInTheDocument();

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

test('the address bar follows the configuration, and a link restores it', () => {
    render(<App/>);
    expect(window.location.search).toBe('');
    fireEvent.click(screen.getByRole('button', {name: /A major chord, justly tuned/i}));
    expect(window.location.search).toBe('?g=voice-a:A3,Db4,E4&t=just&k=A');
});

test('opening a link reproduces its notes, instruments and tuning', () => {
    window.history.replaceState(null, '', '/?g=bassoon:Bb1;clarinet:A3&t=meantone&k=E&a4=415&wave=2');
    render(<App/>);
    let rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Bassoon')).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Clarinet/)).toBeInTheDocument();
    expect(within(rows[1]).getAllByText('207.50').length).toBeGreaterThan(0);   // A3 with A4 = 415 Hz
    // in E major the chain spells the bassoon's note A#1, and the wave shows two of its cycles
    expect(within(rows[0]).getByText('A#1')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: /2 wavelengths of A#1/i})).toBeInTheDocument();
});

test('copy link puts the current address on the clipboard', async () => {
    let written = [];
    Object.defineProperty(navigator, 'clipboard', {value: {writeText: (text) => { written.push(text); return Promise.resolve(); }}, configurable: true});
    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /A bassoon/i}));
    fireEvent.click(screen.getByRole('button', {name: /copy link/i}));
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
    expect(written[0]).toMatch(/\?g=bassoon:Bb1$/);
});

test('Back returns to the previous configuration instead of leaving the site', async () => {
    render(<App/>);
    let lengthBefore = window.history.length;
    fireEvent.click(screen.getByRole('button', {name: /A bassoon/i}));
    expect(window.location.search).toBe('?g=bassoon:Bb1');
    expect(window.history.length).toBe(lengthBefore + 1);

    // the browser moves back to the empty address and tells the page
    window.history.replaceState(null, '', '/');
    fireEvent(window, new PopStateEvent('popstate'));
    expect(await screen.findByRole('heading', {name: /see and hear the harmonic series/i})).toBeInTheDocument();
    expect(window.location.search).toBe('');
});

test('dragging a harmonic level does not pile up history entries', () => {
    render(<App/>);
    pickNote(screen.getByLabelText(/^notes$/i), 'A4');
    let lengthAfterNote = window.history.length;
    fireEvent.click(screen.getByRole('button', {name: /harmonic levels/i}));
    let slider = screen.getByRole('slider', {name: /harmonic 2 level/i});
    fireEvent.change(slider, {target: {value: -10}});
    fireEvent.change(slider, {target: {value: -12}});
    expect(window.location.search).toContain('~0.-12.');
    expect(window.history.length).toBe(lengthAfterNote);
});

test('"Clear all" brings the quick start back', () => {
    render(<App/>);
    expect(screen.queryByRole('button', {name: /clear all/i})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /odd harmonics only/i}));
    fireEvent.click(screen.getByRole('button', {name: /clear all/i}));
    expect(screen.getByRole('heading', {name: /see and hear the harmonic series/i})).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^instrument$/i)).toHaveLength(1);
});

test('"Snap partials to notes" puts every partial on 0 cents and lands in the link', () => {
    render(<App/>);
    pickNote(screen.getByLabelText(/^notes$/i), 'A3');
    let cellsText = () => within(screen.getAllByRole('row', {hidden: true})[1]).getAllByRole('cell', {hidden: true}).map((cell) => cell.textContent);
    expect(cellsText().some((text) => /−14¢/.test(text))).toBe(true);

    fireEvent.click(screen.getByRole('button', {name: /open menu/i}));
    fireEvent.click(screen.getByLabelText(/snap partials to notes/i));
    expect(cellsText().every((text) => /0¢/.test(text))).toBe(true);
    expect(cellsText().some((text) => /1567\.98 Hz|1567\.98/.test(text))).toBe(true);
    expect(window.location.search).toContain('snap=1');
});

test('the Josquin example opens the score it ships with, ready to play', async () => {
    let bytes = readFileSync(path.join(__dirname, '..', 'public', 'scores', 'mille-regretz.mxl'));
    global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        arrayBuffer: async () => { let copy = new Uint8Array(bytes.length); copy.set(bytes); return copy.buffer; },
    }));

    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /Josquin, Mille Regretz/i}));

    expect(await screen.findByText('Mille Regretz', {}, {timeout: 30000})).toBeInTheDocument();
    expect(screen.getByText(/4 parts · 297 notes · 1:22/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /play score/i})).toBeEnabled();
    // the hand-picked side steps aside while a score is open, but stays built
    // so that closing the score gives back whatever was being worked on
    expect(screen.getByText('Instrument 1')).not.toBeVisible();
}, 60000);

test('an example that cannot be fetched says so instead of doing nothing', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: false}));

    render(<App/>);
    fireEvent.click(screen.getByRole('button', {name: /Josquin, Mille Regretz/i}));

    expect(await screen.findByText(/could not be fetched/i)).toBeInTheDocument();
});
