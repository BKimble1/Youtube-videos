// Five-digit hand: palm, four three-segment fingers and a two-segment thumb with a thenar pad.
// Drawn in world coordinates from a wrist point and a direction, so the key light stays fixed.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {add, fmt, mul, P, perp, rad, rot, V} from '../lib/math';
import {Blob, Capsule, SoftShadow} from '../lib/shade';

export type HandPose = {
  /** curl per finger [index, middle, ring, pinky], 0 = straight, 1 = fist */
  curl: [number, number, number, number];
  /** finger fan 0..1 */
  spread: number;
  /** thumb angle away from the hand axis (deg) */
  thumb: number;
  /** thumb bend 0..1 */
  thumbCurl: number;
};

export const HAND_RELAXED: HandPose = {curl: [0.22, 0.28, 0.32, 0.36], spread: 0.35, thumb: 22, thumbCurl: 0.4};
export const HAND_CLUTCH: HandPose = {curl: [0.42, 0.48, 0.52, 0.56], spread: 0.75, thumb: 46, thumbCurl: 0.35};
export const HAND_BRACE: HandPose = {curl: [0.05, 0.05, 0.08, 0.1], spread: 0.85, thumb: 50, thumbCurl: 0.1};
export const HAND_LIMP: HandPose = {curl: [0.3, 0.36, 0.42, 0.46], spread: 0.25, thumb: 14, thumbCurl: 0.55};

export const mixHand = (a: HandPose, b: HandPose, t: number): HandPose => ({
  curl: a.curl.map((c, i) => c + (b.curl[i] - c) * t) as HandPose['curl'],
  spread: a.spread + (b.spread - a.spread) * t,
  thumb: a.thumb + (b.thumb - a.thumb) * t,
  thumbCurl: a.thumbCurl + (b.thumbCurl - a.thumbCurl) * t,
});

type Props = {
  id: string;
  wrist: V;
  /** screen angle (deg, atan2 convention: 0 = +x, 90 = +y) of the wrist -> middle-knuckle direction */
  ang: number;
  /** wrist to middle fingertip (straight) */
  L: number;
  /** +1: thumb on the clockwise side of the hand axis, -1: anticlockwise */
  thumbSide: 1 | -1;
  view: 'back' | 'palm';
  pose: HandPose;
  color: string;
  /** draw the soft shadow the hand casts on the surface beneath it (contact) */
  contact?: {alpha: number; offset: V};
  /** extra multiplier on the specular sheen */
  sheen?: number;
};

const FINGERS = [
  // v offset (fraction of L, toward thumb side), knuckle u, length, base radius, fan angle per unit spread
  {v: 0.19, u: 0.445, len: 0.43, r: 0.06, fan: 9},
  {v: 0.064, u: 0.47, len: 0.48, r: 0.062, fan: 2},
  {v: -0.064, u: 0.455, len: 0.45, r: 0.058, fan: -6},
  {v: -0.18, u: 0.415, len: 0.35, r: 0.05, fan: -14},
];
const SEG = [0.45, 0.31, 0.24];

