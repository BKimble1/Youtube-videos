// The companion: the Weird Crew clerk (the Contacts "sender": blue cardigan over a white shirt, high bun, square
// glasses, gold earring). Head PORTED from FGW Infrared Contacts (source/src/art/Train.tsx, `Sender`): the same
// silhouette, bun, ear and earring, eye, brow, glasses, nose and mouth paths and colours. V2 adds eyelids (for the
// sip), a blowing mouth and a head tilt. The standing/walking body is new: cardigan torso from the Sender's, jointed
// legs (IK knees) on planted feet, a swinging far arm, and the near hand holding the Crew paper cup.
// Figure units = head units (eye at the origin), floor at GROUND, facing left.
import React from 'react';
import {SENDC as S, C} from '../theme3';
import {P, Pt, smooth, lerp, f3, rot, clamp} from '../lib3';
import {ik, Leg, Arm, reach} from './limb';
import {Hand, Shoe, Cup} from './Bits';
import {GROUND, THIGH, SHIN} from './LeadFigure';

export type ClerkHeadPose = {look: number; lookY: number; smile: number; lid: number; blow: number; tilt: number};
export const CHEAD0: ClerkHeadPose = {look: 0, lookY: 0, smile: 0, lid: 0, blow: 0, tilt: 0};
export const CNECK = P(10, 250);
export const CHEAD_PTS = [P(70, -320), P(-60, -300), P(-122, -210), P(-132, -120), P(-122, -60), P(-112, -20), P(-128, 20), P(-150, 60), P(-160, 78), P(-146, 92), P(-128, 98), P(-124, 110), P(-132, 124), P(-122, 136), P(-126, 150), P(-116, 192), P(-96, 222), P(-60, 238), P(0, 232), P(60, 206), P(110, 166), P(150, 110), P(200, 60), P(240, 0), P(250, -120), P(200, -250)];
const HEAD = smooth(CHEAD_PTS, true, 0.17);

