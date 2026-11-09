// The Weird Crew prison guard and his coffee (Robot Escapes Jail). A small, round, sleepy, lovable guard: navy peaked
// cap with a black visor and a gold cap badge, blue short-sleeved uniform shirt with a gold chest badge, dark
// trousers, black shoes, a bushy moustache. 3/4 view facing screen-LEFT (toward the cell), like the crew's Man rig
// (art/guardRig.tsx is the modified copy of dc/Man.tsx). About 24 world units tall (the robot is 10 u).
//
// Everything is a pure function of (t, act): breathing, eye darts, blinks and small posture shifts run on t; the
// expression and the big poses come from `act` (GuardAct), which a shot keys over time.
import React from 'react';
import {uid} from '../core/ids';
import {hash, noise1} from '../lib';
import {HandPose, mixHand} from '../dc/Hand';
import {add, mul, V} from '../dc/math';
import {SoftShadow} from '../dc/shade';
import {GDIM, GExpr, GPose, guardJoints, GuardMan, G_SOLE} from './guardRig';
import {CoffeeCup, CUP} from './cup';

export type GuardAct = {
  /** -1 looking far left (into the cell) .. 0 at camera .. 1 right */
  look: number;
  /** 0..1 head tilts down to his feet */
  lookDown: number;
  /** 0..1 jaw drop, eyes wide, brows up, body recoils back slightly */
  shock: number;
  /** 0..1 frozen disbelief: blank wide eyes, slack jaw */
  stare: number;
  /** 0..1 cup raised to mouth */
  sip: number;
  /** 0..1 cup visible in hand (0 = hand empty after dropping it; an empty hand relaxes down to his side unless he is
   *  frozen in shock / stare / drop) */
  holdCup: number;
  /** 0..1 near hand scratches the back of his head under the cap (confused) */
  scratch: number;
  blink: number;
  /** breathing phase offset (radians); breathing also runs on t by itself */
  breath: number;
  /** 0..1 the instant-reaction pose of dropping the cup: fingers open, hand jerks up */
  drop: number;
};

export const GUARD_IDLE: GuardAct = {look: -0.35, lookDown: 0, shock: 0, stare: 0, sip: 0, holdCup: 1, scratch: 0, blink: 0, breath: 0, drop: 0};

export const mixAct = (a: GuardAct, b: GuardAct, u: number): GuardAct => {
  const o = {} as GuardAct;
  (Object.keys(a) as (keyof GuardAct)[]).forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * u));
  return o;
};

// ---------------------------------------------------------------------------------------------------------------
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const ss = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const rad = (d: number) => (d * Math.PI) / 180;

/** total height of the idle figure, sole to cap top, in rig units (measured from the rig: see RIG_H below) */
const CAP_TOP = 146; // head-local cap top above the head centre (head radius 100)

// feet (rig units from the point between his feet on the floor): near = his LEFT foot (screen-right, a little nearer
// the camera so lower on screen), far = his right foot
const NEAR_ANK: V = {x: 54, y: 6 - G_SOLE};
const FAR_ANK: V = {x: -4, y: -6 - G_SOLE};
const FOOT_MID = -32; // sole centre relative to the ankle along the foot (toes point screen-left)

// hand poses
const H_GRIP: HandPose = {curl: [0.62, 0.68, 0.72, 0.76], spread: 0.1, thumb: 30, thumbCurl: 0.35};
const H_OPEN: HandPose = {curl: [0.02, 0.0, 0.04, 0.08], spread: 1.0, thumb: 62, thumbCurl: 0.02};
const H_EMPTY: HandPose = {curl: [0.3, 0.36, 0.42, 0.48], spread: 0.3, thumb: 20, thumbCurl: 0.4};
const H_SCRATCH: HandPose = {curl: [0.55, 0.6, 0.64, 0.7], spread: 0.2, thumb: 26, thumbCurl: 0.4};
const H_HANG: HandPose = {curl: [0.32, 0.4, 0.46, 0.52], spread: 0.25, thumb: 16, thumbCurl: 0.45};

