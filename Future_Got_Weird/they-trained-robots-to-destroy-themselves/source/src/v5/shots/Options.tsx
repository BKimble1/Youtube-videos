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
import {Splash, FCOL} from '../../v4/sets/foundry';
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

// ------------------------------------------------------------------ the back room
const RX0 = 0;                       // robot / crate centre before the shove
const PUSH0 = T_DIDNT - 0.05, PUSH1 = PUSH0 + 0.75;
const RX1 = 230;                     // where the crate stops (the shutter came down first)
const crateX = (t: number) => lerp(RX0, RX1, easeOut(seg(t, PUSH0, PUSH1))) - 10 * Math.sin(Math.PI * seg(t, PUSH1, PUSH1 + 0.2));
const CW = 600, CH = 740;
const DOOR = {x0: 640, x1: 1020, y0: 430};
const SHUT_T0 = PUSH0 + 0.35, SHUT_T1 = SHUT_T0 + 0.28;
const offPose = (x: number, o: Partial<RPose> = {}): RPose => stand(x, G - 30, 1, {yaw: 0.35, armN: A(1, 4, {grip: 0.2}), armF: A(1, 4, {grip: 0.2}), head: 12, neck: 4, ...o});
const KNEE0 = rig(offPose(0), 1).pts.kneeN;
const WRIST0 = rig(offPose(0), 1).pts.wrN;
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
  let c = creep(cA, t, FACTORY_END, T_PACK - 0.4, 0.06, 40, -10);   // the held two-shot creeps in until the knee move
  c = mixCam(c, cKnee, easeInOut(seg(t, T_PACK - 0.4, T_PACK + 0.7)));
  c = mixCam(c, cWide, easeInOut(seg(t, T_DIDNT - 0.45, T_DIDNT + 0.35)));
  c = mixCam(c, cApart, easeInOut(seg(t, T_APART - 0.1, T_APART + 0.6)));
  return c;
};
// the actuator coming out of the knee
const POP = T_FSAYS - 0.15;          // knee cover off
const PULL0 = POP + 0.25, PULL1 = PULL0 + 0.45;
const SHOW = PULL1 + 0.1;            // held up to look at
const CUT_CLOCK = T_EVERY + 0.35;    // matched cut: rotor → clock
const ROTOR_SCREEN = {x: 960, y: 540, r: 300}; // where the rotor sits on screen at the cut (= clock face)

/** Technician arm and held object for the APART beat. */
const techAt = (t: number) => {
  const pos = step(-420, RX1 - 330, T_APART + 0.05, T_APART + 0.6, t);
  const ch = {x: pos.x, y: G, h: 560};
  const knee = {x: KNEE0[0] + RX1 + 10, y: KNEE0[1]};
  const idle = {a: 20, b: 30};
  const atKnee = crewReach(ch, 1, knee.x - 6, knee.y + 4);
  const showPt = {x: ch.x + 170, y: G - 470};
  const show = crewReach(ch, 1, showPt.x, showPt.y);
  let arm = idle;
  const r = smooth(seg(t, T_APART + 0.5, T_APART + 0.9));
  arm = {a: lerp(idle.a, atKnee.a, r), b: lerp(idle.b, atKnee.b, r)};
  const up = smooth(seg(t, PULL0, SHOW));
  arm = {a: lerp(arm.a, show.a, up), b: lerp(arm.b, show.b, up)};
  return {ch, bob: pos.bob, arm, hand: crewHand(ch, arm, 1), holding: t >= PULL0};
};

