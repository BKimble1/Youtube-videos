// Shots 1, 2 and 14: the opening swim-by, the orbit into the transparent cutaway, and the loop back to frame 0.
// One swim track (TR1) runs from before the film's start (shot 14 replays it at t - DUR) through shot 2, so the end
// returns to the opening state exactly: same fish, same phase, same camera.
import React from 'react';
import {Basis, basis, Cam, lerpCam, orbit, V3} from '../core/cam';
import {Underwater} from '../art/Underwater';
import {swimTrack} from '../fish/swim';
import {DUR, ss, T, clamp, lerp} from '../lib';
import {fishGeo, FishPose} from '../fish/model';

export const TR1 = swimTrack({t0: -2.2, t1: 6, start: [-300, 0, 0], yaw: () => 0, freq: () => 2.5, amp: () => 0.46, phase0: 0.4});
export const muscleCentre = (p: FishPose): V3 => fishGeo(p).atS(0.6, 0, 0);

/** the pass-by: a camera held ahead of the fish's path, panning as the fish swims past it */
const passCam = (t: number): Cam => {
  const p = TR1.at(t);
  const tgt = muscleCentre(p);
  const eye: V3 = [70 + 38 * t, -22, 205];
  return {eye, target: [tgt[0] + 6, tgt[1] - 4, tgt[2]], f: 1500};
};
/** a close side view of the muscle, riding with the fish */
const closeCam = (t: number, dist: number, yaw = -6, pitch = 4): Cam => orbit(muscleCentre(TR1.at(t)), yaw, pitch, dist, 1500);

export const camSH1 = (t: number): Cam => lerpCam(passCam(t), closeCam(t, 112), ss(t, 1.0, T.s2));
const camSH2 = (t: number): Cam => {
  const u = ss(t, T.s2, T.s3 - 0.18);
  const p = TR1.at(t);
  const tgt = fishGeo(p).atS(lerp(0.6, 0.45, u), 0, 0);
  const yaw = lerp(-6, 180, u);
  const pitch = 4 + 16 * Math.sin(Math.PI * u);
  const dist = lerp(112, 330, ss(t, T.s2, T.s2 + 1.1));
  return orbit(tgt, yaw, pitch, dist, 1500);
};
export const xraySH2 = (t: number) => ss(t, T.s2 + 0.2, T.s2 + 0.75);

export const Shot1: React.FC<{t: number}> = ({t}) => {
  const B = basis(camSH1(t));
  return <Underwater id="s1" B={B} t={t} pose={TR1.at(t)} swirls={TR1.swirls(t)} />;
};
export const Shot2: React.FC<{t: number}> = ({t}) => {
  const B = basis(camSH2(t));
  const xr = xraySH2(t);
  return <Underwater id="s2" B={B} t={t} pose={TR1.at(t)} swirls={TR1.swirls(t)} look={{xray: xr}} over={<XrayTint xr={xr} />} />;
};
/** the cutaway's cool grade over the water (no glow): the scene dims a little so the glass body reads */
export const XrayTint: React.FC<{xr: number}> = ({xr}) => (xr > 0.01 ? <rect x={0} y={0} width={1080} height={1920} fill="#0B2B3A" opacity={0.28 * xr} style={{mixBlendMode: 'multiply'}} /> : null);

/** shot 14: from the extreme close-up on the fish's muscle (matched to the heart wall) back out to frame 0 */
export const camSH14 = (t: number): Cam => {
  const tt = t - DUR;
  const w = ss(t, T.s14 + 0.1, DUR);
  return lerpCam(closeCam(tt, 14, -4, 2), camSH1(tt), w);
};
export const Shot14: React.FC<{t: number}> = ({t}) => {
  const tt = t - DUR;
  const B: Basis = basis(camSH14(t));
  return <Underwater id="s14" B={B} t={tt} pose={TR1.at(tt)} swirls={TR1.swirls(tt)} look={{detail: clamp(1 - (t - T.s14) / 0.6), haze: 0.06 * clamp((t - T.s14) / 0.6)}} />;
};
