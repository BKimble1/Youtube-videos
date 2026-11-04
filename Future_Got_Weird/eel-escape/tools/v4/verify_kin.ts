// V4 kinematic checks on the exterior escape (escape.ts), every frame from the poke to the end:
//  - the tail leads: the length outside never decreases; the tail tip moves away from the exit
//  - the head clears ONCE (T_REL), on "pull" (20.82–21.10)
//  - one connected animal: neighbouring samples ≤ 0.6 u apart (spacing 0.45 u)
//  - after the release the eel never re-enters the predator (crude body model) and the distance opens
import {escapeAt, outAt, T_REL, EXIT0} from '../../source/src/v4/escape';
import {N, RADII} from '../../source/src/v4/eelV4';
import {DORSAL, VENTRAL} from '../../source/src/anatomy';
import {halfW} from '../../source/src/v4/standin';
const prof = (P: {x: number; y: number}[], x: number) => {
  if (x <= P[0].x) return P[0].y;
  for (let i = 1; i < P.length; i++) if (x <= P[i].x) { const f = (x - P[i - 1].x) / (P[i].x - P[i - 1].x); return P[i - 1].y + f * (P[i].y - P[i - 1].y); }
  return P[P.length - 1].y;
};
const inFish = (p: number[], r: number) => {
  const [x, y, z] = p; if (x < -50.5 || x > 33) return 9;
  const top = prof(DORSAL, x), bot = prof(VENTRAL, x), yc = (top + bot) / 2, h = (bot - top) / 2 + r, w = halfW(x) + r;
  return ((y - yc) / h) ** 2 + (z / w) ** 2;
};
let prevOut = -1e9, outDrops = 0, headCross: number[] = [], maxGap = 0, reenter = 0, prevHeadOut = false;
const dist: number[] = [];
for (let f = Math.round(12.4 * 30); f < 744; f++) {
  const t = f / 30, e = escapeAt(t), o = outAt(t);
  if (o < prevOut - 1e-9) outDrops++;
  prevOut = o;
  const headOut = e.free || e.crossI < 0;
  if (headOut !== prevHeadOut) headCross.push(+t.toFixed(3));
  prevHeadOut = headOut;
  for (let i = 1; i <= N; i++) maxGap = Math.max(maxGap, Math.hypot(e.c[i][0] - e.c[i - 1][0], e.c[i][1] - e.c[i - 1][1], e.c[i][2] - e.c[i - 1][2]));
  if (t > T_REL + 0.05) for (let i = 0; i <= N; i++) if (inFish(e.c[i], RADII[i]) < 1) { reenter++; break; }
  if (t >= T_REL) dist.push(Math.hypot(e.c[60][0] - EXIT0.p[0], e.c[60][1] - EXIT0.p[1], e.c[60][2] - EXIT0.p[2]));
}
console.log(JSON.stringify({outDrops, headClears: headCross, T_REL, maxSampleGap: +maxGap.toFixed(3), framesInsidePredatorAfterRelease: reenter,
  midDistanceFromExit: {atRelease: +dist[0].toFixed(1), at22: +dist[Math.round((22 - T_REL) * 30)].toFixed(1), atEnd: +dist[dist.length - 1].toFixed(1)}}));
