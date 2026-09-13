import {
    buildNoteFrequencies, buildNoteNamesFor, buildTuningContext, defaultTuningContext, findTemperament,
    referencePitches, temperaments,
} from './temperaments';
import {centsOff} from './tuning';
import {indexOfNote} from './notes';

function freq(frequencies, note) {
    return frequencies[indexOfNote(note)];
}

function interval(frequencies, from, to) {
    return centsOff(freq(frequencies, to), freq(frequencies, from));
}

test('every system anchors A4 on the reference pitch and keeps octaves pure', () => {
    for (let temperament of temperaments) {
        for (let a4 of [415, 440, 466]) {
            let frequencies = buildNoteFrequencies({temperamentId: temperament.id, keyId: 'C', a4});
            expect(freq(frequencies, 'A4')).toBeCloseTo(a4, 6);
            expect(freq(frequencies, 'A5') / freq(frequencies, 'A4')).toBeCloseTo(2, 9);
            expect(freq(frequencies, 'C0')).toBeGreaterThan(15);
            expect(freq(frequencies, 'E10')).toBeLessThan(24000);
        }
    }
});

test('equal temperament matches the old 12-TET map', () => {
    let {frequencies, names} = defaultTuningContext;
    expect(freq(frequencies, 'C4')).toBeCloseTo(261.6256, 3);
    expect(freq(frequencies, 'A#3')).toBeCloseTo(233.0819, 3);
    expect(interval(frequencies, 'C4', 'E4')).toBeCloseTo(400, 6);
    expect(names[indexOfNote('A#3')]).toBe('Bb3');   // chain spelling around C
    expect(names[indexOfNote('C#6')]).toBe('C#6');
});

test('pythagorean: pure fifths, wide major thirds', () => {
    let frequencies = buildNoteFrequencies({temperamentId: 'pythagorean', keyId: 'C', a4: 440});
    expect(freq(frequencies, 'G4') / freq(frequencies, 'C4')).toBeCloseTo(1.5, 9);
    expect(interval(frequencies, 'C4', 'E4')).toBeCloseTo(407.82, 1);
    expect(freq(frequencies, 'E4') / freq(frequencies, 'C4')).toBeCloseTo(81 / 64, 9);
});

test('just intonation: pure thirds and fifths from the tonic, and the key moves them', () => {
    let fromC = buildNoteFrequencies({temperamentId: 'just', keyId: 'C', a4: 440});
    expect(freq(fromC, 'E4') / freq(fromC, 'C4')).toBeCloseTo(5 / 4, 9);
    expect(freq(fromC, 'Eb4') / freq(fromC, 'C4')).toBeCloseTo(6 / 5, 9);
    expect(freq(fromC, 'G4') / freq(fromC, 'C4')).toBeCloseTo(3 / 2, 9);

    let fromA = buildNoteFrequencies({temperamentId: 'just', keyId: 'A', a4: 440});
    expect(freq(fromA, 'C#5') / freq(fromA, 'A4')).toBeCloseTo(5 / 4, 9);
    expect(freq(fromA, 'E5') / freq(fromA, 'A4')).toBeCloseTo(3 / 2, 9);
    // the 5th harmonic of A3 is exactly C#6 when A is the tonic
    expect(centsOff(5 * freq(fromA, 'A3'), freq(fromA, 'C#6'))).toBeCloseTo(0, 6);
});

test('quarter-comma meantone: pure major thirds, narrow fifths, a wolf between G# and Eb', () => {
    let frequencies = buildNoteFrequencies({temperamentId: 'meantone', keyId: 'C', a4: 440});
    expect(freq(frequencies, 'E4') / freq(frequencies, 'C4')).toBeCloseTo(5 / 4, 9);
    expect(interval(frequencies, 'C4', 'G4')).toBeCloseTo(696.58, 1);
    expect(interval(frequencies, 'G#4', 'Eb5')).toBeCloseTo(737.6, 0);
});

test('the key retunes the chain: in E major meantone has D#, not Eb, and the wolf moves', () => {
    let inE = buildNoteFrequencies({temperamentId: 'meantone', keyId: 'E', a4: 440});
    let inC = buildNoteFrequencies({temperamentId: 'meantone', keyId: 'C', a4: 440});
    // B..D# is pure in E major, but B..Eb (what the C layout has) is a wolf third
    expect(interval(inE, 'B3', 'D#4')).toBeCloseTo(386.31, 1);
    expect(interval(inC, 'B3', 'D#4')).toBeCloseTo(427.37, 1);
    // and the price: the key of C in E-major meantone is really B#, so C..E is no longer pure
    expect(freq(inC, 'E4') / freq(inC, 'C4')).toBeCloseTo(5 / 4, 9);
    expect(interval(inE, 'C4', 'E4')).toBeCloseTo(427.37, 1);
    let names = buildNoteNamesFor({temperamentId: 'meantone', keyId: 'E', accidentals: 'auto'});
    expect(names[indexOfNote('D#4')]).toBe('D#4');
});

test('accidentals override applies to equal temperament only', () => {
    let equalFlats = buildNoteNamesFor({temperamentId: 'equal', keyId: 'C', accidentals: 'flats'});
    expect(equalFlats[indexOfNote('C#4')]).toBe('Db4');
    let meantoneFlats = buildNoteNamesFor({temperamentId: 'meantone', keyId: 'C', accidentals: 'flats'});
    expect(meantoneFlats[indexOfNote('C#4')]).toBe('C#4');
    expect(buildTuningContext({temperamentId: 'just', keyId: 'C', a4: 440}).names[indexOfNote('C#4')]).toBe('Db4');
});

test('reference pitches and lookup', () => {
    let hz = referencePitches.map((pitch) => pitch.hz);
    expect(hz).toContain(440);
    expect(hz).toContain(415);
    expect(referencePitches.every((pitch) => pitch.description.length > 0)).toBe(true);
    expect(findTemperament('nope').id).toBe('equal');
});
