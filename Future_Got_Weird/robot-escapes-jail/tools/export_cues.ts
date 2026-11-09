// Export every shot's sound cues (CUES_S1..S8, film seconds, synced to the picture events) plus the shot table and the
// word times into audio/cues.json, which tools/make_audio.py mixes from, so sound and picture share one timeline.
// Run: tools/export_cues.sh  (bundles this file with esbuild, then runs it with node)
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {SHOTS, T} from '../source/src/story';
import {CUES_S1} from '../source/src/shots/S1Hook';
import {CUES_S2, CUES_S3, CUES_S4} from '../source/src/shots/S2to4';
import {CUES_S5} from '../source/src/shots/S5Lab';
import {CUES_S6} from '../source/src/shots/S6Science';
import {CUES_S7} from '../source/src/shots/S7Medical';
import {CUES_S8} from '../source/src/shots/S8Loop';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
const per: Record<string, () => Cue[]> = {S1: CUES_S1, S2: CUES_S2, S3: CUES_S3, S4: CUES_S4, S5: CUES_S5, S6: CUES_S6, S7: CUES_S7, S8: CUES_S8};
const cues: (Cue & {shot: string})[] = [];
for (const [shot, f] of Object.entries(per)) for (const c of f()) cues.push({...c, t: Math.round(c.t * 1000) / 1000, shot});
cues.sort((a, b) => a.t - b.t);
const bad = cues.filter((c) => !(c.t >= 0 && c.t < DUR));
if (bad.length) console.warn('cues outside [0, DUR):', bad);
// planned picture moves (qa_render.py skips these when it hunts for unplanned hard cuts)
const PLANNED_MOVES: [number, number, string][] = [];
fs.writeFileSync(process.argv[2], JSON.stringify({duration: DUR, SHOTS, T, PLANNED_MOVES, cues}, null, 1));
console.log(`${cues.length} cues ->`, process.argv[2]);
