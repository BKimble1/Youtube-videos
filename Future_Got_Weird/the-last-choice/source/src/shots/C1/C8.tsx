// C8 · 1:18.6–1:28.0 · The scout's iris snaps amber (M.HIT_DRONE_SEES) and the camera runs along the beam to its
// source. The builder yanks the tablet off the rail — the giants vanish. A warden vaults off the deck onto the catwalk
// and lunges; its claw rakes the builder's arm and throws her down (C8 + 2.0 s), the tablet clatters away. The
// Director and the carrier haul back the maintenance hook and let it swing; the warden backhands the Director
// (C8 + 2.5 s) — and the hook smashes it into the steel column exactly on the music join (M.SPLICE): armour tears,
// the forearm comes away, cables snap and spark, dark fluid sprays. It staggers, stamps the tablet to pieces, tips
// through the railing and falls to the street (M.HIT_FALL). Above, a replacement warden's eye lights on the deck and
// two drones slot in beside it. The Director pulls the builder up; they run; she looks back at the crushed tablet.
import React from 'react';
import {Cam, smoothCam, shake} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV, limpOf} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {M, shot} from '../../film/timing';
import {ActorProps, solve, handCenter} from '../../rig/actor';
import {clamp, seg, smooth, lerp, keys, noise, easeIn, easeOut, rnd, V2} from '../../kit/math';
import {CatwalkScene, CATWALK, DECK, Projection, PROJ, COLUMN_X, DAVIT} from './catwalk';
import {Drone} from './avenue';
import {Warden, WardenProps, wardenJoint, Sparks as MSparks} from '../../mech';
import {Sparks, Debris, Dust, GlassShards, Fluid} from '../../fx';
import {Tablet, mover, stand, davitHook, G_RUN, G_HURRY, FACE, sk} from './kit';
import {BX, TabletContent} from './C5';
import {T_LAMP} from './C6';
import {scout} from './C7';

const ID = 'C8';
const S0 = shot(ID).start;
const SNAP = M.HIT_DRONE_SEES - S0;  // 0.10
const YANK = 0.5;                     // the builder pulls the tablet off the rail: the projection dies
const LAND = 0.85;                    // the warden lands on the catwalk
const RAKE = 1.95;                    // its claw throws the builder down (crew.ts: her marks at C8 + 2.0)
const BACKHAND = 2.45;                // it clips the Director's face (crew.ts: his marks at C8 + 2.5)
const SMASH = M.SPLICE - S0;          // 2.628: the hook hits — exactly on the music join
const COLUMN = SMASH + 0.17;          // its back hits the column
const STAMP = 3.45;                   // it stamps the tablet
const TIP = 3.6, DROP = 4.4;          // topples, then free fall
const STREET = M.HIT_FALL - S0;       // 5.43: hits the street
const G = CATWALK;

// ------------------------------------------------------------------ the hook
// staged in three clear zones: the warden (≈ 8700–9060) | the Director and the carrier on the hook (≈ 9220–9540) |
// the builder down on the grating behind them (≈ 9600–9800)
const hookTheta = (t: number) => keys(t, [[0, 0], [1.55, 0], [1.9, -40], [2.3, -22, easeIn], [SMASH, -6], [SMASH + 0.17, 26, easeOut], [SMASH + 0.5, 10], [SMASH + 1.2, -16], [SMASH + 2.0, 6], [SMASH + 2.8, -4], [9.4, 0]]) + 1.5 * Math.sin(t * 2.1);

// ------------------------------------------------------------------ the tablet: slips from her hands when the warden lands, clatters, is crushed
const DROP_TAB = 0.62, STAMP_X = 8880;
const tabletAt = (t: number, hands: V2) => {
  if (t < DROP_TAB) return {x: hands.x, y: hands.y, rot: -10, held: true};
  const a = t - DROP_TAB, landT = 0.22;
  if (a < landT) { const u = a / landT; return {x: lerp(8790, STAMP_X, u), y: lerp(-1375, G - 8, u * u), rot: -10 - 150 * u, held: false}; }
  const b2 = a - landT;
  return {x: STAMP_X, y: G - 8 - 26 * Math.abs(Math.sin(b2 * 14)) * Math.exp(-b2 * 9), rot: -170 + 10 * Math.exp(-b2 * 8) * Math.sin(b2 * 30), held: false};
};

