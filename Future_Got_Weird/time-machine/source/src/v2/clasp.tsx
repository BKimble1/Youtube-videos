// V2 clasp: the friend's two hands around the astronaut's gloved RIGHT hand, the hero of the opening and the reunion.
// Weird Crew finish: flat fills, one ink outline (OUT) around every part, one cel-shadow shape per part (key light
// upper-left), crew palette. No text.
//
// Construction (character-local units, clasp centre at 0,0). It reads as a two-handed handshake seen from the back of
// the astronaut's hand:
//   - the astronaut's glove enters from the LEFT (white suit sleeve stub, saffron cuff ring, GLOVE colour), back of the
//     glove to camera; its thumb and fingertips are inside the clasp, so only one thumb is ever visible;
//   - the friend's UNDER hand (his right) shakes it from behind: its palm is hidden behind the glove, the heel and the
//     green cuff come out at the lower right and its four fingertips curl round the glove's lower edge (the palm side)
//     onto the back of the glove;
//   - the friend's OVER hand (his left) lies across the back of the glove from the upper right, back of the hand to
//     camera (knuckles, creases, veins and age spots read here), its thumb across the back of the glove.
// Ageing is continuous (no swap): skin via skinAt, the knuckles swell and the fingers and hand slim, creases over the
// knuckles and across the back of the hand draw in (dash length grows), two veins and three age spots fade in late,
// and the cuffs blend from a green shirt cuff to a ribbed green cardigan cuff over a cream shirt cuff (green stays
// dominant). The glove never changes.
import React from 'react';
import {mix} from '../core/color';
import {closed, open, P} from '../core/geo';
import {clamp, ss} from '../lib';
import {C, INK, OUT, skinAt} from '../art/crew';
import {FRIEND_CARDIGAN, GLOVE, HONEST, SUIT, SUIT_SH} from '../art/figures';

// ---------------------------------------------------------------------------------------------------------------------
// exported geometry
/** default arm directions (degrees; the direction each forearm comes FROM; screen convention 0 = right, 90 = down) */
export const CLASP_DEFAULTS = {astroAngle: 200, overAngle: -42, underAngle: 32};
/** the clasp is designed in a frame aligned with the glove (glove pointing +x), then rolled by this angle */
const DESIGN_ROT = CLASP_DEFAULTS.astroAngle - 180;
/** default length of the sleeve stubs drawn past each wrist (they overlap the end of the rig's forearms) */
export const CLASP_STUB = 34;
/** sleeve widths, matching the rigs (astronaut arm 40, friend arm 30) */
export const CLASP_ASTRO_ARM_W = 40;
export const CLASP_FRIEND_ARM_W = 30;

// design-frame placement (glove frame: +x toward the glove's fingers, y down)
const GLOVE_WRIST_X = -64; // proximal edge of the saffron cuff ring = the astronaut's wrist
const OVER = {wx: 7.05, wy: -33.9, dir: 118}; // over hand: wrist point, direction its fingers point
const UNDER = {wx: 66, wy: 38, dir: 192}; // under hand: wrist point, direction the hand points (toward the glove)
const OVER_GRIP: P = {x: -2, y: -6}; // pivots for overAngle / underAngle changes
const UNDER_GRIP: P = {x: 30, y: 26};
const ATTACH_BACK = 10; // the friend attach point sits this far up the forearm from the wrist (inside the cuff band)

const rad = (d: number) => (d * Math.PI) / 180;
const rotP = (p: P, deg: number, c: P = {x: 0, y: 0}): P => {
  const s = Math.sin(rad(deg)), k = Math.cos(rad(deg));
  const x = p.x - c.x, y = p.y - c.y;
  return {x: c.x + x * k - y * s, y: c.y + x * s + y * k};
};
const add = (a: P, b: P): P => ({x: a.x + b.x, y: a.y + b.y});
const scl = (a: P, k: number): P => ({x: a.x * k, y: a.y * k});
const dirP = (deg: number, l = 1): P => ({x: Math.cos(rad(deg)) * l, y: Math.sin(rad(deg)) * l});
const angOf = (a: P, b: P) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

/** wrist points (relative to the clasp centre, screen frame) for any arm angles; aim each arm's IK at these, with the
 *  forearm arriving along the same angle */
