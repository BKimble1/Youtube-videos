// V3 lab (13.48 - 30.20). One bench with depth: bottles, beakers and a tube rack stand behind the stations, other
// glassware passes close to the lens (soft, out of focus), the shelves of the far wall drift behind. Every shot samples
// the same state (world3), and the camera travels along the experiment's own connections.
//  LA 13.48  the operator at the bench, his right hand steadying the curled specimen on its pad
//  LB 14.30  closer: his gloved fingertip holds the specimen while the needle on the clamped syringe comes down
//  LC 15.00  close on the needle going into the top of the front body section; the glue bead; the hand withdraws
//  LD 16.00  up the needle, hub and barrel to the plunger, where his finger arrives
//  LE 16.60  the push
//  LF 17.00  down again with the pale air pulse, into the spider
//  LG 18.15  face-on: the legs spring open ("suddenly spread OPEN")
//  CL 19.45  low side view at the test block: the open gripper swings in and is lowered round it; the air leaves up
//            the needle; the legs close, front to back, onto the block's sides ("CLAMPED SHUT"); the camera rises
//  LI 23.39  a new low three-quarter angle: the block clearly held beneath the curled legs as it is lifted; then the
//            camera tracks the carry along the bench and the claw drops the block into a glass dish ("working claw")
//  TR 26.19  at spider level, following the open gripper toward another platform, glassware in the foreground
//  RV 27.00  below the platform's edge, looking up at the open gripper coming down over something we cannot see; the
//            camera rises over the edge on "ANOTHER": a second dead spider; the legs close on it, the stand lifts both
//            clear of the mat, and the camera settles high and tight on the curled legs: the opening's composition
import React from 'react';
import {BenchTop, blockItems, FlatShadow, LabWallFar, Pad} from '../../apparatus';
import {lit} from '../../dc/color';
import {digitTips, Hand, HandPose} from '../../dc/Hand';
import {INK, Inked} from '../../dc/ink';
import {Capsule} from '../../dc/shade';
import {boxItem, capsuleItem, cylinderItem, inkW, Item, Items} from '../../draw3';
import {clamp, keyS, ss, ss5} from '../../lib';
import {LOOK_A, SpiderLook, spiderItems} from '../../SpiderDraw';
import {spiderBodies} from '../../occlude';
/** the second dead spider: a pale, sandy-grey individual, so its body never merges with the dark-brown gripper's */
const LOOK_S2: SpiderLook = {leg: '#C8B28E', legBand: '#8E7757', cara: '#A88F6C', caraBand: '#E3D3B4', abd: '#BFA37A', heart: '#7A6247', spot: '#F1E6CF', eye: '#1A1F24'};
import {toWorld} from '../../spider';
import {add3, Basis, Cam3, lerp3, lerpOrbit, mul3, norm3, Orbit, orbitCam, P2, proj, projPoly, V3} from '../../three';
import {COAT, GLOVE, PressHand, Scene} from '../../shots/common';
import {Operator} from '../../shots/Operator';
import {AIR_C, along, hubTopOf, needle1Items, pulsePath, standItems2, syr1, syringe1Items} from '../../v2/claw';
import {BLOCK_H, blockAt, CUT, DISH, entryOf, L_FINGER, L_GLUE, L_NEEDLE, L_OUTFLOW, L_PLUNGER, L_POS, L_PRESS, L_Z, labPose, MAT_Z, PAD_HALF, PAD_Z, PHI, PLAT, ROD, RISER, s2At, station, TM} from '../world3';
import {DarkMat} from './Hook3';

const PAD_C = station(PHI.pad);
const BLK_C = station(PHI.block);
const BASE_DIR = -74;

