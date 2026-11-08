// The lab: one world seen by the perspective camera (cam3). The bench runs to screen-left; the array sits on it at
// the origin; the guesser stands at the bench's end and reaches over the array with his right (far) hand, whose
// thumb side faces the camera. The far wall is a real plane 900 u behind, so every camera move has true parallax.
// Ink is kept at a constant on-screen width whatever the zoom.
import React from 'react';
import {Cam3, figMatrix, planeMatrix, project, projectPoly, polyD} from './cam3';
import {Box, Device} from './device';
import {Man, ManPose, manJoints, GUESSER} from '../dc/Man';
import {Expr} from '../dc/Head';
import {HAND_RELAXED, HandPose} from '../dc/Hand';
import {ProfileArm, HPose, handGeo} from './hand';
import {PAL, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {V} from '../dc/math';
import {placeHand, handUV} from '../dc/rig';
import {HandPose as DcHandPose} from '../dc/Hand';

export const CARD = {w: 64, h: 40, y: -48};
const H_PINCH: DcHandPose = {curl: [0.34, 0.5, 0.58, 0.64], spread: 0.12, thumb: 30, thumbCurl: 0.35};

export const HAND_L = 96; // DIM.hand * s (s = 1)
export const BENCH_END = 150;

export type Placement = {pose: HPose; ang: number; pad: V};
/** the wrist that puts the index pad on `pad` (figure plane, v down) with the hand axis at `ang` (deg) */
export const wristFor = (pl: Placement): V => {
  const dir = {x: Math.cos((pl.ang * Math.PI) / 180), y: Math.sin((pl.ang * Math.PI) / 180)};
  const g = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, pl.pose);
  return {x: pl.pad.x - g.pad.x, y: pl.pad.y - g.pad.y};
};

export type LabState = {
  cam: Cam3;
  man: ManPose;
  expr: Expr;
  blink?: number;
  lHand?: HandPose;
  hand: Placement;
  /** extra: overlay in figure-plane coords (v down), drawn over everything in the lab */
  overlay?: (k: number) => React.ReactNode;
  /** under the hand (between the device and the figure) */
  under?: (k: number) => React.ReactNode;
  glow?: (i: number, j: number) => number;
  /** the index pad's indentation 0..1 */
  press?: number;
  /** fade the guesser's body (close-ups don't need it) */
  body?: boolean;
  /** depth-of-field: blur the wall (px) */
  wallBlur?: number;
  /** a plain card held in the near hand, its centre x in the gap (figure plane) */
  card?: number | null;
};

/** on-screen contour width (px) -> figure units at this camera */
export const inkFor = (c: Cam3, px = 6.2) => {
  const m = figMatrix(c, 0, 0);
  return px / Math.max(0.05, m.scale);
};