export const claspAttach = (astroAngle = CLASP_DEFAULTS.astroAngle, overAngle = CLASP_DEFAULTS.overAngle, underAngle = CLASP_DEFAULTS.underAngle) => {
  const dA = astroAngle - CLASP_DEFAULTS.astroAngle, dO = overAngle - CLASP_DEFAULTS.overAngle, dU = underAngle - CLASP_DEFAULTS.underAngle;
  const toScreen = (p: P) => rotP(p, DESIGN_ROT);
  const astro = toScreen(rotP({x: GLOVE_WRIST_X, y: 0}, dA));
  const ow = add({x: OVER.wx, y: OVER.wy}, dirP(OVER.dir + 180, ATTACH_BACK));
  const uw = add({x: UNDER.wx, y: UNDER.wy}, dirP(UNDER.dir + 180, ATTACH_BACK));
  const over = toScreen(rotP(ow, dO, OVER_GRIP));
  const under = toScreen(rotP(uw, dU, UNDER_GRIP));
  const r = (p: P) => ({x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10});
  return {astroWrist: r(astro), overWrist: r(over), underWrist: r(under)};
};
/** wrist points at the default angles (screen frame, relative to the clasp centre) */
export const CLASP_ATTACH = claspAttach();
/** bounding box of the drawing at default angles and stubs (units, clasp centre at 0,0) and its overall size */
export const CLASP_BOX = {x0: -128, y0: -86, x1: 106, y1: 96};
export const CLASP_SIZE = {w: CLASP_BOX.x1 - CLASP_BOX.x0, h: CLASP_BOX.y1 - CLASP_BOX.y0};

/** the friend's sleeve colours at an age (so the integrator can match the rig's forearm to the stub) */
export const claspSleeve = (age: number) => {
  const a = clamp(age);
  const cardi = ss(a, 0.32, 0.8);
  return {
    sleeve: mix(HONEST.shirt, FRIEND_CARDIGAN, cardi),
    cuff: mix(mix(HONEST.shirt, INK, 0.14), mix(FRIEND_CARDIGAN, INK, 0.16), cardi),
    shirtCuff: '#F2EBDA',
    shirtCuffLen: 7 * ss(a, 0.38, 0.85),
    rib: ss(a, 0.4, 0.85),
  };
};

// ---------------------------------------------------------------------------------------------------------------------
// drawing helpers
type Geo = {d: string; w?: number; cap?: 'round' | 'butt'};
const tubeG = (pts: P[], w: number, cap: 'round' | 'butt' = 'round'): Geo => ({d: open(pts), w, cap});
const areaG = (d: string): Geo => ({d});
const circleD = (c: P, r: number) => `M ${c.x - r} ${c.y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const rrectD = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;

const geoEl = (g: Geo, color: string, extra = 0, key?: React.Key) =>
  g.w !== undefined ? (
    <path key={key} d={g.d} fill="none" stroke={color} strokeWidth={g.w + extra} strokeLinecap={g.cap ?? 'round'} strokeLinejoin="round" />
  ) : (
    <path key={key} d={g.d} fill={color} stroke={extra > 0 ? color : 'none'} strokeWidth={extra} strokeLinejoin="round" />
  );

/** screen-space direction toward the key light (upper left) */
const LIGHT: P = {x: -0.62, y: -0.78};

/** the cel shadow of a set of geos: (shape) minus (shape moved toward the light). `rot` = accumulated rotation of the
 *  current frame relative to the screen, `amt` = shift in units. */
const Shadow: React.FC<{id: string; geos: Geo[]; color: string; rot: number; amt: number}> = ({id, geos, color, rot, amt}) => {
  const l = rotP(LIGHT, -rot);
  return (
    <g>
      <mask id={id} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
        {geos.map((g, i) => geoEl(g, 'white', 0, i))}
        <g transform={`translate(${l.x * amt} ${l.y * amt})`}>{geos.map((g, i) => geoEl(g, 'black', 0.01, i))}</g>
      </mask>
      <rect x={-400} y={-400} width={800} height={800} fill={color} mask={`url(#${id})`} />
    </g>
  );
};

