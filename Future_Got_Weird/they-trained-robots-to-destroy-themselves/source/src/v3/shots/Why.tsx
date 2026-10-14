// SECTION B2 (why retire them this way): product turntable → factory line handoff to F.03 → workshop options as actions.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, makeProj, camMix, orbit} from '../engine/camera';
import {V3, add, sub, mulS, clamp01, lerp3, mix, smooth, norm, DEG} from '../engine/math';
import {Item, box, quad, line3, sortItems, circle3, mixHex} from '../engine/prims';
import {ActuatorSection, actuatorPuck} from '../fx/Cutaway';
import {Scene3D, RobotSpec, CharSpec} from '../engine/Scene3D';
import {panelBetween, crate, Padlock, shutter, recycleSet, filmLights, partsRack, dockSet} from '../sets/Props3D';
import {CELL, CELL_ENV, cellSet} from '../sets/Line';
import {WORKSHOP_ENV, WS, stand, workbench, workshopBack, toolCart} from '../sets/Workshop';
import {STAND, walkPose, blendPose, poseTrack} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {T, blockStart} from '../cues';
import {HOOK_TURN_END, SimStageFrame, visorCam, f02StandPose, WS_LIGHT} from './HookTurn';
import {FoundryScene, robotLight, easeInOut, easeOut} from './HookFoundry';
import {DECK, LADLE} from '../sets/Foundry';
import {Chip} from '../ui/Chip';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const WHY_START = HOOK_TURN_END;
export const WHY_END = blockStart('B03') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const S2B = T('Figure says they spent') - 0.1;
const S2C = T('But as its newer') - 0.1;
const S2D = T('So what do you do') - 0.12;
const S2E = T('Sell it') - 0.1;
const S2F = T('Take them apart') - 0.1;
const S2G = T('Melt them') - 0.1;
const S2H = T('Figure says foundries') - 0.1;
const S2I = T('Recycling old hardware') - 0.12;
const LIGHT = {dir: norm([-0.45, 0.8, 0.55])};

// ---------------------------------------------------------------- S2a product bay: the visor resolves into the F.02
// Opens on the visor framing H11 ends on (same head-relative camera), a scan line resolves the schematic avatar into
// the finished F.02, then one continuous move pulls back to the whole robot on its maintenance stand with the company
// sign (the Figure symbol) readable on the wall behind it. The F.02 itself carries no emblem: its placement could not
// be verified, so identification comes from the sign and the lower third.
const S2A_RESOLVE = 0.4;
const s2aPose = (tau: number): Pose => {
  const p = f02StandPose(tau);
  // close-up: head level like the avatar's; then a small "powered" settle of the head and hands
  const k = smooth(seg(tau, WHY_START + 0.6, WHY_START + 1.6));
  p.head = {pitch: mix(-0.02, 0.06, k), yaw: mix(0, -0.12, k), roll: 0};
  p.armL = {...p.armL, grip: mix(0.2, 0.45, k), elbow: mix(0.12, 0.2, k)};
  p.armR = {...p.armR, grip: mix(0.2, 0.45, k), elbow: mix(0.12, 0.2, k)};
  return p;
};
const S2a: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const pose = s2aPose(tau);
  const c0 = visorCam(s2aPose(WHY_START), 62);
  const c1: Cam3 = {pos: [-262, 182, 70], target: [-176, 158, -118], fov: 34, roll: -1};
  const c2: Cam3 = {pos: [-430, 190, 330], target: [-110, 240, -300], fov: 44, roll: -1.5};
  const u1 = easeInOut(seg(tau, WHY_START + 0.45, WHY_START + 1.9));
  const u2 = easeInOut(seg(tau, WHY_START + 1.6, S2B + 0.2));
  const cam = camMix(camMix(c0, c1, u1), c2, u2);
  const pr = makeProj(cam);
  const env = WORKSHOP_ENV;
  const items: Item[] = [...workshopBack(pr, env, tau), ...stand(pr, env), ...workbench(pr, env), ...toolCart(pr, env, [80, 0, 40], 'cartS2a')];
  const robots: RobotSpec[] = [
    {id: 's2a', pose, light: WS_LIGHT, ground: WS.standTop},
    {id: 's2aBay', pose: STAND([-1050, 40 + 95.4, -420], 0.3), light: WS_LIGHT},
  ];
  // scan resolve: above the line the finished F.02, below it the schematic avatar (frozen last frame of H11)
  const r = seg(tau, WHY_START, WHY_START + S2A_RESOLVE);
  const scanY = -60 + easeInOut(r) * 1200;
  const lbl = seg(tau, T('These are') + 0.2, T('These are') + 0.6);
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={items} robots={robots} frame={f} />
      {r < 1 ? (
        <>
          <AbsoluteFill style={{clipPath: `polygon(0 ${scanY}px, 1920px ${scanY}px, 1920px 1080px, 0 1080px)`}}>
            <SimStageFrame tau={HOOK_TURN_END - 1 / 30} f={f} />
          </AbsoluteFill>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            <rect x={0} y={scanY - 3} width={1920} height={6} fill="#BFE9FF" />
            <rect x={0} y={scanY - 24} width={1920} height={24} fill="#BFE9FF" opacity={0.25} />
          </svg>
        </>
      ) : null}
      {lbl > 0 ? (
        <div style={{position: 'absolute', left: 110, top: 770, opacity: lbl, transform: `translateX(${(1 - easeOut(lbl)) * -40}px)`}}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 104, color: C.ink, lineHeight: 1}}>F.02</div>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.inkSoft, marginTop: 6}}>Figure's second-generation humanoid</div>
          <div style={{width: 120, height: 8, background: C.saffron, borderRadius: 4, marginTop: 14}} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- S2b/S2c factory line: loading parts, then the F.03 takes over
