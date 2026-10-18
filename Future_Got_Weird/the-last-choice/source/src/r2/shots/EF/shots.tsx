// E — he dies; F — radio to city. Four shots, film seconds:
//   E1        186.90–191.40  close, low: he sits against the slab; the drone pilot crawls the last half-metre, kneels at
//                            his left and takes his hand; his eyes find her for a moment (the radio on the van floor
//                            behind her: off, a faint standby light)
//   E1_clasp  191.40–193.10  insert (ClaspCU): his grip loosening in her hands; her answering squeeze
//   E2        193.10–198.30  extreme close on his face: the last small breath (195.0), the eyes close (196.6), stillness
//   F1        198.30–231.60  one physical move from E2's own framing (no visible cut): off his still face to the
//                            unattended radio (nobody touches it): its dial light flutters with the static (199.0), the
//                            reception recovers and the song catches (199.6) → the rising pullback over the pair, the
//                            held Crew, the ring, the crater and the avenue to the burning skyline; fade to black
import React from 'react';
import {AbsoluteFill, getInputProps} from 'remotion';
import {V3, add3, sub3, mul3, norm3, dot3, smooth, clamp, lerp, noise} from '../../../kit/math';
import {Item, View, PointLight, Cam3, project} from '../../engine';
import {Stage, useShotTime} from '../../film/stage';
import {persistItems} from '../../film/continuity';
import {RADIO, polyline3} from '../../world';
import {radioMesh, radioFn} from '../../world/props';
import type {AtmosOpts} from '../../world';
import {ClaspCU, dmgR2} from '../../rig';
import {M} from '../../timing';
import {camE1, camF1, fadeF1, MOVE} from './camera';
import {directorSpec, pilotSpec, clasped, othersItems, DIR_HEAD, DIR_CHEST, pilotAnchor} from './crew';
import {tableauMachineItems} from './machines';

/** (QA only) a diagnostic camera from the render's input props: {efCam: {pos, target, fov}} replaces the shot's. */
const diagCam = (): Cam3 | null => {
  try { const p = getInputProps() as {efCam?: Cam3}; return p.efCam ?? null; } catch { return null; }
};

/** A slow handheld drift (m) — breathing life, not shake. */
const drift = (T: number, amp: number): V3 => {
  const n = (x: number, s: number) => Math.sin(x * 0.93 + s) * 0.55 + Math.sin(x * 1.87 + s * 1.7) * 0.3 + Math.sin(x * 3.3 + s * 0.6) * 0.15;
  return {x: n(T, 2) * amp, y: n(T, 6) * amp * 0.6, z: n(T, 10) * amp};
};
const withDrift = (c: ReturnType<typeof camE1>, T: number, amp: number) => {
  const d = drift(T, amp);
  return {...c, pos: add3(c.pos, d), target: add3(c.target, mul3(d, 1.25))};
};
const others = (v: View, T: number): Item[] => [...persistItems(v, T, {exceptSec: 'EF', lod: {full: 30, mid: 120}}), ...tableauMachineItems(v, T, {near: true})];

// ------------------------------------------------------------------ the radio (nobody touches it)
/**
 * Its light, 0 … 1: a faint standby glow until the reception comes back — at RADIO_FLUTTER (with the global static
 * crackles at +0 and +0.38) the dial light stutters, catches, drops, catches again; the song catches at L_START and the
 * dial warms up to a steady glow. Seeded flicker: no two dips alike.
 */
export const RADIO_STANDBY = 0.16;
export const radioLight = (T: number): number => {
  const a = M.RADIO_FLUTTER, b = M.L_START;
  if (T < a) return 0;
  if (T >= b) return clamp(0.62 + 0.38 * smooth((T - b) / 0.45)) * (1 - 0.05 * noise(T * 9, 3) * (1 - smooth((T - b) / 1.2)));
  // the stutter: short catches at the crackles, darker gaps between them, getting surer toward the song
  const u = T - a;
  const pulse = (t0: number, d: number, h: number) => (u > t0 && u < t0 + d ? h * Math.sin((Math.PI * (u - t0)) / d) : 0);
  const v = Math.max(pulse(0.0, 0.07, 0.75), pulse(0.1, 0.05, 0.4), pulse(0.19, 0.1, 0.62), pulse(0.38, 0.06, 0.85), pulse(0.47, 0.08, 0.55), pulse(0.53, 0.07, 0.8));
  return Math.max(v, 0.06);
};
/** The needle on the dial: a twitch with the static, then it settles a hair further along (the station locked). */
const needleX = (T: number) => {
  const a = M.RADIO_FLUTTER;
  const u = T - a;
  const tw = u > 0 && u < 0.6 ? 0.0035 * (noise(T * 31, 5) * 0.7 + Math.sin(u * 47) * 0.3) * (1 - smooth((u - 0.45) / 0.15)) : 0;
  return 0.052 + 0.002 * smooth((T - (M.L_START - 0.05)) / 0.3) + tw;
};
/** Radio-local point → world. The front face is local −z (fz). */
const FZ = -0.11 / 2 - 0.0055;
const RL = (x: number, y: number, z = FZ) => radioFn({x, y, z});
const FRONT_N = (() => norm3(sub3(RL(0, 0, -1), RL(0, 0, 0))))();
const DIAL = {x0: 0.03, x1: 0.145, y0: 0.12, y1: 0.17};
/** the standby light: a small pilot lamp at the dial window's upper right (above the van's door sill in E1) */
const LED = RL(0.158, 0.183);

