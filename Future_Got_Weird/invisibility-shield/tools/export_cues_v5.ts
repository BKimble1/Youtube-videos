// V5: the picture's event timeline for the V4 sound mix: every foot landing of both characters (from the explicit
// plants, chase time folded back onto the film clock), with the camera's distance to that foot, the flashlight's
// sweep rate per frame, and the shot list. usage: bundle with esbuild (platform node), then:
//   node export_cues_v5.cjs audio/cues_v5.json
import fs from 'node:fs';
import tl from '../source/src/data/timeline.json';
import {BODY_G} from '../source/src/v5/cast5';
import {joints4} from '../source/src/v5/Crew5';
import {cardToWorld, norm3, sub3} from '../source/src/v5/geo5';
import {BOLT, DUR} from '../source/src/v5/layout5';
import {camAt, G_PLANTS, guardAt, HER_PLANTS, SHOTS} from '../source/src/v5/story5';

const FPS = 30;
const steps: {who: string; foot: string; t: number; dist: number; shot?: string}[] = [];
const add = (who: string, plants: {L: {t0: number; x: number; z: number}[]; R: {t0: number; x: number; z: number}[]}) => {
  (['L', 'R'] as const).forEach((foot) => plants[foot].forEach((p) => {
    if (p.t0 < -5 || p.t0 > 40) return;
    const t = p.t0 < 0 ? p.t0 + DUR : p.t0;
    // chase plants after the bolt and before the opening's end are the same list; skip a landing the film never shows
    if (p.t0 >= 0 && p.t0 < 2.5 && t >= BOLT) return;
    const c = camAt(t).pos;
    steps.push({who, foot, t, dist: Math.hypot(c.x - p.x, c.y, c.z - p.z)});
  }));
};
add('her', HER_PLANTS);
add('guard', G_PLANTS);
steps.sort((a, b) => a.t - b.t);
const dirAt = (t: number) => {
  const g = guardAt(t);
  const j = joints4(BODY_G, g.pose);
  return norm3(sub3(cardToWorld(g.g, g.h, j.WL), cardToWorld(g.g, g.h, j.EL)));
};
const frames = [];
const n = Math.round(DUR * FPS);
for (let f = 0; f < n; f++) {
  const t = f / FPS;
  const a = dirAt(t), b = dirAt(t + 1 / FPS);
  frames.push({t, torch: Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) * FPS});
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, WORDS: tl.words, SHOTS, steps, frames}));
console.log('wrote', process.argv[2], steps.length, 'steps');
