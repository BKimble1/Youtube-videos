// V5 POST ("Blame a reply on X" → "…finished film"). Insert on the director's phone: a quick flick through the feed
// lands on the CEO's post (PARAPHRASED); the reply arrives on cue and its quote lights up word by word (QUOTED). The
// reply card lifts off the screen and flips into the 1991 slate; the clap pushes the slate over the lens and it drops
// away to reveal the film set, where the crane is already lowering a chip into the ladle (the film's idea, re-enacted).
// Chip ≈ actuator, the business-case gag in the director's hand, then the director's monitor: title card, live feed of
// the robot at the edge, and we push through the screen into the training explanation.
// No likeness of any actor and no frames from the film; platform branding is not shown.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, mixCam, seg, smooth, easeInOut, easeOut, easeIn, lerp, clamp01, toScreen, backOut} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {FilmLight, TripodCam, ActuatorArt} from '../../v4/sets/props';
import {stand, A} from '../../v4/rig/poses';
import {smoothCam} from '../kit/cam5';
import {S_HK} from './Hook';
import {IMATRA_END} from './Imatra';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {ChipIcon} from '../../components/Props';
import {C, F} from '../../theme';

export const POST_START = IMATRA_END;
export const POST_END = T('Now the hard') - 0.1;
const T_POST = T('In August') - 0.05;
const T_ASKED = T('asked what to do');
const T_REPLY = T('Arnold Schwarzenegger replied') - 0.05;
const T_YOU = T('You should melt');
const T_T2 = T('In Terminator Two');
const T_TWO = T('Two');
const T_LOWER = T('lowered into');
const T_COPY = T('copy its technology');
const T_REASON = T('which is almost exactly') - 0.05;
const T_FIGR = T('Figure’s reason');
const T_BIZ = T('Hollywood wrote') - 0.1;
const T_1991 = T('nineteen ninety-one');
const T_HINT = T('Figure took the hint') - 0.05;
const T_APPEARS = T('appears in the finished');
const FS = S_HK;

// ------------------------------------------------------------------ the phone (screen space, HTML)
const FLIP0 = T_T2 - 0.3, FLIP1 = T_T2 - 0.05;       // reply card lifts and flips into the slate
const CLAP = T_TWO;                                    // the clap lands on "Two"
const FILL0 = CLAP + 0.02, FILL1 = CLAP + 0.2;         // the slate fills the lens
const DROP0 = FILL1 + 0.04, DROP1 = DROP0 + 0.36;      // and drops away, revealing the set
const QUOTE = ['“You', 'should', 'melt', 'them.”'];

