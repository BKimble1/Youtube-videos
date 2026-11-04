// BrainNet (2019) world for S6 and S7: one building cut away into three rooms (Sender A teal, Sender B coral, the
// Receiver purple) and a hall with the computer between them. Everything is drawn from a plain state object (see
// shots/s6timeline.ts) so S6 and S7 share one continuous picture. All SVG ids start with "s6".
//
// The falling-block game is drawn in a Monitor's 640 x 400 screen frame. The piece is an asymmetric 3 x 2 J shape, so a
// 180 degree turn matters: unturned, its long edge is at the bottom; turned, a single cell hangs at its right end and
// drops into the one-cell gap in the bottom line.
import React from 'react';
import {clamp, easeInOut, fmt, lerp} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {CrewChar, IDLE} from './crew';
import {BN, EEGCap} from './people';
import {FONT_HEAD, Fig8Coil, INK, K, Monitor, Tag} from './kit';

// ---------------------------------------------------------------- game geometry (screen-local, 640 x 400)
export const GCOLS = 8, GROWS = 10, CW = 32, CH = 31.2; // cell 32 x 31.2: the 3 x 2 piece has the touchpad's aspect
export const PF = {x: 192, y: 12, w: GCOLS * CW, h: GROWS * CH};
export const HIDE_ROW = 4; // the Receiver sees rows 0..3 only
export const TRACK_V = 350;
export const GAP_COL = 5;

type Cell = [number, number]; // col, row
const PIECE: Cell[] = [[0, 0], [0, 1], [1, 1], [2, 1]];
const rotCell = ([c, r]: Cell): Cell => [2 - c, 1 - r];
const pieceOutline = () => {
  const p = [[0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [0, 2]];
  return 'M' + p.map(([x, y]) => `${fmt(x * CW)},${fmt(y * CH)}`).join(' L') + ' Z';
};

/** One trial of the game: the settled board, the piece's column, its fall and turn, the line clear. */
export type Trial = {
  col: number;
  board: Cell[];
  /** keyed top row of the piece: [t, row, ease] */
  rowK: [number, number, ('io' | 'in')?][];
  rotT?: number;
  landT: number;
  clearT?: number;
  inT: number;
  outT?: number;
};

const segVal = (t: number, ks: [number, number, ('io' | 'in')?][]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb, e] = ks[i + 1];
    if (t <= b) {
      const u = clamp((t - a) / (b - a || 1e-6));
      return va + (vb - va) * (e === 'in' ? u * u : easeInOut(u));
    }
  }
  return ks[ks.length - 1][1];
};
export const trialRow = (tr: Trial, t: number) => segVal(t, tr.rowK);
export const trialRot = (tr: Trial, t: number) => (tr.rotT === undefined ? 0 : easeInOut(clamp((t - tr.rotT) / 0.38)));

const settled = '#7C9DBD';
const CellR: React.FC<{x: number; y: number; fill: string; sy?: number; op?: number; flash?: number}> = ({x, y, fill, sy = 1, op = 1, flash = 0}) => (
  <g transform={`translate(${fmt(x + CW / 2)} ${fmt(y + CH / 2)}) scale(1 ${fmt(sy)})`} opacity={op}>
    <rect x={-CW / 2 + 1} y={-CH / 2 + 1} width={CW - 2} height={CH - 2} rx={4} fill={fill} stroke={INK} strokeWidth={2.4} />
    <rect x={-CW / 2 + 5} y={-CH / 2 + 4} width={CW - 10} height={6} rx={3} fill="#FFFFFF" opacity={0.35} />
    {flash > 0 && <rect x={-CW / 2 + 1} y={-CH / 2 + 1} width={CW - 2} height={CH - 2} rx={4} fill="#FFFFFF" opacity={flash} />}
  </g>
);

