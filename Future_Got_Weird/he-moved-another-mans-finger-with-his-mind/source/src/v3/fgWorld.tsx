// V2 F + G (BrainNet 2019, trust, ending): the shared world. One floor of one building, cut away: Sender A's room
// (teal) above Sender B's room (coral) on the left, the hub (the computer that decodes and relays the votes) in the
// middle, the Receiver's room (purple) on the right, seen from behind the Receiver. Every element is drawn in world
// units from a plain state object (fgTime.ts), so F and G share one continuous picture. Parts reused from V1's
// s6world (BNMonitor, TrialCells, Token, SoftArc and the game geometry), upgraded here.
//
// Physical route (the glowing chips are metaphors that ride the real cables): Sender's EEG cap -> amplifier on the
// desk -> conduit along the ceiling -> the hub computer (the vote is decoded; in G the software flips the bad
// Sender's vote here) -> one cable through the wall -> the TMS stimulator on the Receiver's desk -> the figure-eight
// coil flat on the back of the Receiver's head (over the left visual cortex, frame-left from behind).
import React from 'react';
import {clamp, easeInOut, fmt, lerp} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {CrewChar, IDLE, Pose} from './crew3';
import {BN, EEGCap} from '../art/people';
import {FONT_HEAD, Fig8Coil, INK, K} from '../art/kit';
import {BNMonitor, CH, CW, GAP_COL, GCOLS, GROWS, PF, Token, Trial, TrialCells, trialRow, TRACK_V} from '../art/s6world';

export type P2 = {x: number; y: number};
export const RA = {x: 0, y: 0, w: 1700, h: 1000};
export const RB = {x: 0, y: 1100, w: 1700, h: 1000};
export const HUB = {x: 1800, y: 0, w: 900, h: 2100};
export const RR = {x: 2800, y: 0, w: 1900, h: 2100};
export const MON = {A: {x: 1120, y: 720, s: 0.9}, B: {x: 1120, y: 1820, s: 0.9}, R: {x: 3750, y: 1000, s: 1}};
export const PERSON = {A: {x: 430, y: 1000, s: 1.6}, B: {x: 430, y: 2100, s: 1.6}};
export const HEAD = {x: 3600, y: 1215, r: 150};
export const STIM = {x: 2980, y: 830, w: 300, h: 170};
/** V3 lab computer: a tower PC on the bench (the Senders' cables plug into it) and a workstation monitor whose screen
 *  (WIN) runs the relay software, where each decoded vote appears in its Sender's row. */
