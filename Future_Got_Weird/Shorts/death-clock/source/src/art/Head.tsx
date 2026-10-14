// The man's head: clay-smooth egg form, 3/4 turn, enlarged expressive eyes with one crisp reflection,
// clear brows, soft nose and mouth shapes. Lineless: every feature is a filled, gradient-shaded shape.
// Drawn in a local 100-unit space; the key light is counter-rotated into that space so tilting the
// head never moves the light.
import React from 'react';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, fmt, lerp, mul, P, rot, V} from '../lib/math';
import {LIGHT} from '../lib/shade';

export type Expr = {
  /** inner brow raise (worry/pain) 0..1 */
  browIn: number;
  /** whole brow lowered (strain) 0..1 */
  browDown: number;
  /** upper lid closure 0..1 */
  lid: number;
  /** lower lid squint 0..1 */
  squint: number;
  /** mouth opening 0..1 */
  open: number;
  /** mouth width factor 0.6..1.3 */
  wide: number;
  /** clenched-teeth grimace 0..1 */
  teeth: number;
  /** gaze offset -1..1 */
  gx: number;
  gy: number;
  /** sweat bead visibility 0..1 */
  sweat: number;
  /** cheek flush 0..1 */
  flush: number;
};

export const EXPR_PAIN: Expr = {browIn: 1, browDown: 0.95, lid: 0.36, squint: 0.62, open: 0.58, wide: 1.3, teeth: 1, gx: -0.15, gy: 0.1, sweat: 1, flush: 0.8};
export const EXPR_GASP: Expr = {browIn: 0.85, browDown: 0.2, lid: 0.25, squint: 0.15, open: 0.75, wide: 0.82, teeth: 0.15, gx: 0, gy: 0.1, sweat: 1, flush: 0.6};
export const EXPR_WINCE: Expr = {browIn: 1, browDown: 1, lid: 0.7, squint: 0.8, open: 0.5, wide: 1.35, teeth: 1, gx: 0, gy: 0, sweat: 1, flush: 0.9};
export const EXPR_RELIEF: Expr = {browIn: 0.55, browDown: 0, lid: 0.22, squint: 0.1, open: 0.32, wide: 0.9, teeth: 0, gx: 0, gy: 0.05, sweat: 0.7, flush: 0.35};
export const EXPR_UNEASY: Expr = {browIn: 0.85, browDown: 0.05, lid: 0.02, squint: 0, open: 0.1, wide: 0.82, teeth: 0, gx: -0.1, gy: 0.75, sweat: 0.6, flush: 0.2};
export const EXPR_NEUTRAL: Expr = {browIn: 0.1, browDown: 0, lid: 0.12, squint: 0, open: 0.05, wide: 1, teeth: 0, gx: 0, gy: 0, sweat: 0, flush: 0.1};

export const mixExpr = (a: Expr, b: Expr, t: number): Expr => {
  const o = {} as Expr;
  (Object.keys(a) as (keyof Expr)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

type Props = {
  id: string;
  c: V;
  /** head radius in world units */
  R: number;
  /** in-plane roll (deg) */
  roll: number;
  /** 0 = facing camera, 1 = strong 3/4 toward screen-left */
  turn: number;
  expr: Expr;
  /** blink 0..1 (closes both lids) */
  blink?: number;
  skin?: string;
  hair?: string;
};

// Catmull-Rom closed path
const smoothClosed = (pts: V[]) => {
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
  return d + ' Z';
};
const smoothOpen = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6));
    const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6));
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d;
};

