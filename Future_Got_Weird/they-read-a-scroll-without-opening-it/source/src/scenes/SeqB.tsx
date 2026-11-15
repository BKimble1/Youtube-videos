// B: the damage. Present day (the same roll, centred) with a quick eruption cue behind it, then a deliberate cut
// to a sepia reconstruction of the opening attempts: an end view at a FIXED camera and scale, the outer layers
// coming away over three attempts while the width guide drops from 4.9 cm to 2.0 cm.
import React from 'react';
import {Chip, FONT_BODY, K} from '../art/kit';
import {Cradle, EndView, Roll1667} from '../art/Roll';
import {mix} from '../lib/color';
import {FPS} from '../lib/core';
import {clamp, easeIn, easeInOut, easeOut, hash, lerp, noise1} from '../lib/math';
import {TM} from '../lib/time';
import {ROLL_B} from './SeqA';

const PXCM = 47; // px per cm in the end view (4.9 cm -> 230 px)
const R0 = 4.9 * PXCM;
const R3 = 2.0 * PXCM;
const BENCH = 650;
const EC = {x: 960, y: 430}; // x only; the roll rests on the bench (y = BENCH - r)

/** the three attempts: [start, end] seconds and the radius left afterwards */
const attempts = () => [
  {a: TM.centuries + 0.5, b: TM.openIt + 0.2, r: 3.9 * PXCM},
  {a: TM.byTheTime - 0.05, b: TM.halfWide - 0.05, r: 2.9 * PXCM},
  {a: TM.halfWide, b: TM.hadBeen - 0.1, r: R3},
];

const radiusAt = (t: number) => {
  let r = R0;
  for (const at of attempts()) {
    const k = easeInOut(clamp((t - at.a) / (at.b - at.a)));
    r = lerp(r, at.r, k);
    if (t < at.b) break;
  }
  return r;
};

/** flakes: outer pieces that break away in each attempt and fall to the bench */
const Flakes: React.FC<{t: number; letters: number}> = ({t, letters}) => {
  const out: React.ReactNode[] = [];
  const at = attempts();
  let rPrev = R0;
  at.forEach((A, ai) => {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const id = ai * 10 + i;
      const ang = (-0.95 + (i / n) * 0.9 + hash(id, 1) * 0.15) * Math.PI; // the upper half, where the tool works
      const rr = (rPrev + A.r) / 2;
      const tStart = lerp(A.a, A.b, 0.15 + (i / n) * 0.7);
      const k = clamp((t - tStart) / 0.9);
      const cy = BENCH - radiusAt(tStart);
      const sx = EC.x + Math.cos(ang) * rr;
      const sy = cy + Math.sin(ang) * rr * 0.95;
      // landing spot on the bench (left and right of the roll)
      const lx = EC.x + (i % 2 ? 1 : -1) * (360 + hash(id, 2) * 380);
      const ly = BENCH + 30 + hash(id, 3) * 70;
      const before = t < tStart;
      const x = before ? sx : lerp(sx, lx, easeOut(k)) + Math.sin(k * 6 + id) * 12 * (1 - k);
      const y = before ? sy : lerp(sy, ly, easeIn(k));
      const rot = before ? (ang * 180) / Math.PI + 90 : (ang * 180) / Math.PI + 90 + k * (hash(id, 4) - 0.5) * 360;
      const w = 26 + hash(id, 5) * 34;
      const h = 9 + (rPrev - A.r) * 0.35;
      if (before && rr > radiusAt(t) + 2 && t > A.a) continue;
      if (before) continue; // still part of the roll: drawn by the end view
      out.push(
        <g key={id} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d={`M${-w / 2} 0 Q0 ${-h * 0.6} ${w / 2} 0 L${w / 2 - 3} ${h} Q0 ${h * 0.5} ${-w / 2 + 2} ${h}Z`} fill="#3C2F25" stroke={K.sepiaInk} strokeWidth={2.5} />
          {letters > 0 && k >= 1 && hash(id, 6) > 0.45 && (
            <text x={-6} y={h * 0.75} fontFamily='"Noto Serif", serif' fontSize={11} fill="#C9B48F" opacity={letters}>
              {'ΑΕΝΟΣΤΚΜ'[Math.floor(hash(id, 7) * 8)]}
            </text>
          )}
        </g>,
      );
    }
    rPrev = A.r;
  });
  return <>{out}</>;
};