export const Wall: React.FC<{c: Cam3; blur?: number; id: string}> = ({c, blur = 0, id}) => {
  const z = -900;
  const m = planeMatrix(c, {x: 0, y: 0, z}, {x: 1, y: 0, z: 0}, {x: 0, y: -1, z: 0});
  // lab wall: a cool teal-navy gradient, a long shelf with boxes and bottles, an oscilloscope screen, cable tray
  const shelves = [
    {x: -1500, w: 1300, y: -520},
    {x: 300, w: 1200, y: -560},
  ];
  return (
    <g transform={m.m} filter={blur > 0.3 ? `url(#${id}-wb)` : undefined}>
      <defs>
        <linearGradient id={`${id}-wg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#163447" />
          <stop offset="0.55" stopColor="#1E4A5C" />
          <stop offset="1" stopColor="#163B4B" />
        </linearGradient>
        <radialGradient id={`${id}-wl`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5FB7C9" stopOpacity="0.35" />
          <stop offset="1" stopColor="#5FB7C9" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={(blur / Math.max(0.05, m.scale)).toFixed(2)} />
        </filter>
      </defs>
      <rect x={-4200} y={-2600} width={8400} height={4200} fill={`url(#${id}-wg)`} />
      <ellipse cx={-300} cy={-300} rx={1700} ry={1000} fill={`url(#${id}-wl)`} />
      {/* cable tray */}
      <rect x={-4200} y={-1180} width={8400} height={40} fill="#123041" />
      {/* shelves with lab clutter */}
      {shelves.map((s, k) => (
        <g key={k}>
          <rect x={s.x} y={s.y} width={s.w} height={22} fill="#0F2A39" />
          {Array.from({length: 9}).map((_, i) => {
            const bx = s.x + 40 + i * (s.w / 9);
            const h = 60 + ((i * 37 + k * 13) % 5) * 22;
            const w = 50 + ((i * 17) % 3) * 25;
            const round = (i + k) % 3 === 0;
            return round ? (
              <g key={i}>
                <rect x={bx} y={s.y - h} width={w * 0.7} height={h} rx={w * 0.3} fill="#2C5F72" opacity={0.85} />
                <rect x={bx + w * 0.2} y={s.y - h - 22} width={w * 0.3} height={24} fill="#21485A" />
              </g>
            ) : (
              <rect key={i} x={bx} y={s.y - h} width={w} height={h} rx={6} fill={i % 2 ? '#24546A' : '#1B4457'} />
            );
          })}
        </g>
      ))}
      {/* oscilloscope-style monitor */}
      <g transform="translate(-700 -230)">
        <rect x={-210} y={-140} width={420} height={280} rx={18} fill="#0E2230" stroke="#0A1822" strokeWidth={14} />
        <path d="M-180 0 Q-150 -70 -120 0 T-60 0 T0 0 T60 0 T120 0 T180 0" fill="none" stroke="#46CFFF" strokeOpacity={0.55} strokeWidth={8} />
        <rect x={-30} y={140} width={60} height={70} fill="#0B1C27" />
      </g>
      {/* pegboard */}
      <g transform="translate(900 -160)" opacity={0.55}>
        <rect x={-260} y={-200} width={520} height={360} rx={10} fill="#1A3E50" />
        {Array.from({length: 54}).map((_, i) => (
          <circle key={i} cx={-230 + (i % 9) * 57} cy={-170 + Math.floor(i / 9) * 57} r={7} fill="#123241" />
        ))}
      </g>
    </g>
  );
};

export const Floor: React.FC<{c: Cam3}> = ({c}) => {
  if (c.y < -470) return null;
  const q = projectPoly(c, [
    {x: -4000, y: -480, z: -900},
    {x: 4000, y: -480, z: -900},
    {x: 4000, y: -480, z: 4000},
    {x: -4000, y: -480, z: 4000},
  ]);
  return <path d={polyD(q)} fill="#10293A" />;
};

export const Bench: React.FC<{c: Cam3; ink: number}> = ({c, ink}) => (
  <g>
    {/* cabinet under the top */}
    <Box c={c} b={[-1400, BENCH_END - 30, -480, -16, -95, 95]} col={{top: '#6E7F8E', front: '#566676', side: '#4B5A69'}} ink={ink} />
    {/* drawer lines on the cabinet front */}
    {[-1100, -700, -300].map((x, i) => {
      const a = project(c, {x, y: -40, z: 95.5});
      const b = project(c, {x, y: -470, z: 95.5});
      const hA = project(c, {x: x + 160, y: -110, z: 95.5});
      const hB = project(c, {x: x + 260, y: -110, z: 95.5});
      if ([a, b, hA, hB].some((p) => p.d < 20)) return null;
      return (
        <g key={i}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={ink * 0.6} opacity={0.6} />
          <line x1={hA.x} y1={hA.y} x2={hB.x} y2={hB.y} stroke="#9AA8B4" strokeWidth={Math.max(1.5, 6 * hA.k)} strokeLinecap="round" />
        </g>
      );
    })}
    {/* the top: pale laminate */}
    <Box c={c} b={[-1450, BENCH_END, -16, 0, -115, 115]} col={{top: '#D9E1E7', front: '#B9C5CF', side: '#A9B6C1'}} ink={ink} />
  </g>
);

/** the driver box behind the array and its ribbon cable (a real array needs a controller and power) */
export const Driver: React.FC<{c: Cam3; ink: number}> = ({c, ink}) => {
  const a = project(c, {x: -40, y: 3, z: -50});
  const b = project(c, {x: -150, y: 2, z: -78});
  const m = project(c, {x: -90, y: 1, z: -70});
  if ([a, b, m].some((p) => p.d < 20)) return null;
  return (
    <g>
      <Box c={c} b={[-250, -150, 0, 26, -100, -60]} col={{top: '#3E4B57', front: '#2E3943', side: '#27313A'}} ink={ink} />
      <path d={`M${a.x},${a.y} Q${m.x},${m.y} ${b.x},${b.y}`} fill="none" stroke="#1B232B" strokeWidth={Math.max(2, 5 * m.k)} strokeLinecap="round" />
      {(() => {
        const p = project(c, {x: -170, y: 13, z: -59.5});
        return <circle cx={p.x} cy={p.y} r={Math.max(0.8, 2.2 * p.k)} fill="#5BE3A0" />;
      })()}
    </g>
  );
};

export const Lab: React.FC<{s: LabState; id: string}> = ({s, id}) => {
  const c = s.cam;
  const ink = inkFor(c);
  const fm = figMatrix(c, 0, 0);
  const inkPx = 6.2;
  const W = wristFor(s.hand);
  let man: ManPose = {...s.man, rWx: W.x, rWy: W.y, rW: 1};
  const hasCard = s.card !== null && s.card !== undefined;
  const uv = handUV(H_PINCH, 'pinch');
  if (hasCard) man = placeHand(man, 'L', {x: (s.card as number) + CARD.w / 2 - 2, y: CARD.y}, 183, uv.u, uv.v);
  else man = {...man, lW: 1, lWx: man.x + 18, lWy: man.y + 160, lElb: 1, lWr: 4};
  const inkK = inkPx / 7 / Math.max(0.05, fm.scale);
  const dir = {x: Math.cos((s.hand.ang * Math.PI) / 180), y: Math.sin((s.hand.ang * Math.PI) / 180)};
  const farArm = (j: ReturnType<typeof manJoints>) => (
    <ProfileArm id={`${id}-ra`} f={{W, dir, L: HAND_L}} pose={s.hand.pose} skin={shade(PAL.skin, 0.05)} ink={7 * inkK * 0.72} limb={{S: j.R.S, E: j.R.E, rS: 29, rE: 23.5}} press={s.press ?? 0} />
  );
  return (
    <g>
      <Wall c={c} blur={s.wallBlur} id={`${id}-w`} />
      <Floor c={c} />
      <Bench c={c} ink={ink * fm.scale * 0.72} />
      <Driver c={c} ink={ink * fm.scale * 0.72} />
      <Device c={c} ink={ink * fm.scale * 0.6} glow={s.glow} id={`${id}-dv`} />
      <g transform={fm.m}>
        {s.under && s.under(fm.scale)}
        {c.pitch < -45 ? null : s.body !== false ? (
          <Man id={`${id}-man`} pose={man} expr={s.expr} blink={s.blink ?? 0} lHand={s.lHand ?? HAND_RELAXED} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} farArm={farArm} />
        ) : (
          (() => {
            const j = manJoints(man);
            return farArm(j);
          })()
        )}
        {hasCard && (
          <Man id={`${id}-mh`} pose={man} expr={s.expr} lHand={H_PINCH} rHand={HAND_RELAXED} outfit={GUESSER} inkK={inkK} handsOnly handsOnlySide="L"
            holdL={{front: ['t'], palmFront: true, obj: (
              <g>
                <rect x={(s.card as number) - CARD.w / 2} y={CARD.y - CARD.h / 2} width={CARD.w} height={CARD.h} rx={1.5} fill="#F7F4EC" stroke={INK} strokeWidth={7 * inkK * 0.72 * 0.72} />
                <path d={`M${(s.card as number) - CARD.w / 2 + 5},${CARD.y - 6} h${CARD.w - 14} M${(s.card as number) - CARD.w / 2 + 5},${CARD.y} h${CARD.w - 20} M${(s.card as number) - CARD.w / 2 + 5},${CARD.y + 6} h${CARD.w - 24}`} stroke="#9FB4C4" strokeWidth={1.2} />
              </g>
            )}} />
        )}
        {s.overlay && s.overlay(fm.scale)}
      </g>
    </g>
  );
};
