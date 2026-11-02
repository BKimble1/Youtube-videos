// The close two-shot shared by the opening (0-1.1 s) and the reunion (13.3-14.6 s): the astronaut (left) and his friend
// (right) with the friend's two hands around the astronaut's glove. Same positions, same clasp, same camera: the opening
// is a compressed preview of the reunion. Arms are solved by IK onto the clasp's wrist points, and the clasp is told
// the forearm angles it receives.
import React from 'react';
import {clamp, lerp} from '../lib';
import {AstroPose, Astronaut, astroHandLocal, astroReach, ArmA, Friend, FriendPose, friendHandLocal, GLOVE, reach, SHOULDER_X, SHOULDER_Y, friendStoop, HEAD_Y, HELMET} from '../art/figures';
import {Clasp, claspAttach, CLASP_DEFAULTS, claspSleeve} from './clasp';
import {Expr} from '../art/crew';

export const TS = {s: 0.62, ax: 1163, fx: 1163 + 0.62 * 170, feet: 1630, claspDx: -2, claspY: 238};
export type TwoShotPos = {ax: number; fx: number; feet: number};
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const rot = (x: number, y: number, a: number, cx: number, cy: number) => {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return {x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c};
};

/** world point of the clasp centre */
export const claspCentre = (p: TwoShotPos = TS) => ({x: (p.ax + p.fx) / 2 + TS.claspDx, y: p.feet - TS.s * TS.claspY});
/** the helmet bubble centre in world coords (for framing and the visor reflection) */
export const helmetWorld = (p: TwoShotPos = TS, tilt = 0) => {
  const c = rot(HELMET.cx, HELMET.cy, tilt, 0, 50);
  return {x: p.ax + TS.s * c.x, y: p.feet + TS.s * (HEAD_Y + c.y), r: TS.s * HELMET.r};
};

/** solve the arms onto the clasp (u = 0: arms at rest, 1: clasped) */
export const solveClasp = (age: number, u: number, p: TwoShotPos = TS) => {
  const S = TS.s, c = claspCentre(p);
  const stoop = friendStoop(age);
  // two passes: aim at the default attach points, measure the forearm angles, aim again
  let ang = {...CLASP_DEFAULTS};
  let armR: ArmA = {a: 10, b: 12}, fL: ArmA = {a: 8, b: 10}, fR: ArmA = {a: 8, b: 10};
  for (let pass = 0; pass < 2; pass++) {
    const at = claspAttach(ang.astroAngle, ang.overAngle, ang.underAngle);
    // astronaut right arm (rig side +1): local target
    const aT = {x: (c.x + S * at.astroWrist.x - p.ax) / S, y: (c.y + S * at.astroWrist.y - p.feet) / S};
    armR = astroReach(aT.x, aT.y, 1, 1);
    const PA = astroHandLocal(armR, 1);
    const aAng = deg(Math.atan2(PA.ey - PA.hy, PA.ex - PA.hx));
    // friend (facing -1, drawn unmirrored, stoop-rotated by -stoop about (0,-150))
    const toF = (wx: number, wy: number) => rot((wx - p.fx) / S, (wy - p.feet) / S, stoop, 0, -150);
    const s01 = clamp((age - 0.45) / 0.55);
    const shX = SHOULDER_X - 4 * s01, shY = SHOULDER_Y + 10 * s01;
    const oT = toF(c.x + S * at.overWrist.x, c.y + S * at.overWrist.y);
    const uT = toF(c.x + S * at.underWrist.x, c.y + S * at.underWrist.y);
    fL = reach(oT.x, oT.y, -1, -1, shX, shY);
    fR = reach(uT.x, uT.y, 1, 1, shX, shY);
    const PO = friendHandLocal(fL, -1, age), PU = friendHandLocal(fR, 1, age);
    const wo = (P: {ex: number; ey: number; hx: number; hy: number}) => {
      const e = rot(P.ex, P.ey, -stoop, 0, -150), h = rot(P.hx, P.hy, -stoop, 0, -150);
      return deg(Math.atan2(e.y - h.y, e.x - h.x));
    };
    const lim = (v: number, d: number) => clamp(v, d - 15, d + 15);
    ang = {astroAngle: lim(((aAng % 360) + 360) % 360, CLASP_DEFAULTS.astroAngle), overAngle: lim(wo(PO), CLASP_DEFAULTS.overAngle), underAngle: lim(wo(PU), CLASP_DEFAULTS.underAngle)};
  }
  const mixA = (a: ArmA, b: ArmA): ArmA => ({a: lerp(a.a, b.a, u), b: lerp(a.b, b.b, u)});
  return {
    armR: mixA({a: 10, b: 12}, armR),
    fL: mixA({a: 6, b: 8}, fL),
    fR: mixA({a: 6, b: 8}, fR),
    ang, c,
  };
};

export const TwoShot: React.FC<{
  age: number; id: string; frame: number; clasp?: number; squeeze?: number; p?: TwoShotPos;
  astroE?: Expr; friendE?: Expr; tilt?: number; reflection?: React.ReactNode; reflOpacity?: number;
  friendArmR?: ArmA; // override (the gesture to the door)
}> = ({age, id, frame, clasp = 1, squeeze = 0, p = TS, astroE, friendE, tilt = 0, reflection, reflOpacity = 0, friendArmR}) => {
  const sol = solveClasp(age, clasp, p);
  const S = TS.s;
  const joined = clasp > 0.98 && !friendArmR;
  const sl = claspSleeve(age);
  const aPose: AstroPose = {armL: {a: 10, b: 12}, armR: sol.armR, e: astroE, tilt};
  const fPose: FriendPose = {armL: sol.fL, armR: friendArmR ?? sol.fR, e: friendE};
  return (
    <g>
      <g transform={`translate(${p.ax} ${p.feet}) scale(${S})`}>
        <Astronaut pose={aPose} id={`${id}as`} frame={frame} glove={GLOVE} hideHands={joined ? 'R' : undefined} watchEl={() => null} reflection={reflection} reflOpacity={reflOpacity} />
      </g>
      <g transform={`translate(${p.fx} ${p.feet}) scale(${S})`}>
        <Friend age={age} pose={fPose} id={`${id}fr`} facing={-1} green hideHands={joined ? 'both' : friendArmR ? 'L' : undefined} forearm={sl.sleeve} sleeveC={sl.sleeve} />
      </g>
      {joined && (
        <g transform={`translate(${sol.c.x} ${sol.c.y}) scale(${S})`}>
          <Clasp age={age} id={`${id}cl`} astroAngle={sol.ang.astroAngle} overAngle={sol.ang.overAngle} underAngle={sol.ang.underAngle} squeeze={squeeze} />
        </g>
      )}
    </g>
  );
};
