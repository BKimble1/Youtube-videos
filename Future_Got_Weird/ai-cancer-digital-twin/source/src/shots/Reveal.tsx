// 2 · THE DIGITAL REVEAL ("Now imagine" → "First, build the copy"). Match cut: the membrane's arc becomes the top
// contour of a wireframe tumour model; the camera pulls back out of a display to a clinician reviewing scans beside
// it. On "That complete system is a possible future" the route appears as four linked cards (model → address →
// controlled attack → survivor, looping back); on "AI has not cured all cancer" the links break; on "separate parts"
// the cards drift apart, and the camera pushes into the first card.
import React from 'react';
import {T, TE, clamp01, lerp, seg, smooth, easeOut, easeInOut, pulse, noise} from '../kit/core';
import {Cam, camPath, smoothCam, camTransform, toScreen} from '../kit/cam';
import {Frame, Vignette} from '../kit/fx';
import {IDLE, Pose, mixPose, reach} from '../components/Character';
import {ClinicRoom, DISPLAY} from '../sets/clinic';
import {Grid, Twin3D, TwinShape, twinSilhouette} from '../art/digital';
import {AdcIcon, Card, DeviceIcon, SurvivorIcon, TwinIcon} from '../art/icons';
import {CLINICIAN, Person} from '../art/lab';
import {C, M} from '../theme';

export const t0 = T('Now imagine'), tTest = T('by testing'), tFirst = TE('your tumor first');
export const tSystem = T('That complete system'), tNotCured = T('AI has not cured'), tParts = T('Researchers are already building');
export const REVEAL_END = T('First, build') - 0.04;

export const TWIN_A: TwinShape = {R: 170, seed: 4, rough: 0.18};
const twinRot = (t: number) => 0.6 + (t - t0) * 0.35;
const TW = {x: DISPLAY.x, y: DISPLAY.y + 10};
// match-cut framing: the twin's top contour sits where the hook's membrane ended (screen y ≈ 754)
const SIL0 = twinSilhouette(TWIN_A, twinRot(t0));
const TOP = SIL0.reduce((a, b) => (b[1] < a[1] ? b : a));
const Z0 = 20;
const CAM_MATCH: Cam = {x: TW.x + TOP[0], y: TW.y + TOP[1] - (750 - 540) / Z0, z: Z0};

export const CARD_X = [-360, -120, 120, 360];
const spread = (t: number) => 1 + 0.32 * easeInOut(seg(t, tParts + 0.1, tParts + 1.4));
const PUSH0 = REVEAL_END - 1.15;

const camRaw = (t: number): Cam =>
  camPath([
    [t0, CAM_MATCH],
    [t0 + 0.3, {...CAM_MATCH, y: CAM_MATCH.y - 4, z: Z0 * 0.86}, (x) => x],
    [t0 + 2.4, {x: TW.x, y: TW.y - 10, z: 1.85}, easeOut],
    [tFirst - 0.25, {x: TW.x + 10, y: TW.y - 5, z: 1.95}],
    [tSystem - 0.2, {x: 1010, y: 560, z: 1.0}],
    [tSystem + 0.8, {x: 930, y: 500, z: 1.18}],
    [tParts, {x: 900, y: 480, z: 1.3}],
    [PUSH0, {x: DISPLAY.x, y: DISPLAY.y, z: 1.62}],
    [REVEAL_END + 0.02, {x: DISPLAY.x + CARD_X[0] * spread(REVEAL_END), y: DISPLAY.y - 10, z: 7.2}, (x) => x * x * x],
  ])(t);

