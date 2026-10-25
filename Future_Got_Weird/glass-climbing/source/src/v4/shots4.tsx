// Glass Climbing V4: the shot list (film frames at 30 fps; narration words, what each beat adds and how it connects
// are in production/V4_SHOTS_AND_TRANSITIONS.md). Every shot is a pure function of the frame.
// Camera rule (V4): within a shot the camera holds, or makes ONE eased move (a push, a pull or a track) with no
// rebound; a shot never cuts to a near-identical framing; zooms run in log space.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp, V} from '../dc/math';
import {H, W} from '../lib';
import {camAt, camZoom, inOut, kOf, sm5} from '../camera';
import {MicroContent, MicroState, MicroView, MW, UM} from '../scenes/Micro';
import {H_BAR, H_BAR_OPEN} from '../world/rig';
import {mixHand} from '../dc/Hand';
import {KX, KY} from '../world/geo';
import {FieldState, FieldView} from '../v2/Field';
import {MolecularContent} from '../v2/Molecular';
import {PressState, PressView} from '../v3/Press';
import {BoundaryView} from '../v3/Boundary';
import {SpringScene3} from '../v3/Springs3';
import {tg3TilePos, ThroughGlass3} from '../v3/ThroughGlass3';
import {BayWorld4} from './Bay4';
import {C, climbAt, easeOut, keyN, PZ, ss, UY} from './climb4';
import {FRAMES} from './set4';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const quadIn = (x: number) => x * x;
const quadOut = (x: number) => 1 - (1 - x) * (1 - x);
/** lingers on the start (the tiles darkening), then pushes in and arrives at rest */
const lateInOut = (x: number) => inOut(Math.pow(x, 1.7));
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <Svg><BayWorld4 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} nest={nest} /></Svg>;
type K = [number, number, number, number, ((x: number) => number)?];
/** hold a framing, or move once between two framings (a hold before or after is allowed) */
const cam1 = (f: number, keys: K[]) => camAt(f, keys);

// ------------------------------------------------------------------ 1. the hook (0-176)
/** frame 0 and the last frame: his hands on both bars, the near pad going on, his face above */
export const CAM0: Cam = {x: 165, y: -1215, z: 1.9};
/** A1 (0-30) "If you pressed these pads": he presses the near pad home and pulls on both bars; a slow push in */
const camA1 = (f: number) => cam1(f, [[0, CAM0.x, CAM0.y, CAM0.z], [30, 160, -1200, 2.06, inOut]]);
const A1: React.FC<{f: number}> = ({f}) => bay(`a1${f}`, f, camA1(f));
/** A2 (30-72) "against a glass wall,": the pad on the glass in section: the soft layer compresses and darkens, the
 *  plate shears down a hair, his grip tightens; a slow push in */
const pressGlass = (f: number): PressState => {
  const p = keyN(f, [[30, 0.25], [60, 1]]);
  return {surface: 'glass', press: p, shear: 4 * p, gap: 0, tilt: 0, slide: 0, hand: mixHand(H_BAR_OPEN, H_BAR, clamp(p * 1.4)), sag: 0};
};
const camA2 = (f: number) => cam1(f, [[30, 14, -56, 7.0], [72, 18, -44, 7.9, inOut]]);
const A2: React.FC<{f: number}> = ({f}) => <Svg><PressView id={`a2${f}`} st={pressGlass(f)} cam={camA2(f)} /></Svg>;
/** A3 (72-122) "you could lift your feet off the ground—": low, on his legs, the loops and the stool (static): the near
 *  foot steps into its loop and takes his weight, the far foot follows; both leave the board, which stays below */
const camA3 = (_f: number): Cam => ({x: 215, y: -650, z: 1.8});
const A3: React.FC<{f: number}> = ({f}) => bay(`a3${f}`, f, camA3(f));
/** A4 (122-176) "and climb it like Spider-Man.": wide, the whole of him: weight onto the near loop, the far pad peels,
 *  goes up and is seated, he rises onto it; the camera tracks up with him once he starts (one move) */
const camA4 = (f: number) => cam1(f, [[122, 205, -880, 1.4], [134, 205, -880, 1.4], [176, 200, -990, 1.4, inOut]]);
const A4: React.FC<{f: number}> = ({f}) => bay(`a4${f}`, f, camA4(f));

