// V6 sound-event timing, taken from the same functions the picture uses: his planted steps in the lab (loop time), the
// echo arrivals at the receive bar, every walker's heel strikes (café, street, study corridor), and the scene joins.
// usage: bundle with esbuild, run with node; writes audio/v6_events.json
import * as fs from 'fs';
import {echoArrivals, LAB_OUT, LB} from '../../source/src/v6/Lab6';
import {LAB_IN, STEPS} from '../../source/src/v6/hero6';
import {cafeFootsteps, CF, E_OUT, E_PUSH, G_BACK, G_IN, G_PUSH, H_IN, OR_SPLIT, POV_IN, UI_IN, UI_OUT} from '../../source/src/v6/Cafe6';
import {studyFootsteps, STUDY_UI_IN, WALKERS} from '../../source/src/v6/Study6';
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
  beats: {...LB, labOut: LAB_OUT, labIn: LAB_IN, uiIn: UI_IN, uiOut: UI_OUT, eOut: E_OUT, gIn: G_IN, ePush: E_PUSH, gPush: G_PUSH, gBack: G_BACK, hIn: H_IN, povIn: POV_IN, orSplit: OR_SPLIT,
    studyUiIn: STUDY_UI_IN, silA: LB.creepy + 0.1, wipeA: E_OUT - 0.45, ...Object.fromEntries(Object.entries(CF).map(([k, v]) => [`cafe_${k}`, v]))},
};
fs.writeFileSync(process.argv[2], JSON.stringify(ev, null, 1));
console.log('echoes', ev.echoArrivals.length, 'raise', ev.raiseArrivals.length, 'steps', ev.footsteps.length + ev.labSteps.length);