const radioItems = (T: number): Item[] => {
  const L = radioLight(T);
  const items: Item[] = [
    {kind: 'mesh', mesh: radioMesh(false), key: 'radio', fn: radioFn, noCull: true, asObject: true, bias: 0.05},
    polyline3('radioAnt', [RADIO.antennaBase, RADIO.antennaTip], 0.006, '#B8B2AA', {minPx: 0.8, ink: '#162A32', inkW: 1.0}),
  ];
  // the dial window, the needle, the standby lamp, a small warm bloom on the dial only (never a halo round the set)
  items.push({
    kind: 'sprite', key: 'ef_dial', pos: RADIO.dial, bias: 0.12,
    draw: (c) => {
      const toCam = norm3(sub3(c.view.pos, RADIO.dial));
      if (dot3(toCam, FRONT_N) < 0.05) return null;
      const P = (x: number, y: number) => project(c.view, RL(x, y, FZ - 0.0015));
      const q = [P(DIAL.x0, DIAL.y0), P(DIAL.x1, DIAL.y0), P(DIAL.x1, DIAL.y1), P(DIAL.x0, DIAL.y1)];
      const w = Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y);
      const led = project(c.view, LED);
      const ledR = Math.max(0.9, 0.0045 * led.k);
      const ledOn = T < M.RADIO_FLUTTER ? 1 : clamp(1 - L * 1.4); // the standby lamp hands over to the dial light
      const out: React.ReactNode[] = [];
      if (L > 0) {
        const fill = L > 0.5 ? '#FFD27A' : L > 0.2 ? '#C9935A' : '#7A5E44';
        out.push(<path key="dw" d={`M ${q.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} Z`} fill={fill} opacity={0.55 + 0.45 * L} />);
        // the needle (it hides the set's own, painted, needle under the lit window)
        const nx = needleX(T);
        const n0 = P(nx, DIAL.y0 + 0.005), n1 = P(nx, DIAL.y1 - 0.005);
        out.push(<line key="nd" x1={n0.x} y1={n0.y} x2={n1.x} y2={n1.y} stroke="#3A2723" strokeWidth={Math.max(0.7, w * 0.035)} strokeLinecap="round" />);
        // bloom: on the dial, its own size
        const cx = (q[0].x + q[2].x) / 2, cy = (q[0].y + q[2].y) / 2;
        out.push(<ellipse key="bl" cx={cx} cy={cy} rx={Math.max(2.2, w * 0.75)} ry={Math.max(1.6, w * 0.45)} fill="#FFC36A" opacity={0.22 * L} />);
      }
      if (ledOn > 0.01) {
        out.push(<circle key="led" cx={led.x} cy={led.y} r={ledR} fill="#FF8A4A" opacity={RADIO_STANDBY * 3.6 * ledOn} />);
        out.push(<circle key="ledh" cx={led.x} cy={led.y} r={ledR * 2.4} fill="#FF8A4A" opacity={RADIO_STANDBY * 0.7 * ledOn} />);
      }
      return <g>{out}</g>;
    },
  });
  return items;
};
/** The dial's warm spill on the van floor and her shoulder (the indicator's own light, small radius). */
const radioLights = (T: number): PointLight[] => {
  const L = radioLight(T);
  return L > 0.02 ? [{pos: add3(RADIO.dial, mul3(FRONT_N, 0.05)), color: '#FFC36A', power: 0.32 * L, radius: 1.1, flicker: 0.03}] : [];
};
/** From far away the lit dial keeps a few warm pixels so the radio stays findable beside him (never a big halo). */
const radioBeacon = (T: number): Item => ({
  kind: 'sprite', key: 'ef_radioBeacon', pos: RADIO.dial, bias: 0.13,
  draw: (c) => {
    const L = radioLight(T);
    const px = 0.115 * c.k; // the dial's width on screen
    if (L <= 0 || px > 10) return null;
    const k = 1 - smooth((px - 4) / 6);
    return <circle cx={c.x} cy={c.y} r={1.8 + 0.6 * k} fill="#FFC36A" opacity={0.5 * L * k} />;
  },
});

