// The guesser's RIGHT hand seen from its thumb side (palm down, the arm reaching to screen-left), drawn with the
// Weird Crew rig's own primitives (dc/shade Capsule + Blob, dc/ink Inked contour, dc/color skin tones) so it matches
// the rig's hands and arms in line, shading and colour. Built as an anatomical chain:
//   forearm -> wrist -> palm (metacarpals) -> MCP -> proximal -> PIP -> middle -> DIP -> distal phalanx,
// with nails on the dorsal side of each distal phalanx, palmar flexion creases at PIP/DIP, a fingertip pad, and a
// thumb (CMC -> metacarpal with the thenar bulge -> MCP -> proximal -> IP -> distal) nearest the camera.
// The index finger is nearest the camera of the four fingers; middle, ring and little fingers sit behind it, a
// shade darker, and are offset so a curled one never reads as a second index.
// Every point is wrist + dir*u*L + n*v*L (u along the hand, v toward the palm), so the key light stays fixed.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Deco, Inked, InkLine} from '../dc/ink';
import {add, fmt, mul, P, rot, V} from '../dc/math';
import {Blob, Capsule} from '../dc/shade';
import {Limb} from '../dc/limb';

export type HPose = {
  /** index flex at MCP, PIP, DIP (deg, + = toward the palm) */
  i0: number;
  i1: number;
  i2: number;
  /** curl of middle, ring, little 0 (straight) .. 1 (fist) */
  m: number;
  r: number;
  l: number;
  /** thumb flex at CMC (metacarpal, inside the thenar), MCP and IP (deg, + = toward the palm) */
  t0: number;
  t1: number;
  t2: number;
  /** wrist flex (deg, + = palm-ward) */
  wr: number;
};
export const H_POINT: HPose = {i0: 8, i1: 10, i2: 6, m: 0.92, r: 0.97, l: 1.0, t0: 10, t1: 12, t2: 10, wr: 0};
export const H_FLAT: HPose = {i0: 4, i1: 8, i2: 5, m: 0.06, r: 0.09, l: 0.12, t0: 10, t1: -2, t2: -6, wr: 0};
export const H_RELAX: HPose = {i0: 12, i1: 18, i2: 10, m: 0.24, r: 0.3, l: 0.36, t0: 14, t1: 8, t2: 6, wr: 0};
export const H_CUP: HPose = {i0: 36, i1: 50, i2: 28, m: 0.48, r: 0.5, l: 0.54, t0: 26, t1: 14, t2: 10, wr: 0};
export const H_FIST: HPose = {i0: 86, i1: 104, i2: 64, m: 1.0, r: 1.0, l: 1.0, t0: 4, t1: 20, t2: 16, wr: 0};
export const mixH = (a: HPose, b: HPose, t: number): HPose => {
  const o = {} as HPose;
  (Object.keys(a) as (keyof HPose)[]).forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
  return o;
};

type Seg = {a: V; b: V; ra: number; rb: number};
type Chain = {segs: Seg[]; tip: V; tipDir: V};

// finger table: MCP (u, v), segment lengths, base radius, depth darkening
const FING = {
  index: {u: 0.452, v: -0.04, len: [0.2, 0.122, 0.098], r: 0.058, dk: 0},
  middle: {u: 0.462, v: -0.028, len: [0.218, 0.136, 0.104], r: 0.059, dk: 0.1},
  ring: {u: 0.452, v: -0.018, len: [0.205, 0.128, 0.098], r: 0.055, dk: 0.17},
  little: {u: 0.43, v: -0.006, len: [0.165, 0.1, 0.088], r: 0.05, dk: 0.24},
};

export type HandFrame = {W: V; dir: V; L: number; side?: 1 | -1};

