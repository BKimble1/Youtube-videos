// V9 sound-event timing, taken from the same functions the picture uses: his planted steps in the lab (loop time), the
// echo arrivals at the receive bar, every walker's heel strikes (café, street, study corridor), and the scene joins.
// usage: bundle with esbuild, run with node; writes audio/v9_events.json
import * as fs from 'fs';
import {echoArrivals, heroPulse, HERO_N, LAB_OUT, LB} from '../../source/src/v9/Lab9';
import {DUCK0, LAB_IN, STEPS} from '../../source/src/v9/hero9';
import {cafeFootsteps, CF, E_OUT, E_PUSH, G_BACK, G_IN, H_IN, OR_SPLIT, POV_IN, stopTime, UI_IN, UI_OUT} from '../../source/src/v9/Cafe9';
import {STUDY_PUSH, studyFootsteps, studyMatches, STUDY_UI_IN, WALKERS} from '../../source/src/v9/Study9';
import {DUR} from '../../source/src/lib';

const r3 = (x: number) => +x.toFixed(3);
const ev = {
  duration: DUR,
  labSteps: STEPS.map((t) => ({t: r3(t)})),
  footsteps: [...cafeFootsteps(), ...studyFootsteps()].map((s) => ({t: r3(s.t), gain: s.gain, who: s.who})),
  openingArrivals: echoArrivals(1.4, 3.1).map(r3),
  echoArrivals: echoArrivals(LB.shoots, LB.ai + 0.6).map(r3),
  raiseArrivals: echoArrivals(LB.raise, LB.but).map(r3),
  walkerCross: WALKERS.map((w) => r3(w.t0 + 1.2)),
  studyMatches: studyMatches(),
  studyPush: STUDY_PUSH,
  duck0: DUCK0,
  // the followed pulse: leaves the array, enters the concrete, meets his head, its echo reaches the receive bar
  heroPulse: (() => {
    const te = HERO_N * 0.34;
    let wallIn = 0;
    for (let t = te; t < te + 3; t += 0.01) { const h = heroPulse(t); if (h.leg === 'out' && h.zone === 1) { wallIn = t; break; } }
    const h = heroPulse(te + 0.01);
    const a = heroPulse(10) as {tArrive?: number};
    return {emit: te, wallIn: r3(wallIn), hit: r3(h.tHit), arrive: r3(a.tArrive ?? 0)};
  })(),
  beats: {...LB, labOut: LAB_OUT, labIn: LAB_IN, uiIn: UI_IN, uiOut: UI_OUT, eOut: E_OUT, gIn: G_IN, ePush: E_PUSH, stopT: stopTime(), gBack: G_BACK, hIn: H_IN, povIn: POV_IN, orSplit: OR_SPLIT,
    studyUiIn: STUDY_UI_IN, silA: LB.creepy + 0.1, wipeA: E_OUT - 0.45, ...Object.fromEntries(Object.entries(CF).map(([k, v]) => [`cafe_${k}`, v]))},
};
fs.writeFileSync(process.argv[2], JSON.stringify(ev, null, 1));
console.log('echoes', ev.echoArrivals.length, 'raise', ev.raiseArrivals.length, 'steps', ev.footsteps.length + ev.labSteps.length);
