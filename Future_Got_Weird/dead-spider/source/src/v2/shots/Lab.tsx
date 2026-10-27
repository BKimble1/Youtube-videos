// The lab (13.48 - 30.20): one bench, one claw stand, one specimen; every shot samples the same state (world2).
//  C1 13.48  wide: the operator, the stand, the syringe coming down the rod toward the curled spider on its pad; the
//            camera pushes in from the room to the needle ("So scientists attached a syringe")
//  C2 14.90  macro side view: the needle tip touches the carapace and goes into the middle of the front body section
//            ("to a dead spider"), a glue bead seals it, the arm lifts the spider off the pad on the needle
//  C3 16.47  one continuous move: the gloved finger pushes the plunger ("pumped air"), the camera rides the pale air
//            pulse down the barrel, hub and needle into the spider; the legs stir as the first air arrives, then a
//            second push and they spring open together ("suddenly spread OPEN"); the arm starts swinging to the block
//  D1 20.11  close on the plunger: the finger lifts off and the air pushes the plunger back up ("released the pressure")
//  D2 21.60  three-quarter view: the open legs stand round the test block; they clamp shut on it ("CLAMPED SHUT")
//            and the arm starts to lift: the block comes up off the bench in their grip
//  CL 23.39  the working claw: the stand lifts and swings the block over a glass dish; air in, the legs open and the
//            block drops into the dish ("working claw"); the arm swings on
//  R1 26.19  the open gripper hangs from the syringe over a second, smaller and paler dead spider on its own pad, and
//            comes down over it ("used it to pick up")
//  R2 28.00  tight: the air is let out and the legs close round the second spider ("ANOTHER"), and the stand lifts
//            both off the pad; the shot ends on them in mid-air
import React from 'react';
import {BenchTop, blockItems, FlatShadow, LabWallFar, Pad} from '../../apparatus';
import {INK} from '../../dc/ink';
import {inkW, Item} from '../../draw3';
import {clamp, keyS, ss, ss5} from '../../lib';
import {LOOK_A, LOOK_B, spiderItems} from '../../SpiderDraw';
import {add3, Basis, Cam3, lerp3, lerpOrbit, Orbit, orbitCam, P2, proj, projPoly, sub3, V3} from '../../three';
import {PressHand, Scene} from '../../shots/common';
import {Operator} from '../../shots/Operator';
import {AIR_C, along, hubTopOf, needle1Items, pulsePath, standItems2, syr1, syringe1Items} from '../claw';
import {BLOCK_H, blockAt, CUT, DISH, entryOf, L_FINGER, L_GLUE, L_NEEDLE, L_PLUNGER, L_POS, L_PRESS, L_Z, labPose, PAD_HALF, PAD_Z, PHI, ROD, S2_PAD, s2At, station, TM} from '../world2';

const PAD_C = station(PHI.pad);
const S2_C = station(PHI.s2);
const BASE_DIR = -74;

/** the syringe and needle state at time t */
export const rigAt = (t: number) => {
  const P = labPose(t);
  const entry = entryOf(P);
  const tipAbove = L_NEEDLE(t);
  const hub = hubTopOf(entry, tipAbove);
  const plunger = L_PLUNGER(t);
  return {P, entry, tipAbove, hub, plunger, g: syr1(hub, plunger)};
};
/** the first air pulse (C3) and the second, quick one */
const PULSE1 = (t: number) => (t - 16.72) / 0.9;
const PULSE2 = (t: number) => (t - 18.55) / 0.2;

