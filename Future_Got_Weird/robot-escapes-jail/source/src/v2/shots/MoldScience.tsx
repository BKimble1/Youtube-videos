// MS (13.67-22.56 s): MOLD + SCIENCE. "Then scientists collected the metal and molded it back into shape. How? It's made
// from a metal that melts near body temperature. And magnets help control its movement."
//
// One continuous camera from the LB hand-off puddle to the MS -> FU hand-off blob:
//   13.67-13.87  exactly LAB_HANDOFF.cam + <LabHandoffPuddle t/> (contract LB -> MS)
//   13.87-15.05  "Then scientists collected the metal": the camera eases in on the puddle; a gloved hand brings a transfer
//                pipette in from the right, squeezes the air out, dips; on "collected" the bulb is released and the puddle
//                DRAINS INTO THE TIP (its area shrinks exactly as the barrel's silver column rises, its centre runs to the tip)
//   15.05-16.08  the pipette lifts; the camera follows it right to an open two-part silicone mold; "and molded it": the bulb
//                is squeezed and the liquid fills the figure-shaped cavity from the sprue / feet up (flat liquid mirror)
//   16.08-16.46  cooling in room air: a cool solidification front sweeps feet -> head (liquid mirror -> solid chrome),
//                tiny glints; the pipette leaves, tweezers come in
//   16.46-17.15  "back into shape": tweezers close on the head and tip the re-formed solid figure up out of the cavity until
//                it stands; the camera cranes down to it ("RECAST IN A MOLD")
//   17.08-18.02  "How?": a motivated push straight into the figure's chest (C1 log-zoom spline: it crosses the surface at
//                17.52 at a steady speed, no zoom punch); the figure's chrome becomes the engine's ChromeSurface (scaled
//                from the chest, as LB came out of it) and the zoom carries on INTO the metal: the big reflections give way
//                (Z 1.6 -> 4.2) to crystal facets and the NdFeB microparticles (art/micro.tsx), never a blank frame
//   18.04-18.70  "It's made from a metal": GALLIUM (the matrix) + MAGNETIC PARTICLES (a grain) labels
//   18.62-20.50  "that melts near body temperature": the camera tilts down to the sample's underside: the induction coil
//                below energises (orange glow + AC arcs, "AC FIELD HEATS IT"), a thermometer slides in: the reading
//                rises past GALLIUM MELTS 29.8 C (BODY 37 C marked above, never reached): a melt front sweeps up through
//                the material, facets / grain boundaries dissolve into flowing liquid, the grains break loose; the
//                coil is switched off and taken away (heat and magnet are separate)
//   20.44-22.36  "And magnets help control its movement": the field arrives from the upper right (cyan lines THROUGH the
//                metal), every grain turns to align with it, the material starts to flow toward it; 20.80-21.50 the camera
//                pulls back out of the drop (cutaway) to the hand-off scale and reveals the external magnet; the cutaway
//                closes into a chrome drop; on "control" the magnet closes in, then LEADS the drop up the pull axis and the
//                stretched drop follows it onto the hand-off spot (540, 1100); the magnet lifts away, the drop relaxes
//   22.36-22.56  exactly C.navy1 + <HandoffBlob t/> (contract MS -> FU, 6 frames)
import React from 'react';
import {C, INK, INK_PX} from '../../art/palette';
import {uid} from '../../core/ids';
import {clamp, keyS, lerp, noise1, ss, ss5, hash} from '../../lib';
import {Cam3, P3, toCam} from '../../world';
import {T} from '../story2';
import {Tag} from '../Tag';
import {Prim, projectPrims, sdField} from '../liquid/sdf';
import {isoPath} from '../liquid/march';
import {buildChrome, ChromeBody, ChromeGeo, ChromePaint, ChromeSurface, HANDOFF, HandoffBlob, handoffPrims} from '../liquid/Chrome';
import {calibrate, floorPrims, scalePrim} from '../liquid/flow';
import {FIG, labFigureLocal, mapPrim} from '../labFigure';
import {
  CageBack, CageFront, camLook, LAB, LAB_ENV, LAB_HAND, LAB_HANDOFF, LAB_SHOTS, LAB_STREAM, LabACArcs, LabBackdrop, LabHandoffPuddle,
  LabHandTool, LabMagnet, LabMold, labProj, labProjPoly, labPuddleFloor, LabShot, LabStage, LabVignette, LabWorld, LIQ_SHADE, shotCam,
} from '../art/labset';
import {
  FieldLinesDraw, fieldLines, frontY, Gauge, GAUGE, gaugeY, Grain, grainPx, grainsIn, GrainDraw, GRAIN_LAYERS, lerpAng, liqAt, Magnet2,
  Magnet2D, MC, MeltFrontLine, MicroGrains, MicroMatrix, microToScreen, MicroView, dipoleField,
} from '../art/micro';
import {ACFieldArcs, InductionCoil} from '../../art/science';

type V = {x: number; y: number};
type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const f3 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));

// =====================================================================================================================
// TIMING (film seconds, keyed to the measured words T)
// =====================================================================================================================
export const MS_T = {
  t0: 13.67,
  hold: 13.87, // until here: exactly the LB hand-off frame
  enter: [13.93, 14.36] as const, // the pipette + hand slide in
  air: [14.16, 14.34] as const, // the bulb is squeezed (air out) while the tip descends
  dip: 14.4, // the tip touches the puddle
  draw: [T.collected, 15.05] as const, // "collected" 14.47: the puddle drains into the tip
  carry: [15.08, 15.6] as const, // lifted and carried to the mold
  fill: [15.58, 16.08] as const, // "molded" 15.43: the cavity fills (feet first)
  pipOut: [16.08, 16.4] as const,
  cool: [16.08, 16.44] as const, // solidification front feet -> head
  twIn: [16.1, 16.44] as const, // tweezers in
  grip: T.shape, // 16.47 "shape": the tweezers close on the head
  pivot: [16.52, 16.96] as const, // the figure is tipped up until it stands
  twOut: [16.98, 17.3] as const,
  push: [17.08, 18.02] as const, // "How?" 17.13: into the chest -> into the metal (one log-zoom, C1 spline)
  surf: 17.52, // the push crosses the chest surface (ChromeSurface) in the pause after "How?"
  labels: [18.04, 18.7] as const, // "made from a metal"
  tilt: [18.6, 19.0] as const, // down to the underside: the coil
  coilOn: 18.72,
  melt: [19.12, 19.8] as const, // the melt front sweeps up
  coilOff: [20.12, 20.5] as const,
  field: [20.44, 20.95] as const, // "And magnets" 20.56: the field arrives (lines through the metal), the grains align
  pullBack: [20.8, 21.5] as const, // the camera pulls back out of the drop: the magnet comes into view
  move: [21.3, 22.22] as const, // "control its movement": the magnet leads, the drop follows it (stretched toward it)
  settle: [21.98, 22.33] as const,
  blob: 22.36, // from here: exactly navy1 + HandoffBlob
  t1: 22.56,
};
const S = MS_T;
/** context tags: top-left, above the caption band (same place as LB's tags) */
export const MS_TAG = {x: 48, y: 168, size: 38};

// =====================================================================================================================
// LAB LAYOUT (mm): the open mold to the right of the cage (off-frame in the hand-off camera, revealed by following the
// pipette), the cast figure lying in it (feet at the near / sprue end), standing after the tip-up
// =====================================================================================================================
export const MS_MOLD = {x: 20, d: -12};
const TH = LAB.MOLD.th;
const KK = LAB.FIG_H / FIG.H; // mm per figure unit
/** the cast figure's feet (centre) on the mold face: the cavity's feet are at D = -5 */
const FEET: P3 = {x: MS_MOLD.x, h: TH, d: MS_MOLD.d - 5};
/** where the pipette drains the puddle (floor x, d) and the sprue mouth on the mold */
const DRAIN = {x: 1.2, d: -6.8};
const SPRUE_TIP: P3 = {x: MS_MOLD.x, h: TH + 0.32, d: MS_MOLD.d - 6.7};
const CHEST_Y = -5.32; // figure units (torso centre)

