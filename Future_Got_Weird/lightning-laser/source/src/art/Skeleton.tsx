// The cartoon x-ray skeleton for the lead's two brief exposures. It is rigged to the figure's own joint solver
// (dc/Man manJoints), so the skull sits on the head centre, the spine runs neck -> chest -> waist -> hips, and every
// bone spans the same shoulder / elbow / wrist / hip / knee / ankle / toe points as the drawn limbs. Far limbs are
// drawn first and dimmer (the same near/far order as the figure); no extra ribs, arms or floating teeth.
import React from 'react';
import {add, fmt, mul, norm, perp, sub, V} from '../dc/math';
import {Joints, ManPose, manJoints} from '../dc/Man';

const BONE = '#EEF7FF';
const INKB = '#0A1626';

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});

/** a long bone: a shaft with knobbed ends */
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

/** forearm: radius and ulna side by side from the elbow to the wrist */
const Forearm: React.FC<{e: V; w: V; r: number; op: number}> = ({e, w, r, op}) => {
  const n = perp(norm(sub(w, e)));
  return (
    <g>
      <LongBone a={add(e, mul(n, r * 0.45))} b={add(w, mul(n, r * 0.35))} r={r * 0.55} op={op} />
      <LongBone a={add(e, mul(n, -r * 0.45))} b={add(w, mul(n, -r * 0.35))} r={r * 0.55} op={op} />
    </g>
  );
};