/** The piece, falling (one outlined shape, turning about its box centre). */
const Piece: React.FC<{x: number; y: number; rot: number; fill: string}> = ({x, y, rot, fill}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot * 180)} ${fmt(1.5 * CW)} ${fmt(CH)})`}>
    {PIECE.map(([c, r], i) => (
      <g key={i}>
        <rect x={c * CW} y={r * CH} width={CW} height={CH} fill={fill} />
        <rect x={c * CW + 4} y={r * CH + 4} width={CW - 8} height={6} rx={3} fill="#FFFFFF" opacity={0.4} />
      </g>
    ))}
    <path d={`M${fmt(CW)},${fmt(CH)} L${fmt(CW)},${fmt(2 * CH)} M${fmt(2 * CW)},${fmt(CH)} L${fmt(2 * CW)},${fmt(2 * CH)} M0,${fmt(CH)} L${fmt(CW)},${fmt(CH)}`} stroke={shade(fill, 0.25)} strokeWidth={2} />
    <path d={pieceOutline()} fill="none" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
  </g>
);

/** Board + piece of a trial at time t (screen-local). */
export const TrialCells: React.FC<{tr: Trial; t: number; tint?: number}> = ({tr, t, tint = 1}) => {
  const inK = clamp((t - tr.inT) / 0.45);
  const outK = tr.outT === undefined ? 0 : clamp((t - tr.outT) / 0.4);
  if (inK <= 0 || outK >= 1) return null;
  const row = trialRow(tr, t);
  const rot = trialRot(tr, t);
  const fill = mix('#EEF2F5', K.saffron, tint);
  const landed = t >= tr.landT;
  const pc: Cell[] = landed ? PIECE.map((p) => (rot > 0.5 ? rotCell(p) : p)).map(([c, r]) => [tr.col + c, Math.round(row) + r] as Cell) : [];
  const c = tr.clearT === undefined ? -1 : (t - tr.clearT) / 0.62;
  const flashA = c > 0 && c < 0.45 ? Math.sin((c / 0.45) * Math.PI) * 0.85 : 0;
  const squash = c <= 0.4 ? 1 : 1 - easeInOut(clamp((c - 0.4) / 0.25));
  const drop = c <= 0.6 ? 0 : easeInOut(clamp((c - 0.6) / 0.4));
  const cells: {cc: Cell; fill: string}[] = [...tr.board.map((cc) => ({cc, fill: settled})), ...pc.map((cc) => ({cc, fill}))];
  const slideIn = (1 - easeInOut(inK)) * CH * 2;
  const slideOut = easeInOut(outK) * CH * 3;
  return (
    <g opacity={Math.min(inK * 1.3, 1 - outK)}>
      <g transform={`translate(0 ${fmt(slideOut)})`}>
        {cells.map(({cc: [col, r], fill: f}, i) => {
          const bottom = r === GROWS - 1;
          if (c >= 1 && bottom) return null;
          const yy = PF.y + r * CH + (c > 0 && !bottom ? drop * CH : 0) + slideIn;
          return <CellR key={i} x={PF.x + col * CW} y={yy} fill={f} sy={c > 0 && bottom ? squash : 1} flash={c > 0 && bottom ? flashA : 0} />;
        })}
      </g>
      {!landed && <Piece x={PF.x + tr.col * CW} y={PF.y + row * CH - (1 - easeInOut(inK)) * CH * 2.2} rot={rot} fill={fill} />}
    </g>
  );
};

// ---------------------------------------------------------------- the screen
export type ScreenFx = {
  fog?: number; // receiver: the lower field is hidden
  gapGlow?: number;
  tint?: number;
  ghost?: number; // 0..1 the dashed preview turns 0..180
  ghostK?: number;
  q?: number;
  ind?: number; // -1 (YES side) .. 1 (NO side)
  indK?: number;
  yesHi?: number;
  noHi?: number;
};

const EyeSlash: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} fill="none" stroke="#8FA6B9" strokeWidth={5} strokeLinecap="round">
    <path d="M-34,0 Q0,-30 34,0 Q0,30 -34,0 Z" />
    <circle cx={0} cy={0} r={9} />
    <path d="M-30,-26 L30,26" stroke="#8FA6B9" strokeWidth={6} />
  </g>
);

export const BNScreen: React.FC<{id: string; t: number; trs: Trial[]; fx: ScreenFx; accent: string}> = ({id, t, trs, fx, accent}) => {
  const tr = trs[trs.length - 1];
  const {fog = 0, gapGlow = 0, tint = 1, ghost = 0, ghostK = 0, q = 0, ind = 0, indK = 0, yesHi = 0, noHi = 0} = fx;
  const pfB = PF.y + PF.h;
  const hideY = PF.y + HIDE_ROW * CH;
  const row = trialRow(tr, t);
  const side = (x: number, label: string, sub: string, hi: number) => (
    <g>
      <text x={x} y={72} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={46} fill={mix('#C9D6E0', '#FFFFFF', hi)}>{label}</text>
      <text x={x} y={104} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={22} fill="#9DB2C3">{sub}</text>
      {hi > 0 && <rect x={x - 70} y={26} width={140} height={92} rx={14} fill="none" stroke={accent} strokeWidth={5} opacity={hi} />}
    </g>
  );
  return (
    <g>
      <rect x={0} y={0} width={640} height={400} fill="#1A2C3A" />
      {side(96, 'YES', 'rotate', yesHi)}
      {side(544, 'NO', 'leave it', noHi)}
      {/* playfield */}
      <rect x={PF.x - 3} y={PF.y - 3} width={PF.w + 6} height={PF.h + 6} rx={4} fill="#22384A" stroke="#4A6378" strokeWidth={3} />
      <g opacity={0.18} stroke="#9DB2C3" strokeWidth={1}>
        {Array.from({length: GCOLS - 1}, (_, i) => <path key={`c${i}`} d={`M${PF.x + (i + 1) * CW},${PF.y} L${PF.x + (i + 1) * CW},${pfB}`} />)}
        {Array.from({length: GROWS - 1}, (_, i) => <path key={`r${i}`} d={`M${PF.x},${fmt(PF.y + (i + 1) * CH)} L${PF.x + PF.w},${fmt(PF.y + (i + 1) * CH)}`} />)}
      </g>
      <defs>
        <clipPath id={`${id}-pf`}>
          <rect x={PF.x} y={PF.y} width={PF.w} height={PF.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-pf)`}>
        {trs.map((x, i) => <TrialCells key={i} tr={x} t={t} tint={tint} />)}
      </g>
      {gapGlow > 0 && (
        <g opacity={gapGlow}>
          <rect x={PF.x + GAP_COL * CW - 5} y={PF.y + (GROWS - 1) * CH - 5} width={CW + 10} height={CH + 10} rx={8} fill="none" stroke={K.saffron} strokeWidth={6} />
          <circle cx={PF.x + GAP_COL * CW + CW / 2} cy={PF.y + (GROWS - 1) * CH + CH / 2} r={34 + 10 * Math.sin(t * 7)} fill="none" stroke={K.saffron} strokeWidth={3} opacity={0.6} />
        </g>
      )}
      {/* the Receiver's hidden lower field */}
      {fog > 0 && (
        <g opacity={fog}>
          <defs>
            <clipPath id={`${id}-fog`}>
              <rect x={PF.x - 3} y={hideY} width={PF.w + 6} height={pfB - hideY + 3} />
            </clipPath>
          </defs>
          <rect x={PF.x - 3} y={hideY} width={PF.w + 6} height={pfB - hideY + 3} fill="#33485A" />
          <g clipPath={`url(#${id}-fog)`} stroke="#3E5568" strokeWidth={6}>
            {Array.from({length: 18}, (_, i) => <path key={i} d={`M${PF.x - 200 + i * 34},${pfB + 10} L${PF.x - 200 + i * 34 + 200},${hideY - 10}`} />)}
          </g>
          <path d={`M${PF.x - 3},${hideY} L${PF.x + PF.w + 3},${hideY}`} stroke="#8FA6B9" strokeWidth={3} strokeDasharray="8 7" />
          <g opacity={1 - q}><EyeSlash x={PF.x + PF.w / 2} y={hideY + (pfB - hideY) * 0.52} s={1.1} /></g>
          {q > 0 && (
            <text x={PF.x + PF.w / 2} y={hideY + (pfB - hideY) * 0.52 + 32} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={92} fill={K.cream} opacity={q}
              stroke="#33485A" strokeWidth={10} paintOrder="stroke">?</text>
          )}
        </g>
      )}
      {/* a dashed preview of the turned piece */}
      {ghostK > 0 && (
        <g opacity={ghostK}>
          <g transform={`translate(${fmt(PF.x + tr.col * CW)} ${fmt(PF.y + row * CH)}) rotate(${fmt(ghost * 180)} ${fmt(1.5 * CW)} ${fmt(CH)})`}>
            <path d={pieceOutline()} fill={K.cream} fillOpacity={0.12} stroke={K.cream} strokeWidth={3.5} strokeDasharray="9 7" strokeLinejoin="round" />
          </g>
          <path d={`M${fmt(PF.x + tr.col * CW + 1.5 * CW - 70)},${fmt(PF.y + row * CH + CH + 6)} A70,62 0 1 1 ${fmt(PF.x + tr.col * CW + 1.5 * CW + 70)},${fmt(PF.y + row * CH + CH + 6)}`}
            fill="none" stroke={K.saffron} strokeWidth={5} strokeLinecap="round" />
          <path d={`M${fmt(PF.x + tr.col * CW + 1.5 * CW + 70)},${fmt(PF.y + row * CH + CH + 6)} l-12,-14 M${fmt(PF.x + tr.col * CW + 1.5 * CW + 70)},${fmt(PF.y + row * CH + CH + 6)} l12,-12`}
            stroke={K.saffron} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {/* the YES / NO selector: a dot that slides toward the light being watched */}
      <g opacity={0.45 + 0.55 * indK}>
        <path d={`M110,${TRACK_V} L530,${TRACK_V}`} stroke="#4A6378" strokeWidth={8} strokeLinecap="round" />
        <circle cx={110} cy={TRACK_V} r={9} fill="#9DB2C3" />
        <circle cx={530} cy={TRACK_V} r={9} fill="#9DB2C3" />
        {indK > 0 && <circle cx={fmt(320 + ind * 210)} cy={TRACK_V} r={15} fill={accent} stroke="#FFFFFF" strokeWidth={4} opacity={indK} />}
      </g>
    </g>
  );
};