const Phone: React.FC<{t: number}> = ({t}) => {
  const enter = easeOut(seg(t, POST_START, POST_START + 0.35));
  // feed scroll: a quick flick that decelerates onto the post, then a nudge up when the reply arrives
  const flick = easeOut(seg(t, POST_START + 0.05, T_POST + 0.1));
  const scroll = lerp(-1500, 0, flick) + 330 * easeInOut(seg(t, T_REPLY - 0.05, T_REPLY + 0.45));
  const reply = easeOut(seg(t, T_REPLY, T_REPLY + 0.4));
  const lift = seg(t, FLIP0 - 0.15, FLIP0);
  // read at phone size: push in on the post, ease back a little for the reply
  const push = lerp(1.0, 1.5, easeInOut(seg(t, T_POST - 0.2, T_POST + 0.5))) * lerp(1, 0.94, easeInOut(seg(t, T_REPLY - 0.1, T_REPLY + 0.4)));
  const sway = Math.sin((t - POST_START) * 1.1) * 0.8;
  const words = (t0: number) => QUOTE.map((w, i) => {
    const on = seg(t, t0 + i * 0.3, t0 + i * 0.3 + 0.12);
    return <span key={i} style={{background: on > 0 ? `rgba(28,167,160,${0.22 * on})` : undefined, borderRadius: 8, padding: '0 4px'}}>{w} </span>;
  });
  const avatar = (letter: string, col: string) => (
    <div style={{width: 74, height: 74, borderRadius: 37, background: col, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{letter}</div>
  );
  const filler = (k: number) => (
    <div key={'fl' + k} style={{background: '#FFFFFF', borderRadius: 26, padding: '26px 28px', margin: '0 22px 22px', height: 260, boxSizing: 'content-box', opacity: 0.9}}>
      <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: ['#D3E1F8', '#FBD2C8', '#BFE8E3', '#FFE9A8'][k % 4]}} />
        <div style={{width: 220, height: 20, borderRadius: 10, background: '#D9DEE4'}} />
      </div>
      {[300, 380, 240].map((w, i) => <div key={i} style={{width: w, height: 18, borderRadius: 9, background: '#E4E8EC', marginTop: 22}} />)}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 960 - 300, top: 70 + (1 - enter) * 700 + lerp(0, 120, easeInOut(seg(t, T_POST - 0.2, T_POST + 0.5))), width: 600, height: 1120, transform: `rotate(${sway}deg) scale(${push})`, transformOrigin: '50% 18%'}}>
      <div style={{position: 'absolute', inset: 0, background: '#1C1F25', borderRadius: 72, border: '8px solid #0E1013', boxShadow: '30px 40px 0 rgba(22,42,50,0.18)'}} />
      <div style={{position: 'absolute', left: 26, top: 26, right: 26, bottom: 26, background: '#EEF1F4', borderRadius: 52, overflow: 'hidden'}}>
        <div style={{height: 92, background: '#FFFFFF', borderBottom: '2px solid #D9DEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink}}>Posts</div>
        <div style={{transform: `translateY(${-scroll + 24 - 2004}px)`}}>
          {[0, 1, 2, 3, 4, 5].map(filler)}
          <div style={{background: '#FFFFFF', borderRadius: 26, padding: '26px 28px', margin: '0 22px 22px', border: '3px solid #D9DEE4'}}>
            <div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
              {avatar('B', C.blue)}
              <div>
                <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>Brett Adcock</div>
                <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 25, color: C.inkMuted}}>Figure CEO · Aug 2026</div>
              </div>
            </div>
            <div style={{fontFamily: F.body, fontWeight: 700, fontStyle: 'italic', fontSize: 38, color: C.inkSoft, marginTop: 20, lineHeight: 1.28}}>asks what to do with the retired F.02 robots</div>
            <div style={{display: 'inline-block', marginTop: 16, padding: '6px 16px', borderRadius: 999, background: C.paperDeep, fontFamily: F.body, fontWeight: 800, fontSize: 24, color: C.inkSoft, opacity: seg(t, T_ASKED, T_ASKED + 0.3)}}>PARAPHRASED</div>
          </div>
          <div style={{background: '#FFFFFF', borderRadius: 26, padding: '26px 28px', margin: '0 22px 22px', border: `3px solid ${C.teal}`, opacity: reply * (1 - lift), transform: `translateY(${(1 - reply) * 80}px)`}}>
            <div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
              {avatar('A', C.coral)}
              <div>
                <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>Arnold Schwarzenegger</div>
                <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 25, color: C.inkMuted}}>reply · Aug 19, 2026</div>
              </div>
            </div>
            <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 60, color: C.ink, marginTop: 18, lineHeight: 1.1}}>{words(T_YOU - 0.02)}</div>
            <div style={{display: 'inline-block', marginTop: 16, padding: '6px 16px', borderRadius: 999, background: C.tealLight, fontFamily: F.body, fontWeight: 800, fontSize: 24, color: C.tealDeep}}>QUOTED</div>
          </div>
        </div>
      </div>
    </div>
  );
};
const PhoneBg: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #FFF8E6 0%, #F1E6C9 60%, #E2D5B2 100%)'}}>
    {[[260, 260, 120, C.saffronLight], [1600, 340, 160, C.tealLight], [1500, 860, 110, C.coralLight], [330, 840, 140, C.blueLight]].map(([x, y, r, col], k) => (
      <div key={k} style={{position: 'absolute', left: (x as number) - (r as number) + Math.sin(t * 0.5 + k) * 12, top: (y as number) - (r as number), width: (r as number) * 2, height: (r as number) * 2, borderRadius: '50%', background: col as string, opacity: 0.7}} />
    ))}
  </AbsoluteFill>
);

