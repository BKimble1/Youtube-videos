// Glass Climbing V7: the shot list (film frames at 30 fps, on the V6 narration, unchanged). Every shot is a pure
// function of the frame. What each shot adds and how it connects: production/V7_CHANGELOG.md.
// Camera rule (as V6): within a shot the camera holds or makes one eased move with no rebound; a scale change is one
// continuous path or an exact composition match.
// The loop: the slip, the swing back and the catch (F1, the end of the film) and the hook's first shot (H1) are one
// exterior camera move on the climb's looped time and in the top coordinates (climbTop), so the last frame and frame 0
// are consecutive frames of one move.
// No 3D puppet: the exterior views draw the 2D character over the perspective tower (Exterior7).
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp, V} from '../dc/math';
import {H, W} from '../lib';
import {camAt, camZoom, inOut, kOf, sm5} from '../camera';
import {mixHand} from '../dc/Hand';
import {H_BAR, H_BAR_OPEN} from '../world/rig';
import {KX, KY} from '../world/geo';
import {Lin} from '../dc/shade';
import {MicroContent, MicroState, MicroView, MW, UM} from '../v5/Micro5';
import {FieldState} from '../v5/Field5';
import {FieldView6} from '../v6/Field6';
import {MolecularContent5} from '../v5/Molecular5';
import {allTiles, Pad3D, Pad3DState, tileVW, viewOf} from '../v6/Pad6';
import {BayWorld5 as BayWorld7} from './Bay7';
import {C, CATCH_END, climbAt, climbTop, CYCLES, FRAMES, keyN, MM, PZ, ss, UY, Z_BRICK} from './climb7';
import {Cam3} from './Tower7';
import {Exterior7} from './Exterior7';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
/** a one-argument ease (0..1) as keyN's segment ease, which is called with (t, a, b) */
const E = (e: (x: number) => number) => (t: number, a: number, b: number) => e(clamp((t - a) / (b - a)));
const quadOut = (x: number) => 1 - (1 - x) * (1 - x);
export const CamOnly = React.createContext(false);
const BayShot: React.FC<{id: string; f: number; cam: Cam; nest?: React.ReactNode}> = ({id, f, cam, nest}) => {
  const camOnly = React.useContext(CamOnly);
  return <Svg><BayWorld7 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} f={f} nest={nest} man={!camOnly} gear={!camOnly} /></Svg>;
};
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <BayShot id={id} f={f} cam={cam} nest={nest} />;
type K = [number, number, number, number, ((x: number) => number)?];
const cam1 = (f: number, keys: K[]) => camAt(f, keys);
/** a pad close-up: the pad on its glass, the sky (through the glass) or the pane behind it */
const PadScene6: React.FC<{id: string; st: Pad3DState; cam: Cam}> = ({id, st, cam}) => {
  const through = Math.sin((st.yaw * Math.PI) / 180) < 0;
  return (
    <Svg>
      <Layer cam={cam} depth={3}>
        {through ? (
          <g>
            <Lin id={`${id}-sk`} d="M-3000,-3000 H3000 V3000 H-3000 Z" from={{x: 0, y: -1600}} to={{x: 0, y: 1600}} stops={[[0, '#8FC0DA'], [0.6, '#C8E2EC'], [1, '#E8EEE8']]} />
            {[-1400, -700, 300, 1100].map((x, i) => <rect key={i} x={x} y={-200 - i * 140} width={420 + i * 60} height={3000} fill="#7FA3B8" opacity={0.35} />)}
          </g>
        ) : st.surface === 'brick' ? (
          <rect x={-3000} y={-3000} width={6000} height={6000} fill="#8E4A35" />
        ) : (
          <Lin id={`${id}-gb`} d="M-3000,-3000 H3000 V3000 H-3000 Z" from={{x: 0, y: -1600}} to={{x: 0, y: 1600}} stops={[[0, '#9CC7D4'], [0.5, '#6A9DB0'], [1, '#3F6E82']]} />
        )}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </Svg>
  );
};
/** an exterior view: the 2D climber over the perspective tower; top: the climb's top coordinates (across the seam) */
const ext = (id: string, f: number, cam: Cam3, top = false) => {
  const camOnly = React.useContext(CamOnly);
  return <Exterior7 id={id} f={f} cam={cam} st={camOnly ? null : top ? climbTop(f) : climbAt(f)} />;
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
type P3 = {x: number; y: number; z: number};
const p3 = (x: number, y: number, z: number): P3 => ({x, y, z});
const lerp3 = (a: P3, b: P3, u: number) => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u)});
/** a camera path through keys (frame, x, y, z) as a C1 Hermite curve in (x, y, ln z): it starts from rest, passes the
 *  inner keys without stopping, and leaves the last key with the given velocity (per frame, in x, y, ln z) */
