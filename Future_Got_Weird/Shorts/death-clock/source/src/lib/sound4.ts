// V4 sound cues: a copy of lib/sound3.ts with the V4 edits. scripts/export_cues4.ts writes them to audio/v4/cues.json;
// tools/build_audio_v4.py renders ONLY the effects bus from them (option R: the V3 narration and music stems are
// reused byte for byte, and the new effects bus is placed under V3's own gain envelope).
//
// Where the picture exports a key or a function, the cue reads it; where it does not, the cue falls back to the
// V3 frame (or to the V4 design frame where V3 has no equivalent). Every lookup is recorded in `sources`, so the
// final cue pass can see which cues still run on fallbacks:
//   - lib/beats4.ts B4 (static import; optional keys read by name, see k4 below)
//   - lib/device3.ts alarm helper (alarmOnsets / alarmAt) when present, else the onsets computed from B4 (cross-checked)
//   - lib/heart4.ts (static import): every lub and every irregular twitch the drawn heart makes, and its quiver
//     amplitude (fibAmp); lib/reveal4.ts revealAt(f).chestOpen weights the journey's fibrillation by how open the window is
//   - shots/Journey3.tsx SENSOR_BEATS (+ the light touch measured with art/Interior portPress, the bead exits of its
//     sensor release), shots/Aftermath3.tsx treatState (the treatment contact), shots/Dispatch.tsx rotorPhase /
//     droneView / WIPE / MAP_END: passed in as PictureHooks by scripts/export_cues4.ts (dynamic imports, so a missing or
//     half-edited picture file never breaks the cue export; it only falls back).
// FINAL CUE PASS (merged picture): the sensor shot, the treatment chain and the heartbeat read the picture's keys and
// functions; the drone's off-frame hand-off (droneView null from 920) eases instead of stepping; the 'held' chime is
// dropped (the steady-red TIMER HELD screen is first on screen only in the medium shot, under "His heartbeat steadies").
// FIX ROUND 1: tilt2 spans the roll as Aftermath3 treatState moves it (hook treat.roll, 930-941); the rotor's start
// phases are seeded (p.seed) so its beating troughs miss the 864 cut and the 897 wipe cover; the head alarm beat is 2 dB
// lower under "This"; the sensor ticks duck -3 dB on their own; buzz_h6 and hosp_receive are inverted (p.polarity) so
// the effects stem needs no large de-peak pulse at 12.9 / 751.2.
// V4 edits (tools/build_audio_v4.py implements the new kinds / params):
//   - loop: one periodic alarm (alarm1, no low thump, short ring-out) on the picture's ring emissions in loop time
//     (B4.alarmPeriod / alarmPhase0: frames 1344 and 6); the band's buzz rides the same onsets; warn0 and buzz_open
//     at frame 0 are gone; the heartbeat is level-matched across the join; one cyclic garden ambience wraps through it.
//   - dispatch: latch pin + click + servo; ONE curve-driven rotor cue (rate/dist/pan per frame) instead of four
//     segments that dipped 20-35 dB at every join.
//   - treatment: shutter, actuator, soft contact (press), one restrained pulse (tpulse), short flow + pass, retract,
//     port close; per-cue ducking (p.duck) under the ongoing words. The sensor-entry servo / inject / wave are not reused.
//   - musicPlan is FROZEN to the V3 constants (the music stem is reused byte for byte).
import * as D3 from './device3';
import {B4} from './beats4';
import {countdown3} from './device3';
import {fibAmp, HEART4, heartBeats} from './heart4';
import {revealAt} from './reveal4';
import {B, FPS, TOTAL} from './timeline3';

export type CueParam = number | string | number[];
export type Cue = {id: string; kind: string; f: number; gain: number; dur?: number; p?: Record<string, CueParam>};

/** The sensor shot's mechanism beats (shots/Journey3.tsx SENSOR_BEATS). */
export type SensorBeats = {roll0: number; roll1: number; reveal0: number; reveal1: number; cut: number; shut0: number; shut1: number; nose0: number; touch: number; retract0: number; close0: number; close1: number};

/** What the picture can hand to the sound (all optional; see scripts/export_cues4.ts). */
export type PictureHooks = {
  /** rotor angle in radians at frame f (one rotorPhase for every shot); its per-frame increment drives the rotor pitch */
  rotorPhase?: (f: number) => number;
  /** the drone as seen on screen at frame f: x in px (0..1080) and apparent scale (drone s x camera z), or null off frame */
  droneView?: (f: number) => {x: number; scale: number} | null;
  /** frame the map pulse lands in the dock beacon, and the map's end frame (shots/Dispatch.tsx) */
  mapEnd?: number;
  /** the trunk wipe (shots/Dispatch.tsx WIPE) */
  wipe?: {in0: number; cover: number; out1: number};
  /** the sensor shot: its beats, the frame the nose's light touch first dents the skin (fractional), and the frames
   *  each sensor bead (and the hero) leaves the nose tip */
  sensor?: {beats: SensorBeats; contact?: number; beadExits?: number[]; heroExit?: number};
  /** the treatment: the frame the nose's press first dents the skin (fractional; Aftermath3 treatState dimple), and the
   *  frames over which the case's roll to the underside moves on screen (Aftermath3 treatState roll; [first, last]) */
  treat?: {contact?: number; roll?: [number, number]};
  /** where each hook came from (for the log) */
  origin?: Record<string, string>;
};

// ---------------------------------------------------------------- picture keys with fallbacks
export const SOURCES: Record<string, string> = {};
const B4R = B4 as unknown as Record<string, unknown>;
/** first of the named B4 keys that exists, else the fallback (V3 frame, or the V4 design frame) */
const k4 = (names: string | string[], fallback: number, why = 'V3'): number => {
  for (const n of typeof names === 'string' ? [names] : names) {
    const v = B4R[n];
    if (typeof v === 'number' && Number.isFinite(v)) {
      SOURCES[n] = `B4.${n}`;
      return v;
    }
  }
  const n = typeof names === 'string' ? names : names[0];
  SOURCES[n] = `fallback ${why} ${+fallback.toFixed(3)}`;
  return fallback;
};

