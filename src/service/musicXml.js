// Turns a MusicXML file into something the rest of the app already understands:
// a list of parts, each mapped to one of our instruments, and a flat list of
// notes carrying pitch indices and their times in milliseconds.
//
// Verovio does the reading. It is an engraver, so it gives us the notation and
// the timing but never any sound: what a note sounds like stays the business of
// instruments.js and HarmonicMatrix.js, which is the whole point of the app.
//
// Three things about Verovio shape the code below:
//   1. renderToTimemap() must run before getMIDIValuesForElement(), which
//      otherwise returns an empty object without complaining;
//   2. the MIDI pitch it reports is the WRITTEN one, so a clarinet in Bb comes
//      back a tone sharp. The correction is trans.semi, which the MEI carries
//      on each staffDef. Asking Verovio to transpose instead would re-spell the
//      printed score and, worse, change every element id;
//   3. a note's staff is not reachable from the rendered SVG (its staff groups
//      carry nothing but an id), but it is plain in the MEI, so we read the MEI
//      once and build the map ourselves;
//   4. a tie is not folded into a note's duration: both halves come back as
//      separate entries, which played literally would re-attack the note in the
//      middle. The MEI records the tie itself, so we join them back up here.

import {defaultInstrument, instruments} from "./instruments";
import {NOTE_COUNT} from "./notes";
import {loadVerovio} from "./verovio";

// Engraving options. They are set before loading, because changing them later
// re-renders the score with fresh element ids and invalidates every map here.
const ENGRAVING_OPTIONS = {
    scale: 40,
    adjustPageHeight: true,
    breaks: 'auto',
    pageWidth: 2100,
    footer: 'none',
    header: 'none',
};

/**
 * Reads a File (.musicxml, .xml or compressed .mxl) into a score:
 *
 *   {title, parts, notes, changes, durationMs, pageCount, toolkit}
 *
 * `parts`   one per staff: {name, instrumentId, transposeSemitones}
 * `notes`   flat and ordered by start: {id, partIndex, pitchIndex, startMs, endMs}
 * `changes` the instants the sounding set changes: {timeMs, notes: [index]}
 *
 * The toolkit comes along because it still holds the engraved score, which the
 * score view needs for its SVG. It follows that only one score is open at a
 * time; reading another one replaces it.
 */
export async function readScore(file) {
    let toolkit = await loadVerovio();
    let buffer = await file.arrayBuffer();

    toolkit.setOptions(ENGRAVING_OPTIONS);
    let loaded = isZip(buffer)
        ? toolkit.loadZipDataBuffer(buffer)
        : toolkit.loadData(await file.text());
    if (!loaded) {
        throw new Error('That file could not be read as a music score.');
    }
    return buildScore(toolkit, file.name);
}

// .mxl is a zip; every zip starts "PK\3\4".
function isZip(buffer) {
    let head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
    return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
}

function buildScore(toolkit, fileName) {
    // must precede getMIDIValuesForElement, see note 1 at the top
    let timemap = toolkit.renderToTimemap({includeMeasures: true, includeRests: false});
    let mei = new DOMParser().parseFromString(toolkit.getMEI({}), 'application/xml');

    let parts = readParts(mei);
    let partOfStaff = new Map(parts.map((part, index) => [part.staffN, index]));
    let staffOfNote = readStaffOfNote(mei);

    let sounded = new Map();
    for (let entry of timemap) {
        for (let id of entry.on || []) {
            let note = readNote(toolkit, id, staffOfNote, partOfStaff, parts);
            if (note) {
                sounded.set(id, note);
            }
        }
    }
    let notes = joinTies(sounded, readTies(mei));
    notes.sort((a, b) => a.startMs - b.startMs || a.pitchIndex - b.pitchIndex);

    let durationMs = notes.reduce((end, note) => Math.max(end, note.endMs), 0);
    let lastStamp = timemap.length ? timemap[timemap.length - 1].tstamp : 0;

    return {
        title: readTitle(mei) || fileName.replace(/\.[^.]+$/, ''),
        parts,
        notes,
        changes: buildChanges(notes),
        durationMs: Math.max(durationMs, lastStamp),
        pageCount: toolkit.getPageCount(),
        toolkit,
    };
}

