import {fireEvent, render, screen} from '@testing-library/react';
import Player from './Player';

const matrix = [{note: 'A4', harmonics: [{frequency: 440, levelDb: 0}]}];

test('play is disabled without notes and the volume slider starts at maximum', () => {
    render(<Player harmonicMatrix={[]}/>);
    expect(screen.getByRole('button', {name: /play/i})).toBeDisabled();
    expect(screen.getByRole('slider', {name: /volume/i})).toHaveValue('100');
});

test('play turns into stop while sounding and back', () => {
    let oscillators = [];
    window.AudioContext = function () {
        let param = () => ({
            value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {}
        });
        let node = (params) => Object.fromEntries([['connect', () => {}], ...params.map((name) => [name, param()])]);
        return {
            currentTime: 0, state: 'running', destination: {}, resume() {}, close() {},
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
