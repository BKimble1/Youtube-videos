// Shots 5-10, one continuous take in the tank:
//  5  pull back from the tissue (the microscope's cells) to the fish's side, then rise over it to the overhead
//     cutaway, where both muscle sheets show either side of the core (thickness drawn x2.8 so the layers read);
//  6  side A contracts: it shortens and the tail bends toward it;
//  7  side B, stretched, fires (a contraction wave runs along it) and swings the tail back;
//  8  the cycle repeats, faster each time; the fish starts to move, the grid slides by and the camera swings down
//     behind it as the thickness returns to true;
//  9  a low follow from below and behind: tail strokes, shed swirls;
// 10  the body turns to glass beside the camera: two living sheets, paper, gelatin, and nothing else on board.
import React from 'react';
import {basis, Cam, lerpCam, norm3, orbit, V3} from '../core/cam';
import {Underwater} from '../art/Underwater';
import {swimTrack} from '../fish/swim';
import {fishGeo, FishPose, MUS0, MUS1} from '../fish/model';
import {clamp, inv, lerp, ss, ssOut, T, W} from '../lib';
import {XrayTint} from './Open';

const P0: V3 = [0, -30, 0];
const AMP = 0.55;
const tA0 = () => W('one', 1, T.s6).start - 0.05;
const tA1 = () => W('contracts', 1, T.s6).end;
const tB0 = () => W('triggering').start;
const tB1 = () => W('contract', 1).end;

/** the demonstration (shots 5-7), then the swim (TR2 from shot 8) */
export const TR2 = swimTrack({
  t0: 0, t1: 40, start: P0, yaw: () => 0,
  freq: (t) => lerp(0.9, 2.6, ss(t, T.s8, T.s9 + 0.4)),
  amp: (t) => lerp(AMP, 0.48, ss(t, T.s8, T.s9)),
  phase0: 0, bob: 3,
});
// the swim track's phase must start at 3pi/2 (the tail at full bend toward B) at T.s8: shift by a fixed offset
const swimAt = (t: number) => {
  const base = TR2.at(t);
  const p0 = TR2.at(T.s8);
  const off = (3 * Math.PI) / 2 - p0.phase;
  const ph = base.phase + off;
  const a = lerp(AMP, 0.48, ss(t, T.s8, T.s9));
  const A = a * Math.sin(ph);
  const c = Math.cos(ph);
  const dx = base.pos[0] - p0.pos[0];
  return {pos: [P0[0] + dx, base.pos[1], base.pos[2]] as V3, yaw: -6 * A, A, actA: Math.max(0, c) ** 1.3, actB: Math.max(0, -c) ** 1.3, phase: ph, speed: base.speed};
};
export const mechPose = (t: number): FishPose => {
  const TK = lerp(1, 2.8, ss(t, T.s5 + 0.9, T.s6 - 0.05)) - 1.8 * ss(t, T.s8 + 0.5, T.s9 - 0.05);
  if (t >= T.s8) {
    const s = swimAt(t);
    // the first strokes after the demonstration still show each trigger wave on the stretched side
    const cyc = ((s.phase - Math.PI / 2) / Math.PI) % 2;
    const wv = clamp(1 - (t - T.s8) / 1.4);
    const into = (s.phase % (2 * Math.PI)) / (2 * Math.PI);
    return {pos: s.pos, yaw: s.yaw, A: s.A, actA: s.actA, actB: s.actB, mature: 1, TK, waveA: wv > 0 && into > 0.75 ? (into - 0.75) * 4 : -1, waveB: wv > 0 && into > 0.25 && into < 0.5 ? (into - 0.25) * 4 : -1};
    void cyc;
  }
  const a0 = tA0(), a1 = tA1(), b0 = tB0(), b1 = tB1();
  // side A: contracts, holds a little, relaxes once B has fired
  const actA = ssOut(t, a0, a0 + 0.22) * (1 - 0.55 * ss(t, a1, a1 + 0.5)) * (1 - ss(t, b0, b0 + 0.25));
  const bendA = AMP * ss(t, a0 + 0.04, a1 + 0.05);
  // side B: stretched by the bend; a wave runs along it as it is triggered; it contracts and swings the tail back
  const waveB = t >= b0 - 0.32 && t < b0 + 0.08 ? (t - (b0 - 0.32)) / 0.4 : -1;
  const actB = ssOut(t, b0 + 0.02, b0 + 0.22) * (1 - 0.5 * ss(t, b1 - 0.1, T.s8));
  const A = bendA - 2 * AMP * ss(t, b0 + 0.04, b1 - 0.05);
  // a breath of life before the first contraction: the tissue twitches faintly
  const idle = 0.12 * Math.max(0, Math.sin(t * 9)) * (1 - ss(t, a0 - 0.3, a0));
  return {pos: P0, yaw: 0, A, actA: Math.max(actA, idle), actB, waveB, mature: 1, TK};
};

