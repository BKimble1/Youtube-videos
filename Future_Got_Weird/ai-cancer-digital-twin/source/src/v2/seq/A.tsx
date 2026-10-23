// SEQUENCE A (0 – 36.3 s): body → lung → tissue → the abnormal cell → inside it → its DNA → the failure → mitosis →
// ignored stop signals → it survives an immune attack → 1 → 2 → 4 → thousands.
// One camera in tissue coordinates drives the whole micro journey; the cell interior and the DNA are drawn by zoom
// level through exact zoom-through handoffs, so the dive in and the pull back out are continuous.
import React from 'react';
import {Cam, W, H} from '../../kit/cam';
import {P as Pt, clamp01, lerp, smooth, seg, rand, mixHex} from '../../kit/core';
import {Shot} from '../director';
import {Bokeh} from '../art/depth';
import {T, TE} from '../time';
import {path, handoff, K} from '../rig';
import {P} from '../palette';
import {SITE} from '../art/body';
import {BodyWorld, TISSUE_SCALE} from '../art/lung';
import {boundary, boundaryPathAt, cellAt, nearest, TissueField, TissueBack, Cell2, DividingCell, TCell2, R, SP, HEALTHY, TUMOR, CLONES, lookMix, Mod, Motes} from '../art/tissue';
import {Interior, CI_SCALE, DNA_ANCHOR, DNA_SCALE} from '../art/interior';
import {Helix2, RegProtein, RegProteinBack, GrowSignal, NucleoplasmBack, GENE as G0} from '../art/dna';

// ------------------------------------------------------------------------------------------------ coordinates
const C0 = cellAt(0, 0);
export const C0P: Pt = [C0.x, C0.y];
export const toTissue = (cb: Cam) => handoff(cb, SITE.tumor, C0P, TISSUE_SCALE);
export const fromTissue = (ct: Cam) => handoff(ct, C0P, SITE.tumor, 1 / TISSUE_SCALE);
const toInterior = (ct: Cam) => handoff(ct, C0P, [0, 0], CI_SCALE);
const toDNA = (ci: Cam) => handoff(ci, DNA_ANCHOR, [0, 0], DNA_SCALE);
const dnaToTissue = (cd: Cam) => handoff(handoff(cd, [0, 0], DNA_ANCHOR, 1 / DNA_SCALE), [0, 0], C0P, 1 / CI_SCALE);
const GENE = {grow: 420, stop: 880, die: 1340};
export const _g = G0;

// ------------------------------------------------------------------------------------------------ opening dive
// frame 0 already moving: the path starts before t = 0
export const OPEN_KEYS: K[] = [
  {t: -0.8, x: 0, y: -30, z: 0.5, rot: 0},
  {t: 0, x: 4, y: -52, z: 0.56, rot: 0},
  {t: 1.1, x: 46, y: -230, z: 1.2, rot: -1},
  {t: 2.0, x: 104, y: -410, z: 5.2, rot: -3},
  {t: 2.75, x: 117, y: -438, z: 48, rot: -4.5},
  {t: 3.4, x: SITE.tumor[0], y: SITE.tumor[1], z: 360, rot: -5.5},
  {t: 4.6, x: SITE.tumor[0], y: SITE.tumor[1], z: 1.8 * TISSUE_SCALE, rot: -5.5},
];
export const OPEN_END = 4.6;
export const OPEN = path(OPEN_KEYS);
const HAND1: [number, number] = [3.12, 3.55];

