// Draws a posed cockroach (rig/roach.ts) through a camera in the Weird Crew finish: one ink contour per part
// (lib/ink.tsx), gradient fills from the fixed upper-left key light (lib/shade.tsx), glossy chitin highlights.
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, toW, toL, dirW, sub, add, mul, dot, norm, len, lerp3, Frame} from '../lib/v3';
import {ellContour, surfRuns, ringX, ringY, closedPath, openPath, centroid, extent, EllW, camSphere, fmt} from '../lib/g3';
import {Inked, Deco, InkLine, INK} from '../lib/ink';
import {Blob, Capsule, Gloss, SoftShadow, LIGHT} from '../lib/shade';
import {lit, shade, mix} from '../lib/color';
import {BODY, LegPose, RoachPose, PRONOTUM, PLATES, TERGITE_U} from './roach';
import {LoftDef, loftSilhouette, loftRuns, sectionTop, marginLine} from '../lib/loft';
import {clamp, lerp} from '../lib/ease';

export const CHITIN = {
  body: '#4B2A1E',
  pronotum: '#4F2B1F',
  head: '#3E2219',
  leg: '#5C3424',
  legDeep: '#3D2118',
  spine: '#2A1611',
  eye: '#1A0F0C',
  ant: '#4A2A1F',
  tergite: '#2B1610',
  plate: '#6A3B2A',
};

export type RoachDrawOpts = {
  id: string;
  /** ink contour half-width (px); default scales with the insect's size on screen */
  ink?: number;
  /** layers drawn on top of the body (gear), given the pose; returned element is placed above the pronotum */
  gear?: React.ReactNode;
  /** draw the ground contact shadow */
  shadow?: boolean;
  shadowColor?: string;
  shadowAlpha?: number;
  /** force all legs behind the body (top views) */
  legsBehind?: boolean;
  /** dim (for depth haze), 0..1 mix toward haze colour */
  haze?: number;
  hazeColor?: string;
};

const ellOf = (f: Frame, e: {c: V3; r: V3}): EllW => ({f, c: e.c, r: e.r});

const Ellipsoid: React.FC<{id: string; e: EllW; cam: Cam; color: string; k?: number; gloss?: number; children?: React.ReactNode}> = ({id, e, cam, color, k = 1, gloss = 0.55, children}) => {
  const pts = ellContour(e, cam);
  if (pts.length < 3) return null;
  const d = closedPath(pts);
  const c = centroid(pts);
  const R = extent(pts, c);
  const gl: V2 = [c[0] + LIGHT.x * R * 0.42, c[1] + LIGHT.y * R * 0.5];
  return (
    <>
      <Blob id={id} d={d} c={{x: c[0], y: c[1]}} r={R * 1.02} color={color} k={k} focal={0.5} />
      {children}
      {gloss > 0 && (
        <Deco>
          <clipPath id={`${id}-clip`}>
            <path d={d} />
          </clipPath>
          <g clipPath={`url(#${id}-clip)`}>
            <Gloss id={`${id}-gl`} c={{x: gl[0], y: gl[1]}} rx={R * 0.16} ry={R * 0.055} rotate={-30} opacity={gloss} />
          </g>
        </Deco>
      )}
    </>
  );
};

const Shell: React.FC<{id: string; f: Frame; d: LoftDef; cam: Cam; color: string; k?: number; gloss?: number; children?: React.ReactNode}> = ({id, f, d, cam, color, k = 1, gloss = 0.55, children}) => {
  const pts = loftSilhouette(f, d, cam);
  if (pts.length < 3) return null;
  const dd = closedPath(pts);
  const c = centroid(pts);
  const R = extent(pts, c);
  const gl: V2 = [c[0] + LIGHT.x * R * 0.36, c[1] + LIGHT.y * R * 0.42];
  return (
    <>
      <Blob id={id} d={dd} c={{x: c[0], y: c[1]}} r={R * 1.02} color={color} k={k} focal={0.5} />
      {children}
      {gloss > 0 && (
        <Deco>
          <clipPath id={`${id}-clip`}>
            <path d={dd} />
          </clipPath>
          <g clipPath={`url(#${id}-clip)`}>
            <Gloss id={`${id}-gl`} c={{x: gl[0], y: gl[1]}} rx={R * 0.17} ry={R * 0.05} rotate={-28} opacity={gloss} />
          </g>
        </Deco>
      )}
    </>
  );
};

