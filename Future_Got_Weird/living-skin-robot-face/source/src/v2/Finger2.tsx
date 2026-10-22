// V2 finger views (2022 experiment). The wound is always at the same place: back of the middle segment (FS.sw).
//  - FingerTop2: top macro of the middle segment. The blade first indents the covering, then separates it into a narrow
//    slit with dimensional lips and shallow inner shading; the surrounding covering stays attached and under tension.
//  - FingerXSection: a section across the finger at the wound: living covering (same tissue renderer) around the
//    rigid printed core; the defect is a narrow notch in the covering only.
//  - PatchView2: elevated 3/4 close-up; a fibrous, translucent collagen sheet bends to the curved surface and makes
//    contact progressively from one edge, with a wet sheen and a small settle.
// No blood, vessels, fluid or tearing: the cultured covering has no depicted blood supply.
import React from 'react';
import {Pt, lerp, clamp, smooth, path, rnd} from '../lib';
import {FK} from '../art/Finger';
import {TissueSection, TMap, DERM, tc, EPI} from './Tissue2';

export const T2 = {R: 230, inc: {x0: -150, x1: 150, y: -14}};
// slit geometry: lens of half-width h along the incision, opened behind the blade
const lens = (x0: number, x1: number, y: number, h: number, n = 28) => {
  const a: Pt[] = [], b: Pt[] = [];
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), k = Math.pow(Math.sin((Math.PI * i) / n), 0.8); a.push({x, y: y - h * k}); b.push({x, y: y + h * k}); }
  return {a, b};
};
export const FingerTop2: React.FC<{id: string; tip?: Pt | null; press: number; inc: number; open: number; integrate?: number; patch?: number}> = ({id, tip, press, inc, open, integrate = 0, patch = 0}) => {
  const {R, inc: I} = T2;
  const ix = lerp(I.x0, I.x1, clamp(inc));
  const h = 9 * open * (1 - 0.55 * integrate);
  const L = lens(I.x0, Math.max(I.x0 + 1, ix), I.y, h);
  const lips = smooth(L.a) + 'L' + [...L.b].reverse().map((p) => `${p.x} ${p.y}`).join('L') + 'Z';
  // surface tension: faint creases fanning from the slit ends, and pores pulled slightly away from the opening
  const pull = (p: Pt) => { const dy = p.y - I.y, inX = p.x > I.x0 - 40 && p.x < ix + 40; const k = inX ? h * 0.9 * Math.exp(-(dy * dy) / 1800) : 0; return {x: p.x, y: p.y + Math.sign(dy) * k}; };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cyl`} x1="0" y1={-R} x2="0" y2={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={FK.skinDeep} /><stop offset="0.18" stopColor={FK.skinDark} /><stop offset="0.42" stopColor={FK.skinLight} /><stop offset="0.6" stopColor={FK.skin} /><stop offset="0.88" stopColor={FK.skinDark} /><stop offset="1" stopColor={FK.skinDeep} />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B86E6C" /><stop offset="0.45" stopColor="#E9B8A9" /><stop offset="1" stopColor="#C9827B" /></linearGradient>
        <radialGradient id={`${id}-dimple`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={FK.skinDeep} stopOpacity={0.55} /><stop offset="0.7" stopColor={FK.skinDeep} stopOpacity={0.12} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-1000} y={-R} width={2000} height={2 * R} fill={`url(#${id}-cyl)`} />
      {[-1, 1].map((sg) => [0, 1, 2].map((q) => <path key={sg * 10 + q} d={`M${sg * (660 + q * 22)} ${-R}Q${sg * (672 + q * 22)} 0 ${sg * (660 + q * 22)} ${R}`} fill="none" stroke={FK.skinDeep} strokeWidth={4} opacity={0.35} />))}
      {Array.from({length: 200}, (_, i) => { const p = pull({x: -980 + rnd(i + 7) * 1960, y: -R * 0.92 + rnd(i + 70) * R * 1.84}); return <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="#FFFFFF" opacity={0.25} />; })}
      <ellipse cx={0} cy={-R * 0.3} rx={760} ry={24} fill="#FFFFFF" opacity={0.12} />
      {/* tension creases at the slit ends */}
      {open > 0.05 && [I.x0, ix].map((x, k) => [-1, 1].map((sg) => <path key={k * 10 + sg} d={`M${x + (k ? 6 : -6)} ${I.y}q${(k ? 1 : -1) * 34} ${sg * 10} ${(k ? 1 : -1) * 70} ${sg * 26}`} fill="none" stroke={FK.skinDeep} strokeWidth={2} opacity={0.28 * open} />))}
      {/* the slit: shadowed lower lip, shallow inner wall, lit upper lip edge */}
      {inc > 0 && h > 0.3 && (
        <g>
          <path d={lips} fill={`url(#${id}-inner)`} />
          <path d={smooth(L.a)} fill="none" stroke={FK.skinDeep} strokeWidth={3.5} opacity={0.85} />
          <path d={smooth(L.b.map((p) => ({x: p.x, y: p.y + 2})))} fill="none" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.55} />
          <path d={smooth(L.a.map((p) => ({x: p.x, y: p.y - 2.5})))} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.4} />
          <path d={smooth(L.a.map((p, i) => ({x: p.x, y: lerp(p.y, L.b[i].y, 0.3)})))} fill="none" stroke="#9E5A5A" strokeWidth={2} opacity={0.35} />
        </g>
      )}
      {inc > 0 && h <= 0.3 && <path d={`M${I.x0} ${I.y}L${ix} ${I.y}`} stroke={FK.skinDeep} strokeWidth={3} />}
      {/* the blade presses the covering before it separates: a moving dimple at the tip */}
      {tip && press > 0.01 && <g opacity={press}><ellipse cx={tip.x} cy={tip.y + 3} rx={34 + 34 * press} ry={15 + 18 * press} fill={`url(#${id}-dimple)`} /><path d={`M${tip.x - 40 - 30 * press} ${tip.y + 10}Q${tip.x} ${tip.y + 26 + 14 * press} ${tip.x + 40 + 30 * press} ${tip.y + 10}`} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.5} /></g>}
      {patch > 0 && <GraftTop id={id} a={patch} integrate={integrate} />}
    </g>
  );
};
// the graft seen from above (after placement / after repair)
const GraftTop: React.FC<{id: string; a: number; integrate: number}> = ({a, integrate}) => {
  const edge = Array.from({length: 40}, (_, i) => { const t = (i / 40) * Math.PI * 2; const r = 1 + 0.04 * Math.sin(t * 7) + 0.03 * Math.sin(t * 13); return {x: Math.cos(t) * 250 * r, y: -14 + Math.sin(t) * 120 * r}; });
  return (
    <g opacity={a}>
      <path d={smooth(edge, true)} fill={integrate > 0 ? '#F3CFC4' : FK.patch} opacity={lerp(0.42, 0.32, integrate)} />
      {Array.from({length: 14}, (_, k) => <path key={k} d={`M${-230 + k * 34} -120Q${-215 + k * 34} -14 ${-235 + k * 34} 96`} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.35 * (1 - 0.4 * integrate)} />)}
      <path d={smooth(edge, true)} fill="none" stroke={integrate > 0 ? FK.skinLight : FK.patchEdge} strokeWidth={3} strokeDasharray={integrate > 0 ? '9 7' : undefined} opacity={lerp(0.9, 0.6, integrate)} />
    </g>
  );
};

