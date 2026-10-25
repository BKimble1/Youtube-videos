// Glass Climbing V3: the shot list (film frames at 30 fps; narration words, what each beat adds and how it connects
// are in production/V3_SHOTS_AND_TRANSITIONS.md). Every shot is a pure function of the frame.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp, V} from '../dc/math';
import {H, W} from '../lib';
import {camAt, camZoom, inC, inOut, kOf, sm5} from '../camera';
import {MicroContent, MicroState, MicroView, MW, UM} from '../scenes/Micro';
import {gripOf, prPad} from '../world/geo';
import {H_BAR, H_BAR_OPEN} from '../world/rig';
import {mixHand} from '../dc/Hand';
import {FieldState, FieldView} from '../v2/Field';
import {MolecularContent} from '../v2/Molecular';
import {BayWorld3} from './Bay3';
import {C, climbAt, easeOut, keyN, LY, RY, ss} from './climb3';
import {PressState, PressView} from './Press';
import {BoundaryView} from './Boundary';
import {SpringScene3} from './Springs3';
import {tg3TilePos, ThroughGlass3} from './ThroughGlass3';
import {BRICK_PAD_Y, FRAMES} from './set3';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const lin = (x: number) => x;
const grip = (f: number, side: 'L' | 'R'): V => {
  const s = climbAt(f);
  return prPad(gripOf(side === 'L' ? s.padL : s.padR));
};
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <Svg><BayWorld3 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} nest={nest} /></Svg>;

// ------------------------------------------------------------------ 1. the hook (0-176)
/** frame 0 and the last frame: close on him at the wall, his hands on both bars, the near pad going on */
export const CAM0: Cam = {x: 205, y: -1135, z: 1.85};
/** A1 (0-30) "If you pressed these pads": he presses the near pad home and pulls on both bars; the camera eases in */
const A1: React.FC<{f: number}> = ({f}) => bay(`a1${f}`, f, camAt(f, [[0, CAM0.x, CAM0.y, CAM0.z], [30, 140, -1140, 2.3, inOut]]));
/** A2 (30-72) "against a glass wall,": cut in to the pad on the glass in section: the soft contact layer compresses and
 *  darkens, the plate shears down a hair, his grip tightens; the camera pulls back over the pad and down its strap */
const pressGlass = (f: number): PressState => {
  const p = keyN(f, [[30, 0.25], [60, 1]]);
  return {surface: 'glass', press: p, shear: 4 * p, gap: 0, tilt: 0, slide: 0, hand: mixHand(H_BAR_OPEN, H_BAR, clamp(p * 1.4)), sag: 0};
};
const A2: React.FC<{f: number}> = ({f}) => <Svg><PressView id={`a2${f}`} st={pressGlass(f)} cam={camAt(f, [[30, 10, -60, 8.5], [46, 16, -40, 7.2, inOut], [60, 80, 40, 3.0, inOut], [72, 70, 200, 2.4, inOut]])} /></Svg>;
/** A3 (72-101) "you could lift your feet": down the straps to his feet on the stool: the right foot steps up into its
 *  stirrup, then the left; both leave the stool, which stays below */
const A3: React.FC<{f: number}> = ({f}) => bay(`a3${f}`, f, camAt(f, [[72, 215, -470, 1.75], [86, 230, -500, 1.6, inOut], [101, 250, -600, 1.35, inOut]]));
/** A4 (101-124) "off the ground—": the camera pulls back and round to the whole of him hanging on the glass, the stool
 *  empty below him, the building rising out of frame */
