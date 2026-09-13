import {CUSTOM_LEVEL_PRESETS} from "./instruments";
import {indexOfNote} from "./notes";
import {defaultTuning} from "./temperaments";

// One-click starting points shown when nothing is selected yet. Each one
// describes the groups and the tuning to load.
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
];

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
