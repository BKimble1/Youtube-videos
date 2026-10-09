import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../../theme';
import {
  DEFAULT_VIEW,
  LAYOUT,
  assertAroundTheEnd,
  crossesOccluder,
  hiddenByPartition,
  occluderSilhouette,
  partitionCrossings,
  partitionTopH,
  projectWith,
  rigScale,
  viewAt,
  visibleSpans,
  type PlanPt,
  type ViewConfig,
} from '../../lib/room';
import {LAYOUT as OPTICS_LAYOUT, assertPath} from '../../lib/optics';
import {RAISED_TILT} from '../../lib/shots';
import {GapMarker, RoomSet, type RoomItem} from '../v02/RoomSet';
import {rigCovers, rimFlash} from '../v02/Cast2';
import {BigSensor, HitSpark, INK, LIGHT, SMUG_SIDEWAYS, ThumbGuesser, lerp} from '../v02/Thumb_Kit';

/**
 * Thumbnail D (v2 re-edit, REVISION_BRIEF "one hidden subject, one obvious obstruction, one sensor, a clear
 * relationship"): the film's own room (RoomSet, the coral folding Partition, the floor GapMarker) at RAISED_TILT, with
 *  - ONE hidden subject: the guesser (Thumb_Kit ThumbGuesser, SMUG_SIDEWAYS, 4 px contour), behind the partition on
 *    the side away from the sensor, pressed against its near end;
 *  - ONE obstruction: the film's 2 m partition (layout.json, unchanged), seen a little more broadside than the film's
 *    camera (shear 0.45 instead of 0.26) so its face reads as a wall at thumbnail size;
 *  - ONE sensor: the kit's teal sensor seen from behind (Thumb_Kit BigSensor) on a tripod, aimed at the wall;
 *  - ONE light path, straight segments: sensor -> one lit spot on the bare wall -> into the opening behind the
 *    partition's FAR end -> his wall-side chest (a spark and a saffron rim on his up-left outline). No return trail, no
 *    arrows, no plot, nothing drawn through or over the partition.
 *
 * Everything is drawn at zoom 1 in a ViewConfig scaled up from the film's (no Camera zoom), so set outlines stay at the
 * house 4 px (OUTLINE) at 1080p and the guesser is drawn with a 4 px screen-px contour.
 *
 * `thumbDGeometry` THROWS at module load unless:
 *  - in plan the route clears the partition with a margin (optics assertPath) and the straight lines from the sensor
 *    to his centre and to both sides of his body are blocked by it;
 *  - at this tilt and scale every leg obeys assertAroundTheEnd (behind / out from behind only by an END's vertical
 *    edge, >= 24 px + the drawn light's half-width below that end's top corner; nothing over the top band; the
 *    sensor -> wall leg >= 18 px + half-width clear of the partition on the camera side);
 *  - the wall -> him leg is visible ONLY from the wall spot to the partition's far edge (the partition as drawn, then
 *    his drawn body, hide the rest: no light between the partition and him) and it goes in by the FAR edge;
 *  - the drawn stub's run-on under the far edge is hidden by the partition; the arrival point is on his drawn body and
 *    not behind the partition; no saffron mark reaches above the partition's top edge within its x-span;
 *  - the title keeps clear of the partition, him, the sensor and every light mark, and everything sits in frame.
 */

/* ------------------------------------------------------------------ framing and plan points */

export const THUMB_D_TILT = RAISED_TILT;
/** px per metre at tilt 0 (the film's DEFAULT_VIEW is 340 and A/B zoom it by 1.5-1.85; here the set itself is scaled). */
const PPM = 550;
const ANCHOR = {x: 1385, y: 612};
export const THUMB_D_VIEW: ViewConfig = {
  room: {ppm: PPM, floor: DEFAULT_VIEW.room.floor, shear: 0.45, anchor: ANCHOR},
  plan: {ppm: (PPM * DEFAULT_VIEW.plan.ppm) / DEFAULT_VIEW.room.ppm, anchor: ANCHOR},
  pivot: DEFAULT_VIEW.pivot,
};

