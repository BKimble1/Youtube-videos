// V2 insect: the posed millimetre skeleton (rig/roach.ts poseRoach) drawn as flat Weird Crew illustration through an
// orthographic view (ortho.ts): every part is one flat fill with one cel-shade tone cut by a lit copy offset toward the
// fixed upper-left key light, one crisp highlight, and the crew's ink contour (lib/ink Inked). Legs are flat tapered
// limbs with spines and beaded tarsi; antennae are tapered beaded strokes. The gait, planted feet, antennae search and
// breathing all come from the skeleton, so every view shows the same animal doing the same thing.
import React from 'react';
import {V2, V3, Frame, toW, dirW} from '../../lib/v3';
import {Inked, INK, useInk} from '../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../lib/color';
import {loftLocal, LoftDef} from '../../lib/loft';
import {PLATES, PRONOTUM, BODY, TERGITE_U, RoachPose, LegPose} from '../../rig/roach';
import {View, P, D, Pd, f2, hull, thin, smoothClosed, smoothOpen, ellipsoidOutline, facing} from './ortho';

export const R2 = {
  body: '#5B3325',
  pronotum: '#633828',
  head: '#4B2A1F',
  leg: '#6A3C2A',
  legFar: '#432419',
  ant: '#5A3324',
  seam: '#2E170F',
  hi: '#F6E2CC',
  eye: '#1B0F0B',
  shadow: '#1A1612',
};

/** ink width for a view (px): the crew line, a little lighter on big close-ups */
export const inkFor = (v: View) => Math.max(2.2, Math.min(7.5, 0.34 * v.s + 0.6));

/** a flat path that joins its <Inked> group's contour: a widened ink silhouette in the ink pass (the visible line is the
 *  group's w, unlike lib/ink's thin OUTLINE_K finish), the plain fill otherwise */
export const InkFlat: React.FC<{d: string; fill: string; opacity?: number; transform?: string}> = ({d, fill, opacity, transform}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return <path d={d} fill={INK} stroke={INK} strokeWidth={f2(ink.w * 2)} strokeLinejoin="round" opacity={opacity} transform={transform} />;
  return <path d={d} fill={fill} opacity={opacity} transform={transform} />;
};
const circleD = (c: V2, r: number) => `M${f2(c[0] - r)},${f2(c[1])} a${f2(r)},${f2(r)} 0 1 0 ${f2(2 * r)},0 a${f2(r)},${f2(r)} 0 1 0 ${f2(-2 * r)},0 Z`;

// ------------------------------------------------------------------ flat cel shapes
type BB = {x0: number; y0: number; x1: number; y1: number};
const bbox = (pts: V2[]): BB => ({
  x0: Math.min(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])),
  x1: Math.max(...pts.map((p) => p[0])), y1: Math.max(...pts.map((p) => p[1])),
});
/** one flat cel-shaded shape: shadow tone, a lit copy shifted toward the key light clipped to the shape, a highlight */
export const Cel: React.FC<{id: string; pts: V2[]; color: string; shadeK?: number; litK?: number; off?: [number, number]; hi?: number; hiPos?: [number, number, number, number, number]; children?: React.ReactNode}> = ({id, pts, color, shadeK = 0.34, litK = 0.1, off = [-0.11, -0.2], hi = 0.5, hiPos, children}) => {
  if (pts.length < 3) return null;
  const d = smoothClosed(pts);
  const b = bbox(pts);
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  // highlight: a streak in the upper-left of the shape [cx, cy, rx, ry, rot] as fractions of the box (rot in deg)
  const hp = hiPos ?? [0.36, 0.2, 0.22, 0.055, -10];
  if (useInk().pass === 'ink') return <InkFlat d={d} fill="none" />;
  return (
      <g>
        <defs>
          <clipPath id={`${id}-c`}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={shadeC(color, shadeK)} />
        <g clipPath={`url(#${id}-c)`}>
          <path d={d} fill={litC(color, litK)} transform={`translate(${f2(off[0] * w)} ${f2(off[1] * h)})`} />
          {children}
          {hi > 0 && (
            <ellipse cx={f2(b.x0 + hp[0] * w)} cy={f2(b.y0 + hp[1] * h)} rx={f2(hp[2] * w)} ry={f2(Math.max(1.2, hp[3] * h))} transform={`rotate(${hp[4]} ${f2(b.x0 + hp[0] * w)} ${f2(b.y0 + hp[1] * h)})`} fill={R2.hi} opacity={hi} />
          )}
        </g>
      </g>
  );
};

