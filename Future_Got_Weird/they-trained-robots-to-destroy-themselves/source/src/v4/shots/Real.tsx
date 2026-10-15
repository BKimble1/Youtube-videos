// V4 REAL (150.5 → 190.4): transfer and robustness.
//   R1  the same standing robot, the same side view: a paper roll sweeps across and the training stage becomes the
//       foundry deck, the avatar becomes the F.02 (the roll covers the change completely)
//   R2  one stable side view: slack at the knee, an uneven plate under the foot, noisy sensors — each corrected
//   R3  pull back: a foundry the team had never visited
//   R4  back to the stage: the Crew make the simulation messy on purpose (weight, footing, timing, rounds)
//   R5  the airbag rehearsal: close on the foot at the ledge, track the descent, the landing fills the frame
//   R6  the foundry gets messy: monitors drop out, sparks; the policy keeps running and the robot pushes off
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T, blockStart} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, Tag, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp, toScreen, crewReach, rnd} from '../kit/scene';
import {RollWipe} from '../kit/roll';
import {FoundryView, StageView, FD} from '../sets/views';
import {rig, RPose} from '../rig/Robot2D';
import {stand, crouch, blend, A} from '../rig/poses';
import {ms} from '../rig/geom';
import {makeJump} from '../rig/jump';
import {TOE_X, ENTRY_X} from './Opening';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {Airbag, CameraIcon} from '../../components/Props';
import {FilmSetLights, TripodCam} from '../sets/props';
import {C, F} from '../../theme';

export const REAL_START = blockStart('B05') - 0.12;
export const REAL_END = blockStart('B06') - 0.12;
const T_SIMR = T('But a simulator') + 0.15;
const T_SLACK = T('Real joints have slack') - 0.05;
const T_FLOOR = T('floors aren’t perfectly') - 0.05;
const T_NOISY = T('and sensors are noisy') - 0.05;
const T_NEVER = T('And Figure says this jump') - 0.1;

/** The stable side view shared by Train's end and R1/R2. */
export const SIDE_S = 0.6;
export const SIDE_X = 180;
export const CAM_SIDE: Cam = {x: 230, y: 380, z: 2.05};
/** R2 creeps in on the same side view (no frozen holds); R3 pulls back from here. */
const CAM_SIDE2: Cam = {x: 236, y: 372, z: 2.3};
export const sidePose = (o: Partial<RPose> = {}): RPose => stand(SIDE_X, FD.deck.top, SIDE_S, {yaw: 0.8, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3}), ...o});

const robust = (tau: number) => {
  const p = sidePose();
  const r0 = rig(p, SIDE_S);
  const footN = r0.pts.ankleN;
  // slack: a decaying sway at the knee, then held
  const sl = seg(tau, T_SLACK + 0.2, T_SLACK + 1.4);
  const sway = sl > 0 && sl < 1 ? Math.sin(sl * Math.PI * 9) * (1 - sl) * 7 * SIDE_S : 0;
  p.x += sway;
  // uneven floor: a plate under the near foot tilts; the foot follows, the ankle corrects
  const tilt = smooth(seg(tau, T_FLOOR + 0.15, T_FLOOR + 0.55)) * 8;
  const lean = Math.sin(Math.PI * seg(tau, T_FLOOR + 0.25, T_FLOOR + 1.1)) * 3;
  p.rot += lean;
  if (p.footN && tilt > 0) p.footN = {...p.footN, y: p.footN.y - tilt * 1.6, pitch: tilt};
  // noisy sensors: tiny head jitter that settles
  const nz = seg(tau, T_NOISY + 0.1, T_NOISY + 1.2);
  if (nz > 0 && nz < 1) p.head += Math.sin(nz * 80) * 1.6 * (1 - nz);
  return {pose: p, tilt, foot: footN, sway: sl, nz};
};