const A4: React.FC<{f: number}> = ({f}) => bay(`a4${f}`, f, camAt(f, [[101, 250, -640, 1.25], [113, 300, -900, 0.75, inOut], [124, 300, -990, 0.66, inOut]]));
/** A5 (124-152) "and climb it": the far pad peels off; the camera rises with his far hand as it reaches up */
const A5: React.FC<{f: number}> = ({f}) => {
  const g = grip(f, 'R');
  const cam = camAt(f, [[124, 300, -1000, 0.66], [134, 170, -1180, 1.0, inOut]]);
  const k = ss(f, 132, 146);
  return bay(`a5${f}`, f, {x: cam.x + (g.x + 160 - cam.x) * k, y: cam.y + (g.y + 130 - cam.y) * k, z: cam.z});
};
/** A6 (152-176) "like Spider-Man": the pad seats; he pulls himself up onto it; the camera moves in to that pad */
const A6: React.FC<{f: number}> = ({f}) => {
  const g0 = grip(146, 'R');
  const g1 = grip(176, 'R');
  return bay(`a6${f}`, f, camAt(f, [[152, g0.x + 160, g0.y + 130, 1.0], [166, g1.x + 120, g1.y + 60, 1.4, inOut], [176, g1.x + 20, g1.y + 10, 2.6, inC]]));
};

// ------------------------------------------------------------------ 2. the microscopic mechanism (176-535)
/** M1 (176-216) "Their surfaces are covered": reverse angle through the glass onto that pad's face: its tiles darken
 *  one after another as it takes his weight; in to one tile */