/** where along the hand axis (fraction of the hand length) the cup's centre sits in the grip */
const GRIP_U = 0.4;

// the near hand's grip point (cup centre) targets in upper-torso space (u up the spine from the shoulder line,
// v toward his back), with the hand's absolute screen angle (deg)
type Grip = {u: number; v: number; a: number};
const G_HOLD: Grip = {u: -196, v: -150, a: 184};
const G_SIP: Grip = {u: 36, v: -106, a: 228};
const G_DROP: Grip = {u: -150, v: -186, a: 214};
const G_SCRATCH: Grip = {u: 168, v: 74, a: 246};
const G_REST: Grip = {u: -380, v: 52, a: 93};

// expressions
const E_BASE: GExpr = {browIn: 0.15, browDown: 0.12, browUp: 0, lid: 0.44, squint: 0.06, shut: 0, pupil: 1, eyeK: 1, open: 0, wide: 0.9, smile: 0.18, teeth: 0, tongue: 0, gx: 0, gy: 0, sweat: 0, flush: 0.15, capLift: 0, capTilt: 0, pitch: 0, droop: 0.1};
const E_SIP: Partial<GExpr> = {lid: 0.66, squint: 0.3, smile: 0.3, browIn: 0.05, browDown: 0.05};
const E_SHOCK: Partial<GExpr> = {browIn: 0.45, browDown: 0, browUp: 1, lid: 0, squint: 0, pupil: 0.52, eyeK: 1.28, open: 0.9, wide: 0.72, smile: -0.35, teeth: 0.25, capLift: 18, capTilt: -5, droop: -0.35, flush: 0.35, sweat: 0.6};
const E_STARE: Partial<GExpr> = {browIn: 0.2, browDown: 0, browUp: 0.55, lid: 0.02, squint: 0, pupil: 0.4, eyeK: 1.16, open: 0.42, wide: 0.62, smile: -0.4, teeth: 0, capLift: 3, capTilt: 0, droop: 0.65, flush: 0.1};
const E_SCRATCH: Partial<GExpr> = {browIn: 0.85, browDown: 0.25, browUp: 0, lid: 0.3, squint: 0.15, open: 0.06, wide: 0.7, smile: -0.3, capTilt: 7, gy: -0.45};
const mixE = (a: GExpr, b: Partial<GExpr>, u: number): GExpr => {
  if (u <= 0) return a;
  const o = {...a};
  (Object.keys(b) as (keyof GExpr)[]).forEach((k) => (o[k] = lerp(a[k], b[k] as number, u)));
  return o;
};

/** the automatic life on t: blinks, eye darts, posture sway, breathing */
const life = (t: number, act: GuardAct) => {
  const frozen = clamp(act.stare + act.shock * 0.8);
  // blinks: one every ~2.6-4.2 s, jittered per cycle; occasionally a double blink
  const per = 3.3;
  const cyc = Math.floor(t / per);
  const at = cyc * per + per * (0.25 + 0.55 * hash(cyc + 5));
  const bl = (tb: number) => {
    const d = (t - tb) / 0.075;
    return d > -1 && d < 1 ? 1 - Math.abs(d) : 0;
  };
  let blink = bl(at + 0.04);
  if (hash(cyc + 31) > 0.7) blink = Math.max(blink, bl(at + 0.3));
  blink = Math.min(1, blink * 1.6) * (1 - frozen);
  // eye darts: hold a target, snap to the next one in ~70 ms (saccades)
  const dper = 1.15;
  const dc = Math.floor(t / dper + 0.37);
  const dk = ss((t / dper + 0.37 - dc) / 0.06);
  const tgt = (n: number) => ({x: (hash(n * 3 + 1) * 2 - 1) * 0.22, y: (hash(n * 3 + 2) * 2 - 1) * 0.14});
  const g0 = tgt(dc - 1), g1 = tgt(dc);
  const dart = {x: lerp(g0.x, g1.x, dk) * (1 - frozen), y: lerp(g0.y, g1.y, dk) * (1 - frozen)};
  const ph = act.breath + t * 1.65;
  const sway = noise1(t * 0.28, 3) * (1 - 0.6 * frozen);
  const shift = noise1(t * 0.19, 7) * (1 - 0.6 * frozen);
  const nod = noise1(t * 0.43, 11) * (1 - frozen);
  return {blink, dart, breath: Math.sin(ph), sway, shift, nod};
};

