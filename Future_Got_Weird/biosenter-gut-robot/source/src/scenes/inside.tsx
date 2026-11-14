// S2 (the macro of the head anchor gripping) and S3 (the cutaway of the full crawl cycle): one continuous camera in the
// top-down cutaway, over the same world-time crawl as S1. S2 is a cut from S1 on the action (the head anchor that S1
// pushed toward, still flat); S3 pulls straight back out of the macro to the whole robot and tracks it through one full
// cycle and into the bend.
import React from 'react';
import {add3, basis, Cam3, mul3, norm3, sub3, V3} from '../core/three';
import {lightFor} from '../core/render';
import {C3, N3, T3, Z3} from '../world/path';
import {contactOf, gutFrame, trackS} from '../world/frames';
import {bodyLen, crawl, CrawlState} from '../robot/state';
import {layout, robotItems} from '../robot/geom';
import {GutShot} from './GutShot';
import {clamp, lerp, ss5} from '../lib';

export const headAnchorS = (st: CrawlState) => {
  const L = layout(st.e);
  return st.sTail + (L.u5 + L.u6) / 2;
};
// the head anchor's resting place during the macro (it arrives there by 4.1 s and stays until 7.1 s)
const SHA_REST = headAnchorS(crawl(4.15));

type View = {target: V3; dir: V3; dist: number; f: number; cy?: number};
const toCam = (v: View): Cam3 => ({eye: add3(v.target, mul3(norm3(v.dir), v.dist)), target: v.target, f: v.f, cy: v.cy ?? 960});
const lerpView = (a: View, b: View, u: number): View => ({
  target: add3(mul3(a.target, 1 - u), mul3(b.target, u)),
  dir: norm3(add3(mul3(a.dir, 1 - u), mul3(b.dir, u))),
  dist: a.dist * Math.pow(b.dist / a.dist, u),
  f: a.f * Math.pow(b.f / a.f, u),
  cy: lerp(a.cy ?? 960, b.cy ?? 960, u),
});

/** the macro: top-down, long lens, framed on the contact between the head anchor and the +N rim */
export const macroView = (tau: number): View => {
  const st = crawl(tau);
  // follow the anchor while it slides in, then hold on its rest position
  const sHA = Math.min(headAnchorS(st), SHA_REST);
  const push = ss5(tau, 4.1, 6.9);
  const target = add3(add3(C3(sHA + 0.05), mul3(N3(sHA), 1.35)), mul3(Z3, 0.35));
  const tilt = 0.6;
  return {target, dir: add3(add3(mul3(Z3, Math.cos(tilt)), mul3(N3(sHA), -Math.sin(tilt))), mul3(T3(sHA), 0.1)), dist: 12, f: 12 * 470 * (1 + 0.08 * push)};
};
/** the cutaway: slightly tilted top-down, tracking the crawl at its average speed */
/** the cutaway sits a little low in frame so the top captions clear the tail end */
export const WIDE_CY = 1100;
/** the cutaway's scale (px per world unit at the target) */
export const WIDE_PX = 148;
export const wideView = (tau: number): View => {
  const sc = trackS(tau) + 0.2;
  const T = T3(sc);
  return {target: add3(C3(sc), mul3(Z3, -0.3)), dir: add3(mul3(Z3, Math.cos(0.32)), mul3(T, Math.sin(0.32))), dist: 14, f: 14 * WIDE_PX, cy: WIDE_CY};
};
export const insideCam = (tau: number): Cam3 => {
  if (tau < 6.85) return toCam(macroView(tau));
  const u = ss5(tau, 6.85, 7.9);
  return toCam(lerpView(macroView(Math.min(tau, 7.0)), wideView(tau), u));
};

export const InsideShot: React.FC<{tau: number; camOverride?: Cam3}> = ({tau, camOverride}) => {
  const st = crawl(tau);
  const cam = camOverride ?? insideCam(tau);
  const B = basis(cam);
  const dist = Math.hypot(...(sub3(cam.eye, cam.target) as [number, number, number]));
  const Lt = lightFor(B, dist, {fog0: dist * 1.02, fogLen: dist * 0.9, d0: dist * 2.4});
  const L = layout(st.e);
  const sHA = st.sTail + (L.u5 + L.u6) / 2, sTA = st.sTail + (L.u1 + L.u2) / 2;
  // villi lean: an anchored head is pulled back as the body contracts; an anchored tail is pushed back as it extends
  const lean = (s: number) => 0.55 * st.aH * (1 - st.e) * Math.exp(-(((s - sHA) / 0.95) ** 2)) - 0.45 * st.aT * st.e * Math.exp(-(((s - sTA) / 0.95) ** 2));
  const span = 0.5 * 1920 / cam.f * dist + 3;
  const sc = trackS(tau);
  const center = tau < 7.5 ? Math.min(headAnchorS(st), SHA_REST) : sc;
  const robot = robotItems(B, Lt, gutFrame, st, {tetherLen: 24, inkScale: 1});
  return (
    <GutShot B={B} Lt={Lt} robot={robot}
      gut={{sFrom: center - span - 1, sTo: center + span + 1, contact: contactOf(st), px: tau < 7.2 ? 6 : 9, lean,
        shadow: {s0: st.sTail + 0.3, s1: st.sTail + bodyLen(st.e) - 0.3, r: (s) => Math.max(1, contactOf(st)(s) || 1), op: 0.8}}} />
  );
};
export const _i = [clamp, lerp, T3];
