// V5 OPTIONS ("So what do you do…" → "…said yes"). One idea per beat, each with a visible consequence:
//   SELL   a FOR SALE tag; the crate builds itself around the robot; close on the knee, the custom actuator in a lens
//          beside the joint; the crate is shoved toward the exit and the shutter slams before it gets there (lock)
//   APART  the crate falls away; the technician unbolts the knee and pulls the actuator out; push into its rotor →
//          matched cut to the engineering clock (hands racing) above the queue; the next model's launch flag slides away
//   MELT   push into the clock face: it heats into the ladle seen from above; scrap drops in; cut on the splash to the
//          side view: a robot walks to the edge on its own, a battery window opens in its torso
//   WHERE  pull back out of that doorway: the U.S. shutter slams, Mexico slams, the Imatra door opens (one tracking beat)
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, crewReach, crewHand} from '../../v4/kit/scene';
import {BayBack, BCOL} from '../../v4/sets/bay';
import {FoundryView5, FD} from '../sets/foundry5';
import {FCOL} from '../../v4/sets/foundry';
import {Splash6} from '../sets/splash6';
import {Crate, ActuatorArt, Lens, BatteryArt, Facade, Mark, WallClock, Lock, Scrap} from '../../v4/sets/props';
import {rig, RPose, Rig} from '../../v4/rig/Robot2D';
import {stand, walk, blend, A, ANK} from '../../v4/rig/poses';
import {walkStop, leadFootX} from '../rig/stop';
import {ms} from '../../v4/rig/geom';
import {smoothCam, creep} from '../kit/cam5';
import {FACTORY_END, CrateWipe} from './Factory';
import {S_HK} from './Hook';
import {IMATRA_START, ImatraWorld, CAM_IM0} from './Imatra';
import {CAST} from '../../components/cast';
import {IDLE, Pose as CPose} from '../../components/Character';
import {HangTag, Wrench} from '../../components/Props';
import {C, F} from '../../theme';

const G = 1000;
export const OPTIONS_END = IMATRA_START;
const T0 = FACTORY_END;
const T_SELL = T('Sell it');
const T_PACK = T('packed with');
const T_ACT = T('like the actuators');
const T_DIDNT = T('and it didn’t want');
const T_BLDG = T('the building');
const T_APART = T('Take them apart') - 0.06;
const T_FSAYS = T('Figure says doing');
const T_EVERY = T('for every robot');
const T_EAT = T('would eat');
const T_DELAY = T('delay the next');
const T_MELT = T('Melt them') - 0.06;
const T_SIMPLE = T('Simple');
const T_EXCEPT = T('Except a robot');
const T_ONOWN = T('on its own');
const T_BRINGS = T('brings its battery');
const T_WHERE = T('Figure says foundries') - 0.05;
const T_US = T('U.S.');
const T_MEX = T('Mexico');
const T_ONE = T('One in Imatra');
const T_YES = T('said yes');

// ------------------------------------------------------------------ the back room (V6)
// The wipe clears onto action: the crate assembles around the stopped robot while the technician walks in with a
// FOR SALE sign; on "Sell it?" he hangs it on the crate's post (owner: hand → crate); on "didn't want" he flips it to
// NOT FOR SALE; on "leaving the building" he shoves the crate and the exit shutter slams. For APART the crate falls
// away, the wrench works the knee bolt and drops into a toolbox, and the actuator comes out of the socket in his hand.
const RX0 = 0;                       // robot / crate centre before the shove
const T_LEAV = T('leaving the building');
const PUSH0 = T_LEAV - 0.32, PUSH1 = PUSH0 + 0.75;
const RX1 = 230;                     // where the crate stops (the shutter came down first)
const crateX = (t: number) => lerp(RX0, RX1, easeOut(seg(t, PUSH0, PUSH1))) - 10 * Math.sin(Math.PI * seg(t, PUSH1, PUSH1 + 0.2));
const CW = 600, CH = 740;
const DOOR = {x0: 640, x1: 1020, y0: 430};
const SHUT_T0 = PUSH0 + 0.35, SHUT_T1 = SHUT_T0 + 0.28;
const ASM0 = FACTORY_END + 0.35;     // crate panels arrive right after the wipe
const T_FLIP = T_DIDNT - 0.05;
const offPose = (x: number, o: Partial<RPose> = {}): RPose => stand(x, G - 30, 1, {yaw: 0.35, armN: A(1, 4, {grip: 0.2}), armF: A(1, 4, {grip: 0.2}), head: 12, neck: 4, ...o});
const KNEE0 = rig(offPose(0), 1).pts.kneeN;
// technician (clerk A) positions and steps (cutout cast: a short step = slide with a two-beat bob)
const step = (x0: number, x1: number, t0: number, t1: number, t: number) => {
  const u = seg(t, t0, t1);
  return {x: lerp(x0, x1, smooth(u)), bob: u > 0 && u < 1 ? -Math.abs(Math.sin(u * Math.PI * 2)) * 10 : 0};
};
const camRoomRaw = (t: number): Cam => {
  const cA: Cam = {x: 60, y: 650, z: 1.12};
  const cKnee: Cam = {x: KNEE0[0] + 260, y: KNEE0[1] - 60, z: 2.35};
  const cWide: Cam = {x: 300, y: 640, z: 0.98};
  const cApart: Cam = {x: RX1 - 40, y: 640, z: 1.45};
  let c = creep(cA, t, FACTORY_END, T_PACK - 0.4, 0.04, 30, -10);
  c = mixCam(c, cKnee, easeInOut(seg(t, T_PACK - 0.4, T_PACK + 0.7)));
  c = mixCam(c, cWide, easeInOut(seg(t, T_DIDNT - 0.6, T_DIDNT - 0.05)));
  c = mixCam(c, cApart, easeInOut(seg(t, T_APART - 0.1, T_APART + 0.6)));
  return c;
};
// the actuator coming out of the knee
const POP = T_FSAYS - 0.15;          // knee cover twisted off by hand
const PULL0 = POP + 0.25, PULL1 = PULL0 + 0.45;
const SHOW = PULL1 + 0.1;            // held up to look at
const CUT_CLOCK = T_EVERY + 0.35;    // matched cut: rotor → clock
const ROTOR_SCREEN = {x: 960, y: 540, r: 300}; // where the rotor sits on screen at the cut (= clock face)

