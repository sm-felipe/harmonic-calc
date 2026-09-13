import {buildNoteNames, degreeNames, findKey, keys, nameOfFifthPosition, searchNamesOf} from './spelling';
import {indexOfNote} from './notes';

test('names along the line of fifths', () => {
    expect([-3, -2, -1, 0, 1, 5, 6, 7, 8, 11, 12, 13, -7, -8].map(nameOfFifthPosition))
        .toEqual(['Eb', 'Bb', 'F', 'C', 'G', 'B', 'F#', 'C#', 'G#', 'E#', 'B#', 'F##', 'Cb', 'Fb']);
});

test('keys run from six flats to six sharps with their relative minors', () => {
    expect(keys.map((key) => key.id)).toEqual(['Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#']);
    expect(findKey('C').label).toBe('C major / A minor');
    expect(findKey('Eb').label).toBe('Eb major / C minor');
    expect(findKey('F#').label).toBe('F# major / D# minor');
    expect(findKey('A').tonicDegree).toBe(9);
});

test('chain spelling: Eb Bb F# C# G# around C, sharps in sharp keys, flats in flat keys', () => {
    expect(degreeNames(findKey('C'))).toEqual(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']);
    // E major's chain reaches E# and B#, but they are not in the scale, so they read as F and C
    expect(degreeNames(findKey('E'))).toEqual(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
    expect(degreeNames(findKey('Ab'))[11]).toBe('B');   // not Cb, which Ab major does not use
    expect(degreeNames(findKey('Ab'))).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
});

test('extreme keys keep their diatonic spellings but avoid double accidentals', () => {
    let fSharp = degreeNames(findKey('F#'));
    expect(fSharp[5]).toBe('E#');   // diatonic in F# major
    expect(fSharp[0]).toBe('C');    // B# is chromatic there, so it reads as C
    expect(fSharp[7]).toBe('G');    // not F##
    expect(fSharp[2]).toBe('D');    // not C##
    let gFlat = degreeNames(findKey('Gb'));
    expect(gFlat[11]).toBe('Cb');   // diatonic in Gb major
    expect(gFlat[9]).toBe('A');     // not Bbb
});

test('just intonation spells its 5-limit degrees as Db Eb F# Ab Bb', () => {
    expect(degreeNames(findKey('C'), 'just')).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']);
});

test('forced sharps or flats ignore the key', () => {
    expect(degreeNames(findKey('Ab'), 'sharps')).toEqual(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
    expect(degreeNames(findKey('E'), 'flats')).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
});

test('octave numbers follow the letter: Cb4 sounds as B3', () => {
    let names = buildNoteNames(findKey('F#'));
    expect(names[indexOfNote('F4')]).toBe('E#4');
    let flats = buildNoteNames(findKey('Gb'));
    expect(flats[indexOfNote('B3')]).toBe('Cb4');
    expect(flats[indexOfNote('C4')]).toBe('C4');
    expect(buildNoteNames(findKey('C'))[indexOfNote('A4')]).toBe('A4');
});

test('search names cover both spellings', () => {
    expect(searchNamesOf(indexOfNote('C#4'))).toEqual(['C#4', 'Db4']);
    expect(searchNamesOf(indexOfNote('A4'))).toEqual(['A4']);
    expect(indexOfNote('Eb4')).toBe(indexOfNote('D#4'));
    expect(indexOfNote('B#3')).toBe(indexOfNote('C4'));
    expect(indexOfNote('Cb4')).toBe(indexOfNote('B3'));
    expect(indexOfNote('H4')).toBeUndefined();
});
