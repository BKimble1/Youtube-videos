// The separate 2022 experiment: a three-joint robotic finger covered in cultured skin (dermis equivalent of human
// fibroblasts in collagen). A small incision is made in the covering, a thin acellular collagen sheet is grafted over
// it, and the finger is cultured for seven days while surrounding cells integrate the sheet.
// Views: FingerSide (bench, side), FingerTop (top close-up for the incision), PatchView (elevated 3/4 close-up of the
// grafting), plus the internal mechanism revealed by a clean cutaway. Not a human finger: no nails, no blood vessels.
import React from 'react';
import {Pt, lerp, clamp, smooth, path, rnd, sstep} from '../lib';

export const FK = {
  skin: '#E7B3A8', skinLight: '#F7D7CC', skinDark: '#C98B82', skinDeep: '#A8675F', inner: '#F2C9BC',
  metal: '#3A434C', metalDark: '#20262C', metalHi: '#8D99A4', steel: '#D7DEE4', steelDark: '#9AA6B0',
  bench: '#2B3B44', benchTop: '#3B4F5A', benchEdge: '#53707E', bg0: '#1A2A31', bg1: '#0A1216',
  patch: '#E9F3F4', patchEdge: '#B9D3D8', accent: '#E0475A',
};

// ---------- side view ----------
export const FS = {base: {x: -150, y: -120}, L: [200, 160, 132], r0: 48, r1: 40, skinStart: 14, sw: 284, patchHalf: 36};
const JOINTS = [0, FS.L[0], FS.L[0] + FS.L[1]];
const LTOT = FS.L[0] + FS.L[1] + FS.L[2];
export const fingerFrame = (s: number, th: number[]) => {
  // integrate the centreline; each joint bends over +-14 units
  const step = 3;
  let x = FS.base.x, y = FS.base.y, ang = 0;
  const pts: {x: number; y: number; a: number}[] = [];
  for (let q = 0; q <= Math.min(s, LTOT); q += step) {
    ang = JOINTS.reduce((acc, j, i) => acc + th[i] * sstep(j - 14, j + 14, q), 0);
    pts.push({x, y, a: ang});
    x += Math.cos(ang) * step;
    y += Math.sin(ang) * step;
  }
  return pts;
};
const radiusAt = (s: number) => lerp(FS.r0, FS.r1, clamp(s / LTOT));
// offset curve at signed offset k (in radii; +1 = dorsal/top edge), including the rounded tip
const offsetCurve = (th: number[], k: number, s0 = FS.skinStart, s1 = LTOT + FS.r1) => {
  const c = fingerFrame(LTOT, th);
  const out: Pt[] = [];
  for (let s = s0; s <= s1 + 0.01; s += 3) {
    const i = Math.max(0, Math.min(c.length - 1, Math.floor(Math.min(s, LTOT) / 3)));
    const p = c[i];
    let x = p.x + Math.cos(p.a) * Math.min(0, s), y = p.y + Math.sin(p.a) * Math.min(0, s), r = radiusAt(clamp(s, 0, LTOT));
    if (s > LTOT) {
      const e = s - LTOT;
      x += Math.cos(p.a) * e; y += Math.sin(p.a) * e;
      r = Math.sqrt(Math.max(0, FS.r1 * FS.r1 - e * e));
    }
    out.push({x: x + Math.sin(p.a) * r * k, y: y - Math.cos(p.a) * r * k});
  }
  return out;
};
export const fingerPoint = (s: number, k: number, th: number[]) => {
  const c = fingerFrame(LTOT, th);
  const p = c[Math.min(c.length - 1, Math.floor(s / 3))];
  const r = radiusAt(s);
  return {x: p.x + Math.sin(p.a) * r * k, y: p.y - Math.cos(p.a) * r * k, a: p.a};
};
const band = (th: number[], k0: number, k1: number, s0?: number, s1?: number) => {
  const a = offsetCurve(th, k0, s0, s1), b = offsetCurve(th, k1, s0, s1);
  return smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
};

