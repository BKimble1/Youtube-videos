// Group E (V3 rescue journey) shared helpers: per-frame SVG ids, an end-frame authoring wrap for the layer camera,
// uneven ground under the insect's feet (planted feet lifted onto a height field), the feed look (C3's grade,
// vignette and rolling scan band, copied from shots/c/Feed.tsx so the observer's feeds match) and a few flat props.
// Pure functions of their inputs.
import React from 'react';
import {RoachPose} from '../../../../rig/roach';
import {R2, sprawl} from '../../../roach/Roach2D';
import {View, P, D} from '../../../roach/ortho';
import {shade as shadeC} from '../../../../lib/color';
import {V3, V2, toW} from '../../../../lib/v3';
import {Cam} from '../../../dc/camera';
import {f2} from '../art';
import {INK} from '../../../../lib/ink';

export const FPS = 30;

/** unique SVG id prefix per shot and per frame */
export const idf = (prefix: string, f: number) => `${prefix}f${f}`;

/** content authored in END-frame screen px for a layer at depth d (identity on screen when the camera is at `end`) */
export const endWrap = (end: Cam, d: number) => {
  const z = 1 + (end.z - 1) / d, cx = 540 + (end.x - 540) / d, cy = 960 + (end.y - 960) / d;
  return `translate(${(cx - 540 / z).toFixed(3)} ${(cy - 960 / z).toFixed(3)}) scale(${(1 / z).toFixed(5)})`;
};

/** a height field under the insect: each foot (and its ankle, so the leg re-solves) is lifted to h(x, z) (mm); a
 *  swinging foot clears the higher of where it left and where it lands. The body is raised by the caller (motion
 *  offset) to the mean height under its feet. */
export const onGround = (pose: RoachPose, h: (x: number, z: number) => number): RoachPose => ({
  ...pose,
  legs: pose.legs.map((l) => {
    const dy = h(l.foot[0], l.foot[2]);
    const up = (p: V3): V3 => [p[0], p[1] + dy, p[2]];
    return {...l, foot: up(l.foot), ankle: up(l.ankle)};
  }),
});

/** the feed grade (C3): a cooler colour matrix, applied as a filter on the feed's scene */
export const FeedGrade: React.FC<{id: string}> = ({id}) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values="0.86 0.09 0.02 0 0  0.04 0.91 0.06 0 0.005  0.03 0.08 0.95 0 0.035  0 0 0 1 0" />
  </filter>
);

/** the feed look over a w x h feed (as C3's FeedLook): one rolling scan band, a faint cool cast, a soft vignette */
export const FeedLook: React.FC<{f: number; w: number; h: number; id: string; vig?: number}> = ({f, w, h, id, vig = 0.55}) => {
  const k = h / 1920;
  const band = ((f * 23 * k) % (h + 400 * k)) - 200 * k;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vg`} cx="50%" cy="48%" r="75%">
          <stop offset="0.55" stopColor="#0B1A24" stopOpacity="0" />
          <stop offset="1" stopColor="#0B1A24" stopOpacity={vig} />
        </radialGradient>
        <linearGradient id={`${id}-sb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DFF4FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#DFF4FF" stopOpacity="0.07" />
          <stop offset="1" stopColor="#DFF4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={f2(band)} width={w} height={f2(160 * k)} fill={`url(#${id}-sb)`} />
      <path d={`M0,${f2(band + 80 * k)} H${w}`} stroke="#E8F7FF" strokeWidth={f2(Math.max(1, 1.5 * k))} opacity={0.12} />
      <rect x={0} y={0} width={w} height={h} fill="#2C6E8E" opacity={0.06} />
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vg)`} />
    </g>
  );
};

/** a soft blurred blob (out-of-focus foreground or haze), flat colour */
export const Blur: React.FC<{id: string; sd: number; children: React.ReactNode; opacity?: number}> = ({id, sd, children, opacity}) => (
  <g opacity={opacity}>
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={f2(sd)} />
      </filter>
    </defs>
    <g filter={`url(#${id})`}>{children}</g>
  </g>
);

