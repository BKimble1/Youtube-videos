// S12 (21.83-25.27 s) "beneath collapsed buildings, carrying emergency medicine." The proposed future application, in
// the rubble at insect height (the integrator draws the "Future rescue concept" identifier top-left, frames 658-741).
// It opens on the occlusion bridge from S11: a broken concrete slab right at the lens covers the frame for the first two
// frames and, still travelling screen-left like S11's foam block (the camera is crabbing right at the same speed), its
// ragged trailing edge wipes off to the left and uncovers the passage. The crab turns into one steady forward glide at
// insect height behind and above the medic (loaded injector, latched), which walks out of the low passage under the
// fallen slab toward the daylit opening: walls and pebbles stream past the frame edges, dust drifts in a narrow shaft
// through a crack on the right. The camera sinks as it nears the slab's lip and tilts up; on "emergency medicine" the
// lip rises out of the top of the frame and the alcove opens: the insect walks on toward a person lying in the light
// (composited by the integrator through the `person` slot; S12_PERSON). Ends with the insect where the alcove walk
// (shots/alcoveWorld.ts) has it at the cut, ~230 mm short of the gap, under S13's camera.
import React from 'react';
import {Cam, lookAt, proj, depth, scaleAt} from '../lib/cam';
import {V3, add, mul} from '../lib/v3';
import {clamp, lerp, smoother, ramp, sr, rnd} from '../lib/ease';
import {poseRoach, Path} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {fmt} from '../lib/g3';
import {ShotProps} from './index';
import {FPS, DUR} from '../timeline';
import {SHOT_FRAMES} from '../cuts';
import {alcovePieces, ALCOVE as ALC_SPEC} from '../sets/Alcove';
import {alcoveInsect} from './alcoveWorld';
import {RUB, RF, RR, rw, toRoute, ROUTE_YAW, PERSON, GAP, TIPS, DAY, Chunk, ChunkDef, Lights, RUBBLE_LIGHTS, lightAt, RubblePassage, RubbleItem} from '../sets/Rubble';

const cutAt = (id: string) => SHOT_FRAMES.find(([k]) => k === id)![1];
export const S12_F0 = cutAt('S12');
export const S12_F1 = cutAt('S13');
const N = S12_F1 - S12_F0;
const T1 = S12_F1 / FPS;

// ---------------------------------------------------------------------------------------------------------------
// The medic's walk: on the alcove walk's own path (so the pose at the cut is exactly the one S13 continues from), at an
// even 60 mm/s, ending at the walk's arc length for the cut.
// ---------------------------------------------------------------------------------------------------------------
export const S12_SPEED = 60;
const WALK = alcoveInsect(T1);
export const S12_PATH: Path = WALK.path;
/** arc length along S12_PATH at film time t */
export const s12S = (t: number) => WALK.s + S12_SPEED * (t - T1);
export const s12Medic = (t: number) => {
  const s = s12S(t);
  // the alcove walk's antenna and search settings, on its clock (loop time), so the pose is continuous into S13
  const pose = poseRoach({path: S12_PATH, s, t: t - DUR, search: 0.9, antL: {yaw: 0.55}, antR: {yaw: 0.6}});
  return {pose, s};
};
/** the route coordinate (a) of the insect's body at film time t */
export const s12InsectA = (t: number) => toRoute(S12_PATH(s12S(t)).p)[0];

