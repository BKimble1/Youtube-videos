// D1 — At the refuge's entrance, from behind them. On the final hit (M.FINAL_HIT, the shot's first frame) the glass
// doors slide open and warm light falls over the people who made it: the Director and the limping carrier holding up
// the friend between them, the builder holding up the teammate, the three civilians. Attendants glide out — one to the
// friend, scanning, one to the teammate, one with a blanket — and the trio walks into the light. Relief. (5.25 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg, visorOn, CIV} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {gait, WALK} from '../../rig/gait';
import {Attendant} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {clamp, lerp, seg, smooth, easeInOut, easeOut, noise} from '../../kit/math';
import {RefugeExterior, REFUGE} from '../../sets/refuge';
import {Glow} from '../../fx/light';
import {C} from '../../theme';
import {mixHex} from '../../fx/common';
import {Tint, Blanket} from './common';
import {FarBank, River} from '../../sets/refugeFar';

const ID = 'D1';
export const D_TIME = 1.6; // late afternoon light, warm and low
const RS = 1.5;                               // refuge scale for this close shot (the door ≈ 420 × 810)
const RX = -REFUGE.door.x * RS;               // refuge origin so the door centre is at x = 0

/** Steps away from the camera into depth (world y decreasing = farther). Feet planted, pelvis bobs. */
const intoDepth = (y0: number, dist: number, xs: [number, number], s: number, limp?: {side: 'L' | 'R'; amt: number}) => {
  const g = gait(-y0, dist, 1, {...WALK, stride: 100, lift: 12, s, limp});
  return {
    y: y0 - dist, drop: g.drop,
    legL: {foot: {x: xs[0], y: -g.L.x - 9 * s - g.L.lift * 0.7, z: 0}, pitch: g.L.pitch * 0.25},
    legR: {foot: {x: xs[1], y: -g.R.x - 9 * s - g.R.lift * 0.7, z: 0}, pitch: g.R.pitch * 0.25},
  };
};
const depthS = (y: number) => lerp(0.92, 1.12, clamp((y - 20) / 260));

