// Exports the V3 picture's event frames for the sound design (audio/cues_v3.json): the climb's key frames, its
// pad moves and pull-ups, and the shot boundaries. usage: node export_cues_v3.cjs audio/cues_v3.json
import {writeFileSync} from 'fs';
import {C, EVENTS} from '../../source/src/v3/climb3';
import {SHOTS3} from '../../source/src/v3/shots3';
import {FRAMES} from '../../source/src/v3/set3';
import TL from '../../source/src/data/timeline.json';

const out = {fps: 30, frames: FRAMES, duration: FRAMES / 30, words: TL.words, climb: C, events: EVENTS, shots: SHOTS3.map((s) => ({name: s.name, from: s.from, to: s.to}))};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues', Object.keys(C).length, EVENTS.length, SHOTS3.length, FRAMES);