export const TOWER = {x: 1835, y: 800, w: 160, h: 350};
export const BENCH_Y = 1150;
export const COMPU = TOWER;
export const WIN = {x: 2040, y: 740, w: 420, h: 320};
export const SLOT = {A: {x: 2335, y: 840}, B: {x: 2335, y: 935}};
export const PORT_IN = {A: {x: 1880, y: 800}, B: {x: 1835, y: 1095}};
export const PORT_OUT = {x: 1995, y: 1118};
export const OUT_Y = 950;
export const COIL_S = 0.8;
export const coilAt = (h = HEAD) => ({x: h.x - 0.36 * h.r, y: h.y + 0.4 * h.r});
export const COIL = coilAt();
export const HANDLE_END = {x: COIL.x - 230 * COIL_S, y: COIL.y};
/** the receiver's screen centre (world) and a Monitor-screen point helper */
export const scrPt = (m: {x: number; y: number; s: number}, u: number, v: number): P2 => ({x: m.x + (-320 + u) * m.s, y: m.y + (-510 + v) * m.s});
export const lampPt = (m: {x: number; y: number; s: number}, side: -1 | 1): P2 => ({x: m.x + side * 392 * m.s, y: m.y - 318 * m.s});
export const eyeOf = (who: 'A' | 'B'): P2 => {
  const p = PERSON[who];
  return {x: p.x + 18 * p.s, y: p.y - 378 * p.s};
};
/** routes (world): a Sender's cap to its slot in the hub window; the hub to the coil */
export const routeOf = (who: 'A' | 'B'): P2[] => {
  const p = PERSON[who];
  const oy = who === 'A' ? 0 : 1100;
  const head = [
    {x: p.x + 60 * p.s, y: p.y - 380 * p.s},
    {x: p.x + 84 * p.s, y: p.y - 260 * p.s},
    {x: 640, y: oy + 668},
    {x: 720, y: oy + 668},
    {x: 720, y: oy + 40},
  ];
  return who === 'A'
    ? [...head, {x: PORT_IN.A.x, y: 40}, PORT_IN.A]
    : [...head, {x: 1812, y: oy + 40}, {x: 1812, y: PORT_IN.B.y}, PORT_IN.B];
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const routeOut = (_who: 'A' | 'B'): P2[] => [
  PORT_OUT,
  {x: 2620, y: PORT_OUT.y},
  {x: 2620, y: OUT_Y},
  {x: STIM.x, y: OUT_Y},
  {x: STIM.x + STIM.w * 0.5, y: OUT_Y},
];
/** the coil cable from the stimulator to the coil handle (drawn with the head) */
export const COIL_CABLE: P2[] = [{x: STIM.x + STIM.w, y: STIM.y + 70}, {x: 3330, y: 1000}, {x: HANDLE_END.x - 10, y: HANDLE_END.y}];
export const alongPath = (pts: P2[], u: number): P2 => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const L = segs.reduce((a, b) => a + b, 0);
  let d = clamp(u) * L;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? clamp(d / segs[i]) : 0;
      return {x: lerp(pts[i].x, pts[i + 1].x, k), y: lerp(pts[i].y, pts[i + 1].y, k)};
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
const pd = (pts: P2[]) => 'M' + pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L');
const SETTLED = '#7C9DBD';

// ---------------------------------------------------------------- the game screen (640 x 400 screen-local)
export const HIDE_ROW = 5; // the Receiver sees the top half (rows 0..4)
export type FieldFx = {
  /** how much of the hidden lower half is covered (0 = open, 1 = covered), the cover rises from the bottom */
  fog?: number;
  gapGlow?: number;
  tint?: number;
  /** a dashed preview of the piece turning 0..1 (= 0..180 deg) and its visibility */
  ghost?: number;
  ghostK?: number;
  q?: number;
  ind?: number;
  indK?: number;
  yesHi?: number;
  noHi?: number;
  accent: string;
};
const EyeSlash: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} fill="none" stroke="#8FA6B9" strokeWidth={5} strokeLinecap="round">
    <path d="M-34,0 Q0,-30 34,0 Q0,30 -34,0 Z" />
    <circle cx={0} cy={0} r={9} />
    <path d="M-30,-26 L30,26" strokeWidth={6} />
  </g>
);
const pieceOutline = () => {
  const p = [[0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [0, 2]];
  return 'M' + p.map(([x, y]) => `${fmt(x * CW)},${fmt(y * CH)}`).join(' L') + ' Z';
};
export const FieldScreen: React.FC<{id: string; t: number; trs: Trial[]; fx: FieldFx}> = ({id, t, trs, fx}) => {
  const tr = trs[trs.length - 1];
  const {fog = 0, gapGlow = 0, tint = 1, ghost = 0, ghostK = 0, q = 0, ind = 0, indK = 0, yesHi = 0, noHi = 0, accent} = fx;
  const pfB = PF.y + PF.h;
  const hideY = PF.y + HIDE_ROW * CH;
  const fogTop = lerp(pfB, hideY, clamp(fog));
  const row = tr ? trialRow(tr, t) : 0;
  const side = (x: number, label: string, sub: string, hi: number) => (
    <g>
      {hi > 0 && <rect x={x - 64} y={30} width={128} height={86} rx={14} fill={accent} opacity={0.22 * hi} />}
      <text x={x} y={74} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={40} fill={mix('#B9C8D4', '#FFFFFF', hi)}>{label}</text>
      <text x={x} y={102} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={20} fill="#8FA6B9">{sub}</text>
      {hi > 0 && <rect x={x - 64} y={30} width={128} height={86} rx={14} fill="none" stroke={accent} strokeWidth={5} opacity={hi} />}
    </g>
  );
  return (
    <g>
      <rect x={0} y={0} width={640} height={400} fill="#1A2C3A" />
      {side(96, 'YES', 'rotate', yesHi)}
      {side(544, 'NO', 'leave it', noHi)}
      <rect x={PF.x - 3} y={PF.y - 3} width={PF.w + 6} height={PF.h + 6} rx={4} fill="#22384A" stroke="#4A6378" strokeWidth={3} />
      <g opacity={0.18} stroke="#9DB2C3" strokeWidth={1}>
        {Array.from({length: GCOLS - 1}, (_, i) => <path key={`c${i}`} d={`M${PF.x + (i + 1) * CW},${PF.y} L${PF.x + (i + 1) * CW},${pfB}`} />)}
        {Array.from({length: GROWS - 1}, (_, i) => <path key={`r${i}`} d={`M${PF.x},${fmt(PF.y + (i + 1) * CH)} L${PF.x + PF.w},${fmt(PF.y + (i + 1) * CH)}`} />)}
      </g>
      <defs>
        <clipPath id={`${id}-pf`}>
          <rect x={PF.x} y={PF.y} width={PF.w} height={PF.h} />
        </clipPath>
        <clipPath id={`${id}-fog`}>
          <rect x={PF.x - 3} y={fogTop} width={PF.w + 6} height={Math.max(0, pfB - fogTop + 3)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-pf)`}>
        {trs.map((x, i) => <TrialCells key={i} tr={x} t={t} tint={tint} />)}
      </g>
      {gapGlow > 0 && (
        <g opacity={gapGlow}>
          <rect x={PF.x + GAP_COL * CW - 5} y={PF.y + (GROWS - 1) * CH - 5} width={CW + 10} height={CH + 10} rx={8} fill={K.saffron} fillOpacity={0.18} stroke={K.saffron} strokeWidth={6} />
        </g>
      )}
      {fog > 0.002 && (
        <g>
          <rect x={PF.x - 3} y={fogTop} width={PF.w + 6} height={pfB - fogTop + 3} fill="#33485A" />
          <g clipPath={`url(#${id}-fog)`} stroke="#3E5568" strokeWidth={6}>
            {Array.from({length: 18}, (_, i) => <path key={i} d={`M${PF.x - 200 + i * 34},${pfB + 10} L${PF.x - 200 + i * 34 + 200},${hideY - 10}`} />)}
          </g>
          <path d={`M${PF.x - 3},${fmt(fogTop)} L${PF.x + PF.w + 3},${fmt(fogTop)}`} stroke="#8FA6B9" strokeWidth={3} strokeDasharray="8 7" />
          <g opacity={clamp((fog - 0.75) * 4) * (1 - q)}>
            <EyeSlash x={PF.x + PF.w / 2} y={hideY + (pfB - hideY) * 0.5} s={1.0} />
          </g>
          {q > 0 && (
            <text x={PF.x + PF.w / 2} y={hideY + (pfB - hideY) * 0.5 + 30} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={84} fill={K.cream} opacity={q}
              stroke="#33485A" strokeWidth={10} paintOrder="stroke">?</text>
          )}
        </g>
      )}
      {ghostK > 0 && tr && (
        <g opacity={ghostK}>
          <g transform={`translate(${fmt(PF.x + tr.col * CW)} ${fmt(PF.y + row * CH)}) rotate(${fmt(ghost * 180)} ${fmt(1.5 * CW)} ${fmt(CH)})`}>
            <path d={pieceOutline()} fill={K.cream} fillOpacity={0.12} stroke={K.cream} strokeWidth={3.5} strokeDasharray="9 7" strokeLinejoin="round" />
          </g>
          <path d={`M${fmt(PF.x + tr.col * CW + 1.5 * CW - 66)},${fmt(PF.y + row * CH + CH + 4)} A66,58 0 1 1 ${fmt(PF.x + tr.col * CW + 1.5 * CW + 66)},${fmt(PF.y + row * CH + CH + 4)}`}
            fill="none" stroke={K.saffron} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${fmt(330 * clamp(ghost * 1.2 + 0.15))} 999`} />
        </g>
      )}
      <g opacity={0.45 + 0.55 * indK}>
        <path d={`M110,${TRACK_V} L530,${TRACK_V}`} stroke="#4A6378" strokeWidth={8} strokeLinecap="round" />
        <circle cx={110} cy={TRACK_V} r={9} fill="#9DB2C3" />
        <circle cx={530} cy={TRACK_V} r={9} fill="#9DB2C3" />
        {indK > 0 && <circle cx={fmt(320 + ind * 210)} cy={TRACK_V} r={15} fill={accent} stroke="#FFFFFF" strokeWidth={4} opacity={indK} />}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- state
export type Gaze = {k: number; side: -1 | 1};
export type Tok = {color: string; text: string; flipText?: string; flip: number; x: number; y: number; k: number; s: number};
export type FGState = {
  t: number;
  trs: Trial[];
  tint: number;
  fx: {A: FieldFx; B: FieldFx; R: FieldFx};
  leds: {A: number; B: number; R: number};
  gaze: {A: Gaze; B: Gaze; R: Gaze};
  cap: {A: number; B: number};
  toks: Tok[];
  coilK: number;
  pulse: number;
  brain: number;
  stimBlink: number;
  look: number;
  tilt: number;
  /** the relay software: 10-of-16 strip progress and the "flipped by software" note on the bad Sender's row */
  strip: {k: number; n: number};
  flipNote: number;
  /** the stimulator's display: the last command (pulse / no pulse) and whose vote it was */
  stim: {k: number; yes: boolean; who: 'A' | 'B'};
  hubBlink: number;
  cableGlow: {A: number; B: number; out: number};
};

// ---------------------------------------------------------------- people
const senderPose = (g: Gaze, k: number): Pose => ({
  ...IDLE,
  handL: {curl: 0.45, spread: 0.2},
  handR: {curl: 0.45, spread: 0.2},
  lookX: lerp(0.55, g.side < 0 ? 0.5 : 0.95, g.k),
  lookY: lerp(-0.1, -0.3, g.k),
  brows: lerp(0.05, 0.25, k),
  mouth: 'flat',
  tilt: lerp(0, g.side < 0 ? 2 : 4, g.k),
});

const SenderRoom: React.FC<{id: string; who: 'A' | 'B'; st: FGState; f: number}> = ({id, who, st, f}) => {
  const o = who === 'A' ? RA : RB;
  const col = who === 'A' ? K.senderA : K.senderB;
  const p = PERSON[who];
  const m = MON[who];
  const g = st.gaze[who];
  const pose = senderPose(g, st.leds[who]);
  const full: Pose = {...pose, armL: {a: 10, b: 30}, armR: {a: 10, b: 30}};
  const eye = eyeOf(who);
  const lamp = lampPt(m, g.side);
  const look = who === 'A' ? BN.senderA : BN.senderB;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(K.cream, col, 0.1)} />
          <stop offset="1" stopColor={mix(K.cream, col, 0.24)} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id}-w)`} />
        <rect x={o.x} y={o.y + 560} width={o.w} height={18} fill={mix(K.cream, col, 0.32)} />
        {/* a pinboard (A) / a shelf with a plant (B): the rooms are different places */}
        {who === 'A' ? (
          <g>
            <rect x={o.x + 90} y={o.y + 130} width={170} height={120} rx={6} fill="#E9D8B8" stroke={INK} strokeWidth={4} />
            <rect x={o.x + 110} y={o.y + 148} width={50} height={40} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} transform={`rotate(-5 ${o.x + 135} ${o.y + 168})`} />
            <rect x={o.x + 180} y={o.y + 152} width={56} height={62} fill={mix(K.cream, col, 0.4)} stroke={INK} strokeWidth={2.5} transform={`rotate(4 ${o.x + 208} ${o.y + 183})`} />
          </g>
        ) : (
          <g>
            <rect x={o.x + 80} y={o.y + 230} width={240} height={16} fill={K.deskDeep} stroke={INK} strokeWidth={4} />
            <path d={`M${o.x + 130},${o.y + 230} l-10,-50 h60 l-10,50 z`} fill={K.coralDeep} stroke={INK} strokeWidth={4} />
            <circle cx={o.x + 150} cy={o.y + 160} r={34} fill={K.grassDeep} stroke={INK} strokeWidth={4} />
            <rect x={o.x + 230} y={o.y + 170} width={22} height={60} fill={K.blue} stroke={INK} strokeWidth={3} />
            <rect x={o.x + 256} y={o.y + 180} width={22} height={50} fill={K.saffron} stroke={INK} strokeWidth={3} />
          </g>
        )}
        <CrewChar look={look} pose={full} frame={f} seed={who === 'A' ? 3 : 7} x={p.x} y={p.y} scale={p.s} headGear={<EEGCap glow={st.cap[who]} />} id={`${id}-cc`} life={0.5} eyeDarts={false} shadow={false} />
        {/* desk with the EEG amplifier */}
        <rect x={o.x - 10} y={o.y + 700} width={o.w + 20} height={320} fill={K.desk} stroke={INK} strokeWidth={5} />
        <rect x={o.x - 10} y={o.y + 700} width={o.w + 20} height={34} fill={K.deskTop} stroke={INK} strokeWidth={5} />
        <rect x={o.x + 585} y={o.y + 646} width={110} height={56} rx={8} fill="#3B4A57" stroke={INK} strokeWidth={4} />
        <circle cx={o.x + 672} cy={o.y + 662} r={7} fill={mix('#6E7C86', col, clamp(st.cableGlow[who] + st.cap[who]))} stroke={INK} strokeWidth={2.5} />
        <BNMonitor id={`${id}-m`} x={m.x} y={m.y} s={m.s} t={st.t} accent={col} leds={st.leds[who]}>
          <FieldScreen id={`${id}-s`} t={st.t} trs={st.trs} fx={{...st.fx[who], tint: st.tint}} />
        </BNMonitor>
        {g.k > 0.01 && (
          <path d={`M${fmt(eye.x)},${fmt(eye.y)} L${fmt(lerp(eye.x, lamp.x, g.k))},${fmt(lerp(eye.y, lamp.y, g.k))}`} stroke={col} strokeWidth={7} strokeDasharray="12 9" strokeLinecap="round" opacity={0.9} />
        )}
      </g>
    </g>
  );
};

