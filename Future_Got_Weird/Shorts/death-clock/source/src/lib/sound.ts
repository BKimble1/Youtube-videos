// V2 sound cues, derived from the SAME beat table as the picture (lib/timeline.ts B) and the device states.
// scripts/export_cues.ts writes them to audio/cues.json; tools/build_audio_v2.py renders them.
// Treatment follows the brief: restrained fall Foley; one swish and a small mechanism for the reveal; a delicate
// stream and flow with a few close passes; a pulse-rhythm change, one sensing response and a concise warning
// pair; ticks only while the band is on screen; a distinct blue send/receive; rotors that follow the drone's
// screen position and distance; actuator, pulse, breath and ground contact for the treatment and recovery; the
// music thins under the question, one small local glitch, a short low ending. No whoosh on every cut.
import {DEV, countdownSecs} from './device';
import {B, fE, fS, FPS, TOTAL} from './timeline';

export type Cue = {id: string; kind: string; f: number; gain: number; dur?: number; p?: Record<string, number | string>};

const beats = (from: number, to: number, bpm: number, gain: number, id: string, tone = 1, jitter = 0): Cue[] => {
  const out: Cue[] = [];
  const step = (60 / bpm) * FPS;
  let k = 0;
  for (let f = from; f < to; f += step * (1 + (jitter ? Math.sin(k * 2.7) * jitter : 0)), k++) out.push({id: `${id}${k}`, kind: 'heartbeat', f: Math.round(f), gain, p: {tone}});
  return out;
};

