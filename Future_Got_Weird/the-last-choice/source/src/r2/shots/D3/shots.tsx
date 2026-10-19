// Section D3 shots: physical cameras (cams.ts) on one battle (battle.tsx), film seconds in times.ts SH3. Low
// three-quarter views at eye height on the ground; the topple and the formation are wides. Screen direction: the enemy
// is east (screen right) except where a shot re-establishes it. Exchange sheet: production/R3_EXCHANGES.md ## D3.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import type {Item} from '../../engine';
import {toView} from '../../engine';
import {smooth} from '../../../kit/math';
import {d3Items, d3FxAt, D3Opts} from './battle';
import {fadeItems} from './fx';
import {SH3} from './times';
import {GaugeCU} from './gaugecu';
import {
  CamFn, CAM_1, CAM_1b, CAM_2, CAM_3a, CAM_3b, CAM_4a, CAM_4b, CAM_5, CAM_6, CAM_7a, CAM_7b, CAM_7c, CAM_8, CAM_9, CAM_10a, CAM_10b, CAM_10c,
  CAM_11a, push11a, CAM_11c, CAM_11d, CAM_11e,
} from './cams';

/** smoke and dust puffs fade out as they reach the lens (no screen-filling veil from a puff a metre away) */
const SMOKE = /(^d3dust|^d3wave|_sm_|^d3flare_tr|_wave_d|_wisp|_dust)/;
const nearFade = (items: Item[], re: RegExp = SMOKE): Item[] => items.map((it) => {
  if (it.kind !== 'sprite' || !it.key || !re.test(it.key)) return it;
  const draw = it.draw;
  return {...it, draw: (c) => {
    const a = smooth((toView(c.view, it.pos).z - 1.5) / 4.0);
    if (a < 0.02) return null;
    const el = draw(c);
    return a > 0.98 || !el ? el : <g opacity={a.toFixed(3)}>{el}</g>;
  }};
});
const shot = (start: number, cam: CamKey[] | CamFn, o: (T: number) => D3Opts = () => ({}), drift = 0.018, ease = 0.6, smoke = 1, near: RegExp = SMOKE): React.FC => {
  const C: React.FC = () => {
    const {t, T} = useShotTime(start);
    const c = typeof cam === 'function' ? cam(t, T) : camPath(cam, t, ease);
    const f = d3FxAt(T);
    const fxItems = smoke < 1 ? fadeItems(f.items, smoke, SMOKE) : f.items;
    return <Stage T={T} cam={c} lights={f.lights} shake={f.shake} drift={drift} items={(v) => [...d3Items(v, T, o(T)), ...nearFade(fxItems, near)]} />;
  };
  return C;
};

