import {CUSTOM_LEVEL_PRESETS} from "./instruments";
import {readScore} from "./musicXml";
import {indexOfNote} from "./notes";
import {defaultTuning} from "./temperaments";

// One-click starting points shown when nothing is selected yet. Most describe
// the groups and the tuning to load; one names a score shipped with the app,
// which is opened the same way an uploaded file is.
export const examples = [
    {
        id: 'bassoon',
        title: 'A bassoon\'s low Bb',
        description: 'The fundamental is weak: the 7th-9th harmonics carry the note.',
        groups: [{instrumentId: 'bassoon', notes: ['A#1']}],
        tuning: defaultTuning,
    },
    {
        id: 'just-chord',
        title: 'A major chord, justly tuned',
        description: 'Three voices in just intonation from A: every shared harmonic lands exactly on a note.',
        groups: [{instrumentId: 'voice-a', notes: ['A3', 'C#4', 'E4']}],
        tuning: {...defaultTuning, temperamentId: 'just', keyId: 'A'},
    },
    {
        id: 'odd-vs-clarinet',
        title: 'Odd harmonics only, next to a clarinet',
        description: 'A custom instrument with the even harmonics switched off, compared with the real thing.',
        groups: [
            {instrumentId: 'custom', notes: ['A3'], harmonicLevels: CUSTOM_LEVEL_PRESETS.find((preset) => preset.id === 'odd').levels},
            {instrumentId: 'clarinet', notes: ['A3']},
        ],
        tuning: defaultTuning,
    },
    {
        id: 'mille-regretz',
        title: 'Josquin, Mille Regretz',
        description: 'A whole chanson for four voices, played from its score: the table and the spectrum follow the chord under the playhead as the voices move.',
        credit: 'Transcription and edition: Fernando G. Jácome, Grupo Vocal “Solo Voces”, after Susato, Anvers 1549.',
        scoreFile: 'mille-regretz.mxl',
    },
];

/**
 * Opens a score that ships with the app. The file sits in public/scores and is
 * read exactly as an uploaded one is, so nothing about it is a special case
 * once it is open.
 */
export async function readExampleScore(example) {
    let response = await fetch(`${process.env.PUBLIC_URL || ''}/scores/${example.scoreFile}`);
    if (!response.ok) {
        throw new Error('That example could not be fetched.');
    }
    let bytes = await response.arrayBuffer();
    // readScore only ever asks a file for its name and its bytes, so hand it
    // those rather than wrapping them back up in a File
    return readScore({
        name: example.scoreFile,
        arrayBuffer: async () => bytes,
        text: async () => new TextDecoder().decode(bytes),
    });
}

// Resolve note names to pitch indices; `makeGroup` supplies ids and defaults.
export function loadExample(example, makeGroup) {
    return {
        groups: example.groups.map((group) => ({
            ...makeGroup(),
            instrumentId: group.instrumentId,
            notes: group.notes.map(indexOfNote),
            ...(group.harmonicLevels ? {harmonicLevels: [...group.harmonicLevels]} : {}),
        })),
        tuning: {...example.tuning},
    };
}
