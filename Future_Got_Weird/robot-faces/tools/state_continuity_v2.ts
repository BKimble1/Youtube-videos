// V2 QA: scans every frame of the shared states (rob2 / vis2) for one-frame jumps, and reports each jump with the shot
// it falls in. A jump on a shot boundary is a scene change (allowed where the place or moment changes); a jump inside
// a shot is a defect. The yaw is excluded (each shot presents its own camera angle on the robot).
//   source/node_modules/.bin/esbuild tools/state_continuity_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --external:remotion --outfile=/tmp/sc2.cjs && node /tmp/sc2.cjs
import {rob2, vis2, END} from '../source/src/v2/state2';
import {SHOTS2} from '../source/src/v2/Film2';

const RK = ['smile', 'open', 'round', 'press', 'gx', 'gy', 'lid', 'brow', 'asym', 'wide'] as const;
// mouth shapes in the silent speech demonstrations change over a 2-frame co-articulation window by design; for those
// keys only a change above 0.6 in one frame is reported (a snap)
const MOUTH = new Set(['open', 'round', 'press', 'wide', 'teeth']);
const lim = (k: string) => (MOUTH.has(k) ? 0.6 : 0.12);
const N = Math.round(END * 30);
const bounds = new Set(SHOTS2.slice(1).map((s) => Math.ceil(s.a * 30 - 1e-9)));
const shotOf = (f: number) => SHOTS2.find((s) => f / 30 >= s.a && f / 30 < s.b)?.id ?? '?';
let inside = 0, atCut = 0;
let pr = rob2(0), pv = vis2(0).expr;
for (let f = 1; f < N; f++) {
  const r = rob2(f), v = vis2(f).expr;
  const rj = RK.filter((k) => Math.abs((r as any)[k] - (pr as any)[k]) > lim(k)).map((k) => `${k} ${((r as any)[k] - (pr as any)[k]).toFixed(2)}`);
  const vj = Object.keys(v).filter((k) => Math.abs((v as any)[k] - (pv as any)[k]) > lim(k)).map((k) => `${k} ${((v as any)[k] - (pv as any)[k]).toFixed(2)}`);
  if (rj.length || vj.length) {
    const cut = bounds.has(f);
    cut ? atCut++ : inside++;
    console.log(`${cut ? 'CUT   ' : 'INSIDE'} f${f} ${(f / 30).toFixed(2)}s ${shotOf(f).padEnd(13)} robot[${rj.join(', ')}] visitor[${vj.join(', ')}]`);
  }
  pr = r;
  pv = v;
}
console.log(`frames ${N}: jumps inside shots ${inside}, at cuts ${atCut}`);
