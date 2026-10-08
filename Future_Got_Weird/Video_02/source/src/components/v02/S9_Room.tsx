import React from 'react';
import {C, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {DEFAULT_VIEW, LAYOUT, PTS, type Box, type Layout, type PlanPt, type ViewConfig, hiddenByBox, project, projectWith, rigAt, rigScale, viewAt} from '../../lib/room';
import type {Arm} from '../Character';
import type {Foot} from './Cast2';
import {HandheldSensor, SENSOR, sensorPoint, type HandheldSensorProps} from './HandheldSensor';

/**
 * S9 room helpers.
 *
 *  - S9SensorStand / standGeometry: the kit HandheldSensor on its small tripod (the S1 stand, copied so S9 matches the
 *    opening): the sensor's working face sits exactly on the projected layout sensor point S at any tilt.
 *  - movedLayout(d): the layout with the partition pushed d metres back along z (toward the relay wall). The physics of
 *    S9.3 (paths stopping at the partition once the gap is closed) and the drawn partition both use it.
 *  - planWalk / walkDistance / walkFrames / walkContacts / walkAt: a frontal Character2 rig walking between two plan points (mostly in depth, toward
 *    or away from the camera) with its feet planted on plan footprints projected through the room view, so the far foot
 *    sits higher on screen and nothing slides (the room-view counterpart of the warehouse kit's whWalkAt).
 *  - behindBox: is an upright figure partly hidden behind a box (the partition) from the camera (lib/room's rule).
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ------------------------------------------------------------------ the partition, pushed back */

/** The layout with the partition moved `d` metres toward the relay wall (z0 = 0.65 - d; d = 0.65 closes the gap). */
export const movedLayout = (d: number): Layout => ({
  ...LAYOUT,
  occluder: {...LAYOUT.occluder, z0: LAYOUT.occluder.z0 - d, z1: LAYOUT.occluder.z1 - d},
});

/** The partition's box (lib/room Box) for a layout. */
export const boxOf = (layout: Layout): Box => ({
  x0: layout.occluder.x - layout.occluder.thickness / 2,
  x1: layout.occluder.x + layout.occluder.thickness / 2,
  z0: layout.occluder.z0,
  z1: layout.occluder.z1,
  h0: 0,
  h1: layout.occluder.height,
});

/** An upright figure at (x, z), half-width w, partly hidden behind `box` from the camera at this tilt (lib/room rule). */
export const behindBox = (x: number, z: number, box: Box, tilt: number, w = 0.3, height = 1.7, view: ViewConfig = DEFAULT_VIEW) => {
  for (const dx of [-w, -w / 2, 0, w / 2, w]) {
    for (const fh of [0.05, 0.5, 0.95]) {
      const q = {x: x + dx, z, h: fh * height};
      const inside = q.x >= box.x0 && q.x <= box.x1 && q.z >= box.z0 && q.z <= box.z1;
      if (!inside && hiddenByBox(q, box, tilt, view)) return true;
    }
  }
  return false;
};

/* ------------------------------------------------------------------ the sensor on its tripod (from S1) */

/** Sensor size relative to the rig scale (the kit's hand-held proportion). */
export const STAND_SENSOR_K = 0.6;

/** Where everything of the stand lands at a tilt (world px). */
export const standGeometry = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  const k = STAND_SENSOR_K * rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt, {view}).scale;
  const S = project(PTS.S, tilt, view);
  const ff = sensorPoint('farFace', k);
  const mount = {x: S.x - ff.x, y: S.y - ff.y};
  const at = (lx: number, ly: number) => ({x: mount.x + lx * k, y: mount.y + ly * k});
  const b = SENSOR.box;
  const box = {x0: mount.x + b.x0 * k, y0: mount.y + b.y0 * k + SENSOR.depth.dy * k, x1: mount.x + (b.x1 + SENSOR.depth.dx) * k, y1: mount.y + b.y1 * k};
  const sc = SENSOR.screen;
  const screen = {x: mount.x + sc.x0 * k, y: mount.y + sc.y0 * k, w: sc.w * k, h: sc.h * k};
  const plateY = mount.y + 22 * k;
  const hPlate = s.height > 1e-6 ? PTS.S.h! - (plateY - S.y) / (s.ppm * s.height) : 0;
  return {k, S: {x: S.x, y: S.y}, mount, at, box, screen, plateY, hPlate, ppm: s.ppm};
};

export type S9SensorStandProps = {
  tilt: number;
  view?: ViewConfig;
  sensor?: Omit<HandheldSensorProps, 'scale' | 'skin' | 'rotate' | 'mirrored'>;
};

