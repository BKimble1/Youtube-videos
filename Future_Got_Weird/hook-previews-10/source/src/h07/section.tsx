// HOOK 07 cut window: a local cutaway on the heart itself (same view, same deformation field). It opens from the
// aortic root and shows the Langendorff-style perfusion route of an ex vivo heart: bright oxygenated blood comes down
// the aortic connector, the closed aortic valve turns it into the coronary ostia, it runs through the coronary
// arteries and their intramural branches into the muscle wall (diastolic blush), and the darker venous blood returns
// through the great cardiac vein / coronary sinus into the right atrium and right ventricle (out via the pulmonary
// connector, outside the window).
import React from 'react';
import {clamp, closedPath, hash, sm, ss} from '../shared/lib';
import {INK} from '../shared/ink';
import {lit, mix, rgba, shade} from '../shared/color';
import {add, at, crSample, dot, lerpV, lineD, mul, norm, P, perp, polyLen, sub, T, tubeD, v, V} from './geom';
import {C, GCV, HS, LAD, LCX, RCA, Vessel} from './heart';
import {BEATS, coronaryFlow, FLOW_AORTA, FLOW_COR, PERFUSE, PERIOD, VENOUS} from './timeline';

// window outline (heart-local, before the reveal scale): it climbs the inside of the ascending aorta, takes in the
// left main coronary, then follows the ventricles just inside their outer surface
const WIN = T([
  [-79, -262], [-46, -270], [-13, -262], [-12, -200], [-8, -158], [22, -152], [46, -142], [50, -104], [52, -60],
  [56, -10], [64, 60], [76, 140], [86, 190], [58, 206], [10, 194], [-48, 174], [-96, 150], [-120, 116], [-128, 60],
  [-127, 0], [-118, -58], [-100, -100], [-82, -128], [-80, -196],
]);
const W0 = v(-44, -150); // reveal origin: the aortic root
const AO_C = T([[-40, -116], [-45, -190], [-46, -262], [-44, -290]]);
// unloaded ("empty-beating") left ventricle: a thick-walled slit under the aortic valve
const LV_CAV = T([
  [-74, -112], [-40, -116], [-8, -112], [4, -90], [16, -50], [30, 10], [48, 74], [62, 130], [68, 166], [58, 176],
  [42, 150], [22, 96], [0, 30], [-24, -26], [-48, -76], [-66, -100],
]);
const LV_A = v(-40, -104), LV_B = v(62, 172);
const RV_CAV = T([
  [-112, -74], [-100, -92], [-86, -88], [-76, -60], [-62, -10], [-44, 50], [-22, 110], [0, 160], [-6, 178], [-34, 172],
  [-66, 150], [-92, 112], [-108, 62], [-114, 0], [-116, -44],
]);
const RV_O = v(-70, 60);
const PAP = [T([[-80, 110], [-70, 96], [-58, 92], [-56, 102], [-66, 112]])];

// flow routes (heart-local)
const AO_DOWN = T([[-46, -300], [-46, -262], [-45, -200], [-42, -160], [-40, -140]]);
const R_LM = crSample([...AO_DOWN, ...T([[-26, -136], [-10, -136], [16, -134], [44, -130], [58, -128]]), ...LAD.slice(1)], 6);
const R_CX = crSample([...AO_DOWN, ...T([[-26, -136], [-10, -136], [16, -134], [44, -130], [62, -130]]), ...LCX.slice(1)], 6);
const R_RCA = crSample([...AO_DOWN, ...T([[-56, -138], [-72, -136], [-90, -126]]), ...RCA.slice(1)], 6);
const OST = polyLen(crSample(AO_DOWN, 6)); // arc length where the routes leave the aorta
const R_GCV = crSample(GCV, 6);
const R_RV = crSample(T([[-100, 60], [-80, 120], [-40, 160], [-12, 150], [-40, 80], [-64, 10], [-84, -50], [-96, -84]]), 6);
const SURF = [LAD, LCX, RCA, T([[66, -42], [104, -14], [140, 26], [162, 58]]), T([[82, 64], [114, 102], [140, 150]]), T([[-142, 100], [-110, 142], [-62, 170], [-22, 184]])].map((r) => crSample(r, 6));

