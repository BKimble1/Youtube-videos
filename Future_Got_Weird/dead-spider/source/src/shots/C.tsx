// Shot C (4.10 - 12.17): how a living spider extends its legs, as an illustration (a pale cutaway with the hemolymph
// showing), not the specimen. It opens on the same camera and the same open silhouette as the end of shot A (an editorial
// match: the needle, pad and hand are gone and the body turns to a cutaway), then:
// - "spiders use pressure inside their bodies": muscles in the front body section squeeze its fluid space; the fluid
//   brightens and runs out along the legs;
// - "to extend their legs": the camera follows the fluid down one leg to the femur-patella joint, which has no extensor
//   muscle: the pressure inflates the joint membrane and the joint straightens;
// - "When they die, that pressure drops": the flow stops, the fluid dims and thins, the membrane slackens (the loss of
//   pressure comes first);
// - "causing the legs to curl inward": the flexor muscle, now unopposed, folds the joint; the camera pulls back along
//   the leg to the whole spider, every leg curling.
import React from 'react';
import {mix} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, keyS, lerp, ss, ss5} from '../lib';
import {Item} from '../draw3';
import {LOOK_CUT, spiderItems} from '../SpiderDraw';
import {legLocal, SpiderPose, toWorld} from '../spider';
import {basis, Basis, lerpOrbit, Orbit, orbitCam, proj, toOrbit, V2, V3} from '../three';
import {A_YAW, CUT, LAG, TM} from '../world';
import {camA} from './A';
import {Scene} from './common';

export const FLUID = '#43BFD8';
const FLUID_DIM = '#8FA9B1';
export const C_LEG = 4; // right leg I: from this side it lies across the view, so its joint is seen side-on
const BODY: V3 = [0, 0, 3.6];

/** the commanded extension of the living spider in the illustration */
const cExt = (t: number) => keyS(t, [[CUT.cutaway, 0.97], [TM.youSee + 0.3, 0.8], [TM.extend - 0.15, 0.8], [TM.extend + 0.55, 1], [TM.curl - 0.75, 1], [TM.inward + 0.05, 0]]);
export const cPose = (t: number): SpiderPose => ({pos: BODY, yaw: A_YAW, e: LAG.map((l) => cExt(t - l * 1.5))});
/** fluid state */
const pressure = (t: number) => keyS(t, [[CUT.cutaway, 0.55], [TM.pressure1 - 0.1, 0.55], [TM.pressure1 + 0.45, 1], [TM.drops - 0.15, 1], [TM.drops + 0.5, 0.18]]);
const alive = (t: number) => 1 - ss(t, TM.die - 0.25, TM.die + 0.45);
const squeeze = (t: number) => keyS(t, [[CUT.cutaway, 0.15], [TM.pressure1 - 0.15, 0.15], [TM.pressure1 + 0.3, 1], [TM.extend + 0.6, 0.75], [TM.die - 0.2, 0.75], [TM.die + 0.5, 0]]);

/** the femur-patella joint of the followed leg (world) */
const joint = (P: SpiderPose) => toWorld(P, legLocal(C_LEG, P.e[C_LEG])[2]);

const camC = (t: number) => {
  const P = cPose(t);
  const J = joint(P);
  const k0 = toOrbit(camA(CUT.cutaway));
  const k1: Orbit = {target: BODY, az: -6, el: 20, d: 52, f: 1500, cy: 1000};
  const k2: Orbit = {target: J, az: 6, el: 16, d: 22, f: 3900, cy: 900};
  const k3: Orbit = {target: J, az: 26, el: 9, d: 21, f: 3800, cy: 920};
  const k4: Orbit = {target: [0, 0, 3.0], az: 4, el: 12, d: 44, f: 1650, cy: 900};
  let o: Orbit;
  if (t < TM.pressure1 - 0.1) o = lerpOrbit(k0, k1, ss5(t, CUT.cutaway + 0.05, TM.pressure1 - 0.1));
  else if (t < TM.extend + 0.1) o = lerpOrbit(k1, k2, ss5(t, TM.pressure1 + 0.25, TM.extend + 0.1));
  else if (t < TM.drops + 0.4) o = lerpOrbit(k2, k3, ss5(t, TM.extend + 0.1, TM.drops + 0.4));
  else o = lerpOrbit(k3, k4, ss5(t, TM.curl - 0.55, CUT.specimenD - 0.05));
  return orbitCam(o);
};

/** the joint in close-up: the flexible joint membrane on the outer side of the bend (inflated by the pressure) and the
 *  flexor muscle on the inner side (pulls the joint closed once nothing opposes it) */