/** A game monitor with the two flickering lights on its sides (Yes left, No right) and an owner colour strip. */
export const BNMonitor: React.FC<{id: string; x: number; y: number; s: number; t: number; accent: string; leds: number; ringYes?: number; ringNo?: number; children: React.ReactNode}> = ({
  id, x, y, s, t, accent, leds, ringYes = 0, ringNo = 0, children,
}) => {
  const lamp = (lx: number, ph: number, ring: number, label: string) => {
    const sh = 0.78 + 0.22 * Math.sin(t * 2 * Math.PI * 4.6 + ph);
    const on = leds * sh;
    return (
      <g>
        <rect x={lx - 30} y={-352} width={60} height={104} rx={14} fill="#2A3B47" stroke={INK} strokeWidth={5} />
        {on > 0.01 && <circle cx={lx} cy={-318} r={46} fill="#FFF3C4" opacity={0.28 * on} />}
        <circle cx={lx} cy={-318} r={19} fill={mix('#56636E', '#FFF8DA', on)} stroke={INK} strokeWidth={4} />
        <text x={lx} y={-266} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={20} fill="#DDE5EA">{label}</text>
        {ring > 0 && <circle cx={lx} cy={-318} r={36} fill="none" stroke={accent} strokeWidth={8} opacity={ring} />}
      </g>
    );
  };
  return (
    <g>
      <Monitor id={id} x={x} y={y} s={s}>
        {children}
      </Monitor>
      <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
        <rect x={-70} y={-99} width={140} height={12} rx={6} fill={accent} stroke={INK} strokeWidth={3} />
        {lamp(-392, 0, ringYes, 'YES')}
        {lamp(392, 1.7, ringNo, 'NO')}
      </g>
    </g>
  );
};
export const ledPt = (m: {x: number; y: number; s: number}, side: -1 | 1) => ({x: m.x + side * 392 * m.s, y: m.y - 318 * m.s});
export const screenPt = (m: {x: number; y: number; s: number}, u: number, v: number) => ({x: m.x + (-320 + u) * m.s, y: m.y + (-510 + v) * m.s});

