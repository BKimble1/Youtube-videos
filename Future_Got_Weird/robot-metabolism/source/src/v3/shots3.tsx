// V3 shot list. Each shot is a camera path (lib/campath: passes through its keys with continuous velocity) over the
// one V3 world; the rig never depends on the camera. Keys are placed from the rig's own joint positions at their
// moments, so framing follows the real motion. Cuts happen only between sentences or on a change of subject.
import React from 'react';
import {Cam, Paint3, projector, resetIds, W as SW, H as SH} from '../lib/r3';
import {cam, camPath, Key} from '../lib/campath';
import {add, lerp, mul, v3, V3} from '../lib/v3';
import {E, T} from '../lib/time';
import {IdCtx} from '../Scene3D';
import {Operator} from '../art/Operator';
import {resolve} from './rig';
import {DUR, EV, H, H2, world, YAW2} from './story';
import {PT} from './pair';
import {sceneItems} from './scene';
import {prof, Z_P} from './world';

export type Shot3 = {id: string; from: number; to: number; view: (t: number) => React.ReactNode; cam?: (t: number) => Cam};

/** the V3 world through one camera */
export const Scene3: React.FC<{c: Cam; t: number; idp?: string; w?: number; h?: number}> = ({c, t, idp = 'a', w = SW, h = SH}) => {
  const outer = React.useContext(IdCtx);
  resetIds(outer + idp);
  const P = projector(c);
  const items = sceneItems(P, t);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${SW} ${SH}`} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={SW} height={SH} fill="#F2E8D5" />
      <Paint3 items={items} P={P} />
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------- helpers
const memo = new Map<number, ReturnType<typeof resolve>>();
const R = (t: number) => {
  const k = Math.round(t * 1000);
  if (!memo.has(k)) memo.set(k, resolve(world(t)));
  return memo.get(k)!;
};
/** a joint's position at time t */
const J = (t: number, id: string) => R(t).joints[id];
const ball = (t: number, link: string, end: 'a' | 'b') => {
  const l = R(t).links.find((x) => x.id === link)!;
  return end === 'a' ? l.Ca : l.Cb;
};
const A = (p: V3): [number, number, number] => [p.x, p.y, p.z];
const C = (eye: V3, target: V3, f: number, oy = 0): Cam => cam(A(eye), A(target), f, {oy});
/** the hook group's local frame -> world (at H), and the same local frame at H2 (turned by YAW2) */
const atH = (p: V3) => add(p, H);
const atH2 = (p: V3) => add(v3(p.x * Math.cos(YAW2) + p.z * Math.sin(YAW2), p.y, -p.x * Math.sin(YAW2) + p.z * Math.cos(YAW2)), H2);
/** the loop camera in the group's local frame: close on the foot V0 meeting L's end, the donor behind */
const LOOP_EYE = v3(0.03, 0.78, 0.68), LOOP_TG = v3(-0.17, 0.02, 0.3), LOOP_F = 1450, LOOP_OY = 120;
export const LOOP_CAM_H = C(atH(LOOP_EYE), atH(LOOP_TG), LOOP_F, LOOP_OY);
export const LOOP_CAM_H2 = C(atH2(LOOP_EYE), atH2(LOOP_TG), LOOP_F, LOOP_OY);

const mid = (a: V3, b: V3, k = 0.5) => lerp(a, b, k);
const off = (p: V3, x: number, y: number, z: number) => add(p, v3(x, y, z));

// ---------------------------------------------------------------------------------------------- 1 hook (0 - 2.95)
// close on the contact; the snap; pull back as L telescopes to V1 (second contact); down to a low side view while the
// robot stands up on its new part
const hookCam = camPath([
  [0, LOOP_CAM_H],
  [PT.snap1 + 0.15, C(atH(v3(0.1, 0.52, 0.66)), atH(v3(-0.05, 0.03, 0.21)), 1700, 120)],
  [PT.snap2 - 0.02, C(atH(v3(0.28, 0.78, 1.0)), atH(v3(-0.17, 0.07, 0.04)), 1300, 60)],
  [PT.r1, C(atH(v3(-0.14, 0.12, 1.0)), atH(v3(-0.14, 0.15, 0.0)), 1500)],
], 'inout'); // leaves frame 0 at rest, as the last frame's camera arrives at rest: no change of motion at the loop

// ---------------------------------------------------------------------------------------------- 2 mechanism (2.95 - 7.85)
// the telescoping rod L with its housing opened; out to the near face (L, the apex links: the joints turning); cut
// to L's connector at V1 opened (its magnet turns as the joint angle changes); out to the whole robot, three-quarter
const L_AT = (t: number) => mid(ball(t, 'hL', 'a'), ball(t, 'hL', 'b'), 0.42);
const tM0 = PT.r1, tM1 = T('stretch') - 0.3, tM2 = E('shrink') + 0.05, tM3 = EV.sec[0] - 0.02;
// perpendicular to L (which runs from the front-near foot back to the rear foot), from the near side, a little above
const LPERP = (t: number, d: number, h: number) => add(L_AT(t), v3(-0.5 * d, h, 0.866 * d));
const mechCam = camPath([
  [tM0, C(LPERP(3.2, 0.36, 0.12), off(L_AT(3.2), 0, 0.0, 0), 1450, 160)],
  [tM1, C(LPERP(4.6, 0.33, 0.11), off(L_AT(4.6), 0.0, 0.0, 0), 1500, 160)],
  [tM2, C(off(L_AT(6.0), -0.08, 0.2, 0.9), off(L_AT(6.0), 0.03, 0.08, -0.08), 1450, 60)],
], 'none');
const V1_AT = (t: number) => J(t, 'hV1');
const secCam = camPath([
  [tM3, C(off(V1_AT(6.2), 0.04, 0.15, -0.18), off(V1_AT(6.2), 0.02, 0.01, -0.01), 2300, 80)],
  [6.95, C(off(V1_AT(6.95), 0.04, 0.15, -0.185), off(V1_AT(6.95), 0.02, 0.01, -0.01), 2280, 80)],
  [T('a person') - 0.04, C(off(V1_AT(7.6), 0.1, 0.36, -0.66), off(V1_AT(7.6), 0.2, 0.07, 0.03), 1400, 40)],
], 'none');

// ---------------------------------------------------------------------------------------------- 3 operator (7.84 - 8.62)
const tO = T('a person') - 0.04, tB = T('controls') + 0.32;
export const KEYS3 = [T('controls') + 0.12];
const feedCam = C(off(J(9, 'hV1'), 0.15, 0.55, 0.95), off(J(9, 'hV1'), 0.2, 0.05, 0), 1250);
const operator = (t: number) => {
  const sc = 1.32;
  const tx = 540 - 560 * sc, ty = 980 - 1080 * sc;
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})`}}>
      <Operator t={t} keyT={KEYS3} feed={(tt) => <Scene3 c={feedCam} t={tt} idp="mon" />} />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- 4 attach (8.62 - 13.4)
