// Close-up inserts that are not part of the 3D scene:
//   ClaspCU — the Director's hand held in the drone pilot's two hands; `grip` 1 → 0 is his grip loosening (his thumb
//             slides off her knuckles, his fingertips straighten and slip back, his wrist goes heavy). Her hands stay.
// The death FACE close-up is done in the scene with the same rig (figureSprite + a close camera), so it is the same
// approved face, lit by the same light; see RigLab page 10.
import React from 'react';
import {C, BLOOD} from '../../theme';
import {V2, lerp, f2, clamp, smooth} from '../../kit/math';
import {mix} from '../engine/color';
import {blobPath} from './util';

type Finger = {base: V2; mid: V2; tip: V2; w: number; w1?: number};
const fingerD = (f: Finger) => {
  const N = 10, w0 = f.w, w1 = f.w1 ?? f.w * 0.82;
  const P = (u: number) => ({x: (1 - u) * (1 - u) * f.base.x + 2 * (1 - u) * u * f.mid.x + u * u * f.tip.x, y: (1 - u) * (1 - u) * f.base.y + 2 * (1 - u) * u * f.mid.y + u * u * f.tip.y});
  const D = (u: number) => ({x: 2 * (1 - u) * (f.mid.x - f.base.x) + 2 * u * (f.tip.x - f.mid.x), y: 2 * (1 - u) * (f.mid.y - f.base.y) + 2 * u * (f.tip.y - f.mid.y)});
  const L: V2[] = [], R: V2[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = P(u), d = D(u), l = Math.hypot(d.x, d.y) || 1;
    const nx = -d.y / l, ny = d.x / l, w = lerp(w0, w1, u) / 2;
    L.push({x: p.x + nx * w, y: p.y + ny * w}); R.push({x: p.x - nx * w, y: p.y - ny * w});
  }
  const e = P(1), de = D(1), le = Math.hypot(de.x, de.y) || 1, ux = de.x / le, uy = de.y / le, r = w1 / 2;
  const cap: V2[] = [];
  for (let k = 1; k < 7; k++) { const a = (Math.PI * k) / 7; cap.push({x: e.x + r * (-uy * Math.cos(a) + ux * Math.sin(a)), y: e.y + r * (ux * Math.cos(a) + uy * Math.sin(a))}); }
  const pts = [...L, ...cap, ...[...R].reverse()];
  return 'M ' + pts.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ') + ' Z';
};
const Fing: React.FC<{f: Finger; skin: string; ink: number; shade?: string}> = ({f, skin, ink, shade}) => (
  <g>
    <path d={fingerD(f)} fill={skin} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
    {shade && <path d={fingerD({...f, w: f.w * 0.4, w1: (f.w1 ?? f.w * 0.82) * 0.4, base: {x: f.base.x, y: f.base.y + f.w * 0.25}, mid: {x: f.mid.x, y: f.mid.y + f.w * 0.25}, tip: {x: f.tip.x, y: f.tip.y + f.w * 0.2}})} fill={shade} opacity={0.5} />}
  </g>
);

export type ClaspProps = {
  /** his grip: 1 holding, 0 let go */
  grip: number;
  /** his wrist going heavy (0..1) */
  sag?: number;
  /** her answering squeeze (0..1) */
  squeeze?: number;
  t: number;
  skinD?: string; skinH?: string; sleeveH?: string; pale?: number; blood?: number;
  /** warm light from the left (fire) 0..1 */
  warm?: number;
};

