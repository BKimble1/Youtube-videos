// V3 B (19.54 -> 44.64 s): who had what, the desk gag, and the game's one decision.
// 19.54  the camera arrives in Rao's window (A's swoop): the screen that just landed wakes, he turns to it
//        ("Rajesh Rao got the screen")
// 21.20  RIDE THE CABLE to the other building: along the network line behind his desk, out through the wall, down the
//        facade, under the lawn, up the other facade and in through Stocco's window
// 22.60  Stocco settles his hand over the space bar, which lights on "space bar"
// 23.80  pull back out to both windows; "Together": the screen rises out of Rao's window, the keyboard out of
//        Stocco's (his hand is left hovering over a bare desk), and they land on an ordinary desk that slides in on
//        the lawn between the buildings; an empty office chair rolls up on "sitting down" and bumps it on "desk"
// 28.30  push through the desk monitor's bezel into the game: pan over the little city
// 31.70  a supply plane (white and teal, a crate on its side) flies the arc -> Rao's eyes follow it on his screen
//        ("Let it through"); it drops its crate on a parachute into the city; he nods
// 35.04  the pirate ship fires: launch flash and smoke, a red rocket climbs the SAME arc
// 36.15  the diptych again: Rao leans in, his cap lights, the command runs the route, Stocco's finger is driven down
//        (contact on "Shoot"); CUT ON THE CLICK to the cannon; the rocket bursts on "down"
// 38.73  "Easy enough": Stocco, unaware, glances at his hand and back at his bare wall
// 39.65  "the only person who could see the difference": Rao's face, plane then rocket reflected in his glasses
// 41.91  "had no way to press fire himself": his eyes drop to his right hand; the fingers lift and tap the bare desk;
//        he looks back up at his screen and the camera pushes into it: the plain game, full frame (C's first frame)
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {arcPt, GEvent, GameScreen} from '../art/game';
import {INK, K, Tag} from '../art/kit';
import {FPS, T} from './core2';
import {GAME_FULL} from './contracts';
import {
  camL, camLerp, camPath, CamS, camR, camT, fullGameCam, lin1, Lw, MonitorV2, OfficeChair, PlainDesk, RAO_HEAD, RAO_P,
  RAO_ROUTE, RaoRoom, RMON, ROUTE, Rw, STO_HEAD, STO_KEY, STO_P, STO_ROUTE, StoccoRoom, toScr, World, LAWN,
} from './abworld';
import {CampusA, campusCamA, GameWorld} from './SeqA';
import {Diptych, dipRects, Panel} from './abdip';
import {H_FLAT, H_HOVER, H_REST, HPose, HS, KB, KEY, KeyboardHU, mixH, tmsPress, W as HW} from './abhand';
import {Pose} from './crew3';

// ---------------------------------------------------------------- timing
const T_RIDE = 21.2;
const T_STO = 22.62;
const T_OUTB = 23.85;
const T_LIFT = () => T('Together') + 0.25;
const T_DESKIN = () => T('the equipment') - 0.25;
const T_CHAIR = () => T('sitting') - 0.05;
const T_BUMP = () => T('desk') + 0.03;
const T_GAME = () => T('Rao’s job') - 0.02;
const T_PLANE = () => T('A supply plane') + 0.05;
const PLANE_DUR = 2.55;
const T_RAO1 = () => T('Let it through') - 0.25;
const T_GAME2 = () => T('Let it through') + 0.95;
const T_ROCKET = () => T('launches') - 0.05;
const T_DIP = () => T('rocket?') + 0.05;
/** the command for "Shoot it down": contact on "Shoot" */
const CB = () => {
  const tp = T('Shoot it down') + 0.12 - 0.35;
  return {cap: tp - 0.5, comp: tp - 0.36, wall: tp - 0.27, enter: tp - 0.13, coil: tp, tp};
};
const T_FIRE = () => tmsPress(0, CB().tp).tc + 1 / FPS;
const T_STO2 = () => T('Easy enough') - 0.15;
const T_RAOF = () => T('except') - 0.06;
const T_RHAND = () => T('had no way') - 0.1;
const T_END = 1339 / FPS; // B's last frame = GAME_FULL
/** C runs GameScreen on t = film time - 46.22; B's last game shots use the same clock so the ship's bob is continuous */
const C_CLOCK = 46.22;