const legOutward = (fr: Frame, p: LegPose): V3 => {
  const side = p.def.side;
  const fw = p.def.front ? 0.6 : p.def.coxa[0] < 0 ? -0.6 : 0;
  return norm(add(mul(fr.z, side), mul(fr.x, fw)));
};

/** the body's plan footprint half-width at body x (the wider of the plates and the pronotum) */
const loftW = (d: LoftDef, x: number) => {
  const u = (x - d.x0) / (d.x1 - d.x0);
  return u < 0 || u > 1 ? 0 : d.w(u);
};
const inFoot = (fr: Frame, p: V3, m = 0.4) => {
  const q = toL(fr, p);
  return Math.abs(q[2]) < Math.max(loftW(PLATES, q[0]), loftW(PRONOTUM, q[0])) + m;
};
/** whether a body-local point lies inside a loft's solid (its superelliptic sections, as lib/loft.ts loftLocal) */
const inLoft = (d: LoftDef, q: V3) => {
  const u = (q[0] - d.x0) / (d.x1 - d.x0);
  const w = u < 0 || u > 1 ? 0 : d.w(u);
  if (w < 1e-3) return false;
  const dy = q[1] - d.yc(u), h = Math.max(1e-3, dy >= 0 ? d.ht(u) : d.hb(u));
  return Math.pow(Math.abs(q[2]) / w, d.n ?? 2.2) + (dy / h) * (dy / h) < 1;
};
/** whether a loft's solid lies on the sight line from body-local point q to the body-local eye e (sampled where the line
 *  crosses the loft's length) */
const behindLoft = (d: LoftDef, q: V3, e: V3, n = 32) => {
  const dx = e[0] - q[0];
  let lo = 0, hi = 1;
  if (Math.abs(dx) > 1e-6) {
    const a = (d.x0 - q[0]) / dx, b = (d.x1 - q[0]) / dx;
    (lo = clamp(Math.min(a, b))), (hi = clamp(Math.max(a, b)));
  } else if (q[0] < d.x0 || q[0] > d.x1) return false;
  for (let k = 0; k < n && hi > lo; k++) if (inLoft(d, lerp3(q, e, lerp(lo, hi, (k + 0.5) / n)))) return true;
  return false;
};
/** whether the shell (pronotum or plates) hides world point p from the eye: for parts that stand off the body, the
 *  antennae and a stimulation wire's free span from the backpack down to the shell (rig/Gear.tsx) */
export const shellHides = (fr: Frame, p: V3, eye: V3) => {
  const q = toL(fr, p), e = toL(fr, eye);
  return behindLoft(PRONOTUM, q, e) || behindLoft(PLATES, q, e);
};

export type LegFrom = {seg: number; t: number};
/** where along the leg chain (0 femur, 1 tibia, 2 tarsus; fraction t) it leaves the body's footprint for good: a near
 *  leg is drawn behind the body, then redrawn from this point on, so it emerges from under the shell's edge instead of
 *  growing out of its side wall (after the S04 builder's RoachSplit) */
export const exitOf = (fr: Frame, p: LegPose): LegFrom | null => {
  const chain = [p.coxa, p.knee, p.ankle, p.foot];
  const N = 24;
  let last: {seg: number; i: number} | null = null;
  for (let sg = 0; sg < 3; sg++) for (let i = 0; i <= N; i++) if (inFoot(fr, lerp3(chain[sg], chain[sg + 1], i / N))) last = {seg: sg, i};
  if (!last) return {seg: 0, t: 0};
  if (last.seg === 2 && last.i >= N) return null;
  let seg = last.seg, lo = last.i / N, hi = (last.i + 1) / N;
  if (last.i >= N) (seg += 1), (lo = 0), (hi = 1 / N);
  for (let k = 0; k < 14; k++) {
    const m = (lo + hi) / 2;
    if (inFoot(fr, lerp3(chain[seg], chain[seg + 1], m))) lo = m;
    else hi = m;
  }
  const segLen = len(sub(chain[seg + 1], chain[seg]));
  return {seg, t: clamp(hi - 0.9 / Math.max(1, segLen))};
};

