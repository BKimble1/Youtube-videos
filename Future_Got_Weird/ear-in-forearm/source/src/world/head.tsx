// The transfer: the living ear (framework + its skin + its vessels) lifted from the forearm, carried up to the ear
// site, seated, and reconnected. Then the finished ear on her head. The same ear drawing throughout: on the head it
// is seen in three-quarter view (narrowed), tilted back like a natural ear.
import React from 'react';
import {ANAT, SK, INK} from './pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {B, TM} from './story';
import {FIG} from './woman';
import {EarHeight, Relief, EAR_OUTLINE} from './ear';
import {FLAP_D} from './arm';
import {sample, at, partial, P} from './geom';
import {Forceps, NeedleHolder, slideIn} from './tools';
import {lit, shade} from '../core/color';

const A = FIG.armEar, S = FIG.earSite;
const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
export const HEAD_EAR = {x: S.x, y: S.y, rot: 14, sx: 0.88};

type F = {x: number; y: number; rot: number; sx: number; s: number; lift: number; margin: number; on: boolean};
export const flapAt = (t: number): F => {
  const arm = {x: A.x, y: A.y, rot: 0, sx: 1};
  if (t < B.raise[0]) return {...arm, s: 1, lift: 0, margin: 1, on: false};
  if (t < B.raise[1]) {
    const u = ss5(t, B.raise[0], B.raise[1]);
    return {...arm, y: A.y - 8 * u, s: 1 + 0.05 * u, lift: u, margin: 1, on: true};
  }
  if (t < B.carry[1]) {
    const u = ss5(t, B.carry[0], B.carry[1]);
    return {
      x: lerp(A.x, HEAD_EAR.x, u), y: lerp(A.y - 8, HEAD_EAR.y, u) - 46 * Math.sin(Math.PI * u), rot: lerp(0, HEAD_EAR.rot, u), sx: lerp(1, HEAD_EAR.sx, u),
      s: 1.05, lift: 1, margin: 1 - 0.5 * ss(u, 0.5, 1), on: true,
    };
  }
  if (t < B.seat[1]) {
    const u = ss5(t, B.seat[0], B.seat[1]);
    return {...HEAD_EAR, s: lerp(1.05, 1, u), lift: 1 - u, margin: 0.5 * (1 - u), on: true};
  }
  return {...HEAD_EAR, s: 1, lift: 0, margin: 0, on: true};
};
/** perfusion: the ear warms once blood flows through the new connection */
const flowAmt = (t: number) => ss(t, B.flow[0] + 0.2, B.flow[1]);

/** The ear with its skin. `def` (0..1) is how defined it is: at 0 it looks exactly like the relief it was under the
 *  forearm skin (soft edges, faint lobule, no contour); as it is lifted free it gains its edge, the lobule and the
 *  darker bowl. Its skin is the forearm's (a little lighter than her face), so it keeps that tone on the head. */
