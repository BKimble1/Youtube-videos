// Glass Climbing V8: the three pad close-ups, each a full-frame scene and a pure function of its parameters.
//   ContactScene8   (A, film 24-70  "against a glass wall,"): outside, low and oblique: the loaded pad on a facade
//                   pane (the sky and the street's far side reflected in it, the room faintly behind it, a pale
//                   mullion), his LEFT fist on the handle, the forearm and the tee's striped sleeve leaving frame; the
//                   thin tile layer at the glass with a dark contact line, a crisp contact shadow, a restrained device
//                   reflection, and a small response as the load comes on (spine/handle travel in the cover's slots,
//                   the lug and D-ring dropping, the fist closing, the contact line and shadow darkening).
//   SurfaceScene8   (B, film 894-930 "They need a smooth surface"): from inside the building looking out through the
//                   glass at his RIGHT pad (the rig's padR, which arrives and loads in these frames): it comes up into
//                   place, stands off, closes on the glass, touches, and as the load comes on every one of its 24 tiles
//                   wets from the middle out, evenly; his hand behind it, his forearm and sleeve leaving the frame; the
//                   window's mullion and transom with their gaskets, sheens and the room's faint reflection on the
//                   pane, the sky and the city far below.
//   SpringScene8    (C, film 528-664 "Special springs spread the load, so one little patch doesn't have to hold you up
//                   alone."): outside, from his side (as the bay sees him): the camera comes round a little and in; he
//                   eases his weight off the stirrup and a section plane cuts the cover away; he stands back in: the
//                   strap pulls straight, the lug and spine travel, every rail follows and all 24 springs stretch
//                   together while the tiles stay put; one tile's patch lets go (its spring goes slack, the rail bows
//                   under it and its two neighbours in the row stretch further, the rest keep their share); the contact
//                   returns and the load evens out; the cover is restored and the camera returns to the bay's view of
//                   the same hand.
// Every scene draws in pad millimetres (Pad8's axes and perspective camera); the 2D cam (dc/camera Cam, Layer at
// depth 1) frames those millimetres: screen = (W/2 + (x - cam.x) z, H/2 + (y - cam.y) z), with x, y the pad view's
// screen millimetres (the pad centre is 0, 0) and z pixels per mm at the pad centre's depth.
// Pad axes: u out of the glass, v down, w across; +w is his LEFT side (Pad8).
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, fmt, hash, lerp, P} from '../dc/math';
import {H, W} from '../lib';
import {H_BAR} from '../world/rig';
import {allTiles, ARM_BAY, ArmSpec, P3, P3D, Pad3D, Pad3DState, PadReflection, PadView, PH, PW, Proj, tetherOf, viewOf} from './Pad8';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const sm = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const path = (pts: Proj[] | null) => (pts && pts.length >= 3 ? `M${pts.map((p) => P(p)).join(' L')} Z` : '');
/** a fixed quad in pad axes, clipped to the camera and projected */
const quad = (vw: PadView, pts: P3[]) => path(vw.clipFixed(pts));
/** a box's faces (fixed), back-face culled, flat-shaded from the key light, nearest last */
const boxFaces = (vw: PadView, u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, color: string, ink: number, key: string, opts: {stroke?: string; skip?: string[]; fill?: (nm: string, c: string) => string} = {}) => {
  const L = {x: -0.55, y: -0.65, z: 0.52};
  const ln = Math.hypot(L.x, L.y, L.z);
  const f: [string, P3[], P3][] = [
    ['u0', [{u: u0, v: v0, w: w0}, {u: u0, v: v1, w: w0}, {u: u0, v: v1, w: w1}, {u: u0, v: v0, w: w1}], {u: -1, v: 0, w: 0}],
    ['u1', [{u: u1, v: v0, w: w0}, {u: u1, v: v0, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v1, w: w0}], {u: 1, v: 0, w: 0}],
    ['v0', [{u: u0, v: v0, w: w0}, {u: u0, v: v0, w: w1}, {u: u1, v: v0, w: w1}, {u: u1, v: v0, w: w0}], {u: 0, v: -1, w: 0}],
    ['v1', [{u: u0, v: v1, w: w0}, {u: u1, v: v1, w: w0}, {u: u1, v: v1, w: w1}, {u: u0, v: v1, w: w1}], {u: 0, v: 1, w: 0}],
    ['w0', [{u: u0, v: v0, w: w0}, {u: u1, v: v0, w: w0}, {u: u1, v: v1, w: w0}, {u: u0, v: v1, w: w0}], {u: 0, v: 0, w: -1}],
    ['w1', [{u: u0, v: v0, w: w1}, {u: u0, v: v1, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v0, w: w1}], {u: 0, v: 0, w: 1}],
  ];
  const out: {d: number; node: React.ReactNode}[] = [];
  for (const [nm, pts, n] of f) {
    if (opts.skip?.includes(nm)) continue;
    const c = pts.reduce((s, p) => ({u: s.u + p.u / 4, v: s.v + p.v / 4, w: s.w + p.w / 4}), {u: 0, v: 0, w: 0});
    if (vw.facing(n, c, false) <= 0) continue;
    const nn = vw.dir(n, false);
    const k = (nn.x * L.x + nn.y * L.y + nn.z * L.z) / ln;
    const col0 = k >= 0 ? lit(color, 0.3 * k) : shade(color, -0.3 * k);
    const col = opts.fill ? opts.fill(nm, col0) : col0;
    const d = path(vw.clipFixed(pts));
    if (!d) continue;
    out.push({d: vw.csF(c).D, node: <path key={`${key}${nm}`} d={d} fill={col} stroke={opts.stroke ?? INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />});
  }
  return out.sort((a, b) => a.d - b.d).map((o) => o.node);
};
/** an feColorMatrix that blends every colour a fraction k toward c */
const muteMatrix = (k: number, c: string) => {
  const n = parseInt(c.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const a = 1 - k;
  return `${a} 0 0 0 ${fmt(k * r)}  0 ${a} 0 0 ${fmt(k * g)}  0 0 ${a} 0 ${fmt(k * b)}  0 0 0 1 0`;
};
/** the inverse-distance blend of two perspective distances (0 = orthographic): a smooth move into or out of ortho */
const lerpPersp = (a: number, b: number, t: number) => {
  const ia = a > 0 ? 1 / a : 0, ib = b > 0 ? 1 / b : 0;
  const i = lerp(ia, ib, t);
  return i > 1e-7 ? 1 / i : 0;
};

// ------------------------------------------------------------------------------------------------ outside: the facade
/** The curtain wall seen from outside (A, C). Back to front: the room behind the glass (dim; 'flat' reduces it to two
 *  quiet bands), the curtain wall's inner members, the reflection in the glass (stronger toward grazing): the sky's
 *  gradient and the street's far side (pale blocks with window rows, ragged tops against the sky), the glass's own
 *  tint, one diagonal sheen near the pad and a thinner one, the device's faint reflection; the spandrel below the
 *  transom; the gaskets, the pale aluminium mullion caps and the transom in front of the glass. */
type FacadeOpts = {mullions: number[]; transom: number; z: number; reflect: number; drift?: number; room?: 'full' | 'flat'; fresnel?: [number, number]; sheenW?: number};
const Facade: React.FC<{id: string; st: Pad3DState; o: FacadeOpts}> = ({id, st, o}) => {
  const vw = viewOf({...st, gap: 0, tilt: 0, slide: 0});
  const ink = (1.5 / o.z) * 1.4;
  const S = 9000;
  const T = o.transom; // the transom's centre line (v); the spandrel hides the slab below it
  const drift = o.drift ?? 0;
  const flat = o.room === 'flat';
  // the room: floor, ceiling, back wall, rows of ceiling lights (dim and cool)
  const FL = T + 140, CE = T - 2750, BK = -7200;
  const room: React.ReactNode[] = [];
  if (!flat) {
    room.push(<path key="bk" d={quad(vw, [{u: BK, v: CE, w: -S}, {u: BK, v: CE, w: S}, {u: BK, v: FL, w: S}, {u: BK, v: FL, w: -S}])} fill="#566C78" />);
    room.push(<path key="ce" d={quad(vw, [{u: -30, v: CE, w: -S}, {u: -30, v: CE, w: S}, {u: BK, v: CE, w: S}, {u: BK, v: CE, w: -S}])} fill="#61798A" />);
    room.push(<path key="fl" d={quad(vw, [{u: -30, v: FL, w: -S}, {u: -30, v: FL, w: S}, {u: BK, v: FL, w: S}, {u: BK, v: FL, w: -S}])} fill="#3A4D58" />);
    for (let r = 0; r < 4; r++)
      for (let c = -4; c <= 4; c++) {
        const u0 = -900 - r * 1600, w0 = c * 1800 - 300;
        room.push(<path key={`lp${r}${c}`} d={quad(vw, [{u: u0, v: CE + 2, w: w0}, {u: u0, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0}])} fill="#AFC4CD" opacity={0.45} />);
      }
    for (const w of [-3400, 2200]) room.push(...boxFaces(vw, -3900, -3500, CE, FL, w, w + 400, '#4E6474', 0, `col${w}`, {stroke: 'none'}));
  }
  // the vision glass above the transom, the spandrel below (opaque)
  const vision = quad(vw, [{u: 0, v: -S, w: -S}, {u: 0, v: -S, w: S}, {u: 0, v: T, w: S}, {u: 0, v: T, w: -S}]);
  const spandrel = quad(vw, [{u: 0, v: T, w: -S}, {u: 0, v: T, w: S}, {u: 0, v: T + 1200, w: S}, {u: 0, v: T + 1200, w: -S}]);
  // reflection strength: grazing (far along the facade) reflects more; the screen direction the facade recedes in
  const near = vw.fixed({u: 0, v: 0, w: 600}), far = vw.fixed({u: 0, v: 0, w: -1600});
  // the reflected sky's gradient runs up the virtual sky (u < 0 is the mirror world)
  const skyLo = vw.vanish({u: -1, v: 0, w: -0.6}) ?? {x: 0, y: 900};
  const skyHi = vw.vanish({u: -0.5, v: -1, w: -0.3}) ?? {x: 0, y: -900};
  // the street's far side, mirrored in the glass (u -> -u): a row of blocks along the street, flat and pale, their
  // window rows, ragged tops against the reflected sky
  const blocks: {d: number; node: React.ReactNode}[] = [];
  let w = -150000;
  for (let i = 0; w < 60000; i++) {
    const wd = 9000 + hash(i, 21) * 14000;
    const top = -(16000 + hash(i, 22) * 44000);
    const u0 = -(23000 + hash(i, 23) * 6000);
    const base = hash(i, 24) > 0.5 ? '#D3E2E8' : hash(i, 25) > 0.5 ? '#BFD3DC' : '#E2ECEF';
    const faces = boxFaces(vw, u0 - 20000, u0, top, 90000, w, w + wd, base, 0, `rb${i}`, {stroke: 'none', skip: ['u0', 'v1']});
    const win: React.ReactNode[] = [];
    for (let k = 0; k < 18; k++) {
      const v = top + 1500 + k * 3500;
      const dd = quad(vw, [{u: u0 + 1, v, w: w + 700}, {u: u0 + 1, v, w: w + wd - 700}, {u: u0 + 1, v: v + 1300, w: w + wd - 700}, {u: u0 + 1, v: v + 1300, w: w + 700}]);
      if (dd) win.push(<path key={k} d={dd} fill={shade(base, 0.1)} opacity={0.55} />);
    }
    blocks.push({d: vw.csF({u: u0, v: 0, w: w + wd / 2}).D, node: <g key={`b${i}`}>{faces}{win}</g>});
    w += wd + 2500 + hash(i, 26) * 9000;
  }
  blocks.sort((a, b) => a.d - b.d);
  // mullions (vertical) and the transom: pale aluminium caps standing out of the glass, a dark gasket at the glass
  const metal = '#C9D2D8';
  const frame: {d: number; node: React.ReactNode}[] = [];
  for (const m of o.mullions) {
    const faces = boxFaces(vw, 0, 62, -S, S, m - 28, m + 28, metal, ink, `m${m}`);
    frame.push({d: vw.csF({u: 30, v: 0, w: m}).D, node: <g key={`m${m}`}>{faces}</g>});
  }
  const tr = boxFaces(vw, 0, 48, T - 24, T + 24, -S, S, metal, ink, 'tr');
  frame.push({d: -1e6, node: <g key="tr">{tr}</g>});
  frame.sort((a, b) => a.d - b.d);
  const gasket = (pts: P3[]) => path(vw.clipFixed(pts));
  // the curtain wall's inner members seen through the glass (deeper than the caps outside; parallax gives depth)
  const inner: React.ReactNode[] = [];
  if (!flat) {
    for (const m of o.mullions) inner.push(...boxFaces(vw, -190, -24, -S, T, m - 26, m + 26, '#566A76', ink * 0.6, `im${m}`, {stroke: '#33434C'}));
    inner.push(...boxFaces(vw, -210, -24, T - 30, T + 40, -S, S, '#566A76', ink * 0.6, 'isl', {stroke: '#33434C'}));
  }
  // the sheens: one broad diagonal band near the pad, one thin one beside it (they belong to the glass and slide a
  // little with the drift)
  const sw = o.sheenW ?? -260;
  const sheen = (w0: number, wd: number) => quad(vw, [{u: 0.5, v: -S, w: w0 + 0.42 * S}, {u: 0.5, v: -S, w: w0 + wd + 0.42 * S}, {u: 0.5, v: S, w: w0 + wd - 0.42 * S}, {u: 0.5, v: S, w: w0 - 0.42 * S}]);
  const sx = drift * 70;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-vis`}>
          <path d={vision} />
        </clipPath>
        {/* Fresnel: the reflection is fainter where we look into the glass and strong toward grazing */}
        <linearGradient id={`${id}-fr`} gradientUnits="userSpaceOnUse" x1={fmt(near.x)} y1={fmt(near.y)} x2={fmt(far.x)} y2={fmt(far.y)}>
          <stop offset="0" stopColor="#FFF" stopOpacity={o.fresnel?.[0] ?? 0.62} />
          <stop offset="1" stopColor="#FFF" stopOpacity={o.fresnel?.[1] ?? 0.94} />
        </linearGradient>
        <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
          <rect x={-20000} y={-20000} width={40000} height={40000} fill={`url(#${id}-fr)`} />
        </mask>
        <linearGradient id={`${id}-sk`} gradientUnits="userSpaceOnUse" x1={fmt(skyHi.x)} y1={fmt(skyHi.y)} x2={fmt(skyLo.x)} y2={fmt(skyLo.y)}>
          <stop offset="0" stopColor="#6FA4C8" />
          <stop offset="0.5" stopColor="#A9CDE0" />
          <stop offset="1" stopColor="#E3EEF0" />
        </linearGradient>
        <linearGradient id={`${id}-sp`} gradientUnits="userSpaceOnUse" x1={fmt(near.x)} y1={fmt(near.y)} x2={fmt(far.x)} y2={fmt(far.y)}>
          <stop offset="0" stopColor="#3B4D57" />
          <stop offset="1" stopColor="#647C89" />
        </linearGradient>
      </defs>
      <rect x={-6000} y={-6000} width={12000} height={12000} fill={flat ? '#557080' : '#4B616D'} />
      <g clipPath={`url(#${id}-vis)`}>
        {room}
        {flat && (
          <g>
            <path d={quad(vw, [{u: -2000, v: T - 900, w: -S}, {u: -2000, v: T - 900, w: S}, {u: -2000, v: T + 140, w: S}, {u: -2000, v: T + 140, w: -S}])} fill="#48606C" />
          </g>
        )}
        {inner}
        {/* the sky and the street's far side, mirrored in the glass */}
        <g mask={`url(#${id}-fm)`}>
          <path d={vision} fill={`url(#${id}-sk)`} />
          {blocks.map((b) => b.node)}
        </g>
        <path d={vision} fill="#4F8A9A" opacity={0.1} />
        <path d={sheen(sw + sx, 120)} fill="#FFFFFF" opacity={0.2} />
        <path d={sheen(sw + 190 + sx, 34)} fill="#FFFFFF" opacity={0.16} />
        {o.reflect > 0.001 && (
          <g mask={`url(#${id}-fm)`}>
            <PadReflection id={`${id}-rf`} st={{...st, reflect: 0}} z={o.z} opacity={o.reflect} />
          </g>
        )}
      </g>
      <path d={spandrel} fill={`url(#${id}-sp)`} />
      {[0, 1, 2].map((k) => (
        <path key={k} d={quad(vw, [{u: 0.4, v: T + 120 + k * 260, w: -S}, {u: 0.4, v: T + 120 + k * 260, w: S}, {u: 0.4, v: T + 128 + k * 260, w: S}, {u: 0.4, v: T + 128 + k * 260, w: -S}])} fill="#7F96A2" opacity={0.35} />
      ))}
      {/* the gaskets where the frame meets the glass, with the glass's bright cut edge beside them */}
      {o.mullions.map((m) => (
        <g key={m}>
          <path d={gasket([{u: 0.6, v: -S, w: m - 35}, {u: 0.6, v: S, w: m - 35}, {u: 0.6, v: S, w: m - 28}, {u: 0.6, v: -S, w: m - 28}])} fill="#1F292E" />
          <path d={gasket([{u: 0.6, v: -S, w: m + 28}, {u: 0.6, v: S, w: m + 28}, {u: 0.6, v: S, w: m + 35}, {u: 0.6, v: -S, w: m + 35}])} fill="#1F292E" />
          <path d={gasket([{u: 0.7, v: -S, w: m - 37.5}, {u: 0.7, v: S, w: m - 37.5}, {u: 0.7, v: S, w: m - 35}, {u: 0.7, v: -S, w: m - 35}])} fill="#EAF4F7" opacity={0.7} />
          <path d={gasket([{u: 0.7, v: -S, w: m + 35}, {u: 0.7, v: S, w: m + 35}, {u: 0.7, v: S, w: m + 37.5}, {u: 0.7, v: -S, w: m + 37.5}])} fill="#EAF4F7" opacity={0.7} />
        </g>
      ))}
      <path d={gasket([{u: 0.6, v: T - 31, w: -S}, {u: 0.6, v: T - 31, w: S}, {u: 0.6, v: T - 24, w: S}, {u: 0.6, v: T - 24, w: -S}])} fill="#1F292E" />
      {frame.map((f) => f.node)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ A: contact close-up
export type ContactView = {yaw: number; pitch: number; persp: number};
/** low and oblique from his left (outside): the tile layer and the contact line at the glass read along the pad's
 *  side and bottom edges */
export const CONTACT_VIEW: ContactView = {yaw: 30, pitch: -16, persp: 1100};
export const CONTACT_CAM: Cam = {x: 78, y: 146, z: 3.5};
/** his left arm for A: reaching up to the pad, the forearm dropping toward us a little, the upper arm in the tee's
 *  sleeve entering along the bottom edge (the shoulder well below the frame) */
export const ARM_A: ArmSpec = {elbow: {u: 52, v: 226, w: 128}, shoulder: {u: 92, v: 226, w: 112}};
/** A (film 24-70): load 0..1 (the brief: about 0.6 at the cut, 1 by its 12th frame, then a small settle); drift 0..1
 *  slides the sheens a little over the shot (optional); grip 0..1 the fist's closure (default 0.86 + 0.14 load: it
 *  closes as the weight comes on); cam / view / arm override the framing. */
export const ContactScene8: React.FC<{id: string; load: number; drift?: number; grip?: number; cam?: Cam; view?: ContactView; arm?: ArmSpec}> = ({id, load, drift = 0, grip, cam = CONTACT_CAM, view = CONTACT_VIEW, arm = ARM_A}) => {
  const l = clamp(load);
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp,
    load: l,
    contact: allTiles(0.55 + 0.45 * l),
    cover: 1,
    gap: 0,
    tilt: 0,
    slide: 0,
    surface: 'none',
    hand: H_BAR,
    grip: grip ?? 0.86 + 0.14 * l,
    arm,
    strap: 2400,
    tether: tetherOf(l),
    strapLean: {u: 0.16, w: 0.02},
    shadow: 1,
    shadowDir: {v: 12, w: -4},
    contactLine: 1,
    reflect: 0,
  };
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <Facade id={`${id}-f`} st={st} o={{mullions: [-560, 1500], transom: 900, z: cam.z, reflect: 0.3, drift, sheenW: -330}} />
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------------ B: surface test
const HAZE = '#A3C0CF';
/** the city seen from about 90 m up through the window (pad axes: the street is at v = +90000, the outside is u > 0):
 *  the sky, a far skyline, blocks and streets far below, all in aerial haze (farther = paler) */
const CityOut: React.FC<{id: string; vw: PadView}> = ({id, vw}) => {
  const hz = vw.vanish({u: 1, v: 0, w: 0.15}) ?? {x: 0, y: -200};
  const GND = 90000;
  const items: {d: number; node: React.ReactNode}[] = [];
  const hazeOf = (u: number) => clamp(0.18 + Math.log(Math.max(1, u / 40000)) * 0.3, 0, 0.88);
  const block = (u0: number, u1: number, w0: number, w1: number, top: number, base: string, key: string, windows = true) => {
    const k = hazeOf(u0);
    const col = mix(base, HAZE, k);
    const nodes: React.ReactNode[] = [...boxFaces(vw, u0, u1, top, GND, w0, w1, col, 0, key, {stroke: 'none'})];
    if (windows && k < 0.7) {
      for (let v = top + 1400; v < GND - 1500; v += 3300) {
        const d = quad(vw, [{u: u0 - 1, v, w: w0 + 900}, {u: u0 - 1, v, w: w1 - 900}, {u: u0 - 1, v: v + 1200, w: w1 - 900}, {u: u0 - 1, v: v + 1200, w: w0 + 900}]);
        if (d) nodes.push(<path key={`${key}w${v}`} d={d} fill={mix(col, '#55788A', 0.26 * (1 - k))} />);
      }
      const pw = w0 + (w1 - w0) * 0.3;
      nodes.push(...boxFaces(vw, u0 + 6000, u0 + 11000, top - 2600, top, pw, pw + 5000, mix(col, '#FFFFFF', 0.12), 0, `${key}p`, {stroke: 'none'}));
    }
    items.push({d: -u0, node: <g key={key}>{nodes}</g>});
  };
  for (let i = 0; i < 60; i++) {
    const u = 1400000 + hash(i, 3) * 900000;
    const w = -1800000 + i * 60000 + hash(i, 4) * 50000;
    const wd = 16000 + hash(i, 5) * 22000;
    const h = 40000 + hash(i, 6) * 110000 * (hash(i, 7) > 0.8 ? 1.6 : 0.8);
    block(u, u + wd, w, w + wd, GND - h, '#B9CDD7', `s${i}`, false);
  }
  for (let r = 0; r < 9; r++)
    for (let c = -9; c <= 9; c++) {
      const i = r * 20 + c + 10;
      const u0 = 60000 + r * 38000 + hash(i, 11) * 5000;
      const w0 = c * 34000 + hash(i, 12) * 6000 - 14000;
      const h = 9000 + hash(i, 13) * (16000 + r * 4000);
      const wd = 20000 + hash(i, 14) * 7000;
      block(u0, u0 + 24000, w0, w0 + wd, GND - h, hash(i, 15) > 0.55 ? '#CDBBA6' : hash(i, 16) > 0.5 ? '#A7B7C1' : '#B9C2B3', `b${r}_${c}`);
    }
  items.sort((a, b) => a.d - b.d);
  const ground = quad(vw, [{u: 20000, v: GND, w: -3e6}, {u: 20000, v: GND, w: 3e6}, {u: 3e6, v: GND, w: 3e6}, {u: 3e6, v: GND, w: -3e6}]);
  const streets: React.ReactNode[] = [];
  for (let r = 0; r < 10; r++) {
    const u0 = 60000 + r * 38000 - 11000;
    streets.push(<path key={`sa${r}`} d={quad(vw, [{u: u0, v: GND - 10, w: -3e6}, {u: u0, v: GND - 10, w: 3e6}, {u: u0 + 9000, v: GND - 10, w: 3e6}, {u: u0 + 9000, v: GND - 10, w: -3e6}])} fill={mix('#DADFDD', HAZE, 0.3 + r * 0.05)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(hz.y - 1000)} x2="0" y2={fmt(hz.y + 10)}>
          <stop offset="0" stopColor="#78ADD0" />
          <stop offset="0.6" stopColor="#B4D5E6" />
          <stop offset="1" stopColor="#E4EFEF" />
        </linearGradient>
        <linearGradient id={`${id}-gnd`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(hz.y)} x2="0" y2={fmt(hz.y + 800)}>
          <stop offset="0" stopColor={mix('#CBD6D6', HAZE, 0.5)} />
          <stop offset="1" stopColor="#97A9A8" />
        </linearGradient>
      </defs>
      <rect x={-8000} y={-8000} width={16000} height={16000} fill={`url(#${id}-sky)`} />
      {[[-560, -620, 300, 34], [200, -820, 420, 46], [640, -560, 240, 28], [-80, -430, 180, 18]].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={fmt(hz.x + x)} cy={fmt(hz.y + y)} rx={fmt(rx)} ry={fmt(ry)} fill="#F4F8F8" opacity={0.6} />
      ))}
      <path d={ground} fill={`url(#${id}-gnd)`} />
      {streets}
      {items.map((it) => it.node)}
    </g>
  );
};

export type SurfaceView = {yaw: number; pitch: number; persp: number};
/** from inside, nearly square to the glass, a little above the pad looking out and down */
export const SURFACE_VIEW: SurfaceView = {yaw: -82, pitch: 8, persp: 1150};
export const SURFACE_CAM: Cam = {x: -14, y: 40, z: 3.55};
/** his right arm for B (handSide -1): the hand on the bar, reaching up to the pad; the forearm drops to the elbow and
 *  the upper arm (in the tee's sleeve) goes on down out of the frame toward his shoulder, below the picture */
export const ARM_RISE: ArmSpec = {elbow: {u: 70, v: 215, w: 6}, shoulder: {u: 150, v: 250, w: -60}};
/** contact for B: the patches bloom in every tile over the last few mm of the approach (a soft 2-3 frame touch, not a
 *  switch), then spread to the whole tile as the load comes on (the same in all 24) */
export const surfaceContact = (gap: number, load: number) => 0.16 * sm(1 - gap / 4) + 0.84 * clamp(load) * sm(1 - gap);
/** B (film 894-930): gap (mm stand-off from the glass, about 45 -> 0 as the pad arrives), slide (mm: the pad's offset
 *  down the glass from its seat while it is carried; + below, - above; default 0), load 0..1 (after the touch: the
 *  tiles wet evenly from the middle out, the strap tightens, the handle travels), contact (optional per-tile
 *  override, else surfaceContact(gap, load)); cam / view override the framing. */
export const SurfaceScene8: React.FC<{id: string; gap: number; load: number; slide?: number; contact?: number[]; cam?: Cam; view?: SurfaceView}> = ({id, gap, load, slide = 0, contact, cam = SURFACE_CAM, view = SURFACE_VIEW}) => {
  const l = clamp(load);
  const g = Math.max(0, gap);
  const ct = contact ?? allTiles(surfaceContact(g, l));
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp,
    load: l,
    contact: ct,
    cover: 1,
    gap: g,
    tilt: 0,
    slide,
    surface: 'none',
    hand: H_BAR,
    handSide: -1,
    grip: 0.9 + 0.1 * l,
    arm: ARM_RISE,
    strap: 2400,
    tether: lerp(0.35, 1, sm(l * 1.4)),
    strapLean: {u: 0.12, w: -0.05},
    shadow: 0,
    ridges: 0.6,
  };
  const vw = viewOf(st);
  const z = cam.z;
  const ink = (1.5 / z) * 1.4;
  // the window, from inside: the glass (inner face u = -24) between a mullion to the left (-w) and a transom above
  const BIG = 9000;
  const GI = -24; // the glass's inner face
  const MW = -150, TR = -178; // the mullion's glass edge (w) and the transom's glass edge (v)
  const glassPts: P3[] = [{u: GI, v: TR, w: MW}, {u: GI, v: TR, w: BIG}, {u: GI, v: BIG, w: BIG}, {u: GI, v: BIG, w: MW}];
  const glass = quad(vw, glassPts);
  const frameFaces = [
    ...boxFaces(vw, -200, GI, TR - 74, BIG, MW - 64, MW, '#D2D9DE', ink, 'im'),
    ...boxFaces(vw, -200, GI, -BIG, TR, -BIG, BIG, '#D2D9DE', ink, 'it'),
  ];
  // on the glass: the gaskets and the glass's bright edge along the frame
  const onGlass = (u: number, pts: [number, number][]) => quad(vw, pts.map(([v, w]) => ({u, v, w})));
  const gaskets = [
    onGlass(GI - 0.4, [[TR, MW], [TR, BIG], [TR + 3.2, BIG], [TR + 3.2, MW]]),
    onGlass(GI - 0.4, [[TR, MW], [TR, MW + 3.2], [BIG, MW + 3.2], [BIG, MW]]),
  ];
  const edges = [
    onGlass(GI - 0.5, [[TR + 3.2, MW + 3.2], [TR + 3.2, BIG], [TR + 5.4, BIG], [TR + 5.4, MW + 3.2]]),
    onGlass(GI - 0.5, [[TR + 3.2, MW + 3.2], [TR + 3.2, MW + 5.4], [BIG, MW + 5.4], [BIG, MW + 3.2]]),
  ];
  // the pane's own surface: two diagonal sheens across it, the room's ceiling lights faintly reflected near the top,
  // the dark room reflected low down
  const sheen = (w0: number, wd: number) => onGlass(GI - 0.6, [[-1200, w0 - 520], [-1200, w0 - 520 + wd], [1200, w0 + 520 + wd], [1200, w0 + 520]]);
  // (the ceiling's light panels behind us, mirrored in the pane: a row of soft pale slabs just under the transom)
  const lights = [-150, -10, 130, 270].map((w0, i) => <path key={i} d={onGlass(GI - 0.6, [[TR + 16, w0], [TR + 16, w0 + 96], [TR + 34, w0 + 108], [TR + 34, w0 + 12]])} fill="#FFFFFF" opacity={0.22} />);
  const lowY0 = vw.fixed({u: GI, v: 140, w: 0}).y, lowY1 = vw.fixed({u: GI, v: 400, w: 0}).y;
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <defs>
          <clipPath id={`${id}-gl`}>
            <path d={glass} />
          </clipPath>
          {/* the glass tints everything seen through it a little (flat, no blur) */}
          <filter id={`${id}-glass`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.1, '#7FA2B2')} />
          </filter>
          <filter id={`${id}-far`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.16, '#9DB9C6')} />
          </filter>
          <linearGradient id={`${id}-low`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(lowY0)} x2="0" y2={fmt(lowY1)}>
            <stop offset="0" stopColor="#1C2A33" stopOpacity={0} />
            <stop offset="1" stopColor="#1C2A33" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={-8000} y={-8000} width={16000} height={16000} fill="#3C4B55" />
        <g clipPath={`url(#${id}-gl)`}>
          <g filter={`url(#${id}-far)`}>
            <CityOut id={`${id}-c`} vw={vw} />
          </g>
          <g filter={`url(#${id}-glass)`}>
            <Pad3D id={`${id}-p`} st={st} z={z} />
          </g>
          <path d={glass} fill={`url(#${id}-low)`} />
          {lights}
          <path d={sheen(-60, 70)} fill="#FFFFFF" opacity={0.12} />
          <path d={sheen(30, 18)} fill="#FFFFFF" opacity={0.1} />
          {gaskets.map((d, i) => <path key={`g${i}`} d={d} fill="#2A353C" />)}
          {edges.map((d, i) => <path key={`e${i}`} d={d} fill="#F2FAFC" opacity={0.75} />)}
        </g>
        {frameFaces}
      </Layer>
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------------ C: springs cutaway
/** the tile whose patch lets go (column 2, row 3: inside the array, clear of the posts, the hand and the spine in the
 *  cutaway view) */
export const LOST_TILE = 3 * P3D.COLS + 2;
/** its neighbours in the same row (the rail it shares with them carries its share across to them) */
export const LOST_NEIGH = [3 * P3D.COLS + 1, 3 * P3D.COLS + 3];
/** the load shares while one patch has let go (lost 0..1): its spring goes slack, its two neighbours on the rail take
 *  up its share, every other spring carries a hair more (23 instead of 24 share the same load) */
export const shareLost = (lost: number) => allTiles(1).map((_, i) => (i === LOST_TILE ? 1 - 0.92 * lost : LOST_NEIGH.includes(i) ? 1 + 0.4 * lost : 1 + 0.03 * lost));
export const contactLost = (lost: number, base = 1) => allTiles(base).map((x, i) => (i === LOST_TILE ? x * (1 - 0.88 * lost) : x));
export const slipLost = (lost: number) => allTiles(0).map((_, i) => (i === LOST_TILE ? 3.2 * lost : 0));
export type SpringView = {yaw: number; pitch: number; persp: number};
/** the cutaway's view: from his side (+w, the back of his fist toward us, as A and the bay), a little behind and above,
 *  so the fist sits to the right of the bay and all 24 springs are clear of it */
export const SPRING_VIEW: SpringView = {yaw: 34, pitch: 15, persp: 1150};
export const SPRING_CAM: Cam = {x: 30, y: 30, z: 4.8};
/** the bay's own view of the pad (its oblique projection: yaw 14, pitch 2.3, orthographic) and the bay's hand-over
 *  framing (shots8: HAND_Z 3.2 bay units -> 3.2 x 0.62 px/mm, the pad 30 bay units left of centre) */
export const SPRING_BAY_VIEW: SpringView = {yaw: 14, pitch: 2.3, persp: 0};
export const SPRING_BAY_CAM: Cam = {x: 30 / 0.62, y: 0, z: 3.2 * 0.62};
/** the opening framing: the bay's view, closer on the hand and the pad */
export const SPRING_OPEN_CAM: Cam = {x: 46, y: 18, z: 3.0};
/** C (film 528-664): load 0..1 (the spine's travel; the strap straightens with it), cover 1 on .. 0 cut away (a
 *  section plane; the near side wall is sectioned and the load emphasis comes up as it goes), lost 0..1 (one tile's
 *  patch lets go and comes back), contact (base contact of the tiles, default 0.8 + 0.2 load); tether / emph / cut /
 *  grip override the defaults; view (yaw, pitch, persp; persp 0 = orthographic) and cam the framing; arm (default
 *  ARM_BAY, the rig's arm, so the end matches the bay). */
export const SpringScene8: React.FC<{id: string; load: number; cover: number; lost?: number; contact?: number; tether?: number; emph?: number; cut?: number; grip?: number; cam?: Cam; view?: SpringView; arm?: ArmSpec}> = ({
  id,
  load,
  cover,
  lost = 0,
  contact,
  tether,
  emph,
  cut,
  grip,
  cam = SPRING_CAM,
  view = SPRING_VIEW,
  arm = ARM_BAY,
}) => {
  const l = clamp(load), c = clamp(cover), ls = clamp(lost);
  const open = 1 - c;
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp > 0 ? view.persp : undefined,
    load: l,
    contact: contactLost(ls, contact ?? 0.8 + 0.2 * l),
    share: shareLost(ls),
    slip: slipLost(ls),
    cover: c,
    cut: cut ?? sm(open * 1.6),
    emph: emph ?? sm(open * 1.4),
    gap: 0,
    tilt: 0,
    slide: 0,
    surface: 'none',
    hand: H_BAR,
    grip: grip ?? 0.88 + 0.12 * l,
    arm,
    strap: 2400,
    tether: tether ?? tetherOf(l),
    strapLean: {u: 0.24, w: 0},
    shadow: 1,
    shadowDir: {v: 9, w: -5},
    contactLine: 0.45,
    reflect: 0,
  };
  const em = st.emph ?? 0;
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <defs>
          {/* the change in emphasis: the world behind knocked back a little while the mechanism is open */}
          <filter id={`${id}-kb`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.24 * em, '#8C9EA8')} />
          </filter>
        </defs>
        <g filter={em > 0.01 ? `url(#${id}-kb)` : undefined}>
          <Facade id={`${id}-f`} st={st} o={{mullions: [-600, 1450], transom: 900, z: cam.z, reflect: 0, room: 'flat', sheenW: -420}} />
        </g>
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------------ recommended curves
// Pure functions of the FILM frame for each shot (the integrator may use them as they are or as a reference).
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t))});
/** A, film 24-70: the load comes on from 0.6 to 1 over the first 12 frames (ease out) with a small damped settle; the
 *  sheens drift; one slow push in */
