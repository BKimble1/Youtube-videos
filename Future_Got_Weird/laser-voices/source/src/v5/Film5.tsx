// FGW Laser Voices V5: the film. Thirteen shots joined by clean cuts and match cuts; three deliberate camera moves
// (M1 into the ear, M2 along the beam into the air, M3 from the molecules out to the ear). See production/V5_SHOT_PLAN.md.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {basis, v3, V3} from '../v4/rig/geo4';
import {FPS, W, H, lookCam, Cam, ss, lerp, clamp, eio, DUR} from '../v4/core4';
import {Captions3} from '../v3/Captions3';
import {AtriumV5} from './AtriumV5';
import {SHOT, whisperAt} from './cues5';
import {EAR0, BEAM} from './stage5';
import {Section5} from './Section5';
import {Mech5, Sweep5} from './Mech5';
import {Lab5} from './Lab5';

type CamK = {pos: V3; at: V3; f: number};
const C = (pos: number[], at: number[], f: number): CamK => ({pos: v3(pos[0], pos[1], pos[2]), at: v3(at[0], at[1], at[2]), f});
const mixCam = (a: CamK, b: CamK, u: number): Cam => {
  const L = (p: V3, q: V3) => v3(lerp(p.x, q.x, u), lerp(p.y, q.y, u), lerp(p.z, q.z, u));
  return lookCam(L(a.pos, b.pos), L(a.at, b.at), Math.exp(lerp(Math.log(a.f), Math.log(b.f), u)));
};
// the atrium compositions (each is a locked camera; a slow drift of a few percent keeps the image breathing)
export const CAM = {
  two: C([-1.05, 1.75, 0.7], [0.3, 1.1, 3.55], 1250), // S1 / S13
  setup: C([-5.35, 1.62, 3.0], [-0.5, 1.2, 3.6], 1150), // S2
  close: C([0.42, 1.62, 1.25], [0.42, 1.25, 3.5], 1550), // S3
  head: C([-0.12, 1.42, 2.3], [-0.12, 1.36, 3.5], 2300), // S4
  wide: C([1.3, 2.3, -0.4], [-1.5, 1.12, 3.5], 1060), // S5 / S12: the geography from the front-left: the pair near, the transmitter beyond
};
// M1 destination: right up to his ear; M2 destination: beside his ear, on the beam, looking across it
const EAR_PUSH = {pos: v3(EAR0.x + 0.03, EAR0.y + 0.01, EAR0.z - 0.55), at: EAR0, f: 3400};
const B_PT = v3(EAR0.x + (BEAM.o.x - EAR0.x) * 0.08, EAR0.y + (BEAM.o.y - EAR0.y) * 0.08, EAR0.z + (BEAM.o.z - EAR0.z) * 0.08);
// above and in front of that point, looking down across the beam (so the background is the plain floor)
const AIR = {pos: v3(B_PT.x, B_PT.y + 0.5, B_PT.z - 0.32), at: B_PT, f: 2600};
const drift = (k: CamK, t: number, t0: number, t1: number, amt = 0.025): Cam => lookCam(k.pos, k.at, k.f * (1 + amt * clamp((t - t0) / (t1 - t0))));

export const atriumCamAt = (t: number): Cam | null => {
  const s = SHOT;
  // S13 and S1 are one continuous (very slow) drift across the loop seam
  const twoDrift = (tau: number) => lookCam(CAM.two.pos, CAM.two.at, CAM.two.f * (1 + 0.025 * clamp((tau - s.s13) / (DUR + s.s2 - s.s13))));
  if (t < s.s2) return twoDrift(t + DUR);
  if (t < s.s3) return drift(CAM.setup, t, s.s2, s.s3, 0.015);
  if (t < s.s4) return drift(CAM.close, t, s.s3, s.s4, 0.02);
  if (t < s.m1[1]) return t < s.m1[0] ? drift(CAM.head, t, s.s4, s.m1[0], 0.01) : mixCam({...CAM.head, f: CAM.head.f * 1.01}, EAR_PUSH, eio(clamp((t - s.m1[0]) / (s.m1[1] - s.m1[0]))));
  if (t < s.s5) return null;
  if (t < s.m2[0]) return drift(CAM.wide, t, s.s5, s.m2[0], 0.015);
  if (t < s.m2[1]) {
    const u = clamp((t - s.m2[0]) / (s.m2[1] - s.m2[0]));
    return mixCam({...CAM.wide, f: CAM.wide.f * 1.015}, AIR, 1 - Math.pow(1 - u, 2.2));
  }
  if (t < s.s12) return null;
  if (t < s.s13) return drift(CAM.wide, t, s.s12, s.s13, 0.03);
  return twoDrift(t);
};

const Layer: React.FC<{op?: number; children: React.ReactNode}> = ({op = 1, children}) => (op <= 0.001 ? null : <AbsoluteFill style={{opacity: op}}>{children}</AbsoluteFill>);

export const Scene5: React.FC<{t: number}> = ({t}) => {
  const s = SHOT;
  const out: React.ReactNode[] = [];
  const cam = atriumCamAt(t);
  const inS12 = t >= s.s12 && t < s.s13;
  // the beam's visualisation: drawn in on "invisible" (S5), kept through M2; present through S12
  const beam = t >= s.s5 && t < s.m2[1] ? ss(7.5, 7.65, t) : inS12 ? 0.9 : 0;
  const reveal = t >= s.s5 && t < s.m2[1] ? clamp((t - 7.55) / 0.75) : 1;
  const whisper = (t < s.s4 || inS12 || t >= s.s13) ? whisperAt(t) : 0;
  if (cam) {
    // M2 hands over to the molecular air in its last 0.2 s
    const op = t >= s.m2[0] && t < s.m2[1] ? 1 - ss(s.m2[1] - 0.22, s.m2[1], t) : 1;
    out.push(<Layer key="atr" op={op}><AtriumV5 b={basis(cam)} t={t} o={{beam, beamReveal: reveal, whisper, visitor: inS12, crowd: true}} /></Layer>);
  }
  // the ear cutaway (M1 end .. S5) and the molecular air -> ear (S6 end .. S9)
  if (t >= s.m1[1] - 0.25 && t < s.s5) out.push(<Layer key="sec" op={ss(s.m1[1] - 0.25, s.m1[1], t)}><Section5 t={t} /></Layer>);
  if (t >= s.m2[1] - 0.22 && t < s.s9) out.push(<Layer key="mic" op={ss(s.m2[1] - 0.22, s.m2[1], t)}><Section5 t={t} /></Layer>);
  if (t >= s.s9 && t < s.s10) out.push(<Layer key="mech"><Mech5 t={t} /></Layer>);
  if (t >= s.s10 && t < s.s11) out.push(<Layer key="sweep"><Sweep5 t={t} /></Layer>);
  if (t >= s.s11 && t < s.s12) out.push(<Layer key="lab"><Lab5 t={t} /></Layer>);
  return <>{out}</>;
};

export const Film5: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_v5', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <Scene5 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Film5Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#1B2A31'}}>
    <Scene5 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {W, H};
