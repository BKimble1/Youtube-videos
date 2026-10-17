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
const hookTheta = (t: number) => keys(t, [[0, 0], [1.55, 0], [1.9, -42], [2.3, -6, easeIn], [SMASH, 12], [SMASH + 0.17, 30, easeOut], [SMASH + 0.5, 8], [SMASH + 1.2, -18], [SMASH + 2.0, 6], [SMASH + 2.8, -4], [9.4, 0]]);

// ------------------------------------------------------------------ the tablet (in her hands → flying → on the grating → crushed)
const tabletAt = (t: number, hands: V2) => {
  if (t < RAKE) return {x: hands.x, y: hands.y, rot: -10, held: true};
  const a = t - RAKE;
  const landT = 0.55;
  if (a < landT) return {x: hands.x - 330 * a, y: hands.y - 380 * a + 1225 * a * a, rot: -10 - 500 * a, held: false};
  const x0 = hands.x - 330 * landT;
  return {x: x0 - 40 * easeOut(clamp((a - landT) / 0.3)), y: G - 8, rot: -175 + 8 * Math.exp(-(a - landT) * 9) * Math.sin((a - landT) * 40), held: false};
};

// ------------------------------------------------------------------ the warden
const WX0 = 8760;
const warden = (t: number, T: number, tab: V2): WardenProps & {dy: number; front: boolean} => {
  const s = 1;
  const base: WardenProps = {x: WX0, y: G, s, t: T, seed: 44, yaw: 90, lock: 1, look: {x: 0.4, y: 0.2}, glow: 0.8};
  // A. vault off the deck and drop
  if (t < LAND) {
    const u = clamp((t - 0.32) / (LAND - 0.32));
    const y = lerp(DECK - 110, G, u * u);
    return {...base, y, drop: 70 - 40 * Math.sin(Math.PI * u), lean: 18, armL: {fk: {fwd: 60, out: 30, bend: 40}}, armR: {fk: {fwd: 50, out: 30, bend: 40}},
      legL: {foot: {x: WX0 - 40, y: y - 26 - 30 * (1 - u)}}, legR: {foot: {x: WX0 + 50, y: y - 26 - 50 * (1 - u)}}, dy: 0, front: false, headPitch: 20};
  }
  // B. landing crouch, rise, lunge and rake
  const land = 1 - smooth(seg(t, LAND, LAND + 0.45));
  const lunge = smooth(seg(t, 1.4, RAKE));
  const x = lerp(WX0, WX0 + 120, lunge);
  const turnBack = smooth(seg(t, RAKE + 0.1, 2.3));
  const bh = smooth(seg(t, 2.3, BACKHAND));
  // D. struck: driven west into the column, staggers back off it, stamps, tips, falls
  const struck = easeOut(clamp((t - SMASH) / 0.17));
  const stagger = smooth(seg(t, COLUMN + 0.15, STAMP));
  const xs = t < SMASH ? x : lerp(lerp(x, COLUMN_X + 62, struck), STAMP_X - 20, stagger);
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
  const stepR = t < 3.2 ? {x: xs + 60, y: G - 26} : {x: lerp(xs + 60, tab.x, smooth(seg(t, 3.2, STAMP))), y: G - 26 - 50 * Math.sin(Math.PI * smooth(seg(t, 3.2, STAMP)))};
  return {
    ...base, x: xs, y: G,
    drop: 80 * land + 20 * lunge * (1 - struck) + 26 * stagger, lean: 22 * land + 26 * lunge * (1 - turnBack * 0.6) - 30 * struck * (1 - stagger) + 18 * stagger,
    legL: {foot: {x: xs - 60 + 40 * lunge, y: G - 26}}, legR: {foot: stepR},
    armR: t < RAKE + 0.2 ? {hand: {x: lerp(xs - 80, xs + 230, smooth(seg(t, 1.55, RAKE))), y: lerp(G - 470, G - 300, smooth(seg(t, 1.55, RAKE))), z: 40}} : {fk: {fwd: 30 - 60 * struck, out: 30 + 30 * struck, bend: 40}},
    armL: t < SMASH ? (bh > 0 ? {hand: {x: lerp(xs + 40, xs + 290, bh), y: lerp(G - 420, G - 410, bh), z: 60}} : {fk: {fwd: 20, out: 20, bend: 60}}) : {fk: {fwd: 40, out: 40, bend: 20}},
    headPitch: 10 * lunge - 20 * struck + 15 * stagger, headYaw: 0,
    lock: t < SMASH ? 1 : 1 - 0.6 * smooth(seg(t, COLUMN, COLUMN + 1.0)), eyeOpen: t < COLUMN ? 1 : 0.5 + 0.5 * Math.round(rnd(Math.floor(T * 12) * 7)),
    tear, armOff: foreOff, leak: t >= COLUMN ? {t0: S0 + COLUMN, amt: hit ? 0.5 : 1, groundY: hit ? 0 : undefined} : undefined,
    sparks: [{t0: S0 + SMASH, where: 'chest'}, {t0: S0 + COLUMN, where: 'elbowL'}, {t0: S0 + COLUMN + 0.35, where: 'shoulderL'}],
    crackle: t >= COLUMN ? 1 : 0,
    fall: ang > 0.01 ? {ang, px: xs + 40, py: G} : undefined,
    dy, front: t >= TIP + 0.25,
  } as WardenProps & {dy: number; front: boolean};
};
const STAMP_X = 8820;

