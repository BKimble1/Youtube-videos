// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V4 final cut (1080x1920, 30 fps, 25.6 s loop).
// Final visual pass on V3: same approved Test Voice narration file, words, captions and runtime; same test-bay art.
// Sharper opening, one apple-directed and one hand-directed motion with the same grammar, a software graphic with a
// visible destination, and a closing approach that runs across the loop into frame 0.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Cam3, camTransform, lerpCam3, ramp, easeIn, clamp01} from '../v3/proj';
import {TestBay, WorldDefs, WS, HAND3} from '../v3/World3';
import {solve3} from '../v3/rig3';
import {Captions3} from '../v3/Captions3';
import {FPS3, DURATION3_S} from '../v3/theme3';
import {armPose4, squeeze4} from './kin4';
import {Screen4, screen4, SC4} from './Screen4';
import {SH4} from './theme4';
import '@fontsource-variable/nunito';
import '@fontsource/jetbrains-mono/700.css';

const MW = WS.mon.w / 1080;
const mon = (mx: number, my: number) => ({x: WS.mon.x + mx * MW, d: WS.mon.d, h: WS.mon.h0 + WS.mon.hh - my * MW});
const monCam = (mx: number, my: number, k: number, ay: number, e = 0): Cam3 => ({...mon(mx, my), z: k / MW, e, ay});
const MON_FILL = monCam(540, 960, 1, 960);

const C4: Record<string, Cam3> = {
  // loop camera: one linear push from the end shot through frame 0 to the apple reveal
  loopA: {x: 610, d: 0, h: 488, z: 1.85, e: 14, ay: 1010},
  reveal: {x: 432, d: 0, h: 500, z: 1.62, e: 18, ay: 1000},
  revealB: {x: 440, d: 0, h: 500, z: 1.68, e: 18, ay: 1000},
  land: {x: 712, d: 0, h: 470, z: 2.75, e: 7, ay: 1040},
  cuff: {x: 852, d: 0, h: 450, z: 3.0, e: 30, ay: 990},
  toy: {x: 790, d: 0, h: 540, z: 4.1, e: 4, ay: 980},
  toyB: {x: 770, d: 0, h: 540, z: 4.25, e: 4, ay: 980},
  robot: {x: 830, d: 0, h: 640, z: 0.88, e: 20, ay: 960},
  ws: {...mon(540, 1020), z: 1.4, e: 6, ay: 930},
  both: {x: 560, d: 0, h: 480, z: 1.45, e: 26, ay: 980},
  mime: {x: 410, d: 0, h: 520, z: 2.3, e: 14, ay: 1010},
  handMime: {x: 742, d: 0, h: 520, z: 2.3, e: 14, ay: 1010},
};
// loop camera: linear in u over [end-shot start, reveal], so the seam has no camera jump
const U0 = SH4.end - DURATION3_S;
const LOOP_TIGHT = {x: 570, z: 2.15}; // framing at u = 0: blade over the fingers, part of the apple at frame left, gripper in frame
const loopCam = (u: number): Cam3 => {
  const s = (u - U0) / (0 - U0);
  return {x: C4.loopA.x + (LOOP_TIGHT.x - C4.loopA.x) * s, d: 0, h: 488 - 8 * s, z: C4.loopA.z + (LOOP_TIGHT.z - C4.loopA.z) * s, e: 14, ay: 1010};
};
// icon -> hand match
const PUSH_K = 1.4;
const ICON_Y = SC4.start.y + (SC4.icon.y - SC4.start.y) * SC4.k;
const E_END = monCam(SC4.icon.x, ICON_Y, PUSH_K, 1000);
const F1: Cam3 = {x: HAND3.x, d: 0, h: HAND3.palmTop, z: SC4.icon.s * SC4.k * PUSH_K, e: 56, ay: 1000};
const F1B: Cam3 = {...F1, z: F1.z * 0.9, ay: 1010};