const F02_LINE: V3 = [0, 0, -2];
const carSide = -150 + 86; // z of the near side of the parked car body
const holdPose = (yaw: number, hands: [V3, V3], lean = 0.12): Pose => {
  const p = STAND([F02_LINE[0], 95.4, F02_LINE[2]], yaw);
  p.spine.pitch = lean;
  p.footL = {pos: [F02_LINE[0] + 9.5 * Math.cos(Math.PI), 10, F02_LINE[2]], pitch: 0, yaw: Math.PI};
  p.footR = {pos: [F02_LINE[0] - 9.5 * Math.cos(Math.PI), 10, F02_LINE[2]], pitch: 0, yaw: Math.PI};
  p.handL = {pos: hands[0]};
  p.handR = {pos: hands[1]};
  p.armL.grip = 0.75;
  p.armR.grip = 0.75;
  return p;
};
const lineKeys = () => {
  // panel grip points: at the rack (robot's right side), carried, pressed onto the car side
  const atRack: [V3, V3] = [[62, 97, 34], [62, 97, -30]];
  const carry: [V3, V3] = [[28, 108, -42], [-30, 108, -42]];
  const placed: [V3, V3] = [[28, 104, carSide + 4], [-30, 104, carSide + 4]];
  return {atRack, carry, placed};
};
const lerpHands = (a: [V3, V3], b: [V3, V3], t: number): [V3, V3] => [lerp3(a[0], b[0], t), lerp3(a[1], b[1], t)];

const lineState = (tau: number) => {
  const K = lineKeys();
  // 0..1 phases inside S2b: lift from rack, turn, place, release
  const a = seg(tau, S2B + 0.15, S2B + 1.0), b = seg(tau, S2B + 1.0, S2B + 2.0), c = seg(tau, S2B + 2.0, S2B + 2.8);
  let hands: [V3, V3];
  let yaw: number;
  if (b <= 0) { hands = K.atRack; yaw = Math.PI - 1.15 * (1 - smooth(a) * 0.15); }
  else if (c <= 0) { hands = lerpHands(K.atRack, K.carry, smooth(b)); yaw = mix(Math.PI - 0.98, Math.PI, smooth(b)); }
  else { hands = lerpHands(K.carry, K.placed, smooth(c)); yaw = Math.PI; }
  const pose = holdPose(yaw, hands, mix(0.18, 0.1, smooth(b)));
  const panelPlaced = c >= 1;
  return {pose, hands, panelPlaced};
};