// ---------------------------------------------------------------- the loop alarm (shared with the picture ring)
/** loop time: the tail from the red callback on counts as negative time before the next play's frame 0 */
export const loopTime = (f: number) => (f >= B4.alarmOn0 ? f - TOTAL : f);

/** Alarm emission frames from B4 (gl = alarmPhase0 mod alarmPeriod, from the callback through alarmOff1). */
export const alarmOnsets4 = (): {tail: number[]; head: number[]} => {
  const P = B4.alarmPeriod;
  const tail: number[] = [];
  const head: number[] = [];
  for (let f = B4.alarmOn0; f < TOTAL; f++) if ((((loopTime(f) - B4.alarmPhase0) % P) + P) % P === 0) tail.push(f);
  for (let f = 0; f < B4.alarmOff1; f++) if ((((f - B4.alarmPhase0) % P) + P) % P === 0) head.push(f);
  return {tail, head};
};

/** Cross-check against the picture's alarm helper in lib/device3.ts, if it exists (any of a few names). */
const alarmFromDevice = (): {tail: number[]; head: number[]} | null => {
  const d = D3 as unknown as Record<string, unknown>;
  const list = d.alarmOnsets ?? d.alarmEmissions ?? d.ALARM_ONSETS;
  const arr = typeof list === 'function' ? (list as () => unknown)() : list;
  if (Array.isArray(arr) && arr.every((v) => typeof v === 'number')) {
    const a = (arr as number[]).map((v) => ((v % TOTAL) + TOTAL) % TOTAL);
    return {tail: a.filter((v) => v >= B4.alarmOn0).sort((x, y) => x - y), head: a.filter((v) => v < B4.alarmOff1).sort((x, y) => x - y)};
  }
  const at = d.alarmAt;
  if (typeof at === 'function') {
    // an emission is a frame whose ring age / phase restarts (age 0, or phase decreasing)
    const probe = (f: number): number | null => {
      const r = (at as (f: number) => unknown)(f);
      if (typeof r === 'number') return r;
      if (r && typeof r === 'object') {
        const o = r as Record<string, unknown>;
        for (const key of ['age', 'phase', 'ph', 't']) if (typeof o[key] === 'number') return o[key] as number;
      }
      return null;
    };
    const frames = [...Array.from({length: TOTAL - B4.alarmOn0}, (_, i) => B4.alarmOn0 + i), ...Array.from({length: B4.alarmOff1}, (_, i) => i)];
    const out: number[] = [];
    let prev = probe(frames[0] - 1);
    for (const f of frames) {
      const v = probe(f);
      if (v === null) return null;
      if (prev !== null && v < prev - 1e-9) out.push(f);
      prev = v;
    }
    return {tail: out.filter((v) => v >= B4.alarmOn0), head: out.filter((v) => v < B4.alarmOff1)};
  }
  return null;
};

// ---------------------------------------------------------------- heartbeats
const beats = (from: number, to: number, bpm: number, gain: number, id: string, tone = 1, jitter = 0): Cue[] => {
  const out: Cue[] = [];
  const step = (60 / bpm) * FPS;
  let k = 0;
  for (let f = from; f < to; f += step * (1 + (jitter ? Math.sin(k * 2.7) * jitter : 0)), k++) out.push({id: `${id}${k}`, kind: 'heartbeat', f: Math.round(f), gain, p: {tone}});
  return out;
};
const db20 = (a: number) => 20 * Math.log10(Math.max(1e-6, a));
const r3 = (v: number) => Math.round(v * 1e3) / 1e3;

/** The heartbeat the drawn heart makes (lib/heart4.ts heartBeats / fibAmp; one list for picture and sound).
 *  - lubs: one heartbeat cue per drawn lub (the generator's dub lands 0.17 s on = HEART4.dub 5 frames), level from the
 *    beat's amplitude (the first organised beat after the treatment is weak, 0.6);
 *  - the irregular rhythm: one low thump per drawn one-sided twitch, over a faint quiver bed that follows fibAmp; in
 *    the journey both are weighted by how open the chest window is (revealAt(f).chestOpen: nothing once it has closed,
 *    so the thumps stop where the picture stops showing the heart). */
export const heartPlan4 = () => {
  const hb = heartBeats();
  const J = HEART4.journey;
  const T = HEART4.treat;
  const lub = hb.filter((b) => b.kind === 'lub');
  const tw = hb.filter((b) => b.kind === 'twitch');
  const chest = (f: number) => revealAt(f).chestOpen;
  // journey irregular span: from the onset to the frame the window has closed
  const jEnd = Math.max(J.fib0 + 1, B4.chestClose1);
  const jTw = tw.filter((b) => b.f >= J.fib0 && b.f < jEnd).map((b) => ({f: b.f, amp: r3(b.amp * chest(b.f))})).filter((b) => b.amp >= 0.15);
  const jBed = Array.from({length: jEnd + 2 - J.fib0}, (_, i) => r3(fibAmp(J.fib0 + i) * chest(J.fib0 + i)));
  // treatment quiver: the cut into the chest view (quiver0) to the end of the near-still reset (still1 + 1)
  const qEnd = T.still1 + 2;
  const tTw = tw.filter((b) => b.f >= T.quiver0 - 1 && b.f < qEnd).map((b) => ({f: b.f, amp: r3(b.amp)}));
  const tBed = Array.from({length: qEnd - T.quiver0}, (_, i) => r3(fibAmp(T.quiver0 + i)));
  return {
    journeyLubs: lub.filter((b) => b.f < J.fib0).map((b) => ({f: b.f, amp: b.amp})),
    journeyFib: {f0: J.fib0, end: jEnd, twitches: jTw, bed: jBed},
    treatFib: {f0: T.quiver0, end: qEnd, twitches: tTw, bed: tBed},
    settledLubs: lub.filter((b) => b.f >= T.quiver0).map((b) => ({f: b.f, amp: b.amp})),
    period: HEART4.period,
  };
};