/** Technician arm and held object for the APART beat. */
const techAt = (t: number) => {
  const pos = step(-545, RX1 - 330, T_APART + 0.15, T_APART + 0.7, t);
  const ch = {x: pos.x, y: G, h: 560};
  const knee = {x: KNEE0[0] + RX1 + 10, y: KNEE0[1]};
  const idle = {a: 12, b: 16};
  const toArm = (p: {x: number; y: number}) => crewReach(ch, 1, p.x, p.y);
  const mixA = (a: {a: number; b: number}, b: {a: number; b: number}, k: number) => ({a: lerp(a.a, b.a, k), b: lerp(a.b, b.b, k)});
  // hand on the knee cover, a quarter-turn twist (the cover pops at POP), then the actuator comes out in the hand
  const twist = smooth(seg(t, T_APART + 0.9, POP)) * (1 - smooth(seg(t, POP, POP + 0.12)));
  const atKnee = toArm({x: knee.x - 6 + 6 * twist, y: knee.y + 4 - 8 * twist});
  const show = toArm({x: ch.x + 170, y: G - 470});
  let arm = mixA(idle, atKnee, smooth(seg(t, T_APART + 0.45, T_APART + 0.9)));
  arm = mixA(arm, show, smooth(seg(t, PULL0, SHOW)));
  return {ch, bob: pos.bob, arm, hand: crewHand(ch, arm, 1), holding: t >= PULL0};
};

/** The sale sign: FOR SALE on the front, NOT FOR SALE on the back (flip = 0 → 1 turns it about its strings). It
 * hangs centred under its hook on two strings; the board is 230 × 104 with its top 50 below the hook. */
const SIGN = {w: 230, h: 104, drop: 50};
const SaleSign: React.FC<{x: number; y: number; flip: number; swing: number; lw: number; drop?: number}> = ({x, y, flip, swing, lw, drop = SIGN.drop}) => {
  const sx = Math.cos(Math.PI * flip);
  const back = flip >= 0.5;
  const hw = SIGN.w / 2;
  const k = Math.max(0.04, Math.abs(sx));
  return (
    <g transform={`translate(${x} ${y}) rotate(${swing})`}>
      <path d={`M${-hw * 0.8 * k} ${drop + 4} L0 0 L${hw * 0.8 * k} ${drop + 4}`} fill="none" stroke={C.ink} strokeWidth={lw * 1.1} strokeLinejoin="round" />
      <circle r={6} fill={C.ink} />
      <g transform={`translate(0 ${drop}) scale(${k} 1)`}>
        <rect x={-hw} y={0} width={SIGN.w} height={SIGN.h} rx={8} fill={back ? C.paper : '#E8C98E'} stroke={C.ink} strokeWidth={lw * 1.3} />
        {back ? (
          <g>
            <text x={0} y={42} textAnchor="middle" fontFamily={F.display} fontWeight={800} fontSize={38} fill={C.coralDeep}>NOT</text>
            <text x={0} y={86} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={34} fill={C.ink}>FOR SALE</text>
          </g>
        ) : <text x={0} y={66} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.ink}>FOR SALE</text>}
      </g>
    </g>
  );
};

