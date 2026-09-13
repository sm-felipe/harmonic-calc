import {findInstrument, instruments} from "./instruments";
import {indexOfNote, NOTE_COUNT} from "./notes";
import {searchNamesOf} from "./spelling";
import {accidentalOptions, defaultTuning, findTemperament, referencePitches, temperaments} from "./temperaments";
import {findKey, keys} from "./spelling";
import {CYCLE_OPTIONS, DEFAULT_CYCLES} from "./waveform";

// The whole configuration lives in the query string, so a link reproduces
// what is on screen. Defaults are left out to keep links short:
//
//   ?g=bassoon:Bb1;voice-a:A3,Db4,E4&t=just&k=A&a4=415&acc=flats&wave=3
//
// g    groups, ";"-separated: instrument:notes[~levels]. Notes are written
//      with flats, because "#" would start the URL fragment (any spelling is
//      accepted when reading); levels are the custom instrument's nine dB
//      values, "."-separated, only when not the default.
// t    temperament id      k  key id      a4  reference pitch in Hz
// acc  accidentals (equal temperament)     wave  cycles, present when the wave is shown

export function encodeState({groups, tuning, display}) {
    let params = new URLSearchParams();

    let encodedGroups = groups
        .filter((group) => group.notes.length > 0 || groups.length > 1)
        .map(encodeGroup)
        .join(';');
    if (encodedGroups) params.set('g', encodedGroups);

    if (tuning.temperamentId !== defaultTuning.temperamentId) params.set('t', tuning.temperamentId);
    if (tuning.keyId !== defaultTuning.keyId) params.set('k', tuning.keyId);
    if (tuning.a4 !== defaultTuning.a4) params.set('a4', String(tuning.a4));
    if (tuning.accidentals && tuning.accidentals !== defaultTuning.accidentals) params.set('acc', tuning.accidentals);
    if (display.showWave) params.set('wave', String(display.waveCycles));

    // keep ":" "," ";" "~" readable instead of percent-encoded
    return params.toString().replace(/%3A/gi, ':').replace(/%2C/gi, ',').replace(/%3B/gi, ';').replace(/%7E/gi, '~');
}

function encodeGroup(group) {
    let instrument = findInstrument(group.instrumentId);
    let notes = group.notes.map((index) => searchNamesOf(index).at(-1)).join(',');   // flat spelling
    let text = `${instrument.id}:${notes}`;
    if (instrument.customizable && group.harmonicLevels
        && group.harmonicLevels.join('.') !== instrument.defaultLevels.join('.')) {
        text += '~' + group.harmonicLevels.map((level) => Math.round(level)).join('.');
    }
    return text;
}

/**
 * Reads a query string back into {groups, tuning, display}. Anything
 * missing or malformed falls back to the defaults; groups come without ids.
 */
export function decodeState(search) {
    let params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

    let groups = (params.get('g') || '')
        .split(';')
        .map(decodeGroup)
        .filter(Boolean);

    let tuning = {...defaultTuning};
    if (temperaments.some((t) => t.id === params.get('t'))) tuning.temperamentId = params.get('t');
    if (keys.some((k) => k.id === params.get('k'))) tuning.keyId = params.get('k');
    let a4 = Number(params.get('a4'));
    if (referencePitches.some((pitch) => pitch.hz === a4)) tuning.a4 = a4;
    if (accidentalOptions.some((option) => option.id === params.get('acc'))) tuning.accidentals = params.get('acc');

    let display = {showWave: false, waveCycles: DEFAULT_CYCLES};
    let cycles = Number(params.get('wave'));
    if (CYCLE_OPTIONS.includes(cycles)) display = {showWave: true, waveCycles: cycles};

    return {groups, tuning, display};
}

function decodeGroup(text) {
    let match = /^([a-z0-9-]+):([^~]*)(?:~(.*))?$/i.exec(text.trim());
    if (!match) return null;
    let [, instrumentId, noteList, levelList] = match;
    if (!instruments.some((instrument) => instrument.id === instrumentId)) return null;

    let notes = noteList.split(',').map(indexOfNote)
        .filter((index) => index !== undefined && index >= 0 && index < NOTE_COUNT);
    notes = [...new Set(notes)].sort((a, b) => a - b);

    let group = {instrumentId, notes};
    let instrument = findInstrument(instrumentId);
    if (instrument.customizable && levelList) {
        let levels = levelList.split('.').map(Number);
        if (levels.length === instrument.defaultLevels.length && levels.every((level) => Number.isFinite(level))) {
            group.harmonicLevels = levels.map((level) => Math.max(-30, Math.min(0, level)));
        }
    }
    return group;
}

// re-exported for callers that only need to validate ids
export {findTemperament, findKey};