// ---------------------------------------------------------------- vote token
export const Token: React.FC<{x: number; y: number; s: number; color: string; text: string; flipText?: string; flip?: number; k?: number}> = ({x, y, s, color, text, flipText, flip = 0, k = 1}) => {
  if (k <= 0.001) return null;
  const sx = Math.max(0.04, Math.abs(Math.cos(flip * Math.PI)));
  const label = flip < 0.5 ? text : flipText ?? text;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s * (0.6 + 0.4 * clamp(k)))})`} opacity={clamp(k * 1.6)}>
      <g transform={`scale(${fmt(sx)} 1)`}>
        <rect x={-62 + 4} y={-29 + 5} width={124} height={58} rx={29} fill={INK} opacity={0.2} />
        <rect x={-62} y={-29} width={124} height={58} rx={29} fill={color} stroke={INK} strokeWidth={5} />
        <rect x={-46} y={-21} width={60} height={9} rx={4.5} fill="#FFFFFF" opacity={0.35} />
        <text x={0} y={13} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={36} fill="#FFFFFF" stroke={shade(color, 0.45)} strokeWidth={3} paintOrder="stroke">{label}</text>
      </g>
      {flip > 0.02 && flip < 0.98 && (
        <g fill="none" stroke={K.saffron} strokeWidth={6} strokeLinecap="round" opacity={Math.sin(flip * Math.PI)}>
          <path d="M-58,-44 A70,48 0 0 1 58,-44" />
          <path d="M58,-44 l-14,-6 M58,-44 l-4,14" />
          <path d="M58,44 A70,48 0 0 1 -58,44" />
          <path d="M-58,44 l14,6 M-58,44 l4,-14" />
        </g>
      )}
    </g>
  );
};

/** One brief, soft arc of light (the perceived flash). */
export const SoftArc: React.FC<{x: number; y: number; w: number; k: number; dashed?: boolean}> = ({x, y, w, k, dashed}) => {
  if (k <= 0.001) return null;
  const d = `M${fmt(x - w / 2)},${fmt(y + w * 0.12)} Q${fmt(x)},${fmt(y - w * 0.3)} ${fmt(x + w / 2)},${fmt(y + w * 0.12)}`;
  if (dashed)
    return <path d={d} fill="none" stroke={K.cream} strokeWidth={w * 0.012} strokeDasharray={`${w * 0.03} ${w * 0.03}`} strokeLinecap="round" opacity={k * 0.7} />;
  return (
    <g fill="none" strokeLinecap="round" opacity={k}>
      <path d={d} stroke="#FFE9A8" strokeWidth={w * 0.13} opacity={0.12} />
      <path d={d} stroke="#FFE9A8" strokeWidth={w * 0.08} opacity={0.22} />
      <path d={d} stroke="#FFF4CF" strokeWidth={w * 0.04} opacity={0.55} />
      <path d={d} stroke="#FFFDF4" strokeWidth={w * 0.016} opacity={0.95} />
    </g>
  );
};

// ---------------------------------------------------------------- the Receiver, from behind
export const ReceiverBack: React.FC<{id: string; x: number; y: number; r: number; coilK: number; pulse: number; brain: number; tilt?: number}> = ({id, x, y, r: R, coilK, pulse, brain, tilt = 0}) => {
  const skin = BN.receiver.skin;
  const hair = BN.receiver.hairColor;
  const shirt = K.receiver;
  const coil = coilPos({x, y, r: R});
  // the coil slides in from frame left and settles flat on the back of the head
  const cx = coil.x - (1 - easeInOut(coilK)) * 260;
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
          <ellipse cx={x} cy={y} rx={R} ry={R * 1.06} />
        </clipPath>
      </defs>
      {/* shoulders and back */}
      <path d={`M${fmt(x - 2.5 * R)},${fmt(y + 3.2 * R)} Q${fmt(x - 2.45 * R)},${fmt(y + 1.25 * R)} ${fmt(x - 0.9 * R)},${fmt(y + 1.02 * R)} L${fmt(x + 0.9 * R)},${fmt(y + 1.02 * R)} Q${fmt(x + 2.45 * R)},${fmt(y + 1.25 * R)} ${fmt(x + 2.5 * R)},${fmt(y + 3.2 * R)} Z`}
        fill={`url(#${id}-sh)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${fmt(x - 0.62 * R)},${fmt(y + 1.04 * R)} Q${fmt(x)},${fmt(y + 1.3 * R)} ${fmt(x + 0.62 * R)},${fmt(y + 1.04 * R)}`} fill="none" stroke={shade(shirt, 0.35)} strokeWidth={6} />
      <g transform={`rotate(${fmt(tilt)} ${fmt(x)} ${fmt(y + 1.0 * R)})`}>
        {/* neck */}
        <rect x={x - 0.4 * R} y={y + 0.5 * R} width={0.8 * R} height={0.6 * R} fill={shade(skin, 0.18)} stroke={INK} strokeWidth={5} />
        {/* ears */}
        {[-1, 1].map((sd) => (
          <ellipse key={sd} cx={x + sd * 0.98 * R} cy={y + 0.14 * R} rx={0.17 * R} ry={0.28 * R} fill={skin} stroke={INK} strokeWidth={5} />
        ))}
        {/* head: short hair at the nape, the cap over the rest */}
        <ellipse cx={x} cy={y} rx={R} ry={R * 1.06} fill={hair} stroke={INK} strokeWidth={6} />
        <g clipPath={`url(#${id}-hc)`}>
          <path d={`M${fmt(x - 1.1 * R)},${fmt(y + 0.62 * R)} Q${fmt(x)},${fmt(y + 0.42 * R)} ${fmt(x + 1.1 * R)},${fmt(y + 0.62 * R)} L${fmt(x + 1.1 * R)},${fmt(y - 1.2 * R)} L${fmt(x - 1.1 * R)},${fmt(y - 1.2 * R)} Z`}
            fill={`url(#${id}-hd)`} stroke={INK} strokeWidth={4} />
          {[[-0.55, -0.62], [0, -0.78], [0.55, -0.62], [-0.78, -0.18], [-0.27, -0.3], [0.27, -0.3], [0.78, -0.18], [-0.55, 0.22], [0, 0.12], [0.55, 0.22]].map(([ex, ey], i) => (
            <circle key={i} cx={x + ex * R} cy={y + ey * R} r={0.075 * R} fill="#D9DEE2" stroke={INK} strokeWidth={2.5} />
          ))}
          {/* the brain under the cap, shown on "the part of the brain involved in vision" */}
          {brain > 0 && (
            <g opacity={brain}>
              <ellipse cx={x} cy={y} rx={R * 1.1} ry={R * 1.2} fill={K.cream} opacity={0.55} />
              {[-1, 1].map((sd) => (
                <g key={sd}>
                  <ellipse cx={x + sd * 0.43 * R} cy={y - 0.05 * R} rx={0.47 * R} ry={0.8 * R} fill="#F3C6C0" stroke={INK} strokeWidth={4} />
                  <path d={`M${fmt(x + sd * 0.2 * R)},${fmt(y - 0.6 * R)} q${fmt(sd * 0.2 * R)},${fmt(0.12 * R)} ${fmt(sd * 0.1 * R)},${fmt(0.3 * R)} t${fmt(sd * 0.15 * R)},${fmt(0.3 * R)} M${fmt(x + sd * 0.55 * R)},${fmt(y - 0.5 * R)} q${fmt(sd * 0.2 * R)},${fmt(0.2 * R)} ${fmt(-sd * 0.05 * R)},${fmt(0.42 * R)}`}
                    fill="none" stroke={shade('#F3C6C0', 0.3)} strokeWidth={4} strokeLinecap="round" />
                  <ellipse cx={x + sd * 0.42 * R} cy={y + 0.5 * R} rx={0.36 * R} ry={0.22 * R} fill={K.saffron} stroke={shade(K.saffron, 0.35)} strokeWidth={3} opacity={0.95} />
                </g>
              ))}
            </g>
          )}
        </g>
        <ellipse cx={x} cy={y} rx={R} ry={R * 1.06} fill="none" stroke={INK} strokeWidth={6} />
        {/* cap cable */}
        <path d={`M${fmt(x + 0.7 * R)},${fmt(y + 0.5 * R)} Q${fmt(x + 1.1 * R)},${fmt(y + 1.1 * R)} ${fmt(x + 1.0 * R)},${fmt(y + 1.9 * R)}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        {/* the figure-eight coil, flat on the back of the head over the left visual cortex, handle level */}
        {coilK > 0 && (
          <g opacity={clamp(coilK * 2)}>
            <path d={`M${fmt(cx - 0.42 * 230 - 4)},${fmt(coil.y)} Q${fmt(cx - 1.6 * R)},${fmt(coil.y + 0.4 * R)} ${fmt(cx - 1.9 * R)},${fmt(coil.y + 1.6 * R)}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <Fig8Coil x={cx} y={coil.y} s={0.42} ang={-90} />
            {pulse > 0 && [0, 1, 2].map((i) => {
              const k = clamp(pulse * 1.4 - i * 0.2);
              return <circle key={i} cx={cx} cy={coil.y} r={30 + 70 * k} fill="none" stroke={K.saffron} strokeWidth={7 - i * 1.5} opacity={(1 - k) * 0.9} />;
            })}
          </g>
        )}
      </g>
    </g>
  );
};
export const coilPos = (h: {x: number; y: number; r: number}) => ({x: h.x - 0.34 * h.r, y: h.y + 0.42 * h.r});

