// S1 (the hook) and S7 (the ending): one shot over world time tau in [-5.15, 3.5]. S7 plays tau = t - DUR, so its
// last frame is the instant before frame 0: pose, camera and light are continuous across the loop by construction.
//
// V2 camera plan (every move reveals something):
//   S7  -5.15 .. -2.4  a wide anatomical view from above: the robot inside a winding stretch of gut, followed round
//                      the bend through one full crawl cycle
//       -2.4 .. 0      the camera descends and swings alongside the head, arriving exactly at the frame-0 framing
//   S1   0 .. 1.2      close alongside the head: the front section is extending, then its anchor swells and grips
//        1.2 .. 2.3    pull back along the body as the tail releases and the body is drawn forward ("CRAWLS")
//        2.5 .. 3.5    push in on the head anchor (the match into the S2 macro)
import React from 'react';
import {add3, basis, Cam3, mul3, norm3, sub3, V3} from '../core/three';
import {lightFor} from '../core/render';
import {C3, N3, T3, Z3} from '../world/path';
import {contactOf, gutFrame, trackS} from '../world/frames';
import {bodyLen, crawl, CrawlState} from '../robot/state';
import {robotItems} from '../robot/geom';
import {GutShot} from './GutShot';
import {keyS, lerp, ss5} from '../lib';

type View = {target: V3; dir: V3; dist: number; f: number; cy: number};
const toCam = (v: View): Cam3 => ({eye: add3(v.target, mul3(norm3(v.dir), v.dist)), target: v.target, f: v.f, cy: v.cy});
const lerpView = (a: View, b: View, u: number): View => ({
  target: add3(mul3(a.target, 1 - u), mul3(b.target, u)),
  dir: norm3(add3(mul3(norm3(a.dir), 1 - u), mul3(norm3(b.dir), u))),
  dist: a.dist * Math.pow(b.dist / a.dist, u),
  f: a.f * Math.pow(b.f / a.f, u),
  cy: lerp(a.cy, b.cy, u),
});

/** the hook framing (alongside, a little ahead of the head, looking back along the body) */
export const hookView = (tau: number): View => {
  const ref = trackS(0.3);
  const lag = keyS(tau, [[-2.6, 1], [-0.7, 0.45], [1.0, 0.45], [2.3, 1]]);
  const sc = ref + (trackS(tau) - ref) * lag;
  // aim: toward the head while it grips, back along the body while it is drawn forward, then onto the head anchor
  const off = keyS(tau, [[-3, 3.6], [0.0, 3.6], [1.15, 3.4], [2.2, 1.2], [2.4, 1.2], [3.5, 4.6]]);
  const dist = keyS(tau, [[-3, 10.5], [0.0, 10.5], [1.15, 11], [2.2, 15.5], [2.4, 15.5], [3.5, 9.0]]);
  const sT = sc + off;
  const T = T3(sT), N = N3(sT);
  const side = keyS(tau, [[-3, 0.55], [1.15, 0.55], [2.25, 0.7], [3.5, 0.4]]);
  return {target: add3(C3(sT), mul3(Z3, 0.2)), dir: add3(add3(mul3(T, 0.6), mul3(Z3, 0.66)), mul3(N, side)), dist, f: 1500, cy: 1110};
};
/** the wide anatomical view of the ending: from above, the gut winding through the frame */
const wideView = (tau: number): View => {
  const sc = trackS(tau);
  const T = T3(sc);
  return {target: add3(C3(sc + 0.8), mul3(Z3, -0.6)), dir: add3(mul3(Z3, 1), mul3(T, 0.36)), dist: lerp(36, 31, ss5(tau, -5.15, -2.4)), f: 1900, cy: 1060};
};
export const tunnelView = (tau: number): View => {
  if (tau >= 0) return hookView(tau);
  return lerpView(wideView(tau), hookView(tau), ss5(tau, -2.45, 0));
};
export const tunnelCam = (tau: number, _st?: CrawlState): Cam3 => toCam(tunnelView(tau));

export const TunnelShot: React.FC<{tau: number}> = ({tau}) => {
  const st = crawl(tau);
  const v = tunnelView(tau);
  const cam = toCam(v);
  const B = basis(cam);
  const dist = v.dist;
  const Lt = lightFor(B, Math.min(dist, 16), {fog0: Math.min(dist, 16) * 0.95 + (dist - Math.min(dist, 16)), fogLen: Math.min(dist, 16) * 2.4});
  const sc = trackS(tau);
  const reach = Math.max(9.5, (0.5 * 1920 * dist) / v.f + 4);
  const robot = robotItems(B, Lt, gutFrame, st, {tetherLen: 32});
  return (
    <GutShot B={B} Lt={Lt} robot={robot}
      gut={{sFrom: sc - Math.max(26, reach), sTo: sc + reach, contact: contactOf(st), px: 9, ext: 0.25, ext2: 0.8,
        shadow: {s0: st.sTail + 0.3, s1: st.sTail + bodyLen(st.e) - 0.3, r: (s) => Math.max(1, contactOf(st)(s) || 1), op: 1}}} />
  );
};