const Room: React.FC<{t: number; f: number; cam: Cam}> = ({t, f, cam}) => {
  const lw = 4 / cam.z;
  const cx = crateX(t);
  // crate assembly (right after the wipe) and fall-away (APART)
  const asm = (o: number) => seg(t, ASM0 + o, ASM0 + 0.4 + o) * (1 - easeIn(seg(t, T_APART + 0.02 + o * 0.5, T_APART + 0.42 + o * 0.5)));
  const parts = {pallet: 1, back: asm(0), left: asm(0.12), right: asm(0.24), top: asm(0.36)};
  const pr = offPose(cx);
  // shutter + padlock
  const shut = easeIn(seg(t, SHUT_T0, SHUT_T1));
  const bounce = Math.sin(Math.PI * seg(t, SHUT_T1, SHUT_T1 + 0.18)) * 0.03;
  const lockK = seg(t, T_BLDG + 0.15, T_BLDG + 0.3);
  // the sign's hook on the crate's left post (moves with the crate, flies off with the post)
  const postFly = (1 - backOut(Math.max(0, parts.left), 1.3)) * -900;
  const hook = {x: cx - CW / 2 - 6 + (t > T_SELL ? postFly : 0), y: G - 500};   // on the outside face of the left post
  const sell = t < T_APART;
  let ch = {x: -800, y: G, h: 560};
  let armR = {a: 12, b: 16};
  let bob = 0;
  let hold: React.ReactNode = null;
  let sign: React.ReactNode = null;
  const flip = smooth(seg(t, T_FLIP, T_FLIP + 0.32));
  if (sell) {
    const enter = step(-800, -545, FACTORY_END + 0.15, FACTORY_END + 1.0, t);
    ch = {...ch, x: enter.x};
    bob = enter.bob;
    const hand0 = crewHand(ch, {a: 22, b: 30}, 1);        // carrying the sign low at his side
    // hang it (T_SELL), flip it (T_FLIP), then push the crate (PUSH0)
    const toHook = smooth(seg(t, T_SELL - 0.38, T_SELL));
    const away = smooth(seg(t, T_SELL + 0.1, T_SELL + 0.45));
    const toFlip = smooth(seg(t, T_FLIP - 0.3, T_FLIP)) * (1 - smooth(seg(t, T_FLIP + 0.35, T_FLIP + 0.65)));
    const shove = smooth(seg(t, PUSH0 - 0.25, PUSH0)) * (1 - smooth(seg(t, PUSH0 + 0.3, PUSH0 + 0.65)));
    let target = t < T_SELL ? {x: lerp(hand0.x, hook.x, toHook), y: lerp(hand0.y, hook.y, toHook)} : {x: lerp(hook.x, hand0.x + 20, away), y: lerp(hook.y, hand0.y, away)};
    // the flip: the hand takes the board's near edge (below the strings, beside the text) and follows it round
    const signEdge = {x: hook.x - (SIGN.w / 2) * Math.max(0.12, Math.abs(Math.cos(Math.PI * flip))) - 4, y: hook.y + SIGN.drop + SIGN.h / 2};
    target = {x: lerp(target.x, signEdge.x, toFlip), y: lerp(target.y, signEdge.y, toFlip)};
    // the shove goes in at hip height on the post, under the hung board
    target = {x: lerp(target.x, cx - CW / 2 - 8, shove), y: lerp(target.y, G - 215, shove)};
    armR = crewReach(ch, 1, target.x, target.y);
    const swing = Math.sin((t - T_SELL) * 7) * 9 * Math.exp(-Math.max(0, t - T_SELL) * 2.2) * (t > T_SELL ? 1 : 0)
      + Math.sin((t - T_FLIP - 0.3) * 8) * 6 * Math.exp(-Math.max(0, t - T_FLIP - 0.3) * 2.5) * (t > T_FLIP + 0.3 ? 1 : 0)
      + Math.sin((t - PUSH1) * 9) * 8 * Math.exp(-Math.max(0, t - PUSH1) * 3) * (t > PUSH1 ? 1 : 0);
    if (t < T_SELL) {
      const h = crewHand(ch, armR, 1);
      sign = <SaleSign x={h.x} y={h.y} flip={0} swing={-3} lw={lw} drop={34} />;
    } else sign = <SaleSign x={hook.x} y={hook.y} flip={flip} swing={swing} lw={lw} drop={lerp(34, SIGN.drop, smooth(seg(t, T_SELL, T_SELL + 0.25)))} />;
  } else {
    const tc = techAt(t);
    ch = tc.ch; armR = tc.arm; bob = tc.bob;
    // the sign flies off with the crate's left post
    if (parts.left > 0.01) sign = <SaleSign x={hook.x} y={hook.y} flip={1} swing={0} lw={lw} />;
  }
  const pose: CPose = {...IDLE, armR, armL: {a: 12, b: 16}, bob, lookX: sell && t > T_FLIP - 0.4 && t < T_FLIP + 0.6 ? 0.5 : 0.75, lookY: sell ? (t < T_SELL ? -0.25 : 0.05) : t > SHOW ? -0.1 : 0.55,
    mouth: sell ? (t < T_SELL ? 'hmm' : t > T_FLIP ? (t > SHUT_T1 ? 'o' : 'flat') : 'smile') : t > SHOW ? 'grin' : 'flat', brows: t > SHUT_T1 && sell ? 0.7 : 0.1, tilt: t < T_SELL ? -6 : 0};
  // knee: cover pops off and flies, the socket stays dark (teal ring)
  const popped = !sell && t >= POP;
  const coverFly = popped ? seg(t, POP, POP + 0.6) : 0;
  const kneeW = rig(pr, 1).pts.kneeN;
  const tc = !sell ? techAt(t) : null;
  return (
    <Layer cam={cam}>
      <BayBack lw={lw} dim={0.06} />
      {/* exit with roll-up shutter */}
      <g>
        <rect x={DOOR.x0} y={DOOR.y0} width={DOOR.x1 - DOOR.x0} height={G - DOOR.y0} fill="#BFD6EA" stroke={C.ink} strokeWidth={lw} />
        <rect x={DOOR.x0 + 20} y={DOOR.y0 + 60} width={DOOR.x1 - DOOR.x0 - 40} height={G - DOOR.y0 - 60} fill="#DDE9F3" />
        <g transform={`translate(0 ${-bounce * (G - DOOR.y0)})`}>
          <rect x={DOOR.x0} y={DOOR.y0} width={DOOR.x1 - DOOR.x0} height={(G - DOOR.y0) * (0.12 + 0.88 * shut)} fill="#9AA4AE" stroke={C.ink} strokeWidth={lw} />
          {Array.from({length: Math.floor(((G - DOOR.y0) * (0.12 + 0.88 * shut)) / 34)}, (_, i) => <line key={i} x1={DOOR.x0} y1={DOOR.y0 + 34 * (i + 1)} x2={DOOR.x1} y2={DOOR.y0 + 34 * (i + 1)} stroke="#6E7882" strokeWidth={lw * 0.6} />)}
        </g>
        <rect x={(DOOR.x0 + DOOR.x1) / 2 - 70} y={DOOR.y0 - 80} width={140} height={60} rx={8} fill="#2F8F5B" stroke={C.ink} strokeWidth={lw} />
        <text x={(DOOR.x0 + DOOR.x1) / 2} y={DOOR.y0 - 37} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={40} fill="#FFFFFF">EXIT</text>
        {lockK > 0 ? <Lock x={DOOR.x1 - 70} y={G - 60} s={0.9} open={1 - lockK} lw={lw} /> : null}
      </g>
      <Crate x={cx} y={G} w={CW} h={CH} lw={lw} parts={parts}
        front={<Bot cam={cam} id="opR" model="F02" s={1} pose={pr} off={1}
          after={popped ? {legN: (r: Rig) => <g><circle cx={r.pts.kneeN[0]} cy={r.pts.kneeN[1]} r={20} fill="#0B0F12" stroke={C.ink} strokeWidth={lw} /><circle cx={r.pts.kneeN[0]} cy={r.pts.kneeN[1]} r={20} fill="none" stroke={C.teal} strokeWidth={lw * 1.3} /></g>} : {}} />} />
      {coverFly > 0 && coverFly < 1 ? <circle cx={kneeW[0] - 160 * coverFly} cy={kneeW[1] - Math.sin(Math.PI * coverFly) * 120 + 140 * coverFly * coverFly} r={18} fill="#2B3036" stroke={C.ink} strokeWidth={lw} /> : null}
      {sign}
      <Crew look={CAST.clerkA} x={ch.x} y={ch.y} h={ch.h} frame={f} seed={3} front="R" holdR={hold} pose={pose} life={0.5} />
      {/* the actuator: in the socket until the hand takes it at PULL0, then carried up in the hand */}
      {tc && tc.holding ? <g transform={`translate(${tc.hand.x} ${tc.hand.y})`}><ActuatorArt r={30} rot={(t - PULL0) * 120} lw={lw} id="actH6" /></g> : null}
    </Layer>
  );
};

