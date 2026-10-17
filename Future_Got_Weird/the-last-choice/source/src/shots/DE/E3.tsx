// E3 — Evening. A row of chairs. The teammate (sling) sets the visor on the empty chair beside them. A service bot,
// restoring the seating area, lifts it into its tray and straightens the chair; the teammate reaches — the bot moves the
// hand aside, gently — and glides on. The Director rises from the bench apart, takes the visor from the tray (the bot's
// eye regards them, then it moves on), sits back down and holds it. No tug-of-war; the transfer is continuous. (9.0 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps, solve, handCenter} from '../../rig/actor';
import {ServiceBot, serviceGrip, ServiceBotProps} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, easeOut, clamp, V2} from '../../kit/math';
import {ChairRow, chairSeats, Bench, benchTop} from '../../sets/refugeInterior';
import {Glow} from '../../fx/light';
import {InteriorBack, Tint, Visor, seated, basis, Basis3, visorPt} from './common';
import {mixBasis} from './D2';

const ID = 'E3';
export const E3_TIME = 2.05;
const CH = {x: -380, sp: 190, s: 1};       // chairs 1–4 at x = −380, −190, 0, 190
const SEATS = chairSeats(CH.x, 0, 4, CH.sp, CH.s);
const BENCH = {x: 640, y: 50, s: 1};
const LAP_B = basis(40, 30, 0), SEAT_B = basis(28, 18, 0), TRAY_B = basis(34, 22, 0);
/** Visor centre so that a given visor point (th, ey, rr) lands at world point p. */
const placeBy = (p: V2, b: Basis3, th: number, ey: number, rr: number): V2 => {
  const q = visorPt(0, 0, 1, b, th, ey, rr);
  return {x: p.x - q.x, y: p.y - q.y};
};

