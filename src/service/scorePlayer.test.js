import {ScorePlayer} from './scorePlayer';
import {calculateHarmonicMatrix} from './HarmonicMatrix';
import {findInstrument} from './instruments';
import {indexOfNote} from './notes';
import {buildTuningContext, defaultTuningContext} from './temperaments';

function fakeParam(value = 0) {
    return {
        value,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        setTargetAtTime: jest.fn(),
        cancelScheduledValues: jest.fn(),
        cancelAndHoldAtTime: jest.fn(),
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
        gains: [],
        resume: jest.fn(() => { context.state = 'running'; return Promise.resolve(); }),
        close: jest.fn(),
        createGain() {
            let gain = fakeNode({gain: 1});
            context.gains.push(gain);
            return gain;
        },
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

// An envelope is the only gain whose value is ramped; a partial's gain is just
// set once and left alone.
function envelopes(context) {
    return context.gains.filter((gain) => gain.gain.linearRampToValueAtTime.mock.calls.length > 0);
}

function scoreOf(notes, {parts, durationMs} = {}) {
    let changes = [...new Set(notes.flatMap((note) => [note.startMs, note.endMs]))]
        .sort((a, b) => a - b)
        .map((timeMs) => ({
            timeMs,
            notes: notes.map((note, index) => [note, index])
                .filter(([note]) => note.startMs <= timeMs && note.endMs > timeMs)
                .map(([, index]) => index),
        }));
    return {
        title: 'Test',
        parts: parts || [{staffN: '1', name: 'Voz', instrumentId: 'voice-a', transposeSemitones: 0}],
        notes,
        changes,
        durationMs: durationMs ?? notes.reduce((end, note) => Math.max(end, note.endMs), 0),
        pageCount: 1,
    };
}

const A4 = indexOfNote('A4');
const C5 = indexOfNote('C5');

// one note at the start, one a second later, both half a second long
const TWO_NOTES = scoreOf([
    {ids: ['a'], partIndex: 0, pitchIndex: A4, startMs: 0, endMs: 500},
    {ids: ['b'], partIndex: 0, pitchIndex: C5, startMs: 1000, endMs: 1500},
]);

function partialsOf(pitchIndex, instrumentId = 'voice-a') {
    let [row] = calculateHarmonicMatrix([pitchIndex], findInstrument(instrumentId), defaultTuningContext);
    return row.harmonics;
}

function playing(score, options = {}) {
    let context = fakeContext();
    let player = new ScorePlayer(() => context);
    player.start(score, {tuningContext: defaultTuningContext, ...options});
    return {context, player};
}

test('a note becomes one sine per audible partial, at the frequencies of its own spectrum', () => {
    let {context} = playing(TWO_NOTES);
    let expected = partialsOf(A4);

    expect(context.resume).toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(expected.length);
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value))
        .toEqual(expected.map((partial) => partial.frequency));
    expect(context.oscillators.every((oscillator) => oscillator.type === 'sine')).toBe(true);
});

test('only what falls inside the lookahead is scheduled', () => {
    let {context, player} = playing(TWO_NOTES);

    // the second note is a second away: far beyond the 100 ms horizon
    expect(player.next).toBe(1);
    let firstBatch = context.oscillators.length;

    context.currentTime = 2;
    player.tick();
    expect(player.next).toBe(2);
    expect(context.oscillators.length).toBeGreaterThan(firstBatch);
    expect(context.oscillators.slice(firstBatch).map((oscillator) => oscillator.frequency.value))
        .toEqual(partialsOf(C5).map((partial) => partial.frequency));
});

test('a note is placed on the audio clock, not on the timer that scheduled it', () => {
    let {context, player} = playing(TWO_NOTES);

    // context time 1, plus the lead-in, is where the piece begins
    let startedAt = player.startedAt;
    expect(startedAt).toBeCloseTo(1.08);
    expect(context.oscillators[0].start).toHaveBeenCalledWith(startedAt);

    context.currentTime = 2;
    player.tick();
    // the second note sits a second into the piece however late the tick was
    let second = context.oscillators[partialsOf(A4).length];
    expect(second.start).toHaveBeenCalledWith(expect.closeTo(startedAt + 1, 6));
});