// ------------------------------------------------------------------ the warden
const WX0 = 8700, WX_LUNGE = 8900, WX_HIT = 9050;
const warden = (t: number, T: number): WardenProps & {dy: number; front: boolean} => {
  const s = 1;
  const base: WardenProps = {x: WX0, y: G, s, t: T, seed: 44, yaw: 90, lock: 1, look: {x: 0.4, y: 0.2}, glow: 0.8};
  // A. vault off the deck and drop
  if (t < LAND) {
    const u = clamp((t - 0.32) / (LAND - 0.32));
    const y = lerp(DECK - 110, G, u * u);
    return {...base, y, drop: 70 - 40 * Math.sin(Math.PI * u), lean: 18, armL: {fk: {fwd: 60, out: 30, bend: 40}}, armR: {fk: {fwd: 50, out: 30, bend: 40}},
      legL: {foot: {x: WX0 - 40, y: y - 26 - 30 * (1 - u)}}, legR: {foot: {x: WX0 + 50, y: y - 26 - 50 * (1 - u)}}, dy: 0, front: false, headPitch: 20};
  }
  // B. landing crouch, rise, lunge after the fleeing builder (the swipe falls short), C. wind-up and backhand
  const land = 1 - smooth(seg(t, LAND, LAND + 0.45));
  const lunge = smooth(seg(t, 1.4, RAKE));
  const step2 = smooth(seg(t, RAKE + 0.05, BACKHAND));
  const x = lerp(lerp(WX0, WX_LUNGE, lunge), WX_HIT, step2);
  const wind = smooth(seg(t, 2.02, 2.3)) * (1 - smooth(seg(t, 2.3, BACKHAND)));
  const bh = smooth(seg(t, 2.3, BACKHAND)) * (1 - smooth(seg(t, SMASH, SMASH + 0.1)));
  // D. struck: driven west into the column, staggers back off it, stamps the tablet, tips through the rail, falls
  const struck = easeOut(clamp((t - SMASH) / 0.17));
  const stagger = smooth(seg(t, COLUMN + 0.15, STAMP));
  const xs = t < SMASH ? x : lerp(lerp(x, COLUMN_X + 62, struck), STAMP_X - 60, stagger);
  const tear = t < SMASH ? 0 : t < COLUMN ? 0.45 + 0.3 * smooth(seg(t, SMASH, COLUMN)) : 0.92;
  const tip = easeIn(clamp((t - TIP) / (DROP - TIP)));
  const fallT = Math.max(0, t - DROP);
  const ang = 82 * tip + 30 * smooth(clamp(fallT / 1.0));
  const dy = t < DROP ? 0 : Math.min(G * -1 + 120, 0.5 * 2350 * fallT * fallT);
  const hit = t >= STREET;
  const foreOff = t < COLUMN ? undefined : (() => {
    const a = t - COLUMN;
    return {side: 'L' as const, dx: -260 * a, dy: -260 * a + 1300 * a * a, rot: -220 * a};
  })();
  const stepR = t < 3.2 ? {x: xs + 60 + 40 * lunge * (1 - struck), y: G - 26} : {x: lerp(xs + 60, STAMP_X, smooth(seg(t, 3.2, STAMP))), y: G - 26 - 50 * Math.sin(Math.PI * smooth(seg(t, 3.2, STAMP)))};
  // right (camera-side) arm: the swipe, then pulled back across the body (wind-up), then the backhand
  const sh = {x: xs, y: G - (285 - 80 * land) - 150};
  let armR: WardenProps['armR'];
  if (t < RAKE + 0.07) armR = {hand: {x: lerp(xs - 80, xs + 235, smooth(seg(t, 1.55, RAKE))), y: lerp(G - 470, G - 330, smooth(seg(t, 1.55, RAKE))), z: 40}};
  else if (t < SMASH) armR = {hand: {x: lerp(lerp(xs + 200, xs - 70, wind / Math.max(1e-3, wind + bh)), xs + 245, bh), y: lerp(sh.y - 30, sh.y - 10, bh), z: lerp(70, 50, bh)}};
  else armR = {fk: {fwd: 30 - 60 * struck, out: 30 + 30 * struck, bend: 40}};
  return {
    ...base, x: xs, y: G,
    drop: 80 * land + 20 * lunge * (1 - struck) + 26 * stagger,
    lean: 22 * land + 26 * lunge * (1 - step2 * 0.5) - 10 * wind + 14 * bh - 30 * struck * (1 - stagger) + 18 * stagger,
    twist: -24 * wind + 30 * bh,
    legL: {foot: {x: xs - 60 + 40 * lunge, y: G - 26}}, legR: {foot: stepR},
    armR, armL: t < SMASH ? {fk: {fwd: 20 - 30 * bh, out: 20, bend: 60}} : {fk: {fwd: 40, out: 40, bend: 20}},
    headPitch: 10 * lunge - 20 * struck + 15 * stagger, headYaw: 0,
    lock: t < SMASH ? 1 : 1 - 0.6 * smooth(seg(t, COLUMN, COLUMN + 1.0)), eyeOpen: t < COLUMN ? 1 : 0.5 + 0.5 * Math.round(rnd(Math.floor(T * 12) * 7)),
    tear, armOff: foreOff, leak: t >= COLUMN ? {t0: S0 + COLUMN, amt: hit ? 0.5 : 1, groundY: hit ? 0 : undefined} : undefined,
    sparks: [{t0: S0 + SMASH, where: 'chest'}, {t0: S0 + COLUMN, where: 'elbowL'}, {t0: S0 + COLUMN + 0.35, where: 'shoulderL'}],
    crackle: t >= COLUMN ? 1 : 0,
    fall: ang > 0.01 ? {ang, px: xs + 40, py: G} : undefined,
    dy, front: t >= TIP + 0.25,
  } as WardenProps & {dy: number; front: boolean};
};

