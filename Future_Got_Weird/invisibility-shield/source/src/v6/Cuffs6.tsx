// V6 handcuffs, held. One cuff is gripped in his fist: it comes out of the little-finger side, under the palm, and
// two finger lobes are drawn over the metal where it leaves the fist. A short chain hangs from that cuff's lowest
// point, with the second cuff on the end. Everything is drawn in the hand's local frame (the wrist at the origin, the
// forearm along +y; the group is already rotated by `rot` and scaled to the figure). So the hanging part is turned
// back to screen-down by -rot, plus the pendulum angle `swing` (deg, + = toward screen right). `open` swings the
// hanging cuff's jaw open about its hinge (the click).
import React from 'react';
import {INK} from './cast6';

const RAD = Math.PI / 180;
const METAL = '#C9D3D8', SHINE = '#F1F5F7';
const R = 11; // cuff radius (rig units)

type P = {x: number; y: number};
const add = (a: P, b: P, k = 1): P => ({x: a.x + b.x * k, y: a.y + b.y * k});
const at = (c: P, r: number, a: number): P => ({x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a)});
const arc = (c: P, r: number, a0: number, a1: number) => {
  const p0 = at(c, r, a0), p1 = at(c, r, a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
};
const rotAbout = (p: P, c: P, a: number): P => {
  const s = Math.sin(a), k = Math.cos(a);
  return {x: c.x + (p.x - c.x) * k - (p.y - c.y) * s, y: c.y + (p.x - c.x) * s + (p.y - c.y) * k};
};

/** a metal band: ink outline, steel, a thin highlight */
const Band: React.FC<{d: string; ol: number}> = ({d, ol}) => (
  <g fill="none" strokeLinecap="round">
    <path d={d} stroke={INK} strokeWidth={6.5 + ol * 2} />
    <path d={d} stroke={METAL} strokeWidth={6.5} />
    <path d={d} stroke={SHINE} strokeWidth={1.6} opacity={0.85} />
  </g>
);

export const cuffsHeld = (ol: number, skin: string, swing: number, open = 0) => (rot: number, thumb: number) => {
  // the gripped cuff comes out of whichever side of the fist is lower on screen, so the chain always hangs from the
  // bottom of the fist (the little-finger side when the hand is level: HandArt's thumb is at x = -14 * side)
  const sr = Math.sin(rot * RAD);
  const pinky = Math.abs(sr) > 0.2 ? Math.sign(sr) : thumb > 0 ? 1 : -1;
  const ca: P = {x: pinky * 16, y: 9}; // half inside the fist
  // screen-down (plus the swing), in the hand's local frame: the group maps local v to screen R(rot) v, so the local
  // direction that lands on screen (sin swing, cos swing) is (sin(swing + rot), cos(swing + rot))
  const a = (swing + rot) * RAD;
  const G: P = {x: Math.sin(a), y: Math.cos(a)};
  const gAng = Math.atan2(G.y, G.x);
  const pa = add(ca, G, R); // the gripped cuff's lowest point: the chain hangs from here
  const links = [0, 1, 2].map((i) => add(pa, G, 3.2 + 5.2 * i));
  const ph = add(pa, G, 16.5); // the hanging cuff's hinge
  const cb = add(ph, G, R + 1.2);
  // the hanging cuff: a fixed arc either side of the hinge and the jaw (the rest), which swings about the hinge
  const hingeA = gAng + Math.PI;
  const jaw = -open * 78 * RAD;
  const jawArc = (() => {
    const p0 = rotAbout(at(cb, R, hingeA + 70 * RAD), ph, jaw);
    const p1 = rotAbout(at(cb, R, hingeA + 300 * RAD), ph, jaw);
    return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 1 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  })();
  const block = (p: P, ang: number) => (
    <rect x={-3.4} y={-2.6} width={6.8} height={5.2} rx={1.4} fill={METAL} stroke={INK} strokeWidth={ol * 0.8} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${((ang * 180) / Math.PI).toFixed(1)})`} />
  );
  const back = (
    <g>
      {/* the gripped cuff (its far side is hidden by the palm drawn over it) */}
      <Band d={arc(ca, R, 0, Math.PI * 1.999)} ol={ol} />
      {block(pa, gAng)}
      {/* the chain */}
      {links.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={i % 2 ? 1.5 : 2.7} ry={3.4} fill="none" stroke={INK} strokeWidth={1.6 + ol * 0.7}
          transform={`rotate(${((gAng * 180) / Math.PI - 90).toFixed(1)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})`} />
      ))}
      {links.map((p, i) => (
        <ellipse key={`s${i}`} cx={p.x} cy={p.y} rx={i % 2 ? 1.5 : 2.7} ry={3.4} fill="none" stroke={METAL} strokeWidth={1.3}
          transform={`rotate(${((gAng * 180) / Math.PI - 90).toFixed(1)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})`} />
      ))}
      {/* the hanging cuff */}
      <Band d={arc(cb, R, hingeA - 60 * RAD, hingeA + 70 * RAD)} ol={ol} />
      <Band d={jawArc} ol={ol} />
      {block(ph, gAng)}
    </g>
  );
  // two finger lobes over the gripped cuff where it leaves the fist
  const lobe = (x: number, y: number, r: number) => <ellipse cx={x} cy={y} rx={r} ry={r * 0.78} fill={skin} stroke={INK} strokeWidth={ol} />;
  const front = (
    <g>
      {lobe(pinky * 9, 17.5, 6)}
      {lobe(pinky * 11.5, 4, 5.4)}
    </g>
  );
  return {back, front};
};

/** A damped pendulum driven by the pivot's sideways acceleration (screen-right component, metres). xs: pivot positions
 *  at a fixed step dt, oldest first, starting from rest. Returns the angle (deg, + toward screen right) at the end. */
export const pendulum = (xs: number[], dt: number, L = 0.11, damp = 8) => {
  let th = 0, w = 0;
  const g = 9.81;
  for (let i = 1; i < xs.length - 1; i++) {
    const acc = (xs[i + 1] - 2 * xs[i] + xs[i - 1]) / (dt * dt);
    const sub = 4, h = dt / sub;
    for (let k = 0; k < sub; k++) {
      const al = -(g / L) * Math.sin(th) - (acc / L) * Math.cos(th) - damp * w;
      w += al * h;
      th += w * h;
      th = Math.max(-0.6, Math.min(0.6, th)); // a restrained swing: never more than about 34 degrees
    }
  }
  return (th * 180) / Math.PI;
};
