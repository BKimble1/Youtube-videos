// V4 OPENING (0:00 → "Start with why"): one clearly staged jump, its consequence, the source attribution, then the
// learning question: the settling ripple becomes a drawn target and the same composition turns into the teaching
// stage with the same model as a training avatar. Ends pushing into the avatar's chest (match cut to the F.02 emblem).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T, blockStart} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, keys, toScreen, lerp} from '../kit/scene';
import {FoundryView, StageView, FD} from '../sets/views';
import {Splash} from '../sets/foundry';
import {Arc} from '../sets/stage';
import {makeJump} from '../rig/jump';
import {rig} from '../rig/Robot2D';
import {stand, blend} from '../rig/poses';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C} from '../../theme';

export const OPEN_END = blockStart('B02') - 0.12;
const T_IN = T('steel');
const T_FIG = T('Figure, the robot') - 0.05;
const T_SPOKE = T('and a spokesperson');
const T_WHY = T('So why would') - 0.1;
const T_HOW = T('And how does') - 0.05;
const T_JUMP = T('jump it only');
const T_ONCE = T('once');

export const S_OPEN = 0.6;
export const TOE_X = FD.deck.edge - 4;
export const ENTRY_X = 760;
export const JUMP1 = makeJump({
  toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X, endY: FD.ladle.surf, s: S_OPEN,
  tPush: 0.0, tTO: 0.38, tEnd: T_IN, apex: 110 * S_OPEN,
  rate: [[0.38, 1], [0.6, 1], [1.0, 0.3], [2.5, 0.3], [2.9, 1], [T_IN, 1]],
});
/** Wide composition shared by the opening shot and the training stage. */
export const CAM_WIDE: Cam = {x: 600, y: 428, z: 1.26};
const CAM_ENTRY: Cam = {x: 720, y: 660, z: 1.62};
const CAM_BOOTH: Cam = {x: 1080, y: 560, z: 0.9};
const CAM_RING: Cam = {x: ENTRY_X, y: FD.ladle.surf, z: 3.0};
/** The booth framing keeps drifting slowly while the witness is on screen. */
const boothCam = (tau: number): Cam => {
  const u = smooth(seg(tau, T_FIG + 0.8, T_WHY));
  return {x: CAM_BOOTH.x + 70 * u, y: CAM_BOOTH.y - 10 * u, z: CAM_BOOTH.z * (1 + 0.1 * u)};
};

// the avatar on the tower: same crouch as the opening, then stands and turns to the camera
const AV_STAND = stand(TOE_X - 70 * S_OPEN, FD.deck.top, S_OPEN, {yaw: 0, armN: {sh: 2, el: 8, grip: 0.3}, armF: {sh: 2, el: 8, grip: 0.3}});
export const avatarPose = (tau: number) => blend(JUMP1.K0, AV_STAND, smooth(seg(tau, T_ONCE - 0.5, T_ONCE + 0.35)));
/** Camera that frames the avatar's chest at the end of the opening (the F.02 emblem shot matches it). */
export const CHEST_Z = 4.2;
export const chestPoint = () => rig(AV_STAND, S_OPEN).pts.chest;

const silhouette = (
  <filter id="silF"><feColorMatrix type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.04  0 0 0 0 0.05  0 0 0 1 0" /></filter>
);

