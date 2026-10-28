// V5 sound-event timing, taken from the same functions the picture uses: his planted steps in the lab (loop time), the
// echo arrivals at the receive bar, every walker's heel strikes (café, street, study corridor), and the scene joins.
// usage: bundle with esbuild, run with node; writes audio/v5_events.json
import * as fs from 'fs';
import {echoArrivals, LAB_OUT, LB} from '../../source/src/v5/Lab5';
import {LAB_IN, STEPS} from '../../source/src/v5/hero5';
import {cafeFootsteps, CF, E_OUT, G_CUT, G_IN, H_IN, POV_IN, POV_OUT, UI_IN, UI_OUT} from '../../source/src/v5/Cafe5';
import {studyFootsteps, STUDY_UI_IN, WALKERS} from '../../source/src/v5/Study5';
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
  beats: {...LB, labOut: LAB_OUT, labIn: LAB_IN, uiIn: UI_IN, uiOut: UI_OUT, eOut: E_OUT, gIn: G_IN, gCut: G_CUT, hIn: H_IN, povIn: POV_IN, povOut: POV_OUT,
    studyUiIn: STUDY_UI_IN, silA: LB.creepy + 0.1, wipeA: E_OUT - 0.45, ...Object.fromEntries(Object.entries(CF).map(([k, v]) => [`cafe_${k}`, v]))},
};
fs.writeFileSync(process.argv[2], JSON.stringify(ev, null, 1));
console.log('echoes', ev.echoArrivals.length, 'raise', ev.raiseArrivals.length, 'steps', ev.footsteps.length + ev.labSteps.length);