// ------------------------------------------------------------------ 2. the microscopic mechanism (176-535)
/** M1 (176-216) "Their surfaces are covered": reverse angle through the glass onto the pad he has just seated: its
 *  tiles darken as it takes his weight; then one push into one tile, arriving at rest */
const M1: React.FC<{f: number}> = ({f}) => {
  const t = tg3TilePos();
  const cam = camZoom(f, 176, 216, {x: -120, y: 60}, 1.3, t, 52, lateInOut);
  return <Svg><ThroughGlass3 id={`m1${f}`} f={f} cam={cam} k={kOf(cam.z)} rise={0} blink={climbAt(f).blink} /></Svg>;
};
const FIELD: FieldState = {alpha: 0, beta: 0, lam: 0, surface: 'none', gx: 0, slip: 0, back: 0, y0: -1300, count: 64, zF: -700, zN: 140, fog: 1};
const fieldAt = (f: number): FieldState => ({
  ...FIELD,
  alpha: keyN(f, [[216, 0], [250, 0.8], [307, 0.9]]),
  beta: keyN(f, [[216, 0], [250, 34], [307, 24]]),
  surface: f < 262 ? 'none' : 'glass',
  gx: keyN(f, [[262, -320], [280, 0, easeOut]]),
  lam: keyN(f, [[286, 0], [307, 0.32]]),
  fog: keyN(f, [[216, 0], [240, 1]]),
});
/** M2/M3 (216-307) "in microscopic wedges. As you pull downward,": the ridges stand up into wedges, the glass comes
 *  against their tips and they start to bend; one slow move round and down */
