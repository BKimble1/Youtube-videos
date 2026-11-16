// V2 picture events for the sound (audio/cues_v2.json): word times, every shot and hit, strafes, lock-ons, cuts and
// the story's physical events (the tap, the click, the lift, the lips closing...), all from the TypeScript timeline.
import {T} from '../source/src/story';
import {FIRES2, FIRE2, FLIGHT, ENEMIES2, REX_FIRES2, ZIPX2, game2} from '../source/src/v3/play3';
import {SHOTS2, CUTS} from '../source/src/v3/film3';
import {C2_START} from '../source/src/v3/device3';
import {ASSIST_START, G_CUTS} from '../source/src/v3/assist3';
import {DUR} from '../source/src/lib';
import {KO_HIT, LOOP_CUT} from '../source/src/v3/cast3';
import * as fs from 'fs';
const strafes: {t: number; dur: number; dir: number}[] = [];
for (let i = 0; i < ZIPX2.length - 1; i++) {
  const [a, va] = ZIPX2[i], [b, vb] = ZIPX2[i + 1];
  if (Math.abs(vb - va) > 0.5 && b - a < 1.2 && a >= 0) strafes.push({t: a, dur: b - a, dir: Math.sign(vb - va)});
}
const locks: number[] = [];
let prev = 0;
for (let f = 0; f < Math.round(DUR * 30); f++) {
  const l = game2(f / 30).lock;
  if (prev < 0.5 && l >= 0.5) locks.push(f / 30);
  prev = l;
}
const big = (target: number | 'rex') => target === 'rex' || !!ENEMIES2.find((e) => e.id === target)?.big;
const out = {
  DUR, T, CUTS,
  fires: FIRES2.map((f) => ({t: f.t, hit: f.t + FLIGHT, big: big(f.target), rex: f.target === 'rex'})),
  rexFires: REX_FIRES2, strafes, locks,
  ev: {
    reticleLaunch: T.this, reticleLock: T.mouth1 - 0.02, tap: T.can + 0.02, tongueTouchRoof: T.roof - 0.02, click: T.click,
    lift: C2_START, sensorGlint: T.gold, sensorRipple: T.square - 0.05, flyIn: T.its2 - 0.15, keysA: T.move + 0.12, keysW: T.character - 0.02, keysD: T.moves - 0.02,
    facecam: CUTS.E1 + 0.22, assistStart: ASSIST_START, click1: T.already + 0.25, click2: T.control + 0.05, swipe: T.phones - 0.02, answer: T.without - 0.02,
    lipsClose: T.mouth3 + 0.0, honestIn: T.seriously - 0.25, mashFrom: T.imagine - 0.25, tag: FIRE2.tag + FLIGHT, ko: FIRE2.ko, koHit: KO_HIT,
    koPop: KO_HIT + 0.42, chargeFrom: FIRE2.ko - 0.3, hop: FIRE2.ko + 0.32, eyesToWinner: T.with2 - 0.2, padThud: KO_HIT + 1.15, smug: T.shut + 0.55,
    loopCut: LOOP_CUT, gameCut: CUTS.H4,
  },
  cuts: SHOTS2.map((s) => ({name: s.name, t: s.a})),
  internalCuts: [G_CUTS[1], G_CUTS[2]], // cuts inside a shot (the montage's)
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v2.json', JSON.stringify(out, null, 1));
console.log('cues v2:', out.fires.length, 'fires,', strafes.length, 'strafes,', locks.length, 'locks,', out.cuts.length, 'shots');
