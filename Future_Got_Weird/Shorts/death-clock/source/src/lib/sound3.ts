// V3 sound cues, derived from the SAME beat table as the picture (lib/timeline3.ts) and the device states
// (lib/device3.ts). scripts/export_cues3.ts writes them to audio/v3/cues.json; tools/build_audio_v3.py renders them.
// Continuous low-level scene sound under every transition (grass and air outside, flow inside the arm, rotors in
// the dispatch); specific, short effects timed to contact and motion; one warning transient at frame 0 (the loop
// point) and one concise warning when the heart's signal lands mid-film; no whoosh on every cut, no alarm bed.
import {countdown3} from './device3';
import {B, FPS, TOTAL} from './timeline3';

export type Cue = {id: string; kind: string; f: number; gain: number; dur?: number; p?: Record<string, number | string>};

const beats = (from: number, to: number, bpm: number, gain: number, id: string, tone = 1, jitter = 0): Cue[] => {
  const out: Cue[] = [];
  const step = (60 / bpm) * FPS;
  let k = 0;
  for (let f = from; f < to; f += step * (1 + (jitter ? Math.sin(k * 2.7) * jitter : 0)), k++) out.push({id: `${id}${k}`, kind: 'heartbeat', f: Math.round(f), gain, p: {tone}});
  return out;
};

/** frames where the band's face is on screen and readable (countdown ticks only there) */
const faceOnScreen = (f: number) => (f >= 0 && f < B.cut) || (f >= B.macro - 6 && f < B.tip0 + 4) || (f >= B.red && f < B.map0 - 6);