// ------------------------------------------------------------------ engineering time: clock over the queue
const CLK = {x: 0, y: 300, r: 220};
const clockCamAtCut: Cam = {x: CLK.x, y: CLK.y, z: ROTOR_SCREEN.r / CLK.r};
const CLOCK_WIDE: Cam = {x: 40, y: 520, z: 0.8};
// V6: clerk B works through three different steps on the bench robot; each step takes the clock one hour, swept
// smoothly while she works (time passes because of the work, not a free-spinning dial)
const C0W = CUT_CLOCK + 0.15;
const STEPS = [[C0W, C0W + 1.1], [C0W + 1.1, C0W + 2.05], [C0W + 2.05, C0W + 2.95]];
const clockAngle = (t: number) => STEPS.reduce((a, [s0, s1]) => a + 360 * easeInOut(seg(t, s0, s1)), 0);
const P_BOLT = {x: 150, y: G - 345}, P_PART = {x: 108, y: G - 352}, P_LIFT = {x: 150, y: G - 470}, P_PILE = {x: 30, y: G - 360};
const P_WR_REST = {x: 168, y: G - 334};
const clerkB = {x: 270, y: G, h: 520, flip: true};
/** clerk B's hand target and what she holds at time t. */
const workAt = (t: number) => {
  const [a0, a1] = STEPS[0], [b0, b1] = STEPS[1], [c0, c1] = STEPS[2];
  const rest = {x: clerkB.x - 90, y: G - 300};
  let p = rest;
  let wrench: 'hand' | 'bench' = 'hand', part: 'bench' | 'hand' | 'pile' = 'bench';
  if (t < a0) p = {x: lerp(rest.x, P_BOLT.x, smooth(seg(t, a0 - 0.35, a0))), y: lerp(rest.y, P_BOLT.y, smooth(seg(t, a0 - 0.35, a0)))};
  else if (t < a1) {
    // two ratchet strokes about the bolt, then the wrench is laid on the bench
    const u = seg(t, a0, a1 - 0.25);
    const th = (200 + 22 * Math.sin(Math.PI * 2 * u)) * Math.PI / 180;
    p = t < a1 - 0.25 ? {x: P_BOLT.x + 40 * Math.cos(th) + 40, y: P_BOLT.y + 40 * Math.sin(th) + 14} : {x: lerp(P_BOLT.x + 2, P_WR_REST.x, smooth(seg(t, a1 - 0.25, a1))), y: lerp(P_BOLT.y + 0, P_WR_REST.y, smooth(seg(t, a1 - 0.25, a1)))};
  } else if (t < b1) {
    wrench = 'bench';
    const g = smooth(seg(t, b0, b0 + 0.35)), l = smooth(seg(t, b0 + 0.45, b1));
    p = {x: lerp(lerp(P_WR_REST.x, P_PART.x, g), P_LIFT.x, l), y: lerp(lerp(P_WR_REST.y, P_PART.y, g), P_LIFT.y, l)};
    part = t > b0 + 0.4 ? 'hand' : 'bench';
  } else if (t < c1) {
    wrench = 'bench';
    const m = smooth(seg(t, c0, c1 - 0.2));
    p = {x: lerp(P_LIFT.x, P_PILE.x, m), y: lerp(P_LIFT.y, P_PILE.y, m) - Math.sin(Math.PI * m) * 30};
    part = t < c1 - 0.15 ? 'hand' : 'pile';
  } else {
    wrench = 'bench'; part = 'pile';
    p = {x: lerp(P_PILE.x, rest.x, smooth(seg(t, c1, c1 + 0.4))), y: lerp(P_PILE.y, rest.y, smooth(seg(t, c1, c1 + 0.4)))};
  }
  return {p, wrench, part};
};
const T_TOP = T_MELT + 0.55; // the clock face has become the ladle seen from above
const T_DROP0 = T_TOP + 0.02, T_DROPHIT = T_TOP + 0.37;      // scrap falls into the top view ("Simple.")
const T_TILT0 = T_TOP + 0.42, T_TILT1 = T_TILT0 + 0.55;      // the top view tilts into the side view
const Clockroom: React.FC<{t: number; f: number; cam: Cam; heat: number}> = ({t, f, cam, heat}) => {
  const lw = 4 / cam.z;
  const a = clockAngle(t);
  const flag = easeInOut(seg(t, T_DELAY - 0.3, T_DELAY + 0.9));
  const bp = {x: 760, y: 300};
  return (
    <Layer cam={cam}>
      <BayBack lw={lw} dim={0.08} />
      {/* the queue: every retired robot waits for the same teardown */}
      <rect x={-1900} y={G - 50} width={1700} height={50} fill={BCOL.belt} stroke={C.ink} strokeWidth={lw} />
      {Array.from({length: 9}, (_, i) => {
        const x = -360 - i * 170;
        return <Bot key={i} cam={cam} id={'cq' + i} model="F02" s={0.7} pose={stand(x, G - 50, 0.7, {yaw: 0.5, head: 8 + 3 * Math.sin(i * 1.3), armN: A(1, 5), armF: A(1, 5)})} off={1} />;
      })}
      {/* bench with the opened robot and a technician */}
      <rect x={-200} y={G - 330} width={380} height={24} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={lw} />
      {[-180, 150].map((x) => <rect key={x} x={x} y={G - 306} width={20} height={306} fill={BCOL.beamD} stroke={C.ink} strokeWidth={lw} />)}
      {[[-120, 0], [-40, 3]].map(([x, k]) => <Scrap key={x} x={x} y={G - 352} kind={k} lw={lw} />)}
      {(() => {
        const w = workAt(t);
        const armR = crewReach(clerkB, 1, w.p.x, w.p.y);
        const hand = crewHand(clerkB, armR, 1);
        const looking = smooth(seg(t, STEPS[2][1], STEPS[2][1] + 0.5));
        const partAt = w.part === 'bench' ? P_PART : w.part === 'hand' ? {x: hand.x, y: hand.y + 6} : P_PILE;
        return (
          <g>
            {w.part !== 'hand' ? <Scrap x={partAt.x} y={partAt.y} kind={1} lw={lw} /> : null}
            {w.wrench === 'bench' ? <g transform={`translate(${P_WR_REST.x} ${P_WR_REST.y}) rotate(-96) scale(0.55)`}><Wrench x={0} y={0} s={0.9} rot={0} /></g> : null}
            <Crew look={CAST.clerkB} x={clerkB.x} y={clerkB.y} h={clerkB.h} flip frame={f} seed={9} life={0.5}
              pose={{...IDLE, armR, armL: {a: 40, b: 40}, lookX: lerp(-0.6, -0.3, looking), lookY: lerp(0.6, -0.8, looking), mouth: looking > 0.5 ? 'o' : 'flat', brows: 0.5 * looking}}
              holdR={w.wrench === 'hand' ? <g transform="scale(0.7)"><Wrench x={0} y={0} s={0.9} rot={-30} /></g> : undefined} />
            {w.part === 'hand' ? <Scrap x={partAt.x} y={partAt.y} kind={1} lw={lw} /> : null}
          </g>
        );
      })()}
      {/* next model: blueprint with a launch flag on a timeline */}
      <g>
        <rect x={bp.x - 190} y={bp.y - 150} width={380} height={260} rx={10} fill="#3A5FA0" stroke={C.ink} strokeWidth={lw} />
        {Array.from({length: 5}, (_, i) => <line key={i} x1={bp.x - 190} y1={bp.y - 150 + 52 * (i + 1)} x2={bp.x + 190} y2={bp.y - 150 + 52 * (i + 1)} stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={lw * 0.6} />)}
        <path d={`M${bp.x - 30} ${bp.y - 110} q30 -14 60 0 l6 70 q-36 14 -72 0 Z M${bp.x - 40} ${bp.y - 36} l80 0 l-8 110 l-64 0 Z`} fill="none" stroke="#FFFFFF" strokeWidth={lw * 1.2} strokeLinejoin="round" />
        <text x={bp.x} y={bp.y + 150} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>NEXT MODEL</text>
        {/* the release timeline sits under the label; its flag (pole 64) stays clear of the text */}
        <line x1={bp.x - 220} y1={bp.y + 250} x2={bp.x + 520} y2={bp.y + 250} stroke={C.ink} strokeWidth={lw * 1.4} />
        {Array.from({length: 8}, (_, i) => <line key={'tk' + i} x1={bp.x - 220 + i * 105} y1={bp.y + 240} x2={bp.x - 220 + i * 105} y2={bp.y + 260} stroke={C.ink} strokeWidth={lw} />)}
        <g transform={`translate(${bp.x + lerp(60, 470, flag)} ${bp.y + 250})`}>
          <line x1={0} y1={0} x2={0} y2={-64} stroke={C.ink} strokeWidth={lw * 1.4} />
          <path d="M0 -64 L50 -50 L0 -36 Z" fill={C.coral} stroke={C.ink} strokeWidth={lw} strokeLinejoin="round" />
        </g>
      </g>
      {/* the clock (its face heats into molten steel for MELT, drawn by the caller) */}
      <WallClock x={CLK.x} y={CLK.y} r={CLK.r} lw={lw * 1.4} a={a} />
      {void heat}
    </Layer>
  );
};
/** Top view of the ladle growing out of the clock face: rim = clock rim, face → molten surface with crust. */
const TopLadle: React.FC<{x: number; y: number; r: number; k: number; t: number; lw: number; drop?: number}> = ({x, y, r, k, t, lw, drop = -1}) => (
  <g opacity={Math.min(1, k * 1.6)}>
    <defs>
      <radialGradient id="topMolten" cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={FCOL.m0} /><stop offset="0.4" stopColor={FCOL.m1} /><stop offset="0.8" stopColor={FCOL.m2} /><stop offset="1" stopColor={FCOL.m3} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 1.0} fill={FCOL.brick} stroke={C.ink} strokeWidth={lw * 1.4} />
    <circle cx={x} cy={y} r={r * 0.88} fill="url(#topMolten)" stroke={C.ink} strokeWidth={lw} />
    {Array.from({length: 6}, (_, i) => {
      const a = i * 1.1 + t * 0.15, rr = r * (0.25 + 0.1 * (i % 3));
      return <ellipse key={i} cx={x + Math.cos(a) * rr} cy={y + Math.sin(a) * rr} rx={r * 0.12} ry={r * 0.08} fill={FCOL.crust} opacity={0.75 * k} stroke={FCOL.crustHot} strokeWidth={lw * 0.6} />;
    })}
    {drop >= 0 ? Array.from({length: 3}, (_, i) => {
      const u = drop - i * 0.12;
      if (u <= 0 || u > 1) return null;
      return <circle key={'dr' + i} cx={x + 20} cy={y + 10} r={r * (0.1 + 0.7 * u)} fill="none" stroke="#FFF7CF" strokeWidth={lw * 2} opacity={1 - u} />;
    }) : null}
  </g>
);