export const Real: React.FC = () => {
  const f = useCurrentFrame();
  const tau = REAL_START + f / 30;

  // ---------------------------------------------- R1/R2: transfer + robustness (one stable side view)
  if (tau < T_NEVER) {
    const cam = mixCam(CAM_SIDE, CAM_SIDE2, smooth(seg(tau, T_SIMR + 0.62, T_NEVER)));
    const lw = 4 / cam.z;
    const st = robust(tau);
    const r = rig(st.pose, SIDE_S);
    const kneeS = toScreen(cam, r.pts.kneeN[0], r.pts.kneeN[1]);
    const footS = toScreen(cam, r.pts.ankleN[0], r.pts.ankleN[1] + 30);
    const headS = toScreen(cam, r.pts.visor[0], r.pts.visor[1]);
    const plate = (
      <g transform={`rotate(${-st.tilt} ${st.foot[0] - 50} ${FD.deck.top})`}>
        <rect x={st.foot[0] - 50} y={FD.deck.top - 9} width={130} height={9} fill="#6E7882" stroke="#120C10" strokeWidth={lw} />
      </g>
    );
    const kHl = Math.max(0, Math.sin(Math.PI * seg(tau, T_SLACK + 1.0, T_SLACK + 1.6)));
    const aHl = Math.max(0, Math.sin(Math.PI * seg(tau, T_FLOOR + 0.5, T_FLOOR + 1.3)));
    const hl = {kneeN: {color: C.teal, amount: kHl}, ankleN: {color: C.teal, amount: aHl}};
    const foundry = (
      <Scene bg="#221A21">
        <FoundryView cam={cam} t={tau} glow={0.9} extraBack={<FilmSetLights lw={4 / cam.z} id="fsR2" />} behind={<>{st.tilt > 0 ? plate : null}<Bot cam={cam} id="rR" model="F02" s={SIDE_S} pose={st.pose} hl={hl} /></>} />
      </Scene>
    );
    const stage = (
      <Scene bg="#EEF4FD">
        <StageView cam={cam} grid={0.25} front={<Bot cam={cam} id="rS" model="SIM" s={SIDE_S} pose={sidePose()} />} />
      </Scene>
    );
    const k = seg(tau, T_SIMR, T_SIMR + 0.62);
    // noisy sensor readout (a jittery trace that settles once filtered)
    const nzK = seg(tau, T_NOISY, T_NOISY + 0.3) * (1 - seg(tau, T_NEVER - 0.3, T_NEVER));
    const trace = Array.from({length: 40}, (_, i) => {
      const x = headS.x + 130 + i * 9;
      const calm = smooth(seg(tau, T_NOISY + 0.8, T_NOISY + 1.3));
      const y = headS.y + 40 + (Math.sin(i * 1.7 + tau * 40) * 18 + Math.sin(i * 0.7 + tau * 23) * 10) * (1 - calm) + Math.sin(i * 0.25) * 6 * calm;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return (
      <div style={{position: 'absolute', inset: 0}}>
        <RollWipe k={k} dir={-1} before={stage} after={foundry} tone="steel" />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <Tag ax={kneeS.x} ay={kneeS.y} x={kneeS.x + 160} y={kneeS.y - 40} text="joint slack" k={seg(tau, T_SLACK + 0.1, T_SLACK + 0.45) * (1 - seg(tau, T_FLOOR - 0.2, T_FLOOR))} />
          <Tag ax={footS.x} ay={footS.y} x={footS.x + 180} y={footS.y + 60} text="uneven floor" k={seg(tau, T_FLOOR + 0.1, T_FLOOR + 0.45) * (1 - seg(tau, T_NOISY - 0.2, T_NOISY))} />
          {nzK > 0 ? (
            <g opacity={nzK}>
              <rect x={headS.x + 110} y={headS.y - 30} width={400} height={140} rx={16} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <path d={'M' + trace.join('L')} fill="none" stroke={C.coral} strokeWidth={4} strokeLinejoin="round" />
              <text x={headS.x + 130} y={headS.y + 2} fontFamily='"Nunito Variable", sans-serif' fontWeight={800} fontSize={28} fill={C.ink}>noisy sensors</text>
              <line x1={headS.x + 20} y1={headS.y} x2={headS.x + 110} y2={headS.y + 20} stroke={C.ink} strokeWidth={4} />
            </g>
          ) : null}
        </svg>
      </div>
    );
  }
  if (tau < T_FIX - 0.1) return <R3 tau={tau} />;
  if (tau < T_FIX + 0.52) return <RollWipe k={seg(tau, T_FIX - 0.1, T_FIX + 0.52)} dir={1} before={<R3 tau={tau} />} after={<R4 tau={tau} f={f} />} tone="blueprint" />;
  if (tau < T_CUT) return <R4 tau={tau} f={f} />;
  if (tau < T_DIDGET - 0.3) return <R5 tau={tau} f={f} />;
  if (tau < T_DIDGET + 0.32) return <RollWipe k={seg(tau, T_DIDGET - 0.3, T_DIDGET + 0.32)} dir={-1} before={<R5 tau={tau} f={f} />} after={<R6 tau={tau} f={f} />} tone="steel" />;
  return <R6 tau={tau} f={f} />;
};

// ---------------------------------------------------------------- cues for R3–R6
const T_FIX = T('A common fix');
const T_MESSY = T('make the simulation messy');
const T_WEIGHT = T('Change the weight');
const T_FOOT = T('the footing');
const T_TIME = T('the timing');
const T_ROUND = T('a little every round');
const T_PERFECT = T('one perfect world');
const T_DONT = T('We don’t know which');
const T_ALSO = T('It also rehearsed');
const T_JUMPING = T('jumping from a second');
const T_BAGS = T('giant airbags');
const T_DIDGET = T('And the foundry did');
const T_HEAT = T('Figure says the heat');
const T_EMI = T('electromagnetic noise');
const T_CAMS = T('knocked out cameras');
const T_ELEC = T('other electronics');
const T_KEPT = T('kept running');
const T_CUT = T_ALSO - 0.05;                       // match cut: the avatar's foot at the tower edge → the F.02's foot at a ledge

const K0 = crouch(TOE_X, FD.deck.top, SIDE_S);
const R3CAM: Cam = {x: 620, y: 520, z: 0.82};
const R3END: Cam = {x: 660, y: 512, z: 0.87};

// ---------------------------------------------------------------- R3: a foundry the team had never visited
const R3: React.FC<{tau: number}> = ({tau}) => {
  const u = easeInOut(seg(tau, T_NEVER, T_NEVER + 2.2));
  const cam = mixCam(mixCam(CAM_SIDE2, R3CAM, u), R3END, smooth(seg(tau, T_NEVER + 2.2, T_FIX - 0.1)));
  return (
    <Scene bg="#221A21" over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'a foundry the team had never visited']} k={seg(tau, T_NEVER + 0.5, T_NEVER + 0.9) * (1 - seg(tau, T_FIX - 0.5, T_FIX - 0.2))} size={38} />}>
      <FoundryView cam={cam} t={tau} extraBack={<FilmSetLights lw={4 / cam.z} id="fsR3" />} behind={<Bot cam={cam} id="rR3" model="F02" s={SIDE_S} pose={sidePose({head: 8 * u})} />} />
    </Scene>
  );
};

