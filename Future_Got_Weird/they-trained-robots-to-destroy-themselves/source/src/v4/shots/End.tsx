// V4 END (204.8 → end): why it is uncomfortable to watch, and who made the choice.
//   E1  the flats close again on the foundry: another F.02 waits back from the edge
//   E2  the light flares and the same pose becomes a silhouette against the glow: arms, legs, head; it walks to the
//       edge and leaps — the leap holds like a pictogram (no extra full jump); it looks like a choice… the bubble pops
//   E3  people picked the ending, built the target, wrote the score (the Crew, lit, below the silhouette)
//   E4  the policy got very good at reaching it: many attempt arcs converge onto the ring
//   E5  rear silhouettes of the Crew and a robot at the edge, warm rim light: does it feel different when it looks like us?
//   E6  they just stuck the landing: the glowing surface opens into a top-view ring, the ring opens into the end card
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {T, NARR_END} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Tag, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, rnd} from '../kit/scene';
import {FoundryView, FD} from '../sets/views';
import {makeJump} from '../rig/jump';
import {rig, RPose} from '../rig/Robot2D';
import {stand, walk, blend, A, crouch} from '../rig/poses';
import {PROVE_END, Factory} from './Prove';
import {TOE_X, ENTRY_X, S_OPEN} from './Opening';
import {BigClapper, FilmSetLights} from '../sets/props';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const END_START = PROVE_END;
const END_T = NARR_END + 2.95;
const T_WHY = T('So why is it uncomfortable');
const T_SHAPE = T('Partly, it’s the shape');
const T_ARMS = T('arms, legs');
const T_LEGS = T('legs and a head');
const T_HEAD = T('a head walks') + 0.1;
const T_WALKS = T('walks to the edge');
const T_LEAPS = T('and leaps');
const T_LOOKS = T('it looks like someone');
const T_BUT = T('But the choice wasn’t');
const T_PEOPLE = T('People picked the ending');
const T_BUILT = T('built the target');
const T_WROTE = T('wrote the score');
const T_POLICY = T('The policy just got');
const T_REACH = T('reaching it');
const T_DOES = T('Does retiring hardware');
const T_THESE = T('These robots didn’t');
const T_STUCK = T('stuck the landing');
const T_STING = T_STUCK + 1.5;

const S = S_OPEN;
const L = FD.ladle;
const X_BACK = -150;
const STANDBACK = stand(X_BACK, FD.deck.top, S, {yaw: 0.8, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3})});
const K0 = crouch(TOE_X, FD.deck.top, S);
const EJ = makeJump({toeX: TOE_X, deckY: FD.deck.top, endX: ENTRY_X, endY: L.surf, s: S, tPush: T_LEAPS - 0.3, tTO: T_LEAPS + 0.08, tEnd: T_LEAPS + 40, apex: 110 * S,
  rate: [[T_LEAPS + 0.08, 1], [T_LEAPS + 0.32, 0.015], [T_LEAPS + 40, 0.015]]});
const W0 = T_WALKS - 0.15, W1 = T_LEAPS - 0.45;
const silPose = (tau: number): RPose => {
  if (tau < W0) return STANDBACK;
  if (tau < W1 + 0.15) {
    const u = seg(tau, W0, W1);
    const pw = walk(X_BACK, FD.deck.top, S, (K0.x - X_BACK) * u, 1, {yaw: 0.8}, 150);
    return blend(pw, K0, smooth(seg(tau, W1 - 0.2, W1 + 0.15)));
  }
  if (tau < EJ_T0) return K0;
  return EJ.pose(tau).pose;
};
const EJ_T0 = T_LEAPS - 0.3;

const CAM_E1: Cam = {x: 120, y: 470, z: 1.25};
const CAM_E3: Cam = {x: 330, y: 560, z: 0.95};