// ---------------------------------------------------------------- the rotor path (one continuous curve cue)
/** keyframes [frame, value] -> value at f, smooth (cosine) between keys, held outside (keys sorted by frame, so
 * picture keys that move past each other never break the curve) */
const keyed = (keys0: [number, number][], f: number) => {
  const keys = [...keys0].sort((a, b) => a[0] - b[0]);
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (f <= b) {
      const u = b > a ? (f - a) / (b - a) : 1;
      return va + (vb - va) * (0.5 - 0.5 * Math.cos(Math.PI * u));
    }
  }
  return keys[keys.length - 1][1];
};

/** Fallback rotor phase when Dispatch.tsx exports none: the V4 spin-up keys (B4.spin0 -> spin1, cubic ease-in, still
 * before spin0) if they exist, else V3's picture rotorPhase (idle 0.05 rad/frame + cubic ease-in over 22 f from B.latch). */
const rotorPhaseFallback = (): {fn: (f: number) => number; how: string} => {
  const s0 = B4R.spin0;
  const s1 = B4R.spin1;
  if (typeof s0 === 'number' && typeof s1 === 'number' && s1 > s0) {
    return {
      fn: (f: number) => {
        let ph = 0;
        for (let t = s0; t < f; t++) ph += 1.65 * Math.min(1, Math.max(0, (t - s0) / (s1 - s0))) ** 3;
        return ph;
      },
      how: `fallback B4.spin0 ${s0} -> spin1 ${s1} (cubic ease-in)`,
    };
  }
  return {
    fn: (f: number) => {
      let ph = 0;
      for (let t = B.latch; t < f; t++) ph += 0.05 + 1.6 * Math.min(1, Math.max(0, (t - B.latch) / 22)) ** 3;
      return ph;
    },
    how: 'fallback V3 rotorPhase (cubic ease-in 22 f from B.latch)',
  };
};

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
const sm = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
/** frames the rotor's perspective takes to ease between the framed drone and the off-frame model */
const VIEW_EASE = 12;

const rotorPath = (h: PictureHooks, latch: number): Cue => {
  const f0 = latch + 1;
  // the drone flies on through the 864 cut, climbs over the roofs, passes the trunk wipe, brakes (flare) into the
  // hover beside his head, hovers (off frame) through the treatment, then climbs away (B4.retreat0-1)
  const climb1 = k4(['climb1'], B.past0 - 1);
  const arrive0 = k4(['arrive0'], B.past0 + 6);
  const flare0 = k4(['flare0'], B.past0 + 13, 'V4 design');
  const hover = k4(['hover0', 'hover2'], B.act0 + 4);
  const away0 = k4(['retreat0', 'droneAway0'], B.rise0);
  const away1 = k4(['retreat1', 'droneAway1'], B.green + 30);
  const lift1 = k4(['lift1'], B.bank0 + 2);
  const f1 = Math.round(away1 + 10);
  const fb = rotorPhaseFallback();
  const phase = h.rotorPhase ?? fb.fn;
  SOURCES.rotor_rate = h.rotorPhase ? h.origin?.rotorPhase ?? 'hook' : fb.how;
  const full = Math.max(1e-6, phase(B.travel0 + 1) - phase(B.travel0));
  const frames = Array.from({length: f1 + 1 - f0}, (_, i) => f0 + i);
  // the drone as the picture frames it: apparent size -> distance, screen x -> pan
  const views = frames.map((f) => {
    const v = h.droneView?.(f);
    return v ? {dist: Math.max(0.6, 1.025 / Math.max(0.05, v.scale)), pan: Math.max(-0.8, Math.min(0.8, (0.6 * (v.x - 540)) / 540))} : null;
  });
  const visIdx = views.flatMap((v, i) => (v ? [i] : []));
  const lastVis = visIdx.length ? frames[visIdx[visIdx.length - 1]] : hover;
  // off-frame model (and the whole perspective when there is no droneView): continuous through the 864 cut and the
  // wipe; after the drone leaves the frame (the push in to the band, 920) it hovers beside his head, then climbs away
  const distK: [number, number][] = [[f0, 1.0], [B.bank0, 1.0], [B.travel0, 1.12], [climb1, 1.3], [Math.max(arrive0 + 7, climb1 + 1), 1.6], [Math.max(flare0, arrive0 + 8), 1.3], [hover, 1.15], [away0, 1.15], [away1, 4.0], [f1, 5.0]];
  const panK: [number, number][] = [[f0, -0.05], [B.travel0, -0.12], [climb1, -0.05], [arrive0 + 7, -0.3], [hover, 0.05], [away0, 0.05], [away1, -0.25]];
  // a small level rise in the braking flare; the settled hover sits 8 dB under the arrival (V3's hover bed was 9 dB
  // under) -- that drop now starts only when the drone has left the frame, so it rides the off-frame hand-off
  const lvlK: [number, number][] = [[f0, 0], [flare0, 0], [flare0 + 5, 1.5], [hover, 0], [Math.max(hover, lastVis), 0], [Math.max(hover, lastVis) + 20, -8], [away0, -8], [f1, -12]];
  // blade load: a touch more effort while it lifts clear of the dock and in the braking flare
  const loadK: [number, number][] = [[f0, 1], [B.lift0, 1], [B.lift0 + 8, 1.04], [lift1, 1], [flare0, 1], [flare0 + 5, 1.06], [hover + 4, 1]];
  SOURCES.rotor_view = h.droneView
    ? `${h.origin?.droneView ?? 'hook'} (framed ${visIdx.length ? `${frames[visIdx[0]]}-${lastVis}` : 'never'}; off frame from ${lastVis + 1}: eased over ${VIEW_EASE} f into the off-frame hover model, no step)`
    : 'fallback keyframes (V3 framing, continuous at 864 and the wipe)';
  // where droneView is null, ease from the nearest framed value into the off-frame model over VIEW_EASE frames
  // (between two framed runs: their cosine blend, pulled toward the model by the distance to the nearer one)
  const persp = (i: number, key: 'dist' | 'pan', model: number): number => {
    const v = views[i];
    if (v) return v[key];
    let p = i - 1;
    while (p >= 0 && !views[p]) p--;
    let n = i + 1;
    while (n < views.length && !views[n]) n++;
    const hp = p >= 0;
    const hn = n < views.length;
    if (!hp && !hn) return model;
    if (hp && hn) {
      const u = (i - p) / (n - p);
      const blend = views[p]![key] + (views[n]![key] - views[p]![key]) * (0.5 - 0.5 * Math.cos(Math.PI * u));
      return blend + (model - blend) * sm(Math.min(i - p, n - i) / VIEW_EASE);
    }
    const a = hp ? views[p]![key] : views[n]![key];
    return a + (model - a) * sm((hp ? i - p : n - i) / VIEW_EASE);
  };
  const rate: number[] = [];
  const dist: number[] = [];
  const pan: number[] = [];
  const lvl: number[] = [];
  frames.forEach((f, i) => {
    rate.push(r4(Math.min(1, Math.max(0, (phase(f + 1) - phase(f)) / full)) * keyed(loadK, f)));
    dist.push(r4(persp(i, 'dist', keyed(distK, f))));
    pan.push(r4(persp(i, 'pan', keyed(panK, f))));
    lvl.push(r4(keyed(lvlK, f)));
  });
  // doppler from the apparent-size distance, smoothed over 0.25 s (the distance is per frame; much of its change is the
  // camera's push, so the shift is kept small: 8 m/s per distance unit per second)
  // FIX ROUND 1: p.seed sets the four blade voices' start phases. They beat by up to ~7 dB per frame at ~3 Hz; with the
  // default phases a trough fell on the 864 cut (-3.8 dB under the local mean) and the 897 wipe cover (-2.9). Seed 16
  // (searched over 1-40, rotor cue alone) puts a crest on both (+1.5, +1.0), none at the 919 hand-off (0.0), and lowers
  // the steady-run max step 7.6 -> 5.7 dB. The beat phase follows the blade rate (Dispatch.rotorPhase), not the camera,
  // so it holds while the picture's framing changes; tools/qa_audio_v4.py reports the levels at these frames. The voice
  // is peak-normalised and seed 16 has a lower crest factor (1.1 dB more RMS over 840-1040 than the default phases), so
  // the gain is 1.1 dB lower to keep the bed where it was.
  return {id: 'rotor_path', kind: 'rotor', f: f0, dur: (f1 + 1 - f0) / FPS, gain: -25.1, p: {curve: 1, bpf: 140, doppler: 8, dopplerSmooth: 0.25, fadeOut: 0.3, seed: 16, rate, dist, pan, lvl}};
};