const Room: React.FC<{t: number; f: number; cam: Cam}> = ({t, f, cam}) => {
  const lw = 4 / cam.z;
  const cx = crateX(t);
  // crate assembly (SELL) and fall-away (APART)
  const asm = (o: number) => seg(t, T_SELL + 0.3 + o, T_SELL + 0.7 + o) * (1 - easeIn(seg(t, T_APART + 0.02 + o * 0.5, T_APART + 0.42 + o * 0.5)));
  const parts = {pallet: 1, back: asm(0), left: asm(0.1), right: asm(0.2), top: asm(0.3)};
  const pr = offPose(cx);
  // sale tag on the near wrist (hung by the technician on "Sell it?")
  const tagK = seg(t, T_SELL + 0.12, T_SELL + 0.3) * (1 - seg(t, T_APART - 0.2, T_APART + 0.05));
  const wr = rig(pr, 1).pts.wrN;
  const swing = Math.sin((t - T_SELL) * 6) * 16 * Math.exp(-Math.max(0, t - T_SELL - 0.12) * 1.6) + Math.sin((t - PUSH1) * 9) * 10 * Math.exp(-Math.max(0, t - PUSH1) * 3) * (t > PUSH1 ? 1 : 0);
  // shutter + padlock
  const shut = easeIn(seg(t, SHUT_T0, SHUT_T1));
  const bounce = Math.sin(Math.PI * seg(t, SHUT_T1, SHUT_T1 + 0.18)) * 0.03;
  const lockK = seg(t, T_BLDG + 0.15, T_BLDG + 0.3);
  // technician
  const sell = t < T_APART;
  let ch = {x: -420, y: G, h: 560};
  let armR = {a: 12, b: 16};
  let bob = 0;
  let hold: React.ReactNode = null;
  if (sell) {
    // look → hang the tag → stand back → shove
    const hk = smooth(seg(t, T_SELL - 0.25, T_SELL + 0.12)) * (1 - smooth(seg(t, T_SELL + 0.3, T_SELL + 0.7)));
    const st = step(-420, -260, T_SELL - 0.45, T_SELL - 0.05, t);
    const back = step(0, -160, T_SELL + 0.35, T_SELL + 0.8, t);
    ch = {...ch, x: st.x + back.x};
    bob = st.bob + back.bob;
    const tagArm = crewReach(ch, 1, wr[0], wr[1] - 10);
    armR = {a: lerp(14, tagArm.a, hk), b: lerp(20, tagArm.b, hk)};
    const shove = smooth(seg(t, PUSH0 - 0.25, PUSH0)) * (1 - smooth(seg(t, PUSH0 + 0.25, PUSH0 + 0.6)));
    const crateL = cx - CW / 2;
    const pushArm = crewReach(ch, 1, crateL - 10, G - 420);
    armR = {a: lerp(armR.a, pushArm.a, shove), b: lerp(armR.b, pushArm.b, shove)};
  } else {
    const tc = techAt(t);
    ch = tc.ch; armR = tc.arm; bob = tc.bob;
    const k = ch.h / 440;
    const turning = t > T_APART + 0.9 && t < POP ? Math.sin(t * 26) * 16 : 0;
    hold = !tc.holding ? <g transform={`rotate(${turning}) scale(0.75)`}><Wrench x={0} y={0} s={0.9} rot={-30} /></g>
      : <g transform={`scale(${1 / k})`}><ActuatorArt r={30} rot={(t - PULL0) * 120} lw={lw} id="actH5" /></g>;
  }
  const pose: CPose = {...IDLE, armR, armL: {a: 12, b: 16}, bob, lookX: 0.75, lookY: sell ? (t < T_SELL ? -0.25 : 0.05) : t > SHOW ? -0.1 : 0.55,
    mouth: sell ? (t < T_SELL ? 'hmm' : t > SHUT_T1 ? 'o' : 'smile') : t > SHOW ? 'grin' : 'flat', brows: t > SHUT_T1 && sell ? 0.7 : 0.1, tilt: t < T_SELL ? -6 : 0};
  // knee: cover pops off and flies, the socket stays dark (teal ring)
  const popped = !sell && t >= POP;
  const coverFly = popped ? seg(t, POP, POP + 0.6) : 0;
  const kneeW = rig(pr, 1).pts.kneeN;
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
      {tagK > 0 ? <g opacity={Math.min(1, tagK * 3)}><HangTag x={wr[0]} y={wr[1] + 10} s={0.9} text="FOR SALE" swing={swing} /></g> : null}
      <Crew look={CAST.clerkA} x={ch.x} y={ch.y} h={ch.h} frame={f} seed={3} front="R" holdR={hold} pose={pose} life={0.5} />
    </Layer>
  );
};

