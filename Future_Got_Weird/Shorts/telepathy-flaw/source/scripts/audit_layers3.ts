// V3 layer audit: for every frame, which graphic groups are visible, against the single story-state timeline
// (phaseAt in src/v3/choreo3.ts). Fails (exit 1) if a group is visible outside the windows where it belongs - the check
// that would have caught V2's cancel control showing during the successful "Hey" - or if two packets are on screen at
// once. Writes ../qa/v3/LAYER_AUDIT.json. Usage: npx tsx scripts/audit_layers3.ts
import fs from 'node:fs';
import path from 'node:path';
import {
  aperture, arCard, cancelGroup, FPS, hookAlpha, heyQueued, neckOpenAt, normalAlpha, phaseAt, redAlpha, silhouetteFlash, TOTAL3, undoChip, warnCard,
} from '../src/v3/choreo3';

type G = {name: string; vis: (t: number) => number; allowed: [number, number][]};
const groups: G[] = [
  {name: 'cancel group (button, ring, track, gate bar, packet copy)', vis: (t) => undoChip(t).alpha, allowed: [[19.75, 21.75], [26.95, 27.45]]},
  {name: 'warning card', vis: (t) => warnCard(t).alpha, allowed: [[15.4, 16.65]]},
  {name: 'hook packet (blue)', vis: hookAlpha, allowed: [[1.4, 2.45]]},
  {name: 'second blue packet', vis: normalAlpha, allowed: [[9.95, 10.9]]},
  {name: 'red packet', vis: redAlpha, allowed: [[14.9, 26.0]]},
  {name: 'waiting Hey', vis: heyQueued, allowed: [[22.9, 24.6]]},
  {name: 'AR card', vis: (t) => arCard(t).alpha, allowed: [[2.05, 3.2], [25.35, 27.5]]},
  {name: 'throat lens', vis: neckOpenAt, allowed: [[3.5, 5.45]]},
  {name: 'dark bust', vis: silhouetteFlash, allowed: [[14.45, 14.8]]},
];
const failures: string[] = [];
const spans: Record<string, [number, number][]> = {};
let maxPackets = 0;
let maxRed = 0;
for (let f = 0; f < TOTAL3; f++) {
  const t = f / FPS;
  for (const g of groups) {
    const v = g.vis(t);
    if (v > 0.02) {
      const last = (spans[g.name] ??= []).slice(-1)[0];
      if (last && f - last[1] <= 1) last[1] = f;
      else spans[g.name].push([f, f]);
      if (!g.allowed.some(([a, b]) => t >= a && t <= b)) failures.push(`${g.name} visible at ${t.toFixed(2)} s (frame ${f}), outside ${JSON.stringify(g.allowed)}`);
    }
  }
  const n = [hookAlpha(t), normalAlpha(t), redAlpha(t)].filter((a) => a > 0.3).length;
  maxPackets = Math.max(maxPackets, n);
  maxRed = Math.max(maxRed, redAlpha(t) > 0.3 ? 1 : 0);
  // the cancel group may only exist in the cancel phase or the late attempt of the delivered phase
  if (cancelGroup(t) > 0.02 && !(phaseAt(t) === 'cancel' || phaseAt(t) === 'delivered')) failures.push(`cancel group in phase ${phaseAt(t)} at frame ${f}`);
  if (f === 0 || f === TOTAL3 - 1) {
    if (cancelGroup(t) > 0 || redAlpha(t) > 0 || warnCard(t).alpha > 0 || arCard(t).alpha > 0) failures.push(`stale layer at seam frame ${f}`);
  }
}
// window apertures (the crown window) as spans
const win: [number, number][] = [];
for (let f = 0; f < TOTAL3; f++) {
  if (aperture(f / FPS) > 0.02) {
    const last = win.slice(-1)[0];
    if (last && f - last[1] <= 1) last[1] = f;
    else win.push([f, f]);
  }
}
if (maxPackets > 1) failures.push(`${maxPackets} packets on screen at once`);
const out = {
  frames: TOTAL3,
  phases: [0, 13.95, 14.97, 19.8, 21.84, 25.95].map((t) => ({from_s: t, phase: phaseAt(t + 0.01)})),
  visible_frame_spans: Object.fromEntries(Object.entries(spans).map(([k, v]) => [k, v.map(([a, b]) => `${a}-${b} (${(a / FPS).toFixed(2)}-${(b / FPS).toFixed(2)} s)`)])),
  crown_window_open_spans: win.map(([a, b]) => `${a}-${b} (${(a / FPS).toFixed(2)}-${(b / FPS).toFixed(2)} s)`),
  max_packets_on_screen: maxPackets,
  failures,
  pass: failures.length === 0,
};
const dir = path.resolve(__dirname, '..', '..', 'qa', 'v3');
fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 'LAYER_AUDIT.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
if (failures.length) process.exit(1);
