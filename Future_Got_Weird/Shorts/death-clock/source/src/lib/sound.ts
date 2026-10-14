// The sound cue list, derived from the SAME constants as the picture (shot table, device states, word
// times). scripts/export_cues.ts writes it to audio/cues.json; tools/build_audio.py renders it.
// Arc: dry heartbeat + breath -> collapse -> wrist whoosh -> mechanism -> flow -> scans -> irregular heart
// -> alarm pair + restrained clock ticks -> transmission pulse (music turns toward hope) -> dispatch,
// rotors with Doppler -> injection click + confirmation -> breathing, a regular pulse returns ->
// unsettling sustained note -> one short glitch -> restrained resolution.
import {DEV, countdownSecs} from './device';
import {fE, fS, FPS, SHOT, TOTAL} from './timeline';

export type Cue = {id: string; kind: string; f: number; gain: number; dur?: number; p?: Record<string, number | string>};

const beats = (from: number, to: number, bpm: number, gain: number, id: string, tone = 1): Cue[] => {
  const out: Cue[] = [];
  const step = (60 / bpm) * FPS;
  for (let f = from, k = 0; f < to; f += step, k++) out.push({id: `${id}${k}`, kind: 'heartbeat', f: Math.round(f), gain, p: {tone}});
  return out;
};

