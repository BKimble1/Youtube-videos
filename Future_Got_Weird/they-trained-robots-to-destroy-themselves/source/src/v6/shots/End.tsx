// V5 END ("So why is it uncomfortable to watch?" → logo).
//   E1  the aisle's lights go out bank by bank; the avatar's line art fills black; a warm glow rises behind the same
//       shape: it now stands, a silhouette, on the foundry deck (same screen position and size)
//   E2  arms, legs, head; it walks to the edge and leaps (the flight slows, it never stops); on "wasn't the robot's"
//       the take rewinds to the edge and the camera pulls back to the people who set it up
//   E3  the director points at the ladle (picked the ending), a technician tosses the target onto it (built the
//       target), another raises the score card (wrote the score); the slate claps and the silhouette makes the jump
//       along the planned arc into the rings (reaching it)
//   E4  symbolic, not the same robot: the surface cools into the simulator's pad, the line-art avatar builds at the
//       edge and sticks the landing on it; the crew raise their cards. The glow whites out into the channel mark.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {T, NARR_END} from '../cues';
import {Cam, Layer, Bot, Crew, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, rnd, crewHand, crewReach} from '../../v4/kit/scene';
import {FD} from '../sets/foundry5';
import {Splash6} from '../sets/splash6';
import {Arc, TGT_X, SCOL} from '../../v4/sets/stage';
import {BigClapper} from '../../v4/sets/props';
import {RPose, rig} from '../../v4/rig/Robot2D';
import {walk, blend, stand, A} from '../../v4/rig/poses';
import {makeJump5} from '../rig/jump5';
import {walkStop, STOP_DUR} from '../rig/stop';
import {smoothCam} from '../kit/cam5';
import {S_HK} from './Hook';
import {PROVE_END, Aisle, avatarPose, AV} from './Prove';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const END_START = PROVE_END;
export const END_HOLD = 2.15; // the tableau settles, the glow opens into the logo, hold, out
const END_T = NARR_END + END_HOLD;
const T_WHY = T('So why is it uncomfortable');
const T_SHAPE = T('Partly, it’s the shape');
const T_WHEN = T('When something with');
const T_ARMS = T('arms, legs');
const T_LEGS = T('legs and a head');
const T_HEAD = T('a head walks') + 0.06;
const T_LEAPS = T('leaps');
const T_BUT = T('But the choice wasn’t');
const T_PEOPLE = T('People picked the ending');
const T_ENDING = T('ending');
const T_BUILT = T('built the target');
const T_WROTE = T('wrote the score');
const T_POLICY = T('The policy just got');
const T_REACH = T('reaching it');
const T_THESE = T('These robots didn’t');
const T_STUCK = T('stuck the landing');

const S = S_HK;
const L = FD.ladle;
const DECK = FD.deck.top, SURF = L.surf, TOE_X = FD.deck.edge - 4;
const K = '#0E0607';