const pathCam = (f: number, keys: [number, number, number, number][], vEnd: [number, number, number] = [0, 0, 0]): Cam => {
  const P = keys.map(([t, x, y, z]) => ({t, v: [x, y, Math.log(z)]}));
  const n = P.length;
  if (f <= P[0].t) return {x: P[0].v[0], y: P[0].v[1], z: Math.exp(P[0].v[2])};
  if (f >= P[n - 1].t) {
    const dt = f - P[n - 1].t;
    return {x: P[n - 1].v[0] + vEnd[0] * dt, y: P[n - 1].v[1] + vEnd[1] * dt, z: Math.exp(P[n - 1].v[2] + vEnd[2] * dt)};
  }
  const tan = (i: number) => (i === 0 ? [0, 0, 0] : i === n - 1 ? vEnd : [0, 1, 2].map((k) => (P[i + 1].v[k] - P[i - 1].v[k]) / (P[i + 1].t - P[i - 1].t)));
  let i = 0;
  while (f > P[i + 1].t) i++;
  const t0 = P[i].t, t1 = P[i + 1].t, h = t1 - t0, s = (f - t0) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  const m0 = tan(i), m1 = tan(i + 1);
  const v = [0, 1, 2].map((k) => h00 * P[i].v[k] + h10 * h * m0[k] + h01 * P[i + 1].v[k] + h11 * h * m1[k]);
  return {x: v[0], y: v[1], z: Math.exp(v[2])};
};
/** his hips at a frame (bay units): the bay cameras are set from them */
const HIP = (f: number) => climbAt(f).pose;

// ------------------------------------------------------------------ the end and the hook: one exterior move (1095-FRAMES, 0-12)
/** the slip, the swing and the catch, from outside and a little above, looking along the facade with the street far
 *  below (held while he slips and swings); then one push in along his reach to the near pad as it meets the glass
 *  and catches him (frame 3), coming to rest on it at frame 9. On the looped time and in the top coordinates, so the
 *  last frame and frame 0 are consecutive frames of this move. */
const TAIL_A: Cam3 = {eye: p3(2.0, 32.3, 3.6), target: p3(0.55, 30.65, -1.6), f: 1500};
const TAIL_B: Cam3 = {eye: p3(0.75, 32.95, 0.95), target: p3(0.06, 32.35, -0.3), f: 1000};
const PUSH0 = 1138, PUSH1 = FRAMES + 9;
const camTail = (f: number): Cam3 => {
  const T = f < CATCH_END ? f + FRAMES : f;
  const u = sm5(clamp((T - PUSH0) / (PUSH1 - PUSH0)));
  return {eye: lerp3(TAIL_A.eye, TAIL_B.eye, u), target: lerp3(TAIL_A.target, TAIL_B.target, u), f: lerp(TAIL_A.f, TAIL_B.f, u)};
};
/** H1 (0-12) "If you": the near pad strikes the glass and catches his weight; his arm takes it, its strap snaps taut;
 *  the street far below (the end of the push) */
const H1: React.FC<{f: number}> = ({f}) => ext(`h1${f}`, f, camTail(f), true);
/** F1 (1095-FRAMES) "can't make the same contact.": the brick pad slips; his shoulder drops and he tips back, legs
 *  swinging out, held by the far pad on the glass: its strap goes taut and arrests him in a short arc; he swings back
 *  and reaches the loose pad to the glass (the push in that runs on into frame 0) */
