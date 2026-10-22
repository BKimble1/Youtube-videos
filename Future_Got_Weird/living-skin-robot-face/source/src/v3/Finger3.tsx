// V3 finger additions: a local side cutaway of the SAME incision (covering section with the shallow defect, on the rigid
// finger), the repaired surface (integrated graft, residual seam only), a more fibrous graft with a calm settle, and a
// sharper foreground blade.
import React from 'react';
import {Pt, lerp, clamp, smooth, path, rnd} from '../lib';
import {FK, FS, fingerFrame} from '../art/Finger';
import {TissueSection, TMap, DERM, tc} from '../v2/Tissue2';

// graft fibres: a dominant set roughly along the finger and a sparser crossing set (a felt of collagen fibres)
const FIB = Array.from({length: 90}, (_, k) => { const cross = k % 4 === 0; return {x0: -1.15 + rnd(k + 3) * (cross ? 2.1 : 1.6), v0: -1.05 + rnd(k + 60) * 2.0, dx: cross ? 0.03 + rnd(k + 120) * 0.02 : 0.06 + rnd(k + 120) * 0.05, dv: cross ? (rnd(k + 180) > 0.5 ? 1 : -1) * (0.07 + rnd(k + 240) * 0.05) : (rnd(k + 180) - 0.5) * 0.05}; });

// point at arc length s along the finger, at offset k (radii; +1 = dorsal surface)
const LT = FS.L[0] + FS.L[1] + FS.L[2];
const radiusAt = (s: number) => lerp(FS.r0, FS.r1, clamp(s / LT));
export const fp = (s: number, k: number, th: number[]) => {
  const c = fingerFrame(LT, th);
  const p = c[Math.max(0, Math.min(c.length - 1, Math.floor(s / 3)))];
  const r = radiusAt(s);
  return {x: p.x + Math.sin(p.a) * r * k, y: p.y - Math.cos(p.a) * r * k};
};
const bandPts = (th: number[], s0: number, s1: number, k0: number, k1: number) => {
  const n = 20, a: Pt[] = [], b: Pt[] = [];
  for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n); a.push(fp(s, k0, th)); b.push(fp(s, k1, th)); }
  return [...a, ...b.reverse()];
};
export const COV = 0.36; // covering thickness in radii
// local cutaway of the wound: open in [0,1] grows the window outward from the wound
export const WoundCut: React.FC<{th: number[]; open: number; t: number; id: string}> = ({th, open, t, id}) => {
  if (open <= 0.001) return null;
  const sw = FS.sw, hw = 74 * open;
  const r = radiusAt(sw), kS = (COV * r) / DERM;
  const m: TMap = (u, w) => fp(sw + (u - 640) * kS, 1 - (w * COV) / DERM, th);
  const win = bandPts(th, sw - hw, sw + hw, 1.07, 0.15);
  const notch = [fp(sw - 6, 1.02, th), fp(sw - 2.6, 1 - COV * 0.45, th), fp(sw, 1 - COV * 0.62, th), fp(sw + 2.6, 1 - COV * 0.45, th), fp(sw + 6, 1.02, th)];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-wc`}><path d={path(win)} /></clipPath>
        <pattern id={`${id}-wh`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#38424B" /><line x1="0" y1="0" x2="0" y2="6" stroke="#2A323A" strokeWidth="1.6" /></pattern>
      </defs>
      <g clipPath={`url(#${id}-wc)`}>
        {/* the rigid printed finger beneath (cut, hatched) */}
        <path d={path(bandPts(th, sw - 120, sw + 120, 1 - COV, -1.2))} fill={`url(#${id}-wh)`} />
        <path d={smooth(Array.from({length: 21}, (_, i) => fp(sw - 120 + i * 12, 1 - COV - 0.03, th)))} fill="none" stroke="#7E8A95" strokeWidth={1.6} />
        {/* the covering in section: the same tissue renderer, cells around the defect left out */}
        <TissueSection m={m} u0={640 - 130 / kS} u1={640 + 130 / kS} t={t} tone={0} id={`${id}-ts`} epidermis={false} cellFilter={(c) => Math.abs(c.u - 640) * kS > 9} />
        <path d={smooth(notch, false, 0.1)} fill="#C98C86" stroke={FK.skinDeep} strokeWidth={1.2} />
        <path d={smooth([notch[1], notch[2], notch[3]], false, 0.1)} fill="none" stroke="#7E4A4E" strokeWidth={1.4} opacity={0.6} />
      </g>
      <path d={path(win)} fill="none" stroke={FK.skinDeep} strokeWidth={1.4} opacity={0.7} />
    </g>
  );
};
// repaired surface seen from the side: integrated graft (subtle boundary, fibres) and a residual pale seam
export const RepairedSide: React.FC<{th: number[]; a: number}> = ({th, a}) => {
  if (a <= 0.001) return null;
  const sw = FS.sw, half = FS.patchHalf;
  const reg = bandPts(th, sw - half, sw + half, 1.02, 0.34);
  const seamA = Array.from({length: 13}, (_, i) => fp(sw - 30 + i * 5, 0.66 + 0.05 * Math.sin((Math.PI * i) / 12), th));
  const seamB = Array.from({length: 13}, (_, i) => fp(sw - 30 + i * 5, 0.66 - 0.05 * Math.sin((Math.PI * i) / 12), th));
  return (
    <g opacity={a}>
      <path d={path(reg)} fill="#F8E2D9" opacity={0.42} />
      {Array.from({length: 9}, (_, k) => <path key={k} d={smooth(Array.from({length: 7}, (_, i) => fp(sw - half + 4 + i * ((2 * half - 8) / 6), 0.42 + k * 0.065 + 0.012 * Math.sin(i * 1.4 + k), th)))} fill="none" stroke="#FFFFFF" strokeWidth={0.9} opacity={0.32} />)}
      <path d={path(reg)} fill="none" stroke="#FBEFEA" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.6} />
      <path d={smooth(seamA) + 'L' + [...seamB].reverse().map((p) => `${p.x} ${p.y}`).join('L') + 'Z'} fill="#EDC3B8" opacity={0.75} />
      <path d={smooth(seamA)} fill="none" stroke={FK.skinDark} strokeWidth={0.9} opacity={0.35} />
    </g>
  );
};
// soft contact shadow where the covering meets the rigid collar
export const CollarShadow: React.FC<{th: number[]}> = ({th}) => {
  const a = fp(FS.skinStart + 2, 1.02, th), b = fp(FS.skinStart + 2, -1.02, th);
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1A1416" strokeWidth={7} opacity={0.25} strokeLinecap="round" />;
};