test('each note gets its own envelope, and a short one keeps its attack inside it', () => {
    let short = scoreOf([{ids: ['a'], partIndex: 0, pitchIndex: A4, startMs: 0, endMs: 10}]);
    let {context, player} = playing(short);

    let [envelope] = envelopes(context);
    let at = player.startedAt;
    // silent, up to peak, held, then released
    expect(envelope.gain.setValueAtTime).toHaveBeenCalledWith(0, at);
    let [peak, peakAt] = envelope.gain.linearRampToValueAtTime.mock.calls[0];
    expect(peak).toBeGreaterThan(0);
    expect(peakAt - at).toBeCloseTo(0.005);       // half of a 10 ms note, not the full attack
    expect(envelope.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.closeTo(at + 0.01 + 0.08, 6));
});

test('voices are let go once they have died away, and the end is announced once', () => {
    let {context, player} = playing(TWO_NOTES);
    let ended = jest.fn();
    player.onEnded = ended;

    expect(player.voices).toHaveLength(1);

    context.currentTime = 2;        // first note long over, second one due
    player.tick();
    expect(player.voices).toHaveLength(1);
    expect(ended).not.toHaveBeenCalled();

    context.currentTime = 3;        // second note over too
    player.tick();
    expect(player.voices).toHaveLength(0);
    expect(player.playing).toBe(false);
    expect(ended).toHaveBeenCalledTimes(1);

    player.tick();
    expect(ended).toHaveBeenCalledTimes(1);
});

test('starting part-way picks up a note already sounding, for what is left of it', () => {
    let {context, player} = playing(TWO_NOTES, {fromMs: 250});

    expect(context.oscillators.length).toBe(partialsOf(A4).length);
    let [envelope] = envelopes(context);
    // it begins now rather than in the past, and still ends where it should
    expect(context.oscillators[0].start).toHaveBeenCalledWith(1);
    expect(envelope.gain.setValueAtTime).toHaveBeenCalledWith(expect.any(Number), expect.closeTo(1.33, 6));
});

test('a note already finished before the starting point is not sounded at all', () => {
    let {context} = playing(TWO_NOTES, {fromMs: 1000});
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value))
        .toEqual(partialsOf(C5).map((partial) => partial.frequency));
});

test('a part sounds with the timbre chosen for it', () => {
    let {context} = playing(TWO_NOTES, {parts: [{instrumentId: 'trumpet'}]});
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value))
        .toEqual(partialsOf(A4, 'trumpet').map((partial) => partial.frequency));
});

test('the fullest chord in the piece decides how loud one voice may be', () => {
    let alone = scoreOf([{ids: ['a'], partIndex: 0, pitchIndex: A4, startMs: 0, endMs: 500}]);
    let crowded = scoreOf([
        {ids: ['a'], partIndex: 0, pitchIndex: A4, startMs: 0, endMs: 500},
        {ids: ['b'], partIndex: 0, pitchIndex: C5, startMs: 0, endMs: 500},
        {ids: ['c'], partIndex: 0, pitchIndex: indexOfNote('E5'), startMs: 0, endMs: 500},
        {ids: ['d'], partIndex: 0, pitchIndex: indexOfNote('A5'), startMs: 0, endMs: 500},
    ]);

    let peakOf = (score) => {
        let {context} = playing(score);
        return envelopes(context)[0].gain.linearRampToValueAtTime.mock.calls[0][0];
    };

    // four at once, so each is halved: power adds, and 1/sqrt(4) is a half
    expect(peakOf(crowded)).toBeCloseTo(peakOf(alone) / 2, 6);
});

