// A large hand and forearm in profile, in the Weird Crew finish (one ink contour around arm + palm + fingers,
// gradient shading from the fixed upper-left key light). Built for the close-ups of this film: a hand resting flat
// beside a game, an index finger striking a key, and the TMS-driven wrist jerk (quick extension up, then the hand
// drops and the fingers strike). Local frame: the wrist joint at (0,0), the hand pointing along +x (dir = 1) or
// -x (dir = -1, mirrored). `side` chooses which edge faces the camera: 'thumb' shows the thumb and index in front,
// 'pinky' shows the little-finger edge (the thumb is hidden behind the palm).
import React from 'react';
import {Inked, InkLine} from '../dc/ink';
import {lit, shade} from '../dc/color';
import {fmt, rad, V} from '../dc/math';
import {Blob, Capsule, SoftShadow} from '../dc/shade';
import {INK} from './kit';

export type HandPoseP = {
  /** wrist angle (deg): negative = extension (the back of the hand lifts), positive = flexion */
  wrist: number;
  /** index finger joint angles (deg, positive curls toward the palm side) */
  idx: [number, number, number];
  /** curl of the other three fingers (0 flat .. 1 loose fist) */
  curl: number;
  /** thumb tuck 0..1 */
  thumb: number;
};
export const FLAT: HandPoseP = {wrist: 3, idx: [4, 4, 2], curl: 0.06, thumb: 0.3};
export const HOVER: HandPoseP = {wrist: -4, idx: [16, 22, 12], curl: 0.42, thumb: 0.45};
export const mixP = (a: HandPoseP, b: HandPoseP, t: number): HandPoseP => ({
  wrist: a.wrist + (b.wrist - a.wrist) * t,
  idx: [0, 1, 2].map((i) => a.idx[i] + (b.idx[i] - a.idx[i]) * t) as [number, number, number],
  curl: a.curl + (b.curl - a.curl) * t,
  thumb: a.thumb + (b.thumb - a.thumb) * t,
});

const dirv = (a: number): V => ({x: Math.cos(rad(a)), y: Math.sin(rad(a))});
const rotp = (p: V, a: number): V => ({x: p.x * Math.cos(rad(a)) - p.y * Math.sin(rad(a)), y: p.x * Math.sin(rad(a)) + p.y * Math.cos(rad(a))});
const addv = (a: V, b: V): V => ({x: a.x + b.x, y: a.y + b.y});
const mulv = (a: V, s: number): V => ({x: a.x * s, y: a.y * s});

/** The finger chain in palm-local coordinates (before the wrist rotation). */
const chain = (k: V, base: number, a: [number, number, number], L: [number, number, number]) => {
  const p0 = k;
  const p1 = addv(p0, mulv(dirv(base + a[0]), L[0]));
  const p2 = addv(p1, mulv(dirv(base + a[0] + a[1]), L[1]));
  const p3 = addv(p2, mulv(dirv(base + a[0] + a[1] + a[2]), L[2]));
  return [p0, p1, p2, p3];
};

/** Index fingertip position (world, before the group transform) for placing contact targets. */
export const indexTip = (pose: HandPoseP, dir: 1 | -1 = 1, s = 1): V => {
  const pts = chain({x: 150, y: -2}, 0, pose.idx, [62, 40, 32]);
  const t = rotp(pts[3], pose.wrist);
  return {x: t.x * dir * s, y: (t.y + 12) * s};
};

