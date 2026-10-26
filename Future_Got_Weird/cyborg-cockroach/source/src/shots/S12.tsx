// S12 (21.83-25.27 s) "beneath collapsed buildings, carrying emergency medicine." The proposed future application, in
// the rubble at insect height (the integrator draws the "Future rescue concept" identifier top-left, frames 658-741).
// It opens on the occlusion bridge from S11: a broken concrete slab right at the lens covers the frame for the first two
// frames and, still travelling screen-left like S11's foam block (the camera is crabbing right at the same speed), its
// ragged trailing edge wipes off to the left, uncovering the passage. The camera's crab turns into one steady forward
// glide at insect height behind and above the medic (loaded injector, latched) as it walks the low passage under the
// fallen slab: walls and pebbles stream past the frame edges, dust drifts in a daylight shaft through a crack on the
// right. As the ceiling lowers toward the mouth the camera sinks with it and tilts up; on "medicine" the lip of the slab
// rises out of the top of the frame and the daylit alcove opens: the route leads to a person (composited by the
// integrator through the `person` slot; see S12_PERSON). Ends with the insect a few centimetres short of the gap.
import React from 'react';
import {Cam, lookAt, proj, depth, scaleAt} from '../lib/cam';
import {V3, add, sub, mul, norm, dot} from '../lib/v3';
import {clamp, lerp, smoother, ramp, sr, keys} from '../lib/ease';
import {poseRoach, straightPath} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {fmt} from '../lib/g3';
import {ShotProps} from './index';
import {FPS} from '../timeline';
import {SHOT_FRAMES} from '../cuts';
import {
  RUB, RF, RR, rw, toRoute, ROUTE_YAW, ALCOVE, Chunk, ChunkDef, chunkDepth, Rebar, rebarDepth, RubbleFloor, DustShaft, beamDepth,
  DustMotes, AirGlow, FloorAO, CEILING, WALLS, PEBBLES, REBAR, ALCOVE_BACK, RUBBLE_LIGHTS, PASSAGE_BEAM, ALCOVE_BEAM, Lights,
} from '../sets/Rubble';

const cutAt = (id: string) => SHOT_FRAMES.find(([k]) => k === id)![1];
export const S12_F0 = cutAt('S12');
export const S12_F1 = cutAt('S13');
const N = S12_F1 - S12_F0;
const T0 = S12_F0 / FPS;

// ---------------------------------------------------------------------------------------------------------------
// The medic's walk: straight along the route at 58 mm/s, from a = -260 to a = -61 (its head ~25 mm short of the gap)
// ---------------------------------------------------------------------------------------------------------------
export const S12_SPEED = 58;
const PATH_A0 = -400;
export const S12_PATH = straightPath(rw(PATH_A0, 0), ROUTE_YAW);
const S_AT0 = 140;
/** arc length along S12_PATH at time t (continues past the cut at the same speed) */
export const s12S = (t: number) => S_AT0 + S12_SPEED * (t - T0);
export const s12Medic = (t: number) => {
  const s = s12S(t);
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9);
  const pose = poseRoach({path: S12_PATH, s, t, seed: 3, search: 0.9, antL: {yaw: 0.5, pitch: 0.14}, antR: {yaw: 0.56, pitch: 0.12}, breathe: br, pitch: -0.006 * (br - 0.5)});
  return {pose, s};
};

