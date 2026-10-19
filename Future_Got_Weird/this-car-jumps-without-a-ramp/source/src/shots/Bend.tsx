// 0:41-1:11 — the corner. One car, one circuit, one speed; the viewpoint changes with the idea.
//   42.3  overhead: the straight, the bend ahead, the path (the tyre wall has just whipped the side view away)
//   43.5  the camera dives from the overhead down to a low three-quarter view from the outside of the bend
//   44.5  the body leans outward (three-quarter)
//   46.0  front view, corner windows open: the outside spring carries more than the inside one
//   48.7  "for the jump": both sides push (ghost lift)
//   51.4  "here": actuators oppose the lean; the outside corner close-up
//   55.7  three-quarter again: flat body, "active body control"
//   61.2  front view: the body stays composed while the tyres meet bumps; then the grip limit stays with the tyres
//   70.0  the car runs through the lens (hands over to the brake scene)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w} from '../cues';
import {LoftCar} from '../car/loft';
import {FrontCar, frontBody, TRACK_HALF} from '../car/front';
import {Arrow} from '../car/parts';
import {Callout, Caption, Label, Stage} from '../kit/stage';
import {TrackScene, Bump, BEND_START, bumpAt, trackAt, trackPoint} from '../kit/track3d';
import {Cam3, V3, carToWorld} from '../kit/view3d';
import {lookAt, orbit} from '../kit/cam3';
import {clamp01, easeInOut, easeOut, keys, lerp, seg, smooth, wheelBlur, win} from '../kit/util';

export const T3 = {
  now: w('b3', 'now'),
  corner: w('b3', 'corner'),
  body0: w('b3', 'body', 0),
  lean0: w('b3', 'lean', 0),
  outward: w('b3', 'outward'),
  loading: w('b3', 'loading'),
  differently: w('b3', 'differently'),
  side: w('b3', 'side'),
  forW: w('b3', 'for'),
  jump: w('b3', 'jump'),
  lifts: w('b3', 'lifts'),
  here: w('b3', 'here'),
  adjusts: w('b3', 'adjusts'),
  across: w('b3', 'across'),
  oppose: w('b3', 'oppose'),
  lean1: w('b3', 'lean', 1),
  same: w('b3', 'same', 1),
  different: w('b3', 'different'),
  job: w('b3', 'job'),
  thisW: w('b3', 'this'),
  active: w('b3', 'active'),
  control: w('b3', 'control'),
  point: w('b3', 'point'),
  float: w('b3', 'float'),
  manage: w('b3', 'manage'),
  tires: w('b3', 'tires'),
  road: w('b3', 'road'),
  flatter: w('b3', 'flatter'),
  grip: w('b3', 'grip'),
  brake: w('b4', 'brake'),
};

export const SPEED = 12000; // mm/s along the road
export const T_ENTER = T3.corner + 1.05; // the car reaches the start of the bend
export const sCar = (t: number) => BEND_START + (t - T_ENTER) * SPEED;
export const BEND_T = {
  start: 42.0,
  diveA: T3.corner - 0.15,
  diveB: T3.body0 + 0.45,
  front1: T3.loading + 0.0,
  adjustIn: T3.here - 0.05,
  closeIn: T3.adjusts + 0.35,
  closeOut: T3.same - 0.35,
  q2: T3.same - 0.1,
  front2: T3.point - 0.1,
  passIn: T3.grip + 0.1,
  out: T3.brake - 0.63, // = the brake scene's first frame
};

const PASSIVE = 3.6, ACTIVE = 0.8; // deg of body roll in the bend, without and with the actuators
const rollDeg = (t: number) => {
  const build = smooth(seg(t, T_ENTER, T_ENTER + 1.0));
  const passive = PASSIVE * build;
  if (t < T3.adjusts - 0.2) return passive;
  return lerp(PASSIVE, ACTIVE, easeInOut(seg(t, T3.adjusts - 0.2, T3.oppose + 0.7)));
};

// strips under the wheels while "the tires deal with the road"
const BUMPS: Bump[] = (() => {
  const seq: [number, -1 | 0 | 1, number][] = [[T3.manage + 0.25, -1, 55], [T3.manage + 0.85, 1, 45], [T3.manage + 1.4, 0, 40], [T3.tires - 0.05, -1, 50], [T3.tires + 0.55, 1, 55]];
  return seq.map(([tb, side, h]) => ({s: sCar(tb) + 1450, side, h, len: 2600}));
})();
export const BEND_BUMPS = BUMPS.map((b) => ({t: (b.s - 1450 - BEND_START) / SPEED + T_ENTER, side: b.side, h: b.h}));

const FRONT_F = 2100;
const FRONT_H = 1500;
const D_CAR = 5200;

