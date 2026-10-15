// V4 sound cues: a copy of lib/sound3.ts with the V4 edits. scripts/export_cues4.ts writes them to audio/v4/cues.json;
// tools/build_audio_v4.py renders ONLY the effects bus from them (option R: the V3 narration and music stems are
// reused byte for byte, and the new effects bus is placed under V3's own gain envelope).
//
// Where the picture exports a key or a function, the cue reads it; where it does not (yet), the cue falls back to the
// V3 frame (or to the V4 design frame where V3 has no equivalent). Every lookup is recorded in `sources`, so the
// final cue pass can see which cues still run on fallbacks:
//   - lib/beats4.ts B4 (static import; optional keys read by name, see k4 below)
//   - lib/device3.ts alarm helper (alarmOnsets / alarmAt) when present, else the onsets computed from B4 (cross-checked)
//   - shots/Dispatch.tsx and shots/Aftermath3.tsx drone functions, and a future lib/heart4.ts beat list: passed in as
//     PictureHooks by scripts/export_cues4.ts (dynamic imports, so a missing or half-edited picture file never
//     breaks the cue export; it only falls back).
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
import {B, FPS, TOTAL} from './timeline3';

export type CueParam = number | string | number[];
export type Cue = {id: string; kind: string; f: number; gain: number; dur?: number; p?: Record<string, CueParam>};

/** What the picture can hand to the sound (all optional; see scripts/export_cues4.ts). */
export type PictureHooks = {
  /** rotor angle in radians at frame f (one rotorPhase for every shot); its per-frame increment drives the rotor pitch */
  rotorPhase?: (f: number) => number;
  /** the drone as seen on screen at frame f: x in px (0..1080) and apparent scale (drone s x camera z), or null off frame */
  droneView?: (f: number) => {x: number; scale: number} | null;
  /** the shared heartbeat list (lib/heart4.ts) */
  heart?: HeartSound;
  /** frame the map pulse lands in the dock beacon, and the map's end frame (shots/Dispatch.tsx) */
  mapEnd?: number;
  /** where each hook came from (for the log) */
  origin?: Record<string, string>;
};