// elevated 3/4 close-up of the graft landing. Cylinder of radius PR along x, camera elevation PE.
const PR = 260, PE = 0.62;
export const cyl3 = (x: number, phi: number, r = PR): Pt => ({x, y: -r * Math.cos(phi) * Math.cos(PE) + r * Math.sin(phi) * Math.sin(PE)});
export const PatchView3: React.FC<{id: string; drop: number; contact: number; settle: number; integrate?: number}> = ({id, drop, contact, settle, integrate = 0}) => {
  const silTop = cyl3(0, -Math.PI / 2 + PE).y, silBot = cyl3(0, Math.PI / 2 + PE).y;
  const slit = (h: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 20; i++) { const x = lerp(-150, 150, i / 20); pts.push(cyl3(x, -h * Math.pow(Math.sin((Math.PI * i) / 20), 0.8))); }
    for (let i = 20; i >= 0; i--) { const x = lerp(-150, 150, i / 20); pts.push(cyl3(x, h * Math.pow(Math.sin((Math.PI * i) / 20), 0.8))); }
    return path(pts);
  };
  // graft point at sheet coords (x in [-1,1] along the finger, v in [-1,1] across): held flat and tilted, it bends
  // as it nears the curved surface; contact sweeps from x=-1 to x=+1 (contact in [0,1])
  const X = 200, V = 0.5;
  const front = lerp(-1.15, 1.15, contact);
  const gp = (x: number, v: number): Pt => {
    const lifted = (1 - drop) * 190 + 26 * (x + 1) * (1 - contact) * drop; // tilted: left edge lowest
    const ahead = clamp((x - front) / 0.5); // 0 = in contact, 1 = still above
    const lift = contact >= 1 ? 0 : lifted * (drop < 1 ? 1 : ahead);
    const wrap = clamp(drop * 1.15 - 0.15) * (0.55 + 0.45 * (1 - ahead));
    const ripple = settle * 1.6 * Math.sin(x * 5 + settle * 9) * (1 - Math.abs(v));
    const phi = v * V + 0.03 * Math.sin(x * 7 + v * 3);
    const on = cyl3(x * X, phi, PR + 3);
    const flat = {x: x * X, y: cyl3(x * X, 0, PR + 3).y + v * V * PR * Math.sin(PE)};
    return {x: lerp(flat.x, on.x, wrap), y: lerp(flat.y, on.y, wrap) - lift - ripple};
  };
  const sheet: Pt[] = [];
  for (let i = 0; i <= 18; i++) sheet.push(gp(lerp(-1, 1, i / 18) + 0.02 * Math.sin(i * 2.3), -1 - 0.04 * Math.sin(i * 1.7)));
  for (let i = 0; i <= 10; i++) sheet.push(gp(1 + 0.03 * Math.sin(i * 2.1), lerp(-1, 1, i / 10)));
  for (let i = 18; i >= 0; i--) sheet.push(gp(lerp(-1, 1, i / 18) + 0.02 * Math.sin(i * 1.9), 1 + 0.04 * Math.sin(i * 2.9)));
  for (let i = 10; i >= 0; i--) sheet.push(gp(-1 + 0.03 * Math.sin(i * 2.7), lerp(-1, 1, i / 10)));
  const wet = clamp(contact * 1.2);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cyl`} x1="0" y1={silTop} x2="0" y2={silBot} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={FK.skinDark} /><stop offset="0.3" stopColor={FK.skinLight} /><stop offset="0.55" stopColor={FK.skin} /><stop offset="1" stopColor={FK.skinDeep} />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B86E6C" /><stop offset="0.5" stopColor="#E9B8A9" /><stop offset="1" stopColor="#C9827B" /></linearGradient>
        <clipPath id={`${id}-sheet`}><path d={smooth(sheet, true, 0.08)} /></clipPath>
      </defs>
      <rect x={-1600} y={silTop} width={3200} height={silBot - silTop} fill={`url(#${id}-cyl)`} />
      {Array.from({length: 130}, (_, i) => { const p = cyl3(-1400 + rnd(i + 5) * 2800, -1.4 + rnd(i + 55) * 2.8); return <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#FFFFFF" opacity={0.25} />; })}
      {[-1, 1].map((sg) => [0, 1, 2].map((q) => { const x = sg * (720 + q * 26); return <path key={sg * 10 + q} d={smooth(Array.from({length: 9}, (_, i) => cyl3(x + 8 * Math.sin(i), -1.4 + i * 0.35)))} fill="none" stroke={FK.skinDeep} strokeWidth={4} opacity={0.3} />; }))}
      <path d={slit(0.075 * (1 - 0.6 * integrate))} fill={FK.skinDeep} />
      <path d={slit(0.05 * (1 - 0.6 * integrate))} fill={`url(#${id}-inner)`} />
      {/* shadow of the sheet tightens as it nears the surface */}
      <ellipse cx={30 * (1 - drop)} cy={cyl3(0, 0).y + 14} rx={230} ry={50 + 50 * (1 - drop)} fill="#5A2E2E" opacity={0.2 * drop * (1 - wet * 0.6)} />
      {/* the graft: translucent base, two crossing fibre sets, irregular edge; wetter where in contact */}
      <path d={smooth(sheet, true, 0.08)} fill={FK.patch} opacity={lerp(0.34, 0.22, wet)} />
      <g clipPath={`url(#${id}-sheet)`}>
        {FIB.map((f, k) => <path key={k} d={smooth(Array.from({length: 7}, (_, i) => gp(clamp(f.x0 + i * f.dx, -1.08, 1.08), clamp(f.v0 + i * f.dv + 0.05 * Math.sin(i * 1.3 + k), -1.08, 1.08))))} fill="none" stroke={k % 3 ? '#FFFFFF' : '#E3F1F2'} strokeWidth={k % 4 ? 1.2 : 2} opacity={k % 3 ? 0.42 : 0.3} />)}
        {/* wet contact zone behind the front: sheen streak along the curvature */}
        {wet > 0 && <path d={smooth(Array.from({length: 11}, (_, i) => gp(lerp(-1, Math.min(1, front), i / 10), -0.35)))} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.45 * wet} />}
      </g>
      <path d={smooth(sheet, true, 0.08)} fill="none" stroke={FK.patchEdge} strokeWidth={2.5} opacity={0.85} />
    </g>
  );
};

// a large blade crossing in front of the lens (screen space), lightly defocused so the destination stays readable
export const ForegroundBlade3: React.FC<{k: number}> = ({k}) => {
  if (k <= 0 || k >= 1) return null;
  const cx = lerp(2050, -1000, k), cy = lerp(700, 1050, k);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <defs><filter id="fgb3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={5} /></filter></defs>
      <g filter="url(#fgb3)" transform={`translate(${cx} ${cy}) rotate(-16)`}>
        <path d="M-760 40 C -560 -170 -260 -300 120 -330 L 160 330 C -200 300 -520 220 -760 40 Z" fill="#BAC4CD" />
        <path d="M-640 10 C -470 -140 -230 -240 80 -262" fill="none" stroke="#F2F6F9" strokeWidth={34} opacity={0.85} />
        <path d="M-740 36 C -520 230 -200 310 150 326" fill="none" stroke="#8E99A3" strokeWidth={18} opacity={0.7} />
        <rect x={120} y={-360} width={1500} height={720} rx={80} fill="#3E4851" />
        <rect x={200} y={-300} width={1300} height={80} rx={40} fill="#6D7984" opacity={0.7} />
      </g>
    </svg>
  );
};
