// V5 HOOK (0 → ~7.0 s). One close, readable jump into the ladle; the impact's ripples cool the surface into the
// training target while the camera dives into it; the same composition comes back as the simulation, where one
// attempt falls short, rewinds, and the corrected attempt lands on the target. The avatar's follow-through (hands
// forward) is the matched pose that cuts to the F.02 at work.
//   0.0  F.02 crouched at the deck edge, the molten ladle bottom-right (no titles)
//   0.5  weight shift into the crouch → planted push-off → ballistic arc (real time, no slow motion)
//   2.2  impact on "metal": splash, flash, ripples; the robot is masked by the surface (never faded)
//   2.7  ripples cool the surface into the blue target; the camera dives into it (frame = surface only)
//   3.3  swap under full cover → pull back: the same layout is the teaching stage, avatar in the start pose
//   3.8  attempt: weak push, lands short, stumbles (✗ on the landing spot) → rewind
//   5.2  corrected attempt: deeper crouch, full arm swing, lands on the bullseye on "jump"
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Bot, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp, toScreen} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {Splash6} from '../sets/splash6';
import {StageView} from '../../v4/sets/views';
import {Pad, TGT_X, Arc} from '../../v4/sets/stage';
import {Mark} from '../../v4/sets/props';
import {rig, RPose} from '../../v4/rig/Robot2D';
import {makeJump5, J5} from '../rig/jump5';
import {blend} from '../../v4/rig/poses';
import {smoothCam, shake, fitIn} from '../kit/cam5';
import {C} from '../../theme';

export const S_HK = 0.6;
export const TOE_X = FD.deck.edge - 4;
export const ENTRY_X = TGT_X;
const L = FD.ladle;

// ------------------------------------------------------------------------------------------------ timing
export const T_HIT = T('metal') - 0.08;
export const T_LAND2 = T('jump') + 0.04;
export const HOOK_END = T('These are') - 0.22;
const T_DIVE0 = T_HIT + 0.52;
export const T_SWAP = T_HIT + 1.08;
const T_BACK = T_SWAP + 0.55;

const spec0: J5 = {toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X, endY: L.surf, s: S_HK, tReady: 0, tPush: 0, tTO: 0, apex: 92 * S_HK, outcome: 'plunge', depth: 1.15, swing: 1.1};
const T0 = makeJump5(spec0).T;
const TO0 = T_HIT - T0;
/** The opening jump (real F.02). V6: the weight shift is already under way on frame 0 (its curve starts 0.35 s
 * before the film does), runs straight into the crouch and the push; no hold, no glance, no extra bob. */
export const J0 = makeJump5({...spec0, tReady: -0.35, tPush: TO0 - 0.32, tTO: TO0});
const j0Pose = (t: number): RPose => J0.pose(t).pose;

// attempt 1: shallow crouch, weak push → short
const spec1: J5 = {toeX: TOE_X, deckY: FD.deck.top, endX: 548, endY: L.surf, s: S_HK, tReady: 0, tPush: 0, tTO: 0, apex: 10 * S_HK, outcome: 'short', depth: 0.55, swing: 0.45};
const J1 = makeJump5({...spec1, tReady: T_BACK - 0.2, tPush: T_BACK + 0.02, tTO: T_BACK + 0.22});
const LAND1 = J1.tEnd;
// attempt 2: the corrected movement (deeper crouch, full arm swing, higher arc), landing on "jump"
const spec2: J5 = {toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X + 6, endY: L.surf, s: S_HK, tReady: 0, tPush: 0, tTO: 0, apex: 84 * S_HK, outcome: 'stick', depth: 1.3, swing: 1.25, reachArms: 1};
const J2T = makeJump5(spec2).T;
export const J2 = makeJump5({...spec2, tReady: 0, tPush: T_LAND2 - J2T - 0.3, tTO: T_LAND2 - J2T});
// rewind (V6): the ✗ and the failed trail clear first, then attempt 1 plays back to its crouch in 0.3 s and flows
// straight into attempt 2's deeper crouch, so the next push starts from a planted stance (never a pop)
const RW1 = J2.tPush - 0.03, RW0 = RW1 - 0.3;
const CLEAR0 = RW0 - 0.14;

// ------------------------------------------------------------------------------------------------ cameras
const CAM0: Cam = {x: 540, y: 532, z: 1.62};
const CAM_HIT: Cam = {x: 700, y: 640, z: 1.66};
const CAM_POST: Cam = {x: ENTRY_X, y: 700, z: 2.15};
export const CAM_DIVE: Cam = {x: ENTRY_X, y: 789, z: 16};
export const CAM_ST: Cam = {x: 560, y: 572, z: 1.3};
export const CAM_MED: Cam = {x: 690, y: 604, z: 1.9};

