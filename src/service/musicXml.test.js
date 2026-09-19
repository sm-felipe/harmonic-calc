import {buildChanges, groupsAt, guessInstrument, readScore, soundingAt} from './musicXml';
import {indexOfNote} from './notes';
import {loadVerovio} from './verovio';

jest.mock('./verovio');

// A two-staff excerpt shaped like what Verovio hands back: a clarinet in Bb,
// whose trans.semi has to be applied, over a non-transposing bassoon.
const MEI = `<?xml version="1.0"?>
<music xmlns="http://www.music-encoding.org/ns/mei">
 <meiHead><fileDesc><titleStmt><title>Test Piece</title></titleStmt></fileDesc></meiHead>
 <body><mdiv><score>
  <scoreDef><staffGrp>
   <staffDef n="1" trans.semi="-2"><label>Clarinete em Sib</label><instrDef midi.instrnum="71"/></staffDef>
   <staffDef n="2"><label>Fagote</label><instrDef midi.instrnum="70"/></staffDef>
  </staffGrp></scoreDef>
  <section><measure n="1">
   <staff n="1"><layer><note xml:id="n1"/><note xml:id="n2"/></layer></staff>
   <staff n="2"><layer><note xml:id="n3"/></layer></staff>
  </measure></section>
 </score></mdiv></body>
</music>`;

// n1 and n3 sound together, then n1 gives way to n2 while n3 holds on
const TIMEMAP = [
    {tstamp: 0, on: ['n1', 'n3'], qstamp: 0, tempo: 120},
    {tstamp: 1000, off: ['n1'], on: ['n2'], qstamp: 2},
    {tstamp: 2000, off: ['n2', 'n3'], qstamp: 4},
];

const MIDI = {
    n1: {pitch: 74, time: 0, duration: 1000},      // written D5 on the clarinet -> C5 sounding
    n2: {pitch: 76, time: 1000, duration: 1000},   // written E5              -> D5 sounding
    n3: {pitch: 48, time: 0, duration: 2000},      // C3 on the bassoon, as written
};

function fakeToolkit(overrides = {}) {
    return {
        setOptions: jest.fn(),
        loadData: jest.fn(() => 1),
        loadZipDataBuffer: jest.fn(() => 1),
        renderToTimemap: jest.fn(() => TIMEMAP),
        getMEI: jest.fn(() => MEI),
        getMIDIValuesForElement: jest.fn((id) => MIDI[id]),
        getPageCount: jest.fn(() => 2),
        ...overrides,
    };
}

function fakeFile(name, bytes, text = '<score/>') {
    return {
        name,
        arrayBuffer: () => Promise.resolve(new Uint8Array(bytes).buffer),
        text: () => Promise.resolve(text),
    };
}

const PLAIN_XML = fakeFile('piece.musicxml', [0x3c, 0x3f, 0x78, 0x6d, 0x6c]);   // "<?xml"
const COMPRESSED = fakeFile('piece.mxl', [0x50, 0x4b, 0x03, 0x04, 0x00]);       // "PK\3\4"

beforeEach(() => {
    loadVerovio.mockReset();
});

test('a part keeps its name and is matched to an instrument', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit());
    let score = await readScore(PLAIN_XML);

    expect(score.title).toBe('Test Piece');
    expect(score.pageCount).toBe(2);
    expect(score.parts).toEqual([
        {staffN: '1', name: 'Clarinete em Sib', instrumentId: 'clarinet', transposeSemitones: -2},
        {staffN: '2', name: 'Fagote', instrumentId: 'bassoon', transposeSemitones: 0},
    ]);
});

test('written pitches become the notes that actually sound', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit());
    let score = await readScore(PLAIN_XML);

    expect(score.notes).toEqual([
        {ids: ['n3'], partIndex: 1, pitchIndex: indexOfNote('C3'), startMs: 0, endMs: 2000},
        {ids: ['n1'], partIndex: 0, pitchIndex: indexOfNote('C5'), startMs: 0, endMs: 1000},
        {ids: ['n2'], partIndex: 0, pitchIndex: indexOfNote('D5'), startMs: 1000, endMs: 2000},
    ]);
    expect(score.durationMs).toBe(2000);
});

test('the timemap is read before pitches are asked for', async () => {
    let toolkit = fakeToolkit();
    let order = [];
    toolkit.renderToTimemap.mockImplementation(() => (order.push('timemap'), TIMEMAP));
    toolkit.getMIDIValuesForElement.mockImplementation((id) => (order.push('midi'), MIDI[id]));
    loadVerovio.mockResolvedValue(toolkit);

    await readScore(PLAIN_XML);
    expect(order[0]).toBe('timemap');
});

test('a compressed .mxl is recognised by its zip header', async () => {
    let toolkit = fakeToolkit();
    loadVerovio.mockResolvedValue(toolkit);

    await readScore(COMPRESSED);
    expect(toolkit.loadZipDataBuffer).toHaveBeenCalled();
    expect(toolkit.loadData).not.toHaveBeenCalled();

    toolkit = fakeToolkit();
    loadVerovio.mockResolvedValue(toolkit);
    await readScore(PLAIN_XML);
    expect(toolkit.loadData).toHaveBeenCalled();
    expect(toolkit.loadZipDataBuffer).not.toHaveBeenCalled();
});

