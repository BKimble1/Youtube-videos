// S07 (10.50-12.40 s) "A second cockroach carries a camera," Low front-side view at insect height introducing the
// observer: the same species, size and finish as the medic, its backpack carrying the small Wi-Fi camera module (lens,
// aerial; no launch tube). It walks toward the camera's left, three-quarter front; by "camera" the module and its lens
// read clearly (the lens turns into the key light and catches a glint). From ~11.9 s the view eases in toward the lens
// (one push, no reversal) so the cut into its own viewpoint (S08) is motivated.
import React from 'react';
import {Cam, lookAt, depth, proj, scaleAt} from '../lib/cam';
import {V3, V2, add, sub, mul, lerp3, toW, dirW, norm, dot, Frame} from '../lib/v3';
import {clamp, lerp, sr, smoother, keys, noise1} from '../lib/ease';
import {poseRoach, splinePath, plantedStop, Path, RoachPose} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear, GEAR_COL, lightW} from '../rig/Gear';
import {PACK} from '../rig/gear';
import {LabBackdrop, ArenaFloor} from '../sets/Lab';
import {fmt, polyPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {ShotProps} from './index';
import {FPS, word} from '../timeline';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// Paths built from a heading function (phi = heading measured from -x, positive = turned to world -z, i.e. the insect's
// right when it faces -x), integrated backward from a fixed end point so the planted stop lands exactly where we want.
// ---------------------------------------------------------------------------------------------------------------
export type HeadingPath = {path: Path; sStop: number};
/**
 * @param end    ground point [x, z] of the body origin at the stop
 * @param phi    heading (rad from -x toward -z) as a function of the distance BEFORE the stop (d >= 0)
 * @param sNom   nominal arc length of the stop (the stop is moved to the next all-feet-planted distance)
 * @param lead   path length before s = 0 and after the stop (for the gait's plant look-ups)
 */
export const headingPath = (end: [number, number], phi: (d: number) => number, sNom: number, lead = 70): HeadingPath => {
  const sStop = plantedStop(sNom);
  const ds = 1;
  const back = sStop + lead, fwd = lead;
  // integrate backward from the end (d = distance before the stop), then forward past it (constant end heading)
  const pts: [number, number][] = [];
  let x = end[0], z = end[1];
  const rev: [number, number][] = [[x, z]];
  const nBack = Math.ceil(back / ds);
  for (let i = 0; i < nBack; i++) {
    const p = phi((i + 0.5) * ds);
    x += Math.cos(p) * ds; // walking backward along -heading: heading = (-cos p, -sin p)
    z += Math.sin(p) * ds;
    rev.push([x, z]);
  }
  for (let i = rev.length - 1; i >= 0; i--) pts.push(rev[i]);
  const p0 = phi(0);
  for (let d = ds; d <= fwd; d += ds) pts.push([end[0] - Math.cos(p0) * d, end[1] - Math.sin(p0) * d]);
  const sp = splinePath(pts, Math.round((nBack + fwd / ds) * 4));
  // arc length of the end point on the spline = nBack * ds (the polyline is uniformly sampled at ds)
  const off = nBack * ds - sStop;
  const path: Path = (s) => sp(s + off);
  return {path, sStop};
};

/** distance remaining to the stop: constant speed v until tA, then a quadratic ease-out to rest at tB */
export const remaining = (t: number, v: number, tA: number, tB: number) => {
  const T = tB - tA;
  if (t <= tA) return v * (tA - t) + (v * T) / 2;
  if (t >= tB) return 0;
  const u = (t - tA) / T;
  return ((v * T) / 2) * (1 - u) * (1 - u);
};

// ---------------------------------------------------------------------------------------------------------------
// The observer insect (S07 + S08): one straight-ish walk, a slight right curve, ending behind and to the left of the
// medic's firing stance (S08), its camera aimed between the medic and the target.
// ---------------------------------------------------------------------------------------------------------------
/** lens position on the observer's body (front face of the lens glass) */
export const LENS: V3 = [PACK.cam.c[0] + PACK.cam.h[0] + 1.4, PACK.cam.c[1], 0];
export type ObsParams = {
  v: number; // walking speed (mm/s)
  tA: number; // starts to slow
  tB: number; // stopped (all six feet down)
  endLens: [number, number]; // [x, z] of the lens at the stop
  phiEnd: number; // heading at the stop (rad, right of -x)
  phiStart: number; // heading through S07 (it turns left a little in S08, keeping the medic in view)
  turn: [number, number]; // the turn happens over this distance before the stop (mm)
};
export const OBS: ObsParams = {v: 38, tA: 13.4, tB: 14.4, endLens: [196, 80], phiEnd: 30 * DEG, phiStart: 45 * DEG, turn: [-4, 35]};
/** the observer's walk for a parameter set: path, distance and pose as functions of time */
export const observerRig = (P: ObsParams) => {
  const travel = remaining(10.0, P.v, P.tA, P.tB) + 20; // path from (before) S07 start to the stop
  const phi = (d: number) => lerp(P.phiEnd, P.phiStart, sr(d, P.turn[0], P.turn[1]));
  const endBody: [number, number] = [P.endLens[0] + Math.cos(P.phiEnd) * LENS[0], P.endLens[1] + Math.sin(P.phiEnd) * LENS[0]];
  const hp = headingPath(endBody, phi, travel + 80);
  const sAt = (t: number) => hp.sStop - remaining(t, P.v, P.tA, P.tB);
  const pose = (t: number): RoachPose => {
    const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.85 + 1.3);
    const stopped = sr(t, P.tB - 0.3, P.tB + 0.3);
    return poseRoach({
      path: hp.path, s: sAt(t), t, seed: 7, search: 0.75 + 0.2 * stopped,
      offset: [0, -0.5 * stopped, 0],
      pitch: -0.006 * (br - 0.5),
      antL: {yaw: 0.6, pitch: 0.14}, antR: {yaw: 0.6, pitch: 0.14},
      breathe: br,
    });
  };
  return {path: hp, sAt, pose};
};
export const OBSERVER = observerRig(OBS);
export const OBS_PATH: HeadingPath = OBSERVER.path;
export const obsS = OBSERVER.sAt;
/** the posed observer at time t (s) */
export const obsPose = OBSERVER.pose;
export const OBS_GEAR = {kind: 'camera' as const, loaded: false};

