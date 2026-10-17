// checker's allied drone: a small repurposed delivery quadcopter (warm orange shell, cream top panel, silver tape over
// old repairs, an amber camera) — deliberately unlike the system's pale, cyan-eyed drones. It takes off, scouts, dives
// and harries; it can hover between a wounded person and a blow and take the hit (sparks, wobble, a smoke wisp); and it
// can be run down and destroyed (an arm breaks off, it tumbles smoking to the ground and lies there).
import React from 'react';
import {V3, add3, sub3, mul3, lerp, lerp3, clamp, len3, norm3, rnd, keys} from '../../kit/math';
import {Item, prep, cbox, strut, cylinder, merge, xfMesh, Mesh, project, xfPoint, Xf} from '../engine';
import {FxOut, fx, combine, f1, ball3, glowEl, gid, glowTone, tone} from './core';
import {sparks3, chips3, flash3} from './particles';
import {smokeItems, columnSource} from './smoke';

// ------------------------------------------------------------------ mesh (local: front = −z, up = +y, origin = body centre)
const ARM_TIPS: V3[] = [{x: -0.3, y: 0.02, z: -0.25}, {x: 0.3, y: 0.02, z: -0.25}, {x: 0.3, y: 0.02, z: 0.25}, {x: -0.3, y: 0.02, z: 0.25}];
const ARM_ROOTS: V3[] = [{x: -0.12, y: 0, z: -0.1}, {x: 0.12, y: 0, z: -0.1}, {x: 0.12, y: 0, z: 0.1}, {x: -0.12, y: 0, z: 0.1}];
const armMesh = (i: number): Mesh => merge(
  strut(ARM_ROOTS[i], ARM_TIPS[i], 0.018, 5, 'ally_arm'),
  {...cylinder(0.038, 0.055, 7, 'ally_dark', 'ally_dark', -0.02), verts: cylinder(0.038, 0.055, 7, 'ally_dark', 'ally_dark', -0.02).verts.map((p) => add3(p, ARM_TIPS[i]))},
);
const bodyMesh = (arms: number[]): Mesh => merge(
  cbox(0.34, 0.1, 0.28, ['ally_panel', 'ally_dark', 'ally_body', 'ally_body', 'ally_body', 'ally_body'], -0.05),
  {...cbox(0.12, 0.07, 0.07, 'ally_dark', -0.1), verts: cbox(0.12, 0.07, 0.07, 'ally_dark', -0.1).verts.map((p) => add3(p, {x: 0, y: 0, z: -0.15}))},
  {...cbox(0.06, 0.04, 0.02, 'ally_lens', -0.085), verts: cbox(0.06, 0.04, 0.02, 'ally_lens', -0.085).verts.map((p) => add3(p, {x: 0, y: 0, z: -0.19}))},
  xfMesh(cbox(0.38, 0.008, 0.05, 'ally_tape', 0.05), {yaw: 28, pos: {x: 0.02, y: 0, z: 0.02}}),
  xfMesh(cbox(0.2, 0.008, 0.045, 'ally_tape', 0.052), {yaw: -64, pos: {x: -0.07, y: 0, z: 0.05}}),
  strut({x: 0.1, y: 0.05, z: 0.11}, {x: 0.15, y: 0.19, z: 0.17}, 0.006, 4, 'ally_arm'),
  ...arms.map(armMesh),
);
const BODY = prep({...bodyMesh([0, 1, 2, 3]), crease: 30});
const BODY_BROKEN = prep({...bodyMesh([0, 2, 3]), crease: 30});
const LOOSE_ARM = prep(armMesh(1));

// ------------------------------------------------------------------ flight path
export type DronePose = {pos: V3; heading: number; pitch: number; roll: number; speed: number};
/**
 * Pose along keyed waypoints [[t, x, y, z], …] (smooth per axis), with heading from velocity, nose-down pitch with
 * speed, bank into turns, and a small hover bob. `faceAt` (optional) points the nose at a world point when slow.
 */
export const droneKeys = (t: number, k: [number, number, number, number][], faceAt?: V3, seed = 1): DronePose => {
  const at = (tt: number): V3 => ({x: keys(tt, k.map((q) => [q[0], q[1]] as [number, number])), y: keys(tt, k.map((q) => [q[0], q[2]] as [number, number])), z: keys(tt, k.map((q) => [q[0], q[3]] as [number, number]))});
  const p = at(t), pa = at(t - 0.1), pb = at(t + 0.1);
  const v = mul3(sub3(pb, pa), 5);
  const sp = Math.hypot(v.x, v.z);
  const hv = (q: V3) => (Math.atan2(q.x, -q.z) * 180) / Math.PI;
  let heading = sp > 0.4 ? hv(v) : faceAt ? hv(sub3(faceAt, p)) : hv(sub3(at(t + 0.6), at(t - 0.6)));
  if (sp <= 0.4 && faceAt) heading = hv(sub3(faceAt, p));
  const v2 = mul3(sub3(at(t + 0.2), at(t)), 5), v1 = mul3(sub3(at(t), at(t - 0.2)), 5);
  const turn = ((hv(v2) - hv(v1) + 540) % 360) - 180;
  const roll = sp > 0.5 ? clamp(-turn * 0.6, -28, 28) : 0;
  const bob = 0.035 * Math.sin(t * 3.1 + seed) + 0.02 * Math.sin(t * 5.3 + seed * 2);
  return {pos: add3(p, {x: 0, y: bob, z: 0}), heading, pitch: -clamp(sp * 3.2, 0, 26), roll, speed: sp};
};

