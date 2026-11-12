// V5: THE backpack model for every V5 shot (one design): V2's backpack with the circuit board moved beside the
// grasping tab (V2's board overlapped the tab: they intersected) and a fixed stacking for everything mounted on the
// plate (V2 sorted the board, chip and traces by their centres against the plate's centre, so from some angles the plate
// covered the board and it popped back when the camera moved). No battery animation in V5.
// V2 backpack, redrawn from the paper's description (Lin et al., Nat Commun 16:6073, 2025, Fig. 1B): a WHITE MOUNTING
// STRUCTURE carrying a small microcontroller board (Sub-1GHz radio), a GRASPING SECTION (a raised tab the robot's gripper
// holds), an ALIGNMENT HOLE, MOUNTING BRANCHES that hook the metathorax, and a pair of BIPOLAR ELECTRODES implanted into
// the intersegmental membrane between pronotum and mesothorax. The LiPo battery is plugged in AFTER assembly (taped to
// the backpack), so `batt` grows from 0 to 1 once the insect is released. Status LED is cyan (V2 palette).
// Frame: x forward, y left, z up (mm); origin at the middle of the mount's underside; seated = body frame at PACK_SEAT.
import React from 'react';
import {Basis, lerp3, P2, proj, V3} from '../core/three';
import {capsuleItem, Item} from '../core/draw3';
import {obbItem} from '../core/obb';
import {lit, mix, rgba} from '../core/color';
import {INK} from '../core/ink';
import {Frame, toW} from '../core/frame';

export const MOUNT = '#E9EEF1';
export const PCB2 = '#16806E';
export const TRACE2 = '#7FE7D8';
export const CHIP2 = '#1A2028';
export const BATT2 = '#B8C4CF';
export const WIRE2 = '#D7DDE2';
export const CYAN = '#5CF2FF';
export const STIM = '#FF8A3D'; // stimulation accent (used only at the electrode tips during a pulse)

const f2 = (n: number) => n.toFixed(2);

export type Pack2 = {
  F: Frame;
  led: number; // 0..1 cyan status LED
  hook: number; // 0 flared .. 1 latched
  batt?: number; // 0..1 battery plugged in
  pulse?: {t: number; side: 1 | -1}; // 0..1 travel down one electrode; >1 = stimulation flash at the tip
  camera?: boolean; // field (first-generation) unit with a thermal camera module
  xray?: number; // 0..1 highlight the electrode tips (used with a translucent pronotum)
};

const ELEC = (s: number): V3[] => [[3.4, 2.2 * s, 0.0], [5.4, 2.2 * s, -0.5], [6.9, 2.1 * s, -2.3], [7.6, 2.1 * s, -3.7]];
const HOOKP = (s: number, hook: number): V3[] => {
  const fl = 1 - hook;
  return [[-5.4, 6.2 * s, 0.1], [-5.6, (10.8 + 1.8 * fl) * s, -1.0], [-5.7, (13.5 + 2.6 * fl) * s, -3.4 + 1.2 * fl], [-5.4, (13.0 + 3.4 * fl) * s, -5.6 + 2.2 * fl]];
};
export const elecPts = (P: Pack2, s: 1 | -1) => ELEC(s).map((p) => toW(P.F, p));
export const packPt2 = (P: Pack2, p: V3) => toW(P.F, p);
export const PTS2 = {chip: [1.0, 2.2, 1.9] as V3, batt: [-3.2, -2.6, 2.6] as V3, led: [3.9, -4.6, 1.5] as V3, tab: [-1.0, 0, 5.0] as V3, hook: [-5.7, 13.4, -3.0] as V3, mount: [0, 0, 0.6] as V3};

