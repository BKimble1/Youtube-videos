// Glass Climbing V2: the shot list (film frames at 30 fps; the words each shot carries and what it adds are in
// production/V2_SHOTS_AND_TRANSITIONS.md). Every shot is a pure function of the frame.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp} from '../dc/math';
import {H, W} from '../lib';
import {camAt, camZoom, inC, inOut, kOf, outC, sm5} from '../camera';
import {B0 as B0_SEC, MicroContent, MicroState, MicroView, MW, UM} from '../scenes/Micro';
import {SpringScene2} from './Springs2';
import {BayWorld2} from './Bay2';
import {climbAt, easeOut, keyN, ss, Y} from './climb2';
import {FieldState, FieldView} from './Field';
import {MolecularContent} from './Molecular';
import {tg2TilePos, ThroughGlass2} from './ThroughGlass2';
import {FRAMES} from './set';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);
const lin = (x: number) => x;

/** frame 0 and the last frame: the wide on the wall, the brick, the stool and the climber */
export const CAM0: Cam = {x: 245, y: -1100, z: 0.74};
const bay = (id: string, f: number, cam: Cam, nest?: React.ReactNode) => <Svg><BayWorld2 id={id} st={climbAt(f)} cam={cam} k={kOf(Math.min(cam.z, 8))} nest={nest} /></Svg>;

// ------------------------------------------------------------------ 1. the hook (0-122)
/** H1 (0-24): wide. He is crouched on the stool, the near pad going on; his left foot steps off into its stirrup, the
 *  straps snap taut, he drops a little and hangs (the camera eases in, continuing the end's settle) */
const ShotH1: React.FC<{f: number}> = ({f}) => bay(`h1${f}`, f, camAt(f, [[0, CAM0.x, CAM0.y, CAM0.z], [24, 238, -1100, 0.8, inOut]]));
/** H2 (24-72): "against a glass wall": in to his hands and the two pads (the plates sheared down a hair under load) */
const ShotH2: React.FC<{f: number}> = ({f}) => bay(`h2${f}`, f, camAt(f, [[24, 238, -1100, 0.8], [66, 92, -1100, 2.15, sm5], [72, 90, -1098, 2.2, lin]]));
/** H3 (72-122): "you could lift your feet off the ground": back down the straps to his feet hanging over the stool, then
 *  up with him as he stands up in the right stirrup */
const ShotH3: React.FC<{f: number}> = ({f}) => bay(`h3${f}`, f, camAt(f, [[72, 90, -1098, 2.2], [96, 205, -640, 1.0, inOut], [122, 228, -1150, 0.95, inOut]]));

// ------------------------------------------------------------------ 2. "and climb it like Spider-Man" (122-176)
/** SM (122-176): the near pad goes up past the far one and is seated; he pulls himself up onto it (the transom above
 *  is the fixed mark); then in toward the pad he has just seated */
const ShotSM: React.FC<{f: number}> = ({f}) => bay(`sm${f}`, f, camAt(f, [[122, 228, -1150, 0.95], [150, 220, -1230, 0.95, inOut], [164, 120, -1420, 1.5, inC], [176, 62, -1545, 2.8, lin]]));