// =====================================================================================================================
// CAMERA (lab part): a Hermite spline through look-at keys (velocity carried), then the push into the chest
// =====================================================================================================================
const splineKeys = (t: number, keys: [number, number][]): number => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t1, y1] = keys[i], [t2, y2] = keys[i + 1];
  const h = t2 - t1;
  const slope = (j: number) => (j <= 0 || j >= n - 1 ? 0 : (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]));
  const m1 = slope(i) * h, m2 = slope(i + 1) * h;
  const x = (t - t1) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * y1 + (x3 - 2 * x2 + x) * m1 + (-2 * x3 + 3 * x2) * y2 + (x3 - x2) * m2;
};
const shot = (p: [number, number, number], at: [number, number, number], f: number): LabShot => ({p: {x: p[0], h: p[1], d: p[2]}, at: {x: at[0], h: at[1], d: at[2]}, f});
/** the standing figure's hero framing (the push starts here) */
export const MS_STAND = shot([MS_MOLD.x - 3.2, 10.6, -41], [MS_MOLD.x, TH + 5.6, FEET.d], 2050);
export const MS_CAM_KEYS: [number, LabShot][] = [
  [S.hold, LAB_SHOTS.handoff],
  // ease in on the puddle as the hand arrives (the subject grows, the hand has room on the right)
  [14.5, shot([-1.8, 24.5, -24.5], [1.9, 0.3, -6.7], 2080)],
  [15.04, shot([-1.0, 23.5, -23.8], [2.3, 0.4, -6.9], 2100)],
  // follow the pipette right to the mold
  [15.66, shot([MS_MOLD.x - 2.5, 25, -40], [MS_MOLD.x + 0.8, 1.4, MS_MOLD.d - 2.2], 2150)],
  // settle closer on the cavity while it fills and cools
  [16.32, shot([MS_MOLD.x - 2.2, 19.5, -36], [MS_MOLD.x + 0.4, TH, MS_MOLD.d - 2.0], 2250)],
  // crane down with the rising head to the standing figure
  [16.98, MS_STAND],
];
const camShotAt = (t: number): LabShot => {
  const K = MS_CAM_KEYS;
  const sp = (g: (s: LabShot) => number) => splineKeys(t, K.map(([tt, s]) => [tt, g(s)] as [number, number]));
  return {p: {x: sp((s) => s.p.x), h: sp((s) => s.p.h), d: sp((s) => s.p.d)}, at: {x: sp((s) => s.at.x), h: sp((s) => s.at.h), d: sp((s) => s.at.d)}, f: sp((s) => s.f)};
};

// the push: ONE log-magnification curve from the standing figure, through its chest (ChromeSurface), into the metal
const CHEST_W: P3 = {x: FEET.x, h: TH - CHEST_Y * KK, d: FEET.d};
const PUSH_D0 = Math.hypot(MS_STAND.p.x - CHEST_W.x, MS_STAND.p.h - CHEST_W.h, MS_STAND.p.d - CHEST_W.d);
const PUSH_D1 = 1.8;
/** log magnification at which the camera is 1.8 mm off the chest (the ChromeSurface frame) */
export const LAM_S = Math.log(PUSH_D0 / PUSH_D1);
/** micro zoom reached at the end of the push */
export const Z_IN = 12;
const LAM_E = LAM_S + Math.log(Z_IN);
/** log magnification: a C1 Hermite spline through (start, 0), (surface, LAM_S), (end, LAM_E): it accelerates toward the
 *  chest, crosses the surface at a steady speed (no zoom punch) and decelerates into the magnified metal */
export const msLam = (t: number) => splineKeys(t, [[S.push[0], 0], [S.surf, LAM_S], [S.push[1], LAM_E]]);
/** the film time at which the push reaches the chest surface (ChromeSurface) */
export const T_SURF = (() => {
  let a: number = S.push[0], b: number = S.push[1];
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (msLam(m) < LAM_S) a = m;
    else b = m;
  }
  return (a + b) / 2;
})();
const pushCam = (t: number): Cam3 => {
  const lam = Math.min(msLam(t), LAM_S);
  const dist = PUSH_D0 * Math.exp(-lam);
  const D0 = {x: (MS_STAND.p.x - CHEST_W.x) / PUSH_D0, h: (MS_STAND.p.h - CHEST_W.h) / PUSH_D0, d: (MS_STAND.p.d - CHEST_W.d) / PUSH_D0};
  const w = ss(lam / LAM_S, 0.05, 0.9);
  const at = {x: lerp(MS_STAND.at.x, CHEST_W.x, ss(lam / LAM_S, 0, 0.6)), h: lerp(MS_STAND.at.h, CHEST_W.h, ss(lam / LAM_S, 0, 0.6)), d: CHEST_W.d};
  let dx = lerp(D0.x, 0, w), dh = lerp(D0.h, 0, w), dd = lerp(D0.d, -1, w);
  const l = Math.hypot(dx, dh, dd);
  dx /= l;
  dh /= l;
  dd /= l;
  return camLook({x: at.x + dx * dist, h: at.h + dh * dist, d: at.d + dd * dist}, at, MS_STAND.f);
};
export const msLabCam = (t: number): Cam3 => {
  if (t < S.hold) return LAB_HANDOFF.cam;
  if (t >= S.push[0]) return pushCam(t);
  return shotCam(camShotAt(t));
};

// =====================================================================================================================
// THE CAST FIGURE AS A PLANAR CARD in the world (lying in the cavity -> tipped up -> standing), shaded by the chrome
// engine in the card's own (undistorted) plane and warped point by point through the true perspective projection, so
// it fits the projected cavity exactly at any angle.
// =====================================================================================================================
type Card = {O: P3; U: P3; V: P3};
const cardAt = (phi: number): Card => ({O: FEET, U: {x: 1, h: 0, d: 0}, V: {x: 0, h: Math.sin(phi), d: Math.cos(phi)}});
/** world point of figure-local (x, y) (figure units, y DOWN, feet at 0) */
const cardW = (c: Card, x: number, y: number): P3 => ({x: c.O.x + c.U.x * x * KK - c.V.x * y * KK, h: c.O.h + c.U.h * x * KK - c.V.h * y * KK, d: c.O.d + c.U.d * x * KK - c.V.d * y * KK});
/** screen -> card plane (figure units) by ray casting */
const rayToCard = (cam: Cam3, c: Card, sx: number, sy: number): V | null => {
  const rad = Math.PI / 180;
  const X = (sx - 540) / cam.f, Y = -(sy - 960) / cam.f, Z = 1;
  const cp = Math.cos(cam.pitch * rad), sp = Math.sin(cam.pitch * rad);
  const y1 = cp * Y - sp * Z, z1 = sp * Y + cp * Z;
  const cy = Math.cos(cam.yaw * rad), sy2 = Math.sin(cam.yaw * rad);
  const x2 = cy * X + sy2 * z1, z2 = -sy2 * X + cy * z1;
  const dir = {x: x2, h: y1, d: z2};
  // plane normal = U x V
  const n = {x: c.U.h * c.V.d - c.U.d * c.V.h, h: c.U.d * c.V.x - c.U.x * c.V.d, d: c.U.x * c.V.h - c.U.h * c.V.x};
  const den = dir.x * n.x + dir.h * n.h + dir.d * n.d;
  if (Math.abs(den) < 1e-6) return null;
  const k = ((c.O.x - cam.x) * n.x + (c.O.h - cam.h) * n.h + (c.O.d - cam.d) * n.d) / den;
  if (k <= 0) return null;
  const p = {x: cam.x + dir.x * k - c.O.x, h: cam.h + dir.h * k - c.O.h, d: cam.d + dir.d * k - c.O.d};
  return {x: (p.x * c.U.x + p.h * c.U.h + p.d * c.U.d) / KK, y: -(p.x * c.V.x + p.h * c.V.h + p.d * c.V.d) / KK};
};
const warpD = (d: string, map: (x: number, y: number) => V) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_m, a: string, b: string) => {
    const p = map(+a, +b);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });
const SPRUE: Prim = {k: 'box', x: 0, y: 1.06, hw: 0.31, hh: 1.08, r: 0.12, rot: 0};
type CardMode = 'solid' | 'liquid';
type CardGeo = {geo: ChromeGeo; map: (x: number, y: number) => V; k: number; toS: (fx: number, fy: number) => V};
const cardGeo = (cam: Cam3, phi: number, mode: CardMode, withSprue = false, onlySprue = false): CardGeo | null => {
  const c = cardAt(phi);
  const ch = labProj(cam, cardW(c, 0, CHEST_Y));
  if (!ch) return null;
  const k = Math.max(4, ch.s * KK); // local px per figure unit ~ screen px at the chest
  const toS = (fx: number, fy: number): V => {
    const p = labProj(cam, cardW(c, fx, fy));
    return p ? {x: p.x, y: p.y} : {x: 540, y: 960};
  };
  const map = (x: number, y: number) => toS(x / k, y / k);
  const base = onlySprue ? [] : labFigureLocal();
  const P = [...base, ...(withSprue || onlySprue ? [{...SPRUE, g: 1}] : [])].map((p) => mapPrim(p, 0, 0, k, 0));
  const prims: Prim[] = mode === 'liquid' ? P.map((p) => ({...p, g: 0})) : P;
  // the local clip box: the frame back-projected onto the card (close-ups), else the figure's own extent
  let clip = {x0: -4 * k, y0: -10.5 * k, x1: 4 * k, y1: 3 * k};
  const cs = [rayToCard(cam, c, -80, -80), rayToCard(cam, c, 1160, -80), rayToCard(cam, c, -80, 2000), rayToCard(cam, c, 1160, 2000)];
  if (cs.every((q) => q)) {
    const xs = cs.map((q) => q!.x * k), ys = cs.map((q) => q!.y * k);
    clip = {x0: Math.max(clip.x0, Math.min(...xs)), y0: Math.max(clip.y0, Math.min(...ys)), x1: Math.min(clip.x1, Math.max(...xs)), y1: Math.min(clip.y1, Math.max(...ys))};
  }
  if (clip.x1 - clip.x0 < 4 || clip.y1 - clip.y0 < 4) return null;
  const b = 0.06 * k;
  const geo =
    mode === 'solid'
      ? buildChrome(prims, {blend: b, groupBlend: [b, b, b, b, b], rigid: [1, 1, 1, 1, 1], groupR: [1.5, 0.6, 1.2, 0.45, 0.9].map((x) => x * k), groupBand: [1, 0, 1, 0, 1], R: 1.6 * k, clip, specs: 2})
      : buildChrome(prims, {blend: b, R: 0.7 * k, clip, specs: 2, band: 0});
  if (!geo) return null;
  return {geo, map, k, toS};
};
const warpGeo = (G: CardGeo): ChromeGeo => {
  const g = G.geo;
  const cs = [G.map(g.bbox.x0, g.bbox.y0), G.map(g.bbox.x1, g.bbox.y0), G.map(g.bbox.x0, g.bbox.y1), G.map(g.bbox.x1, g.bbox.y1)];
  return {
    ...g,
    sil: warpD(g.sil, G.map),
    layers: g.layers.map((l) => ({...l, d: warpD(l.d, G.map)})),
    seams: g.seams.map((s) => ({...s, d: warpD(s.d, G.map), clip: s.clip ? warpD(s.clip, G.map) : null})),
    bbox: {x0: Math.min(...cs.map((p) => p.x)), y0: Math.min(...cs.map((p) => p.y)), x1: Math.max(...cs.map((p) => p.x)), y1: Math.max(...cs.map((p) => p.y))},
  };
};
/** a figure-local polygon (figure units) -> screen path */
const cardPoly = (G: CardGeo, pts: V[]) => 'M' + pts.map((p) => G.toS(p.x, p.y)).map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + 'Z';
/** the band of the card below level y (feet side), with a slightly convex meniscus front */
const bandBelow = (y: number): V[] => {
  const pts: V[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = -3.2 + (6.4 * i) / 12;
    pts.push({x, y: y - 0.16 * Math.cos((x / 3.2) * (Math.PI / 2))});
  }
  return [...pts, {x: 3.2, y: 3.5}, {x: -3.2, y: 3.5}];
};
const bandAbove = (y: number): V[] => {
  const pts: V[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = -3.2 + (6.4 * i) / 12;
    pts.push({x, y: y - 0.16 * Math.cos((x / 3.2) * (Math.PI / 2))});
  }
  return [...pts, {x: 3.2, y: -11}, {x: -3.2, y: -11}];
};