export const rigAt3 = (t: number) => {
  const P = labPose(t);
  const entry = entryOf(P);
  const tipAbove = L_NEEDLE(t);
  const hub = hubTopOf(entry, tipAbove);
  const plunger = L_PLUNGER(t);
  return {P, entry, tipAbove, hub, plunger, g: syr1(hub, plunger)};
};
const PULSE1 = (t: number) => (t - 16.72) / 1.05;
const PULSE2 = (t: number) => (t - 18.55) / 0.2;
/** the fingertip that steadies the specimen: against the side of its abdomen (lab specimen at rest on the pad) */
const STEADY = (t: number): V3 => toWorld(labPose(Math.min(t, 15.6)), [-5.2, 0, 2.15]);
const STEADY_LIFT = (t: number) => ss(t, 14.82, 15.02);

// ------------------------------------------------------------------ cameras
/** a medium shot of him at work, tracking in toward the needle */
const LA0: Orbit = {target: [PAD_C[0] + 30, PAD_C[1] + 110, 300], az: -18, el: 10, d: 760, f: 1500, cy: 900};
const LA1: Orbit = {target: [PAD_C[0] + 6, PAD_C[1] + 30, 90], az: -10, el: 16, d: 420, f: 1500, cy: 1000};
const LB0: Orbit = {target: [PAD_C[0] - 1.5, PAD_C[1], 9], az: 104, el: 34, d: 74, f: 2000, cy: 1120};
const LB1: Orbit = {...LB0, az: 99, el: 40, d: 58, target: [PAD_C[0] - 1.5, PAD_C[1], 6]};
const LC = (t: number): Orbit => ({target: add3(rigAt3(Math.min(t, 15.6)).P.pos, [-1.2, 0, 1.5 + 0.6 * (L_Z(t) - L_Z(15.6))]), az: 98, el: 44, d: 42 - 3 * ss5(t, CUT.attach, CUT.follow), f: 2000, cy: 1060});
const thumbO = (t: number): Orbit => ({target: add3(rigAt3(t).g.thumb, [0, 0, -20]), az: 42, el: 18, d: 100, f: 2000, cy: 940});
const lowAt = (t: number, d = 46): Orbit => ({target: add3(L_POS(t), [-1.4, 0, -0.8]), az: 56, el: 8, d, f: 2000, cy: 1000});
/** 18.15: tight side view at the block, level with the body */
const SIDE = (t: number): Orbit => ({target: add3(L_POS(t), [-1.0, 0, -2.4]), az: 56, el: 6, d: 44 - 4 * ss5(t, 18.15, 19.0), f: 2000, cy: 1000});
/** 19.0: down below the body, the camera at the bench looking up past the block at the legs coming down round it */
const UNDER = (t: number): Orbit => {
  const target: V3 = [BLK_C[0], BLK_C[1], 5.2 + 0.4 * (L_Z(t) - L_Z(20.0))];
  const d = 34;
  return {target, az: 64 + 16 * ss5(t, 19.0, 20.0), el: (Math.asin(Math.max(-0.9, (1.6 - target[2]) / d)) * 180) / Math.PI, d, f: 2000, cy: 900};
};
/** 20.0: three-quarter on the plunger: the finger lifts, the plunger rises */
const REL = (t: number): Orbit => ({target: add3(rigAt3(t).g.thumb, [0, 0, -26]), az: 34, el: 22, d: 120 - 10 * ss5(t, 20.0, 20.9), f: 2000, cy: 900});
/** 21.0: down along the needle with the air leaving it, to a close three-quarter on the grip */
const GRIP: Orbit = {target: [BLK_C[0] - 0.2, BLK_C[1], 4.4], az: -36, el: 16, d: 34, f: 2000, cy: 1000};
/** 22.0: the block held; a slight lift, seen low from the other side, the gap opening under the block */
const HOLD = (t: number): Orbit => ({target: add3(blockAt(t).c, [0, 0, 1.6]), az: -70 - 10 * ss5(t, 22.0, 23.39), el: 3, d: 38, f: 2000, cy: 1000});
const LI0 = (t: number): Orbit => ({target: add3(blockAt(t).c, [0, 0, 2.2]), az: 44, el: 1, d: 50, f: 2000, cy: 1000});
const LI1 = (t: number): Orbit => {
  const p = L_POS(Math.min(t, 25.75));
  return {target: [p[0] - 1, p[1], p[2] - 6], az: 14, el: 9, d: 92, f: 2000, cy: 980};
};
const TR = (t: number): Orbit => ({target: add3(L_POS(t), [-1, 0, -2]), az: -6, el: 3, d: 80, f: 2000, cy: 960});
const RV0 = (t: number): Orbit => {
  // the eye stays a few millimetres above the bench, below the platform's top: the mat and what lies on it are hidden
  const target = add3(L_POS(t), [-1, 0, -3]);
  const d = 62;
  return {target, az: 30, el: (Math.asin(Math.max(-0.9, (4 - target[2]) / d)) * 180) / Math.PI, d, f: 2000, cy: 820};
};
/** low three-quarter on the grab and the lift: the gap and the shadow under the second spider read clearly */
const RV1 = (t: number): Orbit => ({target: [PLAT.c[0] - 1, PLAT.c[1], PLAT.top + 3.5 + 0.75 * Math.max(0, L_Z(t) - L_Z(28.9))], az: 56, el: 10, d: 38, f: 2000, cy: 960});
/** the last frames: high and tight on the curled legs, the opening's angle and lens */
/** the end: a little higher, the needle straight down the frame onto the pair over the dark mat (echoing frame 0) */
const RVend = (t: number): Orbit => ({target: add3(L_POS(t), [-1.0, 0, -3.2]), az: 46, el: 24, d: 44, f: 2000, cy: 960});