/** The reply card as it leaves the phone, then the slate it flips into (screen space SVG). */
const CardToSlate: React.FC<{t: number}> = ({t}) => {
  if (t < FLIP0 - 0.15 || t > DROP1) return null;
  // the card: from its place on the phone to the centre, turning edge-on
  const u = easeInOut(seg(t, FLIP0 - 0.15, FLIP0 + 0.1));
  const flip = seg(t, FLIP0 + 0.05, FLIP1);              // 0 → 1: card edge-on at 0.5, slate face-on at 1
  const sx = Math.abs(Math.cos(Math.PI * flip));
  const cardSide = flip < 0.5;
  const cx = lerp(960, 960, u), cy = lerp(700, 520, u);
  const sc = lerp(1, 1.25, u);
  // after the flip: the slate; clap; fill the lens; drop away
  const clap = easeIn(seg(t, CLAP - 0.12, CLAP));
  const fill = easeIn(seg(t, FILL0, FILL1));
  const drop = easeIn(seg(t, DROP0, DROP1));
  const s2 = lerp(1.0, 3.4, fill);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      {cardSide ? (
        <g transform={`translate(${cx} ${cy}) scale(${sc * sx} ${sc})`}>
          <rect x={-275} y={-150} width={550} height={300} rx={26} fill="#FFFFFF" stroke={C.teal} strokeWidth={4} />
          <text x={-230} y={10} fontFamily={F.display} fontWeight={600} fontSize={52} fill={C.ink}>“You should melt them.”</text>
        </g>
      ) : (
        <g transform={`translate(${cx} ${cy + drop * 1500}) rotate(${-2 + drop * 14}) scale(${sx * s2 * 0.82} ${s2 * 0.82})`}>
          <rect x={-420} y={-180} width={840} height={440} rx={16} fill="#1E2026" stroke="#0B0C0F" strokeWidth={8} />
          <g transform={`rotate(${-24 * (1 - clap)} -420 -180)`}>
            <rect x={-420} y={-276} width={840} height={96} rx={8} fill="#F4ECD6" stroke="#0B0C0F" strokeWidth={8} />
            {Array.from({length: 7}, (_, k) => <path key={k} d={`M${-390 + k * 122} -276 l60 0 l-52 96 l-60 0 Z`} fill="#1E2026" />)}
          </g>
          <text x={-370} y={-40} fontFamily={F.display} fontWeight={700} fontSize={92} fill="#F4ECD6">Terminator 2</text>
          <text x={-370} y={80} fontFamily={F.mono} fontWeight={700} fontSize={70} fill={C.saffron}>1991</text>
          <line x1={-420} y1={130} x2={420} y2={130} stroke="#F4ECD6" strokeWidth={4} />
        </g>
      )}
    </svg>
  );
};

