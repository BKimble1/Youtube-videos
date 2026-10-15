// V5 PROVE ("So what does it prove?" → "…and work things out.")
//   P1  the ripple where it went in settles into the target's rings; the camera rises back along the arc it flew
//   P2  the whole room: arc, target, dead monitors, broken camera, heat; it worked (one check at the target)
//   P3  the limits, shown on the set itself: one movement (the arc's poses), one kind of target (the rings pulse),
//       prepared (floor tape, barriers, lights), supervised (the crew at work); viewfinder brackets close around it all
//   P4  the camera trucks right, out through the brackets' edge, into an ordinary parts line: one unfamiliar task
//       (a spilled tote across the aisle). The trained avatar stops and can only offer the one movement it learned.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Layer, Bot, mixCam, seg, smooth, easeInOut, easeOut, backOut, lerp, toScreen, rnd} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {FCOL} from '../../v4/sets/foundry';
import {Splash6} from '../sets/splash6';
import {Arc, TGT_X} from '../../v4/sets/stage';
import {FilmLight, TripodCam, Mark} from '../../v4/sets/props';
import {BayBack, BCOL} from '../../v4/sets/bay';
import {RPose} from '../../v4/rig/Robot2D';
import {blend} from '../../v4/rig/poses';
import {makeJump5} from '../rig/jump5';
import {walkStop, leadFootX, STOP_DUR} from '../rig/stop';
import {smoothCam} from '../kit/cam5';
import {Panel, PANEL, HookLine, PL} from '../sets/plant';
import {S_HK} from './Hook';
import {REAL_END, PAY_HIT, PAY_JUMP, CAM_REAL_END, MonitorScreen} from './Real';
import {CameraIcon} from '../../components/Props';
import {Barrier, BARRIERS, SetCrew} from '../sets/setdress';
import {C, F} from '../../theme';

export const PROVE_START = REAL_END;
export const PROVE_END = T('So why is it uncomfortable') - 0.1;
const T_WHAT = T('So what does it prove');
const T_THAT = T('That a trained jump');
const T_SURV = T('survive');
const T_BRUTAL = T('brutal');
const T_BUT = T('But it was one');
const T_ONEMOVE = T('one movement');
const T_ONETGT = T('one kind of target');
const T_PREP = T('people prepared');
const T_SUPER = T('and supervised');
const T_NOT = T('That’s not a robot');
const T_WORK = T('work things out');

const S = S_HK;
const L = FD.ladle;
const SURF = L.surf;
const J = PAY_JUMP;

// ------------------------------------------------------------------ cameras
const CAM_UP: Cam = {x: 560, y: 540, z: 1.12};
const CAM_WIDE: Cam = {x: 820, y: 565, z: 0.94};
const CAM_WIDE2: Cam = {x: 840, y: 572, z: 0.9};
const PAN = 2400; // far enough that the seam (SEAM_X) leaves the frame completely
const T_PAN0 = T_NOT - 0.22, T_PAN1 = T_NOT + 1.0;
const setCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_REAL_END, CAM_UP, easeInOut(seg(t, PROVE_START + 0.05, T_THAT + 0.05)));
  c = mixCam(c, CAM_WIDE, easeInOut(seg(t, T_THAT + 0.1, T_SURV + 0.7)));
  c = mixCam(c, CAM_WIDE2, smooth(seg(t, T_BUT - 0.2, T_SUPER + 0.6)));
  return {...c, x: c.x + PAN * easeInOut(seg(t, T_PAN0, T_PAN1))};
};
const setCam = (t: number) => (t < T_PAN0 ? smoothCam(setCamRaw, t, 0.2) : setCamRaw(t));

/** World x of the prepared set's right edge: just outside the wide framing; it becomes the seam of the pan. */
const SEAM_X = 1990;

// ------------------------------------------------------------------ the prepared set
const FD_INK = '#120C10';
const ring = (r: number, w: number, lw: number, key: string) => <ellipse key={key} cx={TGT_X} cy={SURF} rx={r} ry={r * (L.sry / L.srx)} fill="none" stroke={C.teal} strokeWidth={lw * w} />;

