// HOOK 07 heart: anterior view of an explanted human heart (patient's right on the viewer's left, apex low on the
// viewer's right), in heart-local units. Every part is a list of points pushed through one deformation field per
// frame (ventricular systole: the apex rises toward the fixed base, the walls squeeze and the apex wrings slightly;
// atrial kick; perfusion-pressure pulse in the great vessels; a small sway on the aortic connector).
import React from 'react';
import {clamp, closedPath, sm} from '../shared/lib';
import {INK} from '../shared/ink';
import {lit, mix, rgba, shade} from '../shared/color';
import {add, crSample, dot, len, lerpV, lineD, mul, norm, P, perp, rotAbout, sub, T, tubeD, v, V} from './geom';

export type HS = {t: number; s: number; a: number; pr: number; sway: number};

// ---------------- palette ----------------
export const C = {
  myo: '#BE4650', atr: '#A43B55', fat: '#EDCB7C', art: '#E3303A', artL: '#FF7C6E', ven: '#7C1C38', vein: '#5E2B5E',
  aorta: '#E7B8A6', pt: '#DFA6A5', svc: '#B98798', tie: '#F3F0E8', plast: '#D9EEF4',
};

// ---------------- geometry (heart-local) ----------------
const B0 = v(-25, -125); // base anchor (middle of the AV plane)
const APEX = v(112, 240);
const AX = norm(sub(APEX, B0));
const NX = perp(AX);
const LAX = len(sub(APEX, B0));
const RAc = v(-195, 10);
export const ANCH = v(-38, -318); // aortic connector: the heart hangs here

export const VENT = T([
  [-122, -118], [-70, -140], [-20, -150], [40, -148], [95, -128], [148, -86], [182, -18], [192, 62], [178, 140],
  [148, 200], [116, 238], [84, 247], [30, 229], [-40, 205], [-100, 177], [-146, 139], [-162, 70], [-158, 0], [-145, -70],
]);
const RA = T([
  [-150, -150], [-112, -112], [-100, -30], [-104, 60], [-122, 142], [-170, 174], [-222, 162], [-258, 110], [-272, 30],
  [-266, -50], [-238, -120], [-195, -158],
]);
const RAUR = T([
  [-206, -148], [-176, -196], [-128, -216], [-84, -210], [-66, -192], [-74, -180], [-86, -176], [-92, -166], [-104, -164],
  [-112, -154], [-126, -152], [-138, -144], [-160, -142],
]);
const LAUR = T([
  [80, -140], [92, -172], [124, -188], [156, -176], [172, -150], [166, -128], [150, -132], [140, -118], [124, -122],
  [110, -112], [94, -122],
]);
const AORTA = T([[-40, -112], [-45, -190], [-46, -262], [-38, -318]]);
const PT = T([[20, -108], [32, -165], [50, -218], [70, -262]]);
const SVC = T([[-204, -132], [-207, -180], [-205, -226]]);
// coronary arteries in their grooves
export const LAD = T([[58, -128], [62, -80], [68, -10], [80, 70], [96, 150], [108, 208], [112, 234]]);
export const LCX = T([[62, -130], [100, -116], [140, -92], [172, -52], [188, -10]]);
export const RCA = T([[-82, -128], [-112, -110], [-130, -60], [-140, 0], [-145, 60], [-140, 120], [-118, 160], [-80, 187]]);
const DIAG1 = T([[66, -42], [104, -14], [140, 26], [162, 58]]);
const DIAG2 = T([[82, 64], [114, 102], [140, 150]]);
const AMARG = T([[-142, 100], [-110, 142], [-62, 170], [-22, 184]]);
const RVBR = T([[-136, -22], [-104, 6], [-74, 34]]);
export const GCV = T([[118, 212], [108, 150], [92, 70], [81, -10], [75, -80], [72, -126]]);
const FAT_AV = T([[-116, -132], [-128, -62], [-138, 0], [-143, 70], [-136, 132], [-110, 172], [-70, 194]]);
const FAT_IV = T([[52, -136], [60, -72], [70, 0], [84, 80], [100, 160], [110, 214]]);
const FAT_CX = T([[66, -128], [118, -108], [160, -74]]);
// cannulas (local ends at the chamber ports)
export const AO_PORT = v(-30, -446);
export const PA_PORT = v(174, -416);
export const PA_CAN = T([[72, -268], [92, -306], [124, -356], [174, -416]]);
export const ECG_PADS = [v(-214, 64), v(158, 52)];