// ------------------------------------------------------------------------------------------------ the micro camera
const tA = {
  terr: T('And the terrifying part'), normal: T('completely normal'), deep: T('Deep inside its nucleus'), dna: T('in its DNA'),
  instr: T('The instructions controlling'), grows: T('grows,'), stops: T('stops,'), dies: T('dies'), fail: T('are starting to fail'),
  wrong: T('And eventually, something'), wrongE: TE('goes horribly wrong.'), divides: T('The cell divides'), ignores: T('It ignores signals'),
  body: T('when the body tries'), destroy: T('destroy it'), survives: T('it survives.'), one: T('One cell becomes two.'), two: T('Two become four.'),
  four: T('Four become thousands'), begins: TE('how cancer begins.'), worse: T('But it gets worse.'),
};
const E = toTissue(OPEN(OPEN_END));
// no drift over the cell field: the camera keeps closing in on the same cell while the narration describes it
const P1 = path([
  {...E, t: OPEN_END},
  {t: 6.6, x: C0.x + 2, y: C0.y - 1, z: 2.5, rot: -4},
  {t: tA.deep - 0.05, x: C0.x + 2.5, y: C0.y - 1.2, z: 3.1, rot: -3},
  {t: tA.deep + 0.85, x: C0.x + 3.6, y: C0.y - 1.8, z: 7, rot: -2.6},
  {t: tA.deep + 2.15, x: C0.x + 9.5, y: C0.y - 0.5, z: 26, rot: -2.2},
  {t: tA.dna + 0.15, x: C0.x + DNA_ANCHOR[0] / CI_SCALE, y: C0.y + DNA_ANCHOR[1] / CI_SCALE, z: 1.1 * CI_SCALE * DNA_SCALE, rot: -2},
]);
const DNA_PATH = path([
  {t: tA.dna + 0.15, x: 0, y: 0, z: 1.1, rot: -2},
  {t: tA.instr + 0.15, x: 140, y: 10, z: 1.75, rot: -8},
  {t: tA.grows + 0.15, x: GENE.grow, y: -40, z: 1.45, rot: -10},
  {t: tA.stops + 0.2, x: GENE.stop, y: -40, z: 1.45, rot: -6},
  {t: tA.dies + 0.2, x: GENE.die, y: -40, z: 1.45, rot: -3},
  {t: tA.fail + 0.75, x: GENE.stop, y: -50, z: 0.9, rot: 0},
  {t: tA.wrongE - 1.3, x: GENE.grow + 140, y: -90, z: 1.2, rot: 4},
  {t: tA.wrongE - 0.85, x: GENE.grow + 110, y: -100, z: 1.28, rot: 5},
]);
const PULL0 = tA.wrongE - 0.85;
const D_END = dnaToTissue(DNA_PATH(PULL0));
// daughter A after the first division sits on the left of the axis
const AX1 = 25, SEP = 0.7;
const DA: Pt = [C0.x - Math.cos((AX1 * Math.PI) / 180) * SEP * R, C0.y - Math.sin((AX1 * Math.PI) / 180) * SEP * R];
const DB: Pt = [C0.x + Math.cos((AX1 * Math.PI) / 180) * SEP * R, C0.y + Math.sin((AX1 * Math.PI) / 180) * SEP * R];

/** The micro camera in tissue coordinates for t in [3.1, 36.7]. */
export const microCam = (t: number): Cam => {
  if (t < OPEN_END) return toTissue(OPEN(t));
  if (t < tA.dna + 0.15) return P1(t);
  if (t < PULL0) return dnaToTissue(DNA_PATH(t));
  return P2(t);
};
export const MICRO_END = (t: number) => P2(t);

// ------------------------------------------------------------------------------------------------ state of the cells
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
/** abnormal pulse and tumour tint of the original cell */
const abn = (t: number) => {
  const drain = lift(t, 5.3, 6.4) * (1 - lift(t, tA.normal + 0.5, tA.deep + 0.3));
  const pulseBase = 0.75 * (1 - drain) + 0.25 * lift(t, tA.wrong, tA.wrongE) + 0.2 * lift(t, tA.survives, tA.survives + 0.6);
  const beat = 0.75 + 0.25 * Math.sin(t * 3.2);
  return {pulse: pulseBase * beat, tint: (0.18 + 0.5 * lift(t, tA.wrong, tA.wrongE) + 0.25 * lift(t, tA.survives, tA.one)) * (1 - drain), drain};
};
const mit1 = (t: number) => clamp01((t - (tA.divides + 0.05)) / (tA.ignores - tA.divides + 0.15));
const mit2 = (t: number) => clamp01((t - (tA.one + 0.1)) / 1.25);
const mit3 = (t: number) => clamp01((t - (tA.two + 0.1)) / 1.15);
/** tumour radius for the cascade (tissue units) */
const RT = path([
  {t: tA.four, x: 0, y: 0, z: 140},
  {t: tA.four + 0.9, x: 0, y: 0, z: 420},
  {t: tA.four + 2.1, x: 0, y: 0, z: 1100},
  {t: tA.worse + 0.4, x: 0, y: 0, z: 2500},
]);
export const tumorR = (t: number) => (t < tA.four ? 0 : RT(t).z);
const CUSTOM_END = tA.four + 0.7;
/** a tumour cell's look from its index (subclones appear as the mass grows) */
export const cloneLook = (i: number, j: number, het: number) => {
  const r = rand(((i * 73856093) ^ (j * 19349663)) & 0xffff);
  const k = r < 0.55 ? 0 : r < 0.72 ? 1 : r < 0.87 ? 2 : 3;
  return k === 0 ? TUMOR : lookMix(TUMOR, CLONES[k], het);
};