// ---------------------------------------------------------------------------------------------------------------
// Camera: one continuous move. Crab right (the bridge, matched to S11) turning into a forward glide behind the insect,
// sinking toward the floor and tilting up into the reveal; the forward travel eases in and eases out.
// ---------------------------------------------------------------------------------------------------------------
export const S12_V_LAT = 2.0; // mm per frame at the cut (the bridge edge moves ~100 px per frame, as S11's)
const LAT_HOLD = 12, LAT_END = 30;
const latV = (lf: number) => (lf < LAT_HOLD ? S12_V_LAT : S12_V_LAT * (1 - smoother((lf - LAT_HOLD) / (LAT_END - LAT_HOLD))));
const fwdV = (u: number) => (0.12 + 0.88 * smoother(u / 0.3)) * (1 - 0.95 * smoother((u - 0.45) / 0.55));
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
export const S12_CAM_A: [number, number] = [-588, -470];
const B_END = -40;
const B_START = B_END - TABLE.B[TABLE.steps];
export const S12_FOCAL = 900;
const DEGR = Math.PI / 180;
export const s12CamParts = (f: number) => {
  const lf = clamp(f - S12_F0, 0, N);
  const a = S12_CAM_A[0] + (S12_CAM_A[1] - S12_CAM_A[0]) * (tab(TABLE.A, lf) / TABLE.A[TABLE.steps]);
  const b = B_START + tab(TABLE.B, lf);
  const y = lerp(70, 55, sr(lf, 10, N));
  const pitch = lerp(-16, 6, smoother(ramp(lf, 14, N))) * DEGR;
  const yaw = lerp(15, -4, smoother(ramp(lf, 4, N))) * DEGR;
  return {a, b, y, pitch, yaw};
};
export const s12Cam = (f: number): Cam => {
  const {a, b, y, pitch, yaw} = s12CamParts(f);
  const eye = rw(a, b, y);
  const hdir = add(mul(RF, Math.cos(yaw)), mul(RR, Math.sin(yaw)));
  const dir: V3 = [hdir[0] * Math.cos(pitch), Math.sin(pitch), hdir[2] * Math.cos(pitch)];
  return lookAt(eye, add(eye, mul(dir, 100)), S12_FOCAL, 540, 960);
};

/** For compositing the person (the integrator's job; the shipped shot leaves her space clear): the shot's camera at any
 *  frame, and at the last frame her anchor (the floor point between her elbows = world origin) and near fingertips
 *  (Alcove.tsx ALCOVE.tips) on screen, the rig scale at the anchor (px per survivor-rig unit), the card yaw S13's
 *  yawFor(cam) gives (she faces screen-right, turned a little toward the camera) and the camera's elevation over her
 *  floor. S13.tsx survivorAt(s12Cam(f), f / 30, {id, yaw, elev}) places her for any frame exactly as the alcove shots
 *  do (fingertips pinned on ALCOVE.tips). With the rig placed that way, her shoulders clear the slab's lip at ~700, her
 *  eyes at ~720 and her whole head by ~733; at the last frame her head centre is at about (323, 527), radius ~217 px. */
