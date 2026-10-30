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
import {sample, at, partial} from './geom';
import {Forceps, NeedleHolder} from './tools';
import {lit, shade} from '../core/color';

const A = FIG.armEar, S = FIG.earSite;
const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
export const HEAD_EAR = {x: S.x, y: S.y, rot: 14, sx: 0.8};

type F = {x: number; y: number; rot: number; sx: number; s: number; lift: number; margin: number; on: boolean};
export const flapAt = (t: number): F => {
  const arm = {x: A.x, y: A.y, rot: 0, sx: 1};
  if (t < B.raise[0]) return {...arm, s: 1, lift: 0, margin: 1, on: false};
  if (t < B.raise[1]) {
    const u = ss5(t, B.raise[0], B.raise[1]);
    return {...arm, y: A.y - 8 * u, s: 1 + 0.12 * u, lift: u, margin: 1, on: true};
  }
  if (t < B.carry[1]) {
    const u = ss5(t, B.carry[0], B.carry[1]);
    return {
      x: lerp(A.x, HEAD_EAR.x, u), y: lerp(A.y - 8, HEAD_EAR.y, u) - 46 * Math.sin(Math.PI * u), rot: lerp(0, HEAD_EAR.rot, u), sx: lerp(1, HEAD_EAR.sx, u),
      s: 1.12, lift: 1, margin: 1 - 0.5 * ss(u, 0.5, 1), on: true,
    };
  }
  if (t < B.seat[1]) {
    const u = ss5(t, B.seat[0], B.seat[1]);
    return {...HEAD_EAR, s: lerp(1.12, 1, u), lift: 1 - u, margin: 0.5 * (1 - u), on: true};
  }
  return {...HEAD_EAR, s: 1, lift: 0, margin: 0, on: true};
};
/** perfusion: the ear warms once blood flows through the new connection */
const flowAmt = (t: number) => ss(t, B.flow[0] + 0.2, B.flow[1]);