// the response (the apex leans, V1 unloads); the loose rod on the floor and V1 coming back to it; cut to a tight
// side view of the two connectors closing (a visible gap until contact); out as S extends into a support
const S_A0 = ball(9, 'hS', 'a');
const V1_9 = J(9, 'hV1');
// seen from behind and to the far side: the loose rod in the middle ground, the donor behind it, the robot to the right
const attachCam = camPath([
  [tB, C(off(mid(V1_9, S_A0), -0.6, 0.48, -0.55), off(mid(V1_9, S_A0), 0.1, 0.06, 0.02), 1300, 60)],
  [T('guiding') + 0.3, C(off(S_A0, -0.45, 0.3, -0.42), off(S_A0, 0.08, 0.04, 0.0), 1450, 60)],
  [T('place') + 0.15, C(off(S_A0, -0.32, 0.2, -0.28), off(S_A0, 0.04, 0.02, -0.01), 1750, 60)],
], 'none');
const tTight = T('place') + 0.2;
const CONTACT = ball(EV.snapS + 0.01, 'hS', 'a');
// tight: across the line the foot comes in on (back-far side, a little above): both connector faces and the gap
const tightCam = camPath([
  [tTight, C(off(CONTACT, -0.19, 0.12, -0.12), off(CONTACT, 0.03, 0.005, 0.0), 2000, 80)],
  [EV.snapS + 0.12, C(off(CONTACT, -0.18, 0.115, -0.115), off(CONTACT, 0.03, 0.005, 0.0), 2050, 80)],
  [EV.support[0] + 0.25, C(off(CONTACT, -0.3, 0.18, -0.26), off(CONTACT, 0.08, 0.05, 0.0), 1700)],
  [T('walking') - 0.1, C(off(J(13.2, 'hV1'), -0.5, 0.36, -0.52), off(J(13.2, 'hV1'), 0.2, 0.08, 0.02), 1300)],
], 'none');

