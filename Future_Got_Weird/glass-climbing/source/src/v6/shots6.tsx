// Glass Climbing V6: the shot list (film frames at 30 fps, timed to the V6 narration; what each shot adds and how it
// connects is in production/V6_SHOTS_AND_TRANSITIONS.md). Every shot is a pure function of the frame.
// Camera rule: within a shot the camera holds or makes one eased move with no rebound; connected moves carry their
// velocity across a boundary; a scale change is one continuous path or an exact composition match.
// The loop: the catch (F3) and the opening (O1) are one camera move, a function of the climb's own looped time, so
// the cut from the last frame to frame 0 is inside one continuous shot.
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
import {FieldView6} from './Field6';
import {MolecularContent5} from '../v5/Molecular5';
import {allTiles, Pad3D, Pad3DState, tileVW, viewOf} from './Pad6';
import {BayWorld5 as BayWorld6} from './Bay6';
import {C, CATCH_END, climbAt, CYCLES, DY, FRAMES, keyN, MM, PZ, ss, UY, Z_BRICK} from './climb6';
import {Cam3, TowerScene} from './Tower3D';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const quadIn = (x: number) => x * x;
/** a one-argument ease (0..1) as keyN's segment ease, which is called with (t, a, b) */
const E = (e: (x: number) => number) => (t: number, a: number, b: number) => e(clamp((t - a) / (b - a)));
const quadOut = (x: number) => 1 - (1 - x) * (1 - x);
export const CamOnly = React.createContext(false);
const BayShot: React.FC<{id: string; f: number; cam: Cam; nest?: React.ReactNode}> = ({id, f, cam, nest}) => {
  const camOnly = React.useContext(CamOnly);
  return <Svg><BayWorld6 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} f={f} nest={nest} man={!camOnly} gear={!camOnly} /></Svg>;
};
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <BayShot id={id} f={f} cam={cam} nest={nest} />;
type K = [number, number, number, number, ((x: number) => number)?];
const cam1 = (f: number, keys: K[]) => camAt(f, keys);
/** a pad close-up: Pad6 on its glass, the sky (through the glass) or the pane behind it */
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
const tower = (id: string, f: number, cam: Cam3, withMan = true) => {
  const camOnly = React.useContext(CamOnly);
  return <TowerScene id={id} cam={cam} f={f} st={withMan && !camOnly ? climbAt(f) : null} />;
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerp3 = (a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}, u: number) => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u)});
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

// ------------------------------------------------------------------ 1. the opening (0-171)
/** the catch and the opening: one push in, run on the climb's looped time (it begins at the slap, 1113, and comes to
 *  rest at 30), so the last frame and frame 0 are consecutive frames of one move */
const CAMF0: Cam = {x: 250, y: -18650, z: 1.12}, CAMF1: Cam = {x: 215, y: -18420, z: 1.4};
const camCatch = (f: number): Cam => {
  const T = f < CATCH_END ? f + FRAMES : f;
  const u = sm5(clamp((T - 1113) / (FRAMES + 30 - 1113)));
  return {x: lerp(CAMF0.x, CAMF1.x, u), y: lerp(CAMF0.y, CAMF1.y, u), z: Math.exp(lerp(Math.log(CAMF0.z), Math.log(CAMF1.z), u))};
};
/** O1 (0-30) "If you pressed these pads": the end of the catch: on the fin, the far pad he has just placed takes its
 *  share, his shoulder and the strap answer, he settles (the push comes to rest) */
const O1: React.FC<{f: number}> = ({f}) => bay(`o1${f}`, f, camCatch(f));
/** O2 (30-104) "against a glass wall, you could lift your feet off the ground—": the near pad loaded on the glass, close;
 *  then down the same strap to his feet, already in their stirrups on the fin: they lift off, the straps take him, the
 *  dip (one move down, arriving as the feet lift) */
const camO2 = (f: number) => cam1(f, [[30, 70, -18400, 3.0], [36, 70, -18400, 3.0], [72, 175, -17985, 1.95, inOut]]);
const O2: React.FC<{f: number}> = ({f}) => bay(`o2${f}`, f, camO2(f));
/** O3 (104-171) "and climb it like Spider-Man.": outside: from close behind him (his far pad goes up, he rises onto it)
 *  out to the tower's corner, the street and the crowd far below (one move) */
