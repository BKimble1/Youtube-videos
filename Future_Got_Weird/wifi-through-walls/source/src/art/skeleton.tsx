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
/** V9: the estimate drawn as a body, so it reads as a person at a glance: soft glowing volumes (head, neck, a rounded
 *  torso, tapered limbs) behind the thin keypoint skeleton. Generic proportions only (no hair, face or clothing): the
 *  same mannequin for anyone. `m`: px per metre; `a(L)`: a limb's opacity (0..1, e.g. while it is being built). The far
 *  (right, cyan) side is drawn first, then the torso, then the near (left, yellow) side. */
const THICK: Record<string, number> = {'lsh-lel': 0.095, 'rsh-rel': 0.095, 'lel-lwr': 0.075, 'rel-rwr': 0.075, 'lhip-lkn': 0.15, 'rhip-rkn': 0.15, 'lkn-lan': 0.105, 'rkn-ran': 0.105, 'neck-head': 0.07};
/** `soft` (V10): scales the broad glow (1 = V9; 0.8 = a fifth less halo, the cores unchanged) */
export const BodyGlow: React.FC<{kp: Record<KPName, Pt>; m: number; a?: (L: (typeof LIMBS)[number]) => number; head?: number; torso?: number; boost?: number; soft?: number}> = ({kp, m, a = () => 1, head = 1, torso = 1, boost = 0, soft = 1}) => {
  const vol = (L: (typeof LIMBS)[number], i: number) => {
    const th = THICK[`${L.a}-${L.b}`];
    if (!th) return null;
    const A = kp[L.a], Bp = kp[L.b], o = a(L);
    if (o <= 0) return null;
    const col = L.side === 'r' ? '#3FC7F0' : L.side === 'l' ? '#F2C23A' : '#9EEBFF';
    return (
      <g key={`v${i}`} opacity={o}>
        <line x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bp.x)} y2={f1(Bp.y)} stroke={col} strokeWidth={f1(th * m * 1.5 * soft)} strokeLinecap="round" opacity={(0.16 + 0.1 * boost) * soft} />
        <line x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bp.x)} y2={f1(Bp.y)} stroke={col} strokeWidth={f1(th * m)} strokeLinecap="round" opacity={(0.42 + 0.2 * boost) * (0.5 + 0.5 * soft)} />
      </g>
    );
  };
  const far = LIMBS.map((L, i) => (L.side === 'r' ? vol(L, i) : null));
  const near = LIMBS.map((L, i) => (L.side === 'l' ? vol(L, i) : null));
  const T = [kp.lsh, kp.rsh, kp.rhip, kp.lhip];
  const tp = T.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ');
  const hr = 0.105 * m;
  // the head sits a little above the head keypoint's neck side (the keypoint is the head's centre)
  const H = kp.head;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {far}
      {torso > 0 && (
        <g opacity={torso}>
          <polygon points={tp} fill="#7FDFFF" stroke="#7FDFFF" strokeWidth={f1(0.13 * m)} strokeLinejoin="round" opacity={(0.3 + 0.12 * boost) * (0.5 + 0.5 * soft)} />
          <line x1={f1(kp.neck.x)} y1={f1(kp.neck.y)} x2={f1(H.x)} y2={f1(H.y)} stroke="#9EEBFF" strokeWidth={f1(0.07 * m)} strokeLinecap="round" opacity={0.4} />
        </g>
      )}
      {near}
      {head > 0 && (
        <g opacity={head}>
          <circle cx={f1(H.x)} cy={f1(H.y)} r={f1(hr * (1 + 0.35 * soft))} fill="#BFF4FF" opacity={(0.14 + 0.1 * boost) * soft} />
          <circle cx={f1(H.x)} cy={f1(H.y)} r={f1(hr)} fill="#9EEBFF" opacity={0.38 + 0.15 * boost} stroke="#E8FCFF" strokeWidth={f1(Math.max(2, 0.012 * m))} strokeOpacity={0.8} />
        </g>
      )}
    </g>
  );
};
