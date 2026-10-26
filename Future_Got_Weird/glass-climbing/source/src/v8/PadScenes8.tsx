// Glass Climbing V8: the three pad close-ups, each a full-frame scene and a pure function of its parameters.
//   ContactScene8   (A, film 24-70  "against a glass wall,"): outside, oblique: the loaded pad on a facade pane, the
//                   hand closed on its handle, the forearm and the tee's sleeve leaving frame; the thin contact edge, a
//                   restrained reflection, and a small response as the load comes on (spine/handle travel in the cover's
//                   slots, the strap straightening, the contact line darkening).
//   SurfaceScene8   (B, film 894-930 "They need a smooth surface"): from inside the building looking out through the
//                   glass: the pad arrives, touches, and as the load comes on every one of its 24 tiles wets from the
//                   middle out, evenly; his hand, forearm and silhouette behind it, muted by the glass; the window frame,
//                   the sky and the city far below.
//   SpringScene8    (C, film 528-664 "Special springs spread the load, so one little patch doesn't have to hold you up
//                   alone."): outside, behind the pad: the cover lifts off, the near wall is sectioned; under one load
//                   the strap straightens, the lug and spine travel, every spring stretches together; one tile's patch
//                   lets go (its spring slackens, its neighbours take up its share, the rest keep theirs), the contact
//                   returns, the load evens out, the cover goes back on, and we are back on the hand on the handle.
// Every scene draws in pad millimetres (Pad8's axes and perspective camera); the 2D cam (dc/camera Cam, Layer at
// depth 1) frames those millimetres: screen = (W/2 + (x - cam.x) z, H/2 + (y - cam.y) z), with x, y the pad view's
// screen millimetres (the pad centre is 0, 0).
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, fmt, hash, lerp, P} from '../dc/math';
import {H, W} from '../lib';
import {H_BAR} from '../world/rig';
import {Head} from '../dc/Head';
import {EX} from '../world/pose';
import {allTiles, ARM_DROP, ARM_REACH, ArmSpec, gripGeo, travelOf, P3, P3D, Pad3D, Pad3DState, PadReflection, PadView, PH, Proj, viewOf} from './Pad8';

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
const boxFaces = (vw: PadView, u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, color: string, ink: number, key: string, opts: {stroke?: string; skip?: string[]} = {}) => {
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
    const col = k >= 0 ? lit(color, 0.3 * k) : shade(color, -0.3 * k);
    const d = path(vw.clipFixed(pts));
    if (!d) continue;
    out.push({d: vw.csF(c).D, node: <path key={`${key}${nm}`} d={d} fill={col} stroke={opts.stroke ?? INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />});
  }
  return out.sort((a, b) => a.d - b.d).map((o) => o.node);
};

// ------------------------------------------------------------------------------------------------ outside: the facade
/** the curtain wall seen from outside (A, C): the room behind the glass (dim, a little depth), the glass with the sky
 *  and the street's far side mirrored in it (stronger toward grazing), the spandrel below the transom, the pad's own
 *  reflection, then the mullions and the transom in front of the glass. */
