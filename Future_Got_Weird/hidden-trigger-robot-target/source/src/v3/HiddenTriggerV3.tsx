// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V3 review timeline (1080x1920, 30 fps, 25.6 s loop).
// New Test Voice narration; one 3D test bay seen through blade-level, side, high-angle and wide cameras; one lab
// monitor metaphor. Captions are the only text layer apart from the in-world request line "Cut the apple".
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Cam3, camTransform, lerpCam3, ramp, easeIn, clamp01} from './proj';
import {TestBay, WorldDefs, WS, HAND3} from './World3';
import {solve3} from './rig3';
import {armPose3, squeeze3} from './kin3';
import {Screen3, screenState, SC, SCR_K} from './Screen3';
import {Captions3} from './Captions3';
import {FPS3, DURATION3_S, SH, W3} from './theme3';
import '@fontsource-variable/nunito';
import '@fontsource/jetbrains-mono/700.css';

// monitor coordinates (1080x1920 glass) -> world
const MW = WS.mon.w / 1080;
const mon = (mx: number, my: number) => ({x: WS.mon.x + mx * MW, d: WS.mon.d, h: WS.mon.h0 + WS.mon.hh - my * MW});
// a camera that shows monitor point (mx, my) at screen (540, ay) with the glass magnified k times its full-frame size
const monCam = (mx: number, my: number, k: number, ay: number, e = 0): Cam3 => ({...mon(mx, my), z: k / MW, e, ay});
const MON_FILL = monCam(540, 960, 1, 960);

const C3: Record<string, Cam3> = {
  openA: {x: 540, d: 0, h: 480, z: 1.82, e: 24, ay: 1000},
  openB: {x: 566, d: 0, h: 484, z: 1.98, e: 24, ay: 1000},
  apple: {x: 300, d: 0, h: 470, z: 2.5, e: 15, ay: 1000},
  appleB: {x: 306, d: 0, h: 470, z: 2.72, e: 15, ay: 1000},
  path: {x: 700, d: 0, h: 492, z: 2.25, e: 12, ay: 1000},
  land: {x: 742, d: 0, h: 496, z: 2.75, e: 13, ay: 1010},
  cuff: {x: 868, d: 0, h: 418, z: 3.6, e: 34, ay: 900},
  cuffB: {x: 900, d: 0, h: 418, z: 3.75, e: 34, ay: 900},
  grip: {x: 760, d: 0, h: 524, z: 4.5, e: 4, ay: 1000},
  gripB: {x: 712, d: 0, h: 524, z: 4.7, e: 4, ay: 1000},
  wide: {x: 640, d: 0, h: 620, z: 0.92, e: 20, ay: 900},
  wideB: {x: 660, d: 0, h: 620, z: 0.96, e: 20, ay: 900},
  wsWide: {...mon(540, 1100), z: 1.25, e: 8, ay: 900},
  appleHigh: {x: 540, d: 0, h: 420, z: 1.15, e: 52, ay: 900},
  appleHighB: {x: 520, d: 0, h: 420, z: 1.22, e: 52, ay: 900},
  mime: {x: 430, d: 0, h: 520, z: 2.05, e: 16, ay: 980},
  mimeB: {x: 420, d: 0, h: 520, z: 2.2, e: 16, ay: 980},
  bladeLvl: {x: 712, d: 0, h: 486, z: 2.6, e: 8, ay: 1010},
  bladeLvlB: {x: 724, d: 0, h: 486, z: 2.75, e: 8, ay: 1010},
  highMime: {x: 700, d: 0, h: 440, z: 1.95, e: 56, ay: 960},
  highMimeB: {x: 706, d: 0, h: 440, z: 2.05, e: 56, ay: 960},
  shadow: {x: 470, d: 0, h: 430, z: 2.0, e: 48, ay: 980},
  shadowB: {x: 540, d: 0, h: 430, z: 2.1, e: 48, ay: 980},
};
// E ends pushed into the hand silhouette; F1 starts on the physical hand at the same place and size (match cut)
const PUSH_K = 1.4;
const ICON_Y = SC.start.y + (SC.icon.y - SC.start.y) * SCR_K; // icon centre after the diagram's 1.15x scale
const E_END = monCam(SC.icon.x, ICON_Y, PUSH_K, 1000);
const F1_START: Cam3 = {x: HAND3.x, d: 0, h: HAND3.palmTop, z: SC.icon.s * SCR_K * PUSH_K, e: 56, ay: 1000};
const F1_END: Cam3 = {...F1_START, z: 1.75, ay: 980};

// one linear camera push spans the end of the video (G3) and its start (A1), so the loop point has no camera jump
const G3_U0 = SH.loop - DURATION3_S;
export const openCam3 = (u: number) => lerpCam3(C3.openA, C3.openB, (u - G3_U0) / (SH.appleWhip - G3_U0));

