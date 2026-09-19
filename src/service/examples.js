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
        id: 'odd-harmonics',
        title: 'Odd harmonics only',
        description: 'Every even partial switched off, which is what gives the clarinet\'s low register its hollow sound. The sliders open so you can put them back one at a time.',
        groups: [
            {
                instrumentId: 'custom',
                notes: ['A3'],
                harmonicLevels: CUSTOM_LEVEL_PRESETS.find((preset) => preset.id === 'odd').levels,
                // the levels are the point of this one, so they start unfolded
                showLevels: true,
            },
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
            ...(group.showLevels ? {showLevels: true} : {}),
        })),
        tuning: {...example.tuning},
    };
}
