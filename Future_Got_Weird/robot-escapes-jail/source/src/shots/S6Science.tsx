// S6 — THE SCIENCE (17.02–22.45 s): "How? It's made from a metal that melts near body temperature. And magnets help
// control its movement."
//
// IN  (S5 -> S6): the first frames are the full-frame <MetalSurface t={t}/> (seamless with S5's last frames).
// OUT (S6 -> S7): from 22.15 everything fades except ONE field line, FIELD_PATH, drawn by <FieldLine/> (art/science.tsx:
//      stroke C.field, width 12, round caps, soft cyan glow) on flat C.navy1; from 22.38 the frame is exactly that.
//
// Beats (all keyed to T):
//   17.09–18.05  "How?" (17.13): a round cutaway (porthole, clean ink rim + silver bezel) opens in the metal and grows
//                past the frame: we fall into the MATERIAL (zoom 0.42 -> 1): packed silver gallium grains with dark,
//                angular NdFeB microparticles (red N / blue S ends), all quietly vibrating.
//   17.92 / 18.30  labels: "GALLIUM" (leader to a grain) and "+ MAGNETIC PARTICLES" (yellow rings on every particle).
//   18.42–18.98  pull back OUT: the view irises into a round lens (a callout) over a small ingot of the material, which
//                stands on a flat induction coil; a big thermometer slides in on the right.
//   18.72–20.15  the coil's ALTERNATING field (warm orange arcs, dashes running back and forth) heats it: "AC FIELD /
//                HEATS IT". "melts" (18.86): the column rises; the "GALLIUM MELTS 29.8 °C" mark appears (19.0); reached
//                at 19.32 (mark turns yellow) and the column HOLDS there while it melts (latent heat): the lattice in the
//                lens breaks up into a flowing liquid, the ingot slumps into a puddle (one body). "body" (19.43): the
//                "BODY 37 °C" mark appears ABOVE it (it melts a bit below body temperature). Then 31 °C, heat off.
//   20.18–20.55  the lens closes back into the puddle; coil glow dies; the thermometer slides out.
//   20.25–20.50  a bar magnet (red N / blue S) swings in and lands ahead of the puddle just before "magnets" (20.56);
//                its cyan field blooms (dipole lines) and the bold field line reaches back to the puddle.
//   20.95–21.30  the puddle gathers and stretches TOWARD the magnet (cause -> effect); "MAGNET -> STEERS".
//   21.25–22.10  "control its movement": the magnet glides along the curve, the liquid follows it (lagging tail).
//   22.15–22.38  everything fades except the field line (S7 hand-off).
import React from 'react';
import {MetalSurface, LiquidMetal, V} from '../art/liquid';
import {
  ACFieldArcs, BarMagnet, DipoleField, FieldLine, FONT, HeatShimmer, IngotFacets, InductionCoil, Lens, MAGNET, MaterialGrains,
  SciBg, SciLabel, THERMO, Thermometer, circlePts, fieldAt, sampleOutline, siteScreen, thermoY, FIELD_ARC, GRAIN,
} from '../art/science';
import {C, INK} from '../art/palette';
import {uid} from '../core/ids';
import {clamp, keyS, lerp, ring, ss, ss5} from '../lib';
import {SHOTS, T} from '../story';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));

const T0 = SHOTS.S6[0];
// ---- layout (screen px) ----
const PORT = {x: 540, y: 900}; // where the cutaway opens
const LENS = {x: 338, y: 712, r: 200}; // the callout lens in the apparatus view
const S_BLOB = 0.27; // the sample sits ON the final field line (arc fraction)
const SAMPLE = (() => {
  const p = fieldAt(S_BLOB).p;
  return {x: p.x, base: p.y + 20};
})();
const COIL = {x: SAMPLE.x, y: SAMPLE.base - 2, rx: 212, ry: 58};
const LABEL_X = THERMO.x - 60;
const CAM_F = {x: 540, y: 1180}; // camera scale focus // right edge of the thermometer labels