export const soundCues = (): Cue[] => {
  const c: Cue[] = [];
  // ---- collapse: breath catch, fabric, a scuff as the knee buckles, knees, the hand braces, he settles
  c.push(...beats(0, B.fallEnd + 6, 118, -17, 'hb_a', 1));
  c.push({id: 'breath_catch', kind: 'file', f: 0, gain: -23, p: {file: 'breath_1_i0TXGqFeHqkEpFKKUdQf.mp3', offset: 0.0}});
  c.push({id: 'rustle', kind: 'rustle', f: 6, dur: 0.6, gain: -32});
  c.push({id: 'scuff', kind: 'scuff', f: 20, gain: -28});
  c.push({id: 'knees', kind: 'thud', f: 34, gain: -21, p: {weight: 0.55}});
  c.push({id: 'dog_whine', kind: 'file', f: 38, gain: -29, p: {file: 'dog_3_JB8U4frHpRyLaM7eJciP.mp3', offset: 0.13}});
  c.push({id: 'hand_brace', kind: 'pat', f: 47, gain: -24});
  c.push({id: 'body_settle', kind: 'file', f: 50, gain: -21, p: {file: 'fall_4_9ukhH99iVXpBejeIoCqn.mp3', offset: 0.32}});
  c.push({id: 'body_thud', kind: 'thud', f: 51, gain: -22, p: {weight: 0.8}});
  c.push({id: 'strained_exhale', kind: 'file', f: B.medium + 6, gain: -29, p: {file: 'breath_4_y9jk69O2KtRNTZPOiz8T.mp3', offset: 0.3}});
  c.push(...beats(B.fallEnd + 6, B.tip0, 104, -24, 'hb_b', 0.9));
  // ---- the device: one precise swish as the camera tips round the wrist, the case opening, the port
  c.push({id: 'tip_swish', kind: 'swish', f: B.tip0 - 2, dur: 0.42, gain: -22});
  c.push({id: 'case_open', kind: 'servo', f: B.open0 + 2, dur: 0.45, gain: -27, p: {f0: 900, f1: 1300}});
  c.push({id: 'case_latch', kind: 'click', f: B.open1 - 4, gain: -27, p: {freq: 1900}});
  c.push({id: 'port_out', kind: 'servo', f: B.port0, dur: 0.3, gain: -25, p: {f0: 1400, f1: 2100}});
  c.push({id: 'port_touch', kind: 'click', f: B.port1, gain: -23, p: {freq: 2600}});
  c.push({id: 'stream', kind: 'ticks', f: B.stream0, dur: (B.stream1 - B.stream0) / FPS, gain: -30, p: {rate: 30}});
  c.push({id: 'port_back', kind: 'servo', f: B.retract0, dur: 0.3, gain: -29, p: {f0: 2100, f1: 1300}});
  // ---- the bloodstream: low flow texture, a few close passes, the hero's sensing and its local signal
  c.push({id: 'flow', kind: 'flow', f: B.stream0 + 20, dur: (B.pull0 + 14 - B.stream0 - 20) / FPS, gain: -27});
  [B.dive1 - 14, B.dive1 + 44, B.dive1 + 70].forEach((f, i) => c.push({id: `pass${i}`, kind: 'pass', f, gain: -28 - i, p: {pan: [-0.4, 0.3, -0.2][i]}}));
  c.push({id: 'hero_mark', kind: 'blip', f: B.heroRing, gain: -27, p: {freq: 1320}});
  c.push({id: 'wall_scan', kind: 'scan', f: B.wall0 + 14, gain: -27, p: {freq: 1760}});
  c.push({id: 'decay_detect', kind: 'detect', f: B.decay + 2, gain: -23});
  c.push({id: 'hero_signal', kind: 'ring', f: B.signal0, gain: -25});
  c.push({id: 'pull_back', kind: 'swish', f: B.pull0 + 4, dur: 0.6, gain: -27});
  // ---- organ, heart: a regular pulse, one organ dims, the rhythm breaks, one sensing response, the warning pair
  c.push({id: 'organ_dim', kind: 'flag', f: B.fail - 2, gain: -27});
  c.push(...beats(B.organ0 - 6, B.lethal - 2, 84, -18, 'hb_c', 1));
  c.push({id: 'fibrillation', kind: 'fib', f: B.lethal - 2, dur: (B.sig0 + 8 - B.lethal) / FPS, gain: -19});
  c.push({id: 'heart_sense', kind: 'detect', f: B.lethal + 6, gain: -24});
  c.push({id: 'signal_run', kind: 'zip', f: B.sig0, dur: (B.sig1 - B.sig0) / FPS, gain: -25});
  c.push({id: 'alarm_pair', kind: 'alarm', f: DEV.redAt - 1, gain: -18});
  // ---- the countdown: restrained ticks on each displayed second, only while the band is on screen
  for (let f = DEV.timerAt + 1; f <= DEV.freezeAt; f++) {
    const onScreen = f < B.map0 || (f >= B.treat0 && f < B.treat0 + 10);
    if (!onScreen) continue;
    if (Math.ceil(countdownSecs(f) - 1e-6) !== Math.ceil(countdownSecs(f - 1) - 1e-6)) c.push({id: `tick${f}`, kind: 'clock', f, gain: f < B.eyes0 ? -26 : -30});
  }
  c.push({id: 'timer_land', kind: 'blip', f: DEV.timerAt, gain: -24, p: {freq: 660}});
  c.push({id: 'eyes_open', kind: 'file', f: B.eyes0, gain: -27, p: {file: 'breath_2_C4k8MIkY48irqu90gUzx.mp3', offset: 0.05}});
  c.push({id: 'wrist_turn', kind: 'rustle', f: B.turn0, dur: 0.5, gain: -33});
  c.push({id: 'clench', kind: 'rustle', f: B.clench0, dur: 0.25, gain: -32});
  c.push({id: 'diag', kind: 'data', f: B.diag0, dur: (B.diag1 - B.diag0) / FPS, gain: -32});
  // ---- transmission and dispatch: a distinct blue send, the ring, the hub receives, the pin, the route, the data
  c.push({id: 'send', kind: 'send', f: B.alert - 1, gain: -19});
  c.push({id: 'ring_out', kind: 'swish', f: B.ring, dur: 0.7, gain: -26});
  c.push({id: 'hub_receive', kind: 'receive', f: B.hub, gain: -21});
  c.push({id: 'pin_drop', kind: 'pin', f: B.route0 + 2, gain: -22});
  c.push({id: 'route', kind: 'data', f: B.route0 + 6, dur: (B.route1 - B.route0 - 12) / FPS, gain: -31});
  c.push({id: 'data_dock', kind: 'dispatch', f: B.data1 - 2, gain: -26});
  // ---- the drone: spin-up and lift (centre, then away to the right), crossing (left to right with Doppler),
  //      arrival from the left to overhead, hover (muffled inside the section), backing off as he sits up
  c.push({id: 'rotor_lift', kind: 'rotor', f: B.lift0, dur: (B.travel0 - B.lift0) / FPS, gain: -24, p: {spinup: 1, pan: 0, panTo: 0.45}});
  c.push({id: 'rotor_cross', kind: 'rotor', f: B.travel0, dur: (B.arrive0 - B.travel0) / FPS, gain: -24, p: {pass: 1, pan: -0.7, panTo: 0.7}});
  c.push({id: 'rotor_arrive', kind: 'rotor', f: B.arrive0, dur: (B.treat0 + 10 - B.arrive0) / FPS, gain: -24, p: {approach: 1, pan: -0.5, panTo: 0}});
  c.push({id: 'rotor_hover', kind: 'rotor', f: B.treat0 + 10, dur: (B.end0 + 12 - B.treat0 - 10) / FPS, gain: -32, p: {hover: 1, pan: 0, panTo: 0.5}});
  c.push({id: 'rotor_texture', kind: 'file', f: B.arrive0 + 4, gain: -34, p: {file: 'drone_1_f7S5LI3HdTlvGoa1G6Fp.mp3', offset: 0}});
  // ---- treatment: the drone's light locks on, the actuator, one blue pulse, the wave, the timer is held
  c.push({id: 'beam_lock', kind: 'blip', f: B.arrive0 + 10, gain: -26, p: {freq: 990}});
  c.push({id: 'tip_swish2', kind: 'swish', f: B.treat0 + 8, dur: 0.35, gain: -25});
  c.push({id: 'port_out2', kind: 'servo', f: B.treat0 + 18, dur: 0.25, gain: -24, p: {f0: 1400, f1: 2100}});
  c.push({id: 'treat_pulse', kind: 'inject', f: B.treat0 + 23, gain: -21});
  c.push({id: 'treat_wave', kind: 'wave', f: B.freeze - 2, dur: 1.1, gain: -23});
  c.push({id: 'held', kind: 'confirm', f: DEV.freezeAt + 2, gain: -25});
  // ---- recovery: a deep breath, the hand meets the grass, the elbow takes weight, cloth, a calmer pulse, green
  c.push({id: 'deep_breath', kind: 'file', f: B.out0 - 2, gain: -24, p: {file: 'recover_breath_3_u0kMmd94TJjSZjKOuzAH.mp3', offset: 0}});
  c.push({id: 'hand_grass', kind: 'pat', f: B.sit0 + 2, gain: -24});
  c.push({id: 'elbow_load', kind: 'rustle', f: B.sit0 + 6, dur: 0.5, gain: -31});
  c.push({id: 'push_up', kind: 'rustle', f: B.sit0 + 22, dur: 0.9, gain: -30});
  c.push({id: 'sit_settle', kind: 'thud', f: B.sit1 - 4, gain: -28, p: {weight: 0.35}});
  c.push({id: 'recover_breath', kind: 'file', f: B.sit0 + 40, gain: -27, p: {file: 'recover_breath_1_tFCDclpcmymiy0MdhNUi.mp3', offset: 0}});
  c.push(...beats(B.sit0 + 4, B.end0 + 30, 72, -27, 'hb_d', 0.8));
  c.push({id: 'green', kind: 'chime', f: DEV.recoverAt, gain: -25});
  // ---- the question: one small local glitch on the band; a low final pulse as it dips to black
  c.push({id: 'glitch', kind: 'glitch', f: DEV.glitchAt, dur: DEV.glitchLen / FPS, gain: -21});
  c.push({id: 'last_beat', kind: 'heartbeat', f: B.dip0 - 2, gain: -21, p: {tone: 0.85}});
  return c.sort((a, b) => a.f - b.f);
};

/** Music sections (seconds) for the procedural bed. */
export const musicPlan = () => ({
  total: TOTAL / FPS,
  enter: 0.9, // dry heartbeat and breath first
  journeyFrom: B.tip0 / FPS, // curious bed with a forward pulse under the body journey
  urgentFrom: (B.lethal - 6) / FPS, // urgency rises at the warning
  redAt: DEV.redAt / FPS,
  rescueFrom: (B.alert - 2) / FPS, // forward motion through the dispatch and rescue
  releaseFrom: (B.freeze + 6) / FPS, // a small release as the treatment takes
  thinFrom: (fS('But if the countdown') - 4) / FPS, // thin, uncertain under the question
  glitchAt: DEV.glitchAt / FPS,
  glitchEnd: (DEV.glitchAt + DEV.glitchLen) / FPS,
  lastWordEnd: fE('want to know') / FPS,
  dipFrom: B.dip0 / FPS,
});
