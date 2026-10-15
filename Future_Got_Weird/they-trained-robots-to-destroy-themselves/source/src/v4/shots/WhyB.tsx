// V4 WHY, part B (37.0 → 68.0): the three options, and where the robots went.
//   SELL     the crate assembles around the robot; a bounded lens on the knee shows a custom actuator; the crate door
//            swings shut across the camera and the closed face carries the decision (NOT FOR SALE)
//   APART    the crate falls open; a crew member removes one actuator and tosses it across the bay onto a crank — the
//            camera follows it past the queue of retired robots; cranking spins the clock and flips the calendar
//   MELT     pushing into that actuator, it heats until the glare fills the frame; the glare clears on the ladle, its
//            housing ring now the ladle rim; then the robot at the edge with a bounded battery cutaway
//   WHERE    pull back out of a foundry doorway: three foundry doors, a crate on a dolly — ✗, ✗, ✓
//   NORMAL   through the open door: scrap is recycled as usual; a clapperboard snaps and film lights come on
import React from 'react';
import {T} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, Tag, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, crewReach, crewHand, rnd} from '../kit/scene';
import {BayBack, BAY, BCOL} from '../sets/bay';
import {FoundryView, FD} from '../sets/views';
import {Splash} from '../sets/foundry';
import {Crate, CrateFront, DoorSwing, DOOR_SHUT_SCREEN, ActuatorArt, Lens, BatteryArt, Facade, Mark, WallClock, Crank, MonthBoard, FilmLight, TripodCam, BigClapper, Scrap} from '../sets/props';
import {rig, RPose, Rig} from '../rig/Robot2D';
import {stand, walk, blend, A} from '../rig/poses';
import {ms} from '../rig/geom';
import {WHY_A_END} from './WhyA';
import {S_OPEN} from './Opening';
import {CAST} from '../../components/cast';
import {IDLE, Pose as CPose, mixPose} from '../../components/Character';
import {HangTag, Wrench} from '../../components/Props';
import {C, F} from '../../theme';

const G = BAY.floor;
const T0 = WHY_A_END;
const T_SELL = T('Sell it');
const T_PACK = T('packed with');
const T_CUSTOM = T('custom hardware');
const T_ACT = T('like the actuators');
const T_MOVE = T('move the joints');
const T_DIDNT = T('and it didn’t want');
const T_BLDG = T('the building');
const T_APART = T('Take them apart') - 0.08;
const T_FSAYS = T('Figure says doing that');
const T_EVERY = T('for every robot');
const T_EAT = T('would eat');
const T_DELAY = T('delay the next');
const T_MELT = T('Melt them') - 0.08;
const T_SIMPLE = T('Simple');
const T_EXCEPT = T('Except a robot');
const T_ONOWN = T('on its own');
const T_BRINGS = T('brings its battery');
const T_BATT = T('battery along');
const T_WHERE = T('Figure says foundries') - 0.1;
const T_US = T('U.S.');
const T_MEX = T('Mexico');
const T_IMATRA = T('One in Imatra');
const T_YES = T('said yes');
const T_RECYCLE = T('Recycling old');
const T_NORMAL = T('is normal');
const T_FILM = T('Bringing a film');
const T_NOT = T('is not');

// ---------------------------------------------------------------- shared geometry
const CX = -120, CW = 560, CH = 440;                       // crate around the robot (bottom on the floor)
const crPose = (o: Partial<RPose> = {}): RPose => stand(CX, G - 30, 1, {yaw: 0.35, armN: A(1, 4), armF: A(1, 4), head: 10, neck: 4, ...o});
const KNEE = rig(crPose(), 1).pts.kneeN;
const HUB = {x: -700, y: 650};                              // crank hub where the actuator lands
const CLOCK = {x: -1080, y: 300, r: 150};
const BOARD = {x: -1520, y: 300};
const CLERK_B = {x: 210, y: G, h: 560, flip: true};
const CLERK_A_M = {x: -860, y: G, h: 520};
const c0: Cam = {x: 260, y: 640, z: 1.12};
const cCrate: Cam = {x: CX - 60, y: 700, z: 1.5};
const cKnee: Cam = {x: KNEE[0] + 150, y: KNEE[1] - 40, z: 2.3};
const zDoor = (DOOR_SHUT_SCREEN.x1 - DOOR_SHUT_SCREEN.x0) / CW;
const cDoor: Cam = {x: CX + (960 - (DOOR_SHUT_SCREEN.x0 + DOOR_SHUT_SCREEN.x1) / 2) / zDoor, y: G - CH / 2 + (540 - (DOOR_SHUT_SCREEN.y0 + DOOR_SHUT_SCREEN.y1) / 2) / zDoor, z: zDoor};
const cOut: Cam = {x: CX + 300, y: 660, z: 1.25};
const cApart: Cam = {x: CX + 140, y: 650, z: 1.4};
const cMach: Cam = {x: -760, y: 560, z: 0.95};
const cHub: Cam = {x: HUB.x, y: HUB.y, z: 5.5};
/** Foundry robots use the opening's scale everywhere (no surprise scale changes next to the ladle). */
export const FS = S_OPEN;
const ROBOT_EDGE = (o: Partial<RPose> = {}) => stand(250, FD.deck.top, FS, {yaw: 0.8, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3}), ...o});
const cLad: Cam = {x: 860, y: 740, z: 1.4};
const cBatt: Cam = {x: 330, y: 370, z: 2.0};
const GLARE = '#FFC870';

