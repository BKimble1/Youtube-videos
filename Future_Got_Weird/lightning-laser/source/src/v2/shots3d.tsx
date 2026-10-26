// V2: the perspective shots. Each returns a camera and the scene state for film time t; View3D draws them.
import React from 'react';
import {clamp} from '../dc/math';
import {boltLight, EXIT_H, G} from '../world/site';
import {sm5} from '../camera';
import {ss} from '../lib';
import {add3, axis3, BEAM_DIR, BOLT3, Cam3, EXIT3, len3, lerp3, lerpCam, lookAt, projector, sub3, TIP3, v3, V3} from './p3';
import {Apparatus3D, Beam3D, Discharge3D, FlashWash, Sky3D, Tower3D} from './Scene3D';
import {demoS2, DEMO0, DEMOC, loopS2, LOOPC, S, ShotId} from './timeline2';

export const DUR = 33.5;
export const tau2 = (t: number) => (t > DUR / 2 ? t - DUR : t);

export type St3 = {s: number; core: number; flash: number; beam: number; pulses: number[]; channel: number; channelTop?: number; fire: number; tipCorona: number; bracket?: number; label?: number; streamK?: number};

/** a steady stream of pulse packets up the beam (h in site px along the axis), on a given clock */
export const stream = (clk: number, speed = 520, gap = 230) => Array.from({length: 8}, (_, k) => EXIT_H - 30 + ((((clk + 50) * speed + k * gap) % (gap * 8)) + gap * 8) % (gap * 8));

// --------------------------------------------------------------- the discharge states
export const loopState = (t: number): St3 => {
  const tau = tau2(t);
  const s = loopS2(tau);
  const L = boltLight(tau - LOOPC, 1.5);
  const pre = clamp((tau + 1.62) / 1.0); // the field building at the end of the film (E2)
  return {
    s, core: s > 0 ? L.core : 0, flash: s > 0 ? Math.max(L.scene, 0.12) : 0, beam: 0.8, pulses: stream(tau), channel: 0.75 + 0.25 * pre,
    fire: 1, tipCorona: s > 0 ? clamp(1 - (s - 2) / 10) : pre * (0.5 + 0.5 * Math.abs(Math.sin(tau * 23))),
  };
};
export const demoState = (t: number): St3 => {
  const s = demoS2(t);
  const L = boltLight(t - DEMOC, 2.6);
  const pre = ss(t, 19.15, DEMO0);
  return {
    s, core: s > 0 ? L.core : 0, flash: s > 0 ? Math.max(L.scene, 0.1) : 0, beam: 0.8, pulses: stream(t), channel: 0.8,
    fire: 1, tipCorona: s > 0 ? clamp(1 - (s - 2) / 10) : pre * (0.45 + 0.55 * Math.abs(Math.sin(t * 27))),
    bracket: ss(t, 23.3, 23.9), label: ss(t, 23.62, 23.85) * (1 - ss(t, 25.35, 25.6)),
  };
};
export const quietState = (t: number, channel = 0.7): St3 => ({s: -1, core: 0, flash: 0, beam: 0.8, pulses: stream(t), channel, fire: 1, tipCorona: 0});