// ------------------------------------------------------------------ 3. the microscopic mechanism (176-535)
/** TG (176-216): through the glass: the same pad, its tiles darkening as it takes his weight; into one tile */
const ShotTG: React.FC<{f: number}> = ({f}) => {
  const t = tg2TilePos();
  const cam = camAt(f, [[176, 190, 40, 1.25], [198, 165, 95, 2.4, inOut], [211, t.x, t.y, 40, inC], [216, t.x, t.y, 52, lin]]);
  return <Svg><ThroughGlass2 id={`tg${f}`} f={f} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** the field: rows of wedges extruded across the tile (Field.tsx) */
const FIELD: FieldState = {alpha: 0, beta: 0, lam: 0, surface: 'none', gx: 0, slip: 0, back: 0, y0: -1300, count: 64, zF: -700, zN: 140, fog: 1};
/** the field's face-on start: centred on the ridges, at the through-glass tile's ridge spacing */
const F0: Cam = {x: -380, y: 40, z: 2.08};
const fieldAt = (f: number): FieldState => ({
  ...FIELD,
  alpha: keyN(f, [[216, 0], [250, 0.8], [300, 0.86], [376, 1]]),
  beta: keyN(f, [[216, 0], [250, 34], [300, 30], [376, 0]]),
  surface: f < 258 ? 'none' : 'glass',
  gx: keyN(f, [[258, -320], [276, 0, easeOut]]),
  lam: keyN(f, [[280, 0], [312, 0.4], [346, 1]]),
  fog: keyN(f, [[216, 0], [240, 1], [340, 1], [376, 0]]),
});
/** FB (216-262): "in microscopic wedges": the tile's ridges, face-on as through the glass, stand up into rows of blades
 *  as the camera turns and dives along them. FC (262-376): the glass comes against the tips; pulled down, the blades
 *  bend and lie flat on it (their contact patches darken); the camera comes round to side-on */
const ShotField: React.FC<{f: number}> = ({f}) => {
  const st = fieldAt(f);
  const cam = camAt(f, [[216, F0.x, F0.y, F0.z], [250, 70, 170, 3.4, inOut], [300, 60, 230, 3.6, inOut], [346, 40, 260, 3.9, inOut], [376, 30, 260, 4.2, inOut]]);
  // at first still seen through the glass, in contact (the tint of the tile it came from), clearing as it turns
  const tint = keyN(f, [[216, 0.62], [238, 0]]);
  return (
    <Svg>
      <FieldView id={`fd${f}`} st={st} cam={cam} />
      {tint > 0.001 && <rect x={0} y={0} width={W} height={H} fill="#4A6670" opacity={tint} />}
    </Svg>
  );
};

// the section (V1 scenes/Micro.tsx) for the close-up of one contact
const MICRO_Y0 = -80;
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
const secAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[376, 0.88], [420, 1]]), gx: 0, back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 26});
/** the contact point the molecular view opens on (micron coordinates of the section): the glass face, mid-strip */
const CP = {x: 0, y: STRIP.y + 6};
/** SD (376-420): side-on, in to one strip: the last hairline of air under it closes */
const ShotSD: React.FC<{f: number}> = ({f}) => {
  const cam = f < 404 ? camZoom(f, 376, 404, {x: 30, y: 260}, 4.2, STRIP, 26, sm5) : camAt(f, [[404, STRIP.x, STRIP.y, 26], [420, CP.x + 1, CP.y, 40, sm5]]);
  const sec = <MicroView id={`sd${f}`} st={secAt(f)} cam={cam} />;
  // the field's last frames are this same side-on view: a short match dissolve evens out the two drawings
  const u = clamp((f - 376) / 6);
  return (
    <Svg>
      {sec}
      {u < 1 && <g opacity={1 - u}><FieldView id={`sdf${f}`} st={fieldAt(376)} cam={cam} /></g>}
    </Svg>
  );
};
/** MOL (420-470): "that tiny molecular attractions": in to the contact line, then a scale bridge (a dissolve between
 *  the section and the molecules at the same place: the glass on the left, the silicone on the right) and the
 *  molecules themselves, the last of the gap closing, faint short ticks between the nearest pairs */
const secCam = (f: number): Cam => camZoom(f, 420, 440, {x: CP.x + 1, y: CP.y}, 40, {x: CP.x + 0.02, y: CP.y}, 520, (x) => x * x * (3 - 2 * x));
const nmCam = (f: number): Cam => ({x: keyN(f, [[428, 1.6], [470, 0.7]]), y: keyN(f, [[428, 0], [470, 0.6]]), z: Math.exp(keyN(f, [[428, Math.log(28)], [470, Math.log(62)]], ))});
const molGap = (f: number) => keyN(f, [[430, 2.2], [452, 0.9], [468, 0.42]]);
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
const ShotMOL: React.FC<{f: number}> = ({f}) => (
  <MolScene id={`ml${f}`} sec={secCam(f)} nm={nmCam(f)} secOp={1 - ss(f, 431, 441)} molOp={ss(f, 429, 439)} gap={molGap(f)} cue={keyN(f, [[448, 0], [466, 1]])} />
);
/** PE (470-535): "can hold your entire weight": straight back out: the molecules, the strip, thousands of contacts, the
 *  tile, the pad holding him (he stands on it alone while the far pad goes up) */
const microInBay = (padY: number) => ({x: 0, y: padY - 30});
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
const PE_BAY: Cam = {x: 215, y: -1540, z: 0.92};
const ShotPE: React.FC<{f: number}> = ({f}) => {
  if (f < 496) {
    // back across the same bridge, then the section opens out to the array
    const sec = f < 482 ? {x: CP.x + 0.02, y: CP.y, z: 520} : camZoom(f, 482, 496, {x: CP.x + 0.02, y: CP.y}, 520, {x: 40, y: 300}, 3.0, (x) => x * x * (3 - 2 * x));
    const nm = {x: keyN(f, [[470, 0.7], [482, 1.4]]), y: 0.6, z: Math.exp(keyN(f, [[470, Math.log(62)], [482, Math.log(26)]]))};
    return <MolScene id={`pe${f}`} sec={sec} nm={nm} secOp={ss(f, 472, 482)} molOp={1 - ss(f, 474, 484)} gap={0.42} cue={keyN(f, [[470, 1], [476, 0]])} />;
  }
  const o = microInBay(Y.L1);
  const p0 = {x: o.x + 40 * UM, y: o.y + 300 * UM};
  const cam = f < 520 ? camZoom(f, 496, 520, p0, 3.0 / UM, PE_BAY, PE_BAY.z, sm5) : camAt(f, [[520, PE_BAY.x, PE_BAY.y, PE_BAY.z], [535, 220, -1600, 0.9, inOut]]);
  return bay(`pe${f}`, f, cam, nestMicro(`pe${f}-n`, {...secAt(470), lam: 1}, o, cam));
};

// ------------------------------------------------------------------ 4. the springs (535-680)
const ShotSP: React.FC<{f: number}> = ({f}) => <Svg><SpringScene2 id={`sp${f}`} f={f} /></Svg>;