// ---------------- deformation ----------------
export const deform = (st: HS) => (p: V): V => {
  const gx = -118 + (-148 + 118) * clamp((p.y + 120) / 290);
  const wV = sm((p.x - gx) / 44 + 0.5) * sm((p.y + 135) / 40 + 0.5);
  let q = p;
  if (wV > 0) {
    const r = sub(p, B0);
    const u = dot(r, AX), w = dot(r, NX);
    const uu = u > 0 ? u * (1 - 0.12 * st.s) : u;
    const ww = w * (1 - 0.1 * st.s * sm(u / 150));
    let pv = add(B0, add(mul(AX, uu), mul(NX, ww)));
    pv = rotAbout(pv, B0, 0.07 * st.s * clamp(u / LAX));
    q = lerpV(p, pv, wV);
  }
  const wA = (1 - wV) * sm((-100 - p.x) / 30 + 0.5);
  if (wA > 0) {
    const k = 1 - 0.05 * st.a + 0.03 * Math.max(0, st.s);
    q = lerpV(q, add(RAc, mul(sub(q, RAc), k)), wA);
  }
  return rotAbout(q, ANCH, st.sway * sm((q.y - ANCH.y) / 90));
};
const mapD = (pts: V[], D: (p: V) => V) => pts.map(D);

// ---------------- drawing helpers ----------------
export const grad = (id: string, c: string, cx: number, cy: number, r: number, k = 1) => (
  <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r} fx={cx - r * 0.28} fy={cy - r * 0.34}>
    <stop offset="0" stopColor={lit(c, 0.42 * k)} />
    <stop offset="0.3" stopColor={lit(c, 0.14 * k)} />
    <stop offset="0.62" stopColor={c} />
    <stop offset="0.88" stopColor={shade(c, 0.42 * k)} />
    <stop offset="1" stopColor={shade(c, 0.55 * k)} />
  </radialGradient>
);
const linGrad = (id: string, c: string, a: V, b: V, k = 1) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
    <stop offset="0" stopColor={lit(c, 0.36 * k)} />
    <stop offset="0.28" stopColor={lit(c, 0.1 * k)} />
    <stop offset="0.6" stopColor={c} />
    <stop offset="0.9" stopColor={shade(c, 0.4 * k)} />
    <stop offset="1" stopColor={shade(c, 0.3 * k)} />
  </linearGradient>
);
const SW = 2.6; // ink width (local units)

/** a vessel on the surface: ink, colour, highlight */
export const Vessel: React.FC<{pts: V[]; r: number; c: string; hi?: string; op?: number; taper?: number}> = ({pts, r, c, hi, op = 1, taper = 0.55}) => {
  const d = crSample(pts, 6);
  const out = tubeD(d, (u) => r * (1 - taper * u), true, false);
  return (
    <g opacity={op}>
      <path d={out} fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={lineD(d)} fill="none" stroke={hi ?? lit(c, 0.45)} strokeWidth={r * 0.55} strokeLinecap="round" transform={`translate(${-r * 0.28},${-r * 0.32})`} opacity={0.75} />
    </g>
  );
};
const FatStrip: React.FC<{pts: V[]; w: number; seed: number}> = ({pts, w, seed}) => {
  const d = crSample(pts, 6);
  const blobs = d.filter((_, i) => i % 3 === 0).map((p, i) => {
    const a = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const h = a - Math.floor(a);
    return {p: add(p, v((h - 0.5) * w * 0.5, (((h * 7) % 1) - 0.5) * w * 0.4)), r: w * (0.32 + 0.25 * h)};
  });
  return (
    <g>
      <path d={lineD(d)} fill="none" stroke={shade(C.fat, 0.35)} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
      <path d={lineD(d)} fill="none" stroke={C.fat} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
      {blobs.map((b, i) => (
        <circle key={i} cx={b.p.x} cy={b.p.y} r={b.r} fill={lit(C.fat, 0.3)} opacity={0.7} />
      ))}
      <path d={lineD(d)} fill="none" stroke={lit(C.fat, 0.6)} strokeWidth={w * 0.28} strokeLinecap="round" transform={`translate(${-w * 0.18},${-w * 0.2})`} opacity={0.7} />
    </g>
  );
};

