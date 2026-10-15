// The dog: one medium golden dog, teal collar with a ring for the leash. Seen from the side in 3/4,
// facing screen-right (toward the man). Secondary and restrained: looks up, startles a step back,
// sits and leans in. Built in a local frame (facing +x) and placed with translate/scale; the key light
// is fixed in world space, so the frame is never mirrored or rotated. Weird Crew style: ink contours,
// white-sclera eyes with catchlights, ink brows, glossy nose and collar.
import React from 'react';
import {lit, mix, PAL, shade} from '../lib/color';
import {Deco, INK, Inked, InkLine} from '../lib/ink';
import {add, fmt, mul, P, rad, rot, V} from '../lib/math';
import {Blob, Capsule, SoftShadow, Sphere} from '../lib/shade';

export type DogPose = {
  x: number;
  y: number; // ground line under the paws
  s: number;
  /** head raise (deg, + = looks up) */
  head: number;
  /** ears 0 = relaxed/floppy, 1 = perked */
  ears: number;
  /** tail angle (deg, + = up) */
  tail: number;
  /** body lowered (sit / crouch) 0..1 */
  sit: number;
  /** lean back (startle) deg */
  lean: number;
  /** walk phase (radians) and amount 0..1 */
  step: number;
  stepAmt: number;
  /** brow worry 0..1 */
  worry: number;
  /** 1 = facing screen-right, -1 = facing screen-left (mirrored in the local frame, so the key light stays upper-left) */
  facing?: number;
};

const COL = PAL.dog;

/** Dog-local point -> world (same mapping the drawing uses). */
export const dogPoint = (d: DogPose, x: number, y: number): V => {
  const fx = d.facing ?? 1;
  const r = rot({x: x * fx, y}, -d.lean * fx, {x: -80 * fx, y: 0});
  return {x: d.x + r.x * d.s, y: d.y + r.y * d.s};
};
/** The collar ring the leash clips to (the drawing uses this same point). */
export const collarRing = (d: DogPose): V => dogPoint(d, 118, -128 + d.sit * 26 - 66 + d.sit * 4);

