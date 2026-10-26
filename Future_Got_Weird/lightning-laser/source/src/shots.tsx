// Lightning Laser: the shots. Each sequence is a camera and a state as functions of film time t (seconds); the
// boundaries come from the measured narration (audio/narration/words.json). See production/SHOTS_AND_TRANSITIONS.md.
//
//  A/B 0.00-2.52  channel close-up (the loop's seam) -> pull out to the site; the leader climbs the channel, connects
//  C   2.52-4.31  matched cut through the shelter window: the operator finishes a control turn, watches the bolt
//  D   4.31-7.81  illustrative vignette: the lead, a downward strike, two skeleton exposures; follow the path into air
//  E   7.81-9.00  matched line cut to the beam leaving the launch telescope; pull back over the apparatus
//  F   9.00-11.35 ride a pulse up the beam toward the region above the tower tip
//  G  11.35-13.30 zoom into that pulse: molecules lose electrons as it passes
//  H  13.30-15.50 the same molecules: the channel heats and thins, bounded by ordinary air
//  I  15.50-18.50 a discharge front runs up the treated channel; branches into ordinary air stall
//  J  18.50-21.55 pull out along the channel to the tower tip; the upward leader incepts and climbs it
//  K  21.55-25.62 matched wider view: the guided section, the branches beyond, the 160+ ft bracket
//  L  25.62-28.94 an ordinary rod: follow the grounded conductor up to its metal tip
//  M  28.94-31.75 match the rod tip to the tower tip; the channel continues above it
//  N  31.75-33.50 push into the channel to the opening close-up; a new leader enters from below across the seam
import React from 'react';
import {Cam} from './dc/camera';
import {clamp, noise1} from './dc/math';
import {camAt, camZoom, inOut, outC, sm5} from './camera';
import {DUR, ss} from './lib';
import {SiteState, SiteWorld} from './scenes/Site';
import {InteriorScene} from './scenes/Interior';
import {VG, VignetteWorld} from './scenes/Vignette';
import {RodWorld, ROD_TIP} from './scenes/Rod';
import {LASER_MOLS, M, MicroField, BEAM_R} from './scenes/Micro';
import {AX_ANG, axisPt, boltLight, CAM0, DEMO_CONNECT, demoS, EXIT_H, G, H0, LOOP_CONNECT, loopS, P0, TIP} from './world/site';

export const T = {B0: 0, C0: 2.52, D0: 4.31, E0: 7.81, F0: 9.0, G0: 11.35, GM: 11.95, H0: 13.3, I0: 15.5, J0: 18.5, K0: 21.55, L0: 25.62, M0: 28.94, N0: 31.75};

/** loop time: the start of the film and its end are the same clock (the seam) */
export const tauOf = (t: number) => (t > DUR / 2 ? t - DUR : t);
const rainOf = (t: number) => tauOf(t) + 40;

// ------------------------------------------------------------ the laser's pulse packets (site scale)
const PD = 260; // packet spacing along the axis (illustrative)
/** the followed pulse: 420 px/s up the beam, slowing to the molecular view's pace as the camera zooms in on it */
export const hF = (t: number) => {
  const a = 10.9, b = T.GM;
  if (t < a) return -905 + 420 * (t - T.F0);
  if (t < b) {
    const u = t - a;
    const v0 = 420, v1 = 35, d = b - a;
    return -905 + 420 * (a - T.F0) + v0 * u + ((v1 - v0) / (2 * d)) * u * u;
  }
  return H0 + 35 * (t - b);
};
const fPulses = (t: number) => [-4, -3, -2, -1, 0, 1, 2, 3].map((k) => hF(t) + k * PD).filter((h) => h > EXIT_H - 6);
/** loop-clock pulses for the opening/ending and other site shots: a steady stream up the beam */
const streamPulses = (tau: number, speed = 520) => Array.from({length: 7}, (_, k) => EXIT_H + ((((tau + 50) * speed + k * PD) % (PD * 6)) + PD * 6) % (PD * 6) - 40);