export const Head: React.FC<Props> = ({id, c, R, roll, turn: t, expr: e, blink = 0, skin = PAL.skin, hair = PAL.hair}) => {
  const Lc = rot(LIGHT, -roll); // light direction in head space
  const s = R / 100;
  const xf = -36 * t; // face centre line
  const skinD = shade(skin, 0.4);
  const rg = (gid: string, cx: number, cy: number, r: number, focal: number, stops: [number, string, number?][]) => {
    const f = add({x: cx, y: cy}, mul(Lc, r * focal));
    return (
      <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fx={fmt(f.x)} fy={fmt(f.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </radialGradient>
    );
  };

  // --- head silhouette (egg, narrower jaw, 3/4 turn moves chin and cheek)
  const headPts: V[] = [
    {x: 4, y: -104},
    {x: 70, y: -82},
    {x: 99, y: -18},
    {x: 88, y: 36},
    {x: 60, y: 76},
    {x: 16 - 26 * t, y: 102},
    {x: -34 - 22 * t, y: 92},
    {x: -72 - 10 * t, y: 52},
    {x: -92 - 4 * t, y: 0},
    {x: -80, y: -64},
  ];
  const headD = smoothClosed(headPts);

  // --- hair cap (short, side part), leaves the near ear free
  const hairPts: V[] = [
    {x: -72 - 6 * t, y: -58},
    {x: -52, y: -92},
    {x: 0, y: -113},
    {x: 62, y: -97},
    {x: 99, y: -46},
    {x: 104, y: 4},
    {x: 95, y: 34},
    {x: 82 + 6 * t, y: 30},
    {x: 76 + 8 * t, y: -4},
    {x: 62 + 10 * t, y: -16},
    {x: 46 + 14 * t, y: -12},
    {x: 42 + 14 * t, y: 14},
    {x: 34 + 14 * t, y: 16},
    {x: 30 + 12 * t, y: -24},
    {x: 10, y: -58},
    {x: -24 - 10 * t, y: -64},
  ];
  const hairD = smoothClosed(hairPts);

  // --- features
  const eyeY = -6;
  const nearX = xf + 33 * (1 - 0.18 * t);
  const farX = xf - 33 * (1 - 0.42 * t);
  const nearW = 1;
  const farW = 1 - 0.38 * t;
  const lidC = clamp(e.lid + blink * (1 - e.lid));
  const sq = clamp(e.squint + blink * 0.3);

  const Eye = (k: 'n' | 'f', ex: number, wf: number) => {
    const rx = 16.5 * wf;
    const ry = 18.5;
    const eyeD = `M${fmt(ex - rx)},${fmt(eyeY)} C${fmt(ex - rx)},${fmt(eyeY - ry * 1.32)} ${fmt(ex + rx)},${fmt(eyeY - ry * 1.32)} ${fmt(ex + rx)},${fmt(eyeY)} C${fmt(ex + rx)},${fmt(eyeY + ry * 1.25)} ${fmt(ex - rx)},${fmt(eyeY + ry * 1.25)} ${fmt(ex - rx)},${fmt(eyeY)} Z`;
    const ix = ex + e.gx * rx * 0.42 - t * 3.5;
    const iy = eyeY + 2 + e.gy * ry * 0.4;
    const irR = 9.6;
    // lids: skin shapes drawn over the eye, clipped to it
    const topY = eyeY - ry * 1.05 + lidC * ry * 2.05;
    const botY = eyeY + ry * 1.0 - sq * ry * 0.85;
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, eyeY, ry * 1.25, 0.35, [
            [0, '#FFFFFF'],
            [0.6, '#F7F2EE'],
            [1, '#D9CEC8'],
          ])}
          {rg(`${id}-ei${k}`, ix, iy, irR, 0.1, [
            [0, '#7A5235'],
            [0.55, '#5B3A24'],
            [1, '#2C1A10'],
          ])}
        </defs>
        {/* socket shadow around the eye */}
        <ellipse cx={fmt(ex + 1)} cy={fmt(eyeY + 1)} rx={fmt(rx * 1.32)} ry={fmt(ry * 1.3)} fill={skinD} opacity={0.22} />
        <path d={eyeD} fill={`url(#${id}-ew${k})`} />
        <g clipPath={`url(#${id}-ec${k})`}>
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(irR * wf * 0.95 + irR * 0.05)} ry={fmt(irR)} fill={`url(#${id}-ei${k})`} />
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(4.6 * wf + 0.4)} ry={fmt(4.9)} fill="#0E0A08" />
          {/* shadow cast by the upper lid onto the eyeball */}
          <rect x={fmt(ex - rx - 2)} y={fmt(topY - 1)} width={fmt(rx * 2 + 4)} height={4} fill="#3B2A22" opacity={0.14} />
          {/* upper lid */}
          <path d={`M${fmt(ex - rx - 3)},${fmt(eyeY - ry * 1.6)} L${fmt(ex + rx + 3)},${fmt(eyeY - ry * 1.6)} L${fmt(ex + rx + 3)},${fmt(topY + 1.5)} Q${fmt(ex)},${fmt(topY - 4 - 3 * (1 - lidC))} ${fmt(ex - rx - 3)},${fmt(topY + 1.5)} Z`} fill={mix(skin, skinD, 0.25)} />
          {/* lower lid */}
          <path d={`M${fmt(ex - rx - 3)},${fmt(eyeY + ry * 1.6)} L${fmt(ex + rx + 3)},${fmt(eyeY + ry * 1.6)} L${fmt(ex + rx + 3)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + 4)} ${fmt(ex - rx - 3)},${fmt(botY)} Z`} fill={mix(skin, lit(skin, 0.1), 0.5)} />
        </g>
        {/* one crisp reflection */}
        {lidC < 0.8 && <ellipse cx={fmt(ix - 3.4)} cy={fmt(Math.max(iy - 3.8, topY + 3))} rx={2.9} ry={2.6} fill="#FFFFFF" opacity={0.96} />}
        {/* lash edge: a soft darker band along the upper lid edge (shape, not a line) */}
        <path d={`M${fmt(ex - rx - 1)},${fmt(topY + 1.5)} Q${fmt(ex)},${fmt(topY - 4 - 3 * (1 - lidC))} ${fmt(ex + rx + 2)},${fmt(topY + 0.5)} Q${fmt(ex)},${fmt(topY - 0.5 - 3 * (1 - lidC))} ${fmt(ex - rx - 1)},${fmt(topY + 1.5)} Z`} fill="#3A2318" opacity={0.75} />
      </g>
    );
  };

  // brows: tapered filled shapes; inner end raised for worry/pain, whole brow lowered for strain
  const Brow = (k: 'n' | 'f', ex: number, wf: number, inner: 1 | -1) => {
    const by = -38 + e.browDown * 7;
    const w = 21 * wf;
    const innerX = ex + inner * w * (0.95 - 0.12 * e.browDown);
    const outerX = ex - inner * w * 1.05;
    const innerY = by - e.browIn * 15 + e.browDown * 3;
    const outerY = by + e.browIn * 6 - 1;
    const midY = by - 4 - e.browIn * 4;
    const th = 7.5;
    const d = `M${fmt(outerX)},${fmt(outerY)} Q${fmt(ex)},${fmt(midY - th)} ${fmt(innerX)},${fmt(innerY - th * 0.7)} Q${fmt(innerX + inner * 2)},${fmt(innerY + th * 0.4)} ${fmt(innerX - inner * 2)},${fmt(innerY + th * 0.5)} Q${fmt(ex)},${fmt(midY + th * 0.5)} ${fmt(outerX)},${fmt(outerY + 1.5)} Z`;
    return (
      <g key={`b${k}`}>
        <defs>
          <linearGradient id={`${id}-br${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lit(hair, 0.1)} />
            <stop offset="1" stopColor={shade(hair, 0.3)} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${id}-br${k})`} />
      </g>
    );
  };

  // nose (3/4): soft bridge highlight, tip ball, nostril and its cast shadow (down-right, away from the light)
  const nx = xf - 14 * t - 2;
  const ny = 30;
  // mouth
  const mx = xf - 6 * t;
  const my = 60;
  const mw = 21 * e.wide * (1 - 0.22 * t);
  const mo = e.open * 20;
  const lipCol = mix(skin, '#B85A55', 0.42);
  const mouthD = `M${fmt(mx - mw)},${fmt(my)} Q${fmt(mx)},${fmt(my - 6 - mo * 0.25)} ${fmt(mx + mw)},${fmt(my + 1)} Q${fmt(mx + mw * 0.6)},${fmt(my + mo + 4)} ${fmt(mx)},${fmt(my + mo + 5)} Q${fmt(mx - mw * 0.6)},${fmt(my + mo + 4)} ${fmt(mx - mw)},${fmt(my)} Z`;

  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>
      <defs>
        {rg(`${id}-sk`, -10, -10, 118, 0.5, [
          [0, lit(skin, 0.3)],
          [0.4, lit(skin, 0.08)],
          [0.75, skin],
          [0.94, shade(skin, 0.3)],
          [1, shade(skin, 0.22)],
        ])}
        {rg(`${id}-hr`, 10, -50, 120, 0.55, [
          [0, lit(hair, 0.28)],
          [0.45, hair],
          [1, shade(hair, 0.45)],
        ])}
        {rg(`${id}-ear`, 0, 0, 26, 0.4, [
          [0, lit(skin, 0.2)],
          [0.7, skin],
          [1, shade(skin, 0.3)],
        ])}
        <radialGradient id={`${id}-ck`}>
          <stop offset="0" stopColor="#E86F63" stopOpacity={0.5} />
          <stop offset="1" stopColor="#E86F63" stopOpacity={0} />
        </radialGradient>
        {rg(`${id}-mo`, mx, my + mo * 0.4, Math.max(8, mw), 0, [
          [0, '#3A0E12'],
          [1, '#6E1F24'],
        ])}
      </defs>

      {/* skull + face */}
      <path d={headD} fill={`url(#${id}-sk)`} />
      {/* jaw shadow on the underside */}
      <path d={smoothOpen([{x: -40 - 20 * t, y: 90}, {x: 10 - 26 * t, y: 103}, {x: 58, y: 78}, {x: 86, y: 40}, {x: 66, y: 70}, {x: 14 - 26 * t, y: 96}, {x: -40 - 20 * t, y: 90}])} fill={shade(skin, 0.35)} opacity={0.35} />
      {/* cheek flush */}
      <ellipse cx={fmt(nearX + 6)} cy={32} rx={22} ry={13} fill={`url(#${id}-ck)`} opacity={0.35 + 0.65 * e.flush} />
      <ellipse cx={fmt(farX - 2)} cy={32} rx={15} ry={12} fill={`url(#${id}-ck)`} opacity={0.3 + 0.55 * e.flush} />

      {/* hair */}
      <path d={hairD} fill={`url(#${id}-hr)`} />
      <path d={smoothOpen([{x: -30, y: -96}, {x: 10, y: -106}, {x: 50, y: -96}, {x: 18, y: -98}, {x: -30, y: -96}])} fill="#FFFFFF" opacity={0.16} />
      {/* grey at the temple (he's about forty) */}
      <path d={smoothClosed([{x: 64 + 8 * t, y: -8}, {x: 76 + 6 * t, y: -24}, {x: 90, y: -10}, {x: 86, y: 22}, {x: 72 + 6 * t, y: 26}])} fill="#8D8A86" opacity={0.35} />
      {/* near ear, on the side of the skull in front of the back hair */}
      <g transform={`translate(${fmt(58 + 16 * t)} 14) rotate(8)`}>
        <ellipse cx={0} cy={0} rx={14} ry={22} fill={`url(#${id}-ear)`} />
        <ellipse cx={-1.5} cy={2} rx={7.5} ry={13} fill={shade(skin, 0.25)} opacity={0.45} />
        <ellipse cx={-2} cy={1} rx={4} ry={8} fill={shade(skin, 0.45)} opacity={0.35} />
        <ellipse cx={4} cy={-9} rx={3.5} ry={7} fill="#FFFFFF" opacity={0.2} />
      </g>

      {/* strain creases between the brows (soft darker shapes) */}
      <ellipse cx={fmt(xf - 1)} cy={-30} rx={3.2} ry={8} fill={skinD} opacity={0.3 * e.browIn} />
      <ellipse cx={fmt(xf + 6)} cy={-29} rx={2.6} ry={7} fill={skinD} opacity={0.22 * e.browIn} />

      {e.squint > 0.3 &&
        [
          [nearX + 22, 1],
          [farX - 20 * farW, -1],
        ].map(([x0, sgn], i) => (
          <g key={i} opacity={clamp((e.squint - 0.3) * 2)}>
            <path d={`M${fmt(x0)},${-6} q${fmt(sgn * 10)},-4 ${fmt(sgn * 16)},-10 q${fmt(-sgn * 6)},8 ${fmt(-sgn * 16)},12 Z`} fill={skinD} opacity={0.35} />
            <path d={`M${fmt(x0)},${2} q${fmt(sgn * 12)},2 ${fmt(sgn * 18)},8 q${fmt(-sgn * 9)},-2 ${fmt(-sgn * 18)},-5 Z`} fill={skinD} opacity={0.3} />
          </g>
        ))}
      {Eye('f', farX, farW)}
      {Eye('n', nearX, nearW)}
      {Brow('f', farX, farW, 1)}
      {Brow('n', nearX, nearW, -1)}

      {/* nose */}
      <ellipse cx={fmt(nx + 9)} cy={fmt(ny + 8)} rx={10} ry={6} fill={skinD} opacity={0.32} />
      <ellipse cx={fmt(xf - 6 * t - 1)} cy={fmt(6)} rx={4.5} ry={17} fill={lit(skin, 0.3)} opacity={0.32} transform={`rotate(${fmt(10 * t)} ${fmt(xf - 6 * t - 1)} 6)`} />
      <circle cx={fmt(nx)} cy={fmt(ny)} r={10.5} fill={mix(skin, lit(skin, 0.15), 0.5)} />
      <ellipse cx={fmt(nx - 3)} cy={fmt(ny - 4)} rx={3.6} ry={2.4} fill="#FFFFFF" opacity={0.5} />
      <ellipse cx={fmt(nx + 4 - 3 * t)} cy={fmt(ny + 6)} rx={4.2} ry={2.6} fill={shade(skin, 0.55)} opacity={0.8} />

      {/* mouth */}
      <path d={mouthD} fill={`url(#${id}-mo)`} />
      {e.teeth > 0.01 && mo > 2 && (
        <g opacity={e.teeth}>
          <defs>
            <clipPath id={`${id}-mc`}>
              <path d={mouthD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-mc)`}>
            <rect x={fmt(mx - mw)} y={fmt(my - 6)} width={fmt(mw * 2)} height={fmt(mo * 0.42 + 6)} fill="#F3EEE8" />
            <rect x={fmt(mx - mw)} y={fmt(my + mo * 0.62)} width={fmt(mw * 2)} height={fmt(mo * 0.6 + 6)} fill="#E6DDD4" />
          </g>
        </g>
      )}
      {/* upper lip shape and lower lip sheen */}
      <path d={`M${fmt(mx - mw - 1)},${fmt(my)} Q${fmt(mx - mw * 0.4)},${fmt(my - 7 - mo * 0.2)} ${fmt(mx)},${fmt(my - 5 - mo * 0.25)} Q${fmt(mx + mw * 0.4)},${fmt(my - 7 - mo * 0.2)} ${fmt(mx + mw + 1)},${fmt(my + 1)} Q${fmt(mx)},${fmt(my - 2 - mo * 0.2)} ${fmt(mx - mw - 1)},${fmt(my)} Z`} fill={lipCol} />
      <ellipse cx={fmt(mx - 2)} cy={fmt(my + mo + 9)} rx={fmt(mw * 0.55)} ry={4} fill={lipCol} opacity={0.75} />
      <ellipse cx={fmt(mx - 4)} cy={fmt(my + mo + 8)} rx={fmt(mw * 0.22)} ry={1.6} fill="#FFFFFF" opacity={0.35} />
      {/* chin highlight */}
      <ellipse cx={fmt(xf - 16 * t)} cy={88} rx={12} ry={6} fill="#FFFFFF" opacity={0.12} />

      {/* sweat bead at the temple */}
      {e.sweat > 0.01 && (
        <g opacity={e.sweat} transform={`translate(${fmt(farX - 14)} ${fmt(-46)})`}>
          <path d="M0,-9 C4,-3 6,2 6,5 C6,9 3,11 0,11 C-3,11 -6,9 -6,5 C-6,2 -4,-3 0,-9 Z" fill="#CFE7F0" opacity={0.85} />
          <ellipse cx={-2} cy={4} rx={1.8} ry={2.6} fill="#FFFFFF" opacity={0.95} />
        </g>
      )}
    </g>
  );
};