// ---------------------------------------------------------------- R4: make the simulation messy on purpose
const CAM_V: Cam = {x: 420, y: 560, z: 1.15};
const CAM_FOOT_ST: Cam = {x: TOE_X + 6, y: FD.deck.top - 34, z: 4.0};
const ROUND_CARDS = [{w: 0.6, ice: true, dt: -1}, {w: 1.0, ice: false, dt: 1}, {w: 0.3, ice: true, dt: 0}, {w: 0.8, ice: false, dt: -1}];

const MiniIcons: React.FC<{w: number; ice: boolean; dt: number}> = ({w, ice, dt}) => (
  <g>
    <rect x={-70} y={-30} width={36 + 30 * w} height={40 + 30 * w} rx={8} fill="#55595F" stroke={C.ink} strokeWidth={4} transform={`translate(0 ${-30 * w})`} />
    <rect x={10} y={2} width={60} height={14} rx={4} fill={ice ? '#BDEBFF' : '#C7DAF6'} stroke={C.ink} strokeWidth={3} />
    <g transform="translate(40 -40)">
      <circle r={22} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
      <line x1={0} y1={0} x2={Math.sin(dt * 0.9) * 16} y2={-Math.cos(dt * 0.9) * 16} stroke={C.coral} strokeWidth={4} strokeLinecap="round" />
    </g>
  </g>
);

