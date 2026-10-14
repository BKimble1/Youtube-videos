// SET-STAGE (V3): the virtual training stage. A designed test environment that occupies the same world placement as
// the foundry: the launch tower stands where the walkway is (top 600, edge x = -214) and a round landing pedestal
// stands where the ladle is (radius 190, top at the steel level, 322). Matching placement lets a pose, a root position
// and a jump carry across the foundry ↔ simulation transitions without any jump in scale or position.
//   ground   measured stage floor (concentric range rings, ticks), calibration pylons at the perimeter
//   action   launch tower with a striped launch edge and schematic rails; landing pedestal with a target ring
//   graphics restrained: a dashed trajectory (arc3 in SimWorld), the target, an optional brief grid (scan)
// Conceptual illustration of simulation training in general, not Figure's simulator.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, norm, clamp01} from '../engine/math';
import {Env, Item, box, circle3, cylinder, line3, quad, tube, bbOf} from '../engine/prims';
import {polyClosed, smoothClosed} from '../engine/draw';

export const STAGE_ENV: Env = {light: norm([-0.4, 0.85, 0.45]), ambient: 0.78, ink: '#2C4A80', lineW: 2.2};
export const STAGE = {deckY: 600, edgeX: -214, x0: -820, z0: -135, z1: 135, thick: 22, padY: 322, padR: 190, padRb: 178, target: [-18, 322, 0] as V3, targetR: 62};
const COL = {
  floor: '#E3EBF7', ring: '#C2D2EA', tick: '#9DB5DA', deck: '#D5E2F5', deckTop: '#EAF1FB', deckSide: '#B9CBE6', leg: '#A9BFDF',
  edgeA: '#1CA7A0', edgeB: '#F7FBFF', rail: '#9DBBEA', pad: '#C8D8EF', padTop: '#EEF4FC', padRim: '#B4C8E6', target: '#1CA7A0', targetDark: '#0F6E68', pylon: '#B9CBE6',
};

export const StageBg: React.FC<{id?: string}> = ({id = 'stbg'}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F5F8FE" />
        <stop offset="0.55" stopColor="#E6EEFA" />
        <stop offset="1" stopColor="#D6E3F5" />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill={`url(#${id})`} />
  </g>
);

export type StageOpts = {
  key?: string;
  lane?: number;          // z offset of a duplicate lane (tower + pedestal); the floor is drawn only for lane 0
  floor?: boolean;
  grid?: number;          // 0..1 opacity of the measurement grid (used briefly in transitions)
  ringPulse?: number;
  ringColor?: string;
  target?: boolean;
  pylons?: boolean;
};