export const contactShot = (f: number) => {
  const u = clamp((f - 24) / 12);
  const settle = f > 36 ? Math.sin((f - 36) * 0.55) * Math.exp(-(f - 36) * 0.16) : 0;
  const load = clamp(0.6 + 0.4 * (1 - Math.pow(1 - u, 3)) - 0.03 * Math.abs(settle), 0, 1);
  const cam = lerpCam({x: 78, y: 150, z: 3.4}, {x: 80, y: 146, z: 3.6}, ss5(f, 24, 70));
  return {load, drift: clamp((f - 24) / 46), cam};
};
/** B, film 894-930 (the rig's padR: carried up, it arrives a little high at 897, closes on the glass and touches at
 *  902, then loads 902-920 as he rises onto it): slide 70 -> -8 mm (894-898, the pad comes up into place), gap 45 ->
 *  0 mm (easing out onto the glass, 894-902), load 0 -> 1 (902-922); a slow push in */
export const surfaceShot = (f: number) => {
  const a = clamp((f - 894) / 8);
  const gap = 45 * Math.pow(1 - a, 2.2);
  const slide = f < 898 ? lerp(70, -8, 1 - Math.pow(1 - clamp((f - 894) / 4), 2)) : lerp(-8, 0, ss5(f, 898, 903));
  const load = clamp(0.13 * ss5(f, 902, 904) + 0.87 * ss5(f, 903, 920));
  const cam = lerpCam({x: -16, y: 44, z: 3.45}, {x: -12, y: 38, z: 3.7}, ss5(f, 894, 930));
  return {gap, slide, load, cam};
};
/** C, film 528-664: on the hand and the pad as the bay sees them (loaded, as in the shot before); the camera comes
 *  round a little and in (530-552) while he eases his weight off the stirrup (536-548: the strap slackens a touch, the
 *  spine rises) and the cover is cut away (540-551); "Special springs spread the load,": he stands back in (552-578):
 *  the strap pulls straight, the lug and spine travel, every spring stretches together; "so one little patch": one
 *  patch lets go (584-598; the camera leans in, 580-596) and holds there while its neighbours take its share; "doesn't
 *  have to hold you up alone.": its contact returns and the load evens out (616-632); the cover is restored (632-644)
 *  and the camera returns to the bay's view and the bay's hand-over framing (640-664). */
export const springShot = (f: number) => {
  const o = ss5(f, 530, 552) * (1 - ss5(f, 640, 662));
  const view: SpringView = {yaw: lerp(SPRING_BAY_VIEW.yaw, SPRING_VIEW.yaw, o), pitch: lerp(SPRING_BAY_VIEW.pitch, SPRING_VIEW.pitch, o), persp: lerpPersp(SPRING_BAY_VIEW.persp, SPRING_VIEW.persp, o)};
  const cover = 1 - ss5(f, 540, 551) + ss5(f, 632, 644);
  const load = 1 - 0.75 * ss5(f, 536, 548) + 0.75 * ss5(f, 552, 578);
  const lost = ss5(f, 584, 598) * (1 - ss5(f, 616, 632));
  const lostCam: Cam = {x: 18, y: 30, z: 5.2};
  let cam = lerpCam(SPRING_OPEN_CAM, SPRING_CAM, ss5(f, 530, 552));
  cam = lerpCam(cam, lostCam, ss5(f, 580, 596) * (1 - ss5(f, 618, 636)));
  cam = lerpCam(cam, SPRING_BAY_CAM, ss5(f, 640, 664));
  return {load, cover, lost, view, cam};
};
