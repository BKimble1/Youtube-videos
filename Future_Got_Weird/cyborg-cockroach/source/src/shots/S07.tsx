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
import {Gear, GEAR_COL} from '../rig/Gear';
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
export const OBS = {
  v: 38, // mm/s
  tA: 13.55, // starts to slow
  tB: 14.45, // stopped (all six feet down)
  endLens: [190, 62] as [number, number], // [x, z] of the lens at the stop
  phiEnd: 21 * DEG, // heading at the stop (right of -x)
  phiStart: 15 * DEG, // heading at the start of S07
};
const OBS_TRAVEL = remaining(10.0, OBS.v, OBS.tA, OBS.tB) + 20; // path from (before) S07 start to the stop
const obsPhi = (d: number) => lerp(OBS.phiEnd, OBS.phiStart, smoother(clamp(d / 150)));
const OBS_END_BODY: [number, number] = [OBS.endLens[0] + Math.cos(OBS.phiEnd) * LENS[0], OBS.endLens[1] + Math.sin(OBS.phiEnd) * LENS[0]];
export const OBS_PATH: HeadingPath = headingPath(OBS_END_BODY, obsPhi, OBS_TRAVEL + 80);
export const obsS = (t: number) => OBS_PATH.sStop - remaining(t, OBS.v, OBS.tA, OBS.tB);
/** the posed observer at time t (s) */
export const obsPose = (t: number): RoachPose => {
  const s = obsS(t);
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.85 + 1.3);
  const stopped = sr(t, OBS.tB - 0.3, OBS.tB + 0.3);
  return poseRoach({
    path: OBS_PATH.path, s, t, seed: 7, search: 0.75 + 0.2 * stopped,
    offset: [0, -0.5 * stopped, 0],
    pitch: -0.006 * (br - 0.5),
    antL: {yaw: 0.6, pitch: 0.14}, antR: {yaw: 0.6, pitch: 0.14},
    breathe: br,
  });
};
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
  // bright arc on the upper-left of the glass (toward the key light) and a small hot spot
  const hl = proj(cam, toW(f, [cx + 0.03, c[1] + R * 0.38, c[2] - R * 0.36]));
  const hs = proj(cam, toW(f, [cx + 0.03, c[1] + R * 0.12, c[2] - R * 0.08]));
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
// Camera: locked off at a low front-left three-quarter, then one eased push toward the lens into the cut.
// ---------------------------------------------------------------------------------------------------------------
export const S07_T0 = 10.5, S07_T1 = 12.4;
export const S07_CAMERA_T = word('camera', 0).start; // 11.71
const PUSH0 = 11.88; // the push starts (eases in) and is still travelling at the cut
export type S07CamSet = {az: number; el: number; R: number; f: number; tgt: V3; cy: number};
/** the locked-off framing (world): around where the observer is at ~11.3 s */
export const S07_LOCK: S07CamSet = {az: 50 * DEG, el: 5 * DEG, R: 250, f: 2200, tgt: [0, 0, 0], cy: 1040};
const lockCam = (c: S07CamSet): Cam => {
  // the aim point: the observer's body (mid-height) at 11.45 s; az measured from the observer's heading toward its left
  const fr = obsPose(11.45).bodyFrame0;
  const aim = add(toW(fr, [6, 14, 0]), c.tgt);
  const h = fr.x, left = mul(fr.z, -1);
  const dir = norm(add(mul(h, Math.cos(c.az)), mul(left, Math.sin(c.az))));
  const eye = add(aim, add(mul(dir, c.R * Math.cos(c.el)), [0, c.R * Math.sin(c.el), 0]));
  return lookAt(eye, aim, c.f, 540, c.cy);
};
/** the push: eye and aim move toward a point in front of the lens (following the walking insect), focal length grows */
export const s07Cam = (t: number, c: S07CamSet = S07_LOCK): Cam => {
  const L = lockCam(c);
  const u = clamp((t - PUSH0) / (S07_T1 + 0.25 - PUSH0));
  // ease in (smoother's first half): accelerating toward the cut, no stop and no reversal
  const e = smoother(u * 0.62) / smoother(0.62);
  if (e <= 0) return L;
  const fr = obsPose(t).frame;
  const lens = toW(fr, LENS);
  // end view: in front of the lens, a little to its left and above, looking into it
  const endDir = norm(dirW(fr, [Math.cos(22 * DEG), 0.16, -Math.sin(22 * DEG)]));
  const endEye = add(lens, mul(endDir, 70));
  const eye = lerp3(L.eye, endEye, e);
  const aim0 = add(L.eye, mul(L.fwd, 250));
  const aim = lerp3(aim0, add(lens, [0, -1.5, 0]), e);
  return lookAt(eye, aim, lerp(c.f, 1500, e), 540, lerp(c.cy, 900, e));
};

export const S07: React.FC<ShotProps & {k?: string; cam?: S07CamSet}> = ({f, k = '', cam: cs}) => {
  const t = f / FPS;
  const cam = s07Cam(t, cs ?? S07_LOCK);
  const pose = obsPose(t);
  // the glint: the lens swings through the key light's reflection on "camera"
  const glint = Math.exp(-Math.pow((t - (S07_CAMERA_T + 0.14)) / 0.16, 2));
  const id = `s07${k}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id={`${id}b`} cam={cam} blur={16} />
      <ArenaFloor id={`${id}f`} cam={cam} x0={-260} x1={620} z0={-240} z1={420} />
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