export type DroneHit = {at: number; dir: V3; strength?: number};
export type AllyDroneOpts = {
  key: string; t: number;
  pose: (t: number) => DronePose;
  /** rotors spin up from here (takeoff); before it the drone sits still */
  spinUp?: number;
  hits?: DroneHit[];
  /** destroyed: knocked out of the air at this time, along `destroyDir` */
  destroyAt?: number; destroyDir?: V3;
  ground?: number; seed?: number;
};

/** Where the drone is (for aiming enemy drones at it, placing its shield position, etc.). */
export const allyDronePos = (o: AllyDroneOpts, t: number): V3 => droneState(o, t).xf.pos as V3;

const droneState = (o: AllyDroneOpts, t: number) => {
  const g = o.ground ?? 0;
  if (o.destroyAt !== undefined && t >= o.destroyAt) {
    const p0 = o.pose(o.destroyAt), pPrev = o.pose(o.destroyAt - 0.1);
    const v0 = add3(mul3(sub3(p0.pos, pPrev.pos), 10), add3(mul3(norm3(o.destroyDir ?? {x: 1, y: 0, z: 0}), 3.5), {x: 0, y: 1.2, z: 0}));
    const b = ball3(p0.pos, v0, t - o.destroyAt, g + 0.07, 0.22, 4);
    const tumble = b.landed ? 0 : (t - o.destroyAt) * 620;
    const land = b.landed ? 1 : 0;
    const xf: Xf = {pos: b.p, yaw: p0.heading + (t - o.destroyAt) * 260 * (1 - land) + (land ? 140 : 0), pitch: land ? -14 : p0.pitch + tumble * 0.5, roll: land ? 24 : p0.roll + tumble};
    return {xf, dead: true, landed: b.landed, rest: b.rest, v0, p0: p0.pos};
  }
  const p = o.pose(t);
  let roll = p.roll, pitch = p.pitch;
  let pos = p.pos;
  (o.hits ?? []).forEach((h) => {
    const a = t - h.at;
    if (a < 0 || a > 1.2) return;
    const s = h.strength ?? 1;
    const w = Math.exp(-5 * a) * Math.sin(a * 26) * 18 * s;
    roll += w; pitch += w * 0.5;
    pos = add3(pos, mul3(norm3(h.dir), 0.25 * s * (1 - Math.exp(-12 * a)) * Math.exp(-2.5 * a)));
  });
  return {xf: {pos, yaw: p.heading, pitch, roll} as Xf, dead: false, landed: false, rest: false, v0: {x: 0, y: 0, z: 0}, p0: pos};
};

