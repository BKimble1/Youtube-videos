// clerkA's magnetic tether: a clamp fired on a cable from a hip-reel launcher. The clamp arcs to the target and bites
// (sparks); the cable sags while slack, can be wrapped round an anchor (a girder post) and pulled taut, and snaps when
// cut (whip-back on the launcher side, the far end dangles from the clamp, frayed strands at both cut ends).
//
// The cable is split into short spans, each its own sprite, so it sorts correctly as it passes figures and machines.
import React from 'react';
import {V3, add3, sub3, mul3, lerp, lerp3, clamp, len3, norm3, rnd, easeOut} from '../../kit/math';
import {Item, project, SpriteCtx} from '../engine';
import {FxOut, fx, combine, f1, tone, inkTone, glowTone, basisAround} from './core';
import {sparks3, flash3} from './particles';

export type TetherOpts = {
  key: string;
  t: number;
  /** launcher muzzle (from the rig: the launcher in clerkA's hand) */
  muzzle: (t: number) => V3;
  /** clamp target on the machine (from MECH: a point on its armour) */
  target: (t: number) => V3;
  fireAt: number;
  flight?: number;
  /** anchor post the cable is wrapped round (cable goes muzzle → anchor → clamp after wrapAt) */
  anchor?: V3; wrapAt?: number; anchorR?: number;
  /** cable goes taut (pulling) from here */
  tautAt?: number;
  /** cut (by a drone): snap point as a fraction of the cable from the muzzle */
  snapAt?: number; snapU?: number;
  /** reel the launcher side back in after the snap */
  reelAt?: number;
  /** total cable length when slack (m); default 1.15 × the fired distance */
  slackLen?: number;
  seed?: number;
  /** cable radius (m) for drawing; default 0.016 (thicken for wide shots so the line reads) */
  cableR?: number;
};

export type TetherState = {phase: 'idle' | 'flight' | 'slack' | 'taut' | 'snapped'; clamp: V3 | null; tension: number};

const CABLE = '#2E3A42', CABLE_HI = '#E8B23A', CLAMP = '#2A2D31', JAW = '#E8B23A'; // dark cable with a hazard-yellow tracer

/** Sample a cable between a and b with sag (m) along −y, plus an optional lateral wave (m) of `waves` half-cycles. */
const span = (a: V3, b: V3, sag: number, n = 14, wave = 0, waves = 3, phase = 0): V3[] => {
  const d = sub3(b, a);
  const {u} = basisAround(len3(d) > 1e-4 ? d : {x: 1, y: 0, z: 0});
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const p = lerp3(a, b, s);
    const w = wave * Math.sin(s * Math.PI * waves + phase) * Math.sin(s * Math.PI);
    return add3(add3(p, {x: 0, y: -sag * 4 * s * (1 - s), z: 0}), mul3(u, w));
  });
};