/** far: a leg on the body's far side from the camera, its spines drawn as fine bristles in the tibia's colour (dark, finger
 *  thick spines on a far front leg rising past the shell's edge read as a claw gripping it) */
const Leg: React.FC<{id: string; p: LegPose; cam: Cam; inkW: number; haze: (c: string) => string; from?: LegFrom; far?: boolean}> = ({id, p, cam, inkW, haze, from = {seg: 0, t: 0}, far = false}) => {
  const L = p.def;
  const s = (q: V3) => scaleAt(cam, q);
  const V = (q: V2) => ({x: q[0], y: q[1]});
  const rF0 = L.rFem, rK0 = L.rFem * 0.78, rT0 = L.rTib * 0.8, rA0 = L.rTib * 0.55, rTa0 = 0.95, rFo0 = 0.55;
  // spines along the tibia, on its outer/lower edge
  const tib = sub(p.ankle, p.knee);
  const outw = norm(add(sub(p.knee, p.coxa), [0, -6, 0]));
  const spines: [V2, V2][] = [];
  const nSp = L.front ? 4 : 5;
  for (let i = 1; i <= nSp; i++) {
    const t = i / (nSp + 0.6);
    if (from.seg > 1 || (from.seg === 1 && t < from.t + 0.04)) continue;
    const base = add(p.knee, mul(tib, t));
    const dir = norm(add(mul(norm(tib), 0.55), mul(outw, 0.8)));
    const tip = add(base, mul(dir, L.front ? 3.6 + 0.6 * i : 2.8));
    spines.push([proj(cam, base), proj(cam, tip)]);
  }
  const parts: React.ReactNode[] = [];
  const cap = (k: string, a: V3, b: V3, ra: number, rb: number, color: string, spec: number) =>
    parts.push(<Capsule key={k} id={`${id}-${k}`} a={V(proj(cam, a))} b={V(proj(cam, b))} ra={ra * s(a)} rb={rb * s(b)} color={color} spec={spec} />);
  if (from.seg === 0) cap('fe', lerp3(p.coxa, p.knee, from.t), p.knee, lerp(rF0, rK0, from.t), rK0, haze(CHITIN.leg), 0.35);
  if (from.seg <= 1) cap('ti', from.seg === 1 ? lerp3(p.knee, p.ankle, from.t) : p.knee, p.ankle, from.seg === 1 ? lerp(rT0, rA0, from.t) : rT0, rA0, haze(CHITIN.legDeep), 0.25);
  cap('ta', from.seg === 2 ? lerp3(p.ankle, p.foot, from.t) : p.ankle, p.foot, from.seg === 2 ? lerp(rTa0, rFo0, from.t) : rTa0, rFo0, haze(CHITIN.legDeep), 0);
  const rA = rA0 * s(p.ankle);
  return (
    <Inked w={inkW} id={id}>
      {parts}
      <Deco>
        {spines.map(([b, t], i) => (
          <path key={i} d={`M${fmt(b[0])} ${fmt(b[1])} L${fmt(t[0])} ${fmt(t[1])}`} stroke={haze(far ? CHITIN.legDeep : CHITIN.spine)} strokeWidth={Math.max(1, rA * (L.front ? 0.8 : 0.6) * (far ? 0.5 : 1))} strokeLinecap="round" />
        ))}
      </Deco>
    </Inked>
  );
};

/** an antenna's segments where `on[i]` (segment i joins pts[i] and pts[i + 1]); the taper and banding run over the whole
 *  chain, so the two layers it is split into (behind / in front of the pronotum) join without a step */