// ------------------------------------------------------------------ battery at the edge (side view)
const FS = S_HK;
const EDGE_X = 250;
const W0 = T_EXCEPT - 0.25, W1 = T_ONOWN + 0.35;
const EDGE_N = 3, EDGE_X0 = -40;
const EDGE_LEAD = leadFootX(EDGE_X0, FS, EDGE_N);                 // far foot (odd stride count) planted at the end
const EDGE_READY = stand(EDGE_LEAD + 10, FD.deck.top, FS, {yaw: 0.75, armN: A(4, 12), armF: A(-4, 14),
  footF: {x: EDGE_LEAD, y: FD.deck.top - ANK * FS, pitch: 0}, footN: {x: EDGE_LEAD + 20, y: FD.deck.top - ANK * FS, pitch: 0}});
const EDGE_WALK = {x0: EDGE_X0, ground: FD.deck.top, s: FS, n: EDGE_N, o: {yaw: 0.75}, t0: W0, t1: W1 - 0.25, ready: EDGE_READY};
const edgePose = (t: number): RPose => walkStop(EDGE_WALK, t);
const batteryWindow = (k: number, glow: number, lw: number) => (r: Rig) => {
  if (k <= 0) return null;
  const yaw = r.yaw;
  const cx = lerp(0, 24, yaw), cy = -82;
  const w = lerp(88, 64, yaw) * easeOut(k), h = 100 * easeOut(k);
  return (
    <g transform={ms(r.M.torso)}>
      <defs><clipPath id="battWin5"><rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} /></clipPath></defs>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} fill="#1A1F24" />
      <g clipPath="url(#battWin5)"><g transform={`translate(${cx} ${cy}) scale(${w / 90} ${h / 90})`}><BatteryArt w={84} h={84} lw={lw} glow={glow} /></g></g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} fill="none" stroke={C.saffron} strokeWidth={lw * 1.6} />
    </g>
  );
};
const CAM_SPLASH: Cam = {x: FD.ladle.cx, y: 760, z: 1.6};
const CAM_BATT: Cam = {x: 300, y: 380, z: 2.0};
const battCamRaw = (t: number): Cam => {
  const c = mixCam(CAM_SPLASH, CAM_BATT, easeInOut(seg(t, T_EXCEPT - 0.2, T_ONOWN + 0.2)));
  if (t < W0 - 0.1) return c;
  // V6: tilt up with the robot as it walks onto the platform, so its head never leaves the top of the frame
  const head = rig(edgePose(t), FS).pts.head;
  const top = 540 + (head[1] - 64 * FS - c.y) * c.z;
  const onScreen = smooth((960 + (head[0] - c.x) * c.z + 480) / 380);   // ramps in as the robot reaches the frame edge
  return top < 70 ? {...c, y: c.y - ((70 - top) / c.z) * onScreen} : c;
};
const battCam = (t: number) => smoothCam(battCamRaw, t, 0.2);
const Edge: React.FC<{t: number; cam: Cam; id: string}> = ({t, cam, id}) => {
  const p = edgePose(t);
  const k = seg(t, T_BRINGS - 0.25, T_BRINGS + 0.2);
  const glow = t > T_BRINGS + 0.4 ? 0.5 + 0.5 * Math.sin((t - T_BRINGS) * 9) : 0;
  const tHit = t - T_DROPHIT;
  const sx = FD.ladle.cx - 20;
  return (
    <FoundryView5 cam={cam} t={t} hit={{x: sx, t: tHit}} hook={false} id={id}
      inside={<Splash6 x={sx} t={tHit} lw={4 / cam.z} part="front" scale={0.6} />}
      behind={t > W0 - 0.1 ? <Bot cam={cam} id={id + 'r'} model="F02" s={FS} pose={p} after={{torso: batteryWindow(k, glow, 4 / (cam.z * FS))}} /> : null} />
  );
};

