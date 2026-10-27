// The RF-Pose display's estimated skeleton: 14 keypoints (head, neck, shoulders, elbows, wrists, hips, knees, ankles),
// taken from the same joint solve that draws the character (dc/Man.tsx manJoints), so the figure on the screen is
// always the figure behind the wall. It is drawn as an estimate (soft keypoint heat, thin limbs), never as an x-ray.
import React from 'react';
import {manJoints, ManPose} from '../dc/Man';
import {clamp, f1} from '../lib';

export type Pt = {x: number; y: number};
export type Bones = {kp: Record<string, Pt>};
export const KP = ['head', 'neck', 'lsh', 'rsh', 'lel', 'rel', 'lwr', 'rwr', 'lhip', 'rhip', 'lkn', 'rkn', 'lan', 'ran'] as const;
export type KPName = (typeof KP)[number];
/** keypoints in rig-local units */
export const keypoints = (p: ManPose): Record<KPName, Pt> => {
  const j = manJoints(p);
  return {
    head: j.head, neck: j.N, lsh: j.L.S, rsh: j.R.S, lel: j.L.E, rel: j.R.E, lwr: j.L.W, rwr: j.R.W,
    lhip: j.lLeg.hp, rhip: j.rLeg.hp, lkn: j.lLeg.K, rkn: j.rLeg.K, lan: j.lLeg.A, ran: j.rLeg.A,
  };
};
/** limb groups in build order: torso, arms, legs, head */
export const LIMBS: {g: 'torso' | 'arms' | 'legs' | 'head'; a: KPName; b: KPName; side: 'l' | 'r' | 'c'}[] = [
  {g: 'torso', a: 'neck', b: 'lhip', side: 'l'}, {g: 'torso', a: 'neck', b: 'rhip', side: 'r'}, {g: 'torso', a: 'lhip', b: 'rhip', side: 'c'},
  {g: 'arms', a: 'neck', b: 'lsh', side: 'l'}, {g: 'arms', a: 'neck', b: 'rsh', side: 'r'},
  {g: 'arms', a: 'lsh', b: 'lel', side: 'l'}, {g: 'arms', a: 'lel', b: 'lwr', side: 'l'},
  {g: 'arms', a: 'rsh', b: 'rel', side: 'r'}, {g: 'arms', a: 'rel', b: 'rwr', side: 'r'},
  {g: 'legs', a: 'lhip', b: 'lkn', side: 'l'}, {g: 'legs', a: 'lkn', b: 'lan', side: 'l'},
  {g: 'legs', a: 'rhip', b: 'rkn', side: 'r'}, {g: 'legs', a: 'rkn', b: 'ran', side: 'r'},
  {g: 'head', a: 'neck', b: 'head', side: 'c'},
];
const GROUP_KP: Record<string, KPName[]> = {torso: ['neck', 'lhip', 'rhip'], arms: ['lsh', 'rsh', 'lel', 'rel', 'lwr', 'rwr'], legs: ['lkn', 'rkn', 'lan', 'ran'], head: ['head']};
export const COL = {l: '#FFD24A', r: '#5CE1FF', c: '#B6F3FF'};

export type Build = {torso: number; arms: number; legs: number; head: number};
export const BUILT: Build = {torso: 1, arms: 1, legs: 1, head: 1};

/** draw keypoints (already mapped to screen) as an estimated skeleton. w: limb width px. */
export const SkeletonDraw: React.FC<{id: string; kp: Record<KPName, Pt>; w: number; build?: Build; glow?: number; opacity?: number; dissolve?: number}> = ({id, kp, w, build = BUILT, glow = 1, opacity = 1, dissolve = 0}) => {
  const lim = LIMBS.map((L, i) => {
    const b = build[L.g];
    if (b <= 0) return null;
    // a limb grows from its first joint
    const a = kp[L.a], c = kp[L.b];
    const e = {x: a.x + (c.x - a.x) * clamp(b), y: a.y + (c.y - a.y) * clamp(b)};
    return {i, a, e, col: COL[L.side], b};
  }).filter(Boolean) as {i: number; a: Pt; e: Pt; col: string; b: number}[];
  const pts = (Object.keys(GROUP_KP) as (keyof Build)[]).flatMap((g) => (build[g] > 0.15 ? GROUP_KP[g].map((k) => ({k, p: kp[k], a: clamp((build[g] - 0.15) / 0.5)})) : []));
  const hr = w * 3.4;
  return (
    <g opacity={opacity * (1 - dissolve)}>
      <defs>
        <radialGradient id={`${id}-heat`}>
          <stop offset="0" stopColor="#FFF6C2" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#FF9E3D" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FF4D6D" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* keypoint heat (the network's confidence maps) */}
      {pts.map(({k, p, a}) => <circle key={`h${k}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(hr * (k === 'head' ? 1.5 : 1))} fill={`url(#${id}-heat)`} opacity={0.55 * a * glow} />)}
      {lim.map((l) => <line key={`g${l.i}`} x1={f1(l.a.x)} y1={f1(l.a.y)} x2={f1(l.e.x)} y2={f1(l.e.y)} stroke={l.col} strokeWidth={w * 2.6} strokeLinecap="round" opacity={0.22 * glow} />)}
      {lim.map((l) => <line key={`l${l.i}`} x1={f1(l.a.x)} y1={f1(l.a.y)} x2={f1(l.e.x)} y2={f1(l.e.y)} stroke={l.col} strokeWidth={w} strokeLinecap="round" />)}
      {pts.map(({k, p, a}) => <circle key={`p${k}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(w * (k === 'head' ? 1.6 : 0.95))} fill="#FFFFFF" opacity={a} />)}
    </g>
  );
};
/** map rig-local keypoints into a screen box: the figure's bounding frame `src` (rig units) to `dst` (px) */
export const mapKP = (kp: Record<KPName, Pt>, fn: (p: Pt) => Pt) => Object.fromEntries(Object.entries(kp).map(([k, p]) => [k, fn(p)])) as Record<KPName, Pt>;