export {boundary};
export const boundaryPath = (Rt: number, cx = C0.x, cy = C0.y) => boundaryPathAt(Rt, cx, cy);
/** Dome shading over the tumour mass so it reads as a raised 3D lump. */
export const TumorMassShade: React.FC<{Rt: number; op?: number}> = ({Rt, op = 1}) => (Rt < 200 ? null : (
  <g opacity={op * smooth((Rt - 200) / 400)} pointerEvents="none">
    <path d={boundaryPath(Rt * 0.98)} fill="url(#volSoft)" opacity={0.9} />
  </g>
));
// V5 growth: while the tumour is young, a few invasive fronts lead the bulk (fingers pushing into the tissue) and the
// front is ragged at the scale of single cells; as it approaches its established size the fronts merge back into the
// lobed outline every later scene uses, so nothing downstream changes shape.
const FINGERS: [number, number, number][] = [[-1.9, 0.22, 1], [-0.45, 0.16, 0.8], [0.95, 0.2, 0.9], [2.25, 0.15, 0.7], [3.05, 0.12, 0.55]];
const fingerK = (a: number) => FINGERS.reduce((s, [c, w, k]) => { const d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); return s + k * Math.exp(-(d * d) / (w * w)); }, 0);
const settle = (Rt: number) => smooth(clamp01((Rt - 300) / 2100));
/** how far the tumour reaches at angle a (in units of the lobed outline) when its nominal radius is Rt */
export const reachAt = (a: number, Rt: number) => Rt * (1 + 0.6 * fingerK(a) * (1 - settle(Rt)));
const jitterOf = (i: number, j: number) => rand(((i * 7919) ^ (j * 104729)) & 0xffff) - 0.5;
// the micro camera's last part (defined here because it rides the growth front)
const LEAD_A = FINGERS[0][0];
const frontPt = (t: number, back: number) => { const Rt = RT(t).z; const r = reachAt(LEAD_A, Rt) * boundary(LEAD_A) - back; return {x: C0.x + Math.cos(LEAD_A) * r, y: C0.y + Math.sin(LEAD_A) * r}; };
const interiorPt = (t: number) => { const Rt = RT(t).z; const a = LEAD_A + 0.55; const r = 0.42 * Rt * boundary(a); return {x: C0.x + Math.cos(a) * r, y: C0.y + Math.sin(a) * r}; };
const P2 = path([
  {...D_END, t: PULL0},
  {t: PULL0 + 0.5, x: C0.x + 9, y: C0.y - 0.6, z: 48, rot: 0.3},
  {t: PULL0 + 1.0, x: C0.x + 3, y: C0.y - 1, z: 5.5, rot: 0},
  {t: PULL0 + 1.6, x: C0.x, y: C0.y, z: 2.7, rot: 0},
  {t: tA.ignores - 0.2, x: C0.x - 2, y: C0.y + 2, z: 2.45, rot: 1},
  {t: tA.ignores + 0.9, x: C0.x - 6, y: C0.y + 4, z: 1.75, rot: 1},
  {t: tA.body + 0.1, x: C0.x - 70, y: C0.y - 10, z: 1.6, rot: 1.5},
  {t: tA.destroy + 0.3, x: DA[0] - 46, y: DA[1] - 6, z: 2.35, rot: 1},
  {t: tA.one - 0.1, x: DA[0] - 6, y: DA[1], z: 2.6, rot: 0},
  {t: tA.two + 0.2, x: DA[0] + 4, y: DA[1] + 6, z: 2.35, rot: -0.5},
  {t: tA.four + 0.15, x: DA[0] + 14, y: DA[1] + 10, z: 1.9, rot: -1},
  // ride the leading growth front (the invasive finger toward the capillary the next scene follows)…
  {t: tA.four + 0.95, ...frontPt(tA.four + 0.95, 230), z: 1.35, rot: -6},
  {t: tA.four + 1.75, ...frontPt(tA.four + 1.75, 210), z: 1.25, rot: -11},
  // …dip into the tightly packed interior…
  {t: tA.four + 2.25, ...interiorPt(tA.four + 2.25), z: 1.95, rot: -14},
  // …and one pull-back reveals the whole mass and the tissue it has displaced
  {t: tA.begins - 0.35, x: C0.x, y: C0.y - 260, z: 0.62, rot: -9},
  {t: tA.worse + 0.4, x: C0.x, y: C0.y, z: 0.16, rot: -3},
]);
/** Tissue cell modifications shared by sequence A and B (mass effect + tumour cells). */
export const tumorMod = (t: number, Rt: number, het: number, extra?: (i: number, j: number, x: number, y: number) => Mod | null, fronts = false) => (i: number, j: number, x: number, y: number): Mod | null => {
  const e = extra?.(i, j, x, y);
  if (e && (e.hide || e.look)) return e;
  const base = tumorBase(t, Rt, het, i, j, x, y, fronts);
  if (!e) return base;
  return {...(base ?? {}), ...e, dx: (base?.dx ?? 0) + (e.dx ?? 0), dy: (base?.dy ?? 0) + (e.dy ?? 0)};
};
const tumorBase = (t: number, Rt: number, het: number, i: number, j: number, x: number, y: number, fronts = false): Mod | null => {
  const dx = x - C0.x, dy = y - C0.y, d0 = Math.hypot(dx, dy);
  const d1 = d0 / boundary(Math.atan2(dy, dx));
  // with growth fronts on, a cell is reached when the local front (fingers + cell-scale raggedness) passes it
  const d = fronts ? d1 - (reachAt(Math.atan2(dy, dx), Rt) - Rt) - jitterOf(i, j) * SP * 0.9 * (1 - 0.6 * settle(Rt)) : d1;
  if (Rt > 0 && d < Rt) {
    // convert with a short "division pop" when the front passes
    const rs = rand(((i * 911) ^ (j * 3571)) & 0xffff);
    const born = smooth((Rt - d) / 90);
    // newly added cells appear as divisions at the front: elongated along the growth direction, then rounding off
    const div = born < 1 ? Math.sin(born * Math.PI) : 0;
    return {look: cloneLook(i, j, het), s: lerp(0.72, 0.92 + 0.22 * rs, born), nucScale: 1.2 + 0.3 * rs, round: 0.4, irr: 0.03 + 0.06 * rs, dx: -dx * 0.015, dy: -dy * 0.015, stretch: 1 + 0.55 * div, dir: Math.atan2(dy, dx)};
  }
  if (Rt > 0) {
    // healthy cells ahead of the front are pushed aside and squeezed (harder in front of an invasive finger)
    const pk = fronts ? 1 + 0.8 * fingerK(Math.atan2(dy, dx)) * (1 - settle(Rt)) : 1;
    const push = 0.14 * SP * pk * Math.exp(-(d - Rt) / 380) * clamp01(Rt / 300);
    const sq = Math.min(1, pk * Math.exp(-(d - Rt) / 260)) * clamp01(Rt / 300);
    return {dx: (dx / (d || 1)) * push, dy: (dy / (d || 1)) * push, s: 1 - 0.08 * sq, stretch: 1 + 0.28 * sq, dir: Math.atan2(dy, dx) + Math.PI / 2};
  }
  return null;
};