// ------------------------------------------------------------------ the street
const FAC = [{x: 0, label: 'U.S.'}, {x: 1300, label: 'MEXICO'}, {x: 2600, label: 'IMATRA, FINLAND'}];
const FW = 860, FH = 760, FY = G;
// the doorway of the U.S. facade, in street-world coordinates (matches Facade's door: 56 % × 56 %)
const DW = FW * 0.56, DH = FH * 0.56;
const doorRect = (fx: number) => ({x0: fx - DW / 2, y0: FY - DH, x1: fx + DW / 2, y1: FY});
const camIntoDoor = (fx: number): Cam => {
  const d = doorRect(fx);
  return {x: (d.x0 + d.x1) / 2, y: (d.y0 + d.y1) / 2, z: Math.max(1920 / (d.x1 - d.x0), 1080 / (d.y1 - d.y0))};
};
const streetCamRaw = (t: number): Cam => {
  let c = camIntoDoor(FAC[0].x);
  c = mixCam(c, {x: 620, y: 560, z: 0.78}, easeInOut(seg(t, T_WHERE + 0.1, T_US + 0.55)));
  c = mixCam(c, {x: 2150, y: 560, z: 0.82}, easeInOut(seg(t, T_MEX + 0.45, T_ONE + 0.6)));
  c = mixCam(c, {x: 2600, y: 640, z: 1.08}, easeInOut(seg(t, T_YES - 0.6, T_YES + 0.3)));
  // through the Imatra doorway: it fills the frame exactly at the cut
  c = mixCam(c, camIntoDoor(FAC[2].x), easeIn(seg(t, T_YES + 0.25, OPTIONS_END)));
  return c;
};
const Street: React.FC<{t: number; f: number}> = ({t, f}) => {
  const cam = t < T_WHERE + 0.12 || t > T_YES + 0.2 ? streetCamRaw(t) : smoothCam(streetCamRaw, t, 0.18);
  const lw = 4 / cam.z;
  const shutUS = 1;   // V6: it came down over the previous shot
  const shutMX = easeIn(seg(t, T_MEX - 0.15, T_MEX + 0.15));
  const openIM = easeOut(seg(t, T_YES - 0.35, T_YES + 0.2));
  // the U.S. doorway shows the battery shot (screen picture mapped into the doorway)
  const d = doorRect(FAC[0].x);
  const s0 = toScreen(cam, d.x0, d.y0), s1 = toScreen(cam, d.x1, d.y1);
  const sc = (s1.x - s0.x) / 1920; // width-fit: 1 at the first frame (the doorway spans the frame), the world fills above/below
  // crew pushing the crated robot along the street (crate on a hand truck), one stop per door
  const crateX = t < T_MEX - 0.4 ? lerp(-760, 520, easeInOut(seg(t, T_WHERE + 0.15, T_US + 0.35))) : t < T_YES - 0.6 ? lerp(520, 1820, easeInOut(seg(t, T_MEX + 0.2, T_ONE + 0.5))) : lerp(1820, 2240, easeInOut(seg(t, T_YES - 0.6, T_YES + 0.5)));
  const legs: [number, number][] = [[T_WHERE + 0.15, T_US + 0.35], [T_MEX + 0.2, T_ONE + 0.5], [T_YES - 0.6, T_YES + 0.5]];
  const pushK = legs.reduce((m, [a0, a1]) => Math.max(m, smooth(seg(t, a0 - 0.2, a0)) * (1 - smooth(seg(t, a1, a1 + 0.25)))), 0);
  const pushing = legs.some(([a0, a1]) => t > a0 && t < a1);
  const cr = {x: crateX - 280, y: G, h: 470};
  const bob = pushing ? -Math.abs(Math.sin(t * 7)) * 8 : 0;
  const onHandle = crewReach(cr, 1, crateX - 155, G - 300);
  const arm = {a: lerp(20, onHandle.a, pushK), b: lerp(28, onHandle.b, pushK)};
  const wheelRot = (crateX / 14) * (180 / Math.PI);
  return (
    <Scene bg="#CFE3F7">
      <Layer cam={cam} p={0.5}>
        <rect x={-3000} y={-2000} width={9000} height={2800} fill="#CFE3F7" />
        {[[-600, 200], [900, 120], [2200, 240], [3300, 160]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={220} ry={50} fill="#FFFFFF" opacity={0.8} />)}
        <rect x={-3000} y={700} width={9000} height={300} fill="#B9C9D6" />
      </Layer>
      <Layer cam={cam}>
        <rect x={-3000} y={FY} width={9000} height={1200} fill="#8E9AA6" />
        <rect x={-3000} y={FY + 60} width={9000} height={14} fill="#F2C14B" />
        {FAC.map((fc, i) => (
          <Facade key={fc.label} x={fc.x} y={FY} w={FW} h={FH} lw={lw} label={fc.label} tint={i === 2 ? '#D9C4A0' : '#C9B79A'}
            shut={i === 0 ? shutUS : i === 1 ? shutMX : 0} glow={i === 2 ? openIM : 0}
            mark={i === 2 ? 'ok' : 'x'} markK={i === 0 ? seg(t, T_US + 0.05, T_US + 0.35) : i === 1 ? seg(t, T_MEX + 0.1, T_MEX + 0.4) : seg(t, T_YES, T_YES + 0.3)} />
        ))}
        <g>
          <rect x={crateX - 150} y={G - 330} width={300} height={300} fill="#D9A35E" stroke={C.ink} strokeWidth={lw} />
          {[1, 2, 3].map((k) => <line key={k} x1={crateX - 150 + k * 75} y1={G - 330} x2={crateX - 150 + k * 75} y2={G - 30} stroke="#8A5A26" strokeWidth={lw * 0.7} />)}
          <rect x={crateX - 160} y={G - 30} width={320} height={16} fill={BCOL.beamD} stroke={C.ink} strokeWidth={lw} />
          {[-110, 110].map((dx) => (
            <g key={dx} transform={`translate(${crateX + dx} ${G - 14}) rotate(${wheelRot})`}>
              <circle r={14} fill="#2B2B33" stroke={C.ink} strokeWidth={lw * 0.6} />
              <line x1={-10} y1={0} x2={10} y2={0} stroke="#8E9AA6" strokeWidth={lw * 0.8} />
              <line x1={0} y1={-10} x2={0} y2={10} stroke="#8E9AA6" strokeWidth={lw * 0.8} />
            </g>
          ))}
        </g>
        <Crew look={CAST.clerkA} x={cr.x} y={cr.y} h={cr.h} frame={f} seed={3} front="R" life={0.5}
          pose={{...IDLE, armR: arm, armL: {a: 30, b: 40}, bob, lean: pushing ? 6 : 0, lookX: 0.7, lookY: 0, mouth: t > T_YES ? 'grin' : t > T_US ? 'frown' : 'flat', brows: t > T_YES ? 0.6 : t > T_US ? -0.2 : 0}} />
      </Layer>
      {/* the Imatra foundry, seen through its open door as we push in */}
      {t > T_YES - 0.4 ? (() => {
        const di = doorRect(FAC[2].x);
        const a0 = toScreen(cam, di.x0, di.y0), a1 = toScreen(cam, di.x1, di.y1);
        const sci = (a1.x - a0.x) / 1920;
        const glow = openIM * (1 - smooth(seg(t, T_YES + 0.3, OPTIONS_END - 0.1)));
        return (
          <g>
            <defs><clipPath id="imDoor"><rect x={a0.x} y={a0.y + (a1.y - a0.y) * (1 - openIM)} width={a1.x - a0.x} height={(a1.y - a0.y) * openIM} /></clipPath></defs>
            <g clipPath="url(#imDoor)">
              {/* V6: the foundry is a space behind the door (it scales less than the facade as we approach), not a
                  shrunken picture; at the cut the door fills the frame and the view is exactly CAM_IM0 */}
              <g transform={`translate(${(a0.x + a1.x) / 2 - 960} ${(a0.y + a1.y) / 2 - 540})`}>
                <ImatraWorld t={t} f={f} cam={{...CAM_IM0, z: CAM_IM0.z * Math.pow(Math.min(1, sci), 0.45)}} />
              </g>
              <rect x={a0.x} y={a0.y} width={a1.x - a0.x} height={a1.y - a0.y} fill="#FFB347" opacity={0.85 * glow} />
            </g>
          </g>
        );
      })() : null}
    </Scene>
  );
};

