// SEQUENCE C (63.9 – 97.7 s): a scan reads the tumour cells and sketches what they might do next; pull back to the
// patient, who becomes a digital twin; scans, a biopsy and sequencing data feed it; dive into the reconstructed tumour
// on its simulation floor; it branches into treatment simulations with uncertain predicted responses; the analysis
// searches one branch down to a weak protein; then five different patients, one generic drug, and a plan built for
// this one person.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, closedPath, openPath} from '../../kit/core';
import {Shot} from '../director';
import {T, TE} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {Body, SITE} from '../art/body';
import {cellAt, nearest, R, SP, boundary} from '../art/tissue';
import {AIBack, SeqStrip, CTSlice, BiopsyCore} from '../art/ai';
import {Protein, POCKET} from '../art/protein';
import {C0P} from './A';
import {EvolveB, EVOLVE_CAM, RtB} from './B';

const tC = {
  predict: T('But what if we could predict'), next: T('do next?'), ai: T('This is where artificial intelligence'), imagine: T("Imagine taking a patient's"),
  scans: T('medical scans,'), samples: T('tumor samples,'), genetic: T('genetic information,'), using: T('and using AI'), copy: T('detailed digital copy'),
  battle: T('virtual battlefield.'), inside: T('Inside that simulation,'), test: T('test treatment strategies,'), predict2: T('predict how the tumor'),
  game: T('changes the game.'), cancer: T('of their cancer'), which: T('which would create'), create: T('create a virtual'), virtual: T('virtual battlefield.'),
  search: T('search for its weaknesses'), choosing: T('before choosing how to attack'), instead: T('Instead of treating every cancer'),
  designed: T('the treatment could be designed'), exact: T('the exact tumor growing'), person: TE('inside that person.'), but: T('But identifying the weakness'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = {x: C0P[0], y: C0P[1]};

// ------------------------------------------------------------------------------------------------ cameras
// The tumour's own silhouette carries the whole section: the scan reads it, the measured contour is traced on it, and
// the model is built in that same outline, at the same place and size on screen (anchor C0 ↔ model origin).
const HOLD = tC.predict + 0.6; // B's evolution camera comes to rest here
const TZ = 0.15;
const TS = path([
  {...EVOLVE_CAM(HOLD), t: HOLD},
  {t: tC.next + 0.1, x: C0.x, y: C0.y, z: TZ, rot: 0},
  {t: tC.ai + 1.6, x: C0.x, y: C0.y, z: TZ * 0.985, rot: 0},
]);
const tissueCamC = (t: number): Cam => (t < HOLD ? EVOLVE_CAM(t) : TS(t));
const RT_C = 2800;
const DT_K = 500 / RT_C; // model units per tissue unit
const DT_H: [number, number] = [tC.ai - 0.1, tC.ai + 1.1];
const toModel = (ct: Cam) => handoff(ct, C0P, [0, 0], DT_K);
// The twin analysis runs in five stages, each adding something new every 1–3 s:
//   A acquisition (scans → layers, a biopsy → subclone regions, a read → the gold-marked variant region)
//   B scanning (the stack tilts and separates; a scan plane passes through it and each slice resolves as it is crossed)
//   C identification (the stack closes; vessels, the resistant subclone and the necrotic core are isolated in turn)
//   D comparison (three copies, three strategies, one simulated clock; each copy follows its own response curve)
//   E result (the best strategy's copy is rewound to its untreated state and the camera dives into its weak region)
const MR = 500; // model radius (model units); the tissue tumour of radius RT_C maps onto it at the hand-off
const sm = (u: number) => smooth(clamp01(u));
const TILT: [number, number] = [tC.using, tC.using + 0.9];
const SPREAD = [tC.using + 0.5, tC.using + 1.3, tC.cancer - 0.15, tC.cancer + 0.55] as const;
const SCAN: [number, number] = [tC.using + 1.2, tC.cancer - 0.2];
const SIM: [number, number] = [tC.predict2 - 0.1, tC.search - 0.1];
const REWIND: [number, number] = [tC.search + 0.05, tC.search + 0.6];
// three copies for three strategies; the third targets the gold-marked region
const CX = [-1080, 0, 1080];
const CPR = 340;
const SPAWN: [number, number] = [tC.inside, tC.inside + 1.1];
const sy0 = (t: number) => lerp(1, 0.78, lift(t, tC.scans + 0.2, tC.scans + 0.9));
const syAt = (t: number) => lerp(sy0(t), 0.4, lift(t, TILT[0], TILT[1]));
const GOLD_U: Pt = [0.3, -0.18];
const GOLD_C: Pt = [CX[2] + CPR * GOLD_U[0], CPR * GOLD_U[1] * 0.4];
const DTC = path([
  {...toModel(TS(DT_H[1])), t: DT_H[1]},
  {t: tC.imagine - 0.3, x: 30, y: 0, z: (TZ / DT_K) * 1.07, rot: 0},
  {t: tC.imagine + 0.7, x: -330, y: 20, z: 0.78, rot: 0},
  {t: tC.using - 0.1, x: -290, y: 10, z: 0.8, rot: 0},
  {t: tC.using + 1.0, x: 60, y: 30, z: 0.56, rot: 0},
  {t: tC.cancer - 0.2, x: 60, y: 70, z: 0.6, rot: 0},
  {t: tC.cancer + 0.9, x: 10, y: 10, z: 0.9, rot: 0},
  {t: tC.inside - 0.1, x: 40, y: 10, z: 0.98, rot: 0},
  {t: tC.inside + 1.2, x: 0, y: 220, z: 0.62, rot: 0},
  {t: tC.search - 0.1, x: 0, y: 215, z: 0.63, rot: 0},
  {t: tC.search + 0.6, x: CX[2], y: 40, z: 1.0, rot: 0},
  {t: tC.choosing + 0.15, x: GOLD_C[0], y: GOLD_C[1], z: 3.2, rot: 0},
]);
const dtCam = (t: number): Cam => (t < DT_H[1] ? toModel(TS(t)) : DTC(t));
const PR_S = 5; // protein units per model unit at the weak point
const PR_H: [number, number] = [tC.choosing - 0.35, tC.choosing + 0.15];
const PRC = path([
  {...handoff(DTC(PR_H[1]), GOLD_C, POCKET, PR_S), t: PR_H[1]},
  {t: tC.instead, x: POCKET[0] - 80, y: POCKET[1] + 60, z: 0.62, rot: 0},
]);
const prCam = (t: number): Cam => (t < PR_H[1] ? handoff(DTC(t), GOLD_C, POCKET, PR_S) : PRC(t));

// ------------------------------------------------------------------------------------------------ the predictive scan over the tumour cells
const ScanOverlay: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const k = lift(t, tC.predict, tC.predict + 0.4);
  if (k <= 0) return null;
  const sx = lerp(-200, W + 200, lift(t, tC.predict, tC.next - 0.2)); // screen-space scan line
  const hw = Math.hypot(W, H) / 2 / cam.z + SP;
  const i0 = Math.floor((cam.x - hw) / SP), i1 = Math.ceil((cam.x + hw) / SP), j0 = Math.floor((cam.y - hw) / (SP * 0.866)), j1 = Math.ceil((cam.y + hw) / (SP * 0.866));
  const rings: React.ReactNode[] = [];
  const Rt = RtB(t);
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const c = cellAt(i, j);
      const dx = c.x - C0.x, dy = c.y - C0.y;
      if (Math.hypot(dx, dy) / boundary(Math.atan2(dy, dx)) > Rt) continue;
      const scr = W / 2 + (c.x - cam.x) * cam.z;
      if (scr > sx) continue;
      const h = rand(((i * 131) ^ (j * 977)) & 0xffff);
      rings.push(<circle key={`${i},${j}`} cx={c.x} cy={c.y} r={R * 0.98} fill="none" stroke={P.ai} strokeWidth={3 / Math.max(0.3, cam.z)} opacity={0.75} />);
      // a few predictions: a dashed ghost where a daughter would appear, or a fading cross where a cell would die
      if (h < 0.07) {
        const g = lift(t, tC.predict + 1.0 + h * 10, tC.predict + 1.6 + h * 10);
        const a = h * 90;
        rings.push(
          <g key={`g${i},${j}`} opacity={g}>
            <circle cx={c.x + Math.cos(a) * SP} cy={c.y + Math.sin(a) * SP} r={R * 0.9} fill={P.ai} fillOpacity={0.12} stroke={P.aiHot} strokeWidth={3 / Math.max(0.3, cam.z)} strokeDasharray={`${12 / cam.z} ${8 / cam.z}`} />
            <line x1={c.x} y1={c.y} x2={c.x + Math.cos(a) * SP * 0.7} y2={c.y + Math.sin(a) * SP * 0.7} stroke={P.aiHot} strokeWidth={3 / Math.max(0.3, cam.z)} />
          </g>,
        );
      }
    }
  return (
    <g opacity={k}>
      <g transform={camTransform(cam)}>{rings}</g>
      <rect x={sx - 160} y={0} width={160} height={H} fill="url(#glowAi)" opacity={0.35} />
      <rect x={sx - 3} y={0} width={6} height={H} fill={P.aiHot} opacity={0.85} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the measured contour and the predicted next front (tissue coords)
const frontShape = (a: number) => boundary(a) + 0.2 * Math.exp(-(((a - 0.5 + Math.PI * 3) % (Math.PI * 2) - Math.PI) ** 2) / 0.12);
const shapePath = (Rt: number, f: (a: number) => number, cx: number, cy: number) =>
  'M ' + Array.from({length: 96}, (_, k) => { const a = (k / 96) * Math.PI * 2; return `${(cx + Math.cos(a) * Rt * f(a)).toFixed(1)} ${(cy + Math.sin(a) * Rt * f(a)).toFixed(1)}`; }).join(' L ') + ' Z';
const ContourOverlay: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const trace = lift(t, tC.next - 0.6, tC.ai + 0.2);
  const fr = lift(t, tC.predict + 1.3, tC.next) * (1 - lift(t, tC.ai, tC.ai + 0.6));
  const sw = 3 / cam.z;
  return (
    <g transform={camTransform(cam)}>
      {fr > 0.01 && <path d={shapePath(RT_C, frontShape, C0.x, C0.y)} fill="none" stroke={P.aiHot} strokeWidth={sw * 2.2} strokeDasharray={`${22 / cam.z} ${14 / cam.z}`} opacity={fr} />}
      {trace > 0.01 && <path d={shapePath(RT_C, boundary, C0.x, C0.y)} fill="none" stroke={P.ai} strokeWidth={sw * 1.6} pathLength={1} strokeDasharray={`${trace} 1`} />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the twin (a computed reconstruction, not a scanner's view)
// Regions in unit model coordinates: a necrotic core, a resistant teal subclone (left), a violet subclone (top), the
// gold-marked variant region found by sequencing, and the cyan bulk. Region borders twist with radius so they read as
// grown, not drawn with a ruler, and stay exact enough for the identification contours to follow them.
const TWIST = (r: number) => 0.25 * Math.sin(r * 6 + 1.3);
const TEAL_A: [number, number] = [1.95, 3.55]; // angular range (wraps past π)
const VIO_A: [number, number] = [-2.15, -1.0];
const coreR = (a: number) => 0.29 * (1 + 0.09 * Math.sin(2 * a + 0.8) + 0.05 * Math.sin(5 * a + 2.0));
const goldR = (a: number) => 0.16 * (1 + 0.15 * Math.sin(4 * a + 2.1));
const inArc = (a: number, r: [number, number]) => { let x = a; while (x < r[0]) x += Math.PI * 2; return x <= r[1]; };
type Reg = 0 | 1 | 2 | 3 | 4; // bulk, teal, violet, gold, core
const regionOf = (ux: number, uy: number): Reg => {
  const r = Math.hypot(ux, uy), a0 = Math.atan2(uy, ux);
  const gd = Math.hypot(ux - GOLD_U[0], uy - GOLD_U[1]);
  if (gd < goldR(Math.atan2(uy - GOLD_U[1], ux - GOLD_U[0]))) return 3;
  if (r < coreR(a0)) return 4;
  const a = a0 + TWIST(r);
  if (inArc(a, TEAL_A)) return 1;
  if (inArc(a, VIO_A)) return 2;
  return 0;
};
const REG_COL = [P.ai, '#36F0C8', '#9A7CFF', P.aiGold, '#2C4A5E'];
const HEX5 = (() => {
  const r = 24;
  return Array.from({length: 6}, (_, k) => { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; return `${k ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }).join(' ') + ' Z';
})();
const VOX = 52; // voxel spacing (model units, at full size)
const outlineAt = (R: number, sy: number, f: (a: number) => number = boundary, n = 64) =>
  closedPath(Array.from({length: n}, (_, k) => { const a = (k / n) * Math.PI * 2; return [Math.cos(a) * R * f(a), Math.sin(a) * R * f(a) * sy] as Pt; }), 1);
/** Contour of the teal subclone on a slice (unit coords → model units): along one border, round the rim, back along the other. */
const tealContour = (R: number, sy: number) => {
  const pts: Pt[] = [];
  const border = (A: number, rev: boolean) => {
    const rs = Array.from({length: 12}, (_, k) => 0.3 + (k / 11) * 0.62);
    (rev ? rs.reverse() : rs).forEach((r) => { const a = A - TWIST(r); pts.push([Math.cos(a) * r * R, Math.sin(a) * r * R * sy]); });
  };
  border(TEAL_A[0], false);
  for (let k = 1; k < 16; k++) { const a = lerp(TEAL_A[0], TEAL_A[1], k / 16) - TWIST(0.92); pts.push([Math.cos(a) * 0.92 * R * boundary(a), Math.sin(a) * 0.92 * R * boundary(a) * sy]); }
  border(TEAL_A[1], true);
  return closedPath(pts, 0.6);
};
const blobAt = (cx: number, cy: number, R: number, f: (a: number) => number, sy: number) =>
  closedPath(Array.from({length: 32}, (_, k) => { const a = (k / 32) * Math.PI * 2; return [(cx + Math.cos(a) * f(a)) * R, (cy + Math.sin(a) * f(a)) * R * sy] as Pt; }), 1);

/** Simulated response of each strategy over simulated time u (1 = untreated size). */
const RESP = [
  (u: number) => 1 - 0.55 * sm(u / 0.45) + 0.5 * sm((u - 0.5) / 0.5), // shrinks, then the resistant subclone regrows
  (u: number) => 1 - 0.13 * sm(u), // barely responds
  (u: number) => 1 - 0.72 * sm(u / 0.75), // hits the gold-marked region: stays down
];
const DRUG = [P.payload, P.tcell, P.aiGold];

type TwinP = {
  t: number; R: number; lod: number; sy: number;
  spread?: number;   // gap between slices (model units)
  layers?: number;   // 0..1: the slices above and below the measured one (from the scans)
  fill?: number;     // 0..1: voxels of the measured slice, filled left to right
  regions?: number;  // 0..1: subclones resolved (from the biopsy)
  gold?: number;     // 0..1: the variant region marked (from sequencing)
  scanP?: number;    // scan plane position in slice units (passes from +2.8 to −2.8); NaN when off
  focus?: {vess: number; teal: number; core: number; gold: number; dim: number};
  strat?: number;    // −1 none, else the strategy this copy is simulating
  u?: number;        // simulated time 0..1
  vess?: number;
  op?: number;
};
const SLICES = [-2, -1, 0, 1, 2];
const sliceRF = (L: number) => Math.sqrt(1 - (L / 2.7) ** 2);
const TwinModel: React.FC<TwinP> = ({t, R, lod, sy, spread = 0, layers = 0, fill = 1, regions = 0, gold = 0, scanP = NaN, focus, strat = -1, u = 0, vess = 0, op = 1}) => {
  const thick = 70 * (1 - sy);
  const yOf = (L: number) => -L * (spread + thick);
  const v = strat >= 0 ? RESP[strat](u) : 1;
  const vMin = strat === 0 ? Math.min(v, RESP[0](Math.min(u, 0.45))) : v;
  const regrow = strat === 0 ? sm((u - 0.5) / 0.5) : 0;
  const scale = 0.5 + 0.5 * v;
  const fd = focus?.dim ?? 0;
  const out: React.ReactNode[] = [];
  const visL = (L: number) => (L === 0 ? 1 : Math.abs(L) === 1 ? sm(layers * 2) : sm(layers * 2 - 1));
  const passed = (L: number) => (Number.isNaN(scanP) ? (layers > 0.99 && spread < 1 ? 1 : 0) : sm((L - scanP) / 0.5 + 0.5));
  const litOf = (L: number) => (Number.isNaN(scanP) ? 0 : Math.exp(-(((L - scanP) / 0.45) ** 2)));
  const plane = !Number.isNaN(scanP) && scanP > -2.9 && scanP < 2.9;
  const drawPlane = () => {
    const py = -scanP * (spread + thick);
    return (
      <g key="plane">
        <ellipse cx={0} cy={py} rx={R * 1.32} ry={R * 1.32 * sy} fill={P.ai} opacity={0.08} />
        <ellipse cx={0} cy={py} rx={R * 1.32} ry={R * 1.32 * sy} fill="none" stroke={P.aiHot} strokeWidth={3 / Math.max(0.3, lod)} opacity={0.75} />
        <line x1={-R * 1.32} y1={py} x2={R * 1.32} y2={py} stroke={P.aiHot} strokeWidth={2 / Math.max(0.3, lod)} opacity={0.35} />
      </g>
    );
  };
  let planeDrawn = false;
  SLICES.forEach((L) => {
    const vis = visL(L);
    if (plane && !planeDrawn && L > scanP) { out.push(drawPlane()); planeDrawn = true; }
    if (vis < 0.01) return;
    const rf = sliceRF(L) * scale;
    const yo = yOf(L);
    const lit = litOf(L);
    const pass = passed(L);
    const sep = clamp01(spread / 60);
    // a slice shows its own voxels once it stands apart from the others, or when it is the measured one
    const vox = L === 0 || sep > 0.3 || lit > 0.05;
    const reg = L === 0 ? regions : regions * pass;
    out.push(
      <g key={'s' + L} transform={`translate(0 ${yo})`} opacity={vis * op}>
        <path d={outlineAt(R * rf, sy)} fill={mixHex(P.aiBgLift, P.aiDeep, 0.35 + 0.3 * lit)} fillOpacity={lerp(L === 0 ? 0.6 : 0.35, 0.88, sep)} stroke={lit > 0.3 ? P.aiHot : P.ai} strokeWidth={(1.6 + 2.5 * lit) / Math.max(0.25, lod)} strokeOpacity={L === 0 ? 0.9 : 0.55 + 0.4 * sep} />
      </g>,
    );
    const coreK = (L === 0 ? Math.max(pass, regions) : pass) * (vox ? 1 : 0) * (1 - (strat >= 0 ? 0.6 * (1 - vMin) : 0));
    if (coreK > 0.01) out.push(
      <path key={'k' + L} transform={`translate(0 ${yo})`} d={blobAt(0, 0, R * scale * sliceRF(L), coreR, sy)} fill={REG_COL[4]} opacity={0.7 * coreK * vis * op * (focus ? 1 - focus.dim * (1 - focus.core) * 0.6 : 1)} />,
    );
    if (!vox || lod * R * rf < 60) return;
    const vs = VOX * scale;
    const n = Math.ceil((R * rf * 1.25) / vs) + 1;
    const front = lerp(-1.4, 1.4, fill);
    const cells: React.ReactNode[] = [];
    for (let j = -n; j <= n; j++)
      for (let i = -n; i <= n; i++) {
        const px = (i + (j % 2 ? 0.5 : 0)) * vs, py = j * vs * 0.866;
        const ux = px / (R * scale), uy = py / (R * scale); // unit coords of the untreated tumour
        const rr = Math.hypot(px, py) / (R * rf);
        if (rr > boundary(Math.atan2(py, px)) * 0.95) continue;
        if (L === 0 && ux > front) continue;
        const g = regionOf(ux, uy);
        const goldOn = g === 3 ? (L === 0 ? gold : Math.abs(L) === 1 ? gold * pass : 0) : 0;
        const coreOn = g === 4 ? (L === 0 ? Math.max(pass, regions) : pass) : 0;
        let col = g === 3 ? mixHex(mixHex(P.ai, REG_COL[0], reg), P.aiGold, goldOn) : g === 4 ? mixHex(P.ai, REG_COL[4], coreOn) : mixHex(P.ai, REG_COL[g], reg);
        // treatment: most voxels empty out; the resistant subclone holds under strategy 1 and refills the space
        let keep = 1;
        if (strat >= 0) {
          const loss = 1 - vMin;
          const k = strat === 0 ? (g === 1 ? 0.1 : 1.3) : strat === 2 ? (g === 3 ? 3 : g === 1 ? 1.1 : 1.25) : 1;
          keep = clamp01(1 - k * loss * 1.5);
          if (strat === 0 && g !== 1 && regrow > 0) {
            const a = Math.atan2(uy, ux) + TWIST(Math.hypot(ux, uy));
            let da = Math.abs(((a - 2.75) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
            const re = clamp01(regrow * 1.6 - da / 2.2);
            if (re > keep) { keep = re; col = REG_COL[1]; }
          }
        }
        if (keep < 0.03) continue;
        const flick = 0.35 + 0.35 * rand(i * 31 + j * 17 + L * 7) + 0.1 * Math.sin(t * 2 + i + j);
        let hl = 1;
        if (focus) {
          const f = g === 1 ? focus.teal : g === 4 ? focus.core : g === 3 ? focus.gold : 0;
          hl = 1 - fd * (1 - f) * 0.75;
        }
        const fo = (0.12 + 0.3 * flick + 0.25 * lit) * keep * hl * (g === 4 ? 1 - 0.7 * coreOn : 1);
        cells.push(<path key={`${i},${j}`} d={HEX5} transform={`translate(${px} ${py * sy}) scale(${scale} ${scale * sy})`} fill={col} fillOpacity={fo} stroke={col} strokeWidth={1.6} strokeOpacity={(0.75 * Math.max(0.25, keep)) * hl} />);
      }
    out.push(<g key={'v' + L} transform={`translate(0 ${yo})`} opacity={vis * op}>{cells}</g>);
  });
  if (plane && !planeDrawn) out.push(drawPlane());
  // vessel tree feeding the measured slice (the model's own perfusion estimate)
  const vf = (focus ? 1 - fd * (1 - focus.vess) * 0.7 : 1) * (1 - clamp01(spread / 50));
  const vessEl = vess > 0.01 && (
    <g opacity={vess * vf * op} fill="none" strokeLinecap="round" stroke={focus && focus.vess > 0.01 ? mixHex(P.aiHot, P.aiGold, focus.vess) : P.aiHot}>
      {Array.from({length: 5}, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + 0.7;
        const Rr = R * scale;
        const pts: Pt[] = [[Math.cos(a) * Rr * 1.45, Math.sin(a) * Rr * 1.45 * sy], [Math.cos(a + 0.2) * Rr * 0.9, Math.sin(a + 0.2) * Rr * 0.9 * sy], [Math.cos(a + 0.45) * Rr * 0.42, Math.sin(a + 0.45) * Rr * 0.42 * sy]];
        return <path key={k} d={openPath(pts, 1)} strokeWidth={(3 + 3 * (focus?.vess ?? 0)) * Math.max(1, 1.2 / Math.max(0.4, lod))} opacity={0.75} />;
      })}
    </g>
  );
  // identification contours on the measured slice
  const sw = 3.2 / Math.max(0.3, lod);
  const Rr = R * scale;
  const contours = focus && (
    <g fill="none" strokeLinejoin="round">
      {focus.teal > 0.01 && <path d={tealContour(Rr, sy)} stroke={REG_COL[1]} strokeWidth={sw} pathLength={1} strokeDasharray={`${focus.teal} 1`} />}
      {focus.core > 0.01 && <path d={blobAt(0, 0, Rr, coreR, sy)} stroke={P.aiHot} strokeWidth={sw} pathLength={1} strokeDasharray={`${focus.core} 1`} />}
      {focus.gold > 0.01 && <path d={blobAt(GOLD_U[0], GOLD_U[1], Rr, (a) => goldR(a) * 1.15, sy)} stroke={P.aiGold} strokeWidth={sw * 1.2} pathLength={1} strokeDasharray={`${focus.gold} 1`} />}
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={R * scale * sy * 1.15 + 2 * (spread + thick)} rx={R * scale * 1.3} ry={R * scale * 0.3 * Math.max(sy, 0.5)} fill="url(#glowAi)" opacity={0.3 * op} />
      {vessEl}
      {out}
      {contours}
    </g>
  );
};

/** A small response chart under a copy: axes, the untreated baseline, the predicted curve with its widening band. */
const RespChart: React.FC<{x: number; y: number; w: number; h: number; k: number; u: number; draw: number; lod: number; op: number}> = ({x, y, w, h, k, u, draw, lod, op}) => {
  const sw = 2.2 / Math.max(0.3, lod);
  const N = 40;
  const pts: Pt[] = [], up: Pt[] = [], lo: Pt[] = [];
  const top = (vv: number) => y + h - ((vv - 0.15) / 0.95) * h;
  for (let m = 0; m <= Math.round(N * u); m++) {
    const uu = m / N, vv = RESP[k](uu), band = 0.02 + 0.16 * uu;
    pts.push([x + uu * w, top(vv)]); up.push([x + uu * w, top(vv + band)]); lo.push([x + uu * w, top(vv - band)]);
  }
  return (
    <g opacity={op}>
      <path d={`M ${x} ${y} L ${x} ${y + h} L ${x + w * draw} ${y + h}`} fill="none" stroke={P.aiDim} strokeWidth={sw * 1.3} />
      {Array.from({length: 5}, (_, m) => <line key={m} x1={x + (w * (m + 1)) / 5} x2={x + (w * (m + 1)) / 5} y1={y + h} y2={y + h + 12} stroke={P.aiDim} strokeWidth={sw} opacity={draw > (m + 1) / 5 ? 1 : 0} />)}
      <line x1={x} x2={x + w * draw} y1={top(1)} y2={top(1)} stroke={P.aiDim} strokeWidth={sw} strokeDasharray={`${10 / Math.max(0.3, lod)} ${8 / Math.max(0.3, lod)}`} />
      {pts.length > 1 && <path d={`M ${up.map((p) => p.join(' ')).join(' L ')} L ${lo.reverse().map((p) => p.join(' ')).join(' L ')} Z`} fill={DRUG[k]} opacity={0.16} />}
      {pts.length > 1 && <path d={`M ${pts.map((p) => p.join(' ')).join(' L ')}`} fill="none" stroke={DRUG[k]} strokeWidth={sw * 1.5} />}
      {u > 0.001 && u < 0.999 && <line x1={x + u * w} x2={x + u * w} y1={y - 10} y2={y + h} stroke={P.aiHot} strokeWidth={sw} opacity={0.7} />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ inputs (stage A)
const DOCK: Pt = [-1180, 0];
const fly = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const Inputs: React.FC<{t: number; lod: number}> = ({t, lod}) => {
  const out: React.ReactNode[] = [];
  // medical scans: four axial slices fan in at the dock, then each flies to the layer it becomes
  const ctIn = (m: number) => fly(t, tC.scans - 0.1 + m * 0.1, tC.scans + 0.25 + m * 0.1);
  const ctGo = (m: number) => fly(t, tC.scans + 0.45 + m * 0.07, tC.scans + 0.9 + m * 0.07);
  const LAND = [2, 1, -1, -2];
  for (let m = 0; m < 4; m++) {
    const a = ctIn(m), g = ctGo(m);
    if (a < 0.01 || g > 0.99) continue;
    const L = LAND[m];
    const sx = DOCK[0], sy = DOCK[1] - 150 + m * 100;
    const tx = 0, ty = -L * 70 * 0.22;
    out.push(<CTSlice key={'ct' + m} x={lerp(sx, tx, g)} y={lerp(sy, ty, g)} s={lerp(0.85, 1.9 * sliceRF(L), g)} k={m} t={t} op={a * (1 - sm((g - 0.6) / 0.4))} />);
  }
  // tumour sample: a core appears, is digitised, and drops into the measured slice
  const bIn = fly(t, tC.samples - 0.05, tC.samples + 0.3), bDig = fly(t, tC.samples + 0.2, tC.samples + 0.6), bGo = fly(t, tC.samples + 0.55, tC.samples + 0.95);
  if (bIn > 0.01 && bGo < 0.99) out.push(<BiopsyCore key="bx" x={lerp(DOCK[0], -120, bGo)} y={lerp(DOCK[1] + 20, 60, bGo)} s={lerp(0.85, 0.35, bGo)} digit={bDig} t={t} op={bIn * (1 - sm((bGo - 0.65) / 0.35))} />);
  // genetic information: a short read with one variant base slides into the region that carries it
  const sIn = fly(t, tC.genetic - 0.05, tC.genetic + 0.3), sGo = fly(t, tC.genetic + 0.5, tC.genetic + 1.0);
  if (sIn > 0.01 && sGo < 0.99) {
    const gx = lerp(DOCK[0], GOLD_U[0] * MR, sGo), gy = lerp(DOCK[1], GOLD_U[1] * MR * 0.78, sGo);
    out.push(<g key="sq" transform={`translate(${gx} ${gy}) scale(${lerp(1.25, 0.2, sGo)})`} opacity={sIn * (1 - sm((sGo - 0.7) / 0.3))}><SeqStrip x={-220} y={0} s={1} t={t} reveal={sm(sIn * 1.2)} n={13} /></g>);
  }
  // the dock: a thin input frame on the left that the data arrives through
  const dk = lift(t, tC.imagine + 0.2, tC.imagine + 0.8) * (1 - lift(t, tC.using - 0.2, tC.using + 0.5));
  if (dk > 0.01) {
    const sw = 2.4 / Math.max(0.3, lod), bw = 300, bh = 260, c = 40;
    const corner = (x: number, y: number, dx: number, dy: number) => `M ${x + dx * c} ${y} L ${x} ${y} L ${x} ${y + dy * c}`;
    out.unshift(
      <g key="dock" opacity={dk * 0.8} fill="none" stroke={P.ai} strokeWidth={sw}>
        <path d={[corner(DOCK[0] - bw, DOCK[1] - bh, 1, 1), corner(DOCK[0] + bw, DOCK[1] - bh, -1, 1), corner(DOCK[0] - bw, DOCK[1] + bh, 1, -1), corner(DOCK[0] + bw, DOCK[1] + bh, -1, -1)].join(' ')} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// ------------------------------------------------------------------------------------------------ the analysis floor
const Twin: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = cam.z;
  const sy = syAt(t);
  const spread = 240 * lift(t, SPREAD[0], SPREAD[1]) * (1 - lift(t, SPREAD[2], SPREAD[3]));
  const layers = lift(t, tC.scans + 0.55, tC.scans + 1.05);
  const fill = lift(t, tC.ai + 0.3, tC.game + 0.3);
  const regions = lift(t, tC.samples + 0.85, tC.samples + 1.35);
  const gold = lift(t, tC.genetic + 0.85, tC.genetic + 1.3);
  const scanU = seg(t, SCAN[0], SCAN[1]);
  const scanP = scanU > 0 && scanU < 1 ? lerp(2.9, -2.9, smooth(scanU)) : NaN;
  // identification: one structure at a time while the rest steps back
  const idOn = lift(t, tC.cancer + 0.5, tC.cancer + 0.9) * (1 - lift(t, tC.inside - 0.2, tC.inside + 0.5));
  const focus = {
    dim: idOn,
    vess: lift(t, tC.cancer + 0.6, tC.which + 0.2) * (1 - lift(t, tC.which + 0.45, tC.which + 0.8)),
    teal: lift(t, tC.which + 0.5, tC.create + 0.6) * (1 - lift(t, tC.virtual - 0.1, tC.virtual + 0.3)),
    core: lift(t, tC.virtual, tC.battle + 0.5),
    gold: lift(t, tC.battle + 0.4, tC.inside - 0.1),
  };
  const vess = lift(t, tC.genetic + 1.0, tC.using + 0.3);
  // comparison: the model becomes three copies, each on its own strategy and clock
  const sp = lift(t, SPAWN[0], SPAWN[1]);
  const chart = lift(t, SPAWN[1] - 0.2, SPAWN[1] + 0.5);
  const drugK = lift(t, tC.test, tC.test + 0.5) * (1 - lift(t, SIM[0] + 0.6, SIM[1]));
  const u = lift(t, SIM[0], SIM[1]) * (1 - lift(t, REWIND[0], REWIND[1]));
  const pick = lift(t, tC.search - 0.1, tC.search + 0.4);
  const out: React.ReactNode[] = [];
  if (sp < 0.01) {
    out.push(<TwinModel key="m" t={t} R={MR} lod={lod} sy={sy} spread={spread} layers={layers} fill={fill} regions={regions} gold={gold} scanP={scanP} focus={idOn > 0.01 ? focus : undefined} vess={vess} />);
  } else {
    // the far copies peel off behind the near one; all three keep the identified structures
    [0, 2, 1].forEach((k) => {
      const x = lerp(0, CX[k], sp), R = lerp(MR, CPR, sp);
      const dim = k === 2 ? 1 : 1 - 0.65 * pick;
      out.push(
        <g key={'c' + k} transform={`translate(${x} 0)`} opacity={(k === 1 ? 1 : sm(sp * 2)) * dim}>
          <TwinModel t={t} R={R} lod={lod} sy={sy} layers={1} regions={1} gold={1} strat={u > 0 ? k : -1} u={u} vess={1 - 0.5 * sp} focus={k === 2 && pick > 0.01 ? {dim: 0.5 * pick, vess: 0, teal: 0, core: 0, gold: pick} : undefined} />
          {/* the strategy arrives as particles of its own colour from below; the targeted one homes on the gold region */}
          {drugK > 0.01 && Array.from({length: 12}, (_, m) => {
            const q = (t * 0.8 + m / 12) % 1;
            const tx = k === 2 ? GOLD_U[0] * R : (rand(m * 5 + k) - 0.5) * R, ty = k === 2 ? GOLD_U[1] * R * sy : (rand(m * 7 + k) - 0.5) * R * sy;
            return <circle key={m} cx={lerp((rand(m + k * 13) - 0.5) * 700, tx, q)} cy={lerp(R * 1.5, ty, q)} r={13} fill={DRUG[k]} opacity={drugK * (1 - q) * 0.9} />;
          })}
          <RespChart x={-300} y={R * sy + 170} w={600} h={250} k={k} u={u} draw={chart} lod={lod} op={chart} />
        </g>,
      );
    });
    // selection: corner brackets close in on the chosen copy
    if (pick > 0.01) {
      const bw = lerp(540, 450, pick), bh = lerp(560, 470, pick), c = 50, cx = CX[2], cy = 200;
      const corner = (x: number, y: number, dx: number, dy: number) => `M ${x + dx * c} ${y} L ${x} ${y} L ${x} ${y + dy * c}`;
      out.push(<path key="sel" d={[corner(cx - bw, cy - bh, 1, 1), corner(cx + bw, cy - bh, -1, 1), corner(cx - bw, cy + bh, 1, -1), corner(cx + bw, cy + bh, -1, -1)].join(' ')} fill="none" stroke={P.aiGold} strokeWidth={4 / Math.max(0.3, lod)} opacity={pick} />);
    }
  }
  // slice ruler beside the stack while it is open: the active slice lights as the plane passes
  const ruler = lift(t, SPREAD[0] + 0.2, SPREAD[1]) * (1 - lift(t, SPREAD[2] - 0.2, SPREAD[2] + 0.3));
  const rulerEl = ruler > 0.01 && (
    <g opacity={ruler}>
      <line x1={MR * 1.5} x2={MR * 1.5} y1={-2.6 * 240} y2={2.6 * 240} stroke={P.aiDim} strokeWidth={3 / lod} />
      {SLICES.map((L) => {
        const lit = Number.isNaN(scanP) ? 0 : Math.exp(-(((L - scanP) / 0.45) ** 2));
        const y = -L * (spread + 70 * (1 - sy));
        return <rect key={L} x={MR * 1.5 - 18} y={y - 4} width={36} height={8} fill={lit > 0.3 ? P.aiHot : P.ai} opacity={0.5 + 0.5 * lit} />;
      })}
      {!Number.isNaN(scanP) && <path d={`M ${MR * 1.5 + 26} ${-scanP * (spread + 70 * (1 - sy))} l 28 -16 l 0 32 Z`} fill={P.aiHot} />}
    </g>
  );
  return (
    <g>
      <Inputs t={t} lod={lod} />
      {rulerEl}
      {out}
    </g>
  );
};

/** Screen-space viewport brackets: the analysis is framed like a workstation view, without any text. */
const Viewport: React.FC<{op: number}> = ({op}) => {
  if (op < 0.01) return null;
  const m = 56, c = 46;
  const corner = (x: number, y: number, dx: number, dy: number) => `M ${x + dx * c} ${y} L ${x} ${y} L ${x} ${y + dy * c}`;
  return (
    <g opacity={op * 0.55} fill="none" stroke={P.ai} strokeWidth={2}>
      <path d={[corner(m, m, 1, 1), corner(W - m, m, -1, 1), corner(m, H - m, 1, -1), corner(W - m, H - m, -1, -1)].join(' ')} />
      <line x1={W / 2 - 14} x2={W / 2 + 14} y1={m} y2={m} opacity={0.7} />
      <line x1={W / 2 - 14} x2={W / 2 + 14} y1={H - m} y2={H - m} opacity={0.7} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ five patients
// One patient first (a liver tumour, a generic drug that only dents it), then a second with different biology (a bowel
// tumour with a different surface marker, the same drug does nothing), then the camera pulls back as the others are
// brought in one by one and the same grey drug sweeps all five. The patient whose tumour the film has followed is
// selected, the camera pushes through the body to that lung tumour, a molecule built for its marker seats on it, and
// the push continues into that marker, which dissolves into the protein of the next sequence.
type Marker = 'fork' | 'cup' | 'hook' | 'ring' | 'pocket';
const PATIENTS: {x: number; site: Pt; col: string; marker: Marker; build: [number, number]; R: number}[] = [
  {x: -1900, site: [36, 30], col: '#9A7CFF', marker: 'fork', build: [1.1, 0.98], R: 46},
  {x: -950, site: [-112, -186], col: '#36F0C8', marker: 'cup', build: [0.92, 1.03], R: 44},
  {x: 0, site: SITE.tumor, col: P.aiGold, marker: 'pocket', build: [1, 1], R: 42},
  {x: 950, site: [-112, -470], col: '#FF8AD0', marker: 'hook', build: [0.95, 0.94], R: 38},
  {x: 1900, site: [14, -770], col: '#7CC4FF', marker: 'ring', build: [1.06, 1.02], R: 30},
];
const OURS = 2;
// a tumour as a small cluster of cells: one in the middle and nine around it, with surface markers on the outer ones
const CLUSTER = Array.from({length: 10}, (_, k) => {
  if (k === 0) return {x: 0, y: 0, r: 0.38, a: 0};
  const a = ((k - 1) / 9) * Math.PI * 2 + 0.3 * Math.sin(k * 2.1);
  const d = 0.6 + 0.08 * Math.sin(k * 3.7);
  return {x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.3 + 0.05 * Math.sin(k * 5.3), a};
});
/** World position of a patient (feet on one floor line). */
const patXY = (k: number): Pt => [PATIENTS[k].x, 856 * (1 - PATIENTS[k].build[1])];
/** World position of a tumour point given in cluster-unit coords. */
const tumorPt = (k: number, ux: number, uy: number): Pt => {
  const p = PATIENTS[k], [px, py] = patXY(k);
  return [px + (p.site[0] + ux * p.R) * p.build[0], py + (p.site[1] + uy * p.R) * p.build[1]];
};
// the marker the final push enters: on the outer cell facing up-right
const END_CELL = 2;
const endMarker = (): Pt => {
  const c = CLUSTER[END_CELL];
  const m = c.r + 0.3; // receptor head sits ~0.3 cluster units outside the membrane
  return tumorPt(OURS, c.x + Math.cos(c.a) * m, c.y + Math.sin(c.a) * m);
};
const markerGlyph = (m: Marker, s: number, sw: number, col: string): React.ReactNode => {
  const stem = <line x1={0} y1={0} x2={0} y2={-0.55 * s} stroke={col} strokeWidth={sw} strokeLinecap="round" />;
  switch (m) {
    case 'fork': return <g>{stem}<path d={`M 0 ${-0.55 * s} L ${-0.32 * s} ${-0.95 * s} M 0 ${-0.55 * s} L ${0.32 * s} ${-0.95 * s}`} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" /></g>;
    case 'cup': return <g>{stem}<path d={`M ${-0.32 * s} ${-0.95 * s} A ${0.32 * s} ${0.32 * s} 0 0 0 ${0.32 * s} ${-0.95 * s}`} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" /></g>;
    case 'hook': return <g>{stem}<path d={`M 0 ${-0.55 * s} Q 0 ${-1.0 * s} ${0.3 * s} ${-0.95 * s} Q ${0.42 * s} ${-0.8 * s} ${0.22 * s} ${-0.72 * s}`} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" /></g>;
    case 'ring': return <g>{stem}<circle cx={0} cy={-0.8 * s} r={0.24 * s} fill="none" stroke={col} strokeWidth={sw} /></g>;
    default:
      // a small folded protein with a notch on its outer face (the pocket the next sequence opens up)
      return (
        <g>
          {stem}
          <circle cx={-0.2 * s} cy={-0.78 * s} r={0.22 * s} fill={col} fillOpacity={0.35} stroke={col} strokeWidth={sw * 0.8} />
          <circle cx={0.2 * s} cy={-0.78 * s} r={0.22 * s} fill={col} fillOpacity={0.35} stroke={col} strokeWidth={sw * 0.8} />
          <circle cx={0} cy={-0.62 * s} r={0.2 * s} fill={col} fillOpacity={0.35} stroke={col} strokeWidth={sw * 0.8} />
        </g>
      );
  }
};
/** The designed molecule for the pocket marker: three fused spheres that seat in the notch. */
const DesignedMol: React.FC<{s: number; op: number}> = ({s, op}) => (
  <g opacity={op}>
    <circle r={0.5 * s} fill="url(#glowGold)" />
    {[[-0.09, 0], [0.09, 0], [0, -0.1]].map(([x, y], k) => <circle key={k} cx={x * s} cy={y * s} r={0.1 * s} fill={P.aiGold} stroke="#FFF2C8" strokeWidth={0.025 * s} />)}
  </g>
);
const TumorCluster: React.FC<{k: number; t: number; lod: number; kill: number; bind: number; detail: number; endF?: number}> = ({k, t, lod, kill, bind, detail, endF = 0}) => {
  const p = PATIENTS[k];
  const sw = 2.2 / lod;
  return (
    <g>
      <circle r={1.7} fill={k === OURS ? 'url(#glowGold)' : 'url(#glowAi)'} opacity={0.55 * (1 - endF)} />
      {CLUSTER.map((c, i) => {
        // the generic drug kills only a few cells of the first patient's tumour (the ones it happens to reach)
        const dies = k === 1 && (i === 4 || i === 7) ? kill : 0;
        const wob = 0.02 * Math.sin(t * 1.6 + i);
        return (
          <g key={i} transform={`translate(${c.x} ${c.y})`} opacity={(1 - 0.8 * dies) * (i === END_CELL ? 1 : 1 - endF)}>
            <circle r={c.r + wob} opacity={i === END_CELL ? 1 - 0.85 * endF : 1} fill={mixHex(P.aiBgLift, p.col, 0.28)} fillOpacity={0.85} stroke={p.col} strokeWidth={sw} />
            <circle cx={0.05 * c.r} cy={-0.05 * c.r} r={c.r * 0.42} fill={mixHex(P.aiBg, p.col, 0.5)} opacity={0.9 * (i === END_CELL ? 1 - endF : 1)} />
            {detail > 0.01 && i > 0 && (
              <g opacity={detail} transform={`rotate(${(c.a * 180) / Math.PI + 90}) translate(0 ${-c.r})`}>
                {markerGlyph(p.marker, 0.36, sw * 1.2, p.col)}
                {k === OURS && bind > 0.01 && (
                  <g transform={`translate(0 ${-0.38 - 0.9 * (1 - smooth(clamp01(bind * 1.3 - (i % 3) * 0.15)))})`}>
                    <DesignedMol s={0.36} op={clamp01(bind * 3 - (i % 3) * 0.4)} />
                  </g>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
const tP = {
  instead: tC.instead, every: T('every cancer'), same: T('same way,'), designed: tC.designed, exact: tC.exact, growing: T('growing inside'), person: tC.person, but: tC.but,
};
const P_END = tP.but + 0.55; // the patients shot runs under the protein's fade-in
const ROW = (() => {
  const A = tumorPt(1, 0, 0), B = tumorPt(0, 0, 0), O = tumorPt(OURS, 0, 0), M = endMarker();
  const zE = 24;
  return path([
    {t: tP.instead, x: A[0] + 40, y: A[1] + 30, z: 2.3, rot: 0},
    {t: tP.every - 0.15, x: A[0] + 10, y: A[1] + 10, z: 2.45, rot: 0},
    {t: tP.every + 0.45, x: B[0] + 20, y: B[1] - 10, z: 2.3, rot: 0},
    {t: tP.same, x: B[0] + 200, y: B[1] - 60, z: 1.3, rot: 0},
    {t: tP.same + 0.6, x: 0, y: -60, z: 0.43, rot: 0},
    {t: tP.designed + 0.2, x: 0, y: -60, z: 0.44, rot: 0},
    {t: tP.designed + 0.95, x: 30, y: -150, z: 0.95, rot: 0},
    {t: tP.exact + 0.1, x: O[0] + 10, y: O[1] + 10, z: 2.6, rot: 0},
    {t: tP.growing + 0.5, x: M[0] - 48 / 3.2, y: M[1] + 36 / 3.2, z: 3.2, rot: 0},
    {t: tP.but, x: M[0] - 48 / zE, y: M[1] + 36 / zE, z: zE, rot: 0},
    {t: P_END, x: M[0] - 48 / (zE * 1.15), y: M[1] + 36 / (zE * 1.15), z: zE * 1.15, rot: 0},
  ]);
})();
const PatientRow: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  // who is on stage: A first, then B, then the others as the frame opens
  const appear = [lift(t, tP.every + 0.05, tP.every + 0.45), 1, lift(t, tP.same - 0.1, tP.same + 0.25), lift(t, tP.same + 0.05, tP.same + 0.4), lift(t, tP.same + 0.2, tP.same + 0.55)];
  const focus = lift(t, tP.designed + 0.1, tP.designed + 0.6);
  const bodyOut = lift(t, tP.growing + 0.4, tP.but - 0.3); // the figure gives way to the tumour as the push goes in
  const kill = lift(t, tP.instead + 0.5, tP.every);
  const bind = lift(t, tP.growing - 0.3, tP.growing + 0.7);
  // the generic drug: grey particles drifting through whoever is in frame, then one sweep across all five
  const g1 = Math.min(lift(t, tP.instead, tP.instead + 0.3), 1 - lift(t, tP.same + 0.4, tP.same + 0.9));
  const sweep = lift(t, tP.same - 0.3, tP.designed + 0.2);
  const sweepX = lerp(-2700, 2700, sweep);
  const detailAt = (k: number) => clamp01((cam.z - 0.9) / 0.8) * (k === OURS ? 1 : 1 - focus);
  return (
    <g>
      <AIBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        {PATIENTS.map((p, k) => {
          const ours = k === OURS;
          const op = appear[k] * (ours ? 1 : 1 - 0.75 * focus);
          if (op < 0.01) return null;
          const [px, py] = patXY(k);
          return (
            <g key={k} opacity={op}>
              <g transform={`translate(${px} ${py}) scale(${p.build[0]} ${p.build[1]})`} opacity={ours ? 1 - 0.85 * bodyOut : 1}>
                {/* materialises from the floor up as it is brought in */}
                <g opacity={0.35 + 0.65 * appear[k]}><Body t={t + k * 1.3} digital={1} slices={appear[k] < 1 ? appear[k] : 0.5} lineW={Math.min(1, 1.2 / cam.z)} /></g>
              </g>
              <g transform={`translate(${px + p.site[0] * p.build[0]} ${py + p.site[1] * p.build[1]}) scale(${p.R * p.build[0]} ${p.R * p.build[1]})`}>
                <TumorCluster k={k} t={t} lod={cam.z * p.R} kill={kill} bind={ours ? bind : 0} detail={detailAt(k)} endF={ours ? lift(t, tP.but - 0.7, tP.but) : 0} />
              </g>
            </g>
          );
        })}
        {/* the same grey drug for everyone */}
        {g1 > 0.01 && Array.from({length: 36}, (_, m) => {
          const q = (t * 0.22 + rand(m * 3)) % 1;
          const ax = lerp(-2300, 300, rand(m * 7)), ay = lerp(-600, 200, rand(m * 11));
          return <circle key={m} cx={ax + q * 260} cy={ay + 40 * Math.sin(t + m)} r={7 + 3 * rand(m)} fill="#A8B0B8" opacity={0.55 * g1 * Math.sin(Math.PI * q)} />;
        })}
        {sweep > 0.01 && sweep < 0.999 && (
          <g opacity={Math.min(1, sweep * 6) * (1 - lift(sweep, 0.85, 1))}>
            {Array.from({length: 46}, (_, m) => <circle key={m} cx={sweepX - rand(m) * 600} cy={-860 + rand(m * 3) * 1700} r={12} fill="#A8B0B8" opacity={0.6} />)}
          </g>
        )}
      </g>
    </g>
  );
};

export const shotsC: Shot[] = [
  {
    id: 'C-scan',
    t0: tC.predict,
    t1: DT_H[1] + 0.05,
    draw: (t) => {
      const cam = tissueCamC(t);
      return (
        <g>
          <EvolveB t={Math.min(t, tC.predict + 0.4)} cam={cam} />
          <ScanOverlay t={t} cam={cam} />
          <ContourOverlay t={t} cam={cam} />
        </g>
      );
    },
  },
  {
    id: 'C-model',
    t0: DT_H[0],
    t1: PR_H[1] + 0.05,
    fade: DT_H[1] - DT_H[0],
    draw: (t) => {
      const cam = dtCam(t);
      return (
        <g>
          <AIBack cam={cam} t={t} op={0.6} />
          <g transform={camTransform(cam)}>
            <Twin t={t} cam={cam} />
          </g>
          <Viewport op={lift(t, tC.imagine, tC.imagine + 0.6) * (1 - lift(t, tC.search + 0.3, tC.choosing))} />
        </g>
      );
    },
  },
  {
    id: 'C-weak',
    t0: PR_H[0],
    t1: tC.instead,
    fade: PR_H[1] - PR_H[0],
    draw: (t) => {
      const cam = prCam(t);
      return (
        <g>
          <AIBack cam={cam} t={t} op={0.6} />
          <g transform={camTransform(cam)}>
            <Protein t={t} digital={1} scanA={t * 2.2} pocketGlow={lift(t, tC.choosing, tC.choosing + 0.5)} />
          </g>
        </g>
      );
    },
  },
  {id: 'C-row', t0: tC.instead, t1: P_END, draw: (t) => <PatientRow t={t} cam={ROW(t)} />},
];
export const tCdone = tC.but;
export const _c = {nearest, clamp01, H, W};