export const camLab3 = (t: number): Cam3 => {
  if (t < CUT.needle) return orbitCam(lerpOrbit(LA0, LA1, ss5(t, CUT.lab, CUT.needle + 0.3)));
  if (t < CUT.attach) return orbitCam(lerpOrbit(LB0, LB1, ss5(t, CUT.needle, CUT.attach + 0.2)));
  if (t < CUT.follow) return orbitCam(LC(t));
  if (t < 16.62) {
    // up the connection: needle hub -> barrel -> plunger
    const u = ss(t, CUT.follow, 16.6);
    const r = rigAt3(t);
    const a = LC(CUT.follow);
    const b = thumbO(t);
    const o = {...lerpOrbit(a, b, u), d: keyS(t, [[CUT.follow, a.d], [16.2, 115], [16.6, b.d]])};
    return orbitCam({...o, target: lerp3(lerp3(a.target, r.hub, ss(t, CUT.follow, 16.2)), b.target, ss(t, 16.1, 16.6))});
  }
  if (t < 17.0) return orbitCam(thumbO(t));
  if (t < 18.15) {
    const p0 = 17.0, p1 = 17.77, s1 = 18.15;
    const r = rigAt3(t);
    const pul = along(pulsePath(r.hub, r.plunger, r.entry), Math.min(1, PULSE1(t)));
    const u = ss5(t, p0, s1);
    const top = thumbO(p0);
    const d = keyS(t, [[p0, top.d], [17.35, 160], [p1, 110], [s1, 46]]);
    return orbitCam({...top, target: lerp3(lerp3(add3(r.g.thumb, [0, 0, -20]), pul, ss5(t, p0, p0 + 0.25)), add3(L_POS(t), [-1.4, 0, -0.8]), ss5(t, p1 - 0.2, s1)), az: 42 + 14 * u, el: 18 - 10 * u, d, cy: 940 + 60 * u});
  }
  if (t < CUT.under) return orbitCam(lerpOrbit(lowAt(18.15), SIDE(t), ss5(t, 18.15, 18.45)));
  if (t < CUT.release) return orbitCam(lerpOrbit(SIDE(CUT.under), UNDER(t), ss5(t, CUT.under, 19.5)));
  if (t < CUT.grip) return orbitCam(REL(t));
  if (t < CUT.hold) {
    // ride the leaving air from the hub down the needle onto the grip
    const r = rigAt3(t);
    const a = REL(CUT.grip);
    const u = ss5(t, CUT.grip, 21.5);
    return orbitCam({...lerpOrbit(a, GRIP, u), target: lerp3(lerp3(a.target, r.hub, ss5(t, CUT.grip, 21.25)), GRIP.target, ss5(t, 21.15, 21.55))});
  }
  if (t < CUT.lift) return orbitCam(HOLD(t));
  if (t < CUT.travel) return orbitCam(lerpOrbit(LI0(t), LI1(t), ss5(t, 23.95, 24.7)));
  if (t < CUT.reveal) return orbitCam(TR(t));
  if (t < 29.55) return orbitCam(lerpOrbit(RV0(t), RV1(t), ss5(t, 27.9, 28.55)));
  return orbitCam(lerpOrbit(RV1(t), RVend(t), ss5(t, 29.55, CUT.end + 0.1)));
};

