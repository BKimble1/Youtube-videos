// Exports the V7 picture's event frames for the sound design (audio/cues_v7.json): the climb's key frames, its
// cycles (shift, far-pad move, rise, near-pad move, settle) and the shot boundaries.
// usage: node export_cues_v7.cjs audio/cues_v7.json
import {writeFileSync} from 'fs';
import {C, CYCLES, FRAMES} from '../../source/src/v7/climb7';
import {SHOTS7} from '../../source/src/v7/shots7';
import TL from '../../source/src/data/timeline_v6.json';

const out = {fps: 30, frames: FRAMES, duration: FRAMES / 30, words: TL.words, climb: C, cycles: CYCLES, shots: SHOTS7.map((s) => ({name: s.name, from: s.from, to: s.to}))};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues', Object.keys(C).length, CYCLES.length, SHOTS7.length, FRAMES);
