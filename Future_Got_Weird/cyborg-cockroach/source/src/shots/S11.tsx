// S11 (20.60-21.83 s) "But the plan is to send them" The turn from the experiment to its intended use. In the lab arena,
// low and side-on, the medic (injector loaded, latched) walks screen-RIGHT through the gap between a blue foam block
// behind it and a low yellow block in front of it; the camera makes one lateral move with it (eases in, then holds the
// insect's own speed into the cut). From ~21.4 s a tall yellow foam block standing right in front of the lens slides in
// from the right edge (the camera is passing it), its lit edge leading and its shadowed face filling the frame for the
// last two frames: the occlusion bridge into S12, whose rubble slab carries on screen-left at the same speed.
import React from 'react';
import {Cam, lookAt, depth, proj} from '../lib/cam';
import {V3, add, mul} from '../lib/v3';
import {clamp, rnd} from '../lib/ease';
import {poseRoach, straightPath} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {LabBackdrop, ArenaFloor, Foam, LAB} from '../sets/Lab';
import {arenaWalls} from '../sets/LabRoom';
import {fmt, polyPath, projPoly} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {ShotProps} from './index';
import {FPS} from '../timeline';
import {SHOT_FRAMES} from '../cuts';

const cutAt = (id: string) => SHOT_FRAMES.find(([k]) => k === id)![1];
export const S11_F0 = cutAt('S11');
export const S11_F1 = cutAt('S12');
const N = S11_F1 - S11_F0;

// ---------------------------------------------------------------------------------------------------------------
// The walk: straight along +x at z = WALK_Z, 52 mm/s (1.74 mm per frame, the camera's speed at the cut)
// ---------------------------------------------------------------------------------------------------------------
export const S11_V = 1.74; // mm per frame
const WALK_Z = -110;
const X_AT0 = 18; // body origin x at the first frame
const PATH = straightPath([X_AT0 - 120, 0, WALK_Z], 0);
export const s11Medic = (f: number) => {
  const t = f / FPS;
  const s = 120 + S11_V * (f - S11_F0);
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9);
  return poseRoach({path: PATH, s, t, seed: 3, search: 0.85, antL: {yaw: 0.56, pitch: 0.12}, antR: {yaw: 0.62}, breathe: br, pitch: -0.006 * (br - 0.5)});
};

// ---------------------------------------------------------------------------------------------------------------
// Camera: low side-on (looking along -z, so +x is screen-right), one lateral move: it eases in from a slow drift to the
// insect's speed by about frame 18 and holds it into the cut (the bridge continues the motion).
// ---------------------------------------------------------------------------------------------------------------
export const S11_FOCAL = 1400;
const CAM_Z = WALK_Z + 228, CAM_Y = 44;
const V0 = 0.55; // mm per frame at the first frame
const EASE = 18; // frames to reach S11_V
/** camera x (lateral travel) at local frame l: integral of a smoothed ramp from V0 to S11_V */
const camX = (l: number) => {
  const u = clamp(l / EASE);
  // integral of V0 + (V - V0) * smoother(u) over [0, u] (times EASE), then linear
  const intSm = (x: number) => x * x * x * x * (x * x - 3 * x + 2.5);
  const eased = EASE * (V0 * u + (S11_V - V0) * intSm(u));
  return l <= EASE ? eased : EASE * (V0 + (S11_V - V0) * 0.5) + S11_V * (l - EASE);
};
const X_CAM0 = X_AT0 + 4;
export const s11Cam = (f: number): Cam => {
  const l = f - S11_F0;
  const x = X_CAM0 + camX(l);
  const eye: V3 = [x, CAM_Y, CAM_Z];
  const pitch = (-7.5 * Math.PI) / 180, yaw = (3 * Math.PI) / 180;
  const dir: V3 = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  return lookAt(eye, add(eye, mul(dir, 100)), S11_FOCAL, 540, 1000);
};

// ---------------------------------------------------------------------------------------------------------------
// The set: the gap (a blue block behind the walk, a low yellow block in front), and the tall block at the lens
// ---------------------------------------------------------------------------------------------------------------
const BLOCKS: {c: V3; h: V3; color: string; yaw?: number}[] = [
  {c: [52, 17, WALK_Z - 64], h: [50, 17, 22], color: LAB.foamB, yaw: 0.04}, // behind the walk
  {c: [168, 14, WALK_Z - 78], h: [30, 14, 26], color: LAB.foam, yaw: -0.08},
  {c: [64, 2, WALK_Z + 92], h: [48, 2, 12], color: LAB.foam, yaw: -0.05}, // a low strip in front of the walk
  {c: [-70, 15, WALK_Z - 58], h: [26, 15, 24], color: LAB.foam, yaw: 0.1},
];
/** the bridge: a tall foam block whose face stands BRIDGE_Z in front of the lens; its left edge leads in from the
 *  right at ~75 px per frame and has crossed the frame two frames before the cut */
const BRIDGE_Z = 24.4;
export const S11_OCC = (() => {
  const zFace = CAM_Z - BRIDGE_Z;
  const halfW = (540 / S11_FOCAL) * BRIDGE_Z;
  // fully covered from frame F1 - 2: the edge passes the left side of the frame between F1 - 3 and F1 - 2
  const xEdge = X_CAM0 + camX(N - 1.6) - halfW;
  // a foam panel (thin, so its side face is only a sliver as it comes in)
  return {x0: xEdge, x1: xEdge + 70, z0: zFace - 6, z1: zFace, y0: 0, y1: 100};
})();