/** Cells caught in mitosis while the young tumour grows: every cell just behind the advancing front is a fresh
 *  division (daughters along the growth direction), and a few cells divide throughout the packed interior. */
const mitosisAt = (t: number, Rt: number, i: number, j: number, x: number, y: number): {p: number; axis: number} | null => {
  if (Rt <= 0) return null;
  const dx = x - C0.x, dy = y - C0.y, a = Math.atan2(dy, dx);
  const d = Math.hypot(dx, dy) / boundary(a) - (reachAt(a, Rt) - Rt) - jitterOf(i, j) * SP * 0.9 * (1 - 0.6 * settle(Rt));
  const behind = Rt - d;
  if (behind <= 0) return null;
  if (behind < 260) return {p: smooth(behind / 260) * 0.98 + 0.01, axis: (a * 180) / Math.PI + 20 * jitterOf(j, i)};
  const r = rand(((i * 31337) ^ (j * 7331)) & 0xffff);
  const ph = (t * 0.5 + r * 7.3) % 1;
  if (r < 0.3 && ph < 0.16) return {p: ph / 0.16, axis: r * 900};
  return null;
};
/** subclones appear as the mass grows (cell shape, size, nucleus and colour start to differ) */
export const hetA = (t: number) => 0.55 * smooth(clamp01((t - T('Four become thousands')) / 3.2));
const latticeIn = (cam: Cam) => {
  const hw = Math.hypot(W, H) / 2 / cam.z + SP;
  const DY = SP * 0.866;
  return {j0: Math.floor((cam.y - hw) / DY), j1: Math.ceil((cam.y + hw) / DY), i0: Math.floor((cam.x - hw) / SP) - 1, i1: Math.ceil((cam.x + hw) / SP) + 1};
};