/** The Receiver from behind (their left frame-left): shoulders, neck, ears, the EEG cap, the figure-eight coil flat on
 *  the back of the head over the left visual cortex, the coil cable to the stimulator. look -1..1 turns the head a
 *  little toward frame-left / frame-right. */
export const RecvBack: React.FC<{id: string; h?: {x: number; y: number; r: number}; coilK: number; pulse: number; brain: number; look?: number; tilt?: number; cable?: boolean}> = ({
  id, h = HEAD, coilK, pulse, brain, look = 0, tilt = 0, cable = true,
}) => {
  const {x, y, r: R} = h;
  const skin = BN.receiver.skin;
  const shirt = K.receiver;
  const coil = coilAt(h);
  const cx = coil.x - (1 - easeInOut(coilK)) * 280;
  const hx = x + look * 0.07 * R;
  const ang = tilt + look * 4;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lit(shirt, 0.18)} />
          <stop offset="1" stopColor={shade(shirt, 0.22)} />
        </linearGradient>
        <radialGradient id={`${id}-hd`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={lit('#3B4A57', 0.18)} />
          <stop offset="1" stopColor={shade('#3B4A57', 0.25)} />
        </radialGradient>
        <clipPath id={`${id}-hc`}>
          <ellipse cx={hx} cy={y} rx={R} ry={R * 1.06} />
        </clipPath>
      </defs>
      {/* coil cable to the stimulator (behind the shoulders) */}
      {cable && coilK > 0 && (
        <path d={`M${fmt(COIL_CABLE[0].x)},${fmt(COIL_CABLE[0].y)} Q${fmt(COIL_CABLE[1].x)},${fmt(COIL_CABLE[1].y)} ${fmt(cx - 230 * COIL_S - 6)},${fmt(coil.y)}`}
          fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" opacity={clamp(coilK * 2)} />
      )}
      <path d={`M${fmt(x - 2.5 * R)},${fmt(y + 3.2 * R)} Q${fmt(x - 2.45 * R)},${fmt(y + 1.25 * R)} ${fmt(x - 0.9 * R)},${fmt(y + 1.02 * R)} L${fmt(x + 0.9 * R)},${fmt(y + 1.02 * R)} Q${fmt(x + 2.45 * R)},${fmt(y + 1.25 * R)} ${fmt(x + 2.5 * R)},${fmt(y + 3.2 * R)} Z`}
        fill={`url(#${id}-sh)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${fmt(x - 0.62 * R)},${fmt(y + 1.04 * R)} Q${fmt(x)},${fmt(y + 1.3 * R)} ${fmt(x + 0.62 * R)},${fmt(y + 1.04 * R)}`} fill="none" stroke={shade(shirt, 0.35)} strokeWidth={6} />
      <g transform={`rotate(${fmt(ang)} ${fmt(x)} ${fmt(y + 1.0 * R)})`}>
        <rect x={x - 0.4 * R} y={y + 0.5 * R} width={0.8 * R} height={0.6 * R} fill={shade(skin, 0.18)} stroke={INK} strokeWidth={5} />
        {[-1, 1].map((sd) => (
          <ellipse key={sd} cx={hx + sd * 0.98 * R - look * 0.05 * R} cy={y + 0.14 * R} rx={(0.17 - sd * look * 0.04) * R} ry={0.28 * R} fill={skin} stroke={INK} strokeWidth={5} />
        ))}
        <ellipse cx={hx} cy={y} rx={R} ry={R * 1.06} fill={BN.receiver.hairColor} stroke={INK} strokeWidth={6} />
        <g clipPath={`url(#${id}-hc)`}>
          <path d={`M${fmt(hx - 1.1 * R)},${fmt(y + 0.62 * R)} Q${fmt(hx)},${fmt(y + 0.42 * R)} ${fmt(hx + 1.1 * R)},${fmt(y + 0.62 * R)} L${fmt(hx + 1.1 * R)},${fmt(y - 1.2 * R)} L${fmt(hx - 1.1 * R)},${fmt(y - 1.2 * R)} Z`}
            fill={`url(#${id}-hd)`} stroke={INK} strokeWidth={4} />
          {[[-0.55, -0.62], [0, -0.78], [0.55, -0.62], [-0.78, -0.18], [-0.27, -0.3], [0.27, -0.3], [0.78, -0.18], [-0.55, 0.22], [0, 0.12], [0.55, 0.22]].map(([ex, ey], i) => (
            <circle key={i} cx={hx + ex * R} cy={y + ey * R} r={0.07 * R} fill="#D9DEE2" stroke={INK} strokeWidth={2.5} />
          ))}
          {brain > 0 && (
            <g opacity={brain}>
              <ellipse cx={hx} cy={y} rx={R * 1.1} ry={R * 1.2} fill={K.cream} opacity={0.6} />
              {[-1, 1].map((sd) => (
                <g key={sd}>
                  <ellipse cx={hx + sd * 0.43 * R} cy={y - 0.05 * R} rx={0.47 * R} ry={0.8 * R} fill="#F3C6C0" stroke={INK} strokeWidth={4} />
                  <path d={`M${fmt(hx + sd * 0.2 * R)},${fmt(y - 0.6 * R)} q${fmt(sd * 0.2 * R)},${fmt(0.12 * R)} ${fmt(sd * 0.1 * R)},${fmt(0.3 * R)} t${fmt(sd * 0.15 * R)},${fmt(0.3 * R)} M${fmt(hx + sd * 0.55 * R)},${fmt(y - 0.5 * R)} q${fmt(sd * 0.2 * R)},${fmt(0.2 * R)} ${fmt(-sd * 0.05 * R)},${fmt(0.42 * R)}`}
                    fill="none" stroke={shade('#F3C6C0', 0.3)} strokeWidth={4} strokeLinecap="round" />
                  <ellipse cx={hx + sd * 0.42 * R} cy={y + 0.5 * R} rx={0.36 * R} ry={0.22 * R} fill={K.saffron} stroke={shade(K.saffron, 0.35)} strokeWidth={3} opacity={sd < 0 ? 1 : 0.7} />
                </g>
              ))}
            </g>
          )}
        </g>
        <ellipse cx={hx} cy={y} rx={R} ry={R * 1.06} fill="none" stroke={INK} strokeWidth={6} />
        <path d={`M${fmt(hx + 0.7 * R)},${fmt(y + 0.5 * R)} Q${fmt(hx + 1.1 * R)},${fmt(y + 1.1 * R)} ${fmt(hx + 1.0 * R)},${fmt(y + 1.9 * R)}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        {coilK > 0 && (
          <g opacity={clamp(coilK * 2)}>
            <g transform={`translate(${fmt(cx)} ${fmt(coil.y)}) rotate(-90) scale(${COIL_S})`}>
              <ellipse cx={-62} cy={0} rx={76} ry={70} fill={K.cream} opacity={0.7} />
              <ellipse cx={62} cy={0} rx={76} ry={70} fill={K.cream} opacity={0.7} />
            </g>
            {pulse > 0 && (
              <g transform={`translate(${fmt(cx)} ${fmt(coil.y)}) rotate(-90) scale(${COIL_S})`} opacity={Math.pow(1 - pulse, 1.5)}>
                <ellipse cx={-62} cy={0} rx={100} ry={92} fill={K.saffron} opacity={0.45} />
                <ellipse cx={62} cy={0} rx={100} ry={92} fill={K.saffron} opacity={0.45} />
              </g>
            )}
            <Fig8Coil x={cx} y={coil.y} s={COIL_S} ang={-90} />
            {pulse > 0 && (
              <g transform={`translate(${fmt(cx)} ${fmt(coil.y)}) rotate(-90) scale(${COIL_S})`} opacity={Math.pow(1 - pulse, 1.2)} fill="none" stroke={K.saffron} strokeWidth={9}>
                <ellipse cx={-62} cy={0} rx={64} ry={58} />
                <ellipse cx={62} cy={0} rx={64} ry={58} />
              </g>
            )}
          </g>
        )}
      </g>
    </g>
  );
};

/** the gaze of the Receiver (from the top of the head to a lamp), drawn in world */
export const RecvGaze: React.FC<{g: Gaze; look: number}> = ({g, look}) => {
  if (g.k <= 0.01) return null;
  const from = {x: HEAD.x + look * 0.07 * HEAD.r, y: HEAD.y - HEAD.r * 0.95};
  const to = lampPt(MON.R, g.side);
  return <path d={`M${fmt(from.x)},${fmt(from.y)} L${fmt(lerp(from.x, to.x, g.k))},${fmt(lerp(from.y, to.y, g.k))}`} stroke={K.receiver} strokeWidth={7} strokeDasharray="12 9" strokeLinecap="round" />;
};

const Stimulator: React.FC<{blink: number; cmd: FGState['stim']}> = ({blink, cmd}) => {
  const {x, y, w, h} = STIM;
  const col = cmd.who === 'A' ? K.senderA : K.senderB;
  const dw = w - 120;
  return (
    <g>
      <rect x={x + 8} y={y + 10} width={w} height={h} rx={14} fill={INK} opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#DCE1E5" stroke={INK} strokeWidth={5} />
      <rect x={x + 18} y={y + 18} width={dw} height={56} rx={8} fill="#2A3B47" stroke={INK} strokeWidth={3} />
      <text x={x + 18 + dw / 2} y={y + 56} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={30} fill="#BFD3E0" opacity={1 - cmd.k}>TMS</text>
      {cmd.k > 0 && (
        <g opacity={cmd.k}>
          <circle cx={x + 40} cy={y + 46} r={10} fill={col} stroke={INK} strokeWidth={2.5} />
          <text x={x + 58} y={y + 55} fontFamily={FONT_HEAD} fontWeight={700} fontSize={cmd.yes ? 28 : 24} fill={cmd.yes ? K.saffron : '#8FA6B9'}>{cmd.yes ? 'PULSE' : 'no pulse'}</text>
        </g>
      )}
      <circle cx={x + w - 54} cy={y + 46} r={20} fill={mix('#6E7C86', K.saffron, blink)} stroke={INK} strokeWidth={4} />
      {blink > 0 && <circle cx={x + w - 54} cy={y + 46} r={34} fill={K.saffron} opacity={0.3 * blink} />}
      {[0, 1, 2].map((i) => <rect key={i} x={x + 18 + i * 52} y={y + 100} width={40} height={40} rx={20} fill="#B5BEC6" stroke={INK} strokeWidth={3} />)}
    </g>
  );
};

const ReceiverRoom: React.FC<{id: string; st: FGState}> = ({id, st}) => {
  const o = RR;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(K.cream, K.receiver, 0.12)} />
          <stop offset="1" stopColor={mix(K.cream, K.receiver, 0.26)} />
        </linearGradient>
        <linearGradient id={`${id}-dt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(K.deskTop, 0.1)} />
          <stop offset="1" stopColor={lit(K.deskTop, 0.12)} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id}-w)`} />
        <rect x={o.x} y={o.y + 860} width={o.w} height={18} fill={mix(K.cream, K.receiver, 0.34)} />
        <rect x={o.x - 10} y={1000} width={o.w + 20} height={420} fill={`url(#${id}-dt)`} stroke={INK} strokeWidth={5} />
        <rect x={o.x - 10} y={1420} width={o.w + 20} height={60} fill={K.desk} stroke={INK} strokeWidth={5} />
        <rect x={o.x - 10} y={1480} width={o.w + 20} height={700} fill="#6E5A4C" />
        <rect x={o.x - 10} y={1480} width={o.w + 20} height={40} fill={INK} opacity={0.25} />
        <BNMonitor id={`${id}-m`} x={MON.R.x} y={MON.R.y} s={MON.R.s} t={st.t} accent={K.receiver} leds={st.leds.R}>
          <FieldScreen id={`${id}-s`} t={st.t} trs={st.trs} fx={{...st.fx.R, tint: st.tint}} />
        </BNMonitor>
        <Stimulator blink={st.stimBlink} cmd={st.stim} />
      </g>
    </g>
  );
};