/** hand bones: a carpal knot and four short finger chains along the hand's angle */
const HandBones: React.FC<{w: V; ang: number; L: number; r: number; op: number; spread: number}> = ({w, ang, L, r, op, spread}) => {
  const fingers = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const a = ((ang + k * 9 * (0.5 + spread)) * Math.PI) / 180;
    const d = {x: Math.cos(a), y: Math.sin(a)};
    const base = add(w, mul({x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)}, L * 0.38));
    return {a: add(base, mul(perp(d), k * r * 0.5)), b: add(add(base, mul(d, L * 0.5)), mul(perp(d), k * r * 0.7))};
  });
  return (
    <g>
      <LongBone a={w} b={add(w, mul({x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)}, L * 0.34))} r={r * 0.9} op={op} />
      {fingers.map((f, i) => (
        <LongBone key={i} a={f.a} b={f.b} r={r * 0.36} op={op} />
      ))}
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
      {/* cranium and cheek */}
      <path d={`M0,-96 C52,-96 90,-56 90,-6 C90,30 74,52 54,62 L${fmt(xf + 36)},66 L${fmt(xf - 40)},66 L-60,58 C-80,40 -90,18 -90,-8 C-90,-58 -52,-96 0,-96 Z`} fill={BONE} stroke={INKB} strokeWidth={6} strokeLinejoin="round" />
      {/* eye sockets (follow the head's 3/4 turn like the eyes do), nasal opening */}
      <ellipse cx={fmt(xf + 36)} cy={-8} rx={22} ry={24} fill={INKB} />
      <ellipse cx={fmt(xf - 36 * (1 - 0.3 * p.turn))} cy={-8} rx={fmt(20 * (1 - 0.32 * p.turn))} ry={23} fill={INKB} />
      <path d={`M${fmt(xf - 2)},18 L${fmt(xf - 11)},38 L${fmt(xf + 7)},38 Z`} fill={INKB} />
      {/* jaw with one row of teeth, attached under the cheekbones */}
      <path d={`M${fmt(xf - 48)},56 L${fmt(xf + 46)},56 L${fmt(xf + 40)},86 Q${fmt(xf)},100 ${fmt(xf - 42)},86 Z`} fill={BONE} stroke={INKB} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${fmt(xf - 38)},64 L${fmt(xf + 36)},64`} stroke={INKB} strokeWidth={4} />
      {[-26, -13, 0, 13, 26].map((x) => (
        <line key={x} x1={fmt(xf + x)} y1={56} x2={fmt(xf + x)} y2={72} stroke={INKB} strokeWidth={3} />
      ))}
    </g>
  );
};

export const Skeleton: React.FC<{pose: ManPose; spreadL?: number; spreadR?: number; handL?: number}> = ({pose: p, spreadL = 0.8, spreadR = 0.8}) => {
  const j = manJoints(p);
  const s = j.s;
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, v: number) => add(O, add(mul(up(a), u * s), mul(px(a), v * s)));
  // spine: neck -> shoulder line -> chest -> waist -> hips, as vertebrae
  const spinePts = [j.N, j.Sh, loc(j.C, tc, 70, 30), loc(j.C, tc, 0, 34), loc(j.H, p.torso, 90, 30), j.H];
  const vert: V[] = [];
  for (let i = 0; i < spinePts.length - 1; i++) for (let k = 0; k < 3; k++) {
    const u = k / 3;
    vert.push(add(spinePts[i], mul(sub(spinePts[i + 1], spinePts[i]), u)));
  }
  const ribs = [130, 108, 86, 64, 42].map((u, i) => {
    const back = loc(j.C, tc, u, 36);
    const side = loc(j.C, tc, u - 16, 80 - i * 4);
    const front = loc(j.C, tc, u - 28, -78 + i * 6);
    return `M${fmt(back.x)},${fmt(back.y)} Q${fmt(side.x)},${fmt(side.y - 40 * s)} ${fmt(loc(j.C, tc, u + 8, 0).x)},${fmt(loc(j.C, tc, u + 8, 0).y)} Q${fmt(loc(j.C, tc, u - 6, -60).x)},${fmt(loc(j.C, tc, u - 6, -60).y)} ${fmt(front.x)},${fmt(front.y)}`;
  });
  const sternA = loc(j.C, tc, 136, -78), sternB = loc(j.C, tc, 40, -70);
  const pel = loc(j.H, p.pelvis, -26, 0);
  const pelD = `M${fmt(loc(j.H, p.pelvis, 10, -70).x)},${fmt(loc(j.H, p.pelvis, 10, -70).y)} Q${fmt(loc(j.H, p.pelvis, 30, 0).x)},${fmt(loc(j.H, p.pelvis, 30, 0).y)} ${fmt(loc(j.H, p.pelvis, 10, 74).x)},${fmt(loc(j.H, p.pelvis, 10, 74).y)} L${fmt(loc(j.H, p.pelvis, -40, 46).x)},${fmt(loc(j.H, p.pelvis, -40, 46).y)} Q${fmt(pel.x)},${fmt(pel.y)} ${fmt(loc(j.H, p.pelvis, -40, -42).x)},${fmt(loc(j.H, p.pelvis, -40, -42).y)} Z`;
  const limbR = 13 * s;
  const leg = (L: Joints['lLeg'], op: number, key: string) => (
    <g key={key}>
      <LongBone a={L.hp} b={L.K} r={limbR * 1.25} op={op} />
      <LongBone a={add(L.K, mul(perp(norm(sub(L.A, L.K))), 5 * s))} b={add(L.A, mul(perp(norm(sub(L.A, L.K))), 4 * s))} r={limbR} op={op} />
      <LongBone a={add(L.K, mul(perp(norm(sub(L.A, L.K))), -9 * s))} b={add(L.A, mul(perp(norm(sub(L.A, L.K))), -7 * s))} r={limbR * 0.55} op={op} />
      <LongBone a={L.A} b={L.toe} r={limbR * 0.8} op={op} />
    </g>
  );
  const arm = (A: Joints['L'], spread: number, op: number, key: string) => (
    <g key={key}>
      <LongBone a={A.S} b={A.E} r={limbR * 1.05} op={op} />
      <Forearm e={A.E} w={A.W} r={limbR * 1.1} op={op} />
      <HandBones w={A.W} ang={A.handAng} L={96 * s} r={limbR * 0.9} op={op} spread={spread} />
    </g>
  );
  return (
    <g>
      {arm(j.R, spreadR, 0.7, 'ra')}
      {leg(j.rLeg, 0.7, 'rl')}
      <path d={pelD} fill={BONE} stroke={INKB} strokeWidth={fmt(5 * s)} strokeLinejoin="round" />
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
      {vert.map((q, i) => (
        <rect key={i} x={fmt(q.x - 11 * s)} y={fmt(q.y - 7 * s)} width={fmt(22 * s)} height={fmt(13 * s)} rx={fmt(4 * s)} fill={BONE} stroke={INKB} strokeWidth={fmt(4 * s)} transform={`rotate(${fmt(-tc)} ${fmt(q.x)} ${fmt(q.y)})`} />
      ))}
      {/* collarbone */}
      <LongBone a={loc(j.Sh, tc, 0, -60)} b={j.L.S} r={limbR * 0.6} />
      <Skull j={j} p={p} />
      {leg(j.lLeg, 1, 'll')}
      {arm(j.L, spreadL, 1, 'la')}
    </g>
  );
};

/** the x-ray body: the figure's own silhouette turned a translucent deep blue (clothing outline still reads) */
export const XRayFilter: React.FC<{id: string}> = ({id}) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values="0.06 0.06 0.06 0 0.05  0.1 0.1 0.1 0 0.14  0.16 0.16 0.16 0 0.36  0 0 0 0.92 0" />
  </filter>
);