type FacadeOpts = {mullions: number[]; transom: number; z: number; reflect: number; drift?: number; fresnel?: [number, number]};
const Facade: React.FC<{id: string; st: Pad3DState; o: FacadeOpts}> = ({id, st, o}) => {
  const vw = viewOf({...st, gap: 0, tilt: 0, slide: 0});
  const ink = (1.5 / o.z) * 1.4;
  const S = 9000;
  const T = o.transom; // the transom's centre line (v); the spandrel hides the slab below it
  const drift = o.drift ?? 0;
  // the room: floor, ceiling, back wall, a pair of columns, rows of ceiling lights (all dim, cool)
  const FL = T + 140, CE = T - 2750, BK = -7200;
  const room: React.ReactNode[] = [];
  room.push(<path key="bk" d={quad(vw, [{u: BK, v: CE, w: -S}, {u: BK, v: CE, w: S}, {u: BK, v: FL, w: S}, {u: BK, v: FL, w: -S}])} fill="#5F7682" />);
  room.push(<path key="ce" d={quad(vw, [{u: -30, v: CE, w: -S}, {u: -30, v: CE, w: S}, {u: BK, v: CE, w: S}, {u: BK, v: CE, w: -S}])} fill="#6E8692" />);
  room.push(<path key="fl" d={quad(vw, [{u: -30, v: FL, w: -S}, {u: -30, v: FL, w: S}, {u: BK, v: FL, w: S}, {u: BK, v: FL, w: -S}])} fill="#3E525D" />);
  // light panels on the ceiling (pale, in rows going back into the room)
  for (let r = 0; r < 4; r++)
    for (let c = -4; c <= 4; c++) {
      const u0 = -900 - r * 1600, w0 = c * 1800 - 300;
      room.push(<path key={`lp${r}${c}`} d={quad(vw, [{u: u0, v: CE + 2, w: w0}, {u: u0, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0}])} fill="#B9CDD5" opacity={0.5} />);
    }
  // columns and a low partition (desk-height shapes), back in the room
  for (const w of [-3400, 2200]) room.push(...boxFaces(vw, -3900, -3500, CE, FL, w, w + 400, '#53697A', 0, `col${w}`, {stroke: 'none'}));
  room.push(...boxFaces(vw, -2600, -1900, FL - 760, FL, -1600, 900, '#4B606C', 0, 'desk', {stroke: 'none'}));
  // the vision glass above the transom (the room seen through it), the spandrel below (opaque)
  const vision = quad(vw, [{u: 0, v: -S, w: -S}, {u: 0, v: -S, w: S}, {u: 0, v: T, w: S}, {u: 0, v: T, w: -S}]);
  const spandrel = quad(vw, [{u: 0, v: T, w: -S}, {u: 0, v: T, w: S}, {u: 0, v: T + 1200, w: S}, {u: 0, v: T + 1200, w: -S}]);
  // reflection strength: grazing (far along the facade) reflects more; the screen direction the facade recedes in
  const near = vw.fixed({u: 0, v: 0, w: 600}), far = vw.fixed({u: 0, v: 0, w: -1600});
  const up = vw.fixed({u: 0, v: -900, w: 0}), dn = vw.fixed({u: 0, v: 900, w: 0});
  // the street's far side, mirrored in the glass (u -> -u): a few tall blocks, flat and pale, faint
  const blocks: React.ReactNode[] = [];
  const BL: [number, number, number, number][] = [
    [-26000, -9000, -3000, -42000],
    [-24000, -2500, 4000, -30000],
    [-28000, 4500, 12000, -48000],
    [-25000, 12500, 20000, -36000],
    [-27000, -16000, -9500, -26000],
  ];
  BL.forEach(([u, w0, w1, top], i) => {
    const d = quad(vw, [{u, v: top, w: w0}, {u, v: top, w: w1}, {u, v: 60000, w: w1}, {u, v: 60000, w: w0}]);
    blocks.push(<path key={i} d={d} fill={i % 2 ? '#D9E6EA' : '#C6D7DD'} />);
    // their window bands
    for (let k = 0; k < 14; k++) {
      const v = top + 1400 + k * 3600;
      const dd = quad(vw, [{u: u + 1, v, w: w0 + 300}, {u: u + 1, v, w: w1 - 300}, {u: u + 1, v: v + 1500, w: w1 - 300}, {u: u + 1, v: v + 1500, w: w0 + 300}]);
      blocks.push(<path key={`${i}w${k}`} d={dd} fill="#9FB6BF" opacity={0.55} />);
    }
  });
  // mullions (vertical) and the transom: pale aluminium caps standing out of the glass, a dark gasket line at the glass
  const metal = '#C3CDD3';
  const frame: {d: number; node: React.ReactNode}[] = [];
  for (const m of o.mullions) {
    const faces = boxFaces(vw, 0, 62, -S, S, m - 28, m + 28, metal, ink, `m${m}`);
    frame.push({d: vw.csF({u: 30, v: 0, w: m}).D, node: <g key={`m${m}`}>{faces}</g>});
  }
  const tr = boxFaces(vw, 0, 48, T - 24, T + 24, -S, S, metal, ink, 'tr');
  frame.push({d: -1e6, node: <g key="tr">{tr}</g>});
  frame.sort((a, b) => a.d - b.d);
  const gasket = (pts: P3[]) => path(vw.clipFixed(pts));
  // reflections on the pane (they belong to the glass and recede with it): soft vertical bands, the far street's
  // towers, their tops a ragged reflected skyline
  const RB: [number, number, string, number][] = [
    [-160, 240, '#7C9DAC', -2400],
    [-560, 480, '#B5CDD7', -4200],
    [-1280, 360, '#89A7B5', -3000],
    [-2050, 900, '#C2D6DE', -5200],
    [-3350, 620, '#91AEBB', -2700],
    [-4600, 1100, '#BACFD8', -4400],
    [330, 420, '#86A4B2', -3500],
    [880, 700, '#BACFD8', -4700],
  ];
  const rbands = RB.map(([w0, wd, c, top], i) => (
    <path key={`rb${i}`} d={quad(vw, [{u: 0.3, v: top, w: w0}, {u: 0.3, v: top, w: w0 + wd}, {u: 0.3, v: T, w: w0 + wd}, {u: 0.3, v: T, w: w0}])} fill={c} opacity={0.75} />
  ));
  // the curtain wall's inner members seen through the glass (deeper than the caps outside; parallax gives depth)
  const inner: React.ReactNode[] = [];
  for (const m of o.mullions) inner.push(...boxFaces(vw, -190, -24, -S, T, m - 26, m + 26, '#5B6F7B', ink * 0.6, `im${m}`, {stroke: '#33434C'}));
  inner.push(...boxFaces(vw, -210, -24, T - 30, T + 40, -S, S, '#5B6F7B', ink * 0.6, 'isl', {stroke: '#33434C'}));
  const sheens = [-700 + drift * 160, 250 + drift * 160].map((w0, i) => (
    <path key={i} d={quad(vw, [{u: 0.5, v: -S, w: w0}, {u: 0.5, v: -S, w: w0 + 220 + i * 120}, {u: 0.5, v: S, w: w0 + 220 + i * 120 - 3800}, {u: 0.5, v: S, w: w0 - 3800}])} fill="#FFFFFF" opacity={0.08 + 0.05 * i} />
  ));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-vis`}>
          <path d={vision} />
        </clipPath>
        {/* Fresnel: the reflection is faint where we look into the glass and strong toward grazing */}
        <linearGradient id={`${id}-fr`} gradientUnits="userSpaceOnUse" x1={fmt(near.x)} y1={fmt(near.y)} x2={fmt(far.x)} y2={fmt(far.y)}>
          <stop offset="0" stopColor="#FFF" stopOpacity={o.fresnel?.[0] ?? 0.42} />
          <stop offset="1" stopColor="#FFF" stopOpacity={o.fresnel?.[1] ?? 0.9} />
        </linearGradient>
        <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
          <rect x={-20000} y={-20000} width={40000} height={40000} fill={`url(#${id}-fr)`} />
        </mask>
        <linearGradient id={`${id}-sk`} gradientUnits="userSpaceOnUse" x1={fmt(up.x)} y1={fmt(up.y)} x2={fmt(dn.x)} y2={fmt(dn.y)}>
          <stop offset="0" stopColor="#9EC6DC" />
          <stop offset="0.55" stopColor="#C9E0EA" />
          <stop offset="1" stopColor="#E8F0EE" />
        </linearGradient>
        <linearGradient id={`${id}-sp`} gradientUnits="userSpaceOnUse" x1={fmt(near.x)} y1={fmt(near.y)} x2={fmt(far.x)} y2={fmt(far.y)}>
          <stop offset="0" stopColor="#3B4D57" />
          <stop offset="1" stopColor="#647C89" />
        </linearGradient>
      </defs>
      <rect x={-6000} y={-6000} width={12000} height={12000} fill="#4E6571" />
      <g clipPath={`url(#${id}-vis)`}>
        {room}
        {inner}
        {/* the sky and the street's far side, mirrored in the glass */}
        <g mask={`url(#${id}-fm)`}>
          <path d={vision} fill={`url(#${id}-sk)`} />
          {blocks}
          {rbands}
        </g>
        <path d={vision} fill="#4F8A9A" opacity={0.12} />
        {sheens}
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
      {/* the gaskets where the frame meets the glass */}
      {o.mullions.map((m) => (
        <g key={m}>
          <path d={gasket([{u: 0.6, v: -S, w: m - 34}, {u: 0.6, v: S, w: m - 34}, {u: 0.6, v: S, w: m - 28}, {u: 0.6, v: -S, w: m - 28}])} fill="#222C31" />
          <path d={gasket([{u: 0.6, v: -S, w: m + 28}, {u: 0.6, v: S, w: m + 28}, {u: 0.6, v: S, w: m + 34}, {u: 0.6, v: -S, w: m + 34}])} fill="#222C31" />
        </g>
      ))}
      <path d={gasket([{u: 0.6, v: T - 30, w: -S}, {u: 0.6, v: T - 30, w: S}, {u: 0.6, v: T - 24, w: S}, {u: 0.6, v: T - 24, w: -S}])} fill="#222C31" />
      {frame.map((f) => f.node)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ A: contact close-up
export type ContactView = {yaw: number; pitch: number; persp: number};
export const CONTACT_VIEW: ContactView = {yaw: 24, pitch: -20, persp: 1100};
export const CONTACT_CAM: Cam = {x: 92, y: 92, z: 3.2};
/** A (film 24-70): load 0..1 (the shot opens at about 0.6, reaches 1 by its 12th frame, then settles); drift 0..1 a
 *  slow slide of the sheens across the glass over the shot (optional); cam / view override the framing. */
export const ContactScene8: React.FC<{id: string; load: number; drift?: number; cam?: Cam; view?: ContactView; arm?: ArmSpec}> = ({id, load, drift = 0, cam = CONTACT_CAM, view = CONTACT_VIEW, arm = ARM_REACH}) => {
  const l = clamp(load);
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp,
    load: l,
    contact: allTiles(0.5 + 0.5 * l),
    cover: 1,
    gap: 0,
    tilt: 0,
    slide: 0,
    surface: 'none',
    hand: H_BAR,
    arm,
    strap: 2400,
    tether: sm((l - 0.5) / 0.42),
    shadow: 1,
    reflect: 0,
  };
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <Facade id={`${id}-f`} st={st} o={{mullions: [420, -1250], transom: 760, z: cam.z, reflect: 0.11, drift}} />
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
  const hazeOf = (u: number) => clamp(0.1 + Math.log(Math.max(1, u / 40000)) * 0.3, 0, 0.86);
  const block = (u0: number, u1: number, w0: number, w1: number, top: number, base: string, key: string, windows = true) => {
    const k = hazeOf(u0);
    const col = mix(base, HAZE, k);
    const nodes: React.ReactNode[] = [...boxFaces(vw, u0, u1, top, GND, w0, w1, col, 0, key, {stroke: 'none'})];
    if (windows && k < 0.7) {
      for (let v = top + 1400; v < GND - 1500; v += 3300) {
        const d = quad(vw, [{u: u0 - 1, v, w: w0 + 900}, {u: u0 - 1, v, w: w1 - 900}, {u: u0 - 1, v: v + 1200, w: w1 - 900}, {u: u0 - 1, v: v + 1200, w: w0 + 900}]);
        if (d) nodes.push(<path key={`${key}w${v}`} d={d} fill={mix(col, '#55788A', 0.3 * (1 - k))} />);
      }
      // a rooftop plant box
      const pw = w0 + (w1 - w0) * 0.3;
      nodes.push(...boxFaces(vw, u0 + 6000, u0 + 11000, top - 2600, top, pw, pw + 5000, mix(col, '#FFFFFF', 0.12), 0, `${key}p`, {stroke: 'none'}));
    }
    items.push({d: -u0, node: <g key={key}>{nodes}</g>});
  };
  // the far skyline (hazy towers just over the horizon)
  for (let i = 0; i < 60; i++) {
    const u = 1400000 + hash(i, 3) * 900000;
    const w = -1800000 + i * 60000 + hash(i, 4) * 50000;
    const wd = 16000 + hash(i, 5) * 22000;
    const h = 40000 + hash(i, 6) * 110000 * (hash(i, 7) > 0.8 ? 1.6 : 0.8);
    block(u, u + wd, w, w + wd, GND - h, '#B9CDD7', `s${i}`, false);
  }
  // the blocks below: rows of low and mid-rise buildings with streets between them, their roofs seen from above
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

/** his body behind the pad (seen from inside, against the sky, muted by the glass): the striped tee's torso, the neck,
 *  his head (the crew's Head, looking up at the pad, straining), and the far arm going up out of frame toward his
 *  other pad; the near arm is the pad's own (Pad8). S = his right shoulder (pad axes). */
const Silhouette: React.FC<{id: string; vw: PadView; S: P3; z: number; effort: number}> = ({id, vw, S, z, effort}) => {
  const pj = (p: P3) => vw.fixed(p);
  const ink = (2.4 / z) * 1;
  const L: P3 = {u: S.u + 40, v: S.v + 10, w: S.w - 340};
  const neck: P3 = {u: S.u + 30, v: S.v - 50, w: S.w - 170};
  const head: P3 = {u: S.u + 45, v: S.v - 235, w: S.w - 215};
  const hipV = S.v + 560;
  const pts = (arr: P3[]) => arr.map((q) => pj(q));
  const tor = pts([
    {u: S.u + 5, v: S.v - 25, w: S.w + 30},
    {u: S.u + 20, v: S.v + 160, w: S.w + 18},
    {u: S.u + 60, v: hipV, w: S.w - 20},
    {u: L.u + 30, v: hipV, w: L.w + 20},
    {u: L.u, v: L.v + 160, w: L.w - 18},
    {u: L.u - 5, v: L.v - 25, w: L.w - 30},
    {u: neck.u, v: neck.v - 5, w: neck.w - 85},
    {u: neck.u, v: neck.v - 5, w: neck.w + 85},
  ]);
  const torD = `M${tor.map((q) => P(q)).join(' L')} Z`;
  const stripes: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const v0 = S.v + 30 + i * 112, v1 = v0 + 54;
    stripes.push(<path key={i} d={quad(vw, [{u: S.u - 40, v: v0, w: S.w + 90}, {u: S.u - 40, v: v0, w: L.w - 90}, {u: S.u - 40, v: v1, w: L.w - 90}, {u: S.u - 40, v: v1, w: S.w + 90}])} fill="#FFC744" />);
  }
  const Hc = pj(head);
  const N0 = pj({u: neck.u, v: neck.v + 30, w: neck.w}), N1 = pj({u: head.u, v: head.v + 80, w: head.w});
  const fa0 = pj(L), fa1 = pj({u: L.u - 70, v: L.v - 430, w: L.w - 150}), fa2 = pj({u: L.u - 240, v: L.v - 800, w: L.w - 170});
  const expr = {...EX.strain, gx: 0.55, gy: -0.95, browIn: 0.45 * effort + 0.2, browDown: 0.5 * effort, teeth: 0.7 * effort, smile: -0.25 * effort};
  return (
    <g>
      <defs>
        <clipPath id={`${id}-tc`}>
          <path d={torD} />
        </clipPath>
      </defs>
      {/* far arm (skin, his sleeve at the shoulder), behind the torso */}
      <path d={`M${P(fa0)} L${P(fa1)} L${P(fa2)}`} stroke={INK} strokeWidth={fmt(64 * fa1.s + 2 * ink)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${P(fa0)} L${P(fa1)} L${P(fa2)}`} stroke="#EBC2A2" strokeWidth={fmt(64 * fa1.s)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {(() => {
        const a = pj({u: L.u - 10, v: L.v - 10, w: L.w - 10}), b = pj({u: L.u - 30, v: L.v - 150, w: L.w - 55});
        return (
          <g>
            <path d={`M${P(a)} L${P(b)}`} stroke={INK} strokeWidth={fmt(92 * a.s + 2 * ink)} strokeLinecap="round" />
            <path d={`M${P(a)} L${P(b)}`} stroke="#F3F5F7" strokeWidth={fmt(92 * a.s)} strokeLinecap="round" />
          </g>
        );
      })()}
      <path d={`M${P(N0)} L${P(N1)}`} stroke={INK} strokeWidth={fmt(92 * N0.s + 2 * ink)} strokeLinecap="round" />
      <path d={`M${P(N0)} L${P(N1)}`} stroke="#E2B595" strokeWidth={fmt(92 * N0.s)} strokeLinecap="round" />
      <path d={torD} fill="#F3F5F7" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-tc)`}>
        {stripes}
        {/* the tee's form: shadow down its far side (the sky is behind him) */}
        <path d={torD} fill="#8FA4B2" opacity={0.25} />
      </g>
      <Head id={`${id}-hd`} c={{x: Hc.x, y: Hc.y}} R={100 * Hc.s} roll={0} turn={0.12} expr={expr} inkW={3.8 / (z * Math.max(0.05, Hc.s))} />
    </g>
  );
};

export type SurfaceView = {yaw: number; pitch: number; persp: number};
export const SURFACE_VIEW: SurfaceView = {yaw: -80, pitch: 8, persp: 1150};
export const SURFACE_CAM: Cam = {x: 0, y: 80, z: 2.8};
/** his arm for B: the hand on the bar, the arm down and in to his shoulder (he rises onto the pad; his head is to the
 *  pad's left as we see it, clear of the strap) */
export const ARM_RISE: ArmSpec = {elbow: {u: 70, v: 205, w: 10}, shoulder: {u: 130, v: 225, w: -95}};
/** contact for B: nothing while the pad is off the glass; at the touch a first patch in every tile, spreading to the
 *  whole tile as the load comes on (the same in all 24) */
export const surfaceContact = (gap: number, load: number) => (gap > 0.4 ? 0 : clamp(0.14 + 0.86 * clamp(load)) * clamp(1 - gap / 0.4));
/** B (film 894-930): gap (mm, about 30 -> 0: the pad arrives at the glass), load 0..1 (after the touch: the tiles wet
 *  evenly from the middle out), contact (optional per-tile override, else surfaceContact(gap, load)); cam / view
 *  override the framing. */
export const SurfaceScene8: React.FC<{id: string; gap: number; load: number; contact?: number[]; cam?: Cam; view?: SurfaceView}> = ({id, gap, load, contact, cam = SURFACE_CAM, view = SURFACE_VIEW}) => {
  const l = clamp(load);
  const ct = contact ?? allTiles(surfaceContact(gap, l));
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp,
    load: l,
    contact: ct,
    cover: 1,
    gap: Math.max(0, gap),
    tilt: 0,
    slide: 0,
    surface: 'none',
    hand: H_BAR,
    arm: ARM_RISE,
    strap: 2400,
    tether: 0.35 + 0.65 * l,
    strapLean: {u: 0.1, w: 0.05},
    shadow: 0,
    ridges: 0.6,
  };
  const vw = viewOf(st);
  const z = cam.z;
  const ink = (1.5 / z) * 1.4;
  // his right shoulder: the arm's end (the grip's wrist + the arm), for the silhouette
  const g = gripGeo(travelOf(l) + 3, 1, 1, ARM_RISE);
  const sh = g.shoulder ?? {u: 400, v: 450, w: -60};
  const gapM = {u: st.gap, v: 0, w: 0};
  const S = {u: sh.u + gapM.u, v: sh.v, w: sh.w};
  // the window, from inside: the glass (inner face u = -24) between a mullion to the right and a transom above
  const BIG = 9000;
  const MW = 168, TR = -222;
  const glass = quad(vw, [{u: -24, v: TR, w: -BIG}, {u: -24, v: TR, w: MW}, {u: -24, v: BIG, w: MW}, {u: -24, v: BIG, w: -BIG}]);
  const frameFaces = [
    ...boxFaces(vw, -210, -24, TR - 70, BIG, MW, MW + 64, '#CDD4D9', ink, 'im'),
    ...boxFaces(vw, -210, -24, -BIG, TR, -BIG, MW + 64, '#CDD4D9', ink, 'it'),
  ];
  const sheen0 = quad(vw, [{u: -24.5, v: -BIG, w: -300}, {u: -24.5, v: -BIG, w: -150}, {u: -24.5, v: BIG, w: -1100}, {u: -24.5, v: BIG, w: -1250}]);
  const sheen1 = quad(vw, [{u: -24.5, v: -BIG, w: 40}, {u: -24.5, v: -BIG, w: 95}, {u: -24.5, v: BIG, w: -810}, {u: -24.5, v: BIG, w: -865}]);
  const effort = clamp(l * 1.2);
  const dof0 = vw.fixed({u: 0, v: PH / 2 + 70, w: 0}).y, dof1 = dof0 + 230;
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <defs>
          <clipPath id={`${id}-gl`}>
            <path d={glass} />
          </clipPath>
          {/* he is 0.4 m behind the glass and out of focus: muted toward the sky's haze and softened */}
          <filter id={`${id}-mute`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.46, '#8FA9B8')} result="m" />
            <feGaussianBlur in="m" stdDeviation={fmt(4.6)} />
          </filter>
          <filter id={`${id}-dof`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.3, '#8FA9B8')} result="m" />
            <feGaussianBlur in="m" stdDeviation={fmt(3.4)} />
          </filter>
          <linearGradient id={`${id}-dg`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(dof0)} x2="0" y2={fmt(dof1)}>
            <stop offset="0" stopColor="#000" />
            <stop offset="1" stopColor="#FFF" />
          </linearGradient>
          <mask id={`${id}-dm`} maskUnits="userSpaceOnUse" x={-8000} y={-8000} width={16000} height={16000}>
            <rect x={-8000} y={-8000} width={16000} height={16000} fill={`url(#${id}-dg)`} />
          </mask>
          {/* the glass mutes what is behind it a little */}
          <filter id={`${id}-glass`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={muteMatrix(0.1, '#7FA2B2')} />
          </filter>
        </defs>
        <rect x={-8000} y={-8000} width={16000} height={16000} fill="#3C4B55" />
        <g clipPath={`url(#${id}-gl)`}>
          <CityOut id={`${id}-c`} vw={vw} />
          <g filter={`url(#${id}-mute)`}>
            <Silhouette id={`${id}-s`} vw={vw} S={S} z={z} effort={effort} />
          </g>
          <g filter={`url(#${id}-glass)`}>
            <Pad3D id={`${id}-p`} st={st} z={z} />
          </g>
          {/* depth of field: the pad at the glass is sharp; his arm toward the shoulder and the strap toward his feet
              fall out of focus (a blurred copy faded in below the pad) */}
          <g mask={`url(#${id}-dm)`} filter={`url(#${id}-dof)`}>
            <Pad3D id={`${id}-pb`} st={st} z={z} />
          </g>
          <path d={sheen0} fill="#FFFFFF" opacity={0.13} />
          <path d={sheen1} fill="#FFFFFF" opacity={0.08} />
        </g>
        {frameFaces}
      </Layer>
    </Svg>
  );
};
/** an feColorMatrix that blends every colour a fraction k toward c */
const muteMatrix = (k: number, c: string) => {
  const n = parseInt(c.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const a = 1 - k;
  return `${a} 0 0 0 ${fmt(k * r)}  0 ${a} 0 0 ${fmt(k * g)}  0 0 ${a} 0 ${fmt(k * b)}  0 0 0 1 0`;
};

// ------------------------------------------------------------------------------------------------ C: springs cutaway
/** the tile whose patch lets go (column 0, row 3: clear of the hand, the bar, the posts, the spine and its clamps in the
 *  cutaway view) */
export const LOST_TILE = 3 * P3D.COLS + 0;
/** its neighbours (beside it, above, below) */
export const LOST_NEIGH = [3 * P3D.COLS + 1, 2 * P3D.COLS + 0, 4 * P3D.COLS + 0];
/** the load shares while one patch has let go (lost 0..1): its spring goes slack, its neighbours take up its share,
 *  every other spring carries a hair more (23 instead of 24 share the same load) */
export const shareLost = (lost: number) => allTiles(1).map((_, i) => (i === LOST_TILE ? 1 - 0.92 * lost : LOST_NEIGH.includes(i) ? 1 + 0.36 * lost : 1 + 0.03 * lost));
export const contactLost = (lost: number, base = 1) => allTiles(base).map((x, i) => (i === LOST_TILE ? x * (1 - 0.88 * lost) : x));
export const slipLost = (lost: number) => allTiles(0).map((_, i) => (i === LOST_TILE ? 3.2 * lost : 0));
export type SpringView = {yaw: number; pitch: number; persp: number};
/** the cutaway's view: from behind his hand's palm side, a little above (the hand is clear of the bay) */
export const SPRING_VIEW: SpringView = {yaw: 124, pitch: 12, persp: 1150};
export const SPRING_CAM: Cam = {x: -10, y: 24, z: 5.45};
/** C (film 528-664): load 0..1 (the spine's travel; the strap straightens with it), cover 1 on .. 0 off (the cutaway;
 *  the near wall is sectioned and the load emphasis comes up as it goes), lost 0..1 (one tile's patch lets go and comes
 *  back), contact (base contact of the tiles, default 0.8 + 0.2 load); tether / emph / cut override the defaults;
 *  yaw / pitch / persp (view) and cam override the framing. */
export const SpringScene8: React.FC<{id: string; load: number; cover: number; lost?: number; contact?: number; tether?: number; emph?: number; cut?: number; grip?: number; cam?: Cam; view?: SpringView; arm?: ArmSpec}> = ({
  id,
  load,
  cover,
  lost = 0,
  contact,
  tether,
  emph,
  cut,
  grip = 1,
  cam = SPRING_CAM,
  view = SPRING_VIEW,
  arm = ARM_DROP,
}) => {
  const l = clamp(load), c = clamp(cover), ls = clamp(lost);
  const open = 1 - c;
  const st: Pad3DState = {
    yaw: view.yaw,
    pitch: view.pitch,
    persp: view.persp,
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
    grip,
    arm,
    strap: 2400,
    tether: tether ?? sm((l - 0.15) / 0.75),
    shadow: 1,
    reflect: 0,
  };
  const em = st.emph ?? 0;
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <g filter={em > 0.01 ? `url(#${id}-kb)` : undefined}>
          <Facade id={`${id}-f`} st={st} o={{mullions: [430, -1250], transom: 760, z: cam.z, reflect: 0.12 * (1 - em) + 0.03}} />
        </g>
        <defs>
          {/* the change in emphasis: the world behind knocked back a little while the mechanism is open */}
          <filter id={`${id}-kb`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={kbMatrix(0.22 * em)} />
          </filter>
        </defs>
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </Svg>
  );
};
/** an feColorMatrix that lowers contrast and saturation by k toward a mid blue-grey */
const kbMatrix = (k: number) => {
  const a = 1 - k;
  const m = {r: 0.55, g: 0.62, b: 0.66};
  return `${a} 0 0 0 ${fmt(k * m.r)}  0 ${a} 0 0 ${fmt(k * m.g)}  0 0 ${a} 0 ${fmt(k * m.b)}  0 0 0 1 0`;
};

// ------------------------------------------------------------------------------------------------ recommended curves
// Pure functions of the FILM frame for each shot (the integrator may use them as they are or as a reference).
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t))});
/** A, film 24-70: the load comes on from 0.6 to 1 over the first 12 frames with a small settle; a slow push in */
export const contactShot = (f: number) => {
  const u = clamp((f - 24) / 12);
  const settle = f > 36 ? Math.sin((f - 36) * 0.55) * Math.exp(-(f - 36) * 0.16) : 0;
  const load = clamp(0.6 + 0.4 * (1 - Math.pow(1 - u, 3)) + 0.035 * settle, 0, 1.04);
  const cam = lerpCam({x: 90, y: 92, z: 3.08}, {x: 95, y: 96, z: 3.32}, ss5(f, 24, 70));
  return {load, drift: clamp((f - 24) / 46), cam};
};
/** B, film 894-930: the pad comes onto the glass (gap 30 -> 0 mm, 894-904), touches, and the load comes on (904-926):
 *  every tile wets evenly from the middle out; a slow push in */