/** a part: ink silhouette (OUT outside the fill), fill, cel shadow, then its details on top */
const Part: React.FC<{id: string; geos: Geo[]; fill: string; sh?: string; rot?: number; amt?: number; children?: React.ReactNode; ink?: number}> = ({id, geos, fill, sh, rot = 0, amt = 6, children, ink = OUT}) => (
  <g>
    {ink > 0 && geos.map((g, i) => geoEl(g, INK, ink * 2, i))}
    {geos.map((g, i) => geoEl(g, fill, 0, i))}
    {sh && <Shadow id={id} geos={geos} color={sh} rot={rot} amt={amt} />}
    {children}
  </g>
);

/** a line that draws in with u (dash length and weight grow), as crew.tsx's Grow */
const Grow: React.FC<{d: string; u: number; w?: number; len?: number; color?: string; op?: number}> = ({d, u, w = 2.2, len = 20, color = INK, op = 0.55}) => {
  if (u <= 0.001) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={w * (0.55 + 0.45 * u)} strokeLinecap="round" strokeDasharray={`${len * u} ${len * 3}`} opacity={op * clamp(u * 2.2)} />;
};
/** a short crease across a finger at c (finger direction fd, finger width fw) */
const creaseD = (c: P, fd: number, fw: number, s = 1, bow = 2) => {
  const n = dirP(fd + 90, fw * 0.4 * s);
  const p0 = add(c, n), p1 = add(c, scl(n, -1)), m = add(c, dirP(fd, bow));
  return `M ${p0.x} ${p0.y} Q ${m.x} ${m.y} ${p1.x} ${p1.y}`;
};

// ---------------------------------------------------------------------------------------------------------------------
// palettes
const GLOVE_SH = '#C4CFD9';
const GLOVE_LINE = 'rgba(22,42,50,0.40)';
const skinSet = (age: number) => {
  const a = clamp(age);
  const skin = skinAt(HONEST.skin, a);
  return {
    skin,
    sh: mix(skin, '#6E3F2A', 0.3),
    palm: mix(skin, '#F0CDB2', 0.34),
    nail: mix(skin, '#F6E2D2', 0.48),
    spot: mix(skin, '#5E3522', 0.42),
    vein: mix(skin, '#3E3A55', 0.3),
    lite: mix(skin, '#FFF3E6', 0.24),
  };
};

