// V4 FILM (68.0 → 94.3): the post and the reply on a phone (paraphrase + verified quote, no platform branding), the
// 1991 film as a clapperboard and a chain silhouette, the chain crossing the lens into the 2D foundry, "almost exactly
// Figure's reason" as two matched icons, the business-case gag, and the film crew around the ladle.
// No likeness of any actor and no frames from the film: the film appears only as a title on a slate and a silhouette.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {T, blockStart} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp, clamp01, toScreen} from '../kit/scene';
import {FoundryView, FD} from '../sets/views';
import {ActuatorArt, FilmLight, TripodCam, BigClapper} from '../sets/props';
import {stand, A} from '../rig/poses';
import {WHY_END} from './Why';
import {clapCover} from './WhyB';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {ChipIcon} from '../../components/Props';
import {C, F} from '../../theme';

export const FILM_START = WHY_END;
export const FILM_END = blockStart('B04') - 0.12;
const mix = lerp;

const T_POST = T('In August') - 0.1;
const T_REPLY = T('Arnold Schwarzenegger replied') - 0.05;
const T_T2 = T('In Terminator Two') - 0.12;
const T_REASON = T('which is almost exactly') - 0.1;
const T_FIGR = T('Figure’s reason');
const T_BIZ = T('Hollywood wrote') - 0.1;
const T_HINT = T('Figure took the hint') - 0.1;
const T_APPEARS = T('appears in the finished');

