import {decodeState, encodeState} from './urlState';
import {indexOfNote} from './notes';
import {defaultTuning} from './temperaments';

const display = {showWave: false, waveCycles: 3};

test('defaults produce an empty query', () => {
    expect(encodeState({groups: [{instrumentId: 'custom', notes: [], harmonicLevels: [0, -3, -6, -9, -12, -15, -18, -21, -24]}], tuning: defaultTuning, display})).toBe('');
});

test('groups, tuning and wave round-trip through a readable query', () => {
    let state = {
        groups: [
            {instrumentId: 'bassoon', notes: [indexOfNote('A#1')]},
            {instrumentId: 'custom', notes: [indexOfNote('A3'), indexOfNote('E4')], harmonicLevels: [0, -30, -6, -30, -12, -30, -18, -30, -24]},
        ],
        tuning: {temperamentId: 'just', keyId: 'A', a4: 415, accidentals: 'flats', snap: true},
        display: {showWave: true, waveCycles: 6},
    };
    let query = encodeState(state);
    expect(query).toBe('g=bassoon:Bb1;custom:A3,E4~0.-30.-6.-30.-12.-30.-18.-30.-24&t=just&k=A&a4=415&acc=flats&snap=1&wave=6');

    let decoded = decodeState('?' + query);
    expect(decoded.groups).toEqual([
        {instrumentId: 'bassoon', notes: [indexOfNote('A#1')]},
        {instrumentId: 'custom', notes: [indexOfNote('A3'), indexOfNote('E4')], harmonicLevels: [0, -30, -6, -30, -12, -30, -18, -30, -24]},
    ]);
    expect(decoded.tuning).toEqual(state.tuning);
    expect(decoded.display).toEqual(state.display);
});

test('either spelling is accepted and junk is ignored', () => {
    let decoded = decodeState('g=clarinet:Eb4,D#4,H9,B3;banjo:A4;custom:A4~1.2&t=nope&k=Q&a4=999&acc=maybe&wave=7');
    expect(decoded.groups).toEqual([
        {instrumentId: 'clarinet', notes: [indexOfNote('B3'), indexOfNote('Eb4')]},
        {instrumentId: 'custom', notes: [indexOfNote('A4')]},   // malformed levels dropped
    ]);
    expect(decoded.tuning).toEqual(defaultTuning);
    expect(decoded.display).toEqual({showWave: false, waveCycles: 3});
});

test('an empty second group is kept so the boxes come back as they were', () => {
    let groups = [{instrumentId: 'flute', notes: [indexOfNote('C5')]}, {instrumentId: 'oboe', notes: []}];
    let query = encodeState({groups, tuning: defaultTuning, display});
    expect(query).toBe('g=flute:C5;oboe:');
    expect(decodeState(query).groups).toEqual(groups);
});

test('sharps are written as flats so the link has no "#" in it', () => {
    let query = encodeState({groups: [{instrumentId: 'flute', notes: [indexOfNote('C#4'), indexOfNote('F#4')]}], tuning: defaultTuning, display});
    expect(query).toBe('g=flute:Db4,Gb4');
    expect(query).not.toContain('#');
});
