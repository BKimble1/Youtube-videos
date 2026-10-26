// V2 props and small explanation graphics: a hand with its forearm for inserts, the good-news letter, a speaker box,
// the sock puppet, a laptop for the mirror record, a recorded trial row, an open workbook with a turning page, a
// timing bracket, and traces drawn from the same viseme tracks that drive the mouths (so a mouth and its trace can
// never disagree).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Hand, HandPose, HAND_RELAXED} from '../dc/Hand';
import {CREW} from '../dc/Head';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Capsule} from '../dc/shade';
import {Robot, ROBOT_NEUTRAL, RobotState, RPAL} from '../art/Robot';
import {UI} from '../art/Ui';
import {humanVis, robotVis, Track} from '../lib/visemes';

type V = {x: number; y: number};

/** a forearm entering from `from` with the visitor's hand at `wrist` (short white sleeve edge near `from`) */
export const HandArm: React.FC<{id: string; from: V; wrist: V; ang: number; L: number; pose?: HandPose; view?: 'back' | 'palm'; thumbSide?: 1 | -1; hold?: any; sleeve?: boolean}> = ({id, from, wrist, ang, L, pose = HAND_RELAXED, view = 'back', thumbSide = -1, hold, sleeve = true}) => {
  const r0 = L * 0.27, r1 = L * 0.21;
  const dx = wrist.x - from.x, dy = wrist.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return (
    <g>
      <Capsule id={`${id}-fa`} a={from} b={{x: wrist.x - ux * L * 0.05, y: wrist.y - uy * L * 0.05}} ra={r0} rb={r1} color={CREW.skin} spec={0.3} />
      {sleeve && (
        <path
          d={`M${fmt(from.x - uy * r0 * 1.35)},${fmt(from.y + ux * r0 * 1.35)} L${fmt(from.x + uy * r0 * 1.35)},${fmt(from.y - ux * r0 * 1.35)} L${fmt(from.x + uy * r0 * 1.35 - ux * L * 0.9)},${fmt(from.y - ux * r0 * 1.35 - uy * L * 0.9)} L${fmt(from.x - uy * r0 * 1.35 - ux * L * 0.9)},${fmt(from.y + ux * r0 * 1.35 - uy * L * 0.9)} Z`}
          fill="#FFFFFF"
          stroke={INK}
          strokeWidth={L * 0.05}
          strokeLinejoin="round"
        />
      )}
      <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={thumbSide} view={view} pose={pose} color={CREW.skin} hold={hold} />
    </g>
  );
};

/** the good-news letter: a sheet with a few lines and a gold star sticker (no readable text) */
export const Letter: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number}> = ({x, y, w = 260, h = 340, rot = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={8} fill="#000" opacity={0.15} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={UI.paper} stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={-w / 2 + 28} y={-h / 2 + 110 + i * 32} width={w - 56 - (i % 3) * 30} height={8} rx={4} fill="#B9C3CE" />
    ))}
    <path d={`M0,${-h / 2 + 22} l13,27 29,4 -21,20 5,29 -26,-14 -26,14 5,-29 -21,-20 29,-4 Z`} fill="#F5C542" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

/** a small wooden speaker box; the cone and two arcs follow `level` (0..1) */
export const SpeakerBox: React.FC<{x: number; y: number; s?: number; level: number; arcs?: boolean; tint?: string}> = ({x, y, s = 1, level, arcs = true, tint = '#C98F57'}) => {
  const l = clamp(level);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      <rect x={-70} y={-110} width={140} height={210} rx={12} fill={tint} stroke={INK} strokeWidth={4} />
      <rect x={-62} y={-102} width={124} height={14} rx={4} fill={lit(tint, 0.25)} />
      <circle cx={0} cy={-50} r={26} fill="#2B333C" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={30} r={46} fill="#2B333C" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={30} r={fmt(30 + 6 * l)} fill="#4A5561" />
      <circle cx={0} cy={30} r={fmt(10 + 3 * l)} fill="#7C8792" />
      {arcs &&
        [0, 1].map((i) => (
          <path key={i} d={`M${100 + i * 34},${-20 - i * 18} Q${130 + i * 44},30 ${100 + i * 34},${80 + i * 18}`} fill="none" stroke={UI.teal} strokeWidth={8} strokeLinecap="round" opacity={clamp(l * 1.4 - i * 0.35)} />
        ))}
    </g>
  );
};

