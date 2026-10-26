// Glass Climbing V8: the shot list (film frames at 30 fps, on the approved narration, unchanged). Every shot is a pure
// function of the frame. What each shot adds and how it connects: production/V8_CHANGE_REPORT.md.
// Camera rule: within a shot the camera holds or makes one eased, motivated move; the important action happens on a
// settled camera.
// The loop: the slip, the recovery and the catch (F1, the end of the film) and the hook's first shot (H1) are one
// settled exterior view on the climb's looped time and in the top coordinates (climbTop), so the last frame and frame
// 0 are consecutive frames of one shot: the free pad arrives on the last frames and touches at frame 3.
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
import {BayWorld5 as BayWorld8} from './Bay8';
import {C, CATCH_END, climbAt, climbTop, CYCLES, DY, FRAMES, keyN, MM, PZ, ss, UY, Z_BRICK} from './climb8';
import {Cam3} from './Tower8';
import {Exterior8} from './Exterior8';

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
  return <Svg><BayWorld8 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} f={f} nest={nest} man={!camOnly} gear={!camOnly} /></Svg>;
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
const ext = (id: string, f: number, cam: Cam3, top = false, brickAt: number | null = null) => {
  const camOnly = React.useContext(CamOnly);
  // brickAt: a fixed frame whose state places the brick pier (so it never moves during the shot)
  const bm = brickAt == null ? null : top ? climbTop(brickAt) : climbAt(brickAt);
  return <Exterior8 id={id} f={f} cam={cam} st={camOnly ? null : top ? climbTop(f) : climbAt(f)} brickMatch={bm} />;
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

// ------------------------------------------------------------------ cameras shared across shots
/** the hero three-quarter exterior (top coordinates): outside, a little above him, looking along the facade and down,
 *  close enough to read him, both pads and both straps, with the street far below on the right. The opening and the
 *  ending share it (the loop). (Also the camera of the Runway hero plate's composition reference.) */
export const CAM_A: Cam3 = {eye: p3(1.6, 33.3, 2.4), target: p3(0.22, 31.2, -1.6), f: 1500};
/** the height reveal (opening coordinates): from above him, looking down the facade to the street (the camera of the
 *  Runway street plate's composition reference at its widest) */
export const CAM_B: Cam3 = {eye: p3(1.4, 31.4, 2.2), target: p3(0.45, 27.0, -1.6), f: 950};
/** the medium climb framing: the whole of him, both pads and stirrups, a mullion and the floor lines as fixed
 *  references; it holds while he does one whole cycle */
const CAM_CLIMB: Cam = {x: 170, y: HIP(664).y + 90, z: 0.98};


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
const C1_CAM: Cam = CAM_CLIMB; // (the spring close-up hands back to the medium climb framing)
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


// ------------------------------------------------------------------ the end and the hook: one settled exterior view (1082-FRAMES, 0-24)
/** F1 (1082-FRAMES) "can't make the same contact.": the hero three-quarter view, settled. The brick pad does not take
 *  his weight: it creeps and slips off; his near foot loses its stirrup's anchor and drops, his far knee bends and he
 *  lurches down a short way onto the far pad and stirrup (still on the glass, the far strap taut); alarm; he steadies,
 *  then deliberately reaches the free pad back to the glass: it arrives on the last frames. */
const F1: React.FC<{f: number}> = ({f}) => ext(`f1${f}`, f, CAM_A, true, 1088);
/** H1 (0-24) "If you": the same view, continuing: the pad touches at frame 3, a small downward load seats it, its
 *  strap takes his near foot, his pelvis and knees absorb a short settle; the street far below */
const H1: React.FC<{f: number}> = ({f}) => ext(`h1${f}`, f, CAM_A, true, 1088);

// ------------------------------------------------------------------ 1. the hook (24-171)
/** H2 (24-70) "pressed these pads against a glass wall,": matched on the contact: the loaded near pad, close and
 *  oblique, on its pane: his fist round the handle, the thin contact edge, the contact shadow; it settles under the
 *  load (placeholder until the V8 contact close-up) */
const padH2 = (f: number): Pad3DState => {
  const s = climbAt(f).padL;
  return {yaw: 42, pitch: 14, load: s.load, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600};
};
const H2: React.FC<{f: number}> = ({f}) => <PadScene6 id={`h2${f}`} st={padH2(f)} cam={{x: 30, y: 20, z: 3.4}} />;
/** H3 (70-105) "you could lift your feet off the ground—": down the near strap from its pad to his foot, seated on its
 *  stirrup and taking his weight as he shifts onto it; his far knee begins to lift with its stirrup (one tilt down,
 *  then held) */
const H3_PAD = climbAt(70).padL;
const camH3 = (f: number) => cam1(f, [[70, 80, H3_PAD.y + 60, 1.75], [100, 165, climbAt(96).footL.ankle.y - 10, 1.75, inOut]]);
const H3: React.FC<{f: number}> = ({f}) => bay(`h3${f}`, f, camH3(f));
/** H4 (105-171) "and climb it like Spider-Man.": from above him, one move: the view tilts down past him and widens to
 *  the street far below, the onlookers, the traffic; then holds as he climbs (the far pad seats, he rises onto it,
 *  the near pad follows) */
const camH4 = (f: number): Cam3 => {
  const u = sm5(clamp((f - 105) / 34));
  const him = climbAt(105).pose;
  const tHim = {x: 0.45, y: -him.y / 620 - 0.15, z: -0.4};
  return {eye: CAM_B.eye, target: lerp3(tHim, CAM_B.target, u), f: lerp(1750, CAM_B.f, u)};
};
const H4: React.FC<{f: number}> = ({f}) => ext(`h4${f}`, f, camH4(f));

// ------------------------------------------------------------------ 4. the climb (664-857): one cycle in one medium view
/** CC (664-857) "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and
 *  repeat.": held: his hips go over onto the near stirrup and its strap goes taut, the far stirrup unloads and its
 *  strap slackens; the far pad peels and stands off the glass (its shadow left behind), is carried up on the arm's arc
 *  with its stirrup and foot, seats and loads; he rises onto it past the fixed floor lines; the near pad starts after
 *  it */
const CC: React.FC<{f: number}> = ({f}) => bay(`c${f}`, f, CAM_CLIMB);

// ------------------------------------------------------------------ 5. the catch in the method (857-1082)
/** E1 (857-894) "But there's a catch.": the hero view's camera, outside: he climbs on toward the brick strip beside
 *  his bay; smooth glass and rough brick side by side */
const E1: React.FC<{f: number}> = ({f}) => ext(`e1${f}`, f, CAM_A);
/** G1 (894-930) "They need a smooth surface": the contact test (placeholder until the V8 through-glass view) */
const padG1 = (f: number): Pad3DState => {
  const load = keyN(f, [[896, 0.35], [922, 1]]);
  return {yaw: -78, pitch: 4, load, contact: allTiles(keyN(f, [[896, 0.45], [924, 1]])), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(0.4 + load)), strap: 2600, ridges: 0.35};
};
const G1: React.FC<{f: number}> = ({f}) => <PadScene6 id={`g1${f}`} st={padG1(f)} cam={{x: 6, y: 12, z: 3.2}} />;
/** G1b (930-954) "to grip.": the contact in section on the smooth glass (placeholder until the V8 wedge section) */
const G1b: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`g1b${f}`} st={{surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26}} cam={{x: 12, y: 300, z: 6.5}} /></Svg>;
/** G2 (954-1041) "So you can climb glass— but switch to rough brick,": along the facade to the brick strip: he climbs
 *  once more on the glass, then takes the near pad (the one just seen seating) across onto the brick while the far pad
 *  on the glass carries him; he presses it on, pleased, and doubts it as he leans on it (one track and push) */