/** a pinhole card camera (flat 2D layers placed at real depths, so a move forward parallaxes them correctly: a layer at
 *  depth D scales by D / (D - c) about the principal point P0 as the camera advances by c, and a sideways or vertical
 *  camera offset (ox, oy, in px at depth 1) shifts it by o / D). Content is authored as seen from the reference camera
 *  (c = 0, o = 0). Not a zoom: nearer layers grow and slide out faster than far ones. */
export const cardT = (P0: {x: number; y: number}, D: number, c: number, ox = 0, oy = 0) => {
  const s = D / Math.max(1e-3, D - c);
  return `translate(${P0.x.toFixed(3)} ${P0.y.toFixed(3)}) scale(${s.toFixed(5)}) translate(${(-(P0.x + ox / D)).toFixed(3)} ${(-(P0.y + oy / D)).toFixed(3)})`;
};

/** the antennae actively probing (one function of the FILM frame, so they carry across the cuts): slow alternating
 *  sweeps outward and in, each antenna in turn dipping to tap the ground or an obstacle ahead while the other lifts.
 *  `reach` (0..1) scales the sweep; `down` biases both lower (feeling a step). Returns RoachMotion antL/antR. */
export const probe = (f: number, reach = 1, down = 0) => {
  const t = f / FPS;
  const w = 2 * Math.PI * 1.25; // one sweep cycle per 0.8 s (a cockroach sweeps about 1-2 Hz while walking)
  const one = (ph: number) => {
    const sw = Math.sin(w * t + ph);
    // the tap: the antenna dips at the inward end of its sweep (toward the path ahead), lifting as it swings out
    const tap = Math.max(0, -Math.sin(w * t + ph + 0.9)) ** 1.5;
    return {yaw: 0.5 + 0.3 * reach * sw, pitch: 0.16 - down - 0.42 * reach * tap + 0.1 * reach * Math.max(0, sw), curl: 0.85 + 0.25 * reach * tap};
  };
  return {antL: one(0), antR: one(Math.PI * 0.85), search: 0.18};
};

/** a rescuer's yellow hard hat (with its reflective band and a clipped-on headlamp) left lying crown-up on the floor
 *  at the void's entrance: the scale reference for E1 and E2 (a non-body object, far bigger than the insect). Flat
 *  fills, one cel tone, the crew ink. Seen from elevation `el` (deg) in profile, its peak to the left; daylight from
 *  the upper right (the cel shade on the left, the cast shadow to the lower left). (cx, by): the brim's centre on the
 *  floor; w: the brim's length (px); ink: contour width (px). */