const poseAt = (t: number) => {
  const s = sCar(t);
  const p = trackAt(s);
  return {s, pose: {e: p.e, n: p.n, psi: p.psi}};
};


// ------------------------------------------------------------------------------------------------ aerial (3D) shots
const aerialCam = (t: number, tgt: V3, psi: number): Cam3 => {
  const f = 1500;
  const AZ_TOP = -Math.PI / 2;
  const az3 = (k: number) => psi - 0.82 + k;
  if (t < BEND_T.diveA) {
    const u = smooth(seg(t, BEND_T.start, BEND_T.diveA));
    return orbit(tgt, lerp(105000, 62000, u), (89.4 * Math.PI) / 180, AZ_TOP, f);
  }
  if (t < BEND_T.diveB) {
    const u = easeInOut(seg(t, BEND_T.diveA, BEND_T.diveB));
    const r = Math.exp(lerp(Math.log(62000), Math.log(8000), u));
    const el = lerp((89.4 * Math.PI) / 180, 0.07, easeInOut(seg(t, BEND_T.diveA - 0.0, BEND_T.diveB - 0.05)));
    return orbit(tgt, r, el, lerp(AZ_TOP, az3(0), u), f);
  }
  if (t < BEND_T.front1 + 0.2) {
    const k = seg(t, BEND_T.diveB, BEND_T.front1);
    return orbit(tgt, lerp(8000, 7300, k), 0.07, az3(0.1 * k), f);
  }
  // second visit: starts close (the car has just run through the lens), then settles
  const u = easeOut(seg(t, BEND_T.q2, BEND_T.q2 + 1.6));
  const k = seg(t, BEND_T.q2, BEND_T.front2);
  return orbit(tgt, lerp(4300, 8200, u) - 500 * k, lerp(0.05, 0.075, u), az3(lerp(-0.12, 0.2, k)), f);
};