// ------------------------------------------------------------------ the silhouette's moves
/** Take 1: walks to the edge and leaps; the flight slows (never holds) until the rewind. */
const J1 = makeJump5({toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: T_LEAPS - 0.62, tPush: T_LEAPS - 0.3, tTO: T_LEAPS + 0.02, apex: 92 * S, outcome: 'plunge', depth: 1.1, swing: 1.1});
const SLOW_AT = J1.tTO + 0.14;
const U_RW = 0.86; // where the rewind catches it: just above the surface
const SLOW_R = (U_RW * J1.T - 0.14) / (T_BUT - SLOW_AT); // flight playback rate while slowed
/** Jump-clock for take 1 (real time until just after takeoff, then slowed; then rewound to the edge). */
const j1Clock = (t: number) => {
  if (t < SLOW_AT) return t;
  const ramp = 0.25; // blend 1 → SLOW_R over `ramp` s (integrated)
  const d = t - SLOW_AT;
  const tIn = Math.min(d, ramp);
  const inRamp = tIn - ((1 - SLOW_R) * tIn * tIn) / (2 * ramp);
  const after = Math.max(0, d - ramp) * SLOW_R;
  return SLOW_AT + inRamp + after;
};
const RW0 = T_BUT, RW1 = T_BUT + 0.62;
const C_RW = j1Clock(RW0);
// the walk to the edge: whole strides ending with the near foot on take-1's ready mark, then a stop step (no sliding)
const E_STEPS = 4, E_SW = 150 * S;    // V6: a shorter walk to the edge
const E_X0 = J1.READY.footN!.x - (E_STEPS + 0.25) * E_SW;
const FOOT0 = E_X0 + 0.25 * E_SW;                                       // near foot before the walk (= the crouch's near foot)
const K0_FOOT = AV.j.K0.footN!.x - AV.j.K0.x;                          // near-foot offset from the pelvis in the aisle crouch
const TRAIL0 = FOOT0 + (AV.j.K0.footF!.x - AV.j.K0.footN!.x) * S;      // far foot before the walk
const STANDBACK: RPose = (() => {
  const w = walk(E_X0, DECK, S, 0, 1, {yaw: 0.78}, 150);
  return {...w, rot: 0, waist: 0, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3}), footF: {...w.footF!, x: TRAIL0, y: DECK - (DECK - w.footN!.y), pitch: 0}};
})();
const W0 = T_WHEN + 0.1, W1 = J1.tReady - STOP_DUR - 0.04;
const WALK = {x0: E_X0, ground: DECK, s: S, n: E_STEPS, o: {yaw: 0.78}, t0: W0, t1: W1, ready: J1.READY, trailStartX: TRAIL0};

/** Take 2: the real jump on the planned arc, initiated by the slate. */
const J2 = (() => {
  const spec = {toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: 0, tPush: 0, tTO: 0, apex: 92 * S, outcome: 'plunge' as const, depth: 1.1, swing: 1.1};
  const Tf = makeJump5(spec).T;
  const tEnd = T_REACH + 0.06;
  return makeJump5({...spec, tReady: tEnd - Tf - 0.62, tPush: tEnd - Tf - 0.32, tTO: tEnd - Tf});
})();
const T_CLAP = J2.tReady - 0.08;

/** The scaled aisle pose (s = 1) rebuilt at the silhouette's spot on the deck (s = S). */
const toDeck = (p: RPose): RPose => {
  const ax = AV.j.K0.x, bx = FOOT0 - K0_FOOT * S;
  const P = (q?: {x: number; y: number; pitch?: number}) => (q ? {...q, x: bx + (q.x - ax) * S, y: DECK + (q.y - AV.G) * S} : undefined);
  return {...p, x: bx + (p.x - ax) * S, y: DECK + (p.y - AV.G) * S, footN: P(p.footN), footF: P(p.footF), handN: P(p.handN), handF: P(p.handF)};
};
const RISE0 = T_WHY + 1.1, RISE1 = T_WHY + 1.9;
const silPose = (t: number): RPose => {
  const crouched = toDeck(avatarPose(Math.min(t, END_START)));
  if (t < RISE1) return blend(crouched, STANDBACK, smooth(seg(t, RISE0, RISE1)));
  if (t < W0) return STANDBACK;
  if (t < J1.tReady) {
    const pw = walkStop(WALK, t);
    return t < W0 + 0.3 ? blend(STANDBACK, pw, smooth(seg(t, W0, W0 + 0.3))) : pw;
  }
  if (t < RW0) return J1.pose(j1Clock(t)).pose;
  if (t < RW1) {
    // rewind: the jump-clock runs backwards to the start of the push, then the robot is back at the edge
    const u = easeInOut(seg(t, RW0, RW1));
    return J1.pose(lerp(C_RW, J1.tReady - 0.01, u)).pose;
  }
  if (t < J2.tReady) return J2.READY;
  return J2.pose(t).pose;
};
const silPhase = (t: number) => (t < RW0 ? J1.pose(j1Clock(t)) : t < RW1 ? null : J2.pose(t));