const E3: React.FC = () => {
  const {t, T} = useShot(ID);
  // ---------------- timing
  const place = easeInOut(seg(t, 0.6, 1.4));
  const botIn = easeOut(seg(t, 2.3, 3.75));
  const reachV = easeInOut(seg(t, 3.75, 4.2));
  const lift = easeInOut(seg(t, 4.25, 4.95));
  const mateReach = easeInOut(seg(t, 4.35, 4.95));
  const aside = easeInOut(seg(t, 5.0, 5.45));
  const straighten = easeInOut(seg(t, 5.5, 5.95));
  const botOn = easeInOut(seg(t, 6.0, 7.0));
  const rise = easeInOut(seg(t, 6.0, 6.6));
  const step = easeInOut(seg(t, 6.35, 7.0));
  const take = easeInOut(seg(t, 7.0, 7.35));
  const regard = smooth(seg(t, 7.3, 7.6)) * (1 - smooth(seg(t, 7.9, 8.2)));
  const botAway = easeInOut(seg(t, 8.0, 9.0));
  const back = easeInOut(seg(t, 7.7, 8.3));
  const sitDown = easeInOut(seg(t, 8.2, 8.9));
  // ---------------- the bot (dir −1: eye leads to the right; the arm trails on its left)
  const bx = lerp(lerp(-1150, 150, botIn), 400, botOn) + 600 * botAway;
  const byy = 70 - 110 * botAway;
  const bs = 1 - 0.1 * botAway;
  const chairOff = 22 * (1 - straighten), chairTilt = 5 * (1 - straighten);
  const seat3 = {x: SEATS[2].x + chairOff, y: SEATS[2].y};
  const visorOnSeat = {x: seat3.x + 4, y: seat3.y - 16};
  const trayTop = {x: bx, y: byy - 223 * bs};
  // the teammate's right hand (needed for the bot's "aside" contact)
  const lapHand = {x: SEATS[1].x + 34, y: SEATS[1].y - 8};
  const reachHand = {x: lerp(lapHand.x, bx - 70, mateReach), y: lerp(lapHand.y, trayTop.y - 20, mateReach)};
  const asideHand = {x: lerp(reachHand.x, SEATS[1].x + 10, aside), y: lerp(reachHand.y, SEATS[1].y + 30, aside)};
  // gripper target over time
  const rest: V2 = {x: bx - 90, y: byy - 80};
  let reach: V2 = rest, grip = 0;
  if (t < 3.75) reach = rest;
  else if (t < 4.25) { reach = {x: lerp(rest.x, visorOnSeat.x + 30, reachV), y: lerp(rest.y, visorOnSeat.y - 6, reachV)}; grip = smooth(seg(t, 4.05, 4.25)); }
  else if (t < 4.95) { const a = {x: visorOnSeat.x + 30, y: visorOnSeat.y - 6}, b = {x: trayTop.x - 30, y: trayTop.y - 26}; reach = {x: lerp(a.x, b.x, lift), y: lerp(a.y, b.y, lift) - Math.sin(Math.PI * lift) * 60}; grip = 1 - smooth(seg(t, 4.78, 4.95)); }
  else if (t < 5.45) { reach = {x: lerp(trayTop.x - 30, reachHand.x + 10, smooth(seg(t, 4.95, 5.05))) + (asideHand.x - reachHand.x), y: lerp(trayTop.y - 26, reachHand.y - 6, smooth(seg(t, 4.95, 5.05))) + (asideHand.y - reachHand.y)}; grip = 0.3; }
  else if (t < 5.95) { const a = {x: SEATS[1].x + 10, y: SEATS[1].y + 24}, b = {x: seat3.x - 70, y: seat3.y - 70}; const k = smooth(seg(t, 5.45, 5.6)); reach = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)}; grip = 0.2; }
  else { reach = {x: lerp(seat3.x - 70, rest.x, smooth(seg(t, 5.95, 6.4))), y: lerp(seat3.y - 70, rest.y, smooth(seg(t, 5.95, 6.4)))}; }
  const botP: ServiceBotProps = {x: bx, y: byy, s: bs, t, seed: 3, dir: -1, dist: bx, reach, grip, light: 0.8 + 0.2 * regard};
  const gripW = serviceGrip(botP);
  // ---------------- the visor: lap → seat → gripper → tray → the Director's hands
  const mate = seated(look('teammate'), SEATS[1].x, 0, SEATS[1].y + 6, {t, s: 1, yaw: 12, z: 0, seed: 33, knees: 70, spread: 36});
  // teammate's right-hand target
  let mateHand: V2 = lapHand;
  if (t < 1.4) mateHand = {x: lerp(lapHand.x, visorOnSeat.x - 20, place), y: lerp(lapHand.y, visorOnSeat.y + 10, place) - Math.sin(Math.PI * place) * 30};
  else if (t < 2.0) mateHand = {x: lerp(visorOnSeat.x - 20, lapHand.x, smooth(seg(t, 1.4, 2.0))), y: lerp(visorOnSeat.y + 10, lapHand.y, smooth(seg(t, 1.4, 2.0)))};
  else if (t < 5.0) mateHand = reachHand;
  else if (t < 5.45) mateHand = asideHand;
  else mateHand = {x: lerp(asideHand.x, lapHand.x, smooth(seg(t, 5.4, 6.0))), y: lerp(asideHand.y, lapHand.y, smooth(seg(t, 5.4, 6.0)))};
  const mateP: ActorProps = {
    ...mate, lean: 6 + 10 * mateReach * (1 - aside), twist: -10 * mateReach,
    armR: {hand: {x: mateHand.x, y: mateHand.y, z: 120}, pole: {x: 0.3, y: 1, z: 0.6}},
    handR: t < 1.35 ? 'fist' : 'open',
    head: {yaw: lerp(-14, -26, smooth(seg(t, 1.2, 1.8))) + 10 * smooth(seg(t, 5.6, 6.4)), pitch: lerp(22, 8, smooth(seg(t, 1.2, 1.8))) + 14 * smooth(seg(t, 5.6, 6.4))},
    face: {mouth: t > 4.9 ? 'sad' : 'flat', worry: 0.5 + 0.4 * smooth(seg(t, 4.3, 5.2)), brows: -0.1 - 0.2 * aside, lids: 0.4, lookX: lerp(0.5, 0.9, mateReach), lookY: 0.4},
    dmg: dmg('teammate', T), breath: 0.4,
  };
  const mateHandW = handCenter(solve(mateP), 1);
  // ---------------- the Director: bench → rises → takes the visor → back to the bench
  const bTop = benchTop(BENCH.y, BENCH.s);
  const dSeat = seated(look('director'), BENCH.x, BENCH.y, bTop, {t, s: 1, yaw: -40, z: 100, seed: 32, knees: 72, spread: 40});
  const standX = lerp(BENCH.x, 520, step) + (BENCH.x - 520) * back;
  const up = rise * (1 - sitDown);
  const dX = lerp(BENCH.x, standX, up);
  const dHands: V2 = (() => {
    const lap = {x: BENCH.x - 30, y: bTop - 30};
    const tray = {x: trayTop.x + 10, y: trayTop.y - 20};
    if (t < 6.8) return {x: lerp(lap.x, dX - 60, up), y: lerp(lap.y, BENCH.y - 200, up)};
    if (t < 7.35) return {x: lerp(dX - 60, tray.x, take), y: lerp(BENCH.y - 200, tray.y, take)};
    const hold = {x: dX - 50, y: lerp(BENCH.y - 210, bTop - 26, sitDown)};
    return {x: lerp(tray.x, hold.x, smooth(seg(t, 7.35, 7.9))), y: lerp(tray.y, hold.y, smooth(seg(t, 7.35, 7.9)))};
  })();
  const dir: ActorProps = {
    ...dSeat,
    x: dX, drop: lerp(dSeat.drop ?? 0, 0, up), lean: lerp(10, 6, up) + 12 * take * (1 - back),
    yaw: lerp(-40, -70, up) + 30 * back * (1 - sitDown),
    legL: {foot: {x: lerp((dSeat.legL!.foot as V2).x, dX - 30, up), y: lerp((dSeat.legL!.foot as V2).y, BENCH.y - 9, up), z: 0}},
    legR: {foot: {x: lerp((dSeat.legR!.foot as V2).x, dX + 30, up), y: lerp((dSeat.legR!.foot as V2).y, BENCH.y - 9, up), z: 0}},
    armR: {hand: {x: dHands.x, y: dHands.y + 6, z: 90}}, armL: {hand: {x: dHands.x + 22, y: dHands.y - 4, z: 70}},
    head: {pitch: 14 + 12 * sitDown - 10 * take * (1 - back), yaw: 0},
    face: {mouth: 'flat', worry: 0.6, brows: -0.2, lids: 0.45 + 0.2 * sitDown, lookX: -0.4, lookY: 0.4},
    dmg: dmg('director', T), breath: 0.4,
  };
  const dHandW = handCenter(solve(dir), 1);
  // visor world placement and orientation
  let vB: Basis3 = LAP_B, vC: V2;
  if (t < 0.6) { vC = placeBy(mateHandW, LAP_B, 0, -0.14, 1.53); }
  else if (t < 1.4) { vB = mixBasis(LAP_B, SEAT_B, place); vC = placeBy(mateHandW, vB, 0, -0.14, 1.53); }
  else if (t < 4.25) { vB = SEAT_B; vC = {x: visorOnSeat.x, y: visorOnSeat.y - 4}; }
  else if (t < 4.95) { vB = mixBasis(SEAT_B, TRAY_B, lift); vC = placeBy(gripW, vB, 90, -0.45, 1.04); }
  else if (t < 7.35) { vB = TRAY_B; vC = {x: trayTop.x, y: trayTop.y - 24}; }
  else { vB = mixBasis(TRAY_B, LAP_B, smooth(seg(t, 7.35, 7.9))); vC = placeBy(dHandW, vB, 0, -0.14, 1.53); }
  // after the lift the visor rides on the tray: draw it as the bot's tray child
  const visorEl = <Visor x={vC.x} y={vC.y} s={1} b={vB} ink={4} />;
  // ---------------- the carrier in chair 1, watching
  const carrier: ActorProps = {
    ...seated(look('carrier'), SEATS[0].x, 0, SEATS[0].y + 6, {t, s: 1, yaw: 18, z: -1, seed: 42, knees: 72, spread: 44}),
    lean: 14, head: {yaw: -10, pitch: 12}, armL: {hand: {x: SEATS[0].x + 30, y: SEATS[0].y + 20, z: 110}}, armR: {hand: {x: SEATS[0].x + 70, y: SEATS[0].y + 26, z: 110}},
    face: {mouth: 'flat', worry: 0.6, lids: 0.45, lookX: 0.5 * smooth(seg(t, 3.0, 4.0)), lookY: 0.3}, dmg: dmg('carrier', T), breath: 0.4,
  };
  // ---------------- camera: medium-wide; follows the visor to the right as the bot carries it
  const camF = (tt: number): Cam => {
    const k = easeInOut(seg(tt, 5.7, 7.5));
    return camAt(lerp(-80, 400, k), lerp(-250, -255, k), 960, 600, lerp(1.72, 1.62, k));
  };
  const cam = smoothCam(camF, t, 0.3, 7);
  const ink = inkFor(cam.z, 1);
  const chairs = (part: 'back' | 'front') => SEATS.map((st, i) => (
    <g key={i} transform={i === 2 ? `translate(${chairOff} 0) rotate(${chairTilt} ${st.x} 0)` : undefined}>
      <ChairRow x={st.x} y={0} n={1} s={CH.s} ink={ink} part={part} color="#7FB0A0" />
    </g>
  ));
  const visorFree = t < 4.95 || t >= 7.35;
  return (
    <Frame bg="#E2C9A2">
      <Layer cam={cam} p={0.75}>
        <InteriorBack x0={-2600} x1={3200} t={t} time={E3_TIME} ink={ink * 0.8} people={2} seed={8} wallY={-330} top={-1900} />
      </Layer>
      <Layer cam={cam} p={1}>
        {chairs('back')}
        <Cast actors={[carrier, mateP]} />
        {chairs('front')}
        {visorFree && t >= 1.4 && t < 4.25 && visorEl}
        <Bench x={BENCH.x} y={BENCH.y} s={BENCH.s} w={480} ink={ink} />
        {botAway > 0.5 && <ServiceBot {...botP} ink={ink}>{null}</ServiceBot>}
        <Cast actors={[dir]} />
        {botAway <= 0.5 && <ServiceBot {...botP} ink={ink}>{!visorFree ? <Visor x={0} y={-24} s={1} b={TRAY_B} ink={4} /> : null}</ServiceBot>}
        {regard > 0.01 && <Glow x={bx + 30 * bs} y={byy - 130 * bs} r={70} color="#5ED1C3" opacity={0.6 * regard} id="e3eye" />}
        {visorFree && (t < 1.4 || t >= 4.25) && visorEl}
      </Layer>
      <Tint time={E3_TIME} lamps={[{x: 300, y: 200, r: 520}, {x: 1500, y: 220, r: 560}]} />
      <Grade vignette={0.4} id="vgE3" />
    </Frame>
  );
};
export default E3;
void clamp;
