// V2 lab scene: the bench (labWorld2), the lead in his lab coat behind it, and one camera. Draw order: the wall
// (soft focus), the lead clipped at the bench top (he stands behind it), the bench and the apparatus, then his hands
// again over what they hold, then the fibre, the blade once it is free, and the outlet effects.
import React from 'react';
import {Man, manJoints, ManPose} from './dc/Man';
import {Cam, Layer} from './dc/camera';
import {add, clamp, fmt, lerp, lerpV, mul, norm, P as Pt, perp, sub, V} from './dc/math';
import {Expr, mixExpr} from './dc/Head';
import {HandPose, mixHand} from './dc/Hand';
import {INK} from './dc/ink';
import {mix} from './dc/color';
import {BASE, EXPR_FOCUS, EXPR_GRIN, EXPR_LAB, HAND_GRIP, HAND_READY, HERO_LAB} from './cast3';
import {heroAt} from './Street3';
import {BEAKER, BENCH_Y, BLADE_LEN, COCOON_DISH, LT3, PUMP, SAND, SPARE_COCOON, SYR_ACE, SYR_SILK, TRAY} from './labWorld3';
import {ACETONE, Beaker, beakerInner, beakerLevelY, Bench, Blade, Cocoon, CocoonDish, FrontTray, LabWall, Nozzle, nozFrame, Pump, SandDish, SILK, Tray, Tube} from './LabArt3';
import {grainsAt, labPhys, ss} from './labPhys3';
import {LIQUID_BG, SilkChains} from './SilkField';
import {macroView, MACRO} from './Macro3';

export const LS = 1.25;
export const HERO_LAB0: ManPose = {...BASE, x: 1300, y: 1470, s: LS, torso: 5, chest: 5, neck: 4, turn: 0.45, rW: 1, rElb: -1, lW: 1, lElb: -1, lWx: 1330, lWy: 1284};

/** the far hand holds the nozzle: the fist on the rear of the body, the hand's axis along the nozzle */
export const gripPose = (p: ManPose, rear: V, tip: V): ManPose => {
  const F = nozFrame(rear, tip);
  const wrist = F.at(F.len - 30, -16);
  const q = {...p, rWx: wrist.x, rWy: wrist.y, rW: 1};
  const j = manJoints(q);
  const fd = j.R.foreDir;
  const want = (Math.atan2(tip.y - rear.y, tip.x - rear.x) * 180) / Math.PI;
  let wr = want - (Math.atan2(fd.y, fd.x) * 180) / Math.PI;
  while (wr > 180) wr -= 360;
  while (wr < -180) wr += 360;
  return {...q, rWr: wr};
};

/** discs round both hands, where the lead is drawn again over the apparatus */
export const handDiscs = (p: ManPose) => {
  const j = manJoints(p);
  const L = 96 * p.s;
  const disc = (W: V, ang: number) => {
    const d = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
    return {x: W.x + d.x * L * 0.35, y: W.y + d.y * L * 0.35, r: L * 0.62};
  };
  return [disc(j.R.W, j.R.handAng), disc(j.L.W, j.L.handAng)];
};