export const stage = (pr: Proj, env: Env, o: StageOpts = {}): Item[] => {
  const k = o.key ?? '';
  const dz = o.lane ?? 0;
  const S = STAGE;
  const items: Item[] = [];
  if (o.floor !== false) {
    const fl = quad(pr, env, 'stFloor' + k, [[-3200, 0, -2400], [2600, 0, -2400], [2600, 0, 2400], [-3200, 0, 2400]], COL.floor, {flat: true, stroke: false});
    if (fl) items.push({...fl, z: 1e6 + 1});
    // range rings centred between the tower and the pedestal, with ticks on the outer ring
    const rc: V3 = [-300, 0.5, 0];
    for (let r = 400; r <= 2000; r += 400) {
      items.push({...line3(pr, `stR${k}${r}`, circle3(rc, r, 96), COL.ring, r % 800 === 0 ? 3 : 1.8, {opacity: 0.8}), z: 1e6 + 0.6});
    }
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r0 = 2000, r1 = i % 4 === 0 ? 2120 : 2060;
      items.push({...line3(pr, `stT${k}${i}`, [[rc[0] + Math.cos(a) * r0, 0.5, Math.sin(a) * r0], [rc[0] + Math.cos(a) * r1, 0.5, Math.sin(a) * r1]], COL.tick, 3), z: 1e6 + 0.6});
    }
    const g = clamp01(o.grid ?? 0);
    if (g > 0) {
      for (let i = -20; i <= 20; i++) {
        items.push({...line3(pr, `stGx${k}${i}`, [[i * 100 - 300, 0.6, -2000], [i * 100 - 300, 0.6, 2000]], '#8FB0E4', i % 5 === 0 ? 2.4 : 1.2, {opacity: g}), z: 1e6 + 0.55});
        items.push({...line3(pr, `stGz${k}${i}`, [[-2300, 0.6, i * 100], [1700, 0.6, i * 100]], '#8FB0E4', i % 5 === 0 ? 2.4 : 1.2, {opacity: g}), z: 1e6 + 0.55});
      }
    }
    if (o.pylons !== false) {
      // calibration pylons around the perimeter: slim posts with tick bands (depth cues, not props)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const c: V3 = [rc[0] + Math.cos(a) * 1750, 0, Math.sin(a) * 1750];
        items.push(...box(pr, env, `pyl${k}${i}`, {c: [c[0], 260, c[2]], size: [22, 520, 22], color: COL.pylon}));
        for (let b = 0; b < 4; b++) items.push(...box(pr, env, `pylB${k}${i}_${b}`, {c: [c[0], 80 + b * 120, c[2]], size: [26, 14, 26], color: b % 2 ? COL.edgeA : '#FFFFFF'}));
      }
    }
  }
  // ---- launch tower (same footprint and height as the foundry walkway)
  const cx = (S.edgeX + S.x0) / 2, w = S.edgeX - S.x0, d = S.z1 - S.z0;
  items.push(...box(pr, env, 'stDeck' + k, {c: [cx, S.deckY - S.thick / 2, dz], size: [w, S.thick, d], color: COL.deck, top: COL.deckTop, side: COL.deckSide}));
  for (const lx of [S.x0 + 30, (S.x0 + S.edgeX) / 2, S.edgeX - 30]) for (const lz of [S.z0 + 18, S.z1 - 18]) {
    items.push(...box(pr, env, `stLeg${k}${lx}${lz}`, {c: [lx, (S.deckY - S.thick) / 2, dz + lz], size: [24, S.deckY - S.thick, 24], color: COL.leg}));
  }
  // cross bracing on both long sides
  for (const lz of [S.z0 + 18, S.z1 - 18]) {
    const xs = [S.x0 + 30, (S.x0 + S.edgeX) / 2, S.edgeX - 30];
    for (let i = 0; i < 2; i++) {
      items.push(line3(pr, `stBr${k}${lz}${i}a`, [[xs[i], 40, dz + lz], [xs[i + 1], S.deckY - 60, dz + lz]], COL.leg, 4, {plane: [0, 0, 1]}));
      items.push(line3(pr, `stBr${k}${lz}${i}b`, [[xs[i], S.deckY - 60, dz + lz], [xs[i + 1], 40, dz + lz]], COL.leg, 4, {plane: [0, 0, 1]}));
    }
  }
  // striped launch edge (front face) and launch strip on the top
  const stripes = 9;
  for (let s = 0; s < stripes; s++) {
    const za = S.z0 + (d / stripes) * s, zb = za + d / stripes;
    const q = quad(pr, env, `stEdge${k}${s}`, [[S.edgeX + 0.5, S.deckY - S.thick, dz + za], [S.edgeX + 0.5, S.deckY - S.thick, dz + zb], [S.edgeX + 0.5, S.deckY, dz + zb], [S.edgeX + 0.5, S.deckY, dz + za]], s % 2 ? COL.edgeB : COL.edgeA, {stroke: false, flat: true});
    if (q) items.push({...q, z: q.z - 1});
  }
  const strip = quad(pr, env, 'stStrip' + k, [[S.edgeX - 40, S.deckY + 0.6, dz + S.z0 + 14], [S.edgeX - 4, S.deckY + 0.6, dz + S.z0 + 14], [S.edgeX - 4, S.deckY + 0.6, dz + S.z1 - 14], [S.edgeX - 40, S.deckY + 0.6, dz + S.z1 - 14]], COL.edgeA, {stroke: false, flat: true, opacity: 0.85, solid: true});
  if (strip) items.push(strip);
  // schematic rails (open at the launch edge)
  for (const zr of [S.z0 + 6, S.z1 - 6]) {
    for (let p = 0; p < 5; p++) {
      const x = S.x0 + 30 + p * 110;
      if (x > S.edgeX - 110) break;
      items.push(tube(pr, env, `stPost${k}${zr}${p}`, [x, S.deckY, dz + zr], [x, S.deckY + 100, dz + zr], 2.6, COL.rail, {seg: 8, plane: [0, 0, 1]}));
    }
    items.push(tube(pr, env, `stRail${k}${zr}`, [S.x0 + 30, S.deckY + 100, dz + zr], [S.edgeX - 130, S.deckY + 100, dz + zr], 2.6, COL.rail, {seg: 8, plane: [0, 0, 1]}));
  }
  // ---- landing pedestal (the ladle's footprint) with the target on its top
  items.push(...cylinder(pr, env, 'stPad' + k, {base: [0, 0, dz], r0: S.padRb, r1: S.padR, h: S.padY, color: COL.pad, cap: false, seg: 48}));
  if (pr.pos[1] > S.padY) {
    const c: V3 = [0, S.padY, dz];
    const top = circle3(c, S.padR, 64).slice(0, 64);
    const rimIn = circle3([0, S.padY + 0.3, dz], S.padR - 14, 64).slice(0, 64);
    const P = (pts: V3[]) => pts.map((q) => pr.p(q));
    const tc: V3 = [S.target[0], S.padY + 0.6, S.target[2] + dz];
    const pulse = o.ringPulse ?? 0;
    const tr = S.targetR * (1 + 0.15 * pulse);
    const col = o.ringColor ?? COL.target;
    const els: React.ReactNode[] = [
      <path key="t" d={polyClosed(P(top))} fill={COL.padTop} stroke={env.ink} strokeWidth={env.lineW} />,
      <path key="r" d={polyClosed(P(top)) + polyClosed(P(rimIn))} fillRule="evenodd" fill={COL.padRim} />,
    ];
    // landing zone: a dashed outer circle and a crosshair
    els.push(<path key="lz" d={smoothClosed(P(circle3([tc[0], tc[1], tc[2]], 118, 48).slice(0, 48)))} fill="none" stroke={COL.targetDark} strokeWidth={2.5} strokeDasharray="10 9" strokeOpacity={0.55} />);
    for (const [a, b] of [[[tc[0] - 140, tc[1], tc[2]], [tc[0] + 140, tc[1], tc[2]]], [[tc[0], tc[1], tc[2] - 140], [tc[0], tc[1], tc[2] + 140]]] as [V3, V3][]) {
      const qa = pr.p(a), qb = pr.p(b);
      els.push(<line key={`x${qa.x}`} x1={qa.x} y1={qa.y} x2={qb.x} y2={qb.y} stroke={COL.targetDark} strokeWidth={1.8} strokeOpacity={0.35} />);
    }
    if (o.target !== false) {
      const ring = P(circle3(tc, tr, 48).slice(0, 48));
      const inner = P(circle3(tc, tr * 0.62, 48).slice(0, 48));
      const dot = P(circle3(tc, 12, 24).slice(0, 24));
      els.push(<path key="tr" d={polyClosed(ring) + polyClosed(inner)} fillRule="evenodd" fill={col} fillOpacity={0.9} stroke={COL.targetDark} strokeWidth={2} />);
      els.push(<path key="td" d={polyClosed(dot)} fill={col} />);
      if (pulse > 0) els.push(<path key="tp" d={smoothClosed(P(circle3(tc, tr * (1.2 + 0.6 * (1 - pulse)), 48).slice(0, 48)))} fill="none" stroke={col} strokeWidth={4} strokeOpacity={pulse} />);
    }
    const pts2 = P(top);
    items.push({z: pr.p(c).z, key: 'stPadTop' + k, geo: {kind: 'plane', n: [0, 1, 0], d: S.padY}, bb: bbOf(pts2), el: <g key={'stPadTop' + k}>{els}</g>});
  }
  return items;
};

/** Ground height under a point on the stage (pedestal top inside its radius, deck top on the tower, else floor). */
export const stageGround = (p: V3, lane = 0): number => {
  if (Math.hypot(p[0], p[2] - lane) < STAGE.padR) return STAGE.padY;
  if (p[0] < STAGE.edgeX && p[0] > STAGE.x0 && Math.abs(p[2] - lane) < STAGE.z1) return STAGE.deckY;
  return 0;
};
