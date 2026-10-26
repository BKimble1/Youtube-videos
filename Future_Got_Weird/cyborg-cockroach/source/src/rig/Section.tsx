// Cutaway drawing for the mechanism shots (S09 launch, S10 delivery): the medic's launch tube cut open along its
// length (far half kept, clean hatched cut faces) with the spring, the injector, the latch line through the holes at the
// mouth, the nichrome coil on the line and the fine wire from the board to the coil; the injector cut along its axis
// (activator chamber in the plunger, gas, dose, needle bore); the silicone target block and its cradle cut by a plane
// z = zc that can sweep out to close the cut (FixtureCut); the tube from outside with the parted line (TubeExterior).
// Everything is drawn through the shot camera from the body frame of the insect (or the injector / world frame), in the
// Weird Crew finish: ink #172B3A contours, gradient fills from the fixed upper-left key light.
//
// Local copies (adapted) of shared code: StimWire is rig/Gear.tsx's Wire (not exported there); Helix is Gear's Spring
// with colour and width parameters; PackBase is the top half of Gear (wires, saddle, board, chips, cell) split into the
// parts behind and in front of the tube's cut plane.
import React from 'react';
import {Cam, proj, scaleAt, depth} from '../lib/cam';
import {V3, V2, Frame, toW, add, sub, mul, dot, norm, cross, lerp3} from '../lib/v3';
import {fmt, polyPath, openPath, convexHull} from '../lib/g3';
import {Solid, LAB, TARGET} from '../sets/Lab';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {PACK, INJ, wiresOn, WirePt} from './gear';
import {GEAR_COL, BoxSolid, CylSolid, Spring, alongPolyline} from './Gear';
import {loftSilhouette} from '../lib/loft';
import {PRONOTUM} from './roach';
import {clamp, easeOut, smoother, sr as sr01} from '../lib/ease';

// ---------------------------------------------------------------------------------------------------------------
// Geometry of the cutaway (body frame, mm). The tube is PACK.tube; the line holes sit just inside the mouth, in the
// cut plane, so the section shows the line threading them.
// ---------------------------------------------------------------------------------------------------------------
const TY = PACK.tube.a[1];
const TOP = TY + PACK.tube.r;
export const SEC = {
  y: TY,
  rOut: PACK.tube.r,
  rIn: PACK.tube.r - 0.55,
  xRear: PACK.tube.a[0],
  xPlug: PACK.tube.a[0] + 1.5,
  xMouth: PACK.tube.b[0],
  hole: PACK.tube.b[0] - 0.55, // x of the two line holes (top and bottom wall)
  holeW: 0.45,
  /** the injector's rear in the loaded tube for the cutaway (a little behind INJ.loadedRear so the line's run in front of
   *  the collar reads) */
  loadedRear: 5.4,
  /** where the line's upper end is tied off on top of the tube (a glue bead) */
  tie: [PACK.tube.b[0] - 4.9, TOP + 0.32, 0] as V3,
  /** the line runs lifted off the tube through the coil */
  lineLift: TOP + 0.78,
  coil: [PACK.tube.b[0] - 3.2, PACK.tube.b[0] - 1.2] as [number, number],
  coilR: 0.52,
  coilTurns: 5.5,
  /** spring free length: its front stops here once the injector has left */
  springFree: PACK.tube.b[0] - 2.5,
};
/** the line parts in the middle of the coil */
export const CUT_X = (SEC.coil[0] + SEC.coil[1]) / 2;

/** the fine power wire from the board to the coil (body frame): up behind the tube's rear plug, along its top */
export const COIL_WIRE: V3[] = [
  [-8.6, 23.82, 2.6],
  [-11.0, 24.15, 1.7],
  [-12.05, 25.5, 0.7],
  [-12.2, 28.4, 0.3],
  [-11.7, 30.5, 0.2],
  [-10.5, TOP + 0.16, 0.15],
  [SEC.tie[0] - 0.9, TOP + 0.16, 0.15],
  [SEC.coil[0] - 0.75, TOP + 0.4, 0.1],
  [SEC.coil[0] - 0.15, SEC.lineLift + SEC.coilR * 0.9, 0],
];
export const COIL_WIRE_COL = '#B83A2E';

// ---------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------
const P2 = (p: V2) => `${fmt(p[0])} ${fmt(p[1])}`;
const line = (pts: V2[]) => (pts.length ? `M${pts.map(P2).join(' L')}` : '');

/** Hatch pattern that travels with the object it fills (anchored at a projected reference point) and scales with it. */
export const Hatch: React.FC<{id: string; at: V2; sp: number; color: string; ink?: number; alpha?: number; angle?: number}> = ({id, at, sp, color, ink = 1.1, alpha = 0.42, angle = 45}) => (
  <defs>
    <pattern id={id} patternUnits="userSpaceOnUse" width={fmt(sp)} height={fmt(sp)} patternTransform={`translate(${fmt(at[0])} ${fmt(at[1])}) rotate(${angle})`}>
      <rect x={0} y={0} width={fmt(sp)} height={fmt(sp)} fill={color} />
      <line x1={0} y1={0} x2={0} y2={fmt(sp)} stroke={INK} strokeWidth={fmt(ink)} opacity={alpha} />
    </pattern>
  </defs>
);

/** a helix along a -> b (back half darker, front half inked), any colour: Gear's Spring with colours */
export const Helix: React.FC<{cam: Cam; a: V3; b: V3; r: number; turns: number; wire: number; color: string; back?: string; inkW?: number}> = ({cam, a, b, r, turns, wire, color, back, inkW = 1.4}) => {
  const ax = norm(sub(b, a));
  const u = norm(Math.abs(ax[1]) < 0.9 ? cross(ax, [0, 1, 0]) : cross(ax, [1, 0, 0]));
  const w = cross(ax, u);
  const n = Math.max(12, Math.round(turns * 20));
  const backR: V2[][] = [], frontR: V2[][] = [];
  let cur: V2[] = [], curFront: boolean | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, ang = t * turns * Math.PI * 2;
    const off = add(mul(u, r * Math.cos(ang)), mul(w, r * Math.sin(ang)));
    const p = add(lerp3(a, b, t), off);
    const isFront = dot(off, sub(cam.eye, p)) > 0;
    if (curFront === null || isFront === curFront) cur.push(proj(cam, p));
    else {
      cur.push(proj(cam, p));
      (curFront ? frontR : backR).push(cur);
      cur = [proj(cam, p)];
    }
    curFront = isFront;
  }
  if (cur.length > 1) (curFront ? frontR : backR).push(cur);
  const sw = Math.max(1, wire * scaleAt(cam, lerp3(a, b, 0.5)));
  return (
    <g fill="none" strokeLinecap="round">
      {backR.map((r2, i) => <path key={`b${i}`} d={openPath(r2)} stroke={back ?? shade(color, 0.45)} strokeWidth={sw} />)}
      {frontR.map((r2, i) => <path key={`i${i}`} d={openPath(r2)} stroke={INK} strokeWidth={sw + inkW} />)}
      {frontR.map((r2, i) => <path key={`f${i}`} d={openPath(r2)} stroke={color} strokeWidth={sw} />)}
    </g>
  );
};

