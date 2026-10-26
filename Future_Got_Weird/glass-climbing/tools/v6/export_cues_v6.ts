// Exports the V6 picture's event frames for the sound design (audio/cues_v6.json): the climb's key frames, its
// cycles (shift, far-pad move, rise, near-pad move, settle) and the shot boundaries.
// usage: node export_cues_v6.cjs audio/cues_v6.json
import {writeFileSync} from 'fs';
import {C, CYCLES, FRAMES} from '../../source/src/v6/climb6';
import {SHOTS6} from '../../source/src/v6/shots6';
import TL from '../../source/src/data/timeline_v6.json';

const out = {fps: 30, frames: FRAMES, duration: FRAMES / 30, words: TL.words, climb: C, cycles: CYCLES, shots: SHOTS6.map((s) => ({name: s.name, from: s.from, to: s.to}))};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues', Object.keys(C).length, CYCLES.length, SHOTS6.length, FRAMES);
