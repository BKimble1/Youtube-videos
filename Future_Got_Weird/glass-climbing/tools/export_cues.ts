// Exports the picture's event frames for the sound design (audio/cues.json): the climb's key frames, the bench's,
// and the shot boundaries. usage: node export_cues.cjs audio/cues.json
import {writeFileSync} from 'fs';
import {C} from '../source/src/world/climb';
import {BK} from '../source/src/world/bench';
import {SHOTS} from '../source/src/shots';
import TL from '../source/src/data/timeline.json';

const out = {fps: 30, frames: TL.frames, duration: TL.duration, words: TL.words, climb: C, bench: BK, shots: SHOTS.map((s) => ({name: s.name, from: s.from, to: s.to}))};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues', Object.keys(C).length, Object.keys(BK).length, SHOTS.length);