/** The tripod stand plus the sensor on it (one world-px <svg>). */
export const S9SensorStand: React.FC<S9SensorStandProps> = ({tilt, view = DEFAULT_VIEW, sensor}) => {
  const geo = standGeometry(tilt, view);
  const {k, mount} = geo;
  const P = (x: number, z: number, h = 0) => project({x, z, h}, tilt, view);
  const Sx = PTS.S.x;
  const Sz = PTS.S.z;
  const hubH = Math.max(0.05, geo.hPlate * 0.58);
  const hubP = P(Sx, Sz, hubH);
  const hub = {x: mount.x + (hubP.x - P(Sx, Sz, geo.hPlate).x), y: hubP.y};
  const feet = [P(Sx - 0.16, Sz + 0.1), P(Sx + 0.17, Sz + 0.08), P(Sx + 0.01, Sz - 0.17)];
  const leg = (f: {x: number; y: number}, key: string) => (
    <g key={key}>
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.ink} strokeWidth={9 + OUTLINE} strokeLinecap="round" />
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.inkSoft} strokeWidth={9 - OUTLINE / 2} strokeLinecap="round" />
      <ellipse cx={f2(f.x)} cy={f2(f.y)} rx={9} ry={5} fill={C.ink} />
    </g>
  );
  const shadow = [P(Sx - 0.24, Sz - 0.2), P(Sx + 0.26, Sz - 0.2), P(Sx + 0.26, Sz + 0.16), P(Sx - 0.24, Sz + 0.16)];
  const cx = shadow.reduce((a, p) => a + p.x, 0) / 4;
  const cy = shadow.reduce((a, p) => a + p.y, 0) / 4;
  const rx = (Math.max(...shadow.map((p) => p.x)) - Math.min(...shadow.map((p) => p.x))) / 2;
  const ry = Math.max(6, (Math.max(...shadow.map((p) => p.y)) - Math.min(...shadow.map((p) => p.y))) / 2);
  const plateW = 46 * k;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={f2(cx)} cy={f2(cy)} rx={f2(rx)} ry={f2(ry)} fill={C.shadow} />
      {leg(feet[2], 'back')}
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.ink} strokeWidth={12 + OUTLINE} strokeLinecap="round" />
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.inkSoft} strokeWidth={12 - OUTLINE / 2} strokeLinecap="round" />
      {leg(feet[0], 'fl')}
      {leg(feet[1], 'fr')}
      <rect x={f2(hub.x - 13)} y={f2(hub.y - 9)} width={26} height={18} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
      <rect x={f2(mount.x - plateW / 2)} y={f2(geo.plateY - 8)} width={f2(plateW)} height={12} rx={4} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
      <g transform={`translate(${f2(mount.x)} ${f2(mount.y)})`}>
        <HandheldSensor {...sensor} scale={k} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ walking in depth with planted feet */

const WALK_DUTY = 0.58; // fraction of a cycle each foot is planted (Cast2's walk)
const HIP_X = 33; // Cast2 ankle x when standing, rig px

export type PlanWalk = {a: {x: number; z: number}; b: {x: number; z: number}; dist: number; steps: number; stepM: number; heightM: number; lift: number; profile: number};

/** Plan a walk from a to b in steps of about `stepM` metres (a whole number of them). `lift`: swing-foot lift, rig px.
 *  `profile` (opt-in, 0..1, default 0 = the shoes face the camera, for a walk mostly in depth): for a walk that crosses
 *  the screen sideways, the shoes turn 3/4 toward the way she goes (Cast2's sideways gait convention, gaitPose:
 *  turn = dir) and both knees lean a little that way, with the near-side leg drawn on top, so a foot landing ahead of
 *  the other reads as a side-on stride instead of the frontal rig's legs crossing into an X (outward knees over
 *  converging feet). Footprints and timing unchanged. */
export const planWalk = (a: {x: number; z: number}, b: {x: number; z: number}, opts: {stepM?: number; heightM?: number; lift?: number; profile?: number} = {}): PlanWalk => {
  const heightM = opts.heightM ?? 1.7;
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const base = opts.stepM ?? 0.34;
  const steps = Math.max(1, Math.round(dist / base));
  return {a, b, dist, steps, stepM: dist / steps, heightM, lift: opts.lift ?? 20, profile: opts.profile ?? 0};
};

/**
 * Frames a walk driven by walkDistance takes, start to stop: every step framesPerStep frames, except the last, which
 * takes `lastStepFrames` (opt-in, default framesPerStep, so the default is plan.steps * framesPerStep exactly). A
 * one-step walk takes lastStepFrames.
 */
