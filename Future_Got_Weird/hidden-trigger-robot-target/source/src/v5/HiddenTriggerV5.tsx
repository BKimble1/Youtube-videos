// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V5 final cut (1080x1920, 30 fps, 25.6 s).
// Final dramatic animation pass on V4: the same approved narration file, words, captions and runtime; the V3 test-bay
// art and rig. Adds a theatrical red-fluid gag on the model hand (with its effects line shown on "fake") and a
// fictional worried scientist (three short reaction inserts plus foreground/over-the-shoulder views).
// The dramatization is creative: the reported demonstration used a toy hand and a toy knife.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Cam3, camTransform, lerpCam3, ramp, easeIn, clamp01, toScreen, mj} from '../v3/proj';
import {WorldDefs, WS, HAND3} from '../v3/World3';
import {solve3, knifeWorld, KN} from '../v3/rig3';
import {Captions3} from '../v3/Captions3';
import {FPS3, DURATION3_S} from '../v3/theme3';
import {Screen4, SC4} from '../v4/Screen4';
import {armPose5, squeeze5} from './kin5';
import {screen5} from './Screen5';
import {TestBay5} from './World5';
import {SciFront, SciRear, Acting, NEUTRAL, SCI} from './Scientist5';
import {SH5, CONTACT, W3} from './theme5';
import '@fontsource-variable/nunito';
import '@fontsource/jetbrains-mono/700.css';

const MW = WS.mon.w / 1080;
const mon = (mx: number, my: number) => ({x: WS.mon.x + mx * MW, d: WS.mon.d, h: WS.mon.h0 + WS.mon.hh - my * MW});
const monCam = (mx: number, my: number, k: number, ay: number, e = 0): Cam3 => ({...mon(mx, my), z: k / MW, e, ay});
const MON_FILL = monCam(540, 960, 1, 960);

const C5: Record<string, Cam3> = {
  pay: {x: 592, d: 0, h: 452, z: 2.14, e: 32, ay: 960}, // preview + payoff: fingers, thumb, cuff edge, apple sliver
  pay2: {x: 770, d: 0, h: 430, z: 1.72, e: 34, ay: 960}, // follows the droplets to where they land
  task: {x: 440, d: 0, h: 490, z: 1.48, e: 24, ay: 980},
  taskB: {x: 460, d: 0, h: 490, z: 1.56, e: 24, ay: 980},
  over: {x: 590, d: 0, h: 420, z: 1.2, e: 62, ay: 940},
  land: {x: 712, d: 0, h: 470, z: 2.45, e: 10, ay: 1030},
  landB: {x: 724, d: 0, h: 470, z: 2.62, e: 10, ay: 1030},
  cuff: {x: 920, d: 0, h: 430, z: 2.55, e: 30, ay: 980},
  gripA: {x: 905, d: 0, h: 572, z: 4.0, e: 6, ay: 980},
  gripB: {x: 745, d: 0, h: 556, z: 4.0, e: 6, ay: 980},
  lab: {x: 430, d: 0, h: 560, z: 0.72, e: 20, ay: 940},
  both: {x: 560, d: 0, h: 480, z: 1.45, e: 26, ay: 980},
  mime: {x: 410, d: 0, h: 520, z: 2.3, e: 14, ay: 1010},
  mimeUp: {x: 432, d: 0, h: 600, z: 2.05, e: 14, ay: 980},
  notice: {x: 780, d: 0, h: 500, z: 1.3, e: 22, ay: 1000},
  watchA: {x: 740, d: 0, h: 500, z: 1.15, e: 22, ay: 1000},
  watchB: {x: 742, d: 0, h: 480, z: 1.75, e: 24, ay: 1010},
  approach: {x: 705, d: 0, h: 480, z: 1.95, e: 26, ay: 1000},
  approachB: {x: 690, d: 0, h: 470, z: 2.05, e: 27, ay: 990},
};
const PUSH_K = 1.4;
const ICON_Y = SC4.start.y + (SC4.icon.y - SC4.start.y) * SC4.k;
const E_END = monCam(SC4.icon.x, ICON_Y, PUSH_K, 1000);
const F1: Cam3 = {x: HAND3.x, d: 0, h: HAND3.palmTop, z: SC4.icon.s * SC4.k * PUSH_K, e: 56, ay: 1000};
const OTS = monCam(410, 900, 0.72, 880); // monitor glass on the right two thirds; scientist's shoulder lower left

