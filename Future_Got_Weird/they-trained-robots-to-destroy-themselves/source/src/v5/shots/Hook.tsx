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
import {Splash} from '../../v4/sets/foundry';
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
/** The opening jump (real F.02). */
export const J0 = makeJump5({...spec0, tReady: Math.max(0.42, TO0 - 0.92), tPush: TO0 - 0.32, tTO: TO0});
/** The F.02 before takeoff also glances down at the ladle, then back up to the push. */
const j0Pose = (t: number): RPose => {
  const p = J0.pose(t).pose;
  if (t >= J0.tTO) return p;
  const look = smooth(seg(t, 0.0, 0.35)) * (1 - smooth(seg(t, J0.tPush - 0.3, J0.tPush + 0.05)));
  return {...p, neck: p.neck + 14 * look, head: p.head + 10 * look};
};

// attempt 1: shallow crouch, weak push → short
const spec1: J5 = {toeX: TOE_X, deckY: FD.deck.top, endX: 548, endY: L.surf, s: S_HK, tReady: 0, tPush: 0, tTO: 0, apex: 10 * S_HK, outcome: 'short', depth: 0.55, swing: 0.45};
const J1 = makeJump5({...spec1, tReady: T_BACK - 0.2, tPush: T_BACK + 0.02, tTO: T_BACK + 0.22});
const LAND1 = J1.tEnd;
// attempt 2: the corrected movement (deeper crouch, full arm swing, higher arc), landing on "jump"
const spec2: J5 = {toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X + 6, endY: L.surf, s: S_HK, tReady: 0, tPush: 0, tTO: 0, apex: 84 * S_HK, outcome: 'stick', depth: 1.3, swing: 1.25, reachArms: 1};
const J2T = makeJump5(spec2).T;
export const J2 = makeJump5({...spec2, tReady: 0, tPush: T_LAND2 - J2T - 0.3, tTO: T_LAND2 - J2T});
// rewind: attempt 1 plays back to its crouch, which deepens straight into attempt 2's crouch
const RW1 = J2.tPush - 0.2, RW0 = Math.max(LAND1 + 0.3, RW1 - 0.26);

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
    const P = rig(j0Pose(Math.min(t, T_HIT)), S_HK).pts;
    c = fitIn(c, [[P.head[0], P.head[1] - 60 * S_HK], P.wrN, P.wrF, P.toeN, P.toeF, [ENTRY_X - 120, L.surf - 40], [ENTRY_X + 160, L.surf + 30]], {top: 80, bottom: 70, left: 90, right: 90});
  }
  return c;
};
export const hookCam = (t: number): Cam => {
  if (t < T_DIVE0) return shake(smoothCam(camRaw, t, 0.22), t, 7 * Math.max(0, 1 - (t - T_HIT) / 0.35) * (t > T_HIT ? 1 : 0));
  if (t < T_SWAP) return mixCam(smoothCam(camRaw, T_DIVE0, 0.22), CAM_DIVE, easeIn(seg(t, T_DIVE0, T_SWAP)));
  const back = mixCam(CAM_DIVE, CAM_ST, easeOut(seg(t, T_SWAP, T_BACK)));
  if (t < T_BACK) return back;
  return mixCam(back, smoothCam(stageRaw, t, 0.25), smooth(seg(t, T_BACK, T_BACK + 0.35)));
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
    return J1.pose(lerp(RW0, J1.tPush, k)).pose;
  }
  if (t < J2.tPush) return blend(J1.K0, J2.K0, smooth(seg(t, RW1, J2.tPush)));
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
    const fail = seg(t, LAND1 + 0.05, LAND1 + 0.3) * (1 - seg(t, RW0, RW0 + 0.15));
    const pulse = Math.max(0, 1 - Math.abs(t - T_LAND2 - 0.1) / 0.4);
    // faint record of attempt 1's path while it rewinds (dashed, sim language)
    const arc1 = rew ? <Arc pts={J1.arc()} k={1 - seg(t, RW0, RW1)} lw={lw} color={C.coral} /> : null;
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
      </Scene>
    );
  }

  // ============================================================== foundry
  const st = J0.pose(t);
  const tHit = t - T_HIT;
  const under = st.phase === 'after' && st.u > 0.6;
  // the surface cools from the entry point: an expanding front inside the molten ellipse
  const R = lerp(0, 330, easeIn(seg(t, T_HIT + 0.5, T_SWAP - 0.06)) * 0.35 + seg(t, T_HIT + 0.5, T_SWAP - 0.06) * 0.65);
  const cool = R > 1 ? (
    <g>
      <defs>
        <clipPath id="hkCool"><path d={E(ENTRY_X, L.surf, R, R * (L.sry / L.srx))} /></clipPath>
        <clipPath id="hkSurf"><path d={E(L.cx, L.surf, L.srx, L.sry)} /></clipPath>
      </defs>
      <g clipPath="url(#hkSurf)">
        <g clipPath="url(#hkCool)"><Pad lw={lw} tk={1} /></g>
        <path d={E(ENTRY_X, L.surf, R, R * (L.sry / L.srx))} fill="none" stroke="#FFFFFF" strokeWidth={lw * 3.2} opacity={0.95} />
      </g>
    </g>
  ) : null;
  const inside = (
    <>
      <Splash x={ENTRY_X} t={tHit} lw={lw} part="back" scale={1.12} />
      {!under || st.u < 0.62 ? <Bot cam={cam} id="hk0" model="F02" s={S_HK} pose={j0Pose(t)} clipBelow={st.phase === 'after' ? L.surf + 1 : undefined} /> : null}
      {cool}
      <Splash x={ENTRY_X} t={tHit} lw={lw} part="front" scale={1.12} />
    </>
  );
  const glow = 1 - 0.75 * seg(t, T_HIT + 0.5, T_SWAP);
  const flash = tHit > 0 ? Math.max(0, 1 - tHit / 0.22) : 0;
  return (
    <Scene bg="#221A21"
      over={<Chip x={96} y={958} lines={['ILLUSTRATED RECONSTRUCTION']} k={seg(t, T_HIT + 0.15, T_HIT + 0.4) * (1 - seg(t, T_DIVE0 + 0.15, T_DIVE0 + 0.35))} size={30} tone="ink" />}>
      <FoundryView5 cam={cam} t={t} hit={{x: ENTRY_X, t: tHit}} inside={inside} hook={false} glow={glow} embers={1 - seg(t, T_HIT + 0.4, T_SWAP)} id="hkf" />
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
