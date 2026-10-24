// FGW Laser Voices V6: the film (see production/V6_SHOT_PLAN.md). Clean cuts between ideas; one continuous move into
// each new scale (into the ear, into the air, back out to the eardrum); match cuts where shapes connect.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {basis, v3, V3} from '../v4/rig/geo4';
import {FPS, W, H, lookCam, Cam, ss, lerp, clamp, eio, DUR} from '../v4/core4';
import {Captions3} from '../v3/Captions3';
import {AtriumV6} from './AtriumV6';
import {SHOT, whisperAt} from './cues6';
import {EAR0, BEAM} from './stage6';
import {Section6} from './Section6';
import {Mech6} from './Mech6';
import {Lab6, LabSweep6} from './Lab6';

type CamK = {pos: V3; at: V3; f: number};
const C = (pos: number[], at: number[], f: number): CamK => ({pos: v3(pos[0], pos[1], pos[2]), at: v3(at[0], at[1], at[2]), f});
const mixCam = (a: CamK, b: CamK, u: number): Cam => {
  const L = (p: V3, q: V3) => v3(lerp(p.x, q.x, u), lerp(p.y, q.y, u), lerp(p.z, q.z, u));
  return lookCam(L(a.pos, b.pos), L(a.at, b.at), Math.exp(lerp(Math.log(a.f), Math.log(b.f), u)));
};
export const CAM = {
  close: C([0.42, 1.62, 1.25], [0.42, 1.25, 3.5], 1550), // A1 / F5: the two of them, close
  two: C([-1.05, 1.75, 0.7], [0.3, 1.1, 3.55], 1250), // A2: front-left, with the case
  setup: C([-5.6, 1.72, 2.6], [-0.2, 1.3, 3.5], 1120), // A3: behind the transmitter (large, right), the two in line beyond it
  head: C([-0.12, 1.42, 2.3], [-0.12, 1.36, 3.5], 2300), // A4: his head
  side: C([-1.95, 1.4, -1.1], [-1.95, 1.2, 3.5], 1000), // F1 / F4: side-on: transmitter, the path, the listener
  cross: C([-1.9, 1.62, 1.1], [-1.95, 1.35, 3.5], 1450), // F2: the interception
  react: C([-0.85, 1.5, 1.55], [-0.85, 1.38, 3.45], 950), // F3: his reaction, the visitor behind
};
const EAR_PUSH = {pos: v3(EAR0.x + 0.03, EAR0.y + 0.01, EAR0.z - 0.55), at: EAR0, f: 3400};
const lock = (k: CamK, t: number, t0: number, t1: number, amt = 0.015): Cam => lookCam(k.pos, k.at, k.f * (1 + amt * clamp((t - t0) / (t1 - t0))));

export const atriumCamAt = (t: number): Cam | null => {
  const s = SHOT;
  // F5 and A1 are one shot across the loop seam
  const closeDrift = (tau: number) => lookCam(CAM.close.pos, CAM.close.at, CAM.close.f * (1 + 0.02 * clamp((tau - s.f5) / (DUR + s.a2 - s.f5))));
  if (t < s.a2) return closeDrift(t + DUR);
  if (t < s.a3) return lock(CAM.two, t, s.a2, s.a3);
  if (t < s.a4) return lock(CAM.setup, t, s.a3, s.a4);
  if (t < s.m1[1]) return t < s.m1[0] ? lock(CAM.head, t, s.a4, s.m1[0], 0.01) : mixCam({...CAM.head, f: CAM.head.f * 1.01}, EAR_PUSH, eio(clamp((t - s.m1[0]) / (s.m1[1] - s.m1[0]))));
  if (t < s.f1) return null;
  if (t < s.f2) return lock(CAM.side, t, s.f1, s.f2);
  if (t < s.f3) return lock(CAM.cross, t, s.f2, s.f3, 0.02);
  if (t < s.f4) return lock(CAM.react, t, s.f3, s.f4, 0.02);
  if (t < s.f5) return lock(CAM.side, t, s.f4, s.f5);
  return closeDrift(t);
};

const Layer: React.FC<{op?: number; children: React.ReactNode}> = ({op = 1, children}) => (op <= 0.001 ? null : <AbsoluteFill style={{opacity: op}}>{children}</AbsoluteFill>);

export const Scene6: React.FC<{t: number}> = ({t}) => {
  const s = SHOT;
  const out: React.ReactNode[] = [];
  const cam = atriumCamAt(t);
  const inF = t >= s.f1 && t < s.f5;
  // the beam's visualisation: drawn in during A3 (3.25..3.9); present in F1..F4 (its stop shows the block)
  const beam = t >= s.a3 && t < s.a4 ? ss(3.2, 3.35, t) : inF ? 0.9 : 0;
  const reveal = t >= s.a3 && t < s.a4 ? clamp((t - 3.25) / 0.65) : 1;
  const whisper = (t < s.a4 || inF || t >= s.f5) ? whisperAt(t) : 0;
  if (cam) out.push(<Layer key="atr"><AtriumV6 b={basis(cam)} t={t} o={{beam, beamReveal: reveal, whisper, visitor: inF, crowd: true}} /></Layer>);
  if (t >= s.m1[1] - 0.25 && t < s.c1) out.push(<Layer key="sec" op={t < s.m1[1] ? ss(s.m1[1] - 0.25, s.m1[1], t) : 1}><Section6 t={t} /></Layer>);
  if (t >= s.c1 && t < s.c2) out.push(<Layer key="mech"><Mech6 t={t} /></Layer>);
  if (t >= s.c2 && t < s.d) out.push(<Layer key="sweep"><LabSweep6 t={t} /></Layer>);
  if (t >= s.d && t < s.f1) out.push(<Layer key="lab"><Lab6 t={t} /></Layer>);
  return <>{out}</>;
};

export const Film6: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_v6', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <Scene6 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Film6Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#1B2A31'}}>
    <Scene6 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {W, H, BEAM};