// ---- X1 THE BLIND
// D3-1 (P3 116.92–119.55): the signal; the flare struck and thrown; the allied drone in its face; the swipe; the flash
export const D3_1 = shot(SH3.d31, CAM_1, () => ({full: 34}), 0.02);
// D3-1b (119.55–121.00): the three go down the slope at it; it halts blind
export const D3_1b = shot(SH3.d31b, CAM_1b, () => ({full: 32}), 0.018);
// ---- X2 THE PIN
// D3-2 (121.00–123.05): it swings round to the drone's whine; the clamp bites its front-left shin; the cable round post 3
export const D3_2 = shot(SH3.d32, CAM_2, () => ({full: 30}), 0.016);
// ---- X3 THE KNEE
// D3-3a (123.05–124.42): U8's hammer on the Director's plate; the press; it turns away: the plate into its back
export const D3_3a = shot(SH3.d33, CAM_3a, () => ({full: 30}), 0.018);
// D3-3b (124.42–125.64): the runner's hook, U8 down; the knee splits; R4's hammer on the beam; the dive back under it
export const D3_3b = shot(SH3.d33b, CAM_3b, () => ({full: 30}), 0.016);
// ---- X4 THE TOPPLE (HEAVY_DOWN 125.64–127.20) and the peak (127.20–128.02)
export const D3_4a = shot(SH3.d34a, CAM_4a, () => ({full: 34}), 0.012);
export const D3_4b = shot(SH3.d34b, CAM_4b, () => ({full: 30, near: true}), 0.014);
// ---- THE ADAPTATION
// D3-5 (ADAPT 128.02–131.02): a drone climbs out of the dust; the gimbal tilts; amber; the mark on the tablet
export const D3_5 = shot(SH3.d35, CAM_5, () => ({full: 24}), 0.0);
// D3-6 (FORMATION 131.02–133.82): high wide: the line behind the barrier splits and bends into the arc round the Crew
// (seen from 17 m up the low dust is thinner: drawn at 30 % so the formation reads)
export const D3_6 = shot(SH3.d36, CAM_6, () => ({full: 20, far: 140}), 0.0, 0.6, 0.3);
// D3-7a (DECOY_FAIL 133.82–135.30): the sketch, the tap, the tablet raised; the projector clicks; the figures
export const D3_7a = shot(SH3.d37a, CAM_7a, () => ({full: 30}), 0.014);
// D3-7b (135.30–136.15): the arc walks through the figures at the source; a drone drops out of the sky
export const D3_7b = shot(SH3.d37b, CAM_7b, () => ({full: 32}), 0.016);
// D3-7c (136.15–137.66): the drone into the tablet; she reels, her hand cut; the figures flicker out
export const D3_7c = shot(SH3.d37c, CAM_7c, () => ({full: 30}), 0.02);
// D3-8 (FLANK_DENIED 137.66–140.48): drones under the truss; the cutter; the cable snaps; she falls back; the wing over the slack
export const D3_8 = shot(SH3.d38, CAM_8, () => ({full: 30}), 0.018);
// D3-9 (ALLY_DRONE_LOST 140.48–142.36): the allied drone run down; it crashes smoking; the pilot and the dead controller
export const D3_9 = shot(SH3.d39, CAM_9, () => ({full: 30}), 0.02);
// ---- ESCALATION
// D3-10a (HEAVY2 142.36–143.40): heavy 2 at the barrier, a leg over heavy 1's wreck
export const D3_10a = shot(SH3.d310a, CAM_10a, () => ({full: 34}), 0.012);
// D3-10b (143.40–144.25): her, on her knees, looking up into the launcher; the Director sees it and runs
export const D3_10b = shot(SH3.d310b, CAM_10b, () => ({full: 30, near: true}), 0.012);
// D3-10c (144.25–145.18): he hauls her up and off the crest; heavy 2 over the wreck, its launcher on them
export const D3_10c = shot(SH3.d310c, CAM_10c, () => ({full: 32}), 0.014);
// D3-11a (HEAVY2_FIRE 145.18–146.30): wide: the round; the blast on the rim; they are thrown
export const D3_11a = shot(SH3.d311a, (t, T) => push11a(camPath(CAM_11a, t, 0.6), t, T), () => ({full: 32}), 0.02);
// D3-11b (146.30–147.00): insert (gaugecu.tsx, a drawn close-up like EF's clasp): the breaker's gauge from his eyes:
// the needle sinks onto the stop; his thumb knocks the glass twice, presses, slides off. (CAM_11b stays the cue
// generator's listener for this insert.)
export const D3_11b: React.FC = () => {
  const {t, T} = useShotTime(SH3.d311b);
  return <AbsoluteFill style={{background: '#000'}}><GaugeCU t={t} T={T} /></AbsoluteFill>;
};
// D3-11c (147.00–147.70): insert: the flare carrier lifts his head: the brow cut
export const D3_11c = shot(SH3.d311c, CAM_11c, () => ({full: 30, near: true}), 0.01);
// D3-11d (147.70–148.50): the Director up, the cut lip; a glance back east at the heavy, and he goes
export const D3_11d = shot(SH3.d311d, CAM_11d, () => ({full: 30}), 0.016);
// D3-11e (148.50–149.86): they fall back west among D1's wrecks into D4's start
export const D3_11e = shot(SH3.d311e, CAM_11e, () => ({full: 32}), 0.018);