/** Plan points (metres, layout.json axes). The partition is the film's (LAYOUT.occluder); his spot is the film's
 *  hidden spot (2.6, 0.85) moved 0.25 m further from the partition; the sensor stands further left and forward than
 *  the film's frame-A stand (1.65, 0.9) so the sensor -> wall leg reads at thumbnail size. Thumbnail-only staging: the
 *  film's own layout.json is not changed. */
export const THUMB_D_PTS = {
  /** the sensor's emitter */
  S: {x: 0.45, z: 1.3, h: 1.15} as PlanPt,
  /** the one lit spot on the relay wall */
  W: {x: 1.55, z: 0, h: 1.25} as PlanPt,
  /** his floor spot */
  H: {x: 2.85, z: 0.85} as PlanPt,
  /** arrival height on his chest (the rig's chest is ~0.95-1.1 m) */
  hitH: 1.0,
};

const SPEC = {
  label: 'ThumbD',
  band: 30,
  casing: OUTLINE,
  /** lit patch on the wall round W (m) */
  glowM: {w: 0.46, h: 0.32},
  wallSparkR: 64,
  hitSparkR: 50,
  /** his spark is centred on the arrival point nudged this fraction of its radius onto his chest (+x), so it is drawn
   *  on him and not over the partition's near edge */
  hitSparkNudge: 0.45,
  sensorW: 260,
  guesserOutline: OUTLINE,
  title: {x: 72, y: 218, size: 220},
  frameMargin: 30,
};

/* ------------------------------------------------------------------ geometry (checked) */

type XY = {x: number; y: number};

/** Screen y of the drawn partition's top edge at screen x (null outside its x-span). */
const partitionTopAt = (s: ReturnType<typeof viewAt>, x: number) => {
  const o = LAYOUT.occluder;
  let best: number | null = null;
  for (const dx of [-o.thickness / 2, o.thickness / 2]) {
    let prev: XY | null = null;
    for (let k = 0; k <= 160; k++) {
      const z = o.z0 + ((o.z1 - o.z0) * k) / 160;
      const q = projectWith(s, {x: o.x + dx, z, h: partitionTopH(z)});
      if (prev && ((prev.x <= x && x <= q.x) || (q.x <= x && x <= prev.x))) {
        const u = q.x === prev.x ? 0 : (x - prev.x) / (q.x - prev.x);
        const y = prev.y + (q.y - prev.y) * u;
        best = best === null ? y : Math.min(best, y);
      }
      prev = q;
    }
  }
  return best;
};

const segDist = (p: XY, a: XY, b: XY) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
  return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
};