// ---------------------------------------------------------------------------------------------------------------
// Lens close-up detail (drawn with the gear, inside the insect's draw order): glass, iris rings and a glint that
// brightens on "camera" as the lens turns into the key light.
// ---------------------------------------------------------------------------------------------------------------
const ringPts = (f: Frame, x: number, c: V3, r: number, cam: Cam, n = 40): V2[] => {
  const out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(proj(cam, toW(f, [x, c[1] + r * Math.cos(a), c[2] + r * Math.sin(a)])));
  }
  return out;
};
export const LensDetail: React.FC<{id: string; cam: Cam; f: Frame; glint: number}> = ({id, cam, f, glint}) => {
  const cx = LENS[0] + 0.02;
  const c: V3 = [cx, PACK.cam.c[1], 0];
  const facing = dot(sub(cam.eye, toW(f, c)), f.x);
  if (facing <= 0) return null;
  const sc = scaleAt(cam, toW(f, c));
  const R = PACK.cam.lens;
  const glass = ringPts(f, cx, c, R * 0.84, cam);
  const iris = ringPts(f, cx + 0.01, c, R * 0.52, cam);
  const pupil = ringPts(f, cx + 0.02, c, R * 0.26, cam);
  const gc = proj(cam, toW(f, c));
  // highlights sit toward the fixed key light: the light direction laid into the plane of the glass
  const Lw = lightW(cam);
  const ly = dot(Lw, f.y), lz = dot(Lw, f.z), ll = Math.hypot(ly, lz) || 1;
  const hl = proj(cam, toW(f, [cx + 0.03, c[1] + (R * 0.5 * ly) / ll, c[2] + (R * 0.5 * lz) / ll]));
  const hs = proj(cam, toW(f, [cx + 0.03, c[1] + (R * 0.18 * ly) / ll, c[2] + (R * 0.18 * lz) / ll]));
  const w = Math.max(0.8, sc * 0.12);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={fmt(gc[0])} cy={fmt(gc[1])} r={fmt(R * sc)} fx={fmt(hl[0])} fy={fmt(hl[1])}>
          <stop offset="0" stopColor="#5E8FBF" />
          <stop offset="0.45" stopColor={GEAR_COL.lens} />
          <stop offset="1" stopColor="#0E1E33" />
        </radialGradient>
      </defs>
      <path d={polyPath(glass)} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={w} />
      <path d={polyPath(iris)} fill="#122840" stroke="#2C5680" strokeWidth={w * 0.8} opacity={0.95} />
      <path d={polyPath(pupil)} fill="#081320" />
      <ellipse cx={fmt(hl[0])} cy={fmt(hl[1])} rx={fmt(R * sc * 0.34)} ry={fmt(R * sc * 0.15)} transform={`rotate(-38 ${fmt(hl[0])} ${fmt(hl[1])})`} fill="#FFFFFF" opacity={0.55 + 0.35 * glint} />
      {glint > 0.01 && (
        <g opacity={glint}>
          <ellipse cx={fmt(hs[0])} cy={fmt(hs[1])} rx={fmt(R * sc * 0.55)} ry={fmt(R * sc * 0.55)} fill={`url(#${id}-h)`} />
          <defs>
            <radialGradient id={`${id}-h`}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
              <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.45} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Camera: one move. It leads the walking insect at a low front-left three-quarter (travelling with its line of walk, so
// the insect holds its place while the mat slides by), creeping in slowly; from "camera" it pushes in toward the lens and
// is still travelling into it at the cut.
// ---------------------------------------------------------------------------------------------------------------
export const S07_T0 = 10.5, S07_T1 = 12.4;
export const S07_CAMERA_T = word('camera', 0).start; // 11.71
/** a framing relative to the observer's path frame: az from its heading toward its left, el up, R distance from aim */
export type S07CamSet = {az: number; el: number; R: number; f: number; cy: number; aim: V3};
export const S07_START: S07CamSet = {az: 32 * DEG, el: 8 * DEG, R: 175, f: 2000, cy: 1020, aim: [8, 13, 0]};
export const S07_END: S07CamSet = {az: 12 * DEG, el: 26 * DEG, R: 21, f: 1300, cy: 900, aim: [LENS[0], LENS[1], 0]};
const PUSH0 = S07_CAMERA_T - 0.16, PUSH1 = 12.9; // the push's eased curve, cut off at 12.4 while still moving
/** camera progress 0..1: a slow creep through the shot plus the push (continuous velocity, no reversal) */
export const s07Prog = (t: number) => {
  const lin = clamp((t - S07_T0) / (S07_T1 - S07_T0));
  const p = smoother(clamp((t - PUSH0) / (PUSH1 - PUSH0))) / smoother((S07_T1 - PUSH0) / (PUSH1 - PUSH0));
  return 0.12 * lin + 0.88 * p;
};
export const s07Cam = (t: number, a: S07CamSet = S07_START, b: S07CamSet = S07_END): Cam => {
  const e = s07Prog(t);
  const fr = obsPose(t).bodyFrame0; // the path frame (no gait bob or roll)
  const az = lerp(a.az, b.az, e), el = lerp(a.el, b.el, e), R = a.R * Math.pow(b.R / a.R, e);
  const aim = toW(fr, lerp3(a.aim, b.aim, e));
  const dir = dirW(fr, [Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)]);
  return lookAt(add(aim, mul(dir, R)), aim, lerp(a.f, b.f, e), 540, lerp(a.cy, b.cy, e));
};

/** trim a polyline where it comes closer than `near` mm to the camera plane (the close push passes over the antennae) */
const nearTrim = (cam: Cam, pts: V3[], near = 7): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const d = depth(cam, pts[i]);
    if (d >= near) {
      out.push(pts[i]);
      continue;
    }
    if (i > 0) {
      const d0 = depth(cam, pts[i - 1]);
      out.push(lerp3(pts[i - 1], pts[i], (d0 - near) / (d0 - d)));
    }
    break;
  }
  return out.length >= 2 ? out : pts.slice(0, 1);
};

export const S07: React.FC<ShotProps & {k?: string; cam?: S07CamSet}> = ({f, k = '', cam: cs}) => {
  const t = f / FPS;
  const cam = s07Cam(t, cs ?? S07_START);
  const pose0 = obsPose(t);
  const pose = {...pose0, antL: nearTrim(cam, pose0.antL), antR: nearTrim(cam, pose0.antR)};
  // the glint: the lens swings through the key light's reflection on "camera"
  const glint = Math.exp(-Math.pow((t - (S07_CAMERA_T + 0.14)) / 0.16, 2));
  const id = `s07${k}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id={`${id}b`} cam={cam} blur={16} />
      <ArenaFloor id={`${id}f`} cam={cam} x0={-200} x1={720} z0={-200} z1={560} />
      <Roach
        pose={pose}
        cam={cam}
        o={{
          id: `${id}r`,
          gear: (
            <>
              <Gear id={`${id}g`} cam={cam} f={pose.frame} g={OBS_GEAR} />
              <LensDetail id={`${id}l`} cam={cam} f={pose.frame} glint={glint} />
            </>
          ),
        }}
      />
    </svg>
  );
};