const EYE_O3a = {x: 2.7, y: 30.2, z: 3.1}, TGT_O3a = {x: 0.4, y: 29.75, z: 0};
const EYE_O3b = {x: 23, y: 21.5, z: 44}, TGT_O3b = {x: 0, y: 25.5, z: 0};
const camO3 = (f: number): Cam3 => {
  const u = inOut(clamp((f - 104) / (171 - 104)) ** 1.9);
  return {eye: lerp3(EYE_O3a, EYE_O3b, u), target: lerp3(TGT_O3a, TGT_O3b, u), f: 1300};
};
const O3: React.FC<{f: number}> = ({f}) => tower(`o3${f}`, f, camO3(f));

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
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[280, 0], [310, 0.32], [350, 0.88], [376, 0.94], [420, 1]]), gx: 0, back: 0, glow: keyN(f, [[350, 0], [376, 0.6]]), slip: 0, y0: MICRO_Y0, count: 26});
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
    {secOp > 0.001 && <g opacity={secOp}><MicroView id={`${id}-s`} st={{surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0.6, slip: 0, y0: MICRO_Y0, count: 26}} cam={sec} /></g>}
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
const M5_END = {x: 300, y: -18900, z: 1.05};
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
  const secSt: MicroState = {surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0.6, slip: 0, y0: MICRO_Y0, count: 26};
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
const C1_CAM: Cam = {x: 245, y: -19160, z: 1.25};
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
const camC1 = (f: number) => cam1(f, [[664, C1_CAM.x, C1_CAM.y, C1_CAM.z], [720, 238, -19140, 1.34, inOut]]);
const C1: React.FC<{f: number}> = ({f}) => bay(`c1${f}`, f, camC1(f));
/** C2 (720-750) "onto the other pad.": low, on the stirrups: the near foot bearing on its bar, its strap taut; the far
 *  foot light in its slack loop (static) */
const C2: React.FC<{f: number}> = ({f}) => bay(`c2${f}`, f, {x: 175, y: -18760, z: 2.3});
/** C3 (750-800) "The first releases,": on the far pad: it peels from its lower edge, comes off, and his arm carries it
 *  up on a shoulder-and-elbow arc; the camera goes up with it (one move) */
const camC3 = (f: number) => cam1(f, [[750, 70, -19330, 2.5], [764, 70, -19330, 2.5], [800, 80, -19500, 2.3, inOut]]);
const C3: React.FC<{f: number}> = ({f}) => bay(`c3${f}`, f, camC3(f));
/** C4 (800-857) "letting you reach higher and repeat.": medium: the far pad seats and loads before the near one lets
 *  go; he rises onto it; the near pad follows; the camera rises with him a little (one move) */
const camC4 = (f: number) => cam1(f, [[800, 250, -19250, 1.12], [812, 250, -19250, 1.12], [857, 252, -19360, 1.12, inOut]]);
const C4: React.FC<{f: number}> = ({f}) => bay(`c4${f}`, f, camC4(f));

// ------------------------------------------------------------------ 5. the catch in the method (857-1082)
/** OV (857-894) "But there's a catch.": the look down past his shoulder: the drop, the pavement, the crowd, the traffic */
const EYE_OV = {x: 1.35, y: 32.6, z: -1.25}, TGT_OV = {x: -0.35, y: 28.4, z: 0.4};
const camOV = (f: number): Cam3 => {
  const u = sm5(clamp((f - 857) / 37));
  return {eye: {x: EYE_OV.x, y: EYE_OV.y + 0.15 * u, z: EYE_OV.z}, target: {x: TGT_OV.x, y: TGT_OV.y - 0.5 * u, z: TGT_OV.z}, f: 760};
};
const OV: React.FC<{f: number}> = ({f}) => tower(`ov${f}`, f, camOV(f));
/** G1 (894-954) "They need a smooth surface to grip.": through the glass, the far pad as he rises onto it: its tiles
 *  darken as the load comes on (a slow push) */
const padG1 = (f: number): Pad3DState => {
  const load = keyN(f, [[896, 0.35], [924, 1]]);
  return {yaw: -78, pitch: 4, load, contact: allTiles(keyN(f, [[896, 0.45], [926, 1]])), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(0.4 + load)), strap: 2600, ridges: 0.35};
};
const camG1 = (f: number) => cam1(f, [[894, 6, 12, 3.1], [954, 6, 12, 3.6, inOut]]);
const G1: React.FC<{f: number}> = ({f}) => <PadScene6 id={`g1${f}`} st={padG1(f)} cam={camG1(f)} />;
/** G2 (954-1041) "So you can climb glass— but switch to rough brick,": along the facade to the brick pier beside his
 *  bay: his near pad comes off the glass and goes across onto the rough brick, while the far pad on the glass holds
 *  him; he presses it on and leans his weight toward it (one track and push) */