// ---------------------------------------------------------------- the building
export const ROOM_A = {x: 60, y: 60, w: 700, h: 380};
export const ROOM_B = {x: 60, y: 470, w: 700, h: 380};
export const HALL = {x: 790, y: 60, w: 340, h: 790};
export const ROOM_R = {x: 1160, y: 60, w: 700, h: 790};
const S_MON = {x: 470, y: 340, s: 0.5};
const S_PERSON = {x: 150, y: 480, s: 0.7};
const R_MON = {x: 350, y: 470, s: 0.62};
const R_HEAD = {x: 350, y: 640, r: 92};
export const MON_A = {x: ROOM_A.x + S_MON.x, y: ROOM_A.y + S_MON.y, s: S_MON.s};
export const MON_B = {x: ROOM_B.x + S_MON.x, y: ROOM_B.y + S_MON.y, s: S_MON.s};
export const MON_R = {x: ROOM_R.x + R_MON.x, y: ROOM_R.y + R_MON.y, s: R_MON.s};
export const HEAD_R = {x: ROOM_R.x + R_HEAD.x, y: ROOM_R.y + R_HEAD.y, r: R_HEAD.r};
export const COIL = coilPos(HEAD_R);
export const eyeOf = (who: 'A' | 'B') => {
  const o = who === 'A' ? ROOM_A : ROOM_B;
  return {x: o.x + S_PERSON.x + 14, y: o.y + S_PERSON.y - 378 * S_PERSON.s};
};
export const capOf = (who: 'A' | 'B') => {
  const o = who === 'A' ? ROOM_A : ROOM_B;
  return {x: o.x + S_PERSON.x, y: o.y + S_PERSON.y - 452 * S_PERSON.s};
};
export const COMP = {x: 960, y: 500, w: 250, h: 330};
export const WIN = {x: 870, y: 382, w: 180, h: 116};
export const WIN_C = {x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2};

