import {fireEvent, render, screen} from '@testing-library/react';
import Player from './Player';

const matrix = [{note: 'A4', harmonics: [{frequency: 440, levelDb: 0}]}];

test('play is disabled without notes, says why, and the volume slider starts at maximum', () => {
    render(<Player harmonicMatrix={[]}/>);
    expect(screen.getByRole('button', {name: /play/i})).toBeDisabled();
    expect(screen.getByLabelText(/pick a note first/i)).toBeInTheDocument();
    expect(screen.getByRole('slider', {name: /volume/i})).toHaveValue('100');
});

test('play says how many notes it will play', () => {
    render(<Player harmonicMatrix={[...matrix, {note: 'E5', harmonics: [{frequency: 659.26, levelDb: 0}]}]}/>);
    expect(screen.getByRole('button', {name: /play 2 notes/i})).toBeEnabled();
});

test('play turns into stop while sounding and back', () => {
    let oscillators = [];
    window.AudioContext = function () {
        let param = () => ({
            value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {}
        });
        let node = (params) => Object.fromEntries([['connect', () => {}], ...params.map((name) => [name, param()])]);
        return {
            currentTime: 0, state: 'running', destination: {}, resume() { return Promise.resolve(); }, close() {},
            createGain: () => node(['gain']),
            createDynamicsCompressor: () => node(['threshold', 'knee', 'ratio', 'attack', 'release']),
            createOscillator() {
                let oscillator = {...node(['frequency']), start() {}, stop: jest.fn()};
                oscillators.push(oscillator);
                return oscillator;
            },
        };
    };

    render(<Player harmonicMatrix={matrix}/>);
    let button = screen.getByRole('button', {name: /play/i});
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();
    expect(oscillators).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', {name: /stop/i}));
    expect(screen.getByRole('button', {name: /play/i})).toBeInTheDocument();
    expect(oscillators[0].stop).toHaveBeenCalled();
});

test('warns when the browser keeps the sound suspended', async () => {
    window.AudioContext = function () {
        let param = () => ({
            value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {}
        });
        let node = (params) => Object.fromEntries([['connect', () => {}], ...params.map((name) => [name, param()])]);
        return {
            currentTime: 0, state: 'suspended', destination: {}, resume() { return Promise.resolve(); }, close() {},
            createGain: () => node(['gain']),
            createDynamicsCompressor: () => node(['threshold', 'knee', 'ratio', 'attack', 'release']),
            createOscillator: () => ({...node(['frequency']), start() {}, stop() {}}),
        };
    };
    render(<Player harmonicMatrix={matrix}/>);
    fireEvent.click(screen.getByRole('button', {name: /play/i}));
    expect(await screen.findByText(/did not let the sound start/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /play/i})).toBeInTheDocument();
});

// --- with a score open, the same button drives the piece ------------------

function fakeTransport(overrides = {}) {
    return {
        playing: false,
        positionMs: 0,
        durationMs: 82000,
        play: jest.fn(),
        stop: jest.fn(),
        seek: jest.fn(),
        error: null,
        dismissError: jest.fn(),
        ...overrides,
    };
}

test('with a score open the button plays the piece, whatever the selectors hold', () => {
    let transport = fakeTransport({positionMs: 12000});
    render(<Player harmonicMatrix={[]} transport={transport}/>);

    let button = screen.getByRole('button', {name: /play score/i});
    expect(button).toBeEnabled();          // no hand-picked notes needed

    fireEvent.click(button);
    expect(transport.play).toHaveBeenCalledWith(12000);   // from the playhead
});

test('the clock shows where the piece is and how long it runs', () => {
    render(<Player harmonicMatrix={[]} transport={fakeTransport({positionMs: 65000})}/>);
    expect(screen.getByText('1:05 / 1:22')).toBeInTheDocument();
});

test('pressing play at the end starts the piece again', () => {
    let transport = fakeTransport({positionMs: 82000});
    render(<Player harmonicMatrix={[]} transport={transport}/>);

    fireEvent.click(screen.getByRole('button', {name: /play score/i}));
    expect(transport.play).toHaveBeenCalledWith(0);
});

test('while the piece sounds the button stops it', () => {
    let transport = fakeTransport({playing: true});
    render(<Player harmonicMatrix={[]} transport={transport}/>);

    fireEvent.click(screen.getByRole('button', {name: /stop/i}));
    expect(transport.stop).toHaveBeenCalled();
});

test('the space bar drives the score too', () => {
    let transport = fakeTransport();
    render(<Player harmonicMatrix={[]} transport={transport}/>);

    fireEvent.keyDown(document.body, {code: 'Space'});
    expect(transport.play).toHaveBeenCalled();
});

test("the transport's trouble is reported through the same warning", () => {
    render(<Player harmonicMatrix={[]} transport={fakeTransport({error: 'The browser did not let the sound start.'})}/>);
    expect(screen.getByText(/did not let the sound start/i)).toBeInTheDocument();
});