// ------------------------------------------------------------------------------------------------ the tissue layer for A
const TissueA: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const a = abn(t);
  const lod = R * cam.z;
  const look0 = lookMix(HEALTHY, TUMOR, a.tint);
  const Rt = tumorR(t);
  const custom = t < CUSTOM_END + 0.6;
  const customOp = 1 - lift(t, CUSTOM_END, CUSTOM_END + 0.6);
  const p1 = mit1(t), p2 = mit2(t), p3 = mit3(t);
  // neighbours make room for the daughters
  const push = (x: number, y: number) => {
    let dx = 0, dy = 0;
    const src: [Pt, number][] = [[C0P, 0.35 * smooth((p1 - 0.4) / 0.6)], [DA, 0.3 * smooth((p2 - 0.4) / 0.6)]];
    src.forEach(([c, k]) => {
      const ex = x - c[0], ey = y - c[1], d = Math.hypot(ex, ey);
      if (d < 1 || k <= 0) return;
      const f = k * R * Math.exp(-((d / (SP * 1.4)) ** 2));
      dx += (ex / d) * f; dy += (ey / d) * f;
    });
    return {dx, dy};
  };
  const het = hetA(t);
  const showMitoses = lod > 14 && Rt > 0;
  const mod = tumorMod(t, Rt, het, (i, j, x, y) => {
    if (i === 0 && j === 0) return custom ? {hide: true} : null;
    if (showMitoses && mitosisAt(t, Rt, i, j, x, y)) return {hide: true};
    if (!custom) return null;
    const pu = push(x, y);
    // neighbours that send the stop signal glow blue at their rim
    return {dx: pu.dx, dy: pu.dy};
  }, true);
  const mitoses: React.ReactNode[] = [];
  if (showMitoses) {
    const b = latticeIn(cam);
    for (let j = b.j0; j <= b.j1; j++)
      for (let i = b.i0; i <= b.i1; i++) {
        if (i === 0 && j === 0) continue;
        const c = cellAt(i, j);
        const m = mitosisAt(t, Rt, i, j, c.x, c.y);
        if (!m) continue;
        mitoses.push(<DividingCell key={`m${i},${j}`} x={c.x} y={c.y} r={R * c.sz * 0.96} seed={c.seed} t={t} p={m.p} axis={m.axis} lod={lod} look={cloneLook(i, j, het)} sepF={0.62} dR={0.78} />);
      }
  }
  // stop signals from six neighbours
  const sig = t > tA.ignores - 0.1 && t < tA.body + 0.4;
  const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([di, dj]) => cellAt(di, dj));
  // immune cell path: crawls in from the left, contacts daughter A, is suppressed and slides back
  const imT0 = tA.body - 0.25, imHit = tA.destroy, imSurv = tA.survives;
  const tgt: Pt = [DA[0] - (R * 0.84 * 0.86 + 52) * 0.98, DA[1] - 8];
  const k1 = smooth((t - imT0) / (imHit - imT0));
  const back = smooth((t - imSurv - 0.1) / 1.2);
  const im: Pt = [lerp(DA[0] - 760, tgt[0], k1) - back * 150, lerp(DA[1] - 200, tgt[1], k1) - back * 60];
  const attack = Math.min(lift(t, imHit - 0.15, imHit + 0.25), 1 - lift(t, imSurv, imSurv + 0.5));
  const bleb = Math.min(lift(t, imHit + 0.05, imHit + 0.5), 1 - lift(t, imSurv, imSurv + 0.7));
  const dLook = lookMix(HEALTHY, TUMOR, a.tint);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot ?? 0}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
        <TissueField cam={cam} t={t} mod={mod} />
        {custom && (
          <g opacity={customOp}>
            {p1 <= 0 && <Cell2 x={C0.x} y={C0.y} seed={C0.seed} t={t} lod={lod} look={look0} pulse={a.pulse} nucScale={1 + 0.12 * a.tint} />}
            {/* while it looks completely normal, a faint rim keeps it findable (the camera never loses its subject) */}
            {p1 <= 0 && a.drain > 0.01 && <circle cx={C0.x} cy={C0.y} r={R * 1.08} fill="none" stroke="#FFF2EA" strokeWidth={2.5} opacity={0.55 * a.drain} />}
            {p1 > 0 && p2 <= 0 && <DividingCell x={C0.x} y={C0.y} seed={C0.seed} t={t} p={p1} axis={AX1} lod={lod} look={dLook} pulse={a.pulse * 0.8} sepF={SEP} dR={0.84} />}
            {p2 > 0 && (
              <>
                {/* daughter B stays; daughter A divides again, then both of its daughters divide */}
                <Cell2 x={DB[0]} y={DB[1]} r={R * 0.86} seed={C0.seed + 5} t={t} lod={lod} look={dLook} pulse={a.pulse * 0.5} round={0.3} />
                {p3 <= 0 && <DividingCell x={DA[0]} y={DA[1]} r={R * 0.86} seed={C0.seed + 9} t={t} p={p2} axis={100} lod={lod} look={dLook} pulse={a.pulse * 0.8} sepF={SEP} dR={0.84} />}
                {p3 > 0 && [-1, 1].map((s) => {
                  const ax = (100 * Math.PI) / 180, off = SEP * R * 0.86;
                  return <DividingCell key={s} x={DA[0] + s * Math.cos(ax) * off} y={DA[1] + s * Math.sin(ax) * off} r={R * 0.72} seed={C0.seed + 13 + s} t={t} p={p3} sepF={SEP} dR={0.84} axis={s > 0 ? 10 : 40} lod={lod} look={dLook} pulse={a.pulse * 0.7} />;
                })}
              </>
            )}
          </g>
        )}
        {mitoses}
        <TumorMassShade Rt={Rt} />
        {/* stop signals: small brake molecules fired by neighbours bounce off the abnormal cell's surface */}
        {sig && nbrs.map((n, k) => {
          const te = tA.ignores + 0.05 + k * 0.2;
          const u = (t - te) / 0.55;
          if (u < 0 || u > 2) return null;
          const tx = C0.x + (n.x - C0.x) * 0.5, ty = C0.y + (n.y - C0.y) * 0.5;
          const inn = Math.min(1, u);
          const out = Math.max(0, u - 1);
          const px = lerp(n.x, tx, smooth(inn)) + (n.x - tx) * out * 0.5 + (k % 2 ? 1 : -1) * out * 30;
          const py = lerp(n.y, ty, smooth(inn)) + (n.y - ty) * out * 0.5 + (k % 2 ? -1 : 1) * out * 24;
          const op = Math.min(1, u * 4) * (1 - smooth(out));
          return (
            <g key={k} opacity={op}>
              <circle cx={n.x} cy={n.y} r={R * 0.92} fill="none" stroke={P.brake} strokeWidth={5} opacity={0.8 * (1 - Math.min(1, u))} />
              <circle cx={px} cy={py} r={34} fill="url(#glowAi)" />
              <circle cx={px} cy={py} r={11} fill={P.brake} stroke="#DDEBFF" strokeWidth={2} />
              <circle cx={px - 3} cy={py - 3} r={4} fill="#FFFFFF" opacity={0.8} />
              {u > 0.95 && u < 1.4 && <circle cx={tx} cy={ty} r={14 + 50 * (u - 0.95)} fill="none" stroke="#9CC8FF" strokeWidth={4} opacity={1 - (u - 0.95) / 0.45} />}
            </g>
          );
        })}
        {/* immune attack */}
        {t > imT0 - 0.1 && t < imSurv + 1.6 && (
          <g>
            <TCell2 x={im[0]} y={im[1]} r={52} t={t} dir={back > 0.05 ? Math.PI : 0.12} lod={lod} act={attack * 0.8} dim={smooth((t - imSurv) / 0.8) * 0.8} op={1 - lift(t, imSurv + 1.0, imSurv + 1.6)} />
            {attack > 0.01 && Array.from({length: 7}, (_, k) => {
              const u = ((t - imHit) * 1.6 + k / 7) % 1;
              const x = lerp(im[0] + 52, DA[0] - R * 0.6, u), y = im[1] + (k - 3) * 9 * (1 - u);
              return <circle key={k} cx={x} cy={y} r={7} fill={P.immuneGold} opacity={attack * (1 - u)} />;
            })}
          </g>
        )}
        {bleb > 0.01 && p2 <= 0 && <g opacity={0} />}
      </g>
      {bleb > 0.01 && <BlebOverlay t={t} cam={cam} k={bleb} />}
      {t > tA.two && t < tA.worse + 0.4 && <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={0.75 * lift(t, tA.two, tA.two + 0.8) * (1 - lift(t, tA.begins, tA.worse + 0.3))} n={8} size={260} />}
    </g>
  );
};
/** surface blebbing of daughter A under attack (drawn as membrane bubbles on its left side) */
const BlebOverlay: React.FC<{t: number; cam: Cam; k: number}> = ({t, cam, k}) => (
  <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot ?? 0}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
    {Array.from({length: 5}, (_, m) => {
      const a = Math.PI + (m - 2) * 0.42;
      const rr = R * 0.86 * 0.84;
      const b = k * (7 + 4 * Math.sin(t * 5 + m)) * (0.7 + 0.3 * rand(m));
      return <circle key={m} cx={DA[0] + Math.cos(a) * (rr + b * 0.4)} cy={DA[1] + Math.sin(a) * (rr + b * 0.4)} r={b} fill={mixHex(TUMOR.fill, HEALTHY.fill, 0.5)} stroke={TUMOR.deep} strokeWidth={2} />;
    })}
  </g>
);

