// C2 (341-371, "carries a camera,"): the observer walks up to the camera. A small fixed camera sits low on the tray at
// the height of the observer's lens; the observer (lighter shell, camera module, aerial) comes round a gentle left-hand
// arc that ends pointing straight at it, so we see it from its front-left at first and head-on at the end. Nothing
// pushes in: the insect's own approach (45 mm/s) makes it grow, slowly at first and then fast as its lens arrives, until
// the lens fills the frame on the last frames; its glass starts to show what it sees (the feed), and C3 goes on through
// the lens (match: lens -> feed). Placement is a pinhole from the fixed camera (course.ts `place`); the insect is drawn
// flat through an orthographic view looked at along the line of sight and scaled by the lens's depth (2.5D, as the
// feed). The camera module rides smooth (the lens is the anchor; the gait bob moves the body around it).
import React from 'react';
import {V3, toW} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {clamp, rnd} from '../../../lib/ease';
import {poseRoach, RoachPose, Path} from '../../../rig/roach';
import {Roach2D, R2} from '../../roach/Roach2D';
import {Gear2D, CAM2, G2} from '../../roach/Gear2D';
import {viewAt, View, P, facing, f2} from '../../roach/ortho';
import {Box2D, LAB2} from '../../sets/Lab2';
import {Beyond2D} from './tray';
import {ShotProps} from '../index2';
import {LENS_BODY, Lens, place, objView, rightOf, headOf} from './course';
import {C3Feed} from './Feed';

export const C2_FROM = 341, C2_TO = 372;
export const OBS_TINT = '#6B4030';

// ------------------------------------------------------------------ the walk: a left-hand arc that ends on the camera axis
const ARC = {R: 52, PHI: (62 * Math.PI) / 180};
/** body origin path by arc length: the arc (heading turning from yaw -PHI to 0), then straight along +x through x = 0 */
const LARC = ARC.R * ARC.PHI;
const PATH: Path = (s) => {
  if (s >= LARC) return {p: [s - LARC, 0, 0], yaw: 0};
  const phi = (LARC - s) / ARC.R;
  return {p: [-ARC.R * Math.sin(phi), 0, -ARC.R * (1 - Math.cos(phi))], yaw: -phi};
};
const V_WALK = 45; // mm/s
/** the lens reaches the camera (0.6 mm short of it) at this film frame, a little into C3 */
export const C2_HIT = 372.45;
const X_HIT = 16; // body origin x at the hit (on the straight)
const s2 = (f: number) => LARC + X_HIT - (V_WALK * (C2_HIT - f)) / 30;
export const c2Pose = (f: number): RoachPose =>
  poseRoach({path: PATH, s: s2(f), t: f / 30, seed: 4, search: 0.75, antL: {yaw: 1.05, pitch: 0.46, curl: 0.8}, antR: {yaw: 1.05, pitch: 0.46, curl: 0.8}});

/** the fixed camera: level, at the lens's height, on the +x axis, looking back down -x */
const CAM_P: V3 = [X_HIT + LENS_BODY[0] + 0.6, LENS_BODY[1], 0];
const CAM: Lens = {p: CAM_P, yaw: Math.PI, fwd: headOf(Math.PI), rt: rightOf(Math.PI), F: 700, cx: 540, hz: 900};
/** drawing elevation: a touch above level so the module's top reads (placement stays the level pinhole) */
const EL = 7;

const smoothLens = (f: number): V3 => {
  const pp = PATH(s2(f));
  const c = Math.cos(pp.yaw), sn = Math.sin(pp.yaw);
  return [pp.p[0] + c * LENS_BODY[0], LENS_BODY[1], pp.p[2] - sn * LENS_BODY[0]];
};
export const c2View = (f: number): View => {
  const lw = smoothLens(f);
  const pl = place(CAM, lw);
  const u: V3 = [CAM_P[0] - lw[0], 0, CAM_P[2] - lw[2]];
  const az = (Math.atan2(u[0], u[2]) * 180) / Math.PI;
  const pose = c2Pose(f);
  return viewAt(az, EL, CAM.F / Math.max(0.05, pl.d), toW(pose.frame, LENS_BODY), pl.x, pl.y);
};
/** the lens on screen (same geometry Gear2D draws): centre, glass radii (rx is foreshortened by the facing) */
export const c2Lens = (f: number) => {
  const v = c2View(f), pose = c2Pose(f);
  const c = toW(pose.frame, LENS_BODY);
  const sc = P(v, c);
  const fc = Math.max(0.25, Math.abs(facing(v, pose.frame.x)));
  return {x: sc[0], y: sc[1], r: CAM2.lens * v.s, rx: CAM2.lens * v.s * fc, ry: CAM2.lens * v.s, fc};
};

/** the lens glass, detailed for close range: bezel, blue glass with depth, inner ring, iris hint, reflections;
 *  `feed` (0..1) shows the camera's image in the glass */
