// V4 PROVE (190.4 → 204.8): what the jump does and doesn't show.
//   P1  the push-off hangs in a spotlight: so what does it prove?
//   P2  the entry: a trained jump can survive a brutal environment
//   P3  rising off the ripple, the whole prepared set: one movement, one kind of target, prepared and supervised
//   P4  the set splits like stage flats: behind it, an ordinary factory full of unprepared tasks
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T, blockStart} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, Tag, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen} from '../kit/scene';
import {FoundryView, FD} from '../sets/views';
import {Splash} from '../sets/foundry';
import {BayBack, Conveyor, PartsCart, BAY, BCOL} from '../sets/bay';
import {FilmSetLights, TripodCam, Mark} from '../sets/props';
import {CameraIcon} from '../../components/Props';
import {Arc} from '../sets/stage';
import {rig} from '../rig/Robot2D';
import {stand, A} from '../rig/poses';
import {REAL_END, PAYOFF, CAM_REAL_END, SIDE_S, Monitor} from './Real';
import {ENTRY_X} from './Opening';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const PROVE_START = REAL_END;
export const PROVE_END = blockStart('B07') - 0.12;
const T_WHAT = T('So what does it prove');
const T_SURV = T('survive');
const T_BRUTAL = T('a brutal environment');
const T_BUT = T('But it was one');
const T_ONEMOVE = T('one movement');
const T_ONETGT = T('one kind of target');
const T_PREP = T('people prepared');
const T_SUPER = T('and supervised');
const T_NOT = T('That’s not a robot');
const T_ANY = T('walk into any factory');
const T_WORK = T('work things out');
const T_IN = T_SURV + 0.15;

const CAM_ENT: Cam = {x: 760, y: 690, z: 1.75};
const CAM_SET: Cam = {x: 600, y: 520, z: 0.72};
const S = SIDE_S;
const L = FD.ladle;