export const soundCues = (): Cue[] => {
  const c: Cue[] = [];
  // ---- exterior air: a low, steady garden ambience under every outdoor shot (cyclic with the loop)
  c.push({id: 'amb_out_a', kind: 'amb', f: 0, dur: (B.tip0 + 10) / FPS, gain: -36});
  c.push({id: 'amb_out_b', kind: 'amb', f: B.sig1 - 10, dur: (B.map0 - B.sig1 + 10) / FPS, gain: -36});
  c.push({id: 'amb_out_c', kind: 'amb', f: B.past0, dur: (TOTAL - B.past0) / FPS, gain: -36});
  c.push({id: 'amb_roof', kind: 'amb', f: B.map0 + 18, dur: (B.travel0 - B.map0 - 10) / FPS, gain: -34, p: {wind: 1}});
  // ---- frame 0: the one warning transient of the opening (also the loop point), the band buzzing, his breath
  c.push({id: 'warn0', kind: 'alarm1', f: 0, gain: -19});
  c.push({id: 'buzz_open', kind: 'buzz', f: 0, dur: 0.3, gain: -27});
  c.push(...beats(0, B.tip0, 118, -19, 'hb_a', 1, 0.08));
  c.push({id: 'breath_catch', kind: 'file', f: 6, gain: -24, p: {file: 'breath_1_i0TXGqFeHqkEpFKKUdQf.mp3', offset: 0.0}});
  // ---- the supported collapse: fabric as the knees give, the hips land, the hand meets the grass, settle
  c.push({id: 'knees_give', kind: 'rustle', f: B.cut + 2, dur: 0.6, gain: -31});
  c.push({id: 'shoe_scuff', kind: 'scuff', f: B.cut + 12, gain: -30});
  c.push({id: 'hips_land', kind: 'thud', f: B.hipHit, gain: -21, p: {weight: 0.7}});
  c.push({id: 'dog_whine', kind: 'file', f: B.hipHit + 2, gain: -30, p: {file: 'dog_3_JB8U4frHpRyLaM7eJciP.mp3', offset: 0.13}});
  c.push({id: 'hand_grass', kind: 'pat', f: B.handHit, gain: -23});
  c.push({id: 'weight_on_arm', kind: 'rustle', f: B.handHit + 3, dur: 0.35, gain: -32});
  c.push({id: 'body_settle', kind: 'file', f: B.handHit + 4, gain: -24, p: {file: 'fall_4_9ukhH99iVXpBejeIoCqn.mp3', offset: 0.32}});
  c.push({id: 'strained_exhale', kind: 'file', f: B.settle + 4, gain: -29, p: {file: 'breath_4_y9jk69O2KtRNTZPOiz8T.mp3', offset: 0.3}});
  // ---- the band: buzzes (a motor in the case), fingers digging into the grass, the tilt, the cut edge, the port
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
  // ---- the bloodstream: flow bed, a close pass, the bend, the scan, the detection, the signals
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
  c.push({id: 'window_open', kind: 'scan', f: B.organ0 - 6, gain: -30, p: {freq: 1500, dur: 0.6}});
  c.push({id: 'organ_dim', kind: 'flag', f: B.fail, gain: -26});
  c.push(...beats(B.organ0 - 4, B.lethal - 2, 86, -20, 'hb_c', 1));
  c.push({id: 'fibrillation', kind: 'fib', f: B.lethal - 2, dur: (B.sig0 + 4 - B.lethal) / FPS, gain: -21});
  c.push({id: 'heart_sense', kind: 'detect', f: B.lethal + 6, gain: -24});
  c.push({id: 'signal_run', kind: 'zip', f: B.sig0, dur: (B.sig1 - B.sig0) / FPS, gain: -32});
  c.push({id: 'warn_land', kind: 'alarm', f: B.red - 1, gain: -20});
  // ---- the countdown: restrained ticks on each displayed second, only while the band's face is on screen
  for (let f = 1; f < B.map0; f++) {
    if (!faceOnScreen(f)) continue;
    if (Math.ceil(countdown3(f) - 1e-6) !== Math.ceil(countdown3(f - 1) - 1e-6)) c.push({id: `tick${f}`, kind: 'clock', f, gain: -29});
  }
  c.push(...beats(B.red + 4, B.map0, 112, -25, 'hb_d', 0.95, 0.12));
  c.push({id: 'crit_breath', kind: 'file', f: B.crit0 + 2, gain: -28, p: {file: 'breath_2_C4k8MIkY48irqu90gUzx.mp3', offset: 0.05}});
  c.push({id: 'grass_grip', kind: 'rustle', f: B.crit0 + 4, dur: 0.45, gain: -30});
  // ---- transmission and dispatch
  c.push({id: 'send', kind: 'send', f: B.tx0, gain: -20});
  c.push({id: 'map_data', kind: 'data', f: B.map0, dur: 0.65, gain: -30});
  c.push({id: 'hosp_receive', kind: 'receive', f: B.dock, gain: -24});
  c.push({id: 'latch', kind: 'click', f: B.latch, gain: -22, p: {freq: 1500}});
  c.push({id: 'latch_servo', kind: 'servo', f: B.latch + 1, dur: 0.25, gain: -27, p: {f0: 700, f1: 1100}});
  c.push({id: 'rotor_lift', kind: 'rotor', f: B.latch + 2, dur: (B.travel0 - B.latch - 2) / FPS, gain: -23, p: {spinup: 1, pan: 0, panTo: 0.35}});
  c.push({id: 'rotor_cross', kind: 'rotor', f: B.travel0, dur: (B.past0 + 6 - B.travel0) / FPS, gain: -24, p: {pass: 1, pan: -0.6, panTo: 0.6}});
  c.push({id: 'trunk_past', kind: 'swish', f: B.past0 + 1, dur: 0.45, gain: -27});
  c.push({id: 'rotor_arrive', kind: 'rotor', f: B.past0 + 6, dur: (B.act0 + 4 - B.past0 - 6) / FPS, gain: -24, p: {approach: 1, pan: -0.5, panTo: -0.15}});
  c.push({id: 'rotor_hover', kind: 'rotor', f: B.act0 + 4, dur: (B.green + 40 - B.act0 - 4) / FPS, gain: -33, p: {hover: 1, pan: -0.15, panTo: -0.4}});
  c.push({id: 'rotor_texture', kind: 'file', f: B.past0 + 10, gain: -34, p: {file: 'drone_1_f7S5LI3HdTlvGoa1G6Fp.mp3', offset: 0}});
  c.push({id: 'link', kind: 'blip', f: B.arrive - 2, gain: -27, p: {freq: 990}});
  // ---- treatment: the case turns, the port presses, one blue pulse, the wave, the heart settles, the timer holds
  c.push({id: 'tilt2', kind: 'swish', f: B.act0 + 2, dur: 0.35, gain: -27});
  c.push({id: 'port_out2', kind: 'servo', f: B.inject0 - 8, dur: 0.25, gain: -24, p: {f0: 1400, f1: 2100}});
  c.push({id: 'inject', kind: 'inject', f: B.inject0, gain: -21});
  c.push({id: 'treat_wave', kind: 'wave', f: B.inject0 + 10, dur: 1.2, gain: -23});
  c.push({id: 'held', kind: 'confirm', f: B.hold + 1, gain: -25});
  c.push({id: 'fib_fade', kind: 'fib', f: B.settleHeart0, dur: 0.6, gain: -26});
  c.push(...beats(B.settleHeart0 + 18, B.release0 + 30, 84, -20, 'hb_e', 0.9));
  // ---- recovery: a long breath out, the fingers release, the push, he sits, green
  c.push({id: 'deep_breath', kind: 'file', f: B.release0 - 2, gain: -24, p: {file: 'recover_breath_3_u0kMmd94TJjSZjKOuzAH.mp3', offset: 0}});
  c.push({id: 'fingers_release', kind: 'rustle', f: B.release0 + 2, dur: 0.3, gain: -33});
  c.push({id: 'load', kind: 'pat', f: B.release0 + 12, gain: -27});
  c.push({id: 'push_up', kind: 'rustle', f: B.rise0, dur: 0.9, gain: -30});
  c.push({id: 'sit_settle', kind: 'thud', f: B.rise1 - 2, gain: -29, p: {weight: 0.3}});
  c.push({id: 'recover_breath', kind: 'file', f: B.rise1 + 6, gain: -28, p: {file: 'recover_breath_1_tFCDclpcmymiy0MdhNUi.mp3', offset: 0}});
  c.push(...beats(B.release0 + 34, B.return0, 72, -27, 'hb_f', 0.8));
  c.push({id: 'green', kind: 'chime', f: B.green + 2, gain: -24});
  // ---- the question: one local glitch on the band; the red callback returns quietly (the transient is frame 0)
  c.push({id: 'glitch', kind: 'glitch', f: B.glitch, dur: B.glitchLen / FPS, gain: -22});
  c.push({id: 'callback_hum', kind: 'buzz', f: B.callback + 2, dur: 0.25, gain: -33});
  c.push(...beats(B.callback - 2, TOTAL, 118, -24, 'hb_g', 1));
  return c.sort((a, b) => a.f - b.f);
};

/** Music sections (seconds). The bed is cyclic: the tension that ends the film is the tension that opens it. */
export const musicPlan = () => ({
  total: TOTAL / FPS,
  bpm: 100,
  journeyFrom: B.tip0 / FPS,
  urgentFrom: (B.lethal - 6) / FPS,
  rescueFrom: (B.tx0 - 2) / FPS,
  releaseFrom: (B.hold + 4) / FPS,
  thinFrom: (B.uneasy0 - 4) / FPS,
  glitchAt: B.glitch / FPS,
  glitchEnd: (B.glitch + B.glitchLen) / FPS,
  callbackAt: B.callback / FPS,
});