// ------------------------------------------------------------------ engineering time: clock over the queue
const CLK = {x: 0, y: 300, r: 220};
const clockCamAtCut: Cam = {x: CLK.x, y: CLK.y, z: ROTOR_SCREEN.r / CLK.r};
const CLOCK_WIDE: Cam = {x: 40, y: 520, z: 0.8};
const clockAngle = (t: number) => {
  const t0 = CUT_CLOCK, t1 = T_EAT + 0.4;
  const w = 2600; // deg/s once up to speed
  if (t <= t0) return 0;
  if (t <= t1) return (0.5 * w * (t - t0) ** 2) / (t1 - t0);
  return 0.5 * w * (t1 - t0) + w * (t - t1);
};
const T_TOP = T_MELT + 0.55; // the clock face has become the ladle seen from above
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
      {[[-120, 0], [-40, 1], [60, 2]].map(([x, k]) => <Scrap key={x} x={x} y={G - 352} kind={k} lw={lw} />)}
      <Crew look={CAST.clerkB} x={260} y={G} h={520} flip frame={f} seed={9} life={0.5}
        pose={{...IDLE, armR: {a: 64 + 10 * Math.sin(t * 9), b: 50}, armL: {a: 40, b: 40}, lookX: -0.6, lookY: 0.6, mouth: 'flat'}}
        holdR={<g transform={`rotate(${Math.sin(t * 18) * 14}) scale(0.7)`}><Wrench x={0} y={0} s={0.9} rot={-30} /></g>} />
      {/* next model: blueprint with a launch flag on a timeline */}
      <g>
        <rect x={bp.x - 190} y={bp.y - 150} width={380} height={260} rx={10} fill="#3A5FA0" stroke={C.ink} strokeWidth={lw} />
        {Array.from({length: 5}, (_, i) => <line key={i} x1={bp.x - 190} y1={bp.y - 150 + 52 * (i + 1)} x2={bp.x + 190} y2={bp.y - 150 + 52 * (i + 1)} stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={lw * 0.6} />)}
        <path d={`M${bp.x - 30} ${bp.y - 110} q30 -14 60 0 l6 70 q-36 14 -72 0 Z M${bp.x - 40} ${bp.y - 36} l80 0 l-8 110 l-64 0 Z`} fill="none" stroke="#FFFFFF" strokeWidth={lw * 1.2} strokeLinejoin="round" />
        <text x={bp.x} y={bp.y + 150} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>NEXT MODEL</text>
        <line x1={bp.x - 220} y1={bp.y + 200} x2={bp.x + 520} y2={bp.y + 200} stroke={C.ink} strokeWidth={lw * 1.4} />
        {Array.from({length: 8}, (_, i) => <line key={'tk' + i} x1={bp.x - 220 + i * 105} y1={bp.y + 190} x2={bp.x - 220 + i * 105} y2={bp.y + 210} stroke={C.ink} strokeWidth={lw} />)}
        <g transform={`translate(${bp.x + lerp(60, 470, flag)} ${bp.y + 200})`}>
          <line x1={0} y1={0} x2={0} y2={-80} stroke={C.ink} strokeWidth={lw * 1.4} />
          <path d="M0 -80 L56 -64 L0 -48 Z" fill={C.coral} stroke={C.ink} strokeWidth={lw} strokeLinejoin="round" />
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
const battCam = (t: number) => mixCam(CAM_SPLASH, CAM_BATT, easeInOut(seg(t, T_EXCEPT - 0.2, T_ONOWN + 0.2)));
const Edge: React.FC<{t: number; cam: Cam; id: string}> = ({t, cam, id}) => {
  const p = edgePose(t);
  const k = seg(t, T_BRINGS - 0.25, T_BRINGS + 0.2);
  const glow = t > T_BRINGS + 0.4 ? 0.5 + 0.5 * Math.sin((t - T_BRINGS) * 9) : 0;
  const tHit = t - (T_SIMPLE + 0.3);
  return (
    <FoundryView5 cam={cam} t={t} hit={{x: FD.ladle.cx - 20, t: tHit}} hook={false} id={id}
      inside={<Splash x={FD.ladle.cx - 20} t={tHit} lw={4 / cam.z} part="front" scale={0.6} />}
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
  const shutUS = easeIn(seg(t, T_US - 0.2, T_US + 0.12));
  const shutMX = easeIn(seg(t, T_MEX - 0.15, T_MEX + 0.15));
  const openIM = easeOut(seg(t, T_YES - 0.35, T_YES + 0.2));
  // the U.S. doorway shows the battery shot (screen picture mapped into the doorway)
  const d = doorRect(FAC[0].x);
  const s0 = toScreen(cam, d.x0, d.y0), s1 = toScreen(cam, d.x1, d.y1);
  const sc = (s1.x - s0.x) / 1920; // width-fit: 1 at the first frame (the doorway spans the frame), the world fills above/below
  // crew pushing the crated robot along the street (crate on a hand truck), one stop per door
  const crateX = t < T_MEX - 0.4 ? lerp(-300, 520, easeInOut(seg(t, T_WHERE + 0.3, T_US + 0.3))) : t < T_YES - 0.6 ? lerp(520, 1820, easeInOut(seg(t, T_MEX + 0.2, T_ONE + 0.5))) : lerp(1820, 2240, easeInOut(seg(t, T_YES - 0.6, T_YES + 0.5)));
  const pushing = (t > T_WHERE + 0.3 && t < T_US + 0.3) || (t > T_MEX + 0.2 && t < T_ONE + 0.5) || (t > T_YES - 0.6 && t < T_YES + 0.5);
  const cr = {x: crateX - 280, y: G, h: 470};
  const bob = pushing ? -Math.abs(Math.sin(t * 7)) * 8 : 0;
  const arm = crewReach(cr, 1, crateX - 150, G - 300);
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
          {[-110, 110].map((dx) => <circle key={dx} cx={crateX + dx} cy={G - 8} r={14} fill="#2B2B33" />)}
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
              <g transform={`translate(${(a0.x + a1.x) / 2 - 960 * sci} ${(a0.y + a1.y) / 2 - 540 * sci}) scale(${sci})`}>
                <ImatraWorld t={t} f={f} cam={CAM_IM0} />
              </g>
              <rect x={a0.x} y={a0.y} width={a1.x - a0.x} height={a1.y - a0.y} fill="#FFB347" opacity={0.85 * glow} />
            </g>
          </g>
        );
      })() : null}
      {/* the battery shot, living inside the U.S. doorway until the shutter covers it */}
      {shutUS < 1 && s1.x > 0 ? (
        <g>
          <defs><clipPath id="usDoor"><rect x={s0.x} y={s0.y + (s1.y - s0.y) * shutUS} width={s1.x - s0.x} height={(s1.y - s0.y) * (1 - shutUS)} /></clipPath></defs>
          <g clipPath="url(#usDoor)">
            <g transform={`translate(${(s0.x + s1.x) / 2 - 960 * sc} ${(s0.y + s1.y) / 2 - 540 * sc}) scale(${sc})`}>
              <rect width={1920} height={1080} fill="#221A21" />
              <Edge t={t} cam={battCam(t)} id="edgeD" />
            </g>
          </g>
        </g>
      ) : null}
    </Scene>
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
  // CLOCK → TOP-VIEW LADLE
  if (t < T_SIMPLE + 0.5) {
    const heat = smooth(seg(t, T_MELT + 0.05, T_TOP));
    let cam = mixCam(clockCamAtCut, CLOCK_WIDE, easeInOut(seg(t, CUT_CLOCK + 0.1, T_EAT + 0.9)));
    const into: Cam = {x: CLK.x, y: CLK.y, z: 520 / CLK.r};
    cam = mixCam(cam, into, easeInOut(seg(t, T_MELT - 0.45, T_TOP)));
    const drop = seg(t, T_SIMPLE - 0.2, T_SIMPLE + 0.35);
    const dropping = t > T_SIMPLE - 0.45 && drop < 1;
    const sc = toScreen(cam, CLK.x, CLK.y);
    return (
      <Scene bg={BCOL.wall}>
        <Clockroom t={t} f={f} cam={cam} heat={heat} />
        {heat > 0 ? (
          <g>
            <Layer cam={cam}><TopLadle x={CLK.x} y={CLK.y} r={CLK.r} k={heat} t={t} lw={4 / cam.z} drop={seg(t, T_SIMPLE + 0.15, T_SIMPLE + 1.0)} /></Layer>
            {dropping ? <g transform={`translate(${sc.x + 30} ${sc.y + 10 - 200 * (1 - drop)}) scale(${lerp(2.6, 0.5, easeIn(drop))}) rotate(${drop * 200})`}><Scrap x={0} y={0} kind={0} lw={4} /></g> : null}
          </g>
        ) : null}
      </Scene>
    );
  }
  // SIDE VIEW: battery at the edge
  if (t < T_WHERE) {
    const cam = battCam(t);
    return (
      <Scene bg="#221A21" over={<Chip x={1180} y={700} lines={['battery pack']} k={seg(t, T_BRINGS + 0.2, T_BRINGS + 0.5) * (1 - seg(t, T_WHERE - 0.25, T_WHERE))} size={32} tone="paper" />}>
        <Edge t={t} cam={cam} id="edge" />
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
