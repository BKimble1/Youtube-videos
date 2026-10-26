// V5 control room (HOOK owner): the operator's x-ray skeleton for the crack (frames 53, 54, 56). Built on
// art/Skeleton.tsx (the same bone style, rigged to the same manJoints pose, so it sits inside her own outline) and
// re-drawn for the room's close 3/4 view (V5 fix HOOK-1 / HOOK-7):
//   - one continuous spine: the vertebrae are spaced evenly along a smooth curve from the skull base down the neck
//     and on behind the ribcage (no gap between the neck and the back, no column at the frame edge on its own)
//   - the ribs grow out of that spine and sweep down and forward to the sternum
//   - the reaching arm: collarbone -> humerus -> a real elbow (the joint knob) -> radius and ulna -> the hand, the
//     same chain as the drawn arm; the far arm is hidden behind her body in the room (it is not drawn), so its bones
//     are not drawn either, and nothing crosses the reaching arm
//   - the hips and legs are below the desk and are not drawn
import React from 'react';
import {add, fmt, len, mul, norm, perp, sub, V} from '../dc/math';
import {Joints, ManPose, manJoints} from '../dc/Man';

const BONE = '#EEF7FF';
const INKB = '#0A1626';

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});

/** a long bone: a shaft with knobbed ends (as art/Skeleton) */
const LongBone: React.FC<{a: V; b: V; r: number; op?: number}> = ({a, b, r, op = 1}) => {
  const d = norm(sub(b, a));
  const n = perp(d);
  const k = 0.55;
  const p = (q: V, s: number) => add(q, mul(n, s));
  const shaft = `M${fmt(p(a, r * k).x)},${fmt(p(a, r * k).y)} L${fmt(p(b, r * k).x)},${fmt(p(b, r * k).y)} L${fmt(p(b, -r * k).x)},${fmt(p(b, -r * k).y)} L${fmt(p(a, -r * k).x)},${fmt(p(a, -r * k).y)} Z`;
  const knob = (q: V, key: string) => (
    <g key={key}>
      <circle cx={fmt(p(q, r * 0.5).x)} cy={fmt(p(q, r * 0.5).y)} r={fmt(r * 0.72)} />
      <circle cx={fmt(p(q, -r * 0.5).x)} cy={fmt(p(q, -r * 0.5).y)} r={fmt(r * 0.72)} />
    </g>
  );
  return (
    <g opacity={op}>
      <g fill={INKB} stroke={INKB} strokeWidth={fmt(r * 0.5)} strokeLinejoin="round">
        <path d={shaft} />
        {knob(a, 'a')}
        {knob(b, 'b')}
      </g>
      <g fill={BONE}>
        <path d={shaft} />
        {knob(a, 'a')}
        {knob(b, 'b')}
      </g>
    </g>
  );
};

/** hand bones along the hand's angle: the metacarpal knot, the index straight (it presses), the others shorter (curled) */
const HandBones: React.FC<{w: V; ang: number; L: number; r: number; spread: number; curl: number[]}> = ({w, ang, L, r, spread, curl}) => {
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const base = add(w, mul(dir, L * 0.36));
  // index (curl[0]) on the thumb side (+perp for the near hand, thumbSide 1, as dc/Hand), little finger last
  const fingers = [1.5, 0.5, -0.5, -1.5].map((k, i) => {
    const a = ((ang + k * 8 * (0.5 + spread)) * Math.PI) / 180;
    const d = {x: Math.cos(a), y: Math.sin(a)};
    const lf = L * 0.5 * (1 - 0.55 * (curl[i] ?? 0));
    const a0 = add(base, mul(perp(d), k * r * 0.5));
    return {a: a0, b: add(add(base, mul(d, lf)), mul(perp(d), k * r * 0.62))};
  });
  return (
    <g>
      <LongBone a={w} b={add(w, mul(dir, L * 0.32))} r={r * 0.95} />
      {fingers.map((f, i) => <LongBone key={i} a={f.a} b={f.b} r={r * 0.38} />)}
    </g>
  );
};

const Skull: React.FC<{j: Joints; p: ManPose}> = ({j, p}) => {
  const R = 96 * j.s;
  const roll = -(j.tc + p.neck);
  const xf = -30 * p.turn;
  const s = R / 100;
  return (
    <g transform={`translate(${fmt(j.head.x)} ${fmt(j.head.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>
      <path d={`M0,-96 C52,-96 90,-56 90,-6 C90,30 74,52 54,62 L${fmt(xf + 36)},66 L${fmt(xf - 40)},66 L-60,58 C-80,40 -90,18 -90,-8 C-90,-58 -52,-96 0,-96 Z`} fill={BONE} stroke={INKB} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={fmt(xf + 36)} cy={-8} rx={22} ry={24} fill={INKB} />
      <ellipse cx={fmt(xf - 36 * (1 - 0.3 * p.turn))} cy={-8} rx={fmt(20 * (1 - 0.32 * p.turn))} ry={23} fill={INKB} />
      <path d={`M${fmt(xf - 2)},18 L${fmt(xf - 11)},38 L${fmt(xf + 7)},38 Z`} fill={INKB} />
      <path d={`M${fmt(xf - 48)},56 L${fmt(xf + 46)},56 L${fmt(xf + 40)},86 Q${fmt(xf)},100 ${fmt(xf - 42)},86 Z`} fill={BONE} stroke={INKB} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${fmt(xf - 38)},64 L${fmt(xf + 36)},64`} stroke={INKB} strokeWidth={4} />
      {[-26, -13, 0, 13, 26].map((x) => (
        <line key={x} x1={fmt(xf + x)} y1={56} x2={fmt(xf + x)} y2={72} stroke={INKB} strokeWidth={3} />
      ))}
    </g>
  );
};

