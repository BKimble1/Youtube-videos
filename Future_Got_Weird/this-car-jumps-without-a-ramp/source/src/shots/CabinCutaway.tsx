// The cabin as a clean cutaway, seen from the front: driver, seat with side bolsters, three-point belt, steering wheel and
// dashboard. Drawn in screen space (1920x1080) at zero roll; the whole cabin rolls about the floor line.
//   the occupant's inertia carries them toward the outside of the turn (screen-left here), into the seat's side bolster; the
//   bolster pushes back toward the centre of the turn (screen-right). That push is the one arrow.
import React from 'react';
import {C, F} from '../theme';
import {Arm, Character, IDLE, Pose, reachLocal} from '../kit/Character';
import {CAST} from '../kit/cast';
import {Arrow} from '../car/parts';

const PIVOT = {x: 960, y: 1020};
const S = 1.9; // character scale
const CH = {x: 975, y: 1040}; // the character's ground point (the legs sit behind the dash)
const WHEEL = {x: 975, y: 800, rx: 232, ry: 66};
export const SEAT = {x0: 590, x1: 1360, top: 330, bottom: 900};
const INK = C.ink;
const SW = 6;

const TONE = {
  roof: '#44525C',
  pillar: '#566772',
  seat: '#38464F',
  seatEdge: '#52646F',
  bolster: '#5E727E',
  dash: '#2B363D',
  dashTop: '#566873',
  wheel: '#222C32',
  door: '#657A86',
  console: '#4B5B65',
  belt: '#2E3A41',
  beltEdge: '#8FA2AC',
  skyTop: '#C8E2EE',
  skyBot: '#F1F8FA',
};

export type CabinProps = {
  frame: number;
  roll: number; // deg, + = rolls toward the outside of the turn (screen-left side down)
  press: number; // 0..1 how hard the occupant is pressed into the bolster
  arrow: number; // 0..1 arrow opacity
  beltOn?: number;
};

/** Where the bolster's inner face is, so the figure touches it exactly. */
export const bolsterFace = (press: number) => 790 - press * 20;