test('stopping fades what is sounding instead of cutting it, and keeps the playhead', () => {
    let {context, player} = playing(TWO_NOTES);
    let [envelope] = envelopes(context);

    context.currentTime = 1.3;
    player.stop();

    expect(player.playing).toBe(false);
    expect(envelope.gain.cancelAndHoldAtTime).toHaveBeenCalledWith(1.3);
    expect(envelope.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.closeTo(1.38, 6));
    expect(context.oscillators.every((oscillator) =>
        oscillator.stop.mock.calls.some(([when]) => Math.abs(when - 1.38) < 1e-6))).toBe(true);
    // 1.3 is 0.22 s past the lead-in, so that is where the piece was left
    expect(player.positionMs).toBeCloseTo(220, 6);
});

test('the playhead follows the audio clock while playing', () => {
    let {context, player} = playing(TWO_NOTES);

    expect(player.positionMs).toBe(0);            // still in the lead-in
    context.currentTime = 1.58;
    expect(player.positionMs).toBeCloseTo(500, 6);
});

test('a silent score ends rather than hanging', () => {
    let {player} = playing(scoreOf([], {durationMs: 0}));
    expect(player.playing).toBe(false);
});

test('closing releases the context', () => {
    let {context, player} = playing(TWO_NOTES);
    player.close();
    expect(context.close).toHaveBeenCalled();
    expect(player.playing).toBe(false);
});

test('whenRunning reports whether the context produces sound', async () => {
    let {player} = playing(TWO_NOTES);
    expect(await player.whenRunning()).toBe(true);
    expect(await new ScorePlayer(fakeContext).whenRunning()).toBe(false);
});

// --- changing the tuning under a piece that is already sounding -----------

test('retuning slides every partial of every sounding voice to its new pitch', () => {
    let {context, player} = playing(TWO_NOTES);
    let before = context.oscillators.length;
    // every voice already has its ending scheduled from when it began
    let endings = context.oscillators.map((oscillator) => oscillator.stop.mock.calls.length);

    // a temperament moves partials by cents, so the same ones stay audible
    let retuned = buildTuningContext({temperamentId: 'just', keyId: 'A', a4: 440});
    expect(player.retune(retuned)).toBe(true);

    // nothing was started again, and nothing was brought to an end
    expect(context.oscillators).toHaveLength(before);
    expect(context.oscillators.map((oscillator) => oscillator.stop.mock.calls.length)).toEqual(endings);

    // and every partial was sent to where just intonation puts it
    let expected = calculateHarmonicMatrix([A4], findInstrument('voice-a'), retuned)[0].harmonics;
    context.oscillators.forEach((oscillator, index) => {
        expect(oscillator.frequency.setTargetAtTime)
            .toHaveBeenCalledWith(expect.closeTo(expected[index].frequency, 6), expect.any(Number), expect.any(Number));
    });
    expect(player.tuningContext).toBe(retuned);
});

test('a retuning that would change a voice\'s partials is refused rather than half done', () => {
    let {context, player} = playing(TWO_NOTES);
    let calls = context.oscillators[0].frequency.setTargetAtTime.mock.calls.length;

    // dropping the reference pitch to 415 lowers every note, and one more
    // partial comes in under the cutoff: no glide can express that
    let lower = buildTuningContext({temperamentId: 'equal', keyId: 'C', a4: 415});
    expect(player.retune(lower)).toBe(false);

    expect(context.oscillators[0].frequency.setTargetAtTime).toHaveBeenCalledTimes(calls);
    expect(player.tuningContext).toBe(defaultTuningContext);   // untouched
});

test('notes still to come are built with the new tuning', () => {
    let {context, player} = playing(TWO_NOTES);
    let retuned = buildTuningContext({temperamentId: 'just', keyId: 'A', a4: 440});
    player.retune(retuned);

    let sounded = context.oscillators.length;
    context.currentTime = 2;
    player.tick();

    let expected = calculateHarmonicMatrix([C5], findInstrument('voice-a'), retuned)[0].harmonics;
    expect(context.oscillators.slice(sounded).map((oscillator) => oscillator.frequency.value))
        .toEqual(expected.map((partial) => partial.frequency));
});