export const FingerSide: React.FC<{
  th: number[]; id: string; wound?: number; patch?: number; integrate?: number; cut?: number; showBench?: boolean;
}> = ({th, id, wound = 0, patch = 0, integrate = 0, cut = 0, showBench = true}) => {
  const outline = band(th, 1, -1);
  const c = fingerFrame(LTOT, th);
  const pin = (s: number) => c[Math.min(c.length - 1, Math.floor(s / 3))];
  const wPts = Array.from({length: 13}, (_, i) => fingerPoint(FS.sw - 26 + i * (52 / 12), 0.97, th));
  // cutaway window over the middle segment (opens from the proximal side)
  const cs0 = 150, cs1 = lerp(150, 345, clamp(cut));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sk`}><path d={outline} /></clipPath>
        <clipPath id={`${id}-cut`}><path d={band(th, 0.8, -0.8, cs0, cs1)} /></clipPath>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B5560" />
          <stop offset="1" stopColor={FK.metalDark} />
        </linearGradient>
      </defs>
      {showBench && (
        <g>
          <rect x={-2400} y={150} width={4800} height={2000} fill={FK.bench} />
          <rect x={-2400} y={150} width={4800} height={10} fill={FK.benchEdge} />
          <ellipse cx={60} cy={168} rx={360} ry={16} fill="#000000" opacity={0.25} />
        </g>
      )}
      {/* motor base + clamp */}
      <rect x={-420} y={-230} width={250} height={380} rx={22} fill={`url(#${id}-base)`} stroke={FK.metalDark} strokeWidth={3} />
      {[0, 1, 2, 3, 4].map((q) => <line key={q} x1={-400 + q * 16} y1={-200} x2={-400 + q * 16} y2={-60} stroke={FK.metalHi} strokeWidth={4} opacity={0.4} />)}
      <circle cx={-250} cy={70} r={9} fill={FK.accent} />
      <rect x={-178} y={-175} width={36} height={110} rx={8} fill={FK.metal} />
      {/* rigid collar where the covering ends */}
      <path d={band(th, 1.08, -1.08, -6, FS.skinStart + 2)} fill={FK.metal} stroke={FK.metalDark} strokeWidth={2} />
      {/* the covering */}
      <path d={outline} fill={FK.skinDark} />
      <g clipPath={`url(#${id}-sk)`}>
        <path d={band(th, 0.98, -0.35)} fill={FK.skin} />
        <path d={band(th, 0.85, 0.25)} fill={FK.skinLight} opacity={0.75} />
        <path d={band(th, 0.72, 0.52)} fill="#FFFFFF" opacity={0.22} />
        <path d={band(th, -0.55, -1.05)} fill={FK.skinDeep} opacity={0.35} />
        {/* joint wrinkles: compression lines on the palm side, stretch sheen on the back, scaled by flexion */}
        {[1, 2].map((j) => [-2, -1, 0, 1, 2].map((q) => {
          const s = JOINTS[j] + q * 7;
          const a = fingerPoint(s, -1, th), b = fingerPoint(s, -0.35, th);
          return <line key={j * 10 + q} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={FK.skinDeep} strokeWidth={2.2} strokeLinecap="round" opacity={clamp(th[j] / 0.4) * 0.55} />;
        }))}
        {/* pores */}
        {Array.from({length: 70}, (_, i) => {
          const p = fingerPoint(FS.skinStart + rnd(i + 3) * (LTOT - 20), -0.9 + rnd(i + 99) * 1.8, th);
          return <circle key={i} cx={p.x} cy={p.y} r={1.3} fill="#FFFFFF" opacity={0.3} />;
        })}
        {/* incision on the back of the middle segment, seen edge-on */}
        {/* joint seams: the covering creases over each joint */}
        {[1, 2].map((j) => <path key={j} d={smooth([-1, -0.5, 0, 0.5, 1].map((k) => fingerPoint(JOINTS[j] + 3 * Math.abs(k), k, th)))} fill="none" stroke={FK.skinDeep} strokeWidth={2.5} opacity={0.32} />)}
        {wound > 0 && (() => {
          const a = Array.from({length: 13}, (_, i) => fingerPoint(FS.sw - 30 + i * 5, 0.66 + 0.1 * Math.sin((Math.PI * i) / 12), th));
          const b = Array.from({length: 13}, (_, i) => fingerPoint(FS.sw - 30 + i * 5, 0.66 - 0.1 * Math.sin((Math.PI * i) / 12), th));
          const lens = smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
          return (
            <g opacity={wound * (1 - 0.55 * integrate)}>
              <path d={lens} fill={FK.skinDeep} />
              <path d={smooth(Array.from({length: 13}, (_, i) => fingerPoint(FS.sw - 28 + i * 4.7, 0.66, th)))} fill="none" stroke={FK.inner} strokeWidth={2.5} />
            </g>
          );
        })()}
        {/* grafted collagen sheet */}
        {patch > 0 && <path d={band(th, lerp(1.12, 1.02, integrate), 0.36, FS.sw - FS.patchHalf, FS.sw + FS.patchHalf)} fill={integrate > 0 ? '#F9E2D8' : FK.patch} opacity={patch * lerp(0.7, 0.55, integrate)} />}
        {patch > 0 && <path d={band(th, lerp(1.12, 1.02, integrate), 0.36, FS.sw - FS.patchHalf, FS.sw + FS.patchHalf)} fill="none" stroke={FK.patchEdge} strokeWidth={2} strokeDasharray="7 6" opacity={patch * lerp(0.9, 0.6, integrate)} />}
      </g>
      {patch > 0 && integrate < 1 && <path d={smooth(Array.from({length: 13}, (_, i) => fingerPoint(FS.sw - FS.patchHalf + i * (FS.patchHalf / 6), 1.1, th)))} fill="none" stroke={FK.patchEdge} strokeWidth={3.5} strokeLinecap="round" opacity={patch * (1 - integrate)} />}
      <path d={band(th, 1.0, 1.0)} fill="none" />
      <path d={outline} fill="none" stroke={FK.skinDeep} strokeWidth={1.5} opacity={0.6} />
      {/* skin edge ring at the collar: the covering's thickness */}
      {(() => {
        const a = fingerPoint(FS.skinStart, 1, th), b = fingerPoint(FS.skinStart, -1, th);
        return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={FK.skinDeep} strokeWidth={6} strokeLinecap="round" />;
      })()}
      {/* cutaway: the rigid mechanism inside */}
      {cut > 0.001 && (
        <g>
          <g clipPath={`url(#${id}-cut)`}>
            <path d={band(th, 1.2, -1.2, cs0 - 10, cs1 + 10)} fill="#151B21" />
            <Mechanism th={th} c={c} />
          </g>
          <path d={band(th, 0.8, -0.8, cs0, cs1)} fill="none" stroke={FK.skinDeep} strokeWidth={5} />
          {/* covering thickness at the cut: inner faces */}
          <path d={band(th, 0.8, 0.66, cs0, cs1)} fill={FK.inner} />
          <path d={band(th, -0.66, -0.8, cs0, cs1)} fill={FK.inner} />
        </g>
      )}
      {/* joint pins hint through the covering when bent */}
      {[1, 2].map((j) => { const p = pin(JOINTS[j]); return <circle key={j} cx={p.x} cy={p.y} r={4} fill={FK.skinDeep} opacity={0.15} />; })}
    </g>
  );
};