// ------------------------------------------------------------------ the silhouette set
const SilSet: React.FC<{cam: Cam; t: number; glow?: number; children?: React.ReactNode; inside?: React.ReactNode; front?: React.ReactNode; pad?: number}> = ({cam, t, glow = 1, children, inside, front, pad = 0}) => {
  const lw = 4 / cam.z;
  return (
    <Layer cam={cam}>
      <defs>
        <linearGradient id="e5Bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C0A0B" /><stop offset="1" stopColor="#3A140E" /></linearGradient>
        <radialGradient id="e5Glow" cx={L.cx} cy={L.surf - 120} r={1300} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFC870" stopOpacity={Math.min(1, 0.95 * glow)} /><stop offset="0.3" stopColor="#FF8A2A" stopOpacity={Math.min(1, 0.55 * glow)} /><stop offset="1" stopColor="#FF6A1A" stopOpacity={0} /></radialGradient>
        <radialGradient id="e5Mol" cx={L.cx} cy={L.surf} r={L.srx} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF6CF" /><stop offset="0.5" stopColor="#FFD45A" /><stop offset="1" stopColor="#FF8A2A" /></radialGradient>
        <clipPath id="e5Surf"><ellipse cx={L.cx} cy={L.surf} rx={L.srx} ry={L.sry} /></clipPath>
      </defs>
      <rect x={-4000} y={-2000} width={9000} height={4000} fill="url(#e5Bg)" />
      <rect x={-4000} y={-2000} width={9000} height={4000} fill="url(#e5Glow)" />
      {[-700, 80, 860, 1640, 2420].map((x) => <rect key={x} x={x - 40} y={-600} width={80} height={1600} fill="#1A0B0C" opacity={0.85} />)}
      <rect x={-2000} y={60} width={5000} height={70} fill="#1A0B0C" />
      {children}
      {/* deck */}
      <path d={`M-2500 ${DECK} L${FD.deck.edge} ${DECK} L${FD.deck.edge} ${DECK + 34} L${FD.deck.edge - 40} ${DECK + 34} L${FD.deck.edge - 40} ${FD.floor} L-2500 ${FD.floor} Z`} fill={K} />
      <path d={`M-2500 ${DECK - 90} L${FD.deck.edge - 120} ${DECK - 90}`} stroke={K} strokeWidth={lw * 3} />
      {[-1200, -800, -400, 0, 160].map((x) => <line key={x} x1={x} y1={DECK - 92} x2={x} y2={DECK} stroke={K} strokeWidth={lw * 3} />)}
      {/* ladle: black shell, glowing surface (or the simulator's pad top, revealed from the target outward) */}
      <path d={`M${L.cx - L.rx} ${L.rim} L${L.cx - L.brx} ${L.bot} L${L.cx + L.brx} ${L.bot} L${L.cx + L.rx} ${L.rim} Z`} fill={K} />
      <ellipse cx={L.cx} cy={L.rim} rx={L.rx} ry={L.ry} fill={K} />
      <ellipse cx={L.cx} cy={L.surf} rx={L.srx} ry={L.sry} fill="url(#e5Mol)" />
      {pad > 0 ? (
        <g clipPath="url(#e5Surf)">
          <ellipse cx={TGT_X} cy={L.surf} rx={(L.srx + 60) * pad * 1.25} ry={(L.sry + 12) * pad * 1.25} fill={SCOL.padTop} />
        </g>
      ) : null}
      {Array.from({length: 16}, (_, i) => {
        const life = 2.4 + rnd(i * 3) * 1.4;
        const ph = ((t + rnd(i) * life) % life) / life;
        return <circle key={i} cx={L.cx + (rnd(i * 7) - 0.5) * L.srx * 1.6 + Math.sin(t + i) * 18} cy={L.surf - ph * 560} r={lw * (0.8 + rnd(i * 11))} fill="#FFE08A" opacity={(1 - ph) * 0.9 * (1 - pad)} />;
      })}
      {inside}
      <rect x={-4000} y={FD.floor} width={9000} height={1500} fill={K} />
      {front}
    </Layer>
  );
};