export const frameFns = (f: HandFrame, wr: number) => {
  const sd = f.side ?? 1;
  const d = rot(f.dir, -wr * sd);
  const n = {x: d.y * sd, y: -d.x * sd};
  const at = (u: number, v: number): V => add(f.W, add(mul(d, u * f.L), mul(n, v * f.L)));
  // rotate a hand-local direction by +a toward the palm
  const flexDir = (base: V, a: number): V => rot(base, -a * sd);
  return {d, n, at, flexDir, sd};
};

const chain = (f: HandFrame, wr: number, base: V, startDir: V, lens: number[], r: number, angs: number[]): Chain => {
  const {flexDir} = frameFns(f, wr);
  let p = base;
  let dd = startDir;
  const segs: Seg[] = [];
  let rr = r * f.L;
  lens.forEach((l, i) => {
    dd = flexDir(dd, angs[i]);
    const b = add(p, mul(dd, l * f.L));
    const rb = rr * [0.93, 0.92, 0.9][i];
    segs.push({a: p, b, ra: rr, rb});
    p = b;
    rr = rb;
  });
  return {segs, tip: p, tipDir: dd};
};

const curlAngs = (c: number) => [c * 78, c * 102, c * 62];

/** All joint positions (also used to place the focal point, the pulse and the contact checks). */
export const handGeo = (f: HandFrame, p: HPose) => {
  const {d, n, at, flexDir} = frameFns(f, p.wr);
  const fing = (k: keyof typeof FING, angs: number[]) => chain(f, p.wr, at(FING[k].u, FING[k].v), d, FING[k].len, FING[k].r, angs);
  const index = fing('index', [p.i0, p.i1, p.i2]);
  const middle = fing('middle', curlAngs(p.m));
  const ring = fing('ring', curlAngs(p.r));
  const little = fing('little', curlAngs(p.l));
  // thumb: CMC near the wrist on the palm side; its metacarpal lies inside the thenar (part of the palm's silhouette)
  const thumb = chain(f, p.wr, at(0.06, 0.04), d, [0.25, 0.135, 0.112], 0.064, [p.t0, p.t1, p.t2]);
  // the index pad: the palmar side of the distal phalanx, a little back from the tip
  const ds = index.segs[2];
  const pad = add(add(ds.a, mul({x: ds.b.x - ds.a.x, y: ds.b.y - ds.a.y}, 0.72)), mul({x: index.tipDir.y * (f.side ?? 1), y: -index.tipDir.x * (f.side ?? 1)}, ds.rb * 0.95));
  // the centre of the palm's underside (palmar surface over the 3rd metacarpal head region)
  const palmPt = at(0.32, 0.085);
  return {d, n, at, index, middle, ring, little, thumb, pad, palmPt, flexDir};
};

type Props = {
  id: string;
  f: HandFrame;
  pose: HPose;
  skin: string;
  /** contour width in the drawing's units */
  ink: number;
  /** forearm from this elbow point to the wrist (optional) */
  elbow?: V;
  /** forearm radius at the elbow / wrist (fractions of L) */
  rE?: number;
  rW?: number;
  /** skin indentation at the index pad (0..1), drawn as a soft flattening */
  press?: number;
  /** extra darkening of the whole arm (depth) */
  dim?: number;
  /** the whole arm as the rig's one-contour limb: shoulder S -> elbow E -> wrist (radii at S and E) */
  limb?: {S: V; E: V; rS: number; rE: number};
};