/** token routes: a Sender's cap to the computer window; the computer to the coil */
export const routeOf = (who: 'A' | 'B') => {
  const c = capOf(who);
  const top = who === 'A' ? ROOM_A.y + 46 : ROOM_B.y + 46;
  return [c, {x: c.x + 50, y: top}, {x: 770, y: top}, {x: 870, y: who === 'A' ? 418 : 462}, {x: WIN_C.x, y: WIN_C.y}];
};
export const ROUTE_R = [{x: WIN_C.x, y: WIN_C.y}, {x: 1050, y: 470}, {x: 1180, y: 600}, {x: COIL.x - 20, y: COIL.y}];
export const alongPath = (pts: {x: number; y: number}[], u: number) => {
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

export type Gaze = {k: number; side: -1 | 1};
export type Tok = {color: string; text: string; flipText?: string; flip: number; x: number; y: number; k: number; s: number};
export type BNState = {
  cam: {x: number; y: number; z: number};
  trs: Trial[];
  tint: number;
  fxA: ScreenFx;
  fxB: ScreenFx;
  fxR: ScreenFx;
  leds: {A: number; B: number; R: number};
  gaze: {A: Gaze; B: Gaze; R: Gaze};
  toks: Tok[];
  coilK: number;
  pulse: number;
  brain: number;
  flashW: number;
  tiltR: number;
  roomTags: number;
  hallTag: {text: string; k: number}[];
  grid: {k: number; n: number};
  bal: {k: number; tilt: number; n: number};
  tally: {k: number; n: number; sub: number};
  compBlink: number;
  look: {A: number; B: number};
};

const SenderRoom: React.FC<{who: 'A' | 'B'; st: BNState; t: number; f: number}> = ({who, st, t, f}) => {
  const o = who === 'A' ? ROOM_A : ROOM_B;
  const col = who === 'A' ? K.senderA : K.senderB;
  const id = `s6r${who}`;
  const g = st.gaze[who];
  const look = st.look[who];
  const pose = {...IDLE, lookX: lerp(0.75, g.side < 0 ? 0.55 : 1, g.k), lookY: lerp(-0.15, -0.35, g.k), mouth: 'flat' as const, brows: 0.1};
  const m = who === 'A' ? MON_A : MON_B;
  const eye = eyeOf(who);
  const led = ledPt(m, g.side);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(K.cream, col, 0.1)} />
          <stop offset="1" stopColor={mix(K.cream, col, 0.22)} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id}-w)`} />
        <rect x={o.x} y={o.y + 236} width={o.w} height={14} fill={mix(K.cream, col, 0.3)} />
        <CrewChar look={who === 'A' ? BN.senderA : BN.senderB} pose={{...pose, lookX: pose.lookX * (0.6 + 0.4 * look)}} frame={f} seed={who === 'A' ? 3 : 7} x={o.x + S_PERSON.x} y={o.y + S_PERSON.y} scale={S_PERSON.s} headGear={<EEGCap />} id={id} life={0.6} eyeDarts={false} shadow={false} />
        {/* desk */}
        <rect x={o.x - 10} y={o.y + 330} width={o.w + 20} height={60} fill={K.desk} stroke={INK} strokeWidth={5} />
        <rect x={o.x - 10} y={o.y + 330} width={o.w + 20} height={12} fill={K.deskTop} />
        <BNMonitor id={`${id}m`} x={m.x} y={m.y} s={m.s} t={t} accent={col} leds={st.leds[who]} ringYes={g.side < 0 ? g.k : 0} ringNo={g.side > 0 ? g.k : 0}>
          <BNScreen id={`${id}s`} t={t} trs={st.trs} fx={{...(who === 'A' ? st.fxA : st.fxB), tint: st.tint}} accent={col} />
        </BNMonitor>
        {g.k > 0.01 && (
          <path d={`M${fmt(eye.x)},${fmt(eye.y)} L${fmt(lerp(eye.x, led.x, g.k))},${fmt(lerp(eye.y, led.y, g.k))}`} stroke={col} strokeWidth={5} strokeDasharray="10 8" strokeLinecap="round" opacity={0.9} />
        )}
      </g>
    </g>
  );
};

const ReceiverRoom: React.FC<{st: BNState; t: number}> = ({st, t}) => {
  const o = ROOM_R;
  const id = 's6rr';
  const g = st.gaze.R;
  const led = ledPt(MON_R, g.side);
  const from = {x: HEAD_R.x, y: HEAD_R.y - HEAD_R.r * 0.9};
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(K.cream, K.receiver, 0.1)} />
          <stop offset="1" stopColor={mix(K.cream, K.receiver, 0.22)} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id}-w)`} />
        <rect x={o.x} y={o.y + 330} width={o.w} height={14} fill={mix(K.cream, K.receiver, 0.3)} />
        <rect x={o.x - 10} y={o.y + 462} width={o.w + 20} height={120} fill={K.desk} stroke={INK} strokeWidth={5} />
        <rect x={o.x - 10} y={o.y + 462} width={o.w + 20} height={14} fill={K.deskTop} />
        <BNMonitor id={`${id}m`} x={MON_R.x} y={MON_R.y} s={MON_R.s} t={t} accent={K.receiver} leds={st.leds.R} ringYes={g.side < 0 ? g.k : 0} ringNo={g.side > 0 ? g.k : 0}>
          <BNScreen id={`${id}s`} t={t} trs={st.trs} fx={{...st.fxR, tint: st.tint}} accent={K.receiver} />
        </BNMonitor>
        {st.flashW > 0 && <SoftArc x={MON_R.x} y={MON_R.y - 250 * MON_R.s} w={300} k={st.flashW} />}
        {g.k > 0.01 && (
          <path d={`M${fmt(from.x)},${fmt(from.y)} L${fmt(lerp(from.x, led.x, g.k))},${fmt(lerp(from.y, led.y, g.k))}`} stroke={K.receiver} strokeWidth={6} strokeDasharray="12 9" strokeLinecap="round" />
        )}
        <ReceiverBack id="s6rb" x={HEAD_R.x} y={HEAD_R.y} r={HEAD_R.r} coilK={st.coilK} pulse={st.pulse} brain={st.brain} tilt={st.tiltR} />
      </g>
    </g>
  );
};

