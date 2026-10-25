// Exports the V2 picture's event frames for the sound design (audio/cues_v2.json): the climb's key frames and the
// shot boundaries. usage: node export_cues_v2.cjs audio/cues_v2.json
import {writeFileSync} from 'fs';
import {C} from '../../source/src/v2/climb2';
import {SHOTS2} from '../../source/src/v2/shots2';
import {FRAMES} from '../../source/src/v2/set';
import TL from '../../source/src/data/timeline.json';

const out = {fps: 30, frames: FRAMES, duration: FRAMES / 30, words: TL.words, climb: C, shots: SHOTS2.map((s) => ({name: s.name, from: s.from, to: s.to}))};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues', Object.keys(C).length, SHOTS2.length, FRAMES);