const D1: React.FC = () => {
  const {t, T} = useShot(ID);
  const doors = easeInOut(seg(t, 0.0, 1.15));
  const warm = smooth(seg(t, 0.05, 1.3));
  // ---- the trio (carrier · friend · Director), seen from behind, walks into the light
  const walkK = easeInOut(seg(t, 1.8, 5.25));
  const dist = 210 * walkK;
  const y0 = 300;
  const yy = y0 - dist;
  const s = depthS(yy);
  const cx = -10;
  const sway = noise(t * 1.3, 4) * 3;
  const gap = 150 * s;
  const cX = cx - gap + sway * 0.2, dX = cx + gap + sway * 0.2;
  const stepC = intoDepth(y0 - 6, dist, [cX - 32 * s, cX + 30 * s], s, {side: 'L', amt: 0.6});
  const stepD = intoDepth(y0 + 40, dist, [dX - 30 * s, dX + 32 * s], s);
  const fy = yy - 6;
  const shY = fy - 290 * s;
  // facing away (yaw ≈ 180): the character's right is screen right
  const friend: ActorProps = {
    look: look('friend'), t, x: cx + sway * 0.3, y: fy, s, yaw: 166, z: 0, seed: 31, drop: 44, lean: 18,
    head: {pitch: 26, roll: -14, yaw: 8},
    legL: {foot: {x: cx + 34 * s, y: fy - 4 * s, z: 80 * s}, pitch: -50}, legR: {foot: {x: cx - 30 * s, y: fy - 6 * s, z: 70 * s}, pitch: -50},
    // arms over the supporters' shoulders: lying across their backs (seen), hands over their far shoulders (hidden)
    armR: {hand: {x: dX + 60 * s, y: shY + 16 * s, z: -10}, pole: {x: 0, y: -0.3, z: 1}},
    armL: {hand: {x: cX - 60 * s, y: shY + 16 * s, z: -10}, pole: {x: 0, y: -0.3, z: 1}},
    zArm: [60, 60], zHand: [-170, -170], handL: 'limp', handR: 'limp',
    face: {closed: true, mouth: 'pain'},
    dmg: dmg('friend', T), visor: visorOn(T), breath: 0.6,
  };
  const carrier: ActorProps = {
    look: look('carrier'), t, x: cX, y: stepC.y, s, yaw: 154, z: -0.1, seed: 42, drop: stepC.drop + 12, lean: 10, side: -6,
    legL: stepC.legL, legR: stepC.legR,
    head: {yaw: lerp(10, -6, warm), pitch: lerp(10, -8, warm)},
    // inner (right) arm round the friend's back, seen across it; outer (left) hand holds the friend's wrist, hidden
    armR: {hand: {x: cx + 50 * s, y: fy - 170 * s, z: 40}, pole: {x: 0, y: 1, z: 1}},
    armL: {hand: {x: cX - 72 * s, y: shY + 40 * s, z: -40}, pole: {x: -1, y: 0.8, z: -0.3}},
    zArm: [-60, 150], handR: 'mitt',
    dmg: dmg('carrier', T), breath: 1,
  };
  const director: ActorProps = {
    look: look('director'), t, x: dX, y: stepD.y, s, yaw: 206, z: -0.1, seed: 32, drop: stepD.drop + 12, lean: 10, side: 6,
    legL: stepD.legL, legR: stepD.legR,
    head: {yaw: lerp(-12, 4, warm), pitch: lerp(10, -8, warm)},
    armL: {hand: {x: cx - 50 * s, y: fy - 170 * s, z: 40}, pole: {x: 0, y: 1, z: 1}},
    armR: {hand: {x: dX + 72 * s, y: shY + 40 * s, z: -40}, pole: {x: 1, y: 0.8, z: -0.3}},
    zArm: [150, -60],
    dmg: dmg('director', T), breath: 1,
  };
  // ---- builder holding up the teammate (left); an attendant comes to them and takes the other side
  const follow = easeInOut(seg(t, 2.6, 5.25));
  const mDist = 120 * follow, mY0 = 230, ms = depthS(mY0 - mDist);
  const mateX = -560 + 40 * follow;
  const stepM = intoDepth(mY0, mDist, [mateX - 30 * ms, mateX + 30 * ms], ms, {side: 'L', amt: 0.9});
  const mate: ActorProps = {
    look: look('teammate'), t, x: mateX, y: stepM.y, s: ms, yaw: 152, z: -0.4, seed: 33, drop: stepM.drop + 8, lean: 10, side: 5,
    legL: {...stepM.legL, pitch: -40}, legR: stepM.legR,
    armR: {hand: {x: mateX - 150 * ms, y: stepM.y - 292 * ms, z: -10}, pole: {x: 0, y: -0.3, z: 1}},
    zArm: [undefined, 60], zHand: [undefined, -170],
    head: {yaw: lerp(0, 20, warm), pitch: 4},
    dmg: dmg('teammate', T), breath: 0.8,
  };
  const bX = mateX - 130 * ms;
  const stepB = intoDepth(mY0 + 14, mDist, [bX - 30 * ms, bX + 30 * ms], ms);
  const builder: ActorProps = {
    look: look('builder'), t, x: bX, y: stepB.y, s: ms, yaw: 156, z: -0.45, seed: 41, drop: stepB.drop + 6, lean: 6, side: -5,
    legL: stepB.legL, legR: stepB.legR,
    armR: {hand: {x: mateX + 40 * ms, y: stepB.y - 168 * ms, z: 40}}, zArm: [undefined, 150],
    head: {yaw: lerp(-10, 10, warm), pitch: 4},
    dmg: dmg('builder', T), breath: 0.8,
  };
  // ---- civilians at the right; the woman gets a blanket
  const civ: ActorProps[] = CIV.map((lk, i) => {
    const x = [470, 640, 360][i], y = [250, 210, 180][i];
    const step = easeInOut(seg(t, 3.0 + i * 0.3, 5.25));
    const yy2 = y - 50 * step;
    return {look: lk, t, x, y: yy2, s: depthS(yy2) * (lk.height ?? 1), yaw: [208, 154, 204][i], z: -0.8 - i * 0.05, seed: 50 + i, drop: 4,
      head: {pitch: lerp(8, -6, warm)}, breath: 0.6};
  });
  // ---- attendants out of the doors: A to the friend (scanning, then leading), B to the teammate, C with a blanket
  const aK = easeOut(seg(t, 0.55, 2.0));
  const ax = lerp(60, cx + 40, aK), ay = lerp(-20, yy - 120, aK) - 60 * walkK;
  const bK = easeOut(seg(t, 0.9, 2.6));
  const bx = lerp(-120, mateX - 20, bK), by = lerp(-30, stepM.y - 110, bK);
  const cK = easeOut(seg(t, 1.6, 3.0));
  const c0 = civ[0];
  const ccx = lerp(160, c0.x - 10, cK), ccy = lerp(-30, c0.y - 120, cK);
  const blanketK = smooth(seg(t, 2.9, 3.6));
  // ---- camera: from behind them, a slow push toward the doors
  const camF = (tt: number): Cam => {
    const k = easeInOut(clamp(tt / 5.25));
    return camAt(lerp(-40, -20, k), lerp(-250, -300, k), 960, 560, lerp(0.86, 0.98, k));
  };
  const cam = smoothCam(camF, t, 0.25, 5);
  const ink = inkFor(cam.z, 1);
  // light: cool exterior on their backs, warm wash from the doorway as it opens
  const paving = mixHex('#A9A69E', '#D9BE8E', 0.3 * warm);
  return (
    <Frame bg="#C9B9A0">
      <Layer cam={cam} p={0.55}>
        {/* beyond the refuge's west end: late sky, the far bank, the river */}
        <rect x={-3000} y={-3000} width={6000} height={3000} fill="url(#d1sky)" />
        <defs><linearGradient id="d1sky" x1="0" y1="-1600" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#8FA3B8" /><stop offset="100%" stopColor="#D8C2A6" /></linearGradient></defs>
        <FarBank x0={-3000} x1={1200} y={-150} t={t} time={D_TIME} ink={ink * 0.6} seed={6} height={420} />
        <River x0={-3000} x1={3000} y={-150} depth={400} t={t} time={D_TIME} ink={ink * 0.6} seed={6} />
      </Layer>
      <Layer cam={cam} p={1}>
        <RefugeExterior x={RX} y={0} scale={RS} t={t} doors={doors} time={D_TIME} ink={ink} seed={4} glow={1} glints={0.8} />
        <rect x={-2400} y={0} width={4800} height={900} fill={paving} />
        {[80, 200, 360, 560].map((yy3, i) => <line key={i} x1={-2400} y1={yy3} x2={2400} y2={yy3} stroke="#A39985" strokeWidth={ink * 0.6} opacity={0.6} />)}
        {Array.from({length: 18}, (_, i) => -2200 + i * 260).map((xx) => <line key={xx} x1={xx * 0.6} y1={0} x2={xx} y2={900} stroke="#A39985" strokeWidth={ink * 0.6} opacity={0.5} />)}
        {/* the doorway's light on the paving and on them */}
        <Glow x={0} y={60} r={900} squash={0.38} color="#FFD58A" opacity={0.75 * warm} id="d1spill" />
        <Attendant x={ax} y={ay} s={0.98 * depthS(ay)} t={t} seed={8} urgent={1} face={0.1} ink={ink}
          scan={{amt: smooth(seg(t, 1.6, 2.0)) * (1 - smooth(seg(t, 3.6, 4.2))), x: cx, y: fy - 300 * s}} />
        <Attendant x={bx} y={by} s={0.96 * depthS(by)} t={t} seed={9} face={-0.3} ink={ink} handL={{x: mateX + 30, y: stepM.y - 230 * ms}} />
        <Attendant x={ccx} y={ccy} s={0.96 * depthS(ccy)} t={t} seed={10} face={0.4} ink={ink} holdSheet={blanketK < 0.3}
          handR={{x: c0.x + 60, y: c0.y - 330}} handL={{x: c0.x - 60, y: c0.y - 330}} />
        <Cast actors={[...civ, builder, mate, carrier, friend, director]} />
        <Blanket x={c0.x} y={c0.y - 286 * (c0.s ?? 1)} s={(c0.s ?? 1) * 0.9} k={blanketK} ink={ink} />
        <Glow x={0} y={-500} r={1300} color="#FFE7B8" opacity={0.18 * warm} squash={0.8} id="d1wash" />
      </Layer>
      <Tint time={1.25} />
      <Grade vignette={0.42} id="vgD1" />
    </Frame>
  );
};
export default D1;
void REFUGE;