export const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const tau = f / 30;
  const st = JUMP1.pose(tau);
  const tHit = tau - T_IN;

  // ------------------------------------------------ teaching stage (from the ripple onwards)
  const toSim = seg(tau, T_HOW + 0.55, T_HOW + 1.05); // scenery transform radius 0..1
  const back = easeInOut(seg(tau, T_HOW + 0.85, T_HOW + 1.9));
  if (toSim >= 1) {
    const chest = chestPoint();
    const push = easeInOut(seg(tau, T_ONCE + 0.15, OPEN_END));
    const camChest: Cam = {x: chest[0], y: chest[1], z: CHEST_Z};
    const cam = push > 0 ? mixCam(CAM_WIDE, camChest, push) : mixCam(CAM_RING, CAM_WIDE, back);
    const lw = 4 / cam.z;
    const pulse = Math.max(0, 1 - Math.abs(tau - T_ONCE - 0.1) / 0.45);
    const arcK = easeOut(seg(tau, T_JUMP - 0.05, T_JUMP + 0.75));
    return (
      <Scene bg="#EEF4FD">
        <StageView cam={cam} grid={0.55 * (1 - seg(tau, T_HOW + 1.6, T_HOW + 2.6)) + 0.12} pulse={pulse}
          behind={<Arc pts={JUMP1.arc()} k={arcK} lw={lw} color="#4F7CC9" opacity={1 - push} />}
          front={<Bot cam={cam} id="avO" model="SIM" s={S_OPEN} pose={avatarPose(tau)} />} />
      </Scene>
    );
  }

  // ------------------------------------------------ foundry
  let cam: Cam;
  if (tau < T_IN) {
    // one viewpoint and one composition: subject, arc and destination stay in frame (raised hands at the apex included);
    // the camera only starts toward the entry point once the robot is falling
    cam = mixCam(CAM_WIDE, CAM_ENTRY, easeIn(seg(tau, 2.5, T_IN)));
  }
  else if (tau < T_FIG) cam = mixCam(CAM_ENTRY, {x: ENTRY_X, y: 690, z: 1.75}, easeOut(seg(tau, T_IN, T_FIG)));
  else if (tau < T_WHY) cam = mixCam({x: ENTRY_X, y: 690, z: 1.75}, boothCam(tau), easeInOut(seg(tau, T_FIG, T_FIG + 1.4)));
  else cam = mixCam(boothCam(tau), CAM_RING, easeInOut(seg(tau, T_WHY, T_HOW + 0.5)));
  const lw = 4 / cam.z;
  const inVessel = st.phase === 'after' || (st.phase === 'air' && st.u > 0.97);
  const robotGone = st.phase === 'after' && st.u > 0.9;
  // slow settling rings from the entry point (they become the target)
  const rings: React.ReactNode[] = [];
  for (let k = 0; k < 4; k++) {
    const ph = ((tau - (T_WHY - 1.2)) / 1.4 + k / 4);
    if (tau < T_WHY - 1.2) break;
    const u = ph - Math.floor(ph);
    const r = 30 + u * 150;
    rings.push(<ellipse key={k} cx={ENTRY_X} cy={FD.ladle.surf} rx={r} ry={r * (FD.ladle.sry / FD.ladle.srx)} fill="none" stroke="#FFF7CF" strokeWidth={lw * 1.6} opacity={(1 - u) * 0.8 * (1 - seg(tau, T_HOW + 0.2, T_HOW + 0.55))} />);
  }
  // target ink drawn over the rings
  const ink = seg(tau, T_HOW - 0.05, T_HOW + 0.55);
  const tgt = (r: number, w: number, k: number, key: string) => {
    const rx = r, ry = r * (FD.ladle.sry / FD.ladle.srx);
    const len = Math.PI * (rx + ry) * 1.05;
    return <ellipse key={key} cx={ENTRY_X} cy={FD.ladle.surf} rx={rx} ry={ry} fill="none" stroke={C.teal} strokeWidth={lw * w} strokeDasharray={`${len * k} ${len}`} strokeLinecap="round" />;
  };
  const witness = (
    <g clipPath="url(#boothWin)">
      <defs>
        <clipPath id="boothWin"><rect x={FD.booth.x0 + 30} y={FD.booth.y0 + 30} width={FD.booth.x1 - FD.booth.x0 - 60} height={190} /></clipPath>
        {silhouette}
      </defs>
      <rect x={FD.booth.x0 + 30} y={FD.booth.y0 + 30} width={FD.booth.x1 - FD.booth.x0 - 60} height={190} fill="#6B4A3A" opacity={0.6} />
      <g filter="url(#silF)">
        <Crew look={CAST.checker} pose={{...IDLE, armL: {a: 14, b: 30}, armR: {a: 26, b: 120}, lookX: -0.8, lookY: 0.3, mouth: 'flat'}} x={FD.booth.x0 + 300} y={FD.booth.y0 + 330} h={300} frame={f} seed={21} flip shadow={false} />
      </g>
    </g>
  );
  const scr = toScreen(cam, ENTRY_X, FD.ladle.surf);
  const simR = toSim > 0 ? easeInOut(toSim) * 2300 : 0;
  const inside = (
    <>
      <Splash x={ENTRY_X} t={tHit} lw={lw} part="back" scale={1.35} />
      {!robotGone ? <Bot cam={cam} id="r1" model="F02" s={S_OPEN} pose={st.pose} clipBelow={inVessel ? FD.ladle.surf + 1 : undefined} /> : null}
      <Splash x={ENTRY_X} t={tHit} lw={lw} part="front" scale={1.35} />
      {rings}
      {ink > 0 ? <g>{tgt(92, 4.2, easeOut(ink), 't1')}{tgt(46, 3.4, easeOut(seg(ink, 0.3, 1)), 't2')}</g> : null}
    </>
  );
  return (
    <Scene bg="#221A21"
      over={(
        <>
          <Chip x={100} y={64} lines={['FIGURE · “F.02 DECOMMISSION” · SEP 30, 2026']} k={seg(tau, T_FIG + 0.3, T_FIG + 0.7) * (1 - seg(tau, T_WHY - 0.3, T_WHY))} size={32} />
          <Chip x={100} y={150} lines={['OVAKO STEEL PLANT, IMATRA · VIA YLE']} k={seg(tau, T_SPOKE + 0.3, T_SPOKE + 0.7) * (1 - seg(tau, T_WHY - 0.3, T_WHY))} size={32} tone="paper" />
        </>
      )}>
      <FoundryView cam={cam} t={tau} hit={{x: ENTRY_X, t: tHit}} scar={seg(tau, T_IN + 0.8, T_IN + 2.5)} inside={inside} booth={witness} />
      {simR > 0 ? (
        <g>
          <defs><clipPath id="toSim"><circle cx={scr.x} cy={scr.y} r={simR} /></clipPath></defs>
          <g clipPath="url(#toSim)">
            <rect width={1920} height={1080} fill="#EEF4FD" />
            <StageView cam={cam} grid={0.55} />
          </g>
          <circle cx={scr.x} cy={scr.y} r={simR} fill="none" stroke={C.teal} strokeWidth={8} />
        </g>
      ) : null}
    </Scene>
  );
};
void lerp; void keys;