/** the near foam block: shadowed face, foam pores, a lit leading edge (drawn last; it is right at the lens) */
const FoamOccluder: React.FC<{cam: Cam; id: string}> = ({cam, id}) => {
  const o = S11_OCC;
  const front: V3[] = [[o.x0, o.y0, o.z1], [o.x1, o.y0, o.z1], [o.x1, o.y1, o.z1], [o.x0, o.y1, o.z1]];
  const side: V3[] = [[o.x0, o.y0, o.z0], [o.x0, o.y0, o.z1], [o.x0, o.y1, o.z1], [o.x0, o.y1, o.z0]];
  const F = projPoly(cam, front, 3), S = cam.eye[0] < o.x0 ? projPoly(cam, side, 3) : null;
  if (!F && !S) return null;
  // in the shadow of its own face (the light is upper-left, the lens is right at it): a deep ochre mid-tone, close in
  // value to the concrete slab that continues the wipe in S12
  // (pulled toward S12's grey concrete so the wipe does not change colour at the hidden cut)
  const base = mix(shade(LAB.foam, 0.6), '#8A847E', 0.6);
  const sideCol = mix(shade(LAB.foam, 0.75), '#6E6964', 0.6);
  // pores: anchored on the front face, drawn where they land on screen
  const pores: React.ReactNode[] = [];
  for (let i = 0; i < 1400; i++) {
    const p: V3 = [o.x0 + 1 + 40 * rnd(i, 71), o.y0 + 20 + 60 * rnd(i, 72), o.z1 + 0.05];
    const dz = depth(cam, p);
    if (dz < 4) continue;
    const r = (0.08 + 0.28 * Math.pow(rnd(i, 73), 2)) * (cam.f / dz);
    if (r < 0.6) continue;
    const q = proj(cam, p);
    if (q[0] < -30 || q[0] > 1110 || q[1] < -30 || q[1] > 1950) continue;
    pores.push(<ellipse key={i} cx={fmt(q[0])} cy={fmt(q[1])} rx={fmt(r)} ry={fmt(r * (0.7 + 0.5 * rnd(i, 74)))} fill={shade(base, 0.45)} opacity={0.55} />);
    if (r > 3) pores.push(<ellipse key={`h${i}`} cx={fmt(q[0] - r * 0.25)} cy={fmt(q[1] - r * 0.3)} rx={fmt(r * 0.45)} ry={fmt(r * 0.3)} fill={lit(base, 0.3)} opacity={0.35} />);
  }
  const iw = 3.2;
  const edgeTop = proj(cam, [o.x0, o.y1, o.z1]), edgeBot = proj(cam, [o.x0, o.y0, o.z1]);
  const showEdge = depth(cam, [o.x0, 60, o.z1]) > 3;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={1080} y2={1920}>
          <stop offset="0" stopColor={lit(base, 0.1)} />
          <stop offset="1" stopColor={shade(base, 0.12)} />
        </linearGradient>
      </defs>
      {S && <path d={polyPath(S)} fill={sideCol} stroke={INK} strokeWidth={iw} strokeLinejoin="round" />}
      {F && (
        <g>
          <clipPath id={`${id}-fc`}>
            <path d={polyPath(F)} />
          </clipPath>
          <path d={polyPath(F)} fill={`url(#${id}-fg)`} />
          <g clipPath={`url(#${id}-fc)`}>{pores}</g>
          <path d={polyPath(F)} fill="none" stroke={INK} strokeWidth={iw} strokeLinejoin="round" />
        </g>
      )}
      {showEdge && (
        // the lit, slightly rounded leading edge (the foam's cut corner catching the key light)
        <path d={`M${fmt(edgeTop[0] + 7)} ${fmt(edgeTop[1])} L${fmt(edgeBot[0] + 7)} ${fmt(edgeBot[1])}`} stroke={lit(LAB.foam, 0.25)} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
      )}
    </g>
  );
};

export const S11: React.FC<ShotProps & {k?: string}> = ({f, k = ''}) => {
  const cam = s11Cam(f);
  const id = `s11${k}`;
  const pose = s11Medic(f);
  const items: {z: number; el: React.ReactNode}[] = BLOCKS.map((b, i) => ({
    z: depth(cam, [b.c[0], b.c[1] * 2, b.c[2]]),
    el: <Foam key={`b${i}`} cam={cam} c={b.c} h={b.h} color={b.color} yaw={b.yaw} />,
  }));
  items.push({
    z: depth(cam, pose.frame.o),
    el: <Roach key="r" pose={pose} cam={cam} o={{id: `${id}r`, gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={{kind: 'injector', loaded: true, latched: true}} />}} />,
  });
  items.push(...arenaWalls(cam, {skip: ['s', 'e', 'w']}));
  items.sort((a, b) => b.z - a.z);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id={`${id}b`} cam={cam} blur={16} />
      <ArenaFloor id={`${id}f`} cam={cam} />
      {BLOCKS.map((b, i) => (
        <BlockShadow key={i} cam={cam} c={b.c} h={b.h} yaw={b.yaw} id={`${id}bs${i}`} />
      ))}
      {items.map((it) => it.el)}
      <FoamOccluder cam={cam} id={`${id}occ`} />
    </svg>
  );
};

/** soft contact shadow of a block on the mat */
const BlockShadow: React.FC<{cam: Cam; c: V3; h: V3; yaw?: number; id: string}> = ({cam, c, h, yaw = 0, id}) => {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const g = 4;
  const pts: V3[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
    const lx = a * (h[0] + g), lz = b * (h[2] + g);
    return [c[0] + lx * cs + lz * sn + 3, 0.05, c[2] - lx * sn + lz * cs + 2] as V3;
  });
  const q = projPoly(cam, pts);
  if (!q) return null;
  return (
    <g>
      <defs>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <path d={polyPath(q)} fill="#1C2A24" opacity={0.26} filter={`url(#${id}-f)`} />
    </g>
  );
};
