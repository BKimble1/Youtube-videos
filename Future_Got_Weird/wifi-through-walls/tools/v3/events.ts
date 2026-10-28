// V3 sound-event timing, taken from the same functions the picture uses: footsteps (every planted step of every
// walker on screen), the radio's transmit pulses, the moment the waves enter the concrete, the echo arrivals at the
// receiver (and the raised hand's), the transitions, the recordings and matches. usage: bundle with esbuild, run with
// node; writes audio/v3_events.json
import * as fs from 'fs';
import {echoes, LB, LAB_OUT, RAISE_ECHO, waveTiming} from '../../source/src/v3/Lab3';
import {heroLab, HERO_G, STEPS, END0} from '../../source/src/v3/hero3';
import {cafeFootsteps, CB3, E_OUT, H_IN} from '../../source/src/v3/Cafe3';
import {studyFootsteps, SB, cross} from '../../source/src/v3/Study3';
import {keypoints, KPName} from '../../source/src/art/skeleton';
import {v3, V3} from '../../source/src/world/cam';
import {DUR} from '../../source/src/lib';

const kpW = (t: number) => Object.fromEntries(Object.entries(keypoints(heroLab(t).p)).map(([k, p]) => [k, v3(HERO_G.x + p.x / 600, -p.y / 600, HERO_G.z - 0.05)])) as Record<KPName, V3>;
const w = waveTiming();
const ev = {
  duration: DUR,
  labSteps: STEPS.map((s) => ({t: s.t, gain: s.t < -2.1 ? 0.6 : 0.9})),
  footsteps: [...cafeFootsteps(), ...studyFootsteps()].map((s) => ({t: +s.t.toFixed(3), gain: s.gain, who: s.who})),
  txPulses: w.pulses,
  wallIn: w.wallIn,
  hit: w.hit,
  echoArrivals: echoes(LB.body, kpW(LB.body)).arrivals,
  raiseArrivals: echoes(LB.hand, kpW(LB.hand), RAISE_ECHO()).arrivals,
  beats: {...LB, labOut: LAB_OUT, eOut: E_OUT, hIn: H_IN, end0: END0, ...Object.fromEntries(Object.entries(CB3).map(([k, v]) => [`cafe_${k}`, v])),
    ...Object.fromEntries(Object.entries(SB).map(([k, v]) => [`study_${k}`, v])), crossA: cross.A, crossB: cross.B},
};
fs.writeFileSync(process.argv[2], JSON.stringify(ev, null, 1));
console.log('pulses', ev.txPulses.length, 'echoes', ev.echoArrivals.length, 'steps', ev.footsteps.length + ev.labSteps.length);
