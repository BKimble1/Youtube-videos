// Five-digit hand in the Weird Crew style: a chunky palm with four rounded three-segment fingers and a thumb,
// one ink contour around palm + fingers, ink separation lines between fingers, the thumb outlined on its own.
// Gradient shading from the fixed key light plus glossy knuckle and fingertip highlights.
// Drawn in world coordinates from a wrist point and a direction, so the key light stays fixed.
import React from 'react';
import {lit, mix} from './color';
import {Deco, Inked, InkLine, useInk} from './ink';
import {add, fmt, mul, P, perp, rad, rot, V} from './math';
import {Blob, Capsule, SoftShadow} from './shade';

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
  /** contour width (world units); default scales with the hand */
  ink?: number;
  /** V3: palm and fingers join the surrounding <Inked> group (the forearm's), so no contour crosses the wrist;
   *  the palm's back edge fades into the forearm beneath it. The thumb keeps its own contour over the palm. */
  bare?: boolean;
  /** V4: 0..1 while the band rolls off the wrist: the thumb's own contour dissolves round its base, where it lies on
   *  the wrist under the band (the case hides it in the front view; nothing else changes) */
  thumbFade?: number;
  /** V3 (Real Web Fluid): an object held in the hand, drawn between the rear digits and the front ones (`front`:
   *  finger indices 0 index .. 3 pinky, and 't' the thumb), so it passes through the grip instead of lying on it */
  hold?: {front: (number | 't')[]; obj: React.ReactNode};
};

const FINGERS = [
  // v offset (fraction of L, toward thumb side), knuckle u, length, base radius, fan angle per unit spread
  // (chunkier than anatomical: the crew's rounded cartoon hands)
  {v: 0.185, u: 0.44, len: 0.4, r: 0.074, fan: 9},
  {v: 0.062, u: 0.465, len: 0.45, r: 0.077, fan: 2},
  {v: -0.062, u: 0.45, len: 0.42, r: 0.073, fan: -6},
  {v: -0.175, u: 0.41, len: 0.33, r: 0.064, fan: -14},
];
const SEG = [0.45, 0.31, 0.24];