const Mechanism: React.FC<{th: number[]; c: {x: number; y: number; a: number}[]}> = ({th, c}) => {
  const at = (s: number) => c[Math.min(c.length - 1, Math.max(0, Math.floor(s / 3)))];
  const link = (s0: number, s1: number, k: number) => {
    const pts: Pt[] = [];
    for (let s = s0; s <= s1; s += 6) { const p = at(s); pts.push({x: p.x, y: p.y}); }
    return <path key={k} d={smooth(pts)} fill="none" stroke={FK.metal} strokeWidth={36} strokeLinecap="round" />;
  };
  return (
    <g>
      {link(4, JOINTS[1] - 18, 0)}
      {link(JOINTS[1] + 18, JOINTS[2] - 18, 1)}
      {link(JOINTS[2] + 18, LTOT - 10, 2)}
      {[0, 1, 2].map((k) => {
        const s0 = [4, JOINTS[1] + 18, JOINTS[2] + 18][k], s1 = [JOINTS[1] - 18, JOINTS[2] - 18, LTOT - 10][k];
        const pts: Pt[] = [];
        for (let s = s0; s <= s1; s += 6) { const p = at(s); pts.push({x: p.x - Math.sin(p.a) * 9, y: p.y + Math.cos(p.a) * -9}); }
        return <path key={k} d={smooth(pts)} fill="none" stroke={FK.metalHi} strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      })}
      {/* tendon wire along the palm side */}
      {(() => { const pts: Pt[] = []; for (let s = 0; s <= LTOT - 20; s += 6) { const p = at(s); pts.push({x: p.x - Math.sin(p.a) * 26, y: p.y + Math.cos(p.a) * 26}); } return <path d={smooth(pts)} fill="none" stroke="#C9D2DA" strokeWidth={3} opacity={0.8} />; })()}
      {[JOINTS[1], JOINTS[2]].map((j, k) => { const p = at(j); return (
        <g key={k}>
          <circle cx={p.x} cy={p.y} r={22} fill={FK.metalDark} stroke={FK.metalHi} strokeWidth={3} />
          <circle cx={p.x} cy={p.y} r={9} fill={FK.steel} />
          <circle cx={p.x - 3} cy={p.y - 3} r={3} fill="#FFFFFF" opacity={0.8} />
        </g>
      ); })}
    </g>
  );
};

