// A5 (113-142, "when it shoots."): the camera rises over the table with the medic (elevation 14 -> 48 degrees, backing
// off a little as it climbs) as it crosses the tray on short quick tripod strides toward the foam course at left, the
// clear target with the fired injector falling behind at right. Beyond the tray, at the far side of the bench, the
// operator guides it: small in the background, the remote in his gloved hand, his thumb working the direction pad,
// eyes on the insect. The camera tracks left with the insect, so the course's blocks come in from the left; in the last
// frames the nearest (yellow) foam block enters the near foreground at lower left, leading into the film's foreground
// foam-block wipe (frames 133-150, drawn by the film).
import React from 'react';
import {sr, lerp, clamp} from '../../../lib/ease';
import {V3} from '../../../lib/v3';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, Injector2D} from '../../roach/Gear2D';
import {viewAt, View, P, D, f2} from '../../roach/ortho';
import {LabWall2, Target2D, LAB2} from '../../sets/Lab2';
import {INK} from '../../../lib/ink';
import {ShotProps} from '../index2';
import {A1_FACE} from '../h/A1';
import {FoamBox, Tray2D, BoxB} from '../b/common';
import {OperatorA} from './OperatorA';
import {GroundShadow} from './kitA';
import {medPose, medGear, medAt, medInjFrame, MED_INJ_REAR} from './medicA';
import {shotRange} from '../../cuts2';

const R = shotRange('A5');
const T0 = R.from / 30;
const T1 = R.to / 30;
export const A5_AZ = 22;
const EL0 = 14;
const EL1 = 48;
const S0 = 4.4;
const S1 = 3.6;

const rise = (t: number) => sr(t, T0 - 0.05, T1 + 0.05);
/** horizontal unit vectors of the view: R (screen right) and toward the viewer, in world (x, z) */
const AZ = (A5_AZ * Math.PI) / 180;
const RH: [number, number] = [Math.cos(AZ), -Math.sin(AZ)];
const FH: [number, number] = [Math.sin(AZ), Math.cos(AZ)];
/** where the insect is at the start of the shot (the bench layout is placed from it) */
const M0 = medAt(T0).p;
const at = (a: number, b: number): V3 => [M0[0] + RH[0] * a + FH[0] * b, 0, M0[2] + RH[1] * a + FH[1] * b];
/** the bench's far edge (screen-horizontal), the operator's place behind it */
const EDGE_B = -170;
const OP_A = 30;
const OP_B = -215;

/** the camera follows the insect (a little behind its lead, so it drifts left in frame) while it rises */
export const a5View = (t: number): View => {
  const u = rise(t);
  const m = medAt(t);
  const look: V3 = [m.p[0], 8, m.p[2]];
  const m0 = medAt(T0).p;
  const k = 0.65; // the share of the insect's travel the camera follows
  const lx = lerp(m0[0], look[0], k), lz = lerp(m0[2], look[2], k);
  return viewAt(A5_AZ, lerp(EL0, EL1, u), lerp(S0, S1, u), [lx, 8, lz], 600, lerp(1290, 1250, u));
};

/** the foam course ahead (world mm): a gate of blue and red blocks, more beyond, and the near yellow block */
const COURSE: {b: BoxB; c: string}[] = (() => {
  const box = (a: number, b: number, w: number, d: number, h: number): BoxB => {
    const c = at(a, b);
    return [c[0] - w / 2, c[0] + w / 2, 0, h, c[2] - d / 2, c[2] + d / 2];
  };
  return [
    {b: box(-215, -70, 40, 34, 34), c: LAB2.foamB},
    {b: box(-300, -20, 50, 30, 26), c: LAB2.foamR},
    {b: box(-240, 62, 44, 36, 30), c: LAB2.foamR},
    {b: box(-205, 150, 70, 46, 40), c: LAB2.foamY},
  ];
})();

export const A5Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const v = a5View(t);
  const pose = medPose(t);
  const ins = P(v, pose.frame.o);
  // the bench's far edge (horizontal on screen) and the operator behind it
  const edge = P(v, at(0, EDGE_B));
  const opG = P(v, at(OP_A, OP_B));
  const opScale = 0.74;
  const opHip = {x: opG[0], y: edge[1] + 38 * opScale};
  // his eyes and thumb: on the insect, working the pad (two short nudges on the pad)
  const nudge = clamp(Math.sin((t - T0) * Math.PI * 3.2) * 1.4 + 0.2);
  const opProps = {
    x: opHip.x, y: opHip.y, scale: opScale, t, expr: 'focus' as const, exprTo: 'neutral' as const, exprMix: 0.3,
    thumbPress: 0, thumbLift: 0, led: 'fired' as const, gazeX: ins[0], gazeY: ins[1] - 20, benchTopY: edge[1], farHand: 'bench' as const, farHandX: 120,
    nod: 4 + 3 * rise(t), dpad: 1, dpadZ: 1.6 - 1.2 * nudge,
  };
  // the wall beyond the bench rises with the far edge
  const wallY = edge[1];
  const insD = D(v, pose.frame.o);
  const far = COURSE.filter((c) => D(v, [(c.b[0] + c.b[1]) / 2, 0, c.b[5]]) < insD);
  const near = COURSE.filter((c) => D(v, [(c.b[0] + c.b[1]) / 2, 0, c.b[5]]) >= insD);
  const bt = (b: number) => P(v, at(0, b))[1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-wb)`}>
        <g transform={`translate(${f2(-200 - 0.35 * (ins[0] - 560))} ${f2(wallY - 1180)}) scale(1.15)`}>
          <LabWall2 id={`${id}w`} />
        </g>
      </g>
      <OperatorA id={`${id}ob`} layer="body" {...opProps} />
      {/* the bench top from its far edge forward (the tray lies on it) */}
      <path d={`M-50,${f2(edge[1])} H1130 V2000 H-50 Z`} fill={LAB2.benchTop} />
      <path d={`M-50,${f2(edge[1] + 3)} H1130 V${f2(bt(EDGE_B + 60))} H-50 Z`} fill={LAB2.benchTopLit} opacity={0.5} />
      <path d={`M-50,${f2(edge[1])} H1130`} stroke={INK} strokeWidth={5} />
      <path d={`M-50,${f2(edge[1] + 5)} H1130`} stroke="#FFFFFF" strokeWidth={2} opacity={0.2} />
      <OperatorA id={`${id}oh`} layer="hands" {...opProps} />
      <Tray2D v={v} x0={-520} x1={190} z0={-140} z1={420} grid={20} bench={false} />
      {far.map((c, i) => <FoamBox key={`f${i}`} id={`${id}cf${i}`} v={v} b={c.b} color={c.c} />)}
      <Target2D id={`${id}t`} v={v} face={A1_FACE} dir={1} dent={1} />
      <Injector2D id={`${id}i`} v={v} frame={medInjFrame()} rear={MED_INJ_REAR} />
      <Target2D id={`${id}tv`} v={v} face={A1_FACE} dir={1} veil={0.62} />
      <GroundShadow pose={pose} v={v} alpha={0.18} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, shadow: 0, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={medGear(t)} />}} />
      {near.map((c, i) => <FoamBox key={`n${i}`} id={`${id}cn${i}`} v={v} b={c.b} color={c.c} />)}
    </svg>
  );
};

export const A5: React.FC<ShotProps> = ({f}) => <A5Scene t={f / 30} id={`a5f${f}`} />;