// --------------------------------------------------------------- cameras
const HOOK = {pos: v3(-22, 108, -22), target: v3(14, 168, 0), f: 640, roll: -8};
/** the loop camera: a slow, constant drift that runs straight across the seam (no stop, no reversal) */
export const hookCam = (t: number): Cam3 => {
  const tau = tau2(t);
  return {...lookAt(add3(HOOK.pos, v3(1.3 * tau, -0.7 * tau, 1.0 * tau)), add3(HOOK.target, v3(0.4 * tau, 0.6 * tau, 0)), HOOK.f), roll: HOOK.roll};
};
const along = (d: number) => add3(EXIT3, v3(BEAM_DIR.x * d, BEAM_DIR.y * d, 0));
export const cam3For = (id: ShotId, t: number): Cam3 => {
  const u = (a: number, b: number) => clamp((t - a) / (b - a));
  switch (id) {
    case 'H1':
    case 'E2':
      return hookCam(t);
    case 'H2': {
      // low beside the telescope: the tube in the foreground aimed at the storm, the tower and the bolt beyond
      const k = sm5(u(S.H2, S.H3));
      return lookAt(lerp3(v3(-51.5, -18.4, -7.5), v3(-52.5, -18.0, -8.6), k), lerp3(v3(-30, 40, 4), v3(-26, 52, 4), k), 560);
    }
    case 'H3': {
      const k = sm5(u(S.H3, S.C1 + 0.3));
      return lookAt(lerp3(v3(-52, 40, -380), v3(-60, 44, -430), k), v3(-4, 96, 0), 1450);
    }
    case 'F3': {
      const k = sm5(u(S.F3, S.F4));
      const pos = add3(EXIT3, v3(-2.2, 0.7, -2.4));
      return lookAt(lerp3(pos, add3(pos, v3(-0.3, -0.5, 0)), k), lerp3(EXIT3, along(30), k), 820 - 260 * k);
    }
    case 'F4': {
      // beside the upper tower: the camera picks up one pulse coming up the beam, tilts up with it as it passes the
      // mast, then pushes into it (F4View adds the packet's glow, which M2 opens on)
      const hf = hFollow(t);
      const zoom = ss(t, 10.98, S.M2);
      const c = lookAt(v3(-14 + 2 * zoom, 94, -40), axis3(hf + 60 * (1 - zoom)), 900);
      return {...c, roll: -4, f: Math.exp(Math.log(900) + (Math.log(9000) - Math.log(900)) * zoom * zoom)};
    }
    case 'M6':
    case 'T1': {
      // the pull-out from the molecular view ends on the rod tip: a dolly-zoom out from the channel point P0
      const zk = sm5(u(S.M6, 19.4));
      const target = lerp3(axis3(150), add3(axis3(30), v3(0, ss(t, 19.6, S.T2) * 6, 0)), zk);
      const c = lookAt(v3(-16, 120, -24), target, 2200);
      const dz = {...c, f: Math.exp(Math.log(42000) + (Math.log(2200) - Math.log(42000)) * zk)};
      // then keep pulling back to the wide establishing view as the leader incepts at the tip
      const wk = sm5(u(19.42, 20.25));
      return wk > 0 ? lerpCam(dz, lookAt(v3(-60, 70, -320), v3(0, 120, 0), 1300), wk) : dz;
    }
    case 'T2': {
      const k = sm5(u(S.T2, S.T3));
      return {...lookAt(v3(-40 + 4 * k, 40 + 2 * k, -90 + 4 * k), v3(8, 165 + 8 * k, 0), 800), roll: 6 - 2 * k};
    }
    case 'T3': {
      const k = sm5(u(S.T3, S.T4));
      return lookAt(lerp3(v3(80, 96, -78), v3(70, 98, -88), k), v3(10, 172, 0), 980);
    }
    case 'T4': {
      const k = sm5(u(S.T4, S.R1));
      return lookAt(lerp3(v3(-30, 80, -235), v3(-40, 82, -248), k), v3(8, 160, 0), 1180);
    }
    case 'R3': {
      // starts with the rod tip where R2 left the house rod's tip, then tilts up the channel and widens
      const k = sm5(u(S.R3 + 0.15, S.E1));
      const c0 = lookAtScreen(v3(-26, 118, -44), TIP3, 2600, 540, 820);
      const c1 = lookAt(v3(-26, 118, -44), axis3(170), 1250);
      return lerpCam(c0, c1, k);
    }
    case 'E1': {
      const k = sm5(u(S.E1, S.E2));
      const tb = add3(EXIT3, v3(-1.4, -4.4, 0));
      return lookAt(add3(tb, v3(-2.4 - 0.4 * k, -0.4 + 1.0 * k, -3.6)), along(60 + 120 * k), 520);
    }
    default:
      return hookCam(t);
  }
};
/** a camera at pos that puts `target` at screen point (sx, sy) */
const lookAtScreen = (pos: V3, target: V3, f: number, sx: number, sy: number): Cam3 => {
  let c = lookAt(pos, target, f);
  // small fixed-point correction on yaw/pitch
  for (let i = 0; i < 6; i++) {
    const p = projector(c)(target);
    c = {...c, yaw: c.yaw - ((sx - p.x) / f) * (180 / Math.PI), pitch: c.pitch + ((sy - p.y) / f) * (180 / Math.PI)};
  }
  return c;
};

/** the followed pulse (site px along the axis): leaves the exit at 9.8 s, climbs at 420 px/s, slows to a stop-like
 *  crawl at P0 (h = 150) as the zoom into it finishes at 11.42 */
export const hFollow = (t: number) => {
  const a = 10.95, b = S.M2;
  const h0 = -880, v0 = 520;
  const ha = h0 + v0 * (a - 9.8);
  if (t < a) return h0 + v0 * (t - 9.8);
  const d = b - a, u = Math.min(1, (t - a) / d);
  const vEnd = 25;
  return ha + v0 * d * u + ((vEnd - v0) * d * u * u) / 2;
};

export const state3For = (id: ShotId, t: number): St3 => {
  switch (id) {
    case 'H1': case 'H2': case 'H3': case 'E2': return loopState(t);
    case 'F3': return {...quietState(t, 0.4), pulses: stream(t, 460, 300)};
    case 'F4': {
      const hf = hFollow(t);
      return {...quietState(t, 0.55), pulses: [-3, -2, -1, 1, 2].map((k) => hf + k * 300)};
    }
    case 'M6': case 'T1': case 'T2': case 'T3': case 'T4': return demoState(t);
    case 'R3': return {...quietState(t, 0.85), channelTop: -6 + (G + 120) * ss(t, S.R3 + 0.25, S.E1 - 0.1)};
    case 'E1': return {...quietState(t, 0.9), pulses: stream(t, 520, 200), tipCorona: 0.3};
    default: return quietState(t);
  }
};