// ------------------------------------------------------------------ top view → side view (V6)
/** The molten face seen from above tilts into the side view of the same ladle: the circle flattens to the surface
 * ellipse, the rim follows, and the vessel's wall grows underneath, ending exactly on the side-view ladle. */
const TiltToSide: React.FC<{t: number}> = ({t}) => {
  const k = easeInOut(seg(t, T_TILT0, T_TILT1));
  const cam = CAM_SPLASH;
  const z = cam.z, L = FD.ladle;
  const rimS = toScreen(cam, L.cx, L.rim), surfS = toScreen(cam, L.cx, L.surf), botS = toScreen(cam, L.cx, L.bot);
  const R0 = CLK.r * (1160 / CLK.r);
  const rim = {cy: lerp(540, rimS.y, k), rx: lerp(R0, L.rx * z, k), ry: lerp(R0, L.ry * z, k)};
  const mol = {cy: lerp(540, surfS.y, k), rx: lerp(R0 * 0.88, L.srx * z, k), ry: lerp(R0 * 0.88, L.sry * z, k)};
  const bot = {y: lerp(rim.cy, botS.y, k), rx: lerp(rim.rx, L.brx * z, k)};
  const fade = 1 - seg(t, T_TILT1 - 0.08, T_TILT1);
  return (
    <Scene bg="#221A21">
      <Edge t={t} cam={cam} id="tilt" />
      <g opacity={fade}>
        <defs>
          <radialGradient id="tiltMol" cx={960} cy={mol.cy} r={Math.max(mol.rx, 1)} gradientUnits="userSpaceOnUse" gradientTransform={`translate(960 ${mol.cy}) scale(1 ${mol.ry / Math.max(1, mol.rx)}) translate(-960 ${-mol.cy})`}>
            <stop offset="0" stopColor={FCOL.m0} /><stop offset="0.4" stopColor={FCOL.m1} /><stop offset="0.8" stopColor={FCOL.m2} /><stop offset="1" stopColor={FCOL.m3} />
          </radialGradient>
        </defs>
        <path d={`M${960 - rim.rx} ${rim.cy} L${960 - bot.rx} ${bot.y} L${960 + bot.rx} ${bot.y} L${960 + rim.rx} ${rim.cy} Z`} fill="#5B4A47" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={960} cy={rim.cy} rx={rim.rx} ry={rim.ry} fill={FCOL.brick} stroke={C.ink} strokeWidth={6} />
        <ellipse cx={960} cy={mol.cy} rx={mol.rx} ry={mol.ry} fill="url(#tiltMol)" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 6}, (_, i) => {
          const a = i * 1.1 + t * 0.15, rr = 0.25 + 0.1 * (i % 3);
          return <ellipse key={i} cx={960 + Math.cos(a) * mol.rx * rr} cy={mol.cy + Math.sin(a) * mol.ry * rr} rx={mol.rx * 0.13} ry={mol.ry * 0.09} fill={FCOL.crust} opacity={0.75} stroke={FCOL.crustHot} strokeWidth={3} />;
        })}
      </g>
    </Scene>
  );
};
/** The U.S. door's roll-up shutter coming down over the whole frame; when closed it is exactly that door, framed by
 * the street's first camera (slats, colour and line weights match the facade). */