export const ClerkHead: React.FC<{p: ClerkHeadPose; id: string}> = ({p, id}) => {
  const lx = -12 - 8 * p.look, ly = 4 + 4 * p.lookY;
  const lid = clamp(p.lid);
  return (
    <g>
      <defs><clipPath id={`${id}-eye`}><path d="M-44 4 C-24 -30 20 -30 44 4 C20 22 -24 22 -44 4 Z" /></clipPath></defs>
      <path d={HEAD} fill={S.skin} stroke={C.ink} strokeWidth={3.2} />
      <path d="M-128 -150 C-140 -270 -30 -350 90 -326 C200 -300 262 -190 246 -40 C220 -60 190 -110 170 -150 C120 -210 30 -220 -40 -200 C-80 -190 -110 -170 -128 -150 Z" fill={S.hair} stroke={C.ink} strokeWidth={3} />
      <circle cx={110} cy={-370} r={78} fill={S.hair} stroke={C.ink} strokeWidth={3} />
      <path d="M60 -330 C90 -300 140 -300 170 -330" fill="none" stroke="#3A3434" strokeWidth={5} />
      <path d="M128 6 C176 -28 196 40 172 76 C160 96 134 96 124 78" fill={S.skin} stroke={C.ink} strokeWidth={3} />
      <path d="M140 22 C162 16 168 46 152 62" fill="none" stroke={S.skinShade} strokeWidth={4} strokeLinecap="round" />
      <circle cx={150} cy={100} r={10} fill={S.earring} stroke={C.ink} strokeWidth={2.5} />
      {/* eye (3/4) with a lid that can lower */}
      <path d="M-44 4 C-24 -30 20 -30 44 4 C20 22 -24 22 -44 4 Z" fill="#FBF8F1" stroke={C.ink} strokeWidth={3} />
      <g clipPath={`url(#${id}-eye)`}>
        <circle cx={lx} cy={ly} r={13} fill="#3B2A20" />
        <circle cx={lx} cy={ly} r={6} fill="#0E0906" />
        <circle cx={lx - 4} cy={ly - 6} r={3.5} fill="#FFFFFF" />
        {lid > 0.01 && <path d={`M-50 -40 L50 -40 L50 ${lerp(-24, 12, lid)} C20 ${lerp(-26, 16, lid)} -24 ${lerp(-26, 16, lid)} -50 ${lerp(-24, 12, lid)} Z`} fill={S.skin} />}
      </g>
      <path d={lid > 0.01 ? `M-44 4 C-24 ${lerp(-30, 14, lid)} 20 ${lerp(-30, 14, lid)} 44 4` : 'M-44 4 C-24 -30 20 -30 44 4'} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={`M-56 ${-52 - 4 * p.smile} C-20 -70 20 -70 52 -56`} fill="none" stroke={S.hair} strokeWidth={11} strokeLinecap="round" />
      <rect x={-64} y={-34} width={110} height={70} rx={14} fill="#FFFFFF" fillOpacity={0.12} stroke={S.glasses} strokeWidth={6} />
      <path d="M46 -10 L140 -14" stroke={S.glasses} strokeWidth={6} />
      <path d="M-64 -6 L-112 -14" stroke={S.glasses} strokeWidth={6} />
      <path d="M-118 78 C-108 70 -108 92 -124 92" fill="none" stroke={S.skinShade} strokeWidth={3.4} />
      {p.blow > 0.05
        ? <ellipse cx={-120} cy={134} rx={7 + 3 * p.blow} ry={9 + 4 * p.blow} fill="#3A1A14" stroke={S.lip} strokeWidth={4} />
        : <path d={`M-98 ${136 - 6 * p.smile} Q-114 ${138 - 2 * p.smile} -127 131`} fill="none" stroke={S.lip} strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};

export type LegState = {ank: Pt; pitch: number}; // ankle in figure units, toe pitch (deg, + toe up)
export type ClerkBodyPose = {
  bob: number; // pelvis vertical offset (figure units, + down)
  lean: number; // deg, + forward (toward -x)
  near: LegState; far: LegState;
  swing: number; // far arm swing (deg, + forward)
  cup: Pt; cupAng: number; // cup base (figure units) and tilt
  breath: number;
};
export const clerkStand = (cup: Pt = P(-262, 752), cupAng = 0): ClerkBodyPose => ({
  bob: 0, lean: 0, near: {ank: P(-30, GROUND - 52), pitch: 0}, far: {ank: P(56, GROUND - 52), pitch: 0}, swing: 0, cup, cupAng, breath: 0,
});
const TORSO = 'M100 262 C-30 258 -150 320 -170 520 L-172 880 C-60 900 100 905 190 890 L200 600 C200 420 180 300 100 262 Z';

export const ClerkFigure: React.FC<{h: ClerkHeadPose; b: ClerkBodyPose; id: string}> = ({h, b, id}) => {
  const up = (q: Pt) => P(q.x, q.y + b.bob); // the upper body rides on the pelvis bob
  const hipN = up(P(-10, 834)), hipF = up(P(26, 828));
  const kn = ik(hipN, b.near.ank, THIGH, SHIN, 1), kf = ik(hipF, b.far.ank, THIGH, SHIN, 1);
  const shF = up(P(40, 370)), shN = up(P(-34, 384));
  // far arm: hangs and swings from the shoulder (elbow trails slightly)
  const sw = b.swing - 6;
  const elF = P(shF.x + 296 * Math.sin((-sw * Math.PI) / 180), shF.y + 296 * Math.cos((sw * Math.PI) / 180));
  const fa = sw + 20; // a small elbow bend; at rest the hand hangs behind the hips (hidden), it shows as the arm swings
  const hF = P(elF.x + 250 * Math.sin((-fa * Math.PI) / 180), elF.y + 250 * Math.cos((fa * Math.PI) / 180));
  // near hand wraps the cup on its back (+x) side; the elbow always points down and back (toward +x)
  const grip = P(b.cup.x, b.cup.y + b.bob);
  const gp = (q: Pt) => rot(P(grip.x + q.x, grip.y + q.y), b.cupAng, grip);
  const handN = reach(shN, gp(P(54, -72)), 296 + 262 - 6);
  const elN = ik(shN, handN, 296, 262, -1);
  return (
    <g transform={`rotate(${f3(-b.lean)} 0 ${GROUND})`}>
      {/* far leg, far arm (shade) */}
      <Leg hip={hipF} knee={kf} ank={b.far.ank} w={[150, 116, 98]} fill="#25344D" />
      <Shoe a={b.far.ank} dir={-1} pitch={b.far.pitch} fill="#2C1F19" sole="#4A3A30" />
      <Arm sh={shF} el={elF} wr={hF} w={[68, 60, 52]} fill={S.cardiganShade} id={`${id}-af`} />
      <Hand p={hF} ang={90 + fa} skin={S.skinShade} deep="#5E3A26" s={0.95} side={-1} />
      {/* near leg */}
      <Leg hip={hipN} knee={kn} ank={b.near.ank} w={[156, 120, 100]} fill={S.trousers} crease="#24344F" />
      <Shoe a={b.near.ank} dir={-1} pitch={b.near.pitch} fill={S.shoe} sole="#5A4638" />
      <path d={`M${f3(hipN.x - 160)} ${f3(hipN.y - 40)} L${f3(hipN.x + 200)} ${f3(hipN.y - 50)} L${f3(hipN.x + 206)} ${f3(hipN.y + 50)} C${f3(hipN.x + 120)} ${f3(hipN.y + 100)} ${f3(hipN.x - 110)} ${f3(hipN.y + 100)} ${f3(hipN.x - 166)} ${f3(hipN.y + 60)} Z`} fill={S.trousers} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
      <g transform={`translate(0 ${f3(b.bob)})`}>
        <defs><clipPath id={`${id}-cardi`}><path d={TORSO} /></clipPath></defs>
        <path d="M-40 180 L-46 300 L60 300 L56 190 Z" fill={S.skinShade} stroke={C.ink} strokeWidth={3} />
        <g transform={`translate(0 880) scale(1 ${1 + b.breath / 100}) translate(0 -880)`}>
          <path d={TORSO} fill={S.shirt} stroke={C.ink} strokeWidth={3.4} />
          <g clipPath={`url(#${id}-cardi)`}>
            <path d="M-20 260 L-80 900 L260 900 L260 260 Z" fill={S.cardigan} />
            <path d="M-60 300 C-120 420 -150 600 -160 900 L-90 900 L-30 300 Z" fill={S.cardigan} />
            <path d="M120 300 C170 500 180 700 170 920" fill="none" stroke={S.cardiganShade} strokeWidth={30} />
            <path d="M-172 846 L200 846 L200 900 L-172 900 Z" fill={S.cardiganShade} />
          </g>
          <path d={TORSO} fill="none" stroke={C.ink} strokeWidth={3.4} />
        </g>
        <g transform={`rotate(${f3(h.tilt)} ${CNECK.x} ${CNECK.y})`}>
          <ClerkHead p={h} id={`${id}-h`} />
        </g>
      </g>
      {/* the cup in the near hand, then the near arm */}
      <Cup p={grip} ang={b.cupAng} s={1} />
      <Arm sh={shN} el={elN} wr={handN} w={[74, 64, 56]} fill={S.cardigan} id={`${id}-an`} cuff={S.cardiganShade} />
      <Hand p={handN} ang={180 + b.cupAng} skin={S.skin} deep={S.skinShade} side={1} grip={0.7} />
    </g>
  );
};
export {lerp};