const EarSkin: React.FC<{px: number; id: string; warm: number; def: number}> = ({px, id, warm, def}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-g`} cx="0.3" cy="0.3" r="0.85">
        <stop offset="0" stopColor={SK.lighter} />
        <stop offset="0.55" stopColor={SK.volar} />
        <stop offset="1" stopColor={SK.shade} />
      </radialGradient>
      <clipPath id={`${id}-c`}>
        <path d={EAR_OUTLINE} />
      </clipPath>
    </defs>
    <path d={EAR_OUTLINE} fill={`url(#${id}-g)`} />
    <g clipPath={`url(#${id}-c)`}>
      <Relief id={`${id}-r`} x={-60} y={-70} w={120} h={130} px={px} depth={2.1 + 0.2 * (1 - def)} blur={1.35 + 0.55 * (1 - def)} gain={1.15}>
        <EarHeight p={{lobule: 0.3 + 0.7 * def}} />
      </Relief>
      <ellipse cx={-3} cy={10} rx={7} ry={8} fill={SK.deep} opacity={0.4 * def} filter="url(#soft2)" />
      <ellipse cx={4} cy={-5} rx={30} ry={40} fill="#D47A6A" opacity={0.18 * warm} filter="url(#soft6)" />
    </g>
    <path d={EAR_OUTLINE} fill="none" {...ln(1.4)} opacity={def} />
  </g>
);

/** The ear on the move (and, once seated, the finished ear). Drawn above the head. */
export const Flap: React.FC<{t: number; camZ: number}> = ({t, camZ}) => {
  const f = flapAt(t);
  if (!f.on) return null;
  const tr = `translate(${f.x} ${f.y}) rotate(${f.rot}) scale(${f.s * f.sx} ${f.s})`;
  const px = camZ * f.s;
  const warm = 0.35 + 0.65 * flowAmt(t);
  // V3: the vessels it was raised on stay under the flap (they are shown again only where they are reconnected, in the
  // cutaway in front of the ear); nothing hangs from it in the air
  const def = ss(t, B.raise[0], B.carry[0] + 0.3);
  const sut = t >= B.seat[1] ? 1 - ss(t, TM.and2 - 0.3, TM.and2 + 0.3) : 0;
  return (
    <g>
      {f.lift > 0.01 && (
        <g transform={`translate(${f.x + 12 * f.lift} ${f.y + 18 * f.lift}) rotate(${f.rot}) scale(${f.s * f.sx} ${f.s})`} opacity={0.35 * f.lift}>
          <path d={FLAP_D} fill="#0B0F12" filter="url(#soft5)" />
        </g>
      )}
      {f.lift < 0.99 && t >= B.seat[0] && (
        <g transform={`translate(${f.x + 4} ${f.y + 3}) rotate(${f.rot}) scale(${f.sx} 1)`} opacity={0.35 * (1 - f.lift)}>
          <path d={EAR_OUTLINE} fill="#2A140C" filter="url(#soft3)" />
        </g>
      )}
      <g transform={tr}>
        {f.margin > 0.01 && (
          <g opacity={f.margin}>
            <path d={FLAP_D} fill={SK.volar} />
            <path d={FLAP_D} fill="none" stroke={ANAT.tissue} strokeWidth="2.4" />
            <path d={FLAP_D} fill="none" {...ln(1.3)} />
          </g>
        )}
        <EarSkin px={px} id="flapE" warm={warm} def={def} />
        {sut > 0.01 && (
          <g opacity={sut}>
            {Array.from({length: 9}, (_, i) => {
              const q = at(FRONT, i / 8).p;
              return <path key={i} d={`M ${q.x - 1.4} ${q.y - 0.6} L ${q.x + 1.4} ${q.y + 0.6}`} stroke="#3A2A2A" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />;
            })}
          </g>
        )}
      </g>
    </g>
  );
};
// the ear's attached front edge (helix root down to the lobule), where the fine closure runs
const FRONT = sample('M -15 -27 C -15 -18 -16 -10 -15 -2 C -16 8 -14 18 -10 28 C -8 34 -6 40 -2 43', 8);

export const FlapTools: React.FC<{t: number}> = ({t}) => {
  // forceps come in from above-right along their axis, hold the flap from lifting to seating, then leave the same way
  const t0 = B.raise[0] - 0.25, t1 = B.seat[1] + 0.3;
  if (t < t0 || t > t1) return null;
  const f = t < B.raise[0] ? flapAt(B.raise[0]) : flapAt(t);
  const a = (f.rot * Math.PI) / 180, k = f.s;
  const lx = 24 * f.sx * k, ly = -46 * k;
  const tip = {x: f.x + lx * Math.cos(a) - ly * Math.sin(a), y: f.y + lx * Math.sin(a) + ly * Math.cos(a)};
  const kin = ss(t, t0, B.raise[0]) * (1 - ss(t, B.seat[1], t1));
  const p = slideIn(tip, 135, kin, 300);
  const open = 0.6 * (1 - ss(t, B.raise[0] - 0.06, B.raise[0])) + 0.6 * ss(t, B.seat[1] - 0.08, B.seat[1]);
  return <Forceps x={p.x} y={p.y} a={135} s={0.85} ow={1.3} open={open} />;
};

// ---- the microsurgery cutaway, just in front of the new ear (where the scalp's own vessels run) ----
export const AW = {x: S.x - 30, y: S.y + 18, r: 30};
export const anaWin = (t: number) => ss(t, B.closeUp[0], B.closeUp[0] + 0.3) * (1 - ss(t, B.closeUp[1] - 0.05, B.closeUp[1] + 0.3));

// The flap's vessels and nerve leave from under the ear (up-right); the recipient vessels and nerve come up from below
// (down-left). Each pair meets end to end on one straight seam, side by side, and both ends run on out under the
// cutaway's soft edge, so nothing ends in mid-air.
const DV = {x: 0.6, y: -0.8}, NV = {x: 0.8, y: 0.6};
type Line = {J: P; c: string; w: number; beat: readonly [number, number]; stitches: number; flap: string; rec: string};
const mk = (i: number, c: string, w: number, beat: readonly [number, number], stitches: number): Line => {
  const J = {x: NV.x * (i - 1) * 13, y: NV.y * (i - 1) * 13};
  const q = (k: number, n = 0, dx = 0) => `${(J.x + DV.x * k + NV.x * n + dx).toFixed(1)} ${(J.y + DV.y * k + NV.y * n).toFixed(1)}`;
  return {
    J, c, w, beat, stitches,
    rec: `M ${q(-46, 5)} C ${q(-30, 3)} ${q(-12)} ${q(0)}`,
    flap: `M ${q(0)} C ${q(12)} ${q(28, -2)} ${q(46, -3, 8)}`,
  };
};
const LINES: Line[] = [mk(0, ANAT.artery, 4.2, B.artery, 6), mk(1, ANAT.vein, 4.8, B.vein, 6), mk(2, ANAT.nerve, 2.6, B.nerve, 2)];
const LS = LINES.map((l) => ({f: sample(l.flap), r: sample(l.rec)}));

export const Anastomosis: React.FC<{t: number}> = ({t}) => {
  const win = anaWin(t);
  if (win <= 0.01) return null;
  const flow = clamp((t - B.flow[0]) / (B.flow[1] - B.flow[0]));
  let tool: P = {x: LINES[0].J.x, y: LINES[0].J.y};
  const els = LINES.map((l, i) => {
    const [b0, b1] = l.beat;
    const gap = 6 * (1 - ss(t, b0, b0 + 0.2));
    const stU = clamp((t - (b0 + 0.2)) / (b1 - b0 - 0.22));
    const nSt = Math.floor(stU * l.stitches + 0.001);
    if (t >= b0) {
      const k = Math.min(l.stitches - 1, nSt), ph = stU * l.stitches - k;
      const ang = (k / l.stitches) * Math.PI * 2;
      const off = (l.w / 2 + 0.8) * Math.cos(ang);
      tool = {x: l.J.x + NV.x * off + DV.x * 2 * Math.sin(ph * Math.PI), y: l.J.y + NV.y * off + DV.y * 2 * Math.sin(ph * Math.PI)};
    }
    const deep = shade(l.c, 0.45);
    const fFill = i === 0 ? flow : i === 1 ? clamp(flow * 1.2 - 0.1) : 0;
    const g = {x: DV.x * gap, y: DV.y * gap};
    return (
      <g key={i}>
        <g transform={`translate(${g.x} ${g.y})`}>
          <path d={l.flap} fill="none" stroke={deep} strokeWidth={l.w + 1} strokeLinecap="butt" />
          <path d={l.flap} fill="none" stroke={i < 2 ? lerpColor(l.c, '#7A5A5A', 0.45 * (1 - fFill)) : l.c} strokeWidth={l.w} strokeLinecap="butt" />
          {fFill > 0 && i < 2 && <path d={partial(LS[i].f, fFill)} fill="none" stroke={lit(l.c, 0.45)} strokeWidth={l.w * 0.3} strokeLinecap="round" />}
        </g>
        <g transform={`translate(${-g.x} ${-g.y})`}>
          <path d={l.rec} fill="none" stroke={deep} strokeWidth={l.w + 1} strokeLinecap="butt" />
          <path d={l.rec} fill="none" stroke={l.c} strokeWidth={l.w} strokeLinecap="butt" />
          <path d={l.rec} fill="none" stroke={lit(l.c, 0.45)} strokeWidth={l.w * 0.3} strokeLinecap="round" opacity={i < 2 ? 1 : 0.6} />
        </g>
        {Array.from({length: Math.min(l.stitches, nSt)}, (_, k) => {
          const ang = (k / l.stitches) * Math.PI * 2;
          if (Math.sin(ang) < -0.2) return null; // stitches on the far side of the vessel are hidden
          const off = (l.w / 2) * Math.cos(ang) * 0.95;
          const P0 = {x: l.J.x + NV.x * off, y: l.J.y + NV.y * off};
          return <path key={k} d={`M ${P0.x - DV.x * 1.4} ${P0.y - DV.y * 1.4} L ${P0.x + DV.x * 1.4} ${P0.y + DV.y * 1.4}`} stroke="#141820" strokeWidth={0.55} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  // the needle holder comes in from lower left along its axis, works the seams, and leaves the same way
  const kin = ss(t, B.artery[0] - 0.25, B.artery[0]) * (1 - ss(t, B.nerve[1], B.nerve[1] + 0.25));
  const tp = slideIn({x: AW.x + tool.x, y: AW.y + tool.y}, -40, kin, 120);
  return (
    <g>
      <defs>
        <radialGradient id="awG">
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.76" stopColor="#FFF" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="awM">
          <ellipse cx={AW.x} cy={AW.y + 2} rx={AW.r * 1.3 * (0.4 + 0.6 * win)} ry={AW.r * 1.35 * (0.4 + 0.6 * win)} fill="url(#awG)" opacity={win} />
        </mask>
      </defs>
      <g mask="url(#awM)">
        <rect x={AW.x - 50} y={AW.y - 50} width={100} height={100} fill={ANAT.tissueDeep} />
        <rect x={AW.x - 50} y={AW.y - 50} width={100} height={100} fill={ANAT.tissue} opacity="0.55" />
        {Array.from({length: 11}, (_, i) => (
          <path key={i} d={`M ${AW.x - 44 + i * 8} ${AW.y - 44} C ${AW.x - 40 + i * 8} ${AW.y - 10} ${AW.x - 48 + i * 8} ${AW.y + 10} ${AW.x - 44 + i * 8} ${AW.y + 44}`} stroke={ANAT.tissueDeep} strokeWidth="0.5" opacity="0.3" fill="none" />
        ))}
        <g transform={`translate(${AW.x} ${AW.y})`}>{els}</g>
        {kin > 0.001 && <NeedleHolder x={tp.x} y={tp.y} a={-40} s={0.22} ow={1.1} />}
      </g>
    </g>
  );
};
const lerpColor = (a: string, b: string, u: number) => {
  const p = (hx: string) => [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16));
  const A2 = p(a), B2 = p(b);
  return '#' + A2.map((v, i) => Math.round(v + (B2[i] - v) * u).toString(16).padStart(2, '0')).join('');
};
