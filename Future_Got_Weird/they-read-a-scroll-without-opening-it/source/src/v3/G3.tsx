// G: verification on a SECOND scroll (a clean cut, a different object, a teal identity). Left: the earlier,
// model-aided reading. Right: the sharper scan, where ink deposits are visible directly in the cross-section and are
// projected onto the page. Aligned by a shared landmark, the same strokes sit in the same places.
// V2: no letters are shown for PHerc. Paris 4 (we have no verified transcription of this region); the marks are
// abstract ink strokes, identical in both panels, so the alignment itself carries the proof. No rings or ticks.
import React from 'react';
import {segK} from './kit3';
import {Note, FONT_BODY, FONT_GREEK, K} from '../art/kit';
import {Cradle, RollParis4} from '../art/Roll';
import {FPS} from '../lib/core';
import {clamp, easeInOut, easeOut, hash, lerp, noise1} from '../lib/math';
import {TM} from '../lib/time';

const PW = 700;
const PHh = 440;
const A0 = {x: 190, y: 330};
const B0 = {x: 1030, y: 330};
const GL = (() => {
  const out: {x: number; y: number; d: string; i: number}[] = [];
  let i = 0;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 17; c++) {
      if (hash(r * 40 + c, 77) < 0.14) continue;
      const x = 52 + c * 37 + (hash(i, 78) - 0.5) * 4;
      const y = 90 + r * 50;
      // one or two short brush strokes per mark: abstract, not letterforms
      const k = Math.floor(hash(i, 79) * 4);
      const w = 9 + hash(i, 80) * 6;
      const d =
        k === 0 ? `M${x - w} ${y - 24} Q${x} ${y - 30} ${x + w} ${y - 22}` :
        k === 1 ? `M${x - 3} ${y - 30} Q${x + 2} ${y - 14} ${x - 2} ${y}` :
        k === 2 ? `M${x - w} ${y - 4} Q${x - 2} ${y - 26} ${x + w} ${y - 28}` :
        `M${x - w} ${y - 18} Q${x} ${y - 8} ${x + w} ${y - 20} M${x - 2} ${y - 30} L${x + 1} ${y - 4}`;
      out.push({x, y, d, i});
      i++;
    }
  }
  return out;
})();
const LANDMARK = {x: 560, y: 70};
const CHECKS = [8, 31, 57, 90];

const holeD = (cx: number, cy: number, r: number, seed: number) => {
  let d = '';
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const k = 1 + 0.3 * noise1(i * 0.8, seed);
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r * 1.6 * k).toFixed(1) + ' ' + (cy + Math.sin(a) * r * k).toFixed(1);
  }
  return d + 'Z';
};

const PanelA: React.FC<{x: number; y: number; o: number; rev?: number}> = ({x, y, o, rev = 1}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <defs>
      <filter id="mlblur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={1.6} />
      </filter>
    </defs>
    <rect width={PW} height={PHh} rx={14} fill="#12171D" stroke={K.ink} strokeWidth={4} />
    <g filter="url(#mlblur)">
      {GL.map((g) => (
        <path key={g.i} d={g.d} fill="none" stroke="#EFE4CC" strokeWidth={6} strokeLinecap="round" opacity={(0.75 + 0.25 * hash(g.i, 3)) * clamp((rev * (PW + 260) - g.x - g.y * 0.4) / 90)} />
      ))}
    </g>
    <path d={holeD(LANDMARK.x, LANDMARK.y, 22, 9)} fill="#050607" stroke="#3A4450" strokeWidth={2} />
  </g>
);

const PanelB: React.FC<{x: number; y: number; o: number; flatK: number; ov: number}> = ({x, y, o, flatK, ov}) => {
  const k = easeInOut(flatK);
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect width={PW} height={PHh} rx={14} fill={ov > 0 ? 'rgba(0,0,0,0)' : '#0F1A24'} stroke={K.teal} strokeWidth={4} />
      {/* cross-section: the sheet edge-on with bright deposits on its surface */}
      {k < 1 && (
        <g opacity={1 - k}>
          <path
            d={`M20 ${PHh / 2} ${Array.from({length: 40}, (_, i) => `L${20 + (i * (PW - 40)) / 39} ${PHh / 2 + 10 * noise1(i * 0.4, 3)}`).join(' ')}`}
            fill="none"
            stroke="#9AA5AF"
            strokeWidth={16}
            strokeLinecap="round"
          />
          {GL.filter((g) => Math.abs(g.y - 190) < 26).map((g) => (
            <ellipse key={g.i} cx={g.x} cy={PHh / 2 - 13 + 10 * noise1(((g.x - 20) / (PW - 40)) * 39 * 0.4, 3)} rx={11} ry={5} fill="#F4FBFF" />
          ))}
        </g>
      )}
      {k > 0 && (
        <g opacity={k} transform={`translate(0 ${PHh / 2}) scale(1 ${Math.max(0.01, k)}) translate(0 ${-PHh / 2})`}>
          {ov <= 0 && <rect x={6} y={6} width={PW - 12} height={PHh - 12} rx={10} fill="#8E8A83" />}
          {GL.map((g) => (
            <path key={g.i} d={g.d} fill="none" stroke="#FF4B3A" strokeWidth={3} strokeLinecap="round" />
          ))}
          <path d={holeD(LANDMARK.x, LANDMARK.y, 22, 9)} fill={ov > 0 ? 'none' : '#050607'} stroke={K.teal} strokeWidth={3} strokeDasharray={ov > 0 ? '6 5' : undefined} />
        </g>
      )}
    </g>
  );
};