export const LensGlass: React.FC<{id: string; f: number; feed?: number; feedFrame?: number}> = ({id, f, feed = 0, feedFrame}) => {
  const L = c2Lens(f);
  if (L.ry < 14) return null;
  const g = 0.72; // glass / bezel radius ratio (Gear2D)
  const rx = L.rx * g, ry = L.ry * g;
  const W = 1080, H = 1920;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-lg`} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#3C86B8" />
          <stop offset="0.55" stopColor={G2.lens} />
          <stop offset="1" stopColor="#0E2F4A" />
        </radialGradient>
        <clipPath id={`${id}-lc`}>
          <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} />
        </clipPath>
      </defs>
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(L.rx)} ry={f2(L.ry)} fill="#3A434B" stroke={INK} strokeWidth={f2(Math.max(2, Math.min(9, L.ry * 0.05)))} />
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(L.rx * 0.9)} ry={f2(L.ry * 0.9)} fill="none" stroke="#56626C" strokeWidth={f2(L.ry * 0.05)} />
      <g clipPath={`url(#${id}-lc)`}>
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} fill={`url(#${id}-lg)`} />
        {feed > 0 && feedFrame !== undefined && (
          <g opacity={feed} transform={`translate(${f2(L.x)} ${f2(L.y)}) scale(${(Math.min(1, 2.05 * Math.max(rx / W, ry / H))).toFixed(4)}) translate(${-W / 2} ${-H / 2})`}>
            <C3Feed f={feedFrame} w={W} h={H} id={`${id}-fd`} />
          </g>
        )}
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx * 0.52)} ry={f2(ry * 0.52)} fill="none" stroke="#0B2236" strokeWidth={f2(ry * 0.05)} opacity={0.55 * (1 - feed)} />
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx * 0.22)} ry={f2(ry * 0.22)} fill="#08192A" opacity={0.6 * (1 - feed)} />
        <g opacity={1 - Math.max(0, feed - 0.5) * 2}>
          <path d={`M${f2(L.x - rx * 0.62)},${f2(L.y - ry * 0.12)} A${f2(rx * 0.66)},${f2(ry * 0.66)} 0 0 1 ${f2(L.x - rx * 0.05)},${f2(L.y - ry * 0.64)}`} stroke="#E6F6FF" strokeWidth={f2(ry * 0.09)} fill="none" strokeLinecap="round" opacity={0.55} />
          <ellipse cx={f2(L.x + rx * 0.34)} cy={f2(L.y + ry * 0.4)} rx={f2(rx * 0.16)} ry={f2(ry * 0.07)} fill="#9FD3F0" opacity={0.35} transform={`rotate(-30 ${f2(L.x + rx * 0.34)} ${f2(L.y + ry * 0.4)})`} />
          <circle cx={f2(L.x - rx * 0.3)} cy={f2(L.y - ry * 0.34)} r={f2(ry * 0.07)} fill="#FFFFFF" opacity={0.85} />
        </g>
      </g>
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} fill="none" stroke={INK} strokeWidth={f2(Math.max(1.5, Math.min(8, ry * 0.035)))} />
    </g>
  );
};

// ------------------------------------------------------------------ the tray around the camera
/** crumbs on the tray between the insect and the camera (world mm) */
const CRUMBS: {p: V3; r: number; k: number}[] = Array.from({length: 90}, (_, i) => ({p: [-160 + rnd(i, 41) * 196, 0, -90 + rnd(i, 42) * 150] as V3, r: 0.35 + rnd(i, 43) * 0.7, k: i % 3}));
/** foam blocks of the course far behind the insect (out of focus) */
const FAR_BLOCKS: {o: V3; yaw: number; L: number; W: number; H: number; c: string}[] = [
  {o: [-330, 0, 120], yaw: 0.3, L: 60, W: 50, H: 90, c: LAB2.foamB},
  {o: [-420, 0, -150], yaw: -0.2, L: 70, W: 55, H: 110, c: LAB2.foamY},
  {o: [-290, 0, -60], yaw: 0.1, L: 40, W: 40, H: 60, c: LAB2.foamR},
];

/** the C2 picture for any frame (C3 goes on through it for its first frames) */
export const C2Scene: React.FC<{f: number; id: string; feed?: number; feedFrame?: number}> = ({f, id, feed, feedFrame}) => {
  const v = c2View(f);
  const pose = c2Pose(f);
  const lipY = CAM.hz + (CAM.F * CAM_P[1]) / 520; // the tray's far lip, about half a metre off
  const far = FAR_BLOCKS.map((b, i) => {
    const ov = objView(CAM, b.o, b.yaw, [0, b.H / 2, 0]);
    return ov ? <Box2D key={i} id={`${id}-fb${i}`} v={ov.v} b={[-b.L / 2, b.L / 2, 0, b.H, -b.W / 2, b.W / 2]} color={b.c} /> : null;
  });
  const crumbs = CRUMBS.map((c, i) => {
    const p = place(CAM, c.p);
    if (p.d < 2 || p.x < -20 || p.x > 1100 || p.y > 1940) return null;
    const r = Math.max(0.8, (c.r * CAM.F) / p.d);
    return <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(r)} ry={f2(r * Math.min(1, Math.max(0.3, (CAM_P[1] * 2) / p.d)))} fill={c.k ? '#C3CFD4' : '#B4A894'} opacity={0.6} />;
  });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-fbl`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id={`${id}-fl`} x1="0" y1={f2(lipY)} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D3DEE3" />
          <stop offset="0.3" stopColor={LAB2.surface} />
          <stop offset="1" stopColor="#F3F6F7" />
        </linearGradient>
      </defs>
      <Beyond2D id={`${id}-lb`} lipY={lipY} k={1.25} blur={10} bench={70} />
      <rect x={-20} y={f2(lipY)} width={1120} height={f2(1940 - lipY)} fill={`url(#${id}-fl)`} />
      <path d={`M-20,${f2(lipY)} H1100`} stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />
      <g filter={`url(#${id}-fbl)`}>{far}</g>
      {crumbs}
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, tint: OBS_TINT, shadow: 0.8, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'camera'}} />}} />
      <LensGlass id={`${id}lg`} f={f} feed={feed} feedFrame={feedFrame} />
    </svg>
  );
};

export const C2: React.FC<ShotProps> = ({f}) => {
  // the glass begins to show the camera's picture in the last frames (the feed frame runs on into C3's first)
  const feed = clamp((f - 365) / 6) * 0.5;
  return <C2Scene f={f} id={`c2-${f}`} feed={feed} feedFrame={f} />;
};
void R2;