// door swing timing
const SW0 = T_DIDNT - 0.12, SW1 = T_DIDNT + 0.5, SW2 = SW1 + 0.28; // open → shut → small rebound → world
/** Door angle: quick to the lens edge, a readable sweep across the frame (66°→45°), then the slam. */
const doorAngle = (tau: number) => {
  if (tau < SW0) return 90;
  if (tau < SW1) return keysLin(tau, [[SW0, 90], [SW0 + 0.08, 67], [SW0 + 0.4, 45], [SW1, 0]]);
  return 6 * Math.sin(Math.PI * seg(tau, SW1, SW2));
};
function keysLin(t: number, k: [number, number][]) {
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], (t - k[i][0]) / (k[i + 1][0] - k[i][0]));
  return k[k.length - 1][1];
}

const hammer = (lw: number) => (
  <g transform="rotate(-20)">
    <rect x={-7} y={-10} width={14} height={110} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={lw} />
    <rect x={-34} y={-30} width={68} height={30} rx={6} fill="#7E8A94" stroke={C.ink} strokeWidth={lw} />
  </g>
);

const Signpost: React.FC<{lw: number; hi: number; t: number}> = ({lw, hi, t}) => {
  const opts = [{lab: 'SELL?', y: 420}, {lab: 'TAKE APART?', y: 560}, {lab: 'MELT?', y: 700}];
  return (
    <g>
      <rect x={480} y={330} width={22} height={G - 330} fill="#9E6B30" stroke={BCOL.ink} strokeWidth={lw} />
      {opts.map((o, i) => {
        const wig = i === hi ? Math.sin(t * 18) * 3 * Math.max(0, 1 - t * 0.9) : 0;
        return (
          <g key={o.lab} transform={`rotate(${wig} 491 ${o.y})`} opacity={i === hi ? 1 : lerp(1, 0.55, seg(t, 0, 0.3))}>
            <path d={`M502 ${o.y - 46} L940 ${o.y - 46} L990 ${o.y} L940 ${o.y + 46} L502 ${o.y + 46} Z`} fill={i === hi ? C.saffron : C.paper} stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
            <text x={560} y={o.y + 16} fontFamily={F.display} fontWeight={700} fontSize={46} fill={BCOL.ink}>{o.lab}</text>
          </g>
        );
      })}
    </g>
  );
};

/** Battery window drawn in the torso frame (bounded cutaway). */
const batteryWindow = (k: number, glow: number, lw: number) => (r: Rig) => {
  if (k <= 0) return null;
  const yaw = r.yaw;
  const cx = lerp(0, 24, yaw), cy = -82;
  const w = lerp(88, 64, yaw) * easeOut(k), h = 100 * easeOut(k);
  return (
    <g transform={ms(r.M.torso)}>
      <defs><clipPath id="battWin"><rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} /></clipPath></defs>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} fill="#1A1F24" />
      <g clipPath="url(#battWin)"><g transform={`translate(${cx} ${cy}) scale(${w / 90} ${h / 90})`}><BatteryArt w={84} h={84} lw={lw} glow={glow} /></g></g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10} fill="none" stroke={C.saffron} strokeWidth={lw * 1.6} />
    </g>
  );
};

