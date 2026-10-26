// Sound cues from the picture: the narration anchors, the cuts, and the physical events read from the same state
// functions the shots draw (world.ts), including the moment each leg first touches the block or the second spider.
// usage: esbuild bundle -> node out.cjs audio/cues.json
import fs from 'fs';
import {DUR, WORDS} from '../source/src/lib';
import {A_EXT, CUT, D_EXT, D_Z, E_READ, E_Z, F_EXT, F_Z, gripperPose, TM, withLag} from '../source/src/world';

const out = process.argv[2] ?? 'audio/cues.json';
const contacts = (st: 'D' | 'F', ext: (t: number) => number, t0: number, t1: number) => {
  const hit: (number | null)[] = Array(8).fill(null);
  for (let t = t0; t <= t1; t += 1 / 120) {
    const P = gripperPose(t, st);
    const cmd = withLag(ext, t);
    P.e.forEach((e, i) => {
      if (hit[i] === null && e > cmd[i] + 0.01) hit[i] = +t.toFixed(3);
    });
  }
  return hit;
};
const firstTime = (fn: (t: number) => boolean, t0: number, t1: number) => {
  for (let t = t0; t <= t1; t += 1 / 120) if (fn(t)) return +t.toFixed(3);
  return null;
};
const cues = {
  DUR,
  WORDS,
  TM,
  CUT,
  A: {contact: 0.42, glue: 0.62, plunger0: TM.dead + 0.05, plunger1: 3.3, open0: 2.2, open1: 3.55, lift0: 1.1, lift1: 2.05},
  D: {
    push0: TM.push - 0.05, push1: TM.push + 0.55, open0: TM.spread - 0.1, open1: TM.again - 0.25,
    lower0: TM.again - 0.15, lower1: CUT.insert - 0.05, release0: CUT.insert + 0.1, release1: CUT.insert + 0.38,
    close0: CUT.side + 0.12, close1: TM.snapped + 0.02, contacts: contacts('D', D_EXT, CUT.side, TM.snapped + 0.5),
    lift0: TM.object - 0.3, lift1: CUT.load + 0.2, clear: firstTime((t) => D_Z(t) - D_Z(TM.object - 0.3) > 0.2, TM.object - 0.3, CUT.load),
  },
  E: {lift0: TM.lift - 0.42, lift1: TM.weightEnd + 0.12, clear: firstTime((t) => E_READ(t) < 1, TM.lift - 0.5, CUT.tray), z0: E_Z(0)},
  F: {
    down0: TM.they3, down1: TM.another + 0.65, open0: TM.they3 + 0.25, open1: TM.down + 0.2, close0: TM.spider4 - 0.55, close1: TM.spider4 - 0.1,
    contacts: contacts('F', F_EXT, TM.spider4 - 0.6, TM.spider4 + 0.3), lift0: TM.spider4 + 0.25, lift1: 29.2,
    zTop: F_Z(0),
  },
};
void A_EXT;
fs.writeFileSync(out, JSON.stringify(cues, null, 1));
console.log(JSON.stringify({D: cues.D.contacts, F: cues.F.contacts, Dclear: cues.D.clear, Eclear: cues.E.clear}));