export const Hand: React.FC<Props> = ({id, wrist, ang, L, thumbSide: ts, view, pose, color, contact, sheen = 1, ink, bare, thumbFade = 0, hold}) => {
  const pass = useInk().pass;
  const iw = ink ?? L * 0.06;
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir); // clockwise side
  const W = (u: number, vv: number): V => add(wrist, add(mul(dir, u * L), mul(n, vv * L * ts)));
  const palmPts: [number, number][] = [
    [-0.03, -0.17],
    [0.2, -0.235],
    [0.4, -0.225],
    [0.475, -0.12],
    [0.49, 0.0],
    [0.475, 0.13],
    [0.43, 0.245],
    [0.27, 0.28],
    [0.12, 0.27],
    [-0.03, 0.17],
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
  const fingerIdx: number[] = [];
  const sepLines: React.ReactNode[] = [];
  const order = [3, 2, 1, 0];
  order.forEach((fi) => {
    const F = FINGERS[fi];
    const c = pose.curl[fi];
    const fan = F.fan * pose.spread * ts;
    let fd = rot(dir, fan);
    let p = W(F.u, F.v);
    const segs: {a: V; b: V; ra: number; rb: number}[] = [];
    let r = F.r * L;
    SEG.forEach((sg, si) => {
      // seen from the back or the palm, curling foreshortens the segment
      const fore = 1 - c * [0.32, 0.62, 0.8][si];
      const l = F.len * sg * L * Math.max(0.12, fore);
      fd = rot(fd, -fan * 0.12 * si);
      const b = add(p, mul(fd, l));
      const rb = r * [0.96, 0.94, 0.92][si];
      segs.push({a: p, b, ra: r, rb});
      p = b;
      r = rb;
    });
    fingerIdx.push(fi);
    fingerEls.push(
      <g key={fi}>
        {segs.map((sg, si) => (
          <Capsule key={si} id={`${id}-f${fi}s${si}`} a={sg.a} b={sg.b} ra={sg.ra} rb={sg.rb} color={si === 0 ? color : mix(color, lit(color, 0.2), 0.15 * si)} spec={0.3 * sheen} k={1.1} />
        ))}
      </g>,
    );
    // ink separation along the side that faces the previously drawn (pinky-side) finger
    if (fi < 3) {
      const side = mul(n, -ts);
      const pts = [add(segs[0].a, add(mul(side, segs[0].ra * 0.92), mul(dir, segs[0].ra * 0.2))), ...segs.map((sg) => add(sg.b, mul(side, sg.rb * 0.92)))];
      pts[pts.length - 1] = add(pts[pts.length - 1], mul(norm2(sub2(segs[2].b, segs[2].a)), -segs[2].rb * 0.55));
      sepLines.push(<InkLine key={fi} d={`M${pts.map((q) => P(q)).join(' L')}`} w={iw * 0.75} />);
    }
    // glossy fingertip and knuckle highlights
    const tip = segs[2];
    const tm = add(tip.a, mul({x: tip.b.x - tip.a.x, y: tip.b.y - tip.a.y}, 0.7));
    const ta = (Math.atan2(tip.b.y - tip.a.y, tip.b.x - tip.a.x) * 180) / Math.PI;
    sepLines.push(
      <Deco key={`g${fi}`}>
        <ellipse cx={fmt(tm.x - tip.rb * 0.3)} cy={fmt(tm.y - tip.rb * 0.35)} rx={fmt(tip.rb * 0.5)} ry={fmt(tip.rb * 0.22)} transform={`rotate(${fmt(ta)} ${fmt(tm.x - tip.rb * 0.3)} ${fmt(tm.y - tip.rb * 0.35)})`} fill="#FFFFFF" opacity={0.55 * sheen} />
        {view === 'back' && <ellipse cx={fmt(segs[0].a.x - 0.2 * segs[0].ra)} cy={fmt(segs[0].a.y - 0.3 * segs[0].ra)} rx={fmt(segs[0].ra * 0.45)} ry={fmt(segs[0].ra * 0.26)} fill="#FFFFFF" opacity={0.3 * sheen} />}
      </Deco>,
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
    <Inked w={iw} id={`${id}-tk`} fade={thumbFade > 0.01 ? [{c: tBase, r: 0.34 * L * thumbFade}] : undefined}>
      <Capsule id={`${id}-t0`} a={tBase} b={t1} ra={0.1 * L} rb={0.078 * L} color={color} spec={0.22 * sheen} />
      <Capsule id={`${id}-t1`} a={t1} b={t2} ra={0.076 * L} rb={0.07 * L} color={color} spec={0.26 * sheen} />
      <Capsule id={`${id}-t2`} a={t2} b={t3} ra={0.07 * L} rb={0.064 * L} color={lit(color, 0.04)} spec={0.26 * sheen} />
      <Deco>
        <ellipse cx={fmt((t2.x + t3.x * 2) / 3)} cy={fmt((t2.y + t3.y * 2) / 3 - 0.02 * L)} rx={fmt(0.035 * L)} ry={fmt(0.018 * L)} fill="#FFFFFF" opacity={0.55 * sheen} />
      </Deco>
    </Inked>
  );

  // The thumb sits beside the palm (it is the nearest digit to the viewer in these poses), so it is drawn last.
  const f0 = W(-0.04, 0);
  const f1 = W(0.16, 0);
  const palm = bare ? (
    <g>
      <defs>
        <linearGradient id={`${id}-pf`} gradientUnits="userSpaceOnUse" x1={fmt(f0.x)} y1={fmt(f0.y)} x2={fmt(f1.x)} y2={fmt(f1.y)}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-pm`}>
          <rect x="-20000" y="-20000" width="40000" height="40000" fill={`url(#${id}-pf)`} />
        </mask>
      </defs>
      <g mask={pass === 'ink' ? undefined : `url(#${id}-pm)`}>
        <Blob id={`${id}-palm`} d={d} c={palmC} r={0.42 * L} color={color} k={0.55 + 0.5 * Math.min(1, sheen)} />
      </g>
    </g>
  ) : (
    <Blob id={`${id}-palm`} d={d} c={palmC} r={0.42 * L} color={color} k={0.55 + 0.5 * Math.min(1, sheen)} />
  );
  if (hold) {
    const isFront = (fi: number) => hold.front.includes(fi);
    const rear = fingerEls.filter((_, i) => !isFront(fingerIdx[i]));
    const front = fingerEls.filter((_, i) => isFront(fingerIdx[i]));
    const thumbFront = hold.front.includes('t');
    return (
      <g>
        {contact && pass !== 'ink' && <SoftShadow id={`${id}-cs`} c={add(palmC, contact.offset)} rx={0.62 * L} ry={0.36 * L} alpha={contact.alpha} rotate={ang} />}
        {!thumbFront && thumbEl}
        <Inked w={iw}>
          {palm}
          {rear}
        </Inked>
        {hold.obj}
        {front.length > 0 && <Inked w={iw}>{front}</Inked>}
        {sepLines}
        {thumbFront && thumbEl}
      </g>
    );
  }
  return (
    <g>
      {contact && pass !== 'ink' && <SoftShadow id={`${id}-cs`} c={add(palmC, contact.offset)} rx={0.62 * L} ry={0.36 * L} alpha={contact.alpha} rotate={ang} />}
      {bare ? (
        <>
          {palm}
          {fingerEls}
        </>
      ) : (
        <Inked w={iw}>
          {palm}
          {fingerEls}
        </Inked>
      )}
      {sepLines}
      {thumbEl}
    </g>
  );
};

const sub2 = (a: V, b: V): V => ({x: a.x - b.x, y: a.y - b.y});
const norm2 = (a: V): V => {
  const l = Math.hypot(a.x, a.y) || 1;
  return {x: a.x / l, y: a.y / l};
};

/** V3 (Real Web Fluid): the fingertips and thumb tip of a hand drawn with the same parameters (the same geometry as
 *  <Hand>), so a hold can be placed exactly at the contact points. Returns [index, middle, ring, pinky] tips and the
 *  thumb tip, in the coordinates the hand is drawn in. */
export const digitTips = (wrist: V, ang: number, L: number, ts: 1 | -1, pose: HandPose) => {
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir);
  const W = (u: number, vv: number): V => add(wrist, add(mul(dir, u * L), mul(n, vv * L * ts)));
  const tips = FINGERS.map((F, fi) => {
    const c = pose.curl[fi];
    const fan = F.fan * pose.spread * ts;
    let fd = rot(dir, fan);
    let p = W(F.u, F.v);
    SEG.forEach((sg, si) => {
      const fore = 1 - c * [0.32, 0.62, 0.8][si];
      const l = F.len * sg * L * Math.max(0.12, fore);
      fd = rot(fd, -fan * 0.12 * si);
      p = add(p, mul(fd, l));
    });
    return p;
  });
  const tBase = W(0.1, 0.19);
  const tDir = rot(dir, pose.thumb * ts);
  const t1 = add(tBase, mul(tDir, 0.2 * L));
  const tDir2 = rot(tDir, -pose.thumbCurl * 38 * ts);
  const t2 = add(t1, mul(tDir2, 0.15 * L * (1 - pose.thumbCurl * 0.35)));
  const tDir3 = rot(tDir2, -pose.thumbCurl * 30 * ts);
  const thumb = add(t2, mul(tDir3, 0.12 * L * (1 - pose.thumbCurl * 0.45)));
  return {tips, thumb};
};