/** rig scale (rig units -> px) for s px per world unit: the figure is GUARD_H world units tall */
export const GUARD_H = 24;
const rigS = (s: number) => (s * GUARD_H) / RIG_H;

const scratchWiggle = (t: number) => Math.sin(t * Math.PI * 2 * 3.2);

/** the whole pose for (x, y, s, act, t) */
const solve = (x: number, y: number, s: number, act: GuardAct, t: number) => {
  const L = life(t, act);
  const rs = rigS(s);
  const shock = clamp(act.shock), stare = clamp(act.stare), sip = clamp(act.sip), drop = clamp(act.drop), scratch = clamp(act.scratch);
  const down = clamp(act.lookDown), look = clamp(act.look, -1, 1);
  // body
  const torso = -2.5 + L.sway * 1.1 - shock * 7 + stare * 1.5 + down * 2.5 - sip * 2;
  const chest = 1 + L.breath * 0.7 - shock * 3 + stare * 3.5 + down * 4 - sip * 2.5;
  const turn = look < 0 ? lerp(0.32, 0.86, -look) : lerp(0.32, 0.06, look);
  const neck = -1 + L.nod * 1.5 + down * 17 + stare * 2 - shock * 3 - sip * 7 + (look < 0 ? -look * 2 : 0) + scratch * 4;
  const hx = x + (16 + L.shift * 3 + shock * 12 - stare * 2) * rs;
  const hy = y - (G_SOLE + (GDIM.thigh + GDIM.shin) * 0.975 + 46 - L.breath * 1.2 + stare * 5 - shock * 2) * rs;
  // near hand grip point
  let g: Grip = {...G_HOLD};
  const mg = (b: Grip, u: number) => {
    g = {u: lerp(g.u, b.u, u), v: lerp(g.v, b.v, u), a: lerp(g.a, b.a, u)};
  };
  mg(G_SIP, ss(sip));
  mg({u: G_HOLD.u + 6, v: G_HOLD.v + 16, a: G_HOLD.a - 6}, stare * (1 - sip)); // slumps a little
  // an empty near hand relaxes down to his side unless he is frozen in the take / stare (no hovering 'invisible cup')
  const relax = ss((1 - clamp(act.holdCup)) * (1 - Math.max(stare, shock, drop)));
  // (the hand slides back to his side a little ahead of dropping, so a part-relaxed arm hangs rather than reaching
  // forward with the elbow jutting out behind him)
  g = {u: lerp(g.u, G_REST.u, relax), v: lerp(g.v, G_REST.v, Math.pow(relax, 0.55)), a: lerp(g.a, G_REST.a, relax)};
  mg(G_DROP, drop);
  mg(G_SCRATCH, ss(scratch));
  // on the way up the hand swings round the back of his shoulder (never across his face)
  const arc = Math.sin(Math.PI * ss(scratch));
  g.v += arc * 120;
  g.u -= arc * 30;
  g.u += scratch * scratchWiggle(t) * 7 + L.breath * 2;
  g.v += scratch * scratchWiggle(t + 0.08) * 4;
  const tc = torso + chest;
  // convert the grip point to a wrist target: back along the hand axis by GRIP_U of the hand length (+ the wrist inset)
  const dir = {x: Math.cos(rad(g.a)), y: Math.sin(rad(g.a))};
  const off = mul(dir, GDIM.hand * GRIP_U - 6);
  const upv = {x: -Math.sin(rad(tc)), y: -Math.cos(rad(tc))};
  const pxv = {x: Math.cos(rad(tc)), y: -Math.sin(rad(tc))};
  const lTu = g.u - (off.x * upv.x + off.y * upv.y);
  const lTv = g.v - (off.x * pxv.x + off.y * pxv.y);
  // far arm: hangs at his side; flung up and out in the shock take; limp in the stare
  // (the hand swings forward first, then up: no elbow hiked up with the hand hanging below it mid-way)
  const rTu = lerp(-280, 110, Math.pow(shock, 1.6)) - stare * 14;
  const rTv = lerp(-40, -215, Math.sqrt(shock)) - stare * 4;
  const pose: GPose = {
    x: hx,
    y: hy,
    s: rs,
    torso,
    chest,
    neck,
    turn,
    pelvis: torso * 0.4,
    lTu,
    lTv,
    // relaxing: the elbow swings out toward the camera (foreshortened) rather than jutting out behind his back
    lElb: lerp(lerp(-1, -0.35, relax), 1, ss((scratch - 0.15) / 0.5)),
    lWr: 0,
    lAbs: g.a,
    lAbsW: 1,
    rTu,
    rTv,
    rElb: -1,
    rWr: 0,
    rAbs: lerp(118, 238, shock),
    rAbsW: lerp(0.5, 1, shock),
    lHip: 0,
    lKnee: 0,
    lAnk: 0,
    rHip: 0,
    rKnee: 0,
    rAnk: 0,
    breath: L.breath,
    lAx: x + NEAR_ANK.x * rs,
    lAy: y + NEAR_ANK.y * rs,
    rAx: x + FAR_ANK.x * rs,
    rAy: y + FAR_ANK.y * rs,
  };
  // expression
  let e: GExpr = {...E_BASE};
  e = mixE(e, E_SIP, ss(sip));
  e = mixE(e, E_SCRATCH, ss(scratch));
  e = mixE(e, E_STARE, stare);
  e = mixE(e, E_SHOCK, shock);
  // gaze: where he looks plus the darts; looking down lowers the gaze and the lids
  const gLook = look < 0 ? -0.9 * -look : 0.85 * look;
  e.gx = clamp(gLook + L.dart.x * (1 - sip * 0.5), -1, 1);
  e.gy = clamp(e.gy + L.dart.y + down * 0.95 - shock * 0.1, -1, 1);
  e.pitch = down;
  e.lid = clamp(e.lid + down * 0.22 * (1 - shock));
  const blink = Math.max(clamp(act.blink), L.blink * (1 - sip * 0.6));
  // hands
  let lHand = mixHand(H_EMPTY, H_GRIP, clamp(act.holdCup));
  lHand = mixHand(lHand, H_HANG, relax);
  lHand = mixHand(lHand, H_OPEN, drop);
  lHand = mixHand(lHand, H_SCRATCH, ss(scratch));
  if (scratch > 0) {
    const w = scratchWiggle(t * 1.3) * 0.18 * scratch;
    lHand = {...lHand, curl: lHand.curl.map((c, i) => clamp(c + w * (i % 2 ? 1 : -1) + w)) as HandPose['curl']};
  }
  const rHand = mixHand(H_HANG, {...H_OPEN, thumb: 34, thumbCurl: 0.2}, shock);
  return {pose, e, blink, lHand, rHand, rs, scratch, relax};
};