/** a bracket beside the guided section (3D), with its label */
const Bracket3D: React.FC<{cam: Cam3; k: number; label: number}> = ({cam, k, label}) => {
  if (k <= 0) return null;
  const P = projector(cam);
  const off = (h: number, o: number) => add3(axis3(h), v3(o * 0.951, -o * 0.309, 0));
  const a = P(off(0, 7)), b = P(off(G * k, 7));
  const ta = [P(off(0, 4.5)), P(off(0, 9.5))], tb = [P(off(G, 4.5)), P(off(G, 9.5))];
  const m = P(off(G / 2, 15));
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0B151C" strokeOpacity={0.6} strokeWidth={9} strokeLinecap="round" />
      <g stroke="#FFE27A" strokeWidth={5} strokeLinecap="round">
        <line x1={ta[0].x} y1={ta[0].y} x2={ta[1].x} y2={ta[1].y} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        {k >= 1 && <line x1={tb[0].x} y1={tb[0].y} x2={tb[1].x} y2={tb[1].y} />}
      </g>
      {label > 0 && (
        <text x={m.x} y={m.y} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={58} fill="#FFE27A" stroke="#0B151C" strokeWidth={10} paintOrder="stroke" opacity={label} dominantBaseline="middle">
          160+ ft
        </text>
      )}
    </g>
  );
};

export const View3D: React.FC<{id: ShotId; t: number; tag: string; camOverride?: Cam3; stOverride?: St3; noApparatus?: boolean}> = ({id, t, tag, camOverride, stOverride, noApparatus}) => {
  const cam = camOverride ?? cam3For(id, t);
  const st = stOverride ?? state3For(id, t);
  const top = st.s > 0 ? BOLT3.pts[Math.max(0, BOLT3.pts.findIndex((p) => p.s >= Math.min(st.s, BOLT3.total)))] : undefined;
  const drift = tau2(t);
  // painter's order between the apparatus and the tower: whichever is farther from the camera first
  const apFirst = len3(sub3(EXIT3, cam.pos)) > len3(sub3(v3(0, 60, 0), cam.pos));
  return (
    <g>
      <Sky3D cam={cam} flash={st.flash} boltTop={top} drift={drift} rainT={drift + 40} />
      {apFirst && !noApparatus && <Apparatus3D cam={cam} flash={st.flash} fire={st.fire} id={`${tag}-ap`} />}
      <Tower3D cam={cam} flash={st.flash} aviation={0.5 + 0.5 * Math.sin(drift * 3.4)} id={`${tag}-tw`} />
      {!apFirst && !noApparatus && <Apparatus3D cam={cam} flash={st.flash} fire={st.fire} id={`${tag}-ap`} />}
      <Beam3D cam={cam} alpha={st.beam} pulses={st.pulses} channel={st.channel} channelTop={st.channelTop} id={`${tag}-bm`} />
      <TipCorona cam={cam} k={st.tipCorona} t={t} />
      <Discharge3D cam={cam} s={st.s} core={st.core} id={`${tag}-dc`} />
      <Bracket3D cam={cam} k={st.bracket ?? 0} label={st.label ?? 0} />
      {top && <FlashWash cam={cam} at={top} flash={st.flash} id={`${tag}-fw`} />}
    </g>
  );
};

/** corona at the rod tip before a leader incepts: short violet sparks that flicker in and out */
const TipCorona: React.FC<{cam: Cam3; k: number; t: number}> = ({cam, k, t}) => {
  if (k <= 0.02) return null;
  const P = projector(cam);
  const tip = P(TIP3);
  if (!tip.ok) return null;
  const sc = clamp((cam.f * 1.0) / tip.z, 2, 90);
  const sparks = Array.from({length: 7}, (_, i) => {
    const on = Math.sin(t * (31 + i * 7) + i * 2.1) > 0.2;
    if (!on) return null;
    const a = -90 + (i - 3) * 24 + 10 * Math.sin(t * 17 + i);
    const L = sc * (0.8 + 0.6 * Math.abs(Math.sin(t * 13 + i * 3)));
    const r = (a * Math.PI) / 180;
    const mx = tip.x + Math.cos(r) * L * 0.5 + Math.sin(t * 40 + i) * sc * 0.15, my = tip.y + Math.sin(r) * L * 0.5;
    return `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${mx.toFixed(1)},${my.toFixed(1)} L${(tip.x + Math.cos(r) * L).toFixed(1)},${(tip.y + Math.sin(r) * L).toFixed(1)}`;
  }).filter(Boolean) as string[];
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={k}>
      <circle cx={tip.x} cy={tip.y} r={sc * 1.4} fill="#B7A6FF" opacity={0.25} />
      <path d={sparks.join(' ')} fill="none" stroke="#E6E0FF" strokeWidth={Math.max(1.4, sc * 0.08)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
export {EXIT_H};