// ---------------------------------------------------------------------------------------------------------------
// Camera: one continuous move. Crab right (the bridge, matched to S11) turning into a forward glide behind the insect,
// sinking with the ceiling and tilting up into the reveal; eased in (forward) and eased out at the end.
// ---------------------------------------------------------------------------------------------------------------
const V_LAT = 1.74; // mm per frame at the cut (S11's camera speed)
const LAT_HOLD = 6, LAT_END = 22;
const latV = (lf: number) => (lf < LAT_HOLD ? V_LAT : V_LAT * (1 - smoother((lf - LAT_HOLD) / (LAT_END - LAT_HOLD))));
const fwdV = (u: number) => (0.22 + 0.78 * smoother(u / 0.22)) * (1 - 0.93 * smoother((u - 0.6) / 0.4));
const TABLE = (() => {
  const steps = 2000;
  const A: number[] = [0], B: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const l0 = ((i - 1) / steps) * N, l1 = (i / steps) * N, lm = (l0 + l1) / 2;
    A.push(A[i - 1] + fwdV(lm / N) * (l1 - l0));
    B.push(B[i - 1] + latV(lm) * (l1 - l0));
  }
  return {A, B, steps};
})();
const tab = (arr: number[], lf: number) => {
  const x = clamp(lf / N) * TABLE.steps;
  const i = Math.min(TABLE.steps - 1, Math.floor(x));
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};
export const S12_CAM_A = [-420, -226] as const;
const B_END = -20;
const B_START = B_END - TABLE.B[TABLE.steps];
export const S12_FOCAL = 1000;
const DEGR = Math.PI / 180;
export const s12CamParts = (f: number) => {
  const lf = f - S12_F0;
  const ext = lf < 0 ? lf : lf > N ? lf - N : 0; // outside the shot: keep the move going linearly (for checks only)
  const l = clamp(lf, 0, N);
  const a = S12_CAM_A[0] + (S12_CAM_A[1] - S12_CAM_A[0]) * (tab(TABLE.A, l) / TABLE.A[TABLE.steps]) + (ext > 0 ? 0 : 0);
  const b = B_START + tab(TABLE.B, l) + (ext < 0 ? V_LAT * ext : 0);
  const y = lerp(80, 38, sr(l, 18, N));
  const pitch = lerp(-14, 11, smoother(ramp(l, 16, N))) * DEGR;
  const yaw = lerp(9, 8, sr(l, 0, N)) * DEGR;
  return {a, b, y, pitch, yaw};
};
export const s12Cam = (f: number): Cam => {
  const {a, b, y, pitch, yaw} = s12CamParts(f);
  const eye = rw(a, b, y);
  const hdir = add(mul(RF, Math.cos(yaw)), mul(RR, Math.sin(yaw)));
  const dir: V3 = [hdir[0] * Math.cos(pitch), Math.sin(pitch), hdir[2] * Math.cos(pitch)];
  return lookAt(eye, add(eye, mul(dir, 100)), S12_FOCAL, 540, 960);
};