export const HardHat: React.FC<{id: string; cx: number; by: number; w: number; el: number; ink: number}> = ({id, cx, by, w, el, ink}) => {
  const se = Math.sin((el * Math.PI) / 180), ce = Math.cos((el * Math.PI) / 180);
  const Rb = 0.45 * w, Rd = 0.36 * w, Hd = 0.36 * w, tb = 0.026 * w * ce + 0.01 * w;
  const bx = cx - 0.05 * w; // a short brim round the sides and back, running out to the peak at the left
  const dy = by - tb; // the dome sits on the brim's top
  const ryB = Math.max(0.012 * w, Rb * se), ryD = Math.max(0.01 * w, Rd * se);
  const ryT = Math.sqrt((Hd * ce) ** 2 + (Rd * se) ** 2);
  const n = 28;
  const arc = (x0: number, y0: number, rx: number, ry: number, a0: number, a1: number) =>
    Array.from({length: n + 1}, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [x0 + rx * Math.cos(a), y0 + ry * Math.sin(a)] as [number, number];
    });
  const d = (pts: [number, number][], close = true) => `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}${close ? ' Z' : ''}`;
  // the dome: the top arc (silhouette) over the front half of its base ring
  const dome = [...arc(cx, dy, Rd, ryT, Math.PI, 2 * Math.PI), ...arc(cx, dy, Rd, ryD, 0, Math.PI)];
  // a horizontal ring on the dome at height h (fraction of Hd): its front half
  const ring = (h: number) => {
    const r = Rd * Math.sqrt(Math.max(0, 1 - h * h));
    return arc(cx, dy - h * Hd * ce, r, r * se, 0, Math.PI);
  };
  const r1 = ring(0.14), r2 = ring(0.3);
  const band = [...r1, ...r2.slice().reverse()];
  // the cel shade: the left third of the dome (away from the light)
  const sA = arc(cx, dy, Rd, ryT, Math.PI, Math.PI * 1.4), sB = arc(cx, dy, Rd, ryD, Math.PI * 0.64, Math.PI);
  const sTop = sA[sA.length - 1], sBot = sB[0];
  const shadeD = `${d(sA, false)} Q${f2(cx - Rd * 0.12)},${f2(dy - ryT * 0.25)} ${f2(sBot[0])},${f2(sBot[1])} L${sB.slice(1).map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z`;
  void sTop;
  // the raised centre rib, running front to back over the crown (the dome's vertical section across the view)
  const rib = (o: number) => arc(cx, dy + o * se, Rd * 0.985, Hd * ce, Math.PI * 1.03, Math.PI * 1.97);
  const ribA = rib(-0.035 * w), ribB = rib(0.035 * w);
  const hi = arc(cx, dy, Rd * 0.86, ryT * 0.88, Math.PI * 1.62, Math.PI * 1.84);
  const Y = '#F2BE2C', YS = '#C98E17', YH = '#FFE58A';
  // the headlamp on the front-left of the dome, over the band
  const lx = cx - Rd * 0.62, ly = dy - 0.22 * Hd * ce + Rd * 0.5 * se, lw = 0.13 * w, lh = 0.085 * w;
  return (
    <g>
      <defs>
        <filter id={`${id}-sb`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={f2(0.025 * w)} />
        </filter>
      </defs>
      {/* the cast shadow, thrown to the lower left */}
      <ellipse cx={f2(bx - 0.08 * w)} cy={f2(by + 0.015 * w)} rx={f2(Rb * 1.05)} ry={f2(ryB + 0.03 * w)} fill="#1E1814" opacity={0.42} filter={`url(#${id}-sb)`} />
      {/* the brim: its thickness (underside) and its top */}
      <ellipse cx={f2(bx)} cy={f2(by)} rx={f2(Rb)} ry={f2(ryB)} fill={YS} stroke={INK} strokeWidth={f2(ink)} />
      <ellipse cx={f2(bx)} cy={f2(by - tb)} rx={f2(Rb)} ry={f2(ryB)} fill={Y} stroke={INK} strokeWidth={f2(ink)} />
      {/* the dome */}
      <path d={d(dome)} fill={Y} />
      <path d={shadeD} fill={YS} opacity={0.9} />
      <path d={d(band)} fill="#E6ECEE" />
      <path d={d(r2, false)} stroke="#AAB6BB" strokeWidth={f2(ink * 0.5)} fill="none" />
      <path d={d([...ribA, ...ribB.slice().reverse()])} fill={YH} opacity={0.55} />
      <path d={d(ribA, false)} stroke={INK} strokeWidth={f2(ink * 0.55)} fill="none" strokeLinecap="round" />
      <path d={d(ribB, false)} stroke={INK} strokeWidth={f2(ink * 0.55)} fill="none" strokeLinecap="round" />
      <path d={d(hi, false)} stroke={YH} strokeWidth={f2(ink * 1.3)} fill="none" strokeLinecap="round" />
      <path d={d(dome)} fill="none" stroke={INK} strokeWidth={f2(ink)} strokeLinejoin="round" />
      {/* the headlamp: a dark housing on the band, its lens (off) */}
      <path d={`M${f2(lx - lw / 2)},${f2(ly - lh / 2)} h${f2(lw)} v${f2(lh)} h${f2(-lw)} Z`} fill="#2E3438" stroke={INK} strokeWidth={f2(ink * 0.8)} strokeLinejoin="round" />
      <ellipse cx={f2(lx - lw * 0.18)} cy={f2(ly)} rx={f2(lh * 0.34)} ry={f2(lh * 0.34)} fill="#BFD3DC" stroke={INK} strokeWidth={f2(ink * 0.5)} />
      <path d={`M${f2(lx - lw * 0.26)},${f2(ly - lh * 0.14)} l${f2(lh * 0.12)},${f2(-lh * 0.08)}`} stroke="#FFFFFF" strokeWidth={f2(ink * 0.5)} strokeLinecap="round" />
    </g>
  );
};

