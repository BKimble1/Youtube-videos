// The lead, standing (new V2 body; the Contacts lead only ever sat). Shirt, stripes, collar, neck and the arm
// construction follow the Contacts `LeadBody`; the legs, standing hips, jointed arms (IK elbows), hands and the sheet
// of paper are new. Figure units = head units (near eye at the origin), floor at GROUND, facing right.
import React from 'react';
import {LEADC as L, C} from '../theme2';
import {P, Pt, smooth, lerp, f3, rot} from '../lib2';
import {LeadHead, LeadPose, NECK} from './LeadHead';
import {ik, Limb, Leg} from './limb';
import {Hand, Shoe} from './Bits';

export const GROUND = 1660;
export const THIGH = 392, SHIN = 386;
export type LeadBodyPose = {
  breath: number; // -1..1
  lean: number; // deg, + forward (toward the face side)
  hands: number; // 0 reading height .. 1 lowered (startle drops the sheet a little)
  sheet: number; // sheet tilt (deg)
  weight: number; // -1 weight on the far leg .. 1 on the near leg (hip shift)
};
export const BODY0: LeadBodyPose = {breath: 0, lean: 0, hands: 0, sheet: 0, weight: 0.3};

const TORSO = smooth([P(-92, 262), P(40, 262), P(150, 330), P(172, 520), P(160, 720), P(170, 900), P(-160, 920), P(-196, 720), P(-200, 470), P(-180, 330)], true, 0.16);
const SLEEVE = '#F0EADD';
const SLEEVE_FAR = '#DCD4C2';

const striped = (a: Pt, b: Pt, w: number, n: number, col: string, k0 = 0.18) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, h = w / 2 - 5;
  return Array.from({length: n}, (_, i) => {
    const t = k0 + (i * (1 - 2 * k0)) / Math.max(1, n - 1);
    const c = P(a.x + dx * t, a.y + dy * t);
    return <path key={i} d={`M${f3(c.x + nx * h)} ${f3(c.y + ny * h)}L${f3(c.x - nx * h)} ${f3(c.y - ny * h)}`} stroke={col} strokeWidth={17} strokeLinecap="butt" />;
  });
};

// the sheet held in both hands: a foreshortened page facing the reader
const Sheet: React.FC<{a: Pt; b: Pt}> = ({a, b}) => {
  // a = near (lower) edge centre at the near hand, b = upper edge centre; the page is ~90 units deep
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, d = 46;
  const q = [P(a.x + nx * d, a.y + ny * d), P(b.x + nx * d, b.y + ny * d), P(b.x - nx * d, b.y - ny * d), P(a.x - nx * d, a.y - ny * d)];
  return (
    <g>
      <path d={`M${q.map((p) => `${f3(p.x)} ${f3(p.y)}`).join('L')}Z`} fill="#FBF8F1" stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
        const c = P(a.x + dx * t, a.y + dy * t);
        return <path key={i} d={`M${f3(c.x + nx * 28)} ${f3(c.y + ny * 28)}L${f3(c.x - nx * (i === 4 ? 0 : 26))} ${f3(c.y - ny * (i === 4 ? 0 : 26))}`} stroke="#B9B2A4" strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const LeadFigure: React.FC<{p: LeadPose; b: LeadBodyPose; id: string; accent?: number; sk?: number}> = ({p, b, id, accent = 0, sk = 1}) => {
  const br = b.breath * 3;
  const hipN = P(-6 + 10 * b.weight, 862), hipF = P(24 + 10 * b.weight, 856);
  const ankN = P(26, GROUND - 52), ankF = P(-60, GROUND - 54);
  const kneeN = ik(hipN, ankN, THIGH, SHIN, -1), kneeF = ik(hipF, ankF, THIGH, SHIN, -1);
  // arms: the hands hold the sheet in front of the chest
  const drop = b.hands * 70;
  const shN = P(-46, 372), shF = P(10, 350);
  const handN = P(236, 630 + drop), handF = P(300, 590 + drop);
  const elN = ik(shN, handN, 300, 262, 1), elF = ik(shF, handF, 300, 262, 1);
  const sheetA = P(handN.x + 40, handN.y - 30), sheetB = rot(P(handN.x + 150, handN.y - 290), b.sheet, sheetA);
  return (
    <g transform={`rotate(${f3(b.lean)} 0 ${GROUND})`}>
      {/* far leg and far arm (in shade) */}
      <Leg hip={hipF} knee={kneeF} ank={ankF} w={[156, 122, 104]} fill="#25344D" />
      <Shoe a={ankF} dir={1} fill="#DCD8CE" />
      <Limb a={shF} j={elF} b={handF} w1={70} w2={64} c1={SLEEVE_FAR} />
      <Hand p={handF} ang={Math.atan2(handF.y - elF.y, handF.x - elF.x) * 57.3 - 20} skin={L.skinShade} deep={L.skinDeep} s={0.95} />
      {/* near leg */}
      <Leg hip={hipN} knee={kneeN} ank={ankN} w={[162, 126, 106]} fill={L.trousers} crease="#24344F" />
      <Shoe a={ankN} dir={1} fill={L.shoe} />
      {/* hips (trousers top under the shirt hem) */}
      <path d="M-170 830 L172 830 L180 930 C120 980 -120 990 -176 940 Z" fill={L.trousers} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
      {/* neck */}
      <path d="M-80 170 L-86 310 L46 310 L40 200 Z" fill={L.skinShade} stroke={C.ink} strokeWidth={3.2} />
      {/* torso (breathes) */}
      <g transform={`translate(0 900) scale(1 ${1 + br / 300}) translate(0 -900)`}>
        <defs><clipPath id={`${id}-torso`}><path d={TORSO} /></clipPath></defs>
        <path d={TORSO} fill={L.shirt} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
        <g clipPath={`url(#${id}-torso)`}>
          {Array.from({length: 9}, (_, i) => <rect key={i} x={-260} y={310 + i * 74} width={480} height={32} fill={L.stripe} />)}
          <path d="M-200 400 C-170 600 -170 800 -140 930 L-260 930 L-260 400 Z" fill={L.shirtShade} opacity={0.5} />
        </g>
        <path d="M-84 262 C-50 314 24 314 52 262 L48 290 C18 334 -56 334 -88 290 Z" fill={L.shirt} stroke={C.ink} strokeWidth={3.2} />
      </g>
      {/* head */}
      <g transform={`rotate(${f3(p.tilt)} ${NECK.x} ${NECK.y})`}>
        <LeadHead p={p} id={`${id}-h`} accent={accent} sk={sk} />
      </g>
      {/* the sheet, then the near arm over it */}
      <Sheet a={sheetA} b={sheetB} />
      <Limb a={shN} j={elN} b={handN} w1={76} w2={70} c1={SLEEVE} />
      {striped(shN, elN, 76, 3, L.stripe)}
      {striped(elN, handN, 70, 3, L.stripe, 0.2)}
      <Hand p={handN} ang={Math.atan2(handN.y - elN.y, handN.x - elN.x) * 57.3 - 30} skin={L.skin} deep={L.skinDeep} grip={0.5} />
    </g>
  );
};
// world-facing anchors in figure units
export const LEAD_FIG = {height: GROUND + 392, earY: 44, earX: -146};
export {lerp};