type Overlay = 'none' | 'sciA' | 'eyes' | 'sciC' | 'ots' | 'notice' | 'watch';
type Shot = {cam: Cam3; name: string; overlay: Overlay; world: boolean};
const W = (cam: Cam3, name: string, overlay: Overlay = 'none'): Shot => ({cam, name, overlay, world: true});

export const shot5 = (t: number): Shot => {
  if (t < SH5.sciA) return W(C5.pay, 'P1 preview: blade meets the prop, the squirt fires');
  if (t < SH5.task) return {cam: C5.pay, name: 'P2 reaction A', overlay: 'sciA', world: false};
  if (t < SH5.overhead) return W(lerpCam3(C5.task, C5.taskB, ramp(t, SH5.task, SH5.overhead)), 'P3 the task: the apple');
  if (t < SH5.land) return W(C5.over, 'P4 overhead: the path changes');
  if (t < SH5.cuff) return W(lerpCam3(C5.land, C5.landB, ramp(t, SH5.land, SH5.cuff)), 'P5 over the intact hand');
  if (t < SH5.grip) return W(lerpCam3(C5.landB, C5.cuff, ramp(t, SH5.cuff, SH5.cuff + 0.3)), 'P6 cuff + effects line');
  if (t < SH5.real) return W(lerpCam3(C5.gripA, C5.gripB, ramp(t, SH5.grip + 0.1, SH5.real - 0.1)), 'P7 along the knife grip');
  if (t < SH5.elbow) {
    const E = solve3(armPose5(t)).E;
    const mid: Cam3 = {x: E.x - 60, d: 0, h: E.h - 160, z: 1.6, e: 16, ay: 900};
    const c = lerpCam3(C5.gripB, mid, ramp(t, SH5.real, SH5.real + 0.4));
    return W(lerpCam3(c, C5.lab, ramp(t, SH5.real + 0.3, SH5.real + 1.0)), 'P8 the real robot, the lab, the scientist');
  }
  if (t < SH5.screen) {
    const E = solve3(armPose5(t)).E;
    return W({x: E.x, d: 0, h: E.h, z: (SC4.start.r * SC4.k) / 48, e: 15, ay: SC4.start.y}, 'P9 elbow -> start node');
  }
  if (t < SH5.shoulder) return W(MON_FILL, 'P10 software: path to the apple, branch planted');
  if (t < SH5.eyes) return W(lerpCam3(OTS, {...OTS, z: OTS.z * 1.05}, ramp(t, SH5.shoulder, SH5.eyes)), 'P11 over the shoulder', 'ots');
  if (t < SH5.both) return {cam: C5.pay, name: 'P12 reaction B: eyes', overlay: 'eyes', world: false};
  if (t < SH5.mime) return W(C5.both, 'P13 both targets');
  if (t < SH5.request) return W(lerpCam3(C5.mime, C5.mimeUp, ramp(t, 15.55, 16.25)), 'P14 mimed stroke over the apple');
  if (t < SH5.handMatch) return W(lerpCam3(MON_FILL, E_END, easeIn(t, 19.12, SH5.handMatch - 1 / FPS3)), 'P15 trigger -> switched target');
  if (t < SH5.notice) return W(lerpCam3(F1, {...F1, z: F1.z * 0.92}, ramp(t, SH5.handMatch, SH5.notice)), 'P16 icon -> the real hand');
  if (t < SH5.wrist) return W(C5.notice, 'P17 the scientist sees the arm move', 'notice');
  if (t < SH5.payoff) {
    const W1 = solve3(armPose5(t)).W1;
    return W({x: W1.x - 10, d: 0, h: W1.h - 40, z: 2.8, e: 14, ay: 780}, 'P18 wrist, moving');
  }
  if (t < SH5.sciC) return W(lerpCam3(C5.pay, C5.pay2, ramp(t, CONTACT.main + 0.2, CONTACT.main + 0.45)), 'P19 payoff: contact, stroke, squirt, landing');
  if (t < SH5.branch) return {cam: C5.pay, name: 'P20 reaction C', overlay: 'sciC', world: false};
  if (t < SH5.watch) return W(lerpCam3(MON_FILL, monCam(620, 880, 1.06, 960), ramp(t, SH5.branch, SH5.watch)), 'P21 the branch, already there');
  if (t < SH5.approach) return W(lerpCam3(C5.watchA, C5.watchB, ramp(t, SH5.watch + 0.2, SH5.approach)), 'P22 eyeline: the scientist watches, camera closes in', 'watch');
  return W(lerpCam3(C5.approach, C5.approachB, clamp01((t - SH5.approach) / (DURATION3_S - SH5.approach))), 'P23 the approach begins');
};