function readNote(toolkit, id, staffOfNote, partOfStaff, parts) {
    let staffN = staffOfNote.get(id);
    let partIndex = partOfStaff.get(staffN);
    if (partIndex === undefined) {
        return null;
    }
    let midi = toolkit.getMIDIValuesForElement(id);
    if (!midi || typeof midi.pitch !== 'number') {
        return null;
    }
    // written pitch corrected to what actually sounds, see note 2 at the top;
    // MIDI 12 is C0, which is index 0 here
    let pitchIndex = midi.pitch + parts[partIndex].transposeSemitones - 12;
    if (pitchIndex < 0 || pitchIndex >= NOTE_COUNT) {
        return null;
    }
    return {
        ids: [id],
        partIndex,
        pitchIndex,
        startMs: midi.time,
        endMs: midi.time + midi.duration,
    };
}

// startid -> endid for every tie the MEI records, the ids stripped of the "#"
// that makes them references.
function readTies(mei) {
    let nextOf = new Map();
    for (let tie of mei.querySelectorAll('tie')) {
        let start = reference(tie.getAttribute('startid'));
        let end = reference(tie.getAttribute('endid'));
        if (start && end) {
            nextOf.set(start, end);
        }
    }
    return nextOf;
}

function reference(value) {
    return value ? value.replace(/^#/, '') : '';
}

/**
 * Folds each chain of tied notes into the one note it is heard as: the first
 * note's start, the last one's end, and every id along the way, because the
 * score view has to highlight all of them while that note sounds.
 */
function joinTies(sounded, nextOf) {
    let continuations = new Set(nextOf.values());
    let notes = [];
    for (let [id, note] of sounded) {
        if (continuations.has(id)) {
            continue;   // reached by walking the note it is tied to
        }
        let ids = [id];
        let endMs = note.endMs;
        let cursor = id;
        // the guard keeps a malformed file that ties in a circle from hanging
        while (nextOf.has(cursor) && ids.length <= sounded.size) {
            let next = nextOf.get(cursor);
            let tied = sounded.get(next);
            if (!tied) {
                break;
            }
            ids.push(next);
            endMs = Math.max(endMs, tied.endMs);
            cursor = next;
        }
        notes.push({...note, ids, endMs});
    }
    return notes;
}

function readParts(mei) {
    return [...mei.querySelectorAll('staffDef')]
        .filter((staffDef) => staffDef.getAttribute('n'))
        .map((staffDef) => {
            let name = text(staffDef.querySelector('label'));
            let instrDef = staffDef.querySelector('instrDef');
            let program = instrDef ? Number(instrDef.getAttribute('midi.instrnum')) : NaN;
            return {
                staffN: staffDef.getAttribute('n'),
                name: name || `Part ${staffDef.getAttribute('n')}`,
                instrumentId: guessInstrument(name, program),
                transposeSemitones: Number(staffDef.getAttribute('trans.semi') || 0),
            };
        });
}

function readStaffOfNote(mei) {
    let staffOfNote = new Map();
    for (let staff of mei.querySelectorAll('staff')) {
        let staffN = staff.getAttribute('n');
        for (let note of staff.querySelectorAll('note')) {
            staffOfNote.set(note.getAttribute('xml:id') || note.getAttributeNS(XML_NS, 'id'), staffN);
        }
    }
    return staffOfNote;
}

const XML_NS = 'http://www.w3.org/XML/1998/namespace';

function readTitle(mei) {
    return text(mei.querySelector('titleStmt title')) || text(mei.querySelector('title'));
}

function text(element) {
    return element ? element.textContent.trim() : '';
}

/**
 * The instants at which the sounding set changes, each listing the indices of
 * the notes sounding from then on. This is what drives the harmonic table and
 * the spectrum during playback: recomputing those per animation frame would be
 * far too costly, and they only ever change here.
 */
export function buildChanges(notes) {
    let instants = [...new Set(notes.flatMap((note) => [note.startMs, note.endMs]))].sort((a, b) => a - b);
    let changes = [];
    for (let timeMs of instants) {
        let sounding = [];
        notes.forEach((note, index) => {
            if (note.startMs <= timeMs && note.endMs > timeMs) {
                sounding.push(index);
            }
        });
        // silence at the very end is worth an entry; a repeat of the previous
        // set is not, so the table does not flicker through identical states
        let previous = changes[changes.length - 1];
        if (!previous || !sameSet(previous.notes, sounding)) {
            changes.push({timeMs, notes: sounding});
        }
    }
    return changes;
}

function sameSet(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Which entry of `changes` is in force at a moment, or -1 before the piece
 * starts. The playhead asks this on every animation frame, so it is a binary
 * search; and because the answer only changes when the music does, it is also
 * what the table and the spectrum can be recomputed from, rather than from the
 * position itself.
 */
export function changeIndexAt(score, timeMs) {
    let low = 0;
    let high = score.changes.length - 1;
    let found = -1;
    while (low <= high) {
        let middle = (low + high) >> 1;
        if (score.changes[middle].timeMs <= timeMs) {
            found = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }
    return found;
}

/** The notes sounding at a given moment, as indices into score.notes. */
export function soundingAt(score, timeMs) {
    let index = changeIndexAt(score, timeMs);
    return index < 0 ? NOTHING : score.changes[index].notes;
}

const NOTHING = [];

/**
 * Groups the notes sounding at a moment by part, in the shape the rest of the
 * app calls a group, so the existing harmonic matrix can be built from a score
 * exactly as it is from hand-picked notes.
 */
export function groupsAt(score, timeMs, instrumentOverrides = {}) {
    let byPart = new Map();
    for (let index of soundingAt(score, timeMs)) {
        let note = score.notes[index];
        if (!byPart.has(note.partIndex)) {
            byPart.set(note.partIndex, []);
        }
        byPart.get(note.partIndex).push(note.pitchIndex);
    }
    return [...byPart.entries()].map(([partIndex, notes]) => ({
        partIndex,
        instrumentId: instrumentOverrides[partIndex] || score.parts[partIndex].instrumentId,
        notes: [...new Set(notes)].sort((a, b) => a - b),
    }));
}

// --- mapping a part onto one of our instruments -------------------------

// Matched against the part name, first hit wins, so the entries that would be
// swallowed by a shorter one come first ("contrabaixo" before "baixo", which is
// a voice). Names are matched without accents and in lower case, and cover the
// Portuguese, English, Italian and Latin spellings these scores arrive with.
const NAME_PATTERNS = [
    [/contrabaix|contrabass|double.?bass|contrebasse|kontrabass/, 'double-bass'],
    [/violoncel|cello/, 'cello'],
    // before the violin: stripped of its accent, "violão" ends in "viola"
    [/guitar|violao|chitarra|alaude|lute/, 'guitar'],
    [/violin|violino|viola/, 'violin'],
    [/clarinet/, 'clarinet'],
    [/fagot|bassoon|basson/, 'bassoon'],
    [/oboe|hautbois|oboi/, 'oboe'],
    [/flaut|flute|flauta|piccolo|flautim/, 'flute'],
    [/trompete|trumpet|tromba|clarino/, 'trumpet'],
    [/trombone|sackbut|sacabuxa/, 'trombone'],
    [/tuba|bombardino|euphonium/, 'tuba'],
    [/trompa|horn|corno/, 'horn'],
    // voices, including the Renaissance part names
    [/soprano|superius|cantus|discantus|treble|tiple/, 'voice-a'],
    [/contratenor|contra.?tenor|altus|alto|contralto|medius/, 'voice-a'],
    [/quintus|sextus|septima/, 'voice-a'],
    [/tenor|tenore/, 'voice-a'],
    [/bassus|baixo|basso|bass|baryton|baritono/, 'voice-a'],
    [/voz|voice|coro|choir|canto|vocal/, 'voice-a'],
];

// General MIDI programs, zero-based as MEI writes them.
const MIDI_PROGRAMS = new Map([
    [24, 'guitar'], [25, 'guitar'], [26, 'guitar'], [27, 'guitar'],
    [28, 'guitar'], [29, 'guitar'], [30, 'guitar'], [31, 'guitar'],
    [40, 'violin'], [41, 'violin'], [42, 'cello'], [43, 'double-bass'],
    [52, 'voice-a'], [53, 'voice-u'], [54, 'voice-a'],
    [56, 'trumpet'], [57, 'trombone'], [58, 'tuba'], [59, 'trumpet'], [60, 'horn'],
    [68, 'oboe'], [69, 'oboe'], [70, 'bassoon'], [71, 'clarinet'],
    [72, 'flute'], [73, 'flute'], [74, 'flute'],
]);

/**
 * Picks the instrument whose timbre stands in for a part. The written name
 * decides first, because it is what a reader goes by and it tells a bass voice
 * from a double bass, which a MIDI program cannot; the program is the fallback
 * for parts named generically. Whatever this returns is only a starting point:
 * every lane lets it be changed.
 */
export function guessInstrument(name, midiProgram) {
    let plain = (name || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase();
    for (let [pattern, id] of NAME_PATTERNS) {
        if (pattern.test(plain) && instruments.some((instrument) => instrument.id === id)) {
            return id;
        }
    }
    if (MIDI_PROGRAMS.has(midiProgram)) {
        return MIDI_PROGRAMS.get(midiProgram);
    }
    return defaultInstrument.id;
}