const F0: Cam = {x: -380, y: 40, z: 2.08};
const M23: React.FC<{f: number}> = ({f}) => {
  const cam = cam1(f, [[216, F0.x, F0.y, F0.z], [307, 40, 250, 3.9, inOut]]);
  const tint = keyN(f, [[216, 0.62], [238, 0]]);
  return (
    <Svg>
      <FieldView id={`m2${f}`} st={fieldAt(f)} cam={cam} />
      {tint > 0.001 && <rect x={0} y={0} width={W} height={H} fill="#4A6670" opacity={tint} />}
    </Svg>
  );
};
const MICRO_Y0 = -80;
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[307, 0.32], [343, 0.88], [382, 0.92], [420, 1]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26});
/** M4 (307-343) "the wedges bend flat": side-on, close on three wedges as they bend and lie down */
const M4: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m4${f}`} st={secAt(f)} cam={cam1(f, [[307, 30, 300, 14], [343, 20, 345, 12.5, inOut]])} /></Svg>;
/** M5 (343-382) "against the glass.": one pull out and down the array: every wedge flat along the glass */
const M5: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m5${f}`} st={secAt(f)} cam={cam1(f, [[343, 20, 345, 12.5], [382, 26, 420, 5.2, inOut]])} /></Svg>;
/** M6 (382-423) "This brings them so close": one push (accelerating) in to one strip, where the last hairline closes */
const CP = {x: 0, y: STRIP.y + 6};
const M6: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m6${f}`} st={secAt(f)} cam={camZoom(f, 382, 423, {x: 26, y: 420}, 5.2, {x: CP.x + 1, y: CP.y}, 40, quadIn)} /></Svg>;
/** M7 (423-470) "that tiny molecular attractions": the push carries on at the same speed (easing out) across a scale
 *  bridge (a dissolve at the same place) to the molecules; the gap closes; faint ticks between the nearest pairs */
const MolScene: React.FC<{id: string; sec: Cam; nm: Cam; secOp: number; molOp: number; gap: number; cue: number}> = ({id, sec, nm, secOp, molOp, gap, cue}) => (
  <Svg>
    {secOp > 0.001 && <g opacity={secOp}><MicroView id={`${id}-s`} st={{surface: 'glass', lam: 1, gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26}} cam={sec} /></g>}
    {molOp > 0.001 && (
      <g opacity={molOp}>
        <Layer cam={nm} depth={1}>
          <MolecularContent gap={gap} cue={cue} z={nm.z} />
        </Layer>
      </g>
    )}
  </Svg>
);
const M7: React.FC<{f: number}> = ({f}) => {
  const sec = camZoom(f, 423, 470, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, quadOut);
  const u = quadOut(clamp((f - 423) / 47));
  const nm = {x: 1.6 - 0.9 * u, y: 0.6 * u, z: Math.exp(Math.log(28) + (Math.log(62) - Math.log(28)) * u)};
  return <MolScene id={`m7${f}`} sec={sec} nm={nm} secOp={1 - ss(f, 434, 444)} molOp={ss(f, 432, 442)} gap={keyN(f, [[433, 2.2], [453, 0.9], [468, 0.42]])} cue={keyN(f, [[450, 0], [466, 1]])} />;
};
/** M8/M9 (470-535) "can hold your entire weight.": ONE continuous pull out, from the molecules back across the bridge,
 *  out through the strip and the array (many contacts), out through the pad to him: he stands in the far pad's loop
 *  alone while his near hand brings the other pad up */
const nestMicro = (id: string, st: MicroState, origin: {x: number; y: number}, cam: Cam) => {
  const zm = cam.z * UM;
  if (zm * MW.pitch < 1.2) return null;
  const op = clamp((zm * MW.pitch - 1.2) / 6);
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
/** the far pad's contact face (the pad holding him at 492-522), where the section sits in the bay */
const M9_O = {x: KX * PZ.R, y: UY(4) + KY * PZ.R - 30};
const M9_END = {x: 205, y: -1570, z: 1.02};
const M89: React.FC<{f: number}> = ({f}) => {
  // one eased pull in log zoom across both scales: section zoom 520 -> 3.0 (section units), then the bay (3.0 / UM ->
  // M9_END.z); the hand-over is at the same point and the same zoom speed
  const L0 = Math.log(520), L1 = Math.log(M9_END.z * UM), Ls = Math.log(3.0);
  const L = L0 + (L1 - L0) * sm5(clamp((f - 470) / (535 - 470)));
  const P0 = {x: 40, y: 300};
  if (L > Ls) {
    const z = Math.exp(L);
    const w = (520 / z - 1) / (520 / 3.0 - 1);
    const sec = {x: CP.x + 0.02 + (P0.x - CP.x - 0.02) * w, y: CP.y + (P0.y - CP.y) * w, z};
    const v = clamp((f - 470) / 14);
    const nm = {x: 0.7 + 0.7 * v, y: 0.6, z: Math.exp(Math.log(62) + (Math.log(26) - Math.log(62)) * v)};
    return <MolScene id={`m8${f}`} sec={sec} nm={nm} secOp={ss(f, 471, 481)} molOp={1 - ss(f, 473, 483)} gap={0.42} cue={keyN(f, [[470, 1], [476, 0]])} />;
  }
  const bz = Math.exp(L) / UM, bz0 = 3.0 / UM;
  const p0 = {x: M9_O.x + P0.x * UM, y: M9_O.y + P0.y * UM};
  const w = (bz0 / bz - 1) / (bz0 / M9_END.z - 1);
  const cam = {x: p0.x + (M9_END.x - p0.x) * w, y: p0.y + (M9_END.y - p0.y) * w, z: bz};
  return bay(`m9${f}`, f, cam, nestMicro(`m9${f}-n`, {...secAt(470), lam: 1}, M9_O, cam));
};

// ------------------------------------------------------------------ 3. the springs (535-680): five held views
/** SP1 (535-566) "Special springs": the loaded pad from his side; the back cover lifts away (a slow push) */
const camSP1 = (f: number) => cam1(f, [[535, 0, 30, 2.6], [566, -2, 24, 3.0, inOut]]);
const SP1: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} cam={camSP1(f)} /></Svg>;
/** SP2 (566-598) "spread the load,": closer: the pull comes on through the handle and each spring takes its share */
const SP2: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} cam={{x: -8, y: 12, z: 5.0}} /></Svg>;
/** SP3 (598-630) "so one little patch": close on one column: the same pull on one spring alone stretches it far */
const SP3: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} cam={{x: -40, y: -8, z: 10.5}} /></Svg>;
/** SP4 (630-660) "doesn't have to hold you up": one tile loses contact, its neighbours take up its share */
const SP4: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} cam={{x: -30, y: 54, z: 8.4}} /></Svg>;
/** SP5 (660-680) "alone.": one pull back to the whole pad as the cover returns */
const camSP5 = (f: number) => cam1(f, [[660, -30, 54, 8.4], [680, 4, 40, 2.8, inOut]]);
const SP5: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} cam={camSP5(f)} /></Svg>;

// ------------------------------------------------------------------ 4. the climb (680-904)
/** C1 (680-724) "Then, you shift your weight": the whole of him on the glass, held: he settles down onto the near loop */
const camC1 = (_f: number): Cam => ({x: 200, y: -1840, z: 1.45});
const C1: React.FC<{f: number}> = ({f}) => bay(`c1${f}`, f, camC1(f));
/** C2 (724-768) "onto the other pad.": low, held, on the loops: the near strap taut under his weight, the far one slack */
const camC2 = (_f: number): Cam => ({x: 190, y: -1520, z: 1.85});
const C2: React.FC<{f: number}> = ({f}) => bay(`c2${f}`, f, camC2(f));
/** C3 (768-842) "The first releases, letting you reach higher": on the two pads and his head: the upper pad peels
 *  (the lower one, and the hand on it, stay put), then the camera tracks up with it (one move) to where it is seated */
const camC3 = (f: number) => cam1(f, [[768, 120, -2050, 2.15], [790, 120, -2050, 2.15], [838, 118, -2195, 2.15, inOut]]);
const C3: React.FC<{f: number}> = ({f}) => bay(`c3${f}`, f, camC3(f));
/** C4 (842-904) "and repeat. But there's a catch.": wide, the whole of him: he rises onto the far loop; he looks
 *  down, and the camera goes down the wall with his look to where the glass meets the brick (one move) */
const camC4 = (f: number) => cam1(f, [[842, 200, -1890, 1.32], [872, 200, -1890, 1.32], [904, 80, -1010, 1.0, inOut]]);
const C4: React.FC<{f: number}> = ({f}) => bay(`c4${f}`, f, camC4(f));

// ------------------------------------------------------------------ 5. the catch (904-1106) and the loop (1106-FRAMES)
/** K2 (904-945) "They need a smooth surface": the foot of the wall in section, glass above, brick below (one slide down) */
const camK2 = (f: number) => cam1(f, [[904, 6, -170, 6.6], [945, 4, 50, 7.2, inOut]]);
const K2: React.FC<{f: number}> = ({f}) => <Svg><BoundaryView id={`k2${f}`} cam={camK2(f)} /></Svg>;
/** K3 (945-1018) "to grip. So you can climb glass—": on the stool at the foot of the wall: the near pad comes off the
 *  glass and goes down onto the brick as he bends his knees; the camera follows it down a little (one move) */
const camK3 = (f: number) => cam1(f, [[945, 170, -1065, 1.6], [978, 170, -1065, 1.6], [1012, 170, -1005, 1.6, inOut]]);
const K3: React.FC<{f: number}> = ({f}) => bay(`k3${f}`, f, camK3(f));
/** K5 (1018-1063) "but switch to rough brick,": in section, the same view as A2 on brick: the layer rides on the peaks
 *  and cannot reach the pits; under his test pull it seems to hold (one push in) */
const pressBrick = (f: number): PressState => {
  const p = keyN(f, [[1017, 0.2], [1032, 1]]);
  return {surface: 'brick', press: p, shear: 2 * p + keyN(f, [[1040, 0], [1060, 2]]), gap: keyN(f, [[1017, 3], [1026, 0, easeOut]]), tilt: 0, slide: keyN(f, [[1050, 0], [1060, 1.2]]), hand: mixHand(H_BAR_OPEN, H_BAR, clamp(p * 1.4)), sag: 20};
};
const camK5 = (f: number) => cam1(f, [[1018, 50, -6, 3.6], [1050, 14, -30, 8.0, inOut]]);
const K5: React.FC<{f: number}> = ({f}) => <Svg><PressView id={`k5${f}`} st={pressBrick(f)} cam={camK5(f)} /></Svg>;
/** K6 (1063-1107) "and those microscopic wedges": the same wedges side by side at the same scale: on glass every one
 *  lies flat in contact; on brick only a few tips reach a peak, and under the pull those skid off (a slight pull) */
const splitSt = (f: number, surface: 'glass' | 'brick'): MicroState => ({surface, lam: keyN(f, [[1068, 0], [1084, 1]]), gx: 0, back: keyN(f, [[1063, 14], [1069, 0]]), glow: 0, slip: surface === 'brick' ? keyN(f, [[1086, 0], [1106, 70]]) : 0, y0: MICRO_Y0, count: 34});
const K6: React.FC<{f: number}> = ({f}) => {
  const z = keyN(f, [[1063, 3.9], [1106, 3.5]]);
  const cy = keyN(f, [[1063, 300], [1106, 340]]);
  const half = (surface: 'glass' | 'brick', side: number) => (
    <g clipPath={`url(#k6${f}-${surface})`}>
      <MicroView id={`k6${f}${surface}`} st={splitSt(f, surface)} cam={{x: 22 - (side * 270) / z, y: cy, z}} />
    </g>
  );
  return (
    <Svg>
      <defs>
        <clipPath id={`k6${f}-glass`}><rect x={0} y={0} width={538} height={H} /></clipPath>
        <clipPath id={`k6${f}-brick`}><rect x={542} y={0} width={538} height={H} /></clipPath>
      </defs>
      {half('glass', -1)}
      {half('brick', 1)}
      <rect x={538} y={0} width={4} height={H} fill="#F4F7F8" />
    </Svg>
  );
};
/** K7 (1107-FRAMES) "can't make the same contact.": back on him, held: he pulls; the pad skids, tips and tears off the
 *  brick; then the camera rides up with the pad to the glass, where he presses it on (one move): frame 0 */