/** Cable polyline → depth-sorted span sprites. */
const cableItems = (pts: V3[], key: string, opts: {chunk?: number; r?: number} = {}): Item[] => {
  const ch = opts.chunk ?? 3;
  const items: Item[] = [];
  for (let i = 0; i < pts.length - 1; i += ch) {
    const seg = pts.slice(i, Math.min(pts.length, i + ch + 1));
    const mid = seg[Math.floor(seg.length / 2)];
    items.push({
      kind: 'sprite', pos: mid, key: `${key}_${i}`,
      draw: (c: SpriteCtx) => {
        const S = seg.map((p) => project(c.view, p));
        if (S.some((s) => s.z < c.view.near)) return null;
        const kAvg = S.reduce((s, q) => s + q.k, 0) / S.length;
        const w = Math.max(2.0, (opts.r ?? 0.016) * 2 * kAvg);
        const d = 'M' + S.map((s) => `${f1(s.x)} ${f1(s.y)}`).join('L');
        return (
          <g>
            <path d={d} fill="none" stroke={inkTone(c)} strokeWidth={f1(w + 1.4)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={tone(c, CABLE)} strokeWidth={f1(w)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={tone(c, CABLE_HI, 2)} strokeWidth={f1(Math.max(0.8, w * 0.32))} strokeLinecap="round" strokeDasharray={`${f1(w * 3)} ${f1(w * 2.2)}`} opacity={0.85} />
          </g>
        );
      },
    });
  }
  return items;
};

/** The magnetic clamp: a dark disc with two hazard-yellow jaws, oriented along the cable's arrival direction. */
const clampItem = (p: V3, from: V3, key: string, bite: number): Item => ({
  kind: 'sprite', pos: p, key: `${key}_clamp`, bias: 0.05,
  draw: (c) => {
    const s0 = project(c.view, from);
    const ang = Math.atan2(c.y - s0.y, c.x - s0.x) * 57.2958;
    const R = Math.max(2.5, 0.075 * c.k);
    const jaw = R * (1.25 - 0.3 * bite);
    const iw = Math.max(0.8, Math.min(2.2, 0.012 * c.k));
    return (
      <g transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(ang)})`}>
        <path d={`M ${f1(-R * 0.2)} ${f1(-R * 0.9)} L ${f1(jaw)} ${f1(-R * 1.15)} L ${f1(jaw * 0.8)} ${f1(-R * 0.35)} Z`} fill={tone(c, JAW)} stroke={inkTone(c)} strokeWidth={f1(iw)} strokeLinejoin="round" />
        <path d={`M ${f1(-R * 0.2)} ${f1(R * 0.9)} L ${f1(jaw)} ${f1(R * 1.15)} L ${f1(jaw * 0.8)} ${f1(R * 0.35)} Z`} fill={tone(c, JAW)} stroke={inkTone(c)} strokeWidth={f1(iw)} strokeLinejoin="round" />
        <rect x={f1(-R * 1.3)} y={f1(-R * 0.75)} width={f1(R * 1.5)} height={f1(R * 1.5)} rx={f1(R * 0.3)} fill={tone(c, CLAMP)} stroke={inkTone(c)} strokeWidth={f1(iw)} />
        <circle cx={f1(-R * 0.55)} cy={0} r={f1(R * 0.38)} fill={glowTone(c, bite > 0.5 ? '#7FE8FF' : '#5A6A72')} />
      </g>
    );
  },
});

/** Frayed strands at a cut end, splaying away from the cable direction. */
const frayItem = (p: V3, dir: V3, key: string, seed: number): Item => ({
  kind: 'sprite', pos: p, key: `${key}_fray`,
  draw: (c) => {
    const s1 = project(c.view, add3(p, mul3(norm3(dir), 0.12)));
    const ang = Math.atan2(s1.y - c.y, s1.x - c.x);
    const L = Math.max(4, 0.09 * c.k);
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const a = ang + (rnd(seed * 7 + i) - 0.5) * 1.6;
          const l = L * (0.6 + 0.6 * rnd(seed * 11 + i));
          return <line key={i} x1={f1(c.x)} y1={f1(c.y)} x2={f1(c.x + Math.cos(a) * l)} y2={f1(c.y + Math.sin(a) * l)} stroke={tone(c, i % 2 ? CABLE_HI : CABLE)} strokeWidth={f1(Math.max(0.8, 0.006 * c.k))} strokeLinecap="round" />;
        })}
      </g>
    );
  },
});

/** Wrap loops round the anchor post (two turns of cable). */
const wrapItem = (a: V3, r: number, key: string): Item => ({
  kind: 'sprite', pos: a, key: `${key}_wrap`, bias: 0.12,
  draw: (c) => {
    const loops = [0, 1].map((k) => Array.from({length: 18}, (_, i) => {
      const th = (i / 17) * Math.PI * 2;
      return project(c.view, add3(a, {x: Math.cos(th) * r, y: k * 0.05 + Math.sin(th) * 0.01, z: Math.sin(th) * r}));
    }));
    if (loops.some((L) => L.some((s) => s.z < c.view.near))) return null;
    const w = Math.max(1.3, 0.026 * c.k);
    return (
      <g>
        {loops.map((L, k) => {
          const d = 'M' + L.map((s) => `${f1(s.x)} ${f1(s.y)}`).join('L');
          return (
            <g key={k}>
              <path d={d} fill="none" stroke={inkTone(c)} strokeWidth={f1(w + 1.4)} strokeLinecap="round" />
              <path d={d} fill="none" stroke={tone(c, CABLE)} strokeWidth={f1(w)} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    );
  },
});

export const tetherState = (o: TetherOpts, t: number): TetherState => {
  const fl = o.flight ?? 0.32;
  if (t < o.fireAt) return {phase: 'idle', clamp: null, tension: 0};
  if (t < o.fireAt + fl) {
    const u = easeOut((t - o.fireAt) / fl);
    const a = o.muzzle(o.fireAt), b = o.target(t);
    const p = add3(lerp3(a, b, u), {x: 0, y: 0.35 * len3(sub3(b, a)) * 0.12 * Math.sin(Math.PI * u), z: 0});
    return {phase: 'flight', clamp: p, tension: 0};
  }
  const clampP = o.target(t);
  if (o.snapAt !== undefined && t >= o.snapAt) return {phase: 'snapped', clamp: clampP, tension: 0};
  if (o.tautAt !== undefined && t >= o.tautAt) return {phase: 'taut', clamp: clampP, tension: clamp((t - o.tautAt) / 0.15)};
  return {phase: 'slack', clamp: clampP, tension: 0};
};

/** Everything the tether draws at film time o.t, plus its bite/snap sparks. */
export const tetherItems = (o: TetherOpts): FxOut => {
  const t = o.t, fl = o.flight ?? 0.32, seed = o.seed ?? 1;
  const st = tetherState(o, t);
  if (st.phase === 'idle' || !st.clamp) return fx();
  const M = o.muzzle(t);
  const wrapped = o.anchor !== undefined && o.wrapAt !== undefined && t >= o.wrapAt;
  const via: V3[] = wrapped ? [M, o.anchor as V3, st.clamp] : [M, st.clamp];
  const fired = len3(sub3(o.target(o.fireAt + fl), o.muzzle(o.fireAt)));
  const slackLen = o.slackLen ?? fired * 1.15;
  const items: Item[] = [];
  const out: FxOut[] = [];
  const bite = clamp((t - o.fireAt - fl) / 0.08);

  if (st.phase === 'snapped') {
    const age = t - (o.snapAt as number);
    // total polyline and cut point
    const segL = via.slice(1).map((p, i) => len3(sub3(p, via[i])));
    const tot = segL.reduce((a, b) => a + b, 0);
    let rem = (o.snapU ?? 0.55) * tot, k = 0;
    while (k < segL.length - 1 && rem > segL[k]) { rem -= segL[k]; k++; }
    const C0 = lerp3(via[k], via[k + 1], clamp(rem / Math.max(1e-4, segL[k])));
    // launcher side: whips back toward the launcher, then hangs from it (or reels in)
    const back = sub3(C0, M);
    const reel = o.reelAt !== undefined && t > o.reelAt ? clamp((t - o.reelAt) / 0.8) : 0;
    const hangLen = Math.max(0.05, len3(back) * (1 - 0.65 * easeOut(age / 0.35)) * (1 - reel));
    const endA = add3(M, add3(mul3(norm3(back), hangLen * Math.max(0, 1 - age / 0.6) * 0.8), {x: 0, y: -hangLen * clamp(age / 0.6) * 0.9, z: 0}));
    const whip = 0.25 * Math.exp(-5 * age) * len3(back) * 0.4;
    items.push(...cableItems(span(M, endA, 0.1 * clamp(age / 0.4) * hangLen, 12, whip, 4, age * 30), `${o.key}_a`, {r: o.cableR}));
    items.push(frayItem(endA, sub3(endA, M), `${o.key}_fa`, seed));
    // far side: falls and swings from the clamp
    const farLen = tot - (o.snapU ?? 0.55) * tot;
    const swing = Math.sin(age * 4) * Math.exp(-1.5 * age) * 0.6;
    const fall = clamp(age / 0.7);
    const dirOut = norm3(sub3(C0, st.clamp));
    const endB0 = add3(st.clamp, mul3(dirOut, farLen));
    const endB1 = add3(st.clamp, {x: dirOut.x * farLen * 0.25 + swing, y: -farLen * 0.9, z: dirOut.z * farLen * 0.25});
    const endB = lerp3(endB0, endB1, easeOut(fall));
    items.push(...cableItems(span(st.clamp, endB, 0.15 * farLen * (1 - fall), 12), `${o.key}_b`, {r: o.cableR}));
    items.push(frayItem(endB, sub3(endB, st.clamp), `${o.key}_fb`, seed + 3));
    items.push(clampItem(st.clamp, endB, o.key, 1));
    if (wrapped && k >= 1) items.push(wrapItem(o.anchor as V3, o.anchorR ?? 0.22, o.key));
    out.push(fx(sparks3({at: C0, t, t0: o.snapAt as number, key: `${o.key}_snapsp`, n: 14, dir: {x: 0, y: 0.4, z: 0}, spread: 120, speed: [2, 6], seed: seed + 9})));
    out.push(fx(flash3({at: C0, t, t0: o.snapAt as number, key: `${o.key}_snapfl`, r: 0.35, dur: 0.1})));
    return combine(fx(items), ...out);
  }

  // in flight / slack / taut
  const segL = via.slice(1).map((p, i) => len3(sub3(p, via[i])));
  const tot = segL.reduce((a, b) => a + b, 0);
  const slackFrac = st.phase === 'taut' ? 0 : st.phase === 'flight' ? 0.12 : clamp((slackLen - tot) / Math.max(0.5, slackLen));
  const twang = st.phase === 'taut' ? 0.06 * Math.exp(-8 * (t - (o.tautAt as number))) : 0;
  via.slice(1).forEach((b, i) => {
    const a = via[i];
    const L = segL[i];
    const sag = L * (st.phase === 'taut' ? 0.004 : 0.04 + slackFrac * 0.45);
    items.push(...cableItems(span(a, b, sag, 14, twang * L, 2, (t - (o.tautAt ?? 0)) * 45), `${o.key}_s${i}`, {r: o.cableR}));
  });
  if (wrapped) items.push(wrapItem(o.anchor as V3, o.anchorR ?? 0.22, o.key));
  items.push(clampItem(st.clamp, via[via.length - 2], o.key, bite));
  if (t >= o.fireAt + fl) {
    const hitN = norm3(sub3(o.muzzle(o.fireAt + fl), st.clamp));
    out.push(fx(sparks3({at: st.clamp, t, t0: o.fireAt + fl, key: `${o.key}_bite`, n: 12, dir: hitN, spread: 70, speed: [1.5, 5], seed: seed + 1, flash: 0.18})));
  }
  // launch puff at the muzzle
  if (t < o.fireAt + 0.12) out.push(fx(flash3({at: o.muzzle(o.fireAt), t, t0: o.fireAt, key: `${o.key}_mz`, r: 0.18, dur: 0.1, color: '#DDF6FF'})));
  return combine(fx(items), ...out);
};

/** Convenience: where the clamp is (for MECH to show the hit point / for pulling the target). */
export const tetherClamp = (o: TetherOpts, t: number) => tetherState(o, t).clamp;