// ------------------------------------------------------------------ shell outlines
const loftHull = (v: View, f: Frame, d: LoftDef, scaleY = 1): V2[] => {
  const pts: V2[] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    for (let j = 0; j < 44; j++) {
      const l = loftLocal(d, u, (j / 44) * Math.PI * 2);
      pts.push(P(v, toW(f, [l[0], d.yc(u) + (l[1] - d.yc(u)) * scaleY, l[2]])));
    }
  }
  return thin(hull(pts), 1.2);
};
/** visible part of a section ring (u) over the top of a loft, as a screen polyline (normal: from the section's centre) */
const ringRun = (v: View, f: Frame, d: LoftDef, u: number, scaleY = 1): V2[] => {
  const out: V2[] = [];
  const n = 40;
  const x = d.x0 + (d.x1 - d.x0) * u;
  for (let j = 0; j <= n; j++) {
    const th = (j / n) * Math.PI;
    const l = loftLocal(d, u, th);
    const ly: V3 = [l[0], d.yc(u) + (l[1] - d.yc(u)) * scaleY, l[2]];
    const w = Math.max(1e-3, d.w(u)), h = Math.max(1e-3, d.ht(u) * scaleY);
    const nl: V3 = [0, (ly[1] - d.yc(u)) / (h * h), ly[2] / (w * w)];
    const nw = dirW(f, nl);
    if (facing(v, nw) > 0.02 * Math.hypot(nw[0], nw[1], nw[2])) out.push(P(v, toW(f, ly)));
    else if (out.length > 1) break;
  }
  return out;
};