const camK7 = (f: number) => cam1(f, [[1107, 170, -1045, 1.6], [1136, 170, -1045, 1.6], [FRAMES, CAM0.x, CAM0.y, CAM0.z, inOut]]);
const K7: React.FC<{f: number}> = ({f}) => bay(`k7${f}`, f, camK7(f));

/** each shot's camera (for the camera-track QC; the micro scale bridges and the split have their own) */
export const CAMS4: Record<string, (f: number) => Cam> = {
  A1: camA1, A2: camA2, A3: camA3, A4: camA4,
  M1: (f) => camZoom(f, 176, 216, {x: -120, y: 60}, 1.3, tg3TilePos(), 52, lateInOut),
  M23: (f) => cam1(f, [[216, F0.x, F0.y, F0.z], [307, 40, 250, 3.9, inOut]]),
  M4: (f) => cam1(f, [[307, 30, 300, 14], [343, 20, 345, 12.5, inOut]]),
  M5: (f) => cam1(f, [[343, 20, 345, 12.5], [382, 26, 420, 5.2, inOut]]),
  M6: (f) => camZoom(f, 382, 423, {x: 26, y: 420}, 5.2, {x: CP.x + 1, y: CP.y}, 40, quadIn),
  M7: (f) => camZoom(f, 423, 470, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, quadOut),
  SP1: camSP1, SP2: () => ({x: -8, y: 12, z: 5.0}), SP3: () => ({x: -40, y: -8, z: 10.5}), SP4: () => ({x: -30, y: 54, z: 8.4}), SP5: camSP5,
  C1: camC1, C2: camC2, C3: camC3, C4: camC4, K2: camK2, K3: camK3, K5: camK5, K7: camK7,
};

