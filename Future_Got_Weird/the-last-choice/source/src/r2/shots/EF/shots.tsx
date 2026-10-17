// E — he dies; F — radio to city. Four shots, film seconds:
//   E1        186.90–191.40  close, low: he sits against the slab; the drone pilot crawls the last half-metre, kneels at
//                            his left and takes his hand; his eyes find her for a moment
//   E1_clasp  191.40–193.10  insert (ClaspCU): his grip loosening in her hands; her answering squeeze
//   E2        193.10–199.30  extreme close on his face: the last small breath (195.0), the eyes close (196.6), stillness
//   F1        199.30–230.40  one physical move: his still face → a short pan to the radio as her hand turns the knob
//                            (click 199.9) → the rising pullback over the companions, the ring, the crater and the avenue
//                            to the burning skyline; fade to black for the credits
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {V3, add3, mul3, smooth, clamp} from '../../../kit/math';
import {Item, View, PointLight} from '../../engine';
import {Stage, useShotTime} from '../../film/stage';
import {persistItems} from '../../film/continuity';
import {RADIO, polyline3, FIRES} from '../../world';
import type {AtmosOpts} from '../../world';
import {figureSprite, ClaspCU, dmgR2} from '../../rig';
import {M} from '../../timing';
import {camE1, camE2, camF1, fadeF1, FACE} from './camera';
import {directorSpec, pilotSpec, clasped, othersItems, KNOB, knobAngle, DIR_HEAD, DIR_CHEST} from './crew';
import {tableauMachineItems} from './machines';

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

// ------------------------------------------------------------------ E1
const E1: React.FC = () => {
  const {T} = useShotTime(M.FINAL_HIT);
  const cam = withDrift(camE1(T), T, 0.01);
  // perspective anchors at their chests (a close two-shot: the rig's single scale is taken where the faces and hands are)
  const pil = pilotSpec(T);
  const pilChest = {x: pil.pos.x, y: pil.pos.y + 0.62, z: pil.pos.z};
  return <Stage T={T} cam={cam} items={(v) => [...others(v, T), ...othersItems(T), clasped(directorSpec(T, DIR_CHEST), {...pil, anchor: pilChest})]} />;
};