// ---------------------------------------------------------------- phone
const Phone: React.FC<{tau: number}> = ({tau}) => {
  const enter = easeOut(seg(tau, FILM_START, FILM_START + 0.55));
  const scroll = easeInOut(seg(tau, T_REPLY - 0.2, T_REPLY + 0.5)) * 300;
  const reply = easeOut(seg(tau, T_REPLY, T_REPLY + 0.45));
  const post = easeOut(seg(tau, T_POST, T_POST + 0.45));
  const close = tau >= T_POST + 0.2;
  const out = Math.pow(seg(tau, T_T2 - 0.32, T_T2), 2);       // the phone turns edge-on and away (into the clapper)
  const tiltY = (close ? -4 : mix(-24, -8, enter)) + Math.sin((tau - FILM_START) * 0.9) * (close ? 0.8 : 2) + 90 * out;
  // three framings: the phone arrives; cut in on the post; a fast scroll-whip down to the reply
  const push = tau < T_POST + 0.2 ? mix(1, 1.08, easeInOut(seg(tau, FILM_START, T_POST + 0.2)))
    : tau < T_REPLY - 0.2 ? mix(1.85, 1.98, seg(tau, T_POST + 0.2, T_REPLY - 0.2))
    : mix(2.05, 2.25, easeOut(seg(tau, T_REPLY - 0.2, T_T2)));
  const whip = Math.sin(clamp01(seg(tau, T_REPLY - 0.2, T_REPLY + 0.5)) * Math.PI);
  const card = (k: number, children: React.ReactNode, accent: string) => (
    <div style={{background: '#FFFFFF', borderRadius: 26, padding: '26px 28px', margin: '0 22px 22px', boxShadow: '0 6px 0 rgba(22,42,50,0.12)', border: `3px solid ${accent}`, opacity: k, transform: `translateY(${(1 - k) * 60}px)`}}>{children}</div>
  );
  const avatar = (letter: string, col: string) => (
    <div style={{width: 74, height: 74, borderRadius: 37, background: col, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{letter}</div>
  );
  return (
    <AbsoluteFill style={{perspective: 1600, filter: whip > 0.05 ? `blur(${whip * 6}px)` : undefined}}>
      <div style={{position: 'absolute', left: 960 - 290, top: (close ? mix(170, 75, easeInOut(seg(tau, T_REPLY - 0.2, T_REPLY + 0.5))) : 80) + (1 - enter) * 700, width: 580, height: 1100, transform: `rotateY(${tiltY}deg) rotateX(${close ? 2 : 6}deg) scale(${push})`, transformOrigin: close ? '50% 20%' : '50% 40%'}}>
        <div style={{position: 'absolute', inset: 0, background: '#1C1F25', borderRadius: 70, border: '8px solid #0E1013', boxShadow: '30px 40px 0 rgba(22,42,50,0.18)'}} />
        <div style={{position: 'absolute', left: 26, top: 26, right: 26, bottom: 26, background: '#EEF1F4', borderRadius: 50, overflow: 'hidden'}}>
          <div style={{height: 92, background: '#FFFFFF', borderBottom: '2px solid #D9DEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink}}>Posts</div>
          <div style={{transform: `translateY(${-scroll + 24}px)`}}>
            {card(post, (
              <div>
                <div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
                  {avatar('B', C.blue)}
                  <div>
                    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink}}>Brett Adcock</div>
                    <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 24, color: C.inkMuted}}>Figure CEO · Aug 2026</div>
                  </div>
                </div>
                <div style={{fontFamily: F.body, fontWeight: 700, fontStyle: 'italic', fontSize: 34, color: C.inkSoft, marginTop: 20, lineHeight: 1.3}}>asks what to do with the retired F.02 robots</div>
                <div style={{display: 'inline-block', marginTop: 16, padding: '6px 16px', borderRadius: 999, background: C.paperDeep, fontFamily: F.body, fontWeight: 800, fontSize: 22, color: C.inkSoft}}>PARAPHRASED</div>
              </div>
            ), '#D9DEE4')}
            {card(reply, (
              <div>
                <div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
                  {avatar('A', C.coral)}
                  <div>
                    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink}}>Arnold Schwarzenegger</div>
                    <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 24, color: C.inkMuted}}>reply · Aug 19, 2026</div>
                  </div>
                </div>
                <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 56, color: C.ink, marginTop: 20, lineHeight: 1.1}}>“You should melt them.”</div>
                <div style={{display: 'inline-block', marginTop: 16, padding: '6px 16px', borderRadius: 999, background: C.tealLight, fontFamily: F.body, fontWeight: 800, fontSize: 22, color: C.tealDeep}}>QUOTED</div>
              </div>
            ), C.teal)}
          </div>
        </div>
        {/* fingertip tap as the reply arrives */}
        {reply > 0 && reply < 1 ? <div style={{position: 'absolute', left: 290 - 60 * reply, top: 700 - 60 * reply - scroll * 0.3, width: 120 * reply, height: 120 * reply, borderRadius: '50%', border: `6px solid ${C.teal}`, opacity: 1 - reply}} /> : null}
      </div>
    </AbsoluteFill>
  );
};

const PhoneBg: React.FC<{tau: number}> = ({tau}) => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #FFF8E6 0%, #F1E6C9 60%, #E2D5B2 100%)'}}>
    {[[260, 260, 120, C.saffronLight], [1600, 340, 160, C.tealLight], [1500, 860, 110, C.coralLight], [330, 840, 140, C.blueLight]].map(([x, y, r, col], k) => (
      <div key={k} style={{position: 'absolute', left: (x as number) - (r as number) + Math.sin(tau * 0.5 + k) * 12, top: (y as number) - (r as number), width: (r as number) * 2, height: (r as number) * 2, borderRadius: '50%', background: col as string, opacity: 0.7}} />
    ))}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- 1991: clapperboard → chain silhouette → the foundry's crane chain
