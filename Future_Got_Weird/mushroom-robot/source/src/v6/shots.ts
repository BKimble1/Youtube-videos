// V5 edit: 24 beats, each cut on a measured word or action.
// V4's robot shots used a camera that FOLLOWED the walker, so its body sat still in frame while its legs worked ("the
// legs bend but the robot doesn't move"). V5 anchors each camera in the world: the framing is computed from the
// walker's pose at an anchor time and then held (or dollied) in world space, so the robot visibly travels across the
// mat. Close-ups may follow partially (`follow` 0..1) so the subject stays in frame.
import {V3, v3, lerp, ss} from '../lib';
import {DUR} from './timing';
import {smoothCentre, smoothHeading} from './robot';
import {Cam, H} from './cam';

export type ACam = {yaw: number; pitch: number; dist: number; up: number; fov: number; fwd?: number; side?: number; anchor: number; follow?: number};
export type BCam = {cx: number; cy: number; s: number; rot?: number};
export type Shot = {t0: number; t1: number; name: string; purpose: string} & (
  {kind: 'A'; a: ACam; b: ACam; ease?: 'in' | 'out' | 'inout'} | {kind: 'B'; a: BCam; b: BCam; follow?: 'chain' | 'pulse'});
const legT = (i: number, r: number) => ({fwd: r * Math.cos((i * 72 * Math.PI) / 180), side: r * Math.sin((i * 72 * Math.PI) / 180)});
/** the opening framing: the whole machine, front three-quarter, mid-step (the last shot returns here: the loop) */
const OPEN: ACam = {yaw: 34, pitch: 16, dist: 27, up: 0.8, fov: 46, anchor: 0, follow: 0.35};
/** S10 and S14 use the same static side framing: before and after UV, the change in gait reads by direct comparison */
const SIDE = (anchor: number): ACam => ({yaw: -90, pitch: 9, dist: 27, up: 1.4, fov: 46, anchor});
export const SHOTS: Shot[] = [
  {t0: 0, t1: 1.04, name: 'S1 the whole walker', purpose: 'payoff: the full machine mid-step, body moving over planted feet', kind: 'A', a: OPEN, b: {...OPEN, dist: 24.5}},
  {t0: 1.04, t1: 1.97, name: 'S2 soft legs peel and set down', purpose: 'close on the rear soft legs lifting, swinging and landing', kind: 'A', a: {yaw: 210, pitch: 13, dist: 15.5, up: 0.6, fov: 44, ...legT(2.5, 3.2), anchor: 1.4, follow: 0.6}, b: {yaw: 206, pitch: 12, dist: 14, up: 0.6, fov: 44, ...legT(2.5, 3.2), anchor: 1.4, follow: 0.6}},
  {t0: 1.97, t1: 2.92, name: 'S3 something alive inside', purpose: 'down into the dome: a living culture, a pulse runs through it, the LEDs answer', kind: 'A', a: {yaw: -20, pitch: 52, dist: 16, up: 1.0, fov: 42, anchor: 2.4, follow: 1}, b: {yaw: -25, pitch: 62, dist: 10.5, up: 1.0, fov: 40, anchor: 2.4, follow: 1}, ease: 'in'},
  {t0: 2.92, t1: 3.98, name: 'S4 living mycelium', purpose: 'macro: threads with streaming cytoplasm, tips growing', kind: 'B', a: {cx: -0.42, cy: -0.1, s: 1500, rot: 0.5}, b: {cx: -0.36, cy: -0.02, s: 1250, rot: 0.42}},
  {t0: 3.98, t1: 5.05, name: 'S5 electrode contact', purpose: 'tight detail: the fungus grown over a gold electrode', kind: 'B', a: {cx: 0.1, cy: 0.72, s: 2600, rot: 0.2}, b: {cx: 0.14, cy: 0.78, s: 2100, rot: 0.15}},
  {t0: 5.05, t1: 6.69, name: 'S6 into the electronics', purpose: 'the electrode leads run off the scaffold into the controller', kind: 'B', a: {cx: 0.15, cy: 0.95, s: 520}, b: {cx: 0.25, cy: 2.6, s: 380}},
  {t0: 6.69, t1: 8.4, name: 'S7 electrical activity', purpose: 'riding with one spike along the branches into the electrode (8.05)', kind: 'B', a: {cx: 0, cy: 0, s: 700}, b: {cx: 0, cy: 0, s: 900}, follow: 'pulse'},
  {t0: 8.4, t1: 9.1, name: 'S8 the controller receives it', purpose: 'down the lead, the controller LED, the valve opens, air goes out', kind: 'B', a: {cx: 0.26, cy: 1.7, s: 330}, b: {cx: 0.26, cy: 4.4, s: 330}, follow: 'chain'},
  {t0: 9.1, t1: 10.13, name: 'S9 the actuator responds', purpose: 'air arrives: leg 3 fills, lifts, swings and sets down', kind: 'A', a: {yaw: 150, pitch: 16, dist: 17.5, up: 0.8, fov: 44, ...legT(3, 3.4), anchor: 9.6, follow: 0.5}, b: {yaw: 155, pitch: 16, dist: 16.5, up: 0.8, fov: 44, ...legT(3, 3.4), anchor: 9.6, follow: 0.5}},
  {t0: 10.13, t1: 11.84, name: 'S10 the robot moves', purpose: 'static side: one clean step, the body carried forward over planted feet (baseline gait)', kind: 'A', a: SIDE(11.0), b: SIDE(11.0)},
  {t0: 11.84, t1: 12.89, name: 'S11 UV source', purpose: 'the UV lamp swings in over the robot and clicks on (12.51)', kind: 'A', a: {yaw: -120, pitch: 3, dist: 28, up: 7.5, fov: 50, anchor: 12.4, follow: 0.6}, b: {yaw: -116, pitch: 6, dist: 26, up: 6.0, fov: 50, anchor: 12.4, follow: 0.6}},
  {t0: 12.89, t1: 13.61, name: 'S12 light on the fungus', purpose: 'close on the lit culture: the first UV bursts flash through it', kind: 'A', a: {yaw: -112, pitch: 34, dist: 14, up: 1.6, fov: 42, anchor: 13.2, follow: 1}, b: {yaw: -108, pitch: 38, dist: 11.5, up: 1.6, fov: 40, anchor: 13.2, follow: 1}},
  {t0: 13.61, t1: 14.74, name: 'S13 the signal changes', purpose: 'the lit network: spikes now arrive as bursts along several branches', kind: 'B', a: {cx: 0, cy: 0.05, s: 470}, b: {cx: 0.05, cy: 0.3, s: 640}},
  {t0: 14.74, t1: 15.69, name: 'S14 a different walk', purpose: 'the S10 framing again: paired, quicker steps; it scoots across under the lamp', kind: 'A', a: SIDE(15.2), b: SIDE(15.2)},
  {t0: 15.69, t1: 16.56, name: 'S15 the pattern from above', purpose: 'brief high view: paired steps under the lamp; the lamp goes off (16.5)', kind: 'A', a: {yaw: -150, pitch: 46, dist: 40, up: 0, fov: 46, anchor: 16.1}, b: {yaw: -150, pitch: 46, dist: 39, up: 0, fov: 46, anchor: 16.1}},
  {t0: 16.56, t1: 17.75, name: 'S16 where a brain would be', purpose: 'eye level with the dome: a dish of fungus, two wires, nothing else', kind: 'A', a: {yaw: 200, pitch: 26, dist: 13, up: 2.2, fov: 40, anchor: 17.2, follow: 1}, b: {yaw: 192, pitch: 20, dist: 9.5, up: 2.3, fov: 40, anchor: 17.2, follow: 1}, ease: 'in'},
  {t0: 17.75, t1: 18.58, name: 'S17 no brain', purpose: 'static low side: the soft legs give way and the body slumps', kind: 'A', a: {yaw: 95, pitch: 6, dist: 26, up: 1.0, fov: 44, anchor: 18.2}, b: {yaw: 95, pitch: 6, dist: 25.5, up: 1.0, fov: 44, anchor: 18.2}},
  {t0: 18.58, t1: 19.39, name: 'S18 no eyes', purpose: 'mat level, head-on, long lens: a blank front walking at the camera (no wide-angle stretch)', kind: 'A', a: {yaw: 4, pitch: 2, dist: 36, up: 1.8, fov: 28, anchor: 19.3}, b: {yaw: 4, pitch: 2, dist: 35, up: 1.8, fov: 28, anchor: 19.3}},
  {t0: 19.39, t1: 20.26, name: 'S19 marching in place', purpose: 'it steps without getting anywhere, swinging left', kind: 'A', a: {yaw: -30, pitch: 34, dist: 27, up: 0.6, fov: 46, anchor: 19.8}, b: {yaw: -30, pitch: 34, dist: 26, up: 0.6, fov: 46, anchor: 19.8}},
  {t0: 20.26, t1: 21.9, name: 'S20 no idea where', purpose: 'static low three-quarter: it swings right, then walks off in a new direction across the frame', kind: 'A', a: {yaw: 130, pitch: 14, dist: 32, up: 1.2, fov: 46, anchor: 21.2}, b: {yaw: 130, pitch: 14, dist: 32, up: 1.2, fov: 46, anchor: 21.2}},
  {t0: 21.9, t1: 22.62, name: 'S21 a fungal signal', purpose: 'cause: a spike runs along a branch into an electrode (22.42)', kind: 'B', a: {cx: 0, cy: 0, s: 900}, b: {cx: 0, cy: 0, s: 950}, follow: 'pulse'},
  {t0: 22.62, t1: 23.36, name: 'S22 an actuator answers', purpose: 'effect: leg 4 fills with air and swings', kind: 'A', a: {yaw: -36, pitch: 15, dist: 16, up: 1.0, fov: 44, ...legT(4, 3.4), anchor: 23.0, follow: 0.5}, b: {yaw: -30, pitch: 15, dist: 15, up: 1.0, fov: 44, ...legT(4, 3.4), anchor: 23.0, follow: 0.5}},
  {t0: 23.36, t1: 24.78, name: 'S23 the whole machine', purpose: 'pull back from the glowing culture to the full robot stepping (spike 23.94)', kind: 'A', a: {yaw: 60, pitch: 45, dist: 13, up: 1.2, fov: 42, anchor: 24.0, follow: 0.8}, b: {yaw: 60, pitch: 24, dist: 33, up: 0.6, fov: 46, anchor: 24.0, follow: 0.4}, ease: 'out'},
  {t0: 24.78, t1: 26.36, name: 'S24 one satisfying stride', purpose: 'brief top view, straight path: the five-leg ripple carries the body across the mat grid', kind: 'A', a: {yaw: -90, pitch: 86, dist: 40, up: 0, fov: 42, anchor: 25.6}, b: {yaw: -90, pitch: 86, dist: 40, up: 0, fov: 42, anchor: 25.6}},
  {t0: 26.36, t1: DUR, name: 'S25 a fungus with a body', purpose: 'the last step lands on "body"; the camera settles into the opening framing (loop)', kind: 'A', a: {yaw: 70, pitch: 30, dist: 34, up: 0.6, fov: 46, anchor: 27.2, follow: 0.35}, b: {...OPEN, anchor: DUR}, ease: 'inout'},
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
const easeOf = (s: Shot, u: number) => {
  const e = s.kind === 'A' ? s.ease : undefined;
  if (e === 'in') return u * u * (2 - u) * 0.6 + u * 0.4;
  if (e === 'out') return 1 - (1 - u) * (1 - u) * (1 + u) * 0.6 - (1 - u) * 0.4;
  if (e === 'inout') return ss(0, 1, u) * 0.8 + u * 0.2;
  return u;
};
/** camera pose for one ACam at time t */
export const camPose = (k: ACam, t: number) => {
  const f = k.follow ?? 0;
  const cA = smoothCentre(k.anchor), cT = smoothCentre(t);
  const hA = smoothHeading(k.anchor), hT = smoothHeading(t);
  const c: V3 = v3.lerp(cA, cT, f);
  const th = lerp(hA, hT, f);
  const fw: V3 = [Math.cos(th), 0, Math.sin(th)], sd: V3 = [-Math.sin(th), 0, Math.cos(th)];
  const target: V3 = v3.add(c, v3.add(v3.mul(fw, k.fwd ?? 0), v3.add(v3.mul(sd, k.side ?? 0), [0, k.up, 0])));
  const yaw = th + (k.yaw * Math.PI) / 180, pitch = (k.pitch * Math.PI) / 180;
  const pos: V3 = v3.add(target, [k.dist * Math.cos(pitch) * Math.cos(yaw), k.dist * Math.sin(pitch), k.dist * Math.cos(pitch) * Math.sin(yaw)]);
  return {pos, target, fov: k.fov};
};
export const camA = (s: Shot & {kind: 'A'}, t: number): Cam => {
  const u = easeOf(s, Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0))));
  const A = camPose(s.a, t), B = camPose(s.b, t);
  const pos = v3.lerp(A.pos, B.pos, u), target = v3.lerp(A.target, B.target, u), fov = lerp(A.fov, B.fov, u);
  const fwd = v3.nrm(v3.sub(target, pos)), right = v3.nrm(v3.cross(fwd, [0, 1, 0])), up = v3.cross(right, fwd);
  return {pos, fwd, right, up, fpx: H / 2 / Math.tan((fov * Math.PI) / 360), target};
};