const inPoly = (q: XY, poly: XY[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};

/** Ink box of the two-line title (Fredoka 700, line gap 0.86): "SEES" 2.224 em, "ME?" 1.82 em, caps 0.70 em. */
const titleRects = (x: number, y: number, size: number) =>
  [
    {name: 'title SEES', w: 2.224 * size, base: y},
    {name: 'title ME?', w: 1.82 * size, base: y + 0.86 * size},
  ].map((l) => ({name: l.name, x: x - 6, y: l.base - 0.7 * size - 6, w: l.w + 12, h: 0.712 * size + 12}));

export const thumbDGeometry = () => {
  const {label, band, casing} = SPEC;
  const {S, W, H, hitH} = THUMB_D_PTS;
  const tilt = THUMB_D_TILT;
  const view = THUMB_D_VIEW;
  const s = viewAt(tilt, view);
  const P = (p: PlanPt): XY => {
    const q = projectWith(s, p);
    return {x: q.x, y: q.y};
  };
  const o = LAYOUT.occluder;

  // --- arrival: where the wall -> him leg meets his body cylinder (layout bodyRadius) at chest height
  const br = (LAYOUT.hidden as {bodyRadius?: number}).bodyRadius ?? 0.22;
  const toW = {x: W.x - H.x, z: W.z - H.z};
  const tl = Math.hypot(toW.x, toW.z);
  const hit: PlanPt = {x: H.x + (toW.x / tl) * br, z: H.z + (toW.z / tl) * br, h: hitH};

  // --- plan: the route clears the partition (5 cm margin); he is hidden from the sensor, centre and both flanks
  assertPath(
    [S, W, hit].map((p) => ({x: p.x, z: p.z})),
    OPTICS_LAYOUT,
    0.05,
  );
  if (Math.abs(W.z) > 1e-9) throw new Error(`${label}: the wall spot must lie on the relay wall (z = 0)`);
  const toS = {x: S.x - H.x, z: S.z - H.z};
  const ts = Math.hypot(toS.x, toS.z);
  const side = {x: -toS.z / ts, z: toS.x / ts};
  for (const k of [-1, 0, 1]) {
    const q = {x: H.x + side.x * br * k, z: H.z + side.z * br * k};
    if (!crossesOccluder(S, q)) throw new Error(`${label}: the partition does not block the sensor's straight line to him (${k})`);
  }
  // the gap is where the wall -> him leg crosses the partition's plane
  const uPlane = (o.x - W.x) / (hit.x - W.x);
  const zPlane = W.z + (hit.z - W.z) * uPlane;
  if (!(zPlane > 0.05 && zPlane < o.z0 - 0.1)) throw new Error(`${label}: the wall -> him leg does not pass through the opening at the far end (z ${zPlane.toFixed(2)})`);

  // --- the room light rule at this view, with the drawn light's half-width (ink casing, pale glow) as margin
  const lightR = Math.max(band / 2 + casing, band * 1.2);
  assertAroundTheEnd(label, [[S, W, hit]], s, {zoom: 1, minBelowCornerPx: 24 + lightR, minFrontClearPx: 18 + lightR});

  // --- him: the frontal rig on the set's height scale
  const feet = P({x: H.x, z: H.z, h: 0});
  const him = {x: feet.x, y: feet.y, scale: rigScale(s)};

  // --- visibility of the wall -> him leg: the partition as drawn, then his drawn body (points behind him)
  const hides = (p: PlanPt) => hiddenByPartition(p, s) || ((p.z < H.z + 0.05) && rigCovers(him, P(p)));
  const spans = visibleSpans(W, hit, tilt, {view, noOccluder: true, hidden: hides, steps: 600});
  if (spans.length !== 1 || spans[0][0] > 1e-6 || spans[0][1] > 0.9) throw new Error(`${label}: the wall -> him leg must show only from the wall spot to the partition's far end (${JSON.stringify(spans)})`);
  const report = partitionCrossings(W, hit, s, {zoom: 1});
  const goIn = report.crossings.find((c) => c.dir === 'in');
  if (!goIn || goIn.edge !== 'far') throw new Error(`${label}: the wall -> him leg must go behind the partition's FAR end`);
  const uIn = spans[0][1];
  const qW = P(W);
  const qHit = P(hit);
  const qS = P(S);
  const edgeIn = lerp(qW, qHit, uIn);
  // the drawn stub runs on under the far edge by the light's half-width (so it meets the edge at full width), and that
  // run-on must be hidden by the partition as drawn (it is painted in the backdrop, under the partition)
  const legPx = Math.hypot(qHit.x - qW.x, qHit.y - qW.y);
  const uEnd = Math.min(1, uIn + (lightR + 2) / legPx);
  const pEnd: PlanPt = {x: W.x + (hit.x - W.x) * uEnd, z: W.z + (hit.z - W.z) * uEnd, h: (W.h ?? 0) + (hitH - (W.h ?? 0)) * uEnd};
  if (!hiddenByPartition(pEnd, s)) throw new Error(`${label}: the stub's run-on under the far edge would show`);
  const stubEnd = lerp(qW, qHit, uEnd);
  if (!rigCovers(him, qHit)) throw new Error(`${label}: the arrival point is not on his drawn body`);
  const qSpark = {x: qHit.x + SPEC.hitSparkR * SPEC.hitSparkNudge, y: qHit.y};
  if (!rigCovers(him, qSpark)) throw new Error(`${label}: his spark centre is not on his drawn body`);
  if (hiddenByPartition(hit, s)) throw new Error(`${label}: the arrival point is behind the partition`);

  // --- marks: the lit patch (ellipse on the wall plane), the wall spark, his spark; none above the partition's top
  const glow = {cx: qW.x, cy: qW.y, rx: (SPEC.glowM.w / 2) * s.ppm, ry: (SPEC.glowM.h / 2) * s.ppm * s.height};
  const sil = occluderSilhouette(tilt, view);
  const xs = sil.map((q) => q.x);
  const spanX0 = Math.min(...xs);
  const spanX1 = Math.max(...xs);
  const marks: [string, XY, number][] = [
    ['wall glow', {x: glow.cx, y: glow.cy}, Math.max(glow.rx, glow.ry)],
    ['wall spark', qW, SPEC.wallSparkR],
    ['his spark', qSpark, SPEC.hitSparkR],
  ];
  for (const [n, q, r] of marks) {
    for (const dx of [-r, -r / 2, 0, r / 2, r]) {
      const x = q.x + dx;
      if (x < spanX0 || x > spanX1) continue;
      const top = partitionTopAt(s, x);
      if (top !== null && q.y - r <= top) throw new Error(`${label}: the ${n} reaches above the partition's top edge`);
    }
  }
  const silEdgeDist = (q: XY) => Math.min(...sil.map((a, i) => segDist(q, a, sil[(i + 1) % sil.length])));
  // the wall spot's marks (lit patch, spark) stay >= 20 px clear of the partition: the bounce is on bare wall
  const wallClear = silEdgeDist(qW) - Math.max(glow.rx, glow.ry, SPEC.wallSparkR);
  if (inPoly(qW, sil) || wallClear < 20) throw new Error(`${label}: the wall spot's marks come ${wallClear.toFixed(0)} px from the partition`);
  // his spark (drawn above the set) may touch the partition's near edge with its points, never sit on it
  if (inPoly(qSpark, sil) || silEdgeDist(qSpark) < SPEC.hitSparkR * 0.5) throw new Error(`${label}: his spark sits on the partition (${silEdgeDist(qSpark).toFixed(0)} px from its edge)`);

  // --- the sensor (BigSensor seen from behind): its coral emitter rim sits on S; box, grip and tripod in screen px
  const w = SPEC.sensorW;
  const hB = w * 0.64;
  const sensor = {x: qS.x + 0.15 * w, y: qS.y + 0.075 * w + 2 + hB / 2, w};
  const gripX = sensor.x - w / 2 + w * 0.535;
  const gripBottom = sensor.y - hB / 2 + hB - hB * 0.16 + hB * 0.95;
  const floorY = P({x: S.x, z: S.z, h: 0}).y;
  if (floorY - gripBottom < 120) throw new Error(`${label}: the tripod would be ${Math.round(floorY - gripBottom)} px tall (sensor too big for its height)`);
  const sensorBox = {x: sensor.x - w / 2 - 6, y: qS.y - w * 0.13, w: w + w * 0.07 + 12, h: floorY - (qS.y - w * 0.13) + 10};

  // --- screen layout: title clear of everything, everything in frame
  const t = SPEC.title;
  const rects = titleRects(t.x, t.y, t.size);
  const clear = 22;
  const legs: [XY, XY][] = [
    [qS, qW],
    [qW, edgeIn],
  ];
  for (const r of rects) {
    if (r.x < SPEC.frameMargin || r.y < SPEC.frameMargin || r.x + r.w > 1920 - SPEC.frameMargin || r.y + r.h > 1080 - SPEC.frameMargin) throw new Error(`${label}: ${r.name} is too close to the frame edge`);
    for (let y = r.y; y <= r.y + r.h; y += 6) {
      for (let x = r.x; x <= r.x + r.w; x += 6) {
        const q = {x, y};
        if (rigCovers(him, q, clear)) throw new Error(`${label}: ${r.name} comes within ${clear} px of him`);
        if (legs.some(([a, b]) => segDist(q, a, b) < lightR + clear)) throw new Error(`${label}: ${r.name} comes within ${clear} px of the light (${x}, ${y})`);
        if (Math.hypot(q.x - glow.cx, q.y - glow.cy) < Math.max(glow.rx, SPEC.wallSparkR) + clear) throw new Error(`${label}: ${r.name} comes within ${clear} px of the wall spot`);
        if (inPoly(q, sil) || sil.some((p) => Math.hypot(p.x - q.x, p.y - q.y) < clear)) throw new Error(`${label}: ${r.name} comes within ${clear} px of the partition`);
        if (x > sensorBox.x - clear && x < sensorBox.x + sensorBox.w + clear && y > sensorBox.y - clear && y < sensorBox.y + sensorBox.h + clear) throw new Error(`${label}: ${r.name} comes within ${clear} px of the sensor`);
      }
    }
  }
  const inFrame = (q: XY, what: string, m = SPEC.frameMargin) => {
    if (q.x < m || q.x > 1920 - m || q.y < m || q.y > 1080 - m) throw new Error(`${label}: ${what} is out of frame (${q.x.toFixed(0)}, ${q.y.toFixed(0)})`);
  };
  inFrame({x: qW.x, y: qW.y - SPEC.wallSparkR}, 'the wall spark');
  inFrame(edgeIn, "the leg's entry behind the far end");
  inFrame(qSpark, 'his spark');
  inFrame({x: him.x, y: him.y - 470 * him.scale}, 'his hair', 4);
  inFrame({x: sensorBox.x, y: sensorBox.y}, 'the sensor');
  inFrame(P({x: o.x, z: o.z0, h: 0}), "the partition's far foot");

  return {
    label,
    s,
    tilt,
    view,
    band,
    casing,
    lightR,
    qS,
    qW,
    qHit,
    qSpark,
    edgeIn,
    stubEnd,
    glow,
    him,
    sensor,
    gripX,
    gripBottom,
    floorY,
    measured: {
      inBelowCornerPx: goIn.belowCornerPx,
      frontClearPx: partitionCrossings(S, W, s, {zoom: 1}).frontClearPx,
      stubPx: Math.hypot(edgeIn.x - qW.x, edgeIn.y - qW.y),
      upPx: Math.hypot(qW.x - qS.x, qW.y - qS.y),
      gapZ: zPlane,
      wallClearPx: wallClear,
      guesserPx: 466 * him.scale,
      partitionPx: {x0: spanX0, x1: spanX1},
    },
  };
};

export const THUMB_D = thumbDGeometry();

/* ------------------------------------------------------------------ drawing */

/** The sensor's tripod in screen px (4 px ink): head plate under the grip, centre column, three splayed legs. */
const Tripod: React.FC<{x: number; top: number; floor: number; spread: number; outline?: number}> = ({x, top, floor, spread, outline = OUTLINE}) => {
  const hubY = top + (floor - top) * 0.42;
  const feet: [number, number][] = [
    [x + spread * 0.12, floor - spread * 0.1],
    [x - spread, floor],
    [x + spread, floor + spread * 0.04],
  ];
  const leg = ([fx, fy]: [number, number], i: number) => (
    <g key={i}>
      <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={INK} strokeWidth={14 + outline * 2} strokeLinecap="round" />
      <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={C.inkSoft} strokeWidth={14} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <ellipse cx={x} cy={floor + 6} rx={spread * 1.3} ry={Math.max(10, spread * 0.17)} fill={C.shadow} />
      {leg(feet[0], 0)}
      <line x1={x} y1={top} x2={x} y2={hubY + 8} stroke={INK} strokeWidth={18 + outline * 2} strokeLinecap="round" />
      <line x1={x} y1={top} x2={x} y2={hubY + 8} stroke={C.inkMuted} strokeWidth={18} strokeLinecap="round" />
      {leg(feet[1], 1)}
      {leg(feet[2], 2)}
      <rect x={x - 24} y={hubY - 14} width={48} height={28} rx={8} fill={C.tealDeep} stroke={INK} strokeWidth={outline} />
      <rect x={x - 44} y={top - 6} width={88} height={22} rx={8} fill={C.tealDeep} stroke={INK} strokeWidth={outline} />
    </g>
  );
};

/** Plain readout glass: no plot, just a soft glare so it reads as a screen. */
const Glass: React.FC<{w: number; h: number}> = ({w, h}) => (
  <g>
    <rect x={0} y={0} width={w} height={h} fill={C.inkSoft} />
    <path d={`M ${w * 0.1} ${h} L ${w * 0.38} 0 L ${w * 0.52} 0 L ${w * 0.24} ${h} Z`} fill={C.white} opacity={0.16} />
  </g>
);

const f = (n: number) => n.toFixed(2);

export const ThumbDScene: React.FC = () => {
  const g = THUMB_D;
  const {band, casing, qS, qW, edgeIn, stubEnd, glow, him} = g;
  const pts = `${f(qS.x)},${f(qS.y)} ${f(qW.x)},${f(qW.y)} ${f(stubEnd.x)},${f(stubEnd.y)}`;
  // his saffron rim (lit from the wall side), on the upper body only: a filtered copy under the plain rig, clipped
  const hipY = him.y - 150 * him.scale;
  const guesser = (filter?: string) => (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter}}>
      <ThumbGuesser x={him.x} y={him.y} scale={him.scale} pose={SMUG_SIDEWAYS} outline={SPEC.guesserOutline} face={1.5} />
    </svg>
  );
  const items: RoomItem[] = [
    {
      key: 'guesser',
      x: THUMB_D_PTS.H.x,
      z: THUMB_D_PTS.H.z,
      w: 0.3,
      node: (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `polygon(-2000px -2000px, 4000px -2000px, 4000px ${f(hipY)}px, -2000px ${f(hipY)}px)`}}>{guesser(rimFlash(1, him.scale * 1.2))}</div>
          {guesser()}
        </>
      ),
    },
  ];
  const backdrop = (
    <>
      <GapMarker tilt={g.tilt} t={1} view={g.view} patchOpacity={0.8} outline />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* the lit patch of bare wall round the one spot the sensor lights */}
        <ellipse cx={f(glow.cx)} cy={f(glow.cy)} rx={f(glow.rx)} ry={f(glow.ry)} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="10 8" />
        {/* the route: sensor -> wall spot -> into the opening behind the far end (the partition paints over the run-on) */}
        <polyline points={pts} fill="none" stroke={C.saffronLight} strokeWidth={band * 2.4} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
        <polyline points={pts} fill="none" stroke={INK} strokeWidth={band + casing * 2} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke={LIGHT} strokeWidth={band} strokeLinejoin="round" strokeLinecap="round" />
        <HitSpark p={qW} r={SPEC.wallSparkR} outline={casing} dir={-Math.PI / 2} />
        <circle cx={f(qW.x)} cy={f(qW.y)} r={SPEC.wallSparkR * 0.24} fill={C.cream} />
      </svg>
    </>
  );
  const scr = {w: g.sensor.w * 0.72, h: g.sensor.w * 0.64 * 0.66};
  const t = SPEC.title;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <RoomSet tilt={g.tilt} view={g.view} items={items} backdrop={backdrop} plant={false} door={false} extendLeft={4} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {/* arrival on his wall-side chest (the leg itself is hidden by the partition and his body) */}
        <HitSpark p={g.qSpark} r={SPEC.hitSparkR} outline={casing} dir={-Math.PI / 2} />
        <circle cx={f(g.qSpark.x)} cy={f(g.qSpark.y)} r={SPEC.hitSparkR * 0.24} fill={C.cream} />
        <Tripod x={g.gripX} top={g.gripBottom - 4} floor={g.floorY} spread={86} />
        <BigSensor x={g.sensor.x} y={g.sensor.y} w={g.sensor.w} outline={OUTLINE}>
          <Glass w={scr.w} h={scr.h} />
        </BigSensor>
        <g style={{fontFamily: F.display, fontWeight: 700, fontSize: t.size, letterSpacing: -t.size * 0.01}}>
          <text x={t.x} y={t.y} fill={INK}>
            SEES
          </text>
          <text x={t.x} y={t.y + t.size * 0.86} fill={C.coral}>
            ME?
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
