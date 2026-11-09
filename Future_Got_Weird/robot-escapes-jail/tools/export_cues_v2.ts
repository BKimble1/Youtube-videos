// V2: export every V2 shot's sound cues (film seconds, synced to the picture) + the V2 shot table + word times into
// audio/cues_v2.json, which tools/make_audio.py mixes from. Run: tools/export_cues_v2.sh
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {T} from '../source/src/story';
import {SHOTS2} from '../source/src/v2/story2';
import {CUES_H1, CUES_J1} from '../source/src/v2/shots/HookLoop';
import {CUES_LB} from '../source/src/v2/shots/LabEscape';
import {CUES_MS} from '../source/src/v2/shots/MoldScience';
import {CUES_FU} from '../source/src/v2/shots/Future';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
const per: Record<string, () => Cue[]> = {H1: CUES_H1, LB: CUES_LB, MS: CUES_MS, FU: CUES_FU, J1: CUES_J1};
const cues: (Cue & {shot: string})[] = [];
for (const [shot, f] of Object.entries(per)) for (const c of f()) cues.push({...c, t: Math.round(c.t * 1000) / 1000, shot});
cues.sort((a, b) => a.t - b.t);
const bad = cues.filter((c) => !(c.t >= 0 && c.t < DUR));
if (bad.length) console.warn('cues outside [0, DUR):', bad);
const music = {hook: 0, drop: 3.4, groove: 4.0, breath: 17.1, science: 17.9, pickup: 27.9, ret: 28.4};
const PLANNED_MOVES: [number, number, string][] = [];
fs.writeFileSync(process.argv[2], JSON.stringify({duration: DUR, SHOTS: SHOTS2, T, PLANNED_MOVES, music, cues}, null, 1));
console.log(`${cues.length} cues ->`, process.argv[2]);