// ------------------------------------------------------------------ E1
const E1: React.FC = () => {
  const {T} = useShotTime(M.FINAL_HIT);
  const cam = diagCam() ?? withDrift(camE1(T), T, 0.01);
  // perspective anchors at their chests (a close two-shot: the rig's single scale is taken where the faces and hands are)
  const pil = pilotSpec(T);
  const pilChest = {x: pil.pos.x, y: pil.pos.y + 0.62, z: pil.pos.z};
  return <Stage T={T} cam={cam} set={{skip: ['radio']}} items={(v) => [...others(v, T), ...othersItems(T), ...radioItems(T), clasped(directorSpec(T, DIR_CHEST), {...pil, anchor: pilChest})]} />;
};

// ------------------------------------------------------------------ E1_clasp (insert)
const CLASP_IN = 191.4;
const E1Clasp: React.FC = () => {
  const {t, T} = useShotTime(CLASP_IN);
  // his grip goes (0.3 → 1.25 s), the wrist goes heavy; her squeeze answers twice (as she feels it go, and again)
  const grip = 1 - smooth((t - 0.3) / 0.95);
  const sag = smooth((t - 0.85) / 0.75);
  const squeeze = 0.35 * smooth(t / 0.3) + 0.65 * smooth((t - 0.95) / 0.45);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ClaspCU grip={grip} sag={sag} squeeze={squeeze} t={T} pale={dmgR2('director', T).pale ?? 0.6} warm={0.42} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ E2 (and F1: one camera, one scene)
// E2 and F1 render the same scene through the same camera (camF1 → camClose before the rise), so the cut between them
// (F1_IN = MOVE.a, 198.30) is invisible: F1's first frame is E2's still face, and the move off it starts there.
const E2: React.FC = () => {
  const {T} = useShotTime(M.RING_END);
  return <Aftermath T={T} />;
};

// ------------------------------------------------------------------ F1
/**
 * F1's atmosphere: the default fire smoke (ATMOS plumes) with the plumes the crane rises through or past thinned
 * (`fireSmoke`): the west ruin's and the ridge's fires burn under the camera's path and their plumes drift north-east
 * across the line to him; they thin as the camera climbs so it never flies into an opaque plume and he never vanishes
 * behind one. The street haze (made for ground-level views) fades with height.
 */
const NEAR_PATH: Record<string, number> = {ruinW1: 0.55, ruinW2: 0.22, ruinW3: 0.3, ridgeN: 0.5, ridgeS: 0.35, spillE: 0.6, wreck0: 0.6, w2_room: 0.5};
const f1Atmos = (camY: number): AtmosOpts => {
  const up = smooth((camY - 4) / 16);
  return {
    smoke: 1,
    fireSmoke: (id) => (id in NEAR_PATH ? 1 - (1 - NEAR_PATH[id]) * up : 1),
    haze: 1 - 0.7 * smooth((camY - 6) / 22),
  };
};
const F1: React.FC = () => {
  const {T} = useShotTime(MOVE.a);
  return <Aftermath T={T} />;
};
const Aftermath: React.FC<{T: number}> = ({T}) => {
  const cam = diagCam() ?? camF1(T);
  return (
    <Stage T={T} cam={cam} set={{skip: ['radio']}} atmos={f1Atmos(cam.pos.y)} lights={radioLights(T)} black={fadeF1(T)}
      items={(v) => [
        ...persistItems(v, T, {exceptSec: 'EF', lod: {full: 30, mid: 140}}),
        ...tableauMachineItems(v, T, {near: v.pos.y < 3}),
        ...othersItems(T),
        // the two of them as one sprite (her hand holds his to the end): he sits against the slab — seen from above
        // the slab's faces sort nearer than his seat, so the pair is biased in front of it (and of the van's long
        // lower side panel beside her); never culled by its anchor (his seat is far below the frame in the close-up)
        clasped(directorSpec(T, DIR_HEAD), pilotSpec(T, pilotAnchor(T)), 'under', {bias: 0.8, noCull: true}),
        ...radioItems(T),
        radioBeacon(T),
      ]} />
  );
};
void lerp;

export const EF_SHOTS = {E1, E1Clasp, E2, F1, CLASP_IN, F1_IN: MOVE.a};
