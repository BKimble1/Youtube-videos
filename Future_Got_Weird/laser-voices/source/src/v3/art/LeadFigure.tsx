// The lead, standing. V3 rebuild of the V2 body (same head, shirt, stripes, collar, trousers and shoes; same colours):
//   - a balanced stance: hips raised so the knees are only softly bent, feet under the hips, weight shifting between
//     the legs (the supporting leg straightens, the free knee relaxes);
//   - the torso twists against the hips (the chest, collar, neck and head shift and the shoulder line turns), so a head
//     check is carried by the upper body instead of a head turning on a rigid block;
//   - jointed, tapered arms (shoulder cap, elbow, forearm, cuff, wrist, hand) driven by wrist targets with fixed bend
//     directions, so an elbow never flips; the near arm is always drawn over the torso, the far arm behind it;
//   - no sheet of paper: the hands rest or gesture.
// Figure units = head units (near eye at the origin), floor at GROUND, facing right.
import React from 'react';
import {LEADC as L, C} from '../theme3';
import {P, Pt, smooth, lerp, f3, clamp} from '../lib3';
import {LeadHead, LeadPose, NECK} from './LeadHead';
import {ik, Leg, Arm, reach} from './limb';
import {Hand, Shoe} from './Bits';

export const GROUND = 1660;
export const THIGH = 392, SHIN = 386;
export const UPPER = 300, FORE = 262;
export type LeadBodyPose = {
  breath: number; // -1..1
  lean: number; // deg, + forward (toward the face side)
  weight: number; // -1 weight on the far leg .. 1 on the near leg
  twist: number; // -1 shoulders turned back (toward the camera / the source) .. 1 turned forward
  handN: Pt; // near wrist target (figure units)
  handF: Pt; // far wrist target
  angN: number; // near hand angle offset (deg)
  gripN: number; // 0 open .. 1 curled
};
export const SHOULDER_N = P(-40, 384), SHOULDER_F = P(18, 360);
export const REST_N = P(26, 902), REST_F = P(60, 880);
export const BODY0: LeadBodyPose = {breath: 0, lean: 0, weight: 0.2, twist: 0, handN: REST_N, handF: REST_F, angN: 0, gripN: 0.3};

const TORSO = smooth([P(-92, 262), P(40, 262), P(146, 330), P(166, 520), P(156, 720), P(166, 900), P(-160, 920), P(-192, 720), P(-196, 470), P(-178, 330)], true, 0.16);
const SLEEVE = '#F0EADD';
const SLEEVE_FAR = '#DCD4C2';