// ------------------------------------------------------------------ the Crew
const BFALL = 9790;                    // where the builder goes down, behind the Director and the carrier
const crewC8 = (t: number, T: number) => {
  const out: ActorProps[] = [];
  // builder: pulls the tablet, sees the warden land, drops the tablet and runs east past the Director and the carrier;
  // glances back, trips and goes down hard on the grating at C8 + 2.0 (her marks); props herself up and watches;
  // the Director pulls her up; they run
  const startle = smooth(seg(t, LAND, LAND + 0.2));
  const runX = sk(t, [[0.6, 8870], [1.45, BFALL - 20], [1.85, BFALL]], 0.15);
  const trip = smooth(seg(t, 1.88, 2.05));
  const sitUp = smooth(seg(t, 2.55, 3.2));
  const up = smooth(seg(t, 5.95, 6.6));
  const runB = sk(t, [[6.6, 0], [9.4, 650]], 0.25);
  const lookBack = smooth(seg(t, 7.0, 7.3)) * (1 - smooth(seg(t, 7.9, 8.2)));
  let builder: ActorProps;
  const bFace = t < LAND ? {mouth: 'flat' as const, brows: 0.2, lookX: -0.6} : t < 1.85 ? FACE.alarm : t < 5.5 ? {mouth: 'pain' as const, brows: -0.4, worry: 0.8, lids: 0.35} : FACE.grit;
  if (t < 0.6) {
    builder = {...stand(look('builder'), 8870, G, {t}, 40), seed: 37, dmg: dmg('builder', T), z: 40, breath: 0.8, yaw: -70, lean: 10, face: bFace};
  } else if (t < 1.85) {
    const m = mover(look('builder'), {x0: 8870, dist: runX - 8870, dir: 1, ground: G, gait: G_RUN, t});
    builder = {...m, seed: 37, dmg: dmg('builder', T), z: 40, face: t < 0.9 ? FACE.alarm : bFace, head: {yaw: t > 1.5 ? 140 * smooth(seg(t, 1.5, 1.7)) : 0}};
  } else if (t < 6.6) {
    // down on hands and knees, then sits up facing the fight; pulled up by the Director
    const kneel = trip * (1 - sitUp);
    const sit = sitUp * (1 - up);
    builder = {...stand(look('builder'), BFALL + 20 * trip, G, {t}, 40), seed: 37, dmg: dmg('builder', T), z: 40, breath: 1,
      yaw: lerp(90, -70, sitUp), drop: 150 * kneel + 128 * sit + 14 * up, lean: 72 * kneel - 22 * sit + 8 * up, face: bFace,
      legL: up < 0.5 ? {foot: {x: BFALL + (sitUp > 0.5 ? -120 : -90), y: G - 10}} : undefined, legR: up < 0.5 ? {foot: {x: BFALL + (sitUp > 0.5 ? -60 : -40), y: G - 10}} : undefined,
      armL: kneel > 0.3 ? {hand: {x: BFALL + 150, y: G - 14}} : sit > 0.3 ? {hand: {x: BFALL + 70, y: G - 30, z: -40}} : undefined,
      armR: up > 0.01 ? {hand: dirHandFor(t)} : kneel > 0.3 ? {hand: {x: BFALL + 170, y: G - 14, z: 30}} : {fk: {fwd: 30, out: 20, bend: 70}},
      head: {pitch: kneel > 0.3 ? -20 : 0, roll: t > 1.95 && t < 2.3 ? 12 : 0}};
  } else {
    builder = {...mover(look('builder'), {x0: BFALL + 20, dist: runB, dir: 1, ground: G, gait: G_RUN, t}), seed: 37, dmg: dmg('builder', T), z: 40, face: lookBack > 0.3 ? {mouth: 'sad', worry: 0.9, brows: 0.3} : FACE.grit, head: {yaw: lerp(0, 150, lookBack), pitch: 10 * lookBack}};
  }
  const rb = solve(builder);
  const hands = {x: rb.P.x - 70, y: rb.P.y - 120};
  if (t < 0.55) {
    builder.armL = {hand: {x: PROJ.x - 48 + 20 * smooth(seg(t, 0.3, 0.55)), y: PROJ.y + 10, z: 60}};
    builder.armR = {hand: {x: PROJ.x + 24, y: PROJ.y + 22, z: 70}};
  } else if (t < DROP_TAB) {
    builder.armL = {hand: {x: hands.x, y: hands.y, z: 70}}; builder.armR = {hand: {x: hands.x + 30, y: hands.y + 10, z: 80}};
  }
  out.push(builder);
  // Director: waves her on, runs back, hauls the hook with the carrier, shoves it and follows through — straight into
  // the warden's backhand (wind-up, contact at BACKHAND, recoil; crew.ts adds the lip cut at C8 + 2.5); hand to his mouth
  const hk = davitHook(DAVIT.px, DAVIT.py, DAVIT.L, hookTheta(t));
  const holding = t >= 1.5 && t < 2.1;
  const dx = keys(t, [[0, 9330], [1.2, 9330], [1.5, 9400], [1.9, 9420], [2.1, 9380], [2.3, 9335], [BACKHAND, 9335], [BACKHAND + 0.4, 9375, easeOut], [5.6, 9375], [5.95, BFALL - 170]]);
  const recoil = smooth(seg(t, BACKHAND - 0.03, BACKHAND + 0.1)) * (1 - smooth(seg(t, BACKHAND + 0.6, BACKHAND + 1.3)));
  const mouth = smooth(seg(t, BACKHAND + 0.45, BACKHAND + 0.75)) * (1 - smooth(seg(t, 3.9, 4.4)));
  const runD = sk(t, [[6.6, 0], [9.4, 700]], 0.25);
  let director: ActorProps;
  if (t < 6.6) {
    const moving = t > 5.6 && t < 5.95;
    const dm = mover(look('director'), {x0: 9375, dist: Math.abs(dx - 9375), dir: 1, ground: G, gait: G_RUN, t});
    const sd = stand(look('director'), dx, G, {t}, 46, -1);
    director = {...(moving ? dm : sd), x: dx, seed: 31, dmg: dmg('director', T), z: 20, breath: 0.9,
      yaw: t < 1.0 ? -60 : t > 5.6 ? lerp(-90, 90, smooth(seg(t, 5.6, 5.95))) : -90 + 45 * recoil,
      lean: holding ? (t < 1.9 ? -18 : 26) : (t > 2.3 && t < BACKHAND ? 8 : 4) - 16 * recoil,
      drop: holding ? 26 : 10 + 20 * recoil, twist: 16 * recoil,
      face: recoil > 0.15 ? {mouth: 'pain', brows: -0.7, lids: 0.75} : t > 1.0 ? FACE.grit : {...FACE.worry, lookX: -0.5},
      head: {yaw: 22 * recoil, roll: -10 * recoil, pitch: -20 * recoil},
      armR: holding ? {hand: {x: hk.x + 28, y: hk.y + 34, z: 30}} : mouth > 0.01 ? {hand: {x: dx - 46, y: G - 375, z: 60}, w: mouth} : t < 1.0 ? {fk: {fwd: 70 + 30 * Math.sin(t * 13), out: 20, bend: 40}} : t > 2.25 && t < BACKHAND ? {fk: {fwd: 60, out: 14, bend: 70}} : undefined,
      armL: holding ? {hand: {x: hk.x + 6, y: hk.y + 64, z: -10}} : t > 2.25 && t < BACKHAND ? {fk: {fwd: 50, out: 14, bend: 80}} : recoil > 0.2 ? {fk: {fwd: -20, out: 40, bend: 30}} : undefined};
    if (t > 5.95) director = {...director, yaw: 90, drop: 40, lean: 20, armR: {hand: dirHandFor(t)}, face: FACE.grit, head: {}};
  } else {
    director = {...mover(look('director'), {x0: BFALL - 170, dist: runD, dir: 1, ground: G, gait: G_RUN, t}), seed: 31, dmg: dmg('director', T), z: 20, face: FACE.grit};
  }
  out.push(director);
  // carrier: beside the Director on the hook with his good right arm, guards the cut one; limps on after them
  const cx = keys(t, [[0, 9430], [1.25, 9430], [1.55, 9565], [1.9, 9575], [2.3, 9625], [6.6, 9625]]);
  const cHold = t >= 1.55 && t < 2.1;
  const runC = sk(t, [[6.6, 0], [9.4, 560]], 0.3);
  const cm = t < 6.6 ? {...stand(look('carrier'), cx, G, {t}, 40, -1), x: cx} : mover(look('carrier'), {x0: 9625, dist: runC, dir: 1, ground: G, gait: {...G_HURRY, limp: limpOf('carrier', T)}, t});
  out.push({...cm, seed: 35, dmg: dmg('carrier', T), z: -30, yaw: t < 6.6 ? -90 : 90, lean: cHold ? (t < 1.9 ? -14 : 22) : (cm.lean ?? 4), drop: cHold ? 22 : (cm.drop ?? 8),
    armR: cHold ? {hand: {x: hk.x + 60, y: hk.y + 20, z: -20}} : t < 6.6 ? {fk: {fwd: 20, out: 10, bend: 30}} : cm.armR,
    armL: {fk: {fwd: 40, out: 4, bend: 110}}, handL: 'fist', face: FACE.pain, breath: 0.9});
  void CIV;
  return {out, hands};
};
// the Director's hand reaching down to the sitting builder (and her hand meeting it), then pulling her up
const dirHandFor = (t: number): V2 => {
  const u = smooth(seg(t, 5.95, 6.6));
  return {x: lerp(BFALL - 80, BFALL - 60, u), y: lerp(G - 170, G - 330, u)};
};