export const surfaceShot = (f: number) => {
  const a = clamp((f - 894) / 10);
  const gap = 30 * (1 - a * a);
  const load = ss5(f, 904, 926);
  const cam = lerpCam({x: 0, y: 80, z: 2.72}, {x: 2, y: 78, z: 2.95}, ss5(f, 894, 930));
  return {gap, load, cam};
};
/** C, film 528-664: on the hand from his side (as the bay sees it); the camera comes round behind as the cover lifts
 *  (528-552); the load comes on (548-578: the strap straightens, the lug and spine travel, every spring stretches);
 *  one patch lets go (584-598) and holds there (to 616) while its neighbours take its share; its contact returns and the
 *  load evens out (616-632); the cover goes back on (632-648) and the camera comes back round to the hand (642-664). */
export const SPRING_SIDE: SpringView = {yaw: 22, pitch: 3, persp: 1300};
export const SPRING_SIDE_CAM: Cam = {x: 70, y: 18, z: 3.15};
export const springShot = (f: number) => {
  const orbitIn = ss5(f, 528, 552), orbitOut = ss5(f, 642, 664);
  const o = orbitIn * (1 - orbitOut);
  const view: SpringView = {yaw: lerp(SPRING_SIDE.yaw, SPRING_VIEW.yaw, o), pitch: lerp(SPRING_SIDE.pitch, SPRING_VIEW.pitch, o), persp: lerp(SPRING_SIDE.persp, SPRING_VIEW.persp, o)};
  const cover = 1 - ss5(f, 532, 550) + ss5(f, 632, 648);
  const load = 0.15 + 0.85 * ss5(f, 548, 578);
  const lost = ss5(f, 584, 598) * (1 - ss5(f, 616, 632));
  // the camera: wide on the hand, in to the bay, a little closer on the patch that lets go, back out to the hand
  const lostCam: Cam = {x: 8, y: 26, z: 6.0};
  let cam = lerpCam(SPRING_SIDE_CAM, SPRING_CAM, orbitIn);
  cam = lerpCam(cam, lostCam, ss5(f, 580, 596) * (1 - ss5(f, 618, 636)));
  cam = lerpCam(cam, SPRING_SIDE_CAM, orbitOut);
  return {load, cover, lost, view, cam};
};