const Cross: React.FC<{x: number; y: number; o: number; c: string}> = ({x, y, o, c}) => (
  <g opacity={o} stroke={c} strokeWidth={4} strokeLinecap="round">
    <line x1={x - 34} y1={y} x2={x - 14} y2={y} />
    <line x1={x + 14} y1={y} x2={x + 34} y2={y} />
    <line x1={x} y1={y - 34} x2={x} y2={y - 14} />
    <line x1={x} y1={y + 14} x2={x} y2={y + 34} />
  </g>
);

export const G3: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const t0 = TM.checked - 0.15;
  const corner = easeInOut(clamp((t - TM.second + 0.25) / 0.9));
  const roll = {x: lerp(960, 330, corner), y: lerp(450, 168, corner), s: lerp(1.15, 0.5, corner)};
  const aOn = easeOut(clamp((t - TM.second - 0.35) / 0.7));
  const bOn = easeOut(clamp((t - TM.sharper + 0.1) / 0.6));
  const flatK = clamp((t - TM.sharper - 1.6) / 0.9);
  const line = easeInOut(clamp((t - TM.lined + 0.05) / 1.0));
  const bx = lerp(B0.x, A0.x, line);
  const by = lerp(B0.y, A0.y, line);
  const marks = clamp((t - TM.lined - 0.2) / 0.3) * (1 - clamp((t - TM.same) / 0.5));
  const rev = clamp((t - TM.second - 0.2) / (TM.reveal - TM.second - 0.1));
  const sweepX = lerp(-60, PW + 60, clamp((t - TM.same + 0.05) / 1.5));
  const checksOn = clamp((t - TM.same + 0.1) / 0.2) * (1 - clamp((t - TM.places - 0.4) / 0.6));
  const zoomK = segK(t, TM.lined + 0.9, TM.places + 0.2);
  const zs = 1 + 0.32 * zoomK;
  const PC = {x: A0.x + PW / 2, y: A0.y + PHh / 2};
  const PT = {x: lerp(PC.x, 960, zoomK), y: lerp(PC.y, 500, zoomK)};
  const intro = clamp((t - t0) / 0.01);
  const drift = 1 + 0.05 * clamp((t - t0) / (TM.back - 0.1 - t0));
  return (
    <g opacity={intro}>
      <rect width={1920} height={1080} fill="#EEF3F2" />
      <g transform={`translate(${PT.x} ${PT.y}) scale(${zs}) translate(${-PC.x} ${-PC.y})`}>
      <g transform={`translate(${960 * (1 - drift)} ${520 * (1 - drift)}) scale(${drift})`}>
      <rect x={0} y={roll.y + 100 * roll.s} width={1920} height={1080} fill="#DCE6E4" opacity={1 - corner} />
      <Cradle x={roll.x} y={roll.y + 96 * roll.s} s={roll.s} w={520} />
      <RollParis4 x={roll.x} y={roll.y} s={roll.s} />
      <Note x={lerp(roll.x, roll.x + 150, corner)} y={lerp(roll.y + 200 * roll.s, roll.y + 10, corner)} text="PHerc. Paris 4" size={lerp(28, 24, corner)} anchor={corner > 0.5 ? 'start' : 'middle'} />
      {aOn > 0 && <PanelA x={A0.x} y={A0.y + (1 - aOn) * 40} o={aOn} rev={rev} />}
      {bOn > 0 && <PanelB x={bx} y={by + (1 - bOn) * 40} o={bOn * (line > 0 ? lerp(1, 0.85, line) : 1)} flatK={flatK} ov={line} />}
      {/* the strokes land on the strokes: a brief brightening when they register */}
      {checksOn > 0 && (
        <g transform={`translate(${A0.x} ${A0.y})`} opacity={checksOn}>
          {GL.map((g) => {
            const d = sweepX - g.x;
            const a = d < 0 ? 0 : 0.35 + 0.65 * clamp(1 - d / 110);
            return a > 0 ? <path key={g.i} d={g.d} fill="none" stroke="#FFE3A3" strokeWidth={8} strokeLinecap="round" opacity={a * 0.75} /> : null;
          })}
          {sweepX > 0 && sweepX < PW && <rect x={sweepX - 3} y={4} width={6} height={PHh - 8} fill="#FFE3A3" opacity={0.9} />}
        </g>
      )}
      {aOn > 0 && (
        <text x={A0.x} y={A0.y + PHh + 34} fontFamily={FONT_BODY} fontWeight={700} fontSize={20} fill={K.inkSoft} opacity={aOn}>
          Reconstruction after Angelotti et al. 2026, Figs. 2–3
        </text>
      )}
      </g>
      </g>
    </g>
  );
};