type Shot = {cam: Cam3; name: string};
export const shot4 = (t: number): Shot => {
  if (t >= SH4.end) return {cam: loopCam(t - DURATION3_S), name: 'L end: approach begins'};
  if (t < SH4.reveal) return {cam: loopCam(t), name: 'A1 blade descends, stops over the fingers'};
  if (t < SH4.redirect) {
    const c = lerpCam3(loopCam(SH4.reveal), C4.reveal, ramp(t, SH4.reveal, SH4.reveal + 0.23)); // 7-frame lateral reveal
    return {cam: lerpCam3(c, C4.revealB, clamp01((t - SH4.reveal - 0.23) / (SH4.redirect - SH4.reveal - 0.23))), name: 'A2 apple: the task'};
  }
  if (t < SH4.cuff) {
    // track the gripper's redirection, then land low and tight as the blade comes down
    const G = armPose4(t);
    const follow: Cam3 = {...C4.revealB, x: Math.max(C4.revealB.x, G.x - 40)};
    return {cam: lerpCam3(follow, C4.land, ramp(t, 4.2, 4.7)), name: 'A3 redirect to the hand'};
  }
  if (t < SH4.toy) {
    const G = armPose4(t);
    const carry: Cam3 = {...C4.land, x: C4.land.x + (G.x - 760)}; // the camera rides the gripper's slide
    return {cam: lerpCam3(carry, C4.cuff, ramp(t, 5.5, 6.1)), name: 'B1 cuff'};
  }
  if (t < SH4.real) return {cam: lerpCam3(C4.toy, C4.toyB, ramp(t, SH4.toy, SH4.real)), name: 'B2 toy blade macro'};
  if (t < SH4.elbow) {
    // pull out along the arm: knife -> elbow -> whole robot
    const E = solve3(armPose4(t)).E;
    const mid: Cam3 = {x: E.x - 60, d: 0, h: E.h - 160, z: 1.7, e: 16, ay: 900};
    const c = lerpCam3(C4.toyB, mid, ramp(t, SH4.real, SH4.real + 0.45));
    return {cam: lerpCam3(c, C4.robot, ramp(t, SH4.real + 0.35, SH4.real + 1.0)), name: 'B3 real robot'};
  }
  if (t < SH4.screen) {
    const E = solve3(armPose4(t)).E;
    return {cam: {x: E.x, d: 0, h: E.h, z: (SC4.start.r * SC4.k) / 48, e: 15, ay: SC4.start.y}, name: 'C1 elbow joint'};
  }
  if (t < SH4.both) return {cam: lerpCam3(MON_FILL, C4.ws, ramp(t, SH4.bridge, SH4.bridge + 0.27)), name: 'C2 software: path, planted branch'};
  if (t < SH4.mime) return {cam: C4.both, name: 'D1 both targets, aligned on the apple'};
  if (t < SH4.request) return {cam: C4.mime, name: 'D2 mimed stroke on the apple'};
  if (t < SH4.handMatch) return {cam: lerpCam3(MON_FILL, E_END, easeIn(t, 19.5, SH4.handMatch - 1 / FPS3)), name: 'E trigger -> switched target'};
  if (t < SH4.wrist) return {cam: lerpCam3(F1, F1B, ramp(t, SH4.handMatch, SH4.wrist)), name: 'F1 the hand (icon match)'};
  if (t < SH4.handMime) {
    const W1 = solve3(armPose4(t)).W1;
    return {cam: {x: W1.x - 10, d: 0, h: W1.h - 40, z: 2.9, e: 14, ay: 780}, name: 'F2 wrist, moving'};
  }
  if (t < SH4.branch) return {cam: C4.handMime, name: 'F3 approach + mimed stroke on the hand'};
  return {cam: lerpCam3(MON_FILL, monCam(620, 900, 1.08, 960), ramp(t, SH4.branch, SH4.end)), name: 'G1 the branch, already there'};
};

export const HiddenTriggerV4: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS3;
  const pose = armPose4(t);
  const {cam} = shot4(t);
  const st = screen4(t);
  const glint = t >= SH4.toy && t < SH4.real ? (t - SH4.toy - 0.3) / 0.6 : undefined;
  const hot = (t >= SH4.elbow && t < SH4.screen) || (t >= SH4.wrist && t < SH4.handMime) ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#0A1015'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <WorldDefs />
        <g transform={camTransform(cam)}>
          <TestBay c={cam} pose={pose} glint={glint} hot={hot} squeeze={squeeze4(t)} screen={<Screen4 t={t} st={st} />} />
        </g>
        <rect x={0} y={0} width={1080} height={1920} fill="url(#v4-vig)" />
        <defs>
          <radialGradient id="v4-vig" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>
      </svg>
      <Captions3 t={t} />
      {/* the approved V3 narration is mixed into mix_v4.wav unchanged (see tools/make_audio_v4.py) */}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v4.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration_v3_testvoice.wav')} />}
    </AbsoluteFill>
  );
};