/** an opaque underlay for the insect's legs, drawn just BEFORE Roach2D (same pose and view). Roach2D's limb outline
 *  (flatLimb) closes each segment with its end caps bulging INWARD, so every knee and ankle is a round hole in the
 *  leg's fill and whatever lies behind (pebbles, chunk edges) shows through the leg, most visibly where a leg is
 *  foreshortened (V5 QA, E4 703/715). This fills each segment's side-to-side quad and a disk at each joint (no wider
 *  than the narrower of its two segments), so it never shows past Roach2D's own outline. */
export const LegFill: React.FC<{pose: RoachPose; v: View; shadow?: number}> = ({pose, v, shadow = 1}) => {
  const top = v.F[1] > 0.7;
  const f = pose.frame;
  const cD = D(v, toW(f, [0, 8, 0]));
  // Roach2D's contact shadow, drawn here UNDER the underlay (the caller passes Roach2D shadow: 0), so the joints do
  // not pick up a darker disk where the shadow would show through the holes (same geometry as Roach2D's)
  const g0 = P(v, [f.o[0], 0, f.o[2]]);
  const gx = P(v, toW(f, [30, 0, 0])), gb = P(v, toW(f, [-40, 0, 0])), gz = P(v, toW(f, [0, 0, 22]));
  const sw = Math.hypot(gx[0] - gb[0], gx[1] - gb[1]) / 2, sh = Math.max(4, Math.hypot(gz[0] - g0[0], gz[1] - g0[1]));
  const sang = (Math.atan2(gx[1] - gb[1], gx[0] - gb[0]) * 180) / Math.PI;
  const p = sprawl(pose);
  const quad = (a: V2, b: V2, ra: number, rb: number) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    return `M${f2(a[0] + nx * ra)},${f2(a[1] + ny * ra)} L${f2(b[0] + nx * rb)},${f2(b[1] + ny * rb)} L${f2(b[0] - nx * rb)},${f2(b[1] - ny * rb)} L${f2(a[0] - nx * ra)},${f2(a[1] - ny * ra)} Z`;
  };
  const disk = (c: V2, r: number) => `M${f2(c[0] - r)},${f2(c[1])} a${f2(r)},${f2(r)} 0 1 0 ${f2(2 * r)},0 a${f2(r)},${f2(r)} 0 1 0 ${f2(-2 * r)},0 Z`;
  return (
    <g>
      {shadow > 0 && (
        <ellipse cx={f2((gx[0] + gb[0]) / 2 + 0.06 * sw)} cy={f2((gx[1] + gb[1]) / 2 + (top ? 0.18 * sh : 0.06 * sh))} rx={f2(sw * 1.08)} ry={f2(top ? sh * 1.15 : Math.max(5, sh * 0.32))} transform={`rotate(${f2(sang)} ${f2((gx[0] + gb[0]) / 2)} ${f2((gx[1] + gb[1]) / 2)})`} fill={R2.shadow} opacity={0.22 * shadow} />
      )}
      {p.legs.map((l) => {
        const s = v.s, d = l.def;
        const near = !top && D(v, l.coxa) > cD + 2;
        const col = top || near ? R2.leg : R2.legFar;
        const c = P(v, l.coxa), k = P(v, l.knee), a = P(v, l.ankle), ft = P(v, l.foot);
        const rF = d.rFem * s * 0.95, rT = d.rTib * s * 0.9, rTa = 0.75 * s;
        const e = 0.985; // a hair inside the outline
        const dd = [quad(c, k, rF * e, rF * 0.82 * e), quad(k, a, rT * e, rT * 0.62 * e), disk(k, Math.min(rF * 0.82, rT) * e), disk(a, Math.min(rT * 0.62, rTa) * e)].join(' ');
        return (
          <g key={d.name}>
            <path d={dd} fill={col} />
            <path d={`${quad(a, ft, rTa * e, rTa * 0.55 * e)} ${disk(ft, rTa * 0.55 * e)}`} fill={shadeC(col, 0.12)} />
          </g>
        );
      })}
    </g>
  );
};