const Volcano: React.FC<{k: number; t: number}> = ({k, t}) => {
  if (k <= 0) return null;
  const rise = (1 - easeOut(k)) * 420;
  const plume = Array.from({length: 9}, (_, i) => {
    const g = clamp(k * 1.4 - i * 0.08);
    return {x: 1500 + noise1(i * 0.7, 4) * 110 + i * 22, y: 250 - i * 40 - g * 30, r: (60 + i * 22) * g};
  });
  return (
    <g transform={`translate(0 ${rise})`} opacity={clamp(k * 2)}>
      {plume.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={mix('#6B5A57', '#A08C86', i / 9)} opacity={0.85} />
      ))}
      <path d="M820 760 L1360 300 Q1460 250 1560 280 L1640 300 L2060 760Z" fill="#8E7268" opacity={0.85} />
      <path d="M1360 300 Q1460 250 1560 280 L1640 300 L1590 350 Q1480 320 1400 350Z" fill="#E8643A" opacity={0.75} />
      {Array.from({length: 40}, (_, i) => {
        const x = (hash(i, 50) * 2100 + t * 30 * (0.5 + hash(i, 51))) % 2000 - 40;
        const y = ((hash(i, 52) * 1080 + t * 160 * (0.6 + hash(i, 53))) % 1080) - rise;
        return <circle key={`a${i}`} cx={x} cy={y} r={2 + hash(i, 54) * 3} fill="#6E625C" opacity={0.6} />;
      })}
    </g>
  );
};