const R4: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  let cam = mixCam(R3END, CAM_V, easeInOut(seg(tau, T_FIX + 0.55, T_MESSY + 0.9)));
  cam = mixCam(cam, CAM_FOOT_ST, easeIn(seg(tau, T_DONT + 1.25, T_CUT)));
  const lw = 4 / cam.z;
  const toCrouch = smooth(seg(tau, T_FIX + 0.6, T_FIX + 1.5));
  const p = blend(sidePose(), K0, toCrouch);
  const wK = smooth(seg(tau, T_WEIGHT + 0.25, T_WEIGHT + 0.5));
  p.y += 7 * wK;
  const iceK = easeInOut(seg(tau, T_FOOT - 0.05, T_FOOT + 0.35));
  const slip = Math.sin(Math.PI * seg(tau, T_FOOT + 0.35, T_FOOT + 0.8)) * 5;
  if (p.footN) p.footN = {...p.footN, x: p.footN.x + slip};
  // crew: A clips a weight pack on; C holds a stopwatch; B holds the question
  const ca = {x: lerp(-520, 40, easeOut(seg(tau, T_MESSY - 0.4, T_MESSY + 0.4))), y: FD.deck.top, h: 380};
  const r0 = rig(p, SIDE_S);
  const back = r0.pts.waist;
  const reachA = tau > T_WEIGHT - 0.3 && tau < T_WEIGHT + 0.6 ? crewReach(ca, 1, back[0] - 30, back[1] - 40) : {a: 16, b: 20};
  const cc = {x: lerp(1700, 1200, easeOut(seg(tau, T_TIME - 0.6, T_TIME - 0.1))), y: FD.floor, h: 380, flip: true};
  const watch = Math.floor((tau - T_TIME) * 3) * 37 + (tau > T_TIME ? Math.sin((tau - T_TIME) * 9) * 20 : 0);
  const qK = seg(tau, T_DONT - 0.2, T_DONT + 0.25);
  const cardsK = (i: number) => seg(tau, T_ROUND + i * 0.18, T_ROUND + 0.3 + i * 0.18) * (1 - seg(tau, T_DONT - 0.4, T_DONT - 0.1));
  const perfK = seg(tau, T_PERFECT - 0.6, T_PERFECT - 0.2) * (1 - seg(tau, T_DONT - 0.4, T_DONT - 0.1));
  const perfX = seg(tau, T_PERFECT + 0.45, T_PERFECT + 0.75);
  const clear = 1 - seg(tau, T_DONT + 1.0, T_DONT + 1.3);
  return (
    <Scene bg="#EEF4FD"
      over={<Chip x={100} y={64} lines={['A COMMON FIX', 'make the simulation messy on purpose']} k={seg(tau, T_MESSY - 0.1, T_MESSY + 0.3) * (1 - seg(tau, T_DONT - 0.3, T_DONT))} size={38} tone="blue" />}>
      <StageView cam={cam} grid={0.25}
        behind={(
          <g>
            {iceK > 0 ? (
              <g>
                <defs><clipPath id="iceClip"><rect x={60} y={FD.deck.top - 20} width={240 * iceK} height={40} /></clipPath></defs>
                <g clipPath="url(#iceClip)">
                  <rect x={60} y={FD.deck.top - 10} width={240} height={14} rx={4} fill="#BDEBFF" stroke={C.ink} strokeWidth={lw} />
                  {[100, 170, 240].map((x) => <line key={x} x1={x} y1={FD.deck.top - 7} x2={x + 26} y2={FD.deck.top - 7} stroke="#FFFFFF" strokeWidth={lw * 1.4} strokeLinecap="round" />)}
                </g>
              </g>
            ) : null}
          </g>
        )}
        front={(
          <g>
            <Bot cam={cam} id="rV" model="SIM" s={SIDE_S} pose={p}
              after={wK > 0 ? {torso: (r) => <g transform={ms(r.M.torso)}><rect x={-78} y={-140} width={42} height={70} rx={10} fill="#55595F" stroke={C.ink} strokeWidth={4 / (cam.z * SIDE_S)} transform={`translate(${(1 - wK) * -80} 0)`} /></g>} : {}} />
            {clear > 0 ? (
              <g opacity={clear}>
                <Crew look={CAST.clerkA} x={ca.x} y={ca.y} h={ca.h} frame={f} seed={3} front="R" pose={{...IDLE, armR: reachA, armL: {a: 14, b: 18}, lookX: 0.8, lookY: 0.2, mouth: 'smile'}} />
                <Crew look={CAST.clerkC} x={cc.x} y={cc.y} h={cc.h} flip frame={f} seed={14} front="R"
                  holdR={<g transform="scale(0.9)"><circle r={34} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} /><rect x={-8} y={-48} width={16} height={14} fill={C.ink} /><line x1={0} y1={0} x2={Math.sin((watch * Math.PI) / 180) * 24} y2={-Math.cos((watch * Math.PI) / 180) * 24} stroke={C.coral} strokeWidth={5} strokeLinecap="round" /></g>}
                  pose={{...IDLE, armR: {a: 80, b: 70}, armL: {a: 14, b: 18}, lookX: 0.5, lookY: -0.2, mouth: qK > 0 ? 'hmm' : 'smile', brows: qK > 0 ? 0.6 : 0}} />
              </g>
            ) : null}
          </g>
        )} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {(() => {
          const w = toScreen(cam, back[0] - 60, back[1] - 60);
          const ft = toScreen(cam, 200, FD.deck.top - 6);
          const sw = toScreen(cam, cc.x - 120, FD.floor - 330);
          return (
            <g opacity={clear}>
              <Tag ax={w.x} ay={w.y} x={w.x - 380} y={w.y + 230} text="+ weight" k={seg(tau, T_WEIGHT + 0.2, T_WEIGHT + 0.5) * (1 - seg(tau, T_ROUND, T_ROUND + 0.3))} size={36} />
              <Tag ax={ft.x} ay={ft.y} x={ft.x - 420} y={ft.y + 110} text="slippery footing" k={seg(tau, T_FOOT + 0.2, T_FOOT + 0.5) * (1 - seg(tau, T_ROUND, T_ROUND + 0.3))} size={36} />
              <Tag ax={sw.x} ay={sw.y} x={sw.x - 300} y={sw.y - 140} text="timing" k={seg(tau, T_TIME + 0.1, T_TIME + 0.4) * (1 - seg(tau, T_ROUND, T_ROUND + 0.3))} size={36} />
            </g>
          );
        })()}
        {/* every round a little different */}
        {ROUND_CARDS.map((c, i) => {
          const k = cardsK(i);
          if (k <= 0) return null;
          const x = 980 + i * 200, y = 820;
          return (
            <g key={i} transform={`translate(${x} ${y + (1 - easeOut(k)) * 300}) rotate(${(i - 1.5) * 6})`}>
              <rect x={-90} y={-130} width={180} height={230} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={5} />
              <text x={0} y={-90} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={26} fill={C.inkSoft}>round {i + 1}</text>
              <g transform="translate(0 30)"><MiniIcons {...c} /></g>
            </g>
          );
        })}
        {perfK > 0 ? (
          <g transform={`translate(560 760) scale(${0.8 + 0.2 * easeOut(perfK)})`} opacity={Math.min(1, perfK * 2.5)}>
            <rect x={-170} y={-120} width={340} height={230} rx={18} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
            <circle cx={0} cy={-20} r={60} fill={C.tealLight} stroke={C.ink} strokeWidth={5} />
            <path d="M-34 -20 L-10 4 L36 -44" fill="none" stroke={C.tealDeep} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            <text x={0} y={80} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.ink}>one perfect world</text>
            {perfX > 0 ? <path d="M-150 -100 L150 100 M150 -100 L-150 100" stroke={C.coral} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${400 * perfX} 800`} /> : null}
          </g>
        ) : null}
        {qK > 0 && clear > 0 ? (
          <g transform={`translate(960 330) scale(${0.85 + 0.15 * easeOut(qK)})`} opacity={Math.min(1, qK * 2.5) * clear}>
            <rect x={-420} y={-110} width={840} height={220} rx={22} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <text x={-380} y={-24} fontFamily={F.body} fontWeight={800} fontSize={42} fill={C.ink}>which variations Figure used</text>
            <text x={-380} y={52} fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>not something we know</text>
            <circle cx={300} cy={0} r={78} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
            <text x={300} y={34} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={100} fill={C.ink}>?</text>
          </g>
        ) : null}
      </svg>
    </Scene>
  );
};

// ---------------------------------------------------------------- R5: the airbag rehearsal (a test hall, second floor → airbag)
const HALL = {ledge: 300, floor: 1000, bagX: 860, bagS: 1.4};
const BAG_TOP = HALL.floor - 170 * HALL.bagS;
const HJ_PUSH = T_JUMPING - 0.75;
const HJ = makeJump({toeX: TOE_X, deckY: HALL.ledge, endX: HALL.bagX, endY: BAG_TOP + 8, s: SIDE_S, tPush: HJ_PUSH, tTO: HJ_PUSH + 0.38, tEnd: T_BAGS + 0.05, apex: 50 * SIDE_S,
  rate: [[HJ_PUSH + 0.38, 1], [HJ_PUSH + 0.7, 0.42], [T_BAGS - 0.35, 0.42], [T_BAGS + 0.05, 1]], outcome: 'stick', landX: HALL.bagX});
const CAM_FOOT_H: Cam = {x: CAM_FOOT_ST.x, y: HALL.ledge - 34, z: 4.0};
const CAM_BAG: Cam = {x: HALL.bagX, y: 610, z: 1.75};

const HallBack: React.FC<{lw: number}> = ({lw}) => (
  <g>
    <rect x={-3000} y={-1500} width={7000} height={2500} fill="#596069" />
    {Array.from({length: 26}, (_, i) => <line key={i} x1={-2000 + i * 200} y1={-1500} x2={-2000 + i * 200} y2={HALL.floor} stroke="#4C525A" strokeWidth={lw * 1.2} />)}
    {[-300, 500, 1300].map((x) => (
      <g key={x}>
        <rect x={x} y={-420} width={300} height={300} rx={6} fill="#AFC4D8" stroke="#1E2329" strokeWidth={lw} />
        <path d={`M${x} -120 L${x + 300} -120 L${x + 640} ${HALL.floor} L${x + 200} ${HALL.floor} Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
    ))}
    <rect x={-3000} y={HALL.floor} width={7000} height={1200} fill="#3A3E44" />
    <line x1={-3000} y1={HALL.floor} x2={4000} y2={HALL.floor} stroke="#1E2329" strokeWidth={lw} />
  </g>
);
const Mezz: React.FC<{lw: number}> = ({lw}) => (
  <g>
    {[-700, 0, 240].map((x) => <rect key={x} x={x - 22} y={HALL.ledge + 50} width={44} height={HALL.floor - HALL.ledge - 50} fill="#7A8088" stroke="#1E2329" strokeWidth={lw} />)}
    <rect x={-1600} y={HALL.ledge} width={1600 + FD.deck.edge} height={50} fill="#8A9097" stroke="#1E2329" strokeWidth={lw} />
    <rect x={-1600} y={HALL.ledge} width={1600 + FD.deck.edge} height={10} fill="#A3A9B0" />
    {Array.from({length: 4}, (_, i) => <path key={i} d={`M${FD.deck.edge - 30 - i * 60} ${HALL.ledge + 14} l30 0 l-14 28 l-30 0 Z`} fill="#F2B632" />)}
    <path d={`M-1600 ${HALL.ledge - 90} L120 ${HALL.ledge - 90} M-1600 ${HALL.ledge - 46} L120 ${HALL.ledge - 46}`} stroke="#E8A928" strokeWidth={lw * 2} />
    {[-1400, -1000, -600, -200, 120].map((x) => <line key={x} x1={x} y1={HALL.ledge - 92} x2={x} y2={HALL.ledge} stroke="#E8A928" strokeWidth={lw * 2} />)}
  </g>
);

