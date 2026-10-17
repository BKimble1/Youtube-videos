// Figures in the R2 engine: a Crew member placed in the world (feet on the ground, a heading), drawn by the 2D rig as
// a depth-sorted sprite with the camera's yaw/pitch, perspective scale, the scene's sun/rim/fire/haze, and hand/foot
// targets given in WORLD coordinates (a machine's arm, another person's wrist, a knob, planted footholds).
import React from 'react';
import {V3, add3, sub3, mul3, dot3, norm3, cross3, rad, clamp} from '../../kit/math';
import {View, figureView, project, SpriteItem, SpriteCtx} from '../engine';
import {Figure, FigProps, FigLight, figureParts, solve2, Rig2, Loc, ArmT, LegT, THIGH, SHIN} from './figure';
import {Look} from './looks';
import {mix, hex} from '../engine/color';

export type FigFrame = {
  pos: V3; heading: number;
  x: number; y: number; k: number; s: number; yaw: number; pitch: number; rot: number;
  /** horizontal right (screen) and horizontal toward-camera at the figure, world */
  Rh: V3; Ch: V3;
};

/** The figure's drawing frame for this view. */
export const figFrame = (view: View, pos: V3, heading: number): FigFrame => {
  const fv = figureView(view, pos, heading);
  let Ch = sub3(view.pos, pos);
  Ch = {x: Ch.x, y: 0, z: Ch.z};
  if (Math.hypot(Ch.x, Ch.z) < 1e-4) Ch = {x: -view.f.x, y: 0, z: -view.f.z};
  Ch = norm3(Ch);
  const Rh = norm3(cross3({x: 0, y: 1, z: 0}, Ch));
  // keep the figure's vertical on the scene's vertical (perspective convergence, camera roll)
  const a = project(view, pos), b = project(view, add3(pos, {x: 0, y: 1.4, z: 0}));
  const rot = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
  return {pos, heading, x: fv.x, y: fv.y, k: fv.k, s: fv.s250, yaw: fv.yaw, pitch: fv.pitch, rot, Rh, Ch};
};

/** World point → the rig's solve frame (unpitched: x right, y down, z toward the camera), absolute pixels. */
export const worldToRig = (F: FigFrame, p: V3): V3 => {
  const d = sub3(p, F.pos);
  return {x: F.x + dot3(d, F.Rh) * F.k, y: F.y - d.y * F.k, z: dot3(d, F.Ch) * F.k};
};
/** A world DIRECTION → the rig's unpitched drawing frame (x screen right, y down, z toward the camera). */
export const dirToRig = (F: FigFrame, d: V3): V3 => ({x: dot3(d, F.Rh), y: -d.y, z: dot3(d, F.Ch)});
/** A point of the DRAWN rig (after pitch and screen rotation) → world. */
export const rigToWorld = (F: FigFrame, q: V3): V3 => {
  const rr = rad(F.rot), cr = Math.cos(rr), sr = Math.sin(rr);
  const dx = q.x - F.x, dy = q.y - F.y;
  // undo the screen rotation
  const x1 = dx * cr + dy * sr, y1 = -dx * sr + dy * cr, z1 = q.z;
  // undo the pitch
  const ph = rad(F.pitch), c = Math.cos(ph), s = Math.sin(ph);
  const y0 = y1 * c - z1 * s, z0 = y1 * s + z1 * c;
  return add3(F.pos, add3(add3(mul3(F.Rh, x1 / F.k), {x: 0, y: -y0 / F.k, z: 0}), mul3(F.Ch, z0 / F.k)));
};

/** Scene light → the figure's light (drawn frame). */
export const figLight = (c: SpriteCtx, F: FigFrame, o: {key?: number; rim?: number; fire?: number} = {}): FigLight => {
  const L = c.light;
  const sun = L.sun;
  const x = dot3(sun, F.Rh), y = -sun.y, z = dot3(sun, F.Ch);
  const ph = rad(F.pitch), cp = Math.cos(ph), sp = Math.sin(ph);
  const y1 = y * cp + z * sp, z1 = -y * sp + z * cp;
  const rr = rad(F.rot), cr = Math.cos(rr), sr = Math.sin(rr);
  const dir = norm3({x: x * cr - y1 * sr, y: x * sr + y1 * cr, z: z1});
  return {
    dir,
    key: o.key ?? 0.9,
    shadowC: mix(L.ambient, '#101420', 0.35),
    rimC: mix(L.sunColor, '#FFFFFF', 0.25),
    rim: o.rim ?? 1,
    fire: (o.fire ?? 1) * clamp(c.lit.fire),
    fireC: hex(c.lit.fireColor),
    fog: c.lit.fog,
    fogC: L.fogColor,
  };
};

/** A hand's orientation in the world (a palm planted on the ground: palm (0,-1,0), fingers along the ground). */
export type WorldOrient = {fingers?: V3; palm?: V3; w?: number};
export type WorldTargets = {handL?: V3; handR?: V3; footL?: V3; footR?: V3; poleL?: Loc; poleR?: Loc; orientL?: WorldOrient; orientR?: WorldOrient};