// intramural branches: from the surface arteries into the wall
type Br = {pts: V[]; root: number; w: number};
const branches = (main: V[], side: number, every: number, seed: number, lenK = 1): Br[] => {
  const d = crSample(main, 6);
  const L = polyLen(d);
  const out: Br[] = [];
  let k = 0;
  for (let s = 24; s < L - 16; s += every) {
    const {p, d: dir} = at(d, s);
    const sd = side !== 0 ? side : k % 2 === 0 ? 1 : -1;
    const h = hash(seed * 31 + k);
    const n = mul(perp(dir), sd);
    const L1 = (34 + 30 * h) * lenK;
    const a = add(p, add(mul(n, L1 * 0.5), mul(dir, L1 * 0.22)));
    const b = add(p, add(mul(n, L1), mul(dir, L1 * (0.1 + 0.3 * h))));
    out.push({pts: crSample([p, a, b], 5), root: s, w: 3.4});
    const fk = add(a, add(mul(n, L1 * 0.32), mul(dir, -L1 * 0.4)));
    out.push({pts: crSample([a, lerpV(a, fk, 0.5), fk], 4), root: s + L1 * 0.5, w: 2.4});
    k++;
  }
  return out;
};
const BR: Br[] = [
  ...branches(LAD.slice(1), 1, 24, 1, 1.25),
  ...branches(RCA.slice(1), -1, 26, 3, 0.75),
  ...branches(T([[-12, -137], [16, -134], [44, -130]]), 1, 22, 5, 0.7),
];

// cumulative flow integral (diastole-weighted), sampled once
const FDT = 1 / 240;
const FCUM: number[] = (() => {
  const out = [0];
  for (let i = 1; i <= 6.2 / FDT; i++) out.push(out[i - 1] + coronaryFlow((i - 0.5) * FDT) * FDT);
  return out;
})();
const Fint = (t: number) => {
  const x = clamp(t / FDT, 0, FCUM.length - 1.001);
  const i = Math.floor(x);
  return FCUM[i] + (FCUM[i + 1] - FCUM[i]) * (x - i);
};

type Pt = {p: V; r: number; c: string; rim: string; a: number; dir: V};
const stream = (route: V[], t: number, t0: number, speed: number, spacing: number, phase: number, fn: (s: number, i: number) => Omit<Pt, 'p' | 'dir'> & {off?: number}): Pt[] => {
  if (t < t0) return [];
  const L = polyLen(route);
  const head = (Fint(t) - Fint(t0)) * speed + phase;
  const out: Pt[] = [];
  const i0 = Math.max(0, Math.floor((head - L) / spacing));
  const i1 = Math.floor(head / spacing);
  for (let i = i0; i <= i1; i++) {
    const s = head - i * spacing;
    if (s < 0 || s > L) continue;
    const {p, d} = at(route, s);
    const f = fn(s, i);
    out.push({...f, p: f.off ? add(p, mul(perp(d), f.off)) : p, dir: d});
  }
  return out;
};