// ------------------------------------------------------------------ camera
const camAt = (t: number): Cam => {
  const k: [number, Cam][] = [
    [0, {x: 8150, y: -1110, z: 1.3}], [0.12, {x: 8170, y: -1120, z: 1.3}], [0.95, {x: 9180, y: -1500, z: 1.25}], [1.6, {x: 9270, y: -1515, z: 1.4}], [3.5, {x: 9250, y: -1505, z: 1.4}],
    [5.45, {x: 9050, y: -790, z: 0.44}], [6.6, {x: 9480, y: -1510, z: 0.72}], [8.0, {x: 9660, y: -1530, z: 0.78}], [9.4, {x: 9800, y: -1530, z: 0.78}],
  ];
  let i = 1;
  while (i < k.length - 1 && t > k[i][0]) i++;
  const [ta, a] = k[i - 1], [tb, b] = k[i];
  const u = smooth(clamp((t - ta) / (tb - ta)));
  return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u))};
};

export const C8Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  let cam = smoothCam(camAt, t, 0.18);
  const imp = (t0: number, a: number, d = 7) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  cam = shake(cam, t, imp(LAND, 8) + imp(SMASH, 26, 6) + imp(COLUMN, 12) + imp(STREET, 18, 5) + imp(RAKE, 5), 11, 15);
  const ink = 4 / cam.z;
  const {out: crew, hands} = crewC8(t, T);
  const tab = tabletAt(t, hands);
  const w = warden(t, T);
  const wEl = <g transform={`translate(0 ${w.dy})`}><Warden {...w} ink={ink} /></g>;
  // scout: snaps, follows the beam toward the source, then slots into formation beside the replacement
  const sc = scout(T);
  const fwd = smooth(seg(t, SNAP + 0.15, 1.2));
  const slot = smooth(seg(t, 6.0, 7.2));
  const sx = lerp(lerp(sc.x, 8330, fwd), 8380, slot), sy = lerp(lerp(sc.y, -1860, fwd), -2120, slot);
  const lockS = smooth(seg(t, SNAP - 0.02, SNAP + 0.05));
  const scoutEl = <Drone x={sx} y={sy} s={2.6} t={T} seed={77} face={lerp(sc.face, 0.4, slot)} tilt={lerp(sc.tilt, 0, fwd)} look={{x: lerp(0.95, 0.5, fwd), y: lerp(-0.15, 0.4, fwd)}} lock={lockS} eyeOpen={t < SNAP ? sc.open : 1} glow={0.8} />;
  // the replacement: a second warden on the deck behind the guardrail, its eye lights; a second drone slots in
  const rep = smooth(seg(t, 5.9, 6.1));
  const repEl = t > 5.5 ? <Warden x={8160} y={DECK} s={1} t={T} seed={45} yaw={60} lock={smooth(seg(t, 6.2, 6.4))} glow={0.3 + 0.6 * rep} eyeOpen={rep} look={{x: 0.6, y: 0.4}} headPitch={10} /> : null;
  const d2 = smooth(seg(t, 6.2, 7.4));
  const drone2 = t > 5.8 ? <Drone x={lerp(7400, 7980, d2)} y={lerp(-2400, -2060, d2)} s={2.6} t={T} seed={78} face={0.5} look={{x: 0.5, y: 0.4}} lock={1} /> : null;
  // the tablet: in her hands → flying → on the grating → crushed under the foot
  const crushed = t >= STAMP;
  const tabletEl = (
    <g transform={`translate(${tab.x} ${tab.y + (crushed ? 6 : 0)}) rotate(${tab.rot})`}>
      <Tablet s={1.25} ink={ink} view={tab.held ? 0.6 : crushed ? 0.22 : 0.4} id="c8tab" glow={crushed ? 0.1 : 0.9} cracked={crushed ? 1 : 0} lens={0} content={crushed ? null : <TabletContent t={t + 3} tap={0} draw={() => [0, 0.01] as const} />} />
    </g>
  );
  const tabZ = 40 * 1000 + 160;
  // rail bay the warden tips through
  const bend = smooth(seg(t, TIP + 0.15, DROP));
  const fx = (
    <g>
      {/* hook hits: sparks at the contact, plates and bolts fly */}
      <Sparks x={8900} y={-1580} t={T} t0={S0 + SMASH} n={34} dir={200} spread={120} speed={[700, 2000]} seed={4} width={5} />
      <Debris x={8850} y={-1620} t={T} t0={S0 + SMASH} n={10} dir={200} spread={70} speed={[600, 1500]} ground={G} material="panel" seed={5} ink={ink} size={[14, 40]} />
      <Debris x={COLUMN_X + 40} y={-1600} t={T} t0={S0 + COLUMN} n={12} dir={-150} spread={100} speed={[500, 1400]} ground={G} material="metal" seed={6} ink={ink} size={[8, 22]} />
      <Fluid x={COLUMN_X + 70} y={-1560} t={T} t0={S0 + COLUMN} dir={-120} spread={60} speed={900} size={90} ground={G} seed={7} />
      {/* the tablet crushed */}
      <Sparks x={STAMP_X} y={G - 10} t={T} t0={S0 + STAMP} n={14} dir={-90} spread={160} speed={[300, 800]} seed={8} width={3} />
      <GlassShards x={STAMP_X} y={G - 10} t={T} t0={S0 + STAMP} n={14} dir={-90} spread={150} speed={[200, 600]} ground={G} seed={9} ink={ink} size={[3, 9]} />
      {/* street impact */}
      <Dust x={9150} y={60} t={T} t0={S0 + STREET} size={620} n={16} seed={10} />
      <Debris x={9150} y={-40} t={T} t0={S0 + STREET} n={20} dir={-90} spread={150} speed={[500, 1600]} ground={60} material="panel" seed={11} ink={ink} size={[16, 46]} />
      <Sparks x={9150} y={-20} t={T} t0={S0 + STREET} n={30} dir={-90} spread={170} speed={[600, 1800]} seed={12} width={5} />
    </g>
  );
  return (
    <CatwalkScene id="c8" cam={cam} T={T} crew={crew} steam={1 - 0.6 * smooth(seg(t, 0.8, 2.0))} column={{dent: smooth(seg(t, COLUMN, COLUMN + 0.12))}} hook={{theta: hookTheta(t)}}
      rail={{bay: [8450, 8950], bend}}
      extraParts={[{z: tabZ, el: tabletEl}]}
      deck={repEl}
      back={<g>{drone2}{!w.front && wEl}</g>}
      onCloud={<g><Projection T={T} t0={T_LAMP} on={1 - smooth(seg(t, YANK, YANK + 0.08))} id="c8p" ink={ink} />{scoutEl}</g>}
      front={<g>{w.front && wEl}{fx}</g>} />
  );
};