/** the sock puppet (V1 design): a hinged mouth opened by `open` */
export const Puppet: React.FC<{x: number; y: number; open: number; s?: number}> = ({x, y, open, s = 1}) => {
  const a = 22 * clamp(open);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      <path d="M-70,120 C-80,260 -60,420 -40,620 L90,620 C100,420 110,260 90,120 Z" fill="#C9CCD1" stroke={INK} strokeWidth={4} />
      {[180, 250, 320, 390, 460].map((yy) => (
        <path key={yy} d={`M-76,${yy} Q10,${yy + 14} 98,${yy}`} fill="none" stroke="#E06A4F" strokeWidth={10} opacity={0.8} />
      ))}
      <g transform={`rotate(${fmt(a)} -120 40)`}>
        <path d="M-150,40 C-150,110 60,140 120,90 L120,60 Z" fill="#B8BCC2" stroke={INK} strokeWidth={4} />
      </g>
      <path d={`M-148,40 L120,60 L120,${fmt(60 + a * 3)} Z`} fill="#9B3B47" stroke={INK} strokeWidth={3} />
      <g transform={`rotate(${fmt(-a * 0.35)} -120 40)`}>
        <path d="M-150,40 C-170,-90 40,-140 120,-40 C150,0 140,50 120,60 Z" fill="#CDD1D6" stroke={INK} strokeWidth={4} />
        <circle cx={10} cy={-46} r={22} fill="#2B313A" stroke={INK} strokeWidth={3} />
        <circle cx={70} cy={-30} r={18} fill="#2B313A" stroke={INK} strokeWidth={3} />
        <circle cx={4} cy={-52} r={5} fill="#FFF" opacity={0.8} />
        <circle cx={65} cy={-35} r={4} fill="#FFF" opacity={0.8} />
      </g>
    </g>
  );
};

/** a laptop seen from the front, slightly from above; children draw in screen coordinates (0..w, 0..h) */
export const Laptop: React.FC<{id: string; x: number; y: number; w: number; h: number; children?: React.ReactNode}> = ({id, x, y, w, h, children}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)})`}>
    <defs>
      <clipPath id={`${id}-sc`}>
        <rect x={0} y={0} width={w} height={h} rx={6} />
      </clipPath>
    </defs>
    <rect x={-22} y={-22} width={w + 44} height={h + 44} rx={18} fill="#3A4450" stroke={INK} strokeWidth={4} />
    <rect x={0} y={0} width={w} height={h} rx={6} fill="#141B22" />
    <g clipPath={`url(#${id}-sc)`}>{children}</g>
    <path d={`M${-40},${h + 22} L${w + 40},${h + 22} L${w + 110},${h + 96} L${-110},${h + 96} Z`} fill="#AEB6BF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M${w * 0.35},${h + 70} L${w * 0.65},${h + 70} L${w * 0.67},${h + 86} L${w * 0.33},${h + 86} Z`} fill="#9AA3AD" />
  </g>
);

