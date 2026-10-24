// The rebuild's head rig, in the Weird Crew finish of the Death Clock (dimensional gradients from one key light, glossy
// highlights, thin selective ink) with a more natural, adult face: almond eyes with coloured irises, lids and lash lines,
// shaped brows, a nose that turns into the silhouette, lips. One head turns continuously from front (turn 0) to full
// profile (turn 1): the outline is morphed point by point between a front and a profile drawing (the same 28 points),
// and every feature sits on the head at an azimuth, so it slides round the form as the head turns (no feature ever
// pops). Hair is a cap computed from the head's own outline, cut along a hairline: curly, sleek with a bun, or a quiff.
// Drawn in a local space where the head's half-width is about 90 (crown y -122, chin y 104); `flip` mirrors it to face
// screen-right, with the key light mirrored back so the light never changes side.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {INK, Inked, InkLine, InkPath, useInk} from '../lib/ink';
import {add, clamp, fmt, hash, lerp, mul, P, rot, V} from '../lib/math';
import {LIGHT} from '../lib/shade';

export type HairStyle = 'curly' | 'bun' | 'quiff' | 'beanie';
export type Look = {
  skin: string;
  hair: string;
  brow: string;
  iris: string;
  lip: string;
  cheek: string;
  style: HairStyle;
  /** eyelash wing and fuller lashes */
  fem?: boolean;
  /** light stubble on the jaw */
  stubble?: boolean;
  /** jaw width factor (1 = default) */
  jaw?: number;
  /** small gold hoops */
  earrings?: boolean;
  /** knit hat colour (style 'beanie') */
  hat?: string;
};

export type Expr = {
  /** both brows raised (surprise) 0..1 */
  browUp: number;
  /** inner ends raised (worry, puzzlement) 0..1 */
  browIn: number;
  /** brows lowered and drawn together (focus, strain) 0..1 */
  browDown: number;
  /** one brow cocked (doubt) -1..1 (+ = the near brow up) */
  cock: number;
  /** upper lid lowered 0..1 */
  lid: number;
  /** lower lid raised (smile, squint) 0..1 */
  squint: number;
  /** eyes opened wider than rest 0..1 */
  wide: number;
  /** pupil scale */
  pupil: number;
  /** gaze -1..1 (x toward screen-right in the head's own frame, y down) */
  gx: number;
  gy: number;
  /** mouth opening 0..1 */
  open: number;
  /** mouth corners -1 frown .. 1 smile */
  smile: number;
  /** mouth width factor */
  mw: number;
  /** one-sided mouth (smirk, puzzled) -1..1 */
  skew: number;
  /** teeth showing 0..1 */
  teeth: number;
  /** cheek flush 0..1 */
  flush: number;
};

export const E_REST: Expr = {browUp: 0.05, browIn: 0, browDown: 0, cock: 0, lid: 0.18, squint: 0.05, wide: 0, pupil: 1, gx: 0, gy: 0, open: 0, smile: 0.15, mw: 1, skew: 0, teeth: 0, flush: 0.2};
export const E_STARTLE: Expr = {...E_REST, browUp: 1, browIn: 0.25, lid: 0, squint: 0, wide: 1, pupil: 0.82, open: 0.28, smile: -0.1, mw: 0.78, flush: 0.35};
export const E_PUZZLED: Expr = {...E_REST, browUp: 0.35, browIn: 0.75, cock: 0.7, lid: 0.12, wide: 0.25, open: 0.06, smile: -0.25, mw: 0.85, skew: 0.5, flush: 0.3};
export const E_LISTEN: Expr = {...E_REST, browUp: 0.55, browIn: 0.45, lid: 0.22, wide: 0.15, open: 0.04, smile: 0.05, mw: 0.9};
export const E_AMAZED: Expr = {...E_REST, browUp: 0.95, browIn: 0.15, lid: 0.02, wide: 0.75, pupil: 0.95, open: 0.42, smile: 0.35, mw: 0.95, teeth: 0.35, flush: 0.45};
export const E_GRIN: Expr = {...E_REST, browUp: 0.55, lid: 0.2, squint: 0.45, open: 0.22, smile: 0.95, mw: 1.15, teeth: 0.8, flush: 0.45};
export const E_BLANK: Expr = {...E_REST, browUp: 0.1, lid: 0.32, squint: 0.05, smile: 0.05, mw: 0.95};
export const E_FOCUS: Expr = {...E_REST, browDown: 0.55, lid: 0.28, squint: 0.25, smile: 0.1, mw: 0.9};
export const E_LOST: Expr = {...E_REST, browUp: 0.5, browIn: 0.9, lid: 0.1, wide: 0.35, pupil: 0.9, open: 0.16, smile: -0.45, mw: 0.85, skew: -0.3, flush: 0.3};