const EarSkin: React.FC<{px: number; id: string; warm: number}> = ({px, id, warm}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-g`} cx="0.3" cy="0.3" r="0.85">
        <stop offset="0" stopColor={SK.lighter} />
        <stop offset="0.55" stopColor={SK.base} />
        <stop offset="1" stopColor={SK.shade} />
      </radialGradient>
      <clipPath id={`${id}-c`}>
        <path d={EAR_OUTLINE} />
      </clipPath>
    </defs>
    <path d={EAR_OUTLINE} fill={`url(#${id}-g)`} />
    <g clipPath={`url(#${id}-c)`}>
      <Relief id={`${id}-r`} x={-60} y={-70} w={120} h={130} px={px} depth={2.1} blur={1.35} gain={1.15}>
        <EarHeight p={{lobule: 1}} />
      </Relief>
      {/* the deep bowl and the canal side of it read darker on a real ear */}
      <ellipse cx={-3} cy={10} rx={7} ry={8} fill={SK.deep} opacity="0.4" filter="url(#soft2)" />
      <ellipse cx={4} cy={-5} rx={30} ry={40} fill="#D47A6A" opacity={0.18 * warm} filter="url(#soft6)" />
    </g>
    <path d={EAR_OUTLINE} fill="none" {...ln(1.4)} />
  </g>
);

/** The ear on the move (and, once seated, the finished ear). Drawn above the head. */
export const Flap: React.FC<{t: number; camZ: number}> = ({t, camZ}) => {
  const f = flapAt(t);
  if (!f.on) return null;
  const tr = `translate(${f.x} ${f.y}) rotate(${f.rot}) scale(${f.s * f.sx} ${f.s})`;
  const px = camZ * f.s;
  const warm = 0.35 + 0.65 * flowAmt(t);
  // the vessels it was raised on: stretched to the forearm while lifting, divided, then short stubs while carried
  const raising = t < B.raise[1];
  const pedU = ss(t, B.raise[0], B.raise[1]);
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
      {raising && (
        <g opacity={pedU}>
          <path d={`M ${A.x - 18} ${A.y + 40} C ${A.x - 26} ${A.y + 70} ${A.x - 36} ${A.y + 100} ${A.x - 40} ${A.y + 130}`} fill="none" stroke={ANAT.artery} strokeWidth="3" />
          <path d={`M ${A.x - 13} ${A.y + 42} C ${A.x - 21} ${A.y + 72} ${A.x - 31} ${A.y + 102} ${A.x - 35} ${A.y + 132}`} fill="none" stroke={ANAT.vein} strokeWidth="3" />
        </g>
      )}
      <g transform={tr}>
        {!raising && t < B.seat[1] && (
          <g>
            <path d="M -16 36 C -20 44 -22 52 -20 60" fill="none" stroke={ANAT.artery} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M -11 38 C -14 46 -15 54 -13 62" fill="none" stroke={ANAT.vein} strokeWidth="2.6" strokeLinecap="round" />
          </g>
        )}
        {f.margin > 0.01 && (
          <g opacity={f.margin}>
            <path d={FLAP_D} fill={SK.volar} />
            <path d={FLAP_D} fill="none" stroke={ANAT.tissue} strokeWidth="2.4" />
            <path d={FLAP_D} fill="none" {...ln(1.3)} />
          </g>
        )}
        <EarSkin px={px} id="flapE" warm={warm} />
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
  if (t < B.raise[0] || t > B.seat[1] + 0.2) return null;
  const f = flapAt(t);
  const a = ((f.rot * Math.PI) / 180), k = f.s;
  const lx = 24 * f.sx * k, ly = -46 * k;
  const x = f.x + lx * Math.cos(a) - ly * Math.sin(a), y = f.y + lx * Math.sin(a) + ly * Math.cos(a);
  const o = ss(t, B.raise[0], B.raise[0] + 0.15) * (1 - ss(t, B.seat[1] - 0.1, B.seat[1] + 0.2));
  return <Forceps x={x} y={y} a={-125} s={0.85} ow={1.3} o={o} open={0.2 * (1 - ss(t, B.raise[0], B.raise[0] + 0.15)) + 0.5 * ss(t, B.seat[1] - 0.1, B.seat[1] + 0.1)} />;
};

// ---- the microsurgery cutaway, in front of and below the new ear ----
export const AW = {x: S.x - 20, y: S.y + 60, r: 30};
export const anaWin = (t: number) => ss(t, B.closeUp[0], B.closeUp[0] + 0.3) * (1 - ss(t, B.closeUp[1] - 0.05, B.closeUp[1] + 0.3));

type Line = {flap: string; rec: string; y: number; c: string; w: number; beat: readonly [number, number]; stitches: number};
const LINES: Line[] = [
  {flap: 'M 2 -9 C 14 -9 24 -12 30 -24 C 34 -32 36 -40 40 -50', rec: 'M -2 -9 C -14 -9 -26 -6 -34 2 C -40 8 -44 14 -48 22', y: -9, c: ANAT.artery, w: 4.2, beat: B.artery, stitches: 6},
  {flap: 'M 2 3 C 16 3 28 -2 34 -14 C 38 -22 42 -32 46 -42', rec: 'M -2 3 C -16 3 -26 8 -32 16 C -36 22 -40 30 -44 38', y: 3, c: ANAT.vein, w: 4.8, beat: B.vein, stitches: 6},
  {flap: 'M 2 15 C 16 15 28 12 36 2 C 42 -6 46 -14 50 -22', rec: 'M -2 15 C -14 15 -24 20 -30 28 C -34 34 -36 42 -38 50', y: 15, c: ANAT.nerve, w: 2.6, beat: B.nerve, stitches: 2},
];
const LS = LINES.map((l) => ({f: sample(l.flap), r: sample(l.rec)}));

export const Anastomosis: React.FC<{t: number}> = ({t}) => {
  const win = anaWin(t);
  if (win <= 0.01) return null;
  const flow = clamp((t - B.flow[0]) / (B.flow[1] - B.flow[0]));
  let tool: {x: number; y: number} | null = null;
  const els = LINES.map((l, i) => {
    const [b0, b1] = l.beat;
    const gap = 7 * (1 - ss(t, b0, b0 + 0.22));
    const stU = clamp((t - (b0 + 0.22)) / (b1 - b0 - 0.25));
    const nSt = Math.floor(stU * l.stitches + 0.001);
    if (stU > 0 && stU < 1) {
      const k = Math.min(l.stitches - 1, nSt), ph = stU * l.stitches - k;
      const ang = (k / l.stitches) * Math.PI * 2;
      tool = {x: 0.5 * Math.sin(ph * Math.PI) + 0.6, y: l.y + (l.w / 2 + 1) * Math.cos(ang) - 2 * Math.sin(ph * Math.PI)};
    }
    const deep = shade(l.c, 0.45);
    const fFill = i === 0 ? flow : i === 1 ? clamp(flow * 1.2 - 0.1) : 0;
    return (
      <g key={i}>
        <g transform={`translate(${gap} 0)`}>
          <path d={l.flap} fill="none" stroke={deep} strokeWidth={l.w + 1} strokeLinecap="round" />
          <path d={l.flap} fill="none" stroke={i < 2 ? lerpColor(l.c, '#7A5A5A', 0.45 * (1 - fFill)) : l.c} strokeWidth={l.w} strokeLinecap="round" />
          {fFill > 0 && i < 2 && <path d={partial(LS[i].f, fFill)} fill="none" stroke={lit(l.c, 0.45)} strokeWidth={l.w * 0.3} strokeLinecap="round" />}
        </g>
        <g transform={`translate(${-gap} 0)`}>
          <path d={l.rec} fill="none" stroke={deep} strokeWidth={l.w + 1} strokeLinecap="round" />
          <path d={l.rec} fill="none" stroke={l.c} strokeWidth={l.w} strokeLinecap="round" />
          <path d={l.rec} fill="none" stroke={lit(l.c, 0.45)} strokeWidth={l.w * 0.3} strokeLinecap="round" opacity={i < 2 ? 1 : 0.6} />
        </g>
        {Array.from({length: Math.min(l.stitches, nSt)}, (_, k) => {
          const ang = (k / l.stitches) * Math.PI * 2;
          const yy = l.y + (l.w / 2) * Math.cos(ang) * 0.95;
          const front = Math.sin(ang) >= -0.2;
          return front ? <path key={k} d={`M -1.4 ${yy - 0.5} L 1.4 ${yy + 0.5}`} stroke="#141820" strokeWidth={0.55} strokeLinecap="round" /> : null;
        })}
      </g>
    );
  });
  return (
    <g>
      <defs>
        <radialGradient id="awG">
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.62" stopColor="#FFF" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="awM">
          <ellipse cx={AW.x} cy={AW.y + 2} rx={AW.r * 1.25 * (0.4 + 0.6 * win)} ry={AW.r * 1.05 * (0.4 + 0.6 * win)} fill="url(#awG)" opacity={win} />
        </mask>
      </defs>
      <g mask="url(#awM)">
        <circle cx={AW.x} cy={AW.y} r={AW.r + 4} fill={ANAT.tissue} />
        <circle cx={AW.x} cy={AW.y} r={AW.r + 4} fill={ANAT.fat} opacity="0.3" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M ${AW.x - 34 + i * 8} ${AW.y - 34} C ${AW.x - 30 + i * 8} ${AW.y - 10} ${AW.x - 38 + i * 8} ${AW.y + 10} ${AW.x - 34 + i * 8} ${AW.y + 34}`} stroke={ANAT.tissueDeep} strokeWidth="0.5" opacity="0.3" fill="none" />
        ))}
        <g transform={`translate(${AW.x} ${AW.y})`}>{els}</g>
        {tool && (() => {
          const tl = tool as {x: number; y: number};
          return <NeedleHolder x={AW.x + tl.x} y={AW.y + tl.y} a={-40} s={0.22} ow={1.1} />;
        })()}
      </g>
    </g>
  );
};
const lerpColor = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A2 = p(a), B2 = p(b);
  return '#' + A2.map((v, i) => Math.round(v + (B2[i] - v) * u).toString(16).padStart(2, '0')).join('');
};