// ------------------------------------------------------------------------------------------------ the DNA layer for A
// each regulator ARRIVES and binds its site as it is named, then does its job: the accelerator sends a growth signal,
// the brake binds and the signal stops, the death switch binds and primes; then they fail.
const arriveK = (t: number, a: number) => lift(t, a - 0.5, a + 0.05);
const protState = (t: number, kind: 'grow' | 'stop' | 'die') => {
  const failK = lift(t, tA.fail, tA.fail + 0.8);
  if (kind === 'grow') {
    const ar = arriveK(t, tA.grows);
    return {x: GENE.grow, t, kind, act: lift(t, tA.grows, tA.grows + 0.2) * (1 - 0.6 * lift(t, tA.stops, tA.stops + 0.3)) + lift(t, tA.wrong, tA.wrong + 0.4), stuck: lift(t, tA.wrong, tA.wrong + 0.5), warp: failK * 0.15, off: 1 - ar, op: ar > 0.001 ? 1 : 0};
  }
  if (kind === 'stop') {
    const ar = arriveK(t, tA.stops);
    // grip loosens as its site fails, then it lets go and drifts away
    const loose = failK * 0.12 + lift(t, tA.wrong + 0.3, tA.wrongE + 0.2);
    return {x: GENE.stop, t, kind, act: lift(t, tA.stops, tA.stops + 0.2) * (1 - failK * 0.7), warp: failK * 0.4, off: Math.max(1 - ar, loose), op: (ar > 0.001 ? 1 : 0) * (1 - lift(t, tA.wrongE - 0.3, tA.wrongE + 0.3))};
  }
  const ar = arriveK(t, tA.dies);
  return {x: GENE.die, t, kind, act: lift(t, tA.dies, tA.dies + 0.2) * (1 - failK * 0.7), warp: failK * 0.7 + lift(t, tA.wrong, tA.wrong + 0.6), off: Math.max(1 - ar, lift(t, tA.wrong + 0.7, tA.wrongE + 0.3)), op: (ar > 0.001 ? 1 : 0) * (1 - lift(t, tA.wrongE - 0.2, tA.wrongE + 0.4))};
};
/** the accelerator's signal: a regulated burst after it binds, cut off once the brake binds; later a locked-on stream */
const signalOn = (t: number) => Math.min(lift(t, tA.grows + 0.1, tA.grows + 0.3), 1 - lift(t, tA.stops + 0.05, tA.stops + 0.4));
const mutA = (t: number) => (i: number) => {
  // scattered small mistakes accumulating, then mutations under the three genes, then a spreading wave
  const r = rand(i * 977 + 5);
  const x = i * (360 / 10.5);
  let m = 0;
  if (r < 0.06) m = lift(t, tA.deep + 1.5 + r * 40, tA.deep + 1.9 + r * 40);
  for (const g of [GENE.grow, GENE.stop, GENE.die]) if (Math.abs(x - g) < 40) m = Math.max(m, lift(t, tA.fail + (g - GENE.grow) / 1800, tA.fail + 0.5 + (g - GENE.grow) / 1800));
  const wave = (t - tA.wrong - 0.3) * 900;
  if (wave > 0 && Math.abs(x - GENE.grow) < wave && r < 0.4) m = Math.max(m, smooth((wave - Math.abs(x - GENE.grow)) / 200));
  return m;
};
const DnaA: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const hw = W / 2 / cam.z + 400;
  return (
    <g>
      <NucleoplasmBack cam={cam} t={t} mut={lift(t, tA.wrong, tA.wrongE)} />
      <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot ?? 0}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
        {(['grow', 'stop', 'die'] as const).map((k) => <RegProteinBack key={k} {...protState(t, k)} />)}
        <Helix2 x0={cam.x - hw} x1={cam.x + hw} t={t} mut={mutA(t)} kink={lift(t, tA.wrong + 0.2, tA.wrong + 1.0)} kinkX={GENE.grow} lod={cam.z} />
        {(['grow', 'stop', 'die'] as const).map((k) => <RegProtein key={k} {...protState(t, k)} />)}
        <g opacity={signalOn(t)}><GrowSignal x={GENE.grow} t={t} t0={tA.grows + 0.1} rate={t > tA.grows + 0.1 ? 1.4 : 0} /></g>
        <GrowSignal x={GENE.grow} t={t} t0={tA.wrong + 0.2} rate={t > tA.wrong + 0.2 ? 2.2 : 0} />
        {/* the brake sits between the accelerator's signal and the rest of the gene: its block is drawn as a bar */}
        {/* identifiable sites of change under each regulator */}
        {[GENE.grow, GENE.stop, GENE.die].map((g, k) => {
          const on = lift(t, tA.fail + k * 0.25, tA.fail + 0.4 + k * 0.25);
          return on > 0.01 && <circle key={k} cx={g} cy={0} r={95} fill="none" stroke={P.mutation} strokeWidth={8} strokeDasharray="20 14" opacity={on * (1 - 0.6 * lift(t, tA.wrongE, tA.wrongE + 0.4))} />;
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ zoom-level layering
const wInterior = (z: number) => smooth((Math.log(z) - Math.log(3.2)) / (Math.log(5.2) - Math.log(3.2)));
const wDna = (z: number) => smooth((Math.log(z) - Math.log(150)) / (Math.log(228) - Math.log(150)));

const MicroA: React.FC<{t: number}> = ({t}) => {
  const tc = microCam(t);
  const wi = wInterior(tc.z), wd = wDna(tc.z);
  const a = abn(t);
  const ci = toInterior(tc);
  return (
    <g>
      {wd < 1 && <TissueA t={t} cam={tc} />}
      {wi > 0.001 && wd < 1 && (
        <g opacity={wi}>
          <Interior t={t} cam={ci} seed={C0.seed} bg={false} mut={lift(t, tA.deep + 1.4, tA.dna + 0.3) * 0.7 + 0.3 * lift(t, tA.wrong, tA.wrongE)} pulse={a.pulse}
            helix={{mut: mutA(t), kink: lift(t, tA.wrong + 0.2, tA.wrong + 1.0), kinkX: GENE.grow}} signals={lift(t, tA.wrong + 0.4, tA.wrongE)} />
        </g>
      )}
      {wd > 0.001 && (
        <g opacity={wd}>
          <DnaA t={t} cam={toDNA(ci)} />
        </g>
      )}
      {wd < 0.5 && <Motes cam={tc} t={t} />}
    </g>
  );
};

export const shotsA: Shot[] = [
  {
    id: 'A-body',
    t0: 0,
    t1: HAND1[1],
    draw: (t) => <BodyWorld t={t} cam={OPEN(t)} body={{glow: 0.45, chest: 1, lesion: 1}} lungTumor={0.9} />,
  },
  {id: 'A-micro', t0: HAND1[0], t1: tA.worse + 0.45, fade: HAND1[1] - HAND1[0], draw: (t) => <MicroA t={t} />},
];
export const _a = {nearest, CLONES, TE, P};