/** Full-frame insert, 1920×1080 design space. */
export const ClaspCU: React.FC<ClaspProps> = ({grip, sag = 0, squeeze = 0, t, skinD = '#C98B5E', skinH = '#F7D9C4', sleeveH = C.coral, pale = 0, blood = 0.9, warm = 0.5}) => {
  const g = clamp(grip), sg = clamp(sag), sq = clamp(squeeze);
  const ink = 6;
  const sD = mix(skinD, '#B9A99C', 0.25 * pale);
  const sDs = mix(sD, '#5E3A26', 0.38);
  const sH = skinH, sHs = mix(skinH, '#B98A74', 0.4);
  // a breath of motion while he still holds on; stillness once he lets go
  const tremor = g * 2.2 * Math.sin(t * 9.1) * (1 - sg);
  const drop = sg * 46; // his hand sinks
  const rot = sg * 7;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block'}}>
      <defs>
        <radialGradient id="cuWarm" cx="18%" cy="40%" r="80%">
          <stop offset="0" stopColor="#FF9A4A" stopOpacity={0.35 * warm} />
          <stop offset="1" stopColor="#1A1418" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* broken concrete and dust behind */}
      <rect width={1920} height={1080} fill="#3A3330" />
      <path d="M 0 760 L 420 700 L 760 760 L 1180 690 L 1920 740 L 1920 1080 L 0 1080 Z" fill="#4E4642" />
      <path d="M 0 760 L 420 700 L 760 760 L 1180 690 L 1920 740" fill="none" stroke={C.ink} strokeWidth={5} />
      <path d={blobPath(150, 3, 9, 0.4, 1.6, 0.6)} transform="translate(1500 900)" fill="#5A524C" stroke={C.ink} strokeWidth={4} />
      <rect width={1920} height={1080} fill="url(#cuWarm)" />
      <g transform={`translate(${f2(tremor)} ${f2(drop)}) rotate(${f2(rot)} 700 560)`}>
        {/* his forearm from the lower left (bare: short sleeve above the frame) */}
        <path d="M -60 1120 L 380 640 L 590 760 L 230 1160 Z" fill={sD} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        <path d="M 160 1080 L 470 720" stroke={sDs} strokeWidth={60} opacity={0.4} strokeLinecap="round" />
        {[0, 1, 2].map((i) => <line key={i} x1={260 + i * 26} y1={900 - i * 10} x2={330 + i * 26} y2={860 - i * 10} stroke={BLOOD.scrape} strokeWidth={5} strokeLinecap="round" opacity={0.8} />)}
        {/* his hand (back of the hand toward us), knuckles toward the upper right */}
        <path d="M 360 640 C 440 520 600 460 760 470 C 860 478 900 560 870 640 C 840 720 700 790 590 770 Z" fill={sD} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        <path d="M 520 560 Q 640 520 760 540" fill="none" stroke={sDs} strokeWidth={4} opacity={0.6} />
        {blood > 0 && <path d={blobPath(46, 8, 9, 0.5, 1.4, 0.8)} transform="translate(640 650)" fill={BLOOD.main} opacity={blood} />}
        {/* his fingers: curled over her hand while he holds; straightening and slipping back as he lets go */}
        {[0, 1, 2, 3].map((i) => {
          const by = 488 + i * 64, bx = 820 + i * 14;
          const curl = g;
          const tipX = lerp(1010 + i * 6, 990 - i * 18, curl), tipY = lerp(by + 30 - i * 4, by + 120 - i * 10, curl);
          const midX = lerp(930, 960, curl), midY = lerp(by + 10, by + 20, curl);
          return <Fing key={i} f={{base: {x: bx, y: by}, mid: {x: midX, y: midY}, tip: {x: tipX, y: tipY + sg * 30}, w: 66 - i * 6, w1: 54 - i * 5}} skin={sD} ink={ink} shade={sDs} />;
        })}
      </g>
      {/* her hand under his (palm up): forearm from the right in the coral sleeve */}
      <path d="M 1980 1000 L 1460 640 L 1300 790 L 1820 1140 Z" fill={sH} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d="M 2000 900 L 1590 650 L 1440 760 L 1900 1060 Z" fill={sleeveH} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M 1480 650 C 1380 600 1180 600 ${1060 - sq * 10} 640 C 960 690 940 780 1000 840 C 1080 900 1260 880 1340 800 Z`} fill={sH} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {/* her thumb across the back of his hand */}
      <g transform={`translate(${f2(tremor * 0.6)} ${f2(drop * 0.85)})`}>
        <Fing f={{base: {x: 1140, y: 620}, mid: {x: 960 - sq * 10, y: 520 + sq * 6}, tip: {x: 800 - sq * 16, y: 540 + sq * 10}, w: 74, w1: 62}} skin={sH} ink={ink} shade={sHs} />
      </g>
      {/* her other hand laid over his wrist */}
      <g transform={`translate(${f2(tremor * 0.3)} ${f2(drop * 0.6)})`}>
        <path d="M 120 220 L 420 470 L 520 380 L 260 140 Z" fill={sleeveH} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        <path d="M 390 420 C 470 400 560 470 600 560 C 620 640 560 700 480 690 C 420 680 380 600 360 520 Z" fill={sH} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => <Fing key={i} f={{base: {x: 560 - i * 30, y: 640 + i * 18}, mid: {x: 600 - i * 26, y: 720 + i * 14 + sq * 6}, tip: {x: 560 - i * 30, y: 790 + i * 8 + sq * 10}, w: 52 - i * 3}} skin={sH} ink={ink} shade={sHs} />)}
      </g>
      {/* his thumb: pressing over her knuckles while he grips; sliding off as he lets go */}
      <g transform={`translate(${f2(tremor)} ${f2(drop)}) rotate(${f2(rot)} 700 560)`}>
        <Fing f={{base: {x: 760, y: 470}, mid: {x: lerp(880, 940, g), y: lerp(470, 420, g)}, tip: {x: lerp(900, 1080, g), y: lerp(540 + sg * 40, 470, g)}, w: 76, w1: 64}} skin={sD} ink={ink} shade={sDs} />
      </g>
      <rect width={1920} height={1080} fill="#0E0A0C" opacity={0.08 + 0.1 * smooth(sg)} />
    </svg>
  );
};