// ---------------------------------------------------------------------------------------------- 5 downhill (13.4 - 17.45)
// the robot comes to the crest of the slope (wide, the ramp ahead); close on the stick extending and planting its tip;
// a locked side-tracking view of the whole robot pushing down the incline; wider: the run to the bottom
const FX = (t: number) => world(t).fx;
const tS1 = T('walking') - 0.05, tS2 = T('helping') - 0.05, tS3 = T('move') + 0.12, tS4 = E('downhill') - 0.05, tS5 = T('and if') + 0.32;
// ahead of the robot on the near side, a little above: it comes over the crest toward the camera, the slope between
const slopeCam = camPath([
  [tS1, C(v3(FX(13.4) + 0.62, 0.36, Z_P + 0.74), v3(FX(13.4) - 0.12, 0.08, Z_P - 0.02), 1450, 40)],
  [tS2, C(v3(FX(14.5) + 0.58, 0.33, Z_P + 0.76), v3(FX(14.5) - 0.1, 0.06, Z_P - 0.02), 1500, 40)],
], 'none');
// the whole stick, from its joint at the rear foot to its tip on the slope: it extends, the tip stays planted, the body
// is pushed
const STICK_MID = (t: number) => mid(ball(t, 'hS', 'a'), ball(t, 'hS', 'b'), 0.5);
const stickCam = camPath([
  [tS2, C(off(STICK_MID(14.6), -0.04, 0.12, 0.5), off(STICK_MID(14.6), 0.03, 0.0, 0), 1450, 80)],
  [tS3, C(off(STICK_MID(15.5), -0.04, 0.12, 0.5), off(STICK_MID(15.5), 0.03, 0.0, 0), 1450, 80)],
], 'none');
/** side tracking: the follow point is the front edge, averaged over half a second (no jitter from the strokes) */
const smoothFX = (t: number) => {
  let s = 0;
  for (let j = -6; j <= 6; j++) s += FX(Math.min(EV.stall, Math.max(EV.gait0, t + j * 0.05)));
  return s / 13;
};
const trackKeys: Key[] = [];
for (let k = 0; k <= 6; k++) {
  const t = tS3 + ((tS4 - tS3) * k) / 6;
  const fx = smoothFX(t) - 0.2;
  const y = prof(fx).y;
  trackKeys.push([t, C(v3(fx - 0.05, y + 0.16, Z_P + 1.0), v3(fx, y + 0.1, Z_P), 1450, 40)]);
}
{
  const fx = smoothFX(tS5) - 0.2;
  trackKeys.push([tS5, C(v3(fx - 0.35, 0.42, Z_P + 1.35), v3(fx - 0.12, 0.05, Z_P - 0.05), 1350, 40)]);
}
const trackCam = camPath(trackKeys, 'none');