// ---- beats ----
const B = {
  open0: 17.09,
  lab1: T.made - 0.12, // 17.865 "GALLIUM" (on "It's")
  lab2: T.metal3 - 0.3, // 18.125 "+ MAGNETIC PARTICLES"
  pull0: 18.56,
  pull1: 19.06,
  coilOn: 18.8,
  acLab: 18.92, // under the coil, once the lens has cleared it
  meltMark: 19.0,
  reach: 19.32, // 29.8 °C reached
  body: T.body1 - 0.04, // 19.39 BODY 37 °C mark
  heatOff: 20.13,
  close0: 20.18,
  close1: 20.55,
  magIn0: 20.24,
  magIn1: 20.5,
  bloom0: T.magnets - 0.02, // 20.54
  pull: 20.95, // the liquid answers the magnet
  stLab: 21.0,
  move0: 21.25,
  move1: 22.08,
  fade0: 22.15,
  fade1: 22.38,
};

// =====================================================================================================================
// timing functions
// =====================================================================================================================
const pullK = (t: number) => ss5(t, B.pull0, B.pull1);
const closeK = (t: number) => ss5(t, B.close0, B.close1);
/** the cutaway circle (centre, radius) */
const portAt = (t: number) => {
  const rOpen = 430 * ss5(t, B.open0, 17.5) + 800 * ss5(t, 17.36, 18.05);
  const p = pullK(t), c = closeK(t);
  let x = lerp(PORT.x, LENS.x, p), y = lerp(PORT.y, LENS.y, p);
  let r = lerp(rOpen, LENS.r, p);
  x = lerp(x, SAMPLE.x, c);
  y = lerp(y, SAMPLE.base - 50, c);
  r = r * (1 - c);
  return {x, y, r};
};
/** material zoom inside the cutaway */
const zoomAt = (t: number) =>
  Math.exp(Math.log(0.5) + Math.log(1.3 / 0.5) * ss5(t, B.open0, 18.1) + Math.log(1.08) * ss5(t, 17.9, 18.55) + Math.log(0.56 / (1.3 * 1.08)) * ss5(t, B.pull0, B.pull1) + Math.log(1.08) * ss(t, 19.0, 20.3));
const driftAt = (t: number): V => ({x: -34 * (t - T0), y: -20 * (t - T0)});
const tempAt = (t: number) => keyS(t, [[18.84, 22], [B.reach, 29.8], [19.86, 29.8], [20.22, 31.2]]);
const heatAt = (t: number) => ss(t, B.coilOn, 19.05) * (1 - ss(t, B.heatOff, 20.42));
const meltLens = (t: number) => ss(t, B.reach - 0.02, 19.86);
const meltSample = (t: number) => ss(t, B.reach + 0.03, 19.98);
const fadeAll = (t: number) => 1 - ss(t, B.fade0, B.fade1);
const popP = (t: number, t0: number, d = 0.26) => clamp((t - t0) / d);

// ---- magnet + liquid along the field line (arc fractions) ----
const S_MAG0 = 0.6, S_MAG1 = 0.8;
const magS = (t: number) => S_MAG0 + (S_MAG1 - S_MAG0) * ss5(t, B.move0, B.move1);
const magPose = (t: number) => {
  const s = magS(t);
  const {p, tan} = fieldAt(s);
  const angPath = Math.atan2(tan.y, tan.x);
  // swing in from the right (off frame), arrive with a small settle
  const k = ss5(t, B.magIn0, B.magIn1);
  const from = {x: 1290, y: 1010, ang: -0.95};
  const settle = ring(t, B.magIn1, 2.4, 0.13) * 0.9;
  const x = lerp(from.x, p.x, k) + settle * tan.x * 14;
  const y = lerp(from.y, p.y, k) + settle * tan.y * 14;
  const ang = lerp(from.ang, angPath, ss5(t, B.magIn0 + 0.04, B.magIn1 + 0.02)) + settle * 0.05;
  return {x, y, ang, on: ss(t, B.magIn0 - 0.02, B.magIn0 + 0.08)};
};
const headS = (t: number) => S_BLOB + 0.055 * ss5(t, B.pull, 21.32) + 0.255 * ss5(t, 21.3, 22.12);
const tailS = (t: number) => S_BLOB + 0.012 * ss5(t, B.pull, 21.32) + 0.265 * ss5(t, 21.48, 22.25);