const SetWorld: React.FC<{t: number; f: number; cam: Cam}> = ({t, f, cam}) => {
  const lw = 4 / cam.z;
  const tHit = t - PAY_HIT;
  const arcK = seg(t, PROVE_START + 0.05, T_THAT - 0.1);
  const arcPulse = Math.max(0, 1 - Math.abs(t - T_ONEMOVE - 0.2) / 0.5);
  const ringIn = backOut(seg(t, T_WHAT + 0.15, T_WHAT + 0.55), 1.6);
  const ringPulse = Math.max(0, 1 - Math.abs(t - T_ONETGT - 0.25) / 0.45);
  // V6: ONE ghost travels the path once on "one movement" (no stacked copies), then clears
  const G0 = T_ONEMOVE - 0.1, G1 = G0 + 1.1;
  const ghostK = seg(t, G0, G0 + 0.15) * (1 - seg(t, G1 - 0.2, G1));
  const ghostPose = J.pose(lerp(J.tTO - 0.1, J.tEnd - 0.08, easeInOut(seg(t, G0, G1 - 0.15)))).pose;
  const tape = easeOut(seg(t, T_PREP - 0.05, T_PREP + 0.55));
  const radio = smooth(seg(t, T_SUPER - 0.15, T_SUPER + 0.3));
  const tick = Math.sin(Math.PI * seg(t, T_SUPER, T_SUPER + 0.5));
  const heat = Math.max(0, 1 - Math.abs(t - T_BRUTAL - 0.2) / 0.6);
  const B = FD.booth;
  return (
    <FoundryView5 cam={cam} t={t} hook={false} id="pvf" glow={1 + 0.35 * heat} hit={tHit > 0 ? {x: TGT_X, t: tHit} : undefined}
      extraBack={<g><FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="pvA" /><FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="pvB" /></g>}
      booth={(
        <g>
          <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="#3A2C30" />
          <MonitorScreen x={B.x0 + 130} y={B.y0 + 125} w={150} h={96} lw={lw} state={2} t={t} id={1} />
          <MonitorScreen x={B.x0 + 330} y={B.y0 + 125} w={150} h={96} lw={lw} state={2} t={t} id={2} />
        </g>
      )}
      behind={(
        <g>
          <Arc pts={[...J.arc()].reverse()} k={arcK} lw={lw} color={C.teal} width={3 + 2 * arcPulse} />
          {ghostK > 0.01 ? <g opacity={0.6 * ghostK}><Bot cam={cam} id="pvg" model="SIM" s={S} pose={ghostPose} /></g> : null}
        </g>
      )}
      inside={(
        <>
          <Splash6 x={TGT_X} t={tHit} lw={lw} part="back" scale={1.1} />
          <Splash6 x={TGT_X} t={tHit} lw={lw} part="front" scale={1.1} />
          {ringIn > 0.01 ? (
            <g transform={`translate(${TGT_X} ${SURF}) scale(${ringIn * (1 + 0.18 * ringPulse)}) translate(${-TGT_X} ${-SURF})`}>
              {ring(92, 4 + 2 * ringPulse, lw, 'a')}{ring(46, 3.2 + 1.5 * ringPulse, lw, 'b')}
            </g>
          ) : null}
        </>
      )}
      front={(
        <g>
          {/* floor tape laid along the safety line */}
          {tape > 0 ? (
            <g>
              <clipPath id="pvTape"><rect x={320} y={FD.floor} width={(1290 - 320) * tape} height={80} /></clipPath>
              <g clipPath="url(#pvTape)">
                <rect x={320} y={FD.floor + 26} width={970} height={20} fill="#F2B632" stroke={FD_INK} strokeWidth={lw * 0.8} />
                {Array.from({length: 24}, (_, i) => <path key={i} d={`M${330 + i * 40} ${FD.floor + 26} l16 0 l-10 20 l-16 0 Z`} fill="#2B2930" />)}
              </g>
            </g>
          ) : null}
          {BARRIERS.map((x) => <Barrier key={x} x={x} lw={lw} />)}
          <TripodCam x={1180} y={FD.floor} lw={lw} />
          <CameraIcon x={1180} y={FD.floor - 430} s={0.6} broken={1} />
          <SetCrew f={f} tick={tick} radio={radio} checked={t > T_SUPER + 0.3 ? 3 : 2} />
        </g>
      )} />
  );
};