const c = at(S0);
export const CUES: Cue[] = [
  c(SNAP, 'sensor_lock', {pan: -0.5, dist: 0.1, gain: 3}),
  c(YANK, 'padlock', {pan: 0.2, gain: -4, rate: 1.4}),
  c(0.32, 'servo_heavy', {pan: -0.1, dist: 0.2, gain: 0}),
  c(LAND, 'robot_step_heavy', {pan: -0.1, dist: 0.1, gain: 4}),
  c(LAND + 0.02, 'step_grate', {pan: -0.1, gain: 2, rate: 0.7}),
  c(1.4, 'servo_heavy', {pan: 0, dist: 0.1, gain: 2, rate: 1.2}),
  c(1.6, 'cable_strain', {pan: 0.3, dist: 0.1, gain: -2}),
  c(2.0, 'body_fall', {pan: 0.45, gain: 1}),
  c(2.03, 'breath_exert', {pan: 0.45, gain: -3}),
  c(DROP_TAB + 0.22, 'glass_shatter', {pan: -0.05, gain: -14, rate: 1.6}),
  c(BACKHAND, 'body_fall', {pan: 0.15, gain: -4, rate: 1.25}),
  c(BACKHAND + 0.02, 'breath_exert', {pan: 0.15, gain: -5, rate: 1.1}),
  c(SMASH, 'wreck_slam', {pan: 0.05, dist: 0.05, gain: 4}),
  c(SMASH + 0.03, 'metal_tear', {pan: 0, dist: 0.05, gain: 2}),
  c(COLUMN, 'elec_arc', {pan: -0.2, dist: 0.1, gain: 0}),
  c(COLUMN + 0.02, 'sparks', {pan: -0.2, dist: 0.1}),
  c(COLUMN + 0.05, 'hydraulic', {pan: -0.2, dist: 0.1, gain: -2}),
  c(STAMP, 'glass_shatter', {pan: -0.05, gain: -4, rate: 1.3}),
  c(TIP + 0.2, 'metal_tear', {pan: 0, dist: 0.15, gain: -2, rate: 0.8}),
  c(STREET, 'wreck_slam', {pan: 0.1, dist: 0.45, gain: 2}),
  c(STREET + 0.05, 'debris_rain', {pan: 0.1, dist: 0.45, gain: -2}),
  c(6.2, 'sensor_lock', {pan: -0.4, dist: 0.3, gain: -1}),
  c(6.6, 'step_grate', {dur: 2.8, pan: 0.5, dist: 0.2, gain: 0, fade: 0.3}),
  c(6.7, 'step_grate_b', {dur: 2.6, pan: 0.6, dist: 0.25, gain: -3, fade: 0.3}),
];
void noise; void wardenJoint; void MSparks; void handCenter;