const S2bc: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const st = lineState(Math.min(tau, S2C));
  const robots: RobotSpec[] = [];
  const items: Item[] = [];
  // F.02: after placing, it lets go, steps back and walks off (S2c)
  let f02 = st.pose;
  if (tau > S2C) {
    const r = seg(tau, S2C, S2C + 0.6);
    const relaxed = STAND([F02_LINE[0], 95.4, F02_LINE[2]], Math.PI);
    f02 = blendPose(st.pose, relaxed, smooth(r));
    f02.handL = r < 1 ? f02.handL : undefined;
    f02.handR = r < 1 ? f02.handR : undefined;
    if (tau > S2C + 0.6) {
      // turn away and walk off toward the left of frame
      const w = (tau - S2C - 0.6) * 95;
      f02 = walkPose([F02_LINE[0] - 20, 0, F02_LINE[2] + 70], -Math.PI / 2 - 0.25, w, 0, {stride: 58});
    }
  }
  robots.push({id: 'f02line', pose: f02, light: LIGHT, ground: 0});
  const K = lineKeys();
  // F.03 walks in from the right and takes the station (S2c); it loads the next panel from the rack
  let p03: Pose | null = null;
  if (tau > S2C - 0.4) {
    const tw = tau - (S2C - 0.4);
    const walkDist = Math.min(tw * 105, 330);
    p03 = walkPose([400, 0, F02_LINE[2] + 30], -Math.PI / 2, walkDist, 0, {stride: 60});
    if (walkDist >= 330) {
      const k = seg(tau, S2C - 0.4 + 330 / 105, S2C - 0.4 + 330 / 105 + 0.8);
      const at = STAND([70, 95.4, F02_LINE[2] + 30], -Math.PI / 2 + (-Math.PI / 2) * smooth(k));
      p03 = blendPose(p03, at, smooth(Math.min(1, k * 2)));
    }
    robots.push({id: 'f03line', pose: p03, kind: 'F03', light: LIGHT, ground: 0});
  }
  // further stations: F.03s at work
  CELL.stationX.slice(1).forEach((x, k) => {
    const p = STAND([x, 95.4, -2], Math.PI);
    p.handL = {pos: [x + 28, 104 + 3 * Math.sin(tau * 2 + k), CELL.carSide + 4]};
    p.handR = {pos: [x - 30, 104 + 3 * Math.sin(tau * 2 + k), CELL.carSide + 4]};
    robots.push({id: 'st' + k, pose: p, kind: 'F03', light: LIGHT, ground: 0});
  });
  // the panel: on the rack, carried, placed; clamps close and the stack light turns green
  const tPlace = S2B + 2.8;
  const clamp = smooth(seg(tau, tPlace + 0.1, tPlace + 0.4));
  const stack: 'amber' | 'green' = clamp >= 0.99 ? 'green' : 'amber';
  // cameras: S2b starts low at the rack on the hands, follows the panel to the body; S2c cranes out along the line
  const b0: Cam3 = {pos: [150, 245, 175], target: [40, 98, -20], fov: 40, roll: 2};
  const b1: Cam3 = {pos: [-250, 185, 300], target: [10, 140, -110], fov: 42, roll: 1};
  const camB = camMix(b0, b1, easeInOut(seg(tau, S2B + 0.9, S2B + 3.0)));
  const camB2: Cam3 = {...b1, pos: lerp3(b1.pos, [-200, 190, 330], smooth(seg(tau, S2B + 3.0, S2C + 1.2)))};
  const camC: Cam3 = {pos: [640, 560, 900], target: [-160, 90, -160], fov: 44, roll: -2};
  const cam = tau < S2B + 3.0 ? camB : tau < S2C + 1.2 ? camB2 : camMix(camB2, camC, easeInOut(seg(tau, S2C + 1.2, S2C + 3.6)));
  const pr = makeProj(cam);
  items.push(...cellSet(pr, CELL_ENV, tau, {stack, clamp, hmi: seg(tau, S2B, tPlace + 0.4), armT: tau}));
  items.push(...partsRack(pr, CELL_ENV, [96, 50, 2], tau > S2B + 1.0 ? 1 : 2));
  const panelNow = st.panelPlaced ? K.placed : st.hands;
  const pi = panelBetween(pr, CELL_ENV, 'pnl', panelNow[0], panelNow[1], 46, '#7F93A8');
  if (pi) items.push(pi);
  CELL.stationX.slice(1).forEach((x, k) => {
    const q = panelBetween(pr, CELL_ENV, 'stp' + k, [x + 28, 104, CELL.carSide + 4], [x - 30, 104, CELL.carSide + 4], 46, '#7F93A8');
    if (q) items.push(q);
  });
  const tag = seg(tau, S2C + 0.9, S2C + 1.3) * (1 - seg(tau, S2C + 3.8, S2C + 4.2));
  const tagAt = p03 ? pr.p(add(solve(p03).head.o, [0, 40, 0])) : null;
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#E9E3D0" />} items={items} robots={robots} frame={f} />
      {tau < S2C ? <Chip x={100} y={64} lines={['FIGURE SAYS', 'months loading parts at a BMW plant']} appear={tau - S2B - 0.3} tone="paper" size={40} /> : null}
      {tag > 0 && tagAt ? (
        <div style={{position: 'absolute', left: tagAt.x - 150, top: tagAt.y - 80, width: 300, textAlign: 'center', opacity: tag, fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink, background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 12, padding: '6px 0'}}>
          F.03 · newer model
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- workshop shots
const wsRobotOnStand = (tau: number): Pose => {
  const p = STAND([WS.stand[0], WS.standTop + 95.4, WS.stand[2]], 0.15);
  p.head.pitch = 0.18 + 0.02 * Math.sin(tau * 0.7);
  return p;
};
const wsItems = (pr: ReturnType<typeof makeProj>, tau: number, opts: {crateFold?: number; noBench?: boolean; swing?: number; noCrate?: boolean} = {}) => {
  const env = WORKSHOP_ENV;
  const items: Item[] = [...workshopBack(pr, env, tau), ...stand(pr, env)];
  if (!opts.noBench) items.push(...workbench(pr, env));
  if (!opts.noCrate) items.push(...crate(pr, env, WS.crate, opts.crateFold ?? 0, {key: 'wsCrate', swing: opts.swing}));
  items.push(...toolCart(pr, env, [380, 0, 60], 'wsCart'));
  return items;
};

/** S2d: "So what do you do with a retired robot?" crane across the bay: the retired F.02, the crate, the bench. */
const S2d: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const u = easeInOut(seg(tau, S2D, S2E));
  const cam: Cam3 = {pos: lerp3([-300, 560, 1050], [120, 260, 820], u), target: lerp3([-100, 60, -100], [60, 110, -100], u), fov: 50, roll: mix(-3, 0, u)};
  const pr = makeProj(cam);
  const chars: CharSpec[] = [{id: 'eng', look: CAST.clerkB, pose: {...IDLE, lookX: -0.6, armR: {a: 30, b: 60}}, feet: [WS.bench[0] - 40, 0, WS.bench[2] + 80], flip: true, seed: 3}];
  return <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={wsItems(pr, tau)} robots={[{id: 'wsR', pose: wsRobotOnStand(tau), light: LIGHT, ground: WS.standTop}]} chars={chars} frame={f} />;
};

/** S2e: "Sell it?" the crate closes around the robot; its front door sweeps past the lens to an orderly cutaway of
 *  a knee actuator ("custom actuators"), then sweeps shut again; a padlock and the roller door stop it leaving. */
const CR_POSE = (): Pose => {
  const p = STAND([WS.crate[0], 12 + 95.4, WS.crate[2]], Math.PI / 2);
  p.head.pitch = 0.12;
  return p;
};
const S2e: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const tFold0 = T('Sell it') - 0.05, tFold1 = tFold0 + 1.0;
  const tPush = T('Figure says they’re packed') - 0.1;
  const tOpen = T('custom hardware') - 0.2;
  const tClose = T('and it didn’t want') - 0.35;
  const tLock = T('leaving the building') - 0.5;
  const fold = smooth(seg(tau, tFold0, tFold1));
  const swing = easeInOut(seg(tau, tOpen, tOpen + 0.5)) * (1 - easeInOut(seg(tau, tClose, tClose + 0.45)));
  const pose = CR_POSE();
  const sk = solve(pose);
  const out = norm(sub(sk.side.R.knee, sk.side.L.knee));
  const kneeC = add(sk.side.R.knee, mulS(out, 6.5));
  const [cx, , cz] = WS.crate;
  const dw = smooth(seg(tau, S2E, tPush));
  const camWide: Cam3 = {pos: lerp3([360, 230, 520], [420, 205, 440], dw), target: [600, 115, -80], fov: 46, roll: mix(-2, 0, dw)};
  const camDoor: Cam3 = {pos: [cx + 40, 125, cz + 230], target: [cx + 5, 108, cz], fov: 40};
  const camKnee: Cam3 = {pos: add(kneeC, [24, 16, 120]), target: add(kneeC, [6, 4, 0]), fov: 34};
  const camLock: Cam3 = {pos: [cx - 60, 150, cz + 300], target: [cx, 120, cz + 40], fov: 42};
  let cam = camMix(camWide, camDoor, easeInOut(seg(tau, tOpen - 0.9, tOpen + 0.05)));
  if (tau > tOpen + 0.2) cam = camMix(camDoor, camKnee, easeInOut(seg(tau, tOpen + 0.2, tOpen + 1.0)));
  if (tau > tClose - 0.2) cam = camMix(camMix(camDoor, camKnee, 1 - easeInOut(seg(tau, tClose - 0.2, tClose + 0.45))), camLock, easeInOut(seg(tau, tClose + 0.45, tLock + 0.2)));
  const pr = makeProj(cam);
  const items = wsItems(pr, tau, {crateFold: fold, swing});
  const env = WORKSHOP_ENV;
  const doorU = smooth(seg(tau, tLock + 0.45, tLock + 1.2));
  const doorItems = shutter(pr, env, 520, 760, WS.wallZ + 2, 320, doorU);
  items.push(...doorItems.map((d) => ({...d, z: 1e6 - 3})));
  const cut = seg(tau, tOpen + 0.35, tOpen + 0.7) * (1 - seg(tau, tClose - 0.15, tClose + 0.1));
  const lockU = seg(tau, tLock, tLock + 0.35);
  const lbl = pr.p(add(kneeC, [12, 6, 0]));
  const lblK = seg(tau, T('like the actuators') - 0.1, T('like the actuators') + 0.25);
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={items} robots={[{id: 'cr', pose, light: LIGHT, hide: cut > 0.3 ? ['kneeActR'] : undefined}]} frame={f}
        over={(
          <>
            <ActuatorSection pr={pr} c={kneeC} axis={out} t={tau} k={cut} />
            {cut > 0.05 && lblK > 0 ? (
              <g opacity={Math.min(cut, lblK)}>
                <line x1={lbl.x - 10} y1={lbl.y + 20} x2={lbl.x + 120} y2={lbl.y - 60} stroke={C.ink} strokeWidth={5} />
                <g transform={`translate(${lbl.x + 120} ${lbl.y - 60})`}>
                  <rect x={0} y={-48} width={430} height={84} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
                  <text x={24} y={8} fontFamily={F.body} fontWeight={800} fontSize={42} fill={C.ink}>custom actuators</text>
                </g>
              </g>
            ) : null}
            {lockU > 0 ? <Padlock pr={pr} at={[cx + 50, 120, cz + 58]} size={26} shut={seg(tau, tLock + 0.25, tLock + 0.4)} drop={easeOut(lockU)} /> : null}
          </>
        )} />
    </AbsoluteFill>
  );
};