const loopState = (t: number): SiteState => {
  const tau = tauOf(t);
  const L = boltLight(tau - LOOP_CONNECT);
  const s = loopS(tau);
  return {boltS: s, boltCore: L.core, flash: s > 0 ? L.scene : 0, beam: 0.85, pulses: streamPulses(tau), channel: 0.8, tau, rainT: rainOf(t), drift: tau};
};

// ------------------------------------------------------------ cameras
const WIDE = {x: 560, y: 960};
const camAB = (t: number): Cam => {
  if (t < 0.3) return {...CAM0};
  if (t < 1.55) return camZoom(t, 0.3, 1.55, P0, CAM0.z, WIDE, 1.0, sm5);
  const u = ss(t, 1.55, 2.6);
  return {x: WIDE.x + 6 * u, y: WIDE.y - 10 * u, z: 1.0 - 0.025 * u};
};
const camC = (t: number): Cam => ({x: 640 - 8 * ss(t, T.C0, T.D0), y: 830 + 6 * ss(t, T.C0, T.D0), z: 1.1});
const camD = (t: number): Cam => {
  // hold on him (a slow push), then pan up to the bolt's path beside his head, then zoom into the air there
  const hold = (u: number) => ({x: 512 - 10 * u, y: 1040 - 50 * u, z: 1.14 + 0.08 * u});
  const pan0 = VG.rush - 0.35;
  if (t < pan0) return hold(ss(t, T.D0, VG.rush));
  const h = hold(ss(pan0, T.D0, VG.rush));
  const q = QVc();
  if (t < VG.rush + 0.05) {
    const u = sm5(clamp((t - pan0) / (VG.rush + 0.05 - pan0)));
    return {x: h.x + (q.x - h.x) * u, y: h.y + (q.y - h.y) * u, z: Math.exp(Math.log(h.z) + (Math.log(1.6) - Math.log(h.z)) * u)};
  }
  if (t < VG.micro + 0.1) {
    const u = inOut(clamp((t - VG.rush - 0.05) / (VG.micro + 0.05 - VG.rush)));
    return {x: q.x, y: q.y, z: Math.exp(Math.log(1.6) + (Math.log(28) - Math.log(1.6)) * u)};
  }
  const u = ss(t, VG.micro + 0.1, T.E0 + 0.3);
  return {x: q.x + 6 * u, y: q.y - 18 * u, z: 28 + 3 * u};
};
import {QV} from './scenes/Vignette';
const QVc = () => QV;