// ------------------------------------------------------------------ cameras
const C1a: Orbit = {target: [PAD_C[0] + 40, PAD_C[1] + 100, 235], az: -16, el: 7, d: 820, f: 1500, cy: 900};
const C1b: Orbit = {...C1a, target: [PAD_C[0] + 25, PAD_C[1] + 70, 205], az: -11, el: 8, d: 700};
const C2a = (t: number): Orbit => ({target: add3(rigAt(Math.min(t, 15.6)).P.pos, [-1.2, 0, 1.5 + 0.6 * (L_Z(t) - L_Z(15.6))]), az: 98, el: 44, d: 42, f: 2000, cy: 1060});
const C3top = (t: number): Orbit => ({target: add3(rigAt(t).g.thumb, [0, 0, -20]), az: 42, el: 18, d: 100, f: 2000, cy: 940});
const C3low: Orbit = {target: [0, 0, 0], az: 56, el: 8, d: 46, f: 2000, cy: 1000};
const lowAt = (t: number, d = 46): Orbit => ({...C3low, d, target: add3(L_POS(t), [-1.4, 0, -0.8])});
const D1o = (t: number): Orbit => ({target: add3(rigAt(t).g.thumb, [0, 0, -22]), az: -14, el: 28, d: 110, f: 2000, cy: 800});
const D2o = (t: number): Orbit => {
  const b = blockAt(t).c;
  return {target: [b[0] - 0.5, b[1], 4.6 + 0.6 * (b[2] - BLOCK_H)], az: 32, el: 11, d: 44 - 3 * ss5(t, CUT.clamp, CUT.claw), f: 1750, cy: 1040};
};
const CLo = (t: number): Orbit => {
  // tracks the carried block to the dish, then holds on the dish while the arm swings away
  const p = L_POS(Math.min(t, 25.7));
  return {target: [p[0] - 2, p[1], p[2] + 7], az: -8, el: 14, d: 76, f: 2000, cy: 940};
};
const R1o: Orbit = {target: [S2_C[0] - 2, S2_C[1], 14], az: 40, el: 17, d: 96, f: 2000, cy: 980};
const R1b: Orbit = {...R1o, d: 80, target: [S2_C[0] - 2, S2_C[1], 9]};
const R2o = (t: number): Orbit => ({target: [S2_C[0] - 1.2, S2_C[1], 5.2 + 0.75 * (L_Z(t) - L_Z(CUT.tight))], az: 55, el: 10 + 34 * ss5(t, 28.8, CUT.end), d: 50 - 4 * ss5(t, 28.6, CUT.end), f: 1800, cy: 1000});

export const camLab = (t: number): Cam3 => {
  if (t < CUT.needle) return orbitCam(lerpOrbit(C1a, C1b, ss5(t, CUT.lab, CUT.needle + 0.4)));
  if (t < CUT.plunger) return orbitCam(C2a(t));
  if (t < CUT.release) {
    const p0 = 16.7, p1 = 17.62, s1 = 18.15;
    if (t < p0) return orbitCam(C3top(t));
    if (t < s1) {
      // ride the air pulse down: aim at the pulse, close in and drop the camera toward the spider's level
      const r = rigAt(t);
      const pul = along(pulsePath(r.hub, r.plunger, r.entry), Math.min(1, PULSE1(t)));
      const u = ss5(t, p0, s1);
      const top = C3top(p0);
      // the distance eases out a little while it follows the air (so the frame never whips) and closes in on the spider
      const d = keyS(t, [[p0, top.d], [17.12, 140], [p1, 96], [s1, 46]]);
      const ride: Orbit = {...top, target: lerp3(lerp3(add3(r.g.thumb, [0, 0, -20]), pul, ss5(t, p0, p0 + 0.35)), add3(L_POS(t), [-1.4, 0, -0.8]), ss5(t, p1 - 0.2, s1)), az: 42 + 14 * u, el: 18 - 10 * u, d, f: 2000, cy: 900 + 100 * u};
      return orbitCam(ride);
    }
    return orbitCam(lowAt(t, 46 - 3 * ss5(t, s1, TM.open + 0.3)));
  }
  if (t < CUT.clamp) return orbitCam(D1o(t));
  if (t < CUT.claw) return orbitCam(D2o(t));
  if (t < CUT.reveal) return orbitCam(CLo(t));
  if (t < CUT.tight) return orbitCam(lerpOrbit(R1o, R1b, ss5(t, CUT.reveal, CUT.tight)));
  return orbitCam(R2o(t));
};