// rig height: measured once from the idle pose at s = 1 (sole bottom at y = 0 to the cap top)
const RIG_H = (() => {
  // a provisional solve with rig scale 1 (s chosen so that rigS(s) would be 1 is circular, so measure directly)
  const j = guardJoints({
    x: 0, y: -(G_SOLE + (GDIM.thigh + GDIM.shin) * 0.975 + 46), s: 1, torso: -2.5, chest: 1, neck: -1, turn: 0.5, pelvis: -1,
    lTu: -200, lTv: -100, lElb: 1, lWr: 0, lAbs: 180, lAbsW: 0, rTu: -290, rTv: -90, rElb: 1, rWr: 0, rAbs: 0, rAbsW: 0,
    lHip: 0, lKnee: 0, lAnk: 0, rHip: 0, rKnee: 0, rAnk: 0, breath: 0, lAx: 54, lAy: 6 - G_SOLE, rAx: -4, rAy: -6 - G_SOLE,
  });
  return -(j.head.y - (CAP_TOP * GDIM.headR) / 100);
})();

/** the near hand's grip -> cup centre and angle for a solved pose */
const cupFrom = (sol: ReturnType<typeof solve>) => {
  const j = guardJoints(sol.pose);
  const A = j.L;
  const wrist = add(A.W, mul(A.foreDir, -6 * sol.rs));
  const dir = {x: Math.cos(rad(A.handAng)), y: Math.sin(rad(A.handAng))};
  const c = add(wrist, mul(dir, GDIM.hand * sol.rs * GRIP_U));
  // nudge toward the palm's middle (thumb side is up for this hand)
  const n = {x: -dir.y, y: dir.x};
  const cc = add(c, mul(n, 4 * sol.rs));
  return {x: cc.x, y: cc.y, ang: A.handAng - 180};
};