test('a file Verovio cannot read is reported, not half-parsed', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit({loadData: jest.fn(() => 0)}));
    await expect(readScore(PLAIN_XML)).rejects.toThrow(/could not be read/);
});

test('notes out of the app\'s range are dropped rather than wrapped', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit({
        getMIDIValuesForElement: jest.fn((id) =>
            id === 'n1' ? {pitch: 3, time: 0, duration: 100} : MIDI[id]),
    }));
    let score = await readScore(PLAIN_XML);
    expect(score.notes.map((note) => note.ids[0])).toEqual(['n3', 'n2']);
});

test('tied notes are joined into the one note they are heard as', async () => {
    let tiedMei = MEI.replace('</section>', '</section><tie startid="#n1" endid="#n2"/>');
    loadVerovio.mockResolvedValue(fakeToolkit({getMEI: jest.fn(() => tiedMei)}));
    let score = await readScore(PLAIN_XML);

    expect(score.notes).toEqual([
        {ids: ['n3'], partIndex: 1, pitchIndex: indexOfNote('C3'), startMs: 0, endMs: 2000},
        {ids: ['n1', 'n2'], partIndex: 0, pitchIndex: indexOfNote('C5'), startMs: 0, endMs: 2000},
    ]);
});

test('changes list every instant the sounding set moves, and no other', () => {
    let notes = [
        {startMs: 0, endMs: 2000},
        {startMs: 0, endMs: 1000},
        {startMs: 1000, endMs: 2000},
    ];
    expect(buildChanges(notes)).toEqual([
        {timeMs: 0, notes: [0, 1]},
        {timeMs: 1000, notes: [0, 2]},
        {timeMs: 2000, notes: []},
    ]);
});

test('a rest between notes shows up as a silent change', () => {
    expect(buildChanges([{startMs: 0, endMs: 100}, {startMs: 500, endMs: 600}])).toEqual([
        {timeMs: 0, notes: [0]},
        {timeMs: 100, notes: []},
        {timeMs: 500, notes: [1]},
        {timeMs: 600, notes: []},
    ]);
});

test('sounding notes are found at any moment, not only on the change itself', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit());
    let score = await readScore(PLAIN_XML);

    expect(soundingAt(score, -1)).toEqual([]);
    expect(soundingAt(score, 500)).toEqual(soundingAt(score, 0));
    expect(soundingAt(score, 2000)).toEqual([]);
});

test('a moment becomes groups the harmonic matrix can already consume', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit());
    let score = await readScore(PLAIN_XML);

    expect(groupsAt(score, 500)).toEqual([
        {partIndex: 1, instrumentId: 'bassoon', notes: [indexOfNote('C3')]},
        {partIndex: 0, instrumentId: 'clarinet', notes: [indexOfNote('C5')]},
    ]);
});

test('a lane overriding its instrument wins over the guess', async () => {
    loadVerovio.mockResolvedValue(fakeToolkit());
    let score = await readScore(PLAIN_XML);

    expect(groupsAt(score, 500, {0: 'voice-a'}).find((group) => group.partIndex === 0).instrumentId)
        .toBe('voice-a');
});

describe('matching a part name to an instrument', () => {
    test.each([
        ['Clarinete em Sib', 'clarinet'],
        ['Fagote', 'bassoon'],
        ['Trompete em Sib', 'trumpet'],
        ['Trombone', 'trombone'],
        ['Flauta', 'flute'],
        ['Oboé', 'oboe'],
        ['Trompa em Fá', 'horn'],
        ['Violoncelo', 'cello'],
        ['Violino I', 'violin'],
        ['Violão', 'guitar'],
    ])('%s -> %s', (name, expected) => {
        expect(guessInstrument(name, NaN)).toBe(expected);
    });

    test.each(['Superius', 'Contra tenor', 'Tenor', 'Bassus', 'Soprano', 'Alto', 'Baixo', 'Quintus'])(
        '%s is sung', (name) => {
            expect(guessInstrument(name, NaN)).toBe('voice-a');
        });

    test('a bass voice is not mistaken for a double bass, nor the other way round', () => {
        expect(guessInstrument('Baixo', NaN)).toBe('voice-a');
        expect(guessInstrument('Contrabaixo', NaN)).toBe('double-bass');
        expect(guessInstrument('Double Bass', NaN)).toBe('double-bass');
    });

    test('a generically named part falls back to its MIDI program', () => {
        expect(guessInstrument('Part 1', 71)).toBe('clarinet');
        expect(guessInstrument('', 42)).toBe('cello');
    });

    test('an unknown part is left at the default instrument', () => {
        expect(guessInstrument('Ondes Martenot', NaN)).toBe('custom');
        expect(guessInstrument('', 999)).toBe('custom');
    });
});
