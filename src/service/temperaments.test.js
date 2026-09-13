import {buildNoteFrequencyMap, defaultNotesMap, findTemperament, referencePitches, temperaments} from './temperaments';
import {centsOff} from './tuning';

function interval(map, from, to) {
    return centsOff(map[to], map[from]);
}

test('every system anchors A4 on the reference pitch and keeps octaves pure', () => {
    for (let temperament of temperaments) {
        for (let a4 of [415, 440, 466]) {
            let map = buildNoteFrequencyMap({temperamentId: temperament.id, tonic: 'C', a4});
            expect(map.A4).toBeCloseTo(a4, 6);
            expect(map.A5 / map.A4).toBeCloseTo(2, 9);
            expect(map.C0).toBeGreaterThan(15);
            expect(map.E10).toBeLessThan(24000);
        }
    }
});

test('equal temperament matches the old 12-TET map', () => {
    expect(defaultNotesMap.C4).toBeCloseTo(261.6256, 3);
    expect(defaultNotesMap['A#3']).toBeCloseTo(233.0819, 3);
    expect(interval(defaultNotesMap, 'C4', 'E4')).toBeCloseTo(400, 6);
});

test('pythagorean: pure fifths, wide major thirds', () => {
    let map = buildNoteFrequencyMap({temperamentId: 'pythagorean', tonic: 'C', a4: 440});
    expect(map.G4 / map.C4).toBeCloseTo(1.5, 9);
    expect(interval(map, 'C4', 'E4')).toBeCloseTo(407.82, 1);
    expect(map.E4 / map.C4).toBeCloseTo(81 / 64, 9);
});

test('just intonation: pure thirds and fifths from the tonic, and the tonic moves them', () => {
    let fromC = buildNoteFrequencyMap({temperamentId: 'just', tonic: 'C', a4: 440});
    expect(fromC.E4 / fromC.C4).toBeCloseTo(5 / 4, 9);
    expect(fromC['D#4'] / fromC.C4).toBeCloseTo(6 / 5, 9);
    expect(fromC.G4 / fromC.C4).toBeCloseTo(3 / 2, 9);

    let fromA = buildNoteFrequencyMap({temperamentId: 'just', tonic: 'A', a4: 440});
    expect(fromA['C#5'] / fromA.A4).toBeCloseTo(5 / 4, 9);
    expect(fromA.E5 / fromA.A4).toBeCloseTo(3 / 2, 9);
    // the 5th harmonic of A3 is exactly C#6 when A is the tonic
    expect(centsOff(5 * fromA.A3, fromA['C#6'])).toBeCloseTo(0, 6);
});

test('quarter-comma meantone: pure major thirds, narrow fifths, a wolf between G# and Eb', () => {
    let map = buildNoteFrequencyMap({temperamentId: 'meantone', tonic: 'C', a4: 440});
    expect(map.E4 / map.C4).toBeCloseTo(5 / 4, 9);
    expect(interval(map, 'C4', 'G4')).toBeCloseTo(696.58, 1);
    expect(interval(map, 'G#4', 'D#5')).toBeCloseTo(737.6, 0);
});

test('reference pitches and lookup', () => {
    let hz = referencePitches.map((pitch) => pitch.hz);
    expect(hz).toContain(440);
    expect(hz).toContain(415);
    expect(referencePitches.every((pitch) => pitch.description.length > 0)).toBe(true);
    expect(findTemperament('nope').id).toBe('equal');
});
