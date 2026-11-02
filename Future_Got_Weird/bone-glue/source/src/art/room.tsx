// The room: a quiet, dark operating-room backdrop seen past the hand table, the hand table itself (a sterile blue
// drape during surgery; a paper-covered clinic table at the follow-up) and the drape fold that covers the patient's
// forearm. All in wrist-plane millimetres (anatomy.ts). Deterministic, no text or glyphs.
//
//   RoomBack      far layer (z about +600): floor and wall in dark teal-grey, the overhead lamp's warm pool, two soft
//                 out-of-focus shapes. Covers +-20 m so no edge can ever show.
//   HandTable     the table plane under the patient's arm (z about +40): 'drape' or 'followup'; covers x -900..900,
//                 y -900..1200 (the drape) or more (the follow-up table).
//   DrapeOverArm  a fold of drape lying over the forearm from about y = +150 downward: draw it ABOVE the arm.
import React from 'react';
import {C, INK} from './palette';
import {mix, lit, shade} from '../core/color';
import {skinBorders} from './anatomy';
import {P, pt, open, closed} from '../core/geo';
import {noise1} from '../lib';

const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
const NS = 'non-scaling-stroke' as const;

// ------------------------------------------------------------------------------------------------ room
export const RoomBack: React.FC<{id: string; t: number}> = ({id, t}) => {
  // a slow breath in the lamp's pool (barely perceptible), deterministic in t
  const br = 1 + 0.025 * noise1(t * 0.35, 3);
  const BIG = 20000;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} gradientUnits="userSpaceOnUse" x1="0" y1="-1400" x2="0" y2="1400">
          <stop offset="0" stopColor={mix(C.roomLit, C.room, 0.25)} />
          <stop offset="0.38" stopColor={C.roomLit} />
          <stop offset="0.62" stopColor={mix(C.room, C.roomLit, 0.35)} />
          <stop offset="1" stopColor={shade(C.room, 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}-lp`} gradientUnits="userSpaceOnUse" cx="60" cy="-120" r={f(900 * br)}>
          <stop offset="0" stopColor={C.lamp} stopOpacity={0.3} />
          <stop offset="0.35" stopColor={C.lamp} stopOpacity={0.14} />
          <stop offset="0.7" stopColor={C.lamp} stopOpacity={0.04} />
          <stop offset="1" stopColor={C.lamp} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vg`} gradientUnits="userSpaceOnUse" cx="60" cy="-100" r="2600">
          <stop offset="0.35" stopColor="#081218" stopOpacity={0} />
          <stop offset="1" stopColor="#081218" stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id={`${id}-sp`} gradientUnits="userSpaceOnUse" cx="-520" cy="-1150" r="260">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="0.3" stopColor={C.lamp} stopOpacity={0.28} />
          <stop offset="1" stopColor={C.lamp} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2}>
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>
      {/* floor below, the far wall above (the band where they meet is lit by the lamp) */}
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={shade(C.room, 0.35)} />
      <rect x={-BIG} y={-1400} width={BIG * 2} height={2800} fill={`url(#${id}-fl)`} />
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG - 1400} fill={mix(C.roomLit, C.room, 0.25)} />
      {/* soft out-of-focus shapes: an equipment cart's dark mass on the left, a skirting line on the far wall */}
      <g filter={`url(#${id}-bl)`}>
        <rect x={-1500} y={-1240} width={BIG} height={60} fill={shade(C.room, 0.25)} opacity={0.7} />
        <rect x={-1150} y={-900} width={420} height={700} rx={60} fill={shade(C.room, 0.45)} opacity={0.75} />
        <rect x={-1110} y={-860} width={340} height={70} rx={30} fill={C.roomLit} opacity={0.5} />
        <ellipse cx={980} cy={-700} rx={260} ry={420} fill={shade(C.room, 0.3)} opacity={0.6} />
      </g>
      {/* the lamp's warm pool and its far reflection */}
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={`url(#${id}-lp)`} />
      <ellipse cx="-520" cy="-1150" rx="300" ry="200" fill={`url(#${id}-sp)`} />
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={`url(#${id}-vg)`} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the arm's shadow
/** the soft shadow the patient's forearm and palm cast on the table (light from the upper left: it falls down-right) */
const ArmShadow: React.FC<{id: string; alpha: number; color: string}> = ({id, alpha, color}) => {
  const L: P[] = [], R: P[] = [];
  for (let y = 1100; y >= -150; y -= 25) {
    const [l, r] = skinBorders(y);
    const taper = y < -120 ? 0.85 : 1;
    L.push(pt(l * taper + 7, y + 9));
    R.push(pt(r * taper + 10, y + 9));
  }
  const d = closed([...R, ...[...L].reverse()], 0.6);
  return (
    <g>
      <defs>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path d={d} fill={color} opacity={alpha} filter={`url(#${id}-f)`} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ hand table
/** soft cloth folds: a lit ridge with a shadowed trough beside it, blurred */
const Folds: React.FC<{id: string; folds: P[][]; lit: string; deep: string; blur: number; a?: number}> = ({id, folds, lit: litC, deep, blur, a = 1}) => (
  <g>
    <defs>
      <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
        <feGaussianBlur stdDeviation={f(blur)} />
      </filter>
    </defs>
    <g filter={`url(#${id}-f)`} opacity={a}>
      {folds.map((ps, i) => (
        <g key={i}>
          <path d={open(ps.map((p) => pt(p.x + 9, p.y + 7)), 1)} fill="none" stroke={deep} strokeWidth={16} strokeLinecap="round" opacity={0.75} />
          <path d={open(ps, 1)} fill="none" stroke={litC} strokeWidth={11} strokeLinecap="round" opacity={0.7} />
        </g>
      ))}
    </g>
  </g>
);

export const HandTable: React.FC<{id: string; variant: 'drape' | 'followup'}> = ({id, variant}) => {
  if (variant === 'followup') {
    // a light clinic table top with a strip of exam paper along the arm
    const paper = (y: number) => {
      const w = 270 + 6 * noise1(y * 0.004, 7);
      return [-w + 8 * noise1(y * 0.006, 2), w + 8 * noise1(y * 0.006, 5)];
    };
    const L: P[] = [], R: P[] = [];
    for (let y = 1400; y >= -1100; y -= 50) {
      const [l, r] = paper(y);
      L.push(pt(l, y));
      R.push(pt(r, y));
    }
    const paperD = closed([...R, ...[...L].reverse()], 0.5);
    // soft crinkles in the exam paper (a few near the arm, where the follow-up camera looks, and more further out)
    const crinkles: P[][] = [
      [pt(-220, -420), pt(-120, -360), pt(-30, -330)],
      [pt(90, -260), pt(170, -190), pt(230, -160)],
      [pt(-240, 120), pt(-150, 150), pt(-90, 210)],
      [pt(110, 260), pt(190, 330), pt(250, 350)],
      [pt(-200, -720), pt(-60, -690)],
      [pt(-120, -250), pt(-88, -196), pt(-70, -150)],
      [pt(52, -40), pt(78, 10), pt(118, 40)],
      [pt(-110, 30), pt(-82, 70), pt(-76, 120)],
      [pt(40, -300), pt(70, -262), pt(120, -240)],
    ];
    // the paper's long sag fold down its middle, beside the arm (a faint cool crease and its lit edge)
    const sag: P[][] = [[pt(-150, -900), pt(-140, -300), pt(-152, 300), pt(-140, 900)], [pt(150, -900), pt(160, -260), pt(146, 320), pt(158, 900)]];
    return (
      <g>
        <defs>
          <linearGradient id={`${id}-tb`} gradientUnits="userSpaceOnUse" x1="-900" y1="-700" x2="900" y2="900">
            <stop offset="0" stopColor="#E3DED5" />
            <stop offset="0.5" stopColor="#D6D0C5" />
            <stop offset="1" stopColor="#BDB6AA" />
          </linearGradient>
          <linearGradient id={`${id}-pp`} gradientUnits="userSpaceOnUse" x1="-300" y1="-500" x2="300" y2="500">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.45" stopColor="#F2F5F8" />
            <stop offset="1" stopColor="#D5DEE6" />
          </linearGradient>
          <filter id={`${id}-ps`} filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect x={-3000} y={-3000} width={6000} height={6000} fill={`url(#${id}-tb)`} />
        {/* the paper's soft shadow on the table, the paper, its edges */}
        <path d={paperD} fill="#6E6457" opacity={0.25} filter={`url(#${id}-ps)`} transform="translate(5 6)" />
        <path d={paperD} fill={`url(#${id}-pp)`} />
        <path d={paperD} fill="none" stroke={INK} strokeWidth={2.2} vectorEffect={NS} opacity={0.55} />
        <Folds id={`${id}-sg`} folds={sag} lit="#FFFFFF" deep="#B9C5D0" blur={10} a={0.5} />
        <Folds id={`${id}-cr`} folds={crinkles} lit="#FFFFFF" deep="#A9B7C5" blur={3.5} a={0.55} />
        <ArmShadow id={`${id}-as`} alpha={0.28} color="#5B6878" />
      </g>
    );
  }
  // sterile drape: dark blue cloth, lit in the middle by the lamp, deeper toward the edges, long soft folds
  const folds: P[][] = [
    [pt(-420, -820), pt(-330, -560), pt(-300, -300), pt(-340, -60)],
    [pt(260, -860), pt(200, -620), pt(170, -420)],
    [pt(-700, 200), pt(-480, 260), pt(-260, 360), pt(-150, 560)],
    [pt(150, 420), pt(320, 520), pt(520, 560), pt(820, 620)],
    [pt(-820, -380), pt(-640, -300), pt(-520, -160)],
    [pt(420, -280), pt(560, -120), pt(700, 0), pt(860, 40)],
    [pt(-160, -600), pt(-120, -460), pt(-140, -360)],
    [pt(90, 160), pt(150, 260), pt(170, 380)],
  ];
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-dr`} gradientUnits="userSpaceOnUse" cx="20" cy="-60" r="900" fx="-40" fy="-140">
          <stop offset="0" stopColor={C.drapeLit} />
          <stop offset="0.35" stopColor={mix(C.drapeLit, C.drape, 0.55)} />
          <stop offset="0.7" stopColor={C.drape} />
          <stop offset="1" stopColor={C.drapeDeep} />
        </radialGradient>
      </defs>
      <rect x={-900} y={-900} width={1800} height={2100} fill={C.drapeDeep} />
      <rect x={-3000} y={-3000} width={6000} height={6000} fill={C.drapeDeep} opacity={0} />
      <rect x={-900} y={-900} width={1800} height={2100} fill={`url(#${id}-dr)`} />
      <Folds id={`${id}-fo`} folds={folds} lit={lit(C.drapeLit, 0.08)} deep={C.drapeDeep} blur={9} a={0.8} />
      <ArmShadow id={`${id}-as`} alpha={0.45} color="#08141D" />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ drape over the arm
/** a fold of drape lying over the forearm from about y = +150 downward (draw above the arm) */
export const DrapeOverArm: React.FC<{id: string}> = ({id}) => {
  // the folded top edge: a rolled rim across the arm, gently wavy
  const edge: P[] = [];
  for (let x = -230; x <= 190; x += 30) edge.push(pt(x, 150 + 7 * Math.sin(x * 0.021 + 0.6) + 4 * noise1(x * 0.02, 4) + 0.0004 * x * x));
  const top = edge;
  const outline = [...top, pt(250, 420), pt(320, 1300), pt(-330, 1300), pt(-290, 420)];
  const d = closed(outline, 0.55);
  const rim = open(top, 1);
  const rimLo = open(top.map((p) => pt(p.x + 2, p.y + 15)), 1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="-200" y1="150" x2="120" y2="600">
          <stop offset="0" stopColor={C.drapeLit} />
          <stop offset="0.4" stopColor={C.drape} />
          <stop offset="1" stopColor={C.drapeDeep} />
        </linearGradient>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
      </defs>
      {/* contact shade on the skin just above the fold */}
      <path d={rim} fill="none" stroke="#3A1F14" strokeWidth={10} opacity={0.22} filter={`url(#${id}-f)`} transform="translate(0 -3)" />
      <path d={d} fill={INK} stroke={INK} strokeWidth={4.2} vectorEffect={NS} strokeLinejoin="round" />
      <path d={d} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        {/* the rolled rim: a lit band along the top, a shadow under it */}
        <path d={rimLo} fill="none" stroke={C.drapeDeep} strokeWidth={10} opacity={0.6} filter={`url(#${id}-f)`} />
        <path d={rim} fill="none" stroke={lit(C.drapeLit, 0.15)} strokeWidth={9} opacity={0.75} transform="translate(0 4)" />
        <Folds id={`${id}-fo`} folds={[[pt(-120, 260), pt(-60, 360), pt(-40, 520)], [pt(60, 250), pt(110, 330), pt(150, 480)], [pt(-250, 340), pt(-200, 480)]]} lit={C.drapeLit} deep={C.drapeDeep} blur={7} a={0.8} />
      </g>
    </g>
  );
};