export const CabinCutaway: React.FC<CabinProps> = ({frame, roll, press, arrow}) => {
  const lean = -3.2 * press;
  const hands: {l: Arm; r: Arm} = {
    l: reachLocal((WHEEL.x - WHEEL.rx + 24 - CH.x) / S, (WHEEL.y + 4 - CH.y) / S, -1, 1),
    r: reachLocal((WHEEL.x + WHEEL.rx - 24 - CH.x) / S, (WHEEL.y + 4 - CH.y) / S, 1, 1),
  };
  const pose: Pose = {...IDLE, lean, tilt: lean * 0.7, lookX: 0.05, lookY: 0.02, brows: 0.1, mouth: 'flat', armL: hands.l, armR: hands.r};
  const bodyShift = -press * 20; // toward the bolster
  const face = bolsterFace(press);
  const sq = press;

  // seat belt: from the upper anchor on the door-side pillar, over the door-side shoulder, across the chest to the buckle
  const anchor = {x: 1405, y: 212};
  const shoulder = {x: 1090 + bodyShift * 0.4, y: 500};
  const buckle = {x: 880 + bodyShift * 0.4, y: 764};
  const beltPath = (o: number) => `M ${anchor.x + o} ${anchor.y} L ${shoulder.x + o * 0.8} ${shoulder.y} L ${buckle.x + o * 0.6} ${buckle.y}`;

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id="cab-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TONE.skyTop} />
          <stop offset="1" stopColor={TONE.skyBot} />
        </linearGradient>
        <clipPath id="cab-room">
          <rect x={0} y={0} width={1920} height={1080} />
        </clipPath>
      </defs>
      {/* backdrop that does not roll: the pale light from the rear glass */}
      <rect x={0} y={0} width={1920} height={1080} fill="url(#cab-sky)" />
      <g transform={`rotate(${-roll} ${PIVOT.x} ${PIVOT.y})`}>
        <g transform="translate(0 0)">
          {/* oversize so the corners never show when the cabin rolls */}
          <rect x={-300} y={-300} width={2520} height={170} fill={TONE.roof} />
          {/* roof liner */}
          <path d="M -300 -140 L 2220 -140 L 2220 150 C 1700 105 220 105 -300 150 Z" fill={TONE.roof} stroke={INK} strokeWidth={SW} />
          {/* rear glass edge */}
          <path d="M 470 150 C 800 128 1120 128 1450 150 L 1500 640 L 420 640 Z" fill="none" stroke={INK} strokeWidth={SW} opacity={0.35} />
          {/* door-side wall (screen-right): pillar, door panel, window sill, armrest */}
          <path d="M 2220 -140 L 1500 -140 L 1420 150 L 1530 640 L 2220 640 Z" fill={TONE.pillar} stroke={INK} strokeWidth={SW} />
          <path d="M 1530 640 L 2220 640 L 2220 1200 L 1500 1200 Z" fill={TONE.door} stroke={INK} strokeWidth={SW} />
          <path d="M 1530 640 L 2220 640 L 2220 668 L 1534 668 Z" fill={TONE.dashTop} />
          <rect x={1560} y={740} width={420} height={70} rx={34} fill={TONE.console} stroke={INK} strokeWidth={SW} />
          {/* console-side wall (screen-left): pillar and the centre console */}
          <path d="M -300 -140 L 420 -140 L 500 150 L 410 640 L -300 640 Z" fill={TONE.pillar} stroke={INK} strokeWidth={SW} />
          <path d="M 410 640 L -300 640 L -300 1200 L 440 1200 Z" fill={TONE.door} stroke={INK} strokeWidth={SW} />
          <path d="M 410 640 L -300 640 L -300 668 L 414 668 Z" fill={TONE.dashTop} />
          <path d="M 300 820 C 300 760 320 730 380 730 L 500 730 C 550 730 560 760 560 820 L 560 1200 L 300 1200 Z" fill={TONE.console} stroke={INK} strokeWidth={SW} />
          <rect x={360} y={752} width={110} height={26} rx={13} fill={TONE.dashTop} />
          {/* seat back, headrest */}
          <path d={`M ${SEAT.x0 + 60} ${SEAT.bottom} L ${SEAT.x0 + 50} 470 C ${SEAT.x0 + 50} 390 ${SEAT.x0 + 160} ${SEAT.top} ${SEAT.x0 + 260} ${SEAT.top} L ${SEAT.x1 - 260} ${SEAT.top} C ${SEAT.x1 - 160} ${SEAT.top} ${SEAT.x1 - 50} 390 ${SEAT.x1 - 50} 470 L ${SEAT.x1 - 60} ${SEAT.bottom} Z`} fill={TONE.seat} stroke={INK} strokeWidth={SW} />
          <rect x={840} y={196} width={270} height={196} rx={80} fill={TONE.seatEdge} stroke={INK} strokeWidth={SW} />
          <rect x={918} y={382} width={114} height={40} fill={TONE.seat} stroke={INK} strokeWidth={SW} />
          {/* side bolster, console side (screen-left): the one the occupant is pressed into; it gives under the load */}
          <path
            d={`M ${face - 214 + sq * 10} ${SEAT.bottom - 40} C ${face - 232 + sq * 12} 780 ${face - 232 + sq * 12} 600 ${face - 196 + sq * 10} 500 C ${face - 170} 440 ${face - 60} 430 ${face} 470 L ${face} ${SEAT.bottom - 40} Z`}
            fill={TONE.bolster}
            stroke={INK}
            strokeWidth={SW}
          />
          {/* bolster, door side */}
          <path d={`M ${1950 - face + 214} ${SEAT.bottom - 40} C ${1950 - face + 232} 780 ${1950 - face + 232} 600 ${1950 - face + 196} 500 C ${1950 - face + 170} 440 ${1950 - face + 60} 430 ${1950 - face} 470 L ${1950 - face} ${SEAT.bottom - 40} Z`} fill={TONE.bolster} stroke={INK} strokeWidth={SW} />
          <path d={`M ${face - 170 + sq * 10} 540 C ${face - 186 + sq * 11} 640 ${face - 186 + sq * 11} 740 ${face - 172 + sq * 10} 820`} fill="none" stroke={C.saffron} strokeWidth={5} strokeDasharray="16 14" opacity={0.8} />
          {/* the occupant */}
          <g transform={`translate(${CH.x + bodyShift} ${CH.y}) scale(${S}) translate(-200 -500)`}>
            <Character look={CAST.clerkB} pose={pose} frame={frame} seed={9} shadow={false} life={0.2} eyeDarts={false} />
          </g>
          {/* where the body presses on the bolster */}
          <path d={`M ${face - 4} 560 C ${face - 12} 620 ${face - 12} 700 ${face - 4} 760`} fill="none" stroke={C.saffron} strokeWidth={10} opacity={press * 0.95} />
          {/* seat belt: anchored on the pillar above the door-side shoulder, over the shoulder, to the buckle on the seat */}
          <g>
            <path d={beltPath(0)} fill="none" stroke={INK} strokeWidth={46} />
            <path d={beltPath(0)} fill="none" stroke={TONE.belt} strokeWidth={38} />
            <path d={beltPath(-9)} fill="none" stroke={TONE.beltEdge} strokeWidth={5} opacity={0.8} />
            <circle cx={anchor.x} cy={anchor.y} r={30} fill="#C9D3D8" stroke={INK} strokeWidth={SW} />
            <circle cx={anchor.x} cy={anchor.y} r={11} fill="#7E909A" stroke={INK} strokeWidth={4} />
            <rect x={buckle.x - 40} y={buckle.y - 22} width={92} height={50} rx={12} fill="#C9D3D8" stroke={INK} strokeWidth={SW} transform={`rotate(-8 ${buckle.x} ${buckle.y})`} />
            <rect x={buckle.x - 20} y={buckle.y - 8} width={52} height={20} rx={6} fill="#EF6B55" stroke={INK} strokeWidth={4} transform={`rotate(-8 ${buckle.x} ${buckle.y})`} />
          </g>
          {/* dashboard with the instrument binnacle, steering column and wheel */}
          <path d="M -300 840 C 300 808 700 800 960 800 C 1220 800 1620 808 2220 840 L 2220 1200 L -300 1200 Z" fill={TONE.dash} stroke={INK} strokeWidth={SW} />
          <path d="M -300 840 C 300 808 700 800 960 800 C 1220 800 1620 808 2220 840 L 2220 862 C 1620 830 1220 822 960 822 C 700 822 300 830 -300 862 Z" fill={TONE.dashTop} opacity={0.9} />
          <rect x={845} y={812} width={260} height={92} rx={22} fill="#1C262B" stroke={INK} strokeWidth={SW} />
          <rect x={870} y={838} width={210} height={14} rx={7} fill="#4FB5C9" opacity={0.9} />
          <rect x={500} y={846} width={230} height={120} rx={20} fill="#1C262B" stroke={INK} strokeWidth={SW} />
          <rect x={522} y={868} width={186} height={12} rx={6} fill={C.saffron} opacity={0.85} />
          {/* wheel: a flat ring seen from the front, hands on it */}
          <ellipse cx={WHEEL.x} cy={WHEEL.y + 44} rx={WHEEL.rx} ry={WHEEL.ry} fill="none" stroke={INK} strokeWidth={44} />
          <ellipse cx={WHEEL.x} cy={WHEEL.y + 44} rx={WHEEL.rx} ry={WHEEL.ry} fill="none" stroke={TONE.wheel} strokeWidth={34} />
          <rect x={WHEEL.x - 56} y={WHEEL.y + 18} width={112} height={54} rx={18} fill={TONE.wheel} stroke={INK} strokeWidth={SW} />
          {/* the force: one arrow, tail on the bolster, tip stopping at the body */}
          <Arrow x={face - 236} y={625} dx={228} dy={0} px={1} color={C.teal} width={26} head={52} opacity={arrow} />
        </g>
      </g>
    </g>
  );
};

/** Two meters beside the cabin: the lean falls, the force does not. Illustrative, not measured. */
export const LeanForceMeters: React.FC<{lean: number; force: number; opacity: number}> = ({lean, force, opacity}) => {
  if (opacity <= 0.001) return null;
  const bar = (y: number, label: string, v: number, color: string) => (
    <g transform={`translate(1380 ${y})`}>
      <text x={0} y={-14} fontFamily={F.display} fontWeight={700} fontSize={32} fill={C.ink}>{label}</text>
      <rect x={0} y={0} width={440} height={34} rx={17} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <rect x={4} y={4} width={Math.max(8, 432 * v)} height={26} rx={13} fill={color} />
    </g>
  );
  return (
    <g opacity={opacity}>
      <rect x={1340} y={690} width={520} height={290} rx={28} fill={C.cream} stroke={C.ink} strokeWidth={5} opacity={0.96} />
      {bar(766, 'BODY LEAN', lean, C.saffron)}
      {bar(874, 'SIDEWAYS FORCE ON YOU', force, C.teal)}
      <text x={1600} y={954} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={20} fill={C.inkMuted} letterSpacing={2}>ILLUSTRATIVE</text>
    </g>
  );
};