export const Dog: React.FC<{id: string; pose: DogPose}> = ({id, pose: d}) => {
  const s = d.s;
  const fx = d.facing ?? 1;
  // local -> world (lean rotates the whole dog about the hind paws; facing mirrors the local frame)
  const W = (x: number, y: number): V => dogPoint(d, x, y);
  const sit = d.sit;
  const bodyY = -128 + sit * 26;
  const hipY = bodyY + 8 + sit * 30;
  const legSwing = (ph: number) => Math.sin(d.step + ph) * 14 * d.stepAmt;
  const farC = shade(COL, 0.2);
  const hd = rot({x: 150, y: -222 + sit * 10}, -d.head * 0.35, {x: 110, y: -150});
  const headC = W(hd.x, hd.y);
  const headAng = -d.head;
  const H = (x: number, y: number): V => {
    // head-local -> world, rotating with head raise
    const r = rot({x: x * fx, y}, headAng * 0.8 * fx, {x: 0, y: 0});
    return add(headC, mul(r, s));
  };
  const bodyD = (() => {
    const pts = [W(-120, bodyY - 10 + sit * 20), W(-60, bodyY - 42), W(40, bodyY - 46), W(110, bodyY - 40), W(126, bodyY + 4), W(96, bodyY + 46), W(20, bodyY + 40), W(-60, hipY + 40), W(-126, hipY + 26)];
    let dd = `M${P(pts[0])}`;
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const p3 = pts[(i + 2) % pts.length];
      dd += ` C${P(add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6)))} ${P(add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6)))} ${P(p2)}`;
    }
    return dd + ' Z';
  })();
  // the collar ring: the same point the leash (art/Leash.tsx) clips to
  const ring = collarRing(d);

  const OUT = 6 * s;
  const leg = (k: string, top: V, foot: V, r0: number, r1: number, c: string) => (
    <Inked key={k} w={OUT}>
      <Capsule id={`${id}-${k}`} a={top} b={foot} ra={r0 * s} rb={r1 * s} color={c} spec={0.22} />
      <Sphere id={`${id}-${k}p`} c={add(foot, {x: 6 * s * fx, y: -2 * s})} r={r1 * 1.35 * s} ry={r1 * 0.95 * s} color={c} k={0.7} />
    </Inked>
  );
  // tail: three segments, curved
  const t0 = W(-120, bodyY - 6);
  const td = (a: number) => ({x: -Math.cos(rad(a)) * fx, y: -Math.sin(rad(a))});
  const t1 = add(t0, mul(td(d.tail * 0.6 + 10), 40 * s));
  const t2 = add(t1, mul(td(d.tail + 20), 38 * s));
  const t3 = add(t2, mul(td(d.tail * 1.2 + 34), 30 * s));

  return (
    <g>
      <SoftShadow id={`${id}-sh`} c={{x: d.x + 10 * s * fx, y: d.y + 4 * s}} rx={170 * s} ry={20 * s} alpha={0.34} />
      {/* far legs */}
      {leg('lf2', W(64, bodyY + 20), W(70 + legSwing(Math.PI), -4), 17, 12, farC)}
      {leg('lh2', W(-96, hipY + 10), W(-104 - legSwing(0) + sit * 30, -4), 22, 12, farC)}
      {/* tail */}
      <Inked w={OUT}>
        <Capsule id={`${id}-t0`} a={t0} b={t1} ra={15 * s} rb={12 * s} color={COL} spec={0.2} />
        <Capsule id={`${id}-t1`} a={t1} b={t2} ra={12 * s} rb={9 * s} color={lit(COL, 0.06)} spec={0.2} />
        <Capsule id={`${id}-t2`} a={t2} b={t3} ra={9 * s} rb={5 * s} color={lit(COL, 0.14)} spec={0.2} />
      </Inked>
      {/* body, chest and haunch merged into one outlined shape */}
      <Inked w={OUT}>
        <Blob id={`${id}-bd`} d={bodyD} c={W(10, bodyY - 20)} r={150 * s} color={COL} k={1.05} />
        <Sphere id={`${id}-hn`} c={W(-82, hipY - 4)} r={52 * s} ry={58 * s} color={COL} k={0.9} spec={0.15} />
      </Inked>
      <Deco>
        {/* lighter chest fur and the haunch's own rounded form */}
        <Sphere id={`${id}-ch`} c={W(92, bodyY + 4)} r={44 * s} ry={50 * s} color={PAL.dogLight} k={0.7} />
        <path d={`M${P(W(-40, hipY - 50))} Q${P(W(-20, hipY + 10))} ${P(W(-52, hipY + 44))}`} fill="none" stroke={INK} strokeWidth={OUT * 0.7} strokeLinecap="round" opacity={0.8} />
        <ellipse cx={fmt(W(-10, bodyY - 30).x)} cy={fmt(W(-10, bodyY - 30).y)} rx={fmt(56 * s)} ry={fmt(12 * s)} fill="#FFFFFF" opacity={0.3} />
      </Deco>
      {/* near legs */}
      {leg('lh1', W(-76, hipY + 18), W(-82 + legSwing(Math.PI) + sit * 40, -4), 24, 13, COL)}
      {leg('lf1', W(90, bodyY + 24), W(96 + legSwing(0), -4), 18, 13, COL)}
      {/* far ear behind the head */}
      <Inked w={OUT}>
        <Blob id={`${id}-fe`} d={`M${P(H(-18, -30))} C${P(H(-30, 0))} ${P(H(-30, 34))} ${P(H(-24, 60))} C${P(H(-8, 70))} ${P(H(4, 50))} ${P(H(2, 10))} Z`} c={H(-12, 10)} r={50 * s} color={farC} />
      </Inked>
      {/* neck + head + snout: one outlined shape */}
      <Inked w={OUT}>
        <Capsule id={`${id}-nk`} a={W(84, bodyY - 10)} b={add(headC, {x: -14 * s, y: 16 * s})} ra={42 * s} rb={34 * s} color={COL} />
        <Sphere id={`${id}-hd`} c={headC} r={48 * s} ry={44 * s} color={COL} spec={0.25} />
        <Capsule id={`${id}-sn`} a={H(18, 14)} b={H(66, 22)} ra={27 * s} rb={21 * s} color={PAL.dogLight} spec={0.3} />
      </Inked>
      {/* collar + ring */}
      <Inked w={OUT * 0.8}>
        <Capsule id={`${id}-cl`} a={W(96, bodyY - 92 + sit * 4)} b={W(136, bodyY - 50 + sit * 4)} ra={11 * s} rb={11 * s} color="#1CA7A0" spec={0.6} k={1.1} />
        <Sphere id={`${id}-rg`} c={ring} r={7 * s} color="#C9CED4" spec={0.9} />
      </Inked>
      {/* glossy nose */}
      <Inked w={OUT * 0.7}>
        <Sphere id={`${id}-ns`} c={H(72, 14)} r={13 * s} ry={10.5 * s} color="#2A1D18" spec={0.85} />
      </Inked>
      {/* mouth line under the snout */}
      <InkLine d={`M${P(H(34, 36))} Q${P(H(52, 44))} ${P(H(68, 32))}`} w={OUT * 0.7} />
      {/* crew eye: white sclera, ink pupil, two catchlights; ink brow that lifts with worry */}
      <Deco>
        {(() => {
          const ec = H(16, -10);
          const pc = add(ec, {x: 2.5 * s * fx, y: 1.5 * s});
          return (
            <g>
              <ellipse cx={fmt(ec.x)} cy={fmt(ec.y)} rx={fmt(13 * s)} ry={fmt(14.5 * s)} fill="#FFFFFF" stroke={INK} strokeWidth={fmt(OUT * 0.6)} />
              <circle cx={fmt(pc.x)} cy={fmt(pc.y)} r={fmt(7.5 * s)} fill={INK} />
              <circle cx={fmt(pc.x + 2.6 * s * fx)} cy={fmt(pc.y - 3 * s)} r={fmt(2.6 * s)} fill="#FFFFFF" />
              <circle cx={fmt(pc.x - 2.2 * s * fx)} cy={fmt(pc.y + 2.6 * s)} r={fmt(1.2 * s)} fill="#FFFFFF" opacity={0.85} />
            </g>
          );
        })()}
      </Deco>
      <InkLine d={`M${P(H(2, -30 + d.worry * 2))} Q${P(H(14, -36 - d.worry * 3))} ${P(H(28, -34 - d.worry * 9))}`} w={OUT * 0.9} />
      {/* near ear: floppy -> perked */}
      {(() => {
        const base = H(-16, -30);
        const tipA = H(-30, 34);
        const tipB = H(-22, -64);
        const tip = {x: tipA.x + (tipB.x - tipA.x) * d.ears, y: tipA.y + (tipB.y - tipA.y) * d.ears};
        const mid = {x: (base.x + tip.x) / 2 - 22 * s * fx, y: (base.y + tip.y) / 2};
        return (
          <Inked w={OUT}>
            <Blob id={`${id}-er`} d={`M${P(H(2, -36))} Q${P(mid)} ${P(tip)} Q${P(add(mid, {x: 30 * s * fx, y: 6 * s}))} ${P(H(-4, -14))} Z`} c={mid} r={40 * s} color={mix(COL, PAL.dogDeep, 0.45)} />
          </Inked>
        );
      })()}
    </g>
  );
};

export const DOG_IDLE: DogPose = {x: 0, y: 0, s: 1, head: 0, ears: 0.15, tail: 10, sit: 0, lean: 0, step: 0, stepAmt: 0, worry: 0};