export const packParts5 = (B: Basis, P: Pack2, key = 'p5'): {main: Item[]; elec: Item[]} => {
  const F = P.F;
  const W = (p: V3) => toW(F, p);
  const O = (p: V3): Frame => ({...F, o: W(p)});
  const main: Item[] = [];
  const elec: Item[] = [];
  const s0 = proj(B, W([0, 0, 1])).s;
  // white mounting structure: base plate with a raised grasping tab
  main.push(obbItem(B, O([0, 0, 0.55]), [6.3, 7.3, 0.55], MOUNT, {key: `${key}m`, top: lit(MOUNT, 0.2)}));
  main.push(obbItem(B, O([-1.0, 0, 3.0]), [1.2, 4.6, 1.9], MOUNT, {key: `${key}tab`, top: lit(MOUNT, 0.25)}));
  // alignment hole (dark ellipse on the plate)
  const ah = proj(B, W([-4.6, -4.8, 1.12]));
  main.push({z: ah.z - 0.02, el: <circle key={`${key}ah`} cx={f2(ah.x)} cy={f2(ah.y)} r={f2(Math.max(0.8, 0.75 * s0))} fill="#2B3540" opacity={0.85} />});
  // microcontroller board with traces and chip
  main.push(obbItem(B, O([3.0, 2.1, 1.35]), [2.8, 3.5, 0.25], PCB2, {key: `${key}pcb`}));
  const tr: V3[][] = [[[0.6, 4.8, 1.62], [5.2, 4.8, 1.62]], [[0.6, -0.6, 1.62], [5.2, -0.6, 1.62]], [[5.3, 0.0, 1.62], [5.3, 4.4, 1.62]]];
  main.push({z: proj(B, W([3, 2, 1.7])).z - 0.03, el: <g key={`${key}tr`}>{tr.map((q, i) => <path key={i} d={`M${q.map((p) => P2(proj(B, W(p)))).join(' L')}`} stroke={TRACE2} strokeWidth={f2(Math.max(0.6, 0.25 * s0))} strokeLinecap="round" opacity={0.75} fill="none" />)}</g>});
  main.push(obbItem(B, O([3.0, 2.2, 1.95]), [1.6, 1.6, 0.35], CHIP2, {key: `${key}ch`}));
  // battery (plugged in after assembly)
  const bt = 0; // V5: no battery animation
  if (bt > 0.02) main.push(obbItem(B, O([-3.2, -2.6, 1.1 + 1.3 * bt]), [2.6 * (0.6 + 0.4 * bt), 2.9 * (0.6 + 0.4 * bt), 1.0 * bt], BATT2, {key: `${key}bt`, top: lit(BATT2, 0.3), opacity: Math.min(1, bt * 1.6)}));
  // status LED (cyan) with glow
  const lc = W([3.9, -4.6, 1.35]);
  const lp = proj(B, lc);
  main.push({
    z: lp.z - 0.05,
    el: (
      <g key={`${key}led`}>
        {P.led > 0.02 && <circle cx={f2(lp.x)} cy={f2(lp.y)} r={f2(lp.s * 4.8)} fill={rgba(CYAN, 0.3 * P.led)} style={{filter: `blur(${f2(lp.s * 1.4)}px)`}} />}
        {obbItem(B, {...F, o: lc}, [0.8, 0.55, 0.4], mix('#25414A', CYAN, P.led), {key: `${key}ledb`}).el}
        {P.led > 0.02 && <circle cx={f2(lp.x)} cy={f2(lp.y - lp.s * 0.2)} r={f2(lp.s * 0.6)} fill="#FFFFFF" opacity={0.9 * P.led} />}
      </g>
    ),
  });
  // antenna wire (radio)
  const ant: V3[] = [[-5.0, 5.6, 1.1], [-5.6, 5.8, 4.0], [-8.6, 6.0, 5.6], [-13.0, 6.2, 6.2]];
  for (let i = 0; i < ant.length - 1; i++) main.push(capsuleItem(B, W(ant[i]), W(ant[i + 1]), 0.3, 0.28, '#2B3138', {key: `${key}an${i}`, spec: 0.5}));
  // mounting branches (white) and electrodes (silver)
  ([1, -1] as const).forEach((s) => {
    const h = HOOKP(s, P.hook);
    for (let i = 0; i < h.length - 1; i++) main.push(capsuleItem(B, W(h[i]), W(h[i + 1]), 0.55, 0.45, '#DCE3E8', {key: `${key}h${s}${i}`, spec: 0.6}));
    const e = ELEC(s);
    for (let i = 0; i < e.length - 1; i++) elec.push(capsuleItem(B, W(e[i]), W(e[i + 1]), 0.32, 0.22, WIRE2, {key: `${key}e${s}${i}`, spec: 0.8}));
    if ((P.xray ?? 0) > 0.02) {
      const tip = proj(B, W(e[e.length - 1]));
      elec.push({z: tip.z - 2, el: <circle key={`${key}xt${s}`} cx={f2(tip.x)} cy={f2(tip.y)} r={f2(tip.s * 1.4)} fill="none" stroke={CYAN} strokeWidth={f2(tip.s * 0.35)} opacity={0.8 * (P.xray ?? 0)} />});
    }
  });
  // a pulse travelling down one electrode, then a short orange stimulation flash at the tip
  if (P.pulse && P.pulse.t > 0 && P.pulse.t < 1.35) {
    const e = ELEC(P.pulse.side).map(W);
    const u = Math.min(1, P.pulse.t);
    const seg = u * (e.length - 1);
    const k = Math.min(e.length - 2, Math.floor(seg));
    const p = lerp3(e[k], e[k + 1], seg - k);
    const q = proj(B, p);
    const tip = proj(B, e[e.length - 1]);
    const fl = P.pulse.t > 1 ? Math.sin(Math.PI * Math.min(1, (P.pulse.t - 1) / 0.35)) : 0;
    elec.push({
      z: q.z - 3,
      el: (
        <g key={`${key}pz`}>
          {P.pulse.t <= 1.02 && <path d={`M${e.slice(0, k + 1).map((w) => P2(proj(B, w))).join(' L')} L${P2(q)}`} fill="none" stroke={CYAN} strokeWidth={f2(q.s * 0.7)} strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${f2(q.s * 1.4)}px ${CYAN})`}} />}
          {P.pulse.t <= 1.02 && <circle cx={f2(q.x)} cy={f2(q.y)} r={f2(q.s * 1.1)} fill="#FFFFFF" style={{filter: `drop-shadow(0 0 ${f2(q.s * 2)}px ${CYAN})`}} />}
          {fl > 0 && <circle cx={f2(tip.x)} cy={f2(tip.y)} r={f2(tip.s * (1.2 + 3.2 * fl))} fill={rgba(STIM, 0.35 * fl)} stroke={STIM} strokeWidth={f2(tip.s * 0.45)} opacity={fl} />}
        </g>
      ),
    });
  }
  if (P.camera) {
    main.push(obbItem(B, O([4.6, 1.6, 2.4]), [1.6, 1.7, 1.0], '#1A1F25', {key: `${key}cm`}));
    const cl = proj(B, W([6.3, 1.6, 2.5]));
    main.push({z: cl.z - 0.1, el: <circle key={`${key}cl`} cx={f2(cl.x)} cy={f2(cl.y)} r={f2(cl.s * 0.75)} fill="#C2452F" stroke={INK} strokeWidth={f2(Math.max(0.6, cl.s * 0.15))} />});
  }
  // fixed stacking: when the plate's top faces the camera, everything mounted on it is drawn after the plate (keeping
  // its own depth order among themselves); the branches and antenna wire keep their own depths
  const plate = main.find((m) => (m.el as React.ReactElement).key === `${key}m`)!;
  const top = W([0, 0, 1.1]);
  const above = (B.eye[0] - top[0]) * F.u[0] + (B.eye[1] - top[1]) * F.u[1] + (B.eye[2] - top[2]) * F.u[2] > 0;
  if (above) {
    const ON = ['ah', 'pcb', 'tr', 'ch', 'led', 'tab', 'cm', 'cl'].map((k) => `${key}${k}`);
    const on = main.filter((m) => ON.includes(String((m.el as React.ReactElement).key)));
    const zs = on.map((m) => m.z);
    const zmin = Math.min(...zs), zmax = Math.max(...zs);
    on.forEach((m) => { m.z = plate.z - 0.01 - (0.005 * (zmax - m.z)) / (zmax - zmin || 1); });
  }
  return {main, elec};
};