const G2_END = {x: -10, y: climbAt(1036).padL.y - 2, z: 1.85};
const camG2 = (f: number) => cam1(f, [[954, 330, HIP(954).y + 66, 1.0], [962, 330, HIP(954).y + 66, 1.0], [1036, G2_END.x, G2_END.y, G2_END.z, inOut]]);
const G2: React.FC<{f: number}> = ({f}) => bay(`g2${f}`, f, camG2(f));
/** G3 (1041-1082) "and those microscopic wedges": the same pad's wedges at the brick, then beside the glass in the same
 *  orientation and scale (placeholder until the V8 wedge section) */
const SPLIT_GAP = 210;
const G3: React.FC<{f: number}> = ({f}) => {
  const half = (H - SPLIT_GAP) / 2;
  const z = keyN(f, [[1041, 2.3], [1082, 2.7, E(inOut)]]);
  const glass: MicroState = {surface: 'glass', lam: keyN(f, [[1041, 0.25], [1064, 1, E(inOut)]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26};
  const brick: MicroState = {surface: 'brick', lam: keyN(f, [[1041, 0.15], [1064, 1, E(inOut)]]), gx: 0, back: keyN(f, [[1072, 0], [1082, 22]]), glow: 0, slip: keyN(f, [[1068, 0], [1082, 44]]), y0: MICRO_Y0, count: 30};
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


// ------------------------------------------------------------------ the payoff and the load path (473-664)
/** M5a (473-490) "can hold": back out of the molecules to the section (placeholder until the V8 transition) */
const M5a: React.FC<{f: number}> = ({f}) => <M4 f={Math.min(f, 472)} />;
/** M5b (490-528) "your entire weight.": him, on both loaded pads, held: he settles a little into the loaded stirrups
 *  (their straps take it) and holds */
const CAM_M5B: Cam = {x: 175, y: HIP(500).y + 60, z: 1.12};
const M5b: React.FC<{f: number}> = ({f}) => bay(`m5b${f}`, f, CAM_M5B);
/** S0 (528-556) "Special springs": from the far stirrup, loaded under his foot, up its strap to the far pad on the
 *  glass (one tilt, following the load path upward) */
const S0_A = (() => {
  const s = climbAt(528);
  return {x: s.footR.ankle.x - 30, y: s.footR.ankle.y - 40};
})();
const S0_B = (() => {
  const s = climbAt(552);
  const g = s.ringR;
  return {x: g.x + 40, y: g.y - 60};
})();
const S0_Z = 1.7;
const camS0 = (f: number) => cam1(f, [[528, S0_A.x, S0_A.y - 120, S0_Z], [556, S0_B.x - 20, S0_B.y + 80, S0_Z, inOut]]);
const S0: React.FC<{f: number}> = ({f}) => bay(`s0${f}`, f, camS0(f));
/** S1 (556-652): the spring cutaway (placeholder until the V8 spring scene) */
const S1p: React.FC<{f: number}> = ({f}) => (f < 600 ? <S1 f={f - 556 + 534} /> : <S2 f={Math.min(f, 651)} />);
/** S2 (652-664): back on the far pad and hand in the bay, pulling out to the climb's medium framing */
const S2b: React.FC<{f: number}> = ({f}) => bay(`s2b${f}`, f, cam1(f, [[652, S0_B.x - 20, S0_B.y + 80, S0_Z], [664, CAM_CLIMB.x, CAM_CLIMB.y, CAM_CLIMB.z, (x) => 1 - (1 - x) ** 2]]));

/** each shot's camera, for the camera-track QC (the exterior and micro shots have their own) */
export const CAMS8: Record<string, (f: number) => Cam> = {
  H3: camH3, M1: camM1, M23: camMicro, M5b: () => CAM_M5B, S0: camS0, C: () => CAM_CLIMB, G2: camG2,
};
export const CAMS8_3D: Record<string, (f: number) => Cam3> = {H1: () => CAM_A, H4: camH4, E1: () => CAM_A, F1: () => CAM_A};

export const SHOTS8: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 24, name: 'H1', C: H1},
  {from: 24, to: 70, name: 'H2', C: H2},
  {from: 70, to: 105, name: 'H3', C: H3},
  {from: 105, to: 171, name: 'H4', C: H4},
  {from: 171, to: 226, name: 'M1', C: M1},
  {from: 226, to: 379, name: 'M23', C: M23},
  {from: 379, to: 473, name: 'M4', C: M4},
  {from: 473, to: 490, name: 'M5a', C: M5a},
  {from: 490, to: 528, name: 'M5b', C: M5b},
  {from: 528, to: 556, name: 'S0', C: S0},
  {from: 556, to: 652, name: 'S1', C: S1p},
  {from: 652, to: 664, name: 'S2', C: S2b},
  {from: 664, to: 857, name: 'C', C: CC},
  {from: 857, to: 894, name: 'E1', C: E1},
  {from: 894, to: 930, name: 'G1', C: G1},
  {from: 930, to: 954, name: 'G1b', C: G1b},
  {from: 954, to: 1041, name: 'G2', C: G2},
  {from: 1041, to: 1082, name: 'G3', C: G3},
  {from: 1082, to: FRAMES, name: 'F1', C: F1},
];

export const SceneAt8: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS8.find((x) => f >= x.from && f < x.to) ?? SHOTS8[SHOTS8.length - 1];
  return <s.C f={f} />;
};
export {C, CYCLES};