// ------------------------------------------------------------------ the lead's near hand and the cocoon it carries
const C1 = {x: 1278, y: BENCH_Y - 22};
const BEAKER_ABOVE = {x: BEAKER.x, y: BENCH_Y - BEAKER.h - 10};
const keyV = (f: number, keys: [number, V][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], ss(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
const heroX = (f: number) => lerp(1300, 650, ss(f, LT3.carry0 - 4, LT3.carry1 + 2));
const nearTarget = (f: number): V => {
  const dx = heroX(f) - 1300;
  const rest: V = {x: 1330 + dx, y: BENCH_Y - 26};
  return keyV(f, [
    [LT3.pick0 - 12, {x: 1330, y: BENCH_Y - 26}],
    [LT3.grasp, {x: C1.x + 4, y: C1.y - 6}],
    [LT3.lift, {x: C1.x - 10, y: C1.y - 50}],
    [LT3.drop, {x: BEAKER_ABOVE.x + 30, y: BEAKER_ABOVE.y - 30}],
    [LT3.release + 10, {x: 1236, y: 1230}],
    [306, {x: PUMP.x1 - 22, y: PUMP.top + 30}],
    [318, {x: PUMP.x1 - 22, y: PUMP.top + 30}],
    [336, rest],
    [LT3.carry0, rest],
    [LT3.carry1, rest],
  ]);
};
const nearHand = (f: number): HandPose => {
  if (f >= LT3.grasp - 4 && f < LT3.release) return mixHand(HAND_READY, HAND_GRIP, ss(f, LT3.grasp - 4, LT3.grasp));
  if (f >= 306 && f < 320) return {curl: [0.05, 0.6, 0.7, 0.75], spread: 0.3, thumb: 20, thumbCurl: 0.5};
  return HAND_READY;
};
const levelAt = (f: number) => BEAKER.level0 - 0.12 * ss(f, 318, 346);

const heroPose = (f: number): ManPose => {
  const P = labPhys(f);
  const x = heroX(f);
  const walk = ss(f, LT3.carry0 - 4, LT3.carry1 + 2);
  const bob = walk > 0 && walk < 1 ? 7 * Math.abs(Math.sin(walk * Math.PI * 3)) : 0;
  const nt = nearTarget(f);
  const base: ManPose = {...HERO_LAB0, x, y: HERO_LAB0.y - bob, lWx: nt.x, lWy: nt.y, torso: 5 - 3 * ss(f, LT3.pull0, LT3.taut) + 2 * walk * (1 - walk)};
  return gripPose(base, P.rear, P.tip);
};

// ------------------------------------------------------------------ the loop: the opening's pose, in the lab
/** frame 0 has the lead's hips at (930, 2200) at scale 2.1 on screen; the lab's last frame shows him at the same
 *  screen place and size: the same pose (from the opening's own function, time-shifted into the lab's last second)
 *  with the camera at zoom 2.1 / 1.25 */
export const Z_END = 2.1 / LS;
const HIP_END: V = {x: 650, y: 1470};
export const END_CAM: Cam = {x: HIP_END.x - (930 - 540) / Z_END, y: HIP_END.y - (2200 - 960) / Z_END, z: Z_END};
const toLab = (p: V): V => add(HIP_END, mul(sub(p, {x: 930, y: 2200}), LS / 2.1));
const openingPoseInLab = (f: number): ManPose => {
  const h = heroAt(f - 952);
  const T = toLab({x: h.pose.rWx, y: h.pose.rWy});
  return {...h.pose, x: HIP_END.x, y: HIP_END.y, s: LS, rWx: T.x, rWy: T.y};
};
/** the lead's pose from back0: from holding the nozzle over the tray into the opening's pose */
const endPose = (f: number): ManPose => {
  const a = heroPose(LT3.back0);
  const b = openingPoseInLab(f);
  const u = ss5((f - LT3.back0) / (946 - LT3.back0));
  const o = {} as ManPose;
  (Object.keys(b) as (keyof ManPose)[]).forEach((key) => {
    const va = (a[key] ?? 0) as number;
    const vb = (b[key] ?? 0) as number;
    (o as Record<string, number>)[key] = va + (vb - va) * u;
  });
  // keep the elbow sides of the end pose
  // the near hand leaves the bench for the opening's arm-down pose by its torso target only (never via the face)
  return {...o, rElb: b.rElb, lElb: b.lElb, rW: 1, lW: lerp(a.lW, b.lW, u), lTu: b.lTu, lTv: b.lTv, lWx: a.lWx, lWy: a.lWy};
};
/** the nozzle in the hand: its axis along the hand, the fist on its rear (gripPose in reverse) */
const nozzleInHand = (p: ManPose) => {
  const j = manJoints(p);
  const ha = (j.R.handAng * Math.PI) / 180;
  const ax = {x: -Math.cos(ha), y: -Math.sin(ha)}; // tip -> rear
  const n = {x: -ax.y, y: ax.x};
  const len = 256;
  const tip = sub(sub(j.R.W, mul(ax, len - 30)), mul(n, -16));
  return {tip, rear: add(tip, mul(ax, len))};
};

/** the dropped cocoon: carried in the pinch, released over the beaker, falls, floats, loosens and dissolves */
type CocState = {c: V; ang: number; s: number; op: number; loosen: number; inBeaker: boolean};
export const cocoonAt = (f: number): CocState => {
  if (f < LT3.grasp) return {c: C1, ang: -4, s: 1, op: 1, loosen: 0, inBeaker: false};
  const pinchAt = (g: number) => {
    const j = manJoints(heroPose(g));
    const a = (j.L.handAng * Math.PI) / 180;
    return add(j.L.W, mul({x: Math.cos(a), y: Math.sin(a)}, 96 * LS * 0.55));
  };
  if (f < LT3.release) {
    const p = pinchAt(f);
    return {c: lerpV(C1, p, ss(f, LT3.grasp, LT3.grasp + 4)), ang: -4 + 30 * ss(f, LT3.lift, LT3.drop), s: 1, op: 1, loosen: 0, inBeaker: false};
  }
  const rel = pinchAt(LT3.release);
  const surf = beakerLevelY(levelAt(f)) + 6;
  const t = (f - LT3.release) / 30;
  const fallY = Math.min(surf, rel.y + 0.5 * 4000 * t * t);
  const sink = 26 * ss(f, 300, 318);
  const loosen = ss(f, 298, 318);
  const fade = ss(f, 312, LT3.dissolve1);
  return {c: {x: lerp(rel.x, BEAKER.x, ss(f, LT3.release, LT3.release + 6)), y: fallY + sink}, ang: lerp(26, 8, ss(f, LT3.release, 300)), s: 1 - 0.5 * fade, op: 1 - fade, loosen, inBeaker: fallY >= surf - 1};
};

// ------------------------------------------------------------------ camera
type K = {f: number; c: (f: number) => Cam};
const fixed = (x: number, y: number, z: number) => () => ({x, y, z});
/** the beaker point the macro liquid hands over to, and the zoom there */
const B0: V = {x: BEAKER.x - 6, y: BENCH_Y - 34};
const ZC = 60;
/** where the camera holds while the blade is lifted on the fibre (the blade's centre at rest over the tray, lowered
 *  a little on screen so the lift has room) */
const TRAY_HANG = (() => {
  const P = labPhys(750);
  const c = lerpV(P.bladeT, P.bladeE, 0.5);
  return {x: c.x, y: c.y - (1180 - 960) / 4.3};
})();
const midTrack = (z: number, ox = 0, oy = 0) => (f: number): Cam => {
  const P = labPhys(f);
  const c = lerpV(P.tip, lerpV(P.bladeT, P.bladeE, 0.5), 0.55);
  return {x: c.x + ox, y: c.y + oy, z};
};
/** the blade's centre held at screen height sy */
const bladeTrack = (z: number, sy: number) => (f: number): Cam => {
  const P = labPhys(f);
  const c = lerpV(P.bladeT, P.bladeE, 0.5);
  return {x: c.x, y: c.y - (sy - 960) / z, z};
};
const fibreTrack = (z: number) => (f: number): Cam => {
  const P = labPhys(f);
  const c = lerpV(P.fibre.from, P.fibre.to, 0.55);
  return {x: c.x, y: c.y + 30, z};
};
const KEYS: K[] = [
  {f: MACRO.end, c: fixed(B0.x, B0.y, ZC)},
  {f: LT3.reveal1, c: fixed(1110, 1140, 1.55)},
  {f: LT3.pick0, c: fixed(1120, 1150, 1.62)},
  {f: 262, c: fixed(1222, 1130, 2.3)},
  {f: 296, c: fixed(1205, 1150, 2.5)},
  {f: 312, c: fixed(1172, 1215, 3.2)},
  {f: 332, c: fixed(1040, 1185, 2.9)},
  {f: 352, c: fixed(930, 1150, 3.2)},
  {f: 378, c: fixed(735, 1176, 3.9)},
  {f: 398, c: fixed(735, 1176, 4.0)},
  {f: 420, c: fixed(628, 1192, 13)},
  {f: 446, c: fixed(622, 1194, 16)},
  {f: 474, c: fixed(604, 1198, 24)},
  {f: 494, c: fibreTrack(12)},
  {f: 524, c: fixed(470, 1225, 2.5)},
  {f: 548, c: fixed(440, 1238, 2.9)},
  {f: LT3.contact - 2, c: fixed(390, 1252, 9)},
  {f: LT3.settle1, c: fixed(392, 1250, 9.5)},
  {f: LT3.taut, c: fixed(500, 1205, 3.3)},
  {f: LT3.out, c: bladeTrack(3.6, 1150)},
  {f: LT3.carry1, c: bladeTrack(4.2, 1120)},
  {f: 752, c: fixed(TRAY_HANG.x, TRAY_HANG.y, 4.3)},
  {f: 800, c: fixed(TRAY_HANG.x, TRAY_HANG.y - 14, 4.9)},
  {f: LT3.hang1, c: bladeTrack(5.0, 1110)},
  {f: LT3.flat, c: bladeTrack(4.0, 1120)},
  {f: 904, c: fixed(420, 1040, 1.45)},
  {f: 936, c: () => END_CAM},
  {f: LT3.end, c: () => END_CAM},
];
const lerpCam = (a: Cam, b: Cam, u: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u));
  // keep the motion natural across big zoom changes: the centre moves with 1/z
  const w = Math.abs(1 / b.z - 1 / a.z) > 1e-4 ? (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z) : u;
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
const ss5 = (x: number) => {
  const t = clamp(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const labCam3 = (f: number, end?: (f: number) => Cam): Cam => {
  const keys = end ? [...KEYS, {f: LT3.end, c: end}] : KEYS;
  if (f <= keys[0].f) return keys[0].c(f);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].f) return lerpCam(keys[i - 1].c(f), keys[i].c(f), ss5((f - keys[i - 1].f) / (keys[i].f - keys[i - 1].f)));
  }
  return keys[keys.length - 1].c(f);
};