// ---------------------------------------------------------------------------------------------------------------------
// the friend's sleeve stub (local frame: the hand's wrist at the origin, the forearm along -x)
const FriendCuff: React.FC<{id: string; age: number; stub: number; rot: number}> = ({id, age, stub, rot}) => {
  const S = claspSleeve(age);
  const hw = CLASP_FRIEND_ARM_W / 2;
  const u = S.rib;
  const band = 11;
  const cx0 = -band + 1 - 4 * u; // cuff band (proximal end); the cardigan cuff sits further back, uncovering the shirt cuff
  const cream = S.shirtCuffLen;
  return (
    <g>
      <Part id={`${id}-sl`} geos={[tubeG([{x: -stub - 6, y: 0}, {x: cx0 + 2, y: 0}], CLASP_FRIEND_ARM_W, 'butt')]} fill={S.sleeve} sh={mix(S.sleeve, INK, 0.26)} rot={rot} amt={9} />
      {cream > 0.3 && (
        <Part id={`${id}-sc`} geos={[areaG(rrectD(cx0 + band - 5, -hw + 1, cream + 5, hw * 2 - 2, 3))]} fill={S.shirtCuff} sh={mix(S.shirtCuff, '#9C8F78', 0.45)} rot={rot} amt={5} />
      )}
      <Part id={`${id}-cb`} geos={[areaG(rrectD(cx0, -hw - 2, band, hw * 2 + 4, 4))]} fill={S.cuff} sh={mix(S.cuff, INK, 0.3)} rot={rot} amt={6}>
        {/* knit ribbing of the cardigan cuff fades in with age */}
        {u > 0.02 && [-11, -5.5, 0, 5.5, 11].map((y) => <line key={y} x1={cx0 + 2.2} y1={y} x2={cx0 + band - 2.2} y2={y} stroke={INK} strokeWidth={1.5} opacity={0.36 * u} strokeLinecap="round" />)}
        {/* the young shirt cuff: one seam */}
        {u < 0.98 && <line x1={cx0 + band - 3.2} y1={-hw} x2={cx0 + band - 3.2} y2={hw} stroke={INK} strokeWidth={1.5} opacity={0.3 * (1 - u)} />}
      </Part>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// OVER hand: the friend's left hand, back to camera. Local frame: wrist at 0,0, fingers along +x, thumb on the +y side.
const overGeom = (age: number, squeeze: number) => {
  const a = clamp(age);
  const k = 1 - 0.08 * a; // the hand slims
  const fw = 10.4 * (1 - 0.1 * a);
  const kn = ss(a, 0.25, 1); // knuckles get bonier
  const KX = 31;
  const fy = [12.4, 4.1, -4.2, -12.3].map((y) => y * k);
  const fan = [7, 2, -3, -8].map((d) => d * (1 - 0.35 * squeeze));
  const fl = [31, 34, 32, 24];
  const fingers = fy.map((y, i) => {
    const b = {x: KX - 1, y};
    const m = add(b, dirP(fan[i], fl[i] * 0.5));
    const t = add(m, dirP(fan[i] - 3 - 3 * squeeze, fl[i] * 0.5));
    return {b, m, t, d: fan[i], l: fl[i]};
  });
  const palm: P[] = [
    {x: -3, y: -13 * k}, {x: 12, y: -16 * k}, {x: 25, y: -17.5 * k}, {x: KX + 2, y: -14 * k},
    {x: KX + 4.5, y: -5 * k}, {x: KX + 4.5, y: 4.5 * k}, {x: KX + 2.5, y: 13 * k}, {x: 24, y: 18 * k}, {x: 10, y: 17 * k}, {x: -3, y: 13.5 * k},
  ];
  const thumbW = 12.2 * (1 - 0.08 * a);
  const thumb: P[] = [{x: 6, y: 10.5 * k}, {x: 15, y: 19 * k}, {x: 27, y: 24.5 * k}, {x: 38, y: 26.5 * k}];
  return {a, k, fw, kn, fingers, palm: closed(palm), thumbW, thumb};
};
const OverHand: React.FC<{id: string; age: number; rot: number; squeeze: number}> = ({id, age, rot, squeeze}) => {
  const g = overGeom(age, squeeze);
  const {a, k, fw, kn, fingers, palm, thumbW, thumb} = g;
  const K = skinSet(a);
  const thumbJ = thumb[2];
  const thumbTipDir = angOf(thumb[2], thumb[3]);
  return (
    <g>
      {/* one outer ink contour for the whole hand */}
      {geoEl(areaG(palm), INK, OUT * 2)}
      {fingers.map((f, i) => geoEl(areaG(circleD(f.b, fw / 2 + 2 * kn)), INK, OUT * 2, `k${i}`))}
      {geoEl(tubeG(thumb, thumbW), INK, OUT * 2)}
      {fingers.map((f, i) => geoEl(tubeG([f.b, f.m, f.t], fw), INK, OUT * 2, i))}
      {/* thumb (under the palm edge) */}
      <Part id={`${id}-th`} geos={[tubeG(thumb, thumbW), areaG(circleD(thumbJ, thumbW / 2 + 0.8 * kn))]} fill={K.skin} sh={K.sh} rot={rot} amt={4} ink={0}>
        <ellipse cx={thumb[3].x - 3.2} cy={thumb[3].y} rx={3.8 * k} ry={3 * k} fill={K.nail} stroke={INK} strokeWidth={1.2} strokeOpacity={0.32} transform={`rotate(${thumbTipDir} ${thumb[3].x - 3.2} ${thumb[3].y})`} />
        <Grow d={creaseD(thumbJ, thumbTipDir, thumbW, 1, 2)} u={0.25 + 0.75 * ss(a, 0.15, 0.85)} len={thumbW} op={0.5} />
        <Grow d={creaseD(add(thumbJ, dirP(thumbTipDir, 3)), thumbTipDir, thumbW, 0.8, 1.6)} u={ss(a, 0.4, 1)} len={thumbW * 0.8} op={0.42} />
      </Part>
      {/* back of the hand, with the knuckle row (bonier with age) */}
      <Part id={`${id}-pa`} geos={[areaG(palm), ...fingers.map((f) => areaG(circleD(f.b, fw / 2 + 2 * kn)))]} fill={K.skin} sh={K.sh} rot={rot} amt={7} ink={0} />
      {/* fingers, little finger first; a thin ink edge separates them where they touch */}
      {[3, 2, 1, 0].map((i) => {
        const f = fingers[i];
        const geos = [tubeG([add(f.b, dirP(f.d, 3)), f.m, f.t], fw), areaG(circleD(f.m, fw / 2 + 1.25 * kn))];
        const td = angOf(f.m, f.t);
        const nailC = add(f.t, dirP(td, -3.2));
        const dip = add(f.m, dirP(td, f.l * 0.27));
        return (
          <g key={i}>
            {geos.map((gg, j) => geoEl(gg, INK, 2.2 * 2, j))}
            <Part id={`${id}-f${i}`} geos={geos} fill={K.skin} sh={K.sh} rot={rot} amt={3.4} ink={0}>
              <ellipse cx={nailC.x} cy={nailC.y} rx={3.5 * k} ry={2.8 * k} fill={K.nail} stroke={INK} strokeWidth={1.2} strokeOpacity={0.32} transform={`rotate(${td} ${nailC.x} ${nailC.y})`} />
              {/* creases over the middle knuckle, then the end knuckle, draw in with age */}
              <Grow d={creaseD(add(f.m, dirP(td, -1.2)), td, fw, 1, 2.2)} u={0.22 + 0.78 * ss(a, 0.12, 0.8)} len={fw * 1.05} op={0.5} />
              <Grow d={creaseD(add(f.m, dirP(td, 1.8)), td, fw, 0.75, 1.6)} u={ss(a, 0.35, 0.95)} len={fw * 0.85} op={0.42} />
              <Grow d={creaseD(dip, td, fw, 0.6, 1.2)} u={ss(a, 0.5, 1)} len={fw * 0.7} op={0.36} />
            </Part>
          </g>
        );
      })}
      {/* back-of-hand details */}
      <g>
        {/* the knuckle row: a short arc behind each knuckle, longer, heavier and bonier with age */}
        {fingers.map((f, i) => {
          const r = fw / 2 + 1.2 + 1.2 * kn;
          const sw = 34 + 26 * kn; // half-sweep of the arc (degrees)
          const c = add(f.b, dirP(f.d, 1.5));
          const p0 = add(c, dirP(f.d + 180 - sw, r)), p1 = add(c, dirP(f.d + 180 + sw, r));
          return <path key={i} d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`} fill="none" stroke={INK} strokeWidth={1.6 + 0.8 * kn} opacity={0.13 + 0.38 * kn} strokeLinecap="round" />;
        })}
        {/* creases across the back of the hand, near the wrist */}
        <Grow d={`M 7 ${-9 * k} Q 10 ${-1} 7.5 ${8 * k}`} u={ss(a, 0.3, 0.9)} len={19} op={0.32} w={1.9} />
        <Grow d={`M 14 ${-10 * k} Q 17 ${-2} 14.5 ${6 * k}`} u={ss(a, 0.45, 1)} len={17} op={0.28} w={1.7} />
        {/* two veins from the wrist toward the knuckle gaps: a soft dark ridge with a lit edge */}
        {(() => {
          const u = ss(a, 0.55, 1);
          if (u < 0.01) return null;
          const v1 = `M -2 ${-3 * k} C 6 ${-6 * k} 14 ${-3 * k} 23 ${-8 * k}`;
          const v2 = `M -2 ${4 * k} C 8 ${7.5 * k} 15 ${4 * k} 24 ${8.2 * k}`;
          const lo = rotP(LIGHT, -rot);
          const hl = `translate(${lo.x * 1.3} ${lo.y * 1.3})`;
          return (
            <g opacity={u}>
              <path d={v1} fill="none" stroke={K.vein} strokeWidth={3.4} strokeLinecap="round" opacity={0.5} />
              <path d={v2} fill="none" stroke={K.vein} strokeWidth={3.2} strokeLinecap="round" opacity={0.46} />
              <path d={v1} fill="none" stroke={K.lite} strokeWidth={1.2} strokeLinecap="round" opacity={0.75} transform={hl} />
              <path d={v2} fill="none" stroke={K.lite} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} transform={hl} />
            </g>
          );
        })()}
        {/* age spots */}
        {[[18, -11, 2.7], [9, 8.5, 2.1], [24, 1.5, 1.7]].map(([x, y, r], i) => {
          const u = ss(a, 0.68 + i * 0.06, 1);
          return u > 0.01 ? <ellipse key={i} cx={x} cy={y * k} rx={r * (0.6 + 0.4 * u)} ry={r * 0.8 * (0.6 + 0.4 * u)} fill={K.spot} opacity={0.7 * u} /> : null;
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// the glove (design frame: cuff ring at x = -60..-46, fingers toward +x, back of the glove to camera)
const GLOVE_PTS: P[] = [
  {x: -47, y: -23}, {x: -24, y: -29}, {x: 2, y: -31}, {x: 25, y: -28}, {x: 38, y: -18}, {x: 42.5, y: 0}, {x: 38.5, y: 18},
  {x: 25, y: 28.5}, {x: 2, y: 31}, {x: -24, y: 29}, {x: -47, y: 24},
].map((p) => ({x: p.x * 1.1, y: p.y * 1.1}));
/** point and tangent on the glove outline (same Catmull-Rom curve as geo.closed), u in [0, n) */
const gloveAt = (u: number) => {
  const n = GLOVE_PTS.length;
  const i = ((Math.floor(u) % n) + n) % n, t = u - Math.floor(u);
  const p0 = GLOVE_PTS[(i - 1 + n) % n], p1 = GLOVE_PTS[i], p2 = GLOVE_PTS[(i + 1) % n], p3 = GLOVE_PTS[(i + 2) % n];
  const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
  const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
  const mt = 1 - t;
  const p = {
    x: mt * mt * mt * p1.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p2.x,
    y: mt * mt * mt * p1.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p2.y,
  };
  const d = {
    x: 3 * mt * mt * (c1.x - p1.x) + 6 * mt * t * (c2.x - c1.x) + 3 * t * t * (p2.x - c2.x),
    y: 3 * mt * mt * (c1.y - p1.y) + 6 * mt * t * (c2.y - c1.y) + 3 * t * t * (p2.y - c2.y),
  };
  const l = Math.hypot(d.x, d.y) || 1;
  const tan = {x: d.x / l, y: d.y / l};
  return {p, tan, nrm: {x: tan.y, y: -tan.x}}; // outward normal (the outline runs clockwise on screen)
};
/** the point of the glove's lower edge at a given x (searching the lower segments) */
const gloveBottomAtX = (x: number) => {
  let best = gloveAt(6), bd = 1e9;
  for (let u = 6; u <= 9.5; u += 0.01) {
    const g = gloveAt(u);
    const d = Math.abs(g.p.x - x);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
};
const gloveD = (grow = 0, sq = 0) => closed(GLOVE_PTS.map((p) => {
  const dy = p.y * (1 - 0.03 * sq);
  const l = Math.hypot(p.x, dy) || 1;
  return {x: p.x + (p.x / l) * grow, y: dy + (dy / l) * grow};
}));
const Glove: React.FC<{id: string; rot: number; stub: number; squeeze: number}> = ({id, rot, stub, squeeze}) => {
  const d = gloveD(0, squeeze);
  const cw = 14, ch = 60;
  return (
    <g>
      {/* white suit sleeve stub */}
      <Part id={`${id}-asl`} geos={[tubeG([{x: GLOVE_WRIST_X - stub - 6, y: 0}, {x: GLOVE_WRIST_X + 4, y: 0}], CLASP_ASTRO_ARM_W, 'butt')]} fill={SUIT} sh={SUIT_SH} rot={rot} amt={12} />
      {/* glove */}
      <Part id={`${id}-gl`} geos={[areaG(d)]} fill={GLOVE} sh={GLOVE_SH} rot={rot} amt={9}>
        <g transform="scale(1.1)">
        {/* three raised seams on the back of the glove */}
        {[-10, 0, 10].map((y, i) => (
          <path key={i} d={`M ${-40} ${y * 0.72} Q ${-27} ${y * 0.92} ${-12} ${y * 1.05}`} fill="none" stroke={GLOVE_LINE} strokeWidth={2.3} strokeLinecap="round" />
        ))}
        {/* the curled fingers at the end of the glove (most of them inside the clasp) */}
        {[-8, 1, 10].map((y, i) => (
          <path key={`k${i}`} d={`M ${34 - Math.abs(y) * 0.3} ${y - 1} q 4.5 1.2 7.8 ${0.4 + y * 0.08}`} fill="none" stroke={GLOVE_LINE} strokeWidth={2.2} strokeLinecap="round" />
        ))}
        <path d="M -34 -21 Q -14 -27 8 -26" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
        </g>
      </Part>
      {/* saffron cuff ring of the glove */}
      <Part id={`${id}-cf`} geos={[areaG(rrectD(GLOVE_WRIST_X, -ch / 2, cw, ch, 6))]} fill={C.saffron} sh={C.saffronDeep} rot={rot} amt={7}>
        <line x1={GLOVE_WRIST_X + cw / 2} y1={-ch / 2 + 4} x2={GLOVE_WRIST_X + cw / 2} y2={ch / 2 - 4} stroke={INK} strokeWidth={1.7} opacity={0.28} />
      </Part>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// UNDER hand. The heel and wrist come out from behind the glove at the lower right (design frame, pivoting about
// UNDER_GRIP for underAngle); the fingertips are hooked over the glove's lower edge (glove frame).
const UNDER_FINGER_X = [13, 23, 32.5, 41]; // index .. little finger, along the glove's lower edge
const underFingers = (age: number, squeeze: number) => {
  const a = clamp(age);
  const len = [1, 1.06, 1, 0.84];
  const tilt = [10, 6, 2, -4];
  return UNDER_FINGER_X.map((x, i) => {
    const e = gloveBottomAtX(x);
    const n = e.nrm; // outward (down)
    const inward = scl(n, -1);
    const lean = rotP(inward, -(18 + tilt[i])); // tips lean toward the glove's wrist (left)
    const L = 15 * len[i] * (1 - 0.04 * a) + 2.5 * squeeze;
    const b = add(e.p, scl(n, 3.5)); // the bend round the edge (just below it)
    const m = add(e.p, scl(inward, 2));
    const t = add(m, scl(lean, L));
    return {b, m, t, e: e.p, n};
  });
};
const UnderFingers: React.FC<{id: string; age: number; rot: number; squeeze: number}> = ({id, age, rot, squeeze}) => {
  const a = clamp(age);
  const K = skinSet(a);
  const fw = 10.2 * (1 - 0.1 * a);
  const kn = ss(a, 0.25, 1);
  const F = underFingers(a, squeeze);
  return (
    <g>
      {/* outer contour first so neighbouring fingers share one silhouette */}
      {F.map((f, i) => geoEl(tubeG([f.b, f.m, f.t], fw), INK, OUT * 2, i))}
      {[3, 2, 1, 0].map((i) => {
        const f = F[i];
        const geos = [tubeG([f.b, f.m, f.t], fw), areaG(circleD(f.b, fw / 2 + 1.6 * kn))];
        const td = angOf(f.m, f.t);
        const nailC = add(f.t, dirP(td, -3.4));
        return (
          <g key={i}>
            {geos.map((gg, j) => geoEl(gg, INK, 2.2 * 2, j))}
            <Part id={`${id}-uf${i}`} geos={geos} fill={K.skin} sh={K.sh} rot={rot} amt={3.4} ink={0}>
              <ellipse cx={nailC.x} cy={nailC.y} rx={3.4 * (1 - 0.08 * a)} ry={2.8 * (1 - 0.06 * a)} fill={K.nail} stroke={INK} strokeWidth={1.2} strokeOpacity={0.32} transform={`rotate(${td} ${nailC.x} ${nailC.y})`} />
              {/* knuckle creases on the bend, drawing in with age */}
              <Grow d={creaseD(add(f.m, dirP(td, 2.5)), td, fw, 0.9, 1.8)} u={0.2 + 0.8 * ss(a, 0.12, 0.8)} len={fw} op={0.5} />
              <Grow d={creaseD(add(f.m, dirP(td, 5.5)), td, fw, 0.7, 1.4)} u={ss(a, 0.35, 0.95)} len={fw * 0.8} op={0.4} />
            </Part>
          </g>
        );
      })}
    </g>
  );
};
/** the heel of the under hand and its cuff (design frame, before the underAngle pivot) */
const UnderHeel: React.FC<{id: string; age: number; rot: number; stub: number}> = ({id, age, rot, stub}) => {
  const a = clamp(age);
  const K = skinSet(a);
  const k = 1 - 0.07 * a;
  // the wrist across the forearm, the upper contour disappears behind the glove, the lower contour runs from the little
  // finger's bend back to the wrist
  const W = {x: UNDER.wx, y: UNDER.wy};
  const up = dirP(UNDER.dir + 90); // up-ish for dir 192
  const ax = dirP(UNDER.dir); // toward the fingers
  const wUp = add(W, scl(up, 13.5 * k)), wDn = add(W, scl(up, -13.5 * k));
  const pts: P[] = [
    add(wUp, scl(ax, -3)),
    add(wUp, scl(ax, 12)),
    {x: 40, y: 8},
    {x: 30, y: 22},
    {x: 43, y: 31},
    {x: 52, y: 44 - 1.5 * a},
    add(wDn, scl(ax, -3)),
  ];
  const d = closed(pts);
  return (
    <g>
      <Part id={`${id}-hl`} geos={[areaG(d)]} fill={K.skin} sh={K.sh} rot={rot} amt={6}>
        {/* wrist crease, drawing in with age */}
        <Grow d={`M ${wUp.x + ax.x * 6} ${wUp.y + ax.y * 6 + 4} Q ${W.x + ax.x * 8 + 2} ${W.y} ${wDn.x + ax.x * 6} ${wDn.y + ax.y * 6 - 4}`} u={0.25 + 0.75 * ss(a, 0.25, 0.95)} len={22} op={0.38} w={1.9} />
        {a > 0.7 && <ellipse cx={W.x + ax.x * 16} cy={W.y + ax.y * 16 + 5} rx={2.2 * ss(a, 0.72, 1)} ry={1.7 * ss(a, 0.72, 1)} fill={K.spot} opacity={0.5} />}
      </Part>
      <g transform={`translate(${W.x} ${W.y}) rotate(${UNDER.dir})`}>
        <FriendCuff id={`${id}-cu`} age={a} stub={stub} rot={rot} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
export const Clasp: React.FC<{age: number; id: string; astroAngle?: number; overAngle?: number; underAngle?: number; squeeze?: number;
  /** length of the sleeve stubs past the wrists (default CLASP_STUB) */ stub?: number}> = ({
  age, id, astroAngle = CLASP_DEFAULTS.astroAngle, overAngle = CLASP_DEFAULTS.overAngle, underAngle = CLASP_DEFAULTS.underAngle, squeeze = 0, stub = CLASP_STUB,
}) => {
  const a = clamp(age);
  const sq = clamp(squeeze);
  const dA = astroAngle - CLASP_DEFAULTS.astroAngle;
  const dO = overAngle - CLASP_DEFAULTS.overAngle;
  const dU = underAngle - CLASP_DEFAULTS.underAngle;
  const gloveRot = DESIGN_ROT + dA;
  const overRot = DESIGN_ROT + dO + OVER.dir;
  const underRot = DESIGN_ROT + dU;
  // squeeze: the hands close a few units onto the glove
  const overT = `translate(${-1.2 * sq} ${2.6 * sq}) rotate(${dO} ${OVER_GRIP.x} ${OVER_GRIP.y}) translate(${OVER.wx} ${OVER.wy}) rotate(${OVER.dir})`;
  return (
    <g transform={`rotate(${DESIGN_ROT})`}>
      {/* 1. the under hand's heel and cuff, behind the glove */}
      <g transform={`translate(${0.6 * sq} ${-1.6 * sq}) rotate(${dU} ${UNDER_GRIP.x} ${UNDER_GRIP.y})`}>
        <UnderHeel id={`${id}-uh`} age={a} rot={underRot} stub={stub} />
      </g>
      {/* 2. the glove, and the under hand's fingertips hooked over its lower edge */}
      <g transform={`rotate(${dA})`}>
        <Glove id={`${id}-g`} rot={gloveRot} stub={stub} squeeze={sq} />
        <UnderFingers id={`${id}-uf`} age={a} rot={gloveRot} squeeze={sq} />
      </g>
      {/* 3. the over hand on top */}
      <g transform={overT}>
        <OverHand id={`${id}-oh`} age={a} rot={overRot} squeeze={sq} />
        <FriendCuff id={`${id}-oc`} age={a} stub={stub} rot={overRot} />
      </g>
    </g>
  );
};