/** the aortic / pulmonary connectors: rigid clear cannula with blood inside, a collar and a tie band on the vessel */
const Cannula: React.FC<{pts: V[]; r: number; blood: string; flowT: number; dir?: 1 | -1}> = ({pts, r, blood, flowT, dir = 1}) => {
  const d = crSample(pts, 8);
  const dd = lineD(d);
  return (
    <g>
      <path d={dd} fill="none" stroke={INK} strokeWidth={2 * r + 3.4} strokeLinecap="butt" />
      <path d={dd} fill="none" stroke={rgba(C.plast, 0.92)} strokeWidth={2 * r} strokeLinecap="butt" />
      <path d={dd} fill="none" stroke={blood} strokeWidth={2 * r * 0.66} strokeLinecap="butt" />
      <path d={dd} fill="none" stroke={shade(blood, 0.35)} strokeWidth={2 * r * 0.66} strokeLinecap="butt" strokeDasharray={`${r * 0.9} ${r * 2.6}`} strokeDashoffset={-dir * flowT * 160} opacity={0.5} />
      <path d={dd} fill="none" stroke={lit(blood, 0.4)} strokeWidth={r * 0.3} strokeLinecap="butt" transform={`translate(${-r * 0.22},${-r * 0.2})`} opacity={0.7} />
      <path d={dd} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.22} strokeLinecap="butt" transform={`translate(${-r * 0.7},${-r * 0.3})`} opacity={0.75} />
    </g>
  );
};
/** a tie band around a vessel at point c, across direction dir */
const Tie: React.FC<{c: V; dir: V; r: number}> = ({c, dir, r}) => {
  const n = perp(dir);
  const a = add(c, mul(n, r + 3)), b = add(c, mul(n, -r - 3));
  const mid = add(c, mul(dir, -4));
  return (
    <g>
      <path d={`M${P(a)} Q${P(add(mid, mul(dir, -3)))} ${P(b)}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${P(a)} Q${P(add(mid, mul(dir, -3)))} ${P(b)}`} fill="none" stroke={C.tie} strokeWidth={6.4} strokeLinecap="round" />
      <path d={`M${P(a)} Q${P(add(mid, mul(dir, -3)))} ${P(b)}`} fill="none" stroke={shade(C.tie, 0.4)} strokeWidth={1.4} strokeLinecap="round" transform="translate(1,2)" opacity={0.6} />
    </g>
  );
};

/** cut end of a vessel: an ellipse rim (the connector sits inside it) */
const CutEnd: React.FC<{c: V; dir: V; r: number; col: string}> = ({c, dir, r, col}) => {
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI + 90;
  return (
    <g transform={`rotate(${ang.toFixed(2)} ${c.x.toFixed(2)} ${c.y.toFixed(2)})`}>
      <ellipse cx={c.x} cy={c.y} rx={r} ry={r * 0.28} fill={lit(col, 0.3)} stroke={INK} strokeWidth={SW * 0.8} />
      <ellipse cx={c.x} cy={c.y + 1} rx={r * 0.72} ry={r * 0.18} fill={shade(col, 0.3)} />
    </g>
  );
};