export const walkFrames = (plan: PlanWalk, framesPerStep: number, lastStepFrames: number = framesPerStep) =>
  lastStepFrames === framesPerStep ? plan.steps * framesPerStep : (plan.steps - 1) * framesPerStep + lastStepFrames;

/**
 * Metres walked at frame g (first step accelerates from rest, the last decelerates into the stop). `lastStepFrames`
 * (opt-in, default framesPerStep: unchanged) stretches only the last step (its deceleration into the stop) to that many
 * frames, e.g. a slower closing step for a deadpan stroll; the full steps keep framesPerStep. walkFrames gives the length.
 */
export const walkDistance = (g: number, start: number, plan: PlanWalk, framesPerStep: number, lastStepFrames: number = framesPerStep) => {
  const accel = (u: number) => 2 * u * u - u * u * u;
  const ease = (k: number, f: number) => (plan.steps === 1 ? E.inOut(f) : k === 0 ? accel(f) : k === plan.steps - 1 ? 1 - accel(1 - f) : f);
  if (lastStepFrames === framesPerStep) {
    const t = (g - start) / framesPerStep;
    if (t <= 0) return 0;
    if (t >= plan.steps) return plan.dist;
    const k = Math.floor(t);
    return (k + ease(k, t - k)) * plan.stepM;
  }
  if (!(lastStepFrames > 0)) throw new Error(`walkDistance: lastStepFrames must be > 0 (got ${lastStepFrames})`);
  const t0 = g - start;
  if (t0 <= 0) return 0;
  const full = (plan.steps - 1) * framesPerStep; // frames of the steps before the last
  if (t0 >= full + lastStepFrames) return plan.dist;
  if (t0 < full) {
    const t = t0 / framesPerStep;
    const k = Math.min(plan.steps - 2, Math.floor(t));
    return (k + ease(k, t - k)) * plan.stepM;
  }
  const k = plan.steps - 1;
  return (k + ease(k, (t0 - full) / lastStepFrames)) * plan.stepM;
};

/** Frames at which a foot lands (footstep cues) for a walk driven by walkDistance with the same arguments (including
 *  the opt-in lastStepFrames). */
export const walkContacts = (start: number, plan: PlanWalk, framesPerStep: number, lastStepFrames: number = framesPerStep): number[] => {
  const out: number[] = [];
  let prev = [false, false];
  const end = plan.dist;
  for (let i = 0; i <= walkFrames(plan, framesPerStep, lastStepFrames) * 4 + 4; i++) {
    const f = start + i / 4;
    const c = walkDistance(f, start, plan, framesPerStep, lastStepFrames);
    const sw = [walkFoot(c, 0, plan.stepM, end).lift > 0.01, walkFoot(c, 0.5, plan.stepM, end).lift > 0.01];
    sw.forEach((v, j) => {
      if (prev[j] && !v) out.push(Math.round(f));
    });
    prev = sw;
  }
  return out;
};

/** One foot along the walk (metres from the start) and its swing (0..1 lift shape). o = 0 lead foot, 0.5 trail foot. */
const walkFoot = (c: number, o: number, step: number, end: number) => {
  const L = step * 2;
  const D = WALK_DUTY;
  if (c <= 0) return {p: 0, lift: 0};
  if (c >= end) return {p: end, lift: 0};
  const q = c / L - o + D / 2;
  const k = Math.floor(q);
  const r = q - k;
  const F = (j: number) => (j + o) * L;
  if (r < D) return {p: Math.max(0, Math.min(end, F(k))), lift: 0};
  let cs = (k + o + D / 2) * L;
  let ce = (k + 1 + o - D / 2) * L;
  let x0 = F(k);
  let x1 = F(k + 1);
  if (cs < 0) {
    cs = 0;
    x0 = 0;
  }
  if (ce > end) {
    ce = end;
    x1 = end;
  }
  const u = clamp01((c - cs) / Math.max(1e-6, ce - cs));
  const ease = (1 - Math.cos(Math.PI * u)) / 2;
  return {p: x0 + (x1 - x0) * ease, lift: Math.pow(Math.sin(Math.PI * u), 0.85) * Math.min(1, (x1 - x0) / step)};
};