const R5: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const st = HJ.pose(tau);
  const r = rig(st.pose, SIDE_S);
  const pel = r.pts.pelvis;
  let cam: Cam = {...CAM_FOOT_H, z: lerp(4.0, 4.3, seg(tau, T_CUT, HJ_PUSH))};
  const follow = easeInOut(seg(tau, HJ_PUSH + 0.1, HJ_PUSH + 0.9));
  if (follow > 0) cam = {x: lerp(cam.x, pel[0] + 70, follow), y: lerp(cam.y, pel[1] - 60, follow), z: lerp(cam.z, 2.1, follow)};
  cam = mixCam(cam, CAM_BAG, easeInOut(seg(tau, T_BAGS - 0.05, T_BAGS + 0.45)));
  const lw = 4 / cam.z;
  const d = tau - (T_BAGS + 0.05);
  const squash = d > 0 ? Math.exp(-d * 3.2) * Math.abs(Math.cos(d * 9)) * 1.0 : 0;
  const sink = d > 0 ? (1 - Math.exp(-d * 9)) * 26 + squash * 34 : 0;
  const pose = d > 0 ? {...st.pose, y: st.pose.y + sink, footN: st.pose.footN && {...st.pose.footN, y: st.pose.footN.y + sink}, footF: st.pose.footF && {...st.pose.footF, y: st.pose.footF.y + sink}} : st.pose;
  const puffs = d > 0 && d < 0.8 ? [-1, 1].map((sx) => (
    <g key={sx} opacity={1 - d / 0.8}>
      {[0, 1, 2].map((i) => <path key={i} d={`M${HALL.bagX + sx * (200 + d * 260 + i * 30)} ${BAG_TOP + 30 - i * 26} q${sx * 30} -20 ${sx * 60} 0`} fill="none" stroke="#FFFFFF" strokeWidth={lw * 2} strokeLinecap="round" />)}
    </g>
  )) : null;
  return (
    <Scene bg="#596069" over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'rehearsals: from a second floor onto giant airbags']} k={seg(tau, T_ALSO + 0.3, T_ALSO + 0.7) * (1 - seg(tau, T_DIDGET - 0.6, T_DIDGET - 0.3))} size={38} />}>
      <Layer cam={cam}>
        <HallBack lw={lw} />
        <Mezz lw={lw} />
        <Airbag x={HALL.bagX} y={HALL.floor} s={HALL.bagS} squash={squash} />
        <Crew look={CAST.clerkC} x={1340} y={HALL.floor} h={380} flip frame={f} seed={14}
          holdL={<g><rect x={-40} y={-10} width={80} height={104} rx={8} fill="#C9924F" stroke={C.ink} strokeWidth={4} /><rect x={-32} y={4} width={64} height={80} rx={4} fill="#FFFDF6" /></g>}
          pose={{...IDLE, armL: {a: 40, b: 70}, armR: {a: d > 0.2 ? 150 : 14, b: d > 0.2 ? -20 : 18}, lookX: 0.6, lookY: -0.6, mouth: d > 0.2 ? 'grin' : 'o', brows: 0.5}} />
        <Bot cam={cam} id="rH" model="F02" s={SIDE_S} pose={pose} />
        {puffs}
      </Layer>
    </Scene>
  );
};

