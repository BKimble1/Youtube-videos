// FX-CUTAWAY / ACTUATOR PUCK: an orderly section through a rotary joint actuator (illustrative, generic layout:
// housing, stator teeth, rotor with magnets, planetary stage, output bearing) and a detachable actuator "puck" for the
// teardown. Both are built in world space around the joint axis, so they sit on the knee in perspective.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, cross, len, mulS, norm, clamp01} from '../engine/math';
import {Env, Item, bbOf, shadeFace} from '../engine/prims';
import {hull, polyClosed} from '../engine/draw';
import {C} from '../../theme';

/** Points on a circle of radius r around `axis` through c. */
export const ringAround = (c: V3, axis: V3, r: number, n = 40, phase = 0): V3[] => {
  const a = norm(axis);
  let u = cross(a, [0, 1, 0]);
  if (len(u) < 1e-3) u = cross(a, [1, 0, 0]);
  u = norm(u);
  const v = cross(a, u);
  const out: V3[] = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (k / n) * Math.PI * 2;
    out.push(add(c, add(mulS(u, Math.cos(t) * r), mulS(v, Math.sin(t) * r))));
  }
  return out;
};

/** Section through the actuator, drawn on the face of the joint (c = face centre, axis = joint axis, toward camera). */
export const ActuatorSection: React.FC<{pr: Proj; c: V3; axis: V3; t: number; k: number; scale?: number}> = ({pr, c, axis, t, k, scale = 1}) => {
  if (k <= 0) return null;
  const S = scale;
  const P = (pts: V3[]) => polyClosed(pts.map((q) => pr.p(q)));
  const spin = t * 2.4;
  const teeth: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2, a1 = a0 + 0.26;
    const pts = [...ringAround(c, axis, 5.3 * S, 1, a0), ...ringAround(c, axis, 6.5 * S, 1, a0), ...ringAround(c, axis, 6.5 * S, 1, a1), ...ringAround(c, axis, 5.3 * S, 1, a1)];
    teeth.push(<path key={'t' + i} d={P(pts)} fill="#C9854A" stroke="#7A4A22" strokeWidth={1} />);
  }
  const mags: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a0 = spin + (i / 8) * Math.PI * 2, a1 = a0 + 0.5;
    const pts = [...ringAround(c, axis, 4.2 * S, 1, a0), ...ringAround(c, axis, 4.9 * S, 1, a0), ...ringAround(c, axis, 4.9 * S, 1, a1), ...ringAround(c, axis, 4.2 * S, 1, a1)];
    mags.push(<path key={'m' + i} d={P(pts)} fill={i % 2 ? '#C94A36' : '#4F7CC9'} />);
  }
  const planets: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const a = -spin * 0.4 + (i / 3) * Math.PI * 2;
    const pc = ringAround(c, axis, 2.3 * S, 1, a)[0];
    planets.push(<path key={'p' + i} d={P(ringAround(pc, axis, 1.25 * S, 18))} fill="#AEB8C2" stroke="#0A1115" strokeWidth={1.5} />);
  }
  return (
    <g opacity={clamp01(k)}>
      <path d={P(ringAround(c, axis, 7.6 * S, 48))} fill="#3A424A" stroke={C.saffron} strokeWidth={4} />
      {teeth}
      <path d={P(ringAround(c, axis, 5.1 * S, 40))} fill="#151A1F" />
      <path d={P(ringAround(c, axis, 4.9 * S, 40))} fill="#5B6670" />
      {mags}
      <path d={P(ringAround(c, axis, 3.7 * S, 40))} fill="#2B3138" stroke="#0A1115" strokeWidth={1.5} />
      {planets}
      <path d={P(ringAround(c, axis, 0.9 * S, 16))} fill={C.saffron} />
    </g>
  );
};

/** A detachable actuator puck (housing + face with a bolt circle) along `axis`, centred at c, width w. */
export const actuatorPuck = (pr: Proj, env: Env, key: string, c: V3, axis: V3, o: {r?: number; w?: number; color?: string; bolts?: number; boltOut?: number; z?: number} = {}): Item => {
  const r = o.r ?? 5.8, w = o.w ?? 7;
  const a = norm(axis);
  const back = ringAround(add(c, mulS(a, -w / 2)), a, r, 28);
  const front = ringAround(add(c, mulS(a, w / 2)), a, r, 28);
  const side = hull([...back, ...front].map((q) => pr.p(q)));
  const toCam = pr.toCam(c);
  const faceVisible = toCam[0] * a[0] + toCam[1] * a[1] + toCam[2] * a[2] > 0;
  const col = o.color ?? '#59626C';
  const fc = shadeFace(env, '#9AA5B0', faceVisible ? a : mulS(a, -1), c);
  const sc = shadeFace(env, col, norm(add(env.light, toCam)), c);
  const face = faceVisible ? front : back;
  const fcen = add(c, mulS(a, faceVisible ? w / 2 : -w / 2));
  const bolts: React.ReactNode[] = [];
  const nb = o.bolts ?? 6;
  for (let i = 0; i < nb; i++) {
    const bp = ringAround(add(fcen, mulS(a, (faceVisible ? 1 : -1) * (o.boltOut ?? 0))), a, r * 0.78, 1, (i / nb) * Math.PI * 2 + 0.3)[0];
    bolts.push(<path key={i} d={polyClosed(ringAround(bp, a, 0.6, 10).map((q) => pr.p(q)))} fill="#E3E8EC" stroke={env.ink} strokeWidth={1} />);
  }
  return {
    z: o.z ?? pr.p(c).z - 2, key, bb: bbOf(side), poly: side,
    el: (
      <g key={key}>
        <path d={polyClosed(side)} fill={sc} stroke={env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />
        <path d={polyClosed(face.map((q) => pr.p(q)))} fill={fc} stroke={env.ink} strokeWidth={env.lineW * 0.8} />
        <path d={polyClosed(ringAround(fcen, a, r * 0.45, 20).map((q) => pr.p(q)))} fill="#D5DCE2" stroke={env.ink} strokeWidth={1.2} />
        {bolts}
      </g>
    ),
  };
};
