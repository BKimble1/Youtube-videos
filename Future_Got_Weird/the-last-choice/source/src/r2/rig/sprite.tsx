// Figures in the R2 engine: a Crew member placed in the world (feet on the ground, a heading), drawn by the 2D rig as
// a depth-sorted sprite with the camera's yaw/pitch, perspective scale, the scene's sun/rim/fire/haze, and hand/foot
// targets given in WORLD coordinates (a machine's arm, another person's wrist, a knob, planted footholds).
import React from 'react';
import {V3, add3, sub3, mul3, dot3, norm3, cross3, rad, clamp, lerp3} from '../../kit/math';
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
    ink: spec.inkPx ?? clamp(Fr.s * 4, 0.9, 8), // close-ups keep a bolder line (capped so it never smothers a face)
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
  return {
    rig, F, W, handL: W(rig.hands[0].pos), handR: W(rig.hands[1].pos), head: W(rig.headC),
    chest: W(rig.torso({r: 0, u: 90, f: 20})),
    /** a world point on the torso (pelvis-relative, torso frame; see Rig2.torso) */
    torso: (l: Loc) => W(rig.torso(l)),
    /** a world point on the body (root-relative; see Rig2.loc) */
    body: (l: Loc) => W(rig.loc(l)),
  };
};

// ------------------------------------------------------------------ two-person contact: the support hierarchy
// One body is the PARENT (solved first, on its own pose); the other's contact limbs are CHILDREN placed on world
// points of the solved parent, every frame. For a catch the dependency runs both ways, resolved in this order:
//   1. the catcher's body (parent of the support): posed alone; its cradle point is where a falling back can rest;
//   2. the faller (parent of the contact): follows its own fall until its back reaches the cradle, then rests on it
//      (its bodyPitch is limited by bisection on the solved rig, so it never passes through the catcher);
//   3. the catcher's hands (children): placed on the faller's solved back, fading in with the contact.
// A hand on a shoulder is the simple case: the shoulder's owner is the parent, the reaching hand the child.

const withPose = (spec: FigSpec, over: Partial<FigProps>): FigSpec => {
  const p = spec.pose;
  return {...spec, pose: typeof p === 'function' ? (F: FigFrame) => ({...p(F), ...over}) : {...(p ?? {}), ...over}};
};

/** Place `reacher`'s hand on a point of `owner`'s solved body (torso frame Loc), fading in with w. */
export const handOn = (view: View, owner: FigSpec, at: Loc, reacher: FigSpec, side: 'L' | 'R', w: number, orient?: WorldOrient): FigSpec => {
  if (w <= 0) return reacher;
  const o = figureRig(view, owner);
  const target = o.torso(at);
  const free = figureRig(view, reacher);
  const from = side === 'L' ? free.handL : free.handR;
  const hand = lerp3(from, target, clamp(w));
  const world = {...(reacher.world ?? {}), ...(side === 'L' ? {handL: hand, orientL: orient && {...orient, w: (orient.w ?? 1) * clamp(w)}} : {handR: hand, orientR: orient && {...orient, w: (orient.w ?? 1) * clamp(w)}})};
  return {...reacher, world};
};

export type CatchOut = {faller: FigSpec; catcher: FigSpec; contact: number; pitch: number};
/**
 * A catch from behind. `faller` falls backward on its own pose (negative bodyPitch); `catcher` stands behind it.
 * Returns both specs with the support applied: the faller's pitch stops where its back meets the catcher's cradle,
 * and the catcher's hands sit on the faller's back (weight `w`, e.g. a reaction delay).
 */
export const supportCatch = (view: View, faller: FigSpec, catcher: FigSpec, o: {cradle?: Loc; backL?: Loc; backR?: Loc; w?: number} = {}): CatchOut => {
  const cradleL = o.cradle ?? {r: 0, u: 90, f: 64};
  const backL = o.backL ?? {r: -34, u: 84, f: -40}, backR = o.backR ?? {r: 30, u: 66, f: -40};
  const C0 = figureRig(view, catcher);
  const cradle = C0.torso(cradleL);
  const bk = headingDir(faller.heading + 180);
  const Ff = figFrame(view, faller.pos, faller.heading);
  const base = figProps(view, faller, Ff).props;
  const want = base.bodyPitch ?? 0;
  // the faller's back profile (low back, shoulder blades, back of the head) against the plane of the catcher's
  // cradle, facing the faller: the deepest point decides
  const BACK: Loc[] = [{r: 0, u: 40, f: -40}, {r: 0, u: 95, f: -40}, {r: 0, u: 130, f: -34}, {r: 0, u: 205, f: -40}];
  const pen = (pitch: number) => {
    const r = solve2({...base, bodyPitch: pitch});
    return Math.max(...BACK.map((l) => dot3(sub3(rigToWorld(Ff, r.torso(l)), cradle), bk))); // > 0: past the cradle
  };
  let pitch = want, contact = 0;
  if (want < 0 && pen(want) > 0) {
    let lo = 0, hi = want; // pitch in [want, 0]; pen(lo) <= 0 assumed (standing does not touch)
    if (pen(0) > 0) { pitch = 0; contact = 1; }
    else {
      for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (pen(m) > 0) hi = m; else lo = m; }
      pitch = lo; contact = 1;
    }
  }
  const f2 = contact ? withPose(faller, {bodyPitch: pitch}) : faller;
  const w = clamp(o.w ?? contact);
  let c2 = catcher;
  if (w > 0) {
    const R = figureRig(view, f2);
    const tL = R.torso(backL), tR = R.torso(backR);
    const palm = norm3(sub3(R.torso({r: 0, u: 75, f: 0}), R.torso({r: 0, u: 75, f: -40})));
    c2 = {...catcher, world: {...(catcher.world ?? {}), handL: lerp3(C0.handL, tL, w), handR: lerp3(C0.handR, tR, w),
      orientL: {palm, w}, orientR: {palm, w}}};
  }
  return {faller: f2, catcher: c2, contact, pitch};
};
const headingDir = (h: number): V3 => ({x: Math.sin(rad(h)), y: 0, z: -Math.cos(rad(h))});

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