// ---------------------------------------------------------------- R6: the foundry gets messy; the policy keeps running
export const PAYOFF = makeJump({toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X, endY: FD.ladle.surf, s: SIDE_S, tPush: T_KEPT - 0.38, tTO: T_KEPT, tEnd: T('survive') + 0.15, apex: 110 * SIDE_S,
  rate: [[T_KEPT, 1], [T_KEPT + 0.32, 0.1], [T('survive') - 0.55, 0.1], [T('survive') - 0.15, 1], [T('survive') + 0.15, 1]]});
const CAM_MESS: Cam = {x: 760, y: 470, z: 1.0};
export const CAM_REAL_END: Cam = {x: 430, y: 380, z: 1.5};
const EDGE_STAND = stand(250, FD.deck.top, SIDE_S, {yaw: 0.8, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3})});

export const Monitor: React.FC<{x: number; y: number; lw: number; state: number; t: number; id: number}> = ({x, y, lw, state, t, id}) => (
  <g>
    <rect x={x - 80} y={y - 55} width={160} height={110} rx={8} fill="#1A1D21" stroke={FCOL_INK} strokeWidth={lw} />
    {state < 0.5 ? (
      <g>
        <rect x={x - 68} y={y - 43} width={136} height={86} fill="#2E4A6E" />
        <path d={`M${x - 60} ${y + 20} L${x - 30} ${y} L${x} ${y + 12} L${x + 30} ${y - 18} L${x + 60} ${y - 6}`} fill="none" stroke="#7FD3C9" strokeWidth={lw * 1.2} />
      </g>
    ) : state < 1.5 ? (
      <g>
        <rect x={x - 68} y={y - 43} width={136} height={86} fill="#8A8F96" />
        {Array.from({length: 40}, (_, i) => <rect key={i} x={x - 68 + Math.floor(rnd(i * 13 + Math.floor(t * 30) * 7 + id) * 128)} y={y - 43 + Math.floor(rnd(i * 17 + Math.floor(t * 30) * 3 + id) * 80)} width={8} height={5} fill={rnd(i + Math.floor(t * 30)) > 0.5 ? '#FFFFFF' : '#2B2E33'} />)}
      </g>
    ) : (
      <g>
        <rect x={x - 68} y={y - 43} width={136} height={86} fill="#0B0C0F" />
        <text x={x} y={y + 8} textAnchor="middle" fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={18} fill={C.coral}>NO SIGNAL</text>
      </g>
    )}
  </g>
);
const FCOL_INK = '#120C10';