// E/F: one move: pull back from the exit over the apparatus, then ride the followed pulse up the beam
const camE = (t: number): Cam => {
  const c0 = axisPt(EXIT_H + 70);
  return camZoom(t, T.E0, T.F0, c0, 3.4, {x: 366, y: 1606}, 1.9, outC);
};
const camF = (t: number): Cam => {
  const track = axisPt(hF(t) + 70);
  const w = ss(t, T.F0, T.F0 + 0.8);
  const e = {x: 366, y: 1606};
  const z = 1.9 + 0.9 * ss(t, T.F0 + 0.3, T.G0);
  return {x: e.x + (track.x - e.x) * w, y: e.y + (track.y - e.y) * w, z};
};
const camG = (t: number): Cam => {
  const p = axisPt(hF(t) + 70 * (1 - ss(t, T.G0, T.GM)));
  const z = Math.exp(Math.log(2.8) + (Math.log(32) - Math.log(2.8)) * inOut(clamp((t - T.G0) / (T.GM - T.G0))));
  return {x: p.x, y: p.y, z};
};
/** micro phase: the camera drifts up the channel behind the pulse, settles, pulls back to show the channel's edges */
const bCam = (t: number) => {
  // micro units of b above P0
  const v = 700 * 0.6;
  if (t < T.H0) return v * (t - T.GM);
  const d = 0.9;
  const u = clamp((t - T.H0) / d);
  return v * (T.H0 - T.GM) + v * d * (u - u * u / 2) + 60 * ss(t, T.I0, T.J0);
};
const camMicro = (t: number): Cam => {
  const p = axisPt(H0 + bCam(t) / M);
  const z = t < T.H0 ? 32 - 2 * ss(t, T.GM, T.H0) : 30 - 10 * ss(t, T.H0 + 0.3, T.H0 + 1.8);
  return {x: p.x, y: p.y, z};
};
const J_TIP = {x: 712, y: 640};
const camK = (t: number): Cam => {
  const u = ss(t, 21.95, T.L0);
  return {x: 730 - 10 * u, y: 600 + 8 * u, z: 1.1 + 0.05 * u};
};
const camJ = (t: number): Cam => {
  const start = camMicro(T.J0);
  if (t < 19.55) return camZoom(t, T.J0, 19.55, start, start.z, J_TIP, 2.3, sm5);
  // tilt / track with the leader's tip through the guided section, lagging it a little; then one continuous pull
  // back to the wider view as it leaves the channel (no cut)
  const s = Math.max(0, demoS(t - 0.12));
  const hTip = Math.min(G + 40, s);
  const target = axisPt(Math.max(0, hTip - 30));
  const w = ss(t, 19.55, 20.1);
  const tr = {x: J_TIP.x + (target.x + 10 - J_TIP.x) * w, y: J_TIP.y + (target.y + 40 - J_TIP.y) * w, z: 2.3};
  const k = camK(t);
  const b = sm5(clamp((t - 20.95) / 1.0));
  return {x: tr.x + (k.x - tr.x) * b, y: tr.y + (k.y - tr.y) * b, z: Math.exp(Math.log(tr.z) + (Math.log(k.z) - Math.log(tr.z)) * b)};
};
const camL = (t: number): Cam =>
  camAt(t * 30, [
    [T.L0 * 30, 830, 1610, 2.0],
    [26.4 * 30, 870, 1330, 2.05, inOut],
    [27.15 * 30, 740, 1130, 2.2, inOut],
    [27.95 * 30, ROD_TIP.x, ROD_TIP.y + 160 / 2.4 + 6, 2.4, inOut],
    [T.M0 * 30, ROD_TIP.x, ROD_TIP.y + 160 / 2.4, 2.4, inOut],
  ]);
const M_END = {x: 742, y: 566};
const camM = (t: number): Cam => {
  const c0 = {x: TIP.x, y: TIP.y + 160 / 2.4};
  return camZoom(t, T.M0 + 0.25, T.N0 + 0.05, c0, 2.4, M_END, 1.45, sm5);
};
const camN = (t: number): Cam => (t < 33.2 ? camZoom(t, T.N0, 33.2, M_END, 1.45, P0, CAM0.z, sm5) : {...CAM0});

export const camFor = (t: number): Cam => {
  if (t < T.C0) return camAB(t);
  if (t < T.D0) return camC(t);
  if (t < T.E0) return camD(t);
  if (t < T.F0) return camE(t);
  if (t < T.G0) return camF(t);
  if (t < T.GM) return camG(t);
  if (t < T.J0) return camMicro(t);
  if (t < T.L0) return camJ(t);
  if (t < T.M0) return camL(t);
  if (t < T.N0) return camM(t);
  return camN(t);
};

// ------------------------------------------------------------ micro (laser) state
const VP = 700; // micro units / s
const microPulses = (t: number) => [0, 1, 2, 3].map((k) => VP * (t - T.GM) - k * 1500).filter((b) => b > -2600 && b < 2600);
const release = (m: {a: number; b: number; i: number}) => {
  const core = Math.abs(m.a) < BEAM_R * 1.15;
  const edge = Math.abs(m.a) < BEAM_R * 1.9;
  const r = (m.i * 2654435761) % 1000 / 1000;
  if (core) return T.GM + (m.b + (r < 0.8 ? 0 : 1500)) / VP;
  if (edge && r < 0.4) return T.GM + (m.b + 1500 * (r < 0.2 ? 1 : 2)) / VP;
  return Infinity;
};
const heatOf = (t: number) => ss(t, 12.9, 15.1);
const frontOf = (t: number) => (t < 15.9 ? null : bCam(t) - 1000 + 1500 * ss(t, 15.9, 17.45));