export type WalkState = {
  /** rig ground point (px) and scale for <Character2 x y scale/> */
  x: number;
  y: number;
  scale: number;
  /** the body's plan point (use it for depth sorting) */
  plan: {x: number; z: number};
  /** merge into the rig's pose */
  pose: {feet: {L: Foot; R: Foot}; sink: number; armL: Arm; armR: Arm};
  /** floor shadow under the body (draw it yourself; pass shadow={false} to the rig) */
  shadow: {cx: number; cy: number; rx: number; ry: number};
  moving: boolean;
};

/**
 * A frontal rig walking along `plan`, `travelled` metres in. Footprints are plan points on the line a -> b (the two
 * feet keep the rig's ±33 px stance), projected through the room view: planted feet stay exactly on them. The rig is
 * drawn at the body's x, its ground line on the camera-nearest foot (or where the leading foot will land), so every
 * foot is at or above it (feet lift; the legs never have to reach below the rig's floor line). `aheadK` sets how far
 * (in steps) that ground line leads the body; a small value keeps the body nearer its plan point (pushing something).
 */
export const walkAt = (plan: PlanWalk, travelled: number, tilt: number, view: ViewConfig = DEFAULT_VIEW, aheadK = WALK_DUTY): WalkState => {
  const s = viewAt(tilt, view);
  const step = plan.stepM;
  const end = plan.dist;
  const c = Math.max(0, Math.min(end, travelled));
  const ux = end > 0 ? (plan.b.x - plan.a.x) / end : 0;
  const uz = end > 0 ? (plan.b.z - plan.a.z) / end : 0;
  const at = (d: number): PlanPt => ({x: plan.a.x + ux * d, z: plan.a.z + uz * d, h: 0});
  const lead = walkFoot(c, 0, step, end);
  const trail = walkFoot(c, 0.5, step, end);
  const ramp = E.inOut(clamp01(Math.min(c, end - c) / step));
  const body = projectWith(s, at(c));
  const fR = projectWith(s, at(lead.p));
  const fL = projectWith(s, at(trail.p));
  // screen-y per metre along the travel: > 0 when walking toward the camera
  const dyPerM = s.ppm * s.floor * uz;
  // constant lead of the ground line toward the camera (smaller aheadK: the body bobs onto the nearer foot instead)
  const ahead = Math.abs(dyPerM) * aheadK * step * ramp;
  const yRef = Math.max(body.y + ahead, fL.y, fR.y);
  const k = rigScale(s, plan.heightM); // the set's height scale, as lib/room rigAt
  const towardCam = uz >= 0;
  // the nearer leg is drawn last (Character2 orders legs by the shoes' turn); in profile the shoes point the way the
  // walk crosses the screen (that fixes the order: the near-side leg on top)
  const nearL = towardCam ? trail.p > lead.p : trail.p < lead.p;
  const pr = plan.profile ?? 0;
  const dir = projectWith(s, at(end)).x >= projectWith(s, at(0)).x ? 1 : -1;
  // (the turn eases in over the first half-step and out over the last, so she starts and stops on the standing pose)
  const frontTurn = nearL ? 0.06 : -0.06;
  const pRamp = pr > 0 ? E.inOut(clamp01(Math.min(c, end - c) / (0.5 * step))) : 0;
  const turn = frontTurn + (dir * pr - frontTurn) * pRamp;
  const foot = (fp: {x: number; y: number}, lift: number, side: -1 | 1): Foot => ({
    x: side * HIP_X + (fp.x - body.x) / k,
    lift: plan.lift * lift + (yRef - fp.y) / k,
    pitch: 0,
    turn,
    // both knees lean a little the way she goes (not Cast2's full sideways knee: the depth walk's lifted rear foot
    // would then show as a deep bend, a crouching waddle); outward knees on converging feet made the X
    knee: side * 0.2 + (dir * 0.3 * pr - side * 0.2) * pRamp,
  });
  // arm swing: +1 when the R foot leads by a full step
  const sw = Math.max(-1, Math.min(1, (lead.p - trail.p) / step)) * ramp;
  const arm = (fwd: number): Arm => ({a: 8 + 3 * Math.max(0, fwd), b: 10 + 16 * Math.max(0, fwd)});
  return {
    x: body.x,
    y: yRef,
    scale: k,
    plan: {x: at(c).x, z: at(c).z},
    pose: {
      feet: {L: foot(fL, trail.lift, -1), R: foot(fR, lead.lift, 1)},
      sink: 3 * ramp + 5 * ramp * (1 - Math.cos((2 * Math.PI * c) / step)) * 0.5,
      armL: arm(sw),
      armR: arm(-sw),
    },
    shadow: {cx: body.x, cy: body.y + 2 * k, rx: 92 * k, ry: 14 * k},
    moving: c > 0 && c < end,
  };
};