export const JointDetail: React.FC<{B: Basis; P: SpiderPose; pr: number; live: number; op: number; leg?: number; color?: string}> = ({B, P, pr, live, op, leg = C_LEG, color}) => {
  if (op < 0.01) return null;
  const L = legLocal(leg, P.e[leg], P.dth?.[leg] ?? 0).map((q) => toWorld(P, q));
  const A = proj(B, L[1]), J = proj(B, L[2]), C = proj(B, L[3]);
  const r = 0.36 * J.s;
  const u1 = nrm({x: J.x - A.x, y: J.y - A.y}), u2 = nrm({x: C.x - J.x, y: C.y - J.y});
  // inner side of the bend
  let inner = nrm({x: u2.x - u1.x, y: u2.y - u1.y});
  if (!isFinite(inner.x) || Math.hypot(u2.x - u1.x, u2.y - u1.y) < 0.02) inner = {x: -u1.y, y: u1.x};
  const outer = {x: -inner.x, y: -inner.y};
  // the membrane: a soft bellows across the outer side of the joint, inflated by the pressure, folded when slack
  const mc = {x: J.x + outer.x * r * 0.62, y: J.y + outer.y * r * 0.62};
  const along = nrm({x: u1.x + u2.x, y: u1.y + u2.y});
  const rx = r * 0.78, ry = r * (0.22 + 0.5 * pr);
  const angM = (Math.atan2(along.y, along.x) * 180) / Math.PI;
  // flexor: a muscle band from the femur's inner wall to the patella's base
  const f0 = {x: A.x + (J.x - A.x) * 0.3 + inner.x * r * 0.42, y: A.y + (J.y - A.y) * 0.3 + inner.y * r * 0.42};
  const f1 = {x: J.x + u2.x * r * 0.95 + inner.x * r * 0.5, y: J.y + u2.y * r * 0.95 + inner.y * r * 0.5};
  const tension = 1 - pr;
  const fluid = color ?? mix(FLUID_DIM, FLUID, live);
  const iw = Math.max(2.2, r * 0.05);
  return (
    <g opacity={op}>
      <ellipse cx={mc.x.toFixed(1)} cy={mc.y.toFixed(1)} rx={rx.toFixed(1)} ry={ry.toFixed(1)} transform={`rotate(${angM.toFixed(1)} ${mc.x.toFixed(1)} ${mc.y.toFixed(1)})`} fill={mix('#E9F7FA', fluid, 0.55 * pr + 0.15)} stroke={INK} strokeWidth={iw.toFixed(2)} />
      <ellipse cx={(mc.x + outer.x * ry * 0.25 - along.x * rx * 0.2).toFixed(1)} cy={(mc.y + outer.y * ry * 0.25 - along.y * rx * 0.2).toFixed(1)} rx={(rx * 0.35).toFixed(1)} ry={(ry * 0.22).toFixed(1)} transform={`rotate(${angM.toFixed(1)} ${mc.x.toFixed(1)} ${mc.y.toFixed(1)})`} fill="#FFFFFF" opacity={0.55 * pr} />
      {[-0.4, 0, 0.4].map((k) => {
        const a0 = {x: mc.x + along.x * rx * k, y: mc.y + along.y * rx * k};
        const b0 = {x: a0.x + outer.x * ry * 0.85, y: a0.y + outer.y * ry * 0.85};
        return <path key={k} d={`M${p(a0)} L${p(b0)}`} stroke={INK} strokeWidth={(iw * 0.7).toFixed(2)} opacity={0.55 * clamp(1 - pr / 0.55)} strokeLinecap="round" />;
      })}
      <path d={`M${p(f0)} L${p(f1)}`} stroke={INK} strokeWidth={(r * (0.2 + 0.14 * tension) + 2 * iw * 0.6).toFixed(2)} strokeLinecap="round" opacity={0.85} />
      <path d={`M${p(f0)} L${p(f1)}`} stroke="#DB7F86" strokeWidth={(r * (0.2 + 0.14 * tension)).toFixed(2)} strokeLinecap="round" />
      <path d={`M${p(f0)} L${p(f1)}`} stroke="#F6C3BD" strokeWidth={(r * 0.05).toFixed(2)} strokeLinecap="round" strokeDasharray={`${(r * 0.12).toFixed(1)} ${(r * 0.1).toFixed(1)}`} />
    </g>
  );
};
const nrm = (v: V2) => {
  const l = Math.hypot(v.x, v.y) || 1;
  return {x: v.x / l, y: v.y / l};
};
const p = (v: V2) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`;

export const ShotC: React.FC<{t: number}> = ({t}) => {
  const cam = camC(t);
  const P = cPose(t);
  const pr = pressure(t);
  const live = alive(t);
  const B0 = basis(cam);
  const zoom = proj(B0, joint(P)).s;
  const detail = clamp((zoom - 60) / 60);
  const fluid = mix(FLUID_DIM, FLUID, live);
  return (
    <Scene
      id={`C${Math.round(t * 30)}`}
      cam={cam}
      bg="#DCE9EE"
      back={() => (
        <g>
          <defs>
            <radialGradient id="cbg" cx="540" cy="900" r="1250" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#EEF5F8" />
              <stop offset="1" stopColor="#C9DCE4" />
            </radialGradient>
          </defs>
          <rect width={1080} height={1920} fill="url(#cbg)" />
        </g>
      )}
      items={(B) => {
        const it: Item[] = [];
        const fadeIn = ss(t, CUT.cutaway, CUT.cutaway + 0.35);
        it.push(...spiderItems(B, P, LOOK_CUT, {id: 'sc', focusLeg: C_LEG, focus: detail, cut: {fluid, core: lerp(0.5, 0.95, pr) * lerp(0.4, 1, fadeIn), flow: live > 0.05 && t > TM.pressure1 - 0.1 ? (t - TM.pressure1) * 2.2 * live : undefined, squeeze: squeeze(t), dim: 1 - live}}));
        return it;
      }}
      over={(B) => <JointDetail B={B} P={P} pr={pr} live={live} op={detail} />}
    />
  );
};