export const SHOTS4: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 30, name: 'A1', C: A1},
  {from: 30, to: 72, name: 'A2', C: A2},
  {from: 72, to: 122, name: 'A3', C: A3},
  {from: 122, to: 176, name: 'A4', C: A4},
  {from: 176, to: 216, name: 'M1', C: M1},
  {from: 216, to: 307, name: 'M23', C: M23},
  {from: 307, to: 343, name: 'M4', C: M4},
  {from: 343, to: 382, name: 'M5', C: M5},
  {from: 382, to: 423, name: 'M6', C: M6},
  {from: 423, to: 470, name: 'M7', C: M7},
  {from: 470, to: 535, name: 'M89', C: M89},
  {from: 535, to: 566, name: 'SP1', C: SP1},
  {from: 566, to: 598, name: 'SP2', C: SP2},
  {from: 598, to: 630, name: 'SP3', C: SP3},
  {from: 630, to: 660, name: 'SP4', C: SP4},
  {from: 660, to: 680, name: 'SP5', C: SP5},
  {from: 680, to: 724, name: 'C1', C: C1},
  {from: 724, to: 768, name: 'C2', C: C2},
  {from: 768, to: 842, name: 'C3', C: C3},
  {from: 842, to: 904, name: 'C4', C: C4},
  {from: 904, to: 945, name: 'K2', C: K2},
  {from: 945, to: 1018, name: 'K3', C: K3},
  {from: 1018, to: 1063, name: 'K5', C: K5},
  {from: 1063, to: 1107, name: 'K6', C: K6},
  {from: 1107, to: FRAMES, name: 'K7', C: K7},
];

export const SceneAt4: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS4.find((x) => f >= x.from && f < x.to) ?? SHOTS4[SHOTS4.length - 1];
  return <s.C f={f} />;
};
export {C};
export type {V};