const Aerial: React.FC<{t: number}> = ({t}) => {
  const {s, pose: p0} = poseAt(t);
  const roll = (-rollDeg(t) * 1.4 * Math.PI) / 180; // leaning outward = toward the car's right = negative roll
  const steer = 4.5 * smooth(seg(t, T_ENTER - 0.1, T_ENTER + 0.5));
  const spin = (-(s / 365) * 180) / Math.PI;
  const pose = {...p0, roll, wheelRot: spin, steer, blur: wheelBlur(SPEED)};
  const tgt = carToWorld(p0, [t < BEND_T.diveA ? 1500 : 0, t < BEND_T.diveA ? 0 : 470, 0]);
  const cam = aerialCam(t, tgt, p0.psi);
  const overhead = cam.pitch < -0.9;
  const aheadS = overhead ? s + 160000 : s + 70000;
  const bgS = overhead ? s - 120000 : s - 130000;
  const hint = {sFrom: s - 4000, sTo: s + 150000, opacity: win(t, BEND_T.start, BEND_T.diveA + 0.4, 0.4, 0.5)};
  return (
    <g>
      <TrackScene cam={cam} s0={bgS} s1={aheadS} pathHint={overhead || t < BEND_T.diveB ? hint : undefined} />
      <LoftCar cam={cam} pose={pose} ink={overhead ? 3 : 4} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ front view
const FrontView: React.FC<{t: number}> = ({t}) => {
  const {s, pose} = poseAt(t);
  const pass = seg(t, BEND_T.passIn, BEND_T.out);
  const dCar = lerp(D_CAR, 380, pass * pass * pass);
  const eye = carToWorld(pose, [1450 + dCar, FRONT_H, 0]);
  const cam: Cam3 = {eye, yaw: pose.psi + Math.PI, pitch: 0, f: FRONT_F, cx: 960, cy: 300};
  const sc = FRONT_F / dCar;
  const gy = 300 + (FRONT_F * FRONT_H) / dCar;
  const front = s + 1450;

  // outside-corner close-up
  const zoomIn = easeInOut(seg(t, BEND_T.closeIn, BEND_T.closeIn + 0.8)) * (1 - easeInOut(seg(t, BEND_T.closeOut - 0.45, BEND_T.closeOut)));
  const Z = 1 + 1.7 * zoomIn;
  const fxs = 960 - TRACK_HALF * 1.0 * sc * 0.9, fys = gy - 430 * sc;
  const cx = 960 + (fxs - 960) * zoomIn, cy = 540 + (fys - 540) * zoomIn;

  const actOn = smooth(seg(t, T3.here, T3.adjusts + 0.35)) * (1 - smooth(seg(t, BEND_T.closeOut - 0.6, BEND_T.closeOut - 0.2)));
  const wellOpen = Math.max(
    smooth(seg(t, BEND_T.front1 - 0.1, BEND_T.front1 + 0.5)) * (1 - smooth(seg(t, T3.forW - 0.45, T3.forW - 0.05))),
    smooth(seg(t, BEND_T.adjustIn, BEND_T.adjustIn + 0.5)) * (1 - smooth(seg(t, BEND_T.closeOut - 0.5, BEND_T.closeOut - 0.1))),
  );
  const early = t < T3.forW; // first window: the springs only, then the actuators join
  const rd = rollDeg(t);
  const wl = bumpAt(BUMPS, front, -1), wr = bumpAt(BUMPS, front, 1);
  const bodyHeave = 0.12 * (wl + wr) / 2;
  const roll = rd + ((0.12 * (wl - wr)) / (2 * TRACK_HALF)) * (180 / Math.PI) * -1;
  const fwd = t > T3.adjusts - 0.3;
  const forceL = fwd ? 0.9 * actOn : 0;
  const forceR = fwd ? -0.7 * actOn : 0;

  // "for the jump": both sides push, the body lifts evenly (a ghost, not what happens in the bend)
  const jg = win(t, T3.forW - 0.1, T3.here - 0.2, 0.3, 0.35);
  const lift = 150 * easeOut(seg(t, T3.forW + 0.1, T3.lifts + 0.2));
  // "make the car float": a rejected idea, once
  const fg = win(t, T3.point - 0.15, T3.manage - 0.15, 0.25, 0.3);
  const floatUp = 520 * easeInOut(seg(t, T3.point - 0.05, T3.float + 0.1));
  const ghosts: {roll: number; dz: number; color?: string; opacity?: number}[] = [];
  if (jg > 0) ghosts.push({roll: rd, dz: lift, color: C.tealDeep, opacity: jg});
  const ref = win(t, T3.oppose, T3.different + 0.2, 0.4, 0.5);
  if (ref > 0) ghosts.push({roll: PASSIVE, dz: 0, color: C.inkMuted, opacity: ref});
  if (fg > 0) ghosts.push({roll, dz: floatUp, color: C.coral, opacity: fg});

  // per-wheel loads: the outside (screen-left) wheel carries more, passive or active
  const corner = clamp01((t - T_ENTER) / 1.2);
  const Nl = 260 * (1 + 0.45 * corner), Nr = 260 * (1 - 0.45 * corner);
  const loadVis = Math.max(win(t, T3.loading, T3.side + 0.6, 0.4, 0.3), win(t, T3.tires, BEND_T.passIn - 0.2, 0.4, 0.3));
  const patches = win(t, T3.flatter - 0.2, BEND_T.passIn - 0.1, 0.3, 0.3);
  const poseF = {roll, dz: bodyHeave};
  const topL = frontBody(poseF, -470, 640), topR = frontBody(poseF, 470, 640);
  const gTopL = frontBody({roll: rd, dz: lift}, -470, 640), gTopR = frontBody({roll: rd, dz: lift}, 470, 640);
  const toS = (x: number, y: number) => ({x: 960 + x * sc, y: gy - y * sc});
  // map a screen point through the close-up zoom
  const zs = (p: {x: number; y: number}) => ({x: 960 + (p.x - cx) * Z, y: 540 + (p.y - cy) * Z});

  const wells = wellOpen > 0.001 ? {open: wellOpen, actuator: early ? 0 : smooth(seg(t, T3.here - 0.1, T3.here + 0.5)), slide: smooth(seg(t, T3.adjusts - 0.2, T3.adjusts + 0.5)), forceL, forceR, springGlowL: wellOpen * clamp01(rd / PASSIVE), springGlowR: 0} : undefined;
  const lead = toS(0, 1800 + floatUp);
  return (
    <g>
      <g transform={`translate(960 540) scale(${Z}) translate(${-cx} ${-cy})`}>
        <TrackScene cam={cam} s0={s - 150000} s1={s + 20000} bumps={BUMPS} />
        <g transform={`translate(960 ${gy}) scale(${sc} ${-sc})`}>
          {patches > 0 && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * TRACK_HALF} cy={0} rx={190} ry={70} fill={C.teal} opacity={0.85 * patches} stroke={C.ink} strokeWidth={3 / (sc * Z)} />)}
          <FrontCar px={sc * Z} roll={roll} dz={bodyHeave} wl={wl} wr={wr} wells={wells} ghost={ghosts} id="bend" />
          {/* jump pattern: both actuators push up */}
          {jg > 0 && [gTopL, gTopR].map((p, i) => <Arrow key={i} x={p[0]} y={p[1] + 40} dx={0} dy={260} px={sc * Z} color={C.teal} opacity={jg} />)}
          {/* bend pattern: outside pushes up, inside pulls down */}
          {(() => {
            const a = win(t, T3.across - 0.1, T3.job + 0.3, 0.3, 0.4) * smooth(seg(t, BEND_T.adjustIn, BEND_T.adjustIn + 0.8));
            if (a <= 0) return null;
            return (
              <g>
                <Arrow x={topL[0]} y={topL[1] + 40} dx={0} dy={260} px={sc * Z} color={C.teal} opacity={a} />
                <Arrow x={topR[0]} y={topR[1] + 300} dx={0} dy={-240} px={sc * Z} color={C.blue} opacity={a} />
              </g>
            );
          })()}
          {/* road on tyres at the contact patches: more on the outside */}
          {loadVis > 0 && (
            <g>
              <Arrow x={-TRACK_HALF} y={-Nl - 20} dx={0} dy={Nl} px={sc * Z} color={C.teal} width={16} opacity={loadVis} />
              <Arrow x={TRACK_HALF} y={-Nr - 20} dx={0} dy={Nr} px={sc * Z} color={C.teal} width={16} opacity={loadVis} />
            </g>
          )}
          {/* the tyres supply the sideways force that turns the car: toward the centre of the bend (screen-right) */}
          {patches > 0 && (
            <g>
              <Arrow x={-TRACK_HALF - 110} y={90} dx={430} dy={0} px={sc * Z} color={C.teal} width={16} opacity={patches} />
              <Arrow x={TRACK_HALF - 110} y={90} dx={300} dy={0} px={sc * Z} color={C.teal} width={16} opacity={patches} />
            </g>
          )}
        </g>
      </g>
      {/* labels (screen space, after the zoom) */}
      {(() => {
        const sl = zs(toS(-TRACK_HALF * 0.78, 480)), sr = zs(toS(TRACK_HALF * 0.78, 480));
        const k = Z;
        return (
          <g>
            <Callout x={sl.x - 330} y={sl.y - 150 * k} tx={sl.x} ty={sl.y} text="MORE LOAD" color={C.coralLight} size={34} opacity={win(t, T3.differently - 0.5, T3.side + 0.5, 0.3, 0.3) * wellOpen} />
            <Callout x={sr.x + 330} y={sr.y - 150 * k} tx={sr.x} ty={sr.y} text="LESS LOAD" color={C.blueLight} size={34} opacity={win(t, T3.differently - 0.3, T3.side + 0.5, 0.3, 0.3) * wellOpen} />
          </g>
        );
      })()}
      <Label x={zs(toS(0, 1560 + lift)).x} y={Math.max(80, zs(toS(0, 1560 + lift)).y)} text="BOTH SIDES PUSH UP" color={C.tealLight} size={36} opacity={win(t, T3.forW + 0.1, T3.here - 0.2, 0.3, 0.3)} />
      <Label x={960} y={Math.max(80, zs(toS(0, 1560)).y)} text="OUTSIDE PUSHES · INSIDE PULLS" color={C.tealLight} size={36} opacity={win(t, T3.oppose - 0.4, T3.job + 0.3, 0.3, 0.4) * (1 - zoomIn)} />
      <Label x={lead.x} y={Math.max(70, lead.y)} text="NOT THE GOAL" color={C.coral} fg={C.white} size={38} opacity={fg * smooth(seg(t, T3.float - 0.3, T3.float + 0.1))} />
      <Label x={960} y={130} text="TIRES STILL SET THE LIMIT" color={C.white} size={46} opacity={win(t, T3.flatter + 0.1, BEND_T.passIn - 0.1, 0.3, 0.3)} />
      <Caption text="SIMPLIFIED CUTAWAY" opacity={wellOpen} />
    </g>
  );
};

export const Bend: React.FC<{t: number}> = ({t}) => {
  const front = (t >= BEND_T.front1 && t < BEND_T.q2) || t >= BEND_T.front2;
  const aerialOn = !front;
  return (
    <AbsoluteFill>
      <Stage bg={C.paper}>
        {aerialOn ? <Aerial t={t} /> : <FrontView t={t} />}
        {/* the overhead's single label, then the title for the flat body */}
        <Label x={960} y={110} text="ACTIVE BODY CONTROL" color={C.saffron} size={56} opacity={win(t, T3.thisW - 0.05, T3.point - 0.2, 0.25, 0.3) * (t >= BEND_T.q2 && t < BEND_T.front2 ? 1 : 0)} scale={0.92 + 0.08 * easeOut(seg(t, T3.thisW - 0.05, T3.thisW + 0.35))} />
      </Stage>
    </AbsoluteFill>
  );
};
void lookAt;
void keys;
void trackPoint;
