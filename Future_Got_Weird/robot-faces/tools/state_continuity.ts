// QA: parameter jumps of the shared robot / visitor states across every shot boundary (a cut must not reset them).
//   source/node_modules/.bin/esbuild tools/state_continuity.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/sc.cjs && node /tmp/sc.cjs
import {robotAt, visitorAt, K} from '../source/src/state';
import {SHOTS} from '../source/src/Film';
// state continuity at each boundary: max change of robot/visitor params across the boundary frame vs a typical frame
for (const sh of SHOTS.slice(1)) {
  const f = Math.round(sh.a * 30);
  const a = robotAt(f - 1), b = robotAt(f), c = robotAt(f + 1);
  const keys = ['yaw', 'smile', 'open', 'round', 'press', 'gx', 'gy', 'lid', 'brow', 'asym', 'wide'] as const;
  const jumps = keys.map((k) => [k, Math.abs((b as any)[k] - (a as any)[k]), Math.abs((c as any)[k] - (b as any)[k])]).filter((x) => (x[1] as number) > 0.05 || (x[2] as number) > 0.05);
  const va = visitorAt(f - 1).expr, vb = visitorAt(f).expr;
  const vj = Object.keys(va).filter((k) => Math.abs((va as any)[k] - (vb as any)[k]) > 0.05);
  console.log(sh.id.padEnd(12), f, 'robot:', JSON.stringify(jumps.map((x) => `${x[0]} ${(x[1] as number).toFixed(2)}`)), 'visitor:', vj.join(','));
}