const Movie: React.FC<{tau: number}> = ({tau}) => {
  const snap = seg(tau, T_T2, T_T2 + 0.35);
  const toChain = seg(tau, T_T2 + 0.9, T_T2 + 1.3);
  const lower = easeInOut(seg(tau, T_T2 + 1.1, T_REASON + 0.2));
  const chipSink = seg(tau, T_T2 + 2.2, T_REASON);
  const open = (1 - easeOut(Math.min(1, snap * 1.3))) * 30;
  return (
    <AbsoluteFill style={{background: '#2A1416'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <radialGradient id="pool" cx="960" cy="1040" r="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFD45A" />
            <stop offset="0.35" stopColor="#FF7A1A" />
            <stop offset="1" stopColor="#2A1416" />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#pool)" opacity={toChain} />
        {/* chain + hook silhouette lowering into the glow; a small chip goes with it (the technology nobody can copy) */}
        <g opacity={toChain} transform={`translate(960 960) scale(${mix(1, 1.45, easeInOut(seg(tau, T_T2 + 1.0, T_REASON)))}) translate(-960 -960)`}>
          {Array.from({length: 22}, (_, k) => {
            const y = -60 + k * 46 + lower * 360;
            return <rect key={k} x={940} y={y} width={40} height={58} rx={18} fill="none" stroke="#140A0B" strokeWidth={12} transform={k % 2 ? `rotate(90 960 ${y + 29})` : undefined} />;
          })}
          <path d={`M960 ${930 + lower * 360} q0 80 -70 80 q-60 0 -60 -60`} fill="none" stroke="#140A0B" strokeWidth={26} strokeLinecap="round" />
          <g transform={`translate(${900} ${980 + lower * 360 + chipSink * 120}) `} opacity={1 - chipSink * 0.9}>
            <rect x={-40} y={-40} width={80} height={80} rx={10} fill="#140A0B" />
            {Array.from({length: 4}, (_, k) => <rect key={k} x={-56} y={-30 + k * 18} width={112} height={6} fill="#140A0B" />)}
          </g>
        </g>
        {/* clapperboard */}
        <g transform={`translate(960 ${330 + toChain * 900}) rotate(${-3 + toChain * 25}) scale(${Math.max(0.02, Math.sin((Math.PI / 2) * easeOut(seg(tau, T_T2, T_T2 + 0.3))))} 1)`} opacity={1 - toChain}>
          <rect x={-420} y={0} width={840} height={440} rx={14} fill="#1E2026" stroke="#0B0C0F" strokeWidth={8} />
          <g transform={`translate(-420 0) rotate(${-open})`}>
            <rect x={0} y={-96} width={840} height={96} rx={8} fill="#F4ECD6" stroke="#0B0C0F" strokeWidth={8} />
            {Array.from({length: 7}, (_, k) => <path key={k} d={`M${30 + k * 122} -96 l60 0 l-52 96 l-60 0 Z`} fill="#1E2026" />)}
          </g>
          <text x={-370} y={140} fontFamily={F.display} fontWeight={700} fontSize={84} fill="#F4ECD6">Terminator 2</text>
          <text x={-370} y={250} fontFamily={F.mono} fontWeight={700} fontSize={64} fill={C.saffron}>1991</text>
          <line x1={-420} y1={300} x2={420} y2={300} stroke="#F4ECD6" strokeWidth={4} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** A heavy chain right in front of the lens (out-of-focus, warm rim light), used as an occlusion transition. */
const LensChain: React.FC<{x: number; tilt: number}> = ({x, tilt}) => (
  <g transform={`translate(${x} 540) rotate(${tilt})`}>
    {Array.from({length: 6}, (_, k) => {
      const y = -820 + k * 360;
      return k % 2 === 0
        ? <ellipse key={k} cx={0} cy={y} rx={210} ry={270} fill="none" stroke="#140F10" strokeWidth={130} />
        : <rect key={k} x={-70} y={y - 260} width={140} height={520} rx={70} fill="#140F10" />;
    })}
    {Array.from({length: 6}, (_, k) => {
      const y = -820 + k * 360;
      return k % 2 === 0 ? <path key={'h' + k} d={`M${262} ${y - 190} A${270} ${330} 0 0 1 ${262} ${y + 190}`} fill="none" stroke="#FF8A2A" strokeOpacity={0.6} strokeWidth={12} /> : null;
    })}
  </g>
);

const BizClipboard: React.FC<{tau: number}> = ({tau}) => {
  const enter = easeOut(seg(tau, T_BIZ, T_BIZ + 0.4));
  const stamp = seg(tau, T('in nineteen ninety-one') - 0.05, T('in nineteen ninety-one') + 0.15);
  const s = 1 + (1 - easeOut(stamp)) * 0.9;
  return (
    <g transform={`translate(${1340 + (1 - enter) * 500} 560) rotate(-6)`}>
      <rect x={-230} y={-280} width={460} height={600} rx={22} fill="#C9924F" stroke={C.ink} strokeWidth={8} />
      <rect x={-200} y={-240} width={400} height={530} rx={8} fill="#FFFDF6" stroke={C.ink} strokeWidth={5} />
      <rect x={-80} y={-300} width={160} height={60} rx={12} fill="#8F9BA6" stroke={C.ink} strokeWidth={6} />
      <text x={0} y={-160} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={50} fill={C.ink}>BUSINESS</text>
      <text x={0} y={-104} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={50} fill={C.ink}>CASE</text>
      {[0, 1, 2, 3].map((k) => <rect key={k} x={-150} y={-40 + k * 44} width={k === 3 ? 180 : 300} height={14} rx={7} fill="#D9DEE4" />)}
      {stamp > 0 ? (
        <g transform={`translate(10 190) rotate(-12) scale(${s})`} opacity={Math.min(1, stamp * 2)}>
          <rect x={-150} y={-60} width={300} height={120} rx={12} fill="none" stroke={C.coral} strokeWidth={12} />
          <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={84} fill={C.coral}>1991</text>
        </g>
      ) : null}
    </g>
  );
};

/** Director's monitor with the film's title (no frames from the film are reproduced). */
const TitleMonitor: React.FC<{tau: number}> = ({tau}) => {
  const enter = easeOut(seg(tau, T_HINT + 0.2, T_HINT + 0.7)) * (1 - easeIn(seg(tau, FILM_END - 1.3, FILM_END - 0.8)));
  return (
    <g transform={`translate(${80 - (1 - enter) * 600} 640)`} opacity={enter}>
      <rect x={0} y={0} width={700} height={400} rx={18} fill="#1E2026" stroke="#0B0C0F" strokeWidth={8} />
      <rect x={26} y={26} width={648} height={348} rx={8} fill="#0B0C0F" />
      <text x={350} y={180} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={50} fill="#F4ECD6">F.02 DECOMMISSION</text>
      <text x={350} y={240} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill="#AEB3BD">Figure · Sep 30, 2026</text>
    </g>
  );
};

// ---------------------------------------------------------------- 2D foundry beats
const FS = 0.6;
const ROBOT = stand(250, FD.deck.top, FS, {yaw: 0.8, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3})});
const T_X = T_REASON + 0.25;            // the chain crosses the lens
const CHAIN_X = 520, HOOK_Y = 170;
const cTop: Cam = {x: CHAIN_X, y: 20, z: 1.5};
const cF: Cam = {x: 520, y: 470, z: 1.1};
/** First camera of the training section: low and close at the edge (Film ends by pushing into it). */
export const TRAIN_C0: Cam = {x: 330, y: 390, z: 2.0, rot: -3};

/** The foundry crane chain and hook in the main layer — the film's chain, now a real object in the set. */
export const CraneChain: React.FC<{lw: number; sw: number}> = ({lw, sw}) => {
  const links: React.ReactNode[] = [];
  for (let k = 0; k < 26; k++) {
    const y = -900 + k * 44;
    if (y > HOOK_Y - 40) break;
    links.push(k % 2 === 0
      ? <rect key={k} x={CHAIN_X - 14} y={y} width={28} height={52} rx={13} fill="none" stroke="#1A1314" strokeWidth={lw * 2.4} />
      : <rect key={k} x={CHAIN_X - 4} y={y} width={8} height={52} rx={4} fill="#1A1314" />);
  }
  return (
    <g transform={`rotate(${sw} ${CHAIN_X} -900)`}>
      {links}
      <path d={`M${CHAIN_X} ${HOOK_Y - 40} q0 70 -50 70 q-46 0 -46 -44`} fill="none" stroke="#1A1314" strokeWidth={lw * 5} strokeLinecap="round" />
      <path d={`M${CHAIN_X} ${HOOK_Y - 40} q0 70 -50 70 q-46 0 -46 -44`} fill="none" stroke="#6A5A57" strokeWidth={lw * 2} strokeLinecap="round" />
    </g>
  );
};

/** Camera jib with a camera head sweeping over the ladle (world). */
const Jib: React.FC<{lw: number; a: number}> = ({lw, a}) => {
  const bx = 1260, by = FD.floor, px = bx, py = by - 330;
  const L = 760, tip = {x: px + Math.cos((a * Math.PI) / 180) * L, y: py + Math.sin((a * Math.PI) / 180) * L};
  const back = {x: px - Math.cos((a * Math.PI) / 180) * 220, y: py - Math.sin((a * Math.PI) / 180) * 220};
  return (
    <g>
      <path d={`M${bx - 90} ${by} L${bx} ${py + 20} L${bx + 90} ${by}`} fill="none" stroke={C.ink} strokeWidth={lw * 3} strokeLinejoin="round" />
      <rect x={bx - 20} y={py} width={40} height={by - py} fill="#3A3D44" stroke={C.ink} strokeWidth={lw} />
      <line x1={back.x} y1={back.y} x2={tip.x} y2={tip.y} stroke={C.ink} strokeWidth={lw * 7} strokeLinecap="round" />
      <line x1={back.x} y1={back.y} x2={tip.x} y2={tip.y} stroke="#55595F" strokeWidth={lw * 4} strokeLinecap="round" />
      <rect x={back.x - 40} y={back.y - 30} width={80} height={70} rx={8} fill="#2B2E33" stroke={C.ink} strokeWidth={lw} />
      <circle cx={px} cy={py} r={18} fill={C.saffron} stroke={C.ink} strokeWidth={lw} />
      <g transform={`translate(${tip.x} ${tip.y + 34})`}>
        <rect x={-70} y={-40} width={140} height={80} rx={10} fill="#24282E" stroke={C.ink} strokeWidth={lw} />
        <rect x={-110} y={-26} width={44} height={52} rx={6} fill="#1A1D21" stroke={C.ink} strokeWidth={lw} />
        <circle cx={50} cy={-20} r={7} fill={C.coral} />
      </g>
      <line x1={tip.x} y1={tip.y} x2={tip.x} y2={tip.y + 0} stroke={C.ink} strokeWidth={lw * 2} />
    </g>
  );
};

const Badge: React.FC<{x: number; y: number; k: number; label: string; children: React.ReactNode}> = ({x, y, k, label, children}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 40}) scale(${0.7 + 0.3 * e})`} opacity={Math.min(1, k * 2.5)}>
      <circle r={118} fill={C.paper} stroke={C.ink} strokeWidth={8} />
      {children}
      <rect x={-130} y={136} width={260} height={64} rx={14} fill={C.ink} />
      <text x={0} y={180} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.paper}>{label}</text>
    </g>
  );
};

const FoundryBeats: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  // tilt down the chain to the robot at the edge; then hold wide for the business case and the crew; finally push in
  let cam = mixCam(cTop, cF, easeInOut(seg(tau, T_X + 0.22, T_FIGR + 0.2)));
  cam = mixCam(cam, TRAIN_C0, easeInOut(seg(tau, FILM_END - 1.1, FILM_END)));
  const lw = 4 / cam.z;
  const sw = Math.sin((tau - T_X) * 2.2) * 2.2 * Math.exp(-Math.max(0, tau - T_X) * 0.6);
  const jibA = lerp(-160, -128, easeInOut(seg(tau, T_HINT, FILM_END)));
  const jibIn = easeOut(seg(tau, T_HINT - 0.2, T_HINT + 0.6));
  const kChip = seg(tau, T_REASON + 0.45, T_REASON + 0.8) * (1 - seg(tau, T_BIZ - 0.25, T_BIZ));
  const kAct = seg(tau, T_FIGR - 0.2, T_FIGR + 0.15) * (1 - seg(tau, T_BIZ - 0.25, T_BIZ));
  const kEq = seg(tau, T_FIGR + 0.15, T_FIGR + 0.4) * (1 - seg(tau, T_BIZ - 0.25, T_BIZ));
  return (
    <Scene bg="#221A21">
      <FoundryView cam={cam} t={tau} glow={1} hook={false}
        extraBack={(
          <g>
            <FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="flA2" />
            <FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="flB2" />
          </g>
        )}
        behind={(
          <g>
            <CraneChain lw={lw} sw={sw} />
            <Bot cam={cam} id="fmR" model="F02" s={FS} pose={{...ROBOT, head: 6 * smooth(seg(tau, T_X + 0.4, T_X + 1.2))}} />
          </g>
        )}
        front={(
          <g>
            <g transform={`translate(${(1 - jibIn) * 900} 0)`}><Jib lw={lw} a={jibA} /></g>
            <TripodCam x={1170} y={FD.floor} lw={lw} />
            <Crew look={CAST.clerkC} x={1330} y={FD.floor} h={400} frame={f} seed={14} flip
              pose={{...IDLE, armR: {a: 70, b: 40}, armL: {a: 50, b: 60}, lookX: 0.4, mouth: 'smile'}} />
          </g>
        )} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <Badge x={1150} y={300} k={kChip} label="1991 film">
          <ChipIcon x={0} y={0} s={1.25} />
        </Badge>
        {kEq > 0 ? <text x={1370} y={330} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={110} fill={C.paper} opacity={kEq}>≈</text> : null}
        <Badge x={1590} y={300} k={kAct} label="Figure">
          <ActuatorArt r={92} rot={(tau - T_FIGR) * 40} lw={4} id="fmAct" />
        </Badge>
        {tau > T_BIZ && tau < T_HINT + 0.5 ? <g transform={`translate(${easeIn(seg(tau, T_HINT - 0.1, T_HINT + 0.4)) * 1100} 0)`}><BizClipboard tau={tau} /></g> : null}
        <TitleMonitor tau={tau} />
      </svg>
    </Scene>
  );
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const tau = FILM_START + f / 30;
  if (tau < T_T2) {
    const away = easeIn(seg(tau, FILM_START, FILM_START + 0.32));
    const cc = clapCover(1);
    return (
      <AbsoluteFill>
        <PhoneBg tau={tau} />
        <Phone tau={tau} />
        {away < 1 ? (
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            <BigClapper x={cc.x} y={cc.y - away * 2600} s={cc.s} rot={cc.rot} clap={1} />
          </svg>
        ) : null}
      </AbsoluteFill>
    );
  }
  if (tau < T_X - 0.22) return <Movie tau={tau} />;
  if (tau < T_X + 0.22) {
    // a heavy chain swings past the lens: the film's glow on one side, the foundry on the other
    const e = easeInOut(seg(tau, T_X - 0.22, T_X + 0.22));
    const bx = mix(-420, 2340, e);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(${bx}px 0, 1920px 0, 1920px 1080px, ${bx}px 1080px)`}}><Movie tau={Math.min(tau, T_X - 0.01)} /></AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(0 0, ${bx}px 0, ${bx}px 1080px, 0 1080px)`}}><FoundryBeats tau={tau} f={f} /></AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}><LensChain x={bx} tilt={mix(-6, 6, e)} /></svg>
      </AbsoluteFill>
    );
  }
  return <FoundryBeats tau={tau} f={f} />;
};
void T_APPEARS; void clamp01; void toScreen; void Layer;