/** one recorded trial: the command bars, an arrow, the face it produced (front view, same rig) */
export const RecordRow: React.FC<{id: string; x: number; y: number; w?: number; cmd: number[]; st: Partial<RobotState>; k?: number; hot?: boolean; dark?: boolean}> = ({id, x, y, w = 520, cmd, st, k = 1, hot, dark = true}) => {
  if (k <= 0.001) return null;
  const h = w * 0.36;
  const bw = (w * 0.5) / cmd.length;
  const face = {...ROBOT_NEUTRAL, ...st, yaw: 0};
  const fx = w * 0.78;
  return (
    <g opacity={clamp(k * 1.5)} transform={`translate(${fmt(x)} ${fmt(y + (1 - clamp(k)) * 20)})`}>
      <rect x={0} y={0} width={w} height={h} rx={14} fill={dark ? '#1E2730' : UI.paper} stroke={hot ? UI.amber : dark ? '#56636F' : INK} strokeWidth={hot ? 5 : 2.5} />
      {cmd.map((v, j) => (
        <g key={j}>
          <rect x={fmt(18 + j * bw)} y={fmt(h * 0.15)} width={fmt(bw * 0.62)} height={fmt(h * 0.7)} rx={3} fill={dark ? '#334250' : '#E3DCCB'} />
          <rect x={fmt(18 + j * bw)} y={fmt(h * 0.85 - h * 0.7 * v)} width={fmt(bw * 0.62)} height={fmt(h * 0.7 * v)} rx={3} fill={UI.blue} />
        </g>
      ))}
      <path d={`M${fmt(w * 0.56)},${fmt(h / 2)} l${fmt(w * 0.07)},0 m-12,-12 l12,12 l-12,12`} fill="none" stroke={dark ? '#DDE3EA' : INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <clipPath id={`${id}-pc`}>
          <rect x={fmt(fx - h * 0.46)} y={fmt(h * 0.06)} width={fmt(h * 0.92)} height={fmt(h * 0.88)} rx={10} />
        </clipPath>
      </defs>
      <rect x={fmt(fx - h * 0.46)} y={fmt(h * 0.06)} width={fmt(h * 0.92)} height={fmt(h * 0.88)} rx={10} fill="#C9D3D2" />
      <g clipPath={`url(#${id}-pc)`}>
        <Robot id={`${id}-r`} st={face} x={fx} y={h * 0.5 - h * 0.02} s={h * 0.0062} />
      </g>
    </g>
  );
};

/** an open workbook seen from above at a slant; `turn` 0..1 lifts the right page over to the left */
export const Workbook: React.FC<{x: number; y: number; w?: number; h?: number; turn?: number; closed?: number}> = ({x, y, w = 520, h = 340, turn = 0, closed = 0}) => {
  const pw = w / 2;
  const c = Math.cos(Math.PI * clamp(turn));
  const lift = Math.sin(Math.PI * clamp(turn));
  // the turning page's free edge position (x relative to the spine) and its curl
  const ex = pw * c;
  const lines = (x0: number, n = 7) => Array.from({length: n}, (_, i) => <rect key={i} x={fmt(x0 + 26)} y={fmt(-h / 2 + 40 + i * 38)} width={fmt(pw - 60 - (i % 3) * 30)} height={7} rx={3} fill="#B9C3CE" />);
  // closing: the right half folds over onto the left (cover shows)
  const cl = clamp(closed);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(1 0.62)`}>
      <rect x={-pw - 14 + 10} y={-h / 2 - 10 + 14} width={(w + 28) * (1 - clamp(closed) * 0.5)} height={h + 20} rx={10} fill="#000" opacity={0.16} />
      <rect x={-pw - 14} y={-h / 2 - 10} width={(w + 28) * (1 - cl * 0.5)} height={h + 20} rx={10} fill="#E06A4F" stroke={INK} strokeWidth={4} />
      <rect x={-pw} y={-h / 2} width={pw} height={h} fill={UI.paper} stroke={INK} strokeWidth={3} />
      {lines(-pw)}
      {cl < 0.999 && (
        <g>
          {/* right page (stays) */}
          <rect x={0} y={-h / 2} width={fmt(pw * Math.cos((Math.PI / 2) * 0) * (1 - cl))} height={h} fill={UI.paper} stroke={INK} strokeWidth={3} />
          {cl < 0.05 && (
            <g>
              {lines(0, 5)}
              <circle cx={pw * 0.55} cy={h * 0.25} r={36} fill="none" stroke={UI.teal} strokeWidth={6} />
              <path d={`M${pw * 0.42},${h * 0.25} l${pw * 0.26},0`} stroke={UI.teal} strokeWidth={6} />
            </g>
          )}
        </g>
      )}
      {cl > 0.001 && (
        // the cover folding over: its edge sweeps from the right toward the spine
        <path d={`M0,${-h / 2 - 10} L${fmt((pw + 14) * Math.cos(Math.PI * cl))},${fmt(-h / 2 - 10 - 40 * Math.sin(Math.PI * cl))} L${fmt((pw + 14) * Math.cos(Math.PI * cl))},${fmt(h / 2 + 10 - 40 * Math.sin(Math.PI * cl))} L0,${h / 2 + 10} Z`} fill={cl > 0.5 ? '#E06A4F' : shade(UI.paper, 0.06)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      )}
      {turn > 0.001 && turn < 0.999 && (
        <path d={`M0,${-h / 2} L${fmt(ex * 1.05 + 30 * lift)},${fmt(-h / 2)} L${fmt(ex * 1.05 + 30 * lift)},${fmt(h / 2)} L0,${h / 2} Z`} fill="#000" opacity={0.08 * lift} />
      )}
      {turn > 0.001 && turn < 0.999 && (
        <path
          d={`M0,${-h / 2} L${fmt(ex)},${fmt(-h / 2 - 60 * lift)} Q${fmt(ex + (c > 0 ? 30 : -30) * lift)},0 ${fmt(ex)},${fmt(h / 2 - 60 * lift)} L0,${h / 2} Z`}
          fill={c > 0 ? shade(UI.paper, 0.04) : shade(UI.paper, 0.12)}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      )}
      <line x1={0} y1={-h / 2} x2={0} y2={h / 2} stroke={INK} strokeWidth={3} />
    </g>
  );
};

/** a timing bracket between two x positions, with a centred label above */
export const Bracket: React.FC<{x0: number; x1: number; y: number; label: string; k?: number; color?: string; size?: number}> = ({x0, x1, y, label, k = 1, color = UI.amber, size = 30}) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <path d={`M${fmt(x0)},${fmt(y + 16)} L${fmt(x0)},${fmt(y)} L${fmt(x1)},${fmt(y)} L${fmt(x1)},${fmt(y + 16)}`} fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
      <text x={fmt((x0 + x1) / 2)} y={fmt(y - 14)} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={size} fill={UI.ink}>
        {label}
      </text>
    </g>
  );

/** loudness-like amplitude of a robot / human viseme track at t (for a trace that matches its mouth exactly) */
export const robotTrace = (tr: Track) => (t: number) => {
  const v = robotVis(t, tr, 0.06);
  return clamp(v.open * 1.5 + v.round * 0.35 + (v.press > 0.5 ? 0.12 : 0) + (v.wide > 0.5 ? 0.25 : 0));
};
export const humanTrace = (tr: Track) => (t: number) => {
  const v = humanVis(t, tr, 0.06);
  return clamp(v.open * 1.6 + (v.wide > 1.1 ? 0.3 : 0) + v.teeth * 0.1);
};

/** a framed panel (split comparisons): clip to a rounded rect, ink border, optional caption below */
export const Panel: React.FC<{id: string; x: number; y: number; w: number; h: number; bg?: string; children: React.ReactNode; k?: number; border?: string}> = ({id, x, y, w, h, bg = '#E8DFCB', children, k = 1, border = INK}) => (
  <g opacity={k}>
    <defs>
      <clipPath id={`${id}-c`}>
        <rect x={x} y={y} width={w} height={h} rx={26} />
      </clipPath>
    </defs>
    <rect x={x + 8} y={y + 10} width={w} height={h} rx={26} fill="#000" opacity={0.14} />
    <g clipPath={`url(#${id}-c)`}>
      <rect x={x} y={y} width={w} height={h} fill={bg} />
      {children}
    </g>
    <rect x={x} y={y} width={w} height={h} rx={26} fill="none" stroke={border} strokeWidth={5} />
  </g>
);

/** a plain backdrop for explanation plates: warm paper with a faint dot grid */
export const Plate: React.FC<{id: string; color?: string}> = ({id, color = '#F1E9D7'}) => (
  <g>
    <defs>
      <pattern id={`${id}-dots`} width={40} height={40} patternUnits="userSpaceOnUse">
        <circle cx={20} cy={20} r={2} fill={shade(color, 0.12)} />
      </pattern>
    </defs>
    <rect x={-200} y={-200} width={2400} height={1500} fill={color} />
    <rect x={-200} y={-200} width={2400} height={1500} fill={`url(#${id}-dots)`} />
  </g>
);
export {mix, lerp, RPAL, lit};