export const SeqB: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  if (t < TM.centuries - 0.02) {
    // present day: the same roll, centred on its cradle; the eruption appears behind it and recedes
    const vk = clamp((t - TM.vesuvius + 0.15) / 0.9) * (1 - clamp((t - TM.vesuviusEnd - 0.15) / 0.6));
    const push = easeInOut(clamp((t - TM.book) / 6));
    const roll = {x: ROLL_B.x, y: ROLL_B.y, s: ROLL_B.s * (1 + 0.05 * push)};
    const wall = mix(K.paper, '#E9B48A', vk * 0.7);
    return (
      <g>
        <rect width={1920} height={1080} fill={wall} />
        <ellipse cx={roll.x} cy={roll.y - 60} rx={560} ry={380} fill="#FBF6EC" opacity={0.7 * (1 - vk)} />
        <Volcano k={vk} t={t} />
        <rect x={-20} y={roll.y + 112 * roll.s} width={1960} height={1080} fill={mix(K.paperDeep, '#D9A27C', vk * 0.5)} />
        <rect x={-20} y={roll.y + 112 * roll.s} width={1960} height={6} fill="#D8CCB8" />
        <Cradle x={roll.x} y={roll.y + 64 * roll.s} s={roll.s} w={330} />
        <Roll1667 x={roll.x} y={roll.y} s={roll.s} crumbs={1.3} />
        <Chip x={roll.x} y={roll.y + 150 * roll.s + 10} text="PHerc. 1667" size={30} anchor="middle" dot={K.saffron} />
      </g>
    );
  }
  // historical reconstruction (cut): fixed camera, fixed scale
  const r = radiusAt(t);
  const toolOn = attempts().map((A) => clamp((t - A.a + 0.35) / 0.35) * (1 - clamp((t - A.b) / 0.35)));
  const tool = Math.max(...toolOn);
  const ai = toolOn.indexOf(tool);
  const A = attempts()[ai];
  const tk = clamp((t - A.a) / (A.b - A.a));
  const cyR = BENCH - r;
  const ang = (-0.85 + tk * 0.5) * Math.PI;
  const tx = EC.x + Math.cos(ang) * (r + 4);
  const ty = cyR + Math.sin(ang) * (r + 4);
  const hx = EC.x + Math.cos(ang - 0.25) * (r + 230);
  const hy = cyR + Math.sin(ang - 0.25) * (r + 230);
  const glow = easeInOut(clamp((t - TM.writing - 0.2) / 1.0)) * 0.9;
  const letters = clamp((t - TM.writing) / 0.6);
  // only the sourced widths are labelled: 4.9 cm before the first attempt, 2.0 cm after the last one
  const at = attempts();
  const lblA = 1 - clamp((t - at[0].a) / 0.3);
  const lblB = clamp((t - at[2].b) / 0.3);
  const cm = lblB > 0 ? '2.0' : '4.9';
  const lbl = Math.max(lblA, lblB);
  const GY = BENCH + 46;
  const dk = clamp((t - TM.centuries) / (TM.inside + 0.8 - TM.centuries));
  const drift = 1 + 0.07 * (dk < 0.15 ? (dk * dk) / 0.3 : dk - 0.075) / 0.925; // eases in, then a steady push to the cut
  return (
    <g>
      <rect width={1920} height={1080} fill={K.sepia} />
      <g transform={`translate(${EC.x * (1 - drift)} ${BENCH * (1 - drift)}) scale(${drift})`}>
      <ellipse cx={960} cy={430} rx={760} ry={420} fill="#F3E7CC" opacity={0.7} />
      {/* bench */}
      <rect x={0} y={BENCH} width={1920} height={1080 - BENCH} fill={K.sepiaDeep} />
      <rect x={0} y={BENCH} width={1920} height={6} fill="#B69A6A" />
      <ellipse cx={EC.x} cy={BENCH + 4} rx={r * 0.9} ry={10} fill="rgba(60,40,20,0.25)" />
      <EndView x={EC.x} y={cyR} rFull={R0} rCur={r} rCore={8} glow={glow} />
      <Flakes t={t} letters={letters} />
      {/* the tool (a thin spatula) working at the outer layer */}
      {tool > 0.01 && (
        <g opacity={tool}>
          <line x1={tx} y1={ty} x2={lerp(tx, hx, 0.62)} y2={lerp(ty, hy, 0.62)} stroke="#E8E1D2" strokeWidth={9} strokeLinecap="round" />
          <line x1={tx} y1={ty} x2={lerp(tx, hx, 0.62)} y2={lerp(ty, hy, 0.62)} stroke={K.sepiaInk} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          <line x1={lerp(tx, hx, 0.6)} y1={lerp(ty, hy, 0.6)} x2={hx} y2={hy} stroke="#8B5A2B" strokeWidth={20} strokeLinecap="round" />
        </g>
      )}
      {/* width guide */}
      <g>
        <line x1={EC.x - r} y1={cyR} x2={EC.x - r} y2={GY + 8} stroke={K.sepiaInk} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
        <line x1={EC.x + r} y1={cyR} x2={EC.x + r} y2={GY + 8} stroke={K.sepiaInk} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
        <line x1={EC.x - R0} y1={GY - 8} x2={EC.x - R0} y2={GY + 8} stroke={K.sepiaInk} strokeWidth={3} opacity={0.4} />
        <line x1={EC.x + R0} y1={GY - 8} x2={EC.x + R0} y2={GY + 8} stroke={K.sepiaInk} strokeWidth={3} opacity={0.4} />
        <line x1={EC.x - r} y1={GY} x2={EC.x + r} y2={GY} stroke={K.sepiaInk} strokeWidth={4} />
        <path d={`M${EC.x - r} ${GY} l16 -9 v18Z M${EC.x + r} ${GY} l-16 -9 v18Z`} fill={K.sepiaInk} />
        <g opacity={lbl}>
        <rect x={EC.x - 74} y={GY + 18} width={148} height={46} rx={23} fill="#F6EDD8" stroke={K.sepiaInk} strokeWidth={2} />
        <text x={EC.x} y={GY + 51} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={800} fontSize={30} fill={K.sepiaInk}>
          {cm} cm
        </text>
        </g>
      </g>
      </g>
      <Chip x={1890} y={44} text="Reconstruction" size={22} anchor="end" bg="rgba(255,250,238,0.9)" color={K.sepiaInk} />
    </g>
  );
};
