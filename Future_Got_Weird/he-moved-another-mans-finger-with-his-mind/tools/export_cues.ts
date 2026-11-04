// Exports the picture's sound cues (each sequence's CUES_Sx) and the sequence start times for the mix.
//   npx --prefix source esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
import {writeFileSync} from 'fs';
import {SCENES} from '../source/src/shots/scenes';
import * as S1 from '../source/src/shots/S1Hook';
import * as S2 from '../source/src/shots/S2Setup';
import * as S3 from '../source/src/shots/S3Route';
import * as S4 from '../source/src/shots/S4Pilot';
import * as S5 from '../source/src/shots/S5Control';
import * as S6 from '../source/src/shots/S6BrainNet';
import * as S7 from '../source/src/shots/S7Trust';
import {T, TE, FRAMES} from '../source/src/lib/core';

const mods: [string, any][] = [['S1', S1], ['S2', S2], ['S3', S3], ['S4', S4], ['S5', S5], ['S6', S6], ['S7', S7]];
const cues: {t: number; kind: string; gain?: number; dur?: number; scene: string}[] = [];
for (const [n, m] of mods) {
  const fn = m[`CUES_${n}`];
  if (typeof fn !== 'function') { console.log('no cues for', n); continue; }
  for (const c of fn()) cues.push({...c, scene: n});
}
cues.sort((a, b) => a.t - b.t);
const out = {
  frames: FRAMES,
  scenes: SCENES.map((s) => ({id: s.id, start: s.start()})),
  K: {
    flipped: T('With the coil flipped'), flippedEnd: TE('With the coil flipped'), across3: T('Across all three pairs'),
    bad: T('Bad connection'), goBack: T('Go back to that finger'), wrong: TE('the other guy was wrong'), fire: TE('over the internet. Fire'),
    trust: T('Here’s where I’d start'),
  },
  cues,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[2], cues.length, 'cues');