const Antenna: React.FC<{id: string; pts: V3[]; cam: Cam; on: boolean[]; haze: (c: string) => string}> = ({id, pts, cam, on, haze}) => {
  if (pts.length < 2 || !on.some((x) => x)) return null;
  const sp = pts.map((q) => proj(cam, q));
  const w0 = 1.45 * scaleAt(cam, pts[0]), w1 = 0.6 * scaleAt(cam, pts[pts.length - 1]);
  const segs = [];
  for (let i = 0; i < sp.length - 1; i++) {
    if (!on[i]) continue;
    const t = i / Math.max(1, sp.length - 1);
    const w = w0 + (w1 - w0) * t;
    segs.push(<path key={i} d={`M${fmt(sp[i][0])} ${fmt(sp[i][1])} L${fmt(sp[i + 1][0])} ${fmt(sp[i + 1][1])}`} stroke={INK} strokeWidth={w + 2.2} strokeLinecap="round" />);
  }
  const fill = [];
  for (let i = 0; i < sp.length - 1; i++) {
    if (!on[i]) continue;
    const t = i / Math.max(1, sp.length - 1);
    const w = w0 + (w1 - w0) * t;
    fill.push(<path key={i} d={`M${fmt(sp[i][0])} ${fmt(sp[i][1])} L${fmt(sp[i + 1][0])} ${fmt(sp[i + 1][1])}`} stroke={haze(i % 2 ? CHITIN.ant : mix(CHITIN.ant, '#7A4A36', 0.35))} strokeWidth={w} strokeLinecap="round" />);
  }
  return (
    <g id={id}>
      {segs}
      {fill}
    </g>
  );
};