export const LeadFigure: React.FC<{p: LeadPose; b: LeadBodyPose; id: string; accent?: number; sk?: number}> = ({p, b, id, accent = 0, sk = 1}) => {
  const br = b.breath * 3;
  // pelvis: shifts over the supporting foot
  const px = 9 * b.weight;
  const hipN = P(-8 + px, 834), hipF = P(20 + px, 830);
  const ankN = P(4, GROUND - 52), ankF = P(-36, GROUND - 54);
  // the supporting leg is nearly straight; the free leg's knee relaxes (hip drops a touch on that side)
  const dropN = 6 * clamp(-b.weight), dropF = 6 * clamp(b.weight);
  const hN = P(hipN.x, hipN.y + dropN), hF = P(hipF.x, hipF.y + dropF);
  const kneeN = ik(hN, ankN, THIGH, SHIN, -1), kneeF = ik(hF, ankF, THIGH, SHIN, -1);
  // upper body twist: chest and shoulders slide relative to the hips (skew about the waist) and the shoulder line turns
  const tw = clamp(b.twist, -1, 1);
  const skew = -7 * tw; // deg
  const sx = (y: number) => Math.tan((skew * Math.PI) / 180) * (y - 880);
  const up = (q: Pt) => P(q.x + sx(q.y), q.y);
  const shN = up(P(SHOULDER_N.x - 16 * tw, SHOULDER_N.y + 6 * Math.abs(tw))), shF = up(P(SHOULDER_F.x + 12 * tw, SHOULDER_F.y));
  const wN = reach(shN, b.handN, UPPER + FORE - 6), wF = reach(shF, b.handF, UPPER + FORE - 6);
  const elN = ik(shN, wN, UPPER, FORE, 1), elF = ik(shF, wF, UPPER, FORE, 1);
  const neck = up(P(NECK.x, NECK.y));
  const angOf = (a: Pt, c: Pt) => (Math.atan2(c.y - a.y, c.x - a.x) * 180) / Math.PI;
  return (
    <g transform={`rotate(${f3(b.lean)} 0 ${GROUND})`}>
      {/* far leg and far arm (in shade) */}
      <Leg hip={hF} knee={kneeF} ank={ankF} w={[156, 122, 104]} fill="#25344D" />
      <Shoe a={ankF} dir={1} fill="#DCD8CE" />
      <Arm sh={shF} el={elF} wr={wF} w={[70, 62, 54]} fill={SLEEVE_FAR} id={`${id}-af`} />
      <Hand p={wF} ang={angOf(elF, wF) - 10} skin={L.skinShade} deep={L.skinDeep} s={0.92} side={-1} grip={0.4} />
      {/* near leg */}
      <Leg hip={hN} knee={kneeN} ank={ankN} w={[162, 126, 106]} fill={L.trousers} crease="#24344F" />
      <Shoe a={ankN} dir={1} fill={L.shoe} />
      {/* hips (trousers top under the shirt hem) */}
      <path d={`M${-170 + px} 826 L${172 + px} 826 L${180 + px} 926 C${120 + px} 976 ${-120 + px} 986 ${-176 + px} 936 Z`} fill={L.trousers} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
      {/* the upper body (twists against the hips) */}
      <g transform={`translate(0 880) matrix(1 0 ${f3(Math.tan((skew * Math.PI) / 180))} 1 0 0) translate(0 -880)`}>
        <path d="M-80 170 L-86 310 L46 310 L40 200 Z" fill={L.skinShade} stroke={C.ink} strokeWidth={3.2} />
        <g transform={`translate(0 900) scale(1 ${1 + br / 300}) translate(0 -900)`}>
          <defs><clipPath id={`${id}-torso`}><path d={TORSO} /></clipPath></defs>
          <path d={TORSO} fill={L.shirt} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
          <g clipPath={`url(#${id}-torso)`}>
            {Array.from({length: 9}, (_, i) => <rect key={i} x={-260} y={310 + i * 74} width={480} height={32} fill={L.stripe} />)}
            <path d={`M-200 400 C-170 600 -170 800 -140 930 L-260 930 L-260 400 Z`} fill={L.shirtShade} opacity={0.5 + 0.2 * clamp(-tw)} />
            {/* the far side of the chest shows a little more as the shoulders turn toward the camera */}
            <path d={`M${f3(150 - 26 * clamp(-tw))} 300 C${f3(170 - 30 * clamp(-tw))} 500 ${f3(170 - 30 * clamp(-tw))} 760 ${f3(160 - 26 * clamp(-tw))} 930 L260 930 L260 300 Z`} fill={L.shirtShade} opacity={0.45} />
          </g>
          <path d="M-84 262 C-50 314 24 314 52 262 L48 290 C18 334 -56 334 -88 290 Z" fill={L.shirt} stroke={C.ink} strokeWidth={3.2} />
        </g>
      </g>
      {/* head, seated on the (twisted) neck */}
      <g transform={`translate(${f3(neck.x - NECK.x)} 0) rotate(${f3(p.tilt)} ${NECK.x} ${NECK.y})`}>
        <LeadHead p={p} id={`${id}-h`} accent={accent} sk={sk} />
      </g>
      {/* near arm over the torso */}
      <Arm sh={shN} el={elN} wr={wN} w={[80, 68, 58]} fill={SLEEVE} stripe={L.stripe} id={`${id}-an`} cuff={L.shirtShade} />
      <Hand p={wN} ang={angOf(elN, wN) + b.angN} skin={L.skin} deep={L.skinDeep} grip={b.gripN} side={wN.y < elN.y ? -1 : 1} />
    </g>
  );
};
// world-facing anchors in figure units
export const LEAD_FIG = {height: GROUND + 392, earY: 44, earX: -146};
export {lerp};
// where the head sits: the neck's sideways shift from the torso twist (the head is drawn translated by this, then tilted)
export const neckShift = (b: LeadBodyPose) => Math.tan((-7 * clamp(b.twist, -1, 1) * Math.PI) / 180) * (NECK.y - 880);