export const mixExpr = (a: Expr, b: Expr, t: number): Expr => {
  const o = {} as Expr;
  (Object.keys(a) as (keyof Expr)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

// ---------------------------------------------------------------- the outline: front and profile, point for point
// crown, then the face side (screen-left) down to the chin, then the far side (front) / the jaw and skull (profile)
const FRONT: V[] = [
  {x: 0, y: -122}, {x: -50, y: -114}, {x: -80, y: -90}, {x: -91, y: -56}, {x: -92, y: -26}, {x: -92, y: -6},
  {x: -90, y: 12}, {x: -87, y: 28}, {x: -82, y: 42}, {x: -75, y: 56}, {x: -65, y: 68}, {x: -53, y: 80},
  {x: -38, y: 91}, {x: -20, y: 98}, {x: 0, y: 100},
  {x: 20, y: 98}, {x: 38, y: 91}, {x: 53, y: 80}, {x: 65, y: 68}, {x: 75, y: 56}, {x: 82, y: 42}, {x: 87, y: 28},
  {x: 90, y: 12}, {x: 92, y: -6}, {x: 92, y: -26}, {x: 91, y: -56}, {x: 80, y: -90}, {x: 50, y: -114},
];
const PROFILE: V[] = [
  {x: 14, y: -124}, {x: -36, y: -119}, {x: -70, y: -97}, {x: -86, y: -64}, {x: -90, y: -32}, {x: -84, y: -12},
  {x: -92, y: 8}, {x: -108, y: 29}, {x: -93, y: 38}, {x: -91, y: 48}, {x: -85, y: 55}, {x: -90, y: 64},
  {x: -83, y: 82}, {x: -66, y: 96}, {x: -40, y: 101},
  {x: -12, y: 102}, {x: 14, y: 92}, {x: 30, y: 74}, {x: 46, y: 60}, {x: 66, y: 50}, {x: 84, y: 34}, {x: 96, y: 12},
  {x: 102, y: -14}, {x: 103, y: -42}, {x: 97, y: -70}, {x: 82, y: -96}, {x: 60, y: -114}, {x: 38, y: -122},
];
// how far each point has gone on its way to the profile at turn t: the nose, mouth and chin lag, so the nose only
// breaks the silhouette late in the turn (a 3/4 face keeps a soft cheek line)
const lagOf = (i: number) => (i <= 14 ? Math.exp(-(((i - 7.5) / 2.6) ** 2)) : 0);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const headOutline = (t: number): V[] =>
  FRONT.map((f, i) => {
    const base = sstep(0, 1, t) * 0.5 + t * 0.5;
    const w = lerp(base, sstep(0.3, 1, t), lagOf(i));
    return {x: lerp(f.x, PROFILE[i].x, w), y: lerp(f.y, PROFILE[i].y, w)};
  });

const smoothClosed = (pts: V[], tension = 1 / 6) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, tension));
    const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, tension));
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};
/** dense samples of the closed Catmull-Rom curve (for the hair cap) */
const sampleClosed = (pts: V[], per = 8): V[] => {
  const out: V[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const s = k / per, s2 = s * s, s3 = s2 * s;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * s + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * s + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3),
      });
    }
  }
  return out;
};
const polyD = (pts: V[], closed = true) => `M${pts.map(P).join(' L')}${closed ? ' Z' : ''}`;
const Q = (a: V, c: V, b: V) => `M${P(a)} Q${P(c)} ${P(b)}`;
const RAD = Math.PI / 180;
const sqLine = (q: number) => clamp(q * 2);

type Props = {
  id: string;
  c: V;
  /** scale: world units per head unit */
  s: number;
  roll?: number;
  turn: number;
  flip?: boolean;
  expr: Expr;
  blink?: number;
  look: Look;
  /** contour width in head units */
  inkW?: number;
  /** hair follow-through (deg) */
  sway?: number;
  /** extra drawn in head space over the face (e.g. a hand's shadow) */
  children?: React.ReactNode;
  /** draw the near ear in full anatomical detail (close-ups) 0..1 */
  earDetail?: number;
};

