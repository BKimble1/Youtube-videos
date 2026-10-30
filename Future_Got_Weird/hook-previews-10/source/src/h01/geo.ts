// HOOK 01 geometry. One 3D model, one perspective camera (shared/three.ts), every part projected through it, so the
// push-in, the low side orbit for the cutaway and the return all read from the same model.
//
// Fish-local coordinates, in millimetres: fx forward (toward the snout), fy to the fish's left (the side that faces the
// camera), fz up. The origin sits on the floor of the mouth under the parasite's middle. World: x = -fx (the fish faces
// screen-left at the default camera), y = -fy, z = fz.
import {Basis, proj, V2, V3} from '../shared/three';

export type Ctx = {B: Basis; fish: FishPose};
export type FishPose = {alpha: number; prot: number; bob: V3; yaw: number; pitch: number};

const R = Math.PI / 180;

/** hinge of the lower jaw (fx, fz) */
export const HINGE = {fx: -22, fz: 1.0};

/** fish-local -> world, with the fish's own slow bob and sway */
export const fw = (F: FishPose, p: V3): V3 => {
  // small yaw/pitch of the whole fish about a point behind the eye
  const cx = -40, cz = 20;
  let x = p[0] - cx, y = p[1], z = p[2] - cz;
  const cp = Math.cos(F.pitch * R), sp = Math.sin(F.pitch * R);
  [x, z] = [x * cp - z * sp, x * sp + z * cp];
  const cy = Math.cos(F.yaw * R), sy = Math.sin(F.yaw * R);
  [x, y] = [x * cy - y * sy, x * sy + y * cy];
  x += cx; z += cz;
  return [-x + F.bob[0], -y + F.bob[1], z + F.bob[2]];
};

/** rotate a closed-jaw point about the hinge: the front drops by angle a (deg) */
export const jawRot = (p: V3, a: number): V3 => {
  const c = Math.cos(a * R), s = Math.sin(a * R);
  const dx = p[0] - HINGE.fx, dz = p[2] - HINGE.fz;
  return [HINGE.fx + dx * c + dz * s, p[1], HINGE.fz - dx * s + dz * c];
};

/** project a fish-local point */
export const P = (C: Ctx, p: V3) => proj(C.B, fw(C.fish, p));
/** project a lower-jaw-local point (closed-jaw coordinates) */
export const PJ = (C: Ctx, p: V3) => proj(C.B, fw(C.fish, jawRot(p, C.fish.alpha)));

export const f2 = (n: number) => n.toFixed(2);
export const pts2d = (a: V2[]) => a.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ');
export const poly = (a: V2[]) => (a.length ? `M${pts2d(a).replace(/ /g, ' L')} Z` : '');
export const line = (a: V2[]) => (a.length ? `M${pts2d(a).replace(/ /g, ' L')}` : '');

/** screen-space unit normal of a world-ish surface: >0 when the fish-local normal n at p faces the camera */
export const facing = (C: Ctx, p: V3, n: V3, jaw = false) => {
  const a = jaw ? jawRot(p, C.fish.alpha) : p;
  const b = jaw ? jawRot([p[0] + n[0], p[1] + n[1], p[2] + n[2]], C.fish.alpha) : [p[0] + n[0], p[1] + n[1], p[2] + n[2]] as V3;
  const wa = fw(C.fish, a), wb = fw(C.fish, b as V3);
  const nn: V3 = [wb[0] - wa[0], wb[1] - wa[1], wb[2] - wa[2]];
  const e = C.B.eye;
  const v: V3 = [e[0] - wa[0], e[1] - wa[1], e[2] - wa[2]];
  return nn[0] * v[0] + nn[1] * v[1] + nn[2] * v[2];
};