export const Hand: React.FC<Props> = ({id, wrist, ang, L, thumbSide: ts, view, pose, color, contact, sheen = 1}) => {
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir); // clockwise side
  const W = (u: number, vv: number): V => add(wrist, add(mul(dir, u * L), mul(n, vv * L * ts)));
  const skinShadow = shade(color, 0.42);
  const palmPts: [number, number][] = [
    [-0.03, -0.19],
    [0.2, -0.235],
    [0.4, -0.225],
    [0.475, -0.12],
    [0.49, 0.0],
    [0.475, 0.13],
    [0.43, 0.245],
    [0.27, 0.28],
    [0.12, 0.27],
    [-0.03, 0.2],
  ];
  // smooth closed path through palm points (Catmull-Rom -> cubic)
  const pts = palmPts.map(([u, vv]) => W(u, vv));
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6));
    const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6));
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  d += ' Z';
  const palmC = W(0.24, 0.02);

  const fingerEls: React.ReactNode[] = [];
  const order = ts > 0 ? [3, 2, 1, 0] : [3, 2, 1, 0];
  order.forEach((fi) => {
    const F = FINGERS[fi];
    const c = pose.curl[fi];
    const fan = F.fan * pose.spread * ts;
    let fd = rot(dir, fan);
    let p = W(F.u, F.v);
    const segs: {a: V; b: V; ra: number; rb: number}[] = [];
    let r = F.r * L;
    SEG.forEach((s, si) => {
      // seen from the back or the palm, curling foreshortens the segment and pulls it slightly toward the palm centre line
      const fore = 1 - c * [0.32, 0.62, 0.8][si];
      const l = F.len * s * L * Math.max(0.12, fore);
      fd = rot(fd, -fan * 0.12 * si);
      const b = add(p, mul(fd, l));
      const rb = r * [0.94, 0.9, 0.86][si];
      segs.push({a: p, b, ra: r, rb});
      p = b;
      r = rb;
    });
    const tip = segs[2].b;
    fingerEls.push(
      <g key={fi}>
        {/* separation shadow: a darker copy offset away from the light, so adjacent fingers read as separate digits */}
        <Capsule id={`${id}-fs${fi}`} a={add(segs[0].a, mul(n, 0.012 * L * -ts))} b={add(tip, mul({x: 0.35, y: 0.6}, 0.02 * L))} ra={segs[0].ra * 1.08} rb={segs[2].rb * 1.12} color={skinShadow} k={0.2} opacity={0.55} />
        {segs.map((s, si) => (
          <Capsule key={si} id={`${id}-f${fi}s${si}`} a={s.a} b={s.b} ra={s.ra} rb={s.rb} color={si === 0 ? color : mix(color, lit(color, 0.2), 0.15 * si)} spec={0.28 * sheen} k={1.1} />
        ))}
        {view === 'back' && (
          // fingernail on the distal segment
          <g>
            {(() => {
              const a = segs[2].a;
              const b = segs[2].b;
              const m = add(a, mul({x: b.x - a.x, y: b.y - a.y}, 0.62));
              const angN = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
              const rr = segs[2].rb;
              return (
                <g>
                  <ellipse cx={fmt(m.x)} cy={fmt(m.y)} rx={fmt(Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) * 0.42))} ry={fmt(rr * 0.68)} transform={`rotate(${fmt(angN)} ${fmt(m.x)} ${fmt(m.y)})`} fill={mix(lit(color, 0.35), '#F4C9C0', 0.5)} />
                  <ellipse cx={fmt(m.x - 0.25 * rr)} cy={fmt(m.y - 0.3 * rr)} rx={fmt(rr * 0.32)} ry={fmt(rr * 0.14)} transform={`rotate(${fmt(angN - 20)} ${fmt(m.x - 0.25 * rr)} ${fmt(m.y - 0.3 * rr)})`} fill="#FFFFFF" opacity={0.75} />
                </g>
              );
            })()}
          </g>
        )}
        {/* knuckle highlight */}
        {view === 'back' && <ellipse cx={fmt(segs[0].a.x - 0.2 * segs[0].ra)} cy={fmt(segs[0].a.y - 0.25 * segs[0].ra)} rx={fmt(segs[0].ra * 0.42)} ry={fmt(segs[0].ra * 0.26)} fill="#FFFFFF" opacity={0.22 * sheen} />}
      </g>,
    );
  });

  // thumb: thenar pad + two segments, rotating outward from the palm
  const tBase = W(0.1, 0.19);
  const tDir = rot(dir, pose.thumb * ts);
  const t1 = add(tBase, mul(tDir, 0.2 * L));
  const tDir2 = rot(tDir, -pose.thumbCurl * 38 * ts);
  const t2 = add(t1, mul(tDir2, 0.15 * L * (1 - pose.thumbCurl * 0.35)));
  const tDir3 = rot(tDir2, -pose.thumbCurl * 30 * ts);
  const t3 = add(t2, mul(tDir3, 0.12 * L * (1 - pose.thumbCurl * 0.45)));
  const thumbEl = (
    <g>
      <Capsule id={`${id}-ts`} a={add(tBase, mul(n, -0.01 * L * ts))} b={add(t3, {x: 0.012 * L, y: 0.02 * L})} ra={0.09 * L} rb={0.056 * L} color={skinShadow} k={0.2} opacity={0.5} />
      <Capsule id={`${id}-t0`} a={tBase} b={t1} ra={0.092 * L} rb={0.066 * L} color={color} spec={0.22 * sheen} />
      <Capsule id={`${id}-t1`} a={t1} b={t2} ra={0.064 * L} rb={0.058 * L} color={color} spec={0.26 * sheen} />
      <Capsule id={`${id}-t2`} a={t2} b={t3} ra={0.058 * L} rb={0.052 * L} color={lit(color, 0.04)} spec={0.26 * sheen} />
      {view === 'back' && (
        <ellipse
          cx={fmt((t2.x + t3.x * 2) / 3)}
          cy={fmt((t2.y + t3.y * 2) / 3)}
          rx={fmt(0.055 * L)}
          ry={fmt(0.038 * L)}
          transform={`rotate(${fmt((Math.atan2(t3.y - t2.y, t3.x - t2.x) * 180) / Math.PI)} ${fmt((t2.x + t3.x * 2) / 3)} ${fmt((t2.y + t3.y * 2) / 3)})`}
          fill={mix(lit(color, 0.35), '#F4C9C0', 0.5)}
        />
      )}
    </g>
  );

  // The thumb sits beside the palm (it is the nearest digit to the viewer in these poses), so it is drawn last.
  return (
    <g>
      {contact && <SoftShadow id={`${id}-cs`} c={add(palmC, contact.offset)} rx={0.62 * L} ry={0.36 * L} alpha={contact.alpha} rotate={ang} />}
      <Blob id={`${id}-palm`} d={d} c={palmC} r={0.42 * L} color={color} k={1.05} />
      {/* tendons / metacarpal ridges on the back of the hand (soft, no lines) */}
      {view === 'back' &&
        [0, 1, 2, 3].map((i) => {
          const F = FINGERS[i];
          const a = W(0.08, F.v * 0.7);
          const b = W(F.u - 0.04, F.v);
          return <Capsule key={i} id={`${id}-tn${i}`} a={a} b={b} ra={0.022 * L} rb={0.028 * L} color={lit(color, 0.12)} k={0.4} opacity={0.35} />;
        })}
      {view === 'palm' && (
        // palm pads and creases as soft shading
        <g opacity={0.5}>
          <ellipse cx={fmt(W(0.36, 0.02).x)} cy={fmt(W(0.36, 0.02).y)} rx={fmt(0.16 * L)} ry={fmt(0.05 * L)} transform={`rotate(${fmt(ang + 90)} ${fmt(W(0.36, 0.02).x)} ${fmt(W(0.36, 0.02).y)})`} fill={shade(color, 0.3)} />
        </g>
      )}
      {fingerEls}
      {thumbEl}
    </g>
  );
};
