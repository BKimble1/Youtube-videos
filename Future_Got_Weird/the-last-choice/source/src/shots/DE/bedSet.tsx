// The medical bay where the friend dies (D2, D4) and where the radio is switched on (D5). World units, floor at y = 0;
// the bed (head toward screen left, backrest raised) is centred at x = 0. Everyone in D2/D4/D5 is placed from these.
import React from 'react';
import {C, REF, SYS} from '../../theme';
import {MedicalBed, bedTop, Gurney, Bench} from '../../sets/refugeInterior';
import {Plant} from '../../sets/refugePlants';
import {Glow} from '../../fx/light';
import {clamp, lerp, rad} from '../../kit/math';
import {fxId, mixHex} from '../../fx/common';
import {basis} from './common';

export const BED = {x: 0, y: 0, s: 1, incline: 30};
export const MATTRESS = bedTop(BED.y, BED.s); // −170
/** The friend's pelvis on the mattress. */
export const FRIEND = {x: 40, ySurf: MATTRESS};
/** The Director kneels in front of the bed, holding the friend's right hand at the mattress edge. */
export const DIRECTOR = {x: 175, z: 60};
export const CLASP = {x: 70, y: MATTRESS - 18};
/** The teammate sits on a gurney behind and to the right; the carrier sits on the bench at the left front (D4), where
 *  the teammate later sets down the radio, near where the visor fell (D5). */
export const GURNEY = {x: 640, y: -130, s: 0.86};
export const BENCH = {x: -560, y: 60, s: 0.95, w: 520};
/** Where the visor comes to rest on the floor after slipping off (in front of the bed's head end). */
export const VISOR_REST = {x: -190, y: -14};
export const VISOR_REST_B = basis(30, 24, 0);

/** The hinge of the raised mattress section: where the back meets the flat part (under the friend's lower back). */
export const HINGE = {x: FRIEND.x - 22, y: MATTRESS};
const PANEL_LEN = 300, PANEL_T = 30;
/** The raised head section of the mattress (hinged at HINGE, raised by `incline` degrees) with a pillow and a strut. */
export const Backrest: React.FC<{ink: number; incline?: number}> = ({ink, incline = BED.incline}) => {
  const a = rad(incline);
  const u = {x: -Math.cos(a), y: -Math.sin(a)}; // along the panel toward the head
  const n = {x: -Math.sin(a), y: Math.cos(a)};  // below the panel surface
  const P = (l: number, d: number) => ({x: HINGE.x + u.x * l + n.x * d, y: HINGE.y + u.y * l + n.y * d});
  const q = (p: {x: number; y: number}) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  const top0 = P(0, 0), top1 = P(PANEL_LEN, 0), bot1 = P(PANEL_LEN, PANEL_T), bot0 = P(0, PANEL_T);
  const strutTop = P(PANEL_LEN * 0.62, PANEL_T);
  const pil0 = P(PANEL_LEN - 150, 0), pil1 = P(PANEL_LEN - 8, 0), pilTop = P(PANEL_LEN - 70, -34);
  return (
    <g>
      <path d={`M ${q(strutTop)} L ${strutTop.x + 30} ${MATTRESS + 14}`} stroke="#9FAAB0" strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${q(top0)} L ${q(top1)} Q ${q(P(PANEL_LEN + 12, PANEL_T / 2))} ${q(bot1)} L ${q(bot0)} Z`} fill="#FBFBF8" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M ${q(pil0)} Q ${q(P(PANEL_LEN - 120, -30))} ${q(pilTop)} Q ${q(P(PANEL_LEN + 4, -34))} ${q(pil1)} Z`} fill="#FFFFFF" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
    </g>
  );
};
/** Height of the raised surface (top of the panel) at x. */
export const backrestY = (x: number, incline = BED.incline) => (x >= HINGE.x ? MATTRESS : MATTRESS - Math.tan(rad(incline)) * (HINGE.x - x));
void lerp; void clamp;

/** Monitoring pad clipped to the bed rail: a soft ring that pulses (urgent) and then holds still and dims (stopped). */
export const Monitor: React.FC<{x: number; y: number; t: number; urgent: number; stopped: number; ink: number}> = ({x, y, t, urgent, stopped, ink}) => {
  const rate = lerp(0.8, 2.2, urgent);
  const ph = (t * rate) % 1;
  const live = 1 - stopped;
  const ring = mixHex('#5ED1C3', '#A9B8B5', stopped);
  return (
    <g>
      <rect x={x - 46} y={y - 64} width={92} height={70} rx={14} fill="#FBFAF6" stroke={C.ink} strokeWidth={ink} />
      <rect x={x - 6} y={y + 6} width={12} height={30} fill={SYS.slate} stroke={C.ink} strokeWidth={ink * 0.7} />
      <circle cx={x} cy={y - 29} r={20} fill="none" stroke={ring} strokeWidth={6} opacity={0.5 + 0.5 * live} />
      {live > 0.02 && <circle cx={x} cy={y - 29} r={20 + ph * 16} fill="none" stroke={ring} strokeWidth={4 * (1 - ph)} opacity={live * (1 - ph)} />}
      <circle cx={x} cy={y - 29} r={6} fill={ring} opacity={lerp(1, 0.35, stopped)} />
      {live > 0.02 && <Glow x={x} y={y - 29} r={60} color={ring} opacity={0.35 * live * (0.6 + 0.4 * Math.sin(t * rate * Math.PI * 2))} id={fxId('mon', 3, x, y)} />}
    </g>
  );
};

/** Static furniture of the bay behind the action (far bed, plants), drawn before the cast. */
export const BayFurniture: React.FC<{t: number; ink: number}> = ({t, ink}) => (
  <g>
    <Plant x={-720} y={-60} s={0.95} t={t} seed={21} ink={ink} kind="tall" />
    <Plant x={1180} y={-70} s={0.85} t={t} seed={22} ink={ink} kind="bush" />
    <MedicalBed x={-1250} y={-80} s={0.82} ink={ink} headDir={1} />
  </g>
);
export {MedicalBed, Gurney, Bench, REF};