/** The foundry drawn as a backlit silhouette set: black shapes against the molten glow. */
const SilSet: React.FC<{cam: Cam; t: number; glow?: number; children?: React.ReactNode; front?: React.ReactNode}> = ({cam, t, glow = 1, children, front}) => {
  const lw = 4 / cam.z;
  const K = '#0E0607';
  return (
    <Layer cam={cam}>
      <defs>
        <linearGradient id="silBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C0A0B" /><stop offset="1" stopColor="#3A140E" /></linearGradient>
        <radialGradient id="silGlow" cx={L.cx} cy={L.surf - 120} r={1300} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFC870" stopOpacity={0.95 * glow} /><stop offset="0.3" stopColor="#FF8A2A" stopOpacity={0.55 * glow} /><stop offset="1" stopColor="#FF6A1A" stopOpacity={0} /></radialGradient>
        <radialGradient id="silMol" cx={L.cx} cy={L.surf} r={L.srx} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF6CF" /><stop offset="0.5" stopColor="#FFD45A" /><stop offset="1" stopColor="#FF8A2A" /></radialGradient>
      </defs>
      <rect x={-4000} y={-2000} width={9000} height={4000} fill="url(#silBg)" />
      <rect x={-4000} y={-2000} width={9000} height={4000} fill="url(#silGlow)" />
      {/* far columns and girder as dark shapes */}
      {[-700, 80, 860, 1640].map((x) => <rect key={x} x={x - 40} y={-600} width={80} height={1600} fill="#1A0B0C" opacity={0.85} />)}
      <rect x={-2000} y={60} width={5000} height={70} fill="#1A0B0C" />
      {children}
      {/* deck */}
      <path d={`M-2500 ${FD.deck.top} L${FD.deck.edge} ${FD.deck.top} L${FD.deck.edge} ${FD.deck.top + 34} L${FD.deck.edge - 40} ${FD.deck.top + 34} L${FD.deck.edge - 40} ${FD.floor} L-2500 ${FD.floor} Z`} fill={K} />
      <path d={`M-2500 ${FD.deck.top - 90} L${FD.deck.edge - 120} ${FD.deck.top - 90}`} stroke={K} strokeWidth={lw * 3} />
      {[-1200, -800, -400, 0, 160].map((x) => <line key={x} x1={x} y1={FD.deck.top - 92} x2={x} y2={FD.deck.top} stroke={K} strokeWidth={lw * 3} />)}
      {/* ladle: black shell, glowing surface */}
      <path d={`M${L.cx - L.rx} ${L.rim} L${L.cx - L.brx} ${L.bot} L${L.cx + L.brx} ${L.bot} L${L.cx + L.rx} ${L.rim} Z`} fill={K} />
      <ellipse cx={L.cx} cy={L.rim} rx={L.rx} ry={L.ry} fill={K} />
      <ellipse cx={L.cx} cy={L.surf} rx={L.srx} ry={L.sry} fill="url(#silMol)" />
      {Array.from({length: 16}, (_, i) => {
        const life = 2.4 + rnd(i * 3) * 1.4;
        const ph = ((t + rnd(i) * life) % life) / life;
        return <circle key={i} cx={L.cx + (rnd(i * 7) - 0.5) * L.srx * 1.6 + Math.sin(t + i) * 18} cy={L.surf - ph * 560} r={lw * (0.8 + rnd(i * 11))} fill="#FFE08A" opacity={(1 - ph) * 0.9} />;
      })}
      <rect x={-4000} y={FD.floor} width={9000} height={1500} fill={K} />
      {front}
    </Layer>
  );
};

/** Rim-lit silhouette filter: a warm halo offset toward the light, then a black fill. */
const RimDefs: React.FC = () => (
  <defs>
    <filter id="rimSil" x="-30%" y="-30%" width="160%" height="160%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d" />
      <feOffset in="d" dx="2" dy="-3" result="do" />
      <feFlood floodColor="#FFB45A" result="o" />
      <feComposite in="o" in2="do" operator="in" result="rim" />
      <feFlood floodColor="#120708" result="k" />
      <feComposite in="k" in2="SourceAlpha" operator="in" result="sil" />
      <feMerge><feMergeNode in="rim" /><feMergeNode in="sil" /></feMerge>
    </filter>
  </defs>
);