const F1: React.FC<{f: number}> = ({f}) => ext(`f1${f}`, f, camTail(f), true);

// ------------------------------------------------------------------ 1. the hook (12-182)
/** H2 (12-39) "pressed these pads": three-quarter, outside: the whole of him hanging on the two pads, his shoes on
 *  nothing, the street and the traffic far below; he comes back to the glass (a slow push) */
const H2_A: Cam3 = {eye: p3(1.7, 29.6, 3.4), target: p3(0.5, 28.9, -1.6), f: 1300};
const camH2 = (f: number): Cam3 => ({...H2_A, f: lerp(1300, 1380, sm5(clamp((f - 12) / 27)))});
const H2: React.FC<{f: number}> = ({f}) => ext(`h2${f}`, f, camH2(f));
/** H3 (39-72) "against a glass wall,": close on his hands: both fists round their handles, both pads flat on the
 *  glass; the loaded pad's backing travels a little as his weight moves on it (static) */
const CAM_H3: Cam = {x: 120, y: (climbAt(50).padL.y + climbAt(50).padR.y) / 2 + 40, z: 2.6};
const H3: React.FC<{f: number}> = ({f}) => bay(`h3${f}`, f, CAM_H3);
/** H4 (72-105) "you could lift your feet off the ground—": side on, the whole of him: his shoes come away from the
 *  glass, his knees bend and the straps take all of him (the dip), steady (static) */
const CAM_H4: Cam = {x: HIP(72).x - 110, y: HIP(72).y + 70, z: 1.12};
const H4: React.FC<{f: number}> = ({f}) => bay(`h4${f}`, f, CAM_H4);
/** H5a (105-135) "and climb": far out across the street: the tall facade and him on it, the far pad going up (the
 *  view rises a little with him) */
const camH5a = (f: number): Cam3 => {
  const u = sm5(clamp((f - 105) / 30));
  return {eye: p3(8.6, 31.0 + 0.25 * u, 21), target: p3(0.3, 29.0 + 0.3 * u, -0.4), f: 2700};
};
const H5a: React.FC<{f: number}> = ({f}) => ext(`h5a${f}`, f, camH5a(f));
/** H5b (135-182) "it like Spider-Man.": close and from below: he rises onto the far pad and goes on up the glass (the
 *  view tilts up with him) */
const camH5b = (f: number): Cam3 => {
  const u = sm5(clamp((f - 136) / 40));
  return {eye: p3(1.7, 27.7 + 0.3 * u, 3.3), target: p3(0.3, 29.45 + 0.4 * u, -0.6), f: 1150};
};
const H5b: React.FC<{f: number}> = ({f}) => ext(`h5b${f}`, f, camH5b(f));

// ------------------------------------------------------------------ 2. the mechanism: one journey down in scale (171-534)
/** M1 (171-228) "Their surfaces are covered": through the glass, the face of the far pad holding him: 24 tiles, dark
 *  where they touch; one push into one tile, whose rows of wedges come up */
const TILE = tileVW(1, 2);
const padM1 = (f: number): Pad3DState => ({yaw: -82, pitch: 6, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600, ridges: 0.25 + 0.75 * ss(f, 196, 220)});
const camM1 = (f: number) => {
  const tp = viewOf(padM1(f)).world({u: 0, v: TILE.v, w: TILE.w});
  return camZoom(f, 171, 230, {x: 0, y: 14}, 2.7, {x: tp.x, y: tp.y}, 26, (x) => sm5(x));
};
const M1: React.FC<{f: number}> = ({f}) => <PadScene6 id={`m1${f}`} st={padM1(f)} cam={camM1(f)} />;
/** M2/M3 (226-379) "in microscopic wedges. As you pull downward, the wedges bend flat against the glass.": the wedges
 *  in depth under the tile; the glass comes against their tips; the pull starts; the view turns to side-on, where it
 *  matches the section exactly (a short dissolve at an identical framing); in the section the same wedges bend and lie
 *  flat as the camera closes on three of them (one continuous camera path from the field into the strip) */