// cross-section across the finger at the wound (world units): rigid core inside, covering around it
export const XS = {R: 300, cov: 118, k: 118 / DERM, notchW: 20, notchD: 64};
export const xsMap = (theta0 = 0): TMap => (u, w) => {
  const th = theta0 + ((u - 640) * XS.k) / XS.R;
  const r = XS.R - w * XS.k;
  return {x: Math.sin(th) * r, y: -Math.cos(th) * r};
};
export const FingerXSection: React.FC<{id: string; t: number; tone: number; notch: number}> = ({id, t, tone, notch}) => {
  const C = tc(tone);
  const ring = (r: number) => Array.from({length: 121}, (_, i) => { const a = (i / 120) * Math.PI * 2; return {x: Math.sin(a) * r, y: -Math.cos(a) * r}; });
  const outer = ring(XS.R), inner = ring(XS.R - XS.cov);
  const nW = XS.notchW * notch, nD = XS.notchD * notch;
  const notchPts = [{x: -nW, y: -XS.R - 4}, {x: -nW * 0.7, y: -XS.R + nD * 0.3}, {x: -3, y: -XS.R + nD}, {x: 3, y: -XS.R + nD}, {x: nW * 0.7, y: -XS.R + nD * 0.3}, {x: nW, y: -XS.R - 4}];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-ann`}><path d={path(outer) + path(inner)} clipRule="evenodd" /></clipPath>
        <radialGradient id={`${id}-core`} cx="0.4" cy="0.35" r="0.8"><stop offset="0" stopColor="#5A6570" /><stop offset="1" stopColor={FK.metalDark} /></radialGradient>
        <linearGradient id={`${id}-notch`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7E4A4E" /><stop offset="1" stopColor="#C98C86" /></linearGradient>
      </defs>
      {/* rigid core: printed link with a joint bore */}
      <circle r={XS.R - XS.cov - 2} fill={`url(#${id}-core)`} stroke={FK.metalDark} strokeWidth={4} />
      <circle r={46} fill={FK.metalDark} stroke={FK.metalHi} strokeWidth={5} />
      <circle r={18} fill={FK.steel} />
      <path d={`M${-(XS.R - XS.cov - 30)} 60H${XS.R - XS.cov - 30}`} stroke="#C9D2DA" strokeWidth={4} opacity={0.6} />
      {/* living covering around it */}
      <g clipPath={`url(#${id}-ann)`}>
        <TissueSection m={xsMap(0)} u0={640 - (Math.PI * XS.R) / XS.k} u1={640 + (Math.PI * XS.R) / XS.k} t={t} tone={tone} id={`${id}-ts`} epidermis={false} cellFilter={(c) => !(Math.abs(c.u - 640) * XS.k < nW + 30 && c.w * XS.k < nD + 20)} />
      </g>
      <path d={path(outer)} fill="none" stroke={C.cytoEdge} strokeWidth={2} opacity={0.6} />
      {/* the defect: narrow, shallow, inside the covering only */}
      {notch > 0 && <path d={smooth(notchPts, false, 0.12)} fill={`url(#${id}-notch)`} stroke={C.cytoEdge} strokeWidth={2.5} />}
    </g>
  );
};