/** the cast: fill (liquid level, figure units: from the sprue at y 2.2 to the head top -9.1), cool front, solid look */
const Cast: React.FC<{cam: Cam3; t: number; phi: number; level: number; front: number; coolK: number}> = ({cam, t, phi, level, front, coolK}) => {
  const out: React.ReactNode[] = [];
  const ids = {a: uid('msCa'), b: uid('msCb'), c: uid('msCc'), g: uid('msCg')};
  const lifted = phi > 0.001;
  // the sprue stub stays in the mold channel (liquid, then solid) once the figure is lifted out
  if (lifted) {
    const Gs = cardGeo(cam, 0, 'solid', false, true);
    if (Gs) {
      const gw = warpGeo(Gs);
      // the stub sits recessed in the sprue channel: shaded by the channel walls once the figure is up, so it does not
      // read as part of the standing figure
      out.push(
        <g key="sp">
          <ChromePaint geo={gw} ink={INK_PX * 0.8} />
          <path d={gw.sil} fill={C.navy1} opacity={f3(0.62 * ss(phi, 0.2, 1.2))} fillRule="evenodd" />
        </g>,
      );
    }
  }
  // liquid part: between the fill level and the solidification front
  const liquidVisible = level < 2.25 && front > level - 0.2 && !lifted;
  if (liquidVisible) {
    const G = cardGeo(cam, phi, 'liquid', true);
    if (G) {
      const clipPts = bandBelow(level);
      const geo = warpGeo(G);
      out.push(
        <g key="liq">
          <defs>
            <clipPath id={ids.a}>
              <path d={cardPoly(G, clipPts)} />
            </clipPath>
            <clipPath id={ids.b}>
              <path d={cardPoly(G, bandAbove(front))} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${ids.a})`}>
            <g clipPath={front < 2.3 ? `url(#${ids.b})` : undefined}>
              <ChromePaint geo={geo} ink={INK_PX * 0.8} />
            </g>
          </g>
        </g>,
      );
    }
  }
  // solid part: behind the front (feet side), or everything once lifted
  if (front < 2.3 || lifted) {
    const G = cardGeo(cam, phi, 'solid', !lifted);
    if (G) {
      const geo = warpGeo(G);
      const sweeping = !lifted && front > -9.3;
      out.push(
        <g key="sol">
          {sweeping && (
            <defs>
              <clipPath id={ids.c}>
                <path d={cardPoly(G, bandBelow(front))} />
              </clipPath>
              <linearGradient id={ids.g} gradientUnits="userSpaceOnUse" x1={f1(G.toS(0, front).x)} y1={f1(G.toS(0, front).y)} x2={f1(G.toS(0, front + 1.6).x)} y2={f1(G.toS(0, front + 1.6).y)}>
                <stop offset="0" stopColor="#D9F3FF" stopOpacity={0.75} />
                <stop offset="1" stopColor="#9FD8FF" stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <g clipPath={sweeping ? `url(#${ids.c})` : undefined}>
            <ChromePaint geo={geo} ink={INK_PX * 0.8} />
            {/* the cool tint just behind the solidification front (room-air cooling) */}
            {sweeping && coolK > 0.01 && (
              <g clipPath={undefined}>
                <path d={geo.sil} fill={`url(#${ids.g})`} opacity={f3(0.85 * coolK)} fillRule="evenodd" />
              </g>
            )}
          </g>
          {sweeping && (
            // the front itself: a thin cool line across the cast
            <path d={'M' + Array.from({length: 13}, (_, i) => -3.2 + (6.4 * i) / 12).map((x) => G.toS(x, front - 0.16 * Math.cos((x / 3.2) * (Math.PI / 2)))).map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')} fill="none" stroke="#E6F8FF" strokeWidth={2.4} opacity={f3(0.8 * coolK)} clipPath={undefined} />
          )}
          {sweeping && <Sparkles G={G} t={t} front={front} amt={coolK} />}
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};
/** tiny crystalline glints popping just behind the cooling front */
const Sparkles: React.FC<{G: CardGeo; t: number; front: number; amt: number}> = ({G, t, front, amt}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const ph = (t * 3.4 + hash(i * 3.3)) % 1;
    const life = Math.sin(Math.PI * ph);
    if (life < 0.05) continue;
    const cyc = Math.floor(t * 3.4 + hash(i * 3.3));
    const x = (hash(i * 7.1 + cyc) - 0.5) * 1.6;
    const y = front + 0.25 + 1.2 * hash(i * 5.7 + cyc * 1.3);
    if (y > 0.2 || y < -9) continue;
    const p = G.toS(x, y);
    const r = (5 + 7 * hash(i + cyc)) * life;
    out.push(
      <path key={i} d={`M${f1(p.x)},${f1(p.y - r)}L${f1(p.x + r * 0.22)},${f1(p.y - r * 0.22)}L${f1(p.x + r)},${f1(p.y)}L${f1(p.x + r * 0.22)},${f1(p.y + r * 0.22)}L${f1(p.x)},${f1(p.y + r)}L${f1(p.x - r * 0.22)},${f1(p.y + r * 0.22)}L${f1(p.x - r)},${f1(p.y)}L${f1(p.x - r * 0.22)},${f1(p.y - r * 0.22)}Z`} fill="#FFFFFF" opacity={f3(amt * 0.95)} />,
    );
  }
  return <g>{out}</g>;
};

// =====================================================================================================================
// THE DRAINING PUDDLE (the hand-off puddle, its area shrinking into the pipette tip; draw = 0 is exactly labHandoffPuddle)
// =====================================================================================================================
const DrainPuddle: React.FC<{cam: Cam3; t: number; draw: number}> = ({cam, t, draw}) => {
  const P = LAB_HANDOFF.puddle;
  const left = Math.max(0, 1 - draw);
  const R = P.rx * Math.sqrt(left);
  if (R < 0.12) return null;
  const run = Math.pow(ss(draw, 0, 1), 0.8);
  const cx = lerp(P.x, DRAIN.x, run), cd = lerp(P.d, DRAIN.d, run);
  const pd = labPuddleFloor({x: cx, d: cd, R, t, seed: P.seed, settle: 1});
  const prims = projectPrims(cam, floorPrims(pd.prims, 0, LAB_STREAM.thick));
  const s = labProj(cam, {x: cx, h: 0, d: cd})?.s ?? 40;
  const rip = 0.6 * (1 - ss(draw, 0, 0.35));
  const ripples: React.ReactNode[] = [];
  if (rip > 0.003) {
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.55 + k / 3) % 1;
      const r = R * (0.15 + 0.6 * ph);
      const pts: P3[] = Array.from({length: 40}, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return {x: cx - 0.4 + Math.cos(a) * r, h: LAB_STREAM.thick + 0.02, d: cd - 0.3 + Math.sin(a) * r};
      });
      const pp = labProjPoly(cam, pts);
      ripples.push(<path key={k} d={'M' + pp.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={f3(rip * Math.sin(Math.PI * ph) * 0.5)} />);
    }
  }
  return (
    <ChromeBody prims={prims} blend={pd.blend * s} R={LIQ_SHADE.R * s} specs={2} env={LAB_ENV} band={LIQ_SHADE.band}>
      {ripples}
    </ChromeBody>
  );
};

// =====================================================================================================================
// LAB STATE
// =====================================================================================================================
const H0 = LAB_HAND.collect;
/** the pipette hand (from LAB_HAND.collect, tilted so the hand sits in frame at the right, clear of the subject) */
const PIP = {ang: -50, handAng: 186, handMM: 7.5, toolMM: 8.5, thumbSide: H0.thumbSide};
export const msLab = (t: number) => {
  const cam = msLabCam(t);
  const draw = ss(t, S.draw[0], S.draw[1]);
  // pipette tip (world): hover -> dip -> (draw) -> lift -> carry -> the sprue -> out
  const tip: P3 = {
    x: splineKeys(t, [[S.carry[0], DRAIN.x], [S.carry[1] - 0.04, SPRUE_TIP.x]]),
    d: splineKeys(t, [[S.carry[0], DRAIN.d], [S.carry[1] - 0.04, SPRUE_TIP.d]]),
    h: splineKeys(t, [[14.1, 3.2], [S.dip, 0.3], [S.draw[1], 0.3], [15.3, 3.0], [15.44, 3.4], [S.carry[1], SPRUE_TIP.h], [S.fill[1], SPRUE_TIP.h], [S.pipOut[1], SPRUE_TIP.h + 5]]),
  };
  const carryU = ss(t, S.carry[0], S.carry[1]);
  const pip = {
    tip,
    enter: t < S.pipOut[0] ? ss(t, S.enter[0], S.enter[1]) : 1 - ss(t, S.pipOut[0], S.pipOut[1]),
    // air out while descending, released on "collected" (suction), squeezed again into the mold
    squeeze: t < S.carry[0] ? ss(t, S.air[0], S.air[1]) * (1 - ss(t, S.draw[0], S.draw[0] + 0.3)) : ss(t, S.fill[0] - 0.04, S.fill[1] - 0.1),
    fill: t < S.fill[0] ? draw : 1 - ss(t, S.fill[0], S.fill[1]),
    handMM: lerp(PIP.handMM, 9.2, carryU),
    toolMM: lerp(PIP.toolMM, 10.5, carryU),
    ang: lerp(PIP.ang, -38, carryU),
    on: t > S.enter[0] && t < S.pipOut[1],
  };
  const fillU = ss(t, S.fill[0] + 0.02, S.fill[1]);
  // the liquid level (figure units, y down): sprue mouth 2.2 -> head top -9.15
  const level = lerp(2.25, -9.25, fillU);
  const coolU = ss(t, S.cool[0], S.cool[1]);
  const front = t < S.cool[0] ? 2.4 : lerp(0.3, -9.4, coolU);
  const coolK = ss(t, S.cool[0], S.cool[0] + 0.06) * (1 - ss(t, S.cool[1] - 0.06, S.cool[1] + 0.04));
  const phi = (Math.PI / 2) * ss5(t, S.pivot[0], S.pivot[1]);
  const tw = {
    on: t > S.twIn[0] && t < S.twOut[1],
    enter: t < S.twOut[0] ? ss(t, S.twIn[0], S.twIn[1]) : 1 - ss(t, S.twOut[0], S.twOut[1]),
    open: 0.9 * (1 - ss(t, S.grip - 0.03, S.grip + 0.05)) + 0.9 * ss(t, S.twOut[0] - 0.02, S.twOut[0] + 0.08),
  };
  return {cam, draw, pip, level, front, coolK, phi, tw};
};

export const LabPart: React.FC<{t: number}> = ({t}) => {
  const st = msLab(t);
  const {cam} = st;
  const magnet = LAB_HANDOFF.magnet;
  const head = cardW(cardAt(st.phi), 0, -8.05);
  const twTip: P3 = st.phi > 0 ? head : {...head, h: head.h + 0.15};
  // the tweezer hand comes in low from the right (LAB_HAND.lift, flattened): the caption band above stays clear
  const L2 = {...LAB_HAND.lift, ang: -24, handAng: 196};
  // the solid figure's contact shadow on the mold top once it stands
  const shK = ss(st.phi, 1.0, 1.5);
  const shP = shK > 0.01 ? labProjPoly(cam, Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return {x: FEET.x + 0.4 + Math.cos(a) * 2.6, h: TH + 0.01, d: FEET.d + 0.6 + Math.sin(a) * 1.2};
  })) : [];
  return (
    <g>
      <LabBackdrop cam={cam} t={t} />
      <LabStage cam={cam} t={t} coil={0} cage />
      <CageBack cam={cam} lid={1} />
      <LabACArcs cam={cam} t={t} on={0} half="back" />
      <CageFront cam={cam} lid={1} />
      <LabMagnet cam={cam} t={t} m={magnet} part="field" />
      {st.draw < 0.999 && <DrainPuddle cam={cam} t={t} draw={st.draw} />}
      <LabMagnet cam={cam} t={t} m={magnet} part="body" />
      <LabMold cam={cam} t={t} mold={{x: MS_MOLD.x, d: MS_MOLD.d, open: 1, fill: 0}} />
      {shP.length > 2 && <path d={'M' + shP.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill={C.navy0} opacity={f3(0.4 * shK)} />}
      {st.level < 2.25 && <Cast cam={cam} t={t} phi={st.phi} level={st.level} front={st.front} coolK={st.coolK} />}
      {st.pip.on && st.pip.enter > 0.001 && (
        <LabHandTool cam={cam} t={t} tip={st.pip.tip} ang={st.pip.ang} handAng={PIP.handAng} tool="pipette" fill={st.pip.fill} squeeze={st.pip.squeeze} enter={st.pip.enter} handMM={st.pip.handMM} toolMM={st.pip.toolMM} thumbSide={H0.thumbSide} />
      )}
      {st.tw.on && st.tw.enter > 0.001 && (
        <LabHandTool cam={cam} t={t} tip={twTip} ang={L2.ang} handAng={L2.handAng} tool="tweezers" open={st.tw.open} enter={st.tw.enter} handMM={L2.handMM} toolMM={L2.toolMM} thumbSide={L2.thumbSide} />
      )}
      <LabVignette k={1} />
    </g>
  );
};

/** the push's last stretch: the engine ChromeSurface, scaled from the chest and clipped to the figure, dissolving in
 *  over the figure's own reflections (the reverse of LB's way out of the metal) */
const IntoSurface: React.FC<{t: number}> = ({t}) => {
  const lam = msLam(t);
  const a = ss(lam, LAM_S - 0.95, LAM_S - 0.05);
  if (a <= 0.003) return null;
  const cam = pushCam(t);
  const c = labProj(cam, CHEST_W);
  const cE = labProj(pushCam(T_SURF + 1e-4), CHEST_W);
  if (!c || !cE) return null;
  const sc = c.s / cE.s;
  const G = cardGeo(cam, Math.PI / 2, 'solid');
  if (!G) return null;
  const sil = warpD(G.geo.sil, G.map);
  const id = uid('msIs'), gid = uid('msIg'), mid = uid('msIm');
  // the same matrix (MicroMatrix at Z = sc < 1 is ChromeSurface zoomed OUT about the chest: no frame edges anywhere)
  const view: MicroView = {Z: sc, F: {x: MC.x - (c.x - MC.x) / sc, y: MC.y - (c.y - MC.y) / sc}};
  const rr = lerp(620, 2500, a * a);
  return (
    <g opacity={f3(Math.min(1, a * 1.6))}>
      <defs>
        <clipPath id={id}>
          <path d={sil} clipRule="evenodd" />
        </clipPath>
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={f1(c.x)} cy={f1(c.y)} r={f1(rr)}>
          <stop offset="0.52" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
          <rect width={1080} height={1920} fill={`url(#${gid})`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id})`} mask={`url(#${mid})`}>
        <MicroMatrix t={t} view={view} front={1e6} />
      </g>
    </g>
  );
};

// =====================================================================================================================
// MICRO STATE (material space; art/micro.tsx)
// =====================================================================================================================
/** the drop's direction of pull (screen): up and to the right, toward the magnet (also the direction it travels) */
const AX: V = {x: Math.SQRT1_2, y: -Math.SQRT1_2};
/** the external magnet, authored in SCREEN space (its N face) and converted to material space every frame, so its field
 *  lines and the grains' alignment always follow the drawn magnet */
const MAG_LEN_S = 330, MAG_TH_S = 124;
const DROP_R = HANDOFF.r;
/** where the camera pull-back leaves the drop (screen, Z = 1): down-left of the hand-off spot, on the pull axis, so the
 *  magnet can drag it (up-right) exactly onto the hand-off spot (540, 1100) */
const MOVE_L = 330;
const P0: V = {x: HANDOFF.x - AX.x * MOVE_L, y: HANDOFF.y - AX.y * MOVE_L};
/** shape time of the drop's wobble: frozen while solid, catching up to film time once liquid */
const tau = (t: number) => {
  const u = ss(t, 19.4, 21.8);
  return (1 - u) * 18 + u * t;
};
/** the drop's lowest point below its centre (material px at Z = 1) and the screen y of its centre while its underside
 *  is in view (the tilt down to the coil) */
const BOT = 101;
const TILT_Y = 1185 - BOT * 12.9;
const Z_PB = 13.5;
const zAt = (t: number): number => {
  if (t < S.push[1]) return Math.exp(Math.max(0, msLam(t) - LAM_S));
  if (t < S.pullBack[0]) return keyS(t, [[S.push[1], Z_IN], [S.tilt[0], 12.7], [S.coilOff[1], 13.3], [S.pullBack[0], Z_PB]], (x) => x);
  // one log-eased pull back to Z = 1 (the hand-off scale), then the scale holds: the drop never "shrinks" on screen
  return Math.exp(Math.log(Z_PB) * (1 - ss5(t, S.pullBack[0], S.pullBack[1])));
};
/** the drop's travel (screen offset) as the magnet drags it */
const moveOff = (t: number): V => {
  const u = ss5(t, S.move[0], S.move[1]);
  return {x: AX.x * MOVE_L * u, y: AX.y * MOVE_L * u};
};
const SD_PB: V = {x: MC.x - 30, y: TILT_Y - 40};
/** the pull-back pivot: a material point just above the drop's underside stays steady while the drop appears around it */
const PIV = 85;
const sdAt = (t: number): V => {
  if (t < S.pullBack[0]) return {x: keyS(t, [[S.tilt[0], MC.x], [S.pullBack[0], MC.x - 30]]), y: keyS(t, [[S.tilt[0], MC.y], [S.tilt[1], TILT_Y], [S.coilOff[0], TILT_Y - 10], [S.pullBack[0], TILT_Y - 40]])};
  const Z = zAt(t);
  const u = ss5(t, S.pullBack[0], S.pullBack[1] + 0.05);
  const q0 = {x: SD_PB.x, y: SD_PB.y + PIV * Z_PB}, q1 = {x: P0.x, y: P0.y + PIV};
  const mo = moveOff(t);
  return {x: lerp(q0.x, q1.x, u) + mo.x, y: lerp(q0.y, q1.y, u) - PIV * Z + mo.y};
};
/** the magnet's N face (screen): it rides in with the drop as the camera pulls back, closes in on "control", then LEADS the
 *  drop along the pull axis (the drop follows it), and lifts away the way it came once the drop is on its spot */
const magScreen = (t: number): V => {
  const Z = zAt(t);
  const gap = lerp(330, 205, ss(t, 21.2, 21.5)) + 70 * ss(t, 21.6, 21.85) * (1 - ss(t, 21.95, 22.1));
  const D = 0.93 * DROP_R * Z + gap;
  const sd = sdAt(t);
  const lead = moveOff(t + 0.12), cur = moveOff(t);
  const back = 760 * ss(t, 21.98, 22.34) ** 2;
  return {x: sd.x + lead.x - cur.x + AX.x * (D + back), y: sd.y + lead.y - cur.y + AX.y * (D + back)};
};
export const msMicro = (t: number) => {
  // ---- zoom Z and the screen position of the drop centre (the material is a drop; we start inside it)
  const Z = zAt(t);
  const Sd = sdAt(t);
  const md = MC;
  const view: MicroView = {Z, F: {x: md.x - (Sd.x - MC.x) / Z, y: md.y - (Sd.y - MC.y) / Z}};
  // ---- heat
  const coilIn = ss(t, S.tilt[0] + 0.05, S.tilt[1]) * (1 - ss(t, S.coilOff[0], S.coilOff[1]));
  const heat = ss(t, S.coilOn, S.coilOn + 0.25) * (1 - ss(t, S.coilOff[0] - 0.1, S.coilOff[0] + 0.2));
  const temp = keyS(t, [[S.coilOn + 0.08, 22], [19.22, 30.4], [19.9, 33]], (x) => ss(x, 0, 1));
  const front = t < S.melt[0] ? 1e6 : keyS(t, [[S.melt[0], 1200], [S.melt[1], -120]], (x) => x);
  const liquidAll = t > S.melt[1] + 0.05;
  // ---- magnet + field (material)
  const mS = magScreen(t);
  const mag: Magnet2 = {n: {x: view.F.x + (mS.x - MC.x) / Z, y: view.F.y + (mS.y - MC.y) / Z}, ax: {x: -AX.x, y: -AX.y}, len: MAG_LEN_S / Z, th: MAG_TH_S / Z};
  const fieldOn = ss(t, S.field[0], S.field[0] + 0.3) * (1 - ss(t, 22.02, 22.3));
  const reveal = ss(t, S.field[0], S.field[0] + 0.42);
  // the grains lead the flow toward the magnet a little; the liquid's ripples flow that way
  const lead = 11 * ss(t, S.field[0] + 0.1, 21.4);
  const flow = {x: AX.x * 30 * ss(t, 20.6, 22.2), y: AX.y * 30 * ss(t, 20.6, 22.2)};
  // the stretch of the drop toward the magnet ("control"), released as the magnet withdraws
  const pull = ss(t, T.control - 0.02, T.control + 0.3) * (1 - ss(t, 21.98, 22.3));
  const inset = ss(t, 21.05, 21.4) * 0.16 + ss(t, 21.44, 21.74) * 0.95;
  const container = t >= S.push[1];
  return {view, Z, Sd, md, mS, heat, coilIn, temp, front, liquidAll, mag, fieldOn, reveal, pull, inset, container, lead, flow};
};

/** the drop's screen prims (handoffPrims about the hand-off centre, zoomed, stretched toward the magnet, area held) */
const dropPrims = (t: number, Z: number, Sd: V, pull: number) => {
  const base = handoffPrims(tau(t));
  const e = 1 + 0.36 * pull;
  const ang = Math.atan2(AX.y, AX.x);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const target = Math.PI * (DROP_R * 0.93) ** 2 * Z * Z;
  const blend = DROP_R * 0.6 * Z;
  const build = (a: number): Prim[] => {
    const k = Math.sqrt(a) * Z;
    const out: Prim[] = base.map((p) => {
      const c = p as {x: number; y: number; r: number};
      const dx = c.x - HANDOFF.x, dy = c.y - HANDOFF.y;
      const u = (dx * ca + dy * sa) * e, v = (-dx * sa + dy * ca) / e;
      const x = Sd.x + (u * ca - v * sa) * k, y = Sd.y + (u * sa + v * ca) * k;
      if (pull < 1e-4) return {k: 'c', x, y, r: c.r * k} as Prim;
      return {k: 'ell', x, y, rx: c.r * k * e, ry: (c.r * k) / e, rot: (ang * 180) / Math.PI} as Prim;
    });
    if (pull > 0.01) {
      const L = DROP_R * 1.25 * k * pull;
      out.push({k: 'cap', ax: Sd.x, ay: Sd.y, bx: Sd.x + ca * L, by: Sd.y + sa * L, ra: DROP_R * 0.42 * k, rb: DROP_R * 0.2 * k * (0.6 + 0.4 * pull)});
    }
    return out;
  };
  if (pull < 1e-4) return {prims: build(1), blend};
  const cal = calibrate(build, blend, target, 1, 0.6, 1.2, 4);
  return {prims: cal.prims, blend};
};

/** the grains as placed at time t */
const grainDraws = (t: number, M: ReturnType<typeof msMicro>): GrainDraw[] => {
  const v = M.view;
  const shift = {x: AX.x * M.lead, y: AX.y * M.lead};
  const gs: Grain[] = grainsIn(v, shift);
  const vis = t < S.push[1] + 0.02 ? ss(v.Z, 2.6, 8) : 1;
  const out: GrainDraw[] = [];
  for (const g of gs) {
    const Ly = GRAIN_LAYERS[g.layer];
    let m = {x: g.m0.x + shift.x, y: g.m0.y + shift.y};
    // drift once melted (continuous from the moment the front passed it)
    const s0 = microToScreen(v, m, Ly.dl);
    const lq = M.liquidAll ? 1 : M.front > 5e5 ? 0 : liqAt(s0.x, s0.y, M.front, t);
    let tp = S.melt[0] + ((1200 - s0.y) / 1320) * (S.melt[1] - S.melt[0]);
    tp = clamp(tp, S.melt[0], S.melt[1]);
    if (t > tp && lq > 0) {
      const A = 1.6;
      m = {x: m.x + lq * A * (noise1(t * 0.7, g.seed) - noise1(tp * 0.7, g.seed)), y: m.y + lq * A * (noise1(t * 0.6 + 3, g.seed) - noise1(tp * 0.6 + 3, g.seed))};
    }
    // the field: each grain turns to align with the local field (its N end along B); a lead toward the magnet
    let ang = g.ang0 + (t > tp ? lq * 0.25 * (noise1(t * 0.5, g.seed + 7) - noise1(tp * 0.5, g.seed + 7)) : 0);
    if (M.fieldOn > 0.001) {
      const B = dipoleField(M.mag, m);
      const al = ss(t, S.field[0] + 0.08 + 0.22 * hash(g.seed + 0.9), S.field[0] + 0.36 + 0.22 * hash(g.seed + 0.9));
      ang = lerpAng(ang, Math.atan2(B.y, B.x), al * Math.min(1, M.fieldOn * 1.5));
    }
    const p = microToScreen(v, m, Ly.dl);
    out.push({g, p, r: grainPx(g.r, v.Z), ang, a: vis, menis: 1});
  }
  return out;
};

/** field-line seeds (material space) with per-line alpha:
 *  A) lines fixed in the material, through the drop (a diagonal row across the pull axis): while we are inside the
 *     metal they cross the whole frame (the field arrives through the material); the outer and odd ones thin out as the
 *     camera pulls back, leaving a bundle through the drop
 *  B) a fan just off the magnet's N face (screen-relative, so it travels with the magnet) for the wide view */
const fieldSeeds = (M: ReturnType<typeof msMicro>): {s: V; a: number}[] => {
  const out: {s: V; a: number}[] = [];
  const perp = {x: -AX.y, y: AX.x};
  const wide = ss(M.Z, 6, 2.2);
  for (let k = -6; k <= 11; k++) {
    const keep = k % 2 === 0 && Math.abs(k) <= 6;
    const a = keep ? 1 : 1 - wide;
    if (a < 0.01) continue;
    out.push({s: {x: M.md.x + perp.x * k * 14, y: M.md.y + perp.y * k * 14}, a});
  }
  const ax = M.mag.ax, pp = {x: -ax.y, y: ax.x};
  const c = {x: M.mS.x + ax.x * 200, y: M.mS.y + ax.y * 200};
  if (wide > 0.01)
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      const sp = {x: c.x + pp.x * k * 58, y: c.y + pp.y * k * 58};
      out.push({s: {x: M.view.F.x + (sp.x - MC.x) / M.Z, y: M.view.F.y + (sp.y - MC.y) / M.Z}, a: wide * 0.85});
    }
  return out;
};

const MicroPart: React.FC<{t: number}> = ({t}) => {
  const M = msMicro(t);
  const v = M.view;
  const ids = {iris: uid('msIr'), drop: uid('msDr'), bg: uid('msBg')};
  const flow = M.flow;
  // during the push the big surface reflections (the zoomed ChromeSurface) give way to the material's own structure: the
  // two renders of the SAME zooming plane are mixed over Z 1.7 -> 3.4 (no band sweeping across the frame, no blank frame)
  const xf = t < S.push[1] ? ss(Math.log(Math.max(1, M.Z)), Math.log(1.6), Math.log(4.2)) : 1;
  const matB = xf > 0.001 ? <MicroMatrix t={t} view={v} front={M.liquidAll ? -1e6 : M.front} flow={flow} bounds={1} outer={0} /> : null;
  const matrix =
    xf > 0.999 ? matB : (
      <g>
        {matB}
        <g opacity={f3(1 - xf)}>
          <MicroMatrix t={t} view={v} front={1e6} detail={0} />
        </g>
      </g>
    );
  const grains = <MicroGrains grains={grainDraws(t, M)} />;
  // the drop container (its silhouette and the cutaway iris), once we are inside it
  let dropSil = '', irisD = '', dropNode: React.ReactNode = null;
  if (M.container) {
    const D = dropPrims(t, M.Z, M.Sd, M.pull);
    const fn = (x: number, y: number) => sdField(D.prims, D.blend, x, y);
    const cell = 5;
    dropSil = isoPath(fn, {x0: -60, y0: -60, x1: 1140, y1: 1980}, cell);
    const rS = DROP_R * M.Z;
    if (M.inset > 0.002) {
      // the iris: the drop's own shape, inset by a rim, then shrinking to its centre (a smooth closing, never ragged)
      const close = ss(t, 21.44, 21.74);
      const kk = (1 - 0.16 * ss(t, 21.05, 21.4)) * (1 - close);
      const ip = D.prims.map((p) => scalePrim(p, M.Sd.x, M.Sd.y, kk * kk));
      irisD = kk > 0.03 ? isoPath((x, y) => sdField(ip, D.blend * kk, x, y), {x0: -60, y0: -60, x1: 1140, y1: 1980}, cell) : '';
      dropNode = <ChromeBody prims={D.prims} blend={D.blend} R={rS} cell={M.Z > 4 ? 8 : 3} specs={2} />;
    } else irisD = dropSil;
  }
  // field lines (material -> screen), level of detail by zoom
  let lines: {pts: V[]; a: number}[] = [];
  if (M.fieldOn > 0.003) {
    const seeds = fieldSeeds(M);
    const raw = fieldLines(M.mag, seeds.map((q) => q.s), 5 / M.Z, 560);
    lines = raw.map((ln, i) => ({pts: ln.map((m) => microToScreen(v, m)), a: seeds[i].a * M.fieldOn * 0.9}));
  }
  // the magnet (screen)
  const nS = M.mS;
  const magVis = t > S.field[0] && nS.x < 1500 && nS.y > -400;
  const coilY = M.Sd.y + 101 * M.Z + 175 + (1 - M.coilIn) * 900;
  // the field lines pass BEHIND the closed chrome drop (no stripes painted over the metal) and are seen through the
  // material only inside the cutaway window
  const linesNode = lines.length > 0 ? <FieldLinesDraw lines={lines} t={t} reveal={M.reveal} width={3.4 + 2.4 * ss(M.Z, 2.5, 8)} halo={1 + ss(M.Z, 2.5, 8)} /> : null;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={C.navy1} />
      {M.container && irisD === dropSil && dropSil && (
        // the edge of the material while the cutaway fills the drop: a warm-lit underside when heated
        <path d={dropSil} fill="none" stroke={INK} strokeWidth={6} />
      )}
      {linesNode}
      {dropNode}
      {/* the cutaway (or the whole frame while we are inside) */}
      {M.container && irisD ? (
        <g>
          <defs>
            <clipPath id={ids.iris}>
              <path d={irisD} clipRule="evenodd" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${ids.iris})`}>
            {matrix}
            {grains}
            {!M.liquidAll && M.front < 5e5 && <MeltFrontLine front={M.front} t={t} amt={ss(M.front, -120, 0) * 1} />}
            <HeatGlow y={M.Sd.y + 101 * M.Z} amt={M.heat} />
            {linesNode}
          </g>
          <path d={irisD} fill="none" stroke={INK} strokeWidth={M.inset > 0.002 ? 5 : 6} />
          {M.inset > 0.002 && <path d={irisD} fill="none" stroke={C.navy0} strokeWidth={14} opacity={0.25} />}
        </g>
      ) : !M.container ? (
        <g>
          {matrix}
          {grains}
          {linesNode}
        </g>
      ) : null}
      {/* the induction coil under the sample (heat: orange); taken away before the magnet comes */}
      {M.coilIn > 0.002 && coilY < 2100 && (
        <g>
          <ACFieldArcs cx={540} cy={coilY - 10} span={430} h={420} t={t} on={M.heat * 0.9} />
          <InductionCoil cx={540} cy={coilY} rx={330} ry={62} heat={M.heat} t={t} />
        </g>
      )}
      {magVis && <Magnet2D p={nS} ang={(Math.atan2(-M.mag.ax.y, -M.mag.ax.x) * 180) / Math.PI} len={MAG_LEN_S} th={MAG_TH_S} />}
    </g>
  );
};
const HeatGlow: React.FC<{y: number; amt: number}> = ({y, amt}) => {
  if (amt <= 0.01) return null;
  const id = uid('msHg');
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f1(y)} x2="0" y2={f1(y - 760)}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={C.heat} stopOpacity={0.16} />
          <stop offset="1" stopColor={C.heat} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={f1(y - 760)} width={1080} height={800} fill={`url(#${id})`} opacity={f3(amt)} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

// =====================================================================================================================
// LABELS (HTML tags + SVG leaders)
// =====================================================================================================================
const GAL_TARGET: V = {x: 300, y: 735};
/** the grain the "+ MAGNETIC PARTICLES" label points at: the front-layer grain nearest (640, 1215) at 18.3 */
const PART_KEY = (() => {
  const M = msMicro(18.4);
  let best = -1, bd = 1e9;
  for (const g of grainDraws(18.4, M)) {
    if (g.g.layer !== 0) continue;
    const d = Math.hypot(g.p.x - 640, g.p.y - 1215);
    if (d < bd) {
      bd = d;
      best = g.g.key;
    }
  }
  return best;
})();
const Leader: React.FC<{a: V; b: V; amt: number}> = ({a, b, amt}) => {
  if (amt <= 0.01) return null;
  const e = {x: lerp(a.x, b.x, ss(amt, 0, 1)), y: lerp(a.y, b.y, ss(amt, 0, 1))};
  return (
    <g>
      <path d={`M${f1(a.x)},${f1(a.y)}L${f1(e.x)},${f1(e.y)}`} stroke={C.navy0} strokeWidth={7} strokeLinecap="round" opacity={0.6} />
      <path d={`M${f1(a.x)},${f1(a.y)}L${f1(e.x)},${f1(e.y)}`} stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={f1(e.x)} cy={f1(e.y)} r={f1(9 * ss(amt, 0.6, 1))} fill="#FFFFFF" stroke={C.navy0} strokeWidth={3} />
    </g>
  );
};

// =====================================================================================================================
// THE SHOT
// =====================================================================================================================
export const MS: React.FC<{t: number}> = ({t}) => {
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      {children}
    </svg>
  );
  // contract LB -> MS: exactly LB's hand-off frame
  if (t < S.hold) return svg(<LabWorld cam={LAB_HANDOFF.cam} t={t} magnet={LAB_HANDOFF.magnet} body={(p) => p === 'front' && <LabHandoffPuddle t={t} />} />);
  // contract MS -> FU: plain navy + the hand-off blob
  if (t >= S.blob)
    return svg(
      <>
        <rect x={0} y={0} width={1080} height={1920} fill={C.navy1} />
        <HandoffBlob t={t} />
      </>,
    );
  const tags = (
    <>
      <Tag text="RECAST IN A MOLD" t={t} t0={16.46} t1={17.36} x={MS_TAG.x} y={MS_TAG.y} tone="dark" size={MS_TAG.size} />
      <Tag text="AC FIELD HEATS IT" t={t} t0={18.8} t1={20.3} x={MS_TAG.x} y={MS_TAG.y} tone="warm" size={MS_TAG.size} />
    </>
  );
  if (t < T_SURF) {
    return (
      <>
        {svg(
          <>
            <LabPart t={t} />
            {t >= S.push[0] && <IntoSurface t={t} />}
          </>,
        )}
        {tags}
      </>
    );
  }
  // inside the metal
  const M = msMicro(t);
  const galA = ss(t, S.labels[0], S.labels[0] + 0.16) * (1 - ss(t, S.labels[1] - 0.12, S.labels[1]));
  const parA = ss(t, 18.32, 18.48) * (1 - ss(t, S.labels[1] - 0.12, S.labels[1]));
  const pg = parA > 0.001 ? grainDraws(t, M).find((g) => g.g.key === PART_KEY) : undefined;
  const parTag: V | null = pg ? {x: clamp(pg.p.x, 310, 590), y: pg.p.y + pg.r + 128} : null;
  const gdx = (1 - ss(t, S.tilt[0] + 0.05, S.tilt[1] - 0.02)) * 420 + ss(t, 20.18, 20.5) * 460;
  const showGauge = t > S.tilt[0] && t < 20.52;
  const m29 = ss(t, 18.84, 18.98);
  const m37 = ss(t, T.body1 - 0.02, T.body1 + 0.1);
  return (
    <>
      {svg(
        <>
          <MicroPart t={t} />
          <Leader a={{x: GAL_TARGET.x, y: GAL_TARGET.y - 70}} b={GAL_TARGET} amt={galA} />
          {pg && parTag && <Leader a={{x: parTag.x, y: parTag.y - 34}} b={{x: pg.p.x, y: pg.p.y + pg.r * 0.4}} amt={parA} />}
          {showGauge && (
            <Gauge
              temp={M.temp}
              t={t}
              dx={gdx}
              heat={M.heat}
              marks={[
                {temp: 29.8, amt: m29, color: '#FFFFFF'},
                {temp: 37, amt: m37, color: C.yellow},
              ]}
            />
          )}
        </>,
      )}
      <Tag text="GALLIUM" t={t} t0={S.labels[0]} t1={S.labels[1]} x={GAL_TARGET.x} y={GAL_TARGET.y - 104} tone="dark" size={40} align="center" />
      {parTag && <Tag text="+ MAGNETIC PARTICLES" t={t} t0={18.32} t1={S.labels[1]} x={parTag.x} y={parTag.y} tone="dark" size={40} align="center" />}
      {showGauge && (
        <>
          <Tag text="GALLIUM MELTS 29.8 °C" t={t} t0={18.86} t1={20.3} x={GAUGE.x - 66 + gdx} y={gaugeY(GAUGE, 29.8)} tone="dark" size={40} align="right" />
          <Tag text="BODY 37 °C" t={t} t0={T.body1} t1={20.3} x={GAUGE.x - 66 + gdx} y={gaugeY(GAUGE, 37)} tone="light" size={40} align="right" />
        </>
      )}
      {tags}
    </>
  );
};

// =====================================================================================================================
// SOUND (film seconds; each reinforces a visible action; transients in the gaps where possible)
// =====================================================================================================================
export const CUES_MS = (): Cue[] => [
  // the bulb is released on "collected": suction, the puddle drains into the tip
  {t: S.draw[0] + 0.01, kind: 'pipette', gain: -4},
  {t: S.draw[0] + 0.12, kind: 'flow', gain: -10, dur: 0.55},
  // the liquid glugs into the mold cavity
  {t: S.fill[0] + 0.02, kind: 'glug', gain: -6, dur: 0.5},
  // cooling in room air: airy hush + crystalline pings with the front, a glint as it sets
  {t: S.cool[0] + 0.02, kind: 'cool', gain: -8, dur: 0.5},
  // the re-formed figure lands upright on the mold (tiny tok, in the pause before "How?")
  {t: S.pivot[1], kind: 'clunk', gain: -11},
  // into the metal (t = crossing the chest surface)
  {t: T_SURF, kind: 'enter', gain: -3},
  // the two labels
  {t: S.labels[0] + 0.02, kind: 'pop', gain: -9},
  {t: 18.33, kind: 'pop', gain: -10},
  // the induction coil energises
  {t: S.coilOn - 0.02, kind: 'ac_on', gain: -4, dur: 1.2},
  // the melt front sweeps up
  {t: S.melt[0] + 0.05, kind: 'melt', gain: -11, dur: 0.7},
  // the magnet's field swells in (the pause before "And magnets")
  {t: S.field[0] - 0.18, kind: 'field', gain: -3, dur: 1.6},
  // the drop is pulled toward the magnet
  {t: T.control - 0.02, kind: 'stream', gain: -10, dur: 0.8},
  // the drop settles at the centre (the pause after "movement")
  {t: 22.2, kind: 'drip', gain: -9},
];
void toCam;