/** Journey3's sensor-shot beats, rebuilt from B exactly as Journey3.tsx defines them (used only if SENSOR_BEATS cannot
 *  be imported). */
const SENSOR_FALLBACK: SensorBeats = {
  roll0: B.tip0 + 7, roll1: B.tip1, reveal0: B.tip1 + 1, reveal1: B.tip1 + 5, cut: B.open0 + 19, shut0: B.open0 + 20, shut1: B.port0,
  nose0: B.port0, touch: B.port1, retract0: B.retract0, close0: B.retract0 + 8, close1: B.retract1,
};
/** Journey3's sensor release (SENSOR_REL: t0 stream0+2, t1 stream1-5, 16 beads, hero merges at heroRing-12 after a
 *  12-frame run from the nose), used only if export_cues4 cannot read it from the picture */
const beadExitsFallback = () => ({
  exits: Array.from({length: 16}, (_, k) => B.stream0 + 2 + (k * (B.stream1 - 5 - (B.stream0 + 2))) / 15),
  hero: B.heroRing - 12 - 12,
});

/** frames where the band's face is on screen and readable (countdown ticks only there) -- V3, unchanged */
const faceOnScreen = (f: number) => (f >= 0 && f < B.cut) || (f >= B.macro - 6 && f < B.tip0 + 4) || (f >= B.red && f < B.map0 - 6);

// ---------------------------------------------------------------- the cue list
/** level of the heartbeat either side of the loop join (V3: hb_g0 -24 at 1335, hb_a0 -19 at frame 0) */
const HB_SEAM = -27;