/** a pulse: white core with a soft yellow halo (Gear's wire pulse) */
export const Pulse: React.FC<{at: V2; w: number}> = ({at, w}) => (
  <g>
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 3.2)} fill={GEAR_COL.pulse} opacity={0.35} />
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 1.9)} fill={GEAR_COL.pulse} opacity={0.35} />
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 1.35)} fill="#FFFFFF" />
  </g>
);

/** soft radial glow (no blur filter) */
export const SoftGlow: React.FC<{id: string; at: V2; r: number; color: string; alpha: number; ry?: number}> = ({id, at, r, color, alpha, ry}) =>
  alpha <= 0.002 ? null : (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={alpha} />
          <stop offset="0.4" stopColor={color} stopOpacity={alpha * 0.55} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(at[0])} cy={fmt(at[1])} rx={fmt(r)} ry={fmt(ry ?? r)} fill={`url(#${id})`} />
    </g>
  );

// ---------------------------------------------------------------------------------------------------------------
// Stimulation wires and the backpack base (copied from rig/Gear.tsx and split by the cut plane)
// ---------------------------------------------------------------------------------------------------------------
const inPoly = (q: V2, poly: V2[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1] + 1e-12) + a[0]) c = !c;
  }
  return c;
};
/** rig/Gear.tsx Wire (a stimulation wire lying on the shell, drawn where its surface faces the camera) */
const StimWire: React.FC<{cam: Cam; pts: WirePt[]; color: string; proHull: V2[] | null; camFront: boolean}> = ({cam, pts, color, proHull, camFront}) => {
  const P3 = pts.map((q) => q.p);
  const S: {p: V3; vis: boolean}[] = [];
  const nS = 36;
  for (let i = 0; i <= nS; i++) {
    const tt = i / nS;
    const p = alongPolyline(P3, tt);
    const segs = pts.length - 1;
    const k = Math.min(segs - 1, Math.floor(tt * segs));
    const a = pts[k], b = pts[k + 1];
    const n = a.n && b.n ? norm(lerp3(a.n, b.n, tt * segs - k)) : a.n ?? b.n;
    let vis = !n || dot(n, sub(cam.eye, p)) > 0;
    if (vis && proHull && camFront && (a.behindPro || b.behindPro) && inPoly(proj(cam, p), proHull)) vis = false;
    S.push({p, vis});
  }
  const runs: V2[][] = [];
  let cur: V2[] = [];
  for (const q of S) {
    if (q.vis) cur.push(proj(cam, q.p));
    else if (cur.length) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) runs.push(cur);
  const sc = scaleAt(cam, P3[Math.floor(P3.length / 2)]);
  const w = Math.max(1.1, 0.42 * sc);
  const endVis = S[S.length - 1].vis;
  const end = proj(cam, P3[P3.length - 1]);
  const er = Math.max(1.6, 0.9 * scaleAt(cam, P3[P3.length - 1]));
  return (
    <g>
      {runs.map((r, i) => <path key={`i${i}`} d={openPath(r)} fill="none" stroke={INK} strokeWidth={w + 1.6} strokeLinecap="round" strokeLinejoin="round" />)}
      {runs.map((r, i) => <path key={`c${i}`} d={openPath(r)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />)}
      {endVis && <circle cx={fmt(end[0])} cy={fmt(end[1])} r={fmt(er + 0.8)} fill={INK} />}
      {endVis && <circle cx={fmt(end[0])} cy={fmt(end[1])} r={fmt(er)} fill={GEAR_COL.electrode} />}
    </g>
  );
};

/** The backpack below the tube: stimulation wires, saddle, board, chips, coin cell. `part` = 'back' draws what lies
 *  behind the tube's cut plane (body z >= 0 for a camera on the insect's left), 'front' the parts nearer the camera. */
export const PackBase: React.FC<{cam: Cam; f: Frame; part: 'back' | 'front'; ink?: number}> = ({cam, f, part, ink = 1.6}) => {
  const W = wiresOn(f);
  const L = (p: V3) => toW(f, p);
  const proHull = loftSilhouette(f, PRONOTUM, cam, 14, 24);
  const camFront = dot(sub(cam.eye, toW(f, [10, 15, 0])), f.x) > 0;
  const wp = {cam, proHull, camFront};
  // which side of the body faces the camera (z < 0 = the insect's left)
  const nearZ = dot(sub(cam.eye, f.o), f.z) < 0 ? -1 : 1;
  const near = (z: number) => z * nearZ > 0;
  if (part === 'back')
    return (
      <g>
        <StimWire {...wp} pts={W.cerL} color={GEAR_COL.wireB} />
        <StimWire {...wp} pts={W.cerR} color={GEAR_COL.wireB} />
        <StimWire {...wp} pts={W.antL} color={GEAR_COL.wireA} />
        <StimWire {...wp} pts={W.antR} color={GEAR_COL.wireA} />
        <BoxSolid cam={cam} f={f} c={PACK.saddle.c} h={PACK.saddle.h} color={GEAR_COL.saddle} ink={ink * 0.9} />
        <BoxSolid cam={cam} f={f} c={PACK.board.c} h={PACK.board.h} color={GEAR_COL.board} ink={ink * 0.9} />
        {!near(PACK.chipA.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipA.c} h={PACK.chipA.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
        {!near(PACK.chipB.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipB.c} h={PACK.chipB.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
        {!near(PACK.cell.c[2]) && <CylSolid id="pb-cell-b" cam={cam} a={L(add(PACK.cell.c, [0, -PACK.cell.h / 2, 0]))} b={L(add(PACK.cell.c, [0, PACK.cell.h / 2, 0]))} r={PACK.cell.r} color={GEAR_COL.cell} ink={ink * 0.75} />}
      </g>
    );
  return (
    <g>
      {near(PACK.chipA.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipA.c} h={PACK.chipA.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
      {near(PACK.chipB.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipB.c} h={PACK.chipB.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
      {near(PACK.cell.c[2]) && <CylSolid id="pb-cell-f" cam={cam} a={L(add(PACK.cell.c, [0, -PACK.cell.h / 2, 0]))} b={L(add(PACK.cell.c, [0, PACK.cell.h / 2, 0]))} r={PACK.cell.r} color={GEAR_COL.cell} ink={ink * 0.75} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The latch line: intact (tie bead -> through the coil -> down through the top hole -> round the needle hub in front of
// the collar -> through the bottom hole -> knot), or parted at the coil (the stub stays tied; the free strand whips
// forward out of the mouth about the bottom hole and hangs from it).
// ---------------------------------------------------------------------------------------------------------------
type P2D = [number, number];
const LINE_HUB_X = SEC.loadedRear + INJ.collarAt + 0.3 + 0.18; // just in front of the loaded collar's face
/** the free strand from the bottom hole's inner edge to the cut point, as body (x, y) points (intact shape) */
const STRAND0: P2D[] = [
  [SEC.hole, SEC.y - SEC.rIn],
  [LINE_HUB_X, SEC.y - INJ.needleR - 0.3],
  [LINE_HUB_X, SEC.y + INJ.needleR + 0.3],
  [SEC.hole, SEC.y + SEC.rIn],
  [SEC.hole, TOP],
  [SEC.hole - 0.12, SEC.lineLift - 0.12],
  [SEC.coil[1], SEC.lineLift],
  [CUT_X, SEC.lineLift],
];
/** resample a polyline to n equal segments: lengths and angles */
const chainOf = (pts: P2D[], n: number) => {
  const segL = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segL.reduce((a, b) => a + b, 0);
  const at = (d: number): P2D => {
    let r = d;
    for (let i = 0; i < segL.length; i++) {
      if (r <= segL[i] || i === segL.length - 1) {
        const u = clamp(r / segL[i]);
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
      }
      r -= segL[i];
    }
    return pts[pts.length - 1];
  };
  const q = Array.from({length: n + 1}, (_, k) => at((k / n) * total));
  const ang = q.slice(1).map((p, k) => Math.atan2(p[1] - q[k][1], p[0] - q[k][0]));
  return {seg: total / n, ang};
};
const NCH = 28;
const CH0 = chainOf(STRAND0, NCH);
// unwrap the intact angles into one continuous sequence
for (let k = 1; k < CH0.ang.length; k++) {
  while (CH0.ang[k] - CH0.ang[k - 1] > Math.PI) CH0.ang[k] -= 2 * Math.PI;
  while (CH0.ang[k] - CH0.ang[k - 1] < -Math.PI) CH0.ang[k] += 2 * Math.PI;
}
/** hanging angles: forward along the bore to the lip, over it, down in front of the mouth with a slight curl */
const hangAng = (k: number, swing: number) => {
  const u = k / (NCH - 1);
  const a = u < 0.08 ? -0.05 : -0.05 - 1.5 * smoother((u - 0.08) / 0.45) - 0.2 * smoother((u - 0.6) / 0.4);
  return a + swing * (0.2 + 0.8 * u);
};

export type LineState = {
  /** seconds since the line parted (null: intact) */
  cutT: number | null;
};
export const LatchLine: React.FC<{cam: Cam; f: Frame; s: LineState; sc: number}> = ({cam, f, s, sc}) => {
  const P = (x: number, y: number, z = 0) => proj(cam, toW(f, [x, y, z]));
  const lw = Math.max(1.4, 0.24 * sc);
  const ink = lw + Math.max(1.2, 0.11 * sc);
  const stroke = (pts: V2[], k: string) => (
    <g key={k}>
      <path d={openPath(pts)} fill="none" stroke={INK} strokeWidth={ink} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openPath(pts)} fill="none" stroke={GEAR_COL.line} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const bead = (x: number, y: number, r: number, k: string) => {
    const c = P(x, y);
    return (
      <g key={k}>
        <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r * sc + 0.8)} fill={INK} />
        <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r * sc)} fill={lit(GEAR_COL.line, 0.2)} />
        <circle cx={fmt(c[0] - r * sc * 0.3)} cy={fmt(c[1] - r * sc * 0.35)} r={fmt(r * sc * 0.35)} fill="#FFFFFF" opacity={0.8} />
      </g>
    );
  };
  // bottom: through the wall to the knot below the hole
  const bottom = [P(SEC.hole, SEC.y - SEC.rIn), P(SEC.hole, SEC.y - SEC.rOut - 0.35)];
  // stub: tie bead -> along the coil to the cut point (after the cut its end lifts and draws back a little)
  // the parting shows on its own frame: the ends are already apart on the first frame after the cut
  const dtc = s.cutT === null ? -1 : s.cutT + 0.012;
  const c = dtc < 0 ? 0 : easeOut(clamp(dtc / 0.05), 2);
  const stub: V2[] = [P(SEC.tie[0], SEC.tie[1]), P(SEC.tie[0] + 0.6, SEC.lineLift - 0.05), P(SEC.coil[0] - 0.2, SEC.lineLift), P(CUT_X - 0.35 * c, SEC.lineLift + 0.28 * c)];
  let strand: V2[];
  if (s.cutT === null) strand = STRAND0.map(([x, y]) => P(x, y));
  else {
    // the free strand: angles blend from the taut shape to hanging (rotating forward about the bottom hole), the far end
    // lagging, then a small damped swing
    // (fast enough that it is out of the collar's way before the collar reaches it)
    const dt = dtc;
    const swing = 0.22 * Math.exp(-dt / 0.18) * Math.sin(dt * 26);
    const w = easeOut(clamp(dt / 0.06), 1.6);
    let x = STRAND0[0][0], y = STRAND0[0][1];
    strand = [P(x, y)];
    for (let k = 0; k < NCH; k++) {
      let a1 = hangAng(k, swing);
      while (a1 > CH0.ang[k]) a1 -= 2 * Math.PI; // always rotate forward (clockwise in the side view)
      const a = CH0.ang[k] + (a1 - CH0.ang[k]) * w;
      x += CH0.seg * Math.cos(a);
      y += CH0.seg * Math.sin(a);
      strand.push(P(x, y));
    }
  }
  return (
    <g>
      {stroke(bottom, 'bt')}
      {stroke(strand, 'st')}
      {stroke(stub, 'sb')}
      {bead(SEC.tie[0], SEC.tie[1], 0.36, 'tie')}
      {bead(SEC.hole, SEC.y - SEC.rOut - 0.4, 0.3, 'knot')}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The nichrome coil on the line, and the fine wire from the board (with an optional pulse)
// ---------------------------------------------------------------------------------------------------------------
export const Coil: React.FC<{id: string; cam: Cam; f: Frame; heat: number; sc: number}> = ({id, cam, f, heat, sc}) => {
  const a = toW(f, [SEC.coil[0], SEC.lineLift, 0]), b = toW(f, [SEC.coil[1], SEC.lineLift, 0]);
  const h = clamp(heat);
  // dull nichrome -> red-orange -> warm yellow as it heats
  const col = h < 0.5 ? mix(GEAR_COL.nichrome, '#D2552E', h * 2) : mix('#D2552E', GEAR_COL.hot, (h - 0.5) * 2);
  const c = proj(cam, lerp3(a, b, 0.5));
  const L = (SEC.coil[1] - SEC.coil[0]) * sc;
  return (
    <g>
      <SoftGlow id={`${id}-g1`} at={c} r={L * 2.9} ry={L * 2.2} color={GEAR_COL.hot} alpha={0.62 * h * h} />
      <Helix cam={cam} a={a} b={b} r={SEC.coilR} turns={SEC.coilTurns} wire={0.17} color={mix(col, '#FFF4C8', Math.max(0, h - 0.75) * 1.6)} back={shade(col, 0.35 - 0.25 * h)} inkW={Math.max(1, 0.1 * sc)} />
      <SoftGlow id={`${id}-g2`} at={c} r={L * 0.7} ry={L * 0.45} color="#FFE7A0" alpha={0.55 * Math.max(0, h - 0.45) * 1.8} />
    </g>
  );
};

export const CoilWire: React.FC<{cam: Cam; f: Frame; pulse: number | null; sc: number; pulseW?: number}> = ({cam, f, pulse, sc, pulseW}) => {
  const pts = COIL_WIRE.map((p) => proj(cam, toW(f, p)));
  const w = Math.max(1.1, 0.2 * sc);
  const pad = proj(cam, toW(f, COIL_WIRE[0]));
  const pw = pulseW ?? Math.max(1.6, 0.55 * sc);
  return (
    <g>
      <ellipse cx={fmt(pad[0])} cy={fmt(pad[1])} rx={fmt(0.75 * sc + 0.8)} ry={fmt(0.35 * sc + 0.8)} fill={INK} />
      <ellipse cx={fmt(pad[0])} cy={fmt(pad[1])} rx={fmt(0.75 * sc)} ry={fmt(0.35 * sc)} fill={GEAR_COL.electrode} />
      <path d={openPath(pts)} fill="none" stroke={INK} strokeWidth={w + Math.max(1.2, 0.1 * sc)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openPath(pts)} fill="none" stroke={COIL_WIRE_COL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {pulse !== null && pulse > 0 && pulse < 1 && <Pulse at={proj(cam, alongPolyline(COIL_WIRE.map((p) => toW(f, p)), pulse))} w={pw} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The launch tube in section with its contents
// ---------------------------------------------------------------------------------------------------------------
export type TubeState = {
  /** body x of the injector's rear while it is in (or leaving) the tube; null once it is drawn on its own */
  injRear: number | null;
  /** body x of the spring's front end */
  springFront: number;
  line: LineState;
  heat: number;
  /** fraction 0..1 of the pulse along the coil wire (null: none) */
  pulse: number | null;
};
export const TUBE_CUT_COL = '#8FB8C9';

/** the tube cut along its length, the parts inside it, the line, the coil and its wire; pass the posed body frame.
 *  `injector` draws the injector given its world frame (the shot supplies it so trails and states stay in one place). */
export const SectionTube: React.FC<{id: string; cam: Cam; f: Frame; s: TubeState; injector?: (fr: Frame) => React.ReactNode}> = ({id, cam, f, s, injector}) => {
  const P = (x: number, y: number, z = 0) => proj(cam, toW(f, [x, y, z]));
  const sc = scaleAt(cam, toW(f, [6, SEC.y, 0]));
  const ink = Math.max(1.3, 0.15 * sc);
  const {y, rIn, rOut, xRear, xPlug, xMouth, hole, holeW} = SEC;
  const quad = (x0: number, y0: number, x1: number, y1: number) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  // interior (the far half's concave inner surface)
  const inTop = P(0, y + rIn), inBot = P(0, y - rIn);
  const interior = quad(xPlug, y - rIn, xMouth, y + rIn);
  // cut faces: rear plug, top wall and bottom wall (each wall interrupted by its line hole)
  const h0 = hole - holeW / 2, h1 = hole + holeW / 2;
  const cuts = [
    quad(xRear, y - rOut, xPlug, y + rOut),
    quad(xPlug - 0.01, y + rIn, h0, y + rOut),
    quad(h1, y + rIn, xMouth, y + rOut),
    quad(xPlug - 0.01, y - rOut, h0, y - rIn),
    quad(h1, y - rOut, xMouth, y - rIn),
  ];
  const outline = [P(xMouth, y + rOut), P(xRear, y + rOut), P(xRear, y - rOut), P(xMouth, y - rOut)];
  const anchor = P(xRear, y - rOut);
  const tube = GEAR_COL.tube;
  const injF = s.injRear === null ? null : ({o: toW(f, [s.injRear, y, 0]), x: f.x, y: f.y, z: f.z} as Frame);
  return (
    <g>
      <Hatch id={`${id}-h`} at={anchor} sp={Math.max(3.5, 0.42 * sc)} color={TUBE_CUT_COL} ink={Math.max(0.8, 0.07 * sc)} alpha={0.55} />
      <defs>
        <linearGradient id={`${id}-in`} gradientUnits="userSpaceOnUse" x1={fmt(inTop[0])} y1={fmt(inTop[1])} x2={fmt(inBot[0])} y2={fmt(inBot[1])}>
          <stop offset="0" stopColor={shade(tube, 0.42)} />
          <stop offset="0.3" stopColor={shade(tube, 0.16)} />
          <stop offset="0.72" stopColor={lit(tube, 0.15)} />
          <stop offset="1" stopColor={tube} />
        </linearGradient>
      </defs>
      {/* the clamps behind the far wall, seen through the clear plastic */}
      {PACK.clamps.map((x, i) => (
        <g key={i} opacity={0.75}>
          <BoxSolid cam={cam} f={f} c={[x, 25.0, 1.95]} h={[1.6, 1.4, 1.95]} color={GEAR_COL.clamp} ink={ink * 0.8} />
        </g>
      ))}
      <path d={polyPath(interior)} fill={`url(#${id}-in)`} opacity={0.82} />
      {/* a soft reflection along the lower inner wall */}
      <path d={line([P(xPlug + 1, y - rIn * 0.62), P(xMouth - 1, y - rIn * 0.62)])} stroke="#FFFFFF" strokeWidth={fmt(Math.max(1, 0.35 * sc))} opacity={0.35} strokeLinecap="round" />
      {/* the spring between the rear plug and the injector (or its free length) */}
      <Spring cam={cam} a={toW(f, [xPlug, y, 0])} b={toW(f, [Math.max(xPlug + 1, s.springFront), y, 0])} r={rOut * 0.72} turns={9} wire={0.42} />
      {injF && injector?.(injF)}
      {/* cut faces */}
      {cuts.map((q, i) => <path key={i} d={polyPath(q)} fill={`url(#${id}-h)`} />)}
      {/* inner edges of the cut walls (a light line where the cut meets the bore) */}
      {[y + rIn, y - rIn].map((yy, i) => (
        <path key={`e${i}`} d={line([P(xPlug, yy), P(h0, yy)]) + ' ' + line([P(h1, yy), P(xMouth, yy)])} stroke={lit(TUBE_CUT_COL, 0.55)} strokeWidth={fmt(Math.max(0.8, 0.07 * sc))} />
      ))}
      <path d={polyPath(outline, false)} fill="none" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => <path key={`o${i}`} d={polyPath(cuts[i])} fill="none" stroke={INK} strokeWidth={fmt(ink * 0.55)} strokeLinejoin="round" />)}
      <CoilWire cam={cam} f={f} pulse={s.pulse} sc={sc} />
      <LatchLine cam={cam} f={f} s={s.line} sc={sc} />
      <Coil id={`${id}-coil`} cam={cam} f={f} heat={s.heat} sc={sc} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The launch tube from outside after the launch (S10's wide view): Gear's clear tube, the spring at its free length,
// and this file's coil, coil wire and parted line, so the hardware matches the S09 cutaway.
// ---------------------------------------------------------------------------------------------------------------
export const TubeExterior: React.FC<{id: string; cam: Cam; f: Frame; cutT: number}> = ({id, cam, f, cutT}) => {
  const L = (p: V3) => toW(f, p);
  const sc = scaleAt(cam, L([6, SEC.y, 0]));
  return (
    <g>
      {PACK.clamps.map((x, i) => (
        <BoxSolid key={i} cam={cam} f={f} c={[x, 25.4, 0]} h={[1.6, 1.8, 3.9]} color={GEAR_COL.clamp} ink={1.2} />
      ))}
      <Spring cam={cam} a={L([SEC.xPlug, SEC.y, 0])} b={L([SEC.springFree, SEC.y, 0])} r={PACK.tube.r * 0.72} turns={9} wire={0.42} />
      <LatchLine cam={cam} f={f} s={{cutT}} sc={sc} />
      <CylSolid id={`${id}-tube`} cam={cam} a={L(PACK.tube.a)} b={L(PACK.tube.b)} r={PACK.tube.r} color={GEAR_COL.tube} ink={1.4} alpha={0.42} cap="rgba(255,255,255,0.15)" />
      <CoilWire cam={cam} f={f} pulse={null} sc={sc} />
      <Coil id={`${id}-coil`} cam={cam} f={f} heat={0} sc={sc} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The injector cut along its axis (S10): barrel walls, the plunger with its activator chamber and seal, gas behind the
// plunger, the dose, the collar and the needle with its bore. Drawn in the injector's frame (x along the needle,
// origin at the barrel rear); the far half (local z >= 0) is kept.
// ---------------------------------------------------------------------------------------------------------------
export type Delivery = {
  /** 0 closed .. 1 the seal's two halves folded back */
  seal: number;
  /** activity in the chamber (bubbling) 0..1 */
  fizz: number;
  /** gas formed behind the plunger 0..1 */
  gas: number;
  /** plunger travel 0..1 (as rig/Gear.tsx Injector) */
  plunger: number;
  /** dose in the needle bore 0..1 (front of the flow along the needle) */
  flow: number;
  /** cloud growth in the silicone 0..1 */
  cloud: number;
  /** seconds (for bubble and flow motion) */
  t: number;
};
const IN = {rO: INJ.barrelR, rI: INJ.barrelR - 0.4, rear: 0.4, frontIn: INJ.barrelLen - 0.4, L: INJ.barrelLen};
/** plunger rear / front (injector x), the same mapping as rig/Gear.tsx Injector */
export const plungerAt = (pl: number) => {
  const r = 0.4 + clamp(pl) * (INJ.barrelLen - INJ.plungerLen - 1.2);
  return [r, r + INJ.plungerLen] as [number, number];
};
const hash01 = (i: number, s: number) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const BUBBLES = Array.from({length: 46}, (_, i) => ({u: hash01(i, 1), v: hash01(i, 2) * 2 - 1, r: 0.05 + 0.15 * Math.pow(hash01(i, 3), 1.6), tb: hash01(i, 4) * 0.9, ph: hash01(i, 5) * 6.28}));
const FIZZ = Array.from({length: 12}, (_, i) => ({ph: hash01(i, 7), v: hash01(i, 8) * 2 - 1, r: 0.05 + 0.08 * hash01(i, 9)}));
export const NEEDLE_LEN = INJ.barrelLen + 1.2 + INJ.needleLen;

export const SectionInjector: React.FC<{id: string; cam: Cam; f: Frame; d: Delivery}> = ({id, cam, f, d}) => {
  const P = (x: number, y: number, z = 0) => proj(cam, toW(f, [x, y, z]));
  const sc = scaleAt(cam, toW(f, [8, 0, 0]));
  const ink = Math.max(1.3, 0.09 * sc);
  const {rO, rI, rear, frontIn, L} = IN;
  const quad = (x0: number, y0: number, x1: number, y1: number) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  const [plR, plF] = plungerAt(d.plunger);
  const top = P(0, rI), bot = P(0, -rI);
  const anchor = P(0, -rO);
  // plunger outline with two sealing ribs
  const rb = rI - 0.12;
  const pl: [number, number][] = [
    [plR, -rb], [plR + 0.35, -rb], [plR + 0.5, -rI], [plR + 0.85, -rI], [plR + 1.0, -rb], [plF - 1.0, -rb], [plF - 0.85, -rI], [plF - 0.5, -rI], [plF - 0.35, -rb], [plF, -rb],
    [plF, rb], [plF - 0.35, rb], [plF - 0.5, rI], [plF - 0.85, rI], [plF - 1.0, rb], [plR + 1.0, rb], [plR + 0.85, rI], [plR + 0.5, rI], [plR + 0.35, rb], [plR, rb],
  ];
  // the activator chamber inside the plunger, open to the rear through the seal
  const cav = {x0: plR + 0.32, x1: plR + 2.3, r: 1.05};
  const gasLen = plR - rear;
  const sealOpen = clamp(d.seal);
  const flap = sealOpen * 1.25; // radians each half folds back
  const half = cav.r;
  const flapPts = (sd: 1 | -1): V2[] => [P(cav.x0, sd * half), P(cav.x0 - Math.sin(flap) * half * 0.92, sd * half * (1 - (1 - Math.cos(flap)) * 0.95) * (1 - 0.0))];
  const bubble = (x: number, y: number, r: number, k: string, a = 1) => {
    const c = P(x, y);
    const rr = Math.max(1.1, r * sc);
    return (
      <g key={k} opacity={a}>
        <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(rr)} fill="#F4FBFF" fillOpacity={0.55} stroke={mix(INK, '#9FC3D3', 0.4)} strokeWidth={fmt(Math.max(0.7, rr * 0.22))} />
        <circle cx={fmt(c[0] - rr * 0.35)} cy={fmt(c[1] - rr * 0.35)} r={fmt(rr * 0.3)} fill="#FFFFFF" />
      </g>
    );
  };
  const liqTop = P(plF, rI), liqBot = P(plF, -rI);
  const nR = INJ.needleR, nB = 0.09;
  const tipX = NEEDLE_LEN;
  // needle (cut along its axis): outer wall with a bevelled tip, the bore inside
  const needleOuter: V2[] = [P(L - 0.05, nR), P(tipX - 0.55, nR), P(tipX, -nR * 0.2), P(tipX - 0.08, -nR), P(L - 0.05, -nR)];
  const flowX = L + (tipX - 0.2 - L) * clamp(d.flow);
  const coll0 = INJ.collarAt - 0.9, coll1 = INJ.collarAt + 0.3, cR = INJ.collarR;
  const collarTop = [P(coll0, rO), P(L, rO), P(L, nR), P(coll1, nR), P(coll1, cR), P(coll0, cR)];
  const collarBot = [P(coll0, -rO), P(L, -rO), P(L, -nR), P(coll1, -nR), P(coll1, -cR), P(coll0, -cR)];
  return (
    <g>
      <Hatch id={`${id}-h`} at={anchor} sp={Math.max(3.5, 0.32 * sc)} color={TUBE_CUT_COL} ink={Math.max(0.8, 0.05 * sc)} alpha={0.5} />
      <Hatch id={`${id}-hc`} at={anchor} sp={Math.max(3.5, 0.32 * sc)} color={mix(GEAR_COL.collar, '#C9C2AE', 0.45)} ink={Math.max(0.8, 0.05 * sc)} alpha={0.45} angle={-45} />
      <defs>
        <linearGradient id={`${id}-in`} gradientUnits="userSpaceOnUse" x1={fmt(top[0])} y1={fmt(top[1])} x2={fmt(bot[0])} y2={fmt(bot[1])}>
          <stop offset="0" stopColor={shade(GEAR_COL.barrel, 0.3)} />
          <stop offset="0.35" stopColor={shade(GEAR_COL.barrel, 0.1)} />
          <stop offset="0.75" stopColor={lit(GEAR_COL.barrel, 0.2)} />
          <stop offset="1" stopColor={GEAR_COL.barrel} />
        </linearGradient>
        <linearGradient id={`${id}-lq`} gradientUnits="userSpaceOnUse" x1={fmt(liqTop[0])} y1={fmt(liqTop[1])} x2={fmt(liqBot[0])} y2={fmt(liqBot[1])}>
          <stop offset="0" stopColor={lit(GEAR_COL.liquid, 0.32)} />
          <stop offset="0.45" stopColor={GEAR_COL.liquid} />
          <stop offset="1" stopColor={shade(GEAR_COL.liquid, 0.22)} />
        </linearGradient>
        <linearGradient id={`${id}-pl`} gradientUnits="userSpaceOnUse" x1={fmt(liqTop[0])} y1={fmt(liqTop[1])} x2={fmt(liqBot[0])} y2={fmt(liqBot[1])}>
          <stop offset="0" stopColor={lit(GEAR_COL.plunger, 0.22)} />
          <stop offset="1" stopColor={shade(GEAR_COL.plunger, 0.2)} />
        </linearGradient>
      </defs>
      {/* the far half's inner surface */}
      <path d={polyPath(quad(rear, -rI, frontIn, rI))} fill={`url(#${id}-in)`} opacity={0.85} />
      {/* gas behind the plunger */}
      {gasLen > 0.02 && <path d={polyPath(quad(rear, -rI, plR, rI))} fill="#FFFFFF" opacity={0.35 * clamp(d.gas * 3)} />}
      {BUBBLES.filter((b) => d.gas > b.tb && gasLen > 0.1).map((b, i) => {
        const age = clamp((d.gas - b.tb) / 0.12);
        const r = b.r * (0.4 + 0.6 * age);
        const x = rear + r + 0.04 + b.u * Math.max(0, gasLen - 2 * r - 0.08);
        const y = b.v * (rI - r - 0.05) + 0.06 * Math.sin(d.t * 9 + b.ph);
        return bubble(x, y, r, `b${i}`, age);
      })}
      {/* the dose */}
      {frontIn - plF > 0.02 && <path d={polyPath(quad(plF, -rI, frontIn, rI))} fill={`url(#${id}-lq)`} />}
      {/* plunger (rubber, cut) with the activator chamber and its seal */}
      <path d={polyPath(pl.map(([x, y]) => P(x, y)))} fill={`url(#${id}-pl)`} stroke={INK} strokeWidth={fmt(ink * 0.8)} strokeLinejoin="round" />
      <path d={polyPath(quad(cav.x0, -cav.r, cav.x1, cav.r))} fill={mix('#BFE7F4', '#E9F7FB', d.fizz * 0.4)} stroke={INK} strokeWidth={fmt(ink * 0.6)} strokeLinejoin="round" />
      {d.fizz > 0 && FIZZ.map((b, i) => {
        // bubbles stream from the chamber out through the open seal
        const ph = (b.ph + d.t * 1.7) % 1;
        const x = cav.x1 - 0.15 - ph * (cav.x1 - cav.x0 + 0.5);
        const y = b.v * (cav.r - 0.18) * (1 - 0.5 * Math.max(0, (cav.x0 + 0.3 - x) / 0.8));
        return bubble(x, y, b.r, `z${i}`, d.fizz * (x < cav.x0 ? clamp(1 - (cav.x0 - x) / 0.5) : 1));
      })}
      {/* the seal: a foil across the chamber's rear opening; it splits and its halves fold back */}
      {[1, -1].map((sd) => {
        const pts = sealOpen <= 0 ? [P(cav.x0, 0), P(cav.x0, sd * half)] : flapPts(sd as 1 | -1).reverse();
        return (
          <g key={`s${sd}`}>
            <path d={line(pts)} stroke={INK} strokeWidth={fmt(Math.max(2.4, 0.16 * sc))} strokeLinecap="round" />
            <path d={line(pts)} stroke="#E4E9EE" strokeWidth={fmt(Math.max(1.4, 0.1 * sc))} strokeLinecap="round" />
          </g>
        );
      })}
      {/* cut faces: barrel walls (rear wall, top, bottom, front wall round the needle) and the collar */}
      {[quad(0, rI, L, rO), quad(0, -rO, L, -rI), quad(0, -rI, rear, rI), quad(frontIn, nR, L, rI), quad(frontIn, -rI, L, -nR)].map((q, i) => (
        <path key={`w${i}`} d={polyPath(q)} fill={`url(#${id}-h)`} stroke={INK} strokeWidth={fmt(ink * 0.5)} strokeLinejoin="round" />
      ))}
      {[collarTop, collarBot].map((q, i) => <path key={`c${i}`} d={polyPath(q)} fill={`url(#${id}-hc)`} stroke={INK} strokeWidth={fmt(ink * 0.7)} strokeLinejoin="round" />)}
      {/* needle */}
      <path d={polyPath(needleOuter)} fill={GEAR_COL.needle} stroke={INK} strokeWidth={fmt(Math.max(1, ink * 0.55))} strokeLinejoin="round" />
      <path d={line([P(L, 0), P(tipX - 0.3, 0)])} stroke="#EEF3F6" strokeWidth={fmt(Math.max(1.2, 2 * nB * sc))} strokeLinecap="round" />
      {d.flow > 0 && (
        <g>
          <path d={line([P(L - 0.05, 0), P(flowX, 0)])} stroke={GEAR_COL.liquid} strokeWidth={fmt(Math.max(1.2, 2 * nB * sc))} strokeLinecap="round" />
          <path d={line([P(L - 0.05, 0), P(flowX, 0)])} stroke={lit(GEAR_COL.liquid, 0.5)} strokeWidth={fmt(Math.max(0.6, nB * sc * 0.7))} strokeDasharray={`${fmt(0.35 * sc)} ${fmt(0.55 * sc)}`} strokeDashoffset={fmt(-d.t * 9 * sc)} strokeLinecap="round" opacity={0.8} />
        </g>
      )}
      {/* outer contour of the barrel */}
      <path d={polyPath([P(L, rO), P(0, rO), P(0, -rO), P(L, -rO)], false)} fill="none" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
    </g>
  );
};

/** the dose spreading into the silicone from the needle tip: a soft, lobed cloud (world frame of the injector) */
export const DoseCloud: React.FC<{id: string; cam: Cam; f: Frame; c: number; alpha?: number; clip?: string}> = ({id, cam, f, c, alpha = 1, clip}) => {
  if (c <= 0.001) return null;
  const sc = scaleAt(cam, toW(f, [NEEDLE_LEN, 0, 0]));
  const g = smoother(clamp(c));
  const R = 0.3 + 3.3 * g; // mm
  // a small soft cloud round the needle tip (a little ahead of it), a few lobes so it reads as liquid spreading
  const lobes: [number, number, number, number][] = [
    // [dx along the needle, dy, radius factor, alpha]
    [0.25, 0, 0.62, 0.95],
    [0.55, 0.32, 0.7, 0.5],
    [0.6, -0.36, 0.68, 0.5],
    [-0.05, 0.42, 0.55, 0.4],
    [0.0, -0.45, 0.55, 0.4],
    [0.85, 0.05, 0.55, 0.35],
  ];
  return (
    <g clipPath={clip}>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor="#F0A040" stopOpacity={0.85} />
          <stop offset="0.45" stopColor="#F2A93B" stopOpacity={0.5} />
          <stop offset="1" stopColor="#F2B060" stopOpacity={0} />
        </radialGradient>
      </defs>
      {lobes.map(([dx, dy, rf, a], i) => {
        const q = proj(cam, toW(f, [NEEDLE_LEN + dx * R * 0.8, dy * R * 0.8, 0]));
        const r = rf * R * sc * (0.85 + 0.15 * Math.sin(i * 2.1 + c * 3));
        return <ellipse key={i} cx={fmt(q[0])} cy={fmt(q[1])} rx={fmt(r * 1.15)} ry={fmt(r)} fill={`url(#${id}-g)`} opacity={a * alpha * (0.6 + 0.4 * g)} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The target fixture (sets/Lab.tsx TargetFixture's geometry and finish) cut by the plane z = zc, keeping z <= zc, for a
// camera on the +z side: zc = 0 is the half section through the needle; as zc sweeps out past the near cheek (zc >= 31)
// the cut closes and the drawing is the plain exterior. Aluminium cut faces are hatched; the silicone's cut face is
// translucent and lighter than its skin. Exposes a clip path `${id}-silclip` (the silicone part's outline on screen).
// ---------------------------------------------------------------------------------------------------------------
export const ALU_CUT = '#A9B4BE';
export const FIXTURE_CLOSED = 31;
type FixBox = {key: string; c: V3; h: V3; color: string; sil?: boolean};
const FIX: FixBox[] = [
  {key: 'base', c: [-14, 2.2, 0], h: [24, 2.2, 30], color: LAB.alu},
  {key: 'back', c: [-21.5, 30, 0], h: [2.5, 26, 23], color: shade(LAB.alu, 0.08)},
  {key: 'cheekL', c: [-10, 30, -21.5], h: [10.5, 21, 1.8], color: LAB.alu},
  {key: 'cheekR', c: [-10, 30, 21.5], h: [10.5, 21, 1.8], color: LAB.alu},
  {key: 'sil', c: [-TARGET.depth / 2, TARGET.cy, 0], h: [TARGET.depth / 2, TARGET.hy, TARGET.hz], color: LAB.silicone, sil: true},
];
export const FixtureCut: React.FC<{id: string; cam: Cam; zc: number}> = ({id, cam, zc}) => {
  const sc = scaleAt(cam, [0, 30, 0]);
  const ink = Math.max(1.2, Math.min(4, sc * 0.3));
  const parts: {z: number; el: React.ReactNode}[] = [];
  let silHull: V2[] = [];
  // as the cut plane sweeps out, its faces turn from cut faces into the plain sides of the parts
  const cutA = 1 - sr01(zc, 2.5, 13);
  for (const b of FIX) {
    const z0 = b.c[2] - b.h[2], z1 = b.c[2] + b.h[2];
    if (z0 >= zc) continue;
    const zt = Math.min(z1, zc);
    const cut = zt < z1;
    // a part wholly in front of the section plane (the near cheek) fades in over the rest of the sweep, so it does not
    // appear at full size the moment the plane reaches it
    const grow = z0 > 0 ? sr01(zc, z0, FIXTURE_CLOSED - 1) : 1;
    const c: V3 = cut ? [b.c[0], b.c[1], (z0 + zt) / 2] : b.c;
    const h: V3 = cut ? [b.h[0], b.h[1], (zt - z0) / 2] : b.h;
    const face = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => proj(cam, [c[0] + sx * h[0], c[1] + sy * h[1], zt + 0.01]));
    if (b.sil) {
      const corners: V2[] = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(proj(cam, [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]]));
      silHull = convexHull(corners);
    }
    const a0 = proj(cam, [c[0] - h[0], c[1] + h[1], zt]), a1 = proj(cam, [c[0] + h[0], c[1] - h[1], zt]);
    parts.push({
      z: depth(cam, c),
      el: (
        <g key={b.key} opacity={grow < 1 ? fmt(grow) : undefined}>
          <Solid cam={cam} c={c} h={h} color={b.color} ink={ink} />
          {cut && cam.eye[2] > zt && cutA > 0.002 && (b.sil ? (
            <g opacity={cutA < 1 ? fmt(cutA) : undefined}>
              <defs>
                <linearGradient id={`${id}-sil`} gradientUnits="userSpaceOnUse" x1={fmt(a0[0])} y1={fmt(a0[1])} x2={fmt(a1[0])} y2={fmt(a1[1])}>
                  <stop offset="0" stopColor={lit(LAB.silicone, 0.42)} />
                  <stop offset="0.5" stopColor={lit(LAB.silicone, 0.2)} />
                  <stop offset="1" stopColor={lit(LAB.silicone, 0.04)} />
                </linearGradient>
              </defs>
              <path d={polyPath(face)} fill={`url(#${id}-sil)`} />
              <path d={polyPath(face)} fill={`url(#${id}-hs)`} />
              <path d={polyPath(face)} fill="none" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
            </g>
          ) : (
            <path d={polyPath(face)} fill={`url(#${id}-ha)`} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" opacity={cutA < 1 ? fmt(cutA) : undefined} />
          ))}
        </g>
      ),
    });
  }
  parts.sort((a, b) => b.z - a.z);
  // TargetFixture's face sheen and screws, wherever that part of the fixture is present
  const screws: V3[] = [[-4, 14, 23.4], [-4, 46, 23.4], [-16, 14, 23.4], [-16, 46, 23.4], [-4, 14, -23.4], [-4, 46, -23.4], [-16, 14, -23.4], [-16, 46, -23.4]];
  const faceVis = (z: number) => (z > 0 ? cam.eye[2] > 23.3 && zc >= 23.3 : cam.eye[2] < -23.3);
  const screwA = sr01(zc, 19.7, FIXTURE_CLOSED - 1);
  const zq = Math.min(17.5, zc);
  return (
    <g>
      <Hatch id={`${id}-ha`} at={proj(cam, [-38, 0, 0])} sp={Math.max(4, 0.55 * sc)} color={ALU_CUT} ink={Math.max(0.9, 0.06 * sc)} alpha={0.5} />
      <defs>
        <pattern id={`${id}-hs`} patternUnits="userSpaceOnUse" width={fmt(Math.max(5, 1.1 * sc))} height={fmt(Math.max(5, 1.1 * sc))} patternTransform={`translate(${fmt(proj(cam, [-16, 13, 0])[0])} ${fmt(proj(cam, [-16, 13, 0])[1])}) rotate(45)`}>
          <line x1={0} y1={0} x2={0} y2={fmt(Math.max(5, 1.1 * sc))} stroke="#FFFFFF" strokeWidth={fmt(Math.max(0.8, 0.07 * sc))} opacity={0.3} />
        </pattern>
      </defs>
      <defs>
        <clipPath id={`${id}-silclip`}>
          <path d={polyPath(silHull)} />
        </clipPath>
      </defs>
      {parts.map((p) => p.el)}
      {cam.eye[0] > 0 && (() => {
        const q = zq > -17.5 ? [[0.05, 15, -17.5], [0.05, 15, zq], [0.05, 45, zq], [0.05, 45, -17.5]].map((p) => proj(cam, p as V3)) : null;
        const g = zc > -6 ? [[0.06, 36, -14], [0.06, 36, -6], [0.06, 43, -9], [0.06, 43, -15]].map((p) => proj(cam, p as V3)) : null;
        return (
          <g>
            {q && <path d={polyPath(q)} fill="#FFFFFF" opacity={0.08} />}
            {g && <path d={polyPath(g)} fill="#FFFFFF" opacity={0.35} />}
          </g>
        );
      })()}
      {screws.filter((p) => faceVis(p[2])).map((p, i) => {
        const c = proj(cam, p);
        const r = 1.6 * scaleAt(cam, p);
        return (
          <g key={i} opacity={p[2] > 0 && screwA < 1 ? fmt(screwA) : undefined}>
            <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r)} fill="#8C97A2" stroke={INK} strokeWidth={ink * 0.6} />
            <path d={`M${fmt(c[0] - r * 0.6)} ${fmt(c[1])} L${fmt(c[0] + r * 0.6)} ${fmt(c[1])}`} stroke={INK} strokeWidth={ink * 0.5} />
          </g>
        );
      })}
    </g>
  );
};
/** the clip path (silicone outline) exposed by FixtureCut */
export const silClipId = (id: string) => `url(#${id}-silclip)`;