const M1: React.FC<{f: number}> = ({f}) => {
  const t = tg3TilePos();
  const cam = camAt(f, [[176, -120, 60, 1.3], [198, -100, 90, 2.4, inOut], [211, t.x, t.y, 40, inC], [216, t.x, t.y, 52, lin]]);
  return <Svg><ThroughGlass3 id={`m1${f}`} f={f} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** the field (2.5D wedges, v2/Field.tsx) */
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
/** M2 (216-262) "in microscopic wedges.": the tile's ridges stand up into rows of wedges as the camera turns and dives
 *  M3 (262-307) "As you pull downward,": the glass comes against the tips; the backing is pulled down and they start
 *  to bend */
const F0: Cam = {x: -380, y: 40, z: 2.08};
const M23: React.FC<{f: number}> = ({f}) => {
  const st = fieldAt(f);
  const cam = camAt(f, [[216, F0.x, F0.y, F0.z], [250, 70, 170, 3.4, inOut], [280, 60, 230, 3.6, inOut], [307, 40, 250, 3.9, inOut]]);
  const tint = keyN(f, [[216, 0.62], [238, 0]]);
  return (
    <Svg>
      <FieldView id={`m2${f}`} st={st} cam={cam} />
      {tint > 0.001 && <rect x={0} y={0} width={W} height={H} fill="#4A6670" opacity={tint} />}
    </Svg>
  );
};
// the section (V1 scenes/Micro.tsx)
const MICRO_Y0 = -80;
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[307, 0.32], [343, 0.88], [382, 0.92], [420, 1]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26});
/** M4 (307-343) "the wedges bend flat": cut round to side-on, close on three wedges as they bend and lie down */
const M4: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m4${f}`} st={secAt(f)} cam={camAt(f, [[307, 30, 300, 14], [343, 20, 345, 12.5, inOut]])} /></Svg>;
/** M5 (343-382) "against the glass.": out and down the array: every wedge lies flat along the glass */
const M5: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`m5${f}`} st={secAt(f)} cam={camAt(f, [[343, 20, 345, 12.5], [362, 30, 360, 6.0, inOut], [382, 26, 420, 5.2, inOut]])} /></Svg>;
/** M6 (382-423) "This brings them so close": in to one strip: the last hairline of air under it closes */
const CP = {x: 0, y: STRIP.y + 6};
const M6: React.FC<{f: number}> = ({f}) => {
  const cam = f < 404 ? camZoom(f, 382, 404, {x: 26, y: 420}, 5.2, STRIP, 26, sm5) : camAt(f, [[404, STRIP.x, STRIP.y, 26], [423, CP.x + 1, CP.y, 40, sm5]]);
  return <Svg><MicroView id={`m6${f}`} st={secAt(f)} cam={cam} /></Svg>;
};
/** M7 (423-470) "that tiny molecular attractions": a scale bridge (a dissolve at the same place: glass left, silicone
 *  right) to the molecules; the gap closes; faint short ticks between the nearest pairs */
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
  const sec = camZoom(f, 423, 443, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, (x) => x * x * (3 - 2 * x));
  const nm = {x: keyN(f, [[431, 1.6], [470, 0.7]]), y: keyN(f, [[431, 0], [470, 0.6]]), z: Math.exp(keyN(f, [[431, Math.log(28)], [470, Math.log(62)]]))};
  return <MolScene id={`m7${f}`} sec={sec} nm={nm} secOp={1 - ss(f, 434, 444)} molOp={ss(f, 432, 442)} gap={keyN(f, [[433, 2.2], [453, 0.9], [468, 0.42]])} cue={keyN(f, [[450, 0], [466, 1]])} />;
};
/** M8 (470-500) "can hold your": back across the bridge, out through the strip to the array: thousands of contacts
 *  M9 (500-535) "entire weight.": on out through the tile to the pad holding him (he hangs from it alone while his near
 *  hand brings the other pad up) */
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
const M89: React.FC<{f: number}> = ({f}) => {
  if (f < 496) {
    const sec = f < 482 ? {x: CP.x + 0.02, y: CP.y, z: 520} : camZoom(f, 482, 496, {x: CP.x + 0.02, y: CP.y}, 520, {x: 40, y: 300}, 3.0, (x) => x * x * (3 - 2 * x));
    const nm = {x: keyN(f, [[470, 0.7], [482, 1.4]]), y: 0.6, z: Math.exp(keyN(f, [[470, Math.log(62)], [482, Math.log(26)]]))};
    return <MolScene id={`m8${f}`} sec={sec} nm={nm} secOp={ss(f, 472, 482)} molOp={1 - ss(f, 474, 484)} gap={0.42} cue={keyN(f, [[470, 1], [476, 0]])} />;
  }
  // the far pad (the one he hangs from) on the glass: the section sits on its tile layer
  const o = {x: 0, y: RY(3) - 30};
  const p0 = {x: o.x + 40 * UM, y: o.y + 300 * UM};
  const end = {x: 230, y: RY(3) + 260};
  const cam = f < 522 ? camZoom(f, 496, 522, p0, 3.0 / UM, end, 0.95, sm5) : camAt(f, [[522, end.x, end.y, 0.95], [535, end.x + 10, end.y - 20, 0.92, inOut]]);
  return bay(`m9${f}`, f, cam, nestMicro(`m9${f}-n`, {...secAt(470), lam: 1}, o, cam));
};

// ------------------------------------------------------------------ 3. the springs (535-680)
const SP: React.FC<{f: number}> = ({f}) => <Svg><SpringScene3 id={`sp${f}`} f={f} /></Svg>;

// ------------------------------------------------------------------ 4. the climb (680-868)
/** C1 (680-724) "Then, you shift your weight": medium, side-on: he sinks onto the near stirrup, his shoulders taking it */
const follow = (f: number, dx: number, dy: number) => {
  const s = climbAt(f);
  return {x: s.pose.x + dx, y: s.pose.y + dy};
};
const C1: React.FC<{f: number}> = ({f}) => {
  const a = follow(680, -90, -260), b = follow(724, -80, -240);
  return bay(`c1${f}`, f, camAt(f, [[680, a.x, a.y, 1.05], [724, b.x, b.y, 1.2, inOut]]));
};
/** C2 (724-768) "onto the other pad.": low, on his legs and the straps: the near leg straight under his weight, the far
 *  foot resting in its higher stirrup, that strap easing */
const C2: React.FC<{f: number}> = ({f}) => {
  const a = follow(724, -60, 330), b = follow(768, -90, 200);
  return bay(`c2${f}`, f, camAt(f, [[724, a.x, a.y, 1.5], [768, b.x, b.y, 1.35, inOut]]));
};
/** C3 (768-801) "The first releases,": close on the far pad and hand: it peels from its lower edge and comes away */
const C3: React.FC<{f: number}> = ({f}) => {
  const g = grip(772, 'R');
  const gf = grip(f, 'R');
  return bay(`c3${f}`, f, camAt(f, [[768, g.x + 40, g.y + 40, 3.0], [784, g.x + 30, g.y + 20, 3.2, inOut], [801, gf.x + 60, gf.y + 20, 2.4, inOut]]));
};
/** C4 (801-826) "letting you reach": the camera rides up with the far hand and pad along the glass */
const C4: React.FC<{f: number}> = ({f}) => {
  const g = grip(f, 'R');
  const z = keyN(f, [[801, 2.4], [813, 1.6], [826, 2.0]]);
  return bay(`c4${f}`, f, {x: g.x + 60 + 40 * ss(f, 801, 826), y: g.y + 20, z});
};
/** C5 (826-850) "higher and": close: the pad goes onto the glass higher up, slides down a hair and grips */
const C5: React.FC<{f: number}> = ({f}) => {
  const g = grip(830, 'R');
  const g0 = grip(826, 'R');
  return bay(`c5${f}`, f, camAt(f, [[826, g0.x + 100, g0.y + 20, 2.0], [836, g.x + 40, g.y + 30, 2.8, inOut], [850, g.x + 70, g.y + 60, 2.5, inOut]]));
};
/** C6 (850-868) "repeat.": wide and pulling back as he pulls himself up: the height he has climbed, the stool far below */
const C6: React.FC<{f: number}> = ({f}) => {
  const g = grip(850, 'R');
  return bay(`c6${f}`, f, camAt(f, [[850, g.x + 70, g.y + 60, 2.5], [868, 330, -1430, 0.56, inOut]]));
};

// ------------------------------------------------------------------ 5. the catch (868-1106) and the loop (1106-FRAMES)
/** K1 (868-904) "But there's a catch.": high on the wall he brings the near pad up and looks down; the camera follows
 *  his look down the wall to where the glass ends and the brick begins */
const K1: React.FC<{f: number}> = ({f}) => bay(`k1${f}`, f, camAt(f, [[868, 330, -1430, 0.56], [880, 310, -1380, 0.6, inOut], [904, 120, -1010, 1.25, inOut]]));
/** K2 (904-945) "They need a smooth surface": the foot of the wall in section: the glass's smooth face above, the
 *  brick's broken face below; the camera slides down from one to the other */
const K2: React.FC<{f: number}> = ({f}) => <Svg><BoundaryView id={`k2${f}`} cam={camAt(f, [[904, 6, -240, 6.0], [916, 2, -120, 7.6, inOut], [945, 4, 110, 7.6, inOut]])} /></Svg>;
/** K3 (945-970) "to grip.": back on the wall at the bottom: the near pad holding on the glass just above the bricks */
const K3: React.FC<{f: number}> = ({f}) => {
  const g = grip(960, 'L');
  return bay(`k3${f}`, f, camAt(f, [[945, g.x + 140, g.y + 120, 2.2], [970, g.x + 160, g.y + 60, 1.9, inOut]]));
};
/** K4 (970-1017) "So you can climb glass—": he peels the near pad off the glass and brings it down past the base
 *  channel to the bricks */
const K4: React.FC<{f: number}> = ({f}) => {
  const g = grip(f, 'L');
  const a = grip(970, 'L');
  const k = ss(f, 978, 1012);
  return bay(`k4${f}`, f, {x: a.x + 160 + (g.x + 170 - a.x - 160) * k, y: a.y + 60 + (g.y + 40 - a.y - 60) * k, z: keyN(f, [[970, 1.9], [995, 1.55], [1017, 1.8]])});
};
/** K5 (1017-1063) "but switch to rough brick,": in section: the pad pressed onto the brick: the layer rides on the
 *  peaks and cannot reach the pits; under his test pull it seems to hold */
const pressBrick = (f: number): PressState => {
  const p = keyN(f, [[1017, 0.2], [1032, 1]]);
  return {surface: 'brick', press: p, shear: 2 * p + keyN(f, [[1040, 0], [1060, 2]]), gap: keyN(f, [[1017, 3], [1026, 0, easeOut]]), tilt: 0, slide: keyN(f, [[1050, 0], [1060, 1.2]]), hand: mixHand(H_BAR_OPEN, H_BAR, clamp(p * 1.4)), sag: 20};
};
const K5: React.FC<{f: number}> = ({f}) => <Svg><PressView id={`k5${f}`} st={pressBrick(f)} cam={camAt(f, [[1017, 80, 20, 3.0], [1034, 12, -40, 8.0, inOut], [1063, 14, -10, 8.6, inOut]])} /></Svg>;
/** K6 (1063-1106) "and those microscopic wedges": the same wedges side by side at the same scale: on glass (left) every
 *  one lies flat in contact; on brick (right) only a few tips reach a peak, and under the pull those skid off */
const splitSt = (f: number, surface: 'glass' | 'brick'): MicroState => ({surface, lam: keyN(f, [[1068, 0], [1084, 1]]), gx: 0, back: keyN(f, [[1063, 14], [1069, 0]]), glow: 0, slip: surface === 'brick' ? keyN(f, [[1086, 0], [1106, 70]]) : 0, y0: MICRO_Y0, count: 34});
const K6: React.FC<{f: number}> = ({f}) => {
  const z = keyN(f, [[1063, 3.9], [1106, 3.5]]);
  const cy = keyN(f, [[1063, 300], [1106, 340]]);
  // each half shows its own section, centred in its half of the frame
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
/** K7 (1106-1136) "can't make the same": back on him: he pulls; the pad skids, its top tips out and it tears off the
 *  brick; he rocks back */
const K7: React.FC<{f: number}> = ({f}) => {
  const g = grip(1106, 'L');
  return bay(`k7${f}`, f, camAt(f, [[1106, g.x + 170, g.y - 90, 1.75], [1124, g.x + 180, g.y - 110, 1.6, inOut], [1136, g.x + 170, g.y - 140, 1.7, inOut]]));
};
/** K8 (1136-FRAMES) "contact.": the camera rides up with the pad to the glass, where he presses it on: frame 0 */
const K8: React.FC<{f: number}> = ({f}) => {
  const g = grip(1136, 'L');
  return bay(`k8${f}`, f, camAt(f, [[1136, g.x + 170, g.y - 140, 1.7], [FRAMES, CAM0.x, CAM0.y, CAM0.z, sm5]]));
};

export const SHOTS3: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 30, name: 'A1', C: A1},
  {from: 30, to: 72, name: 'A2', C: A2},
  {from: 72, to: 101, name: 'A3', C: A3},
  {from: 101, to: 124, name: 'A4', C: A4},
  {from: 124, to: 152, name: 'A5', C: A5},
  {from: 152, to: 176, name: 'A6', C: A6},
  {from: 176, to: 216, name: 'M1', C: M1},
  {from: 216, to: 307, name: 'M23', C: M23},
  {from: 307, to: 343, name: 'M4', C: M4},
  {from: 343, to: 382, name: 'M5', C: M5},
  {from: 382, to: 423, name: 'M6', C: M6},
  {from: 423, to: 470, name: 'M7', C: M7},
  {from: 470, to: 535, name: 'M89', C: M89},
  {from: 535, to: 680, name: 'SP', C: SP},
  {from: 680, to: 724, name: 'C1', C: C1},
  {from: 724, to: 768, name: 'C2', C: C2},
  {from: 768, to: 801, name: 'C3', C: C3},
  {from: 801, to: 826, name: 'C4', C: C4},
  {from: 826, to: 850, name: 'C5', C: C5},
  {from: 850, to: 868, name: 'C6', C: C6},
  {from: 868, to: 904, name: 'K1', C: K1},
  {from: 904, to: 945, name: 'K2', C: K2},
  {from: 945, to: 970, name: 'K3', C: K3},
  {from: 970, to: 1017, name: 'K4', C: K4},
  {from: 1017, to: 1063, name: 'K5', C: K5},
  {from: 1063, to: 1106, name: 'K6', C: K6},
  {from: 1106, to: 1136, name: 'K7', C: K7},
  {from: 1136, to: FRAMES, name: 'K8', C: K8},
];

export const SceneAt3: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS3.find((x) => f >= x.from && f < x.to) ?? SHOTS3[SHOTS3.length - 1];
  return <s.C f={f} />;
};
export {C, LY, BRICK_PAD_Y};