const Computer: React.FC<{blink: number; part: 'back' | 'front'}> = ({blink, part}) => {
  const {x, y, w, h} = COMP;
  const x0 = x - w / 2, y0 = y - h / 2;
  if (part === 'back')
    return (
      <g>
        <rect x={x0 + 8} y={y0 + 12} width={w} height={h} rx={18} fill={INK} opacity={0.18} />
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="#1F3442" />
        <g opacity={0.25} stroke="#7FA3C4" strokeWidth={2} fill="none">
          <path d={`M${WIN.x + 10},${WIN.y + 30} h40 v30 h50 M${WIN.x + 170},${WIN.y + 90} h-40 v-30 h-30 M${WIN.x + 20},${WIN.y + 100} h60`} />
        </g>
      </g>
    );
  return (
    <g>
      <path fillRule="evenodd" d={`M${x0 + 18},${y0} h${w - 36} a18,18 0 0 1 18,18 v${h - 36} a18,18 0 0 1 -18,18 h${-(w - 36)} a18,18 0 0 1 -18,-18 v${-(h - 36)} a18,18 0 0 1 18,-18 Z M${WIN.x},${WIN.y} v${WIN.h} h${WIN.w} v${-WIN.h} Z`}
        fill="#D9DEE2" stroke={INK} strokeWidth={6} />
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={x0 + 26} y={y0 + 14} width={w - 52} height={12} rx={6} fill="#B5BEC6" />
      {[0, 1, 2].map((i) => <rect key={i} x={x0 + 40} y={y0 + 150 + i * 22 + 40} width={w - 80} height={10} rx={5} fill="#B5BEC6" />)}
      <circle cx={x} cy={y0 + h - 40} r={14} fill={mix('#6E7C86', K.saffron, blink)} stroke={INK} strokeWidth={4} />
      {blink > 0 && <circle cx={x} cy={y0 + h - 40} r={30} fill={K.saffron} opacity={0.3 * blink} />}
    </g>
  );
};