export const Roach: React.FC<{pose: RoachPose; cam: Cam; o: RoachDrawOpts}> = ({pose, cam, o}) => {
  const fr = pose.frame;
  const sc = scaleAt(cam, fr.o);
  const inkW = o.ink ?? Math.max(2.4, Math.min(8, sc * 0.42));
  const hz = o.haze ?? 0;
  const haze = (c: string) => (hz > 0 ? mix(c, o.hazeColor ?? '#9FB3BF', hz) : c);
  const breathe = 1 + 0.012 * (pose.breath - 0.5);
  const bodyE = ellOf(fr, {c: BODY.body.c, r: [BODY.body.r[0], BODY.body.r[1] * breathe, BODY.body.r[2] * (1 + 0.006 * (pose.breath - 0.5))]});
  const proE = ellOf(fr, BODY.pronotum);
  const headE = ellOf(fr, BODY.head);
  // which legs are on the camera's side
  const camAbove = dot(norm(sub(cam.eye, fr.o)), fr.y) > 0.76;
  const near = (p: LegPose) => !o.legsBehind && !camAbove && dot(sub(cam.eye, p.coxa), legOutward(fr, p)) > 0;
  const legsNear = pose.legs.filter((p) => near(p));
  // the far side proper (as `near`, but also when every leg is drawn behind the body; not from above, where neither side is)
  const farSide = (p: LegPose) => !camAbove && dot(sub(cam.eye, p.coxa), legOutward(fr, p)) <= 0;
  // antenna layers: a segment draws before the body, head and pronotum where the shell lies between it and the camera
  // (under the hood, body x < 33.5, or seen past the shield from behind, so only what clears its silhouette shows), after
  // them otherwise (a far antenna seen from behind is not painted onto the shell)
  const hidden = (pts: V3[]) =>
    pts.slice(1).map((b, i) => {
      const m = lerp3(pts[i], b, 0.5);
      return dot(sub(m, fr.o), fr.x) < 33.5 || shellHides(fr, m, cam.eye);
    });
  const hL = hidden(pose.antL), hR = hidden(pose.antR);
  // depth order for the two antennae and the near/far legs
  const bth = pose.breath - 0.5;
  const plates: LoftDef = {...PLATES, ht: (u) => PLATES.ht(u) * (1 + 0.05 * bth * (1 - u)), w: (u) => PLATES.w(u) * (1 + 0.016 * bth * (1 - u))};
  const tergiteRuns = TERGITE_U.flatMap((u) => loftRuns(fr, plates, cam, sectionTop(u, 48), 0.03));
  const plateRims = ([1, -1] as const).flatMap((sd) => loftRuns(fr, plates, cam, marginLine(sd, 0.02, 0.98, 60), 0.0));
  const rimRuns = ([1, -1] as const).flatMap((sd) => loftRuns(fr, PRONOTUM, cam, marginLine(sd, 0.0, 1.0, 60), 0.0));
  const scoop = loftRuns(fr, PRONOTUM, cam, Array.from({length: 41}, (_, i) => [0.72 + 0.16 * Math.sin((i / 40) * Math.PI), 0.25 * Math.PI + (i / 40) * 0.5 * Math.PI] as [number, number]), 0.02);
  const eyes = ([-1, 1] as const).map((sd) => {
    const c3: V3 = toW(fr, [31.8, 9.6, 6.9 * sd]);
    const vis = dot(sub(cam.eye, c3), dirW(fr, norm([0.35, 0.25, sd]))) > 0;
    return {c: proj(cam, c3), r: 1.9 * scaleAt(cam, c3), vis};
  });
  const shadowC = proj(cam, toW(fr, [-4, 0, 0]));
  const sx = proj(cam, toW(fr, [40, 0, 0])), sz = proj(cam, toW(fr, [-4, 0, 30]));
  const rx = Math.hypot(sx[0] - shadowC[0], sx[1] - shadowC[1]), ry = Math.hypot(sz[0] - shadowC[0], sz[1] - shadowC[1]);
  const shAng = (Math.atan2(sx[1] - shadowC[1], sx[0] - shadowC[0]) * 180) / Math.PI;
  const footShadows = pose.legs.filter((p) => !p.up).map((p) => ({c: proj(cam, p.foot), r: 2.6 * scaleAt(cam, p.foot)}));
  return (
    <g>
      {o.shadow !== false && (
        <g>
          <SoftShadow id={`${o.id}-sh`} c={{x: shadowC[0], y: shadowC[1]}} rx={rx * 1.12} ry={ry * 1.05} rotate={shAng} alpha={o.shadowAlpha ?? 0.42} color={o.shadowColor ?? '#1C1410'} core={0.4} />
          {footShadows.map((q, i) => (
            <ellipse key={i} cx={fmt(q.c[0])} cy={fmt(q.c[1])} rx={fmt(q.r * 1.3)} ry={fmt(q.r * 0.55)} fill={o.shadowColor ?? '#1C1410'} opacity={0.35} />
          ))}
        </g>
      )}
      {pose.legs.map((p) => (
        <Leg key={p.def.name} id={`${o.id}-${p.def.name}`} p={p} cam={cam} inkW={inkW * (near(p) ? 0.85 : 0.8)} haze={near(p) ? haze : (c) => haze(shade(c, 0.18))} far={farSide(p)} />
      ))}
      <Antenna id={`${o.id}-aL0`} pts={pose.antL} cam={cam} on={hL} haze={haze} />
      <Antenna id={`${o.id}-aR0`} pts={pose.antR} cam={cam} on={hR} haze={haze} />
      {pose.cerci.map(([a, b], i) => {
        const pa = proj(cam, a), pb = proj(cam, b);
        return (
          <Inked key={i} w={inkW * 0.7}>
            <Capsule id={`${o.id}-ce${i}`} a={{x: pa[0], y: pa[1]}} b={{x: pb[0], y: pb[1]}} ra={1.3 * scaleAt(cam, a)} rb={0.5 * scaleAt(cam, b)} color={haze(CHITIN.legDeep)} />
          </Inked>
        );
      })}
      <Inked w={inkW} id={`${o.id}-bd`}>
        <Shell id={`${o.id}-body`} f={fr} d={plates} cam={cam} color={haze(CHITIN.body)} k={1.1} gloss={0.5}>
          <Deco>
            {tergiteRuns.map((r, i) => (
              <g key={i}>
                <path d={openPath(r)} fill="none" stroke={haze(lit(CHITIN.plate, 0.12))} strokeWidth={Math.max(1, inkW * 0.55)} strokeLinecap="round" transform="translate(-1.2 1.2)" opacity={0.7} />
                <path d={openPath(r)} fill="none" stroke={haze(CHITIN.tergite)} strokeWidth={Math.max(1, inkW * 0.5)} strokeLinecap="round" />
              </g>
            ))}
            {plateRims.map((r, i) => (
              <path key={`m${i}`} d={openPath(r)} fill="none" stroke={haze(lit(CHITIN.plate, 0.2))} strokeWidth={Math.max(1, inkW * 0.55)} strokeLinecap="round" opacity={0.65} />
            ))}
          </Deco>
        </Shell>
      </Inked>
      <Inked w={inkW} id={`${o.id}-hd`}>
        <Ellipsoid id={`${o.id}-head`} e={headE} cam={cam} color={haze(CHITIN.head)} gloss={0.3} />
        {/* mouthparts: a paler clypeus plate and two segmented palps, read in front views */}
        {(() => {
          // mouthparts: a paler clypeus plate (clipped to the head) and two segmented palps, fading in as the view
          // comes round to the front (no pop when a camera crosses the head's plane)
          const hp = toW(fr, [34, 6, 0]);
          const vis = clamp((dot(norm(sub(cam.eye, hp)), fr.x) - 0.15) / 0.3);
          if (vis <= 0) return null;
          const cl = toW(fr, [35.2, 6.6, 0]);
          const c = proj(cam, cl);
          const r = scaleAt(cam, cl);
          const headPts = ellContour(headE, cam);
          const palps = ([-1, 1] as const).map((sd) => [toW(fr, [33.8, 4.6, 2.6 * sd]), toW(fr, [36.6, 2.6, 3.8 * sd]), toW(fr, [37.6, 0.9, 5.0 * sd])]);
          return (
            <g opacity={vis}>
              <Deco>
                <clipPath id={`${o.id}-hdc`}>
                  <path d={closedPath(headPts)} />
                </clipPath>
                <ellipse cx={fmt(c[0])} cy={fmt(c[1])} rx={fmt(r * 3.2)} ry={fmt(r * 1.9)} fill={haze(lit(CHITIN.head, 0.22))} opacity={0.9} clipPath={`url(#${o.id}-hdc)`} />
              </Deco>
              {palps.map((pp, i) => (
                <g key={i}>
                  {[0, 1].map((k) => {
                    const a = proj(cam, pp[k]), b = proj(cam, pp[k + 1]);
                    return <Capsule key={k} id={`${o.id}-pa${i}${k}`} a={{x: a[0], y: a[1]}} b={{x: b[0], y: b[1]}} ra={0.75 * scaleAt(cam, pp[k])} rb={0.55 * scaleAt(cam, pp[k + 1])} color={haze(CHITIN.legDeep)} />;
                  })}
                </g>
              ))}
            </g>
          );
        })()}
        <Deco>
          {eyes.filter((e) => e.vis).map((e, i) => (
            <g key={i}>
              <ellipse cx={fmt(e.c[0])} cy={fmt(e.c[1])} rx={fmt(e.r)} ry={fmt(e.r * 1.25)} fill={CHITIN.eye} />
              <ellipse cx={fmt(e.c[0] - e.r * 0.3)} cy={fmt(e.c[1] - e.r * 0.4)} rx={fmt(e.r * 0.3)} ry={fmt(e.r * 0.22)} fill="#FFFFFF" opacity={0.7} />
            </g>
          ))}
        </Deco>
      </Inked>
      <Inked w={inkW} id={`${o.id}-pr`}>
        <Shell id={`${o.id}-pro`} f={fr} d={PRONOTUM} cam={cam} color={haze(CHITIN.pronotum)} k={1.1} gloss={0.65}>
          <Deco>
            {rimRuns.map((r, i) => (
              <path key={i} d={openPath(r)} fill="none" stroke={haze(lit(CHITIN.plate, 0.18))} strokeWidth={Math.max(1, inkW * 0.6)} strokeLinecap="round" opacity={0.75} />
            ))}
            {scoop.map((r, i) => (
              <path key={i} d={openPath(r)} fill="none" stroke={haze(CHITIN.tergite)} strokeWidth={Math.max(1, inkW * 0.45)} strokeLinecap="round" opacity={0.6} />
            ))}
          </Deco>
        </Shell>
      </Inked>
      <Antenna id={`${o.id}-aL1`} pts={pose.antL} cam={cam} on={hL.map((h) => !h)} haze={haze} />
      <Antenna id={`${o.id}-aR1`} pts={pose.antR} cam={cam} on={hR.map((h) => !h)} haze={haze} />
      {o.gear}
      {legsNear.map((p) => {
        const e = exitOf(fr, p);
        return e ? <Leg key={p.def.name} id={`${o.id}-n${p.def.name}`} p={p} cam={cam} inkW={inkW * 0.85} haze={haze} from={e} /> : null;
      })}
    </g>
  );
};