export const S12_PERSON = (() => {
  const f = S12_F1 - 1;
  const cam = s12Cam(f);
  const an = proj(cam, PERSON.anchor);
  const tp = proj(cam, TIPS);
  return {
    frame: f,
    cam: s12Cam,
    anchor: {x: an[0], y: an[1]},
    tips: {x: tp[0], y: tp[1]},
    scale: scaleAt(cam, PERSON.anchor) * PERSON.mmPerU,
    cardYaw: 90 - (Math.atan2(cam.eye[0] - PERSON.anchor[0], cam.eye[2] - PERSON.anchor[2]) * 180) / Math.PI,
    elev: (Math.atan2(cam.eye[1], Math.hypot(cam.eye[0], cam.eye[2])) * 180) / Math.PI,
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// The occlusion bridge: a broken slab standing on edge right in front of the lens at the cut (its trailing edge ragged
// over its height); the camera's crab carries it off screen-left.
// ---------------------------------------------------------------------------------------------------------------
const BRIDGE_Z = 13; // mm from the lens to the slab face at the cut
export const S12_OCC: ChunkDef[] = (() => {
  const p = s12CamParts(S12_F0);
  const fwd = add(mul(RF, Math.cos(p.yaw)), mul(RR, Math.sin(p.yaw)));
  const yawW = Math.atan2(-fwd[2], fwd[0]);
  const eye = rw(p.a, p.b, 0);
  // the frame's half-width at the slab is 540 / f * Z; the trailing edge starts just beyond it, so the slab covers the
  // frame on the cut frame and the next, then the edge enters at ~108 px per frame (S11's panel leaves at ~104) and
  // speeds up as the glide forward begins (gone by frame 664)
  const halfW = (540 / S12_FOCAL) * (BRIDGE_Z + 1);
  const zEdge = halfW + S12_V_LAT * 1.55;
  // one slab standing on edge: its outline is the face (local x = down, z = camera-right), extruded away from the lens
  // (local y = forward), so the trailing edge can be ragged over its height
  const edge: [number, number][] = [];
  const H = 190;
  for (let k = 0; k <= 16; k++) {
    const yv = (k / 16) * H;
    const j = (rnd(k, 911) - 0.5) * 3.2 + (k % 3 === 1 ? 1.4 : 0) - (k % 5 === 3 ? 1.2 : 0);
    edge.push([-yv, zEdge + j]);
  }
  const outline: [number, number][] = [[0, -70], ...edge, [-H, -70]];
  return [{key: 'occ', w: add(eye, mul(fwd, BRIDGE_Z)), yaw: yawW, pitch: -Math.PI / 2, outline, h: 12, k: 1, seed: 901, tone: RUB.concrete, tex: 2.2, chips: 9, cracks: 0, speckMax: 2600}];
})();
const OCC_LIGHTS: Lights = {amb: 0.8, beams: [], glows: []};

/** the alcove's own pieces (Alcove.tsx), minus any that stand on the route before the gap (its 'beyond' block sits
 *  where the corridor runs) */
export const s12AlcoveItems = (cam: Cam): RubbleItem[] =>
  alcovePieces(cam, {sun: 0.6}).filter((it) => String((it.el as React.ReactElement | null)?.key ?? '') !== 'alc-beyond');

/** S12. `person` is the integrator's compositing slot: called with the shot's camera, drawn behind the alcove pieces
 *  that stand in front of her, the low ceiling, the rubble and the insect, and in front of the alcove's back pieces;
 *  the alcove's daylight shaft is drawn over her. The shipped shot leaves it empty. */
export const S12: React.FC<ShotProps & {person?: (cam: Cam) => React.ReactNode; k?: string}> = ({f, person, k = ''}) => {
  const t = f / FPS;
  const lf = f - S12_F0;
  const cam = s12Cam(f);
  const id = `s12${k}`;
  const {pose} = s12Medic(t);
  // exposure of the insect: dimmer in the passage than in the lab, full in the daylit corridor
  const ex = clamp(0.58 + 0.42 * lightAt(RUBBLE_LIGHTS, add(pose.frame.o, [0, 14, 0])), 0.55, 1.04);
  const medic: RubbleItem = {
    z: depth(cam, pose.frame.o) - 22,
    el: (
      <g key="medic" filter={`url(#${id}-ex)`}>
        <Roach pose={pose} cam={cam} o={{id: `${id}r`, shadowAlpha: 0.55, shadowColor: '#1A1410', gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={{kind: 'injector', loaded: true, latched: true}} />}} />
      </g>
    ),
  };
  const occ = lf <= 26 ? S12_OCC.map((d) => <Chunk key={d.key} cam={cam} d={d} L={OCC_LIGHTS} id={`${id}${d.key}`} />) : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-ex`} x="-50%" y="-50%" width="200%" height="200%">
          <feColorMatrix type="matrix" values={`${fmt(ex)} 0 0 0 0.012  0 ${fmt(ex * 0.97)} 0 0 0.006  0 0 ${fmt(ex * 0.9)} 0 0  0 0 0 1 0`} />
        </filter>
      </defs>
      <RubblePassage cam={cam} id={id} t={t} alcove={s12AlcoveItems(cam)} person={person?.(cam)} items={[medic]} front={occ} />
    </svg>
  );
};

/** dev check: the rubble route (Rubble.tsx copies Alcove.tsx's gap, fingertips and sun) still matches the alcove */
export const s12LayoutCheck = () => {
  const d = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const w = toRoute(S12_PATH(WALK.s).p);
  return {gap: d(GAP, ALC_SPEC.gap), tips: d(TIPS, ALC_SPEC.tips), sun: d(DAY, ALC_SPEC.sun), walkOffRoute: w[1], yaw: ROUTE_YAW};
};
