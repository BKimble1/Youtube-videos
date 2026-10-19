// Exports the sound cue sheet (audio/cues.json): every effect is keyed to the same beat table and choreography that
// drive the picture (src/lib/timeline.ts, src/lib/choreo.ts), so picture and sound cannot drift apart.
// Usage: npx tsx scripts/export_cues.ts   (writes ../audio/cues.json and prints a summary)
import fs from 'node:fs';
import path from 'node:path';
import {B, FPS, T, TOTAL, WORDS} from '../src/lib/timeline';
import {QUEUED, RED_FORMS, STREAMS, redU, hookU, normalU, camAt} from '../src/lib/choreo';

export type Cue = {t: number; kind: string; gain?: number; pan?: number; dur?: number; note?: string; p?: Record<string, number>};
const cues: Cue[] = [];
const add = (c: Cue) => cues.push({...c, t: +c.t.toFixed(3)});

const LOOP = 0.75;
// -- loop-closing texture: chip pings in the opening (t = 0, 0.75, 1.5) and in the loop layer (28.5, 29.25)
for (let k = 0; k < 3; k++) add({t: k * LOOP, kind: 'ping', gain: -7 - 2 * k, pan: -0.1, note: 'chip ping (opening)'});
for (const t of [28.5, 29.25]) add({t, kind: 'ping', gain: -9, pan: -0.1, note: 'chip ping (loop layer, same texture as frame 0)'});

// -- 0.6-1.9 s: the skull turns transparent, an iris round the chip
add({t: B.cutawayFrom, kind: 'sweep', dur: B.cutawayTo - B.cutawayFrom, gain: -7, pan: -0.15});
// -- the thought: cortex -> chip streams (a tiny blip as each signal reaches the chip), then the packet and its flight
STREAMS.forEach((s, si) => {
  const n = Math.floor((s.t1 - s.t0) / s.dt);
  for (let i = 0; i <= n; i++) {
    const arrive = s.t0 + i * s.dt + s.life;
    add({t: arrive, kind: s.red ? 'zipred' : 'zip', gain: (s.red ? -11 : -12) + (si === 1 ? -2 : 0), pan: -0.15 + 0.02 * (i % 5), p: {lane: (i * 4 + 1) % 9}});
  }
});
add({t: B.sendHook - 0.3, kind: 'form', dur: 0.3, gain: -6, note: 'the hook packet forms at the chip'});
add({t: B.sendHook, kind: 'whoosh', dur: B.arriveHook - B.sendHook, gain: -6, pan: 0.1, p: {from: -0.1, to: 0.35, rise: 1}, note: 'packet along the route to the receiver'});
add({t: B.arriveHook, kind: 'chime', gain: -2, pan: 0.45, note: 'the friendly arrival chime (first use)'});
// -- vocal cords: the window opens, the folds stay still, the attention goes back up
add({t: B.neckFrom + 0.05, kind: 'open', dur: 0.5, gain: -8, pan: -0.1});
add({t: B.neckTo - 0.05, kind: 'close', dur: 0.45, gain: -9, pan: -0.1});
// -- the motor cortex
add({t: B.motor, kind: 'tag', gain: -8, pan: 0.1});
add({t: B.packetForms, kind: 'form', dur: 0.45, gain: -7, note: 'pulses converge into a packet'});
add({t: B.heyForms, kind: 'pop', gain: -8, pan: -0.05, note: 'the Hey bubble resolves'});
add({t: B.sendNormal, kind: 'whoosh', dur: B.arriveNormal - B.sendNormal, gain: -6, pan: 0.1, p: {from: -0.1, to: 0.35, rise: 1}});
add({t: B.arriveNormal, kind: 'chime', gain: -3, pan: 0.45, note: 'the friendly arrival chime (second use)'});
// -- seamless -> until: the bright bed goes, one crackle, a low drone
add({t: B.redPulse, kind: 'glitch', gain: -4, pan: -0.1, dur: 0.22});
add({t: B.silhouetteIn, kind: 'swell', dur: 1.2, gain: -9, note: 'low swell under the silhouette'});
add({t: B.silhouetteIn + 0.1, kind: 'thump', gain: -12});
add({t: B.warnIn, kind: 'alarm', gain: -9, pan: 0, note: 'dry two-tone, UNFILTERED THOUGHT DETECTED'});
add({t: B.warnIn + 0.55, kind: 'tick', gain: -14});
add({t: RED_FORMS, kind: 'form', dur: 0.35, gain: -9, p: {low: 1}});
for (let i = 0; i < 5; i++) add({t: B.fragments + i * 0.3, kind: 'static', dur: 0.4, gain: -16, pan: -0.4 + i * 0.05});
add({t: B.redLeaves, kind: 'whoosh', dur: 1.6, gain: -9, pan: 0.0, p: {from: -0.1, to: 0.15, rise: 0, low: 1}, note: 'the red packet leaves, heavier'});
// -- cancel: the tap, the slow ring, the second tap that comes too late
add({t: B.cancelTap, kind: 'tap', gain: -7, pan: -0.25});
add({t: B.cancelTap + 0.1, kind: 'ring', dur: B.lateCancel + 0.1 - (B.cancelTap + 0.1), gain: -18, pan: -0.25, note: 'ring progress, rising'});
add({t: B.lateCancel + 0.1, kind: 'late', gain: -10, pan: -0.25, note: 'too late: a muted double tick'});
// -- the red packet overtakes (a low Doppler pass), the receiver, the delivery
add({t: B.overtake, kind: 'pass', dur: 1.0, gain: -11, pan: 0.0, p: {from: -0.1, to: 0.3}});
add({t: B.redArrives - 1.0, kind: 'inhale', gain: -17, pan: 0.5, note: 'the receiver breathes in as the message arrives'});
add({t: B.delivered, kind: 'chimebad', gain: -3, pan: 0.45, note: 'the same friendly chime, uncomfortable: lower, dry, in the quiet'});
add({t: B.drawBack, kind: 'rustle', gain: -16, pan: 0.5});
add({t: B.wipeFrom, kind: 'wipe', dur: B.wipeTo - B.wipeFrom, gain: -5, pan: 0});

cues.sort((a, b) => a.t - b.t);
const out = {
  fps: FPS,
  total_frames: TOTAL,
  beats: {...B},
  words: Object.fromEntries(Object.entries(T)),
  loop_period_s: LOOP,
  cues,
};
const dir = path.resolve(__dirname, '..', '..', 'audio');
fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 'cues.json'), JSON.stringify(out, null, 1));
console.log('wrote', cues.length, 'cues; last word ends', WORDS[WORDS.length - 1].end, 's');
void [redU, hookU, normalU, camAt, QUEUED];
