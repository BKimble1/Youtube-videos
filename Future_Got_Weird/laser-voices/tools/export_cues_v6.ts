// V6 cues for the mix: timing constants, shot cuts, whisper windows, and the visitor's footfalls in F1..F4.
import fs from 'node:fs';
import {DUR, FPS, T_BLOCK, T_CLEAR, FRAMES} from '../source/src/v4/core4';
import {WHISPER, WHISPER_LAB, SHOT} from '../source/src/v6/cues6';
import {visitorWalker} from '../source/src/v6/stage6';
const steps: number[] = [];
for (const arr of [visitorWalker.plantsL, visitorWalker.plantsR]) for (const p of arr.slice(1)) if (p.t0 >= SHOT.f1 && p.t0 < SHOT.f5) steps.push(+p.t0.toFixed(4));
steps.sort((a, b) => a - b);
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, FRAMES, T_BLOCK, T_CLEAR, WHISPER, WHISPER_LAB, SHOT, steps}, null, 1));
console.log('visitor steps', steps.join(' '));