// ------------------------------------------------------------------ props
type Prop = {kind: 'bottle' | 'beaker' | 'flask' | 'rack'; c: V3; r: number; h: number; liquid?: string; cap?: string};
const BACK_PROPS: Prop[] = [
  {kind: 'bottle', c: [236, 215, 0], r: 14, h: 62, liquid: '#E9A86A', cap: '#2F6E8A'},
  {kind: 'beaker', c: [272, 250, 0], r: 18, h: 40, liquid: '#9FD8C8'},
  {kind: 'rack', c: [345, 225, 0], r: 30, h: 26},
  {kind: 'bottle', c: [418, 205, 0], r: 12, h: 70, liquid: '#C9DDF2', cap: '#C2453B'},
  {kind: 'flask', c: [452, 150, 0], r: 16, h: 50, liquid: '#F3D37C'},
  {kind: 'beaker', c: [205, 120, 0], r: 15, h: 34, liquid: '#D9C2E8'},
  {kind: 'rack', c: [PLAT.c[0] - 8, PLAT.c[1] - PLAT.half - 16, 0], r: 30, h: 26},
];
const propItems = (B: Basis, p: Prop, k: string): Item[] => {
  const it: Item[] = [];
  const top = add3(p.c, [0, 0, p.h]);
  if (p.kind === 'rack') {
    it.push(boxItem(B, add3(p.c, [0, 0, 6]), [p.r, 9, 6], '#E3E8EB', {key: `${k}r`}));
    for (let j = -2; j <= 2; j++) {
      const c: V3 = add3(p.c, [j * 11, 0, 0]);
      it.push(cylinderItem(B, add3(c, [0, 0, 2]), add3(c, [0, 0, p.h + 8]), 3.4, '#E8F4F8', {glass: true, key: `${k}t${j}`}));
      it.push(cylinderItem(B, add3(c, [0, 0, 2]), add3(c, [0, 0, 8 + 6 * ((j + 3) % 3)]), 2.8, ['#E98F7A', '#7FC9C2', '#F2C46A'][(j + 3) % 3], {key: `${k}l${j}`, zBias: -3}));
    }
    return it;
  }
  const neck = p.kind === 'flask' ? 0.35 : p.kind === 'bottle' ? 0.45 : 1;
  if (p.liquid) it.push(cylinderItem(B, add3(p.c, [0, 0, 1]), add3(p.c, [0, 0, p.h * 0.55]), p.r * 0.9, p.liquid, {key: `${k}q`, zBias: -p.r - 0.5}));
  it.push(cylinderItem(B, p.c, add3(p.c, [0, 0, p.h * (neck < 1 ? 0.72 : 1)]), p.r, '#DCEFF6', {glass: true, key: `${k}g`}));
  if (neck < 1) it.push(cylinderItem(B, add3(p.c, [0, 0, p.h * 0.72]), top, p.r * neck, '#DCEFF6', {glass: true, key: `${k}n`, zBias: -0.5}));
  if (p.cap) it.push(cylinderItem(B, top, add3(top, [0, 0, 8]), p.r * neck * 1.15, p.cap, {key: `${k}c`}));
  return it;
};
/** glassware close to the lens in some shots: drawn soft, in front of everything */
const frontProps = (t: number): Prop[] => {
  if (t >= CUT.lab && t < CUT.needle) return [{kind: 'beaker', c: [PAD_C[0] - 95, PAD_C[1] - 330, 0], r: 34, h: 80, liquid: '#9FD8C8'}];
  if (t >= CUT.travel && t < CUT.reveal) {
    const p = L_POS(t);
    return [{kind: 'flask', c: [PLAT.c[0] - 4, PLAT.c[1] - 40, 0], r: 14, h: 46, liquid: '#F3D37C'}, {kind: 'beaker', c: [p[0] - 30, p[1] - 52, 0], r: 10, h: 26, liquid: '#D9C2E8'}];
  }
  return [];
};

