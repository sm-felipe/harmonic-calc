import {amplitudeFromDb, HarmonicPlayer, mixScale} from './audioPlayer';

function fakeParam(value = 0) {
    return {
        value,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        setTargetAtTime: jest.fn(),
        cancelScheduledValues: jest.fn(),
    };
}

function fakeNode(params) {
    let node = {connect: jest.fn(), disconnect: jest.fn()};
    for (let [name, value] of Object.entries(params)) {
        node[name] = fakeParam(value);
    }
    return node;
}

function fakeContext() {
    let context = {
        currentTime: 1,
        state: 'suspended',
        destination: {},
        oscillators: [],
        resume: jest.fn(() => { context.state = 'running'; return Promise.resolve(); }),
        close: jest.fn(),
        createGain: () => fakeNode({gain: 1}),
        createDynamicsCompressor: () => fakeNode({threshold: 0, knee: 0, ratio: 1, attack: 0, release: 0}),
        createOscillator() {
            let oscillator = fakeNode({frequency: 0});
            oscillator.type = '';
            oscillator.start = jest.fn();
            oscillator.stop = jest.fn();
            context.oscillators.push(oscillator);
            return oscillator;
        },
    };
    return context;
}

const matrix = [
    {note: 'A4', harmonics: [{frequency: 440, levelDb: 0}, {frequency: 880, levelDb: -20}]},
    {note: 'E5', harmonics: [{frequency: 659.26, levelDb: 0}]},
];

test('dB to amplitude', () => {
    expect(amplitudeFromDb(0)).toBe(1);
    expect(amplitudeFromDb(-20)).toBeCloseTo(0.1);
    expect(amplitudeFromDb(-6.02)).toBeCloseTo(0.5, 2);
});

test('mix scale keeps power constant and is zero for silence', () => {
    expect(mixScale([])).toBe(0);
    expect(mixScale([{harmonics: [{levelDb: 0}]}])).toBeCloseTo(0.5);
    expect(mixScale(matrix)).toBeCloseTo(0.5 / Math.sqrt(1 + 0.01 + 1));
});

test('start creates one sine per partial with its frequency and gain, and resumes the context', () => {
    let context = fakeContext();
    let player = new HarmonicPlayer(() => context);
    player.start(matrix, 0.8);

    expect(context.resume).toHaveBeenCalled();
    expect(player.playing).toBe(true);
    expect(context.oscillators).toHaveLength(3);
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual([440, 880, 659.26]);
    expect(context.oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
    expect(context.oscillators.every((oscillator) => oscillator.start.mock.calls.length === 1)).toBe(true);
    expect(player.master.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, 1, expect.any(Number));
});

test('stop fades out and stops every oscillator; restarting replaces them', () => {
    let context = fakeContext();
    let player = new HarmonicPlayer(() => context);
    player.start(matrix);
    let first = [...context.oscillators];
    player.stop();
    expect(player.playing).toBe(false);
    expect(first.every((oscillator) => oscillator.stop.mock.calls.length === 1)).toBe(true);

    player.start(matrix);
    expect(context.oscillators).toHaveLength(6);
    expect(first.every((oscillator) => oscillator.stop.mock.calls.length === 1)).toBe(true);
    player.stop();
    expect(context.oscillators.slice(3).every((oscillator) => oscillator.stop.mock.calls.length === 1)).toBe(true);
});

test('setVolume before start is a no-op and close releases the context', () => {
    let context = fakeContext();
    let player = new HarmonicPlayer(() => context);
    player.setVolume(0.5);
    player.start(matrix);
    player.close();
    expect(context.close).toHaveBeenCalled();
    expect(player.playing).toBe(false);
});

test('update glides gains in place when only levels change, and restarts otherwise', () => {
    let context = fakeContext();
    let player = new HarmonicPlayer(() => context);
    player.start(matrix);
    expect(context.oscillators).toHaveLength(3);

    let quieter = [
        {note: 'A4', harmonics: [{frequency: 440, levelDb: -6}, {frequency: 880, levelDb: -20}]},
        {note: 'E5', harmonics: [{frequency: 659.26, levelDb: 0}]},
    ];
    player.update(quieter);
    expect(context.oscillators).toHaveLength(3);   // no restart
    expect(player.partials[0].gain.gain.setTargetAtTime).toHaveBeenCalledWith(expect.closeTo(0.501, 2), 1, expect.any(Number));

    let fewer = [{note: 'A4', harmonics: [{frequency: 440, levelDb: 0}]}];
    player.update(fewer);
    expect(context.oscillators).toHaveLength(4);   // restarted with one oscillator
    expect(player.partials).toHaveLength(1);

    player.stop();
    player.update(matrix);                          // not playing: behaves like start
    expect(player.playing).toBe(true);
});

test('whenRunning reports whether the context produces sound', async () => {
    let player = new HarmonicPlayer(fakeContext);
    expect(await player.whenRunning()).toBe(false);   // no context yet
    player.start(matrix);
    expect(await player.whenRunning()).toBe(true);
});