const MICRO_Y0 = -80;
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
const CP = {x: 0, y: STRIP.y + 6};
const FIELD: FieldState = {alpha: 0.62, beta: 30, lam: 0, surface: 'none', gx: 0, slip: 0, back: 0, y0: MICRO_Y0 - 29 * MW.pitch, count: 64, zF: -300, zN: 140, fog: 1};
const fieldAt = (f: number): FieldState => ({
  ...FIELD,
  alpha: keyN(f, [[226, 0.62], [262, 0.66], [300, 1, E(inOut)]]),
  beta: keyN(f, [[226, 30], [262, 28], [300, 0, E(inOut)]]),
  surface: f < 238 ? 'none' : 'glass',
  gx: keyN(f, [[238, -1500], [278, 0, E((x) => 1 - (1 - x) ** 2)]]),
  lam: keyN(f, [[280, 0], [310, 0.32]]),
  fog: keyN(f, [[226, 0.2], [244, 1], [290, 1], [300, 0]]),
});
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[280, 0], [310, 0.32], [350, 0.88], [376, 0.94], [420, 1]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26});
// (the bridge to the molecules leaves z 40 with this speed in ln z per frame)
const BRIDGE_V = (2 * Math.log(520 / 40)) / 47;
const MICRO_KEYS: [number, number, number, number][] = [[226, 40, 40, 2.4], [300, 20, 250, 3.9], [379, 8, 300, 11], [423, CP.x + 1, CP.y, 40]];
const camMicro = (f: number) => pathCam(f, MICRO_KEYS, [0, 0, BRIDGE_V]);
const M23: React.FC<{f: number}> = ({f}) => {
  const cam = camMicro(f);
  const sec = ss(f, 296, 304);
  const tint = keyN(f, [[226, 0.5], [236, 0]]);
  return (
    <Svg>
      {sec < 0.999 && <FieldView6 id={`m2${f}`} st={fieldAt(f)} cam={cam} />}
      {sec > 0.001 && <g opacity={sec}><MicroView id={`m3${f}`} st={secAt(f)} cam={cam} /></g>}
      {tint > 0.001 && <rect x={0} y={0} width={W} height={H} fill="#24404A" opacity={tint} />}
    </Svg>
  );
};
/** M4 (379-473) "This brings them so close that tiny molecular attractions": the path carries on into one strip and
 *  across the scale bridge to the molecules (side profile): the last of the gap closes; faint attraction marks */
const MolScene: React.FC<{id: string; sec: Cam; nm: Cam; secOp: number; molOp: number; gap: number; cue: number}> = ({id, sec, nm, secOp, molOp, gap, cue}) => (
  <Svg>
    {secOp > 0.001 && <g opacity={secOp}><MicroView id={`${id}-s`} st={{surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26}} cam={sec} /></g>}
    {molOp > 0.001 && (
      <g opacity={molOp}>
        <rect x={0} y={0} width={W} height={H} fill="#0D161D" />
        <Layer cam={nm} depth={1}>
          <MolecularContent5 gap={gap} cue={cue} z={nm.z} />
        </Layer>
      </g>
    )}
  </Svg>
);
const NM0 = 120, NM1 = 190;
const nmCam = (u: number): Cam => ({x: 1.2 - 0.8 * u, y: 0.4 * u, z: Math.exp(Math.log(NM0) + (Math.log(NM1) - Math.log(NM0)) * u)});
const camBridge = (f: number) => camZoom(f, 423, 470, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, quadOut);
const M4: React.FC<{f: number}> = ({f}) => {
  if (f < 423) return <Svg><MicroView id={`m4${f}`} st={secAt(f)} cam={camMicro(f)} /></Svg>;
  const u = quadOut(clamp((f - 423) / 50));
  return <MolScene id={`m4${f}`} sec={camBridge(f)} nm={nmCam(u)} secOp={1 - ss(f, 434, 444)} molOp={ss(f, 432, 442)} gap={keyN(f, [[433, 2.2], [455, 0.9], [470, 0.42]])} cue={keyN(f, [[450, 0], [470, 1]])} />;
};
/** M5 (473-534) "can hold your entire weight.": back out along the same contact edge: the molecules, the strip, the
 *  array, the pad on the glass, and him on it, high on the tower (one continuous pull in log zoom) */