// ---------- top view of the middle segment (incision) ----------
export const FTOP = {R: 220, x0: -900, x1: 900, inc: {x0: -150, x1: 150, y: -14}};
export const FingerTop: React.FC<{id: string; incision: number; open: number; integrate?: number; patch?: number}> = ({id, incision, open, integrate = 0, patch = 0}) => {
  const {R, x0, x1, inc} = FTOP;
  const ix1 = lerp(inc.x0, inc.x1, clamp(incision));
  const half = 12 * open * (1 - 0.6 * integrate);
  const lens = (h: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) { const x = lerp(inc.x0, ix1, i / 24); const k = Math.sin((Math.PI * i) / 24); pts.push({x, y: inc.y - h * k}); }
    for (let i = 24; i >= 0; i--) { const x = lerp(inc.x0, ix1, i / 24); const k = Math.sin((Math.PI * i) / 24); pts.push({x, y: inc.y + h * k}); }
    return path(pts);
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cyl`} x1="0" y1={-R} x2="0" y2={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={FK.skinDeep} />
          <stop offset="0.18" stopColor={FK.skinDark} />
          <stop offset="0.42" stopColor={FK.skinLight} />
          <stop offset="0.6" stopColor={FK.skin} />
          <stop offset="0.88" stopColor={FK.skinDark} />
          <stop offset="1" stopColor={FK.skinDeep} />
        </linearGradient>
      </defs>
      <rect x={x0} y={-R} width={x1 - x0} height={2 * R} fill={`url(#${id}-cyl)`} />
      {/* joint creases at both ends of the segment */}
      {[-1, 1].map((sg) => [0, 1, 2].map((q) => <path key={sg * 10 + q} d={`M${sg * (640 + q * 22)} ${-R}Q${sg * (650 + q * 22)} 0 ${sg * (640 + q * 22)} ${R}`} fill="none" stroke={FK.skinDeep} strokeWidth={4} opacity={0.35} />))}
      {Array.from({length: 160}, (_, i) => <circle key={i} cx={x0 + rnd(i + 7) * (x1 - x0)} cy={-R * 0.92 + rnd(i + 70) * R * 1.84} r={2.6} fill="#FFFFFF" opacity={0.25} />)}
      <ellipse cx={0} cy={-R * 0.28} rx={700} ry={26} fill="#FFFFFF" opacity={0.12} />
      {incision > 0 && (
        <g>
          <path d={lens(half + 2.5)} fill={FK.skinDeep} opacity={0.9 * (1 - 0.5 * integrate)} />
          {half > 0.5 && <path d={lens(half)} fill={FK.inner} />}
          {half > 0.5 && <path d={lens(half * 0.35)} fill="#FBE3D9" opacity={0.8} />}
        </g>
      )}
      {patch > 0 && <rect x={-230} y={-120} width={460} height={210} rx={14} fill={FK.patch} opacity={0.42 * patch} stroke={FK.patchEdge} strokeWidth={4} />}
    </g>
  );
};

// a scalpel (blade tip at the origin, pointing down-left)
export const Scalpel: React.FC<{x: number; y: number; a: number; s?: number}> = ({x, y, a, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
    <path d="M0 0 C 40 -34 120 -60 210 -66 L 228 -40 C 160 -30 70 -10 0 0 Z" fill={FK.steel} stroke={FK.steelDark} strokeWidth={3} />
    <path d="M30 -18 C 90 -40 150 -52 205 -58" fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.6} />
    <rect x={222} y={-70} width={420} height={36} rx={10} fill="#9EA9B3" stroke={FK.steelDark} strokeWidth={3} transform="rotate(-6 222 -70)" />
    <rect x={250} y={-64} width={340} height={8} rx={4} fill="#FFFFFF" opacity={0.4} transform="rotate(-6 222 -70)" />
  </g>
);

