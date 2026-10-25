// Glass Climbing V5: the shot list (film frames at 30 fps; narration words, what each shot adds and how it connects are
// in production/V5_SHOTS_AND_TRANSITIONS.md). Every shot is a pure function of the frame.
// Camera rule (as V4): within a shot the camera holds, or makes ONE eased move (a push, a pull, a track) with no
// rebound; a shot never cuts to a near-identical framing; zooms run in log space.
// The loop: E6 (the last shot) and H1 (the first) are one static framing, CAM0, so the cut 1161 -> 0 is inside a held
// shot of a continuous motion.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp, V} from '../dc/math';
import {H, W} from '../lib';
import {camAt, camZoom, inOut, kOf, sm5} from '../camera';
import {mixHand} from '../dc/Hand';
import {H_BAR, H_BAR_OPEN} from '../world/rig';
import {KX, KY} from '../world/geo';
import {MicroContent, MicroState, MicroView, MW, UM} from './Micro5';
import {FieldState, FieldView5} from './Field5';
import {MolecularContent5} from './Molecular5';
import {allTiles, P3D, Pad3DState, tileVW, viewOf} from './Pad3D';
import {PadScene} from './PadScene';
import {LookDown} from './LookDown';
import {BayWorld5, contactTiles} from './Bay5';
import {C, climbAt, CYCLES, FRAMES, keyN, PZ, ss, UY} from './climb5';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const quadIn = (x: number) => x * x;
const quadOut = (x: number) => 1 - (1 - x) * (1 - x);
/** QC: draw the shots with the climber and his gear hidden, to watch the cameras alone */
export const CamOnly = React.createContext(false);
const BayShot: React.FC<{id: string; f: number; cam: Cam; nest?: React.ReactNode}> = ({id, f, cam, nest}) => {
  const camOnly = React.useContext(CamOnly);
  return <Svg><BayWorld5 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} f={f} nest={nest} man={!camOnly} gear={!camOnly} /></Svg>;
};
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <BayShot id={id} f={f} cam={cam} nest={nest} />;
type K = [number, number, number, number, ((x: number) => number)?];
const cam1 = (f: number, keys: K[]) => camAt(f, keys);
/** a pad close-up (Pad3D in its setting; units mm) */
const padShot = (id: string, st: Pad3DState, cam: Cam) => <Svg><PadScene id={id} st={st} cam={cam} /></Svg>;

// ------------------------------------------------------------------ 1. the hook (0-179)
/** the first and last framing: tight 3/4 on his face, both hands and both pads */
export const CAM0: Cam = {x: 176, y: -18470, z: 1.9};
/** H1 (0-18) "If you": he swings out hanging from the far pad; alarm; his free hand taps the near pad onto the glass;
 *  the swing stops; the pull goes through the bar, the strap, his arms (held: the end of E6's held framing) */
const camH1 = (_f: number): Cam => CAM0;
const H1: React.FC<{f: number}> = ({f}) => bay(`h1${f}`, f, camH1(f));
/** H2 (18-60) "pressed these pads against a glass wall,": oblique close-up of the near pad: the tiles on the glass,
 *  the bar pulled down, the spine and springs taking up the load (the cover translucent); one slow push */
const padH2 = (f: number): Pad3DState => {
  const load = keyN(f, [[18, 0.3], [30, 0.55], [52, 1]]);
  return {yaw: 38, pitch: 16, load, contact: allTiles(keyN(f, [[18, 0.55], [46, 1]])), cover: keyN(f, [[18, 1], [32, 0.35]]), gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(0.4 + load)), strap: 380};
};
const camH2 = (f: number) => cam1(f, [[18, 60, 30, 3.9], [60, 54, 34, 4.4, inOut]]);
const H2: React.FC<{f: number}> = ({f}) => padShot(`h2${f}`, padH2(f), camH2(f));
/** H3 (60-104) "you could lift your feet off the ground—": low, on his legs and the fin: the shoes come off the
 *  ledge, the knees bend, the loops take his weight (a dip), steady (static) */