/** Raw opening framing (before smoothing): hold, then travel with the robot to the ladle, keeping its head in frame. */
const camRaw = (t: number): Cam => {
  let c = mixCam(CAM0, CAM_HIT, smooth(seg(t, J0.tTO - 0.25, T_HIT + 0.05)));
  if (t > T_HIT) c = mixCam(c, CAM_POST, easeOut(seg(t, T_HIT, T_DIVE0)));
  // keep the whole robot and the molten surface around the entry point in frame while it is airborne
  if (t < T_HIT + 0.1) {
    c = fitIn(c, [...j0Pts(Math.min(t, T_HIT)), [ENTRY_X - 120, L.surf - 40], [ENTRY_X + 160, L.surf + 30]], {top: 120, bottom: 70, left: 90, right: 90});
  }
  return c;
};
/** Points that must stay in frame while the F.02 is in the air: head, both hands (fingertips), both toes. */
const j0Pts = (t: number): [number, number][] => {
  const P = rig(j0Pose(t), S_HK).pts;
  return [[P.head[0], P.head[1] - 60 * S_HK], [P.handN[0], P.handN[1] - 24 * S_HK], [P.handF[0], P.handF[1] - 24 * S_HK], P.wrN, P.wrF, P.toeN, P.toeF];
};
export const hookCam = (t: number): Cam => {
  if (t < T_DIVE0) {
    let c = smoothCam(camRaw, t, 0.22);
    // hard guard after smoothing: the raised hands never touch the frame edge
    if (t < T_HIT + 0.05) c = fitIn(c, j0Pts(Math.min(t, T_HIT)), {top: 70, bottom: 50, left: 70, right: 70});
    return shake(c, t, 7 * Math.max(0, 1 - (t - T_HIT) / 0.35) * (t > T_HIT ? 1 : 0));
  }
  // one continuous pull-back from the entry point to the stage framing while the world changes material (no dive)
  const from = hookCam(T_DIVE0 - 1e-4);
  let back = mixCam(from, CAM_ST, easeInOut(seg(t, T_DIVE0 + 0.05, T_SWAP + 0.45)));
  if (t > T_DIVE0 + 0.15) {
    const P = rig(avatarPose(t), S_HK).pts;
    const k = smooth(seg(t, T_DIVE0 + 0.15, T_DIVE0 + 0.45));   // the guard eases in as the stage appears
    back = mixCam(back, fitIn(back, [[P.head[0], P.head[1] - 60 * S_HK], P.wrN, P.wrF, P.toeN, P.toeF, [ENTRY_X, L.surf]], {top: 90, bottom: 60, left: 90, right: 90}), k);
  }
  if (t < T_BACK) return back;
  return mixCam(back, smoothCam(stageRaw, t, 0.25), smooth(seg(t, T_BACK, T_BACK + 0.45)));
};
const stageRaw = (t: number): Cam => {
  const c = mixCam(CAM_ST, CAM_MED, easeInOut(seg(t, J2.tPush - 0.1, T_LAND2 + 0.25)));
  const P = rig(avatarPose(Math.max(t, T_BACK)), S_HK).pts;
  const tgt: [number, number][] = t > J2.tTO - 0.2 ? [[ENTRY_X - 110, L.surf + 20], [ENTRY_X + 130, L.surf + 30]] : [];
  return fitIn(c, [[P.head[0], P.head[1] - 60 * S_HK], P.wrN, P.wrF, P.toeN, P.toeF, ...tgt], {top: 90, bottom: 60, left: 90, right: 90});
};

// ------------------------------------------------------------------------------------------------ avatar
/** The avatar pose on the stage at time t (attempt 1, rewind, attempt 2). */
export const avatarPose = (t: number): RPose => {
  if (t < RW0) return J1.pose(t).pose;
  if (t < RW1) {
    const k = easeInOut(seg(t, RW0, RW1));
    return blend(J1.pose(lerp(RW0, J1.tPush, k)).pose, J2.K0, smooth(seg(k, 0.55, 1)));
  }
  if (t < J2.tPush) return J2.K0;
  return J2.pose(t).pose;
};
/** End-of-hook pose and framing (the factory shot matches it). */
export const HOOK_LAST = (() => {
  const p = J2.pose(HOOK_END).pose;
  return {pose: p, cam: hookCam(HOOK_END), s: S_HK};
})();