/** S2f: "Take them apart?" a tactile teardown on the stand: the bolts back out, the knee actuator slides out, turns
 *  to the light, slides back and seats. Then the queue of robots that would wait, and the calendar. */
const TD_POSE = (): Pose => {
  const p = STAND([WS.stand[0], WS.standTop + 95.4, WS.stand[2]], Math.PI / 2);
  p.head.pitch = 0.15;
  return p;
};
const S2F_QUEUE = () => T('Take them apart') - 0.05 + 3.75;
export const s2gRimCam = (u: number): Cam3 => ({pos: [mix(60, 90, u), mix(800, 860, u), mix(230, 260, u)], target: [0, LADLE.steel, 0], fov: 44, roll: mix(-4, 0, u)});
const S2f: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const t0 = T('Take them apart') - 0.05;
  const env = WORKSHOP_ENV;
  if (tau < S2F_QUEUE()) {
    const pose = TD_POSE();
    const sk = solve(pose);
    const out = norm(sub(sk.side.R.knee, sk.side.L.knee));
    const open = smooth(seg(tau, t0 + 0.1, t0 + 0.6));
    const sep = easeInOut(seg(tau, t0 + 0.6, t0 + 1.3)) * (1 - easeInOut(seg(tau, t0 + 2.8, t0 + 3.3)));
    const seat = seg(tau, t0 + 3.3, t0 + 3.55);
    const d = 22 * sep;
    const detached = tau > t0 + 0.6 && tau < t0 + 3.3;
    const pc = add(sk.side.R.knee, mulS(out, 2.6 + d));
    const tilt = 0.5 * Math.sin(Math.PI * seg(tau, t0 + 1.3, t0 + 2.8));
    const axis = norm(add(out, mulS([1, 0, 0], tilt)));
    const kneeC = sk.side.R.knee;
    const drift = smooth(seg(tau, S2F, S2F_QUEUE()));
    const cam: Cam3 = {pos: add(kneeC, [mix(50, 20, drift), mix(34, 24, drift), mix(150, 120, drift)]), target: add(kneeC, [mix(-4, 4, drift), 6, 12]), fov: 38};
    const pr = makeProj(cam);
    const items = wsItems(pr, tau, {noCrate: true});
    items.push(actuatorPuck(pr, env, 'tdPuck', pc, detached ? axis : out, {r: 5.8, w: 7, boltOut: detached ? 3 : 3 * open * (1 - seat), bolts: 6, z: pr.p(pc).z - 30}));
    const chars: CharSpec[] = [{id: 'tdEng', look: CAST.clerkB, pose: {...IDLE, lookX: -0.7, lookY: 0.5, armL: {a: 60, b: 70}, armR: {a: 50 + 20 * sep, b: 80}, mouth: 'flat'}, feet: [WS.stand[0] + 85, 0, WS.stand[2] - 45], flip: true, seed: 5}];
    const flash = seat > 0 && seat < 1 ? pr.p(add(kneeC, mulS(out, 6))) : null;
    return (
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={items} robots={[{id: 'td', pose, light: LIGHT, hide: ['kneeActR'], ground: WS.standTop}]} chars={chars} frame={f}
        over={flash ? <circle cx={flash.x} cy={flash.y} r={(20 + 60 * seat) * flash.s} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={1 - seat} /> : null} />
    );
  }
  // the queue: stands receding along the wall, each with a robot waiting; the engineer works on one at the bench
  const tQ = S2F_QUEUE();
  const u = easeInOut(seg(tau, tQ, tQ + 1.6));
  const u2 = easeInOut(seg(tau, tQ + 1.6, S2G - 0.45));
  const cam: Cam3 = {pos: lerp3(lerp3([300, 140, 0], [380, 250, 300], u), [300, 205, 120], u2), target: lerp3(lerp3([300, 105, -300], [-80, 120, -440], u), ACT_TOP_W, u2), fov: mix(mix(36, 58, u), 46, u2)};
  const pr = makeProj(cam);
  const items: Item[] = [...workshopBack(pr, env, tau), ...workbench(pr, env)];
  const robots: RobotSpec[] = [];
  for (let k = 0; k < 9; k++) {
    const x = -200 - k * 170;
    items.push(...box(pr, env, 'q' + k, {c: [x, 6, -420], size: [120, 12, 100], color: C.blue}));
    robots.push({id: 'q' + k, pose: STAND([x, 12 + 95.4, -420], 0), light: LIGHT, ground: 12});
  }
  const cloth = quad(pr, env, 'cloth', [[540, 0, -560], [700, 0, -560], [680, 185, -545], [560, 185, -545]], '#EF6B55', {smooth: true});
  if (cloth) items.push(cloth);
  const chars: CharSpec[] = [{id: 'eng2', look: CAST.clerkB, pose: {...IDLE, lookX: -0.4, lookY: 0.4, armL: {a: 40, b: 80}, armR: {a: 30, b: 70}, mouth: 'flat'}, feet: [WS.bench[0] - 10, 0, WS.bench[2] + 70], seed: 5}];
  const cal = pr.p([-430, 330, WS.wallZ + 4]);
  const flips = Math.floor(seg(tau, tQ + 0.6, S2G - 0.5) * 9);
  const tagP = pr.p([620, 215, -540]);
  // "Melt them?": a retaining ring pops off the actuator in the vise and flies at the lens, becoming the ladle rim
  const fly = seg(tau, S2G - 0.42, S2G);
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={items} robots={robots} chars={chars} frame={f} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${cal.x} ${cal.y}) scale(${cal.s * 0.9})`}>
          <rect x={-60} y={-80} width={120} height={150} rx={6} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
          <rect x={-60} y={-80} width={120} height={34} fill={C.coral} />
          <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={60} fill={C.ink}>{['MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Math.min(9, flips)]}</text>
        </g>
        <g transform={`translate(${tagP.x} ${tagP.y})`}>
          <rect x={-100} y={-26} width={200} height={46} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={8} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={26} fill={C.ink}>NEXT MODEL</text>
        </g>
        {fly > 0 ? <FlyingRing pr={pr} u={fly} /> : null}
      </svg>
    </AbsoluteFill>
  );
};
const ACT_TOP_W: V3 = [WS.bench[0] - 70, 118, WS.bench[2] - 6];

/** The retaining ring: point-wise morph from its projection on the actuator to the ladle rim's projection in S2g. */
const FlyingRing: React.FC<{pr: ReturnType<typeof makeProj>; u: number}> = ({pr, u}) => {
  const n = 48;
  const prR = makeProj(s2gRimCam(0));
  const e = u * u * (3 - 2 * u) * 0.35 + Math.pow(u, 3) * 0.65;   // accelerates toward the lens
  const ring = (rS: number, rE: number) => {
    const a = circle3([ACT_TOP_W[0], ACT_TOP_W[1] + 3 + 60 * e, ACT_TOP_W[2]], rS, n).slice(0, n).map((q) => pr.p(q));
    const b = circle3([0, LADLE.rim + 0.5, 0], rE, n).slice(0, n).map((q) => prR.p(q));
    return a.map((q, k) => ({x: mix(q.x, b[k].x, e), y: mix(q.y, b[k].y, e)}));
  };
  const outer = ring(6, LADLE.rTop + 14), inner = ring(4.8, LADLE.rIn + 5);
  const d = (pts: {x: number; y: number}[]) => 'M' + pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L') + 'Z';
  const col = mixHex('#AEB8C2', '#E0662A', clamp01((e - 0.35) / 0.65));
  return <path d={d(outer) + d(inner)} fillRule="evenodd" fill={col} stroke="#2B2F35" strokeWidth={2 + 6 * e} />;
};

/** S2g: "Melt them? Simple." the ladle rim under molten light; "Except … brings its battery along": the battery. */
const S2g: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const tBatt = T('Except a robot') - 0.1;
  if (tau < tBatt) {
    const u = smooth(seg(tau, S2G, tBatt));
    return <FoundryScene cam={s2gRimCam(u)} tau={tau} robots={[]} entries={[]} />;
  }
  // at the edge: the torso battery glows through a cutaway
  const pose = STAND([DECK.edgeX - 34, DECK.y + 95.4, 0], Math.PI / 2);
  pose.head.pitch = 0.35;
  const u = easeInOut(seg(tau, tBatt, S2H));
  const cam: Cam3 = {pos: lerp3([-120, DECK.y + 170, 260], [-150, DECK.y + 150, 200], u), target: [DECK.edgeX - 40, DECK.y + 125, 0], fov: 38};
  const sk = solve(pose);
  const xr = seg(tau, tBatt + 0.6, tBatt + 1.1);
  const pulse = 0.6 + 0.4 * Math.sin((tau - tBatt) * 7);
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 'batt', inside: false}]} entries={[]} />
      {xr > 0 ? <BatteryXray cam={cam} torso={sk.torso} amount={xr} pulse={pulse} /> : null}
    </AbsoluteFill>
  );
};

const BatteryXray: React.FC<{cam: Cam3; torso: {o: V3; m: [V3, V3, V3]}; amount: number; pulse: number}> = ({cam, torso, amount, pulse}) => {
  const pr = makeProj(cam);
  const P = (x: number, y: number, z: number) => pr.p(add(torso.o, add(add([torso.m[0][0] * x, torso.m[0][1] * x, torso.m[0][2] * x], [torso.m[1][0] * y, torso.m[1][1] * y, torso.m[1][2] * y]), [torso.m[2][0] * z, torso.m[2][1] * z, torso.m[2][2] * z])));
  const corners = [P(-11, 13, 2), P(11, 13, 2), P(11, 32, 2), P(-11, 32, 2)];
  const d = 'M' + corners.map((q) => `${q.x} ${q.y}`).join('L') + 'Z';
  const c = P(0, 22.5, 2);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}} opacity={amount}>
      <path d={d} fill="#FFC744" fillOpacity={0.25 + 0.35 * pulse} stroke="#FFC744" strokeWidth={5} />
      {[0.25, 0.5, 0.75].map((v, k) => {
        const a = P(-11 + 22 * v, 14, 2), b = P(-11 + 22 * v, 31, 2);
        return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFE7A0" strokeWidth={3} />;
      })}
      <g transform={`translate(${c.x + 150} ${c.y - 120})`}>
        <rect x={0} y={-44} width={300} height={78} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <text x={22} y={10} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>battery pack</text>
      </g>
      <line x1={c.x + 30} y1={c.y - 20} x2={c.x + 150} y2={c.y - 110} stroke={C.ink} strokeWidth={4} />
    </svg>
  );
};

/** S2h: the crate gets stamped: U.S. refused, Mexico refused, Imatra yes; a crane hook lifts it away. */
const S2h: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const tUS = T('in the U.S.') + 0.05, tMX = T('and Mexico') + 0.1, tFI = T('One in Imatra') + 0.1;
  const tLift = T('said yes') + 0.15;
  const lift = smooth(seg(tau, tLift, S2I));
  const crateAt: V3 = [0, lift * 380, 0];
  const u = easeInOut(seg(tau, S2H, S2I));
  const cam: Cam3 = {pos: lerp3([260, 170, 520], [200, 190 + lift * 120, 470], u), target: [0, 120 + lift * 240, -60], fov: 44};
  const pr = makeProj(cam);
  const env = WORKSHOP_ENV;
  const items: Item[] = [];
  items.push(...dockSet(pr, env));
  items.push(...crate(pr, env, crateAt, 1, {lid: 1, key: 'dkCrate'}));
  if (tau > tLift - 0.6) {
    const hookY = 260 + crateAt[1] + 120 - (1 - seg(tau, tLift - 0.6, tLift)) * -200;
    items.push(line3(pr, 'hk1', [[0, 690, 0], [0, hookY, 0]], '#2B2E33', 5));
    items.push(...box(pr, env, 'hkb', {c: [0, hookY - 10, 0], size: [40, 30, 30], color: C.saffron}));
    for (const s of [-1, 1]) items.push(line3(pr, 'sl' + s, [[0, hookY - 20, 0], [s * 55, crateAt[1] + 214, s * 48]], '#3B3D40', 3));
  }
  const face = pr.p(add(crateAt, [0, 120, 56]));
  const sc = face.s;
  const stamp = (t0: number, text: string, sub: string, col: string, dx: number, dy: number, rot: number) => {
    const k = seg(tau, t0, t0 + 0.18);
    if (k <= 0) return null;
    const s = 1 + (1 - easeOut(k)) * 0.8;
    return (
      <g transform={`translate(${face.x + dx * sc} ${face.y + dy * sc}) rotate(${rot}) scale(${s * sc * 0.38})`} opacity={Math.min(1, k * 2)}>
        <rect x={-150} y={-46} width={300} height={92} rx={10} fill="none" stroke={col} strokeWidth={9} />
        <text x={0} y={-6} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={36} fill={col}>{text}</text>
        <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill={col}>{sub}</text>
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#D9E4EE" />} items={items} frame={f} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {stamp(tUS, 'U.S. FOUNDRY', 'REFUSED', '#C94A36', -10, -70, -8)}
        {stamp(tMX, 'MEXICO', 'REFUSED', '#C94A36', 14, -6, 6)}
        {stamp(tFI, 'IMATRA, FINLAND', 'YES ✓', '#128078', -4, 62, -3)}
      </svg>
    </AbsoluteFill>
  );
};

/** S2i: recycling is ordinary → a clapperboard snaps → film lights come on around the ladle. */
const S2i: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const tFilm = T('Bringing a film crew') - 0.1;
  if (tau < tFilm) {
    const u = smooth(seg(tau, S2I, tFilm));
    const cam: Cam3 = {pos: lerp3([-700, 220, 360], [-120, 240, 420], u), target: lerp3([-600, 60, 0], [150, 70, 0], u), fov: 44};
    const pr = makeProj(cam);
    return <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#E8E1CC" />} items={recycleSet(pr, WORKSHOP_ENV, tau)} frame={f} />;
  }
  const clap = seg(tau, tFilm, tFilm + 0.4);
  const reveal = seg(tau, tFilm + 0.45, tFilm + 0.9);
  const pose = STAND([DECK.edgeX - 34, DECK.y + 95.4, 0], Math.PI / 2);
  const cam: Cam3 = {pos: lerp3([780, 900, 1180], [700, 860, 1080], smooth(seg(tau, tFilm, WHY_END))), target: [-150, 480, 0], fov: 48};
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 'film', inside: false}]} entries={[]} extra={(pr, env) => filmLights(pr, env, reveal)} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {reveal < 1 ? <rect width={1920} height={1080} fill="#000" opacity={(1 - reveal) * (clap > 0 ? 1 : 0)} /> : null}
        <Clapper t={clap} gone={reveal} />
      </svg>
    </AbsoluteFill>
  );
};

const Clapper: React.FC<{t: number; gone: number}> = ({t, gone}) => {
  const open = (1 - easeOut(Math.min(1, t * 1.3))) * 28;
  const y = 340 + gone * 900;
  return (
    <g transform={`translate(960 ${y}) rotate(${-4 + gone * 20})`}>
      <rect x={-380} y={0} width={760} height={420} rx={14} fill="#1E2026" stroke="#0B0C0F" strokeWidth={8} />
      <g transform={`translate(-380 0) rotate(${-open})`}>
        <rect x={0} y={-90} width={760} height={90} rx={8} fill="#F4ECD6" stroke="#0B0C0F" strokeWidth={8} />
        {Array.from({length: 6}, (_, k) => <path key={k} d={`M${30 + k * 125} -90 l60 0 l-50 90 l-60 0 Z`} fill="#1E2026" />)}
      </g>
      <text x={-330} y={110} fontFamily={F.mono} fontWeight={700} fontSize={54} fill="#F4ECD6">SCENE 1</text>
      <text x={-330} y={200} fontFamily={F.mono} fontWeight={700} fontSize={54} fill="#F4ECD6">TAKE 1</text>
      <line x1={-380} y1={250} x2={380} y2={250} stroke="#F4ECD6" strokeWidth={4} />
    </g>
  );
};

// ---------------------------------------------------------------- section
export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const tau = WHY_START + f / 30;
  if (tau < S2B) return <S2a tau={tau} f={f} />;
  if (tau < S2D) return <S2bc tau={tau} f={f} />;
  if (tau < S2E) return <S2d tau={tau} f={f} />;
  if (tau < S2F) return <S2e tau={tau} f={f} />;
  if (tau < S2G) return <S2f tau={tau} f={f} />;
  if (tau < S2H) return <S2g tau={tau} f={f} />;
  if (tau < S2I) return <S2h tau={tau} f={f} />;
  return <S2i tau={tau} f={f} />;
};
void DEG; void robotLight;