/** a smooth curve through points (Catmull-Rom), sampled */
const curve = (pts: V[], n: number): V[] => {
  const out: V[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push({x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
/** points spaced every `step` along a polyline, with the local direction */
const along = (pl: V[], step: number) => {
  const out: {p: V; d: V}[] = [];
  let acc = 0;
  for (let i = 0; i < pl.length - 1; i++) {
    const a = pl[i], b = pl[i + 1], L = len(sub(b, a));
    if (L < 1e-6) continue;
    const d = norm(sub(b, a));
    while (acc <= L) {
      out.push({p: add(a, mul(d, acc)), d});
      acc += step;
    }
    acc -= L;
  }
  return out;
};

export const Skeleton5: React.FC<{pose: ManPose; spread?: number; curl?: number[]}> = ({pose: p, spread = 0.3, curl = [0, 0.8, 0.85, 0.9]}) => {
  const j = manJoints(p);
  const s = j.s;
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, v: number) => add(O, add(mul(up(a), u * s), mul(px(a), v * s)));
  // the spine: skull base -> neck -> the shoulder line -> behind the ribs -> the small of the back (it runs on under
  // the desk); one smooth curve, vertebrae every 17 s
  const base = add(j.head, mul(up(tc + p.neck), -70 * s));
  const spinePl = curve([base, j.N, loc(j.Sh, tc, -10, 8), loc(j.C, tc, 80, 22), loc(j.C, tc, 10, 26), loc(j.H, p.torso, 90, 22), loc(j.H, p.torso, 20, 14)], 8);
  const vert = along(spinePl, 17 * s);
  // the ribs: out of the spine at their own height, down and forward round the chest to the sternum
  const ribs = [128, 106, 84, 62, 40].map((u, i) => {
    const back = loc(j.C, tc, u, 22 + 0.04 * (u - 40));
    const ctl = loc(j.C, tc, u + 16, -34);
    const front = loc(j.C, tc, u - 30, -74 + i * 5);
    return `M${fmt(back.x)},${fmt(back.y)} Q${fmt(ctl.x)},${fmt(ctl.y)} ${fmt(front.x)},${fmt(front.y)}`;
  });
  const sternA = loc(j.C, tc, 138, -76), sternB = loc(j.C, tc, 44, -72);
  const limbR = 13 * s;
  const A = j.L;
  const n = perp(norm(sub(A.W, A.E)));
  return (
    <g>
      <g fill="none" strokeLinecap="round">
        {ribs.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={INKB} strokeWidth={fmt(15 * s)} />
            <path d={d} stroke={BONE} strokeWidth={fmt(8 * s)} />
          </g>
        ))}
        <line x1={fmt(sternA.x)} y1={fmt(sternA.y)} x2={fmt(sternB.x)} y2={fmt(sternB.y)} stroke={INKB} strokeWidth={fmt(18 * s)} />
        <line x1={fmt(sternA.x)} y1={fmt(sternA.y)} x2={fmt(sternB.x)} y2={fmt(sternB.y)} stroke={BONE} strokeWidth={fmt(10 * s)} />
      </g>
      {vert.map((q, i) => {
        const a = (Math.atan2(q.d.y, q.d.x) * 180) / Math.PI - 90;
        return <rect key={i} x={fmt(q.p.x - 11 * s)} y={fmt(q.p.y - 6.5 * s)} width={fmt(22 * s)} height={fmt(13 * s)} rx={fmt(4 * s)} fill={BONE} stroke={INKB} strokeWidth={fmt(4 * s)} transform={`rotate(${fmt(a)} ${fmt(q.p.x)} ${fmt(q.p.y)})`} />;
      })}
      {/* collarbone, from the top of the sternum to the near shoulder */}
      <LongBone a={sternA} b={A.S} r={limbR * 0.6} />
      <Skull j={j} p={p} />
      {/* the reaching arm: humerus, the elbow joint, radius and ulna, the hand */}
      <LongBone a={A.S} b={A.E} r={limbR * 1.05} />
      <LongBone a={add(A.E, mul(n, limbR * 0.5))} b={add(A.W, mul(n, limbR * 0.38))} r={limbR * 0.6} />
      <LongBone a={add(A.E, mul(n, -limbR * 0.5))} b={add(A.W, mul(n, -limbR * 0.38))} r={limbR * 0.6} />
      <circle cx={fmt(A.E.x)} cy={fmt(A.E.y)} r={fmt(limbR * 1.05)} fill={BONE} stroke={INKB} strokeWidth={fmt(limbR * 0.42)} />
      <HandBones w={A.W} ang={A.handAng} L={96 * s} r={limbR * 0.9} spread={spread} curl={curl} />
    </g>
  );
};
