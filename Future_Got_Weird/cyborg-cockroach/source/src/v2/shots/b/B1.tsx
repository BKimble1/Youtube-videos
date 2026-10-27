// B1 (143-186, "Scientists strapped a tiny") and B2 (187-208, "launcher onto a"): ONE camera over one fitting.
// V4. The fitting station's dark cutting mat, low three-quarter from the insect's right and a little in front (az 20,
// el 12: the module stands clear above the shell's silhouette, so the hands work on the module alone). The living medic
// stands, antennae searching, breathing. Two small gloved hands carry the module down from above, each holding it by the
// launch tube only (rear hand: thumb on the tube's rear cap, index on the rear clamp; front hand: index on the front
// clamp, thumb on the tube's upper flank), the slack wires hanging from the board to the electrodes already at the
// antenna bases and cerci (in front of the shell where they are in front of it, behind it where they are behind it).
// The module lands and is pressed home on "strapped" (B_SEAT): the body gives a little under the press and the wires
// lie down along the shell. The fingers ease off, the hands lift straight up out of frame, and the camera, motivated by
// that reveal, pushes in and comes down to the mounting's profile (az 20 -> 0, el 12 -> 8, s 10.5 -> 25). The push is
// still settling over the cut, so B2 (the tight mechanical profile: saddle, board, clamps, wires, tube, spring, loaded
// injector, latch, needle) continues the same camera: the module keeps its screen position and size across the cut.
// In B2 the insect takes its first step (B_GO) and the camera's move turns into a lateral track along the tube with it.
// The film's edge wipe reveals B1 over frames 133-150: B1's clock is clamped at 133, and the descent starts there.
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {Frame, toW, add as add3, V3, lerp3, norm as norm3} from '../../../lib/v3';
import {clamp, sr, ramp, easeIn, lerp} from '../../../lib/ease';
import {V} from '../../../lib/math';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, D, f2} from '../../roach/ortho';
import {LabWall2, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {Mat2D, GloveArm, ArmPose, pinchPose, mixPose, carriedWires, WireDraw, setOff, FPS} from './common';
import {digitTips, HandPose} from '../../dc/Hand';
import {PACK} from '../../../rig/gear';

// ------------------------------------------------------------------ the shared action (one insect, one world: B1-B2)
/** the module is pressed home (s): on "strapped" (5.47-5.79) */
export const B_SEAT = 5.55;
/** the insect's first step (s), early in B2 */
export const B_GO = 6.27;
export const B_SPEED = 36;
/** B1's first drawn frame (under the film's edge wipe); earlier frames show this one */
export const B1_F0 = 133;
const S_REST = plantedStop(0);
const PATH = straightPath([-S_REST, 0, 0], 0);
export const bWalkS = (t: number) => S_REST + setOff(t, B_GO, B_SPEED, 0.5);
/** the descent starts on B1's first drawn frame, from 46 mm above the seat */
const T_DESC = B1_F0 / FPS, LIFT0 = 46;
/** the module's height above its seat (mm): a decelerating descent that lands at B_SEAT, still moving a little (pressed home) */
export const packLift = (t: number) => (t >= B_SEAT ? 0 : LIFT0 * Math.pow(1 - clamp((t - T_DESC) / (B_SEAT - T_DESC)), 1.4));
/** the press: the body gives a little under the fingers, then recovers */
const press = (t: number) => {
  const d = t - (B_SEAT - 0.03);
  return d <= 0 ? 0 : (1 - Math.exp(-d / 0.04)) * Math.exp(-d / 0.3);
};
export const bPose = (t: number): RoachPose => {
  const p = press(t);
  // the antennae: searching; they flick back at the press, and point ahead once it walks
  const go = sr(t, B_GO - 0.25, B_GO + 0.35);
  return poseRoach({
    path: PATH, s: bWalkS(t), t, search: 0.85, seed: 3,
    offset: [0, -1.3 * p, 0],
    antL: {yaw: 0.72 + 0.3 * p - 0.14 * go, pitch: 0.18 + 0.22 * p + 0.06 * go, curl: 0.85 - 0.2 * p},
    antR: {yaw: 0.72 + 0.3 * p - 0.14 * go, pitch: 0.18 + 0.22 * p + 0.06 * go, curl: 0.85 - 0.2 * p},
  });
};
/** the module's frame: the body frame, lifted and a little off its seat (back and to the far side) while it is carried */
const packFrame = (f: Frame, t: number): Frame => {
  const l = packLift(t), k = clamp(l / 40);
  return {...f, o: add3(f.o, [-2.5 * k, l, -4 * k])};
};

// ------------------------------------------------------------------ the camera (B1 -> B2, one move)
const CA = {az: 20, el: 12, s: 10.5, at: [2, 14, 0] as V3, x: 540, y: 1060};
const CB = {az: 0, el: 8, s: 25, x: 540, y: 960};
/** the push in (starts as the hands lift away, still settling over the cut, at rest by B2's ninth frame) */
export const bbPush = (f: number) => sr(f, 168.5, 195);
/** the body's x (path frame: the gait's bob never moves the camera) */
const bodyX = (t: number) => bPose(t).bodyFrame0.o[0];
/** B2's track: from over the saddle's rear to the tube's mouth (body x, mm), with the first step */
export const b2Look = (f: number) => -6 + 32 * sr(f, 188, 216);
const viewA = (): View => viewAt(CA.az, CA.el, CA.s, CA.at, CA.x, CA.y);
export const bbView = (f: number): View => {
  const u = bbPush(f);
  if (u <= 0) return viewA();
  const atB: V3 = [bodyX(f / FPS) + b2Look(f), 14, 0];
  return viewAt(lerp(CA.az, CB.az, u), lerp(CA.el, CB.el, u), CA.s * Math.pow(CB.s / CA.s, u), lerp3(CA.at, atB, u), lerp(CA.x, CB.x, u), lerp(CA.y, CB.y, u));
};

// ------------------------------------------------------------------ the hands
// the grip: each hand rests its fingertips in a row along the TOP of the launch tube (the module's highest part, clear
// above the shell's silhouette in this view) and steadies it with the thumb on the tube's near face, thumbs inward
// (the researcher faces the camera across the bench: the right hand is screen-left). Solved once in the fitting view
// at the seated reference pose (each finger's curl brings its tip onto the tube's top edge; the thumb's angle and bend
// put its tip on the face); afterwards the hands ride with the module.
type HandSpec = {ang: number; fore: number; mid: number; thumb: V3; side: 1 | -1};
const HANDS: HandSpec[] = [
  {ang: 86, fore: 262, mid: -4.5, thumb: [3.2, 28.6, 3.6], side: 1}, // rear (screen-left) hand, thumb to its right
  {ang: 95, fore: 284, mid: 14.2, thumb: [6.8, 28.6, 3.6], side: -1}, // front hand, thumb to its left
];
const G_REF: V3 = [5, 27.3, 0];
const HAND_MM = 36;
const memo: Record<string, ArmPose[]> = {};
const solveGrips = (v: View, f: Frame): ArmPose[] => {
  if (memo.b1) return memo.b1;
  const L = HAND_MM * v.s;
  const T = PACK.tube;
  // the tube's top edge on screen (its silhouette: the axis plus r along the view's up, perpendicular to the axis),
  // raised by a fingertip's radius
  const up = norm3([0, v.U[1], v.U[2]]);
  const rTip = 0.062 * L;
  const edge = (x: number): V => {
    const q = P(v, toW(f, [x, T.a[1] + T.r * up[1], T.r * up[2]]));
    return {x: q[0], y: q[1] - rTip};
  };
  const pv = (p: V3): V => {
    const q = P(v, toW(f, p));
    return {x: q[0], y: q[1]};
  };
  // height of a screen point above the edge line (px; + = above)
  const e0 = edge(T.a[0]), e1 = edge(T.b[0]);
  const above = (q: V) => {
    const k = (q.x - e0.x) / (e1.x - e0.x);
    return e0.y + (e1.y - e0.y) * k - q.y;
  };
  memo.b1 = HANDS.map((h) => {
    // thumb side: the one that puts the thumb toward `side` on screen
    const probe = (ts: 1 | -1) => digitTips({x: 0, y: 0}, h.ang, L, ts, pinchPose(0.4, 40)).thumb.x;
    const ts: 1 | -1 = Math.sign(probe(1)) === h.side ? 1 : -1;
    // the middle finger's tip on the edge at body x = mid: place the wrist
    const base: HandPose = {curl: [0.3, 0.45, 0.4, 0.15], spread: 0.15, thumb: 30, thumbCurl: 0.3};
    const m = edge(h.mid);
    const d0 = digitTips({x: 0, y: 0}, h.ang, L, ts, base);
    const wrist = {x: m.x - d0.tips[1].x, y: m.y - d0.tips[1].y};
    // each other finger's curl: its tip as close to the edge as it gets (never below it)
    const curl = [...base.curl] as HandPose['curl'];
    for (const fi of [0, 2, 3]) {
      let best = {c: curl[fi], e: 1e9};
      for (let c = 0.02; c <= 0.95; c += 0.01) {
        const pose = {...base, curl: curl.map((x, i) => (i === fi ? c : x)) as HandPose['curl']};
        const a = above(digitTips(wrist, h.ang, L, ts, pose).tips[fi]);
        const e = a < 0 ? 1e6 - a : a;
        if (e < best.e) best = {c, e};
      }
      curl[fi] = best.c;
    }
    // the thumb onto the tube's near face
    const tT = pv(h.thumb);
    let tb = {th: 30, tc: 0.3, e: 1e18};
    for (let th = 0; th <= 70; th += 1)
      for (let tc = 0; tc <= 0.9; tc += 0.03) {
        const q = digitTips(wrist, h.ang, L, ts, {...base, curl, thumb: th, thumbCurl: tc}).thumb;
        const e = (q.x - tT.x) ** 2 + (q.y - tT.y) ** 2;
        if (e < tb.e) tb = {th, tc, e};
      }
    return {wrist, ang: h.ang, L, ts, pose: {...base, curl, thumb: tb.th, thumbCurl: tb.tc}, fore: h.fore};
  });
  return memo.b1;
};
/** the release: the fingers ease off as the hands rise straight up and a little back (mm), accelerating away */
export const B1_OPEN: [number, number] = [168.5, 176];
export const handRelease = (f: number) => ({release: sr(f, B1_OPEN[0], B1_OPEN[1]), up: 80 * easeIn(ramp(f, 168, 184), 1.6), back: 14 * easeIn(ramp(f, 168, 184), 1.6)});
/** the eased-off hand: the pinch a little relaxed (the index tip does not reach further down as it opens) */
const relaxed = (p: ArmPose['pose']): ArmPose['pose'] => ({...p, curl: p.curl.map((c) => c + 0.12) as HandPose['curl'], thumb: Math.max(0, p.thumb - 10), spread: p.spread + 0.2});

// ------------------------------------------------------------------ the scene (B1 and B2)
export const BenchScene: React.FC<{f: number; id: string}> = ({f: f0, id}) => {
  const f = Math.max(B1_F0, f0);
  const t = f / FPS;
  const v = bbView(f);
  const vA = viewA();
  const pose = bPose(t);
  const fb = pose.frame;
  const fp = packFrame(fb, t);
  const lift = packLift(t);
  const seated = lift <= 0;
  const w = seated ? null : carriedWires(fb, fp, lift);
  const cD = D(v, toW(fb, [0, 8, 0]));
  // hands (while they are in frame)
  const hm = handRelease(f);
  let hands: ArmPose[] = [];
  if (f < 190) {
    const refF = bPose(B_SEAT + 0.4).frame;
    const grip = solveGrips(vA, refF);
    const gW = toW(refF, G_REF);
    const ref0 = P(vA, gW), ref1 = P(vA, toW(packFrame(fb, t), G_REF));
    const o = P(vA, [0, 0, 0]), dW = P(vA, [0, hm.up, -hm.back]);
    const d: V = {x: ref1[0] - ref0[0] + dW[0] - o[0], y: ref1[1] - ref0[1] + dW[1] - o[1]};
    // the fitting view's screen -> the current view (the push), about the grip point
    const k = v.s / vA.s, gc = P(v, gW);
    const map = (q: V): V => ({x: gc[0] + (q.x - ref0[0]) * k, y: gc[1] + (q.y - ref0[1]) * k});
    hands = grip.map((a) => ({
      ...a,
      L: a.L * k,
      pose: hm.release > 0 ? mixPose(a.pose, relaxed(a.pose), hm.release) : a.pose,
      wrist: map({x: a.wrist.x + d.x, y: a.wrist.y + d.y}),
    }));
  }
  // the module's soft shadow on the back while it is carried
  const sc = P(v, toW(fb, [1, 21, 0]));
  const packSh = lift > 0.3 ? (
    <g>
      <defs>
        <filter id={`${id}-ps`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(1.0 * v.s + lift * 0.1 * v.s)} />
        </filter>
      </defs>
      <ellipse cx={f2(sc[0] + lift * 0.25 * v.s)} cy={f2(sc[1])} rx={f2(15 * v.s)} ry={f2(9 * v.s * Math.max(0.3, v.F[1]))} fill="#1A1612" opacity={0.3 * (1 - clamp(lift / 60))} filter={`url(#${id}-ps)`} />
    </g>
  ) : null;
  // the room: the bench's far edge (z = -330) and the blurred lab wall beyond it (slower: parallax, a gentler push)
  const far = P(v, [0, 0, -330]);
  const wk = 1.25 * Math.pow(v.s / CA.s, 0.35);
  const wx = 540 - 700 * wk + 0.25 * (far[0] - 540);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={f2(7 + 3 * bbPush(f))} />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-wb)`}>
        <g transform={`translate(${f2(wx)} ${f2(far[1] - 1010 * wk)}) scale(${f2(wk)})`}>
          <LabWall2 id={`${id}w`} />
        </g>
        <path d={`M-40,${f2(far[1])} H1120 V1980 H-40 Z`} fill={LAB2.benchTop} />
      </g>
      <Mat2D v={v} x0={-190} x1={260} z0={-250} z1={460} bench={false} />
      {w && <WireDraw v={v} w={w} layer="under" />}
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: `${id}r`,
          gear: (
            <g>
              {packSh}
              {w && <WireDraw v={v} w={w} layer="over" cD={cD} />}
              <Gear2D id={`${id}g`} v={v} f={fp} g={{kind: 'injector', noWires: !seated}} />
            </g>
          ),
        }}
      />
      {hands.map((a, i) => (
        <GloveArm key={i} id={`${id}h${i}`} a={a} ink={11 * (a.L / (HAND_MM * CA.s))} />
      ))}
    </svg>
  );
};

export const B1: React.FC<ShotProps> = ({f}) => <BenchScene f={f} id={`b1f${f}`} />;