/** the one liquid body (sample -> puddle -> steered blob), screen outlines */
const liquidSets = (t: number): V[][] => {
  const melt = meltSample(t);
  const puddle = sampleOutline(SAMPLE.x, SAMPLE.base, melt, t);
  const g = ss5(t, 20.55, 21.05); // the puddle gathers into a drop as the field takes it
  if (g <= 0.001) return [puddle];
  const sh = headS(t), st = tailS(t);
  const len = (sh - st) * FIELD_ARC.total;
  const R = 80 / Math.sqrt(1 + Math.max(0, len) / 190);
  const {p: core, tan} = fieldAt(st);
  // the gathered drop is LIQUID: its outline keeps wobbling and it leans (bulges) toward the magnet that pulls it
  const n0 = puddle.length;
  const drop = puddle.map((_, k) => {
    const a = (k / n0) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const wob = 1 + 0.045 * Math.sin(3 * a + t * 5.3) + 0.035 * Math.sin(2 * a + t * 3.1) + 0.012 * Math.sin(4 * a - t * 6.2);
    const ru = R * 1.05 * wob * (1 + 0.22 * Math.max(0, c) * g), rv = R * wob * (1 - 0.08 * g);
    return {x: core.x + tan.x * c * ru - tan.y * s * rv, y: core.y + tan.y * c * ru + tan.x * s * rv};
  });
  const gathered = puddle.map((q, k) => ({x: lerp(q.x, drop[k].x, g), y: lerp(q.y, drop[k].y, g)}));
  const sets: V[][] = [gathered];
  const n = 14;
  for (let k = 1; k <= n; k++) {
    const u = k / n;
    const s = lerp(st, sh, u);
    const p = fieldAt(s).p;
    const r = R * lerp(0.86, 1.0, u) * g;
    sets.push(circlePts(p.x, p.y, r, 16));
  }
  return sets;
};