const Warn: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => {
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * backOut(k, 1.8)})`}>
      <path d="M0 -62 L58 44 L-58 44 Z" fill={C.saffron} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
      <rect x={-6} y={-24} width={12} height={40} rx={6} fill={C.ink} />
      <circle cx={0} cy={30} r={7} fill={C.ink} />
    </g>
  );
};

// ---------------------------------------------------------------- APART/machine: the actuator in flight
const TOSS0 = T_EVERY - 0.65, TOSS1 = TOSS0 + 0.95;
const crankAngle = (tau: number) => {
  const t0 = T_EAT - 0.15, t1 = T_EAT + 0.6, w = 900;
  if (tau <= t0) return 0;
  if (tau <= t1) return (0.5 * w * (tau - t0) ** 2) / (t1 - t0);
  return 0.5 * w * (t1 - t0) + w * (tau - t1);
};

/** The bay with the crate remains, the teardown, the queue and the time machine. */
const Bay: React.FC<{tau: number; cam: Cam; f: number; heat?: number}> = ({tau, cam, f, heat = 0}) => {
  const lw = 4 / cam.z;
  const fall = easeIn(seg(tau, T_APART, T_APART + 0.45));
  const walls = 1 - easeIn(seg(tau, T_APART + 0.25, T_APART + 0.7));
  // clerk B: in from the right, reaches the knee with the wrench, removes the actuator, tosses it
  const inB = easeOut(seg(tau, T_APART + 0.05, T_APART + 0.55));
  const cb = {...CLERK_B, x: lerp(560, CLERK_B.x, inB)};
  const reachK = smooth(seg(tau, T_APART + 0.6, T_APART + 1.1)) * (1 - smooth(seg(tau, TOSS0 - 0.45, TOSS0 - 0.15)));
  const pop = tau > T_FSAYS + 0.05;
  const idleR = {a: 20, b: 30};
  const atKnee = crewReach(cb, 1, KNEE[0] + 26, KNEE[1] + 6);
  const windup = {a: 150, b: 40};
  const tossK = smooth(seg(tau, TOSS0 - 0.4, TOSS0)) * (1 - smooth(seg(tau, TOSS0 + 0.1, TOSS0 + 0.5)));
  let armR = {a: lerp(idleR.a, atKnee.a, reachK), b: lerp(idleR.b, atKnee.b, reachK)};
  armR = {a: lerp(armR.a, windup.a, tossK), b: lerp(armR.b, windup.b, tossK)};
  const turning = tau > T_APART + 1.0 && !pop ? Math.sin(tau * 26) * 14 : 0;
  const holdAct = pop && tau < TOSS0;
  const k = cb.h / 440;
  const hand = crewHand(cb, armR, 1);
  // flight
  let act: {x: number; y: number; rot: number} | null = null;
  if (tau >= TOSS0) {
    const u = seg(tau, TOSS0, TOSS1);
    const p0 = crewHand(cb, windup, 1);
    act = u < 1 ? {x: lerp(p0.x, HUB.x, u), y: lerp(p0.y, HUB.y, u) - Math.sin(Math.PI * u) * 300, rot: (tau - TOSS0) * 900}
      : {x: HUB.x, y: HUB.y, rot: crankAngle(tau)};
  }
  const landed = tau >= TOSS1;
  const land = landed ? Math.exp(-(tau - TOSS1) * 9) : 0;
  // robot after the removal: a small sag
  const sag = smooth(seg(tau, T_FSAYS + 0.1, T_FSAYS + 0.4));
  const p = crPose({y: crPose().y + 8 * sag, head: 10 + 8 * sag});
  // clerk A at the crank
  const ca = crankAngle(tau);
  const crankR = 80;
  const handle = {x: HUB.x + Math.cos((ca * Math.PI) / 180) * crankR, y: HUB.y + Math.sin((ca * Math.PI) / 180) * crankR};
  const cranking = tau > T_EAT - 0.3;
  const aArm = cranking ? crewReach(CLERK_A_M, 1, handle.x, handle.y) : {a: 30, b: 50};
  // queue tags
  const tagK = (i: number) => backOut(seg(tau, T_EVERY - 0.1 + (9 - i) * 0.08, T_EVERY + 0.25 + (9 - i) * 0.08), 1.6);
  const months = 2 + 7 * easeIn(seg(tau, T_DELAY - 0.4, T_DELAY + 0.8));
  const delayed = backOut(seg(tau, T_DELAY + 0.55, T_DELAY + 0.85), 1.6);
  const clockA = ca * 4;
  return (
    <Layer cam={cam}>
      <BayBack lw={lw} />
      {/* the time machine on the back wall: clock ← belt ← crank; calendar with the next model */}
      <WallClock x={CLOCK.x} y={CLOCK.y} r={CLOCK.r} lw={lw} a={clockA} />
      <g transform={`translate(${CLOCK.x} ${CLOCK.y + CLOCK.r + 46})`} opacity={seg(tau, T_EAT - 0.1, T_EAT + 0.3)}>
        <rect x={-170} y={-30} width={340} height={60} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={lw} />
        <text x={0} y={14} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.ink}>ENGINEERING TIME</text>
      </g>
      <MonthBoard x={BOARD.x} y={BOARD.y} lw={lw} m={months} />
      <g transform={`translate(${BOARD.x} ${BOARD.y + 210})`}>
        <line x1={0} y1={-60} x2={0} y2={-24} stroke={C.ink} strokeWidth={lw} />
        <rect x={-130} y={-26} width={260} height={64} rx={10} fill={C.tealLight} stroke={C.ink} strokeWidth={lw} />
        <text x={0} y={18} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.ink}>NEXT MODEL</text>
        {delayed > 0.01 ? (
          <g transform={`translate(70 54) rotate(-8) scale(${delayed})`}>
            <rect x={-96} y={-26} width={192} height={52} rx={8} fill={C.paper} stroke={C.coral} strokeWidth={lw * 1.6} />
            <text x={0} y={14} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={36} fill={C.coral}>DELAYED</text>
          </g>
        ) : null}
      </g>
      {/* belt from the crank to the clock */}
      {[[-1, -1], [1, 1]].map(([sx, sy]) => (
        <line key={sx} x1={HUB.x + sx * 70} y1={HUB.y + sy * 10} x2={CLOCK.x + sx * 60} y2={CLOCK.y + CLOCK.r * 0.7} stroke={C.ink} strokeWidth={lw * 2.2} strokeDasharray={`${lw * 6} ${lw * 4}`} strokeDashoffset={-ca * 0.6 * sx} />
      ))}
      {/* the retired queue on a staging line */}
      <rect x={-1960} y={G - 70} width={1560} height={70} fill={BCOL.belt} stroke={C.ink} strokeWidth={lw} />
      <rect x={-1952} y={G - 68} width={1544} height={12} fill={BCOL.beltTop} />
      {Array.from({length: 10}, (_, i) => {
        const x = -1820 + i * 150;
        const pq = stand(x, G - 70, 0.62, {yaw: 0.6, head: 6 + 4 * Math.sin(i * 1.7), armN: A(1, 6), armF: A(1, 6)});
        const tk = tagK(i);
        return (
          <g key={'q' + i}>
            <Bot cam={cam} id={'q' + i} model="F02" s={0.62} pose={pq} />
            {tk > 0.01 ? <g transform={`translate(${x + 10} ${G - 70 - 250}) scale(${tk})`}><circle r={30} fill={C.saffron} stroke={C.ink} strokeWidth={lw} /><Wrench x={0} y={6} s={0.32} rot={-40} /></g> : null}
          </g>
        );
      })}
      {/* crank and clerk A */}
      <Crank x={HUB.x} y={HUB.y} r={crankR} lw={lw} a={ca} />
      <Crew look={CAST.clerkA} x={CLERK_A_M.x} y={CLERK_A_M.y} h={CLERK_A_M.h} frame={f} seed={3} front="R"
        pose={{...IDLE, armR: aArm, armL: {a: 14, b: 20}, lookX: 0.7, lookY: cranking ? 0.2 : -0.3, mouth: cranking ? 'o' : 'smile', brows: cranking ? 0.6 : 0}} />
      {/* crate remains + robot */}
      <Crate x={CX} y={G} w={CW} h={CH} lw={lw} parts={{back: walls, left: walls, right: walls, top: walls}} />
      <Bot cam={cam} id="wbR" model="F02" s={1} pose={p}
        after={pop ? {legN: (r: Rig) => <g><circle cx={r.pts.kneeN[0]} cy={r.pts.kneeN[1]} r={19} fill="#0B0F12" stroke={C.ink} strokeWidth={lw} /><circle cx={r.pts.kneeN[0]} cy={r.pts.kneeN[1]} r={19} fill="none" stroke={C.teal} strokeWidth={lw * 1.2} /></g>} : {}} />
      <CrateFront x={CX} y={G} w={CW} h={CH} lw={lw} fall={fall} />
      <Crew look={CAST.clerkB} x={cb.x} y={cb.y} h={cb.h} flip frame={f} seed={9} front="R"
        holdR={holdAct ? <g transform={`scale(${1 / k})`}><ActuatorArt r={30} rot={0} lw={lw} id="actH" /></g> : !pop ? <g transform={`rotate(${turning}) scale(0.8)`}><Wrench x={0} y={0} s={0.9} rot={-30} /></g> : null}
        pose={{...IDLE, armR, armL: {a: 12, b: 16}, lookX: tau > TOSS0 ? 0.9 : 0.6, lookY: reachK > 0.5 ? 0.6 : 0, mouth: pop ? 'grin' : 'flat', brows: pop ? 0.4 : 0}} />
      {act ? (
        <g transform={`translate(${act.x} ${act.y}) scale(${1 + land * 0.25})`}>
          <ActuatorArt r={landed ? 56 : 46} rot={act.rot} lw={lw} id="actF" heat={heat} />
          {heat > 0 ? <circle r={60 * (1 + heat * 0.15)} fill="#FFE6A8" opacity={heat * 0.25} /> : null}
        </g>
      ) : null}
      {void hand}
    </Layer>
  );
};

export const WhyB: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  // ================================================================ SELL
  if (tau < T_APART) {
    if (tau < SW2) {
      let cam = mixCam(c0, cCrate, easeInOut(seg(tau, T0 + 0.15, T0 + 1.3)));
      cam = mixCam(cam, cKnee, easeInOut(seg(tau, T_CUSTOM - 0.35, T_CUSTOM + 0.9)));
      cam = {...cam, z: cam.z * (1 + 0.05 * easeIn(seg(tau, SW0, SW1)))};
      const lw = 4 / cam.z;
      const asm = (t0: number) => seg(tau, T_SELL + 0.15 + t0, T_SELL + 0.55 + t0);
      const parts = {pallet: asm(0), back: asm(0.12), left: asm(0.24), right: asm(0.36), top: asm(0.5)};
      const flex = Math.sin(Math.PI * seg(tau, T_MOVE - 0.1, T_MOVE + 0.75));
      const p = crPose();
      p.y += 26 * flex;
      p.head += 4 * flex;
      const rot = (tau - T0) * 50 + flex * 300;
      // clerk A steps aside and taps the crate together
      const aside = easeInOut(seg(tau, T0 + 0.1, T0 + 0.7));
      const ax = lerp(-450, -660, aside);
      const tap = tau > T_SELL + 0.2 && tau < T_SELL + 1.3 ? Math.abs(Math.sin((tau - T_SELL) * 11)) : 0;
      const kneeS = toScreen(cam, KNEE[0] + 10, KNEE[1] + 26 * flex * 0.5);
      const lensK = seg(tau, T_ACT - 0.65, T_ACT - 0.15);
      const tagIn = seg(tau, T_PACK - 0.45, T_PACK - 0.05);
      const swing = Math.sin((tau - T_PACK) * 5) * 14 * Math.exp(-Math.max(0, tau - T_PACK + 0.45) * 1.4);
      const th = doorAngle(tau);
      return (
        <div style={{position: 'absolute', inset: 0}}>
          <Scene bg={BCOL.wall} over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'its own custom hardware']} k={seg(tau, T_PACK - 0.6, T_PACK - 0.2) * (1 - seg(tau, SW0 - 0.3, SW0))} tone="paper" size={38} />}>
            <Layer cam={cam}>
              <BayBack lw={lw} />
              <Signpost lw={lw} hi={0} t={tau - T_SELL} />
              {/* wheeled stand (replaced by the pallet) */}
              {parts.pallet < 0.6 ? (
                <g>
                  <rect x={CX - 150} y={G - 34} width={300} height={22} rx={6} fill={BCOL.frameD} stroke={BCOL.ink} strokeWidth={lw} />
                  {[-110, 110].map((dx) => <circle key={dx} cx={CX + dx} cy={G - 8} r={14} fill={BCOL.ink} />)}
                  <path d={`M${CX - 150} ${G - 30} L${CX - 170} ${G - 300}`} stroke={BCOL.frameD} strokeWidth={lw * 3} strokeLinecap="round" />
                </g>
              ) : null}
              <Crate x={CX} y={G} w={CW} h={CH} lw={lw} parts={parts}
                front={<Bot cam={cam} id="wbS" model="F02" s={1} pose={p} hl={{kneeN: {color: C.teal, amount: lensK * (1 - seg(tau, SW0, SW0 + 0.2))}}} />} />
              {tagIn > 0 ? <g opacity={Math.min(1, tagIn * 3)}><HangTag x={CX - 170} y={G - CH - 20} s={1.15} text="FOR SALE?" swing={swing} /></g> : null}
              <Crew look={CAST.clerkA} x={ax} y={G} h={560} frame={f} seed={3} front="R" holdR={hammer(4)}
                pose={mixPose({...IDLE, armR: {a: 150, b: 120}, armL: {a: 10, b: 10}, lookX: 0.8, lookY: -0.3, brows: 0.5, mouth: 'hmm'}, {...IDLE, armR: {a: 70 + 50 * tap, b: 60 - 30 * tap}, armL: {a: 12, b: 14}, lookX: 0.8, lookY: 0.1, mouth: 'smile', brows: 0.3}, smooth(seg(tau, T0, T0 + 0.4)))} />
            </Layer>
            <Lens ax={kneeS.x} ay={kneeS.y} cx={1390} cy={460} r={290} k={lensK * (1 - seg(tau, SW1 - 0.05, SW1))} id="kneeLens">
              <ActuatorArt r={240} rot={rot} lw={5} id="actL" />
            </Lens>
            {lensK > 0 && tau < SW1 ? (
              <g opacity={seg(tau, T_ACT - 0.2, T_ACT + 0.2)}>
                <rect x={1390 - 210} y={790} width={420} height={70} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
                <text x={1390} y={838} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={38} fill={C.ink}>custom actuators</text>
                <text x={1390} y={900} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={30} fill={C.inkSoft} opacity={seg(tau, T_MOVE - 0.1, T_MOVE + 0.3)}>they move the joints</text>
              </g>
            ) : null}
          </Scene>
          <DoorSwing th={th} />
        </div>
      );
    }
    // the shut face, stamped; pull back to the crate and the exit door coming down
    const u = easeInOut(seg(tau, SW2 + 0.15, T_APART - 0.05));
    const cam = mixCam(cDoor, cOut, u);
    const lw = 4 / cam.z;
    const stamp = seg(tau, SW2 + 0.02, SW2 + 0.12);
    const lock = seg(tau, SW2 + 0.35, SW2 + 0.5);
    const shutter = easeIn(seg(tau, T_BLDG - 0.25, T_BLDG + 0.3));
    return (
      <Scene bg={BCOL.wall}>
        <Layer cam={cam}>
          <BayBack lw={lw} />
          {/* exit door of the building */}
          <g>
            <rect x={560} y={470} width={380} height={530} fill="#2E3A44" stroke={C.ink} strokeWidth={lw} />
            <rect x={560} y={470} width={380} height={530 * (0.25 + 0.75 * shutter)} fill="#9AA4AE" stroke={C.ink} strokeWidth={lw} />
            {Array.from({length: Math.floor((530 * (0.25 + 0.75 * shutter)) / 34)}, (_, i) => <line key={i} x1={560} y1={470 + 34 * (i + 1)} x2={940} y2={470 + 34 * (i + 1)} stroke="#6E7882" strokeWidth={lw * 0.6} />)}
            <rect x={680} y={390} width={140} height={60} rx={8} fill="#2F8F5B" stroke={C.ink} strokeWidth={lw} />
            <text x={750} y={433} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={40} fill="#FFFFFF">EXIT</text>
          </g>
          <Crew look={CAST.clerkA} x={-660} y={G} h={560} frame={f} seed={3}
            pose={{...IDLE, armR: {a: 40, b: 30}, armL: {a: 12, b: 14}, lookX: 0.8, lookY: 0.1, mouth: 'flat', brows: 0.3}} />
          <Crate x={CX} y={G} w={CW} h={CH} lw={lw} />
          <CrateFront x={CX} y={G} w={CW} h={CH} lw={lw} stamp={stamp} lock={lock} />
          <Crew look={CAST.clerkB} x={CLERK_B.x + 350} y={G} h={560} flip frame={f} seed={9}
            pose={{...IDLE, armR: {a: 20, b: 30}, armL: {a: 12, b: 16}, lookX: 0.6, mouth: 'smile'}} holdR={<g transform="scale(0.8)"><Wrench x={0} y={0} s={0.9} rot={-30} /></g>} />
        </Layer>
      </Scene>
    );
  }
  // ================================================================ APART
  if (tau < T_MELT) {
    let cam = mixCam(cOut, cApart, easeInOut(seg(tau, T_APART, T_APART + 0.8)));
    cam = mixCam(cam, cMach, easeInOut(seg(tau, TOSS0 - 0.05, TOSS1 + 0.25)));
    cam = mixCam(cam, {x: -720, y: 520, z: 1.02}, smooth(seg(tau, TOSS1 + 0.25, T_MELT)));
    return (
      <Scene bg={BCOL.wall} over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'too much engineering time per robot']} k={seg(tau, T_FSAYS - 0.1, T_FSAYS + 0.3) * (1 - seg(tau, T_MELT - 0.3, T_MELT))} tone="paper" size={38} />}>
        <Bay tau={tau} cam={cam} f={f} />
      </Scene>
    );
  }
  // ================================================================ MELT
  const T_GL = T_MELT + 0.72; // glare covers the frame
  if (tau < T_GL) {
    const from: Cam = {x: -720, y: 520, z: 1.02};
    const pu = seg(tau, T_MELT - 0.3, T_GL);
    const cam = mixCam(from, cHub, pu * pu);
    const heat = smooth(seg(tau, T_MELT + 0.2, T_GL));
    const hs = toScreen(cam, HUB.x, HUB.y);
    const gr = easeIn(seg(tau, T_MELT + 0.35, T_GL)) * 2300;
    return (
      <Scene bg={BCOL.wall}>
        <Bay tau={tau} cam={cam} f={f} heat={heat} />
        {gr > 0 ? (
          <g>
            <defs><radialGradient id="glareA" cx={hs.x} cy={hs.y} r={Math.max(1, gr)} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF4D6" /><stop offset="0.75" stopColor={GLARE} /><stop offset="1" stopColor={GLARE} stopOpacity={0} /></radialGradient></defs>
            <circle cx={hs.x} cy={hs.y} r={gr} fill="url(#glareA)" />
          </g>
        ) : null}
      </Scene>
    );
  }
  if (tau < T_WHERE) {
    const cam = mixCam(cLad, cBatt, easeInOut(seg(tau, T_SIMPLE + 0.35, T_EXCEPT + 0.6)));
    const lw = 4 / cam.z;
    const rimS = toScreen(cam, FD.ladle.cx, FD.ladle.rim);
    const gr = (1 - easeOut(seg(tau, T_GL, T_GL + 0.6))) * 2300;
    // the actuator housing ring becomes the ladle rim
    const m = easeInOut(seg(tau, T_GL - 0.05, T_GL + 0.45));
    const ringOn = tau < T_GL + 0.62;
    const r0 = 56 * cHub.z;
    // the robot walks in to the edge on its own
    const W0 = T_EXCEPT - 0.3, W1 = T_ONOWN + 0.15, X0 = -420;
    const wu = seg(tau, W0, W1);
    const dist = (250 - X0) * (0.5 * wu + 0.5 * smooth(wu));
    const pw = walk(X0, FD.deck.top, FS, dist, 1, {yaw: 0.8}, 150);
    const p = tau < W0 ? null : blend(pw, ROBOT_EDGE(), smooth(seg(tau, W1 - 0.3, W1 + 0.1)));
    const battK = seg(tau, T_BRINGS - 0.2, T_BRINGS + 0.25);
    const battGlow = 0.5 + 0.5 * Math.sin((tau - T_BATT) * 9) * (tau > T_BATT ? 1 : 0);
    const r = rig(p ?? ROBOT_EDGE(), FS);
    const chestS = toScreen(cam, r.pts.chest[0] + 10, r.pts.chest[1] + 30);
    const headS = toScreen(cam, r.pts.head[0], r.pts.head[1] - 60);
    const ok = backOut(seg(tau, T_SIMPLE - 0.05, T_SIMPLE + 0.3), 1.6) * (1 - seg(tau, T_EXCEPT - 0.1, T_EXCEPT + 0.15));
    return (
      <Scene bg="#221A21">
        <FoundryView cam={cam} t={tau} glow={1}
          behind={p ? <Bot cam={cam} id="wbE" model="F02" s={FS} pose={p} after={{torso: batteryWindow(battK, tau > T_BATT ? battGlow : 0, 4 / (cam.z * FS))}} /> : null} />
        <Tag ax={chestS.x} ay={chestS.y} x={chestS.x + 230} y={chestS.y + 120} text="battery pack" k={seg(tau, T_BATT - 0.1, T_BATT + 0.3)} size={40} />
        {p ? <Warn x={headS.x + 170} y={headS.y + 40} k={seg(tau, T_EXCEPT + 0.35, T_EXCEPT + 0.7)} s={0.9} /> : null}
        {ok > 0.01 ? <Mark x={1480} y={300} ok k={ok} s={1.2} /> : null}
        {gr > 0 ? (
          <g>
            <defs><radialGradient id="glareB" cx={rimS.x} cy={rimS.y} r={Math.max(1, gr)} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF4D6" /><stop offset="0.75" stopColor={GLARE} /><stop offset="1" stopColor={GLARE} stopOpacity={0} /></radialGradient></defs>
            <circle cx={rimS.x} cy={rimS.y} r={gr} fill="url(#glareB)" opacity={Math.min(1, gr / 700)} />
          </g>
        ) : null}
        {ringOn ? (
          <g>
            <ellipse cx={lerp(960, rimS.x, m)} cy={lerp(540, rimS.y, m)} rx={lerp(r0, FD.ladle.rx * cam.z, m)} ry={lerp(r0, FD.ladle.ry * cam.z, m)} fill="none" stroke={C.ink} strokeWidth={16} />
            <ellipse cx={lerp(960, rimS.x, m)} cy={lerp(540, rimS.y, m)} rx={lerp(r0, FD.ladle.rx * cam.z, m)} ry={lerp(r0, FD.ladle.ry * cam.z, m)} fill="none" stroke="#9A5A3E" strokeWidth={8} />
          </g>
        ) : null}
        {void lw}
      </Scene>
    );
  }
  // ================================================================ WHERE: three foundry doors
  const T_IN2 = T_RECYCLE - 0.62;
  if (tau < T_IN2 + 0.6) return <Street tau={tau} f={f} tIn={T_IN2} />;
  return <Normal tau={tau} f={f} t0={T_IN2 + 0.6} />;
};

// ---------------------------------------------------------------- street of foundry doors
const FAC = [{x: -1500, label: 'U.S.', t: 0}, {x: -800, label: 'MEXICO', t: 0}, {x: -100, label: 'IMATRA, FINLAND', t: 0}];
const FW = 600, FH = 520;
const DOORW = FW * 0.56, DOORH = FH * 0.56;
const PIC = {x0: -100 - DOORW / 2, y0: 1000 - DOORH + (DOORH - DOORW * 9 / 16) / 2, w: DOORW, h: DOORW * 9 / 16};
const cPic: Cam = {x: PIC.x0 + PIC.w / 2, y: PIC.y0 + PIC.h / 2, z: 1920 / PIC.w};
const cStreet: Cam = {x: -760, y: 700, z: 0.9};

const Street: React.FC<{tau: number; f: number; tIn: number}> = ({tau, f, tIn}) => {
  let cam = mixCam(cPic, cStreet, easeInOut(seg(tau, T_WHERE, T_WHERE + 1.05)));
  const drift = smooth(seg(tau, T_WHERE + 1.05, tIn));
  cam = {...cam, x: cam.x + 140 * drift};
  cam = mixCam(cam, {x: -100, y: 860, z: 7.5}, easeIn(seg(tau, tIn, tIn + 0.6)));
  const lw = 4 / cam.z;
  // crate on a dolly, pushed by clerk A
  const xk: [number, number][] = [[T_WHERE, -1500], [T_US + 0.3, -1500], [T_MEX - 0.05, -800], [T_MEX + 0.45, -800], [T_IMATRA + 0.3, -100], [tIn + 0.6, -100]];
  let crateX = xk[0][1];
  for (let i = 0; i < xk.length - 1; i++) if (tau >= xk[i][0]) crateX = lerp(xk[i][1], xk[i + 1][1], easeInOut(seg(tau, xk[i][0], xk[i + 1][0])));
  crateX += 20;
  const knock = (t: number) => (tau > t && tau < t + 0.35 ? Math.sin((tau - t) * 60) * 4 * (1 - (tau - t) / 0.35) : 0);
  const imShutDown = easeIn(seg(tau, T_WHERE + 0.8, T_WHERE + 1.15));
  const imUp = easeInOut(seg(tau, T_IMATRA + 0.3, T_IMATRA + 1.0));
  const imShut = Math.max(0, imShutDown - imUp);
  const glow = seg(tau, T_IMATRA + 0.5, T_IMATRA + 1.0) + seg(tau, tIn + 0.2, tIn + 0.55);
  const ca = {x: crateX - 230, y: 1000, h: 460};
  const pic = (
    <g>
      <svg x={PIC.x0} y={PIC.y0} width={PIC.w} height={PIC.h} viewBox="0 0 1920 1080" overflow="hidden">
        <rect width={1920} height={1080} fill="#221A21" />
        <FoundryView cam={cBatt} t={tau} glow={1} behind={<Bot cam={cBatt} id="wbPic" model="F02" s={FS} pose={ROBOT_EDGE()} />} />
      </svg>
    </g>
  );
  return (
    <Scene bg="#CFE3F7" over={<Chip x={100} y={64} lines={['FIGURE SAYS']} k={seg(tau, T_WHERE + 0.6, T_WHERE + 1.0) * (1 - seg(tau, tIn - 0.2, tIn))} size={38} />}>
      <Layer cam={cam}>
        <rect x={-4000} y={-2000} width={8000} height={3000} fill="#CFE3F7" />
        <path d="M-4000 860 Q-3000 700 -2200 820 Q-1500 720 -900 800 Q-200 700 600 810 Q1400 720 4000 800 L4000 1000 L-4000 1000 Z" fill="#B7CFA0" stroke={C.ink} strokeWidth={lw} />
        <rect x={-4000} y={1000} width={8000} height={2000} fill="#B9B2A3" />
        <line x1={-4000} y1={1000} x2={4000} y2={1000} stroke={C.ink} strokeWidth={lw} />
        <path d={`M-4000 1110 L4000 1110`} stroke="#FFFFFF" strokeWidth={lw * 3} strokeDasharray={`${lw * 14} ${lw * 10}`} />
        {FAC.map((fc, i) => {
          const isIm = i === 2;
          const markT = i === 0 ? T_US + 0.05 : i === 1 ? T_MEX + 0.1 : T_YES;
          return (
            <g key={fc.label} transform={`translate(${i < 2 ? knock(markT - 0.05) : 0} 0)`}>
              <Facade x={fc.x} y={1000} w={FW} h={FH} lw={lw} label={fc.label} shut={isIm ? imShut : 1} mark={isIm ? 'ok' : 'x'} markK={seg(tau, markT, markT + 0.35)}
                glow={isIm ? Math.min(1, glow) : 0} tint={i === 0 ? '#C9B79A' : i === 1 ? '#D8B48A' : '#BFC7B0'} window={isIm && imShutDown < 1 ? pic : undefined} />
            </g>
          );
        })}
        {isFinite(crateX) ? (
          <g transform={`translate(-100 1000) scale(${lerp(1, 0.28, easeIn(seg(tau, T_YES + 0.1, tIn + 0.45)))}) translate(100 -1000)`}>
            <rect x={crateX - 130} y={1000 - 34} width={260} height={18} rx={6} fill={BCOL.frameD} stroke={C.ink} strokeWidth={lw} />
            {[-90, 90].map((dx) => <circle key={dx} cx={crateX + dx} cy={1000 - 10} r={12} fill={C.ink} />)}
            <Crate x={crateX} y={1000 - 30} w={240} h={190} lw={lw} />
            <CrateFront x={crateX} y={1000 - 30} w={240} h={190} lw={lw} stamp={1} lock={1} text="F.02" />
            <Crew look={CAST.clerkA} x={ca.x} y={ca.y} h={ca.h} frame={f} seed={3} front="R"
              pose={{...IDLE, armR: crewReach(ca, 1, crateX - 120, 1000 - 120), armL: crewReach(ca, -1, crateX - 120, 1000 - 90), lean: 6, lookX: 0.8, lookY: -0.4, mouth: tau > T_YES ? 'grin' : 'flat', brows: tau > T_US && tau < T_IMATRA ? -0.3 : 0.2}} />
          </g>
        ) : null}
        {glow >= 1.95 ? <rect x={-100 - DOORW / 2} y={1000 - DOORH} width={DOORW} height={DOORH} fill={GLARE} /> : null}
      </Layer>
    </Scene>
  );
};

/** The clapperboard that rises to cover the frame at the end of WHY (Film starts from the same transform). */
export const clapCover = (k: number) => ({x: 960, y: lerp(1400, -150, k), s: lerp(1.2, 3.2, k), rot: lerp(-6, 0, k)});

// ---------------------------------------------------------------- recycling is normal; a film crew is not
const cRec: Cam = {x: 560, y: 470, z: 1.02};
const Normal: React.FC<{tau: number; f: number; t0: number}> = ({tau, f, t0}) => {
  const cam = mixCam(cRec, {x: 580, y: 480, z: 1.08}, smooth(seg(tau, t0, t0 + 4.5)));
  const lw = 4 / cam.z;
  const gr = (1 - easeOut(seg(tau, t0, t0 + 0.6))) * 2300;
  // a crane skip over the ladle tips scrap in, a piece at a time
  const SK = {x: 830, y: 330};
  const tip = 10 + 22 * Math.max(0, Math.sin((tau - t0) * 4.2));
  const scrap: React.ReactNode[] = [];
  const splashes: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const ts = t0 - 0.2 + i * 0.5;
    const v = (tau - ts) / 0.5;
    if (v < 0) continue;
    const lx = SK.x - 40 + rnd(i * 5) * 120;
    if (v < 1) scrap.push(<Scrap key={'s' + i} x={lerp(SK.x - 60, lx, v)} y={lerp(SK.y + 50, FD.ladle.surf, v * v)} kind={i} rot={20 + v * 160} lw={lw} />);
    splashes.push(<Splash key={'sp' + i} x={lx} t={tau - ts - 0.5} lw={lw} part="front" scale={0.32} />);
  }
  const skip = (
    <g>
      <line x1={SK.x} y1={-700} x2={SK.x} y2={SK.y - 70} stroke="#1A1314" strokeWidth={lw * 2.4} />
      <g transform={`translate(${SK.x} ${SK.y}) rotate(${-tip})`}>
        <path d="M-60 -70 L60 -70 M0 -70 L0 -40" stroke="#1A1314" strokeWidth={lw * 2} />
        <path d="M-110 -40 L110 -40 L80 60 L-90 60 Z" fill="#6E6A72" stroke={C.ink} strokeWidth={lw} strokeLinejoin="round" />
        <path d="M-100 -30 L100 -30" stroke="#8A8590" strokeWidth={lw * 2} />
        <Scrap x={-20} y={-44} kind={1} rot={8} lw={lw} />
        <Scrap x={40} y={-50} kind={0} rot={-12} lw={lw} />
      </g>
    </g>
  );
  const clapIn = easeOut(seg(tau, T_FILM - 0.05, T_FILM + 0.25));
  const clapOut = easeIn(seg(tau, T_FILM + 0.62, T_FILM + 0.92));
  const clap = seg(tau, T_FILM + 0.34, T_FILM + 0.42);
  const lights = (t: number) => (tau < t ? 0 : tau < t + 0.12 ? 0.5 + 0.5 * Math.sin((tau - t) * 90) : 1);
  const crewIn = easeOut(seg(tau, T_FILM + 0.6, T_FILM + 1.1));
  const coverS = easeIn(seg(tau, T_NOT + 0.35, T_NOT + 0.85));
  const row = (k: number, ok: boolean, a: string, b: string) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, k * 2.5), transform: `translateX(${(1 - easeOut(k)) * 40}px)`, marginTop: 10}}>
      <div style={{width: 54, height: 54, borderRadius: 27, background: ok ? C.teal : C.coral, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${C.ink}`}}>{ok ? '✓' : '✗'}</div>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 36, color: C.ink}}>{a} <span style={{color: ok ? C.tealDeep : C.coralDeep}}>{b}</span></div>
    </div>
  );
  const k1 = seg(tau, T_NORMAL - 0.1, T_NORMAL + 0.25), k2 = seg(tau, T_NOT - 0.05, T_NOT + 0.3);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Scene bg="#221A21"
        over={k1 > 0 ? (
          <div style={{position: 'absolute', right: 70, top: 60, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '14px 26px 22px', boxShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>
            {row(k1, true, 'recycling old hardware', 'normal')}
            {k2 > 0 ? row(k2, false, 'bringing a film crew', 'not') : null}
          </div>
        ) : null}>
        <FoundryView cam={cam} t={tau} glow={1}
          extraBack={(
            <g>
              <FilmLight x={-260} y={FD.deck.top} lw={lw} on={lights(T_FILM + 0.65)} aim={16} id="flA" />
              <g transform={`translate(${(1 - crewIn) * 700} 0)`}>
                <FilmLight x={1440} y={FD.floor} lw={lw} on={lights(T_FILM + 0.8)} aim={205} h={560} id="flB" />
              </g>
              {skip}
            </g>
          )}
          behind={(
            <g>
              <Bot cam={cam} id="wbN" model="F02" s={FS} pose={ROBOT_EDGE()} />
              <Crew look={CAST.clerkB} x={-60} y={FD.deck.top} h={400} frame={f} seed={9} front="L"
                holdL={<g transform="rotate(-10)"><rect x={-40} y={-10} width={80} height={104} rx={8} fill="#C9924F" stroke={C.ink} strokeWidth={4} /><rect x={-32} y={4} width={64} height={80} rx={4} fill="#FFFDF6" /></g>}
                pose={{...IDLE, armL: {a: 40, b: 70}, armR: {a: 10, b: 12}, lookX: 0.7, lookY: 0.3, mouth: tau > T_NOT ? 'o' : 'smile', brows: tau > T_NOT ? 0.8 : 0.2}} />
            </g>
          )}
          inside={<g>{scrap}{splashes}</g>}
          front={(
            <g transform={`translate(${(1 - crewIn) * 800} 0)`}>
              <TripodCam x={1170} y={FD.floor} lw={lw} />
              <Crew look={CAST.clerkC} x={1330} y={FD.floor} h={400} frame={f} seed={14} flip
                pose={{...IDLE, armR: {a: 70, b: 40}, armL: {a: 50, b: 60}, lookX: 0.4, mouth: 'smile'}} />
            </g>
          )} />
        {gr > 0 ? (
          <g>
            <defs><radialGradient id="glareC" cx={960} cy={540} r={Math.max(1, gr)} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF4D6" /><stop offset="0.75" stopColor={GLARE} /><stop offset="1" stopColor={GLARE} stopOpacity={0} /></radialGradient></defs>
            <circle cx={960} cy={540} r={gr} fill="url(#glareC)" opacity={Math.min(1, gr / 700)} />
          </g>
        ) : null}
        {clapIn > 0 && clapOut < 1 ? <BigClapper x={960} y={lerp(1500, 560, clapIn) + clapOut * 1000} s={0.95} rot={-4} clap={clap} /> : null}
      </Scene>
      {coverS > 0 ? <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}><BigClapper {...clapCover(coverS)} clap={1} /></svg> : null}
    </div>
  );
};
/** Event times for the sound cue sheet. */
export const WHYB_EV = {SW0, SW1, SW2, TOSS0, TOSS1, crankAngle};