const camG2 = (f: number) => cam1(f, [[954, 330, -19300, 1.0], [960, 330, -19300, 1.0], [1041, -10, -19420, 1.85, inOut]]);
const G2: React.FC<{f: number}> = ({f}) => bay(`g2${f}`, f, camG2(f));
/** G3 (1041-1082) "and those microscopic wedges": into the brick pad's contact edge, continuously, to the same wedges on
 *  the brick's rough face: only a few tips find a peak; as his weight comes on they peel and skid (one push in log zoom) */
const G3_O = {x: KX * Z_BRICK, y: DY(6) + KY * Z_BRICK - 30};
const brickSec = (f: number): MicroState => ({surface: 'brick', lam: keyN(f, [[1056, 0.15], [1068, 1]]), gx: 0, back: keyN(f, [[1076, 0], [1082, 22]]), glow: 0, slip: keyN(f, [[1066, 0], [1082, 46]]), y0: MICRO_Y0, count: 30});
const G3: React.FC<{f: number}> = ({f}) => {
  const z0 = 1.85, zEnd = 3.6 / UM; // bay zoom -> the section at z 3.6
  // the camera first centres on the pad's contact edge (still at the bay's scale), then goes straight in along it
  const u = sm5(clamp((f - 1041) / (1068 - 1041)));
  const bz = Math.exp(Math.log(z0) + (Math.log(zEnd) - Math.log(z0)) * u);
  const p0 = {x: -10, y: -19420}, p1 = {x: G3_O.x + 30 * UM, y: G3_O.y + 330 * UM};
  const w = ss(f, 1041, 1054);
  const cam = {x: p0.x + (p1.x - p0.x) * w, y: p0.y + (p1.y - p0.y) * w, z: bz};
  const secCam = {x: (cam.x - G3_O.x) / UM, y: (cam.y - G3_O.y) / UM, z: bz * UM};
  if (bz * UM > 2.4) return <Svg><MicroView id={`g3${f}`} st={brickSec(f)} cam={secCam} /></Svg>;
  return bay(`g3${f}`, f, cam, nestMicro(`g3${f}-n`, brickSec(f), G3_O, cam, true));
};

// ------------------------------------------------------------------ 6. the fall and the catch (1082-FRAMES)
/** F1 (1082-1098) "can't make the same": side, wide enough for the drop: the brick pad tears off; the jolt swings him
 *  out on the far pad, which peels off the glass too (static) */
const F1_CAM: Cam = {x: 200, y: -19300, z: 1.3};
const F1: React.FC<{f: number}> = ({f}) => bay(`f1${f}`, f, F1_CAM);
/** F2 (1098-1113) "same contact.": from above and to the side: he falls past the spandrels beside the facade, both pads
 *  in his hands, the stirrups on his feet, the street and its traffic far below (static) */
const F2: React.FC<{f: number}> = ({f}) => tower(`f2${f}`, f, {eye: {x: 4.5, y: 33.5, z: -4.2}, target: {x: 0.3, y: 25, z: 0.4}, f: 1050});
/** F3 (1113-FRAMES) the catch: his near hand slaps its pad flat on the glass; it loads and slides a hand's width as it
 *  takes him; his feet land on the fin, knees bending; he places the far pad (the push that runs on into frame 0) */
const F3: React.FC<{f: number}> = ({f}) => bay(`f3${f}`, f, camCatch(f));

/** each shot's camera, for the camera-track QC (the 3D shots and the scale bridges have their own) */
export const CAMS6: Record<string, (f: number) => Cam> = {
  O1: camCatch, O2: camO2, M1: camM1, M23: camMicro, S1: camS1, C1: camC1, C2: () => ({x: 175, y: -18760, z: 2.3}), C3: camC3, C4: camC4,
  G1: camG1, G2: camG2, F1: () => F1_CAM, F3: camCatch,
};

export const SHOTS6: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 30, name: 'O1', C: O1},
  {from: 30, to: 104, name: 'O2', C: O2},
  {from: 104, to: 171, name: 'O3', C: O3},
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
  {from: 857, to: 894, name: 'OV', C: OV},
  {from: 894, to: 954, name: 'G1', C: G1},
  {from: 954, to: 1041, name: 'G2', C: G2},
  {from: 1041, to: 1082, name: 'G3', C: G3},
  {from: 1082, to: 1098, name: 'F1', C: F1},
  {from: 1098, to: 1113, name: 'F2', C: F2},
  {from: 1113, to: FRAMES, name: 'F3', C: F3},
];

export const SceneAt6: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS6.find((x) => f >= x.from && f < x.to) ?? SHOTS6[SHOTS6.length - 1];
  return <s.C f={f} />;
};
export {C, CYCLES};
export type {V};
