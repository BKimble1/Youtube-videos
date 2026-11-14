// Centreline frames for the robot: in the gut (on the tunnel axis) and the smoothed tracking position for cameras.
import {C3, N3, T3, Z3} from './path';
import {FrameF} from '../robot/geom';
import {bodyLen, crawl, CrawlState} from '../robot/state';
import {anchorOuter} from '../robot/geom';

export const gutFrame: FrameF = (s) => ({p: C3(s), T: T3(s), N: N3(s), B: Z3});
/** the robot pushing on the wall: its anchors' outer radius at arc length s */
export const contactOf = (st: CrawlState) => (s: number) => anchorOuter(s - st.sTail, st, st.e);

// smoothed robot centre (arc length) over world time, for a camera that tracks the crawl at its average speed
const T0 = -7, T1 = 15, DT = 1 / 60;
const N = Math.round((T1 - T0) / DT) + 1;
const MID = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const st = crawl(T0 + i * DT);
  MID[i] = st.sTail + bodyLen(st.e) / 2;
}
const W = Math.round(2.7 / DT); // one crawl cycle
const SM = new Float64Array(N);
for (let i = 0; i < N; i++) {
  let a = 0, wsum = 0;
  for (let k = -W; k <= W; k++) {
    const j = Math.min(N - 1, Math.max(0, i + k));
    const w = Math.cos((Math.PI * k) / (2 * W)) ** 2;
    a += MID[j] * w; wsum += w;
  }
  SM[i] = a / wsum;
}
/** smoothed robot-centre arc length at world time tau */
export const trackS = (tau: number) => {
  const f = (Math.min(T1, Math.max(T0, tau)) - T0) / DT;
  const i = Math.min(N - 2, Math.floor(f));
  return SM[i] + (SM[i + 1] - SM[i]) * (f - i);
};
