// The Truss Link rig. A link is a rigid outer housing (motor end) with a telescoping inner rod; each end carries a
// round magnetic connector shell. A link's state is just its two end points (vertex points, metres) and a few flags;
// every drawn part is derived from those two points, so the housing never stretches, the rod slides, and the
// connectors stay at the ends in every camera view.
//
// Proportions (paper: contracted 28 cm, extends ~53 % to 43 cm; 12.7 mm N52 sphere magnet in a printed shell).
import React from 'react';
import {add, cross, dot, len, mul, norm, sub, V3, v3} from '../lib/v3';
import {groundShadow, Item, lw, Proj, sphere, tube} from '../lib/r3';
import {INK} from '../dc/ink';
import {lit, rgba, shade} from '../dc/color';

export const L_MIN = 0.28;
export const L_MAX = 0.43;
/** connector shell radius */
export const RC = 0.02;
/** connector centre offset from the vertex point along the link */
export const KC = 0.021;
/** a vertex resting on the ground sits at this height (its connectors touch the ground) */
export const GY = RC;
const R_HOUS = 0.0165;
const R_MOTOR = 0.0195;
const R_ROD = 0.0085;
const L_HOUS = 0.165;

export const COL = {
  housing: '#4C5D72',
  motor: '#3A4859',
  rod: '#C6D1DA',
  shell: '#E9EEF1',
  magnetWin: '#2D3A47',
  ledOn: '#45E38E',
  ledOff: '#2B3742',
  // identity bands
  bandT: '#8DB6D6', // the receiving robot's own links
  bandX: '#F2A23C', // the acquired module (persistent accent)
  bandR: '#2EB5A5', // the replacement
  bandB: '#A4ADB6', // the broken robot's links
  bandP: '#B9C3CD', // the comparison robot on the ramp
};

export type Link = {
  id: string;
  /** motor/housing end vertex point */
  a: V3;
  /** rod end vertex point */
  b: V3;
  band: string;
  /** status light 0 (off) .. 1 (on) */
  led: number;
  /** cut-away of the connector shells at end a / b (0..1): shows the sphere magnet, its cup and spring */
  secA?: number;
  secB?: number;
  /** a cracked housing (the broken robot) */
  crack?: boolean;
  /** missing rod-end connector (snapped off) */
  noCapB?: boolean;
  /** faded (the comparison robot) */
  dim?: number;
};

/** probe data: the rod length and whether it is inside the actuator range */
export const linkLen = (l: Link) => len(sub(l.b, l.a));