// elevated 3/4 close-up of the graft landing. Cylinder of radius PR along x, camera elevation PE.
const PR = 260, PE = 0.62;
export const cyl2 = (x: number, phi: number, r = PR): Pt => ({x, y: -r * Math.cos(phi) * Math.cos(PE) + r * Math.sin(phi) * Math.sin(PE)});
export const PatchView2: React.FC<{id: string; drop: number; contact: number; settle: number; integrate?: number}> = ({id, drop, contact, settle, integrate = 0}) => {
  const silTop = cyl2(0, -Math.PI / 2 + PE).y, silBot = cyl2(0, Math.PI / 2 + PE).y;
  const slit = (h: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 20; i++) { const x = lerp(-150, 150, i / 20); pts.push(cyl2(x, -h * Math.pow(Math.sin((Math.PI * i) / 20), 0.8))); }
    for (let i = 20; i >= 0; i--) { const x = lerp(-150, 150, i / 20); pts.push(cyl2(x, h * Math.pow(Math.sin((Math.PI * i) / 20), 0.8))); }
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
    const ripple = settle * 5 * Math.sin(x * 6 + settle * 20) * (1 - Math.abs(v));
    const phi = v * V + 0.03 * Math.sin(x * 7 + v * 3);
    const on = cyl2(x * X, phi, PR + 3);
    const flat = {x: x * X, y: cyl2(x * X, 0, PR + 3).y + v * V * PR * Math.sin(PE)};
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
      {Array.from({length: 130}, (_, i) => { const p = cyl2(-1400 + rnd(i + 5) * 2800, -1.4 + rnd(i + 55) * 2.8); return <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#FFFFFF" opacity={0.25} />; })}
      {[-1, 1].map((sg) => [0, 1, 2].map((q) => { const x = sg * (720 + q * 26); return <path key={sg * 10 + q} d={smooth(Array.from({length: 9}, (_, i) => cyl2(x + 8 * Math.sin(i), -1.4 + i * 0.35)))} fill="none" stroke={FK.skinDeep} strokeWidth={4} opacity={0.3} />; }))}
      <path d={slit(0.075 * (1 - 0.6 * integrate))} fill={FK.skinDeep} />
      <path d={slit(0.05 * (1 - 0.6 * integrate))} fill={`url(#${id}-inner)`} />
      {/* shadow of the sheet tightens as it nears the surface */}
      <ellipse cx={30 * (1 - drop)} cy={cyl2(0, 0).y + 14} rx={230} ry={50 + 50 * (1 - drop)} fill="#5A2E2E" opacity={0.2 * drop * (1 - wet * 0.6)} />
      {/* the graft: translucent base, two crossing fibre sets, irregular edge; wetter where in contact */}
      <path d={smooth(sheet, true, 0.08)} fill={FK.patch} opacity={lerp(0.34, 0.22, wet)} />
      <g clipPath={`url(#${id}-sheet)`}>
        {Array.from({length: 13}, (_, k) => <path key={k} d={smooth(Array.from({length: 11}, (_, i) => gp(lerp(-1.1, 1.1, i / 10), -1.1 + k * 0.18 + 0.06 * Math.sin(i * 1.3 + k))))} fill="none" stroke="#FFFFFF" strokeWidth={1.8} opacity={0.5} />)}
        {Array.from({length: 16}, (_, k) => <path key={k} d={smooth(Array.from({length: 7}, (_, i) => gp(-1.1 + k * 0.15 + 0.05 * Math.sin(i * 1.7 + k), lerp(-1.1, 1.1, i / 6))))} fill="none" stroke="#E8F6F7" strokeWidth={1.3} opacity={0.4} />)}
        {/* wet contact zone behind the front: sheen streak along the curvature */}
        {wet > 0 && <path d={smooth(Array.from({length: 11}, (_, i) => gp(lerp(-1, Math.min(1, front), i / 10), -0.35)))} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.45 * wet} />}
      </g>
      <path d={smooth(sheet, true, 0.08)} fill="none" stroke={FK.patchEdge} strokeWidth={2.5} opacity={0.85} />
      {/* contact front */}
      {contact > 0 && contact < 1 && (() => { const a = gp(front, -1), b = gp(front, 1); return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />; })()}
    </g>
  );
};
export const graftEdge = (contact: number) => cyl2(-200, -0.1, PR + 3);

// a large, out-of-focus blade crossing in front of the lens (screen space): tool-driven wipe into the macro
export const ForegroundBlade: React.FC<{k: number}> = ({k}) => {
  if (k <= 0 || k >= 1) return null;
  // screen space: blade tip leads, dark handle follows; fully across the centre at k = 0.5
  const cx = lerp(2050, -1000, k), cy = lerp(700, 1050, k);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <defs><filter id="fgb" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={16} /></filter></defs>
      <g filter="url(#fgb)" transform={`translate(${cx} ${cy}) rotate(-16)`}>
        <path d="M-760 40 C -560 -170 -260 -300 120 -330 L 160 330 C -200 300 -520 220 -760 40 Z" fill="#B9C3CC" />
        <path d="M-640 10 C -470 -140 -230 -240 80 -262" fill="none" stroke="#F2F6F9" strokeWidth={40} opacity={0.8} />
        <rect x={120} y={-360} width={1500} height={720} rx={80} fill="#3E4851" />
        <rect x={200} y={-300} width={1300} height={90} rx={40} fill="#6D7984" opacity={0.7} />
      </g>
    </svg>
  );
};