const camH3 = (_f: number): Cam => ({x: 215, y: -17990, z: 1.75});
const H3: React.FC<{f: number}> = ({f}) => bay(`h3${f}`, f, camH3(f));
/** H4 (104-140) "and climb it": side view on his far arm: the far pad peels, goes up and is seated; the camera
 *  follows it up (one move) */
const camH4 = (f: number) => cam1(f, [[104, 120, -18560, 1.55], [112, 120, -18560, 1.55], [140, 120, -18690, 1.55, inOut]]);
const H4: React.FC<{f: number}> = ({f}) => bay(`h4${f}`, f, camH4(f));
/** H5 (140-179) "like Spider-Man.": he rises onto the far loop as the camera pulls out (one move) to the whole tower:
 *  a tiny figure high on the glass, the street with its people and traffic far below */
const camH5 = (f: number) => camZoom(f, 140, 176, {x: 260, y: -18520}, 0.72, {x: 1500, y: -11000}, 0.062, (x) => sm5(x));
const H5: React.FC<{f: number}> = ({f}) => bay(`h5${f}`, f, camH5(f));

// ------------------------------------------------------------------ 2. the microscopic mechanism (179-533)
/** M1 (179-216) "Their surfaces are covered": the far pad (holding him) turns from his side to its face, seen through
 *  the glass: 24 tiles, dark where they touch (one move round) */
const padM1 = (f: number): Pad3DState => {
  const u = sm5(clamp((f - 179) / 37));
  return {yaw: 62 - 150 * u, pitch: 12 - 6 * u, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 300, ridges: ss(f, 200, 216) * 0.8};
};
const camM1 = (f: number) => cam1(f, [[179, 40, 20, 3.2], [216, 10, 10, 4.2, inOut]]);
const M1: React.FC<{f: number}> = ({f}) => padShot(`m1${f}`, padM1(f), camM1(f));
/** M2 (216-253) "in microscopic": one push into one tile: its ridges (rows of wedges) come up */
const TILE = tileVW(1, 2);
const padM2 = (f: number): Pad3DState => ({...padM1(216), ridges: 0.8 + 0.2 * ss(f, 216, 236)});
const camM2 = (f: number) => {
  // through the glass the pad's w axis runs screen-left; the tile centre is at (-w, v) on screen near this yaw
  const tp = viewOf(padM2(216)).world({u: 0, v: TILE.v, w: TILE.w});
  const p0 = {x: 10, y: 10}, p1 = {x: tp.x, y: tp.y};
  return camZoom(f, 216, 246, p0, 4.2, p1, 22, inOut);
};
const M2: React.FC<{f: number}> = ({f}) => {
  const fade = ss(f, 244, 253);
  return (
    <>
      {padShot(`m2${f}`, padM2(f), camM2(f))}
      {fade > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: fade}}><M3 f={f} /></div>}
    </>
  );
};
/** M3 (253-307) "wedges. As you pull downward,": the wedges in 3D; the glass slides in against their tips; the pull
 *  shears them and they start to bend (one slow move round and down) */