/** the room behind the lab computer: wall, skirting, floor (drawn under the cables) */
const HubBack: React.FC<{id: string}> = ({id}) => {
  const o = HUB;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E3DACB" />
          <stop offset="1" stopColor="#D6CBB8" />
        </linearGradient>
      </defs>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id}-w)`} />
      <rect x={o.x} y={1520} width={o.w} height={580} fill="#CFC2AE" />
      {/* a wall rack shelf with the EEG amplifier receivers */}
      <rect x={2080} y={300} width={460} height={18} fill={K.deskDeep} stroke={INK} strokeWidth={4} />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={2110 + i * 220} y={214} width={180} height={86} rx={8} fill="#3B4A57" stroke={INK} strokeWidth={4} />
          <rect x={2126 + i * 220} y={232} width={70} height={24} rx={4} fill="#22323D" />
          <circle cx={2266 + i * 220} cy={256} r={9} fill={i ? K.senderB : K.senderA} stroke={INK} strokeWidth={2.5} />
        </g>
      ))}
    </g>
  );
};

/** The relay software on the workstation monitor (screen-space = world, inside WIN). */
const RelayUI: React.FC<{st: FGState}> = ({st}) => {
  const {x, y, w, h} = WIN;
  const row = (who: 'A' | 'B') => {
    const sl = SLOT[who];
    const col = who === 'A' ? K.senderA : K.senderB;
    return (
      <g key={who}>
        <circle cx={x + 30} cy={sl.y} r={11} fill={col} stroke={INK} strokeWidth={3} />
        <text x={x + 50} y={sl.y + 8} fontFamily={FONT_HEAD} fontWeight={600} fontSize={23} fill="#D3DEE6">{`Sender ${who}`}</text>
        <rect x={sl.x - 58} y={sl.y - 26} width={116} height={52} rx={26} fill="none" stroke="#4A6378" strokeWidth={3} strokeDasharray="7 6" />
      </g>
    );
  };
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#14232E" />
      <rect x={x} y={y} width={w} height={34} fill="#24394A" />
      {[0, 1, 2].map((i) => <circle key={i} cx={x + 16 + i * 16} cy={y + 17} r={5} fill={['#EF6B55', '#FFC744', '#7CC08A'][i]} />)}
      <text x={x + 70} y={y + 24} fontFamily={FONT_HEAD} fontWeight={600} fontSize={18} fill="#BFD3E0">BrainNet relay</text>
      <text x={x + w - 14} y={y + 24} textAnchor="end" fontFamily={FONT_HEAD} fontWeight={600} fontSize={16} fill="#7F98AB">decode · send</text>
      <path d={`M${x + 16},${y + 885 - 740} H${x + w - 16}`} stroke="#2B4152" strokeWidth={2} />
      {row('A')}
      {row('B')}
      {st.flipNote > 0 && (
        <text x={SLOT.B.x} y={SLOT.B.y + 52} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={19} fill={K.saffron} opacity={st.flipNote}>flipped by software</text>
      )}
      {/* 10 of 16 trials: the bad Sender's vote is flipped on these */}
      {st.strip.k > 0 && (
        <g opacity={clamp(st.strip.k * 1.5)}>
          <text x={x + 16} y={y + 262} fontFamily={FONT_HEAD} fontWeight={600} fontSize={16} fill="#9DB2C3">trials where B is flipped</text>
          {Array.from({length: 16}, (_, i) => {
            const marked = [0, 1, 3, 4, 6, 8, 9, 11, 13, 14];
            const idx = marked.indexOf(i);
            const on = idx >= 0 ? clamp(st.strip.n - idx) : 0;
            const cx = x + 26 + i * 24.5, cy = y + 290;
            return (
              <g key={i}>
                <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={4} fill={mix('#2A4152', K.senderB, on)} stroke="#5E7A8C" strokeWidth={2} />
                {on > 0.5 && <path d={`M${cx - 5},${cy - 2} h8 l-2.5,-3 M${cx + 5},${cy + 3} h-8 l2.5,3`} stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

/** the lab computer (tower + workstation monitor + keyboard on a bench), drawn over the cable ends */
const HubFront: React.FC<{id: string; st: FGState}> = ({id, st}) => {
  const o = HUB;
  const {x, y, w, h} = TOWER;
  const by = BENCH_Y;
  return (
    <g>
      {/* the bench */}
      <rect x={o.x - 4} y={by} width={o.w + 8} height={30} fill={K.deskTop} stroke={INK} strokeWidth={5} />
      <rect x={o.x - 4} y={by + 30} width={o.w + 8} height={300} fill={K.desk} stroke={INK} strokeWidth={5} />
      <rect x={o.x + 40} y={by + 70} width={360} height={110} rx={8} fill={shade(K.desk, 0.08)} stroke={INK} strokeWidth={4} />
      <rect x={o.x + 190} y={by + 115} width={60} height={14} rx={7} fill={K.deskDeep} />
      {/* tower PC */}
      <rect x={x + 10} y={y + 14} width={w} height={h} rx={10} fill={INK} opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#C9D0D6" stroke={INK} strokeWidth={5} />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={6} fill="none" stroke="#E4E9ED" strokeWidth={3} />
      <rect x={x + 22} y={y + 36} width={w - 44} height={22} rx={4} fill="#9EA9B2" stroke={INK} strokeWidth={3} />
      <rect x={x + 22} y={y + 68} width={w - 44} height={22} rx={4} fill="#9EA9B2" stroke={INK} strokeWidth={3} />
      <rect x={x + 30} y={y + 44} width={40} height={6} rx={3} fill="#6E7C86" />
      {Array.from({length: 7}, (_, i) => <rect key={i} x={x + 26} y={y + 140 + i * 18} width={w - 52} height={7} rx={3.5} fill="#A8B2BA" />)}
      <circle cx={x + w / 2} cy={y + h - 52} r={15} fill="#E4E9ED" stroke={INK} strokeWidth={4} />
      <circle cx={x + w / 2} cy={y + h - 52} r={5} fill={mix('#7CC08A', '#D9FBE0', st.hubBlink)} />
      <circle cx={x + w - 26} cy={y + h - 22} r={7} fill={mix('#6E7C86', K.saffron, st.hubBlink)} stroke={INK} strokeWidth={2.5} />
      {st.hubBlink > 0 && <circle cx={x + w - 26} cy={y + h - 22} r={15} fill={K.saffron} opacity={0.35 * st.hubBlink} />}
      {/* ports */}
      <rect x={PORT_IN.A.x - 12} y={PORT_IN.A.y - 4} width={24} height={12} rx={3} fill="#3B4A57" stroke={INK} strokeWidth={3} />
      <rect x={PORT_IN.B.x - 4} y={PORT_IN.B.y - 12} width={12} height={24} rx={3} fill="#3B4A57" stroke={INK} strokeWidth={3} />
      <rect x={PORT_OUT.x - 8} y={PORT_OUT.y - 12} width={12} height={24} rx={3} fill="#3B4A57" stroke={INK} strokeWidth={3} />
      {/* workstation monitor */}
      <path d={`M2160,${by} L2340,${by} L2320,${by - 16} L2180,${by - 16} Z`} fill={K.metalDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={2228} y={WIN.y + WIN.h + 20} width={44} height={by - 16 - (WIN.y + WIN.h + 20)} fill={K.metal} stroke={INK} strokeWidth={5} />
      <rect x={WIN.x - 26} y={WIN.y - 26} width={WIN.w + 52} height={WIN.h + 56} rx={18} fill="#2A3B47" stroke={INK} strokeWidth={6} />
      <defs>
        <clipPath id={`${id}-win`}>
          <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={4} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-win)`}>
        <RelayUI st={st} />
      </g>
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={4} fill="none" stroke={INK} strokeWidth={4} />
      <circle cx={WIN.x + WIN.w + 10} cy={WIN.y + WIN.h + 16} r={4} fill="#7CC08A" />
      {/* keyboard and mouse */}
      <path d={`M2070,${by + 4} L2410,${by + 4} L2420,${by + 24} L2060,${by + 24} Z`} fill="#E9EDF0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M2085,${by + 12} H2395 M2080,${by + 18} H2400`} stroke="#B5BEC6" strokeWidth={3} />
      <ellipse cx={2475} cy={by + 14} rx={22} ry={11} fill="#E9EDF0" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** cables: the two Sender lines into the tower, the tower's output to the stimulator, with a glow while a vote rides */
