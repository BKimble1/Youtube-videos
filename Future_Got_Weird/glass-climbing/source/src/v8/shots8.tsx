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
import {Pad3D as Pad3D8, Pad3DState as Pad3DState8, allTiles as allTiles8, ARM_BAY, tileVW as tileVW8} from './Pad8';
import {ContactScene8, contactShot, SpringScene8, springShotFilm, SurfaceScene8, surfaceShot, SPRING_BAY_CAM} from './PadScenes8';
import {camAt as wedgeCamAt, FOCUS, FOCUS_P, viewOf as wedgeViewOf, WEDGE_CAM, WEDGE_Z, WedgeContent, WedgeSplit, WedgeState, WedgeView} from './Wedge8';
import {MolView, WedgeToMol} from './Mol8';

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
const ext = (id: string, f: number, cam: Cam3, top = false, brickAt: number | null = null, refAt: number | null = null) => {
  const camOnly = React.useContext(CamOnly);
  const at = (t: number) => (top ? climbTop(t) : climbAt(t));
  // brickAt: a fixed frame whose state places the brick pier (so it never moves during the shot)
  const bm = brickAt == null ? null : at(brickAt);
  // refAt: a fixed frame whose state places the drawing of him for the whole shot (the brick frame by default)
  const rf = refAt ?? brickAt;
  // the street and sky keep running across the loop: the frames before the catch ends follow the last frame
  const tf = top && f < CATCH_END ? f + FRAMES : f;
  return <Exterior8 id={id} f={tf} cam={cam} st={camOnly ? null : at(f)} brickMatch={bm} refSt={rf == null ? null : at(rf)} />;
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
export const CAM_A: Cam3 = {eye: p3(1.5, 33.6, 1.6), target: p3(0.12, 30.7, -1.5), f: 1200};
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
// (V8 QA) one slow push down the strap: it opens on the pads, straps and stirrups together (his head above the frame)
// and closes in on the seated stirrup; the feet stay above the caption throughout
const H3_ANK = climbAt(96).footL.ankle.y;
const camH3 = (f: number) => cam1(f, [[70, 130, H3_PAD.y + (960 - 300) / 1.25, 1.25], [100, 155, H3_ANK - (1120 - 960) / 1.65, 1.65, inOut]]);
const H3: React.FC<{f: number}> = ({f}) => bay(`h3${f}`, f, camH3(f));
/** H4 (105-171) "and climb it like Spider-Man.": from above him, one move: the view tilts down past him and widens to
 *  the street far below, the onlookers, the traffic; then holds as he climbs (the far pad seats, he rises onto it,
 *  the near pad follows) */
// (V8 QA) a pure zoom out: the eye and the aim stay fixed and only the focal length changes, so the 3D tower and the
// drawn climber over it scale together about the frame's centre and stay registered (no facade sliding behind him)
const H4_TARGET = p3(0.3, 28.5, -1.2);
const camH4 = (f: number): Cam3 => {
  const u = sm5(clamp((f - 105) / 38));
  return {eye: CAM_B.eye, target: H4_TARGET, f: Math.exp(lerp(Math.log(1750), Math.log(CAM_B.f), u))};
};
const H4: React.FC<{f: number}> = ({f}) => ext(`h4${f}`, f, camH4(f), false, null, 138);

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
const E1: React.FC<{f: number}> = ({f}) => ext(`e1${f}`, f, CAM_A, false, null, 875);
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
// (V8 QA) a medium view that follows him up the glass as he rises (the feet stay clear of the caption, nothing under
// the action column), then at the cut on "but switch to rough brick" (1000) a closer, held view of his upper body, both
// pads and the brick strip beside him (the feet below the frame), creeping in a little as he leans on the brick pad
const G2_A = {x: 200, y: HIP(954).y + 90, z: 0.98};
const G2_B = {x: 200, y: HIP(996).y + 90, z: 0.98};
const G2_C = {x: 150, y: climbAt(1024).padL.y - 107, z: 1.5};
const camG2 = (f: number) =>
  f < 1000
    ? cam1(f, [[954, G2_A.x, G2_A.y, G2_A.z], [974, G2_A.x, G2_A.y, G2_A.z], [996, G2_B.x, G2_B.y, G2_B.z, inOut]])
    : cam1(f, [[1000, G2_C.x, G2_C.y, G2_C.z], [1041, G2_C.x + 10, G2_C.y, G2_C.z * 1.06, (x) => x]]);
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
const CAM_M5B: Cam = {x: 175, y: HIP(503).y + 100, z: 1.0};
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


// ------------------------------------------------------------------ V8: the device, the wedges, the molecules (171-500)
/** smootherstep keys (the component builders' easing) */
const keyS = (f: number, ks: [number, number][]) => keyN(f, ks.map(([t, v], i) => (i ? [t, v, E((x) => x * x * x * (x * (x * 6 - 15) + 10))] : [t, v])) as any);
/** M1 (171-232) "Their surfaces are covered in": the pad on the glass, side-on, his fist on the handle; one continuous
 *  zoom into the middle of its tile face, where it meets the glass: the tile layer's edge becomes the silicone sheet
 *  and its rows of wedges (nested at the exact scale), arriving at the section's own framing (WEDGE_CAM) */
const M1_V0 = tileVW8(0, 2).v - FOCUS_P.y / 1000; // (the focus wedge sits on the middle of a tile in the third row)
const M1_PAD: Pad3DState8 = {yaw: 0, pitch: 0, load: 1, contact: allTiles8(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 900, arm: ARM_BAY, sleeve: false};
/** the pad-view (mm) camera that equals WEDGE_CAM (um) at the nest */
const M1_END: Cam = {x: WEDGE_CAM.x / 1000, y: M1_V0 + WEDGE_CAM.y / 1000, z: WEDGE_CAM.z * 1000};
const camM1v8 = (f: number) => camZoom(f, 174, 232, {x: 40, y: 30}, 2.6, {x: M1_END.x, y: M1_END.y}, M1_END.z, (x) => x * x * x * (x * (x * 6 - 15) + 10));
const microState = (f: number): WedgeState => ({
  surface: 'glass',
  approach: keyS(f, [[226, 0.55], [252, 1]]),
  shear: keyS(f, [[274, 0], [350, 1]]),
  focus: FOCUS,
  focusK: keyS(f, [[352, 0], [378, 1]]),
});
const M1v8: React.FC<{f: number}> = ({f}) => {
  const cam = camM1v8(f);
  const zu = cam.z / 1000; // px per um
  if (zu >= 1.6) return <Svg><WedgeView id={`m1w${f}`} st={microState(f)} cam={{x: cam.x * 1000, y: (cam.y - M1_V0) * 1000, z: zu}} /></Svg>;
  const op = clamp((Math.log(zu) - Math.log(0.25)) / (Math.log(1.6) - Math.log(0.25)));
  const g0 = clamp((Math.log(zu) - Math.log(0.7)) / (Math.log(1.6) - Math.log(0.7)));
  const gb = g0 * g0 * (3 - 2 * g0);
  const camU = {x: cam.x * 1000, y: (cam.y - M1_V0) * 1000, z: zu};
  const vw = wedgeViewOf(camU, 40);
  return (
    <Svg>
      <Layer cam={cam} depth={3}>
        <Lin id={`m1g${f}`} d="M-3000,-3000 H3000 V3000 H-3000 Z" from={{x: 0, y: -1600}} to={{x: 0, y: 1600}} stops={[[0, '#9CC7D4'], [0.5, '#6A9DB0'], [1, '#3F6E82']]} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Pad3D8 id={`m1p${f}`} st={M1_PAD} z={cam.z} />
        {op > 0.001 && (
          <g opacity={op} transform={`translate(0 ${M1_V0}) scale(0.001)`}>
            <WedgeContent id={`m1n${f}`} st={microState(f)} z={zu} view={vw} bg={false} />
          </g>
        )}
        {/* (V8 QA) the section's own ground (the air between the wedges) fades in over the last part of the zoom, so
            the hand-over to the section view at zu 1.6 has nothing left to change */}
        {gb > 0.001 && (
          <g opacity={gb} transform={`translate(0 ${M1_V0}) scale(0.001)`}>
            <WedgeContent id={`m1b${f}`} st={microState(f)} z={zu} view={vw} />
          </g>
        )}
      </Layer>
    </Svg>
  );
};
/** M2-M5a (232-500) "microscopic wedges. As you pull downward, the wedges bend flat against the glass. This brings them
 *  so close that tiny molecular attractions can hold your entire": the section holds still (WEDGE_CAM) while inside it
 *  the tips settle onto the glass, the backing is pulled down and the wedges bend over and lie flat (the contact grows
 *  from points to strips); one wedge's contact is singled out and one continuous zoom goes into it, to the molecules:
 *  the gap closes and short-range attraction marks come up; then the same zoom back out to the loaded section */
const MOL_U = (f: number) => (f < 473 ? keyN(f, [[380, 0], [424, 1]]) : keyN(f, [[473, 1], [503, 0]]));
/** (V8 QA) the held section creeps in (zoom 6.8 -> 7.6 px/um about the focus strip, the glass face line fixed) through
 *  the settling and the shear, so the holds are never frozen; the molecular move starts and ends at that framing */
const M_Z1 = 7.6;
const camSec8 = (f: number) => wedgeCamAt(FOCUS_P, Math.exp(lerp(Math.log(WEDGE_Z), Math.log(M_Z1), sm5(clamp((f - 234) / (378 - 234))))));
const Mv8: React.FC<{f: number}> = ({f}) => {
  const u = MOL_U(f);
  const close = f < 473 ? keyS(f, [[424, 0], [450, 1]]) : 1;
  const t = Math.max(0, (f - 380) / 30);
  const cam0 = camSec8(f);
  if (f >= 380 && u > 0) return <Svg>{u >= 1 ? <MolView id={`mv${f}`} close={close} t={t} /> : <WedgeToMol id={`mv${f}`} u={u} close={close} t={t} cam0={cam0} />}</Svg>;
  return <Svg><WedgeView id={`mw${f}`} st={microState(f)} cam={cam0} /></Svg>;
};

// ------------------------------------------------------------------ V8: the contact close-up, the springs, the contact test
/** H2v8 (24-70) "pressed these pads against a glass wall,": matched on the contact: the near pad that has just caught
 *  him, close and oblique from outside: his fist round the handle, the contact line and shadow on the pane, the strap
 *  straight; it settles under the load (a slow push in) */
const H2v8: React.FC<{f: number}> = ({f}) => {
  const p = contactShot(f);
  return <ContactScene8 id={`h2${f}`} load={p.load} drift={p.drift} cam={p.cam} arm={ARM_BAY} sleeve={false} />;
};
/** S0v8 (528-548) "Special": down at the near stirrup under his foot, loaded, then up its strap toward the pad (the
 *  load path from the foot support) */
const S0v8_A = (() => {
  const s = climbAt(528);
  return {x: s.footL.ankle.x - 40, y: s.footL.ankle.y - 60};
})();
const S0v8_B = (() => {
  const s = climbAt(548);
  return {x: s.ringL.x + 30, y: s.ringL.y - 40};
})();
// (V8 QA) a cut in on the stirrups (z 2.6): his weight on the steps, the straps running up out of the top of the frame
// (his hands and pads are above it); a short tilt up the near strap (the feet go from y 1220 to 1370; the caption sits
// at the top, over his thighs)
const S0_ANK = climbAt(528).footL.ankle.y;
const camS0v8 = (f: number) => cam1(f, [[528, S0v8_A.x - 30, S0_ANK - (1220 - 960) / 2.6, 2.6], [548, S0v8_A.x - 40, S0_ANK - (1370 - 960) / 2.6, 2.6, inOut]]);
const S0v8: React.FC<{f: number}> = ({f}) => bay(`s0${f}`, f, camS0v8(f));
/** S1v8 (548-642) "springs spread the load, so one little patch doesn't have to hold you up alone.": match cut into the
 *  same pad: the cover is cut away; the strap pulls straight, the lug and spine travel and every spring stretches
 *  together while the tiles stay put; one patch lets go (its spring slackens, its neighbours stretch further, the
 *  rest keep their share); it comes back and the load evens out; the cover is restored and the view returns to the
 *  bay's view of his hand (the spring builder's shot, retimed to the narration) */
const SPRING_HAND = (() => {
  const p = climbAt(640).padL;
  return {x: KX * p.zo + 30, y: p.y + KY * p.zo, z: SPRING_BAY_CAM.z / MM};
})();
const S1v8: React.FC<{f: number}> = ({f}) => {
  const q = springShotFilm(f);
  return <SpringScene8 id={`s1${f}`} load={q.load} cover={q.cover} lost={q.lost} view={q.view} cam={q.cam} />;
};
/** S2v8 (642-664): from his hand in the bay, out to the climb's medium framing */
const camS2v8 = (f: number) => cam1(f, [[642, SPRING_HAND.x, SPRING_HAND.y, SPRING_HAND.z], [664, CAM_CLIMB.x, CAM_CLIMB.y, CAM_CLIMB.z, inOut]]);
const S2v8: React.FC<{f: number}> = ({f}) => bay(`s2${f}`, f, camS2v8(f));
/** G1v8 (894-930) "They need a smooth surface": the contact test, from inside: the far pad arrives on the pane, touches
 *  and, as he loads it, contact spreads evenly across all 24 tiles */
const G1v8: React.FC<{f: number}> = ({f}) => {
  const p = surfaceShot(f);
  return <SurfaceScene8 id={`g1${f}`} gap={p.gap} slide={p.slide} load={p.load} cam={p.cam} />;
};
/** G1bv8 (930-954) "to grip.": the same contact in section: every wedge flat on the smooth glass, no gap anywhere */
const G1bv8: React.FC<{f: number}> = ({f}) => <Svg><WedgeView id={`g1b${f}`} st={{surface: 'glass', approach: 1, shear: keyS(f, [[930, 0.8], [946, 1]])}} cam={WEDGE_CAM} /></Svg>;
/** G3v8 (1041-1082) "and those microscopic wedges": the same wedges, same orientation and scale: on the glass (above)
 *  they bend and lie flat; on the brick (below) only a few tips reach its high points, the rest hang over gaps; as the
 *  load comes on they are dragged off and skid (rigid brick: nothing penetrates) */
// (V8 QA) the brick panel is framed on wedges 4 and 6, the two in it whose tips land on apexes (y 1030 and 1550,
// above the bottom UI band); the slip is paced so the touching tips' release takes several frames (1069-1076), not one
const G3v8: React.FC<{f: number}> = ({f}) => (
  <Svg>
    <WedgeSplit id={`g3${f}`} glass={{surface: 'glass', approach: 1, shear: keyS(f, [[1041, 0], [1058, 1]])}} brick={{surface: 'brick', approach: keyS(f, [[1041, 0.4], [1050, 1]]), shear: keyS(f, [[1050, 0], [1062, 1]]), slip: keyN(f, [[1064, 0], [1069, 0.14], [1076, 0.38], [1082, 0.62]])}} brickY={4 * 50} brickSY={1030} />
  </Svg>
);

/** each shot's camera, for the camera-track QC (the exterior and micro shots have their own) */
export const CAMS8: Record<string, (f: number) => Cam> = {
  H3: camH3, M5b: () => CAM_M5B, S0: camS0v8, S2: camS2v8, C: () => CAM_CLIMB, G2: camG2,
};
export const CAMS8_3D: Record<string, (f: number) => Cam3> = {H1: () => CAM_A, H4: camH4, E1: () => CAM_A, F1: () => CAM_A};

export const SHOTS8: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 24, name: 'H1', C: H1},
  {from: 24, to: 70, name: 'H2', C: H2v8},
  {from: 70, to: 105, name: 'H3', C: H3},
  {from: 105, to: 171, name: 'H4', C: H4},
  {from: 171, to: 232, name: 'M1', C: M1v8},
  {from: 232, to: 503, name: 'M', C: Mv8},
  {from: 503, to: 528, name: 'M5b', C: M5b},
  {from: 528, to: 548, name: 'S0', C: S0v8},
  {from: 548, to: 664, name: 'S1', C: S1v8},
  {from: 664, to: 857, name: 'C', C: CC},
  {from: 857, to: 894, name: 'E1', C: E1},
  {from: 894, to: 930, name: 'G1', C: G1v8},
  {from: 930, to: 954, name: 'G1b', C: G1bv8},
  {from: 954, to: 1041, name: 'G2', C: G2},
  {from: 1041, to: 1082, name: 'G3', C: G3v8},
  {from: 1082, to: FRAMES, name: 'F1', C: F1},
];

export const SceneAt8: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS8.find((x) => f >= x.from && f < x.to) ?? SHOTS8[SHOTS8.length - 1];
  return <s.C f={f} />;
};
export {C, CYCLES};