const siteState = (t: number): SiteState => {
  const tau = tauOf(t);
  if (t < T.D0) return loopState(t);
  if (t < T.G0 || (t < T.J0 && t >= T.GM)) {
    return {boltS: -1, boltCore: 0, flash: 0, beam: 0.85, pulses: fPulses(t), channel: 0.55, tau, rainT: rainOf(t), drift: tau, status: 1};
  }
  if (t < T.GM) return {boltS: -1, boltCore: 0, flash: 0, beam: 0.85, pulses: fPulses(t), channel: 0.6, tau, rainT: rainOf(t), drift: tau};
  if (t < T.L0) {
    const s = demoS(t);
    const L = boltLight(t - DEMO_CONNECT, 2.4);
    return {boltS: s, boltCore: s > 0 ? L.core : 0, flash: s > 0 ? L.scene : 0, beam: 0.85, pulses: streamPulses(t), channel: 0.8, tau: t, rainT: rainOf(t), drift: tau,
      bracket: ss(t, 22.55, 23.25), label: ss(t, 23.55, 23.8) * (1 - ss(t, 25.2, 25.45))};
  }
  if (t < T.N0) {
    const grow = ss(t, 29.25, 31.0);
    return {boltS: -1, boltCore: 0, flash: 0, beam: 0.85, pulses: streamPulses(tauOf(t)), channel: 0.8, channelGrow: Math.max(0.02, grow), channelBoost: grow, tau, rainT: rainOf(t), drift: tau};
  }
  return loopState(t);
};

export const SceneAt: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const cam = camFor(t);
  if (t >= T.C0 && t < T.D0) {
    const k = 1.1 + 0.1 * ss(t, T.C0, T.D0);
    return <g transform={`translate(380 1150) scale(${k}) translate(-380 -1150)`}><InteriorScene t={t} t0={T.C0} siteCam={camC(t)} st={siteState(t)} drift={0} /></g>;
  }
  if (t >= T.D0 && t < T.E0) return <VignetteWorld cam={cam} t={t} />;
  if (t >= T.L0 && t < T.M0) return <RodWorld cam={cam} t={t} rt={rainOf(t)} drift={tauOf(t)} />;
  const st = siteState(t);
  // the molecules take over across a wide band of the zoom (log scale), so the hand-over spans several frames
  const microA = t >= T.G0 && t < T.K0 ? clamp((Math.log(cam.z) - Math.log(9)) / (Math.log(24) - Math.log(9))) : 0;
  const siteA = 1 - clamp((cam.z - 26) / 6);
  const zm = cam.z / M;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {siteA > 0 && <g opacity={1}><SiteWorld id="s" cam={cam} st={{...st, channel: st.channel * (1 - clamp((cam.z - 14) / 8))}} /></g>}
      {microA > 0 && (
        <g transform={`translate(540 960) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          <g transform={`translate(${P0.x} ${P0.y}) rotate(${AX_ANG}) scale(${1 / M})`}>
            <rect x={-4000} y={-6000} width={8000} height={12000} fill="#141E30" opacity={microA} />
            <MicroField id="lm" mols={LASER_MOLS} view={{a0: -700, a1: 700, b0: bCam(t) - 1100, b1: bCam(t) + 1100}}
              mode={{pulses: microPulses(t), release, t, heat: heatOf(t), front: frontOf(t), frontK: 1 - ss(t, 18.2, 18.9), breakdown: 0, tug: 0, alpha: microA, zm}} />
          </g>
        </g>
      )}
    </svg>
  );
};

export const SceneFrame: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  if ((t >= T.C0 && t < T.D0) || (t >= T.D0 && t < T.E0) || (t >= T.L0 && t < T.M0)) {
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <SceneAt f={f} />
      </svg>
    );
  }
  return <SceneAt f={f} />;
};
export {noise1};