// ------------------------------------------------------------------ an ordinary parts line (factory world, s = 1)
const G = PL.floor;
const HOOK_Y = 470, HSP = 330, V = 140;
export const SPILL_X = 980;
const AV_X0 = -150, AV_STEPS = 4;
const AV_TOE = leadFootX(AV_X0, 1, AV_STEPS) + 40; // the jump-ready stance's near foot = the walk's last planted foot
const RING_X = 1640;
const T_WALK0 = T_NOT + 0.3, T_WALK1 = T_WORK - 0.55;
const AVJ = makeJump5({toeX: AV_TOE, deckY: G, endX: RING_X, endY: G, s: 1, tReady: T_WALK1 - 0.05, tPush: T_WORK + 0.3, tTO: T_WORK + 20, apex: 50, outcome: 'stick'});
/** The trained avatar in the aisle: walks in, stops before the spill, settles into its jump-ready crouch. */
const AV_WALK = {x0: AV_X0, ground: G, s: 1, n: AV_STEPS, o: {yaw: 0.5}, t0: T_WALK0, t1: T_WALK1, ready: AVJ.READY};
export const avatarPose = (t: number): RPose => {
  // n whole strides, a stop step into the jump-ready stance (planted foot never slides), then the crouch
  if (t < T_WALK1 + STOP_DUR) return walkStop(AV_WALK, t);
  return blend(AVJ.READY, AVJ.K0, smooth(seg(t, T_WORK - 0.1, T_WORK + 0.3)));
};
export const AV = {G, toe: AV_TOE, ringX: RING_X, j: AVJ, T_WORK};

export const Aisle: React.FC<{t: number; cam: Cam; children?: React.ReactNode; dim?: number}> = ({t, cam, children}) => {
  const lw = 4 / cam.z;
  const off = (t * V) % HSP;
  const hooks = Array.from({length: 22}, (_, i) => -2400 + i * HSP + off);
  return (
    <Layer cam={cam}>
      <BayBack lw={lw} />
      <HookLine x0={-2600} x1={4600} lw={lw} hooks={hooks} hookY={HOOK_Y} />
      {hooks.map((hx, i) => <Panel key={i} x={hx} y={HOOK_Y + PANEL.tab - 8 + PANEL.h / 2} lw={lw} tone={i % 3 === 0 ? 1 : 0} />)}
      {/* far station: a parts rack */}
      {[-1500, 2300].map((x) => (
        <g key={x}>
          {[0, 1, 2].map((r) => <rect key={r} x={x - 200} y={G - 160 - r * 210} width={400} height={18} fill="#4F7CC9" stroke={BCOL.ink} strokeWidth={lw} />)}
          {[-200, 182].map((dx) => <rect key={dx} x={x + dx} y={G - 600} width={18} height={600} fill="#3A5FA0" stroke={BCOL.ink} strokeWidth={lw} />)}
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + '-' + c} x={x - 180 + c * 120} y={G - 246 - r * 210} width={100} height={86} rx={6} fill={(r + c) % 2 ? C.woodLight : C.wood} stroke={BCOL.ink} strokeWidth={lw * 0.8} />))}
        </g>
      ))}
      {/* the unfamiliar task: a tote stand knocked over, its panels spilled across the aisle */}
      <g>
        <rect x={SPILL_X - 230} y={G - 20} width={210} height={14} rx={4} fill={BCOL.cart} stroke={BCOL.ink} strokeWidth={lw} transform={`rotate(-8 ${SPILL_X - 120} ${G})`} />
        <path d={`M${SPILL_X - 90} ${G} L${SPILL_X - 90} ${G - 196} L${SPILL_X + 56} ${G - 186} L${SPILL_X + 56} ${G - 10} Z`} fill={BCOL.toteD} stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
        <path d={`M${SPILL_X + 56} ${G - 186} L${SPILL_X + 80} ${G - 176} L${SPILL_X + 80} ${G - 4} L${SPILL_X + 56} ${G - 10} Z`} fill="#5E6C7A" stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
        <Panel x={SPILL_X + 120} y={G - 66} lw={lw} rot={58} />
        <Panel x={SPILL_X + 200} y={G - PANEL.w / 2 - 2} lw={lw} rot={90} tone={1} />
        <Panel x={SPILL_X + 330} y={G - PANEL.w / 2 - 2} lw={lw} rot={-92} />
        <Panel x={SPILL_X + 470} y={G - PANEL.w / 2 - 2} lw={lw} rot={84} />
      </g>
      {children}
    </Layer>
  );
};