/** Yellow/black safety barrier (world). */
const Barrier: React.FC<{x: number; lw: number; k: number}> = ({x, lw, k}) => {
  if (k <= 0) return null;
  const e = backOut(k, 1.6);
  return (
    <g transform={`translate(${x} ${FD.floor}) scale(1 ${e})`}>
      {[-50, 50].map((dx) => <rect key={dx} x={dx - 7} y={-120} width={14} height={120} fill="#3A3D44" stroke={FD_INK} strokeWidth={lw} />)}
      <rect x={-70} y={-110} width={140} height={34} fill="#F2B632" stroke={FD_INK} strokeWidth={lw} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${-66 + i * 36} -110 l18 0 l-14 34 l-18 0 Z`} fill="#2B2930" />)}
    </g>
  );
};
const FD_INK = '#120C10';

/** The foundry as a prepared set (P1–P3). */
const SetView: React.FC<{tau: number; f: number; cam: Cam}> = ({tau, f, cam}) => {
  const lw = 4 / cam.z;
  const st = PAYOFF.pose(tau);
  const inVessel = st.phase === 'after' || (st.phase === 'air' && st.u > 0.97);
  const gone = st.phase === 'after' && st.u > 0.9;
  const tHit = tau - T_IN;
  const arcK = easeOut(seg(tau, T_ONEMOVE - 0.15, T_ONEMOVE + 0.5));
  const tgtK = backOut(seg(tau, T_ONETGT - 0.1, T_ONETGT + 0.3), 1.6);
  const barK = (i: number) => seg(tau, T_PREP - 0.2 + i * 0.07, T_PREP + 0.15 + i * 0.07);
  const supK = seg(tau, T_SUPER - 0.1, T_SUPER + 0.3);
  const ring = (r: number, w: number, key: string) => <ellipse key={key} cx={ENTRY_X} cy={L.surf} rx={r} ry={r * (L.sry / L.srx)} fill="none" stroke={C.teal} strokeWidth={lw * w} />;
  return (
    <FoundryView cam={cam} t={tau} hit={{x: ENTRY_X, t: tHit}} scar={seg(tau, T_IN + 0.8, T_IN + 2.5)} glow={1}
      booth={(
        <g>
          <Monitor x={FD.booth.x0 + 140} y={FD.booth.y0 + 140} lw={lw} state={2} t={tau} id={1} />
          <Monitor x={FD.booth.x0 + 320} y={FD.booth.y0 + 140} lw={lw} state={2} t={tau} id={2} />
        </g>
      )}
      extraBack={<FilmSetLights lw={lw} id="fsP" />}
      behind={<Arc pts={PAYOFF.arc()} k={arcK} lw={lw} color={C.teal} width={3} />}
      inside={(
        <>
          <Splash x={ENTRY_X} t={tHit} lw={lw} part="back" scale={1.35} />
          {!gone ? <Bot cam={cam} id="pv" model="F02" s={S} pose={st.pose} clipBelow={inVessel ? L.surf + 1 : undefined} /> : null}
          <Splash x={ENTRY_X} t={tHit} lw={lw} part="front" scale={1.35} />
          {tgtK > 0.01 ? <g transform={`translate(${ENTRY_X} ${L.surf}) scale(${tgtK}) translate(${-ENTRY_X} ${-L.surf})`}>{ring(92, 4.2, 'r1')}{ring(46, 3.4, 'r2')}</g> : null}
        </>
      )}
      front={(
        <g>
          <rect x={1172} y={590} width={16} height={FD.floor - 590} fill="#3A3D44" stroke={FD_INK} strokeWidth={lw} />
          <CameraIcon x={1180} y={560} s={0.9} broken={1} />
          {[420, 560, 1020, 1160].map((x, i) => <Barrier key={x} x={x} lw={lw} k={barK(i)} />)}
          <TripodCam x={1330} y={FD.floor} lw={lw} />
          <Crew look={CAST.clerkC} x={1480} y={FD.floor} h={400} frame={f} seed={14} flip pose={{...IDLE, armR: {a: 70, b: 40}, armL: {a: 50, b: 60}, lookX: 0.4, mouth: 'flat'}} />
          <Crew look={CAST.clerkA} x={-120} y={FD.floor} h={400} frame={f} seed={3}
            holdL={<g><rect x={-40} y={-10} width={80} height={104} rx={8} fill="#C9924F" stroke={C.ink} strokeWidth={4} /><rect x={-32} y={4} width={64} height={80} rx={4} fill="#FFFDF6" /></g>}
            pose={{...IDLE, armL: {a: 40, b: 70}, armR: {a: 12, b: 14}, lookX: 0.8, lookY: -0.2, mouth: 'flat'}} />
          {supK > 0 ? (
            <g opacity={supK}>
              {[[-120, FD.floor - 220], [1480, FD.floor - 220], [FD.booth.x0 + 230, FD.booth.y0 + 140]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={160} fill="none" stroke={C.teal} strokeWidth={lw * 3} strokeDasharray={`${lw * 8} ${lw * 6}`} />)}
            </g>
          ) : null}
        </g>
      )} />
  );
};

/** An ordinary factory aisle behind the set (bay world, robots at s = 1). */
export const Factory: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const cam: Cam = {x: 520, y: 620, z: lerp(0.86, 0.92, seg(tau, T_NOT, PROVE_END))};
  const lw = 4 / cam.z;
  const G = BAY.floor;
  const look = Math.sin((tau - T_NOT) * 1.6) * 0.5 + 0.5;
  const p = stand(-280, G, 1, {yaw: 0.5, head: lerp(-6, 10, look), headYaw: lerp(0.2, 0.9, look), armN: A(2, 8, {grip: 0.3}), armF: A(2, 8, {grip: 0.3})});
  const tasks = [
    {x: 260, y: 300, icon: 'box'}, {x: 640, y: 180, icon: 'stairs'}, {x: 980, y: 320, icon: 'cable'},
    {x: 1260, y: 170, icon: 'door'}, {x: 1460, y: 400, icon: 'tool'}, {x: 820, y: 520, icon: 'box2'},
  ];
  const qK = (i: number) => backOut(seg(tau, T_ANY - 0.1 + i * 0.14, T_ANY + 0.2 + i * 0.14), 1.7);
  const icon = (k: string) => {
    switch (k) {
      case 'box': case 'box2': return <g><rect x={-34} y={-26} width={68} height={52} rx={4} fill={C.woodLight} stroke={C.ink} strokeWidth={5} /><line x1={-34} y1={-8} x2={34} y2={-8} stroke={C.ink} strokeWidth={4} /></g>;
      case 'stairs': return <path d="M-36 30 L-36 14 L-12 14 L-12 -6 L12 -6 L12 -26 L36 -26 L36 30 Z" fill="#9AA4AE" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />;
      case 'cable': return <path d="M-36 0 Q-18 -30 0 0 T36 0" fill="none" stroke={C.coral} strokeWidth={8} strokeLinecap="round" />;
      case 'door': return <g><rect x={-24} y={-34} width={48} height={68} rx={4} fill={C.blueLight} stroke={C.ink} strokeWidth={5} /><circle cx={12} cy={2} r={4} fill={C.ink} /></g>;
      default: return <path d="M-30 20 L14 -24 M8 -32 Q26 -40 34 -22 Q24 -20 20 -14 Z" stroke={C.ink} strokeWidth={8} fill="#9AA4AE" strokeLinecap="round" />;
    }
  };
  return (
    <Scene bg={BCOL.wall}>
      <Layer cam={cam}>
        <BayBack lw={lw} />
        {/* racks */}
        {[700, 1180].map((x) => (
          <g key={x}>
            {[0, 1, 2].map((r) => <rect key={r} x={x - 200} y={G - 160 - r * 210} width={400} height={18} fill="#4F7CC9" stroke={C.ink} strokeWidth={lw} />)}
            {[-200, 182].map((dx) => <rect key={dx} x={x + dx} y={G - 600} width={18} height={600} fill="#3A5FA0" stroke={C.ink} strokeWidth={lw} />)}
            {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + '-' + c} x={x - 180 + c * 120} y={G - 246 - r * 210} width={100} height={86} rx={6} fill={(r + c) % 2 ? C.woodLight : C.wood} stroke={C.ink} strokeWidth={lw * 0.8} />))}
          </g>
        ))}
        <Conveyor x0={-60} x1={420} y={700} lw={lw} offset={tau * 120} />
        <PartsCart x={1500} lw={lw} />
        <Bot cam={cam} id="fac" model="F02" s={1} pose={p} />
      </Layer>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {tasks.map((t, i) => {
          const k = qK(i);
          if (k <= 0.01) return null;
          return (
            <g key={i} transform={`translate(${t.x} ${t.y}) scale(${k})`}>
              <circle r={70} fill={C.paper} stroke={C.ink} strokeWidth={6} />
              <g transform="translate(-6 4)">{icon(t.icon)}</g>
              <circle cx={50} cy={-50} r={28} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
              <text x={50} y={-38} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={36} fill={C.ink}>?</text>
            </g>
          );
        })}
        {tau > T_WORK - 0.2 ? (
          <g transform={`translate(560 900) scale(${backOut(seg(tau, T_WORK - 0.2, T_WORK + 0.15), 1.6)})`}>
            <rect x={-440} y={-60} width={880} height={120} rx={20} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <text x={-370} y={16} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>walk into any factory and work it out</text>
            <Mark x={-400} y={0} ok={false} k={1} s={0.42} />
          </g>
        ) : null}
      </svg>
    </Scene>
  );
};

export const Prove: React.FC = () => {
  const f = useCurrentFrame();
  const tau = PROVE_START + f / 30;
  // P1/P2/P3 camera
  const st = PAYOFF.pose(tau);
  const pr = rig(st.pose, S);
  const fol: Cam = {x: pr.pts.pelvis[0] + 20, y: pr.pts.pelvis[1] - 30, z: 1.7};
  let cam = mixCam(CAM_REAL_END, fol, easeInOut(seg(tau, PROVE_START, PROVE_START + 0.7)));
  cam = mixCam(cam, CAM_ENT, easeInOut(seg(tau, T_IN - 0.6, T_IN + 0.15)));
  cam = mixCam(cam, CAM_SET, easeInOut(seg(tau, T_BUT - 0.3, T_ONETGT + 0.5)));
  const spot = seg(tau, PROVE_START, T_WHAT + 0.1) * (1 - seg(tau, T_IN - 0.5, T_IN - 0.1));
  const rs = toScreen(cam, pr.pts.chest[0], pr.pts.chest[1]);
  const set = (
    <Scene bg="#221A21"
      over={(
        <>
          <Chip x={100} y={64} lines={['✓ a trained jump can survive a brutal environment']} k={seg(tau, T_BRUTAL - 0.2, T_BRUTAL + 0.2) * (1 - seg(tau, T_BUT - 0.2, T_BUT + 0.1))} size={38} tone="teal" />
        </>
      )}>
      <SetView tau={tau} f={f} cam={cam} />
      {spot > 0 ? (
        <g opacity={spot}>
          <defs><radialGradient id="spotP" cx={rs.x} cy={rs.y} r={760} gradientUnits="userSpaceOnUse"><stop offset="0.32" stopColor="#000" stopOpacity={0} /><stop offset="0.62" stopColor="#0B0608" stopOpacity={0.78} /><stop offset="1" stopColor="#0B0608" stopOpacity={0.9} /></radialGradient></defs>
          <rect width={1920} height={1080} fill="url(#spotP)" />
          <g transform={`translate(${rs.x + 300} ${rs.y - 180}) scale(${backOut(seg(tau, T_WHAT, T_WHAT + 0.35), 1.6)})`}>
            <circle r={70} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
            <text y={34} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={100} fill={C.ink}>?</text>
          </g>
        </g>
      ) : null}
      {(() => {
        const ap = PAYOFF.arc()[16];
        const a = toScreen(cam, ap.x, ap.y);
        const tg = toScreen(cam, ENTRY_X, L.surf);
        const br = toScreen(cam, 1160, FD.floor - 110);
        const cr = toScreen(cam, -120, FD.floor - 380);
        return (
          <g>
            <Tag ax={a.x} ay={a.y} x={a.x + 70} y={a.y + 90} text="one movement" k={seg(tau, T_ONEMOVE, T_ONEMOVE + 0.35)} size={40} color={C.tealDeep} />
            <Tag ax={tg.x} ay={tg.y} x={tg.x + 140} y={tg.y - 200} text="one kind of target" k={seg(tau, T_ONETGT + 0.05, T_ONETGT + 0.4)} size={40} color={C.tealDeep} />
            <Tag ax={br.x} ay={br.y} x={br.x - 60} y={br.y + 130} text="prepared" k={seg(tau, T_PREP + 0.1, T_PREP + 0.4)} size={40} color={C.tealDeep} />
            <Tag ax={cr.x} ay={cr.y} x={cr.x + 80} y={cr.y - 170} text="supervised" k={seg(tau, T_SUPER + 0.1, T_SUPER + 0.4)} size={40} color={C.tealDeep} />
          </g>
        );
      })()}
    </Scene>
  );
  // P4: the set splits like stage flats and slides away, revealing an ordinary factory behind it
  const split = easeInOut(seg(tau, T_NOT - 0.35, T_NOT + 0.45));
  if (split <= 0) return set;
  if (split >= 1) return <Factory tau={tau} f={f} />;
  const dx = split * 1100;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Factory tau={tau} f={f} />
      <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 960px 0, 960px 1080px, 0 1080px)', transform: `translateX(${-dx}px)`}}>{set}</div>
      <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(960px 0, 1920px 0, 1920px 1080px, 960px 1080px)', transform: `translateX(${dx}px)`}}>{set}</div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {[-1, 1].map((sd) => <rect key={sd} x={960 + sd * dx - (sd < 0 ? 24 : 0)} y={0} width={24} height={1080} fill="#C9A77A" stroke={C.ink} strokeWidth={5} />)}
      </svg>
    </div>
  );
};
void smooth; void easeIn;
