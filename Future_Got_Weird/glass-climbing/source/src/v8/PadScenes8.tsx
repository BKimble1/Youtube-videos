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
import {clamp, fmt, lerp, P} from '../dc/math';
import {H, W} from '../lib';
import {H_BAR} from '../world/rig';
import {allTiles, ARM_REACH, P3, P3D, Pad3D, Pad3DState, PadReflection, PadView, PH, PW, Proj, tileVW, viewOf} from './Pad8';

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
      room.push(<path key={`lp${r}${c}`} d={quad(vw, [{u: u0, v: CE + 2, w: w0}, {u: u0, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0 + 600}, {u: u0 - 500, v: CE + 2, w: w0}])} fill="#B9CDD5" opacity={0.7} />);
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
export const CONTACT_VIEW: ContactView = {yaw: 18, pitch: 6, persp: 1300};
export const CONTACT_CAM: Cam = {x: 70, y: 150, z: 2.7};
/** A (film 24-70): load 0..1 (the shot opens at about 0.6, reaches 1 by its 12th frame, then settles); drift 0..1 a
 *  slow slide of the sheens across the glass over the shot (optional); cam / view override the framing. */
export const ContactScene8: React.FC<{id: string; load: number; drift?: number; cam?: Cam; view?: ContactView}> = ({id, load, drift = 0, cam = CONTACT_CAM, view = CONTACT_VIEW}) => {
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
    arm: ARM_REACH,
    strap: 2400,
    tether: sm((l - 0.5) / 0.42),
    shadow: 1,
    reflect: 0,
  };
  return (
    <Svg>
      <Layer cam={cam} depth={1}>
        <Facade id={`${id}-f`} st={st} o={{mullions: [420, -1250], transom: 760, z: cam.z, reflect: 0.2, drift}} />
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </Svg>
  );
};

export {tileVW, PW, PH, P3D, lerp, mix};