/** The allied drone at film time o.t: mesh, rotor discs, lens glow, hits, destruction. */
export const allyDrone = (o: AllyDroneOpts): FxOut => {
  const t = o.t, seed = o.seed ?? 1;
  const st = droneState(o, t);
  const items: Item[] = [{kind: 'mesh', mesh: st.dead ? BODY_BROKEN : BODY, xf: st.xf, key: `${o.key}_body`, asObject: true, inkScale: 0.8}];
  const out: FxOut[] = [];
  // rotors: translucent discs with two blade streaks
  const spinning = !st.dead && (o.spinUp === undefined || t >= o.spinUp);
  const spin = o.spinUp === undefined ? 1 : clamp((t - o.spinUp) / 0.6);
  if (!st.dead || !st.landed) {
    (st.dead ? [0, 2, 3] : [0, 1, 2, 3]).forEach((i) => {
      const hub = xfPoint(add3(ARM_TIPS[i], {x: 0, y: 0.045, z: 0}), st.xf);
      items.push({
        kind: 'sprite', pos: hub, key: `${o.key}_rot${i}`, bias: 0.02,
        draw: (c) => {
          const ring = Array.from({length: 14}, (_, k) => {
            const a = (k / 14) * Math.PI * 2;
            return project(c.view, xfPoint(add3(ARM_TIPS[i], {x: Math.cos(a) * 0.15, y: 0.045, z: Math.sin(a) * 0.15}), st.xf));
          });
          if (ring.some((s) => s.z < c.view.near)) return null;
          const ang = (t * (spinning ? 50 * spin + 2 : 1.5) + i) * Math.PI * 2;
          const blade = [0, Math.PI].map((d) => project(c.view, xfPoint(add3(ARM_TIPS[i], {x: Math.cos(ang + d) * 0.14, y: 0.047, z: Math.sin(ang + d) * 0.14}), st.xf)));
          return (
            <g>
              {spinning && spin > 0.3 && <polygon points={ring.map((s) => `${f1(s.x)},${f1(s.y)}`).join(' ')} fill={tone(c, '#E8E4DA', 2)} opacity={0.22 * spin} />}
              <line x1={f1(blade[0].x)} y1={f1(blade[0].y)} x2={f1(blade[1].x)} y2={f1(blade[1].y)} stroke={tone(c, '#2A2D31')} strokeWidth={f1(Math.max(1, 0.012 * c.k))} strokeLinecap="round" opacity={spinning && spin > 0.6 ? 0.5 : 1} />
            </g>
          );
        },
      });
    });
  }
  // lens glow (dies with the drone)
  if (!st.dead || t - (o.destroyAt as number) < 0.25) {
    const lens = xfPoint({x: 0, y: -0.065, z: -0.205}, st.xf);
    items.push({kind: 'sprite', pos: lens, key: `${o.key}_lens`, bias: 0.05, draw: (c) => glowEl(gid(o.key, 'lens'), c.x, c.y, Math.max(3, 0.09 * c.k), glowTone(c, '#FFB24A', 0.3), 0.75 + 0.2 * Math.sin(t * 9))});
  }
  // hits: sparks, chips, flash, then a thin smoke wisp from the shell
  (o.hits ?? []).forEach((h, i) => {
    if (t < h.at) return;
    const p = o.pose(h.at).pos;
    const at = sub3(p, mul3(norm3(h.dir), 0.16));
    out.push(fx(sparks3({at, t, t0: h.at, key: `${o.key}_h${i}`, n: 16, dir: mul3(norm3(h.dir), -1), spread: 75, speed: [2, 7], seed: seed + i * 7, flash: 0.35})));
    out.push(fx(chips3({at, t, t0: h.at, key: `${o.key}_hc${i}`, n: 4, dir: {x: 0, y: 1, z: 0}, spread: 80, speed: [1, 3], size: [0.02, 0.05], material: 'ally', ground: o.ground ?? 0, seed: seed + i * 11})));
  });
  const firstHit = (o.hits ?? []).length ? Math.min(...(o.hits ?? []).map((h) => h.at)) : undefined;
  const wispStart = firstHit !== undefined ? firstHit + 0.15 : o.destroyAt;
  if (wispStart !== undefined && t > wispStart) {
    const src = {...columnSource((tt: number) => droneState(o, tt).xf.pos as V3, wispStart, 1e9, seed + 31, 0.18, '#4A403E'), rate: 9, life: 2.5, up: 0.6};
    out.push(fx(smokeItems(t, [src], `${o.key}_wisp`)));
  }
  // destruction: flash, a loose arm, sparks on landing, smoke from the wreck
  if (o.destroyAt !== undefined && t >= o.destroyAt) {
    const a = t - o.destroyAt;
    out.push(fx(flash3({at: st.p0, t, t0: o.destroyAt, key: `${o.key}_kflash`, r: 0.8, dur: 0.14})));
    out.push(fx(sparks3({at: st.p0, t, t0: o.destroyAt, key: `${o.key}_ksp`, n: 26, spread: 140, speed: [2, 8], seed: seed + 41})));
    const pd = o.pose(o.destroyAt);
    const armB = ball3(xfPoint(ARM_TIPS[1], {pos: pd.pos, yaw: pd.heading, pitch: pd.pitch, roll: pd.roll}), add3(st.v0, {x: 1.5, y: 2, z: -1}), a, (o.ground ?? 0) + 0.03, 0.25);
    items.push({kind: 'mesh', mesh: LOOSE_ARM, key: `${o.key}_arm`, asObject: true, xf: {pos: sub3(armB.p, ARM_TIPS[1]), yaw: a * 400 * (armB.rest ? 0 : 1), roll: armB.landed ? 80 : a * 700}});
    if (st.landed) {
      out.push(fx(sparks3({at: st.xf.pos as V3, t, t0: o.destroyAt + 0.3, key: `${o.key}_lsp`, n: 0, t1: o.destroyAt + 6, rate: 4, dir: {x: 0, y: 1, z: 0}, spread: 60, speed: [0.8, 2], life: [0.2, 0.5], flash: 0, seed: seed + 51})));
    }
  }
  return combine(fx(items), ...out);
};

