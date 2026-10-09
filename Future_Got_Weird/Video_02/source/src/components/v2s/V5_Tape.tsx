import React from 'react';
import {C} from '../../theme';
import type {P2} from '../../lib/optics';

/**
 * V5.2 only: the path meter (a measuring tape graduated in nanoseconds of light travel) on the W1 → him leg, drawn in
 * world px for a parent <svg> (plan view; `toW` maps plan metres to world px, `k` = world px per screen px).
 *
 * The tape pays out from the wall spot as the pulse travels: one 30 cm stroke per nanosecond of travel. While the
 * pulse goes out to him the tape lies along the leg; while it comes back the tape keeps paying out straight on past his
 * token (the round trip unrolled), so it ends twice as long as the leg: two strokes of travel per stroke of distance.
 * Then it folds in half at his token (`fold` 0..1): the far half swings over like paper (its length along the leg
 * goes as cos θ) and lands in the lane beside the near half. Stroke edges are placed symmetrically about the fold, so
 * the stroke that straddles his token is 15 cm out + 15 cm back: one extra nanosecond, 15 cm farther (`straddle`).
 */

export type TapeProps = {
  /** the wall spot (start of the tape) and the unit direction toward him */
  W: P2;
  u: P2;
  /** the fold point's distance from W (= |W H|, metres) */
  F: number;
  /** metres of path paid out (0 .. 2F) */
  P: number;
  /** 0..1 the far half folds back over his token */
  fold: number;
  toW: (p: P2) => {x: number; y: number};
  /** world px per screen px */
  k: number;
  /** tape width (m) */
  width?: number;
  /** lane offset (m) of the near half from the leg's centre line; the folded half lands at -lane */
  lane?: number;
  /** 0..1 the straddling stroke turns coral */
  straddle?: number;
  /** 0..1 one bright pass over the whole tape (the chain's "≈ 8.9 ns"): a saffron glow round it, strokes brightened */
  flash?: number;
  /**
   * After the fold: a light that runs down the folded tape from the wall spot (0) to the fold (F), lighting each
   * stroke pair as it passes (one pair = one nanosecond of travel = 15 cm of distance). `runner` is its distance (m)
   * along the leg, `runnerOn` 0..1 its strength.
   */
  runner?: number;
  runnerOn?: number;
  /** 0..1 one bright pass over the straddling stroke only ("fifteen centimetres") */
  straddleFlash?: number;
  opacity?: number;
};

/** metres of travel per stroke (one nanosecond of light travel, rounded as on screen: 30 cm) */
export const STROKE_M = 0.3;

/** Stroke edges (path metres) for a fold at F: symmetric about F, the straddling stroke [F - 0.15, F + 0.15]. */
export const tapeEdges = (F: number) => {
  const e: number[] = [];
  for (let s = F - STROKE_M / 2; s > 0.02; s -= STROKE_M) e.unshift(s);
  e.unshift(0);
  for (let s = F + STROKE_M / 2; s < 2 * F - 0.02; s += STROKE_M) e.push(s);
  e.push(2 * F);
  return e;
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const u = Math.max(0, Math.min(1, t));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, '0')).join('');
};
const smooth = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};
const f2 = (n: number) => Math.round(n * 100) / 100;