// ------------------------------------------------------------------ outlet effects and the fibre
const Fibre: React.FC<{f: number; k: number}> = ({f, k}) => {
  const P = labPhys(f);
  if (!P.fibre.on) return null;
  const a = P.fibre.from;
  const b = P.fibre.to;
  const mid = add(lerpV(a, b, 0.5), {x: 0, y: P.fibre.sag});
  const d = `M${Pt(a)} Q${Pt(mid)} ${Pt(b)}`;
  const w = 2.6;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 1.6 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFFDF6" strokeWidth={fmt(w)} strokeLinecap="round" />
      {f < LT3.contact && P.fibre.fly > 0 && <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(w * 1.1)} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.9 * k)} />}
      {P.contactSquash > 0 && f < LT3.lift0 && (
        <ellipse cx={fmt(b.x)} cy={fmt(b.y)} rx={fmt(w * (0.9 + 0.8 * P.contactSquash))} ry={fmt(w * (1.1 - 0.4 * P.contactSquash))} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.8 * k)} />
      )}
    </g>
  );
};

/** at the outlet: the silk core leaves inside its acetone sheath; the core turns into a solid white fibre within a
 *  few mm while the sheath thins and drifts off as vapour */
const OutletJet: React.FC<{f: number}> = ({f}) => {
  const a = ss(f, LT3.harden0, LT3.harden0 + 10) * (1 - ss(f, 560, 600));
  if (a <= 0.01) return null;
  const P = labPhys(f);
  const F = nozFrame(P.rear, P.tip);
  const dir = norm(sub(P.fibre.on ? P.fibre.to : add(P.tip, mul(F.ax, -40)), P.tip));
  const n = perp(dir);
  const out = clamp((f - LT3.harden0) / 18);
  const L = 40 * out;
  const at = (x: number, y: number) => add(P.tip, add(mul(dir, x), mul(n, y)));
  const sheath = `M${Pt(at(0, -3.6))} Q${Pt(at(L * 0.4, -3.2))} ${Pt(at(L, -1.4))} L${Pt(at(L, 1.4))} Q${Pt(at(L * 0.4, 3.2))} ${Pt(at(0, 3.6))} Z`;
  const coreId = `oj${Math.round(f * 10)}`;
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={coreId} gradientUnits="userSpaceOnUse" x1={fmt(at(0, 0).x)} y1={fmt(at(0, 0).y)} x2={fmt(at(14, 0).x)} y2={fmt(at(14, 0).y)}>
          <stop offset="0" stopColor={SILK} />
          <stop offset="1" stopColor="#FFFDF6" />
        </linearGradient>
      </defs>
      <path d={sheath} fill={ACETONE} opacity={0.42} />
      <path d={`M${Pt(at(0, 0))} L${Pt(at(Math.max(L, 2), 0))}`} stroke={`url(#${coreId})`} strokeWidth={2.6} strokeLinecap="round" />
      {/* vapour wisps leaving the sheath */}
      {[0, 1, 2, 3, 4].map((i) => {
        const ph = ((f - LT3.harden0) / 14 + i * 0.2) % 1;
        const x = 6 + ph * 26;
        const y = (i % 2 ? -1 : 1) * (3 + ph * 12);
        const p = at(x, y);
        return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y - ph * 8)} r={fmt(0.8 + ph * 1.8)} fill={ACETONE} opacity={0.5 * (1 - ph)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the scene
export const LabScene3: React.FC<{f: number; endCam?: (f: number) => Cam; pose?: (f: number) => ManPose}> = ({f, endCam, pose}) => {
  const id = `l${Math.round(f * 100)}`;
  const cam = labCam3(f, endCam);
  const k = 1 / Math.sqrt(Math.max(1, cam.z));
  const P = labPhys(f);
  const hero = pose ? pose(f) : f >= LT3.back0 ? endPose(f) : heroPose(f);
  if (f >= LT3.back0) {
    const nz = nozzleInHand(hero);
    P.tip = nz.tip;
    P.rear = nz.rear;
    P.fibre = {...P.fibre, from: nz.tip, sag: 30 + 0.12 * Math.hypot(nz.tip.x - P.fibre.to.x, nz.tip.y - P.fibre.to.y)};
  }
  const F = nozFrame(P.rear, P.tip);
  // the tubes run from the syringes down onto the bench, along it, and up to the nozzle; a long free length lets
  // the lead carry the nozzle over the tray
  const rearDrop = F.at(F.len + 26, 30);
  const benchUnder = (x: number) => ({x, y: BENCH_Y - 18});
  const tubeSilk: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y}, {x: SYR_SILK.x0 - 30, y: SYR_SILK.y + 40}, benchUnder(Math.min(SYR_SILK.x0 - 60, rearDrop.x + 70)), benchUnder(Math.min(SYR_SILK.x0 - 80, rearDrop.x + 40)), rearDrop, F.at(F.len + 10, 4), F.at(F.len, 0)];
  const portW = F.at(210, 24);
  const portDrop = F.at(205, 56);
  const tubeAce: V[] = [{x: SYR_ACE.x0 - 12, y: SYR_ACE.y}, {x: SYR_ACE.x0 - 46, y: SYR_ACE.y + 70}, benchUnder(Math.min(SYR_ACE.x0 - 70, portDrop.x + 80)), benchUnder(Math.min(SYR_ACE.x0 - 90, portDrop.x + 50)), portDrop, portW, F.at(210, 12)];
  const tubeIn: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y + 4}, {x: SYR_SILK.x0 - 4, y: SYR_SILK.y - 60}, {x: 1050, y: 1080}, {x: BEAKER.x - 22, y: BENCH_Y - BEAKER.h - 16}, {x: BEAKER.x - 22, y: BENCH_Y - 30}];
  // the beaker: the macro's liquid is handed over here, then fades to the plain solution as the camera pulls back
  const v = macroView(MACRO.end);
  const S_w = v.S / ZC;
  const c = Math.cos((v.ang * Math.PI) / 180);
  const s = Math.sin((v.ang * Math.PI) / 180);
  const fmap = (x: number, y: number) => ({x: B0.x + ((x - v.U) * c - y * s) * S_w, y: B0.y + ((x - v.U) * s + y * c) * S_w});
  const fieldOp = clamp((Math.log(cam.z) - Math.log(5)) / (Math.log(14) - Math.log(5)));
  const bi = beakerInner();
  const R = 1200 / (S_w * cam.z);
  const liquid = mix(LIQUID_BG, '#ECC965', ss(f, 300, LT3.dissolve1));
  const coc = cocoonAt(f);
  const beakerInside = (
    <g>
      {fieldOp > 0.01 && (
        <g opacity={fieldOp}>
          <rect x={bi.x0 - 5} y={bi.y0 - 5} width={bi.x1 - bi.x0 + 10} height={bi.y1 - bi.y0 + 10} fill={LIQUID_BG} />
          <SilkChains map={fmap} scale={S_w} x0={v.U - R} x1={v.U + R} y0={-R} y1={R} t={f / 30} />
        </g>
      )}
      {coc.inBeaker && coc.op > 0.01 && (
        <g opacity={coc.op}>
          <Cocoon id={`${id}-cb`} c={coc.c} ang={coc.ang} k={k} len={56 * coc.s} loosen={coc.loosen} />
          {/* silk unwinding into the liquid */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const L = 10 + 40 * coc.loosen;
            const a0 = i * 0.8 + f * 0.03;
            const p0 = add(coc.c, {x: Math.cos(a0) * 12, y: Math.sin(a0) * 8});
            const p1 = add(p0, {x: Math.cos(a0 + 0.6) * L, y: Math.sin(a0 + 0.6) * L * 0.7});
            const p2 = add(p1, {x: Math.cos(a0 + 1.8) * L * 0.6, y: Math.sin(a0 + 1.8) * L * 0.5});
            return <path key={i} d={`M${Pt(p0)} Q${Pt(p1)} ${Pt(p2)}`} fill="none" stroke="#E6C25A" strokeWidth={1.4} opacity={coc.loosen * (1 - ss(f, 320, LT3.dissolve1 + 6))} />;
          })}
        </g>
      )}
    </g>
  );
  const pumpRun = ss(f, 316, 320);
  const silkPlunger = lerp(0.78, 0.22, ss(f, 318, 346)) + 0.08 * ss(f, 346, 520);
  const pump = {silkFill: 1, silkPlunger, aceFill: 1, acePlunger: 0.4 + 0.08 * ss(f, 398, 520), run: pumpRun};
  const free = P.free;
  const grains = grainsAt(f);
  const ex = heroExpr(f);
  const lh = nearHand(f);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={fmt(3 / Math.max(1, 1 + (cam.z - 1) / 2.2))} />
        </filter>
        <clipPath id={`${id}-above`}>
          <path d={`M-6000,-6000 H6000 V${BENCH_Y - 12} H-6000 Z`} />
        </clipPath>
      </defs>
      <Layer cam={cam} depth={2.2}>
        <g filter={`url(#${id}-wb)`}>
          <LabWall id={`${id}-wl`} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Tube id={`${id}-ta`} pts={tubeAce} r={2.6} k={k} liquid={ACETONE} front={ss(f, 392, 410)} far />
        <Tube id={`${id}-ts`} pts={tubeSilk} r={2.8} k={k} liquid={SILK} front={ss(f, 346, 368)} />
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hr`} pose={hero} expr={ex} lHand={lh} rHand={HAND_GRIP} outfit={HERO_LAB} inkK={0.9} />
        </g>
        <Bench id={`${id}-bn`} k={k} />
        <Tray id={`${id}-tr`} k={k} />
        <Cocoon id={`${id}-sc`} c={SPARE_COCOON} ang={-8} k={k} />
        <SandDish id={`${id}-sb`} k={k} back />
        {!free && <Blade id={`${id}-bl`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        <SandDish id={`${id}-sf`} k={k} />
        {grains.map((g, i) => (
          <circle key={i} cx={fmt(g.p.x)} cy={fmt(g.p.y)} r={fmt(g.r)} fill={g.c} stroke={INK} strokeWidth={fmt(0.3 * k)} />
        ))}
        <CocoonDish id={`${id}-cd`} k={k} />
        {f < LT3.grasp && <Cocoon id={`${id}-c1`} c={C1} ang={-4} k={k} />}
        <Cocoon id={`${id}-c2`} c={{x: 1328, y: BENCH_Y - 24}} ang={10} k={k} len={52} />
        <Beaker id={`${id}-bk`} k={k} level={levelAt(f)} liquid={liquid} inside={beakerInside} />
        <Pump id={`${id}-pm`} k={k} {...pump} />
        <Tube id={`${id}-ti`} pts={tubeIn} r={2.6} k={k} liquid={SILK} front={ss(f, 314, 330)} />
        <Nozzle id={`${id}-nz`} k={k} rear={P.rear} tip={P.tip} cut={ss(f, LT3.cut0, LT3.cut1) * (1 - ss(f, 496, 516))} silk={ss(f, 362, 394)} ace={ss(f, 404, 440)} core={f / 30} />
        {!coc.inBeaker && f >= LT3.grasp && <Cocoon id={`${id}-c1m`} c={coc.c} ang={coc.ang} k={k} />}
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hh`} pose={hero} expr={ex} lHand={lh} rHand={HAND_GRIP} outfit={HERO_LAB} inkK={0.9} handsOnly />
        </g>
        <OutletJet f={f} />
        <Fibre f={f} k={k} />
        {free && <Blade id={`${id}-blf`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        {f >= LT3.touch && <FrontTray id={`${id}-tf`} k={k} />}
      </Layer>
    </svg>
  );
};