// ---------------------------------------------------------------------------------------------- 6 failure, removal, replacement
const S_MOT = (t: number) => {
  const l = R(t).links.find((x) => x.id === 'hS')!;
  return add(l.Ca, mul(l.u, 0.06)); // the motor block, where the status light is
};
const tF0 = T('and if') + 0.32;
const V1F = J(18.4, 'hV1');
// close on the stick's status light as it fails; out to the robot sinking onto it; across to the far side for the
// release, the side step and the replacement
const failCam = camPath([
  [tF0, C(off(S_MOT(17.6), -0.02, 0.06, 0.24), off(S_MOT(17.6), -0.01, 0.0, 0), 2100, 40)],
  [T('working') + 0.05, C(off(S_MOT(17.9), -0.02, 0.07, 0.26), off(S_MOT(17.9), -0.01, 0.0, 0), 2050, 40)],
  [EV.release - 0.02, C(off(V1F, -0.32, 0.24, 0.62), off(V1F, 0.02, 0.04, 0.0), 1450, 40)],
  // stays on the near side and rises: the side step goes away from the camera, the spare and the contact are seen
  // over the robot (no swing round to the far side)
  [EV.fall[1] + 0.1, C(off(J(19.1, 'hV1'), -0.3, 0.42, 0.58), off(J(19.1, 'hV1'), 0.13, 0.03, -0.08), 1350, 40)],
  [EV.snapR + 0.05, C(off(J(20.0, 'hV1'), -0.26, 0.48, 0.46), off(J(20.0, 'hV1'), 0.13, 0.02, -0.1), 1420, 40)],
  [T('so') + 0.05, C(off(J(20.8, 'hV1'), -0.4, 0.5, 0.48), off(J(20.8, 'hV1'), 0.18, 0.05, -0.12), 1320, 40)],
], 'none');

// ---------------------------------------------------------------------------------------------- 7 ending (20.89 - 25.7)
// over the robot to the broken robot beside it; then along its loose part into the opening composition (at H2)
const tE0 = T('so') + 0.05;
// from behind the robot (far side) along the floor to the broken robot and the parts beside it, without passing over
// the robot, then into the opening composition at H2
const endCam = camPath([
  [tE0, C(off(J(20.8, 'hV1'), -0.4, 0.5, 0.48), off(J(20.8, 'hV1'), 0.18, 0.05, -0.12), 1320, 40)],
  // round behind the robot (never over it): the robot on the right, the broken robot and its parts ahead
  [T('broken') + 0.25, C(v3(-0.14, 0.58, 0.18), v3(0.78, 0.03, -0.36), 1250, 40)],
  [E('beside it') - 0.15, C(v3(0.06, 0.68, -0.33), v3(1.0, 0.02, -0.5), 1300, 80)],
  [T('next') + 0.1, C(lerp(atH2(LOOP_EYE), v3(0.06, 0.68, -0.33), 0.3), atH2(LOOP_TG), 1420, 110)],
  [DUR - 1 / 30, LOOP_CAM_H2],
], 'out');

export const SHOTS3: Shot3[] = [
  {id: 'hook', from: 0, to: PT.r1, cam: hookCam, view: (t) => <Scene3 c={hookCam(t)} t={t} />},
  {id: 'rod', from: PT.r1, to: tM3, cam: mechCam, view: (t) => <Scene3 c={mechCam(t)} t={t} />},
  {id: 'connector', from: tM3, to: tO, cam: secCam, view: (t) => <Scene3 c={secCam(t)} t={t} />},
  {id: 'operator', from: tO, to: tB, view: operator},
  {id: 'attach', from: tB, to: tTight, cam: attachCam, view: (t) => <Scene3 c={attachCam(t)} t={t} />},
  {id: 'contact', from: tTight, to: tS1, cam: tightCam, view: (t) => <Scene3 c={tightCam(t)} t={t} />},
  {id: 'slope', from: tS1, to: tS2, cam: slopeCam, view: (t) => <Scene3 c={slopeCam(t)} t={t} />},
  {id: 'stick', from: tS2, to: tS3, cam: stickCam, view: (t) => <Scene3 c={stickCam(t)} t={t} />},
  {id: 'track', from: tS3, to: tF0, cam: trackCam, view: (t) => <Scene3 c={trackCam(t)} t={t} />},
  {id: 'fail', from: tF0, to: tE0, cam: failCam, view: (t) => <Scene3 c={failCam(t)} t={t} />},
  {id: 'end', from: tE0, to: 999, cam: endCam, view: (t) => <Scene3 c={endCam(t)} t={t} />},
];

/** caption centre height: clear of the subject in each shot */
export const capPlace3 = (i: number, t: number) => {
  void i;
  if (t >= tO && t < tB) return 1640;
  if (t < PT.r1 || t >= T('could') - 0.1) return 330;
  return 1560;
};

export {Z_P};