/** where the integrator composites the person at the shot's last frame (and the camera to do it at any frame) */
export const S12_PERSON = (() => {
  const cam = s12Cam(S12_F1 - 1);
  const an = proj(cam, ALCOVE.anchor);
  const hd = proj(cam, ALCOVE.head);
  return {
    frame: S12_F1 - 1,
    anchor: {x: an[0], y: an[1]},
    head: {x: hd[0], y: hd[1]},
    /** px per survivor-rig unit at the anchor (1 u = 3.745 mm) */
    scale: scaleAt(cam, ALCOVE.anchor) * ALCOVE.mmPerU,
    cam: s12Cam,
    /** the view direction relative to her: she faces the camera, turned toward screen-left by about this much */
    viewFromFront: 25,
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// The occlusion bridge: a broken slab standing right in front of the lens at the cut (stacked pieces give its trailing
// edge a ragged line); the camera's crab carries it off screen-left.
// ---------------------------------------------------------------------------------------------------------------
const BRIDGE_Z = 18; // mm from the lens to the slab face at the cut
const OCC: ChunkDef[] = (() => {
  const p = s12CamParts(S12_F0);
  // horizontal camera axes at the cut
  const fwd = add(mul(RF, Math.cos(p.yaw)), mul(RR, Math.sin(p.yaw)));
  const right: V3 = [-fwd[2], 0, fwd[0]];
  const yawW = Math.atan2(-fwd[2], fwd[0]);
  const eye = rw(p.a, p.b, 0);
  // trailing edge (local z, the camera's right) so that the edge is just right of frame for two frames, then wipes
  // the edge leaves the right of frame when the crab has moved this far (the frame half-width at the slab is
  // 540 / f * Z); it then crosses 1080 px at ~97 px per frame
  const halfW = (540 / S12_FOCAL) * (BRIDGE_Z + 2);
  const zEdge = halfW + V_LAT * 1.6;
  const pieces: [number, number, number, number][] = [
    // y0, h, edge offset, seed
    [0, 64, 2.2, 1],
    [64, 52, -1.6, 2],
    [116, 60, 1.0, 3],
    [176, 70, -0.6, 4],
  ];
  return pieces.map(([y0, h, de, sd]) => {
    const e = zEdge + de;
    const outline: [number, number][] = [
      [0, -260], [0, e - 1.2], [3, e + 0.6], [9, e - 0.4], [16, e + 0.9], [26, e], [34, e - 2], [34, -260],
    ];
    const c = add(add(eye, mul(fwd, BRIDGE_Z)), [0, y0, 0]);
    return {key: `occ${sd}`, w: c, yaw: yawW, outline, h: h, k: 1, seed: 900 + sd, tone: RUB.concreteDeep, tex: 1.4, chips: 3} as ChunkDef;
  }).map((d) => ({...d, w: add(d.w!, mul(right, 0))}));
})();
/** the bridge slab is lit only by the dim passage light */
const OCC_LIGHTS: Lights = {amb: 0.62, beams: [], glows: []};

// ---------------------------------------------------------------------------------------------------------------
// Placeholder person (dev renders only): neutral shapes at the alcove anchors
// ---------------------------------------------------------------------------------------------------------------
export const PersonPlaceholder: React.FC<{cam: Cam}> = ({cam}) => {
  const cap = (a: V3, b: V3, r: number, k: number) => {
    const p = proj(cam, a), q = proj(cam, b);
    const w = 2 * r * scaleAt(cam, a);
    return <path key={k} d={`M${fmt(p[0])} ${fmt(p[1])} L${fmt(q[0])} ${fmt(q[1])}`} stroke="#8D949C" strokeWidth={fmt(w)} strokeLinecap="round" />;
  };
  const A = ALCOVE;
  const h = proj(cam, A.head);
  const hr = A.headR * scaleAt(cam, A.head);
  const sh = A.shoulders, el = A.elbows, wr = A.wrists;
  return (
    <g opacity={0.92}>
      {cap(A.pelvis, mul(add(sh[0], sh[1]), 0.5), 150, 0)}
      {cap(sh[0], sh[1], 70, 1)}
      {cap(sh[0], el[0], 56, 2)}
      {cap(sh[1], el[1], 56, 3)}
      {cap(el[0], wr[0], 56, 4)}
      {cap(el[1], wr[1], 56, 5)}
      {cap(wr[0], add(wr[0], [70, -20, -10]), 50, 6)}
      {cap(wr[1], add(wr[1], [70, -20, 10]), 50, 7)}
      <circle cx={fmt(h[0])} cy={fmt(h[1])} r={fmt(hr)} fill="#9AA1A8" stroke="#172B3A" strokeWidth={3} />
    </g>
  );
};

type Item = {z: number; el: React.ReactNode};
export const S12: React.FC<ShotProps & {person?: (cam: Cam) => React.ReactNode; k?: string}> = ({f, person, k = ''}) => {
  const t = f / FPS;
  const cam = s12Cam(f);
  const id = `s12${k}`;
  const L = RUBBLE_LIGHTS;
  const {pose} = s12Medic(t);
  // items behind the person (the alcove's back), sorted far to near
  const back: Item[] = ALCOVE_BACK.map((d) => ({z: chunkDepth(cam, d), el: <Chunk key={d.key} cam={cam} d={d} L={L} id={`${id}${d.key}`} />}));
  back.sort((p, q) => q.z - p.z);
  // the passage and forecourt: walls, pebbles, rebar, the insect, the passage beam
  const front: Item[] = [];
  for (const d of [...WALLS, ...PEBBLES]) {
    if (depth(cam, rw(d.a!, d.b!, 0)) < -120) continue;
    front.push({z: chunkDepth(cam, d), el: <Chunk key={d.key} cam={cam} d={d} L={L} id={`${id}${d.key}`} />});
  }
  for (const d of REBAR) front.push({z: rebarDepth(cam, d), el: <Rebar key={d.key} cam={cam} d={d} L={L} />});
  const lInsect = Math.min(1.05, 0.15 + 0.85 * Math.min(1, (L.amb + 0.25 * (pose.frame.o ? 0 : 0) + (lightAtInsect(pose.frame.o)))));
  front.push({
    z: depth(cam, pose.frame.o) - 22,
    el: (
      <g key="medic" filter={`url(#${id}-ex)`}>
        <Roach pose={pose} cam={cam} o={{id: `${id}r`, shadowAlpha: 0.55, gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={{kind: 'injector', loaded: true, latched: true}} />}} />
      </g>
    ),
  });
  front.push({
    z: beamDepth(cam, PASSAGE_BEAM),
    el: (
      <g key="pbeam">
        <DustShaft cam={cam} b={PASSAGE_BEAM} id={`${id}pb`} alpha={0.42} />
        <DustMotes cam={cam} id={`${id}pm`} t={t} m={{key: 'pm', box: [add(rw(-330, 20, 0), [-60, 0, -60]), add(rw(-250, 140, 125), [60, 0, 60])], n: 90, seed: 31, drift: [1.5, 2.2, -1.2], L, size: 0.25, ambient: 0.05}} />
      </g>
    ),
  });
  front.sort((p, q) => q.z - p.z);
  const ceil: Item[] = CEILING.map((d) => ({z: depth(cam, rw(d.a!, 0, 100)), el: <Chunk key={d.key} cam={cam} d={d} L={L} id={`${id}${d.key}`} />}));
  ceil.sort((p, q) => q.z - p.z);
  const lf = f - S12_F0;
  const occ = lf <= 24 ? OCC.map((d) => <Chunk key={d.key} cam={cam} d={d} L={OCC_LIGHTS} id={`${id}${d.key}`} />) : null;
  // exposure of the insect: dimmer in the passage than in the lab, warmer near the light
  const ex = clamp(0.62 + 0.38 * lInsect, 0.55, 1.05);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-ex`} x="-50%" y="-50%" width="200%" height="200%">
          <feColorMatrix type="matrix" values={`${fmt(ex)} 0 0 0 ${fmt(0.012)}  0 ${fmt(ex * 0.96)} 0 0 0.006  0 0 ${fmt(ex * 0.88)} 0 0  0 0 0 1 0`} />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={RUB.void} />
      <AirGlow cam={cam} p={[200, 520, 0]} r={900} id={`${id}ag0`} alpha={0.22} color="#E9C99A" />
      <RubbleFloor cam={cam} id={`${id}fl`} L={L} pools={[
        {c: [250, 0, 60], r: 380, color: RUB.day, a: 0.75},
        {c: rw(-268, 82, 0), r: 46, color: RUB.dayHot, a: 0.9, sq: 0.7},
        {c: rw(-60, 0, 0), r: 260, color: '#D8C3A0', a: 0.35},
      ]} grit={[
        {a0: -760, a1: -190, b0: -150, b1: 150, n: 3200, seed: 41, clearB: [-34, 34]},
        {a0: -200, a1: 260, b0: -320, b1: 360, n: 2600, seed: 42, clearB: [-34, 34]},
      ]} />
      {back.map((it) => it.el)}
      <AirGlow cam={cam} p={[120, 480, 20]} r={420} id={`${id}ag1`} alpha={0.2} />
      {person?.(cam)}
      <DustShaft cam={cam} b={ALCOVE_BEAM} id={`${id}ab`} alpha={0.3} toY={0} />
      <DustMotes cam={cam} id={`${id}am`} t={t} m={{key: 'am', box: [[-120, 20, -250], [420, 900, 300]], n: 70, seed: 37, drift: [-2, 3, 1.5], L, size: 0.9, ambient: 0.04}} />
      {ceil.map((it) => it.el)}
      {front.map((it) => it.el)}
      {occ}
    </svg>
  );
};
const lightAtInsect = (p: V3) => {
  const L = RUBBLE_LIGHTS;
  let l = 0;
  for (const g of L.glows) l += g.k * Math.exp(-((Math.hypot(p[0] - g.p[0], p[1] + 12 - g.p[1], p[2] - g.p[2]) / g.r) ** 2));
  return l;
};