const Cell: React.FC<{q: Pt}> = ({q}) => {
  const ang = (Math.atan2(q.dir.y, q.dir.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${P(q.p)}) rotate(${ang.toFixed(1)})`} opacity={q.a}>
      <ellipse rx={q.r * 1.25} ry={q.r} fill={q.c} stroke={q.rim} strokeWidth={Math.max(0.8, q.r * 0.3)} />
      <ellipse rx={q.r * 0.55} ry={q.r * 0.4} fill={lit(q.c, 0.35)} opacity={0.8} />
    </g>
  );
};

export const winPath = (D: (p: V) => V, r: number) => closedPath(WIN.map((p) => D(add(W0, mul(sub(p, W0), r)))), 0.75);

const artCell = (rr: number, a: number) => (sArc: number, i: number) => {
  const inAo = clamp((OST - sArc) / 30);
  return {r: 2.6 + (rr - 2.6) * inAo, c: '#FF5A4E', rim: '#9E0F1E', a, off: (hash(i * 7.3 + rr) - 0.5) * 40 * inAo};
};
const ART_T0 = FLOW_AORTA - 0.45;

/** cells flowing in the surface coronaries (outside the window too), while the cutaway is on screen */
export const SurfaceFlow: React.FC<{st: HS; D: (p: V) => V; a: number}> = ({st, D, a}) => {
  if (a <= 0.01) return null;
  const t = st.t;
  const cells: Pt[] = [];
  SURF.forEach((r, k) => {
    stream(r, t, FLOW_COR - 0.1 + k * 0.08, 300, 20, k * 7, () => ({r: 2.4, c: '#FF6A5C', rim: '#9E0F1E', a})).forEach((q) => cells.push({...q, p: D(q.p)}));
  });
  stream(R_GCV, t, VENOUS - 0.5, 200, 18, 0, () => ({r: 2.3, c: '#9A3A66', rim: '#3A0A22', a: a * ss(t, VENOUS - 0.1, VENOUS + 0.3)})).forEach((q) => cells.push({...q, p: D(q.p)}));
  return (
    <g>
      {cells.map((q, i) => (
        <Cell key={i} q={q} />
      ))}
    </g>
  );
};

export const Section: React.FC<{st: HS; D: (p: V) => V; r: number}> = ({st, D, r}) => {
  if (r <= 0.002) return null;
  const t = st.t;
  const s = Math.max(0, st.s);
  const wd = winPath(D, r);
  const lv = (pts: V[]) => pts.map(D);
  // the LV cavity squeezes much harder than the outer wall: the wall visibly thickens in systole
  const ax = norm(sub(LV_B, LV_A));
  const cav = (pts: V[], k: number) =>
    pts.map((p) => {
      const pr = add(LV_A, mul(ax, dot(sub(p, LV_A), ax)));
      return D(lerpV(p, pr, k * s));
    });
  const lvD = closedPath(cav(LV_CAV, 0.55), 0.9);
  const rvC = RV_CAV.map((p) => lerpV(p, RV_O, 0.16 * s));
  const rvD = closedPath(lv(rvC), 0.9);
  const lvC = D(v(-10, 40));
  // perfusion blush: each diastole a bright wave spreads from the arteries into the muscle
  const last = BEATS.filter((b) => b <= t).pop() ?? BEATS[0] - PERIOD;
  const ph = clamp((t - last - 0.3) / (PERIOD - 0.1));
  const perfOn = ss(t, PERFUSE - 0.15, PERFUSE + 0.35);
  const blush = perfOn * (0.4 + 0.6 * Math.sin(Math.PI * ph) * (1 - 0.6 * s));
  const blushR = 40 + 70 * sm(ph);
  const fa = ss(t, FLOW_AORTA - 0.2, FLOW_AORTA + 0.2);
  const cells: Pt[] = [
    ...stream(R_LM, t, ART_T0, 330, 22, 0, artCell(4.8, fa)),
    ...stream(R_CX, t, ART_T0, 330, 30, 11, artCell(4.6, fa)),
    ...stream(R_RCA, t, ART_T0, 330, 24, 6, artCell(4.7, fa)),
  ].map((q) => ({...q, p: D(q.p)}));
  const brCells: Pt[] = [];
  BR.forEach((b, k) => {
    stream(b.pts, t, PERFUSE - 0.25 + (k % 5) * 0.04, 110, 15, hash(k) * 15, () => ({r: 2.5, c: '#FF8A76', rim: '#A01828', a: 1})).forEach((q) => brCells.push({...q, p: D(q.p)}));
  });
  const venA = ss(t, VENOUS - 0.1, VENOUS + 0.3);
  const ven: Pt[] = stream(R_RV, t, VENOUS - 0.2, 150, 26, 0, (sa, i) => ({r: 3.6, c: '#9A2A48', rim: '#3D0A1C', a: venA * clamp(1 - (sa - 360) / 80) * clamp(sa / 30), off: (hash(i * 3.1) - 0.5) * 18})).map((q) => ({...q, p: D(q.p)}));
  // aorta inside: wall, lumen, cusps (closed under the perfusion pressure), ostia
  const aoC = crSample(lv(AO_C), 8);
  const pr = 1 + 0.035 * st.pr;
  const wallD = tubeD(aoC, (u) => 37 * pr * (1 + 0.06 * (1 - u)), false, false);
  const lumD = tubeD(aoC, (u) => 30 * pr * (1 + 0.12 * (1 - u)), false, false);
  const cuspBulge = 5 + 4 * st.pr;
  const cusp = (a: V, b: V, m: V) => {
    const A = D(a), Bp = D(b), M = D(m);
    const lo = add(lerpV(A, Bp, 0.5), v(0, cuspBulge + 8));
    return `M${P(A)} Q${P(add(lo, v(0, 4)))} ${P(Bp)} L${P(add(Bp, v(0, -5)))} Q${P(add(M, v(0, -6)))} ${P(add(A, v(0, -5)))}Z`;
  };
  const ostL = D(v(-14, -137)), ostR = D(v(-70, -138));
  const fib = (k: number) => closedPath(cav(LV_CAV, 0.55 * (1 - (k - 1) / 1.6)).map((p) => add(lvC, mul(sub(p, lvC), k))), 0.9);
  return (
    <g>
      <defs>
        <clipPath id="h07-win">
          <path d={wd} />
        </clipPath>
        <radialGradient id="h07-cut" gradientUnits="userSpaceOnUse" cx={lvC.x - 50} cy={lvC.y - 90} r={250}>
          <stop offset="0" stopColor={lit('#C84D58', 0.22)} />
          <stop offset="0.6" stopColor="#B83E4C" />
          <stop offset="1" stopColor={shade('#B83E4C', 0.3)} />
        </radialGradient>
        <linearGradient id="h07-cav" gradientUnits="userSpaceOnUse" x1={-60} y1={-100} x2={60} y2={170}>
          <stop offset="0" stopColor="#5C1A2E" />
          <stop offset="1" stopColor="#3A0E1E" />
        </linearGradient>
        <linearGradient id="h07-lum" gradientUnits="userSpaceOnUse" x1={-80} y1={0} x2={-5} y2={0}>
          <stop offset="0" stopColor="#F2524E" />
          <stop offset="0.45" stopColor="#E1252F" />
          <stop offset="1" stopColor="#A5121F" />
        </linearGradient>
        <radialGradient id="h07-blush">
          <stop offset="0" stopColor="#FF7A70" stopOpacity={0.9} />
          <stop offset="0.6" stopColor="#FF5E5E" stopOpacity={0.35} />
          <stop offset="1" stopColor="#FF5A5A" stopOpacity={0} />
        </radialGradient>
        <filter id="h07-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g clipPath="url(#h07-win)">
        {/* cut myocardium with its fibre layers */}
        <path d={wd} fill="url(#h07-cut)" />
        <g fill="none" stroke="#7A1C30" strokeWidth={1.6} opacity={0.34}>
          {[1.35, 1.75, 2.2, 2.7, 3.3, 4.0].map((k) => (
            <path key={k} d={fib(k)} />
          ))}
          {[1.12, 1.24].map((k) => (
            <path key={k} d={closedPath(lv(rvC.map((p) => add(RV_O, mul(sub(p, RV_O), k)))), 0.9)} />
          ))}
        </g>
        {/* intramural arteries (septal perforators from the LAD, right-ventricular branches from the RCA) */}
        <g fill="none" strokeLinecap="round">
          {BR.map((b, i) => (
            <path key={i} d={lineD(lv(b.pts))} stroke="#E8303C" strokeWidth={b.w} opacity={0.95} />
          ))}
        </g>
        {brCells.map((q, i) => (
          <Cell key={i} q={q} />
        ))}
        {blush > 0.01 &&
          [v(40, 20), v(-110, 40), v(20, 130), v(-30, -60), v(-70, 150), v(30, -110)].map((c, i) => {
            const q = D(c);
            return <ellipse key={i} cx={q.x} cy={q.y} rx={blushR} ry={blushR * 1.15} fill="url(#h07-blush)" opacity={blush} />;
          })}
        {/* chambers: thin-walled right ventricle, thick-walled unloaded left ventricle */}
        <path d={rvD} fill="url(#h07-cav)" stroke="#EBA6A8" strokeWidth={3} />
        <path d={rvD} fill="none" stroke="#2A0812" strokeWidth={10} opacity={0.25} filter="url(#h07-soft)" />
        <path d={lvD} fill="url(#h07-cav)" stroke="#EBA6A8" strokeWidth={3.2} />
        {PAP.map((pp, i) => (
          <path key={i} d={closedPath(lv(pp), 0.8)} fill="#B23E4C" stroke="#EBA6A8" strokeWidth={2} />
        ))}
        {ven.map((q, i) => (
          <Cell key={i} q={q} />
        ))}
        {/* aortic root: wall, lumen, closed cusps, coronary ostia */}
        <path d={wallD} fill="#F2CDBD" stroke={INK} strokeWidth={1.4} />
        <path d={lumD} fill="url(#h07-lum)" />
        {/* three closed cusps: the posterior one behind, the left and right in front, meeting in the middle */}
        <path d={cusp(v(-60, -134), v(-22, -134), v(-41, -150))} fill="#E2BFB2" stroke="#9C6E66" strokeWidth={1.4} />
        <path d={cusp(v(-74, -138), v(-41, -128), v(-58, -146))} fill="#F8E2D6" stroke="#9C6E66" strokeWidth={1.6} />
        <path d={cusp(v(-41, -128), v(-7, -138), v(-24, -146))} fill="#F8E2D6" stroke="#9C6E66" strokeWidth={1.6} />
        <ellipse cx={ostL.x} cy={ostL.y} rx={6} ry={7.5} fill="#8E0E1C" stroke={INK} strokeWidth={1.2} />
        <ellipse cx={ostR.x} cy={ostR.y} rx={6} ry={7.5} fill="#8E0E1C" stroke={INK} strokeWidth={1.2} />
        <Vessel pts={lv(T([[-12, -137], [16, -134], [44, -130], [62, -128]]))} r={5.6} c={C.art} taper={0.1} />
        <Vessel pts={lv(T([[-72, -137], [-90, -127], [-112, -110]]))} r={5.4} c={C.art} taper={0.1} />
        {cells.map((q, i) => (
          <Cell key={i} q={q} />
        ))}
        <path d={wd} fill="none" stroke="#2A0812" strokeWidth={22} opacity={0.32} filter="url(#h07-soft)" />
      </g>
      {/* cut rim */}
      <path d={wd} fill="none" stroke={lit(C.myo, 0.5)} strokeWidth={6} opacity={0.9} />
      <path d={wd} fill="none" stroke={INK} strokeWidth={2.4} />
    </g>
  );
};