/** The avatar and its useless offer (the one learned movement) drawn into the aisle. */
const AisleActors: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lw = 4 / cam.z;
  const offer = seg(t, T_WORK + 0.05, T_WORK + 0.45) * (1 - seg(t, PROVE_END - 0.4, PROVE_END - 0.08));
  return (
    <g>
      {offer > 0 ? (
        <g opacity={0.85 * offer}>
          <ellipse cx={RING_X} cy={G} rx={92} ry={18} fill="none" stroke={C.teal} strokeWidth={lw * 3.4} />
          <ellipse cx={RING_X} cy={G} rx={44} ry={9} fill="none" stroke={C.teal} strokeWidth={lw * 2.6} />
        </g>
      ) : null}
      {offer > 0 ? <Arc pts={AVJ.arc()} k={offer} lw={lw} color={C.teal} width={2.6} opacity={0.75} /> : null}
      <Bot cam={cam} id="pvAv" model="SIM" s={1} pose={avatarPose(t)} />
    </g>
  );
};

const CAM_F_END: Cam = {x: 640, y: 640, z: 0.82};
const ZF = CAM_WIDE2.z * S; // the aisle at the set's apparent scale during the pan
const FX0 = -620;           // aisle world x that sits on the seam

export const Prove: React.FC = () => {
  const f = useCurrentFrame() + Math.round(PROVE_START * 30);
  const t = f / 30;
  const cam = setCam(t);
  const lw = 4 / cam.z;
  const seamX = toScreen(cam, SEAM_X, 0).x;
  const floorY = toScreen(cam, 0, FD.floor).y;
  // the aisle camera: locked to the seam while the pan runs (same direction and speed), then it settles on the spill
  const aisleCamAt = (tt: number): Cam => {
    const c = setCamRaw(tt);
    const sx = toScreen(c, SEAM_X, 0).x;
    const fy = toScreen(c, 0, FD.floor).y;
    const locked: Cam = {x: FX0 - (sx - 960) / ZF, y: G - (fy - 540) / ZF, z: ZF};
    return mixCam(locked, CAM_F_END, easeInOut(seg(tt, T_PAN1 - 0.25, T_WORK + 0.2)));
  };
  const camF = aisleCamAt(t);
  const check = seg(t, T_SURV, T_SURV + 0.3) * (1 - seg(t, T_BUT - 0.2, T_BUT + 0.1));
  const tg = toScreen(cam, TGT_X + 170, SURF - 170);
  const showSet = seamX > -10;
  const showAisle = seamX < 1930;
  const q = backOut(seg(t, T_WORK + 0.2, T_WORK + 0.5), 1.7) * (1 - easeOut(seg(t, PROVE_END - 0.4, PROVE_END - 0.08)));
  const qs = toScreen(camF, SPILL_X + 280, G - 210);
  void lw; void F; void FCOL;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#221A21', overflow: 'hidden'}}>
      {showAisle ? (
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${Math.max(0, seamX)}px)`}}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, background: BCOL.wall}}>
            <Aisle t={t} cam={camF}><AisleActors t={t} cam={camF} /></Aisle>
            {q > 0.01 ? (
              <g transform={`translate(${qs.x} ${qs.y}) scale(${q})`}>
                <circle r={62} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
                <text y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={86} fill={C.ink}>?</text>
              </g>
            ) : null}
          </svg>
        </div>
      ) : null}
      {showSet ? (
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${Math.max(0, 1920 - seamX)}px 0 0)`}}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, background: '#221A21'}}>
            <SetWorld t={t} f={f} cam={cam} />
            <Mark x={tg.x} y={tg.y} ok k={check} s={0.7} />
          </svg>
        </div>
      ) : null}
      {/* the seam: the edge of what was prepared */}
      {showSet && showAisle && seamX < 1920 ? (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <line x1={seamX} y1={0} x2={seamX} y2={1080} stroke={C.ink} strokeWidth={10} />
          <line x1={seamX} y1={0} x2={seamX} y2={1080} stroke={C.teal} strokeWidth={4} strokeDasharray="22 16" />
        </svg>
      ) : null}
      {void floorY}
    </div>
  );
};
/** Event times for the sound cue sheet. */
export const PROVE_EV = {T_PAN0, T_PAN1, T_WALK0, T_WALK1, AVJ, AV_WALK};
