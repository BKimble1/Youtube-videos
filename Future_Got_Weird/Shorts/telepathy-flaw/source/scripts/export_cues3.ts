// Exports the V3 sound cue sheet (audio/v3/cues.json). Every effect time is taken from the same beat table and
// choreography functions that drive the V2 picture (src/v3/choreo3.ts), so picture and sound cannot drift apart.
// Usage: npx tsx scripts/export_cues2.ts
import fs from 'node:fs';
import path from 'node:path';
import {T, WORDS} from '../src/lib/timeline';
import {DUR, FPS, TOTAL3, V2} from '../src/v3/choreo3';
import {GATE_U} from '../src/v3/art/Column';

export type Cue = {t: number; kind: string; gain?: number; pan?: number; dur?: number; note?: string; p?: Record<string, number>};
const cues: Cue[] = [];
const add = (c: Cue) => cues.push({...c, t: +c.t.toFixed(3)});

const PERIOD = 0.35; // the opening/loop pulse period; 28 / 0.35 = 80, so the seam texture closes exactly
// -- opening: clean UI ticks under the uneasy drone; the first thought reaches the implant
for (let n = 0; n < 3; n++) add({t: n * 2 * PERIOD, kind: 'ping', gain: -9 - n, pan: -0.1, note: 'chip tick (opening, periodic)'});
add({t: 0.05, kind: 'sweep', dur: 0.65, gain: -9, pan: -0.15, note: 'the shallow section opens'});
add({t: V2.decHook[0] + 0.1, kind: 'form', dur: V2.decHook[1] - V2.decHook[0] - 0.1, gain: -7, note: 'the thought resolves into a packet in the decoder'});
add({t: 0.7, kind: 'whoosh', dur: 0.6, gain: -10, pan: -0.1, p: {from: -0.1, to: -0.1, rise: 1}, note: 'push into the implant'});
add({t: V2.hookOut, kind: 'pop', gain: -8, pan: -0.05, note: 'the packet leaves the lens'});
add({t: V2.hookOut + 0.05, kind: 'whoosh', dur: V2.hookArrive - V2.hookOut - 0.05, gain: -6, pan: -0.1, p: {from: -0.1, to: 0.4, rise: 1}, note: 'packet across the room'});
add({t: V2.hookArrive, kind: 'chime', gain: -6, pan: 0.45, note: 'the friendly arrival chime (first use), in the gap before "by"'});
// -- vocal cords: the lens opens, the folds stay still, attention goes back up
add({t: V2.neckOpen[0] + 0.05, kind: 'open', dur: 0.5, gain: -9, pan: -0.1});
add({t: V2.neckClose[0], kind: 'close', dur: 0.45, gain: -10, pan: -0.1});
// -- reading, motor cortex, translating
add({t: 5.45, kind: 'sweep', dur: 0.5, gain: -10, pan: -0.1, note: 'the crown window opens'});
add({t: V2.dive[0], kind: 'whoosh', dur: V2.dive[1] - V2.dive[0], gain: -9, pan: 0, p: {from: -0.1, to: 0.1, rise: 1}, note: 'the dive into the tissue'});
[3, 5, 4, 2, 3, 5, 4, 3].forEach((k, i) => add({t: 5.95 + i * 0.16 + 0.6, kind: 'zip', gain: -12, pan: -0.15 + 0.03 * i, p: {lane: k}}));
add({t: V2.motorGlow[0], kind: 'tag', gain: -8, pan: 0.1, note: 'the motor-cortex strip lights'});
for (let i = 0; i < 6; i++) add({t: 7.1 + i * 0.2 + 0.55, kind: 'zip', gain: -12, pan: 0.0, p: {lane: [3, 4, 5][i % 3] + 2}});
add({t: 8.0, kind: 'whoosh', dur: 0.7, gain: -11, pan: 0, p: {from: 0, to: 0, rise: 1}, note: 'the pulse climbs the thread'});
add({t: V2.dec2[0] + 0.55, kind: 'form', dur: 0.8, gain: -7, note: 'the decoder resolves the shape'});
GATE_U.forEach((u) => add({t: V2.dec2[0] + (V2.dec2[1] - V2.dec2[0]) * u, kind: 'tick', gain: -12, pan: 0, note: 'decoder gate'}));
add({t: V2.dec2[0] + (V2.dec2[1] - V2.dec2[0]) * 0.72, kind: 'pop', gain: -9, pan: -0.05, note: 'the Hey packet forms'});
add({t: V2.normalOut, kind: 'whoosh', dur: 0.8, gain: -6, pan: 0.0, p: {from: -0.1, to: 0.45, rise: 1}, note: 'the second packet crosses the room'});
add({t: V2.recvArrive, kind: 'chime', gain: -8, pan: 0.45, note: 'the friendly arrival chime (second use)'});
// -- seamless: a soft link tick every 0.55 s
for (let n = 0; n < 3; n++) add({t: 11.7 + n * 0.55 + 0.4, kind: 'ping', gain: -16, pan: 0.1, note: 'live-link tick'});
// -- until: the bright bed is already gone; one crackle, a low swell
add({t: V2.redAt, kind: 'glitch', gain: -4, pan: -0.1, dur: 0.22, note: 'the anomaly'});
add({t: 13.3, kind: 'swell', dur: 1.3, gain: -9, note: 'low swell under the intrusion'});
add({t: V2.decRed[0], kind: 'zipred', gain: -10, pan: -0.1});
add({t: V2.silhouette[0], kind: 'thump', gain: -12, note: 'the dark bust'});
add({t: V2.decRed[1] - 0.35, kind: 'form', dur: 0.35, gain: -9, p: {low: 1}, note: 'the red packet forms'});
add({t: V2.redOut, kind: 'whoosh', dur: 0.5, gain: -9, pan: 0.0, p: {from: -0.1, to: 0.1, rise: 0, low: 1}, note: 'the red packet leaves, heavier'});
add({t: V2.insert[0], kind: 'whoosh', dur: V2.insert[1] - V2.insert[0], gain: -10, pan: 0.0, p: {from: -0.05, to: 0.2, rise: 0, low: 1}, note: 'the red packet advances along the route (insert)'});
add({t: V2.warn[0], kind: 'alarm', gain: -9, pan: 0, note: 'dry two-tone, UNFILTERED THOUGHT DETECTED'});
add({t: V2.warn[0] + 0.6, kind: 'tick', gain: -15});
// -- cancel
add({t: V2.reachFrom, kind: 'rustle', gain: -17, pan: -0.3, note: 'the arm comes up'});
add({t: V2.tapDenied, kind: 'tap', gain: -7, pan: -0.25});
add({t: V2.tapDenied + 0.22, kind: 'late', gain: -11, pan: -0.25, note: 'denied: a muted double tick'});
// -- the chip cannot tell: identical gate ticks for both packets
for (const [a, b] of [V2.pipeBlue, V2.pipeRed]) {
  add({t: a + 0.2, kind: 'form', dur: 0.5, gain: -10, note: 'same treatment'});
  GATE_U.forEach((u) => add({t: a + (b - a) * u, kind: 'tick', gain: -12, pan: 0}));
  add({t: b, kind: 'pop', gain: -10, pan: -0.05});
}
add({t: 23.4, kind: 'pass', dur: 1.2, gain: -12, pan: 0, p: {from: -0.1, to: 0.3}, note: 'the red packet drifts toward the receiver'});
add({t: V2.recvCut2, kind: 'whoosh', dur: 0.6, gain: -11, pan: 0.2, p: {from: -0.1, to: 0.3, rise: 0, low: 1}});
add({t: V2.redArrive - 0.65, kind: 'inhale', gain: -17, pan: 0.5, note: 'the receiver breathes in as it arrives'});
add({t: 25.97, kind: 'chimebad', gain: -4, pan: 0.45, note: 'the same friendly chime, uncomfortable: lower, dry, in the quiet'});
add({t: V2.recoil[0] + 0.05, kind: 'rustle', gain: -14, pan: 0.5, note: 'the receiver draws back'});
add({t: V2.lateTap, kind: 'late', gain: -10, pan: -0.25, note: 'too late'});
// -- the loop return: the pull-out resolves into the opening texture
add({t: V2.loopCut, kind: 'wipe', dur: DUR - V2.loopCut, gain: -7, pan: 0, note: 'the return into the opening'});
add({t: DUR - PERIOD, kind: 'ping', gain: -10, pan: -0.1, note: 'chip tick (return) - same texture as frame 0'});

cues.sort((a, b) => a.t - b.t);
const out = {fps: FPS, total_frames: TOTAL3, duration_s: DUR, beats: {...V2}, words: Object.fromEntries(Object.entries(T)), loop_period_s: PERIOD, cues};
const dir = path.resolve(__dirname, '..', '..', 'audio', 'v3');
fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 'cues.json'), JSON.stringify(out, null, 1));
console.log('wrote', cues.length, 'cues; last word ends', WORDS[WORDS.length - 1].end, 's; duration', DUR);