const ShutterOver: React.FC<{k: number}> = ({k}) => {
  const c = camIntoDoor(FAC[0].x), d = doorRect(FAC[0].x);
  const top = toScreen(c, d.x0, d.y0).y, H = (d.y1 - d.y0) * c.z;
  const off = -(1 - k) * H;
  const n = Math.floor((d.y1 - d.y0) / 28);
  return (
    <g transform={`translate(0 ${off})`}>
      <rect x={-20} y={top} width={1960} height={H} fill="#9AA4AE" stroke={C.ink} strokeWidth={4} />
      {Array.from({length: n}, (_, i) => <line key={i} x1={-20} y1={top + 28 * c.z * (i + 1)} x2={1940} y2={top + 28 * c.z * (i + 1)} stroke="#6E7882" strokeWidth={2.4} />)}
    </g>
  );
};

// ------------------------------------------------------------------ dispatcher
export const Options: React.FC = () => {
  const f = useCurrentFrame() + Math.round(T0 * 30);
  const t = f / 30;
  // ROOM: SELL + APART (until the matched cut to the clock)
  if (t < CUT_CLOCK) {
    let cam = smoothCam(camRoomRaw, t, 0.22);
    // push into the actuator held up by the technician; it lands at ROTOR_SCREEN at the cut
    const tc = techAt(t);
    if (t > SHOW - 0.05) {
      const k = easeIn(seg(t, SHOW - 0.05, CUT_CLOCK));
      const r0 = 30 * 1; // actuator radius (world) in the technician's hand (holdR scaled to world)
      const zT = ROTOR_SCREEN.r / r0;
      const target: Cam = {x: tc.hand.x - (ROTOR_SCREEN.x - 960) / zT, y: tc.hand.y - (ROTOR_SCREEN.y - 540) / zT, z: zT};
      cam = mixCam(cam, target, k);
    }
    const kneeS = toScreen(cam, KNEE0[0] + crateX(t) + 4, KNEE0[1] + 4);
    const lensK = seg(t, T_PACK - 0.1, T_PACK + 0.35) * (1 - seg(t, T_DIDNT - 0.55, T_DIDNT - 0.3));
    const labelK = seg(t, T_ACT - 0.1, T_ACT + 0.3) * (1 - seg(t, T_DIDNT - 0.55, T_DIDNT - 0.3));
    return (
      <Scene bg={BCOL.wall}>
        <Room t={t} f={f} cam={cam} />
        <Lens ax={kneeS.x} ay={kneeS.y} cx={1340} cy={470} r={280} k={lensK} id="kneeLens5">
          <ActuatorArt r={232} rot={(t - T_PACK) * 60} lw={5} id="actL5" />
        </Lens>
        {labelK > 0 ? (
          <g opacity={Math.min(1, labelK * 2)}>
            <rect x={1340 - 200} y={800} width={400} height={68} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <text x={1340} y={846} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={38} fill={C.ink}>custom actuator</text>
          </g>
        ) : null}
        {t < FACTORY_END + 1.0 ? <CrateWipeTail t={t} /> : null}
      </Scene>
    );
  }
  // TILT: the top view turns into the side view of the same ladle (centre, size and direction matched)
  if (t >= T_TILT0 && t < T_TILT1) return <TiltToSide t={t} />;
  // CLOCK → TOP-VIEW LADLE
  if (t < T_TILT0) {
    const heat = smooth(seg(t, T_MELT + 0.05, T_TOP));
    let cam = mixCam(clockCamAtCut, CLOCK_WIDE, easeInOut(seg(t, CUT_CLOCK + 0.1, T_EAT + 0.9)));
    const into: Cam = {x: CLK.x, y: CLK.y, z: 1160 / CLK.r};
    cam = mixCam(cam, into, easeInOut(seg(t, T_MELT - 0.45, T_TOP)));
    const drop = seg(t, T_DROP0, T_DROPHIT);
    const dropping = t > T_DROP0 && drop < 1;
    const sc = toScreen(cam, CLK.x, CLK.y);
    return (
      <Scene bg={BCOL.wall}>
        <Clockroom t={t} f={f} cam={cam} heat={heat} />
        {heat > 0 ? (
          <g>
            <Layer cam={cam}><TopLadle x={CLK.x} y={CLK.y} r={CLK.r} k={heat} t={t} lw={4 / cam.z} drop={seg(t, T_DROPHIT - 0.05, T_DROPHIT + 0.8)} /></Layer>
            {dropping ? <g transform={`translate(${sc.x + 30} ${sc.y + 10 - 160 * (1 - drop)}) scale(${lerp(3.2, 0.9, easeIn(drop))}) rotate(${drop * 160})`}><Scrap x={0} y={0} kind={0} lw={4} /></g> : null}
          </g>
        ) : null}
      </Scene>
    );
  }
  // SIDE VIEW: battery at the edge; then the U.S. door's shutter comes down over the frame (it is that door)
  if (t < T_WHERE) {
    const cam = battCam(t);
    const k = easeIn(seg(t, T_WHERE - 0.42, T_WHERE));
    return (
      <Scene bg="#221A21" over={<Chip x={1040} y={330} lines={['battery pack']} k={seg(t, T_BRINGS + 0.2, T_BRINGS + 0.5) * (1 - seg(t, T_WHERE - 0.55, T_WHERE - 0.35))} size={46} tone="paper" />}>
        <Edge t={t} cam={cam} id="edge" />
        {k > 0 ? <ShutterOver k={k} /> : null}
      </Scene>
    );
  }
  return <Street t={t} f={f} />;
};

/** The second half of the factory's crate wipe, continuing over the first frames of this section. */
const CrateWipeTail: React.FC<{t: number}> = ({t}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <CrateWipe t={t} />
  </svg>
);
void Mark; void Chip; void backOut;
/** Event times for the sound cue sheet. */
export const OPTIONS_EV = {PUSH0, PUSH1, SHUT_T0, SHUT_T1, POP, PULL0, PULL1, SHOW, CUT_CLOCK, T_TOP, W0, W1};

export const OPTIONS_WALK = {edgePose, EDGE_WALK};

export const OPTIONS_TIMES = {T_DROPHIT, T_TILT0, T_TILT1, T_FLIP, ASM0, T_LEAV};