const Cables: React.FC<{st: FGState}> = ({st}) => {
  const rA = routeOf('A'), rB = routeOf('B'), out = routeOut('A');
  const pipe = (pts: P2[], glow: number, col: string, k: string) => (
    <g key={k}>
      <path d={pd(pts)} fill="none" stroke={INK} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" />
      <path d={pd(pts)} fill="none" stroke="#9AA5AE" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      {glow > 0 && <path d={pd(pts)} fill="none" stroke={col} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.75 * glow} />}
    </g>
  );
  return (
    <g>
      {pipe(rA.slice(1), st.cableGlow.A, K.senderA, 'a')}
      {pipe(rB.slice(1), st.cableGlow.B, K.senderB, 'b')}
      {pipe(out, st.cableGlow.out, K.saffron, 'o')}
    </g>
  );
};

/** The whole floor at state st (world units). The Receiver's head is drawn separately (it is a near layer in the
 *  push-through transitions), except when `head` is set. */
export const FGWorld: React.FC<{id: string; st: FGState; f: number; head?: boolean}> = ({id, st, f, head}) => (
  <g>
    <rect x={-6000} y={-6000} width={18000} height={14000} fill={K.paper} />
    <rect x={-60} y={-60} width={4820} height={2220} rx={12} fill="#D8C9AE" stroke={INK} strokeWidth={8} />
    <SenderRoom id={`${id}a`} who="A" st={st} f={f} />
    <SenderRoom id={`${id}b`} who="B" st={st} f={f} />
    <HubBack id={`${id}h`} />
    <ReceiverRoom id={`${id}r`} st={st} />
    <Cables st={st} />
    <HubFront id={`${id}h`} st={st} />
    {[RA, RB, HUB, RR].map((o, i) => <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} fill="none" stroke={INK} strokeWidth={7} />)}
    {st.toks.map((tk, i) => <Token key={i} {...tk} />)}
    {head && (
      <g>
        <RecvBack id={`${id}hd`} coilK={st.coilK} pulse={st.pulse} brain={st.brain} look={st.look} tilt={st.tilt} />
        <RecvGaze g={st.gaze.R} look={st.look} />
      </g>
    )}
  </g>
);

/** a foreground wall pillar (near layer), in world coords at wall x, spanning the building height */
export const Pillar: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 70} y={-400} width={140} height={2900} fill="#B9A988" stroke={INK} strokeWidth={8} />
    <rect x={x - 70} y={-400} width={36} height={2900} fill="#CDBF9F" />
  </g>
);
