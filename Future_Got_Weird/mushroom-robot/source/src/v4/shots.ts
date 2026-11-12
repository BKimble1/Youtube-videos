// V4 edit: 23 shots, each cut on a measured word or action. 'A' shots look at the one robot rig through a camera that
// follows the walker (smoothed centre and heading) at a set relative angle; 'B' shots look at the one fungal network
// (scaffold-disc coordinates). Inside a shot the camera eases between its start and end; between shots it cuts.
import {V3, v3, lerp, ss} from '../lib';
import {DUR} from './timing';
import {smoothCentre, smoothHeading} from './robot';
import {Cam, H} from './cam';

export type ACam = {yaw: number; pitch: number; dist: number; up: number; fov: number; fwd?: number; side?: number};
export type BCam = {cx: number; cy: number; s: number; rot?: number};
export type Shot = {t0: number; t1: number; name: string; purpose: string} & (
  {kind: 'A'; a: ACam; b: ACam} | {kind: 'B'; a: BCam; b: BCam; follow?: 'chain' | 'pulse'});
// relative yaw: 0 = in front of the walker; leg i points at i*72 deg (0 = front, 144 = leg 2, rear left)
const legT = (i: number, r: number) => ({fwd: r * Math.cos((i * 72 * Math.PI) / 180), side: r * Math.sin((i * 72 * Math.PI) / 180)});
const OPEN: ACam = {yaw: 34, pitch: 17, dist: 31, up: 0.4, fov: 46};
export const SHOTS: Shot[] = [
  {t0: 0, t1: 1.2, name: 'S1 close hook', purpose: 'payoff: the robot already walking, legs actuating, culture in the dome', kind: 'A', a: OPEN, b: {yaw: 28, pitch: 13, dist: 25, up: 0.5, fov: 46}},
  {t0: 1.2, t1: 2.75, name: 'S2 elevated full body', purpose: 'whole machine in one coordinated step', kind: 'A', a: {yaw: -40, pitch: 52, dist: 40, up: 0, fov: 46}, b: {yaw: -48, pitch: 50, dist: 37, up: 0, fov: 46}},
  {t0: 2.75, t1: 3.98, name: 'S3 living hyphae (macro)', purpose: 'it is a living fungus: hyphae with streaming cytoplasm and growing tips', kind: 'B', a: {cx: -0.42, cy: -0.1, s: 1500, rot: 0.5}, b: {cx: -0.36, cy: -0.02, s: 1250, rot: 0.42}},
  {t0: 3.98, t1: 5.33, name: 'S4 fungal interface', purpose: 'scale: the network grown across the scaffold and over two electrodes', kind: 'B', a: {cx: 0, cy: 0.05, s: 420}, b: {cx: 0, cy: 0.1, s: 285}},
  {t0: 5.33, t1: 6.69, name: 'S5 into the electronics', purpose: 'the electrode leads run into the robot\'s controller', kind: 'B', a: {cx: 0.1, cy: 1.0, s: 360}, b: {cx: 0.2, cy: 2.55, s: 360}},
  {t0: 6.69, t1: 7.83, name: 'S6 electrical activity', purpose: 'a spike travels along existing branches', kind: 'B', a: {cx: 0, cy: 0.1, s: 520}, b: {cx: 0.05, cy: 0.25, s: 560}},
  {t0: 7.83, t1: 8.4, name: 'S7 signal capture', purpose: 'the spike arrives at the electrode (8.05)', kind: 'B', a: {cx: 0.12, cy: 0.6, s: 1050}, b: {cx: 0.15, cy: 0.72, s: 1150}},
  {t0: 8.4, t1: 9.1, name: 'S8 signal processing', purpose: 'down the lead, through the controller, the valve opens', kind: 'B', a: {cx: 0.26, cy: 1.7, s: 330}, b: {cx: 0.26, cy: 4.4, s: 330}, follow: 'chain'},
  {t0: 9.1, t1: 10.13, name: 'S9 leg deforms', purpose: 'air arrives: leg 3 inflates and curls (effect of S8)', kind: 'A', a: {yaw: 138, pitch: 16, dist: 15, up: 1.4, fov: 44, ...legT(3, 3.6)}, b: {yaw: 146, pitch: 17, dist: 14, up: 1.4, fov: 44, ...legT(3, 3.6)}},
  {t0: 10.13, t1: 11.0, name: 'S10 locomotion proof', purpose: 'the whole robot completes the step and wobbles', kind: 'A', a: {yaw: -96, pitch: 14, dist: 32, up: 1.2, fov: 46}, b: {yaw: -92, pitch: 15, dist: 30, up: 1.2, fov: 46}},
  {t0: 11.0, t1: 11.84, name: 'S11 foot contact', purpose: 'soft leg setting down on the mat', kind: 'A', a: {yaw: 124, pitch: 9, dist: 12.5, up: 0.2, fov: 44, ...legT(1, 6.0)}, b: {yaw: 120, pitch: 9, dist: 12, up: 0.2, fov: 44, ...legT(1, 6.0)}},
  {t0: 11.84, t1: 12.89, name: 'S12 UV lamp', purpose: 'the UV source swings in and clicks on (12.51)', kind: 'A', a: {yaw: -120, pitch: 6, dist: 30, up: 5.0, fov: 54}, b: {yaw: -116, pitch: 7, dist: 28, up: 4.6, fov: 54}},
  {t0: 12.89, t1: 14.74, name: 'S13 network under UV, signal changes', purpose: 'the lit network; spikes become bursts on several branches', kind: 'B', a: {cx: 0, cy: 0.05, s: 470}, b: {cx: 0.1, cy: 0.55, s: 820}},
  {t0: 14.74, t1: 15.69, name: 'S14 changed gait', purpose: 'paired, faster, higher steps', kind: 'A', a: {yaw: -84, pitch: 9, dist: 27, up: 1.4, fov: 48}, b: {yaw: -80, pitch: 10, dist: 26, up: 1.4, fov: 48}},
  {t0: 15.69, t1: 17.0, name: 'S15 overhead comparison', purpose: 'from above: paired gait under the lamp, back to the ripple when it goes off (16.12)', kind: 'A', a: {yaw: -60, pitch: 84, dist: 44, up: 0, fov: 46}, b: {yaw: -50, pitch: 84, dist: 42, up: 0, fov: 46}},
  {t0: 17.0, t1: 18.58, name: 'S16 no brain', purpose: 'the "control centre" is a dish of fungus and two wires; the legs give way (17.92)', kind: 'A', a: {yaw: 150, pitch: 62, dist: 15, up: 0.5, fov: 42}, b: {yaw: 160, pitch: 60, dist: 13, up: 0.3, fov: 42}},
  {t0: 18.58, t1: 19.39, name: 'S17 no eyes', purpose: 'low, head-on: a blank front walking at us', kind: 'A', a: {yaw: 2, pitch: 3, dist: 19, up: 1.0, fov: 46}, b: {yaw: 0, pitch: 3, dist: 17.5, up: 1.0, fov: 46}},
  {t0: 19.39, t1: 20.26, name: 'S18 shuffle', purpose: 'it marches in place and swings left', kind: 'A', a: {yaw: 40, pitch: 22, dist: 26, up: 0.8, fov: 46}, b: {yaw: 44, pitch: 22, dist: 25, up: 0.8, fov: 46}},
  {t0: 20.26, t1: 21.9, name: 'S19 no idea where', purpose: 'from high: swings right, then wanders off in a new direction', kind: 'A', a: {yaw: 150, pitch: 58, dist: 50, up: 0, fov: 46}, b: {yaw: 165, pitch: 60, dist: 54, up: 0, fov: 46}},
  {t0: 21.9, t1: 22.62, name: 'S20 pulse in the fungus', purpose: 'cause: a spike runs along a branch into an electrode (22.42)', kind: 'B', a: {cx: 0, cy: 0, s: 900}, b: {cx: 0, cy: 0, s: 950}, follow: 'pulse'},
  {t0: 22.62, t1: 23.36, name: 'S21 leg actuates', purpose: 'effect: a leg lifts and swings', kind: 'A', a: {yaw: -36, pitch: 15, dist: 15, up: 1.4, fov: 44, ...legT(4, 3.6)}, b: {yaw: -32, pitch: 16, dist: 14, up: 1.4, fov: 44, ...legT(4, 3.6)}},
  {t0: 23.36, t1: 24.78, name: 'S22 fungus to controller', purpose: 'the living network wired to its controller; a spike lights it (23.94)', kind: 'B', a: {cx: 0.15, cy: 1.15, s: 300}, b: {cx: 0.15, cy: 1.3, s: 270}},
  {t0: 24.78, t1: DUR, name: 'S23 hero to loop', purpose: 'the whole robot walking; eases into the opening framing (loop)', kind: 'A', a: {yaw: 78, pitch: 14, dist: 36, up: 1.2, fov: 46}, b: OPEN},
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
export const shotU = (s: Shot, t: number) => ss(s.t0, s.t1, t) * 0.75 + ((t - s.t0) / (s.t1 - s.t0)) * 0.25;
export const camA = (s: Shot & {kind: 'A'}, t: number): Cam => {
  const u = Math.min(1, Math.max(0, s === SHOTS[SHOTS.length - 1] ? (t - s.t0) / (s.t1 - s.t0) : shotU(s, t)));
  const ue = s === SHOTS[SHOTS.length - 1] ? u * u * (3 - 2 * u) * 0.5 + u * 0.5 : u;
  const g = (k: keyof ACam) => lerp((s.a[k] as number) ?? 0, (s.b[k] as number) ?? 0, ue);
  const th = smoothHeading(t), c = smoothCentre(t);
  const f: V3 = [Math.cos(th), 0, Math.sin(th)], sd: V3 = [-Math.sin(th), 0, Math.cos(th)];
  const target: V3 = v3.add(c, v3.add(v3.mul(f, g('fwd')), v3.add(v3.mul(sd, g('side')), [0, g('up'), 0])));
  const yaw = th + (g('yaw') * Math.PI) / 180, pitch = (g('pitch') * Math.PI) / 180, dist = g('dist');
  const pos: V3 = v3.add(target, [dist * Math.cos(pitch) * Math.cos(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.sin(yaw)]);
  const fw = v3.nrm(v3.sub(target, pos)), right = v3.nrm(v3.cross(fw, [0, 1, 0])), up = v3.cross(right, fw);
  return {pos, fwd: fw, right, up, fpx: H / 2 / Math.tan((g('fov') * Math.PI) / 360), target};
};
