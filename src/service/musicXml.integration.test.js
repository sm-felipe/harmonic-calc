// Runs the real Verovio over a real MusicXML file, which the unit tests cannot:
// everything musicXml.js does rests on behaviour of the toolkit that is not
// documented and was established by experiment, so it is worth pinning down.
// Notably: the pitch reported is the written one, a tie comes back as two
// separate notes, and a note's staff is reachable only through the MEI.
//
// The engine is loaded through the npm package's UMD build, which is plain
// CommonJS and so works under jest; the app itself cannot import it (see
// verovio.js) and loads the same file with a script tag instead.

import {readFileSync} from 'fs';
import path from 'path';
import {readScore} from './musicXml';
import {indexOfNote} from './notes';
import {loadVerovio} from './verovio';

jest.mock('./verovio');
jest.setTimeout(30000);

const verovio = require('verovio');

const FIXTURES = path.join(__dirname, '__fixtures__');

function fixture(name) {
    let bytes = readFileSync(path.join(FIXTURES, name));
    return {
        name,
        // copied into this realm's buffer: Verovio checks the argument with
        // instanceof, and a Node Buffer's ArrayBuffer belongs to another realm
        arrayBuffer: async () => {
            let copy = new Uint8Array(bytes.length);
            copy.set(bytes);
            return copy.buffer;
        },
        text: async () => bytes.toString('utf8'),
    };
}

let toolkit;

beforeAll(async () => {
    // the wasm is still starting when the module resolves, so wait it out
    toolkit = await new Promise((resolve, reject) => {
        let deadline = Date.now() + 25000;
        (function poll() {
            try {
                let candidate = new verovio.toolkit();
                if (candidate.getVersion()) {
                    return resolve(candidate);
                }
            } catch (notReadyYet) { /* keep waiting */ }
            return Date.now() > deadline ? reject(new Error('verovio did not start')) : setTimeout(poll, 50);
        })();
    });
});

// create-react-app's jest config sets resetMocks, so the mock is armed per test
beforeEach(() => loadVerovio.mockResolvedValue(toolkit));

test('a transposing part is read at the pitch it sounds', async () => {
    let score = await readScore(fixture('two-parts.musicxml'));

    expect(score.title).toBe('Two Parts');
    expect(score.parts).toEqual([
        {staffN: '1', name: 'Clarinete em Sib', instrumentId: 'clarinet', transposeSemitones: -2},
        {staffN: '2', name: 'Fagote', instrumentId: 'bassoon', transposeSemitones: 0},
    ]);

    // written C5 and D5 on a clarinet in Bb sound a tone lower
    let clarinet = score.notes.filter((note) => note.partIndex === 0);
    expect(clarinet.map((note) => note.pitchIndex)).toEqual([indexOfNote('A#4'), indexOfNote('C5')]);

    let bassoon = score.notes.filter((note) => note.partIndex === 1);
    expect(bassoon.map((note) => note.pitchIndex)).toEqual([indexOfNote('C3')]);
});

test('a tie across the barline sounds as a single note', async () => {
    let score = await readScore(fixture('two-parts.musicxml'));

    // quarter, rest, then two tied halves: at 120 bpm that is 500 ms of sound,
    // 500 of silence, and one note of 2000 rather than two of 1000
    let clarinet = score.notes.filter((note) => note.partIndex === 0);
    expect(clarinet).toEqual([
        expect.objectContaining({startMs: 0, endMs: 500}),
        expect.objectContaining({startMs: 1000, endMs: 3000}),
    ]);
});

test('a rest is a moment with nothing sounding, not a missing note', async () => {
    let score = await readScore(fixture('two-parts.musicxml'));

    // the clarinet rests while the bassoon holds its whole note
    expect(score.changes).toEqual([
        {timeMs: 0, notes: [0, 1]},        // bassoon C3 + clarinet A#4
        {timeMs: 500, notes: [0]},         // clarinet rests
        {timeMs: 1000, notes: [0, 2]},     // tied C5 enters
        {timeMs: 2000, notes: [2]},        // bassoon lets go
        {timeMs: 3000, notes: []},         // silence to the end
    ]);
    expect(score.durationMs).toBe(4000);
});

test('a compressed .mxl reads identically to its plain twin', async () => {
    let plain = await readScore(fixture('two-parts.musicxml'));
    let compressed = await readScore(fixture('two-parts.mxl'));

    expect(compressed.parts).toEqual(plain.parts);
    // element ids are generated afresh on every load, so compare what is left
    expect(compressed.notes.map(({ids, ...note}) => note))
        .toEqual(plain.notes.map(({ids, ...note}) => note));
});