const nestMicro = (id: string, st: MicroState, origin: {x: number; y: number}, cam: Cam, early = false) => {
  const zm = cam.z * UM;
  const p0 = early ? 0.35 : 1.2, span = early ? 3 : 6; // (early: the section comes up sooner, over the pad's side wall)
  if (zm * MW.pitch < p0) return null;
  const op = clamp((zm * MW.pitch - p0) / span);
  const half = 960 / zm + 200;
  const mcy = (cam.y - origin.y) / UM;
  const i0 = Math.floor((mcy - half - MICRO_Y0) / MW.pitch) - 2, i1 = Math.ceil((mcy + half - MICRO_Y0) / MW.pitch) + 2;
  const rows = {y0: MICRO_Y0 + i0 * MW.pitch, count: Math.max(1, Math.min(400, i1 - i0))};
  return (
    <g opacity={op} transform={`translate(${origin.x} ${origin.y}) scale(${UM})`}>
      <defs>
        <clipPath id={`${id}-cl`}>
          <rect x={-60 / UM} y={-300 / UM} width={66 / UM} height={600 / UM} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-cl)`}>
        <MicroContent id={id} st={{...st, y0: rows.y0, count: rows.count}} z={zm} bg={false} />
      </g>
    </g>
  );
};
/** the far pad's contact face (holding him through 473-534), where the section sits in the bay */
const M5_O = {x: KX * PZ.R, y: UY(4) + KY * PZ.R - 30};
const M5_END = {x: 300, y: -18900 - 194, z: 1.05}; // (V6's framing, on V7's hips)
const M5: React.FC<{f: number}> = ({f}) => {
  // one eased pull in log zoom across the three scales: molecules (nm view) back across the bridge into the section
  // (z 520 -> 3), then into the bay (3 / UM -> M5_END.z); the hand-overs are at the same point and zoom speed
  const L0 = Math.log(520), L1 = Math.log(M5_END.z * UM), Ls = Math.log(3.0);
  const u = sm5(clamp((f - 473) / (534 - 473)));
  const L = L0 + (L1 - L0) * u;
  const P0 = {x: 40, y: 300};
  if (L > Ls) {
    const z = Math.exp(L);
    const w = (520 / z - 1) / (520 / 3.0 - 1);
    const sec = {x: CP.x + 0.02 + (P0.x - CP.x - 0.02) * w, y: CP.y + (P0.y - CP.y) * w, z};
    // the molecules recede back into the strip over the first frames, at the same place
    const v = clamp((f - 473) / 12);
    return <MolScene id={`m5${f}`} sec={sec} nm={nmCam(1 - 0.5 * v)} secOp={ss(f, 474, 484)} molOp={1 - ss(f, 476, 486)} gap={0.42} cue={keyN(f, [[473, 1], [480, 0]])} />;
  }
  const bz = Math.exp(L) / UM, bz0 = 3.0 / UM;
  const p0 = {x: M5_O.x + P0.x * UM, y: M5_O.y + P0.y * UM};
  const w = (bz0 / bz - 1) / (bz0 / M5_END.z - 1);
  const cam = {x: p0.x + (M5_END.x - p0.x) * w, y: p0.y + (M5_END.y - p0.y) * w, z: bz};
  const secSt: MicroState = {surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26};
  return bay(`m5${f}`, f, cam, nestMicro(`m5${f}-n`, secSt, M5_O, cam));
};

// ------------------------------------------------------------------ 3. the springs (534-664)
/** S1 (534-600) "Special springs spread the load,": at his hand on the near pad's handle, from behind: the back cover
 *  lifts off; he pulls; the spine travels and every spring stretches together while the tiles stay put (a slow push) */
const padS = (f: number): Pad3DState => {
  const load = keyN(f, [[534, 0.25], [556, 0.25], [586, 1]]);
  return {yaw: 58, pitch: 14, load, contact: allTiles(keyN(f, [[556, 0.55], [586, 1]])), cover: keyN(f, [[536, 1], [556, 0]]), gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(load * 1.3)), strap: 2600};
};
const camS1 = (f: number) => cam1(f, [[534, 26, 18, 4.3], [600, 18, 16, 5.1, inOut]]);
const S1: React.FC<{f: number}> = ({f}) => <PadScene6 id={`s1${f}`} st={padS(f)} cam={camS1(f)} />;
/** S2 (600-664) "so one little patch doesn't have to hold you up alone.": one tile's patch loses its contact: its spring
 *  goes slack and its three neighbours take up its share (a little more stretch); the contact comes back and the load
 *  evens out; the camera pulls back to the whole pad, turning to his side of it (the bay's view), and the cover goes
 *  back on: the cut to the climb matches this framing */
const LOST = 2 * 4 + 1; // tile (column 1, row 2)
const NEIGH = [1 * 4 + 1, 3 * 4 + 1, 2 * 4 + 0, 2 * 4 + 2];
const lostAt = (f: number) => keyN(f, [[604, 0], [618, 1], [634, 1], [650, 0]]);
const shareS2 = (f: number) => allTiles(1).map((_, i) => (i === LOST ? 1 - 0.85 * lostAt(f) : NEIGH.includes(i) ? 1 + 0.32 * lostAt(f) : 1));
const contactS2 = (f: number) => allTiles(1).map((_, i) => (i === LOST ? 1 - 0.75 * lostAt(f) : 1));
// the matched end: the pad as it sits in the climb's first framing (C1), seen as the bay sees it
const DC = -321; // V7's hips against V6's through the climb shots (the same framings)
const C1_CAM: Cam = {x: 245, y: -19160 + DC - 170, z: 1.25}; // (lower in frame than V6: the caption above his head)
const S2_END = (() => {
  const p = climbAt(664).padL;
  return {x: (C1_CAM.x - KX * p.zo) / MM, y: (C1_CAM.y - p.y - KY * p.zo) / MM, z: C1_CAM.z * MM};
})();
const HAND_Z = 3.2; // the bay zoom at which the close-up hands over to the bay (its pad drawn the same way)
const S2_HAND = (() => {
  const p = climbAt(664).padL;
  const bx = KX * p.zo + 30, by = p.y + KY * p.zo;
  return {bay: {x: bx, y: by, z: HAND_Z}, pad: {x: 30 / MM, y: 0, z: HAND_Z * MM}};
})();
const camS2 = (f: number) => cam1(f, [[600, -10, 6, 7.4], [626, -12, 8, 7.8, inOut], [652, S2_HAND.pad.x, S2_HAND.pad.y, S2_HAND.pad.z, inOut]]);
/** after the hand-over: the bay, pulling on out from the pad to the climb's first framing */
const camS2b = (f: number) => cam1(f, [[652, S2_HAND.bay.x, S2_HAND.bay.y, S2_HAND.bay.z], [664, C1_CAM.x, C1_CAM.y, C1_CAM.z, (x) => 1 - (1 - x) ** 2]]);
const S2: React.FC<{f: number}> = ({f}) => {
  const turn = ss(f, 632, 652);
  const st: Pad3DState = {...padS(f), yaw: lerp(58, 14, turn), pitch: lerp(14, 2.3, turn), share: shareS2(f), contact: contactS2(f), cover: keyN(f, [[636, 0], [650, 1]]), hand: H_BAR};
  const hand = ss(f, 646, 654);
  if (f >= 654) return bay(`s2b${f}`, f, camS2b(f));
  return (
    <>
      <PadScene6 id={`s2${f}`} st={st} cam={camS2(f)} />
      {hand > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: hand}}>{bay(`s2x${f}`, f, camS2b(Math.max(652, f)))}</div>}
    </>
  );
};

// ------------------------------------------------------------------ 4. the climb (664-857)
/** C1 (664-720) "Then, you shift your weight": side profile, the whole of him: hips and torso go over onto the near
 *  stirrup, its strap goes taut, the far one slackens (a slow push) */
const camC1 = (f: number) => cam1(f, [[664, C1_CAM.x, C1_CAM.y, C1_CAM.z], [720, 238, -19140 + DC - 170, 1.34, inOut]]);
const C1: React.FC<{f: number}> = ({f}) => bay(`c1${f}`, f, camC1(f));
/** C2 (720-750) "onto the other pad.": low, on the stirrups: the near foot bearing on its bar, its strap taut; the far
 *  foot light in its slack loop (static) */
const C2: React.FC<{f: number}> = ({f}) => bay(`c2${f}`, f, {x: 175, y: -18760 + DC, z: 2.3});
/** C3 (750-800) "The first releases,": on the far pad: it peels from its lower edge, comes off, and his arm carries it
 *  up on a shoulder-and-elbow arc; the camera goes up with it (one move) */
const camC3 = (f: number) => cam1(f, [[750, 70, -19330 + DC, 2.5], [764, 70, -19330 + DC, 2.5], [800, 80, -19390 + DC, 2.1, inOut]]);
const C3: React.FC<{f: number}> = ({f}) => bay(`c3${f}`, f, camC3(f));
/** C4 (800-857) "letting you reach higher and repeat.": medium: the far pad seats and loads before the near one lets
 *  go; he rises onto it; the near pad follows; the camera rises with him a little (one move) */
const camC4 = (f: number) => cam1(f, [[800, 250, -19250 + DC, 1.12], [812, 250, -19250 + DC, 1.12], [857, 252, -19360 + DC, 1.12, inOut]]);
const C4: React.FC<{f: number}> = ({f}) => bay(`c4${f}`, f, camC4(f));

// ------------------------------------------------------------------ 5. the catch in the method (857-1095)
/** E1 (857-894) "But there's a catch.": outside, a little above: he climbs on toward the brick pier beside his bay;
 *  the smooth glass and the rough brick side by side (a slow push) */
const camE1 = (f: number): Cam3 => {
  const u = sm5(clamp((f - 857) / 37));
  return {eye: p3(2.3 - 0.25 * u, 32.0, 2.95 - 0.3 * u), target: p3(0.3, 31.3, -0.1), f: 1550};
};
const E1: React.FC<{f: number}> = ({f}) => ext(`e1${f}`, f, camE1(f));
/** G1 (894-930) "They need a smooth surface": through the glass, the far pad as he rises onto it: its tiles darken
 *  as the load comes on (a slow push) */
const padG1 = (f: number): Pad3DState => {
  const load = keyN(f, [[896, 0.35], [922, 1]]);
  return {yaw: -78, pitch: 4, load, contact: allTiles(keyN(f, [[896, 0.45], [924, 1]])), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(0.4 + load)), strap: 2600, ridges: 0.35};
};
const camG1 = (f: number) => cam1(f, [[894, 6, 12, 3.1], [930, 6, 12, 3.4, inOut]]);
const G1: React.FC<{f: number}> = ({f}) => <PadScene6 id={`g1${f}`} st={padG1(f)} cam={camG1(f)} />;
/** G1b (930-954) "to grip.": the same pad's contact in section on the smooth glass: every wedge lies flat against it,
 *  with no gap anywhere along the contact (a slow push) */
const secG1b = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[930, 0.9], [946, 1]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26});
const camG1b = (f: number) => cam1(f, [[930, 14, 300, 6.0], [954, 10, 300, 7.0, inOut]]);
const G1b: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`g1b${f}`} st={secG1b(f)} cam={camG1b(f)} /></Svg>;
/** G2 (954-1041) "So you can climb glass— but switch to rough brick,": along the facade to the brick pier beside his
 *  bay: he climbs once more on the glass, then takes his near pad across onto the rough brick while the far pad on
 *  the glass holds him, presses it on, pleased, and doubts it as he leans on it (one track and push) */
const G2_END = {x: -10, y: climbAt(1041).padL.y - 2, z: 1.85};
const camG2 = (f: number) => cam1(f, [[954, 330, HIP(954).y + 66, 1.0], [960, 330, HIP(954).y + 66, 1.0], [1041, G2_END.x, G2_END.y, G2_END.z, inOut]]);
const G2: React.FC<{f: number}> = ({f}) => bay(`g2${f}`, f, camG2(f));
/** G3 (1041-1095) "and those microscopic wedges": the same wedges in section on the two surfaces, one above the other:
 *  on the glass (above) they bend and lie flat along the whole contact; on the brick (below) only a few tips reach its
 *  peaks, the rest stand off it across the gaps, and as his weight comes on they peel and skid (a slow push on both) */
const SPLIT_GAP = 210;
const G3: React.FC<{f: number}> = ({f}) => {
  const half = (H - SPLIT_GAP) / 2;
  const z = keyN(f, [[1041, 2.3], [1095, 2.7, E(inOut)]]);
  const glass: MicroState = {surface: 'glass', lam: keyN(f, [[1041, 0.25], [1064, 1, E(inOut)]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26};
  const brick: MicroState = {surface: 'brick', lam: keyN(f, [[1041, 0.15], [1064, 1, E(inOut)]]), gx: 0, back: keyN(f, [[1082, 0], [1095, 22]]), glow: 0, slip: keyN(f, [[1074, 0], [1095, 44]]), y0: MICRO_Y0, count: 30};
  const off = (H / 2 - half / 2) / z;
  return (
    <Svg>
      <defs>
        <clipPath id={`g3t${f}`}><rect x={0} y={0} width={W} height={half} /></clipPath>
        <clipPath id={`g3b${f}`}><rect x={0} y={H - half} width={W} height={half} /></clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#0B1217" />
      <g clipPath={`url(#g3t${f})`}><MicroView id={`g3g${f}`} st={glass} cam={{x: 30, y: 330 + off, z}} /></g>
      <g clipPath={`url(#g3b${f})`}><MicroView id={`g3k${f}`} st={brick} cam={{x: 30, y: 330 - off, z}} /></g>
    </Svg>
  );
};