const R6: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const cam = mixCam(mixCam(CAM_MESS, {x: 720, y: 460, z: 1.1}, smooth(seg(tau, T_DIDGET, T_KEPT - 1.4))), CAM_REAL_END, easeInOut(seg(tau, T_KEPT - 1.4, REAL_END)));
  const lw = 4 / cam.z;
  const toCrouch = smooth(seg(tau, T_KEPT - 1.3, T_KEPT - 0.45));
  const p = tau < PAYOFF_T0 ? blend(EDGE_STAND, PAYOFF.K0, toCrouch) : PAYOFF.pose(tau).pose;
  const mon = tau < T_CAMS ? 0 : tau < T_CAMS + 0.7 ? 1 : 2;
  const mon2 = tau < T_ELEC ? 0 : tau < T_ELEC + 0.5 ? 1 : 2;
  const emi = seg(tau, T_EMI - 0.2, T_EMI + 0.3);
  const L = FD.ladle;
  const rings = emi > 0 ? [0, 1, 2].map((i) => {
    const ph = ((tau - T_EMI) * 0.7 + i / 3) % 1;
    const R = 120 + ph * 900;
    const n = 48;
    const d = Array.from({length: n + 1}, (_, k) => {
      const a = (k / n) * Math.PI * 2;
      const rr = R + (k % 2 ? 14 : -14);
      return `${(L.cx + Math.cos(a) * rr).toFixed(1)} ${(L.surf - 40 + Math.sin(a) * rr * 0.6).toFixed(1)}`;
    }).join('L');
    return <path key={i} d={'M' + d + 'Z'} fill="none" stroke="#FFE08A" strokeWidth={lw * 2} opacity={(1 - ph) * 0.55 * emi * (1 - seg(tau, REAL_END - 0.6, REAL_END))} />;
  }) : null;
  const camPole = {x: 1180, y: 560};
  const spark = (x: number, y: number, t0: number) => tau > t0 && tau < t0 + 0.6 ? (
    <g>{Array.from({length: 7}, (_, i) => { const a = rnd(i * 5 + 1) * Math.PI * 2; const u = (tau - t0) / 0.6; return <line key={i} x1={x + Math.cos(a) * 10 * u} y1={y + Math.sin(a) * 10 * u} x2={x + Math.cos(a) * (20 + 60 * u)} y2={y + Math.sin(a) * (20 + 60 * u) + 40 * u * u} stroke="#FFE08A" strokeWidth={lw * 1.6} strokeLinecap="round" opacity={1 - u} />; })}</g>
  ) : null;
  const r = rig(p, SIDE_S);
  const headS = toScreen(cam, r.pts.head[0], r.pts.head[1]);
  const polK = seg(tau, T_KEPT - 0.9, T_KEPT - 0.6) * (1 - seg(tau, REAL_END - 0.45, REAL_END));
  const monS = toScreen(cam, FD.booth.x0 + 140, FD.booth.y0 + 140);
  const poleS = toScreen(cam, camPole.x, camPole.y);
  return (
    <Scene bg="#221A21" over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'heat and electromagnetic noise knocked out cameras']} k={seg(tau, T_HEAT + 0.1, T_HEAT + 0.5) * (1 - seg(tau, T_KEPT - 1.2, T_KEPT - 0.9))} size={38} />}>
      <FoundryView cam={cam} t={tau} glow={1.2} extraBack={<FilmSetLights lw={lw} id="fsR6" />}
        booth={(
          <g>
            <Monitor x={FD.booth.x0 + 140} y={FD.booth.y0 + 140} lw={lw} state={mon} t={tau} id={1} />
            <Monitor x={FD.booth.x0 + 320} y={FD.booth.y0 + 140} lw={lw} state={mon2} t={tau} id={2} />
          </g>
        )}
        behind={<Bot cam={cam} id="rM" model="F02" s={SIDE_S} pose={p} />}
        front={(
          <g>
            {rings}
            <TripodCam x={1330} y={FD.floor} lw={lw} />
            <Crew look={CAST.clerkA} x={-120} y={FD.floor} h={400} frame={f} seed={3}
              holdL={<g><rect x={-40} y={-10} width={80} height={104} rx={8} fill="#C9924F" stroke={C.ink} strokeWidth={4} /><rect x={-32} y={4} width={64} height={80} rx={4} fill="#FFFDF6" /></g>}
              pose={{...IDLE, armL: {a: 40, b: 70}, armR: {a: 12, b: 14}, lookX: 0.8, lookY: -0.2, mouth: 'flat'}} />
            <Crew look={CAST.clerkC} x={1480} y={FD.floor} h={400} frame={f} seed={14} flip pose={{...IDLE, armR: {a: 70, b: 40}, armL: {a: 50, b: 60}, lookX: 0.4, mouth: tau > T_CAMS ? 'o' : 'flat', brows: tau > T_CAMS ? 0.6 : 0}} />
            <rect x={camPole.x - 8} y={camPole.y + 30} width={16} height={FD.floor - camPole.y - 30} fill="#3A3D44" stroke={FCOL_INK} strokeWidth={lw} />
            <CameraIcon x={camPole.x} y={camPole.y} s={0.9} broken={seg(tau, T_CAMS + 0.1, T_CAMS + 0.4)} />
            {spark(camPole.x, camPole.y, T_CAMS + 0.1)}
            {spark(FD.booth.x0 + 320, FD.booth.y0 + 140, T_ELEC)}
          </g>
        )} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <Tag ax={monS.x} ay={monS.y} x={monS.x - 380} y={monS.y + 190} text="cameras" k={seg(tau, T_CAMS + 0.3, T_CAMS + 0.6) * (1 - seg(tau, T_KEPT - 1.0, T_KEPT - 0.7))} size={36} color={C.coral} />
        <Tag ax={poleS.x} ay={poleS.y} x={poleS.x + 60} y={poleS.y + 180} text="electronics" k={seg(tau, T_ELEC + 0.1, T_ELEC + 0.4) * (1 - seg(tau, T_KEPT - 1.0, T_KEPT - 0.7))} size={36} color={C.coral} />
        {polK > 0 ? (
          <g transform={`translate(${headS.x - 40} ${headS.y - 150}) scale(${0.8 + 0.2 * easeOut(polK)})`} opacity={Math.min(1, polK * 2.5)}>
            <circle cx={0} cy={0} r={92 + 16 * Math.sin(tau * 12)} fill="none" stroke={C.teal} strokeWidth={6} opacity={0.6} />
            <rect x={-110} y={-36} width={220} height={72} rx={18} fill={C.ink} stroke={C.ink} strokeWidth={4} />
            <text x={-14} y={14} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={36} fill={C.paper}>POLICY</text>
            <path d="M66 -14 L90 0 L66 14 Z" fill={C.teal} />
          </g>
        ) : null}
      </svg>
    </Scene>
  );
};
const PAYOFF_T0 = T_KEPT - 0.38;
/** Event times for the sound cue sheet. */
export const REAL_EV = {T_SIMR, T_FIX, T_CUT, HJ_PUSH, PAYOFF_T0, T_DIDGET};