// ---------------- exterior ----------------
export const HeartExterior: React.FC<{st: HS; D: (p: V) => V}> = ({st, D}) => {
  const ventD = closedPath(mapD(VENT, D), 1);
  const raD = closedPath(mapD(RA, D), 1);
  const rauD = closedPath(mapD(RAUR, D), 0.8);
  const lc = v(126, -150);
  const lk = 1 - 0.07 * st.a + 0.03 * Math.max(0, st.s);
  const lauD = closedPath(mapD(LAUR.map((p) => add(lc, mul(sub(p, lc), lk))), D), 0.8);
  const pr = 1 + 0.035 * st.pr;
  // vessels
  const aoC = crSample(mapD(AORTA, D), 8);
  const aoD = tubeD(aoC, (u) => 38 * pr * (1 + 0.06 * (1 - u)), false, false);
  const ptC = crSample(mapD(PT, D), 8);
  const ptD = tubeD(ptC, (u) => 34 - 3 * u, false, false);
  const svcC = crSample(mapD(SVC, D), 6);
  const svcD = tubeD(svcC, () => 29, true, false);
  const aoTop = aoC[aoC.length - 1], aoDir = norm(sub(aoC[aoC.length - 1], aoC[aoC.length - 3]));
  const ptTop = ptC[ptC.length - 1], ptDir = norm(sub(ptC[ptC.length - 1], ptC[ptC.length - 3]));
  const lv = (pts: V[]) => mapD(pts, D);
  const ctr = D(v(0, 30));
  const surfHi = closedPath(mapD(T([[-120, -96], [-60, -126], [10, -128], [-10, -96], [-70, -60], [-112, -20]]), D), 1);
  return (
    <g>
      <defs>
        {grad('h07-vent', C.myo, ctr.x - 40, ctr.y - 50, 300)}
        {grad('h07-ra', C.atr, -190, -20, 190)}
        {grad('h07-aur', C.atr, -130, -200, 110, 0.9)}
        {grad('h07-laur', C.atr, 120, -170, 80, 0.9)}
        {linGrad('h07-ao', C.aorta, v(-90, -200), v(4, -180))}
        {linGrad('h07-pt', C.pt, v(-6, -190), v(80, -160))}
        {linGrad('h07-svc', C.svc, v(-240, -200), v(-176, -190))}
        <linearGradient id="h07-ventsh" gradientUnits="userSpaceOnUse" x1={-60} y1={-90} x2={170} y2={230}>
          <stop offset="0.45" stopColor={rgba(shade(C.myo, 0.9), 0)} />
          <stop offset="1" stopColor={rgba(shade(C.myo, 0.9), 0.55)} />
        </linearGradient>
        <linearGradient id="h07-rimg" gradientUnits="userSpaceOnUse" x1={-130} y1={-130} x2={170} y2={230}>
          <stop offset="0" stopColor="#FFE6DA" stopOpacity={0.35} />
          <stop offset="0.3" stopColor="#FFE6DA" stopOpacity={0} />
          <stop offset="0.55" stopColor="#3A0820" stopOpacity={0} />
          <stop offset="1" stopColor="#3A0820" stopOpacity={0.85} />
        </linearGradient>
        <clipPath id="h07-vclip">
          <path d={ventD} />
        </clipPath>
        <clipPath id="h07-raclip">
          <path d={raD} />
        </clipPath>
        <filter id="h07-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <radialGradient id="h07-sheen" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6EA" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFF6EA" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* behind: SVC stump (tied), right atrium, left auricle */}
      <path d={svcD} fill="url(#h07-svc)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Tie c={svcC[svcC.length - 6]} dir={norm(sub(svcC[svcC.length - 1], svcC[svcC.length - 6]))} r={29} />
      <path d={raD} fill="url(#h07-ra)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <g clipPath="url(#h07-raclip)">
        <path d={raD} fill="none" stroke="#2E0618" strokeWidth={46} opacity={0.45} filter="url(#h07-blur)" transform="translate(-8,10)" />
      </g>
      <path d={aoD} fill="url(#h07-ao)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <CutEnd c={aoTop} dir={aoDir} r={38 * pr} col={C.aorta} />
      {/* ventricles */}
      <path d={ventD} fill="url(#h07-vent)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={ventD} fill="url(#h07-ventsh)" />
      <g clipPath="url(#h07-vclip)">
        <path d={ventD} fill="none" stroke="url(#h07-rimg)" strokeWidth={64} filter="url(#h07-blur)" />
      </g>
      {/* faint myocardial fibre direction (helical) */}
      <g fill="none" stroke={shade(C.myo, 0.6)} strokeWidth={1.4} opacity={0.16} strokeLinecap="round">
        {[
          [[-140, -40], [-80, 0], [-10, 60], [50, 130], [90, 200]],
          [[-130, 30], [-70, 70], [0, 120], [50, 190]],
          [[-110, -90], [-50, -50], [20, 10], [100, 80], [150, 150]],
          [[-60, -120], [10, -80], [90, -30], [160, 40]],
          [[30, -130], [110, -80], [170, 0]],
          [[-120, 110], [-60, 150], [0, 190]],
        ].map((pts, i) => (
          <path key={i} d={lineD(crSample(lv(T(pts as [number, number][])), 6))} />
        ))}
      </g>
      {/* grooves: epicardial fat, then the coronary vessels */}
      <FatStrip pts={lv(FAT_AV)} w={24} seed={1} />
      <FatStrip pts={lv(FAT_IV)} w={21} seed={2} />
      <FatStrip pts={lv(FAT_CX)} w={18} seed={3} />
      <Vessel pts={lv(GCV)} r={3.6} c={C.vein} taper={-0.3} />
      <Vessel pts={lv(RVBR)} r={3} c={C.art} />
      <Vessel pts={lv(AMARG)} r={3.4} c={C.art} />
      <Vessel pts={lv(DIAG1)} r={3.6} c={C.art} />
      <Vessel pts={lv(DIAG2)} r={3.1} c={C.art} />
      <Vessel pts={lv(LCX)} r={4.6} c={C.art} taper={0.3} />
      <Vessel pts={lv(RCA)} r={5.2} c={C.art} taper={0.4} />
      <Vessel pts={lv(LAD)} r={5.4} c={C.art} taper={0.5} />
      {/* wet sheen on the lit side */}
      <path d={surfHi} fill="url(#h07-sheen)" opacity={0.75} />
      <path d={lineD(crSample(lv(T([[-150, -40], [-138, -94], [-100, -128], [-40, -146]])), 6))} fill="none" stroke="#FFF6EA" strokeWidth={4} strokeLinecap="round" opacity={0.42} />
      <path d={lineD(crSample(lv(T([[60, -136], [110, -120], [150, -90]])), 6))} fill="none" stroke="#FFF6EA" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      {/* auricles and the pulmonary trunk sit in front of the base */}
      <path d={lauD} fill="url(#h07-laur)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={lineD(crSample(lv(T([[96, -150], [120, -162], [150, -156]])), 5))} fill="none" stroke={shade(C.atr, 0.5)} strokeWidth={1.6} opacity={0.6} />
      <path d={ptD} fill="url(#h07-pt)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <CutEnd c={ptTop} dir={ptDir} r={31} col={C.pt} />
      <path d={rauD} fill="url(#h07-aur)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={lineD(crSample(lv(T([[-180, -170], [-140, -190], [-100, -192]])), 5))} fill="none" stroke={shade(C.atr, 0.5)} strokeWidth={1.6} opacity={0.6} />
      <path d={lineD(crSample(lv(T([[-170, -182], [-130, -204], [-92, -202]])), 5))} fill="none" stroke={lit(C.atr, 0.5)} strokeWidth={2.4} opacity={0.5} />
      {/* connectors */}
      <Cannula pts={[add(aoTop, mul(aoDir, -14)), add(aoTop, mul(aoDir, 30)), AO_PORT]} r={22} blood={C.art} flowT={st.t} />
      <Tie c={add(aoTop, mul(aoDir, -16))} dir={aoDir} r={38 * pr} />
      <Cannula pts={[add(ptTop, mul(ptDir, -12)), ...lv(PA_CAN).slice(1, 3), PA_PORT]} r={19} blood={C.ven} flowT={st.t} />
      <Tie c={add(ptTop, mul(ptDir, -14))} dir={ptDir} r={31} />
    </g>
  );
};