export const ProfileArm: React.FC<Props> = ({id, f, pose, skin, ink, elbow, rE = 0.21, rW = 0.135, press = 0, dim = 0, limb}) => {
  const g = handGeo(f, pose);
  const L = f.L;
  const sk = dim > 0 ? shade(skin, dim) : skin;
  const far = (k: number) => shade(sk, k);
  const palmD = (() => {
    const pts: [number, number][] = [
      [-0.06, -0.118], [0.1, -0.13], [0.27, -0.122], [0.42, -0.104], [0.495, -0.055], [0.51, 0.0], [0.48, 0.048],
      [0.4, 0.07], [0.27, 0.085], [0.14, 0.11], [0.02, 0.118], [-0.07, 0.06],
    ];
    const q = pts.map(([u, v]) => g.at(u, v));
    let dd = `M${P(q[0])}`;
    for (let i = 0; i < q.length; i++) {
      const p0 = q[(i - 1 + q.length) % q.length], p1 = q[i], p2 = q[(i + 1) % q.length], p3 = q[(i + 2) % q.length];
      const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6));
      const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6));
      dd += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
    }
    return dd + ' Z';
  })();
  const fingerCaps = (k: string, c: Chain, col: string, spec: number) =>
    c.segs.map((s, i) => <Capsule key={`${k}${i}`} id={`${id}-${k}${i}`} a={s.a} b={s.b} ra={s.ra} rb={s.rb} color={i === 0 ? col : mix(col, lit(col, 0.15), 0.12 * i)} spec={spec} k={1.05} />);
  // nail on the dorsal side of a distal phalanx: an elongated plate seen edge-on, cuticle to free edge
  const nail = (k: string, c: Chain, col: string) => {
    const sg = c.segs[2];
    const ax = {x: sg.b.x - sg.a.x, y: sg.b.y - sg.a.y};
    const sd = f.side ?? 1;
    const dor = {x: -c.tipDir.y * sd, y: c.tipDir.x * sd};
    const m = add(add(sg.a, mul(ax, 0.74)), mul(dor, sg.rb * 0.74));
    const ta = (Math.atan2(ax.y, ax.x) * 180) / Math.PI;
    const rx = Math.hypot(ax.x, ax.y) * 0.4 + sg.rb * 0.25;
    const ry = sg.rb * 0.26;
    const tr = `rotate(${fmt(ta)} ${fmt(m.x)} ${fmt(m.y)})`;
    return (
      <Deco key={`n${k}`}>
        <ellipse cx={fmt(m.x)} cy={fmt(m.y)} rx={fmt(rx)} ry={fmt(ry)} transform={tr} fill={mix(col, '#FFD3C8', 0.75)} stroke={mix(col, '#7A4A3A', 0.55)} strokeWidth={fmt(ink * 0.32)} />
        <ellipse cx={fmt(m.x)} cy={fmt(m.y - ry * 0.2)} rx={fmt(rx * 0.62)} ry={fmt(ry * 0.3)} transform={tr} fill="#FFFFFF" opacity={0.7} />
      </Deco>
    );
  };
  // palmar flexion creases at the PIP and DIP joints, and the knuckle wrinkle on the back of the PIP
  const creases = (k: string, c: Chain, op: number) => {
    const sd = f.side ?? 1;
    return (
      <Deco key={`c${k}`}>
        {[1, 2].map((j) => {
          const jt = c.segs[j].a;
          const t = {x: c.segs[j].b.x - c.segs[j].a.x, y: c.segs[j].b.y - c.segs[j].a.y};
          const tl = Math.hypot(t.x, t.y) || 1;
          const tu = {x: t.x / tl, y: t.y / tl};
          const pal = {x: tu.y * sd, y: -tu.x * sd};
          const r = c.segs[j].ra;
          const p0 = add(jt, mul(pal, r * 0.62));
          const p1 = add(jt, mul(pal, r * 0.98));
          const q0 = add(jt, mul(pal, -r * 0.55));
          const q1 = add(jt, mul(pal, -r * 0.92));
          return (
            <g key={j}>
              <InkLine d={`M${P(p0)} L${P(p1)}`} w={ink * 0.42} opacity={0.45 * op} />
            </g>
          );
        })}
      </Deco>
    );
  };
  const tipGloss = (c: Chain) => {
    const s = c.segs[2];
    const m = add(s.a, mul({x: s.b.x - s.a.x, y: s.b.y - s.a.y}, 0.55));
    const ta = (Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180) / Math.PI;
    return <ellipse cx={fmt(m.x - s.rb * 0.25)} cy={fmt(m.y - s.rb * 0.4)} rx={fmt(s.rb * 0.45)} ry={fmt(s.rb * 0.18)} transform={`rotate(${fmt(ta)} ${fmt(m.x - s.rb * 0.25)} ${fmt(m.y - s.rb * 0.4)})`} fill="#FFFFFF" opacity={0.4} />;
  };
  // the index pad flattens a touch under focused pressure (a few percent of the finger's radius, never a dent)
  const padEl = (() => {
    const s = g.index.segs[2];
    const ax = {x: s.b.x - s.a.x, y: s.b.y - s.a.y};
    const c = add(add(s.a, mul(ax, 0.62)), mul({x: g.index.tipDir.y * (f.side ?? 1), y: -g.index.tipDir.x * (f.side ?? 1)}, s.rb * (0.42 - 0.06 * press)));
    return <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(s.rb * (0.78 + 0.05 * press))} ry={fmt(s.rb * 0.62)} transform={`rotate(${fmt((Math.atan2(ax.y, ax.x) * 180) / Math.PI)} ${fmt(c.x)} ${fmt(c.y)})`} fill={sk} />;
  })();
  const fe = elbow;
  const back = [
    {k: 'l', c: g.little, col: far(0.24)},
    {k: 'r', c: g.ring, col: far(0.17)},
    {k: 'm', c: g.middle, col: far(0.1)},
  ];
  return (
    <g>
      {/* the three fingers behind the index, each its own outlined group so they read as separate digits */}
      {back.map(({k, c, col}) => (
        <g key={k}>
          <Inked w={ink}>{fingerCaps(k, c, col, 0)}</Inked>
          {pose[k as 'm' | 'r' | 'l'] < 0.45 && nail(k, c, col)}
          {creases(k, c, 0.5)}
        </g>
      ))}
      {/* forearm + palm + index: one silhouette, no line across the wrist or the knuckle */}
      <Inked w={ink}>
        {fe && !limb && <Capsule id={`${id}-fa`} a={fe} b={g.at(-0.02, 0)} ra={rE * L} rb={rW * L} color={sk} spec={0.2} />}
        {limb && <Limb id={`${id}-lb`} A={limb.S} B={limb.E} C={g.at(-0.02, 0)} rA={limb.rS} rB={limb.rE} rC={rW * L} color={sk} spec={0.2} />}
        <Blob id={`${id}-palm`} d={palmD} c={g.at(0.22, -0.06)} r={0.42 * L} color={sk} k={0.85} />
        {fingerCaps('i', g.index, sk, 0.28)}
        {press > 0.02 && padEl}
        {/* thenar: the thumb's metacarpal, merged into the palm */}
        <Capsule id={`${id}-tm`} a={g.thumb.segs[0].a} b={g.thumb.segs[0].b} ra={g.thumb.segs[0].ra * 1.35} rb={g.thumb.segs[0].rb * 1.02} color={sk} spec={0.18} />
      </Inked>
      {nail('i', g.index, sk)}
      {creases('i', g.index, 1)}
      <Deco>
        {tipGloss(g.index)}
        {/* knuckle highlight */}
        <ellipse cx={fmt(g.at(0.44, -0.085).x)} cy={fmt(g.at(0.44, -0.085).y)} rx={fmt(0.045 * L)} ry={fmt(0.018 * L)} fill="#FFFFFF" opacity={0.35} />
      </Deco>
      {/* thumb: its own contour, in front of the palm */}
      <Inked w={ink} id={`${id}-tk`} fade={[{c: add(g.thumb.segs[1].a, mul(g.d, -0.02 * L)), r: g.thumb.segs[1].ra * 1.9}]}>
        {g.thumb.segs.slice(1).map((s, i) => (
          <Capsule key={i} id={`${id}-t${i}`} a={s.a} b={s.b} ra={s.ra} rb={s.rb} color={lit(sk, 0.03)} spec={0.14} k={1.0} />
        ))}
      </Inked>
      {nail('t', g.thumb, sk)}
      <Deco>{tipGloss(g.thumb)}</Deco>
    </g>
  );
};
