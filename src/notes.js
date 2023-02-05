export default function calculateNote (middleAFreq, semitonesDistance) {
    return middleAFreq * Math.pow(2, semitonesDistance / 12);
}