// ---------- elevated 3/4 close-up of the graft ----------
// cylinder of radius PV.R along x; phi = angle around the axis from the top; camera elevated by e
export const PV = {R: 260, e: 0.62};
export const cylPt = (x: number, phi: number, r = PV.R): Pt => ({x, y: -r * Math.cos(phi) * Math.cos(PV.e) + r * Math.sin(phi) * Math.sin(PV.e)});
export const PatchView: React.FC<{id: string; drop: number; t: number; integrate?: number}> = ({id, drop, integrate = 0}) => {
  const {R} = PV;
  const silTop = cylPt(0, -Math.PI / 2 + PV.e).y, silBot = cylPt(0, Math.PI / 2 + PV.e).y;
  // the slit on top
  const slit = (h: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 20; i++) { const x = lerp(-150, 150, i / 20); pts.push(cylPt(x, -h * Math.sin((Math.PI * i) / 20))); }
    for (let i = 20; i >= 0; i--) { const x = lerp(-150, 150, i / 20); pts.push(cylPt(x, h * Math.sin((Math.PI * i) / 20))); }
    return path(pts);
  };
  // the sheet: flat while held, wraps onto the surface as it lands (drop 0 = held high, 1 = in contact)
  const lift = (1 - drop) * 170;
  const wrap = clamp(drop * 1.25 - 0.25);
  const sheetPt = (x: number, v: number): Pt => {
    const phi = v * 0.5 + 0.03 * Math.sin(x * 0.03 + v * 3);
    const onSurf = cylPt(x, phi, R + 3);
    const flat = {x, y: cylPt(x, 0, R + 3).y + v * 0.5 * R * Math.sin(PV.e)};
    return {x: lerp(flat.x, onSurf.x, wrap), y: lerp(flat.y, onSurf.y, wrap) - lift};
  };
  const sheet: Pt[] = [];
  for (let i = 0; i <= 16; i++) sheet.push(sheetPt(lerp(-210, 210, i / 16), -1));
  for (let i = 0; i <= 10; i++) sheet.push(sheetPt(210, lerp(-1, 1, i / 10)));
  for (let i = 16; i >= 0; i--) sheet.push(sheetPt(lerp(-210, 210, i / 16), 1));
  for (let i = 10; i >= 0; i--) sheet.push(sheetPt(-210, lerp(-1, 1, i / 10)));
  const contactShadow = clamp(drop * 2 - 0.6);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cyl`} x1="0" y1={silTop} x2="0" y2={silBot} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={FK.skinDark} />
          <stop offset="0.3" stopColor={FK.skinLight} />
          <stop offset="0.55" stopColor={FK.skin} />
          <stop offset="1" stopColor={FK.skinDeep} />
        </linearGradient>
      </defs>
      <rect x={-1600} y={silTop} width={3200} height={silBot - silTop} fill={`url(#${id}-cyl)`} />
      {Array.from({length: 120}, (_, i) => { const p = cylPt(-1400 + rnd(i + 5) * 2800, -1.4 + rnd(i + 55) * 2.8); return <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#FFFFFF" opacity={0.25} />; })}
      {[-1, 1].map((sg) => [0, 1, 2].map((q) => {
        const x = sg * (700 + q * 26);
        return <path key={sg * 10 + q} d={smooth(Array.from({length: 9}, (_, i) => cylPt(x + 8 * Math.sin(i), -1.4 + i * 0.35)))} fill="none" stroke={FK.skinDeep} strokeWidth={4} opacity={0.3} />;
      }))}
      <path d={slit(0.07 * (1 - 0.6 * integrate))} fill={FK.skinDeep} />
      <path d={slit(0.045 * (1 - 0.6 * integrate))} fill={FK.inner} />
      {/* shadow of the sheet on the surface grows as it approaches */}
      <ellipse cx={0} cy={cylPt(0, 0).y + 10} rx={260} ry={60 + 40 * (1 - drop)} fill="#5A2E2E" opacity={0.18 * drop} />
      <path d={smooth(sheet, true, 0.08)} fill={FK.patch} opacity={0.36} stroke={FK.patchEdge} strokeWidth={3} />
      {/* fibrous texture of the sheet */}
      {Array.from({length: 9}, (_, k) => {
        const pts = Array.from({length: 9}, (_, i) => sheetPt(lerp(-198, 198, i / 8), -0.85 + k * 0.21 + 0.05 * Math.sin(i * 1.3 + k)));
        return <path key={k} d={smooth(pts)} fill="none" stroke="#FFFFFF" strokeWidth={2.2} opacity={0.5} />;
      })}
      {contactShadow > 0 && <path d={smooth(sheet, true, 0.08)} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.6 * contactShadow * (1 - contactShadow)} />}
    </g>
  );
};

// fine tweezers holding the sheet's edge (tips at the origin)
export const Tweezers: React.FC<{x: number; y: number; open?: number}> = ({x, y, open = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(-28)`}>
    <path d={`M${-6 - open * 6} 0 L ${-22 - open * 10} -520 L ${-4} -520 L ${2 - open * 4} 0 Z`} fill={FK.steel} stroke={FK.steelDark} strokeWidth={3} />
    <path d={`M${6 + open * 6} 0 L ${22 + open * 10} -520 L ${4} -520 L ${-2 + open * 4} 0 Z`} fill="#BFC8D0" stroke={FK.steelDark} strokeWidth={3} />
  </g>
);