export const soundCues = (): Cue[] => {
  const c: Cue[] = [];
  // S01-S02: the collapse
  c.push(...beats(0, 58, 118, -14, 'hb_a', 1));
  c.push({id: 'breath_catch', kind: 'file', f: 0, gain: -24, p: {file: 'breath_1_i0TXGqFeHqkEpFKKUdQf.mp3', offset: 0.0}});
  c.push({id: 'rustle', kind: 'rustle', f: 6, dur: 0.7, gain: -30});
  c.push({id: 'dog_whine', kind: 'file', f: 36, gain: -27, p: {file: 'dog_3_JB8U4frHpRyLaM7eJciP.mp3', offset: 0.13}});
  c.push({id: 'knees', kind: 'thud', f: 33, gain: -20, p: {weight: 0.6}});
  c.push({id: 'body_fall', kind: 'file', f: 48, gain: -15, p: {file: 'fall_4_9ukhH99iVXpBejeIoCqn.mp3', offset: 0.32}});
  c.push({id: 'body_thud', kind: 'thud', f: 48, gain: -18, p: {weight: 1}});
  // S03: one motivated wrist-dive whoosh, a UI pulse on landing, the slight red edge, the dive through the glass
  c.push({id: 'wrist_whoosh', kind: 'whoosh', f: 51, dur: 0.33, gain: -17});
  c.push({id: 'ui_land', kind: 'blip', f: 61, gain: -24, p: {freq: 880}});
  c.push({id: 'strained_exhale', kind: 'file', f: 80, gain: -27, p: {file: 'breath_4_y9jk69O2KtRNTZPOiz8T.mp3', offset: 0.3}});
  c.push(...beats(60, SHOT.s03[1] - 8, 104, -22, 'hb_b', 0.9));
  c.push({id: 'edge_warble', kind: 'warble', f: DEV.edgeIn, dur: (SHOT.s03[1] - 12 - DEV.edgeIn) / FPS, gain: -31});
  c.push({id: 'glass_dive', kind: 'dive', f: SHOT.s03[1] - 14, dur: 0.6, gain: -20});
  // S04: the needles, the beads
  c.push({id: 'needle_click', kind: 'click', f: fS('injecting') - 7, gain: -21, p: {freq: 2400}});
  c.push({id: 'needle_seat', kind: 'click', f: fS('injecting') - 1, gain: -23, p: {freq: 1700}});
  c.push({id: 'bead_ticks', kind: 'ticks', f: fS('injecting'), dur: 2.6, gain: -28, p: {rate: 34}});
  // S05-S06: bloodstream flow, scans, a decaying cell flagged
  c.push({id: 'flow', kind: 'flow', f: SHOT.s05[0] - 4, dur: (SHOT.s06[1] - SHOT.s05[0] + 6) / FPS, gain: -27});
  [0, 1, 2, 3].forEach((j) => c.push({id: `scan${j}`, kind: 'scan', f: SHOT.s06[0] + 30 + j * 4, gain: -23 - j, p: {freq: 1760 + j * 110}}));
  c.push({id: 'decay_detect', kind: 'detect', f: fS('decay') + 2, gain: -21});
  // S07: organs flagged, heart regular -> lethal rhythm, signal runs to the band
  c.push({id: 'organ_flag', kind: 'flag', f: fS('fail') - 2, gain: -25});
  c.push(...beats(fS('heart') - 10, fS('lethal') - 2, 96, -16, 'hb_c', 1));
  c.push({id: 'fibrillation', kind: 'fib', f: fS('lethal') - 2, dur: (SHOT.s07[1] - fS('lethal')) / FPS, gain: -18});
  c.push({id: 'signal_zip', kind: 'zip', f: SHOT.s07[1] - 26, dur: 0.85, gain: -22});
  // S08-S09: crimson, alarm pair, restrained clock ticks on every displayed second
  c.push({id: 'alarm_pair', kind: 'alarm', f: DEV.redAt - 5, gain: -16});
  for (let f = DEV.timerAt + 1; f <= DEV.freezeAt; f++) {
    if (Math.ceil(countdownSecs(f) - 1e-6) !== Math.ceil(countdownSecs(f - 1) - 1e-6)) {
      const inMontage = f >= DEV.compress0 && f < DEV.compress1;
      const inMap = f >= SHOT.s11[0] && f < SHOT.s13[0];
      c.push({id: `tick${f}`, kind: 'clock', f, gain: inMap ? -33 : inMontage ? -31 : -25});
    }
  }
  // S10: one transmission pulse, the signal rises
  c.push({id: 'transmit', kind: 'send', f: DEV.alertAt - 2, gain: -16});
  c.push({id: 'rise_sparkle', kind: 'sparkle', f: SHOT.s10[1] - 18, dur: 0.6, gain: -24});
  // S11: pin, data packet, dispatch click, rotors spin up and lift
  c.push({id: 'pin_drop', kind: 'pin', f: SHOT.s11[0] + 2, gain: -20});
  c.push({id: 'data', kind: 'data', f: SHOT.s11[0] + 12, dur: 0.95, gain: -27});
  c.push({id: 'dispatch', kind: 'dispatch', f: SHOT.s11[0] + 42, gain: -19});
  c.push({id: 'rotor_lift', kind: 'rotor', f: SHOT.s11[0] + 46, dur: (SHOT.s11[1] - SHOT.s11[0] - 46) / FPS, gain: -21, p: {spinup: 1, approach: 0, hover: 0}});
  // S12: the drone crosses the same street and slows to hover (restrained Doppler)
  c.push({id: 'rotor_approach', kind: 'rotor', f: SHOT.s12[0], dur: (SHOT.s12[1] - SHOT.s12[0]) / FPS, gain: -23, p: {spinup: 0, approach: 1, hover: 0}});
  c.push({id: 'rotor_texture', kind: 'file', f: SHOT.s12[0] + 20, gain: -32, p: {file: 'drone_1_f7S5LI3HdTlvGoa1G6Fp.mp3', offset: 0}});
  // S13-S14: hovering nearby, the injection, confirmation, breathing, a regular pulse returns
  c.push({id: 'rotor_hover', kind: 'rotor', f: SHOT.s13[0], dur: (SHOT.s15[0] - SHOT.s13[0]) / FPS, gain: -31, p: {spinup: 0, approach: 0, hover: 1}});
  c.push({id: 'inject_click', kind: 'inject', f: DEV.injectAt, gain: -21});
  c.push({id: 'stabilized', kind: 'confirm', f: DEV.freezeAt, gain: -21});
  // clothing on grass as he pushes up and swings his legs round to sit
  c.push({id: 'rustle_push', kind: 'rustle', f: SHOT.s14[0] + 4, dur: 0.6, gain: -31});
  c.push({id: 'rustle_sit', kind: 'rustle', f: SHOT.s14[0] + 22, dur: 0.8, gain: -30});
  c.push({id: 'recover_breath_a', kind: 'file', f: SHOT.s14[0] + 2, gain: -24, p: {file: 'recover_breath_3_u0kMmd94TJjSZjKOuzAH.mp3', offset: 0}});
  c.push({id: 'recover_breath_b', kind: 'file', f: SHOT.s14[0] + 52, gain: -26, p: {file: 'recover_breath_1_tFCDclpcmymiy0MdhNUi.mp3', offset: 0}});
  c.push(...beats(SHOT.s14[0] + 30, SHOT.s15[0] + 20, 70, -27, 'hb_d', 0.8));
  c.push({id: 'green_chime', kind: 'chime', f: DEV.recoverAt, gain: -22});
  // S15-S16: the uncomfortable question, one glitch, restrained resolution
  c.push({id: 'glitch', kind: 'glitch', f: DEV.glitchAt, dur: DEV.glitchLen / FPS, gain: -17});
  return c.sort((a, b) => a.f - b.f);
};

/** Music sections (seconds) for the procedural bed. */
export const musicPlan = () => ({
  total: TOTAL / FPS,
  tensionEnd: DEV.alertAt / FPS, // dark minor bed with a pulse under the crisis
  swellAt: DEV.redAt / FPS, // the bed tightens when the screen turns crimson
  hopeFrom: (DEV.alertAt - 4) / FPS, // turns toward hope as the alert goes out
  thinFrom: SHOT.s14[0] / FPS, // thins out for the recovery
  unsettleFrom: (fS('But if the countdown') - 6) / FPS, // one unsettling sustained note under the question
  glitchAt: DEV.glitchAt / FPS,
  resolveFrom: (DEV.glitchAt + DEV.glitchLen) / FPS,
  lastWordEnd: fE('want to know') / FPS,
});
