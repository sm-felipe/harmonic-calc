// Lissajous figures: one note's fundamental drives the horizontal, another's
// the vertical, and the point they move together traces the figure.
//
// What makes them worth drawing here is what they do over time. If the two
// frequencies are in an exact small ratio p:q the figure closes on itself and
// stands still. If they are only close to it — a tempered interval — it closes
// almost, and turns slowly, and the rate it turns at is a beat you can hear:
// the one between the p-th harmonic of the lower note and the q-th of the
// upper. An equal-tempered fifth on A3 turns once every 1.35 seconds, because
// 3 × 220 = 660 and 2 × 329.63 = 659.26 are 0.74 Hz apart. In just intonation
// they coincide, and the figure is still.

// How far from an exact ratio an interval may be and still be read as it: 20
// cents takes in every equal-tempered interval's nearest simple ratio (the
// thirds are the worst, 14 and 16 cents off) without letting everything be
// called 1:1.
const TOLERANCE_CENTS = 20;
// past this the figure is too knotted to read, and nothing simpler is close
const MAX_DENOMINATOR = 16;
// below this a figure is standing still for any purpose: in just intonation
// the drift is a rounding error, not a frequency
const STILL_HZ = 0.01;

/**
 * The simplest ratio p:q near upper/lower — the one the figure is trying to
 * be. Found as the first continued-fraction convergent within tolerance,
 * since convergents are the best approximations for their size.
 */
export function nearestRatio(lower, upper) {
    let target = upper / lower;
    let best = null;
    // convergents h/k of the continued fraction of `target`
    let [h0, h1] = [0, 1];
    let [k0, k1] = [1, 0];
    let x = target;
    for (let step = 0; step < 32; step++) {
        let a = Math.floor(x);
        [h0, h1] = [h1, a * h1 + h0];
        [k0, k1] = [k1, a * k1 + k0];
        if (k1 > MAX_DENOMINATOR) {
            break;
        }
        best = {p: h1, q: k1};
        if (Math.abs(centsBetween(h1 / k1, target)) <= TOLERANCE_CENTS) {
            break;
        }
        let fraction = x - a;
        if (fraction < 1e-12) {
            break;
        }
        x = 1 / fraction;
    }
    return {...best, cents: centsBetween(target, best.p / best.q)};
}

function centsBetween(a, b) {
    return 1200 * Math.log2(a / b);
}

/**
 * Everything the drawing needs about two fundamentals, lower first:
 *
 *   p, q     the ratio p:q the figure approximates
 *   cents    how far the real interval is from it
 *   driftHz  how many times a second the figure turns; 0 when it is still
 *   window   seconds of signal that close the figure once, q periods of the
 *            lower note, which is also p of the upper
 */
export function describeFigure(lower, upper) {
    let {p, q, cents} = nearestRatio(lower, upper);
    let drift = Math.abs(q * upper - p * lower);
    return {
        lower,
        upper,
        p,
        q,
        cents,
        driftHz: drift < STILL_HZ ? 0 : drift,
        window: q / lower,
    };
}

/**
 * The figure as it stands at time `t0` seconds, as points in [-1, 1] × [-1, 1],
 * y upwards. Enough points that the tightest turn in it still looks smooth.
 */
export function sampleFigure(figure, t0 = 0, samples = sampleCountFor(figure)) {
    let points = new Array(samples + 1);
    for (let i = 0; i <= samples; i++) {
        let t = t0 + figure.window * i / samples;
        points[i] = [
            Math.sin(2 * Math.PI * figure.lower * t),
            Math.sin(2 * Math.PI * figure.upper * t),
        ];
    }
    return points;
}

// each lobe of the figure wants a few dozen points to look like a curve
export function sampleCountFor(figure) {
    return Math.min(2400, Math.max(400, 48 * (figure.p + figure.q)));
}

/**
 * The fundamental of each distinct note in a harmonic matrix, lowest first.
 * A row may have lost its fundamental below the audibility cutoff — a bassoon's
 * low notes do — so it is worked back from any partial's natural frequency
 * rather than read off the first one; the natural frequency, because a snapped
 * partial has been moved and no longer divides back to the note.
 */
export function fundamentalsOf(harmonicMatrix) {
    let seen = new Map();
    for (let row of harmonicMatrix) {
        let partial = row.harmonics[0];
        if (!partial || seen.has(row.note)) {
            continue;
        }
        seen.set(row.note, {
            note: row.note,
            noteName: row.noteName,
            frequency: partial.naturalFrequency / partial.harmonicNumber,
        });
    }
    return [...seen.values()].sort((a, b) => a.frequency - b.frequency);
}