const EVB = (): GEvent[] => [
  {kind: 'plane', t0: T_PLANE(), dur: PLANE_DUR},
  {kind: 'rocket', t0: T_ROCKET(), dur: 3.4, fire: T_FIRE()},
];
/** what Rao's glasses reflect while "the only person who could see the difference" (a plane, then a rocket) */
const EV_LENS = (): GEvent[] => [
  {kind: 'plane', t0: T('except') - 0.4, dur: 1.6},
  {kind: 'rocket', t0: T('the difference') - 0.6, dur: 1.6},
];

// ---------------------------------------------------------------- game extras: launch flash, supply crate on a parachute
const GameExtras: React.FC<{t: number; events: GEvent[]}> = ({t, events}) => (
  <g>
    {events.map((e, i) => {
      if (e.kind === 'rocket') {
        const k = (t - e.t0) / 0.6;
        if (k < 0 || k > 1) return null;
        const r = 10 + 34 * easeOut(k);
        return (
          <g key={i} opacity={1 - k}>
            <circle cx={140} cy={300} r={r * 0.7} fill={K.saffron} opacity={1 - k * 0.5} />
            {[0, 1, 2, 3].map((j) => <circle key={j} cx={128 + Math.cos(j * 1.7) * r} cy={312 + Math.sin(j * 1.7) * r * 0.5} r={r * 0.45} fill="#F2F2F2" stroke={INK} strokeWidth={2} />)}
          </g>
        );
      }
      const k = (t - (e.t0 + e.dur * 0.82)) / 1.6;
      if (k < 0 || k > 1.6) return null;
      const p0 = arcPt(0.82);
      const x = p0.x + 30 * Math.min(1, k) + Math.sin(k * 5) * 4;
      const y = lerp(p0.y + 10, 318, easeOut(Math.min(1, k)));
      const landed = k >= 1;
      return (
        <g key={i} opacity={clamp((1.6 - k) / 0.3)}>
          {!landed && (
            <g>
              <path d={`M${fmt(x - 20)},${fmt(y - 30)} Q${fmt(x)},${fmt(y - 52)} ${fmt(x + 20)},${fmt(y - 30)} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
              <path d={`M${fmt(x - 19)},${fmt(y - 30)} L${fmt(x - 5)},${fmt(y - 6)} M${fmt(x + 19)},${fmt(y - 30)} L${fmt(x + 5)},${fmt(y - 6)}`} stroke={INK} strokeWidth={1.6} />
            </g>
          )}
          <rect x={x - 8} y={y - 7} width={16} height={13} fill="#E8C48A" stroke={INK} strokeWidth={2} />
          <path d={`M${fmt(x)},${fmt(y - 7)} L${fmt(x)},${fmt(y + 6)} M${fmt(x - 8)},${fmt(y - 0.5)} L${fmt(x + 8)},${fmt(y - 0.5)}`} stroke={INK} strokeWidth={1.4} />
        </g>
      );
    })}
  </g>
);
const GameShot: React.FC<{cam: CamS; t: number; events: GEvent[]; children?: React.ReactNode}> = ({cam, t, events, children}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#9FD3EC" />
    <g transform={camT(cam)}>
      <GameWorld id="vb" t={t} events={events} trail>
        <GameExtras t={t} events={events} />
        {children}
      </GameWorld>
    </g>
  </g>
);
const RoomShot: React.FC<{cam: CamS; children: React.ReactNode}> = ({cam, children}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
    <World cam={cam}>{children}</World>
  </g>
);

// ---------------------------------------------------------------- the desk gag (CW units: the lawn between the buildings)
const LD = {x0: -190, x1: 190, y: LAWN + 104, d: 26, h: 92};
const L_MON = {x: -48, y: LD.y, s: RMON.s / 3};
const L_KB = {x: 62, y: LD.y + 3};
/** the room keyboard (KeyboardHU) drawn with its top-front centre at p, scale s (CW units per hand unit) */
const KbAt: React.FC<{p: {x: number; y: number}; s: number; id: string}> = ({p, s, id}) => (
  <g transform={`translate(${fmt(p.x)} ${fmt(p.y)}) scale(${s.toFixed(5)}) translate(${(-KEY.x).toFixed(2)} ${(-KB.base).toFixed(2)})`}>
    <KeyboardHU id={id} inkW={40} />
  </g>
);
const KB_S = HS / 3;
/** the keyboard's base-centre in Stocco's room (room-local) */
const KB_ROOM = {x: STO_P.x + (KEY.x - HW.x) * HS, y: STO_P.y + (KB.base - HW.y) * HS};
const arcTo = (t: number, t0: number, t1: number, a: {x: number; y: number}, b: {x: number; y: number}, h: number) => {
  const u = clamp((t - t0) / (t1 - t0));
  const e = easeInOut(u);
  const after = t - t1;
  const bounce = after > 0 ? Math.exp(-after * 10) * Math.sin(after * 28) * 6 : 0;
  return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - h * Math.sin(Math.PI * u) - bounce, u};
};
const DeskGag: React.FC<{t: number}> = ({t}) => {
  const tl = T_LIFT();
  if (t < tl) return null;
  const tDesk = T_DESKIN();
  const deskK = easeOut(clamp((t - tDesk) / 0.45));
  const deskX = lerp(900, 0, deskK);
  const deskBump = t > T_BUMP() ? Math.sin((t - T_BUMP()) * 40) * 3 * Math.exp(-(t - T_BUMP()) * 9) : 0;
  const mon = arcTo(t, tl, tDesk + 0.55, Lw({x: RMON.x, y: RMON.y}), {x: L_MON.x, y: L_MON.y}, 150);
  const kb = arcTo(t, tl + 0.18, tDesk + 0.75, Rw(KB_ROOM), {x: L_KB.x, y: L_KB.y}, 130);
  const chairK = clamp((t - (T_CHAIR() - 0.6)) / 0.62);
  const chairX = lerp(700, 120, easeOut(chairK));
  const after = t - T_BUMP();
  const chairRock = after > 0 ? Math.sin(after * 16) * 4 * Math.exp(-after * 4) : 0;
  const wake = clamp((t - (T_BUMP() + 0.15)) / 0.25);
  return (
    <g>
      <g transform={`translate(${fmt(deskX + deskBump)} 0)`}>
        {deskK > 0.001 && <PlainDesk id="vb-ldesk" x0={LD.x0} x1={LD.x1} y={LD.y} d={LD.d} h={LD.h} />}
      </g>
      <MonitorV2 id="vb-lmon" x={mon.x + (mon.u >= 1 ? deskBump : 0)} y={mon.y} s={L_MON.s} on={0.35 + 0.65 * wake} glare={1 - clamp((t - (T_GAME() - 0.7)) / 0.4)} edge={1 - clamp((t - (T_GAME() - 0.5)) / 0.4)}>
        <GameScreen t={t} events={[]} />
      </MonitorV2>
      <KbAt id="vb-lkb" p={{x: kb.x + (kb.u >= 1 ? deskBump : 0), y: kb.y}} s={KB_S} />
      {chairK > 0 && <OfficeChair x={chairX} y={LD.y + LD.h + 30} s={0.3} rock={chairRock} spin={chairX / 30} />}
    </g>
  );
};
/** the lawn monitor's GAME_FULL camera (CW units) */
const LAWN_FULL = fullGameCam(L_MON);
/** game units <-> CW units on the lawn monitor */
const g2c = (g: CamS): CamS => ({x: L_MON.x + (g.x - 320) * L_MON.s, y: L_MON.y + (g.y - 510) * L_MON.s, z: g.z / L_MON.s});
const c2g = (c: CamS): CamS => ({x: 320 + (c.x - L_MON.x) / L_MON.s, y: 510 + (c.y - L_MON.y) / L_MON.s, z: c.z * L_MON.s});
/** one continuous push through the bezel into the game (game units): it becomes the game shot once the screen
 *  fills the frame */
const P_IN0 = () => T_GAME() - 1.0;
const P_IN1 = () => T_GAME() + 0.55;
const G_IN1: CamS = {x: 330, y: 206, z: 3.5};
const pushG = (t: number): CamS => {
  const a = c2g({x: 20, y: 700, z: 1.7});
  const u = easeInOut(clamp((t - P_IN0()) / (P_IN1() - P_IN0())));
  const z = Math.exp(lerp(Math.log(a.z), Math.log(G_IN1.z), u));
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / G_IN1.z);
  return {x: lerp(a.x, G_IN1.x, w), y: lerp(a.y, G_IN1.y, w), z};
};
const inGame = (t: number) => t >= P_IN0() && pushG(t).z >= 3.02;

// ---------------------------------------------------------------- the campus camera through B's campus part
const campusCamB = (t: number): CamS => {
  if (t < 20.0) return campusCamA(t);
  if (t >= P_IN0()) return g2c(pushG(t));
  return camPath(t, [
    [20.0, camL({x: 720, y: 560}, 1.32)],
    [T_RIDE, camL({x: 880, y: 530}, 1.5), lin1],
    // ride the network cable: along the desk, out through the wall, down the facade, under the lawn, up, in
    [T_RIDE + 0.32, camL({x: 1560, y: 744}, 1.3), easeIn],
    [T_RIDE + 0.56, {x: -172, y: 640, z: 2.2}, lin1],
    [T_RIDE + 0.8, {x: 0, y: 772, z: 1.9}, lin1],
    [T_RIDE + 1.04, {x: 172, y: 600, z: 2.2}, lin1],
    [T_STO, camR({x: 600, y: 640}, 1.55), easeOut],
    [T_OUTB - 0.05, camR({x: 650, y: 640}, 1.75)],
    // back out to both buildings for "Together", then toward the desk on the lawn
    [T('Together') + 0.05, {x: 0, y: 560, z: 0.92}],
    [T_DESKIN() + 0.6, {x: 0, y: 640, z: 1.12}],
    [T_BUMP() + 0.2, {x: 20, y: 700, z: 1.7}],
    [P_IN0(), {x: 20, y: 700, z: 1.7}, lin1],
  ]);
};

// ---------------------------------------------------------------- performances
const raoFaceB = (t: number): Partial<Pose> => {
  // "got the screen": turns to it as it wakes, a small lean in
  const turn = clamp((t - (T('Rao got') - 0.1)) / 0.35);
  return {lookX: lerp(0.2, 0.9, turn), lookY: lerp(0.15, 0.05, turn), tilt: 3 * turn, lean: 1.5 * turn, brows: 0.25 * turn, mouth: 'smile'};
};
const stoHandB = (t: number): {pose: HPose; armLift: number} => {
  // he settles his hand over the space bar: a small lift (anticipation), then down to hover with a soft overshoot
  const t0 = T('Andrea') - 0.1;
  const up = clamp((t - t0) / 0.28), down = clamp((t - (t0 + 0.28)) / 0.5);
  const lift = Math.sin(Math.PI * clamp(up * 0.5 + down * 0.5)) * 140;
  const settle = down > 0 ? 1 - Math.exp(-down * 5) * Math.cos(down * 9) : 0;
  const pose = t < t0 ? H_REST : mixH(mixH(H_REST, {...H_HOVER, a: [0, 12, 8], wrist: -4}, up), H_HOVER, settle);
  return {pose, armLift: lift};
};

// ---------------------------------------------------------------- the diptych for "Shoot it down"
const dipB = (t: number) => {
  const cb = CB();
  const u = easeInOut(clamp((t - T_DIP()) / 0.5));
  const L: Panel = {rect: dipRects(860)[0], cam: {x: lerp(860, 840, u), y: 520, z: lerp(1.05, 1.0, u)}};
  const R: Panel = {rect: dipRects(860)[1], cam: {x: lerp(780, 740, u), y: lerp(560, 600, u), z: lerp(1.2, 1.36, u)}};
  const ev = EVB();
  const sh = tmsPress(t, cb.tp);
  const sigL = clamp((t - cb.cap) / (cb.wall - cb.cap)) + (t > cb.wall ? (t - cb.wall) * 0.4 : 0);
  const sigR = t >= cb.enter ? clamp((t - cb.enter) / (cb.coil - cb.enter)) + (t > cb.coil ? (t - cb.coil) * 0.3 : 0) : -1;
  const conc = clamp((t - T_DIP()) / 0.25);
  const roomL = (
    <RaoRoom id="vb-drao" f={Math.round(t * FPS)} screen={<GameWorld id="vb-dg" t={t} events={ev} />} capLit={clamp((t - (cb.cap - 0.25)) / 0.2)} compBlink={t > cb.comp && t < cb.comp + 0.4 ? 1 : 0} compColor={K.saffron}
      face={{lookX: 0.9, lookY: 0.0, brows: -0.5 * conc, mouth: 'flat', lean: -2 * conc}} lens={0.9} lensContent={<GameScreen t={t} events={ev} />} sig={t >= cb.cap ? sigL : -1} zr={L.cam.z} />
  );
  const roomR = (
    <StoccoRoom id="vb-dsto" f={Math.round(t * FPS)} coilPulse={t >= cb.coil ? 1 - clamp((t - cb.coil) / 0.25) : 0} tmsLit={t > cb.enter && t < cb.coil + 0.3 ? 1 : 0} sig={sigR}
      stim={t >= cb.coil ? (t - cb.coil) * 5 : -1} hand={sh.pose} press={sh.press} keyGlow={sh.keyGlow} drive={t >= cb.coil + 0.03 ? (t - cb.coil - 0.03) / 0.16 : -1} zr={R.cam.z} />
  );
  const bridge = t >= cb.wall ? clamp((t - cb.wall) / (cb.enter - cb.wall)) + (t > cb.enter ? (t - cb.enter) * 0.6 : 0) : -1;
  return {L, R, roomL, roomR, bridge};
};

// ---------------------------------------------------------------- Rao's hand: nothing to press
const raoTap = (t: number): HPose => {
  const t0 = T('no way') + 0.05;
  const LIFTED: HPose = {wrist: -1, a: [-12, 8, 4], curl: 0.1};
  const k = (x: number) => clamp(x);
  const up1 = k((t - t0) / 0.22), dn1 = k((t - (t0 + 0.3)) / 0.12), up2 = k((t - (t0 + 0.55)) / 0.18), dn2 = k((t - (t0 + 0.8)) / 0.14);
  const lift = easeOut(up1) * (1 - easeIn(dn1)) + easeOut(up2) * (1 - easeIn(dn2)) * 0.8;
  return mixH(H_FLAT, LIFTED, lift);
};

// ---------------------------------------------------------------- the sequence
export const VB: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const ev = EVB();

  // ---- 1. Rao's window, the ride along the cable, Stocco's window, back out, the desk gag (campus world)
  if (t < T_GAME() + 1 && !inGame(t)) {
    const C = campusCamB(t);
    const zr = C.z / 3;
    const lifted = t > T_LIFT() + 0.02;
    const sh = stoHandB(t);
    const roomL = (
      <RaoRoom id="vb-rao" f={f} screen={<GameWorld id="vb-g" t={t} events={[]} />} face={raoFaceB(t)} lens={0.6} lensContent={<GameScreen t={t} events={[]} />} mon={lifted ? 0 : 1} zr={zr} />
    );
    const roomR = (
      <StoccoRoom id="vb-sto" f={f} hand={sh.pose} armLift={sh.armLift} kb={t > T_LIFT() + 0.2 ? 0 : 1} keyGlow={0.8 * clamp((t - (T('space bar') - 0.05)) / 0.15) * (1 - clamp((t - (T_OUTB + 0.3)) / 0.3))}
        face={{lookX: t > T_LIFT() + 0.3 ? -0.8 : 0.05, lookY: t > T_LIFT() + 0.3 ? 0.7 : 0.18, brows: t > T_LIFT() + 0.3 ? 0.6 : 0, mouth: t > T_LIFT() + 0.3 ? 'o' : 'flat'}} zr={zr} />
    );
    const head = toScr(C, Lw({x: RAO_HEAD.x, y: RAO_HEAD.y - 130}));
    const sHead = toScr(C, Rw({x: STO_HEAD.x, y: STO_HEAD.y - 140}));
    const tagR = clamp((t - (T('Rajesh Rao') + 0.1)) / 0.3) * (1 - clamp((t - (T_RIDE - 0.1)) / 0.25));
    const tagS = clamp((t - (T('Andrea Stocco') + 0.05)) / 0.3) * (1 - clamp((t - (T_OUTB + 0.1)) / 0.25));
    return (
      <g>
        <CampusA f={f} C={C} t={t} roomL={roomL} roomR={roomR} id="vb" sig={t > T_RIDE + 0.05 && t < T_STO + 0.1 ? lerp(ROUTE.kComp + 0.01, ROUTE.kB + 0.03, easeInOut(clamp((t - (T_RIDE + 0.05)) / (T_STO - T_RIDE - 0.15)))) : -1} overlay={<DeskGag t={t} />} />
        <Tag x={clamp(head.x, 260, 1660)} y={clamp(head.y, 110, 820)} text="Rajesh Rao" size={48} k={tagR} />
        <Tag x={clamp(sHead.x, 260, 1660)} y={clamp(sHead.y, 110, 820)} text="Andrea Stocco" size={48} k={tagS} />
      </g>
    );
  }
  // ---- 2. the game: the little city, the plane
  if (t < T_RAO1()) {
    const tp = T_PLANE();
    const pp = arcPt(clamp((t - tp) / PLANE_DUR));
    const cam = t < P_IN1() ? pushG(t) : camPath(t, [
      [P_IN1(), G_IN1],
      [T('little city') + 0.2, {x: 520, y: 250, z: 3.9}],
      [tp - 0.1, {x: 220, y: 240, z: 3.6}],
    ]);
    const follow = t > tp - 0.1 ? camLerp(cam, {x: pp.x + 40, y: pp.y + 40, z: 3.9}, easeInOut(clamp((t - tp + 0.1) / 0.5))) : cam;
    return <GameShot cam={follow} t={t} events={ev} />;
  }
  // ---- 3. Rao lets it through: his eyes follow the plane on his screen; the crate drops; he nods
  if (t < T_GAME2()) {
    const pu = clamp((t - T_PLANE()) / PLANE_DUR);
    const cam = camPath(t, [
      [T_RAO1(), {x: 860, y: 520, z: 1.75}],
      [T_GAME2(), {x: 880, y: 515, z: 1.85}, lin1],
    ]);
    const nod = Math.sin(Math.PI * clamp((t - (T('through') - 0.05)) / 0.4)) * 5;
    const crate = clamp((t - (T_PLANE() + PLANE_DUR * 0.82 + 1.0)) / 0.3);
    return (
      <RoomShot cam={cam}>
        <RaoRoom id="vb-rao2" f={f} screen={<GameWorld id="vb-g2" t={t} events={ev}><GameExtras t={t} events={ev} /></GameWorld>} lens={0.9} lensContent={<GameScreen t={t} events={ev} />} zr={cam.z}
          face={{lookX: lerp(0.55, 1.0, pu), lookY: lerp(0.0, -0.5, Math.sin(Math.PI * pu)), mouth: crate > 0.5 ? 'grin' : 'smile', brows: 0.2 + 0.2 * crate, tilt: nod, lean: 1}} />
      </RoomShot>
    );
  }
  // ---- 4. the ship fires a rocket up the same arc
  if (t < T_DIP()) {
    const tr = T_ROCKET();
    const rp = arcPt(clamp((t - tr) / 3.4));
    const cam = camPath(t, [
      [T_GAME2(), {x: 470, y: 260, z: 3.4}],
      [tr - 0.25, {x: 160, y: 290, z: 4.6}],
      [T_DIP(), {x: rp.x + 60, y: rp.y + 30, z: 4.0}, easeInOut],
    ]);
    return <GameShot cam={cam} t={t} events={ev} />;
  }
  // ---- 5. "Shoot it down": the route, the driven finger
  if (t < T_FIRE()) {
    const d = dipB(t);
    return <Diptych id="vb-dip" L={d.L} R={d.R} roomL={d.roomL} roomR={d.roomR} C={{x: 0, y: 470, z: 1.32}} m={0} campus={<CampusA f={f} C={{x: 0, y: 470, z: 1.32}} t={t} roomL={<g />} roomR={<g />} id="vb-dc" sig={-1} overlay={<g />} />} sig={d.bridge} routeL={RAO_ROUTE.P.pts} routeR={STO_ROUTE.pts} />;
  }
  // ---- 6. CUT ON THE CLICK: the cannon fires, the rocket bursts
  if (t < T_STO2()) {
    const cam = camPath(t, [
      [T_FIRE(), {x: 400, y: 214, z: 3.45}],
      [T_FIRE() + 0.9, {x: 390, y: 212, z: 3.35}, easeOut],
      [T_STO2(), {x: 380, y: 210, z: 3.3}, lin1],
    ]);
    return <GameShot cam={cam} t={t} events={ev} />;
  }
  // ---- 7. "Easy enough": Stocco never saw any of it
  if (t < T_RAOF()) {
    const cam = camPath(t, [
      [T_STO2(), {x: 840, y: 560, z: 1.55}],
      [T_RAOF(), {x: 870, y: 540, z: 1.66}, lin1],
    ]);
    const g = clamp((t - (T_STO2() + 0.15)) / 0.25) * (1 - clamp((t - (T_RAOF() - 0.3)) / 0.25));
    const flex = Math.sin(Math.PI * clamp((t - (T_STO2() + 0.3)) / 0.45));
    return (
      <RoomShot cam={cam}>
        <StoccoRoom id="vb-sto3" f={f} zr={cam.z} hand={mixH(H_HOVER, {wrist: -2, a: [2, 30, 22], curl: 0.6}, flex * 0.8)}
          face={{lookX: lerp(0.05, -0.9, g), lookY: lerp(0.18, 0.8, g), brows: 0.5 * g, browAsym: 0.4 * g, mouth: g > 0.5 ? 'hmm' : 'flat', tilt: -4 * g}} />
      </RoomShot>
    );
  }
  // ---- 8. the only person who could see the difference
  if (t < T_RHAND()) {
    const cam = camPath(t, [
      [T_RAOF(), {x: RAO_HEAD.x + 60, y: RAO_HEAD.y + 30, z: 2.6}],
      [T_RHAND(), {x: RAO_HEAD.x + 30, y: RAO_HEAD.y + 10, z: 3.4}, easeInOut],
    ]);
    const le = EV_LENS();
    const live = le.find((e) => t >= e.t0 && t < e.t0 + e.dur) ?? le[0];
    const lu = clamp((t - live.t0) / live.dur);
    const isRocket = live.kind === 'rocket' && t >= live.t0;
    const drop = clamp((t - (T_RHAND() - 0.3)) / 0.25);
    return (
      <RoomShot cam={cam}>
        <RaoRoom id="vb-rao3" f={f} screen={<GameWorld id="vb-g3" t={t} events={le} />} zr={cam.z} lens={1} lensContent={<LensCrop t={t} />}
          face={{lookX: lerp(lerp(0.5, 1.0, lu), -0.6, drop), lookY: lerp(lerp(0.1, -0.4, Math.sin(Math.PI * lu)), 0.85, drop), mouth: isRocket ? 'flat' : 'smile', brows: isRocket ? -0.4 + 0.8 * drop : 0.2, lean: isRocket ? -1.5 : 0, tilt: -3 * drop}} />
      </RoomShot>
    );
  }
  // ---- 9. no way to press fire himself -> into his screen (GAME_FULL at T_END)
  if (t < T_END - 1e-6) {
    const fin = fullGameCam(RMON);
    const look = clamp((t - (T_RHAND() - 0.05)) / 0.1) * (1 - clamp((t - (T('himself') - 0.05)) / 0.3));
    const cam = camPath(t, [
      [T_RHAND(), {x: 560, y: 600, z: 1.9}],
      [T('press fire') - 0.1, {x: 480, y: 650, z: 2.1}],
      [T('himself') + 0.1, {x: 640, y: 600, z: 1.7}],
      [T_END - 0.32, {...fin, z: fin.z * 0.9}, easeIn],
      [T_END - 0.08, fin, easeOut],
    ]);
    const glare = clamp((3.2 - cam.z) / 0.6);
    return (
      <RoomShot cam={cam}>
        <RaoRoom id="vb-rao4" f={f} screen={<GameScreen t={t - C_CLOCK} events={[]} />} zr={cam.z} glare={glare} edge={glare} hand={raoTap(t)}
          face={{lookX: lerp(0.9, -0.6, look), lookY: lerp(0.05, 0.85, look), brows: 0.5 * look, mouth: look > 0.5 ? 'frown' : 'flat', tilt: -4 * look, lean: -1 * look}} />
      </RoomShot>
    );
  }
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#9FD3EC" />
      <g transform={GAME_FULL}>
        <GameScreen t={t - C_CLOCK} events={[]} />
      </g>
    </g>
  );
};

/** what the glasses reflect: a close crop of the game around whatever is flying (plane, then rocket) */
const LensCrop: React.FC<{t: number}> = ({t}) => {
  const ev = EV_LENS();
  const live = ev.find((e) => t >= e.t0 && t < e.t0 + e.dur) ?? ev[0];
  const p = arcPt(clamp((t - live.t0) / live.dur));
  return (
    <g transform={`translate(320 200) scale(2.6) translate(${fmt(-p.x)} ${fmt(-p.y)})`}>
      <GameScreen t={t} events={ev} />
    </g>
  );
};

/** sound cues (gain dB) */
export const CUES_VB = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const ev = EVB();
  const cb = CB();
  return [
    {t: T('screen') - 0.1, kind: 'tick', gain: -12},
    {t: T_RIDE + 0.2, kind: 'packet_send', gain: -14},
    {t: T('space bar') - 0.02, kind: 'tick', gain: -10},
    {t: T_LIFT(), kind: 'whoosh', gain: -12, dur: 0.6},
    {t: T_DESKIN() + 0.55, kind: 'tick', gain: -8},
    {t: T_DESKIN() + 0.75, kind: 'tick', gain: -8},
    {t: T_BUMP(), kind: 'tick', gain: -4},
    {t: ev[0].t0, kind: 'plane_pass', gain: -6, dur: ev[0].dur},
    {t: ev[0].t0 + ev[0].dur * 0.82 + 1.0, kind: 'pop', gain: -12},
    {t: ev[1].t0, kind: 'rocket_launch', gain: -5},
    {t: cb.cap, kind: 'packet_send', gain: -12},
    {t: cb.coil, kind: 'coil_pulse', gain: -4},
    {t: tmsPress(0, cb.tp).tc, kind: 'key_click', gain: 0},
    {t: T_FIRE(), kind: 'cannon', gain: 0},
    {t: T_FIRE() + 0.32, kind: 'boom', gain: -1},
    {t: T('no way') + 0.27, kind: 'tick', gain: -16},
    {t: T('no way') + 0.85, kind: 'tick', gain: -16},
  ];
};
export {STO_KEY, RAO_P, STO_P};
