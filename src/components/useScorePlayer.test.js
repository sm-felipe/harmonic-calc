import {act, renderHook} from '@testing-library/react';
import useScorePlayer from './useScorePlayer';
import {ScorePlayer} from '../service/scorePlayer';

jest.mock('../service/scorePlayer');

// stable, as App's useMemo makes it: identity is what says "the tuning changed"
const TUNING = {names: [], frequencies: []};

const score = {
    title: 'Test',
    parts: [{name: 'Voz', instrumentId: 'voice-a'}],
    notes: [],
    changes: [],
    durationMs: 5000,
};

let instance;

beforeEach(() => {
    instance = {
        positionMs: 0,
        playing: false,
        start: jest.fn(),
        stop: jest.fn(),
        seek: jest.fn(),
        setVolume: jest.fn(),
        close: jest.fn(),
        whenRunning: jest.fn(() => Promise.resolve(true)),
    };
    ScorePlayer.mockImplementation(() => instance);
});

function transport(props = {}) {
    return renderHook(
        ({score: piece, ...rest}) => useScorePlayer(piece, rest),
        {initialProps: {score, tuningContext: TUNING, parts: [{instrumentId: 'voice-a'}], volume: 1, ...props}});
}

test('play hands the score, its timbres and the starting point to the player', () => {
    let {result} = transport();
    act(() => result.current.play(0));

    expect(instance.start).toHaveBeenCalledWith(score, expect.objectContaining({
        parts: [{instrumentId: 'voice-a'}],
        volume: 1,
        fromMs: 0,
    }));
    expect(result.current.playing).toBe(true);
    expect(result.current.durationMs).toBe(5000);
});

test('stopping keeps the playhead where the music was left', () => {
    let {result} = transport();
    act(() => result.current.play(0));

    instance.positionMs = 2500;
    act(() => result.current.stop());

    expect(instance.stop).toHaveBeenCalled();
    expect(result.current.playing).toBe(false);
    expect(result.current.positionMs).toBe(2500);
});

test('seeking while stopped moves the playhead without making a sound', () => {
    let {result} = transport();
    act(() => result.current.seek(1200));

    expect(instance.seek).toHaveBeenCalledWith(1200);
    expect(instance.start).not.toHaveBeenCalled();
    expect(result.current.positionMs).toBe(1200);
});

test('seeking while sounding picks the piece up from there', () => {
    let {result} = transport();
    act(() => result.current.play(0));
    instance.start.mockClear();

    act(() => result.current.seek(3000));
    expect(instance.start).toHaveBeenCalledWith(score, expect.objectContaining({fromMs: 3000}));
    expect(result.current.playing).toBe(true);
});

test('reaching the end stops and leaves the playhead at the end', () => {
    let {result} = transport();
    act(() => result.current.play(0));

    act(() => instance.onEnded());
    expect(result.current.playing).toBe(false);
    expect(result.current.positionMs).toBe(5000);
});

test('giving a part another instrument is heard at once, from where the piece is', () => {
    let {result, rerender} = transport();
    act(() => result.current.play(0));
    instance.start.mockClear();
    instance.positionMs = 1800;

    act(() => rerender({score, tuningContext: TUNING, parts: [{instrumentId: 'trumpet'}], volume: 1}));

    expect(instance.start).toHaveBeenCalledWith(score, expect.objectContaining({
        parts: [{instrumentId: 'trumpet'}],
        fromMs: 1800,
    }));
});

test('retuning the piece is heard at once', () => {
    let {result, rerender} = transport();
    act(() => result.current.play(0));
    instance.start.mockClear();
    instance.positionMs = 900;

    act(() => rerender({score, tuningContext: {names: [], frequencies: [1]}, parts: [{instrumentId: 'voice-a'}], volume: 1}));
    expect(instance.start).toHaveBeenCalledWith(score, expect.objectContaining({fromMs: 900}));
});

test('volume is turned, not restarted', () => {
    let {result, rerender} = transport();
    act(() => result.current.play(0));
    instance.start.mockClear();

    act(() => rerender({score, tuningContext: TUNING, parts: [{instrumentId: 'voice-a'}], volume: 0.4}));

    expect(instance.setVolume).toHaveBeenCalledWith(0.4);
    expect(instance.start).not.toHaveBeenCalled();
});

test('a browser that refuses to start the sound says so rather than pretending', async () => {
    instance.whenRunning.mockResolvedValue(false);
    let {result} = transport();

    await act(async () => { result.current.play(0); });
    expect(result.current.error).toMatch(/did not let the sound start/i);
    expect(result.current.playing).toBe(false);
});

test('closing one score never carries its playhead into the next', () => {
    let {result, rerender} = transport();
    act(() => result.current.play(0));
    instance.positionMs = 4000;
    act(() => result.current.stop());
    expect(result.current.positionMs).toBe(4000);

    let other = {...score, title: 'Another'};
    act(() => rerender({score: other, tuningContext: TUNING, parts: [], volume: 1}));
    expect(result.current.positionMs).toBe(0);
    expect(result.current.playing).toBe(false);
});
