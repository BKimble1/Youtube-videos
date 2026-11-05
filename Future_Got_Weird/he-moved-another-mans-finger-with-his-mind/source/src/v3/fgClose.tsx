// V3 F + G: close shots of the three BrainNet participants (reverse angles from their screens), on the V3 cast rig with
// real hands (crew3). A Sender votes by STARING at one of two flickering lights (YES on the monitor's left, NO on its
// right; seen from the screen, the person's left is frame-right, so YES is the frame-right housing). The cap reads the
// rhythm and the vote chip leaves along the cap's cable. The Receiver's face carries the decisions and reactions.
import React from 'react';
import {clamp, easeInOut, fmt, lerp} from '../dc/math';
import {mix, shade} from '../dc/color';
import {FONT_HEAD, INK, K} from '../art/kit';
import {BN, EEGCap} from '../art/people';
import {Token} from '../art/s6world';
import {CrewChar, IDLE, Pose, reachLocal} from './crew3';
import {alongPath, P2} from './fgWorld';

const HY = -372, HR = 58;

/** keyed poses: [t, pose][]; each segment eases in and out (so a key held twice is a hold) */
export const kp = (t: number, ks: [number, Pose][]): Pose => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B] = ks[i + 1];
    if (t <= b) return mixPoseE(A, B, easeInOut(clamp((t - a) / (b - a || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
const mixPoseE = (p: Pose, q: Pose, u: number): Pose => {
  const m = (a: number, b: number) => a + (b - a) * u;
  const hs = (a?: {curl: number; spread?: number; point?: number}, b?: {curl: number; spread?: number; point?: number}) => {
    const A = a ?? {curl: 0.35, spread: 0.3, point: 0}, B = b ?? {curl: 0.35, spread: 0.3, point: 0};
    return {curl: m(A.curl, B.curl), spread: m(A.spread ?? 0.3, B.spread ?? 0.3), point: m(A.point ?? 0, B.point ?? 0)};
  };
  return {
    armL: {a: m(p.armL.a, q.armL.a), b: m(p.armL.b, q.armL.b)},
    armR: {a: m(p.armR.a, q.armR.a), b: m(p.armR.b, q.armR.b)},
    lean: m(p.lean, q.lean),
    tilt: m(p.tilt, q.tilt),
    lookX: m(p.lookX, q.lookX),
    lookY: m(p.lookY, q.lookY),
    brows: m(p.brows, q.brows),
    browAsym: m(p.browAsym ?? 0, q.browAsym ?? 0),
    mouth: u < 0.5 ? p.mouth : q.mouth,
    bob: m(p.bob ?? 0, q.bob ?? 0),
    blink: p.blink === undefined && q.blink === undefined ? undefined : m(p.blink ?? 1, q.blink ?? 1),
    handL: hs(p.handL, q.handL),
    handR: hs(p.handR, q.handR),
  };
};

/** arm poses in character-local units (shoulders at (+-66, -292), ground at 0) */
export const ARM_REST = {a: 6, b: 8};
export const armTo = (x: number, y: number, side: -1 | 1) => reachLocal(x, y, side, 1);
export const P0: Pose = {...IDLE, armL: ARM_REST, armR: ARM_REST, mouth: 'flat', handL: {curl: 0.4, spread: 0.2}, handR: {curl: 0.4, spread: 0.2}};

/** the cap cable's path (head space) and the chip riding it: from the electrodes down past the shoulder, off frame */
const CABLE: P2[] = [
  {x: HR - 4, y: HY - 30},
  {x: HR + 18, y: HY + 14},
  {x: HR + 26, y: HY + 70},
  {x: HR + 26, y: HY + 120},
  {x: HR + 36, y: HY + 240},
  {x: HR + 44, y: HY + 420},
];
const cableD = `M${HR - 2},${HY - 6} Q${HR + 30},${HY + 30} ${HR + 26},${HY + 120} L${HR + 36},${HY + 240} L${HR + 44},${HY + 420}`;

export type Chip = {u: number; k: number; text: string; color: string};
/** the chip's progress along the cap cable: down to the shoulder (readable), then away out of frame */
export const chipU = (t: number, leave: number) => {
  const tau = t - leave;
  if (tau < 0.25) return 0.28 * Math.sin((clamp(tau / 0.25) * Math.PI) / 2);
  return 0.28 + 0.72 * Math.pow(clamp((tau - 0.25) / 0.3), 2);
};
const CapGear: React.FC<{glow: number; chip?: Chip; col: string}> = ({glow, chip, col}) => {
  const p = chip ? alongPath(CABLE, chip.u) : null;
  return (
    <g>
      <EEGCap glow={glow} />
      <path d={cableD} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      {chip && chip.k > 0 && <path d={cableD} fill="none" stroke={col} strokeWidth={3.5} strokeLinecap="round" opacity={0.8 * chip.k} />}
      {p && chip && <Token x={p.x} y={p.y} s={0.36} color={chip.color} text={chip.text} k={chip.k} />}
    </g>
  );
};

/** a flickering-light housing seen in the foreground at the frame edge (soft focus) */
const Housing: React.FC<{id: string; x: number; y: number; s: number; label: string; hz: string; on: number; t: number; ph: number}> = ({id, x, y, s, label, hz, on, t, ph}) => {
  // gentle flicker (small amplitude, small area)
  const fl = on * (0.86 + 0.14 * Math.sin(t * 2 * Math.PI * (label === 'YES' ? 17 : 15) + ph));
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} filter={`url(#${id}-soft)`}>
      <rect x={-34} y={-58} width={68} height={130} rx={16} fill="#2A3B47" stroke={INK} strokeWidth={5} />
      {fl > 0.01 && <circle cx={0} cy={-18} r={44} fill="#FFF3C4" opacity={0.3 * fl} />}
      <circle cx={0} cy={-18} r={21} fill={mix('#56636E', '#FFF8DA', fl)} stroke={INK} strokeWidth={4} />
      <text x={0} y={30} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={22} fill="#DDE5EA">{label}</text>
      <text x={0} y={54} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={14} fill="#9DB2C3">{hz}</text>
    </g>
  );
};

const Backdrop: React.FC<{id: string; who: 'A' | 'B' | 'R'; cx: number; headY: number; S: number}> = ({id, who, cx, headY, S}) => {
  const col = who === 'A' ? K.senderA : who === 'B' ? K.senderB : K.receiver;
  const top = mix(K.cream, col, who === 'R' ? 0.34 : 0.16), bot = mix(K.cream, col, who === 'R' ? 0.5 : 0.3);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}-bg)`} />
      <rect x={-200} y={headY + 1.9 * HR * S} width={2320} height={22} fill={mix(K.cream, col, who === 'R' ? 0.58 : 0.4)} />
      {who === 'A' && (
        <g>
          <rect x={cx - 760} y={headY - 330} width={300} height={210} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={5} />
          <rect x={cx - 730} y={headY - 300} width={90} height={70} fill="#FFFFFF" stroke={INK} strokeWidth={3} transform={`rotate(-5 ${cx - 685} ${headY - 265})`} />
          <rect x={cx - 610} y={headY - 296} width={100} height={110} fill={mix(K.cream, col, 0.4)} stroke={INK} strokeWidth={3} transform={`rotate(4 ${cx - 560} ${headY - 241})`} />
          <rect x={cx + 470} y={headY - 420} width={260} height={360} rx={6} fill={mix(K.cream, col, 0.08)} stroke={INK} strokeWidth={5} />
          <path d={`M${cx + 600},${headY - 420} V${headY - 60} M${cx + 470},${headY - 240} H${cx + 730}`} stroke={INK} strokeWidth={4} />
        </g>
      )}
      {who === 'B' && (
        <g>
          <rect x={cx + 380} y={headY - 120} width={420} height={22} fill={K.deskDeep} stroke={INK} strokeWidth={5} />
          <path d={`M${cx + 450},${headY - 120} l-14,-80 h96 l-14,80 z`} fill={K.coralDeep} stroke={INK} strokeWidth={5} />
          <circle cx={cx + 484} cy={headY - 236} r={56} fill={K.grassDeep} stroke={INK} strokeWidth={5} />
          <rect x={cx + 600} y={headY - 220} width={36} height={100} fill={K.blue} stroke={INK} strokeWidth={4} />
          <rect x={cx + 642} y={headY - 200} width={36} height={80} fill={K.saffron} stroke={INK} strokeWidth={4} />
          <rect x={cx - 780} y={headY - 380} width={240} height={300} rx={10} fill={mix(K.cream, col, 0.05)} stroke={INK} strokeWidth={5} />
          <circle cx={cx - 660} cy={headY - 230} r={80} fill="none" stroke={mix(K.cream, col, 0.45)} strokeWidth={10} />
        </g>
      )}
      {who === 'R' && (
        <g>
          <rect x={cx - 820} y={headY - 420} width={320} height={1100} fill={mix(K.cream, col, 0.44)} stroke={INK} strokeWidth={6} />
          <circle cx={cx - 540} cy={headY + 160} r={12} fill={K.saffron} stroke={INK} strokeWidth={3} />
          <rect x={cx + 520} y={headY - 330} width={280} height={190} rx={8} fill={mix(K.cream, col, 0.6)} stroke={INK} strokeWidth={6} />
          <path d={`M${cx + 550},${headY - 290} H${cx + 760} M${cx + 550},${headY - 250} H${cx + 720} M${cx + 550},${headY - 210} H${cx + 740}`} stroke={mix(K.cream, col, 0.8)} strokeWidth={10} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export type FaceProps = {
  id: string;
  who: 'A' | 'B' | 'R';
  f: number;
  t: number;
  pose: Pose;
  /** placement: character ground x, ground y on screen, scale; push = slow camera push-in factor about the head */
  cx: number;
  gy: number;
  S: number;
  push?: number;
  front?: 'L' | 'R' | 'none';
  leds?: number;
  capGlow?: number;
  chip?: Chip;
  /** a coloured light wash on the face (the line-clear flash, the phosphene's afterglow) */
  light?: {col: string; k: number};
  coil?: boolean;
  /** the housings' horizontal inset from the frame edges */
  hx?: number;
};

/** One reverse-angle close shot: backdrop, the person (crew3), the cap and cable, the foreground light housings. */
export const FaceShot: React.FC<FaceProps> = ({id, who, f, t, pose, cx, gy, S, push = 1, front = 'none', leds = 0, capGlow = 0, chip, light, coil, hx = 70}) => {
  const look = who === 'A' ? BN.senderA : who === 'B' ? BN.senderB : BN.receiver;
  const col = who === 'A' ? K.senderA : who === 'B' ? K.senderB : K.receiver;
  const headY = gy + HY * S;
  const ox = cx, oy = headY;
  return (
    <g>
      <defs>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#CFE3F5" stopOpacity={0.26} />
          <stop offset="1" stopColor="#CFE3F5" stopOpacity={0} />
        </radialGradient>
        {light && (
          <radialGradient id={`${id}-lt`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={light.col} stopOpacity={0.55} />
            <stop offset="1" stopColor={light.col} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <g transform={`translate(${fmt(ox)} ${fmt(oy)}) scale(${fmt(Math.pow(push, 0.4))}) translate(${fmt(-ox)} ${fmt(-oy)})`}>
        <Backdrop id={id} who={who} cx={cx} headY={headY} S={S} />
      </g>
      <g transform={`translate(${fmt(ox)} ${fmt(oy)}) scale(${fmt(push)}) translate(${fmt(-ox)} ${fmt(-oy)})`}>
        {coil && (
          <g>
            <path d={`M${fmt(cx + 50 * S)},${fmt(headY + 20 * S)} Q${fmt(cx + 140 * S)},${fmt(headY + 30 * S)} ${fmt(cx + 150 * S)},${fmt(headY + 240 * S)}`} fill="none" stroke={INK} strokeWidth={4 * S} strokeLinecap="round" />
            <rect x={cx + 40 * S} y={headY + 16 * S} width={64 * S} height={13 * S} rx={6.5 * S} fill="#46525C" stroke={INK} strokeWidth={1.8 * S} />
          </g>
        )}
        <CrewChar look={look} pose={pose} frame={f} seed={who === 'A' ? 3 : who === 'B' ? 7 : 11} x={cx} y={gy} scale={S} front={front} life={0.45} eyeDarts={false} shadow={false}
          headGear={<CapGear glow={capGlow} chip={chip} col={col} />} id={`${id}-cc`} />
        <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}-glow)`} />
        {light && light.k > 0.001 && (
          <ellipse cx={cx} cy={headY + 10 * S} rx={130 * S} ry={120 * S} fill={`url(#${id}-lt)`} opacity={clamp(light.k)} style={{mixBlendMode: 'screen'}} />
        )}
      </g>
      <Housing id={id} x={1920 - hx} y={400} s={2.5} label="YES" hz="17 Hz" on={leds} t={t} ph={0} />
      <Housing id={id} x={hx} y={400} s={2.5} label="NO" hz="15 Hz" on={leds} t={t} ph={1.7} />
    </g>
  );
};