/** each shot's camera, for the camera-track QC (the exterior and micro shots have their own) */
export const CAMS7: Record<string, (f: number) => Cam> = {
  H3: () => CAM_H3, H4: () => CAM_H4, M1: camM1, M23: camMicro, S1: camS1, C1: camC1, C2: () => ({x: 175, y: -18760 + DC, z: 2.3}), C3: camC3, C4: camC4,
  G1: camG1, G1b: camG1b, G2: camG2,
};
export const CAMS7_3D: Record<string, (f: number) => Cam3> = {H1: camTail, H2: camH2, H5a: camH5a, H5b: camH5b, E1: camE1, F1: camTail};

export const SHOTS7: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 12, name: 'H1', C: H1},
  {from: 12, to: 39, name: 'H2', C: H2},
  {from: 39, to: 72, name: 'H3', C: H3},
  {from: 72, to: 105, name: 'H4', C: H4},
  {from: 105, to: 135, name: 'H5a', C: H5a},
  {from: 135, to: 171, name: 'H5b', C: H5b},
  {from: 171, to: 226, name: 'M1', C: M1},
  {from: 226, to: 379, name: 'M23', C: M23},
  {from: 379, to: 473, name: 'M4', C: M4},
  {from: 473, to: 534, name: 'M5', C: M5},
  {from: 534, to: 600, name: 'S1', C: S1},
  {from: 600, to: 664, name: 'S2', C: S2},
  {from: 664, to: 720, name: 'C1', C: C1},
  {from: 720, to: 750, name: 'C2', C: C2},
  {from: 750, to: 800, name: 'C3', C: C3},
  {from: 800, to: 857, name: 'C4', C: C4},
  {from: 857, to: 894, name: 'E1', C: E1},
  {from: 894, to: 930, name: 'G1', C: G1},
  {from: 930, to: 954, name: 'G1b', C: G1b},
  {from: 954, to: 1041, name: 'G2', C: G2},
  {from: 1041, to: 1095, name: 'G3', C: G3},
  {from: 1095, to: FRAMES, name: 'F1', C: F1},
];

export const SceneAt7: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS7.find((x) => f >= x.from && f < x.to) ?? SHOTS7[SHOTS7.length - 1];
  return <s.C f={f} />;
};
export {C, CYCLES};
export type {V};