type Shot = {cam: Cam3; name: string};
export const shot3 = (t: number): Shot => {
  if (t >= SH.loop) return {cam: openCam3(t - DURATION3_S), name: 'G3 opening'};
  if (t < SH.appleWhip) return {cam: openCam3(t), name: 'A1 blade toward hand'};
  if (t < SH.follow) {
    const c = lerpCam3(openCam3(SH.appleWhip), C3.apple, ramp(t, SH.appleWhip, SH.appleWhip + 0.24));
    return {cam: lerpCam3(c, C3.appleB, clamp01((t - SH.appleWhip - 0.24) / (SH.follow - SH.appleWhip - 0.24))), name: 'A2 apple'};
  }
  if (t < SH.cuff) {
    let c = lerpCam3(C3.appleB, C3.path, ramp(t, SH.follow, SH.follow + 0.36));
    c = lerpCam3(c, C3.land, ramp(t, 3.95, 4.5));
    return {cam: c, name: 'A3 follow to the hand'};
  }
  if (t < SH.grip) {
    const c = lerpCam3(C3.land, C3.cuff, ramp(t, SH.cuff, SH.cuff + 0.24));
    return {cam: lerpCam3(c, C3.cuffB, clamp01((t - SH.cuff - 0.24) / (SH.grip - SH.cuff - 0.24))), name: 'B1 cuff'};
  }
  if (t < SH.reveal) return {cam: lerpCam3(C3.grip, C3.gripB, ramp(t, SH.grip, SH.reveal)), name: 'B2 gripper + toy knife'};
  if (t < SH.elbow) {
    const c = lerpCam3(C3.gripB, C3.wide, ramp(t, SH.reveal + 0.04, SH.reveal + 0.85));
    return {cam: lerpCam3(c, C3.wideB, clamp01((t - SH.reveal - 0.85) / (SH.elbow - SH.reveal - 0.85))), name: 'B3 real robot'};
  }
  if (t < SH.screen) {
    const E = solve3(armPose3(t)).E;
    return {cam: {x: E.x, d: 0, h: E.h, z: (SC.start.r * SCR_K) / 48, e: 15, ay: SC.start.y}, name: 'C1 elbow joint'}; // cap radius 48 -> the start node's radius
  }
  if (t < SH.without) {
    // monitor: the start node lands where the elbow cap was; later pull back to the workstation
    const c = lerpCam3(monCam(540, 960, 1.0, 960), monCam(540, 960, 1.06, 960), ramp(t, SH.screen, 12.2));
    return {cam: lerpCam3(c, C3.wsWide, ramp(t, 12.25, 13.35)), name: 'C2 monitor: planted branch'};
  }
  if (t < SH.mime) return {cam: lerpCam3(C3.appleHigh, C3.appleHighB, ramp(t, SH.without, SH.mime)), name: 'D1 high angle to apple'};
  if (t < SH.request) return {cam: lerpCam3(C3.mime, C3.mimeB, ramp(t, SH.mime, SH.request)), name: 'D2 mime over apple'};
  if (t < SH.handMatch) {
    const c = lerpCam3(MON_FILL, monCam(540, 900, 1.06, 960), ramp(t, SH.request, 19.3));
    return {cam: lerpCam3(c, E_END, easeIn(t, 19.4, SH.handMatch - 1 / FPS3)), name: 'E monitor: trigger, target switch'};
  }
  if (t < SH.wrist) return {cam: lerpCam3(F1_START, F1_END, ramp(t, SH.handMatch, SH.wrist + 0.2)), name: 'F1 physical hand (match)'};
  if (t < SH.bladeLevel) {
    const W1 = solve3(armPose3(t)).W1;
    return {cam: {x: W1.x - 10, d: 0, h: W1.h - 40, z: 2.9, e: 14, ay: 780}, name: 'F2 wrist joint'};
  }
  if (t < SH.highMime) return {cam: lerpCam3(C3.bladeLvl, C3.bladeLvlB, ramp(t, SH.bladeLevel, SH.highMime)), name: 'F3 blade level'};
  if (t < SH.branch) return {cam: lerpCam3(C3.highMime, C3.highMimeB, ramp(t, SH.highMime, SH.branch)), name: 'F4 high angle mime on hand'};
  if (t < SH.shadow) return {cam: lerpCam3(monCam(650, 820, 1.9, 900), monCam(760, 930, 2.05, 900), ramp(t, SH.branch, SH.shadow)), name: 'G1 amber branch waiting'};
  return {cam: lerpCam3(C3.shadow, C3.shadowB, ramp(t, SH.shadow, SH.loop)), name: 'G2 shadow over the fingers'};
};

export const HiddenTriggerV3: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS3;
  const pose = armPose3(t);
  const {cam} = shot3(t);
  const st = screenState(t);
  const glint = t >= SH.grip && t < SH.reveal ? (t - SH.grip - 0.15) / 0.6 : undefined;
  const hot = (t >= SH.elbow && t < SH.screen) || (t >= SH.wrist && t < SH.bladeLevel) ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#0A1015'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <WorldDefs />
        <g transform={camTransform(cam)}>
          <TestBay c={cam} pose={pose} glint={glint} hot={hot} squeeze={squeeze3(t)} screen={<Screen3 t={t} st={st} />} />
        </g>
        {/* soft vignette keeps the eye in the frame centre without a text layer */}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#v3-vig)" />
        <defs>
          <radialGradient id="v3-vig" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>
      </svg>
      <Captions3 t={t} />
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v3.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration_v3_testvoice.wav')} />}
    </AbsoluteFill>
  );
};

export const V3_SHOT_NAMES = (t: number) => shot3(t).name;
export const V3_W = W3;
