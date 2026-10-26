// Draws a posed cockroach (rig/roach.ts) through a camera in the Weird Crew finish: one ink contour per part
// (lib/ink.tsx), gradient fills from the fixed upper-left key light (lib/shade.tsx), glossy chitin highlights.
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, toW, dirW, sub, add, mul, dot, norm, Frame} from '../lib/v3';
import {ellContour, surfRuns, ringX, ringY, closedPath, openPath, centroid, extent, EllW, camSphere, fmt} from '../lib/g3';
import {Inked, Deco, InkLine, INK} from '../lib/ink';
import {Blob, Capsule, Gloss, SoftShadow, LIGHT} from '../lib/shade';
import {lit, shade, mix} from '../lib/color';
import {BODY, LegPose, RoachPose, PRONOTUM, PLATES, TERGITE_U} from './roach';
import {LoftDef, loftSilhouette, loftRuns, sectionTop, marginLine} from '../lib/loft';

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

const Leg: React.FC<{id: string; p: LegPose; cam: Cam; inkW: number; haze: (c: string) => string}> = ({id, p, cam, inkW, haze}) => {
  const L = p.def;
  const s = (q: V3) => scaleAt(cam, q);
  const c = proj(cam, p.coxa), k = proj(cam, p.knee), a = proj(cam, p.ankle), f = proj(cam, p.foot);
  const V = (q: V2) => ({x: q[0], y: q[1]});
  const rF = L.rFem * s(p.coxa), rK = L.rFem * 0.78 * s(p.knee), rT = L.rTib * 0.8 * s(p.knee), rA = L.rTib * 0.55 * s(p.ankle);
  const rTa = 0.95 * s(p.ankle), rFo = 0.55 * s(p.foot);
  // spines along the tibia, on its outer/lower edge
  const tib = sub(p.ankle, p.knee);
  const outw = norm(add(sub(p.knee, p.coxa), [0, -6, 0]));
  const spines: [V2, V2][] = [];
  const nSp = L.front ? 4 : 5;
  for (let i = 1; i <= nSp; i++) {
    const t = i / (nSp + 0.6);
    const base = add(p.knee, mul(tib, t));
    const dir = norm(add(mul(norm(tib), 0.55), mul(outw, 0.8)));
    const tip = add(base, mul(dir, L.front ? 3.6 + 0.6 * i : 2.8));
    spines.push([proj(cam, base), proj(cam, tip)]);
  }
  const col = haze(CHITIN.leg);
  return (
    <Inked w={inkW} id={id}>
      <Capsule id={`${id}-fe`} a={V(c)} b={V(k)} ra={rF} rb={rK} color={col} spec={0.35} />
      <Capsule id={`${id}-ti`} a={V(k)} b={V(a)} ra={rT} rb={rA} color={haze(CHITIN.legDeep)} spec={0.25} />
      <Capsule id={`${id}-ta`} a={V(a)} b={V(f)} ra={rTa} rb={rFo} color={haze(CHITIN.legDeep)} />
      <Deco>
        {spines.map(([b, t], i) => (
          <path key={i} d={`M${fmt(b[0])} ${fmt(b[1])} L${fmt(t[0])} ${fmt(t[1])}`} stroke={haze(CHITIN.spine)} strokeWidth={Math.max(1.2, rA * (L.front ? 0.8 : 0.6))} strokeLinecap="round" />
        ))}
      </Deco>
    </Inked>
  );
};

const Antenna: React.FC<{id: string; pts: V3[]; cam: Cam; from: number; to: number; haze: (c: string) => string}> = ({id, pts, cam, from, to, haze}) => {
  if (to - from < 1) return null;
  const sp = pts.slice(from, to + 1).map((q) => proj(cam, q));
  const w0 = 1.45 * scaleAt(cam, pts[from]), w1 = 0.6 * scaleAt(cam, pts[to]);
  const segs = [];
  for (let i = 0; i < sp.length - 1; i++) {
    const t = i / Math.max(1, sp.length - 1);
    const w = w0 + (w1 - w0) * t;
    segs.push(<path key={i} d={`M${fmt(sp[i][0])} ${fmt(sp[i][1])} L${fmt(sp[i + 1][0])} ${fmt(sp[i + 1][1])}`} stroke={INK} strokeWidth={w + 2.2} strokeLinecap="round" />);
  }
  const fill = [];
  for (let i = 0; i < sp.length - 1; i++) {
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
  const legsFar = pose.legs.filter((p) => !near(p));
  const legsNear = pose.legs.filter((p) => near(p));
  // antenna split: segments under the pronotum hood (body x < 33) draw before the pronotum
  const split = (pts: V3[]) => {
    let i = 0;
    while (i < pts.length - 1 && dot(sub(pts[i], fr.o), fr.x) < 33.5) i++;
    return i;
  };
  const sL = split(pose.antL), sR = split(pose.antR);
  // depth order for the two antennae and the near/far legs
  const tergiteRuns = TERGITE_U.flatMap((u) => loftRuns(fr, PLATES, cam, sectionTop(u, 48), 0.03));
  const plateRims = ([1, -1] as const).flatMap((sd) => loftRuns(fr, PLATES, cam, marginLine(sd, 0.02, 0.98, 60), 0.0));
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
      {legsFar.map((p) => (
        <Leg key={p.def.name} id={`${o.id}-${p.def.name}`} p={p} cam={cam} inkW={inkW * 0.8} haze={(c) => haze(shade(c, 0.18))} />
      ))}
      <Antenna id={`${o.id}-aL0`} pts={pose.antL} cam={cam} from={0} to={sL} haze={haze} />
      <Antenna id={`${o.id}-aR0`} pts={pose.antR} cam={cam} from={0} to={sR} haze={haze} />
      {pose.cerci.map(([a, b], i) => {
        const pa = proj(cam, a), pb = proj(cam, b);
        return (
          <Inked key={i} w={inkW * 0.7}>
            <Capsule id={`${o.id}-ce${i}`} a={{x: pa[0], y: pa[1]}} b={{x: pb[0], y: pb[1]}} ra={1.3 * scaleAt(cam, a)} rb={0.5 * scaleAt(cam, b)} color={haze(CHITIN.legDeep)} />
          </Inked>
        );
      })}
      <Inked w={inkW} id={`${o.id}-bd`}>
        <Shell id={`${o.id}-body`} f={fr} d={PLATES} cam={cam} color={haze(CHITIN.body)} k={1.1} gloss={0.5}>
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
      <Antenna id={`${o.id}-aL1`} pts={pose.antL} cam={cam} from={sL} to={pose.antL.length - 1} haze={haze} />
      <Antenna id={`${o.id}-aR1`} pts={pose.antR} cam={cam} from={sR} to={pose.antR.length - 1} haze={haze} />
      {o.gear}
      {legsNear.map((p) => (
        <Leg key={p.def.name} id={`${o.id}-${p.def.name}`} p={p} cam={cam} inkW={inkW * 0.85} haze={haze} />
      ))}
    </g>
  );
};