export const SideHand: React.FC<{
  id: string;
  x: number;
  y: number;
  s?: number;
  dir?: 1 | -1;
  side?: 'thumb' | 'pinky';
  pose: HandPoseP;
  skin: string;
  sleeve: string;
  /** forearm length behind the wrist (local units) */
  arm?: number;
  /** forearm angle (deg; 0 = level, positive = the elbow end lower) */
  armAng?: number;
  /** contact shadow on the surface under the hand (alpha) */
  contact?: number;
  surfaceY?: number;
  /** a translucent dashed copy (the imagined movement) */
  ghost?: boolean;
}> = ({id, x, y, s = 1, dir = 1, side = 'thumb', pose, skin, sleeve, arm = 430, armAng = 4, contact = 0, surfaceY = 70, ghost = false}) => {
  const W = (p: V) => rotp(p, pose.wrist);
  const idx = chain({x: 150, y: -2}, 0, pose.idx, [62, 40, 32]).map(W);
  const c = pose.curl;
  const mid = chain({x: 152, y: -9}, -2, [10 + 55 * c, 14 + 60 * c, 10 + 40 * c], [64, 42, 32]).map(W);
  const ring = chain({x: 146, y: -14}, -4, [12 + 60 * c, 16 + 62 * c, 12 + 40 * c], [58, 38, 30]).map(W);
  const pink = chain({x: 136, y: -18}, -6, [14 + 64 * c, 18 + 62 * c, 12 + 40 * c], [46, 30, 26]).map(W);
  const th = pose.thumb;
  const thumb = [W({x: 34, y: 22}), W({x: 92 - 14 * th, y: 46 + 6 * th}), W({x: 128 - 26 * th, y: 52 + 10 * th})];
  const palmD = (() => {
    const pts = [
      {x: -14, y: -40}, {x: 50, y: -50}, {x: 120, y: -44}, {x: 162, y: -26}, {x: 166, y: 12}, {x: 120, y: 30}, {x: 50, y: 40}, {x: -10, y: 38},
    ].map(W);
    const [a, b, cc, d, e, f, g, h] = pts;
    return `M${fmt(a.x)},${fmt(a.y)} C${fmt(b.x)},${fmt(b.y)} ${fmt(cc.x)},${fmt(cc.y)} ${fmt(d.x)},${fmt(d.y)} L${fmt(e.x)},${fmt(e.y)} C${fmt(f.x)},${fmt(f.y)} ${fmt(g.x)},${fmt(g.y)} ${fmt(h.x)},${fmt(h.y)} Z`;
  })();
  const fa = rotp({x: -arm, y: 0}, armAng);
  const cuff = rotp({x: -arm * 0.48, y: 0}, armAng);
  const back = shade(skin, 0.22);
  const finger = (pts: V[], r: number, col: string, key: string) => (
    <g key={key}>
      <Capsule id={`${id}-${key}a`} a={pts[0]} b={pts[1]} ra={r} rb={r * 0.95} color={col} />
      <Capsule id={`${id}-${key}b`} a={pts[1]} b={pts[2]} ra={r * 0.95} rb={r * 0.9} color={col} />
      <Capsule id={`${id}-${key}c`} a={pts[2]} b={pts[3]} ra={r * 0.9} rb={r * 0.82} color={col} spec={0.25} />
    </g>
  );
  const nail = (pts: V[], r: number) => {
    const d = {x: pts[3].x - pts[2].x, y: pts[3].y - pts[2].y};
    const l = Math.hypot(d.x, d.y) || 1;
    const n = {x: -d.y / l, y: d.x / l};
    const c0 = addv(pts[2], mulv(d, 0.55));
    const top = addv(c0, mulv(n, -r * 0.72));
    return <ellipse cx={fmt(top.x)} cy={fmt(top.y)} rx={fmt(r * 0.62)} ry={fmt(r * 0.3)} transform={`rotate(${fmt((Math.atan2(d.y, d.x) * 180) / Math.PI)} ${fmt(top.x)} ${fmt(top.y)})`} fill={lit(skin, 0.4)} opacity={0.8} />;
  };
  const far = side === 'thumb' ? [finger(pink, 14, back, 'p'), finger(ring, 16, back, 'r'), finger(mid, 17, shade(skin, 0.12), 'm')] : [finger(idx, 16, back, 'i'), finger(mid, 17, shade(skin, 0.14), 'm'), finger(ring, 16, shade(skin, 0.06), 'r')];
  const near = side === 'thumb' ? finger(idx, 17, skin, 'i') : finger(pink, 15, skin, 'p');
  const body = (
    <g>
      {side === 'pinky' && <Capsule id={`${id}-th`} a={thumb[0]} b={thumb[2]} ra={20} rb={15} color={back} />}
      {/* forearm */}
      <Capsule id={`${id}-fa`} a={fa} b={{x: 0, y: 0}} ra={58} rb={44} color={skin} spec={0.2} />
      {far}
      <Blob id={`${id}-palm`} d={palmD} c={W({x: 70, y: -4})} r={130} color={skin} />
      {near}
      {side === 'thumb' && (
        <>
          <Capsule id={`${id}-th1`} a={thumb[0]} b={thumb[1]} ra={22} rb={18} color={skin} />
          <Capsule id={`${id}-th2`} a={thumb[1]} b={thumb[2]} ra={18} rb={15} color={skin} spec={0.2} />
        </>
      )}
    </g>
  );
  const inner = (
    <g>
      <Inked w={9}>{body}</Inked>
      {/* knuckle crease and nails (fill only) */}
      {side === 'thumb' ? nail(idx, 17) : nail(pink, 15)}
      <InkLine d={(() => { const a = W({x: 112, y: -40}); const b = W({x: 140, y: -30}); return `M${fmt(a.x)},${fmt(a.y)} Q${fmt((a.x + b.x) / 2)},${fmt(a.y - 6)} ${fmt(b.x)},${fmt(b.y)}`; })()} w={4} opacity={0.5} />
      {/* sleeve: a tube over the forearm with a cuff edge */}
      <Inked w={9}>
        <Capsule id={`${id}-sl`} a={fa} b={cuff} ra={78} rb={74} color={sleeve} spec={0.15} />
      </Inked>
      <path d={(() => { const n = rotp({x: 0, y: 1}, armAng); const a = addv(cuff, mulv(n, -74)); const b = addv(cuff, mulv(n, 74)); return `M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`; })()} stroke={shade(sleeve, 0.35)} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
    </g>
  );
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s * dir)} ${fmt(s)})`}>
      {contact > 0 && <SoftShadow id={`${id}-sh`} c={{x: 60, y: surfaceY}} rx={230} ry={26} alpha={0.28 * contact} />}
      {ghost ? (
        <g opacity={0.5}>
          <path d={palmD} fill="none" stroke={INK} strokeWidth={6} strokeDasharray="14 12" />
          {[idx, mid].map((pts, i) => (
            <path key={i} d={`M${fmt(pts[0].x)},${fmt(pts[0].y)} L${fmt(pts[1].x)},${fmt(pts[1].y)} L${fmt(pts[2].x)},${fmt(pts[2].y)} L${fmt(pts[3].x)},${fmt(pts[3].y)}`} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" opacity={0.25} />
          ))}
          {[idx, mid].map((pts, i) => (
            <path key={`d${i}`} d={`M${fmt(pts[0].x)},${fmt(pts[0].y)} L${fmt(pts[1].x)},${fmt(pts[1].y)} L${fmt(pts[2].x)},${fmt(pts[2].y)} L${fmt(pts[3].x)},${fmt(pts[3].y)}`} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          ))}
        </g>
      ) : (
        inner
      )}
    </g>
  );
};