// fluid time: the opening excerpt plays the payoff's first 0.3 s after contact; the bench is clean from the story start
// until the payoff, and the marks stay from the payoff to the end
const fluidDt = (t: number): number | null => (t < SH5.sciA ? t - CONTACT.preview : t >= CONTACT.main - 0.1 ? t - CONTACT.main : null);
const dentAmt = (dt: number | null) => (dt === null || dt < -0.04 ? 0 : dt < 0 ? 1 + dt / 0.04 : dt < 0.18 ? 1 : 1 - clamp01((dt - 0.18) / 0.08));

// ---- scientist acting per insert ----
const actA = (t: number): Acting => {
  const k = mj((t - SH5.sciA + 0.08) / 0.2); // the startle is already under way at the cut, then holds
  return {gx: 1, gy: 0.55, brow: 0.45 + 0.55 * k, open: 1.1 + 0.3 * k, lean: 0.8 * k, grip: 0.3 + 0.7 * k, mouth: 0.6 * k};
};
const actEyes = (t: number): Acting => {
  // eyes follow the screen path down, then snap toward the bench
  const down = ramp(t, SH5.eyes, 13.3);
  const turn = ramp(t, 13.32, 13.45);
  return {gx: -0.75 + 1.75 * turn, gy: -0.1 + 0.6 * down - 0.2 * turn, brow: 0.5 + 0.4 * turn, open: 1.05 + 0.2 * turn, lean: 0, grip: 0.4, mouth: 0};
};
const actC = (t: number): Acting => {
  const k = mj((t - SH5.sciC) / 0.15);
  return {gx: 0.95, gy: 0.6, brow: 1, open: 1.25 - 0.1 * k, lean: 0.45 * k, grip: 1, mouth: 0};
};

const InsertBG: React.FC<{tone?: number}> = ({tone = 0}) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#v5-insertBG)" />
    {/* out-of-focus lab: monitor glow behind, a warm lamp, equipment lights */}
    <circle cx={180} cy={520} r={260} fill="#2DAFB0" opacity={0.18 + 0.05 * tone} />
    <circle cx={930} cy={380} r={130} fill="#FFD59A" opacity={0.18} />
    {[[820, 900, 34], [900, 1040, 22], [760, 1120, 18], [120, 1180, 26]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#43E3D2" opacity={0.12} />
    ))}
  </g>
);