export type FigSpec = {
  key: string;
  look: Look;
  /** animation time (breath, blinks) */
  t: number;
  seed?: number;
  /** feet centre on the ground (world, metres) */
  pos: V3;
  /** facing, degrees (0 north, 90 east) */
  heading: number;
  /** the pose (body-local), or a function of the drawing frame (to build world-target poses) */
  pose?: Partial<FigProps> | ((F: FigFrame) => Partial<FigProps>);
  /** hand / foot targets in world coordinates (override the pose's) */
  world?: WorldTargets;
  /** depth bias (m) */
  bias?: number;
  /** scene lighting on the figure (default on) */
  lit?: boolean;
  /** called with the solved rig and frame (export world points for FX) */
  onRig?: (r: Rig2, F: FigFrame) => void;
  inkPx?: number;
  /** lower the pelvis when a world foot target is out of the legs' reach (default true; a foot on lower ground) */
  reach?: boolean;
};

// a world target overrides the pose's limb target at full weight (a pose's `w` only fades its own local targets)
const armWorld = (F: FigFrame, a: ArmT | undefined, w: V3 | undefined, o?: WorldOrient): ArmT | undefined => {
  const t = w ? {...(a ?? {}), abs: worldToRig(F, w), local: undefined, w: undefined} : a;
  if (!o || (!o.fingers && !o.palm)) return t;
  return {...(t ?? {}), fingersAbs: o.fingers ? dirToRig(F, o.fingers) : undefined, palmAbs: o.palm ? dirToRig(F, o.palm) : undefined, orientW: o.w ?? 1};
};
const legWorld = (F: FigFrame, a: LegT | undefined, w: V3 | undefined): LegT | undefined => (w ? {...(a ?? {}), abs: worldToRig(F, w), local: undefined, w: undefined} : a);

/** Build the FigProps for a spec in a view (used by the sprite and by `figureRig`). */
export const figProps = (view: View, spec: FigSpec, F?: FigFrame): {F: FigFrame; props: FigProps} => {
  const Fr = F ?? figFrame(view, spec.pos, spec.heading);
  const base = typeof spec.pose === 'function' ? spec.pose(Fr) : spec.pose ?? {};
  const w = spec.world ?? {};
  const props: FigProps = {
    ...base,
    look: spec.look, t: spec.t, seed: spec.seed ?? 1, id: spec.key,
    x: Fr.x, y: Fr.y, s: Fr.s, yaw: Fr.yaw + (base.yaw ?? 0), pitch: Fr.pitch, rot: Fr.rot,
    ink: spec.inkPx ?? clamp(Fr.s * 4, 0.9, 5.5),
    armL: armWorld(Fr, base.armL, w.handL, w.orientL), armR: armWorld(Fr, base.armR, w.handR, w.orientR),
    legL: legWorld(Fr, base.legL, w.footL), legR: legWorld(Fr, base.legR, w.footR),
  };
  if (spec.reach !== false && (w.footL || w.footR)) {
    // a planted foot below the root (downhill, a step off a slab) would leave the leg straight and the foot hanging:
    // drop the pelvis just enough that the farther foot is reached with a 1.5% bend left in the knee
    const r0 = solve2(props);
    const reach = ((THIGH + SHIN) / 251.4) * 0.985;
    let need = 0;
    ([w.footL, w.footR] as (V3 | undefined)[]).forEach((T, i) => {
      if (!T) return;
      const H = rigToWorld(Fr, r0.hip[i]);
      const hz = Math.hypot(H.x - T.x, H.z - T.z), dy = H.y - T.y;
      if (hz * hz + dy * dy > reach * reach) need = Math.max(need, dy - Math.sqrt(Math.max(0, reach * reach - hz * hz)));
    });
    if (need > 0.002) props.drop = (props.drop ?? 0) + need * 251.4;
  }
  return {F: Fr, props};
};

/** The solved rig in this view (for world points: hands, head, prop tips) without drawing. */
export const figureRig = (view: View, spec: FigSpec) => {
  const {F, props} = figProps(view, spec);
  const {rig} = figureParts(props);
  const W = (q: V3) => rigToWorld(F, q);
  return {rig, F, W, handL: W(rig.hands[0].pos), handR: W(rig.hands[1].pos), head: W(rig.headC), chest: W(rig.loc({r: 0, u: 255, f: 20}))};
};

export const figureSprite = (spec: FigSpec): SpriteItem => ({
  kind: 'sprite',
  key: spec.key,
  pos: spec.pos,
  bias: spec.bias,
  draw: (c) => {
    const {F, props} = figProps(c.view, spec);
    if (F.k < 0.4) return null; // smaller than a pixel per metre: not drawn (LOD handled by callers)
    const light = spec.lit === false ? undefined : figLight(c, F);
    const p2 = {...props, light};
    if (spec.onRig) spec.onRig(figureParts(p2).rig, F);
    return <Figure {...p2} />;
  },
});