export const Face: React.FC<Props> = ({id, c, s, roll = 0, turn, flip = false, expr: e, blink = 0, look, inkW = 7, sway = 0, children, earDetail = 0}) => {
  const pass = useInk().pass;
  const t = clamp(turn);
  const yaw = t * 90;
  const fx = flip ? -1 : 1;
  // the key light in head space (rotated by the roll, mirrored with the head)
  const Lw = rot(LIGHT, -roll);
  const Lc = {x: Lw.x * fx, y: Lw.y};
  const skin = look.skin;
  const fw = inkW * 0.8;
  const lw = Math.min(1, inkW / 7);
  const jw = look.jaw ?? 1;
  const out = headOutline(t).map((p, i) => (i >= 9 && i <= 21 ? {x: p.x * lerp(1, jw, clamp((p.y - 20) / 60)), y: p.y} : p));
  const headD = smoothClosed(out);
  // a feature at azimuth a (deg, 0 = the face's centre line, + toward the head's screen-right side) at radius r
  const az = (a: number, r: number) => r * Math.sin((a - yaw) * RAD);
  const facing = (a: number) => Math.cos((a - yaw) * RAD);
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

  // ---------------------------------------------------------------- hair cap
  const st = look.style;
  const pts = sampleClosed(out, 10);
  const n = pts.length;
  const ctr = {x: lerp(0, 8, t), y: -8};
  // volume per outline sample (outward from the centre)
  const vol = (i: number, p: V) => {
    const ang = Math.atan2(p.y - ctr.y, p.x - ctr.x); // -pi..pi, -pi/2 = up
    const up = clamp(-Math.sin(ang)); // 1 at the top
    if (st === 'curly') {
      const lobes = Math.pow(Math.abs(Math.sin(ang * 13 + 0.6 + sway * 0.02)), 0.5);
      return (8 + 13 * up) * (0.62 + 0.38 * lobes);
    }
    if (st === 'bun') return 4 + 5 * up;
    if (st === 'beanie') return 5 + 2 * up;
    // quiff: short sides, a lifted swoop over the front of the crown
    const front = Math.atan2(-0.95, lerp(0.15, -0.55, t));
    let da = ang - front;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    return 3 + 3 * up + 38 * Math.exp(-((da / 0.5) ** 2)) * (da < 0 ? 1 : 0.75);
  };
  const outer = pts.map((p, i) => {
    const v = vol(i, p);
    const d = {x: p.x - ctr.x, y: p.y - ctr.y};
    const l = Math.hypot(d.x, d.y) || 1;
    return {x: p.x + (d.x / l) * v, y: p.y + (d.y / l) * v};
  });
  // the hairline, left to right in head space: the forehead between the temples, down the sideburn in front of the
  // ear, behind the ear down to the nape
  const fore = st === 'bun' ? -74 : st === 'quiff' ? -70 : -64;
  const tN = az(74, 86); // near temple
  const tF = az(-74, 86); // far temple
  const earX = az(96, 90);
  const sideY = st === 'bun' ? -10 : st === 'quiff' ? -22 : st === 'beanie' ? -4 : -14;
  const napeY = st === 'bun' ? 46 : st === 'curly' ? 40 : 30;
  const farSide = lerp(sideY, fore + 4, sstep(0.08, 0.35, t));
  const hairY = (x: number) => {
    if (x < tF) return farSide;
    if (x < tF + 18) return lerp(farSide, fore, sstep(tF, tF + 18, x));
    if (x <= tN) {
      // a gentle M on the forehead; the bun's side-swept part runs higher on the far side
      const u = (x - tF) / Math.max(1, tN - tF);
      if (st === 'bun') return fore - 10 * Math.sin(u * Math.PI) - 12 * Math.exp(-(((u - 0.7) / 0.12) ** 2));
      return fore + 6 * Math.sin(u * Math.PI);
    }
    if (x < earX - 10) return lerp(fore, sideY, sstep(tN - 4, tN + 22, x));
    if (x < earX + 18) return sideY;
    return lerp(sideY, napeY, sstep(earX + 18, earX + 40, x));
  };
  const inHair = (p: V) => p.y < hairY(p.x);
  // contiguous run of outer samples above the hairline (the top of the head)
  let start = 0;
  for (let i = 0; i < n; i++) if (inHair(outer[i]) && !inHair(outer[(i - 1 + n) % n])) start = i;
  const cap: V[] = [];
  for (let k = 0; k < n; k++) {
    const p = outer[(start + k) % n];
    if (!inHair(p)) break;
    cap.push(p);
  }
  // back along the hairline (right to left) from where the cap left the outline to where it met it
  const xa = cap.length ? cap[cap.length - 1].x : 0;
  const xb = cap.length ? cap[0].x : 0;
  const line: V[] = [];
  const steps = 44;
  for (let k = 0; k <= steps; k++) {
    const x = lerp(xa, xb, k / steps);
    let y = hairY(x);
    if (st === 'curly' && x > tF + 6 && x < tN - 4) y += 5 * Math.abs(Math.sin(((x - tF) / 15) * Math.PI));
    line.push({x, y});
  }
  const hairD = cap.length > 3 ? polyD([...cap, ...line]) : '';
  const hairHi = lit(look.hair, 0.35);

  // bun at the back of the crown (drawn behind the head)
  const bunX = az(180, 70);
  const bunY = -124 + 22 * t;
  const bun = st === 'bun' ? {c: {x: bunX * 0.55 + 22 * t, y: bunY}, r: 31} : null;

  // ---------------------------------------------------------------- eyes
  const eyeY = -8;
  const Lid = clamp(e.lid - 0.2 * e.wide + blink * (1 - e.lid));
  const eye = (k: 'n' | 'f', a: number) => {
    const fc = facing(a);
    // the far eye goes behind the nose bridge quickly (a slow fade reads as a ghost)
    const vis = a < 0 ? clamp((fc - 0.42) / 0.06) : clamp((fc - 0.18) / 0.2);
    if (vis <= 0) return null;
    const ex = az(a, a < 0 ? 70 : 66);
    const kx = 0.32 + 0.68 * clamp(fc);
    const rx = 21 * kx;
    const ry = 13.5 * (1 + 0.24 * e.wide);
    // the outer corner is on the side away from the nose
    const o = a > 0 ? 1 : -1;
    const inner = {x: ex - o * rx, y: eyeY + 2};
    const outerC = {x: ex + o * rx, y: eyeY - 2};
    const topY = eyeY - ry * 1.45;
    const botY = eyeY + ry * 1.05;
    const lidTop = lerp(topY, botY - 2, Lid);
    const sq = clamp(e.squint);
    const lowTop = lerp(botY, eyeY + 1, sq * 0.7);
    const eyeD = `M${P(inner)} C${fmt(inner.x + o * rx * 0.4)},${fmt(topY + 1)} ${fmt(outerC.x - o * rx * 0.55)},${fmt(topY)} ${P(outerC)} C${fmt(outerC.x - o * rx * 0.35)},${fmt(botY)} ${fmt(inner.x + o * rx * 0.3)},${fmt(botY + 1)} ${P(inner)} Z`;
    const closed = Lid > 0.92;
    const lidD = `M${fmt(inner.x - o * 2)},${fmt(inner.y)} C${fmt(inner.x + o * rx * 0.4)},${fmt(lerp(topY + 1, inner.y + 3, Lid))} ${fmt(outerC.x - o * rx * 0.55)},${fmt(lerp(topY, outerC.y + 4, Lid))} ${fmt(outerC.x + o * 3)},${fmt(outerC.y)}`;
    if (closed)
      return (
        <g key={k} opacity={vis}>
          <InkLine d={`M${fmt(inner.x)},${fmt(inner.y + 2)} Q${fmt(ex)},${fmt(eyeY + 8)} ${fmt(outerC.x + o * 2)},${fmt(outerC.y + 1)}`} w={fw * 1.2} />
          {look.fem && <InkLine d={`M${fmt(outerC.x)},${fmt(outerC.y + 1)} l${fmt(o * 7)},${fmt(-3)}`} w={fw * 0.9} />}
        </g>
      );
    const ri = 11.6 * (1 - 0.06 * e.wide);
    // the iris turns with the eyeball: it moves toward the gaze and foreshortens near the eye's edge
    const gx = clamp(e.gx * 0.55 + (o > 0 ? 0 : 0) - t * 0.25, -0.75, 0.75);
    const ix = ex + gx * rx * 0.8;
    const iy = eyeY + 1 + e.gy * ry * 0.45;
    const irx = ri * (kx * 0.8 + 0.2) * (1 - 0.25 * Math.abs(gx));
    const pr = ri * 0.46 * e.pupil;
    return (
      <g key={k} opacity={vis}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, eyeY - 6, ry * 1.8, 0.3, [
            [0, '#FFFFFF'],
            [0.6, '#F3F6F8'],
            [1, '#C8D3DC'],
          ])}
          <radialGradient id={`${id}-ir${k}`} gradientUnits="userSpaceOnUse" cx={fmt(ix)} cy={fmt(iy + 2)} r={fmt(ri)}>
            <stop offset="0" stopColor={lit(look.iris, 0.25)} />
            <stop offset="0.55" stopColor={look.iris} />
            <stop offset="1" stopColor={shade(look.iris, 0.45)} />
          </radialGradient>
        </defs>
        <path d={eyeD} fill={`url(#${id}-ew${k})`} />
        <path d={eyeD} fill="none" stroke={INK} strokeWidth={fw * 0.4} opacity={pass === 'ink' ? 0 : 0.55} />
        <g clipPath={`url(#${id}-ec${k})`}>
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(irx)} ry={fmt(ri)} fill={`url(#${id}-ir${k})`} />
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(irx)} ry={fmt(ri)} fill="none" stroke={shade(look.iris, 0.6)} strokeWidth={1.4} />
          <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(pr * (irx / ri))} ry={fmt(pr)} fill="#14161C" />
          <circle cx={fmt(ix + irx * 0.35)} cy={fmt(iy - ri * 0.38)} r={fmt(ri * 0.26)} fill="#FFFFFF" />
          <circle cx={fmt(ix - irx * 0.3)} cy={fmt(iy + ri * 0.36)} r={fmt(ri * 0.11)} fill="#FFFFFF" opacity={0.8} />
          {/* the upper lid's shadow on the eyeball, then the lids themselves */}
          <path d={`M${fmt(ex - rx - 6)},${fmt(lidTop + 6)} L${fmt(ex + rx + 6)},${fmt(lidTop + 6)} L${fmt(ex + rx + 6)},${fmt(lidTop - 4)} L${fmt(ex - rx - 6)},${fmt(lidTop - 4)} Z`} fill="#3A4B5C" opacity={0.16} />
          <path d={`M${fmt(ex - rx - 6)},${fmt(topY - 20)} L${fmt(ex + rx + 6)},${fmt(topY - 20)} L${fmt(ex + rx + 6)},${fmt(lidTop)} L${fmt(ex - rx - 6)},${fmt(lidTop)} Z`} fill={mix(skin, shade(skin, 0.18), 0.6)} />
          <path d={`M${fmt(ex - rx - 6)},${fmt(botY + 20)} L${fmt(ex + rx + 6)},${fmt(botY + 20)} L${fmt(ex + rx + 6)},${fmt(lowTop)} L${fmt(ex - rx - 6)},${fmt(lowTop)} Z`} fill={lit(skin, 0.04)} />
        </g>
        {/* lash line: heavier toward the outer corner; the lid fold above it */}
        <path
          d={`${lidD} L${fmt(outerC.x + o * (look.fem ? 11 : 5))},${fmt(outerC.y - (look.fem ? 7 : 3))} C${fmt(outerC.x - o * rx * 0.5)},${fmt(lerp(topY, outerC.y + 4, Lid) - (look.fem ? 7 : 5.5))} ${fmt(inner.x + o * rx * 0.4)},${fmt(lerp(topY + 1, inner.y + 3, Lid) - 3)} ${fmt(inner.x - o * 2)},${fmt(inner.y)} Z`}
          fill={INK}
          opacity={pass === 'ink' ? 0 : 1}
        />
        {Lid < 0.6 && <InkLine d={`M${fmt(inner.x + o * rx * 0.25)},${fmt(topY - 7 + Lid * 6)} Q${fmt(ex)},${fmt(topY - 12 + Lid * 8)} ${fmt(outerC.x - o * rx * 0.05)},${fmt(topY - 4 + Lid * 6)}`} w={fw * 0.45} opacity={0.45} />}
        <InkLine d={`M${fmt(ex + o * rx * 0.1)},${fmt(lowTop + 1.5)} Q${fmt(ex + o * rx * 0.55)},${fmt(lowTop + 1.5)} ${fmt(outerC.x - o * rx * 0.05)},${fmt(lowTop - 2)}`} w={fw * 0.4} opacity={0.3 + 0.4 * sqLine(e.squint)} />
      </g>
    );
  };

  // ---------------------------------------------------------------- brows
  const brow = (k: 'n' | 'f', a: number) => {
    const fc = facing(a);
    const vis = a < 0 ? clamp((fc - 0.36) / 0.08) : clamp((fc - 0.12) / 0.2);
    if (vis <= 0) return null;
    const ex = az(a, 68);
    const kx = 0.3 + 0.7 * clamp(fc);
    const o = a > 0 ? 1 : -1;
    const cockUp = (k === 'n' ? 1 : -1) * e.cock;
    const base = -40 - 10 * e.browUp - 6 * Math.max(0, cockUp) + 9 * e.browDown + 3 * Math.max(0, -cockUp);
    const inY = base - 9 * e.browIn + 7 * e.browDown;
    const outY = base + 2 + 3 * e.browIn - 2 * e.browDown;
    const iX = ex - o * 20 * kx;
    const oX = ex + o * 24 * kx;
    const midY = Math.min(inY, outY) - 6 + 2 * e.browDown;
    const th = look.fem ? 5 : 8;
    const d = `M${fmt(iX)},${fmt(inY + th * 0.6)} Q${fmt(ex)},${fmt(midY - th * 0.2)} ${fmt(oX)},${fmt(outY)} Q${fmt(ex)},${fmt(midY + th)} ${fmt(iX)},${fmt(inY + th * 1.4)} Z`;
    return <path key={`b${k}`} d={d} fill={look.brow} opacity={(pass === 'ink' ? 0 : 1) * vis} />;
  };

  // ---------------------------------------------------------------- nose, mouth, ears
  const noseX = az(0, 84);
  const nosePeek = 1 - sstep(0.62, 0.86, t); // the interior nose line gives way to the silhouette
  const tipX = noseX - 12 * Math.sin(yaw * RAD) - 3;
  const mouthC = {x: az(0, 82) + 10 * t, y: 52 + 3 * t};
  const mwid = 27 * e.mw * (0.3 + 0.7 * clamp(facing(0))) * (1 - 0.25 * e.open);
  const mo = e.open;
  const sm = e.smile;
  const mL = {x: mouthC.x - mwid, y: mouthC.y - sm * 7 + e.skew * 4};
  const mR = {x: mouthC.x + mwid, y: mouthC.y - sm * 7 - e.skew * 4};
  const upY = mouthC.y - 2 - mo * 4 - Math.max(0, sm) * 2;
  const loY = mouthC.y + 3 + mo * 30 + Math.max(0, sm) * 9;
  const mouthD = `M${P(mL)} Q${fmt(mouthC.x)},${fmt(upY - (mL.y - mouthC.y) * 0.5)} ${P(mR)} Q${fmt(mouthC.x)},${fmt(loY)} ${P(mL)} Z`;
  const earA = 96;
  const earK = 0.32 + 0.68 * clamp(Math.abs(Math.sin((earA - yaw) * RAD)) < 0.999 ? 1 - clamp(facing(earA) * 0 + Math.abs(Math.cos((earA - yaw) * RAD)) * 0.0 + (1 - Math.abs(Math.sin((earA - yaw) * RAD))) * 1) : 0);
  const nearEarX = az(earA, 88);
  const farEarX = az(-earA, 88);
  const farEarVis = clamp((0.25 - t) / 0.12);
  // an ear seen from the side (helix toward the back of the head, +x), squeezed by k when seen edge-on
  const earPath = (x: number, k: number, m: 1 | -1) => {
    const X = (dx: number) => fmt(x + dx * k * m);
    return `M${X(-6)},-26 C${X(8)},-36 ${X(26)},-26 ${X(25)},-6 C${X(24)},10 ${X(16)},22 ${X(8)},30 C${X(2)},37 ${X(-6)},38 ${X(-9)},30 C${X(-11)},22 ${X(-10)},-4 ${X(-6)},-26 Z`;
  };
  const earInner = (x: number, k: number, m: 1 | -1) => {
    const X = (dx: number) => fmt(x + dx * k * m);
    return `M${X(-1)},-20 C${X(10)},-25 ${X(18)},-16 ${X(17)},-3 C${X(16)},8 ${X(10)},16 ${X(4)},20`;
  };
  const earFront = t >= 0.3;

  // stubble: a soft darker tone on the jaw
  const stubbleD = `M${fmt(az(-60, 84))},40 Q${fmt(az(0, 92))},120 ${fmt(az(60, 84))},40 Q${fmt(az(0, 70))},86 ${fmt(az(-60, 84))},40 Z`;

  const body = (
    <>
      <defs>
        {rg(`${id}-sk`, -14 * (1 - t) - 10 * t, -18, 150, 0.5, [
          [0, lit(skin, 0.3)],
          [0.42, lit(skin, 0.07)],
          [0.75, skin],
          [0.93, shade(skin, 0.2)],
          [1, shade(skin, 0.28)],
        ])}
        {rg(`${id}-hr`, ctr.x - 10, -90, 140, 0.55, [
          [0, lit(look.hair, 0.3)],
          [0.5, look.hair],
          [1, shade(look.hair, 0.35)],
        ])}
        {rg(`${id}-ear`, nearEarX, 0, 40, 0.5, [
          [0, lit(skin, 0.2)],
          [0.7, skin],
          [1, shade(skin, 0.25)],
        ])}
        <radialGradient id={`${id}-ck`}>
          <stop offset="0" stopColor={look.cheek} stopOpacity={0.6} />
          <stop offset="0.6" stopColor={look.cheek} stopOpacity={0.25} />
          <stop offset="1" stopColor={look.cheek} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-mo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E1520" />
          <stop offset="1" stopColor="#7A2A34" />
        </linearGradient>
        <clipPath id={`${id}-hc`}>
          <path d={headD} />
        </clipPath>
        <clipPath id={`${id}-mc`}>
          <path d={mouthD} />
        </clipPath>
      </defs>

      {bun && (
        <Inked w={inkW}>
          <InkPath d={`M${fmt(bun.c.x - bun.r)},${fmt(bun.c.y)} a${bun.r},${bun.r * 0.92} 0 1 0 ${bun.r * 2},0 a${bun.r},${bun.r * 0.92} 0 1 0 ${-bun.r * 2},0 Z`} fill={`url(#${id}-hr)`} />
        </Inked>
      )}
      {farEarVis > 0 && (
        <g opacity={farEarVis}>
          <Inked w={inkW * 0.9}>
            <InkPath d={earPath(farEarX, 0.4, -1)} fill={`url(#${id}-ear)`} />
          </Inked>
        </g>
      )}
      {!earFront && (
        <Inked w={inkW * 0.9}>
          <InkPath d={earPath(nearEarX, 0.32 + 0.68 * sstep(0, 0.3, t) * 0.4, 1)} fill={`url(#${id}-ear)`} />
        </Inked>
      )}
      <Inked w={inkW}>
        <InkPath d={headD} fill={`url(#${id}-sk)`} />
      </Inked>
      {pass !== 'ink' && (
        <g clipPath={`url(#${id}-hc)`}>
          {/* jaw and under-chin shade, cool bounce on the shadow side, eye sockets: the face reads as a form */}
          <ellipse cx={fmt(lerp(0, -30, t))} cy={128} rx={110} ry={46} fill={shade(skin, 0.45)} opacity={0.22} />
          <path d={`M${fmt(lerp(88, 103, t))},-30 C${fmt(lerp(88, 103, t))},40 ${fmt(lerp(55, 40, t))},104 0,110 C${fmt(lerp(50, 30, t))},94 ${fmt(lerp(80, 95, t))},40 ${fmt(lerp(80, 96, t))},-30 Z`} fill="#BFD8EC" opacity={0.25} />
          <ellipse cx={fmt(az(29, 66))} cy={-22} rx={28} ry={13} fill={shade(skin, 0.3)} opacity={0.1 * clamp(facing(29))} />
          <ellipse cx={fmt(az(-29, 66))} cy={-22} rx={26} ry={13} fill={shade(skin, 0.3)} opacity={0.1 * clamp(facing(-29))} />
          {/* the nose's shadow on the far cheek (3/4) */}
          <ellipse cx={fmt(noseX - 10 * Math.sin(yaw * RAD))} cy={18} rx={fmt(8 + 6 * t)} ry={16} fill={shade(skin, 0.35)} opacity={0.2 * nosePeek * clamp(t * 3)} />
          {look.stubble && <path d={stubbleD} fill={shade(look.hair, 0.2)} opacity={0.09} />}
          <ellipse cx={fmt(az(42, 74))} cy={28} rx={fmt(20 * (0.4 + 0.6 * clamp(facing(42))))} ry={14} fill={`url(#${id}-ck)`} opacity={(0.5 + 0.5 * e.flush) * clamp(facing(42) + 0.2)} />
          <ellipse cx={fmt(az(-42, 74))} cy={28} rx={fmt(18 * (0.4 + 0.6 * clamp(facing(-42))))} ry={14} fill={`url(#${id}-ck)`} opacity={(0.5 + 0.5 * e.flush) * clamp(facing(-42))} />
        </g>
      )}
      {!earFront && pass !== 'ink' && <path d={earInner(nearEarX, 0.32 + 0.12 * sstep(0, 0.3, t), 1)} fill="none" stroke={shade(skin, 0.38)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />}

      {/* hair */}
      {hairD && (
        <Inked w={inkW}>
          <InkPath d={hairD} fill={`url(#${id}-hr)`} />
        </Inked>
      )}
      {hairD && pass !== 'ink' && (
        <g>
          <defs>
            <clipPath id={`${id}-hcl`}>
              <path d={hairD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-hcl)`}>
            {st === 'curly' &&
              (() => {
                // tight C-curls over the whole cap: a dark inner arc and a lit rim on each, brighter toward the light
                const els: React.ReactNode[] = [];
                let k = 0;
                for (let row = 0; row < 9; row++)
                  for (let col = 0; col < 12; col++) {
                    const x = -132 + col * 23 + (row % 2) * 11.5 + (hash(k, 7) - 0.5) * 8;
                    const y = -150 + row * 21 + (hash(k, 9) - 0.5) * 8;
                    k++;
                    const lightness = clamp(0.5 - (x * Lc.x + y * Lc.y) / -260);
                    const r = 7.5 + 2 * hash(k, 3);
                    const a0 = hash(k, 5) * 360;
                    const p0 = {x: x + r * Math.cos(a0 * RAD), y: y + r * Math.sin(a0 * RAD)};
                    const p1 = {x: x + r * Math.cos((a0 + 250) * RAD), y: y + r * Math.sin((a0 + 250) * RAD)};
                    els.push(<path key={`c${k}`} d={`M${P(p0)} A${fmt(r)},${fmt(r)} 0 1 1 ${P(p1)}`} fill="none" stroke={shade(look.hair, 0.5)} strokeWidth={3 * lw} strokeLinecap="round" opacity={0.55} />);
                    els.push(<path key={`h${k}`} d={`M${P(p0)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(x + r * Math.cos((a0 + 110) * RAD))},${fmt(y + r * Math.sin((a0 + 110) * RAD))}`} fill="none" stroke={hairHi} strokeWidth={2.4 * lw} strokeLinecap="round" opacity={0.25 + 0.45 * lightness} />);
                  }
                return els;
              })()}
            {st === 'bun' &&
              // sleek hair drawn back toward the bun: fine strands from the hairline to the crown's back
              Array.from({length: 9}, (_, i) => {
                const x0 = lerp(tF + 4, tN - 4, i / 8);
                const y0 = hairY(x0) - 2;
                const end = {x: bunX + 10 * t, y: bunY + 6};
                const m = {x: lerp(x0, end.x, 0.5) - 6, y: Math.min(y0, end.y) - 34 - 8 * Math.sin((i / 8) * Math.PI)};
                return <path key={i} d={`M${fmt(x0)},${fmt(y0)} Q${P(m)} ${P(end)}`} fill="none" stroke={i % 3 === 0 ? hairHi : shade(look.hair, 0.4)} strokeWidth={i % 3 === 0 ? 2.6 : 1.8} strokeLinecap="round" opacity={i % 3 === 0 ? 0.5 : 0.5} />;
              })}
            {st === 'quiff' && (
              <>
                {/* short faded sides: skin shows through below the top */}
                <path d={`M-200,${fmt(-86 + 6 * t)} Q0,${fmt(-72 + 6 * t)} 200,${fmt(-86 + 6 * t)} L200,200 L-200,200 Z`} fill={mix(look.hair, skin, 0.42)} opacity={0.82} />
                <path d={`M-200,${fmt(-86 + 6 * t)} Q0,${fmt(-72 + 6 * t)} 200,${fmt(-86 + 6 * t)}`} fill="none" stroke={shade(look.hair, 0.3)} strokeWidth={3} opacity={0.35} />
                {/* the swept top: strands from the front lift back over the crown */}
                {Array.from({length: 7}, (_, i) => {
                  const f0 = {x: lerp(-58, -96, t) + i * 6, y: -96 - i * 4};
                  const m = {x: lerp(-10, -40, t) + i * 10, y: -150 + i * 5};
                  const e0 = {x: lerp(70, 60, t) + i * 4, y: -108 + i * 4};
                  return <path key={i} d={`M${P(f0)} Q${P(m)} ${P(e0)}`} fill="none" stroke={i % 2 ? shade(look.hair, 0.35) : hairHi} strokeWidth={i % 2 ? 2 : 3} strokeLinecap="round" opacity={0.55} />;
                })}
              </>
            )}
            {/* glossy streaks on the lit side (the Death Clock hair finish) */}
            <ellipse cx={fmt(ctr.x - 46)} cy={-106} rx={34} ry={7} transform={`rotate(-28 ${fmt(ctr.x - 46)} -106)`} fill="#FFFFFF" opacity={0.32} />
            <ellipse cx={fmt(ctr.x - 8)} cy={-124} rx={20} ry={4.5} transform={`rotate(-8 ${fmt(ctr.x - 8)} -124)`} fill="#FFFFFF" opacity={0.26} />
          </g>
          {/* the hair's soft shadow on the forehead */}
          <g clipPath={`url(#${id}-hc)`}>
            <path d={polyD(line.map((p) => ({x: p.x, y: p.y + 7})), false)} fill="none" stroke={shade(skin, 0.5)} strokeWidth={9} opacity={0.16} />
          </g>
        </g>
      )}
      {earFront && (
        <g>
          <Inked w={inkW * 0.85}>
            <InkPath d={earPath(nearEarX, 0.45 + 0.55 * sstep(0.3, 0.9, t), 1)} fill={`url(#${id}-ear)`} />
          </Inked>
          {pass !== 'ink' && (
            <g>
              <path d={earInner(nearEarX, 0.45 + 0.55 * sstep(0.3, 0.9, t), 1)} fill="none" stroke={shade(skin, 0.38)} strokeWidth={3.2} strokeLinecap="round" opacity={0.8} />
              <ellipse cx={fmt(nearEarX + 4 * (0.45 + 0.55 * t))} cy={6} rx={fmt(5 + 3 * t)} ry={9} fill={shade(skin, 0.38)} opacity={0.5} />
            </g>
          )}
        </g>
      )}
      {earDetail > 0.01 && earFront && pass !== 'ink' && (
        <EarDetail id={`${id}-ed`} x={nearEarX} k={0.45 + 0.55 * sstep(0.3, 0.9, t)} skin={skin} amt={earDetail} fw={fw} />
      )}
      {look.earrings && pass !== 'ink' && (
        <g>
          <circle cx={fmt(nearEarX + 1)} cy={44} r={8} fill="none" stroke="#E8B64A" strokeWidth={3.2} />
          <circle cx={fmt(nearEarX - 2)} cy={38} r={1.8} fill="#FFF3C4" />
        </g>
      )}
      {st === 'beanie' &&
        (() => {
          // a knit hat: the crown's outline lifted and rounded, a ribbed cuff folded up above the brows
          const brim = (x: number) => -60 + 6 * Math.cos(((x - az(0, 60)) / 120) * Math.PI);
          const top = pts.map((p) => {
            const d = {x: p.x - ctr.x, y: p.y - ctr.y};
            const l = Math.hypot(d.x, d.y) || 1;
            const up = clamp(-d.y / l);
            const v = 10 + 16 * up * up;
            return {x: p.x + (d.x / l) * v, y: p.y + (d.y / l) * v};
          });
          const run = top.filter((p) => p.y < brim(p.x));
          if (run.length < 4) return null;
          // order the run along the outline starting from its left end
          let i0 = 0;
          for (let i = 0; i < n; i++) if (top[i].y < brim(top[i].x) && !(top[(i - 1 + n) % n].y < brim(top[(i - 1 + n) % n].x))) i0 = i;
          const arc: V[] = [];
          for (let k = 0; k < n; k++) {
            const p = top[(i0 + k) % n];
            if (!(p.y < brim(p.x))) break;
            arc.push(p);
          }
          const xa2 = arc[arc.length - 1].x, xb2 = arc[0].x;
          const brimPts = Array.from({length: 21}, (_, k) => {
            const x = lerp(xa2, xb2, k / 20);
            return {x, y: brim(x) + 4};
          });
          const hatD = polyD([...arc, ...brimPts]);
          const cuffTop = (x: number) => brim(x) - 22;
          const cuffD = polyD([...brimPts, ...brimPts.slice().reverse().map((q) => ({x: q.x, y: cuffTop(q.x)}))]);
          const hat = look.hat ?? '#E3B341';
          return (
            <g>
              <Inked w={inkW}>
                <InkPath d={hatD} fill={`url(#${id}-hat)`} />
              </Inked>
              <defs>
                {rg(`${id}-hat`, ctr.x - 10, -100, 150, 0.5, [
                  [0, lit(hat, 0.3)],
                  [0.5, hat],
                  [1, shade(hat, 0.35)],
                ])}
                <clipPath id={`${id}-hatc`}>
                  <path d={hatD} />
                </clipPath>
              </defs>
              {pass !== 'ink' && (
                <g clipPath={`url(#${id}-hatc)`}>
                  {/* knit ribs on the crown, following the head's turn */}
                  {Array.from({length: 15}, (_, k) => {
                    const a = -84 + k * 12;
                    const fc = facing(a);
                    if (fc < 0.05) return null;
                    const x = az(a, 96);
                    return <path key={k} d={`M${fmt(x)},${fmt(cuffTop(x))} Q${fmt(x * 0.7 + ctr.x * 0.3)},-120 ${fmt(ctr.x + x * 0.1)},-150`} fill="none" stroke={shade(hat, 0.3)} strokeWidth={2.2} opacity={0.45 * fc} />;
                  })}
                  <path d={cuffD} fill={shade(hat, 0.08)} />
                  {Array.from({length: 24}, (_, k) => {
                    const a = -90 + k * 7.8;
                    const fc = facing(a);
                    if (fc < 0.05) return null;
                    const x = az(a, 96);
                    return <line key={`r${k}`} x1={fmt(x)} y1={fmt(cuffTop(x) + 2)} x2={fmt(x)} y2={fmt(brim(x) + 2)} stroke={shade(hat, 0.35)} strokeWidth={2} opacity={0.5 * fc} />;
                  })}
                  <path d={polyD(brimPts.map((q) => ({x: q.x, y: cuffTop(q.x)})), false)} fill="none" stroke={INK} strokeWidth={fw * 0.55} opacity={0.6} />
                  <ellipse cx={fmt(ctr.x - 40)} cy={-118} rx={30} ry={8} transform={`rotate(-22 ${fmt(ctr.x - 40)} -118)`} fill="#FFFFFF" opacity={0.28} />
                </g>
              )}
            </g>
          );
        })()}
      {bun && pass !== 'ink' && <ellipse cx={fmt(bun.c.x - 8)} cy={fmt(bun.c.y - 10)} rx={10} ry={5} fill="#FFFFFF" opacity={0.25} />}

      {/* the face */}
      {eye('f', -29)}
      {eye('n', 29)}
      {brow('f', -29)}
      {brow('n', 29)}
      {nosePeek > 0.01 && (
        <g opacity={nosePeek}>
          <InkLine d={`M${fmt(noseX + 3 + 4 * t)},4 Q${fmt(tipX - 2)},${18} ${fmt(tipX + 1)},24 Q${fmt(tipX + 6)},31 ${fmt(noseX + 9)},29`} w={fw * 0.75} opacity={0.75} />
          {pass !== 'ink' && <ellipse cx={fmt(tipX + 5)} cy={17} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.6} />}
        </g>
      )}
      {t > 0.62 && pass !== 'ink' && <path d={`M${fmt(-98)},${31} q6,-4 10,1`} fill="none" stroke={shade(skin, 0.5)} strokeWidth={2.4} strokeLinecap="round" opacity={sstep(0.62, 0.9, t) * 0.8} />}
      {mo < 0.06 ? (
        <g>
          <InkLine d={Q(mL, {x: mouthC.x, y: mouthC.y + sm * 9 + 1}, mR)} w={fw * 0.95} />
          {pass !== 'ink' && look.fem && (
            <path d={`M${P(mL)} Q${fmt(mouthC.x - mwid * 0.4)},${fmt(mouthC.y - 6)} ${fmt(mouthC.x)},${fmt(mouthC.y - 3)} Q${fmt(mouthC.x + mwid * 0.4)},${fmt(mouthC.y - 6)} ${P(mR)} Q${fmt(mouthC.x)},${fmt(mouthC.y + 13)} ${P(mL)} Z`} fill={look.lip} opacity={0.75} />
          )}
          {pass !== 'ink' && <path d={`M${fmt(mouthC.x - mwid * 0.55)},${fmt(mouthC.y + 9 + Math.max(0, sm) * 4)} Q${fmt(mouthC.x)},${fmt(mouthC.y + 14 + Math.max(0, sm) * 4)} ${fmt(mouthC.x + mwid * 0.55)},${fmt(mouthC.y + 9 + Math.max(0, sm) * 4)}`} fill="none" stroke={mix(look.lip, skin, 0.3)} strokeWidth={look.fem ? 5 : 3.5} strokeLinecap="round" opacity={0.55} />}
        </g>
      ) : (
        <g>
          <Inked w={fw * 0.8}>
            <InkPath d={mouthD} fill={`url(#${id}-mo)`} />
          </Inked>
          {pass !== 'ink' && (
            <g clipPath={`url(#${id}-mc)`}>
              {e.teeth > 0.01 && <rect x={fmt(mouthC.x - mwid)} y={fmt(upY - 10)} width={fmt(mwid * 2)} height={fmt(10 + 7 + mo * 6)} rx={3} fill="#FBFAF6" opacity={e.teeth} />}
              <ellipse cx={fmt(mouthC.x + 2)} cy={fmt(loY + 1)} rx={fmt(mwid * 0.62)} ry={fmt(5 + mo * 9)} fill="#D9727F" opacity={0.85} />
            </g>
          )}
          {pass !== 'ink' && <path d={`M${fmt(mouthC.x - mwid * 0.45)},${fmt(loY + 3)} Q${fmt(mouthC.x)},${fmt(loY + 6)} ${fmt(mouthC.x + mwid * 0.45)},${fmt(loY + 3)}`} fill="none" stroke={mix(look.lip, skin, 0.4)} strokeWidth={3.5} strokeLinecap="round" opacity={0.3} />}
        </g>
      )}
      {/* glossy highlights: forehead, cheekbone, nose tip */}
      {pass !== 'ink' && (
        <g clipPath={`url(#${id}-hc)`}>
          <ellipse cx={fmt(az(-20, 60))} cy={-58} rx={22} ry={9} transform={`rotate(-20 ${fmt(az(-20, 60))} -58)`} fill="#FFFFFF" opacity={0.3} />
          <ellipse cx={fmt(az(44, 78))} cy={20} rx={7} ry={3.5} fill="#FFFFFF" opacity={0.28 * clamp(facing(44))} />
        </g>
      )}
      {children}
    </>
  );
  void earK;
  return <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s * fx)} ${fmt(s)})`}>{body}</g>;
};

/** The near ear in anatomical detail, in the head's own units (it sits exactly on the simple ear: same outline). Profile
 *  orientation: the face side is -x, the helix curls back toward +x. The canal opening is drawn dark and empty. */
export const EarDetail: React.FC<{id: string; x: number; k: number; skin: string; amt: number; fw: number}> = ({id, x, k, skin, amt, fw}) => {
  const X = (dx: number) => fmt(x + dx * k);
  const pt = (dx: number, dy: number) => `${X(dx)},${fmt(dy)}`;
  const outer = `M${pt(-6, -26)} C${pt(8, -36)} ${pt(26, -26)} ${pt(25, -6)} C${pt(24, 10)} ${pt(16, 22)} ${pt(8, 30)} C${pt(2, 37)} ${pt(-6, 38)} ${pt(-9, 30)} C${pt(-11, 22)} ${pt(-10, -4)} ${pt(-6, -26)} Z`;
  const deep = shade(skin, 0.5);
  const mid = shade(skin, 0.25);
  return (
    <g opacity={amt}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={outer} />
        </clipPath>
        <radialGradient id={`${id}-cn`} gradientUnits="userSpaceOnUse" cx={X(2)} cy={4} r={fmt(13 * Math.max(k, 0.6))}>
          <stop offset="0" stopColor={shade(skin, 0.55)} />
          <stop offset="0.7" stopColor={shade(skin, 0.32)} />
          <stop offset="1" stopColor={shade(skin, 0.12)} />
        </radialGradient>
        <radialGradient id={`${id}-cv`} gradientUnits="userSpaceOnUse" cx={X(-2.5)} cy={6} r={fmt(5 * Math.max(k, 0.6))}>
          <stop offset="0" stopColor="#1B0C0C" />
          <stop offset="0.6" stopColor="#3A1C1A" />
          <stop offset="1" stopColor={shade(skin, 0.5)} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {/* the concha: the bowl in front of the antihelix, deepening toward the canal */}
        <path d={`M${pt(-5, -8)} C${pt(2, -14)} ${pt(12, -8)} ${pt(12, 4)} C${pt(12, 14)} ${pt(6, 20)} ${pt(0, 19)} C${pt(-6, 18)} ${pt(-8, 8)} ${pt(-5, -8)} Z`} fill={`url(#${id}-cn)`} />
        {/* the helix: the rim's inner fold, shaded under it and lit along its top */}
        <path d={`M${pt(-2, -23)} C${pt(8, -31)} ${pt(21, -22)} ${pt(20, -6)} C${pt(19, 8)} ${pt(13, 18)} ${pt(7, 24)}`} fill="none" stroke={mid} strokeWidth={fmt(3.2 * k)} strokeLinecap="round" opacity={0.9} />
        <path d={`M${pt(0, -27)} C${pt(10, -33)} ${pt(22, -25)} ${pt(22.5, -10)}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(1.6 * k)} strokeLinecap="round" opacity={0.45} />
        {/* the antihelix: a Y-shaped ridge (lit crest, shadow on its far side) */}
        <path d={`M${pt(5, 21)} C${pt(13, 10)} ${pt(15, -2)} ${pt(10, -14)}`} fill="none" stroke={lit(skin, 0.18)} strokeWidth={fmt(3.6 * k)} strokeLinecap="round" />
        <path d={`M${pt(6.2, 21.5)} C${pt(14.3, 10.5)} ${pt(16.3, -1.5)} ${pt(11.3, -13.5)}`} fill="none" stroke={mid} strokeWidth={fmt(1.4 * k)} strokeLinecap="round" opacity={0.8} />
        <path d={`M${pt(10, -14)} C${pt(7, -19)} ${pt(3, -20)} ${pt(0, -19)}`} fill="none" stroke={lit(skin, 0.15)} strokeWidth={fmt(2.8 * k)} strokeLinecap="round" />
        <path d={`M${pt(10, -14)} C${pt(13, -19)} ${pt(15, -21)} ${pt(17, -20)}`} fill="none" stroke={lit(skin, 0.15)} strokeWidth={fmt(2.4 * k)} strokeLinecap="round" />
        {/* the canal opening: dark and empty */}
        <ellipse cx={X(-2.5)} cy={6} rx={fmt(3.4 * k)} ry={4.6} fill={`url(#${id}-cv)`} />
        {/* the tragus over the front of the canal, and the antitragus */}
        <path d={`M${pt(-10, -1)} C${pt(-4, 0)} ${pt(-3, 8)} ${pt(-6, 12)} C${pt(-8, 13)} ${pt(-10, 12)} ${pt(-10, 10)} Z`} fill={lit(skin, 0.06)} />
        <path d={`M${pt(-10, -1)} C${pt(-4, 0)} ${pt(-3, 8)} ${pt(-6, 12)}`} fill="none" stroke={deep} strokeWidth={fmt(1.1 * k)} opacity={0.7} />
        <path d={`M${pt(1, 17)} C${pt(4, 14)} ${pt(8, 15)} ${pt(8, 19)}`} fill="none" stroke={deep} strokeWidth={fmt(1.1 * k)} opacity={0.6} />
        {/* the lobe, soft and lit */}
        <ellipse cx={X(1)} cy={31} rx={fmt(5 * k)} ry={3.4} fill="#FFFFFF" opacity={0.18} />
      </g>
      <path d={outer} fill="none" stroke={INK} strokeWidth={fw * 0.6} opacity={0.0} />
    </g>
  );
};