// =====================================================================================================================
// pieces
// =====================================================================================================================
/** a dark pill behind a label (legibility over the busy grain lattice) */
const Pill: React.FC<{x: number; y: number; w: number; h: number; p: number; opacity?: number}> = ({x, y, w, h, p, opacity = 1}) => {
  if (p <= 0.001) return null;
  const sc = 0.75 + 0.25 * clamp(p * 1.6);
  return (
    <g opacity={clamp(p * 2.5) * opacity} transform={`translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})`}>
      <rect x={f1(-w / 2)} y={f1(-h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill={C.navy0} opacity={0.86} stroke={INK} strokeWidth={4} />
      <rect x={f1(-w / 2 + 3)} y={f1(-h / 2 + 3)} width={f1(w - 6)} height={f1(h - 6)} rx={f1(h / 2 - 3)} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />
    </g>
  );
};

const Leader: React.FC<{a: V; b: V; color: string; p: number; opacity?: number; dot?: boolean}> = ({a, b, color, p, opacity = 1, dot = true}) => {
  const k = clamp(p);
  if (k <= 0.001) return null;
  const e = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)};
  return (
    <g opacity={opacity}>
      <line x1={f1(a.x)} y1={f1(a.y)} x2={f1(e.x)} y2={f1(e.y)} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={f1(a.x)} y1={f1(a.y)} x2={f1(e.x)} y2={f1(e.y)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {dot && k > 0.98 && <circle cx={f1(b.x)} cy={f1(b.y)} r={9} fill={color} stroke={INK} strokeWidth={3} />}
    </g>
  );
};

/** the dashed callout cone from the lens to the sample */
const Callout: React.FC<{lens: {x: number; y: number; r: number}; c: V; r: number; opacity: number}> = ({lens, c, r, opacity}) => {
  if (opacity <= 0.01 || lens.r < 4) return null;
  const dx = c.x - lens.x, dy = c.y - lens.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  // outer tangents of the two circles
  const rr = (lens.r - r) / L;
  const ca = rr, sa = Math.sqrt(Math.max(0, 1 - rr * rr));
  const lines: [V, V][] = [];
  for (const s of [-1, 1]) {
    const nx = ux * ca - s * uy * sa, ny = uy * ca + s * ux * sa;
    lines.push([{x: lens.x + nx * lens.r, y: lens.y + ny * lens.r}, {x: c.x + nx * r, y: c.y + ny * r}]);
  }
  return (
    <g opacity={opacity}>
      {lines.map(([a, b], i) => (
        <line key={i} x1={f1(a.x)} y1={f1(a.y)} x2={f1(b.x)} y2={f1(b.y)} stroke="#CFE6F5" strokeWidth={3} strokeDasharray="12 10" opacity={0.55} />
      ))}
    </g>
  );
};

/** a temperature mark on the thermometer: a tick across the tube + a right-aligned label to its left */
const TempMark: React.FC<{temp: number; small: string; big: string; color: string; p: number; flash?: number; opacity?: number; bigSize?: number; below?: boolean}> = ({temp, small, big, color, p, flash = 0, opacity = 1, bigSize = 54, below = false}) => {
  if (p <= 0.001) return null;
  const y = thermoY(THERMO, temp);
  const x0 = LABEL_X + 8, x1 = THERMO.x + THERMO.w / 2 + 10;
  const k = clamp(p * 1.8);
  return (
    <g opacity={opacity}>
      <line x1={f1(x1)} x2={f1(lerp(x1, x0, k))} y1={f1(y)} y2={f1(y)} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <line x1={f1(x1)} x2={f1(lerp(x1, x0, k))} y1={f1(y)} y2={f1(y)} stroke={color} strokeWidth={5} strokeLinecap="round" />
      {flash > 0.01 && <circle cx={f1(THERMO.x)} cy={f1(y)} r={f1(30 + 50 * flash)} fill="none" stroke={color} strokeWidth={5} opacity={(1 - flash) * 0.9} />}
      <SciLabel x={LABEL_X} y={y + bigSize * 0.36} anchor="end" p={p} ox={LABEL_X} oy={y}
        lines={[{text: big, size: bigSize, color}]} />
      <SciLabel x={LABEL_X} y={below ? y + bigSize * 0.36 + 48 : y - bigSize * 0.62} anchor="end" p={clamp((p - 0.15) / 0.85)} ox={LABEL_X} oy={y}
        lines={[{text: small, size: 40, color: '#E6F1FA'}]} />
    </g>
  );
};

/** "AC FIELD HEATS IT" on one line under the coil (white + heat orange) */
const HeatLabel: React.FC<{x: number; y: number; p: number; opacity: number}> = ({x, y, p, opacity}) => {
  if (p <= 0.001 || opacity <= 0.002) return null;
  const sc = 0.7 + 0.3 * clamp(1 + 2.9 * (clamp(p) - 1) ** 3 + 1.9 * (clamp(p) - 1) ** 2);
  const st = {fontFamily: FONT, fontWeight: 900, fontSize: 50, stroke: 'rgba(6,10,18,0.92)', strokeWidth: 9, strokeLinejoin: 'round' as const, paintOrder: 'stroke'};
  return (
    <g opacity={clamp(p * 2.5) * opacity} transform={`translate(${f1(x)} ${f1(y - 18)}) scale(${sc.toFixed(3)}) translate(${f1(-x)} ${f1(-(y - 18))})`}>
      <text x={f1(x)} y={f1(y)} textAnchor="middle" {...st}>
        <tspan fill="#FFFFFF">AC FIELD </tspan>
        <tspan fill={C.heat}>HEATS IT</tspan>
      </text>
    </g>
  );
};

/** "MAGNET → STEERS" with a drawn arrow (no font dependency for the arrow glyph) */
const SteerLabel: React.FC<{x: number; y: number; p: number; opacity: number}> = ({x, y, p, opacity}) => {
  if (p <= 0.001 || opacity <= 0.002) return null;
  const sc = 0.7 + 0.3 * clamp(1 + 2.9 * (clamp(p) - 1) ** 3 + 1.9 * (clamp(p) - 1) ** 2);
  const a = clamp(p * 2.5) * opacity;
  const st = {fontFamily: FONT, fontWeight: 900, fontSize: 54, stroke: 'rgba(6,10,18,0.92)', strokeWidth: 10, strokeLinejoin: 'round' as const, paintOrder: 'stroke'};
  const arrow = `M${x - 44},${y - 20} L${x + 26},${y - 20} M${x + 8},${y - 40} L${x + 30},${y - 20} L${x + 8},${y}`;
  return (
    <g opacity={a} transform={`translate(${x} ${y - 20}) scale(${sc.toFixed(3)}) translate(${-x} ${-(y - 20)})`}>
      <text x={x - 62} y={y} textAnchor="end" fill="#FFFFFF" {...st}>MAGNET</text>
      <path d={arrow} fill="none" stroke="rgba(6,10,18,0.92)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <path d={arrow} fill="none" stroke={C.field} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <text x={x + 52} y={y} textAnchor="start" fill={C.yellow} {...st}>STEERS</text>
    </g>
  );
};

// =====================================================================================================================
// the shot
// =====================================================================================================================
export const S6: React.FC<{t: number}> = ({t}) => {
  const fa = fadeAll(t);
  const port = portAt(t);
  const pk = pullK(t);
  const z = zoomAt(t);
  const drift = driftAt(t);
  const heat = heatAt(t);
  const temp = tempAt(t);
  const mL = meltLens(t);
  const mS = meltSample(t);
  const flowT = Math.max(0, t - B.reach);
  const metalVisible = pk < 0.001 && port.r < 1170;
  // apparatus view: a slow continuous pull back that settles exactly at identity by 22.1 (the hand-off line is exact)
  // phase C: a push-in on the liquid as the magnet takes over (20.15-20.85), then a pull back that reveals the whole
  // field line (21.45-22.12) and settles EXACTLY at identity for the hand-off
  const camS = 1.035 - 0.035 * ss5(t, B.pull0, 20.2);
  const camZ = 1 + 0.2 * ss5(t, 20.1, 20.85) - 0.2 * ss5(t, 21.45, 22.12);
  // ...and a lift that brings the magnet + liquid up toward the middle of the frame while we are close (0 again by 22.12)
  const camLift = 130 * (ss5(t, 20.1, 20.85) - ss5(t, 21.45, 22.12));
  const cam = `translate(0 ${f1(-camLift)}) translate(${CAM_F.x} ${CAM_F.y}) scale(${(camS * camZ).toFixed(4)}) translate(${-CAM_F.x} ${-CAM_F.y})`;
  const app = ss5(t, B.pull0 + 0.06, B.pull1); // apparatus appears
  const appSc = 1.14 - 0.14 * app;
  const thermoIn = ss5(t, 18.66, 19.08), thermoOut = ss5(t, 20.12, 20.5);
  const thermoDx = 300 * (1 - thermoIn);
  const thermoDy = 260 * thermoOut; // leaves downward (the magnet comes in from the right)
  const thermoOp = ss(t, 18.66, 18.9) * (1 - ss(t, 20.2, 20.45));
  const labOutB = 1 - ss(t, 20.12, 20.4); // apparatus labels leave
  const coilDy = 46 * ss5(t, 20.45, 20.95);
  const mag = magPose(t);
  const bloom = ss(t, B.bloom0, 20.95);
  const lineDraw = ss5(t, B.bloom0 + 0.04, 21.02);
  const showA = pk < 0.999; // phase-A labels can still be on
  const labA = 1 - ss(t, B.pull0 - 0.04, B.pull0 + 0.14);

  // phase-A label targets: a gallium grain upper-left, two magnetic particles lower-right
  // (0,-1): no magnetic particle in the rows under the GALLIUM pill, so the label never sits on a yellow-ringed particle
  const gTarget = siteScreen(0, -1, port.x, port.y, z, t, 0, drift);
  const lensContent = (
    <g>
      <rect x={f1(port.x - port.r - 4)} y={f1(port.y - port.r - 4)} width={f1(port.r * 2 + 8)} height={f1(port.r * 2 + 8)} fill={C.navy0} />
      <MaterialGrains t={t} cx={port.x} cy={port.y} z={z} heat={heat} melt={mL} hiNd={ss(t, B.lab2, B.lab2 + 0.25) * labA} clipR={port.r} drift={drift} flowT={flowT} />
    </g>
  );

  const liquid = liquidSets(t);
  const lensFade = 1 - ss(t, 20.27, 20.45); // the lens (and its callout) fade as they iris shut into the puddle
  // caption-band shade while the micro view fills the frame (bright grains behind the captions)
  const scrim = ss(port.r, 520, 900) * (1 - ss(t, B.pull0, B.pull0 + 0.3));
  const scrimId = uid('s6scrim');
  const showApp = pk > 0.001;
  const sampleC = {x: SAMPLE.x, y: SAMPLE.base - 56};

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <defs>
        <linearGradient id={scrimId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="560">
          <stop offset="0" stopColor={C.navy0} stopOpacity={0.62} />
          <stop offset="0.55" stopColor={C.navy0} stopOpacity={0.4} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0} />
        </linearGradient>
      </defs>
      {metalVisible ? <MetalSurface t={t} tint={0.45 * ss(t, B.open0, 17.7)} /> : <SciBg vig={fa} />}
      {metalVisible && port.r > 0.5 && port.r < 60 && (
        // a dark dimple forms first (anticipation of the opening)
        <circle cx={PORT.x} cy={PORT.y} r={f1(port.r + 26)} fill={C.navy0} opacity={0.18 * clamp(port.r / 15) * clamp((60 - port.r) / 20)} />
      )}

      <g transform={cam} opacity={fa}>
        {showApp && (
          <g>
            {/* ---- apparatus: coil, AC field, sample (one liquid body) ---- */}
            <g opacity={app} transform={`translate(${f1(SAMPLE.x)} ${f1(SAMPLE.base)}) scale(${appSc.toFixed(4)}) translate(${f1(-SAMPLE.x)} ${f1(-SAMPLE.base)})`}>
              <g transform={`translate(0 ${f1(coilDy)})`}>
                <InductionCoil cx={COIL.x} cy={COIL.y} rx={COIL.rx} ry={COIL.ry} heat={heat} t={t} opacity={1 - ss(t, 20.5, 20.95)} />
              </g>
              <ACFieldArcs cx={COIL.x} cy={COIL.y - 4} span={232} h={190} t={t} on={heat * labOutB} />
              {t < 20.6 && <LiquidMetal pts={liquid} t={t} px={30} heat={heat * 0.9} ripple={mS * (1 - mS) * 2} />}
              {t < 20.6 && <IngotFacets cx={SAMPLE.x} base={SAMPLE.base} melt={mS} heat={heat} />}
              <HeatShimmer x={SAMPLE.x} y={SAMPLE.base - 124 + 76 * mS} w={150} t={t} on={heat * 0.9} />
            </g>
            {/* ---- thermometer + marks ---- */}
            <g transform={`translate(${f1(thermoDx)} ${f1(thermoDy)})`} opacity={thermoOp}>
              <Thermometer temp={temp} t={t} glowAt={heat} />
              <TempMark temp={37} small="BODY" big="37 °C" color="#FFFFFF" p={popP(t, B.body)} opacity={labOutB} bigSize={60} />
              <TempMark temp={29.8} small="GALLIUM MELTS" big="29.8 °C" color={t >= B.reach ? C.yellow : '#FFFFFF'} p={popP(t, B.meltMark)} flash={t >= B.reach ? clamp((t - B.reach) / 0.45) : 0} opacity={labOutB} bigSize={66} below />
              <SciLabel x={THERMO.x - 8} y={512} anchor="middle" p={popP(t, 18.86, 0.2)} opacity={labOutB}
                lines={[{text: `${temp.toFixed(1)} °C`, size: 46, color: Math.abs(temp - 29.8) < 0.05 && t > B.reach - 0.05 ? C.yellow : '#FFFFFF'}]} />
            </g>
            <HeatLabel x={COIL.x} y={COIL.y + 150} p={popP(t, B.acLab)} opacity={labOutB * app} />
            {/* ---- the callout cone from the lens to the sample ---- */}
            <Callout lens={port} c={sampleC} r={lerp(118, 100, mS)} opacity={ss(t, 18.95, 19.12) * (1 - closeK(t)) * lensFade} />
          </g>
        )}

        {/* ---- the cutaway / lens: the material's micro view ---- */}
        {port.r > 0.5 && (
          // the lens fades in its last few px as it irises shut into the puddle (no bead left floating above it)
          <g opacity={lensFade}>
            <Lens cx={port.x} cy={port.y} r={port.r} rim={port.r > 1180 ? 0 : 1}>
              {lensContent}
            </Lens>
          </g>
        )}
        {scrim > 0.002 && (
          // the caption band sits over the bright lattice: a soft navy shade at the top keeps the captions legible
          <rect x="-200" y="-200" width="1480" height="760" fill={`url(#${scrimId})`} opacity={scrim} />
        )}

        {/* ---- phase A labels ---- */}
        {showA && labA > 0.001 && (
          <g opacity={labA}>
            <Leader a={{x: gTarget.x + 30, y: 640}} b={{x: gTarget.x + 10, y: gTarget.y - GRAIN.r * z * 1.12}} dot={false} color="#FFFFFF" p={ss(t, B.lab1 + 0.05, B.lab1 + 0.22)} />
            <circle cx={f1(gTarget.x)} cy={f1(gTarget.y)} r={f1(GRAIN.r * z * 1.12)} fill="none" stroke={INK} strokeWidth={9} opacity={ss(t, B.lab1 + 0.12, B.lab1 + 0.25)} />
            <circle cx={f1(gTarget.x)} cy={f1(gTarget.y)} r={f1(GRAIN.r * z * 1.12)} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={ss(t, B.lab1 + 0.12, B.lab1 + 0.25)} />
            <Pill x={gTarget.x + 30} y={606} w={330} h={92} p={popP(t, B.lab1)} />
            <SciLabel x={gTarget.x + 30} y={628} anchor="middle" p={popP(t, B.lab1)} ox={gTarget.x + 30} oy={606} lines={[{text: 'GALLIUM', size: 62}]} />
            <Pill x={540} y={1290} w={650} h={88} p={popP(t, B.lab2)} />
            <SciLabel x={540} y={1312} anchor="middle" p={popP(t, B.lab2)} oy={1290} lines={[{text: '+ MAGNETIC PARTICLES', size: 54, color: C.yellow}]} />
          </g>
        )}

        {/* ---- phase C: the magnet steers the liquid ---- */}
      </g>
      {/* the field line is NOT part of the fade: it is the one element that stays (identical at the cut) */}
      {lineDraw > 0.0005 && (
        // grows out of the magnet once it has landed (never a stray dash before it arrives); the travelling light
        // only runs once the whole line is drawn (FieldLine's pulse is not limited to seg)
        <g transform={cam}>
          <FieldLine seg={[lerp(S_MAG0 - 0.02, 0, lineDraw), lerp(S_MAG0 + 0.02, 1, lineDraw)]} pulse={ss(t, 20.98, 21.15) * (1 - ss(t, 22.0, B.fade0))} t={t} />
        </g>
      )}
      {t >= 20.2 && (
        <g transform={cam} opacity={fa}>
          <DipoleField x={mag.x} y={mag.y} ang={mag.ang} t={t} grow={bloom} opacity={mag.on} />
          {t >= 20.6 && <LiquidMetal pts={liquid} t={t} px={44} ripple={0.25 + 0.5 * ss(t, 21.2, 21.6) * (1 - ss(t, 22.0, 22.3))} />}
          <BarMagnet x={mag.x} y={mag.y} ang={mag.ang} t={t} opacity={mag.on} />
          <SteerLabel x={512} y={860} p={popP(t, B.stLab)} opacity={1 - ss(t, 22.0, B.fade0)} />
        </g>
      )}
    </svg>
  );
};
void MAGNET;