// ------------------------------------------------------------------ the dish and the final platform
const ring = (c: V3, r: number, z: number, a0: number, a1: number, n = 24): V3[] => Array.from({length: n + 1}, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z];
});
const dishFacing = (B: Basis) => Math.atan2(B.eye[1] - DISH.c[1], B.eye[0] - DISH.c[0]);
const DishBack: React.FC<{B: Basis}> = ({B}) => {
  const f = dishFacing(B);
  const back = [...ring(DISH.c, DISH.r, 0, f + Math.PI / 2, f + Math.PI * 1.5), ...ring(DISH.c, DISH.r, DISH.rim, f + Math.PI * 1.5, f + Math.PI / 2)];
  const s = proj(B, DISH.c).s;
  return (
    <g>
      <path d={projPoly(B, ring(DISH.c, DISH.r + 1.5, 0, 0, Math.PI * 2, 48))} fill="#1E2A31" opacity={0.18} />
      <path d={projPoly(B, back)} fill="#DCEFF6" opacity={0.45} stroke={INK} strokeWidth={inkW(s * 0.5)} strokeLinejoin="round" />
      <path d={projPoly(B, ring(DISH.c, DISH.r, DISH.floor, 0, Math.PI * 2, 48))} fill="#E8F4F8" opacity={0.75} stroke="#9FB8C4" strokeWidth={1.2} />
    </g>
  );
};
const dishFrontItem = (B: Basis): Item => {
  const f = dishFacing(B);
  const pts = [...ring(DISH.c, DISH.r, 0, f - Math.PI / 2, f + Math.PI / 2), ...ring(DISH.c, DISH.r, DISH.rim, f + Math.PI / 2, f - Math.PI / 2)];
  const rimTop = ring(DISH.c, DISH.r, DISH.rim, f - Math.PI / 2, f + Math.PI / 2).map((p) => proj(B, p));
  const front = proj(B, [DISH.c[0] + DISH.r * Math.cos(f), DISH.c[1] + DISH.r * Math.sin(f), DISH.rim / 2]);
  return {
    z: front.z,
    el: (
      <g key="dishf">
        <path d={projPoly(B, pts)} fill="#DCEFF6" opacity={0.32} stroke={INK} strokeWidth={inkW(front.s * 0.5)} strokeLinejoin="round" />
        <path d={`M${rimTop.map(P2).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.5, 0.35 * front.s)} opacity={0.8} strokeLinecap="round" />
      </g>
    ),
  };
};
/** the riser under the final platform: drawn as a solid that hides the mat's top while the camera is below it */
const riserItem = (B: Basis): Item => {
  const below = B.eye[2] < PLAT.top;
  const it = boxItem(B, add3(PLAT.c, [0, 0, RISER / 2]), [PLAT.half + 1, PLAT.half + 1, RISER / 2], '#55626B', {top: '#2F4140', key: 'riser'});
  return {...it, z: below ? 3 : 1e6};
};

// ------------------------------------------------------------------ the forceps in the operator's right hand
/** fine steel forceps resting on the top of the abdomen (the operator's right hand holds them, out of frame in close-ups) */
const forcepsItems = (B: Basis, tip: V3, lift: number): Item[] => {
  const dir = norm3([0.25, 1, 0.85]);
  const t0 = add3(tip, [0, 0, 0.25 + 9 * lift]);
  const side = norm3([1, -0.25, 0]);
  const it: Item[] = [];
  for (const s of [-1, 1]) {
    const a = add3(t0, mul3(side, s * 0.35));
    const m = add3(add3(t0, mul3(dir, 30)), mul3(side, s * 2.2));
    const b = add3(add3(t0, mul3(dir, 90)), mul3(side, s * 3.2));
    it.push(capsuleItem(B, a, m, 0.28, 0.75, '#B9C6CF', {spec: 1.2, key: `fp${s}a`}));
    it.push(capsuleItem(B, m, b, 0.75, 1.1, '#A9B7C1', {spec: 1.2, key: `fp${s}b`}));
  }
  return it;
};
// ------------------------------------------------------------------ the steadying hand (unused: at this scale a hand buries the specimen)
const SteadyHand: React.FC<{B: Basis; id: string; tip: V3; lift: number}> = ({B, id, tip, lift}) => {
  const T = proj(B, add3(tip, [0, 0, 6 * lift]));
  const sh = proj(B, add3(tip, [-30, 280, 60]));
  const L = 150 * T.s;
  const dir = {x: T.x - sh.x, y: T.y - sh.y};
  const l = Math.hypot(dir.x, dir.y) || 1;
  const d = {x: dir.x / l, y: dir.y / l};
  const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const pose: HandPose = {curl: [0.12, 0.72, 0.8, 0.86], spread: 0.15, thumb: 24, thumbCurl: 0.55};
  // place the wrist so the index fingertip (plus its rounded end) lands on the contact point
  const tip0 = digitTips({x: 0, y: 0}, ang, L, 1, pose).tips[0];
  const wrist = {x: T.x - tip0.x + d.x * L * 0.03, y: T.y - tip0.y + d.y * L * 0.03};
  const elbow = {x: wrist.x - d.x * L * 2.4, y: wrist.y - d.y * L * 2.4};
  const rW = L * 0.21;
  return (
    <Inked w={Math.max(3, L * 0.02)}>
      <Capsule id={`${id}-sl`} a={elbow} b={{x: wrist.x - d.x * L * 0.12, y: wrist.y - d.y * L * 0.12}} ra={rW * 1.45} rb={rW * 1.22} color={COAT} spec={0.3} />
      <Capsule id={`${id}-cf`} a={{x: wrist.x - d.x * L * 0.1, y: wrist.y - d.y * L * 0.1}} b={{x: wrist.x + d.x * L * 0.04, y: wrist.y + d.y * L * 0.04}} ra={rW * 1.02} rb={rW * 0.98} color={lit(GLOVE, 0.05)} spec={0.4} />
      <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={1} view="back" pose={pose} color={GLOVE} sheen={0.9} ink={Math.max(2, L * 0.016)} />
    </Inked>
  );
};

// ------------------------------------------------------------------ the scene
export const Lab3: React.FC<{t: number}> = ({t}) => {
  const cam = camLab3(t);
  const id = `L${Math.round(t * 30)}`;
  const {P, entry, tipAbove, hub, plunger, g} = rigAt3(t);
  const S2 = s2At(t);
  const blk = blockAt(t);
  const press = L_PRESS(t);
  const p1 = PULSE1(t), p2 = PULSE2(t), out = L_OUTFLOW(t);
  const pulse = t > 16.7 && p1 < 1.15 ? p1 : p2 > 0 && p2 < 1.15 ? p2 : out >= 0 ? 1 - out : undefined;
  const onPlat = Math.hypot(P.pos[0] - PLAT.c[0], P.pos[1] - PLAT.c[1]) < PLAT.half;
  const surfZ = Math.hypot(P.pos[0] - PAD_C[0], P.pos[1] - PAD_C[1]) < PAD_HALF ? PAD_Z : onPlat ? PLAT.top : Math.hypot(P.pos[0] - DISH.c[0], P.pos[1] - DISH.c[1]) < DISH.r ? DISH.floor : 0;
  const hgt = P.pos[2] - surfZ;
  const operator = t < CUT.needle;
  const steady = t >= CUT.needle && t < CUT.attach + 0.1;
  const pressHand = (t >= 16.25 && t < 17.25) || (t >= CUT.release && t < CUT.grip + 0.3);
  const fp = frontProps(t);
  return (
    <Scene
      id={id}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id={`${id}w`} wallY={1350} blur={clamp(proj(B, [0, 1350, 300]).s * 4, 0.5, 12)} />
          {operator && (
            <g filter={`url(#${id}ob)`}>
              <defs>
                <filter id={`${id}ob`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={1.2} />
                </filter>
              </defs>
              <Operator B={B} id={`${id}op`} hip={OP_HIP} press={g.thumb} pressAng={112} restR={FORCEPS_GRIP(t)} />
            </g>
          )}
          <BenchTop B={B} z={0} back={PAD_C[1] + 240} front={-700} />
          <g filter={`url(#${id}pb)`}>
            <defs>
              <filter id={`${id}pb`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={clamp(proj(B, [330, 220, 30]).s * 0.6, 0.6, 7).toFixed(2)} />
              </filter>
            </defs>
            <Items items={BACK_PROPS.flatMap((p, i) => propItems(B, p, `bp${i}`))} />
          </g>
        </>
      )}
      floor={(B) => (
        <>
          <Pad B={B} c={[PAD_C[0], PAD_C[1], PAD_Z]} half={PAD_HALF} th={PAD_Z} />
          <DishBack B={B} />
          <FlatShadow B={B} c={[PLAT.c[0] + 3, PLAT.c[1] + 3, 0]} rx={PLAT.half * 1.4} ry={PLAT.half * 1.2} alpha={0.25} />
          <FlatShadow B={B} c={[blk.c[0] + 0.3, blk.c[1] + 0.3, Math.hypot(blk.c[0] - DISH.c[0], blk.c[1] - DISH.c[1]) < DISH.r ? DISH.floor : 0]} rx={2.4 + 0.3 * clamp((blk.c[2] - BLOCK_H) / 6)} ry={2.2} alpha={0.42 * (1 - 0.6 * clamp((blk.c[2] - BLOCK_H) / 10))} yaw={blk.yaw} />
          {surfZ !== PLAT.top && <FlatShadow B={B} c={[P.pos[0] - 1.6, P.pos[1] + 0.6, surfZ]} rx={6 + 3.5 * clamp(P.e[0])} ry={4.8 + 2.6 * clamp(P.e[0])} alpha={0.3 * (1 - clamp((hgt - 4) / 22))} yaw={P.yaw} />}
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(riserItem(B));
        // the platform's mat and the shadows on it travel with the riser (drawn just after it)
        if (B.eye[2] >= PLAT.top) it.push({z: 1e6 - 1, el: <PlatTop key="pt" B={B} P={P} S2z={t > 25.9 ? 1 : 0} S2={S2} />});
        it.push(...spiderItems(B, P, LOOK_A, {id: `${id}g`, occlusion: true, otherBodies: t > 25.9 ? spiderBodies(S2) : []}));
        // the second spider is placed on its platform for the final experiment (kept out of earlier shots so the reveal holds)
        if (t > 25.9) it.push(...spiderItems(B, S2, LOOK_S2, {id: `${id}s`, occlusion: true, otherBodies: spiderBodies(P)}));
        it.push(...needle1Items(B, entry, tipAbove, L_GLUE(t)));
        it.push(...syringe1Items(B, hub, plunger, {air: press, pulse, needleTip: entry}));
        it.push(...standItems2(B, ROD, g.clampAt, BASE_DIR));
        it.push(...blockItems(B, blk.c, [BLOCK_H, BLOCK_H, BLOCK_H], blk.yaw));
        it.push(dishFrontItem(B));
        if (steady || operator) it.push(...forcepsItems(B, STEADY(t), STEADY_LIFT(t)));
        return it;
      }}
      over={(B) => (
        <>
          <AirGlow B={B} c={add3(P.pos, [0, 0, 0.3])} k={press * (t > 17.4 && t < 22.1 ? 1 : 0) * (t < 19.3 ? 1 : 0.6)} />
          {pressHand && (() => {
            const Tr = proj(B, g.thumb), N = proj(B, g.nozzle0);
            return <PressHand id={`${id}h`} rest={{x: Tr.x, y: Tr.y}} down={{x: N.x - Tr.x, y: N.y - Tr.y}} L={128 * Tr.s} lift={L_FINGER(t)} gap={0.058} />;
          })()}
          {fp.length > 0 && (
            <g filter={`url(#${id}fb)`}>
              <defs>
                <filter id={`${id}fb`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation={16} />
                </filter>
              </defs>
              <Items items={fp.flatMap((p, i) => propItems(B, p, `fp${i}`))} />
            </g>
          )}
        </>
      )}
    />
  );
};
/** he stands at the bench (hips just below its top), close enough that both elbows bend naturally */
const OP_HIP: V3 = [PAD_C[0] + 60, PAD_C[1] + 230, -60];
/** his right hand holds the forceps by their handle end */
const FORCEPS_GRIP = (t: number): V3 => add3(STEADY(t), mul3(norm3([0.25, 1, 0.85]), 84));
/** the dark mat on the final platform, with the gripper's and the second spider's shadows on it */
const PlatTop: React.FC<{B: Basis; P: ReturnType<typeof labPose>; S2z: number; S2: ReturnType<typeof s2At>}> = ({B, P, S2z, S2}) => {
  const lift = S2.pos[2] - s2At(0).pos[2];
  return (
    <g>
      <DarkMat B={B} c={PLAT.c} half={PLAT.half} z={PLAT.top} />
      {S2z > 0 && <FlatShadow B={B} c={[S2.pos[0] - 1.4, S2.pos[1] + 0.4, PLAT.top]} rx={5.6 + 0.4 * clamp(lift / 5)} ry={4.4} alpha={0.55 * (1 - 0.6 * clamp(lift / 8))} yaw={S2.yaw} />}
      {Math.hypot(P.pos[0] - PLAT.c[0], P.pos[1] - PLAT.c[1]) < PLAT.half && <FlatShadow B={B} c={[P.pos[0] - 1.6, P.pos[1] + 0.6, PLAT.top]} rx={7 + 3 * clamp(P.e[0])} ry={5.5 + 2 * clamp(P.e[0])} alpha={0.4 * (1 - clamp((P.pos[2] - PLAT.top - 4) / 20))} yaw={P.yaw} />}
    </g>
  );
};
const AirGlow: React.FC<{B: Basis; c: V3; k: number}> = ({B, c, k}) => {
  if (k < 0.02) return null;
  const q = proj(B, c);
  return (
    <g opacity={0.5 * k}>
      <defs>
        <radialGradient id="airg3">
          <stop offset="0" stopColor={AIR_C} stopOpacity={0.9} />
          <stop offset="1" stopColor={AIR_C} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} rx={(2.6 * q.s).toFixed(1)} ry={(1.9 * q.s).toFixed(1)} fill="url(#airg3)" />
    </g>
  );
};
void MAT_Z;

void SteadyHand;