// ------------------------------------------------------------------ the film set (side view)
const CHX = 790;                                      // crane hook over the ladle
const HOOK_TOP = 150, HOOK_LOW = FD.ladle.surf + 60;
const hookY = (t: number) => lerp(HOOK_TOP, HOOK_LOW, easeInOut(seg(t, DROP0 - 0.2, T_COPY + 0.45)));
export const POST_ROBOT = stand(FD.deck.edge - 4 - 64 * FS, FD.deck.top, FS, {yaw: 0.7, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3})});
const ROBOT = POST_ROBOT;
const CAM_SET: Cam = {x: 760, y: 470, z: 1.05};
const CAM_DIP: Cam = {x: 700, y: 560, z: 1.18};
const CAM_DIR: Cam = {x: 900, y: 560, z: 0.98};
// the monitor (world, foreground left) and the feed camera it shows
const MON = {x: 120, y: 760, w: 480, h: 270};
/** The live feed the monitor shows = the first camera of the training section. */
export const CAM_FEED: Cam = {x: 270, y: 418, z: 2.1};
const camMonitor: Cam = {x: MON.x + MON.w / 2, y: MON.y + MON.h / 2, z: 1920 / MON.w};
const CAM_MONW: Cam = {x: 360, y: 760, z: 1.35};
const setCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_SET, CAM_DIP, easeInOut(seg(t, T_LOWER - 0.3, T_COPY + 0.4)));
  c = mixCam(c, CAM_DIR, easeInOut(seg(t, T_REASON + 0.1, T_BIZ + 0.5)));
  c = mixCam(c, CAM_MONW, easeInOut(seg(t, T_HINT - 0.1, T_HINT + 0.9)));
  return c;
};
const PUSH0 = POST_END - 0.95;
const setCam = (t: number): Cam => {
  const base = smoothCam(setCamRaw, Math.min(t, PUSH0), 0.25);
  return t < PUSH0 ? base : mixCam(base, camMonitor, easeIn(seg(t, PUSH0, POST_END)));
};

const HookChain: React.FC<{t: number; lw: number}> = ({t, lw}) => {
  const y = hookY(t);
  const links: React.ReactNode[] = [];
  for (let k = 0; k < 40; k++) {
    const ly = -900 + k * 44;
    if (ly > y - 40) break;
    links.push(k % 2 === 0
      ? <rect key={k} x={CHX - 14} y={ly} width={28} height={52} rx={13} fill="none" stroke="#1A1314" strokeWidth={lw * 2.4} />
      : <rect key={k} x={CHX - 4} y={ly} width={8} height={52} rx={4} fill="#1A1314" />);
  }
  const chipOn = t < T_COPY + 0.7;
  return (
    <g>
      {links}
      <path d={`M${CHX} ${y - 40} q0 70 -50 70 q-46 0 -46 -44`} fill="none" stroke="#1A1314" strokeWidth={lw * 5} strokeLinecap="round" />
      {chipOn ? (
        <g transform={`translate(${CHX - 50} ${y + 70})`}>
          <line x1={0} y1={-40} x2={0} y2={-10} stroke="#1A1314" strokeWidth={lw * 1.5} />
          <ChipIcon x={0} y={36} s={0.9} />
        </g>
      ) : null}
    </g>
  );
};