// ------------------------------------------------------------------ limbs
const flatLimb = (a: V2, b: V2, ra: number, rb: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const A1: V2 = [a[0] + nx * ra, a[1] + ny * ra], A2: V2 = [a[0] - nx * ra, a[1] - ny * ra];
  const B1: V2 = [b[0] + nx * rb, b[1] + ny * rb], B2: V2 = [b[0] - nx * rb, b[1] - ny * rb];
  return `M${f2(A1[0])},${f2(A1[1])} L${f2(B1[0])},${f2(B1[1])} A${f2(rb)},${f2(rb)} 0 0 1 ${f2(B2[0])},${f2(B2[1])} L${f2(A2[0])},${f2(A2[1])} A${f2(ra)},${f2(ra)} 0 0 1 ${f2(A1[0])},${f2(A1[1])} Z`;
};
const Leg2D: React.FC<{v: View; l: LegPose; color: string; ink: number}> = ({v, l, color, ink}) => {
  const s = v.s, d = l.def;
  const c = P(v, l.coxa), k = P(v, l.knee), a = P(v, l.ankle), ft = P(v, l.foot);
  const rF = d.rFem * s * 0.95, rT = d.rTib * s * 0.9, rTa = 0.75 * s;
  // spines: short ticks on the tibia's lower/outer edge, leaning toward the foot
  const tdx = a[0] - k[0], tdy = a[1] - k[1], tL = Math.hypot(tdx, tdy) || 1;
  let nx = -tdy / tL, ny = tdx / tL;
  if (ny < 0) (nx = -nx), (ny = -ny); // point the ticks down-screen
  const spines = [0.32, 0.56, 0.8, 0.97].map((t, i) => {
    const bx = k[0] + tdx * t + nx * rT * 0.8, by = k[1] + tdy * t + ny * rT * 0.8;
    const ln = (d.front ? 1.9 : 1.4) * s * (i === 3 ? 1.2 : 1);
    return `M${f2(bx)},${f2(by)} L${f2(bx + nx * ln + (tdx / tL) * ln * 0.55)},${f2(by + ny * ln + (tdy / tL) * ln * 0.55)}`;
  });
  // tarsus: three beads to the claw
  const beads = [0.22, 0.52, 0.8].map((t) => [a[0] + (ft[0] - a[0]) * t, a[1] + (ft[1] - a[1]) * t] as V2);
  return (
    <g>
      <path d={spines.join(' ')} stroke={INK} strokeWidth={f2(Math.max(1.2, 0.42 * s))} strokeLinecap="round" fill="none" />
      <Inked w={ink}>
        <InkFlat d={flatLimb(c, k, rF, rF * 0.82)} fill={color} />
        <InkFlat d={flatLimb(k, a, rT, rT * 0.62)} fill={color} />
        <InkFlat d={flatLimb(a, ft, rTa, rTa * 0.55)} fill={shadeC(color, 0.12)} />
        {beads.map((b, i) => (
          <InkFlat key={i} d={circleD(b, rTa * (1.05 - i * 0.12))} fill={shadeC(color, 0.12)} />
        ))}
      </Inked>
      {/* a lit edge along the femur and tibia (key light upper-left) */}
      <path d={`M${f2(c[0] - rF * 0.35)},${f2(c[1] - rF * 0.45)} L${f2(k[0] - rF * 0.3)},${f2(k[1] - rF * 0.4)}`} stroke={litC(color, 0.35)} strokeWidth={f2(rF * 0.35)} strokeLinecap="round" opacity={0.7} />
      <path d={`M${f2(k[0] - rT * 0.3)},${f2(k[1] - rT * 0.4)} L${f2(a[0] - rT * 0.2)},${f2(a[1] - rT * 0.3)}`} stroke={litC(color, 0.3)} strokeWidth={f2(rT * 0.3)} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};
/** an antenna: a tapered beaded stroke along the skeleton's antenna points */
export const Antenna2D: React.FC<{v: View; pts: V3[]; color?: string; ink: number}> = ({v, pts, color = R2.ant, ink}) => {
  const q = pts.map((p) => P(v, p));
  const n = q.length;
  const w = (i: number) => (0.72 - (0.42 * i) / (n - 1)) * v.s;
  return (
    <g>
      {q.slice(0, -1).map((p, i) => (
        <path key={`o${i}`} d={`M${f2(p[0])},${f2(p[1])} L${f2(q[i + 1][0])},${f2(q[i + 1][1])}`} stroke={INK} strokeWidth={f2(w(i) + ink * 1.4)} strokeLinecap="round" />
      ))}
      {q.slice(0, -1).map((p, i) => (
        <path key={`f${i}`} d={`M${f2(p[0])},${f2(p[1])} L${f2(q[i + 1][0])},${f2(q[i + 1][1])}`} stroke={i % 2 ? color : litC(color, 0.12)} strokeWidth={f2(w(i))} strokeLinecap="round" />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ the insect
export type Roach2DOpts = {
  id: string;
  /** element(s) drawn on the back after the shells (the backpack), given the view and body frame */
  gear?: React.ReactNode;
  /** element(s) drawn last (over the near legs), e.g. near wires */
  front?: React.ReactNode;
  shadow?: number;
  /** extra ink scale */
  inkK?: number;
  /** body colour override (e.g. a second insect a shade lighter) */
  tint?: string;
};

const ik2 = (B: V3, A: V3, a: number, b: number, pole: V3): V3 => {
  const dv: V3 = [A[0] - B[0], A[1] - B[1], A[2] - B[2]];
  let dd = Math.hypot(dv[0], dv[1], dv[2]);
  dd = Math.max(Math.abs(a - b) + 0.5, Math.min(a + b - 0.3, dd));
  const L = Math.hypot(dv[0], dv[1], dv[2]) || 1;
  const dir: V3 = [dv[0] / L, dv[1] / L, dv[2] / L];
  const x = (a * a - b * b + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const pd = pole[0] * dir[0] + pole[1] * dir[1] + pole[2] * dir[2];
  let pp: V3 = [pole[0] - dir[0] * pd, pole[1] - dir[1] * pd, pole[2] - dir[2] * pd];
  const pl = Math.hypot(pp[0], pp[1], pp[2]) || 1;
  pp = [pp[0] / pl, pp[1] / pl, pp[2] / pl];
  return [B[0] + dir[0] * x + pp[0] * h, B[1] + dir[1] * x + pp[1] * h, B[2] + dir[2] * x + pp[2] * h];
};
/** the same legs with the knees re-solved low and outward (a sprawling insect: knees about level with the body's
 *  margin, so in profile the legs come out from under the shell instead of folding up its side) */
export const sprawl = (pose: RoachPose): RoachPose => {
  const f = pose.frame;
  return {
    ...pose,
    legs: pose.legs.map((l) => {
      const out: V3 = [l.foot[0] - f.o[0], 0, l.foot[2] - f.o[2]];
      const ol = Math.hypot(out[0], out[2]) || 1;
      const pole: V3 = [out[0] / ol + f.y[0] * 0.28, out[1] / ol + f.y[1] * 0.28, out[2] / ol + f.y[2] * 0.28];
      return {...l, knee: ik2(l.coxa, l.ankle, l.def.femur, l.def.tibia, pole)};
    }),
  };
};

export const Roach2D: React.FC<{pose: RoachPose; v: View; o: Roach2DOpts}> = ({pose: pose0, v, o}) => {
  const pose = sprawl(pose0);
  const f = pose.frame;
  const ink = inkFor(v) * (o.inkK ?? 1);
  const id = o.id;
  const top = v.F[1] > 0.7; // looking down: every leg is under the body
  const cD = D(v, toW(f, [0, 8, 0]));
  const isNear = (p: V3) => !top && D(v, p) > cD + 2;
  const breathY = 1.12 * (1 + 0.022 * (pose.breath - 0.5)); // a little more dome than the measured model: the crew read
  const base = o.tint ?? R2.body;
  // parts
  const abd = loftHull(v, f, PLATES, breathY);
  const pro = loftHull(v, f, PRONOTUM);
  const head = ellipsoidOutline(v, toW(f, BODY.head.c), dirW(f, [BODY.head.r[0], 0, 0]), dirW(f, [0, BODY.head.r[1], 0]), dirW(f, [0, 0, BODY.head.r[2]]));
  const segs = TERGITE_U.map((u) => ringRun(v, f, PLATES, u, breathY)).filter((r) => r.length > 2);
  // every leg is drawn behind the shells: the broad margin hides the femurs and knees, and the spiny tibiae and tarsi
  // show below it (near legs over far ones, lighter)
  const legsNear = pose.legs.filter((l) => isNear(l.coxa));
  const legsFar = pose.legs.filter((l) => !isNear(l.coxa));
  // antennae and cerci: near/far by their base
  const antFar = [pose.antL, pose.antR].filter((a) => !isNear(a[0]) || top);
  const antNear = [pose.antL, pose.antR].filter((a) => isNear(a[0]) && !top);
  const cerci = pose.cerci.map(([a, b]) => ({a: P(v, a), b: P(v, b), near: isNear(a)}));
  // eyes: on the head's sides, drawn when they face the viewer
  const eyes = ([-1, 1] as const).map((sd) => {
    const c = toW(f, [32.2, 10.4, 6.6 * sd]);
    const n = dirW(f, [0.35, 0.25, 0.9 * sd]);
    return {c, ok: facing(v, n) > 0.12, k: facing(v, n)};
  });
  // contact shadow: on the ground under the body, pushed away from the key light
  const g0 = P(v, [f.o[0], 0, f.o[2]]);
  const gx = P(v, toW(f, [30, 0, 0])), gb = P(v, toW(f, [-40, 0, 0])), gz = P(v, toW(f, [0, 0, 22]));
  const sw = Math.hypot(gx[0] - gb[0], gx[1] - gb[1]) / 2, sh = Math.max(4, Math.hypot(gz[0] - g0[0], gz[1] - g0[1]));
  const sang = (Math.atan2(gx[1] - gb[1], gx[0] - gb[0]) * 180) / Math.PI;
  const legLimb = (l: LegPose, far: boolean) => <Leg2D key={l.def.name} v={v} l={l} color={far ? R2.legFar : R2.leg} ink={ink * 0.85} />;
  const cercus = (c: {a: V2; b: V2}, k: number) => (
    <g key={k}>
      <path d={`M${f2(c.a[0])},${f2(c.a[1])} L${f2(c.b[0])},${f2(c.b[1])}`} stroke={INK} strokeWidth={f2(0.9 * v.s + ink)} strokeLinecap="round" />
      <path d={`M${f2(c.a[0])},${f2(c.a[1])} L${f2(c.b[0])},${f2(c.b[1])}`} stroke={R2.legFar} strokeWidth={f2(0.9 * v.s)} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {(o.shadow ?? 1) > 0 && (
        <ellipse cx={f2((gx[0] + gb[0]) / 2 + 0.06 * sw)} cy={f2((gx[1] + gb[1]) / 2 + (top ? 0.18 * sh : 0.06 * sh))} rx={f2(sw * 1.08)} ry={f2(top ? sh * 1.15 : Math.max(5, sh * 0.32))} transform={`rotate(${f2(sang)} ${f2((gx[0] + gb[0]) / 2)} ${f2((gx[1] + gb[1]) / 2)})`} fill={R2.shadow} opacity={0.22 * (o.shadow ?? 1)} />
      )}
      {cerci.filter((c) => !c.near).map(cercus)}
      {antFar.map((a, i) => (
        <Antenna2D key={`af${i}`} v={v} pts={a} ink={ink * 0.7} color={top ? R2.ant : R2.legFar} />
      ))}
      {legsFar.map((l) => legLimb(l, !top))}
      {legsNear.map((l) => legLimb(l, false))}
      <Inked w={ink}>
        <Cel id={`${id}-hd`} pts={head} color={R2.head} hi={0.25} />
      </Inked>
      {eyes.filter((e) => e.ok).map((e, i) => {
        const c = P(v, e.c);
        return <ellipse key={i} cx={f2(c[0])} cy={f2(c[1])} rx={f2(2.1 * v.s * Math.min(1, 0.4 + e.k))} ry={f2(2.7 * v.s)} fill={R2.eye} />;
      })}
      {(() => {
        const abdEl = (
          <Inked key="ab" w={ink}>
            <Cel id={`${id}-ab`} pts={abd} color={base} hiPos={[0.42, 0.16, 0.26, 0.05, -6]} hi={0.45}>
              {segs.map((r, i) => (
                <path key={i} d={smoothOpen(r)} stroke={R2.seam} strokeWidth={f2(Math.max(1.3, ink * 0.55))} fill="none" strokeLinecap="round" opacity={0.85} />
              ))}
            </Cel>
          </Inked>
        );
        const proEl = (
          <Inked key="pr" w={ink}>
            <Cel id={`${id}-pr`} pts={pro} color={o.tint ? litC(o.tint, 0.06) : R2.pronotum} hiPos={[0.38, 0.2, 0.24, 0.07, -8]} hi={0.55} />
          </Inked>
        );
        // the shield overlaps the abdomen unless the viewer is low behind the insect (from high above it always does)
        return facing(v, f.x) < -0.15 && facing(v, f.y) < 0.7 ? [proEl, abdEl] : [abdEl, proEl];
      })()}
      {o.gear}
      {cerci.filter((c) => c.near).map(cercus)}
      {antNear.map((a, i) => (
        <Antenna2D key={`an${i}`} v={v} pts={a} ink={ink * 0.75} />
      ))}
      {o.front}
    </g>
  );
};