const ChoiceBubble: React.FC<{x: number; y: number; k: number; pop: number}> = ({x, y, k, pop}) => {
  if (k <= 0) return null;
  if (pop >= 1) return null;
  if (pop > 0) {
    return (
      <g transform={`translate(${x} ${y})`} opacity={1 - pop}>
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <line key={i} x1={Math.cos(a) * (60 + 120 * pop)} y1={Math.sin(a) * (50 + 100 * pop)} x2={Math.cos(a) * (90 + 170 * pop)} y2={Math.sin(a) * (75 + 140 * pop)} stroke={C.coral} strokeWidth={10} strokeLinecap="round" />;
        })}
      </g>
    );
  }
  const e = backOut(k, 1.5);
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`}>
      <circle cx={-150} cy={130} r={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      <circle cx={-110} cy={96} r={22} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      <ellipse rx={150} ry={110} fill={C.paper} stroke={C.ink} strokeWidth={6} />
      <path d="M0 50 L0 0 L-50 -50 M0 0 L50 -50" fill="none" stroke={C.ink} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-50 -50 l0 26 M-50 -50 l26 0 M50 -50 l0 26 M50 -50 l-26 0" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <text x={0} y={92} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.ink}>a choice?</text>
    </g>
  );
};

export const End: React.FC = () => {
  const f = useCurrentFrame();
  const tau = END_START + f / 30;

  // ------------------------------------------------ E1: the flats close on the foundry; another robot waits
  if (tau < T_SHAPE) {
    const cam = mixCam(CAM_E1, {...CAM_E1, z: 1.35, x: 100}, smooth(seg(tau, END_START, T_SHAPE)));
    const flare = Math.max(0, 1 - Math.abs(tau - T_SHAPE) / 0.25);
    const scene = (
      <Scene bg="#221A21">
        <FoundryView cam={cam} t={tau} glow={1 + flare} extraBack={<FilmSetLights lw={4 / cam.z} id="fsE" />} behind={<Bot cam={cam} id="eR1" model="F02" s={S} pose={{...STANDBACK, head: 6 * smooth(seg(tau, T_WHY, T_WHY + 1))}} />} />
        {flare > 0 ? <rect width={1920} height={1080} fill="#FFE2B0" opacity={flare * 0.85} /> : null}
      </Scene>
    );
    const close = 1 - easeInOut(seg(tau, END_START, END_START + 0.7));
    if (close <= 0) return scene;
    const dx = close * 1100;
    return (
      <div style={{position: 'absolute', inset: 0}}>
        <Factory tau={tau} f={f} />
        <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 960px 0, 960px 1080px, 0 1080px)', transform: `translateX(${-dx}px)`}}>{scene}</div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(960px 0, 1920px 0, 1920px 1080px, 960px 1080px)', transform: `translateX(${dx}px)`}}>{scene}</div>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          {[-1, 1].map((sd) => <rect key={sd} x={960 + sd * dx - (sd < 0 ? 24 : 0)} y={0} width={24} height={1080} fill="#C9A77A" stroke={C.ink} strokeWidth={5} />)}
        </svg>
      </div>
    );
  }

  // ------------------------------------------------ E2–E4: the silhouette, the choice, the people, the arcs
  if (tau < T_DOES - 0.25) {
    let cam: Cam = mixCam({...CAM_E1, z: 1.35, x: 100}, {...CAM_E1, z: 1.5, x: 120, y: 455}, smooth(seg(tau, T_SHAPE, T_WALKS - 0.3)));
    cam = mixCam(cam, {x: 160, y: 430, z: 1.25}, easeInOut(seg(tau, T_WALKS - 0.3, T_LEAPS + 0.5)));
    cam = mixCam(cam, CAM_E3, easeInOut(seg(tau, T_PEOPLE - 0.4, T_PEOPLE + 0.5)));
    const flare = Math.max(0, 1 - Math.abs(tau - T_SHAPE) / 0.25);
    const p = silPose(tau);
    const r = rig(p, S);
    const hlK = (t0: number) => Math.max(0, Math.min(1, seg(tau, t0 - 0.05, t0 + 0.2))) * (1 - seg(tau, T_LOOKS, T_LOOKS + 0.4));
    const ha = hlK(T_ARMS), hg = hlK(T_LEGS), hh = hlK(T_HEAD);
    const hl = {uaN: {color: C.teal, amount: ha}, faN: {color: C.teal, amount: ha}, uaF: {color: C.teal, amount: ha}, faF: {color: C.teal, amount: ha},
      thN: {color: C.teal, amount: hg}, shinN: {color: C.teal, amount: hg}, thF: {color: C.teal, amount: hg}, shinF: {color: C.teal, amount: hg}, footN: {color: C.teal, amount: hg}, footF: {color: C.teal, amount: hg},
      head: {color: C.teal, amount: hh}};
    const head = toScreen(cam, r.pts.head[0], r.pts.head[1]);
    const pop = seg(tau, T_BUT - 0.05, T_BUT + 0.35);
    // crew (lit) below
    const cIn = (t0: number) => easeOut(seg(tau, t0 - 0.3, t0 + 0.2));
    const crew = [
      {look: CAST.clerkA, x: 430, t: T_PEOPLE + 0.1, lab: 'picked the ending', hold: <g transform="scale(0.32) rotate(-8)"><BigClapper x={0} y={0} s={1} clap={1} text="END" /></g>},
      {look: CAST.clerkB, x: 760, t: T_BUILT, lab: 'built the target', hold: <g transform="scale(0.7)"><ellipse rx={80} ry={26} fill="#FFFFFF" stroke={C.teal} strokeWidth={14} /><ellipse rx={36} ry={11} fill="none" stroke={C.teal} strokeWidth={10} /></g>},
      {look: CAST.clerkC, x: 1090, t: T_WROTE, lab: 'wrote the score', hold: <g transform="rotate(-6)"><rect x={-50} y={-70} width={100} height={130} rx={8} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} /><text x={0} y={-30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={26} fill={C.ink}>SCORE</text>{[0, 1, 2].map((i) => <g key={i}><circle cx={-26} cy={-4 + i * 26} r={8} fill={C.teal} /><rect x={-10} y={-8 + i * 26} width={46} height={8} rx={4} fill="#D9DEE4" /></g>)}</g>},
    ];
    // E4: arcs converge on the ring
    const conv = easeInOut(seg(tau, T_POLICY - 0.1, T_REACH + 0.5));
    const arcsK = seg(tau, T_POLICY - 0.2, T_POLICY + 0.3);
    const lw = 4 / cam.z;
    const arcs = arcsK > 0 ? Array.from({length: 11}, (_, i) => {
      const spread = (i - 5) * 70 + (rnd(i) - 0.5) * 30;
      const ex = ENTRY_X + spread * (1 - conv);
      const apex = (70 + rnd(i * 3) * 80) * S;
      const n = 30;
      const x0 = TOE_X + 10, y0 = FD.deck.top - 190;
      const pts = Array.from({length: n + 1}, (_, k) => {
        const u = k / n;
        return `${(x0 + (ex - x0) * u).toFixed(1)} ${(y0 + (L.surf - 100 - y0) * u - Math.sin(Math.PI * u) * apex * 2.2 + u * u * 60).toFixed(1)}`;
      });
      return <path key={i} d={'M' + pts.join('L')} fill="none" stroke={i === 5 ? C.teal : '#8FB3EA'} strokeWidth={lw * (i === 5 ? 3.2 : 2)} strokeDasharray={`${lw * 5} ${lw * 4}`} opacity={arcsK * (i === 5 ? 1 : 0.85)} />;
    }) : null;
    const ringK = backOut(seg(tau, T_REACH - 0.1, T_REACH + 0.3), 1.6);
    return (
      <Scene bg="#1C0A0B">
        <RimDefs />
        <SilSet cam={cam} t={tau}
          front={(
            <g>
              {arcs}
              {ringK > 0.01 ? <g transform={`translate(${ENTRY_X} ${L.surf}) scale(${ringK}) translate(${-ENTRY_X} ${-L.surf})`}>
                <ellipse cx={ENTRY_X} cy={L.surf} rx={92} ry={92 * (L.sry / L.srx)} fill="none" stroke={C.teal} strokeWidth={lw * 4.5} />
                <ellipse cx={ENTRY_X} cy={L.surf} rx={46} ry={46 * (L.sry / L.srx)} fill="none" stroke={C.teal} strokeWidth={lw * 3.5} />
              </g> : null}
              <Bot cam={cam} id="eSil" model="SIL" s={S} pose={p} hl={hl} />
              {crew.map((c, i) => {
                const k = cIn(c.t);
                if (k <= 0.01) return null;
                return (
                  <g key={i} transform={`translate(0 ${(1 - k) * 200})`}>
                    <Crew look={c.look} x={c.x} y={FD.floor} h={400} frame={f} seed={3 + i * 6} front="R" holdR={c.hold}
                      pose={{...IDLE, armR: {a: 70, b: 70}, armL: {a: 12, b: 16}, lookX: -0.4, lookY: -0.6, mouth: 'flat', brows: 0.2}} />
                  </g>
                );
              })}
            </g>
          )} />
        {crew.map((c, i) => {
          const s = toScreen(cam, c.x, FD.floor - 430);
          return <Tag key={i} ax={s.x} ay={s.y} x={s.x - 150} y={s.y - 90 - (i % 2) * 40} text={c.lab} k={seg(tau, c.t + 0.05, c.t + 0.35) * (1 - seg(tau, T_POLICY - 0.3, T_POLICY))} size={36} color={C.saffronDeep} />;
        })}
        <ChoiceBubble x={head.x + 330} y={head.y + 70} k={seg(tau, T_LOOKS - 0.05, T_LOOKS + 0.3)} pop={pop} />
        {pop > 0 ? (
          <g opacity={seg(tau, T_BUT + 0.2, T_BUT + 0.5) * (1 - seg(tau, T_PEOPLE - 0.3, T_PEOPLE))}>
            <rect x={head.x + 150} y={head.y + 40} width={360} height={70} rx={14} fill={C.paper} stroke={C.coral} strokeWidth={6} />
            <text x={head.x + 330} y={head.y + 88} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={36} fill={C.coralDeep}>not the robot’s</text>
          </g>
        ) : null}
        {(() => {
          const pb = toScreen(cam, r.pts.head[0] + 230, r.pts.head[1] + 20);
          const k = seg(tau, T_POLICY + 0.1, T_POLICY + 0.4);
          return k > 0 ? (
            <g transform={`translate(${pb.x} ${pb.y}) scale(${0.8 + 0.2 * easeOut(k)})`} opacity={Math.min(1, k * 2.5)}>
              <rect x={-110} y={-36} width={220} height={72} rx={18} fill={C.ink} stroke={C.paper} strokeWidth={4} />
              <text x={-14} y={14} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={36} fill={C.paper}>POLICY</text>
              <path d="M66 -14 L90 0 L66 14 Z" fill={C.teal} />
            </g>
          ) : null;
        })()}
        {flare > 0 ? <rect width={1920} height={1080} fill="#FFE2B0" opacity={flare * 0.85} /> : null}
      </Scene>
    );
  }

  // ------------------------------------------------ E5/E6: rear silhouettes at the edge; the ring; the end card
  const tilt = easeInOut(seg(tau, T_STUCK - 1.4, T_STUCK + 0.2));
  const push = smooth(seg(tau, T_DOES - 0.25, T_THESE + 1.0));
  const fade = seg(tau, T_DOES - 0.25, T_DOES + 0.15);
  // the glowing surface seen from behind the row; it opens into a top view as the camera rises over it
  const cx = 960, cy = lerp(560, 540, tilt);
  const rx = lerp(560 + 60 * push, 520, tilt), ry = lerp(110 + 12 * push, 520, tilt);
  const figs = [
    {look: CAST.clerkA, x: 430, h: 470},
    {look: CAST.clerkB, x: 760, h: 450},
    {robot: true, x: 1110, h: 0},
    {look: CAST.clerkC, x: 1450, h: 460},
  ];
  const rowY = 1080 + 40 - (1 - tilt) * 0 + tilt * 900;
  const ringK = backOut(seg(tau, T_STUCK - 0.05, T_STUCK + 0.4), 1.7);
  const open = easeInOut(seg(tau, T_STING, T_STING + 0.55));
  const word = easeOut(seg(tau, T_STING + 0.3, T_STING + 0.8));
  const tag = easeOut(seg(tau, T_STING + 0.65, T_STING + 1.1));
  const out = seg(tau, END_T - 0.35, END_T);
  const robotPose = stand(0, 0, 1, {yaw: 0, armN: A(3, 8, {grip: 0.3}), armF: A(3, 8, {grip: 0.3})});
  return (
    <AbsoluteFill style={{background: '#1C0A0B'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}} opacity={fade}>
        <RimDefs />
        <defs>
          <radialGradient id="e5Glow" cx={cx} cy={cy} r={1200} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFC870" stopOpacity={0.9} /><stop offset="0.4" stopColor="#FF8A2A" stopOpacity={0.45} /><stop offset="1" stopColor="#3A140E" stopOpacity={0} /></radialGradient>
          <radialGradient id="e5Mol" cx={cx} cy={cy} r={Math.max(rx, ry)} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF6CF" /><stop offset="0.55" stopColor="#FFD45A" /><stop offset="1" stopColor="#FF8A2A" /></radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="#1C0A0B" />
        <rect width={1920} height={1080} fill="url(#e5Glow)" />
        {/* rim and molten surface (side → top view) */}
        <ellipse cx={cx} cy={cy} rx={rx + 46} ry={ry + 46 * lerp(0.3, 1, tilt)} fill="#0E0607" />
        <ellipse cx={cx} cy={cy} rx={rx + 22} ry={ry + 22 * lerp(0.3, 1, tilt)} fill="#6A3826" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#e5Mol)" />
        {Array.from({length: 7}, (_, i) => {
          const a = rnd(i * 9) * Math.PI * 2, d = 0.25 + rnd(i * 4) * 0.55;
          return <ellipse key={i} cx={cx + Math.cos(a + tau * 0.05) * rx * d} cy={cy + Math.sin(a + tau * 0.05) * ry * d} rx={30 + rnd(i) * 40} ry={(30 + rnd(i) * 40) * (ry / rx)} fill="#7A2A10" opacity={0.75} />;
        })}
        {ringK > 0.01 ? (
          <g transform={`translate(${cx} ${cy}) scale(${ringK})`}>
            <ellipse rx={150} ry={150 * (ry / rx)} fill="none" stroke={C.teal} strokeWidth={14} />
            <ellipse rx={74} ry={74 * (ry / rx)} fill="none" stroke={C.teal} strokeWidth={10} />
            <ellipse rx={20} ry={20 * (ry / rx)} fill={C.teal} />
          </g>
        ) : null}
        {/* the row, seen from behind: the Crew and a robot at the edge, rim-lit; slides away as the camera rises */}
        <g transform={`translate(0 ${tilt * 900})`}>
          <rect x={0} y={900} width={1920} height={200} fill="#0E0607" />
          <line x1={0} y1={830} x2={1920} y2={830} stroke="#0E0607" strokeWidth={14} />
          {[120, 520, 980, 1400, 1800].map((x) => <line key={x} x1={x} y1={830} x2={x} y2={910} stroke="#0E0607" strokeWidth={12} />)}
          {figs.map((fg, i) => fg.robot ? (
            <g key={i} filter="url(#rimSil)" transform={`translate(${fg.x} 960) scale(0.78)`}>
              <Bot cam={{x: 0, y: 0, z: 0.78}} id="eRow" model="SIL" s={1} pose={{...robotPose, y: robotPose.y, x: 0}} />
            </g>
          ) : (
            <g key={i} filter="url(#rimSil)">
              <Crew look={fg.look!} x={fg.x} y={960} h={fg.h} frame={f} seed={i * 5 + 2} shadow={false} life={0.4} pose={{...IDLE, lookX: 0, lookY: -0.5, mouth: 'flat'}} />
            </g>
          ))}
        </g>
      </svg>
      {open > 0 ? (
        <AbsoluteFill style={{background: C.paper, clipPath: `circle(${lerp(40, 2300, open)}px at ${cx}px ${cy}px)`}}>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 1 - out}}>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 140, color: C.ink, letterSpacing: '-0.01em', transform: `scale(${lerp(0.86, 1, word)})`, opacity: word}}>
              FUTURE <span style={{color: C.coral}}>GOT</span> WEIRD
            </div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 48, color: C.inkSoft, marginTop: 12, opacity: tag, transform: `translateY(${(1 - tag) * 18}px)`}}>The strange future, explained.</div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {void rowY}
    </AbsoluteFill>
  );
};
void easeIn; void RimDefs;
/** Event times for the sound cue sheet. */
export const END_EV = {W0, W1, EJ_T0, T_STING, T_LEAPS};