const FIELD: FieldState = {alpha: 0, beta: 0, lam: 0, surface: 'none', gx: 0, slip: 0, back: 0, y0: -1300, count: 64, zF: -700, zN: 140, fog: 1};
const fieldAt = (f: number): FieldState => ({
  ...FIELD,
  alpha: keyN(f, [[250, 0.5], [278, 0.8]]),
  beta: keyN(f, [[250, 12], [276, 34], [307, 24]]),
  surface: f < 262 ? 'none' : 'glass',
  gx: keyN(f, [[262, -1500], [292, 0]]),
  lam: keyN(f, [[292, 0], [307, 0.32]]),
  fog: keyN(f, [[250, 0], [266, 1]]),
});
const F0: Cam = {x: -380, y: 40, z: 2.08};
const camM3 = (f: number) => cam1(f, [[250, F0.x, F0.y, F0.z], [307, 40, 250, 3.9, inOut]]);
const M3: React.FC<{f: number}> = ({f}) => <Svg><FieldView5 id={`m3${f}`} st={fieldAt(f)} cam={camM3(f)} /></Svg>;
const MICRO_Y0 = -80;
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[307, 0.32], [343, 0.88], [382, 0.92], [420, 1]]), gx: 0, back: 0, glow: keyN(f, [[340, 0], [376, 0.6]]), slip: 0, y0: MICRO_Y0, count: 26});
/** M4 (307-343) "the wedges bend flat": side-on, close on three wedges as they bend and lie down */
const camM4 = (f: number) => cam1(f, [[307, 30, 300, 14], [343, 20, 345, 12.5, inOut]]);
const M4: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m4${f}`} st={secAt(f)} cam={camM4(f)} /></Svg>;
/** M5 (343-382) "against the glass.": one track down the array: every wedge flat along the glass */
const camM5 = (f: number) => cam1(f, [[343, 22, 330, 6.0], [382, 26, 420, 6.0, inOut]]);
const M5: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m5${f}`} st={secAt(f)} cam={camM5(f)} /></Svg>;
/** M6 (382-423) "This brings them so close": one push (accelerating) in to one strip, where the last hairline closes */
const CP = {x: 0, y: STRIP.y + 6};
const camM6 = (f: number) => camZoom(f, 382, 423, {x: 26, y: 420}, 6.0, {x: CP.x + 1, y: CP.y}, 40, quadIn);
const M6: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m6${f}`} st={secAt(f)} cam={camM6(f)} /></Svg>;
/** M7 (423-476) "that tiny molecular attractions": the push carries on (easing out) across a scale bridge to the
 *  molecules, in side profile; the gap closes; faint ticks between the nearest pairs */
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
const NM0 = 120, NM1 = 190; // px per nm across the molecular view
const camM7sec = (f: number) => camZoom(f, 423, 470, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, quadOut);
const M7: React.FC<{f: number}> = ({f}) => {
  const u = quadOut(clamp((f - 423) / 53));
  const nm = {x: 1.2 - 0.8 * u, y: 0.4 * u, z: Math.exp(Math.log(NM0) + (Math.log(NM1) - Math.log(NM0)) * u)};
  return <MolScene id={`m7${f}`} sec={camM7sec(f)} nm={nm} secOp={1 - ss(f, 434, 444)} molOp={ss(f, 432, 442)} gap={keyN(f, [[433, 2.2], [455, 0.9], [470, 0.42]])} cue={keyN(f, [[452, 0], [470, 1]])} />;
};
/** M8 (476-533) "can hold your entire weight.": ONE continuous pull out, from the section out through the array and
 *  the pad to him on the tower, high above the street: he hangs on the far pad while his near hand brings the other
 *  pad up */
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
/** the far pad's contact face (the pad holding him through 476-533), where the section sits in the bay */
const M8_O = {x: KX * PZ.R, y: UY(2) + KY * PZ.R - 30};
const M8_END = {x: 420, y: -17600, z: 0.3};
const M8: React.FC<{f: number}> = ({f}) => {
  // one eased pull in log zoom across both scales: section zoom 40 -> 3.0 (section units), then the bay (3.0 / UM ->
  // M8_END.z); the hand-over is at the same point and the same zoom speed
  const L0 = Math.log(40), L1 = Math.log(M8_END.z * UM), Ls = Math.log(3.0);
  const L = L0 + (L1 - L0) * sm5(clamp((f - 476) / (530 - 476)));
  const P0 = {x: 40, y: 300};
  if (L > Ls) {
    const z = Math.exp(L);
    const w = (40 / z - 1) / (40 / 3.0 - 1);
    const sec = {x: CP.x + 1 + (P0.x - CP.x - 1) * w, y: CP.y + (P0.y - CP.y) * w, z};
    return <Svg><MicroView id={`m8${f}`} st={{...secAt(476), lam: 1, glow: 0.6}} cam={sec} /></Svg>;
  }
  const bz = Math.exp(L) / UM, bz0 = 3.0 / UM;
  const p0 = {x: M8_O.x + P0.x * UM, y: M8_O.y + P0.y * UM};
  const w = (bz0 / bz - 1) / (bz0 / M8_END.z - 1);
  const cam = {x: p0.x + (M8_END.x - p0.x) * w, y: p0.y + (M8_END.y - p0.y) * w, z: bz};
  return bay(`m8${f}`, f, cam, nestMicro(`m8${f}-n`, {...secAt(476), lam: 1}, M8_O, cam));
};

// ------------------------------------------------------------------ 3. the springs (533-680)
/** SP1 (533-593) "Special springs spread the load,": the loaded pad from behind, the cover comes off; his hand pulls
 *  the bar down; the spine travels and every spring stretches together; the tiles stay put and darken (a slow push) */
const padSP = (f: number): Pad3DState => {
  const load = keyN(f, [[533, 0.25], [552, 0.25], [580, 1]]);
  return {yaw: 58, pitch: 14, load, contact: allTiles(keyN(f, [[552, 0.5], [580, 1]])), cover: keyN(f, [[533, 1], [550, 0]]), gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: mixHand(H_BAR_OPEN, H_BAR, clamp(load * 1.3)), strap: 300};
};
const camSP1 = (f: number) => cam1(f, [[533, 22, 14, 4.3], [593, 18, 16, 5.0, inOut]]);
const SP1: React.FC<{f: number}> = ({f}) => padShot(`sp1${f}`, padSP(f), camSP1(f));
/** SP2 (593-625) "so one little patch": close on the springs: what if one patch took it all: its spring alone
 *  stretches far (warm), the others go slack */
const ONE = 2 * 4 + 1; // the patch (column 1, row 2)
const shareAt = (f: number) => {
  const u = keyN(f, [[597, 0], [612, 1], [628, 1], [648, 0]]);
  return allTiles(1).map((_, i) => (i === ONE ? 1 + 5 * u : 1 - u));
};
const camSP2 = (f: number) => cam1(f, [[593, -14, 0, 7.6], [625, -16, 4, 8.2, inOut]]);
const SP2: React.FC<{f: number}> = ({f}) => padShot(`sp2${f}`, {...padSP(f), cover: 0, share: shareAt(f), contact: allTiles(1).map((_, i) => (i === ONE ? 1 : 1 - 0.6 * keyN(f, [[597, 0], [612, 1], [628, 1], [648, 0]])))}, camSP2(f));
/** SP3 (625-680) "doesn't have to hold you up alone.": the load goes back to all 24 springs together, every tile dark;
 *  one pull back to the whole pad as the cover returns */
const camSP3 = (f: number) => cam1(f, [[625, 30, 12, 5.6], [672, 60, 60, 2.5, inOut]]);
const SP3: React.FC<{f: number}> = ({f}) => padShot(`sp3${f}`, {...padSP(f), cover: keyN(f, [[652, 0], [672, 1]]), share: shareAt(f), contact: allTiles(1).map((_, i) => (i === ONE ? 1 : 1 - 0.6 * keyN(f, [[597, 0], [612, 1], [628, 1], [648, 0]])))}, camSP3(f));

// ------------------------------------------------------------------ 4. the climb (680-904)
/** C1 (680-724) "Then, you shift your weight": side profile, the whole of him, feet in their loops (a slow push) */
const camC1 = (f: number) => cam1(f, [[680, 250, -18620, 1.3], [724, 245, -18610, 1.4, inOut]]);
const C1: React.FC<{f: number}> = ({f}) => bay(`c1${f}`, f, camC1(f));
/** C2 (724-768) "onto the other pad.": low on the loops: the near strap taut under his weight, the far foot light */
const camC2 = (f: number) => cam1(f, [[724, 215, -18330, 1.9], [768, 212, -18345, 2.0, inOut]]);
const C2: React.FC<{f: number}> = ({f}) => bay(`c2${f}`, f, camC2(f));
/** C3 (768-801) "The first releases,": close on the far pad as it peels off the glass (static) */
const camC3 = (_f: number): Cam => ({x: -10, y: -18905, z: 3.4});
const C3: React.FC<{f: number}> = ({f}) => bay(`c3${f}`, f, camC3(f));
/** C4 (801-842) "letting you reach": 3/4 on his far arm reaching up with the pad; the camera goes up with it */
const camC4 = (f: number) => cam1(f, [[801, 160, -18900, 1.7], [838, 160, -19050, 1.7, inOut]]);
const C4: React.FC<{f: number}> = ({f}) => bay(`c4${f}`, f, camC4(f));
/** C5 (842-868) "higher and repeat.": wide side view: he rises onto the far loop (static) */
const camC5 = (_f: number): Cam => ({x: 270, y: -18600, z: 0.8});
const C5: React.FC<{f: number}> = ({f}) => bay(`c5${f}`, f, camC5(f));
/** C6 (868-904) "But there's a catch.": the look down past his shoulder to the street */
const C6: React.FC<{f: number}> = ({f}) => {
  const camOnly = React.useContext(CamOnly);
  return camOnly ? <Svg><rect width={W} height={H} fill="#557" /></Svg> : <LookDown id={`c6${f}`} f={f} f0={868} />;
};

// ------------------------------------------------------------------ 5. the brick (904-1095), the fall and the loop
/** E1 (904-950) "They need a smooth surface": an exterior track along the facade, from the glass bays to the brick
 *  pier beside his bay, as he shifts up onto the far loop (one move) */
const camE1 = (f: number) => cam1(f, [[904, 760, -18760, 0.72], [948, 180, -18820, 0.84, inOut]]);
const E1: React.FC<{f: number}> = ({f}) => bay(`e1${f}`, f, camE1(f));
/** E2 (950-990) "to grip. So you can": medium-wide: the near pad comes off the glass and goes across onto the brick */
const camE2 = (_f: number): Cam => ({x: 130, y: -18860, z: 1.25});
const E2: React.FC<{f: number}> = ({f}) => bay(`e2${f}`, f, camE2(f));
/** E3 (990-1017) "climb glass—": close: the pad on the pier's rough brick, the far pad still on the glass beside it */
const camE3 = (f: number) => cam1(f, [[990, -40, -18930, 2.7], [1017, -46, -18925, 2.95, inOut]]);
const E3: React.FC<{f: number}> = ({f}) => bay(`e3${f}`, f, camE3(f));
/** E4 (1017-1063) "but switch to rough brick,": the cutaway on brick: only a few tiles touch; their springs take the
 *  whole pull and stretch far, the rest hang slack; the pad creeps down (a slow push) */
const BRICK = [0.15, 0, 0, 0.6, 0, 0.1, 0, 0, 0, 0, 0.8, 0, 0.3, 0, 0, 0, 0, 0, 0, 0.5, 0, 0.1, 0, 0];
const padE4 = (f: number): Pad3DState => {
  const load = keyN(f, [[1017, 0.3], [1050, 0.85]]);
  const touch = BRICK.reduce((a, c) => a + (c > 0 ? 1 : 0), 0);
  return {yaw: 56, pitch: 12, load, contact: BRICK.map((c) => Math.min(1, c * 1.6)), share: BRICK.map((c) => (c > 0 ? (24 / touch) * Math.min(1, c * 1.6) * 0.6 : 0)), cover: 0, gap: 0, tilt: keyN(f, [[1040, 0], [1063, 2.5]]), slide: keyN(f, [[1030, 0], [1063, 9]]), surface: 'brick', hand: H_BAR, strap: 300};
};
const camE4 = (f: number) => cam1(f, [[1017, 30, 14, 3.4], [1063, 26, 22, 3.9, inOut]]);
const E4: React.FC<{f: number}> = ({f}) => padShot(`e4${f}`, padE4(f), camE4(f));
/** E5 (1063-1095) "and those microscopic wedges": the section on brick: a few tips catch isolated peaks; as he shifts
 *  his weight they peel and skid down (a slight push) */
const brickSec = (f: number): MicroState => ({surface: 'brick', lam: keyN(f, [[1063, 0.2], [1078, 1]]), gx: 0, back: keyN(f, [[1086, 0], [1095, 30]]), glow: 0, slip: keyN(f, [[1076, 0], [1095, 60]]), y0: MICRO_Y0, count: 30});
const camE5 = (f: number) => cam1(f, [[1063, 30, 330, 3.6], [1095, 26, 345, 4.1, inOut]]);
const E5: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`e5${f}`} st={brickSec(f)} cam={camE5(f)} /></Svg>;
/** E6 (1095-1125) "can't make the same": wide: the pad tears off, he drops and swings out hanging from the far pad,
 *  the straps snap taut, the far pad slides down the glass and holds (static) */
const camE6 = (_f: number): Cam => ({x: 420, y: -18560, z: 0.5});
const E6: React.FC<{f: number}> = ({f}) => bay(`e6${f}`, f, camE6(f));
/** E7 (1125-FRAMES) "contact.": tight, CAM0 held: he reaches back to the glass with the near pad (H1 follows) */
const E7: React.FC<{f: number}> = ({f}) => bay(`e7${f}`, f, CAM0);

/** each shot's camera (for the camera-track QC; the micro scale bridges have their own) */
export const CAMS5: Record<string, (f: number) => Cam> = {
  H1: camH1, H2: camH2, H3: camH3, H4: camH4, H5: camH5,
  M1: camM1, M2: camM2, M3: camM3, M4: camM4, M5: camM5, M6: camM6, M7: camM7sec,
  SP1: camSP1, SP2: camSP2, SP3: camSP3,
  C1: camC1, C2: camC2, C3: camC3, C4: camC4, C5: camC5,
  E1: camE1, E2: camE2, E3: camE3, E4: camE4, E5: camE5, E6: camE6, E7: () => CAM0,
};

export const SHOTS5: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 18, name: 'H1', C: H1},
  {from: 18, to: 60, name: 'H2', C: H2},
  {from: 60, to: 104, name: 'H3', C: H3},
  {from: 104, to: 140, name: 'H4', C: H4},
  {from: 140, to: 179, name: 'H5', C: H5},
  {from: 179, to: 216, name: 'M1', C: M1},
  {from: 216, to: 253, name: 'M2', C: M2},
  {from: 253, to: 307, name: 'M3', C: M3},
  {from: 307, to: 343, name: 'M4', C: M4},
  {from: 343, to: 382, name: 'M5', C: M5},
  {from: 382, to: 423, name: 'M6', C: M6},
  {from: 423, to: 476, name: 'M7', C: M7},
  {from: 476, to: 533, name: 'M8', C: M8},
  {from: 533, to: 593, name: 'SP1', C: SP1},
  {from: 593, to: 625, name: 'SP2', C: SP2},
  {from: 625, to: 680, name: 'SP3', C: SP3},
  {from: 680, to: 724, name: 'C1', C: C1},
  {from: 724, to: 768, name: 'C2', C: C2},
  {from: 768, to: 801, name: 'C3', C: C3},
  {from: 801, to: 842, name: 'C4', C: C4},
  {from: 842, to: 868, name: 'C5', C: C5},
  {from: 868, to: 904, name: 'C6', C: C6},
  {from: 904, to: 950, name: 'E1', C: E1},
  {from: 950, to: 990, name: 'E2', C: E2},
  {from: 990, to: 1017, name: 'E3', C: E3},
  {from: 1017, to: 1063, name: 'E4', C: E4},
  {from: 1063, to: 1095, name: 'E5', C: E5},
  {from: 1095, to: 1125, name: 'E6', C: E6},
  {from: 1125, to: FRAMES, name: 'E7', C: E7},
];

export const SceneAt5: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS5.find((x) => f >= x.from && f < x.to) ?? SHOTS5[SHOTS5.length - 1];
  return <s.C f={f} />;
};
export {C, CYCLES, contactTiles, P3D, KY};
export type {V};