// ------------------------------------------------------------------ E1_clasp (insert)
const CLASP_IN = 191.4;
const E1Clasp: React.FC = () => {
  const {t, T} = useShotTime(CLASP_IN);
  const grip = 1 - smooth((t - 0.3) / 0.95);
  const sag = smooth((t - 0.85) / 0.75);
  const squeeze = 0.35 * smooth(t / 0.3) + 0.65 * smooth((t - 0.95) / 0.45);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ClaspCU grip={grip} sag={sag} squeeze={squeeze} t={T} pale={dmgR2('director', T).pale ?? 0.6} warm={0.42} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ E2
const E2: React.FC = () => {
  const {T} = useShotTime(M.RING_END);
  // the drift dies away as he does: still after the eyes close
  const amp = 0.004 * (1 - smooth((T - M.EYES_CLOSE) / 1.2)) + 0.0012;
  const cam = withDrift(camE2(T), T, amp);
  // the sprite is anchored at his head: in an extreme close-up his seat projects far below the frame (the scene culls
  // sprites whose anchor is more than a frame off screen)
  return <Stage T={T} cam={cam} items={() => [{...figureSprite(directorSpec(T, DIR_HEAD)), pos: FACE}]} />;
};

// ------------------------------------------------------------------ F1
/** The dial light: off, then on at the click with a little catch (a radio warming). */
export const dialOn = (T: number) => (T < M.RADIO_CLICK ? 0 : T < M.RADIO_CLICK + 0.04 ? 0.7 : T < M.RADIO_CLICK + 0.09 ? 0.35 : clamp(0.55 + 0.45 * smooth((T - M.RADIO_CLICK - 0.09) / 0.35)));
/** The lit dial as a small warm halo that keeps a few pixels from far away: the radio stays findable beside him. */
const radioBeacon = (on: number): Item => ({
  kind: 'sprite', key: 'ef_radioBeacon', pos: RADIO.dial, bias: 0.12,
  draw: (c) => {
    const r = Math.max(3.2, 0.2 * c.k);
    const a = on * Math.min(0.42, 0.12 + 5 / Math.max(10, r * 4));
    return <circle cx={c.x} cy={c.y} r={r} fill="#FFC36A" opacity={a} />;
  },
});
/** The knob's pointer mark (it turns with her fingers). */
const knobMark = (T: number): Item => {
  const a = (knobAngle(T) * Math.PI) / 180;
  const c = add3(KNOB.c, mul3(KNOB.n, 0.003));
  const tip = add3(c, add3(mul3(KNOB.ax, Math.cos(a) * KNOB.r * 0.85), mul3(KNOB.ay, Math.sin(a) * KNOB.r * 0.85)));
  return polyline3('ef_knobMark', [c, tip], 0.0035, '#EDE6D6', {minPx: 0.8, bias: 0.12});
};

/**
 * F1's atmosphere: the default fire smoke (same look, constant puff counts so nothing pops while the crane climbs),
 * with the columns nearest him thinning as the camera rises (they drift over the van on the wind and would bury him
 * in the high wide), and the ground haze — flat ellipses made for ground-level views — fading out with height.
 */
const NEAR_HIM = new Set(['ridgeN', 'ridgeS', 'spillE', 'ruinW1', 'ruinW2', 'ruinW3']);
const f1Atmos = (T: number, camY: number): AtmosOpts => {
  const up = smooth((camY - 6) / 22);
  return {
    smoke: 0,
    haze: 1 - 0.85 * up,
    columns: FIRES.filter((f) => f.smoke).map((f) => {
      const big = f.size > 8;
      const k = (NEAR_HIM.has(f.id) ? 1 - 0.8 * up : 1) * (big ? 1 : 0.82);
      return {key: `ef_sm_${f.id}`, base: {x: f.pos.x, y: f.pos.y + f.size * 0.8, z: f.pos.z}, o: {
        n: big ? 9 : 6, life: big ? 26 : 10 + (f.smoke ?? 0) * 3, rise: big ? 6 : 1.6 + (f.smoke ?? 0) * 0.8, r0: big ? Math.min(10, f.size * 0.5) : 0.6 + (f.smoke ?? 0) * 0.5,
        r1: big ? Math.min(42, f.size * 1.8) : 3 + (f.smoke ?? 0) * 4.5, drift: big ? 2.6 : 1.1, dark: 0.55 + (f.heat ?? 0) * 0.1, alpha: (big ? 0.78 : 0.62) * k, warm: 0.45, seed: f.seed,
      }};
    }),
  };
};
const pilotChest = (T: number) => { const p = pilotSpec(T); return {x: p.pos.x, y: p.pos.y + 0.6, z: p.pos.z}; };
const F1: React.FC = () => {
  const {T} = useShotTime(M.RADIO_CLICK - 0.6);
  const cam = camF1(T);
  const on = dialOn(T);
  const lights: PointLight[] = on > 0 ? [{pos: RADIO.dial, color: '#FFC36A', power: 0.55 * on, radius: 1.6, flicker: 0.05}] : [];
  return (
    <Stage T={T} cam={cam} set={{radioOn: on}} atmos={f1Atmos(T, cam.pos.y)} lights={lights} black={fadeF1(T)}
      items={(v) => [
        ...persistItems(v, T, {exceptSec: 'EF', lod: {full: 30, mid: 140}}),
        ...tableauMachineItems(v, T, {near: v.pos.y < 3}),
        ...othersItems(T),
        // he sits against the slab: seen from above, the slab's faces sort nearer than his seat — keep him in front of it
        {...figureSprite(directorSpec(T, DIR_HEAD)), bias: 0.8},
        // in front of the van door: a small bias keeps the van's lower side panel (one long face) from sorting over her
        {...figureSprite(pilotSpec(T, pilotChest(T))), bias: 0.6},
        knobMark(T),
        ...(on > 0 ? [radioBeacon(on)] : []),
      ]} />
  );
};

export const EF_SHOTS = {E1, E1Clasp, E2, F1, CLASP_IN};