const E = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cam = hookCam(t);
  const lw = 4 / cam.z;

  // ============================================================== stage (after the swap)
  if (t >= T_SWAP) {
    const p = avatarPose(t);
    const rew = t >= RW0 && t < RW1;
    const fail = seg(t, LAND1 + 0.05, LAND1 + 0.25) * (1 - seg(t, CLEAR0, RW0));
    const pulse = Math.max(0, 1 - Math.abs(t - T_LAND2 - 0.1) / 0.4);
    // attempt 1's path is drawn as it flies and cleared before the rewind (sim language: dashed coral)
    const arc1 = t > J1.tTO && t < RW0 ? <Arc pts={J1.arc()} k={seg(t, J1.tTO, J1.tEnd)} lw={lw} color={C.coral} opacity={1 - seg(t, CLEAR0, RW0)} /> : null;
    const arc2 = t > J2.tTO ? <Arc pts={J2.arc()} k={seg(t, J2.tTO, J2.tEnd)} lw={lw} color="#4F7CC9" opacity={1 - seg(t, T_LAND2 + 0.1, HOOK_END)} /> : null;
    return (
      <Scene bg="#EEF4FD">
        <StageView cam={cam} grid={0.55} pulse={pulse}
          behind={<>{arc1}{arc2}</>}
          onPad={fail > 0 ? <Mark x={J1.p1.x + 6} y={L.surf + 4} ok={false} k={fail} s={0.4} /> : null}
          front={(
            <>
              <Bot cam={cam} id="hkav" model="SIM" s={S_HK} pose={p} />
            </>
          )} />
        {rew ? <RewindStreaks t={t} k={Math.sin(Math.PI * seg(t, RW0, RW1))} /> : null}
        {rew ? <g opacity={Math.sin(Math.PI * seg(t, RW0, RW1))} transform="translate(96 96)"><path d="M0 0 L-34 22 L0 44 Z M38 0 L4 22 L38 44 Z" fill="#4F7CC9" /></g> : null}
      </Scene>
    );
  }

  // ============================================================== foundry
  const st = J0.pose(t);
  const tHit = t - T_HIT;
  const under = st.phase === 'after' && st.u > 0.6;
  // V6: the environment and the target change material together. A front sweeps out from the entry point across the
  // whole frame (fast at first, so it never reads as a disc sitting in the metal); behind it is the same layout as the
  // teaching stage (deck → tower, molten surface → pad and target), with the avatar already standing on the tower.
  const W0 = T_HIT + 0.5, W1 = T_SWAP - 0.08;
  const wu = seg(t, W0, W1);
  const Rw = 2300 * (1 - Math.pow(1 - wu, 2.4));
  const eS = toScreen(cam, ENTRY_X, L.surf);
  const inside = (
    <>
      <Splash6 x={ENTRY_X} t={tHit} lw={lw} part="back" scale={1.12} />
      {!under || st.u < 0.62 ? <Bot cam={cam} id="hk0" model="F02" s={S_HK} pose={j0Pose(t)} clipBelow={st.phase === 'after' ? L.surf + 1 : undefined} /> : null}
      <Splash6 x={ENTRY_X} t={tHit} lw={lw} part="front" scale={1.12} />
    </>
  );
  const glow = 1 - 0.75 * seg(t, T_HIT + 0.5, T_SWAP);
  const flash = tHit > 0 ? Math.max(0, 1 - tHit / 0.22) : 0;
  return (
    <Scene bg="#221A21"
      over={<Chip x={96} y={958} lines={['ILLUSTRATED RECONSTRUCTION']} k={seg(t, 0.6, 0.9) * (1 - seg(t, W0 - 0.05, W0 + 0.12))} size={30} tone="ink" />}>
      <FoundryView5 cam={cam} t={t} hit={{x: ENTRY_X, t: tHit}} inside={inside} hook={false} glow={glow} embers={1 - seg(t, T_HIT + 0.4, T_SWAP)} id="hkf" />
      {Rw > 1 ? (
        <g>
          <defs><clipPath id="hkWipe" clipPathUnits="userSpaceOnUse"><circle cx={eS.x} cy={eS.y} r={Rw} /></clipPath></defs>
          <g clipPath="url(#hkWipe)">
            <rect width={1920} height={1080} fill="#EEF4FD" />
            <StageView cam={cam} grid={0.55} front={<Bot cam={cam} id="hkavW" model="SIM" s={S_HK} pose={avatarPose(t)} />} />
          </g>
          <circle cx={eS.x} cy={eS.y} r={Rw} fill="none" stroke="#FFFFFF" strokeWidth={14} opacity={0.85 * (1 - wu)} />
          <circle cx={eS.x} cy={eS.y} r={Math.max(0, Rw - 16)} fill="none" stroke={C.teal} strokeWidth={5} opacity={0.7 * (1 - wu)} />
        </g>
      ) : null}
      {flash > 0 ? (() => {
        const e = toScreen(cam, ENTRY_X, L.surf);
        return (
          <g style={{mixBlendMode: 'screen'}}>
            <defs><radialGradient id="hkFlash" cx={e.x} cy={e.y} r={700} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF0C0" stopOpacity={0.75 * flash} /><stop offset="1" stopColor="#FFB04A" stopOpacity={0} /></radialGradient></defs>
            <rect width={1920} height={1080} fill="url(#hkFlash)" />
          </g>
        );
      })() : null}
    </Scene>
  );
};

/** Rewind streaks: thin horizontal lines that sweep across the frame while an attempt plays backwards. */
const RewindStreaks: React.FC<{t: number; k: number}> = ({t, k}) => (
  <g opacity={k * 0.55}>
    {Array.from({length: 9}, (_, i) => {
      const y = 120 + i * 105 + Math.sin(i * 1.7) * 30;
      const x = ((t * 2600 + i * 431) % 2400) - 240;
      return <rect key={i} x={1920 - x} y={y} width={220 + (i % 3) * 90} height={5} rx={2.5} fill="#4F7CC9" />;
    })}
  </g>
);
/** Event times for the sound cue sheet. */
export const HOOK_EV = {J0, J1, J2, RW0, RW1, T_SWAP, T_BACK, T_DIVE0, LAND1};