export const Tape: React.FC<TapeProps> = ({W, u, F, P, fold, toW, k, width = 0.09, lane = 0.06, straddle = 0, flash = 0, straddleFlash = 0, runner = 0, runnerOn = 0, opacity = 1}) => {
  if (P <= 0.002 || opacity <= 0.001) return null;
  const n: P2 = {x: -u.z, z: u.x};
  const th = Math.PI * smooth(fold);
  const cos = Math.cos(th);
  const flapLane = lane * (1 - 2 * smooth((fold - 0.2) / 0.8));
  const backSide = cos < 0;
  /** plan point of path coordinate s at lateral offset `off` (m) */
  const at = (s: number, off: number): P2 => {
    const along = s <= F ? s : F + (s - F) * cos;
    const lat = s <= F ? lane : flapLane;
    return {x: W.x + u.x * along + n.x * (lat + off), z: W.z + u.z * along + n.z * (lat + off)};
  };
  const quad = (a: number, b: number) => {
    const pts = [at(a, -width / 2), at(b, -width / 2), at(b, width / 2), at(a, width / 2)].map(toW);
    return `M ${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(' L ')} Z`;
  };
  const edges = tapeEdges(F);
  const strokes: React.ReactNode[] = [];
  const ticks: React.ReactNode[] = [];
  const flapStrokes: React.ReactNode[] = [];
  const flapTicks: React.ReactNode[] = [];
  const mid = edges.findIndex((e, i) => i + 1 < edges.length && e < F && edges[i + 1] > F);
  /** the runner's light on a piece whose midpoint lies `along` metres from the wall spot */
  const lit = (along: number) => (runnerOn > 0 ? runnerOn * Math.max(0, 1 - Math.abs(along - runner) / 0.2) : 0);
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i];
    const b = Math.min(edges[i + 1], P);
    if (b <= a) break;
    let col = i % 2 === 0 ? C.tealLight : C.teal;
    if (i === mid) col = mix(mix(col, C.coral, straddle), C.saffronLight, 0.8 * straddleFlash);
    col = mix(col, C.cream, 0.45 * flash);
    // split at the fold: the near half and the flap
    if (a < F) {
      const bb = Math.min(b, F);
      strokes.push(<path key={`s${i}`} d={quad(a, bb)} fill={mix(col, C.cream, 0.8 * lit((a + bb) / 2))} />);
      if (a > 0) {
        const p0 = toW(at(a, -width / 2));
        const p1 = toW(at(a, width / 2));
        ticks.push(<line key={`t${i}`} x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={C.ink} strokeWidth={3 * k} />);
      }
    }
    if (b > F) {
      const aa = Math.max(a, F);
      const fc = backSide ? mix(col, C.ink, 0.12) : col;
      flapStrokes.push(<path key={`f${i}`} d={quad(aa, b)} fill={mix(fc, C.cream, 0.8 * lit(F - ((aa + b) / 2 - F) * Math.max(0, -cos)))} />);
      if (a > F) {
        const p0 = toW(at(a, -width / 2));
        const p1 = toW(at(a, width / 2));
        flapTicks.push(<line key={`ft${i}`} x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={C.ink} strokeWidth={3 * k} />);
      }
    }
  }
  const nearEnd = Math.min(P, F);
  const outline = (a: number, b: number) => <path d={quad(a, b)} fill="none" stroke={C.ink} strokeWidth={3.5 * k} strokeLinejoin="round" />;
  const flapOn = P > F + 0.002;
  // the flap lifts while it turns over: a hard shadow that grows with sin θ
  const lift = Math.sin(th);
  const glow = (a: number, b: number) => <path d={quad(a, b)} fill={C.saffronLight} stroke={C.saffronLight} strokeWidth={26 * k} strokeLinejoin="round" opacity={flash} />;
  return (
    <g opacity={opacity}>
      {flash > 0.001 && glow(0, nearEnd)}
      {flash > 0.001 && P > F + 0.002 && glow(F, P)}
      <path d={quad(0, nearEnd)} fill="rgba(22,42,50,0.16)" transform={`translate(${f2(5 * k)} ${f2(6 * k)})`} />
      {strokes}
      {ticks}
      {outline(0, nearEnd)}
      {flapOn && (
        <g>
          <path d={quad(F, P)} fill="rgba(22,42,50,0.16)" transform={`translate(${f2((5 + 22 * lift) * k)} ${f2((6 + 26 * lift) * k)})`} />
          {flapStrokes}
          {flapTicks}
          {outline(F, P)}
        </g>
      )}
    </g>
  );
};

/** Plan point on the tape's lane at path coordinate s (unfolded), for placing the pulse on it. */
export const tapeLanePoint = (W: P2, u: P2, s: number, lane: number): P2 => {
  const n: P2 = {x: -u.z, z: u.x};
  return {x: W.x + u.x * s + n.x * lane, z: W.z + u.z * s + n.z * lane};
};
