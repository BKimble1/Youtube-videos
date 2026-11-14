// S1 (the hook) and S7 (the closing crawl): one shot over world time tau in [-5.15, 3.45]. S7 plays tau = t - DUR, so
// its last frame is the instant before frame 0: the loop is continuous by construction (pose, camera, light).
// Camera: alongside and a little ahead of the head, above the cut plane, looking back down the half-pipe tunnel; it
// tracks the crawl at its average speed. S7 closes in from 1.22x to 1x distance; S1 ends pushing toward the head
// anchor (the match into the S2 macro).
import React from 'react';
import {add3, basis, Cam3, mul3, sub3, V3} from '../core/three';
import {lightFor} from '../core/render';
import {C3, N3, T3, Z3} from '../world/path';
import {contactOf, gutFrame, trackS} from '../world/frames';
import {bodyLen, crawl, CrawlState} from '../robot/state';
import {robotItems, robotPoint} from '../robot/geom';
import {GutShot} from './GutShot';
import {lerp, ss5, clamp} from '../lib';
import {RL} from '../world/gut';

export const tunnelCam = (tau: number, st: CrawlState): Cam3 => {
  const sc = trackS(tau);
  const close = lerp(1.22, 1.0, ss5(tau, -5.15, 0.2));
  const push = ss5(tau, 2.55, 3.6);
  const sT = sc + 0.5 + 2.3 * push; // aim moves forward to the head anchor
  const tgt0 = C3(sT);
  const T = T3(sT), N = N3(sT);
  const tgt: V3 = add3(tgt0, add3(mul3(N, 0.35 * push), mul3(Z3, 0.15)));
  const dist = 10.2 * close * lerp(1, 0.74, push);
  const dir = add3(add3(mul3(T, 0.62), mul3(Z3, 0.62)), mul3(N, 0.5 - 0.1 * push));
  const dl = Math.hypot(dir[0], dir[1], dir[2]);
  const eye = add3(tgt, mul3(dir, dist / dl));
  return {eye, target: tgt, f: 1500, cy: 1010};
};

export const TunnelShot: React.FC<{tau: number}> = ({tau}) => {
  const st = crawl(tau);
  const cam = tunnelCam(tau, st);
  const B = basis(cam);
  const dist = Math.hypot(...(sub3(cam.eye, cam.target) as [number, number, number]));
  const Lt = lightFor(B, dist, {fog0: dist * 0.95, fogLen: dist * 2.4});
  const sc = trackS(tau);
  const robot = robotItems(B, Lt, gutFrame, st, {tetherLen: 30});
  return (
    <GutShot B={B} Lt={Lt} robot={robot}
      gut={{sFrom: sc - 26, sTo: sc + 9.5, contact: contactOf(st), px: 9, ext: 0.25, ext2: 0.8,
        shadow: {s0: st.sTail + 0.3, s1: st.sTail + bodyLen(st.e) - 0.3, r: (s) => Math.max(1, contactOf(st)(s) || 1), op: 1}}} />
  );
};
export const _u = [robotPoint, RL, clamp];
