// S01 (0.00-1.90 s) "This cockroach can fire a needle." Ground-level three-quarter close-up of a prepared lab trial: the
// medic insect is finishing a step into its stance; on "fire" the latch line parts, the spring drives the injector out
// and it crosses the few centimetres to the silicone target and stays there. The insect keeps breathing and searching.
import React from 'react';
import {lookAt, depth, proj, scaleAt} from '../lib/cam';
import {V3, add, mul, lerp3} from '../lib/v3';
import {clamp, easeOut, keys, ramp, sr} from '../lib/ease';
import {poseRoach, straightPath, plantedStop} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear, Injector} from '../rig/Gear';
import {launchAt, travelTo, NEEDLE_TIP, EMBED} from '../rig/launch';
import {SoftShadow} from '../lib/shade';
import {LabBackdrop, ArenaFloor, TargetFixture, TARGET} from '../sets/Lab';
import {ShotProps} from './index';
import {FPS, word} from '../timeline';
import {fmt} from '../lib/g3';
import {arenaWalls} from '../sets/LabRoom';

/** soft contact shadow of the target fixture on the mat */
export const FixtureShadow: React.FC<{cam: ReturnType<typeof lookAt>}> = ({cam}) => {
  const c = proj(cam, [-12, 0, 2]);
  const a = proj(cam, [16, 0, 2]), b = proj(cam, [-12, 0, 36]);
  const rx = Math.hypot(a[0] - c[0], a[1] - c[1]), ry = Math.hypot(b[0] - c[0], b[1] - c[1]);
  const ang = (Math.atan2(a[1] - c[1], a[0] - c[0]) * 180) / Math.PI;
  return <SoftShadow id="fxsh" c={{x: c[0], y: c[1]}} rx={rx * 1.3} ry={ry * 1.2} rotate={ang} alpha={0.3} color="#1C2A24" core={0.45} />;
};
export const S01_BODY_X = 58; // body origin x at the firing stance (target face at x = 0)
export const S01_FIRE = word('fire', 0).start + 0.01; // release on "fire"

/** the medic insect's motion in the opening (also used by S02/S03 for continuity) */
export const s01Motion = (t: number) => {
  const sStop = plantedStop(36);
  const path = straightPath([S01_BODY_X + sStop, 0, 0], Math.PI);
  // the last step: still moving at frame 0, planted by 0.34 s; before -0.75 s (the end of the film, S15) it walks at
  // the speed the easing starts with, so S15's approach runs straight into this frame 0 (the loop)
  const V0 = (26 * 2.2) / 1.09;
  const s = t < -0.75 ? sStop - 26 + V0 * (t + 0.75) : sStop - 26 * (1 - easeOut(clamp((t + 0.75) / 1.09), 2.2));
  const L = launchAt(t, S01_FIRE, poseRoach({path, s: sStop, t}).frame, travelTo(S01_BODY_X));
  const settle = 0.8 * sr(t, 0.2, 0.6);
  return {path, s, L, settle};
};

export const S01_TGT: V3 = [49, 17, 0];
export const S01_EYE: V3 = ((az: number, el: number, R: number): V3 => [S01_TGT[0] + R * Math.cos(el) * Math.cos(az), S01_TGT[1] + R * Math.sin(el), S01_TGT[2] + R * Math.cos(el) * Math.sin(az)])((50 * Math.PI) / 180, (8 * Math.PI) / 180, 270);
export const S01_CAM = lookAt(S01_EYE, S01_TGT, 2250, 540, 1130);
export type CamOverride = {eye: V3; tgt: V3; f: number; cy?: number};
export const S01: React.FC<ShotProps & {co?: CamOverride}> = ({f, co}) => {
  const t = f / FPS;
  const {path, s, L, settle} = s01Motion(t);
  const pose = poseRoach({
    path, s, t, search: keys(t, [[0, 0.9], [0.8, 0.35], [1.2, 0.7]]),
    offset: [-1.6 * L.recoil, -settle - 0.4 * L.recoil, 0], pitch: 0.03 * L.recoil,
    antL: {yaw: 0.55 + 0.25 * L.recoil}, antR: {yaw: 0.6 + 0.25 * L.recoil},
  });
  // camera: low three-quarter front, locked off so the launch reads (the insect and the target hold their places)
  const cam = co ? lookAt(co.eye, co.tgt, co.f, 540, co.cy ?? 960) : S01_CAM;
  const inj = L.inj;
  const items: {z: number; el: React.ReactNode}[] = [];
  items.push({z: depth(cam, [-8, 30, 0]), el: <TargetFixture key="tgt" id="s01t" cam={cam} />});
  items.push({
    z: depth(cam, pose.frame.o),
    el: <Roach key="roach" pose={pose} cam={cam} o={{id: 's01r', gear: <Gear id="s01g" cam={cam} f={pose.frame} g={{kind: 'injector', loaded: L.loaded, latched: L.latched, heat: L.heat, springExt: L.loaded ? 0 : L.springExt}} />}} />,
  });
  items.push(...arenaWalls(cam, {skip: ['s', 'e']}).map((w) => ({z: w.z, el: w.el})));
  items.sort((a, b) => b.z - a.z);
  // the flying / embedded injector, with a short motion trail while it flies
  const trail = inj && L.flying ? [0.5, 0.3, 0.15].map((a, k) => ({a, o: add(inj.o, mul(inj.x, -(k + 1) * 4.5))})) : [];
  // the silicone gives a little at impact
  const jig = L.impact >= 0 ? Math.exp(-L.impact / 0.06) * Math.sin(L.impact * 70) : 0;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id="s01b" cam={cam} blur={16} />
      <ArenaFloor id="s01f" cam={cam} />
      <FixtureShadow cam={cam} />
      {items.map((it) => it.el)}
      {trail.map((tr, k) => (
        <g key={k} opacity={tr.a}>
          <Injector id={`s01tr${k}`} cam={cam} s={{f: {...inj!, o: tr.o}, plunger: 0}} />
        </g>
      ))}
      {inj && (
        <g transform={jig ? `translate(${fmt(jig * 1.5)} 0)` : undefined}>
          <Injector id="s01inj" cam={cam} s={{f: inj, plunger: 0, needleEnd: L.embedded ? NEEDLE_TIP - EMBED : undefined}} />
          {L.embedded && (() => {
            const p = proj(cam, [0.1, inj.o[1], inj.o[2]]);
            const r = 1.4 * scaleAt(cam, [0, inj.o[1], 0]);
            return <ellipse cx={fmt(p[0])} cy={fmt(p[1])} rx={fmt(r * 0.55)} ry={fmt(r)} fill="#B9705C" opacity={0.55} />;
          })()}
        </g>
      )}
    </svg>
  );
};