/** The heartbeat sounds the picture's beat list implies. */
export type HeartSound = {
  /** regular lubs in the journey chest view (V3: 459, 480, 501, 522) */
  journey: number[];
  /** irregular (fibrillating) span in the journey: [from, to) */
  fib: [number, number];
  /** quiver in the treatment chest view: [from, to) (then still, then the first settled lub) */
  quiver: [number, number];
  /** settled lubs after the treatment (V3: 1005, 1026, 1048) */
  settled: number[];
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
const listBeats = (frames: number[], gain: number, id: string, tone: number): Cue[] => frames.map((f, k) => ({id: `${id}${k}`, kind: 'heartbeat', f, gain, p: {tone}}));

/** V3's heartbeat frames (sound3: hb_c / fibrillation / fib_fade / hb_e), with the V4 design's quiver end (1003). */
export const HEART_V3: HeartSound = {
  journey: beats(B.organ0 - 4, B.lethal - 2, 86, 0, 'x').map((c) => c.f),
  fib: [B.lethal - 2, B.lethal - 2 + (B.sig0 + 4 - B.lethal)],
  quiver: [B.settleHeart0, B.settleHeart0 + 16],
  settled: beats(B.settleHeart0 + 18, B.release0 + 30, 84, 0, 'x').map((c) => c.f),
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

const rotorPath = (h: PictureHooks, latch: number): Cue => {
  const f0 = latch + 1;
  // the drone flies on through the 864 cut, climbs over the roofs, passes the trunk wipe, brakes (flare) into the
  // hover beside his head, hovers through the treatment, then climbs out of frame (V3: rise0 -> green+30)
  const climb1 = k4(['climb1'], B.past0 - 1);
  const arrive0 = k4(['arrive0'], B.past0 + 6);
  const flare0 = k4(['flare0'], B.past0 + 13, 'V4 design');
  const hover = k4(['hover0', 'hover2'], B.act0 + 4);
  const away0 = k4(['retreat0', 'droneAway0'], B.rise0);
  const away1 = k4(['retreat1', 'droneAway1'], B.green + 30);
  const f1 = Math.round(away1 + 10);
  const fb = rotorPhaseFallback();
  const phase = h.rotorPhase ?? fb.fn;
  SOURCES.rotor_rate = h.rotorPhase ? h.origin?.rotorPhase ?? 'hook' : fb.how;
  const full = Math.max(1e-6, phase(B.travel0 + 1) - phase(B.travel0));
  // fallback perspective (no droneView export yet): apparent size -> distance, screen x -> pan; continuous through
  // the 864 cut (V4: same screen position and scale both sides) and the trunk wipe; a small load rise in the braking
  // flare; quieter while it hovers over the treatment (lvl), as V3's hover bed sat 9 dB under the arrival.
  const distK: [number, number][] = [[f0, 1.0], [B.bank0, 1.0], [B.travel0, 1.12], [climb1, 1.3], [Math.max(arrive0 + 7, climb1 + 1), 1.6], [Math.max(flare0, arrive0 + 8), 1.3], [hover, 1.15], [away0, 1.15], [away1, 4.0], [f1, 5.0]];
  const panK: [number, number][] = [[f0, -0.05], [B.travel0, -0.12], [climb1, -0.05], [arrive0 + 7, -0.3], [hover, 0.05], [away0, 0.05], [away1, -0.25]];
  const lvlK: [number, number][] = [[f0, 0], [flare0, 0], [flare0 + 5, 1.5], [hover, 0], [hover + 14, -8], [away0, -8], [f1, -12]];
  const loadK: [number, number][] = [[f0, 1], [flare0, 1], [flare0 + 5, 1.06], [hover + 4, 1]];
  SOURCES.rotor_view = h.droneView ? h.origin?.droneView ?? 'hook' : 'fallback keyframes (V3 framing, continuous at 864 and the wipe)';
  const rate: number[] = [];
  const dist: number[] = [];
  const pan: number[] = [];
  const lvl: number[] = [];
  for (let f = f0; f <= f1; f++) {
    rate.push(r4(Math.min(1, Math.max(0, (phase(f + 1) - phase(f)) / full)) * keyed(loadK, f)));
    const v = h.droneView?.(f);
    if (v) {
      dist.push(r4(Math.max(0.6, 1.025 / Math.max(0.05, v.scale))));
      pan.push(r4(Math.max(-0.8, Math.min(0.8, (0.6 * (v.x - 540)) / 540))));
    } else {
      dist.push(r4(keyed(distK, f)));
      pan.push(r4(keyed(panK, f)));
    }
    lvl.push(r4(keyed(lvlK, f)));
  }
  return {id: 'rotor_path', kind: 'rotor', f: f0, dur: (f1 + 1 - f0) / FPS, gain: -24, p: {curve: 1, bpf: 140, doppler: 20, fadeOut: 0.3, rate, dist, pan, lvl}};
};

/** frames where the band's face is on screen and readable (countdown ticks only there) -- V3, unchanged */
const faceOnScreen = (f: number) => (f >= 0 && f < B.cut) || (f >= B.macro - 6 && f < B.tip0 + 4) || (f >= B.red && f < B.map0 - 6);

// ---------------------------------------------------------------- the cue list
/** level of the heartbeat either side of the loop join (V3: hb_g0 -24 at 1335, hb_a0 -19 at frame 0) */
const HB_SEAM = -27;

export const soundCues4 = (h: PictureHooks = {}): Cue[] => {
  for (const k of Object.keys(SOURCES)) delete SOURCES[k];
  const c: Cue[] = [];
  const heart = h.heart ?? HEART_V3;
  SOURCES.heart = h.heart ? h.origin?.heart ?? 'hook' : 'fallback V3 frames (hb_c 459-522, fib 536-567, quiver 987-1003, hb_e 1005-1048)';

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
  al.head.slice(0, 1).forEach((f) => {
    c.push({id: `alarm_h${f}`, kind: 'alarm1', f, gain: -22, p: {low: 0, att: 0.004, ring: 0.3, duck: -8, duckLead: 0.05}});
    c.push({id: `buzz_h${f}`, kind: 'buzz', f, dur: 0.3, gain: -30});
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
  c.push({id: 'tilt', kind: 'swish', f: B.tip0 + 2, dur: 0.5, gain: -26});
  c.push({id: 'case_turn', kind: 'servo', f: B.tip1 - 10, dur: 0.35, gain: -28, p: {f0: 900, f1: 1250}});
  c.push({id: 'cut_edge', kind: 'scan', f: B.open0 + 1, gain: -28, p: {freq: 2200, dur: (B.open1 - B.open0) / FPS}});
  c.push({id: 'port_out', kind: 'servo', f: B.port0, dur: 0.3, gain: -25, p: {f0: 1400, f1: 2100}});
  c.push({id: 'port_touch', kind: 'click', f: B.port1, gain: -23, p: {freq: 2600}});
  c.push({id: 'stream', kind: 'ticks', f: B.stream0, dur: (B.stream1 - B.stream0) / FPS, gain: -30, p: {rate: 34}});
  c.push({id: 'hero_mark', kind: 'blip', f: B.heroRing, gain: -26, p: {freq: 1320}});
  c.push({id: 'port_back', kind: 'servo', f: B.retract0, dur: 0.3, gain: -30, p: {f0: 2100, f1: 1300}});
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
  //      (heartbeats from the shared beat list when lib/heart4.ts exists)
  c.push({id: 'window_open', kind: 'scan', f: k4(['chestOpen0', 'chest0'], B.organ0 - 6), gain: -30, p: {freq: 1500, dur: 0.6}});
  c.push({id: 'organ_dim', kind: 'flag', f: k4(['organDim0', 'liverDim0'], B.fail), gain: -26});
  c.push(...listBeats(heart.journey, -20, 'hb_c', 1));
  c.push({id: 'fibrillation', kind: 'fib', f: heart.fib[0], dur: (heart.fib[1] - heart.fib[0]) / FPS, gain: -21});
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

  // ---- transmission and dispatch (PROVISIONAL frames: final pass once Dispatch.tsx is locked)
  const mapEnd = h.mapEnd ?? B.map0 + 21;
  SOURCES.mapEnd = h.mapEnd !== undefined ? h.origin?.mapEnd ?? 'hook' : 'fallback V3 MAP_END 748';
  c.push({id: 'send', kind: 'send', f: B.tx0, gain: -20});
  c.push({id: 'map_data', kind: 'data', f: B.map0, dur: (mapEnd - B.map0) / FPS, gain: -30});
  // (B4.pulseLand puts the landing under the words; V3's 797 was nearly clear of them: own duck -6 dB under speech)
  c.push({id: 'hosp_receive', kind: 'receive', f: k4(['pulseLand', 'dockLand'], B.dock), gain: -24, p: {duck: -6}});
  // latch: a pin release, a small click, the cradle servo; then ONE rotor cue that follows the picture's rotor speed
  // (spin-up after the latch), perspective and pan through the 864 cut, the trunk wipe, the arrival and the hover
  const latch = k4(['latch', 'latch0'], B.latch);
  c.push({id: 'latch_pin', kind: 'pin', f: latch, gain: -24});
  c.push({id: 'latch_click', kind: 'click', f: latch + 2, gain: -28, p: {freq: 2200}});
  c.push({id: 'latch_servo', kind: 'servo', f: latch + 1, dur: 0.25, gain: -27, p: {f0: 700, f1: 1100}});
  c.push(rotorPath(h, latch));
  c.push({id: 'trunk_past', kind: 'swish', f: k4(['wipeIn0'], B.past0 - 1) + 2, dur: 0.45, gain: -27});
  c.push({id: 'rotor_texture', kind: 'file', f: B.past0 + 10, gain: -34, p: {file: 'drone_1_f7S5LI3HdTlvGoa1G6Fp.mp3', offset: 0}});
  c.push({id: 'link', kind: 'blip', f: k4(['link0'], B.arrive - 2), gain: -27, p: {freq: 990}});

  // ---- treatment (PROVISIONAL frames from the V4 design budget 921-1037; final pass once the B4 treatment keys exist):
  //      approach, shutter opens, actuator advances, soft contact, one restrained pulse enters, it rides the flow,
  //      the actuator retracts and the port closes, the match cut to the heart: quiver, still, settled beats.
  //      All under "the band delivers an automatic injection, potentially buying him time": per-cue duck -6 dB.
  const D6 = {duck: -6};
  c.push({id: 'tilt2', kind: 'swish', f: k4(['approach0', 'treatApproach0'], B.act0 - 6, 'V4 design') + 8, dur: 0.35, gain: -29});
  c.push({id: 'shutter', kind: 'servo', f: k4(['shutter0', 'shutterOpen0'], 940, 'V4 design'), dur: 0.14, gain: -28, p: {f0: 1900, f1: 2600, ...D6}});
  c.push({id: 'actuator', kind: 'servo', f: k4(['piston0', 'actuator0'], 945, 'V4 design'), dur: 0.2, gain: -29, p: {f0: 900, f1: 1300, ...D6}});
  c.push({id: 'contact', kind: 'press', f: k4(['contact', 'contact0'], B.inject0), gain: -25, p: {...D6}});
  const entry = k4(['entry0', 'slug0'], 956, 'V4 design');
  c.push({id: 'tpulse', kind: 'tpulse', f: entry, gain: -27, p: {...D6}});
  const resp = k4(['resp0', 'response0'], 971, 'V4 design');
  c.push({id: 'treat_flow', kind: 'flow', f: resp - 6, dur: (B.settleHeart0 + 4 - (resp - 6)) / FPS, gain: -31});
  c.push({id: 'treat_pass', kind: 'pass', f: resp + 5, gain: -30, p: {pan: -0.2, ...D6}});
  const retract = k4(['retract2', 'pistonBack0'], 975, 'V4 design');
  c.push({id: 'retract', kind: 'servo', f: retract, dur: 0.2, gain: -31, p: {f0: 1300, f1: 900, ...D6}});
  c.push({id: 'port_close', kind: 'click', f: k4(['portClose', 'shutterClose1'], retract + 8, 'V4 design'), gain: -30, p: {freq: 1800, ...D6}});
  c.push({id: 'held', kind: 'confirm', f: k4(['heldSeen', 'timerHeld0'], B.hold + 1), gain: -25});
  c.push({id: 'fib_fade', kind: 'fib', f: heart.quiver[0], dur: (heart.quiver[1] - heart.quiver[0]) / FPS, gain: -26});
  c.push(...listBeats(heart.settled, -20, 'hb_e', 0.9));
  // ---- recovery (V3)
  c.push({id: 'deep_breath', kind: 'file', f: B.release0 - 2, gain: -24, p: {file: 'recover_breath_3_u0kMmd94TJjSZjKOuzAH.mp3', offset: 0}});
  c.push({id: 'fingers_release', kind: 'rustle', f: B.release0 + 2, dur: 0.3, gain: -33});
  c.push({id: 'load', kind: 'pat', f: B.release0 + 12, gain: -27});
  c.push({id: 'push_up', kind: 'rustle', f: B.rise0, dur: 0.9, gain: -30});
  c.push({id: 'sit_settle', kind: 'thud', f: B.rise1 - 2, gain: -29, p: {weight: 0.3}});
  c.push({id: 'recover_breath', kind: 'file', f: B.rise1 + 6, gain: -28, p: {file: 'recover_breath_1_tFCDclpcmymiy0MdhNUi.mp3', offset: 0}});
  c.push(...beats(B.release0 + 34, B.return0, 72, -27, 'hb_f', 0.8));
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