// ------------------------------------------------------------------ the Crew
const crewC8 = (t: number, T: number) => {
  const out: ActorProps[] = [];
  // builder: unclips the tablet, sees the warden, backs off, raked and thrown down; pulled up by the Director; runs
  const startle = smooth(seg(t, LAND, LAND + 0.2));
  const back = sk(t, [[0.9, 0], [1.45, 110]], 0.15);
  const thrown = smooth(seg(t, RAKE, RAKE + 0.4));
  const up = smooth(seg(t, 5.9, 6.6));
  const bxs = BX - 10 + back + 90 * thrown;
  const runB = sk(t, [[6.6, 0], [9.4, 1080]], 0.25);
  const lookBack = smooth(seg(t, 7.0, 7.3)) * (1 - smooth(seg(t, 7.9, 8.2)));
  let builder: ActorProps;
  if (t < 6.6) {
    builder = {...stand(look('builder'), bxs, G, {t}, 40), seed: 37, dmg: dmg('builder', T), z: 40, breath: 0.8,
      yaw: t < LAND ? -70 : lerp(-70, -80, startle), lean: lerp(10, -14, startle) * (1 - thrown) - 26 * thrown * (1 - up) + 10 * up,
      drop: 14 + 110 * thrown * (1 - up),
      legL: thrown > 0.3 && up < 0.5 ? {foot: {x: bxs - 120, y: G - 10}} : undefined, legR: thrown > 0.3 && up < 0.5 ? {foot: {x: bxs - 60, y: G - 10}} : undefined,
      face: t < LAND ? {mouth: 'flat', brows: 0.2, lookX: -0.6} : thrown > 0.3 && t < 5.5 ? {mouth: 'pain', brows: -0.4, worry: 0.8, lids: 0.4} : {...FACE.alarm, lookX: -0.4},
      head: {yaw: 0, pitch: thrown > 0.3 ? -10 : 0, roll: t > RAKE && t < RAKE + 0.5 ? 14 : 0}};
  } else {
    builder = {...mover(look('builder'), {x0: bxs, dist: runB, dir: 1, ground: G, gait: G_RUN, t}), seed: 37, dmg: dmg('builder', T), z: 40, face: lookBack > 0.3 ? {mouth: 'sad', worry: 0.9, brows: 0.3} : FACE.grit, head: {yaw: lerp(0, 150, lookBack), pitch: 10 * lookBack}};
  }
  const rb = solve(builder);
  const hands = {x: rb.P.x - 70, y: rb.P.y - 120};
  if (t < 0.55) {
    builder.armL = {hand: {x: PROJ.x - 48 + 20 * smooth(seg(t, 0.3, 0.55)), y: PROJ.y + 10, z: 60}};
    builder.armR = {hand: {x: PROJ.x + 24, y: PROJ.y + 22, z: 70}};
  } else if (t < RAKE + 0.05) {
    builder.armL = {hand: {x: hands.x, y: hands.y, z: 70}}; builder.armR = {hand: {x: hands.x + 30, y: hands.y + 10, z: 80}};
  } else if (t < 6.6) {
    builder.armR = up > 0.01 ? {hand: dirHandFor(t), w: up < 1 ? 1 : 1} : {fk: {fwd: 110, out: 30, bend: 40}};
    builder.armL = {fk: {fwd: thrown > 0.5 ? -30 : 60, out: 40, bend: 30}};
  }
  out.push(builder);
  // Director and carrier: run back for her, haul the hook back, let it swing; the Director takes the backhand
  const hk = davitHook(DAVIT.px, DAVIT.py, DAVIT.L, hookTheta(t));
  const holding = t >= 1.55 && t < 2.2;
  const dx = keys(t, [[0, 9570], [0.95, 9570], [1.55, 9330], [1.9, 9360], [2.2, 9190], [BACKHAND, 9140], [BACKHAND + 0.35, 9230], [5.6, 9230], [5.95, BX - 10 + 110 + 90 + 150]]);
  const hitD = smooth(seg(t, BACKHAND - 0.04, BACKHAND + 0.12)) * (1 - smooth(seg(t, BACKHAND + 0.5, BACKHAND + 1.2)));
  const runD = sk(t, [[6.6, 0], [9.4, 950]], 0.25);
  let director: ActorProps;
  if (t < 6.6) {
    const moving = (t > 0.95 && t < 1.55) || (t > 5.6 && t < 5.95);
    const dm = mover(look('director'), {x0: 9570, dist: 9570 - dx, dir: -1, ground: G, gait: G_RUN, t});
    director = {...(moving ? dm : stand(look('director'), dx, G, {t}, 46, -1)), x: dx, seed: 31, dmg: dmg('director', T), z: 20, breath: 0.9,
      yaw: t < 0.95 ? -60 : -90 + 40 * hitD, lean: holding ? (t < 1.9 ? -16 : 24) : (t > 2.2 && t < BACKHAND ? 20 : 4) - 26 * hitD, drop: holding ? 26 : 10 + 30 * hitD,
      face: hitD > 0.2 ? {mouth: 'pain', brows: -0.6, lids: 0.7} : t > 1.0 ? FACE.grit : {...FACE.worry, lookX: -0.5},
      head: {yaw: 0, roll: -24 * hitD, pitch: -14 * hitD},
      armR: holding ? {hand: {x: hk.x + 30, y: hk.y + 30, z: 30}} : t < 0.95 ? {fk: {fwd: 70 + 30 * Math.sin(t * 13), out: 20, bend: 40}} : undefined,
      armL: holding ? {hand: {x: hk.x + 10, y: hk.y + 60, z: -10}} : undefined};
    if (t > 5.95) director = {...director, yaw: -90, drop: 40, lean: -10, armR: {hand: dirHandFor(t)}, face: FACE.grit};
  } else {
    director = {...mover(look('director'), {x0: BX - 10 + 110 + 90 + 150, dist: runD, dir: 1, ground: G, gait: G_RUN, t}), seed: 31, dmg: dmg('director', T), z: 20, face: FACE.grit};
  }
  out.push(director);
  // carrier: beside the Director on the hook (good right arm), then limps on
  const cx = keys(t, [[0, 9640], [1.0, 9640], [1.6, 9400], [1.9, 9430], [2.25, 9300], [5.4, 9300]]);
  const cHold = t >= 1.6 && t < 2.2;
  const runC = sk(t, [[5.4, 0], [9.4, 880]], 0.3);
  const cm = t < 5.4 ? {...stand(look('carrier'), cx, G, {t}, 40, -1), x: cx} : mover(look('carrier'), {x0: 9300, dist: runC, dir: 1, ground: G, gait: {...G_HURRY, limp: limpOf('carrier', T)}, t});
  out.push({...cm, seed: 35, dmg: dmg('carrier', T), z: -30, yaw: t < 5.4 ? -90 : 90, lean: cHold ? (t < 1.9 ? -14 : 22) : (cm.lean ?? 4), drop: cHold ? 22 : (cm.drop ?? 8),
    armR: cHold ? {hand: {x: hk.x + 50, y: hk.y + 10, z: -20}} : t < 5.4 ? {fk: {fwd: 20, out: 10, bend: 30}} : cm.armR,
    armL: {fk: {fwd: 40, out: 4, bend: 110}}, handL: 'fist', face: FACE.pain, breath: 0.9});
  void CIV;
  return {out, hands};
};
// the Director's hand reaching down to the builder (and her hand meeting it)
const dirHandFor = (t: number): V2 => {
  const u = smooth(seg(t, 5.95, 6.6));
  return {x: lerp(BX - 10 + 110 + 90 + 60, BX + 260, u), y: lerp(G - 150, G - 330, u)};
};

// ------------------------------------------------------------------ camera
const camAt = (t: number): Cam => {
  const k: [number, Cam][] = [
    [0, {x: 8150, y: -1110, z: 1.3}], [0.12, {x: 8170, y: -1120, z: 1.3}], [0.95, {x: 8990, y: -1480, z: 1.15}], [3.5, {x: 8960, y: -1490, z: 1.22}],
    [5.45, {x: 8980, y: -790, z: 0.44}], [6.6, {x: 9020, y: -1510, z: 0.72}], [8.0, {x: 9220, y: -1530, z: 0.78}], [9.4, {x: 9420, y: -1530, z: 0.78}],
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
  const w = warden(t, T, {x: STAMP_X, y: G});
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
      back={<g>{repEl}{drone2}{!w.front && wEl}</g>}
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
  c(RAKE, 'body_fall', {pan: 0.2, gain: 1}),
  c(RAKE + 0.05, 'breath_exert', {pan: 0.2, gain: -3}),
  c(RAKE + 0.5, 'glass_shatter', {pan: -0.05, gain: -14, rate: 1.6}),
  c(BACKHAND, 'body_fall', {pan: 0.25, gain: -4, rate: 1.2}),
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