/** Rim-lit silhouette filter: a warm halo offset toward the light, then a black fill. */
const RimDefs: React.FC = () => (
  <defs>
    <filter id="rimSil5" x="-30%" y="-30%" width="160%" height="160%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d" />
      <feOffset in="d" dx="-1.6" dy="-2.2" result="do" />
      <feFlood floodColor="#F2A350" floodOpacity="0.85" result="o" />
      <feComposite in="o" in2="do" operator="in" result="rim" />
      <feFlood floodColor="#120708" result="k" />
      <feComposite in="k" in2="SourceAlpha" operator="in" result="sil" />
      <feMerge><feMergeNode in="rim" /><feMergeNode in="sil" /></feMerge>
    </filter>
  </defs>
);

const ring = (cx: number, r: number, w: number, lw: number, key: string) => <ellipse key={key} cx={cx} cy={SURF} rx={r} ry={r * (L.sry / L.srx)} fill="none" stroke={C.teal} strokeWidth={lw * w} />;
const Card: React.FC<{n?: string; ticks?: number}> = ({n, ticks = 0}) => (
  <g transform="rotate(-6)">
    <rect x={-52} y={-118} width={104} height={124} rx={8} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
    {n ? <text x={0} y={-30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={68} fill={C.ink}>{n}</text>
      : [0, 1, 2].map((i) => <g key={i}><circle cx={-26} cy={-88 + i * 34} r={10} fill={i < ticks ? C.teal : '#D9DEE4'} /><rect x={-8} y={-93 + i * 34} width={44} height={10} rx={5} fill="#D9DEE4" /></g>)}
  </g>
);

// ------------------------------------------------------------------ cameras
const CAM_F_END: Cam = {x: 640, y: 640, z: 0.82};
const CAM_M: Cam = (() => {
  // the silhouette's camera at the light change: the crouched avatar keeps its screen position and size
  const z = CAM_F_END.z / S;
  const a = toScreen(CAM_F_END, AV.j.K0.x, AV.G);
  const bx = FOOT0 - K0_FOOT * S;
  return {x: bx - (a.x - 960) / z, y: DECK - (a.y - 540) / z, z};
})();
const CAM_E2: Cam = {x: 300, y: 470, z: 1.18};
const CAM_E2B: Cam = {x: 560, y: 560, z: 1.22};
const CAM_E3: Cam = {x: 860, y: 600, z: 0.92};
const CAM_E4: Cam = {x: 900, y: 620, z: 0.98};
const silCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_M, CAM_E2, easeInOut(seg(t, RISE0 + 0.2, T_WHEN + 0.6)));
  c = mixCam(c, CAM_E2B, easeInOut(seg(t, T_LEAPS - 0.5, T_LEAPS + 1.2)));
  c = mixCam(c, CAM_E3, easeInOut(seg(t, T_BUT - 0.05, T_PEOPLE - 0.2)));
  c = mixCam(c, CAM_E4, easeInOut(seg(t, J2.tEnd + 0.2, T_STUCK)));
  return c;
};

// crew (feet on the foundry floor, facing the ladle)
const CR = {
  dir: {x: 1170, y: FD.floor, h: 430, flip: true},
  tos: {x: 1420, y: FD.floor, h: 410, flip: true},
  sco: {x: 1680, y: FD.floor, h: 420, flip: true},
};