const Badge: React.FC<{x: number; y: number; k: number; label: string; children: React.ReactNode}> = ({x, y, k, label, children}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 40}) scale(${0.7 + 0.3 * e})`} opacity={Math.min(1, k * 2.5)}>
      <circle r={112} fill={C.paper} stroke={C.ink} strokeWidth={8} />
      {children}
      <rect x={-124} y={130} width={248} height={60} rx={14} fill={C.ink} />
      <text x={0} y={172} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.paper}>{label}</text>
    </g>
  );
};

const Clipboard: React.FC<{k: number; stamp: number}> = ({k, stamp}) => {
  const s = 1 + (1 - easeOut(stamp)) * 0.9;
  return (
    <g opacity={Math.min(1, k * 3)}>
      <rect x={-230} y={-280} width={460} height={600} rx={22} fill="#C9924F" stroke={C.ink} strokeWidth={8} />
      <rect x={-200} y={-240} width={400} height={530} rx={8} fill="#FFFDF6" stroke={C.ink} strokeWidth={5} />
      <rect x={-80} y={-300} width={160} height={60} rx={12} fill="#8F9BA6" stroke={C.ink} strokeWidth={6} />
      <text x={0} y={-160} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={50} fill={C.ink}>BUSINESS</text>
      <text x={0} y={-104} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={50} fill={C.ink}>CASE</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-150} y={-40 + i * 44} width={i === 3 ? 180 : 300} height={14} rx={7} fill="#D9DEE4" />)}
      {stamp > 0 ? (
        <g transform={`translate(10 190) rotate(-12) scale(${s})`} opacity={Math.min(1, stamp * 2)}>
          <rect x={-150} y={-60} width={300} height={120} rx={12} fill="none" stroke={C.coral} strokeWidth={12} />
          <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={84} fill={C.coral}>1991</text>
        </g>
      ) : null}
    </g>
  );
};

/** The monitor on its stand (world). Shows the title card, then the live feed (a real render of the set). */
const Monitor: React.FC<{t: number; f: number; cam: Cam; lw: number}> = ({t, f, cam, lw}) => {
  const live = seg(t, T_APPEARS + 0.55, T_APPEARS + 0.75);
  const s0 = toScreen(cam, MON.x, MON.y), s1 = toScreen(cam, MON.x + MON.w, MON.y + MON.h);
  const sc = (s1.x - s0.x) / 1920;
  return (
    <g>
      <rect x={MON.x + MON.w / 2 - 14} y={MON.y + MON.h} width={28} height={FD.floor + 200 - MON.y - MON.h} fill="#3A3D44" stroke={C.ink} strokeWidth={lw} />
      <rect x={MON.x - 26} y={MON.y - 26} width={MON.w + 52} height={MON.h + 52} rx={18} fill="#1E2026" stroke="#0B0C0F" strokeWidth={lw * 2} />
      <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} fill="#0B0C0F" />
      {live < 1 ? (
        <g opacity={(1 - live) * seg(t, T_HINT + 0.1, T_HINT + 0.4)}>
          <text x={MON.x + MON.w / 2} y={MON.y + 116} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={42} fill="#F4ECD6">F.02 DECOMMISSION</text>
          <text x={MON.x + MON.w / 2} y={MON.y + 170} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill="#AEB3BD">Figure · Sep 30, 2026</text>
          <text x={MON.x + MON.w / 2} y={MON.y + 216} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={30} fill="#AEB3BD" opacity={seg(t, T_APPEARS - 0.2, T_APPEARS + 0.1)}>with Arnold Schwarzenegger</text>
        </g>
      ) : null}
      {live > 0 ? <FeedPicture t={t} f={f} s0={s0} s1={s1} sc={sc} k={live} /> : null}
      {void f}
    </g>
  );
};
/** Placeholder: the live picture is drawn in screen space by the caller (see Post), not inside the world layer. */
const FeedPicture: React.FC<{t: number; f: number; s0: {x: number; y: number}; s1: {x: number; y: number}; sc: number; k: number}> = () => null;

export const Post: React.FC = () => {
  const f = useCurrentFrame() + Math.round(POST_START * 30);
  const t = f / 30;
  if (t < FILL1) {
    return (
      <AbsoluteFill>
        <PhoneBg t={t} />
        {t < FLIP0 + 0.1 ? <Phone t={t} /> : null}
        <CardToSlate t={t} />
      </AbsoluteFill>
    );
  }
  const cam = setCam(t);
  const lw = 4 / cam.z;
  const kChip = seg(t, T_REASON + 0.1, T_REASON + 0.45) * (1 - seg(t, T_BIZ - 0.25, T_BIZ));
  const kEq = seg(t, T_FIGR - 0.3, T_FIGR - 0.05) * (1 - seg(t, T_BIZ - 0.25, T_BIZ));
  const kAct = seg(t, T_FIGR - 0.2, T_FIGR + 0.15) * (1 - seg(t, T_BIZ - 0.25, T_BIZ));
  const clipIn = easeOut(seg(t, T_BIZ, T_BIZ + 0.45)) * (1 - easeIn(seg(t, T_HINT, T_HINT + 0.45)));
  const stamp = seg(t, T_1991 - 0.05, T_1991 + 0.15);
  const dirArm = {a: lerp(20, 120, clipIn), b: lerp(30, 80, clipIn)};
  const tDip = t - (T_COPY + 0.45);
  // the monitor's live picture (screen space): the set from the feed camera, mapped into the screen rect
  const s0 = toScreen(cam, MON.x, MON.y), s1 = toScreen(cam, MON.x + MON.w, MON.y + MON.h);
  const live = seg(t, T_APPEARS + 0.55, T_APPEARS + 0.75);
  const sc = (s1.x - s0.x) / 1920;
  return (
    <AbsoluteFill>
      <Scene bg="#221A21">
        <FoundryView5 cam={cam} t={t} hook={false} id="pst" hit={tDip > 0 ? {x: CHX - 50, t: tDip} : undefined}
          extraBack={(
            <g>
              <FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="pstLA" />
              <FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="pstLB" />
            </g>
          )}
          behind={(
            <g>
              <HookChain t={t} lw={lw} />
              <Bot cam={cam} id="pstR" model="F02" s={FS} pose={{...ROBOT, head: 4 + 6 * smooth(seg(t, T_LOWER, T_COPY))}} />
            </g>
          )}
          front={(
            <g>
              <TripodCam x={-120} y={FD.floor + 40} lw={lw} h={420} />
              <Crew look={CAST.clerkC} x={1480} y={FD.floor + 40} h={470} frame={f} seed={14} flip life={0.6}
                pose={{...IDLE, armR: dirArm, armL: {a: 40, b: 60}, lookX: clipIn > 0.5 ? 0.6 : -0.5, lookY: 0.1, mouth: t > T_1991 && clipIn > 0.5 ? 'grin' : 'smile', brows: clipIn > 0.5 ? 0.5 : 0}} />
              <Monitor t={t} f={f} cam={cam} lw={lw} />
            </g>
          )} />
        {/* chip ≈ actuator */}
        <Badge x={1180} y={240} k={kChip} label="1991 film"><ChipIcon x={0} y={0} s={1.2} /></Badge>
        {kEq > 0 ? <text x={1400} y={270} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={110} fill={C.paper} opacity={kEq}>≈</text> : null}
        <Badge x={1620} y={240} k={kAct} label="Figure"><ActuatorArt r={88} rot={(t - T_FIGR) * 40} lw={4} id="pstAct" /></Badge>
        {/* the business case, held up by the director */}
        {clipIn > 0 ? (() => {
          const hs = toScreen(cam, 1480 - 110, FD.floor + 40 - 380);
          return <g transform={`translate(${hs.x - 120 + (1 - clipIn) * 300} ${hs.y - 60 + (1 - clipIn) * 400}) rotate(-6) scale(${0.62})`}><Clipboard k={clipIn} stamp={stamp} /></g>;
        })() : null}
        {/* live feed inside the monitor */}
        {live > 0 ? (
          <g opacity={live}>
            <defs><clipPath id="monClip"><rect x={s0.x} y={s0.y} width={s1.x - s0.x} height={s1.y - s0.y} /></clipPath></defs>
            <g clipPath="url(#monClip)">
              <g transform={`translate(${s0.x} ${s0.y}) scale(${sc})`}>
                <rect width={1920} height={1080} fill="#221A21" />
                <FoundryView5 cam={CAM_FEED} t={t} hook={false} id="feed"
                  extraBack={<FilmLight x={-260} y={FD.deck.top} lw={4 / CAM_FEED.z} on={1} aim={16} id="feedLA" />}
                  behind={<Bot cam={CAM_FEED} id="feedR" model="F02" s={FS} pose={ROBOT} />} />
              </g>
            </g>
          </g>
        ) : null}
      </Scene>
      {t < DROP1 ? <CardToSlate t={t} /> : null}
    </AbsoluteFill>
  );
};
void Layer; void clamp01; void backOut;
/** Event times for the sound cue sheet. */
export const POST_EV = {FLIP0, FLIP1, CLAP, FILL1, DROP0, DROP1, PUSH0};