const ScientistOverlay: React.FC<{t: number; kind: Overlay; cam: Cam3; pose: ReturnType<typeof armPose5>}> = ({t, kind, cam, pose}) => {
  if (kind === 'sciA')
    return (
      <g>
        <InsertBG />
        <g transform="translate(470 450) scale(1.55)">
          <SciFront a={actA(t)} />
        </g>
      </g>
    );
  if (kind === 'eyes')
    return (
      <g>
        <InsertBG tone={1} />
        {/* the same face, framed on the eyes */}
        <g transform="translate(380 900) scale(4.3) translate(-27 -24)">
          <SciFront a={actEyes(t)} showHand={false} />
        </g>
      </g>
    );
  if (kind === 'sciC')
    return (
      <g>
        <InsertBG />
        {/* tighter than insert A: the face alone, eyes on the bench */}
        <g transform="translate(450 760) scale(2.3)">
          <SciFront a={actC(t)} showHand={false} />
        </g>
      </g>
    );
  if (kind === 'ots')
    return (
      <g transform="translate(250 1300) scale(1.55)">
        <SciRear turn={ramp(t, SH5.shoulder, SH5.eyes)} />
      </g>
    );
  // foreground scientist on bench shots: their gaze lands on the blade's screen position
  const kn = knifeWorld(pose);
  const blade = toScreen(cam, {x: kn.W((KN.tipU + KN.handleFront) / 2, KN.edge).x, d: 0, h: kn.W((KN.tipU + KN.handleFront) / 2, KN.edge).h});
  const slide = kind === 'watch' ? ramp(t, SH5.watch + 0.3, SH5.approach) : 0;
  const head = {x: 130 - 260 * slide, y: 860 + 40 * slide};
  const s = 1.25 + 0.5 * slide;
  const eye = {x: head.x + 70 * s, y: head.y - 24 * s};
  const dx = blade.x - eye.x, dy = blade.y - eye.y, len = Math.hypot(dx, dy) || 1;
  const a: Acting = kind === 'notice'
    ? {gx: dx / len, gy: (dy / len) * 1.4, brow: 0.4 + 0.5 * ramp(t, SH5.notice, SH5.notice + 0.25), open: 1.1, lean: 0.25 * ramp(t, SH5.notice + 0.1, SH5.wrist), grip: 0.6, mouth: 0}
    : {gx: dx / len, gy: (dy / len) * 1.4, brow: 0.8, open: 1.08, lean: 0.15, grip: 0.9, mouth: 0};
  return (
    <g transform={`translate(${head.x} ${head.y}) scale(${s})`}>
      <SciFront a={a} showHand={false} />
    </g>
  );
};

export const HiddenTriggerV5: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS3;
  const pose = armPose5(t);
  const sh = shot5(t);
  const cam = sh.cam;
  const st = screen5(t);
  const fdt = fluidDt(t);
  const glint = t >= SH5.grip && t < SH5.real ? (t - SH5.grip - 0.4) / 0.6 : undefined;
  const hot = (t >= SH5.elbow && t < SH5.screen) || (t >= SH5.wrist && t < SH5.payoff) ? 1 : 0;
  const sciLean = t >= SH5.notice && t < SH5.wrist ? 0.5 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#0A1015'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <WorldDefs />
        <defs>
          <linearGradient id="v5-insertBG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#13222B" />
            <stop offset="1" stopColor="#0A1217" />
          </linearGradient>
          <radialGradient id="v5-vig" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        {sh.world && (
          <g transform={camTransform(cam)}>
            <TestBay5 c={cam} pose={pose} glint={glint} hot={hot} squeeze={squeeze5(t)} screen={<Screen4 t={t} st={st} />} fluidDt={fdt} dent={dentAmt(fdt)} sciLean={sciLean} />
          </g>
        )}
        {sh.overlay !== 'none' && <ScientistOverlay t={t} kind={sh.overlay} cam={cam} pose={pose} />}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#v5-vig)" />
      </svg>
      <Captions3 t={t} />
      {/* the approved narration (narration_v3_testvoice.wav) is mixed into mix_v5.wav unchanged */}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v5.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration_v3_testvoice.wav')} />}
    </AbsoluteFill>
  );
};
export const V5_SCI_COLORS = SCI;
export const V5_W = W3;