const FlipGrid: React.FC<{x: number; y: number; k: number; n: number}> = ({x, y, k, n}) => {
  if (k <= 0.001) return null;
  // ten of the sixteen trials carry a flipped vote (an even spread, for the picture only)
  const marked = [0, 1, 3, 4, 6, 8, 9, 11, 13, 14];
  return (
    <g opacity={clamp(k * 1.5)}>
      {Array.from({length: 16}, (_, i) => {
        const cx = x + (i % 8) * 40 - 140, cy = y + Math.floor(i / 8) * 42;
        const idx = marked.indexOf(i);
        const on = idx >= 0 ? clamp(n - idx) : 0;
        return (
          <g key={i}>
            <rect x={cx - 17} y={cy - 17} width={34} height={34} rx={7} fill={mix(K.cream, K.senderB, on)} stroke={INK} strokeWidth={3.5} />
            {on > 0 && (
              <g stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={on}>
                <path d={`M${cx - 9},${cy - 4} h16 l-5,-5 M${cx + 9},${cy + 5} h-16 l5,5`} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

const Balance: React.FC<{x: number; y: number; k: number; tilt: number}> = ({x, y, k, tilt}) => {
  if (k <= 0.001) return null;
  const L = 128;
  const a = (tilt * Math.PI) / 180;
  const end = (sd: number) => ({x: x + sd * L * Math.cos(a), y: y - sd * L * Math.sin(a)});
  const pan = (sd: number, col: string) => {
    const e = end(sd);
    return (
      <g>
        <path d={`M${fmt(e.x)},${fmt(e.y)} L${fmt(e.x - 30)},${fmt(e.y + 48)} M${fmt(e.x)},${fmt(e.y)} L${fmt(e.x + 30)},${fmt(e.y + 48)}`} stroke={INK} strokeWidth={3.5} />
        <path d={`M${fmt(e.x - 46)},${fmt(e.y + 48)} Q${fmt(e.x)},${fmt(e.y + 78)} ${fmt(e.x + 46)},${fmt(e.y + 48)} Z`} fill="#C9D1D8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={e.x} cy={e.y + 36} r={19} fill={col} stroke={INK} strokeWidth={4} />
      </g>
    );
  };
  return (
    <g opacity={clamp(k * 1.5)}>
      <path d={`M${x - 40},${y + 128} L${x + 40},${y + 128} L${x + 12},${y + 110} L${x - 12},${y + 110} Z`} fill="#8E9AA4" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <rect x={x - 7} y={y} width={14} height={112} fill="#AEB9C2" stroke={INK} strokeWidth={4} />
      <path d={`M${fmt(end(-1).x)},${fmt(end(-1).y)} L${fmt(end(1).x)},${fmt(end(1).y)}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d={`M${fmt(end(-1).x)},${fmt(end(-1).y)} L${fmt(end(1).x)},${fmt(end(1).y)}`} stroke="#C9D1D8" strokeWidth={6} strokeLinecap="round" />
      <circle cx={x} cy={y} r={10} fill={K.saffron} stroke={INK} strokeWidth={4} />
      {pan(-1, K.senderA)}
      {pan(1, K.senderB)}
    </g>
  );
};

const TallyCard: React.FC<{k: number; n: number; sub: number}> = ({k, n, sub}) => {
  if (k <= 0.001) return null;
  const x0 = 960 - 16 * 31 + 5;
  return (
    <g opacity={clamp(k * 1.5)} transform={`translate(960 400) scale(${fmt(0.9 + 0.1 * easeInOut(clamp(k)))}) translate(-960 -400)`}>
      <rect x={410} y={240} width={1100} height={330} rx={34} fill={INK} opacity={0.2} transform="translate(8 10)" />
      <rect x={410} y={240} width={1100} height={330} rx={34} fill={K.cream} stroke={INK} strokeWidth={6} />
      <text x={960} y={330} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={64} fill={INK}>
        {Math.round(clamp(n, 0, 13))} of 16 lines cleared
      </text>
      {Array.from({length: 16}, (_, i) => {
        const on = clamp(n - i);
        const cx = x0 + i * 62;
        return (
          <g key={i}>
            <rect x={cx - 26} y={380} width={52} height={52} rx={9} fill={i < 13 ? mix('#E3E8EC', K.saffron, on) : '#E3E8EC'} stroke={INK} strokeWidth={4} />
            {i < 13 && on > 0 && <path d={`M${cx - 12},${406} l9,10 l16,-20`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={on} />}
          </g>
        );
      })}
      <Tag x={960} y={500} text="average of 5 teams" size={36} k={sub} />
    </g>
  );
};

/** The whole building at time t, drawn in world units (z = 1 shows it all). */
export const BNWorld: React.FC<{st: BNState; t: number; f: number}> = ({st, t, f}) => {
  return (
    <g>
      <rect x={-4000} y={-4000} width={10000} height={10000} fill={K.paper} />
      {/* the building's cut walls */}
      <rect x={30} y={30} width={1860} height={850} rx={10} fill="#D8C9AE" stroke={INK} strokeWidth={7} />
      <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} fill="#E6DED0" />
      <rect x={HALL.x} y={HALL.y + HALL.h - 60} width={HALL.w} height={60} fill="#CFC2AE" />
      {/* signal wires through the walls */}
      <g fill="none" stroke="#9AA5AE" strokeWidth={4} strokeDasharray="10 9" opacity={0.75}>
        {(['A', 'B'] as const).map((w) => <path key={w} d={'M' + routeOf(w).map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} />)}
        <path d={'M' + ROUTE_R.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} />
      </g>
      <SenderRoom who="A" st={st} t={t} f={f} />
      <SenderRoom who="B" st={st} t={t} f={f} />
      <ReceiverRoom st={st} t={t} />
      {[ROOM_A, ROOM_B, ROOM_R, HALL].map((o, i) => (
        <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} fill="none" stroke={INK} strokeWidth={6} />
      ))}
      {/* the wires again on top, where they cross the rooms */}
      <g fill="none" stroke="#9AA5AE" strokeWidth={4} strokeDasharray="10 9" opacity={0.75}>
        {(['A', 'B'] as const).map((w) => <path key={w} d={'M' + routeOf(w).slice(1).map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} />)}
        <path d={'M' + ROUTE_R.slice(1).map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} />
      </g>
      <Computer blink={st.compBlink} part="back" />
      {st.toks.map((tk, i) => <Token key={i} {...tk} />)}
      <Computer blink={st.compBlink} part="front" />
      {/* room labels */}
      <Tag x={ROOM_A.x + 120} y={ROOM_A.y + 40} text="Sender A" size={30} k={st.roomTags} fill={K.senderA} color="#FFFFFF" />
      <Tag x={ROOM_B.x + 120} y={ROOM_B.y + 40} text="Sender B" size={30} k={st.roomTags} fill={K.senderB} color="#FFFFFF" />
      <Tag x={ROOM_R.x + 120} y={ROOM_R.y + 40} text="Receiver" size={30} k={st.roomTags} fill={K.receiver} color="#FFFFFF" />
      {st.hallTag.map((h, i) => <Tag key={i} x={960} y={112} text={h.text} size={30} k={h.k} />)}
      <FlipGrid x={960} y={176} k={st.grid.k} n={st.grid.n} />
      <Balance x={960} y={170} k={st.bal.k} tilt={st.bal.tilt} />
      {st.tally.k > 0 && <rect x={-200} y={-200} width={2400} height={1400} fill={K.paper} opacity={0.6 * clamp(st.tally.k)} />}
      <TallyCard k={st.tally.k} n={st.tally.n} sub={st.tally.sub} />
    </g>
  );
};