// ------------------------------------------------------------------ the dish (a glass petri dish on the bench)
const ring = (c: V3, r: number, z: number, a0: number, a1: number, n = 24): V3[] => Array.from({length: n + 1}, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z];
});
const dishFacing = (B: Basis) => Math.atan2(B.eye[1] - DISH.c[1], B.eye[0] - DISH.c[0]);
const DishBack: React.FC<{B: Basis}> = ({B}) => {
  const f = dishFacing(B);
  const floor = projPoly(B, ring(DISH.c, DISH.r, DISH.floor, 0, Math.PI * 2, 48));
  const back = [...ring(DISH.c, DISH.r, 0, f + Math.PI / 2, f + Math.PI * 1.5), ...ring(DISH.c, DISH.r, DISH.rim, f + Math.PI * 1.5, f + Math.PI / 2)];
  const s = proj(B, DISH.c).s;
  return (
    <g>
      <path d={projPoly(B, ring(DISH.c, DISH.r + 1.5, 0, 0, Math.PI * 2, 48))} fill="#1E2A31" opacity={0.18} />
      <path d={projPoly(B, back)} fill="#DCEFF6" opacity={0.45} stroke={INK} strokeWidth={inkW(s * 0.5)} strokeLinejoin="round" />
      <path d={floor} fill="#E8F4F8" opacity={0.75} stroke="#9FB8C4" strokeWidth={1.2} />
    </g>
  );
};
const dishFrontItem = (B: Basis): Item => {
  const f = dishFacing(B);
  const pts = [...ring(DISH.c, DISH.r, 0, f - Math.PI / 2, f + Math.PI / 2), ...ring(DISH.c, DISH.r, DISH.rim, f + Math.PI / 2, f - Math.PI / 2)];
  const rimTop = ring(DISH.c, DISH.r, DISH.rim, f - Math.PI / 2, f + Math.PI / 2).map((p) => proj(B, p));
  const front = proj(B, [DISH.c[0] + DISH.r * Math.cos(f), DISH.c[1] + DISH.r * Math.sin(f), DISH.rim / 2]);
  const s = front.s;
  return {
    z: front.z,
    el: (
      <g key="dishf">
        <path d={projPoly(B, pts)} fill="#DCEFF6" opacity={0.32} stroke={INK} strokeWidth={inkW(s * 0.5)} strokeLinejoin="round" />
        <path d={`M${rimTop.map(P2).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.5, 0.35 * s)} opacity={0.8} strokeLinecap="round" />
      </g>
    ),
  };
};

// ------------------------------------------------------------------ the scene
export const LabScene: React.FC<{t: number; cam: Cam3; id: string; operator?: boolean; hand?: boolean}> = ({t, cam, id, operator, hand}) => {
  const {P, entry, tipAbove, hub, plunger, g} = rigAt(t);
  const S2 = s2At(t);
  const blk = blockAt(t);
  const press = L_PRESS(t);
  const p1 = PULSE1(t), p2 = PULSE2(t);
  const pulse = t > 16.7 && p1 < 1.15 ? p1 : p2 > 0 && p2 < 1.15 ? p2 : undefined;
  const surfZ = Math.hypot(P.pos[0] - PAD_C[0], P.pos[1] - PAD_C[1]) < PAD_HALF ? PAD_Z : Math.hypot(P.pos[0] - S2_C[0], P.pos[1] - S2_C[1]) < S2_PAD ? PAD_Z : Math.hypot(P.pos[0] - DISH.c[0], P.pos[1] - DISH.c[1]) < DISH.r ? DISH.floor : 0;
  const hgt = P.pos[2] - surfZ;
  return (
    <Scene
      id={id}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id={`${id}w`} wallY={1350} blur={clamp(proj(B, [0, 1350, 300]).s * 4, 0.5, 12)} />
          {operator && (
            <g filter={opBlur(B) > 0.3 ? `url(#${id}ob)` : undefined}>
              <defs>
                <filter id={`${id}ob`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={opBlur(B).toFixed(2)} />
                </filter>
              </defs>
              <Operator B={B} id={`${id}op`} hip={OP_HIP} press={g.thumb} pressAng={112} restR={[PAD_C[0] + 150, PAD_C[1] + 200, 4]} />
            </g>
          )}
          <BenchTop B={B} z={0} back={BENCH_BACK2} front={-700} />
        </>
      )}
      floor={(B) => (
        <>
          <Pad B={B} c={[PAD_C[0], PAD_C[1], PAD_Z]} half={PAD_HALF} th={PAD_Z} />
          <Pad B={B} c={[S2_C[0], S2_C[1], PAD_Z]} half={S2_PAD} th={PAD_Z} />
          <DishBack B={B} />
          <FlatShadow B={B} c={[blk.c[0] + 0.3, blk.c[1] + 0.3, blk.c[2] > 6 && Math.hypot(blk.c[0] - DISH.c[0], blk.c[1] - DISH.c[1]) < DISH.r ? DISH.floor : surfAt(blk.c)]} rx={2.4 + 0.3 * clamp((blk.c[2] - BLOCK_H) / 6)} ry={2.2} alpha={0.42 * (1 - 0.6 * clamp((blk.c[2] - BLOCK_H - surfAt(blk.c)) / 10))} yaw={blk.yaw} />
          <FlatShadow B={B} c={[S2.pos[0] - 1.4, S2.pos[1] + 0.4, PAD_Z]} rx={5.4} ry={4.2} alpha={0.3 * (1 - 0.6 * clamp((S2.pos[2] - S2_REST_Z) / 8))} yaw={S2.yaw} />
          <FlatShadow B={B} c={[P.pos[0] - 1.6, P.pos[1] + 0.6, surfZ]} rx={6 + 3.5 * clamp(P.e[0])} ry={4.8 + 2.6 * clamp(P.e[0])} alpha={0.3 * (1 - clamp((hgt - 4) / 22))} yaw={P.yaw} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: `${id}g`}));
        it.push(...spiderItems(B, S2, LOOK_B, {id: `${id}s`}));
        it.push(...needle1Items(B, entry, tipAbove, L_GLUE(t)));
        it.push(...syringe1Items(B, hub, plunger, {air: press, pulse, needleTip: entry}));
        it.push(...standItems2(B, ROD, g.clampAt, BASE_DIR));
        it.push(...blockItems(B, blk.c, [BLOCK_H, BLOCK_H, BLOCK_H], blk.yaw));
        it.push(dishFrontItem(B));
        return it;
      }}
      over={(B) => (
        <>
          <AirGlow B={B} c={toProsoma(P)} k={press * (1 - ss(t, 19.3, 20.4)) * (t > 17.4 && t < 20.5 ? 1 : 0)} />
          {hand && (() => {
            const Tr = proj(B, g.thumb), N = proj(B, g.nozzle0);
            return <PressHand id={`${id}h`} rest={{x: Tr.x, y: Tr.y}} down={{x: N.x - Tr.x, y: N.y - Tr.y}} L={128 * Tr.s} lift={L_FINGER(t)} gap={0.058} />;
          })()}
        </>
      )}
    />
  );
};
const S2_REST_Z = s2At(0).pos[2];
const BENCH_BACK2 = PAD_C[1] + 240;
const OP_HIP: V3 = [PAD_C[0] + 75, PAD_C[1] + 300, 40];
/** depth of field: the operator softens as the camera closes in on the specimen */
const opBlur = (B: Basis) => clamp((proj(B, PAD_C).s / Math.max(0.05, proj(B, OP_HIP).s) - 1.6) / 1.2, 0, 1) * 9;
const surfAt = (c: V3) => (Math.hypot(c[0] - PAD_C[0], c[1] - PAD_C[1]) < PAD_HALF ? PAD_Z : 0);
const toProsoma = (P: ReturnType<typeof labPose>) => add3(P.pos, [0, 0, 0.3]);
/** the air arriving inside the front body section: a faint pale glow on the carapace, nothing more */
const AirGlow: React.FC<{B: Basis; c: V3; k: number}> = ({B, c, k}) => {
  if (k < 0.02) return null;
  const q = proj(B, c);
  return (
    <g opacity={0.5 * k}>
      <defs>
        <radialGradient id="airg">
          <stop offset="0" stopColor={AIR_C} stopOpacity={0.9} />
          <stop offset="1" stopColor={AIR_C} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} rx={(2.6 * q.s).toFixed(1)} ry={(1.9 * q.s).toFixed(1)} fill="url(#airg)" />
    </g>
  );
};

export const Lab: React.FC<{t: number}> = ({t}) => {
  const cam = camLab(t);
  const wide = t < CUT.needle;
  const hand = (t >= CUT.plunger && t < 17.2) || (t >= CUT.release && t < CUT.clamp);
  return <LabScene t={t} cam={cam} id={`L${Math.round(t * 30)}`} operator={wide} hand={hand} />;
};
void sub3;