/** the Receiver's learned track record (frame-left panel in the record shot) */
export const RecordPanel: React.FC<{t: number; t0: number; dimB: number; x?: number; y?: number}> = ({t, t0, dimB, x = 110, y = 250}) => {
  const k = clamp((t - t0) / 0.3);
  if (k <= 0) return null;
  const A = [1, 1, 1, 1, 1, 1], B = [1, 0, 0, 1, 0, 0];
  const n = 6 * clamp((t - (t0 + 0.15)) / 0.9);
  const row = (yy: number, col: string, name: string, marks: number[], op: number, hi: number) => (
    <g opacity={op}>
      {hi > 0 && <rect x={x + 14} y={yy - 50} width={612} height={100} rx={24} fill={col} opacity={0.16 * hi} />}
      <circle cx={x + 66} cy={yy} r={30} fill={col} stroke={INK} strokeWidth={5} />
      <text x={x + 66} y={yy + 11} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={30} fill="#FFFFFF">{name}</text>
      {marks.map((m, i) => {
        const on = clamp(n - i);
        if (on <= 0) return null;
        const bx = x + 150 + i * 76;
        return (
          <g key={i} opacity={on} transform={`translate(${bx} ${yy}) scale(${fmt(0.7 + 0.3 * on)})`}>
            <rect x={-27} y={-27} width={54} height={54} rx={12} fill={m ? K.cream : '#E3E8EC'} stroke={INK} strokeWidth={4} />
            {m ? <path d="M-13,0 l9,10 l17,-20" fill="none" stroke={shade(col, 0.1)} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M-11,-11 l22,22 M11,-11 l-22,22" stroke="#8A97A2" strokeWidth={6} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
  return (
    <g opacity={k} transform={`translate(0 ${fmt(lerp(24, 0, easeInOut(k)))})`}>
      <rect x={x + 6} y={y + 8} width={640} height={290} rx={30} fill={INK} opacity={0.16} />
      <rect x={x} y={y} width={640} height={290} rx={30} fill={K.cream} stroke={INK} strokeWidth={5} />
      <text x={x + 34} y={y + 52} fontFamily={FONT_HEAD} fontWeight={600} fontSize={30} fill={INK}>whose advice was right</text>
      {row(y + 125, K.senderA, 'A', A, 1, dimB)}
      {row(y + 225, K.senderB, 'B', B, 1 - 0.55 * dimB, 0)}
    </g>
  );
};