/** Symbolic stick on the pad: the line-art avatar, not the robot that went in. */
const J3 = (() => {
  const spec = {toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: 0, tPush: 0, tTO: 0, apex: 70 * S, outcome: 'stick' as const, depth: 1, swing: 1, settleArms: [158, 6] as [number, number]};
  const Tf = makeJump5(spec).T;
  const tEnd = T_STUCK - 0.04;
  return makeJump5({...spec, tReady: tEnd - Tf - 0.55, tPush: tEnd - Tf - 0.28, tTO: tEnd - Tf});
})();
// V6: no second (blue) demonstration after the payoff; the cards come up once, on "stuck the landing"
const PAD0 = T_THESE + 0.05;
const BUILD0 = J3.tReady - 0.5;
const T_CARDS = T_STUCK + 0.12;
const T_FLARE = NARR_END + 0.12;

export const End: React.FC = () => {
  const f = useCurrentFrame() + Math.round(END_START * 30);
  const t = f / 30;

  // ============================================ E1a: the aisle goes dark around the avatar
  const LIGHT1 = T_WHY + 0.05, LIGHT2 = T_WHY + 0.3, LIGHT3 = T_WHY + 0.55;
  const SWAP = T_WHY + 0.85;
  if (t < SWAP) {
    const dark = (t > LIGHT1 ? 0.38 : 0) + (t > LIGHT2 ? 0.3 : 0) + (t > LIGHT3 ? 0.32 : 0);
    const sil = smooth(seg(t, LIGHT2, SWAP - 0.05));
    const cam = CAM_F_END;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <Aisle t={t} cam={cam} />
          <rect width={1920} height={1080} fill="#07050A" opacity={Math.min(1, dark)} />
          <Layer cam={cam}>
            {sil < 1 ? <g opacity={1 - sil}><Bot cam={cam} id="eAvS" model="SIM" s={1} pose={avatarPose(t)} /></g> : null}
            {sil > 0 ? <g opacity={sil}><Bot cam={cam} id="eAvK" model="SIL" s={1} pose={avatarPose(t)} /></g> : null}
          </Layer>
        </svg>
      </AbsoluteFill>
    );
  }

  // ============================================ logo (the glow whites out into the channel mark)
  const flare = easeIn(seg(t, T_FLARE, T_FLARE + 0.32));
  const word = easeOut(seg(t, T_FLARE + 0.22, T_FLARE + 0.55));
  const out = seg(t, END_T - 0.22, END_T);

  const cam = smoothCam(silCamRaw, t, 0.16);
  const lw = 4 / cam.z;
  const glowUp = smooth(seg(t, SWAP, SWAP + 0.9));
  const p = silPose(t);
  const ph = silPhase(t);
  const below = ph && ph.phase === 'after';
  const gone = below && ph!.u > 0.62;
  const hlK = (t0: number) => Math.max(0, Math.min(1, seg(t, t0 - 0.05, t0 + 0.2))) * (1 - seg(t, T_LEAPS - 0.4, T_LEAPS));
  const ha = hlK(T_ARMS), hg = hlK(T_LEGS), hh = hlK(T_HEAD);
  const hl = {uaN: {color: C.teal, amount: ha}, faN: {color: C.teal, amount: ha}, uaF: {color: C.teal, amount: ha}, faF: {color: C.teal, amount: ha},
    thN: {color: C.teal, amount: hg}, shinN: {color: C.teal, amount: hg}, thF: {color: C.teal, amount: hg}, shinF: {color: C.teal, amount: hg}, footN: {color: C.teal, amount: hg}, footF: {color: C.teal, amount: hg},
    head: {color: C.teal, amount: hh}};
  // rewind streaks
  const rw = t > RW0 && t < RW1 + 0.1 ? Math.sin(Math.PI * seg(t, RW0, RW1 + 0.1)) : 0;
  // crew actions
  const point = smooth(seg(t, T_PEOPLE + 0.1, T_ENDING + 0.1)) * (1 - smooth(seg(t, T_BUILT + 0.2, T_WROTE + 0.4)));
  const slateUp = smooth(seg(t, T_WROTE + 0.4, T_CLAP - 0.3));
  const TOSS = T_BUILT + 0.12;
  const sw = Math.sin(Math.PI * seg(t, TOSS - 0.35, TOSS + 0.15));
  const raise = smooth(seg(t, T_WROTE + 0.05, T_WROTE + 0.4)) * (1 - smooth(seg(t, T_POLICY + 0.4, T_POLICY + 0.9)));
  const cards = smooth(seg(t, T_CARDS, T_CARDS + 0.25));
  const glowPulse = Math.max(0, 1 - Math.abs(t - T_ENDING - 0.2) / 0.45);
  const tHit = t - J2.tEnd;
  const surfPulse = Math.max(0, 1 - Math.abs(t - J2.tEnd - 0.1) / 0.5);
  const pad = 0;
  const ringK = t < TOSS + 0.5 ? 0 : 1;
  const fly = t > TOSS && t < TOSS + 0.5 ? seg(t, TOSS, TOSS + 0.5) : -1;
  const plan = seg(t, T_POLICY - 0.15, T_POLICY + 0.3) * (1 - seg(t, J2.tEnd, J2.tEnd + 0.4));
  // crew arms
  // the director: points the slate at the ladle, lifts it, claps it (the demonstration starts), raises it at the end
  const mixArm = (a: {a: number; b: number}, b: {a: number; b: number}, k: number) => ({a: lerp(a.a, b.a, k), b: lerp(a.b, b.b, k)});
  let dirArmR = {a: 14, b: 18};
  dirArmR = mixArm(dirArmR, crewReach(CR.dir, 1, TGT_X + 40, SURF - 260), point);
  dirArmR = mixArm(dirArmR, {a: 112, b: 64}, slateUp);
  dirArmR = mixArm(dirArmR, {a: 158, b: 12}, cards);
  const dirArmL = {a: 20, b: 30};
  const tosArm = {a: lerp(lerp(20, 140, sw), 160, cards), b: lerp(lerp(24, -10, sw), 8, cards)};
  const scoArm = {a: lerp(lerp(18, 165, raise), 160, cards), b: lerp(lerp(20, 6, raise), 8, cards)};
  const hDir = crewHand(CR.dir, dirArmR, 1);
  const hTos = crewHand(CR.tos, tosArm, 1);
  const hSco = crewHand(CR.sco, scoArm, 1);
  const crewPose = (arm: {a: number; b: number}, other: {a: number; b: number}, lookY = -0.2) => ({...IDLE, armR: arm, armL: other, lookX: 0.6, lookY, mouth: 'flat' as const});
  const padS = toScreen(cam, TGT_X, SURF);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <RimDefs />
        <g>
          <SilSet cam={cam} t={t} glow={glowUp * (1 + 0.35 * glowPulse + 0.5 * surfPulse)} pad={pad}
            inside={(
              <g>
                {/* the target they built, floating on the surface (on the pad it becomes the pad's own target) */}
                {ringK > 0 ? <g opacity={1}>{ring(TGT_X, 92 * (1 + 0.15 * surfPulse), 4.4, lw, 'a')}{ring(TGT_X, 46, 3.4, lw, 'b')}{pad > 0.5 ? <ellipse cx={TGT_X} cy={SURF} rx={14} ry={14 * (L.sry / L.srx)} fill={C.teal} /> : null}</g> : null}
                {plan > 0 ? <Arc pts={J2.arc()} k={plan} lw={lw} color={C.teal} width={3} opacity={0.9} /> : null}
                {t < J2.tEnd + 1.2 ? <Splash6 x={TGT_X} t={tHit} lw={lw} part="back" scale={1.1} /> : null}
                {!gone ? <Bot cam={cam} id="eSil" model="SIL" s={S} pose={p} hl={hl} clipBelow={below ? SURF + 1 : undefined} /> : null}
                {t < J2.tEnd + 1.2 ? <Splash6 x={TGT_X} t={tHit} lw={lw} part="front" scale={1.1} /> : null}
              </g>
            )}
            front={(
              <g>
                <g filter="url(#rimSil5)">
                  <Crew look={CAST.clerkC} x={CR.dir.x} y={CR.dir.y} h={CR.dir.h} frame={f} seed={14} flip shadow={false} life={0.15} pose={{...crewPose(dirArmR, dirArmL, -0.1)}} />
                  <Crew look={CAST.clerkA} x={CR.tos.x} y={CR.tos.y} h={CR.tos.h} frame={f} seed={3} flip shadow={false} life={0.15} pose={crewPose(tosArm, {a: 14, b: 18})} />
                  <Crew look={CAST.clerkB} x={CR.sco.x} y={CR.sco.y} h={CR.sco.h} frame={f} seed={9} flip shadow={false} life={0.15} pose={crewPose(scoArm, {a: 12, b: 16})} />
                </g>
                {/* props stay in colour: slate, target, score card */}
                <g transform={`translate(${hDir.x} ${hDir.y}) rotate(${lerp(-20, 6, slateUp)})`}><BigClapper x={-40} y={-20} s={0.13} clap={easeIn(seg(t, T_CLAP - 0.14, T_CLAP))} text="DEMO" /></g>
                {t < TOSS ? <g transform={`translate(${hTos.x} ${hTos.y}) scale(0.55)`}><ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={16} /><ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={12} /></g> : null}
                {fly >= 0 ? (
                  <g transform={`translate(${lerp(hTos.x, TGT_X, fly)} ${lerp(hTos.y, SURF, fly) - Math.sin(Math.PI * fly) * 220}) scale(${lerp(0.55, 1, fly)})`}>
                    <ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={lw * 4} />
                    <ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={lw * 3} />
                  </g>
                ) : null}
                {cards > 0 ? <g transform={`translate(${hTos.x} ${hTos.y}) scale(${0.85 * cards})`}><Card n="10" /></g> : null}
                <g transform={`translate(${hSco.x} ${hSco.y})`}>{cards > 0.5 ? <Card n="10" /> : <Card ticks={t > T_WROTE + 0.5 ? 3 : t > T_WROTE + 0.35 ? 2 : t > T_WROTE + 0.2 ? 1 : 0} />}</g>
              </g>
            )} />
        </g>
        {glowUp < 1 ? (
          <g>
            <rect width={1920} height={1080} fill="#07050A" opacity={1 - glowUp} />
            <Layer cam={cam}><Bot cam={cam} id="eSilTop" model="SIL" s={S} pose={p} /></Layer>
          </g>
        ) : null}
        {/* rewind streaks */}
        {rw > 0 ? (
          <g opacity={rw}>
            {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={120 + i * 110 + (rnd(i * 3 + Math.floor(t * 30)) - 0.5) * 30} x2={1920} y2={120 + i * 110} stroke="#FFE2B0" strokeWidth={3 + 3 * rnd(i)} opacity={0.35} />)}
            <g transform="translate(96 96)">
              <path d="M0 0 L-34 22 L0 44 Z M38 0 L4 22 L38 44 Z" fill="#FFE2B0" />
            </g>
          </g>
        ) : null}
      </svg>
      {flare > 0 ? (
        <AbsoluteFill style={{background: C.paper, clipPath: `circle(${lerp(30, 2300, flare)}px at ${padS.x}px ${padS.y}px)`}}>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 150, color: C.ink, letterSpacing: '-0.01em', transform: `scale(${lerp(0.9, 1, word)})`, opacity: word}}>
              FUTURE <span style={{color: C.coral}}>GOT</span> WEIRD
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {out > 0 ? <AbsoluteFill style={{background: '#000', opacity: out}} /> : null}
    </AbsoluteFill>
  );
};
void T_SHAPE;
/** Event times for the sound cue sheet. */
export const END_EV = {silPose, WALK, LIGHTS: [T_WHY + 0.05, T_WHY + 0.3, T_WHY + 0.55], J1, RW0, RW1, T_CLAP, J2, J3, T_CARDS, T_FLARE, TOSS: T_BUILT + 0.12, PAD0, BUILD0};