// ------------------------------------------------------------------ camera
const ctr = (p: FishPose, s = 0.55): V3 => fishGeo(p).atS(s, 0, 0);
const upBlend = (pitch: number, fwdUp: V3): V3 => norm3([fwdUp[0] * ss(pitch, 40, 88), -(1 - ss(pitch, 40, 88)), fwdUp[2] * ss(pitch, 40, 88)]);
export const camMech = (t: number): Cam => {
  const p = mechPose(t);
  if (t < T.s8) {
    // shot 5: out from the tissue, then up and over
    const back = ss(t, T.s5, T.s5 + 0.85);
    const rise = ss(t, T.s5 + 0.7, T.s6 + 0.1);
    const pitch = lerp(3, 90, rise);
    const dist = lerp(lerp(30, 290, back), 168, rise);
    const tgt = ctr(p, lerp(0.6, 0.52, rise));
    // shots 6-7: a gentle push toward the hinge, leaning with the tail
    const push = ss(t, T.s6, T.s8);
    const lean: V3 = [0, 0, 10 * p.A];
    const c = orbit([tgt[0] - 6 * push, tgt[1], tgt[2] + lean[2]], -4 * (1 - rise), Math.min(89.5, pitch), dist - 14 * push, 1500, upBlend(pitch, [1, 0, 0]));
    return c;
  }
  // shot 8: follow the moving fish, then swing down to a low three-quarter view from behind and below
  const swing = ss(t, T.s8 + 0.55, T.s9 + 0.3);
  const pitch = lerp(89.5, -17, swing) + 6 * ss(t, T.s9 + 0.3, T.s10);
  const yaw = lerp(-42, -18, ss(t, T.s9, T.s10));
  const dist = lerp(154, 185, swing);
  const tgt = ctr(p, 0.5);
  let c = orbit(tgt, yaw, pitch, dist, 1500, upBlend(pitch, [1, 0, 0]));
  // shot 9 -> 10: round to the side, level, for the glass body
  const side = ss(t, T.s10 - 0.25, T.s10 + 0.5);
  if (side > 0) c = lerpCam(c, orbit(ctr(p, 0.47), -6, 3, 215, 1500), side);
  return c;
};
/** overhead grade: the cutaway darkens the floor so the mechanism reads */
const cutGrade = (t: number) => ss(t, T.s5 + 1.0, T.s6) * (1 - ss(t, T.s8 + 0.4, T.s9));

export const ShotMech: React.FC<{t: number}> = ({t}) => {
  const B = basis(camMech(t));
  const p = mechPose(t);
  const xr = ss(t, T.s10 + 0.05, T.s10 + 0.45);
  const g = cutGrade(t);
  const swirls = t >= T.s8 ? TR2.swirls(t).filter((w) => w.age <= t - T.s8).map((w) => ({...w, p: [w.p[0] - (TR2.at(T.s8).pos[0] - P0[0]), w.p[1], w.p[2]] as V3})) : [];
  return (
    <Underwater
      id="mc"
      B={B}
      t={t}
      pose={p}
      swirls={swirls}
      look={{xray: xr, detail: clamp(1 - (t - T.s5) / 0.5)}}
      grid={1}
      under={g > 0.01 ? <rect x={0} y={0} width={1080} height={1920} fill="#0A2430" opacity={0.55 * g} /> : null}
      over={<XrayTint xr={xr} />}
    />
  );
};
export {MUS0, MUS1, inv};