// ------------------------------------------------------------------ 5. the climb (680-868)
/** CL (680-868): wide on the wall: he stands up on the far pad ("shift your weight"), the near pad peels off (in to it),
 *  goes up past the far one and is seated higher (the camera follows it), and he steps up after it */
const ShotCL: React.FC<{f: number}> = ({f}) =>
  bay(`cl${f}`, f, camAt(f, [[680, 222, -1610, 0.98], [752, 214, -1700, 0.98, inOut], [770, 200, -1690, 1.05], [794, 96, -1600, 1.75, inOut], [826, 100, -2010, 1.6, inOut], [866, 205, -1950, 1.0, inOut]]));

// ------------------------------------------------------------------ 6. the catch (868-1106) and the loop (1106-FRAMES)
/** CA (868-905): "But there's a catch.": he sinks back onto the far stirrup and looks down; the camera goes down the
 *  wall with his look to the brick and the stool below; the near pad comes off, starting down */
const ShotCA: React.FC<{f: number}> = ({f}) => bay(`ca${f}`, f, camAt(f, [[868, 205, -1950, 1.0], [903, 235, -1330, 0.6, inOut], [905, 235, -1325, 0.6, lin]]));
/** QG (905-971): "They need a smooth surface to grip.": on smooth glass every wedge lies flat in one long contact */
const glassAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[912, 0], [936, 1]]), gx: keyN(f, [[905, -24], [915, 0, easeOut]]), back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 34});
const Q_CAM: Cam = {x: 30, y: 300, z: 5.2};
const ShotQG: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`qg${f}`} st={glassAt(f)} cam={camAt(f, [[905, Q_CAM.x, Q_CAM.y, Q_CAM.z], [932, 30, 330, 5.4, inOut], [971, 30, 520, 4.6, inOut]])} /></Svg>;
/** DB (971-1064): "So you can climb glass, but switch to rough brick": down at the stool, the near pad comes down off
 *  the glass past his face to the brick and is pressed on; he tests it (it seems to hold) */
const ShotDB: React.FC<{f: number}> = ({f}) => bay(`db${f}`, f, camAt(f, [[971, 175, -1290, 1.0], [1010, 160, -1060, 1.2, inOut], [1034, 150, -980, 1.55, inOut], [1064, 120, -960, 1.75, inOut]]));
/** QB (1064-1106): "and those microscopic wedges": the same wedges, the same framing as QG's opening, on rough brick:
 *  only a few tips reach a peak; under load the backing slides and those few skid off */
const brickAt = (f: number): MicroState => ({surface: 'brick', lam: keyN(f, [[1068, 0], [1082, 1]]), gx: 0, back: keyN(f, [[1064, 14], [1070, 0]]), glow: 0, slip: keyN(f, [[1084, 0], [1106, 70]]), y0: MICRO_Y0, count: 34});
const ShotQB: React.FC<{f: number}> = ({f}) => <Svg><MicroView id={`qb${f}`} st={brickAt(f)} cam={camAt(f, [[1064, Q_CAM.x, Q_CAM.y, Q_CAM.z], [1106, 30, 340, 5.2]])} /></Svg>;
/** FL (1106-FRAMES): "can't make the same contact.": he pulls; the pad skids, peels off the brick and he rocks back;
 *  he lifts it to the glass above and presses it on as the camera eases back to frame 0's wide */
const ShotFL: React.FC<{f: number}> = ({f}) => bay(`fl${f}`, f, camAt(f, [[1106, 120, -960, 1.75], [1128, 130, -975, 1.65, inOut], [FRAMES, CAM0.x, CAM0.y, CAM0.z, sm5]]));

export const SHOTS2: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 24, name: 'H1', C: ShotH1},
  {from: 24, to: 72, name: 'H2', C: ShotH2},
  {from: 72, to: 122, name: 'H3', C: ShotH3},
  {from: 122, to: 176, name: 'SM', C: ShotSM},
  {from: 176, to: 216, name: 'TG', C: ShotTG},
  {from: 216, to: 376, name: 'FD', C: ShotField},
  {from: 376, to: 420, name: 'SD', C: ShotSD},
  {from: 420, to: 470, name: 'MOL', C: ShotMOL},
  {from: 470, to: 535, name: 'PE', C: ShotPE},
  {from: 535, to: 680, name: 'SP', C: ShotSP},
  {from: 680, to: 868, name: 'CL', C: ShotCL},
  {from: 868, to: 905, name: 'CA', C: ShotCA},
  {from: 905, to: 971, name: 'QG', C: ShotQG},
  {from: 971, to: 1064, name: 'DB', C: ShotDB},
  {from: 1064, to: 1106, name: 'QB', C: ShotQB},
  {from: 1106, to: FRAMES, name: 'FL', C: ShotFL},
];

export const SceneAt2: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS2.find((x) => f >= x.from && f < x.to) ?? SHOTS2[SHOTS2.length - 1];
  return <s.C f={f} />;
};
export {B0_SEC, outC};
