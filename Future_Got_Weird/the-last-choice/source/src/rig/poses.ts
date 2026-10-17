// Pose builders on top of the rig: walking/running/limping figures with planted feet, and common holds.
import {ActorProps} from './actor';
import {gait, GaitOpts} from './gait';
import {Look} from './looks';

export type Move = {x0: number; dist: number; dir: 1 | -1; ground: number; gait: Omit<GaitOpts, 's'>};

/** A figure travelling along the ground: pelvis at x0 + dir·dist, feet from the gait, arms swinging. */
export const walker = (look: Look, m: Move, base: Partial<ActorProps> & {t: number; s?: number}): ActorProps => {
  const s = base.s ?? 1;
  const g = gait(m.x0, m.dist, m.dir, {...m.gait, s});
  const footY = (f: {lift: number}) => m.ground - 10 * s - f.lift;
  const swing = (a: number) => ({fwd: a, out: 7, bend: 16 + Math.max(0, a) * 0.9 + (m.gait.stride > 170 ? 60 : 0)});
  return {
    look,
    x: m.x0 + m.dir * m.dist,
    y: m.ground,
    yaw: m.dir * 90,
    drop: g.drop + (m.gait.stride > 170 ? 14 : 0),
    side: g.side,
    lean: m.gait.stride > 170 ? 12 : 3,
    legL: {foot: {x: g.L.x, y: footY(g.L)}, pitch: g.L.pitch},
    legR: {foot: {x: g.R.x, y: footY(g.R)}, pitch: g.R.pitch},
    armL: {fk: swing(g.armL)},
    armR: {fk: swing(g.armR)},
    ...base,
  } as ActorProps;
};
export {gait};

/**
 * Lying on the back on a surface at height ySurf (world), seen from the side, head toward headDir (-1 = screen left).
 * Returns the props for a standing-relative pose that the whole-body roll turns horizontal.
 */
export const lying = (look: Look, x: number, ySurf: number, headDir: 1 | -1, base: Partial<ActorProps> & {t: number; s?: number}): ActorProps => {
  const s = base.s ?? 1;
  // standing figure faces up after a roll of -90 (head to the left) when yaw = +90 (face toward screen right → up)
  const pelvisH = 165 * s;
  const yaw = headDir === -1 ? 90 : -90;
  const roll = headDir === -1 ? -90 : 90; // SVG rotate: -90 turns a right-facing figure face-up with the head on the left
  // the body's back (depth ~36) rests on the surface: after the roll the pelvis sits 36·s above it
  const P = {x, y: ySurf - 38 * s};
  return {
    look, x: P.x, y: P.y + pelvisH, yaw, roll, rollPivot: P, shadow: false,
    ...base,
  } as ActorProps;
};