// =====================================================================================================================
// SOUND (film seconds). Transients sit in the gaps between stressed syllables; beds carry the heat and the field.
// =====================================================================================================================
export const CUES_S6 = (): Cue[] => [
  {t: B.open0 - 0.05, kind: 'swish', gain: -4, dur: 0.3},       // the cutaway opens in the metal ("How?" 17.13)
  {t: 17.47, kind: 'reveal', gain: -6},                          // the micro world (gap after "How?")
  {t: B.lab1 - 0.06, kind: 'pop', gain: -4},                     // GALLIUM
  {t: B.lab2 - 0.02, kind: 'pop', gain: -4},                     // + MAGNETIC PARTICLES
  {t: B.pull0, kind: 'swish', gain: -7, dur: 0.3},               // pull back out to the apparatus
  {t: B.coilOn, kind: 'heat_coil', gain: -1, dur: 1.38},          // the AC coil whine, 18.80 -> ~20.18 (heat off)
  {t: B.reach, kind: 'mech_click', gain: -5, variant: 2},        // the column hits 29.8 °C
  {t: B.reach + 0.02, kind: 'melt', gain: -3, dur: 0.9},         // the lattice melts, the ingot slumps
  {t: B.magIn0 + 0.02, kind: 'swish', gain: -5, dur: 0.3},       // the magnet swings in (before "And magnets")
  {t: B.magIn1 - 0.01, kind: 'mech_click', gain: -6, variant: 1}, // it lands (20.49, before "And" 20.52)
  {t: B.bloom0 + 0.04, kind: 'mag_hum', gain: 0, dur: 1.82},     // the field, 20.58 -> 22.40
  {t: B.stLab + 0.03, kind: 'pop', gain: -6},                    // MAGNET -> STEERS
  {t: B.move0 + 0.04, kind: 'flow', gain: -4, dur: 0.95},        // the liquid follows the magnet
];