export const soundCues4 = (h: PictureHooks = {}): Cue[] => {
  for (const k of Object.keys(SOURCES)) delete SOURCES[k];
  const c: Cue[] = [];
  const heart = heartPlan4();
  SOURCES.heart =
    `lib/heart4.ts heartBeats()/fibAmp(): journey lubs ${heart.journeyLubs.map((b) => b.f).join(',')}; journey twitches ${heart.journeyFib.twitches.map((b) => b.f).join(',')} ` +
    `(x reveal4 chestOpen, to ${heart.journeyFib.end}); treatment twitches ${heart.treatFib.twitches.map((b) => b.f).join(',')} (quiver ${heart.treatFib.f0}-${heart.treatFib.end - 1}); ` +
    `settled lubs ${heart.settledLubs.map((b) => `${b.f}@${b.amp}`).join(',')}`;

  // ---- exterior air: ONE cyclic garden bed from the arrival through the loop join to the tilt (V3: amb_out_c faded
  //      to zero at 45 s and amb_out_a faded in from 0); place() wraps the overflow into the head
  c.push({id: 'amb_loop', kind: 'amb', f: B.past0, dur: (TOTAL - B.past0 + B.tip0 + 10) / FPS, gain: -36});
  c.push({id: 'amb_out_b', kind: 'amb', f: B.sig1 - 10, dur: (B.map0 - B.sig1 + 10) / FPS, gain: -36});
  c.push({id: 'amb_roof', kind: 'amb', f: B.map0 + 18, dur: (B.travel0 - B.map0 - 10) / FPS, gain: -34, p: {wind: 1}});

  // ---- the loop alarm: one periodic pulse with the picture's ring, from the red callback into the next play
  // the picture's own helper (lib/device3.ts alarmOnsets / alarmAt) when it exists, else computed from B4
  const fromB4 = alarmOnsets4();
  const dev = alarmFromDevice();
  const al = dev && dev.tail.length + dev.head.length > 0 ? dev : fromB4;
  SOURCES.alarm =
    (al === dev ? `device3 helper: tail ${al.tail.join(',')} head ${al.head.join(',')}` : `B4 period ${B4.alarmPeriod} phase ${B4.alarmPhase0}: tail ${al.tail.join(',')} head ${al.head.join(',')} (device3 helper not present)`) +
    (dev ? (JSON.stringify(dev) === JSON.stringify(fromB4) ? '; agrees with B4' : `; DIFFERS from B4 ${JSON.stringify(fromB4)}`) : '');
  // Every tail emission, and the FIRST head emission only (a later beat would sit on "device", 0.30-0.66 s). The tail
  // beat rings out (p.ring) through the join, so the join falls inside one ringing pulse instead of on a new onset;
  // its ring ducks under "This" (p.duck/duckLead). The head beat is quieter and ducked: the picture's ring envelope is
  // already fading after the wrap, and the words start at 0.04 s. No low thump (the frame-0 shake is gone).
  al.tail.forEach((f) => {
    c.push({id: `alarm_t${f}`, kind: 'alarm1', f, gain: -15, p: {low: 0, att: 0.004, ring: 0.3, duck: -10, duckLead: 0.04}});
    // the band's vibration motor with the pulse, running through the join (0.4 s = one alarm period)
    c.push({id: `buzz_t${f}`, kind: 'buzz', f, dur: B4.alarmPeriod / FPS, gain: -30});
  });
  // FIX ROUND 1: the head beat is 2 dB lower (-22 -> -24): it sits on "This" (speech-weighted margin 14.4 dB at 0.24 s
  // vs V3's 19.1). Not lower: the picture's ring at 6 is as strong as at 1344 (device3 alarmAt env 1), and on the first
  // play this is the first alarm attack heard. Its buzz is inverted (p.polarity, inaudible on its own): in phase it
  // added to the narration peak at 0.43 s that V3's limiter holds at the ceiling, which needed a -30.5 dBFS de-peak
  // pulse in the effects stem there
  al.head.slice(0, 1).forEach((f) => {
    c.push({id: `alarm_h${f}`, kind: 'alarm1', f, gain: -24, p: {low: 0, att: 0.004, ring: 0.3, duck: -8, duckLead: 0.05}});
    c.push({id: `buzz_h${f}`, kind: 'buzz', f, dur: 0.3, gain: -30, p: {polarity: -1}});
  });
  // the opening heartbeat continues the tail's (118 bpm: 1335 -> 1350.25 = frame 0), level-matched at the join, then
  // back up to V3's -19 over two beats
  const hbA = beats(0, B.tip0, 118, -19, 'hb_a', 1, 0.08);
  hbA[0].gain = HB_SEAM;
  if (hbA[1]) hbA[1].gain = -23;
  if (hbA[2]) hbA[2].gain = -21;
  c.push(...hbA);
  c.push({id: 'breath_catch', kind: 'file', f: 6, gain: -24, p: {file: 'breath_1_i0TXGqFeHqkEpFKKUdQf.mp3', offset: 0.0}});
  // ---- the supported collapse (V3)
  c.push({id: 'knees_give', kind: 'rustle', f: B.cut + 2, dur: 0.6, gain: -31});
  c.push({id: 'shoe_scuff', kind: 'scuff', f: B.cut + 12, gain: -30});
  c.push({id: 'hips_land', kind: 'thud', f: B.hipHit, gain: -21, p: {weight: 0.7}});
  c.push({id: 'dog_whine', kind: 'file', f: B.hipHit + 2, gain: -30, p: {file: 'dog_3_JB8U4frHpRyLaM7eJciP.mp3', offset: 0.13}});
  c.push({id: 'hand_grass', kind: 'pat', f: B.handHit, gain: -23});
  c.push({id: 'weight_on_arm', kind: 'rustle', f: B.handHit + 3, dur: 0.35, gain: -32});
  c.push({id: 'body_settle', kind: 'file', f: B.handHit + 4, gain: -24, p: {file: 'fall_4_9ukhH99iVXpBejeIoCqn.mp3', offset: 0.32}});
  c.push({id: 'strained_exhale', kind: 'file', f: B.settle + 4, gain: -29, p: {file: 'breath_4_y9jk69O2KtRNTZPOiz8T.mp3', offset: 0.3}});
  // ---- the band (V3)
  [[B.buzz0, B.buzz0 + 9], [B.buzz0 + 16, B.buzz0 + 25], [B.count0 + 4, B.count0 + 12], [B.crit0 + 2, B.crit0 + 11]].forEach(([a, b], i) =>
    c.push({id: `buzz${i}`, kind: 'buzz', f: a, dur: (b - a) / FPS, gain: -25}),
  );
  c.push({id: 'fingers_dig', kind: 'rustle', f: B.tense0 + 2, dur: 0.4, gain: -31});
  // ---- the sensor shot (Journey3 SENSOR_BEATS): the case turns to its underside (a camera orbit: one soft swish over
  //      the roll), the case's cut-away wipes open, the arm section sweeps open, the shutter slides open (short, high
  //      servo), the nose advances (the actuator, the same mechanism as the treatment's) to a light touch (a click on the
  //      frame the dimple first reads), one tick per sensor bead leaving the nose, the hero lights, the nose retracts,
  //      the shutter closes (a click when it is shut)
  const S = h.sensor?.beats ?? SENSOR_FALLBACK;
  SOURCES.sensor = h.sensor ? `${h.origin?.sensor ?? 'Journey3.SENSOR_BEATS'} ${JSON.stringify(S)}` : `fallback (Journey3 SENSOR_BEATS rebuilt from B) ${JSON.stringify(S)}`;
  c.push({id: 'case_turn', kind: 'swish', f: S.roll0, dur: (S.roll1 - S.roll0) / FPS, gain: -28});
  c.push({id: 'case_reveal', kind: 'scan', f: S.reveal0, gain: -32, p: {freq: 1800, dur: (S.reveal1 - S.reveal0) / FPS}});
  // the arm section sweeps open from B.open0 (reveal4 J.open: B.open0 -> B.open1 + 8), as in V3
  c.push({id: 'cut_edge', kind: 'scan', f: B.open0 + 1, gain: -28, p: {freq: 2200, dur: (B.open1 - B.open0) / FPS}});
  c.push({id: 'shutter_open', kind: 'servo', f: S.shut0, dur: (S.shut1 - S.shut0) / FPS, gain: -29, p: {f0: 1900, f1: 2600}});
  // the nose's advance and retract run under "microscopic" / "and race": their own duck, -6 dB under speech
  c.push({id: 'port_out', kind: 'servo', f: S.nose0, dur: (S.touch - S.nose0) / FPS, gain: -28, p: {f0: 900, f1: 1300, duck: -6}});
  const touch = h.sensor?.contact ?? S.touch;
  SOURCES.sensor_touch = h.sensor?.contact !== undefined ? `${h.origin?.sensorContact ?? 'measured'} ${touch} (SENSOR_BEATS.touch ${S.touch} = full stroke)` : `fallback SENSOR_BEATS.touch ${S.touch}`;
  c.push({id: 'port_touch', kind: 'click', f: touch, gain: -26, p: {freq: 2600}});
  const fbx = beadExitsFallback();
  const exits = h.sensor?.beadExits ?? fbx.exits;
  const heroExit = h.sensor?.heroExit ?? fbx.hero;
  // one tick per bead as it leaves the nose tip; the hero (k = -1) is the strongest, merged with a bead tick when the
  // two leave within half a frame of each other
  const ticks = exits.map((f) => ({f, amp: 0})).concat([{f: heroExit, amp: 1}]).sort((a, b) => a.f - b.f);
  const merged: {f: number; amp: number}[] = [];
  for (const t of ticks) {
    const last = merged[merged.length - 1];
    if (last && t.f - last.f < 0.5) last.amp = Math.max(last.amp, t.amp);
    else merged.push({...t});
  }
  const st0 = Math.floor(merged[0].f) - 1;
  SOURCES.sensor_beads = `${h.sensor?.beadExits ? h.origin?.sensorRelease ?? 'hook' : 'fallback (Journey3 SENSOR_REL rebuilt from B)'}: ${merged.length} ticks ${r3(merged[0].f)}-${r3(merged[merged.length - 1].f)}, hero ${r3(heroExit)}`;
  c.push({
    id: 'stream', kind: 'ticks', f: st0, dur: (merged[merged.length - 1].f - st0 + 2) / FPS, gain: -28,
    // p.at: tick times (s from the cue start); p.amp: 0 = the generator's own seeded level (0.5-0.9), 1 = the hero.
    // FIX ROUND 1: its own -3 dB duck instead of the continuous bus's -6 dB (they run under "microscopic nano-sensors",
    // and a frame-exact tick is no use if it is masked); the same level in the gaps
    p: {at: merged.map((t) => r4((t.f - st0) / FPS)), amp: merged.map((t) => t.amp), duck: -3},
  });
  c.push({id: 'hero_mark', kind: 'blip', f: B.heroRing, gain: -26, p: {freq: 1320}});
  c.push({id: 'port_back', kind: 'servo', f: S.retract0, dur: (S.close0 - S.retract0) / FPS, gain: -30, p: {f0: 1300, f1: 900, duck: -6}});
  c.push({id: 'shutter_shut', kind: 'click', f: S.close1, gain: -31, p: {freq: 1800}});
  // ---- the bloodstream (V3)
  c.push({id: 'flow', kind: 'flow', f: B.stream0 + 10, dur: (B.pull1 + 10 - B.stream0 - 10) / FPS, gain: -27});
  c.push({id: 'dive_in', kind: 'swish', f: B.dive0, dur: 0.6, gain: -28});
  c.push({id: 'cell_pass', kind: 'pass', f: B.pass0 + 12, gain: -27, p: {pan: -0.35}});
  c.push({id: 'bend_pass', kind: 'pass', f: B.bend0 + 2, gain: -29, p: {pan: 0.3}});
  c.push({id: 'wall_scan', kind: 'scan', f: B.scan0, gain: -27, p: {freq: 1760}});
  c.push({id: 'decay_detect', kind: 'detect', f: B.decay + 1, gain: -23});
  c.push({id: 'signal_out', kind: 'ring', f: B.signal0, gain: -25});
  [0, 1, 2, 3].forEach((k) => c.push({id: `signal${k}`, kind: 'blip', f: B.signal0 + 6 + k * 5, gain: -31 - k, p: {freq: 990 + k * 110}}));
  c.push({id: 'pull_out', kind: 'swish', f: B.pull0 + 4, dur: 0.7, gain: -28});
  // ---- the torso: the window opens, one organ dims, a regular pulse breaks into an irregular, lethal rhythm
  //      (heartbeats from the shared beat list, lib/heart4.ts)
  c.push({id: 'window_open', kind: 'scan', f: k4(['chestOpen0', 'chest0'], B.organ0 - 6), gain: -30, p: {freq: 1500, dur: 0.6}});
  c.push({id: 'organ_dim', kind: 'flag', f: k4(['organDim0', 'liverDim0'], B.fail), gain: -26});
  heart.journeyLubs.forEach((b, k) => c.push({id: `hb_c${k}`, kind: 'heartbeat', f: b.f, gain: r3(-20 + db20(b.amp)), p: {tone: 1}}));
  // the lethal rhythm: a thump on each drawn twitch over a faint quiver bed, both fading with the chest window
  const fibCue = (id: string, fib: ReturnType<typeof heartPlan4>['journeyFib'], gain: number): Cue => ({
    id, kind: 'fib', f: fib.f0, dur: (fib.end + 4 - fib.f0) / FPS, gain,
    // p.at: thump times (s from the cue start); p.amp: their amplitudes; p.bed: the quiver bed per frame (0..1);
    // p.bedDb: the bed's level under a full thump
    p: {at: fib.twitches.map((t) => r4((t.f - fib.f0) / FPS)), amp: fib.twitches.map((t) => t.amp), bed: fib.bed, bedDb: -14},
  });
  c.push(fibCue('fibrillation', heart.journeyFib, -21));
  c.push({id: 'heart_sense', kind: 'detect', f: B.lethal + 6, gain: -24});
  c.push({id: 'signal_run', kind: 'zip', f: B.sig0, dur: (B.sig1 - B.sig0) / FPS, gain: -32});
  c.push({id: 'warn_land', kind: 'alarm', f: B.red - 1, gain: -20});
  // ---- the countdown (V3)
  for (let f = 1; f < B.map0; f++) {
    if (!faceOnScreen(f)) continue;
    if (Math.ceil(countdown3(f) - 1e-6) !== Math.ceil(countdown3(f - 1) - 1e-6)) c.push({id: `tick${f}`, kind: 'clock', f, gain: -29});
  }
  c.push(...beats(B.red + 4, B.map0, 112, -25, 'hb_d', 0.95, 0.12));
  c.push({id: 'crit_breath', kind: 'file', f: B.crit0 + 2, gain: -28, p: {file: 'breath_2_C4k8MIkY48irqu90gUzx.mp3', offset: 0.05}});
  c.push({id: 'grass_grip', kind: 'rustle', f: B.crit0 + 4, dur: 0.45, gain: -30});

  // ---- transmission and dispatch (shots/Dispatch.tsx + B4 dispatch keys)
  const mapEnd = h.mapEnd ?? B.map0 + 21;
  SOURCES.mapEnd = h.mapEnd !== undefined ? h.origin?.mapEnd ?? 'hook' : 'fallback V3 MAP_END 748';
  c.push({id: 'send', kind: 'send', f: B.tx0, gain: -20});
  c.push({id: 'map_data', kind: 'data', f: B.map0, dur: (mapEnd - B.map0) / FPS, gain: -30});
  // the location pulse lands in the dock ring (B4.pulseLand: Dispatch beaconAt lights and its ripple starts there; the
  // landing is under "location", so it has its own duck, -8 dB under speech). FIX ROUND 1: inverted (p.polarity,
  // inaudible on its own): in phase it added to a narration peak at 751.2 that V3's limiter holds at the ceiling
  // (a -42 dBFS de-peak pulse in the effects stem, about the level of the effects there)
  c.push({id: 'hosp_receive', kind: 'receive', f: k4(['pulseLand', 'dockLand'], B.dock), gain: -24, p: {duck: -8, polarity: -1}});
  // takeoff order (Dispatch.tsx): the cradle latch swings open over B.latch .. +8 (easeOut), the rotors start at
  // B4.spin0 and reach full speed at spin1 (rotorRate), their blur grows from blur0, the drone lifts clear from B.lift0.
  // Sound: the pin releases on the latch frame, the cradle servo runs the swing, a click as the arms reach their stops,
  // then ONE rotor cue on the picture's rotorPhase (silent until spin0), perspective and pan from droneView
  const latch = B.latch;
  const LATCH_SWING = 8; // Dispatch.tsx HospitalBay: easeOut(inv(B.latch, B.latch + 8, f))
  SOURCES.latch = `B.latch ${latch} (Dispatch latch swing ${latch}-${latch + LATCH_SWING}); spin0 ${B4.spin0}, blur0 ${B4.blur0}, spin1 ${B4.spin1}, lift ${B.lift0}-${B4.lift1}`;
  if (!(latch < B4.spin0 && B4.spin0 < B4.spin1 && B4.blur0 >= B4.spin0 && B4.spin0 < B.lift0 && B.lift0 <= B4.lift1)) throw new Error(`takeoff order broken: latch ${latch} spin0 ${B4.spin0} blur0 ${B4.blur0} spin1 ${B4.spin1} lift0 ${B.lift0}`);
  c.push({id: 'latch_pin', kind: 'pin', f: latch, gain: -24});
  c.push({id: 'latch_servo', kind: 'servo', f: latch, dur: LATCH_SWING / FPS, gain: -27, p: {f0: 700, f1: 1100}});
  c.push({id: 'latch_click', kind: 'click', f: latch + LATCH_SWING, gain: -30, p: {freq: 2200}});
  c.push(rotorPath(h, latch));
  const wipeIn0 = h.wipe?.in0 ?? k4(['wipeIn0'], B.past0 - 1);
  SOURCES.wipe = h.wipe ? `${h.origin?.wipe ?? 'hook'} ${JSON.stringify(h.wipe)}` : `fallback ${wipeIn0}`;
  c.push({id: 'trunk_past', kind: 'swish', f: wipeIn0 + 2, dur: 0.45, gain: -27});
  c.push({id: 'rotor_texture', kind: 'file', f: B.past0 + 10, gain: -34, p: {file: 'drone_1_f7S5LI3HdTlvGoa1G6Fp.mp3', offset: 0}});
  c.push({id: 'link', kind: 'blip', f: k4(['link0'], B.arrive - 2), gain: -27, p: {freq: 990}});

  // ---- treatment (B4 treatment keys, which drive Aftermath3 treatState): the roll to the underside (a soft swish),
  //      the shutter opens (short, high servo), the actuator advances (servo), a soft contact (press) on the frame the
  //      nose's dimple first reads, one restrained pulse on the slug's run from the reservoir into the lumen, a short
  //      flow bed while the camera tracks it with the flow (on through the 987 match into the vena cava), the
  //      actuator retracts, a click when the shutter is shut, then the chest: quiver thumps on the drawn twitches,
  //      the near-still reset, the weak lub at 1005, the full lub at 1026, regular beats.
  //      "the band delivers an automatic injection, potentially buying him time" runs over all of it: each mechanism
  //      cue ducks itself 6 dB under speech (p.duck), on top of nothing else.
  const T = B4;
  const D6 = {duck: -6};
  const contact = h.treat?.contact ?? T.tContact;
  SOURCES.treatment = `B4 tRoll ${T.tRoll0}-${T.tRoll1}, tShut ${T.tShut0}-${T.tShut1}, tStroke ${T.tStroke0}-${T.tStroke1}, tSlug0 ${T.tSlug0} -> tSlugLumen ${T.tSlugLumen}, tTrack0 ${T.tTrack0}, tRetract ${T.tRetract0}-${T.tRetract1}, tShutClose ${T.tShutClose0}-${T.tShutClose1}, treatMatch ${T.treatMatch}, treatSvc1 ${T.treatSvc1}`;
  SOURCES.treat_contact = h.treat?.contact !== undefined ? `${h.origin?.treatContact ?? 'measured'} ${contact} (B4.tContact ${T.tContact})` : `B4.tContact ${T.tContact}`;
  // the roll swish spans the roll as the picture moves it (Aftermath3 treatState: a smoothstep from tRoll0 - 1 to the
  // tCut punch-in, so the swish's sin^1.6 peak sits on the roll's speed peak and it ends as the case comes to rest)
  const roll = h.treat?.roll ?? [T.tRoll0 - 1, T.tCut];
  SOURCES.treat_roll = h.treat?.roll ? `${h.origin?.treatRoll ?? 'measured'} ${roll.join('-')} (B4 tRoll ${T.tRoll0}-${T.tRoll1}, tCut ${T.tCut})` : `fallback B4 tRoll0 - 1 .. tCut ${roll.join('-')}`;
  c.push({id: 'tilt2', kind: 'swish', f: roll[0], dur: (roll[1] - roll[0]) / FPS, gain: -29, p: {...D6}});
  c.push({id: 'shutter', kind: 'servo', f: T.tShut0, dur: (T.tShut1 - T.tShut0) / FPS, gain: -28, p: {f0: 1900, f1: 2600, ...D6}});
  c.push({id: 'actuator', kind: 'servo', f: T.tStroke0, dur: (T.tStroke1 - T.tStroke0) / FPS, gain: -29, p: {f0: 900, f1: 1300, ...D6}});
  c.push({id: 'contact', kind: 'press', f: contact, gain: -25, p: {...D6}});
  c.push({id: 'tpulse', kind: 'tpulse', f: T.tSlug0, gain: -27, p: {dur: r4((T.tSlugLumen + 2 - T.tSlug0) / FPS), ...D6}});
  c.push({id: 'treat_flow', kind: 'flow', f: T.tTrack0, dur: (T.treatSvc1 + 2 - T.tTrack0) / FPS, gain: -31});
  c.push({id: 'retract', kind: 'servo', f: T.tRetract0, dur: (T.tRetract1 - T.tRetract0) / FPS, gain: -31, p: {f0: 1300, f1: 900, ...D6}});
  c.push({id: 'port_close', kind: 'click', f: T.tShutClose1, gain: -30, p: {freq: 1800, ...D6}});
  // 'held' (V3 confirm chime at B.hold + 1) is dropped: TIMER HELD (steady red) is first on screen in the medium shot
  // at about 1042-1050, under "His heartbeat steadies"; a bright confirm there would sit on the words and pre-empt the
  // green chime (B.green + 2), which confirms the recovery.
  SOURCES.held = 'dropped (TIMER HELD first on screen ~1042-1050 in the medium shot, under words; the green chime confirms)';
  c.push(fibCue('fib_fade', heart.treatFib, -24));
  heart.settledLubs.forEach((b, k) => c.push({id: `hb_e${k}`, kind: 'heartbeat', f: b.f, gain: r3(-20 + db20(b.amp) - 2.5 * Math.max(0, k - 1)), p: {tone: 0.9}}));
  // ---- recovery (V3)
  c.push({id: 'deep_breath', kind: 'file', f: B.release0 - 2, gain: -24, p: {file: 'recover_breath_3_u0kMmd94TJjSZjKOuzAH.mp3', offset: 0}});
  c.push({id: 'fingers_release', kind: 'rustle', f: B.release0 + 2, dur: 0.3, gain: -33});
  c.push({id: 'load', kind: 'pat', f: B.release0 + 12, gain: -27});
  c.push({id: 'push_up', kind: 'rustle', f: B.rise0, dur: 0.9, gain: -30});
  c.push({id: 'sit_settle', kind: 'thud', f: B.rise1 - 2, gain: -29, p: {weight: 0.3}});
  c.push({id: 'recover_breath', kind: 'file', f: B.rise1 + 6, gain: -28, p: {file: 'recover_breath_1_tFCDclpcmymiy0MdhNUi.mp3', offset: 0}});
  // the calm heartbeat (V3: 72 bpm from release0 + 34 = 1071) now continues the drawn heart's regular beats (period 21,
  // last at 1068): one 23-frame step, then 72 bpm, so no beat lands on top of the heart4 list
  const lastLub = heart.settledLubs[heart.settledLubs.length - 1].f;
  c.push(...beats(Math.max(B.release0 + 34, lastLub + heart.period + 2), B.return0, 72, -27, 'hb_f', 0.8));
  c.push({id: 'green', kind: 'chime', f: B.green + 2, gain: -24});
  // ---- the question: one local glitch on the band; the red callback; the heartbeat that frame 0 continues
  c.push({id: 'glitch', kind: 'glitch', f: B.glitch, dur: B.glitchLen / FPS, gain: -22});
  const hbG = beats(B.callback - 2, TOTAL, 118, -24, 'hb_g', 1);
  hbG.forEach((b) => (b.gain = HB_SEAM));
  c.push(...hbG);
  return c.sort((a, b) => a.f - b.f);
};

/** The V3 music sections, FROZEN (seconds): music.wav is reused byte for byte, so these may never follow B again.
 * Equal to audio/v3/cues.json 'music' (scripts/export_cues4.ts asserts it). */
export const MUSIC_V3 = {
  total: 1350 / 30,
  bpm: 100,
  journeyFrom: 119 / 30,
  urgentFrom: (538 - 6) / 30,
  rescueFrom: (705 - 2) / 30,
  releaseFrom: (983 + 4) / 30,
  thinFrom: (1211 - 4) / 30,
  glitchAt: 1327 / 30,
  glitchEnd: (1327 + 10) / 30,
  callbackAt: 1337 / 30,
} as const;
export const musicPlan4 = () => ({...MUSIC_V3});