const ScreenContent: React.FC<{t: number; z: number}> = ({t, z}) => {
  const lw = Math.max(0.9, 2.8 / z);
  const route = smooth(seg(t, tSystem - 0.1, tSystem + 0.7));
  const twinK = 1 - route;
  const sp = spread(t);
  const broken = smooth(seg(t, tNotCured, tNotCured + 0.6));
  // test attacks drift into the model and the model answers with response rings
  const attacks = [0, 1, 2].map((i) => {
    const a0 = tTest + i * 0.45;
    const u = seg(t, a0, a0 + 1.0);
    return {u, x: lerp(-460 + i * 40, (i - 1) * 50, easeOut(u)), y: lerp(-250 + i * 160, -10 + (i - 1) * 40, easeOut(u)), ring: pulse(t, a0 + 1.05, 0.22)};
  });
  return (
    <g>
      <rect x={-600} y={-400} width={1200} height={800} fill={M.screen} />
      <Grid x0={-600} y0={-400} x1={600} y1={400} step={40} op={0.28} lw={lw * 0.5} />
      {/* model view */}
      {twinK > 0.01 && (
        <g opacity={twinK} transform={`translate(0 10) scale(${lerp(1, 0.32, route)}) translate(${lerp(0, CARD_X[0] * 3, route)} 0)`}>
          <Twin3D shape={{...TWIN_A, scale: 1 - 0.05 * smooth(seg(t, tTest + 1.2, tFirst))}} rotY={twinRot(t)} lw={lw} voxels={smooth(seg(t, t0 + 1.2, t0 + 2.2))} t={t} heat={(x, y) => 0.5 + 0.5 * Math.sin(x * 0.02 + y * 0.015)} />
          {attacks.map((a, i) => (
            <g key={i}>
              {a.u > 0 && a.u < 1 && <g transform={`translate(${a.x} ${a.y}) rotate(${-10 + i * 12}) scale(0.55)`} opacity={smooth(a.u * 4) * (1 - smooth((a.u - 0.85) * 6))}><DeviceIcon t={t} s={1.6} /></g>}
              {a.ring > 0.02 && <circle cx={(i - 1) * 50} cy={-10 + (i - 1) * 40} r={30 + (1 - a.ring) * 110} fill="none" stroke={M.wireHot} strokeWidth={lw * 3} opacity={a.ring} />}
              {a.ring > 0.02 && <circle cx={(i - 1) * 50} cy={-10 + (i - 1) * 40} r={26} fill={M.wireHot} opacity={a.ring * 0.5} />}
            </g>
          ))}
        </g>
      )}
      {/* the route: four cards, dashed links, a loop back from the survivor to the model */}
      {route > 0.01 && (
        <g>
          {[0, 1, 2].map((i) => {
            const xa = CARD_X[i] * sp + 95, xb = CARD_X[i + 1] * sp - 95;
            const k = smooth(seg(t, tSystem + 0.3 + i * 0.25, tSystem + 0.7 + i * 0.25));
            const fall = broken * (12 + i * 8);
            return (
              <g key={i} opacity={k * (1 - 0.75 * broken)}>
                <line x1={xa} y1={-10 + fall * 0.2} x2={lerp(xa, xb, k * (1 - 0.45 * broken))} y2={-10 + fall} stroke={M.wire} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-t * 40} strokeLinecap="round" />
              </g>
            );
          })}
          {(() => {
            const k = smooth(seg(t, tSystem + 1.2, tSystem + 1.9)) * (1 - broken);
            const xa = CARD_X[3] * sp, xb = CARD_X[0] * sp;
            return k > 0.01 ? <path d={`M ${xa} 90 C ${xa} 230 ${xb} 230 ${xb} 90`} fill="none" stroke={M.wireHot} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={t * 40} opacity={k} /> : null;
          })()}
          {[TwinIcon, AdcIcon, DeviceIcon, SurvivorIcon].map((Ic, i) => {
            const k = smooth(seg(t, tSystem + i * 0.28, tSystem + 0.45 + i * 0.28));
            const wob = broken * noise(t * 3 + i, i) * 4;
            const warm = i > 0 ? 1 : 0;
            return (
              <g key={i} transform={`translate(${CARD_X[i] * sp} ${-10 + wob}) scale(${0.6 + 0.4 * k})`} opacity={k}>
                <Card w={190} h={190} edge={i === 0 ? M.wire : M.wireHot} fill={warm ? '#24203A' : M.screenLift} />
                <Ic t={t} s={i === 2 ? 1.05 : 1} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

export const Reveal: React.FC<{t: number}> = ({t}) => {
  const cam = t < t0 + 0.45 ? camRaw(t) : smoothCam(camRaw, t, 0.18);
  const ch = {x: 1470, y: 1150, scale: 1.5};
  const point = smooth(seg(t, tSystem + 0.1, tSystem + 0.6)) * (1 - smooth(seg(t, tNotCured + 0.2, tNotCured + 0.8)));
  const think = smooth(seg(t, tNotCured + 0.4, tNotCured + 1.0));
  const scans = 1 - smooth(seg(t, tSystem - 0.4, tSystem));
  const base: Pose = {...IDLE, lookX: -0.85, lookY: -0.1 - 0.5 * scans, tilt: -4, mouth: 'flat', armL: {a: 10, b: 20}, armR: {a: 8, b: 14}};
  const pointing: Pose = {...base, armL: reach(ch, -1, 1240, 560), mouth: 'smile', brows: 0.3};
  const thinking: Pose = {...base, armR: {a: 30, b: 140}, tilt: -8, brows: -0.2, mouth: 'hmm'};
  const pose = mixPose(mixPose(base, pointing, point), thinking, think * (1 - point));
  return (
    <Frame bg={C.paper}>
      <g transform={camTransform(cam)}>
        <ClinicRoom t={t} glow={1}>
          <ScreenContent t={t} z={cam.z} />
        </ClinicRoom>
        <Person look={CLINICIAN} pose={pose} t={t} seed={4} x={ch.x} y={ch.y} scale={ch.scale} />
      </g>
      <Vignette op={0.35 + 0.4 * (1 - smooth(seg(t, t0 + 1.2, t0 + 2.4)))} />
    </Frame>
  );
};
export const _r = {clamp01, toScreen, lerp};