// ------------------------------------------------------------------------------------------------------------
/** the screen-space marks of a connector: magnet window facing out of the end, or the cut-away */
const capDeco = (P: Proj, c: V3, out: V3, sec: number) => (s: {x: number; y: number}, R: number) => {
  const toCam = norm(sub(P.cam.eye, c));
  const facing = dot(out, toCam);
  const tip = P.proj(add(c, mul(out, RC * 0.62)));
  const dx = tip.x - s.x, dy = tip.y - s.y;
  const els: React.ReactNode[] = [];
  if (sec < 0.02 && facing > -0.35) {
    const k = Math.max(0, Math.min(1, (facing + 0.35) / 0.6));
    els.push(<ellipse key="w" cx={s.x + dx} cy={s.y + dy} rx={R * 0.42} ry={R * 0.42 * (0.45 + 0.55 * Math.abs(facing))} transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${s.x + dx} ${s.y + dy})`} fill={COL.magnetWin} opacity={k} />);
  }
  if (sec > 0.02) {
    // cut-away: the shell turns to a cross-section showing the sphere magnet in its cup, sprung toward the face
    const ax = {x: -dx, y: -dy};
    const al = Math.hypot(ax.x, ax.y) || 1;
    const u = {x: ax.x / al, y: ax.y / al};
    const n = {x: -u.y, y: u.x};
    const m = {x: s.x - u.x * R * 0.18, y: s.y - u.y * R * 0.18};
    const rm = R * 0.44;
    const coils = 5;
    let spring = `M${m.x + u.x * rm} ${m.y + u.y * rm}`;
    for (let i = 1; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const p = {x: m.x + u.x * (rm + t * R * 0.5), y: m.y + u.y * (rm + t * R * 0.5)};
      const w = (i % 2 ? 1 : -1) * R * 0.22;
      spring += ` L${p.x + n.x * w} ${p.y + n.y * w}`;
    }
    els.push(
      <g key="sec" opacity={sec}>
        <circle cx={s.x} cy={s.y} r={R * 0.93} fill="#2A3744" />
        <circle cx={s.x} cy={s.y} r={R * 0.93} fill="none" stroke={COL.shell} strokeWidth={R * 0.12} />
        <path d={`M${m.x + n.x * rm * 1.25 + u.x * rm * 0.2} ${m.y + n.y * rm * 1.25 + u.y * rm * 0.2} A${rm * 1.25} ${rm * 1.25} 0 0 1 ${m.x - n.x * rm * 1.25 + u.x * rm * 0.2} ${m.y - n.y * rm * 1.25 + u.y * rm * 0.2}`} fill="none" stroke="#8796A3" strokeWidth={R * 0.1} />
        <path d={spring} fill="none" stroke="#B9C4CC" strokeWidth={R * 0.07} strokeLinejoin="round" />
        <circle cx={m.x} cy={m.y} r={rm} fill="#D9E1E7" stroke={INK} strokeWidth={Math.max(1, R * 0.05)} />
        <path d={`M${m.x + n.x * rm} ${m.y + n.y * rm} A${rm} ${rm} 0 0 0 ${m.x - n.x * rm} ${m.y - n.y * rm} Z`} fill="#E25A4F" />
        <path d={`M${m.x + n.x * rm} ${m.y + n.y * rm} A${rm} ${rm} 0 0 1 ${m.x - n.x * rm} ${m.y - n.y * rm} Z`} fill="#4A86C8" />
        <circle cx={m.x - rm * 0.35} cy={m.y - rm * 0.4} r={rm * 0.28} fill="#FFFFFF" opacity={0.75} />
      </g>,
    );
  }
  return <>{els}</>;
};

/** the drawn parts of one link */
export const linkItems = (P: Proj, l: Link, o: {layer?: number} = {}): Item[] => {
  const out: (Item | null)[] = [];
  const d = sub(l.b, l.a);
  const L = len(d);
  const u = mul(d, 1 / L);
  const at = (s: number) => add(l.a, mul(u, s));
  const op = l.dim !== undefined ? 1 - l.dim : undefined;
  const layer = o.layer ?? 3;
  // housing with the motor bulge at the far end of the connector
  const h0 = KC + RC + 0.003, h1 = KC + L_HOUS;
  const capA = at(KC), capB = add(l.b, mul(u, -KC));
  // status light on the motor block, on the side facing the camera
  const toCam = norm(sub(P.cam.eye, at(h0 + 0.026)));
  let side = sub(toCam, mul(u, dot(toCam, u)));
  const sl = len(side);
  side = sl > 1e-4 ? mul(side, 1 / sl) : norm(cross(u, v3(0, 1, 0)));
  const ledP = add(at(h0 + 0.03), mul(side, R_MOTOR * 0.96));
  const ledS = P.proj(ledP);
  const ledR = Math.max(1.5, P.rad(ledP, 0.0046));
  const ledEl = (
      <g key={`${l.id}-led`} opacity={op}>
        {l.led > 0.02 && <circle cx={ledS.x} cy={ledS.y} r={ledR * 3} fill={rgba(COL.ledOn, 0.38 * l.led)} />}
        <circle cx={ledS.x} cy={ledS.y} r={ledR} fill={l.led > 0.5 ? COL.ledOn : l.led > 0.02 ? lit(COL.ledOff, l.led) : COL.ledOff} stroke={INK} strokeWidth={Math.max(0.8, ledR * 0.35)} />
      </g>
  );
  // the body (rod, housing, motor block, identity band) is one painted item: the rod is drawn over the housing when
  // its end is the nearer one (it comes out toward the camera), under it otherwise
  const body: (Item | null)[] = [];
  const rod = tube(P, at(h1 - 0.02), capB, R_ROD, R_ROD, COL.rod, {layer, spec: 0.55, opacity: op});
  const hous: (Item | null)[] = [];
  if (l.crack) {
    hous.push(tube(P, at(h0), at(h0 + 0.075), R_HOUS, R_HOUS, COL.housing, {layer, opacity: op}));
    hous.push(tube(P, at(h0 + 0.083), at(h1), R_HOUS, R_HOUS * 0.97, COL.housing, {layer, opacity: op}));
  } else hous.push(tube(P, at(h0), at(h1), R_HOUS, R_HOUS, COL.housing, {layer, spec: 0.18, opacity: op}));
  hous.push(tube(P, at(h0 - 0.004), at(h0 + 0.052), R_MOTOR, R_MOTOR, COL.motor, {layer, opacity: op}));
  hous.push(tube(P, at(h0 + 0.078), at(h0 + 0.1), R_HOUS * 1.06, R_HOUS * 1.06, l.band, {layer, k: 0.8, opacity: op}));
  const za = P.camSpace(l.a).z, zb = P.camSpace(l.b).z;
  if (zb < za) body.push(...hous, rod);
  else body.push(rod, ...hous);
  const bodyItems = body.filter(Boolean) as Item[];
  if (bodyItems.length) out.push({layer, depth: (za + zb) / 2, key: `${l.id}-body`, el: <g key={`${l.id}-body`}>{bodyItems.map((it) => <React.Fragment key={it.key}>{it.el}</React.Fragment>)}{ledEl}</g>});
  // connectors
  out.push(sphere(P, capA, RC, COL.shell, {layer, deco: capDeco(P, capA, mul(u, -1), l.secA ?? 0), opacity: op}));
  if (!l.noCapB) out.push(sphere(P, capB, RC, COL.shell, {layer, deco: capDeco(P, capB, u, l.secB ?? 0), opacity: op}));
  else {
    // snapped-off end: a jagged stub of the shell
    const s = P.proj(capB);
    const R = P.rad(capB, RC * 0.75);
    out.push({layer, depth: s.z, key: `${l.id}-stub`, el: <path key={`${l.id}-stub`} d={`M${s.x - R} ${s.y} l${R * 0.4} ${-R * 0.7} l${R * 0.35} ${R * 0.4} l${R * 0.4} ${-R * 0.5} l${R * 0.5} ${R * 0.8} l${-R * 0.3} ${R * 0.7} Z`} fill={shade(COL.shell, 0.2)} stroke={INK} strokeWidth={lw(R)} opacity={op} />});
  }
  if (l.crack) {
    const c0 = P.proj(at(h0 + 0.079));
    const R = P.rad(at(h0 + 0.079), R_HOUS);
    const ax = P.proj(at(h0 + 0.12));
    const a = Math.atan2(ax.y - c0.y, ax.x - c0.x) + Math.PI / 2;
    const n = {x: Math.cos(a), y: Math.sin(a)};
    const pts = [-1.2, -0.5, 0, 0.6, 1.2].map((k, i) => ({x: c0.x + n.x * k * R + (i % 2 ? 1 : -1) * R * 0.25, y: c0.y + n.y * k * R}));
    out.push({layer, depth: c0.z - 0.02, key: `${l.id}-crack`, el: <path key={`${l.id}-crack`} d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')} fill="none" stroke={INK} strokeWidth={lw(R * 2) * 0.8} strokeLinejoin="bevel" />});
  }
  return out.filter(Boolean) as Item[];
};

/** direction of the key light in the world (for ground shadows) */
export const LIGHT_W = norm(v3(0.32, -1, -0.28));

/** the soft ground shadows of a set of links on the plane y = 0 (local) and contact darkening under grounded ends */
export const shadowItems = (P: Proj, links: Link[]): Item[] => {
  const out: (Item | null)[] = [];
  const onGround = (p: V3) => add(p, mul(LIGHT_W, -p.y / LIGHT_W.y));
  for (const l of links) {
    const op = l.dim !== undefined ? 1 - l.dim : 1;
    const a = onGround(l.a), b = onGround(l.b);
    out.push(groundShadow(P, {...a, y: 0.0005}, {...b, y: 0.0005}, 0.018, 0.16 * op));
    for (const p of [l.a, l.b])
      if (p.y < GY + 0.006) {
        const g = {x: p.x, y: 0.0006, z: p.z};
        out.push(groundShadow(P, add(g, v3(-0.012, 0, 0)), add(g, v3(0.012, 0, 0)), 0.02, 0.22 * op));
      }
  }
  return out.filter(Boolean) as Item[];
};

/** a small expanding ring at a connection (the one contact cue): t in 0..1 over ~9 frames */
export const contactCue = (P: Proj, c: V3, t: number): Item | null => {
  if (t <= 0 || t >= 1) return null;
  const s = P.proj(c);
  const R = P.rad(c, RC * (1.4 + 1.6 * t));
  return {layer: 4, depth: 0, key: `cue-${c.x.toFixed(3)}`, el: <circle key="cue" cx={s.x} cy={s.y} r={R} fill="none" stroke="#FFF4D6" strokeWidth={Math.max(1.5, R * 0.16 * (1 - t))} opacity={0.9 * (1 - t)} />};
};