/** where the cup is (screen px, its centre) in his hand for a given act, and its rotation (deg). Pass the same t as
 *  the <Guard> for an exact match (the breathing and posture sway move the hand a few px). */
export const guardCupHand = (x: number, y: number, s: number, act: GuardAct, t = 0): {x: number; y: number; ang: number} => cupFrom(solve(x, y, s, act, t));

/** his feet (screen px, the middle of each sole on the floor): l = his left foot (the near one, screen-right),
 *  r = his right foot (far, screen-left) */
export const guardFeet = (x: number, y: number, s: number) => {
  const rs = rigS(s);
  return {
    l: {x: x + (NEAR_ANK.x + FOOT_MID) * rs, y: y + (NEAR_ANK.y + G_SOLE) * rs},
    r: {x: x + (FAR_ANK.x + FOOT_MID) * rs, y: y + (FAR_ANK.y + G_SOLE) * rs},
  };
};

/** screen px of the top of his cap and of his head centre (for framing / reaction cues) */
export const guardHead = (x: number, y: number, s: number, act: GuardAct = GUARD_IDLE, t = 0) => {
  const sol = solve(x, y, s, act, t);
  const j = guardJoints(sol.pose);
  return {x: j.head.x, y: j.head.y, r: GDIM.headR * sol.rs, top: j.head.y - CAP_TOP * GDIM.headR * sol.rs / 100};
};

type GuardProps = {
  /** screen px of the point between his feet on the floor */
  x: number;
  y: number;
  /** px per world unit (he is 24 u tall) */
  s: number;
  t: number;
  act: GuardAct;
  id?: string;
  /** draw his soft contact shadow on the floor (default true) */
  shadow?: boolean;
};

export const Guard: React.FC<GuardProps> = ({x, y, s, t, act, id, shadow = true}) => {
  const gid = id ?? uid('guard');
  const sol = solve(x, y, s, act, t);
  const rs = sol.rs;
  // ink: a near-constant on-screen contour (about 2-2.6 px) whatever the size
  const inkK = (1.5 + 1.1 * rs) / (2.52 * rs);
  const hold = clamp(act.holdCup);
  const cup = cupFrom(sol);
  const sipK = clamp(act.sip);
  return (
    <g>
      {shadow && (
        <SoftShadow id={`${gid}-sh`} c={{x: x + 4 * rs, y: y + 2 * rs}} rx={150 * rs} ry={26 * rs} alpha={0.42} color="#050A14" />
      )}
      <GuardMan
        id={gid}
        pose={sol.pose}
        expr={sol.e}
        blink={sol.blink}
        lHand={sol.lHand}
        rHand={sol.rHand}
        inkK={inkK}
        capOverHand={sol.scratch > 0.5}
        nearHold={hold > 0.01 ? (
          <g opacity={Math.min(1, hold * 2)}>
            <CoffeeCup x={cup.x} y={cup.y} s={s} rot={cup.ang} steam={(1 - sipK) * (1 - clamp(act.shock + act.drop))} t={t} />
          </g>
        ) : null}
      />
    </g>
  );
};

/** the cup's size in px for s (for the film's falling-cup handoff) */
export const guardCupSize = (s: number) => ({h: CUP.h * s, w: CUP.rt * 2 * s});