const heroExpr = (f: number): Expr => mixExpr(mixExpr(EXPR_LAB, EXPR_GRIN, ss(f, LT3.flat, LT3.raise0)), EXPR_FOCUS, ss(f, 926, 944));
export {heroPose, PUMP, SAND, TRAY, COCOON_DISH};

/** screen points that captions must keep clear of (tools/v2/cap_check.ts) */
export const labPoints = (f: number) => {
  const cam = labCam3(f);
  const toS = (p: V) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});
  const P = labPhys(f);
  const hero = f >= LT3.back0 ? endPose(f) : heroPose(f);
  if (f >= LT3.back0) {
    const nz = nozzleInHand(hero);
    P.tip = nz.tip;
  }
  const j = manJoints(hero);
  const hc = (W: V, a: number) => add(W, mul({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)}, 96 * LS * 0.4));
  const r = (w: number) => w * cam.z;
  const out: {x: number; y: number; r: number; what: string}[] = [
    {...toS(hc(j.R.W, j.R.handAng)), r: r(80), what: 'hand R'},
    {...toS(P.tip), r: Math.max(60, r(8)), what: 'outlet'},
  ];
  if (f < LT3.carry0 || f >= LT3.back0) out.push({...toS(hc(j.L.W, j.L.handAng)), r: r(80), what: 'hand L'});
  if (P.fibre.on) out.push({...toS(P.fibre.to), r: Math.max(60, r(10)), what: 'fibre end'});
  if (f >= LT3.exit - 10) {
    out.push({...toS(lerpV(P.bladeT, P.bladeE, 0.5)), r: Math.max(80, r(60)), what: 'blade'});
  }
  const coc = cocoonAt(f);
  if (f >= LT3.grasp - 10 && f < LT3.dissolve1) out.push({...toS(coc.c), r: Math.max(60, r(40)), what: 'cocoon'});
  return out;
};
