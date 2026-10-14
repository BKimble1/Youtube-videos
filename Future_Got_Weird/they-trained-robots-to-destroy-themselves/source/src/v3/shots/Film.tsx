// SECTION B3: the post, the reply, the 1991 movie parallel, and the film crew. No mock X branding, no screenshots,
// no likeness of any actor: the post is shown as a labelled paraphrase, the reply as the short verified quote.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth} from '../engine/math';
import {Item, box, line3, tube} from '../engine/prims';
import {STAND} from '../robot/motion';
import {T, blockStart} from '../cues';
import {WHY_END} from './Why';
import {FoundryScene, easeInOut, easeOut} from './HookFoundry';
import {DECK, LADLE} from '../sets/Foundry';
import {filmLights} from '../sets/Props3D';
import {C, F} from '../../theme';

export const FILM_START = WHY_END;
export const FILM_END = blockStart('B04') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const T_POST = T('In August') - 0.1;
const T_REPLY = T('Arnold Schwarzenegger replied') - 0.05;
const T_T2 = T('In Terminator Two') - 0.12;
const T_REASON = T('which is almost exactly') - 0.1;
const T_BIZ = T('Hollywood wrote') - 0.1;
const T_HINT = T('Figure took the hint') - 0.1;

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

// ---------------------------------------------------------------- foundry: the crane chain match, the business case gag, the film crew
const craneChain = (y0: number, y1: number): ((pr: Parameters<NonNullable<Parameters<typeof FoundryScene>[0]['extra']>>[0]) => Item[]) => (pr) => {
  const items: Item[] = [];
  const x = -60, z = 120;
  for (let k = 0; k < 18; k++) {
    const y = y1 + ((y0 - y1) * k) / 17;
    const q = pr.p([x, y, z]);
    items.push({z: q.z - 2, key: 'ch' + k, el: <rect key={'ch' + k} x={q.x - 9 * q.s} y={q.y - 13 * q.s} width={18 * q.s} height={26 * q.s} rx={8 * q.s} fill="none" stroke="#1A1718" strokeWidth={Math.max(2, 5 * q.s)} />});
  }
  return items;
};

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
  const enter = easeOut(seg(tau, T_HINT + 0.2, T_HINT + 0.7));
  return (
    <g transform={`translate(${80 - (1 - enter) * 600} 640)`} opacity={enter}>
      <rect x={0} y={0} width={700} height={400} rx={18} fill="#1E2026" stroke="#0B0C0F" strokeWidth={8} />
      <rect x={26} y={26} width={648} height={348} rx={8} fill="#0B0C0F" />
      <text x={350} y={180} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={50} fill="#F4ECD6">F.02 DECOMMISSION</text>
      <text x={350} y={240} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill="#AEB3BD">Figure · Sep 30, 2026</text>
    </g>
  );
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const tau = FILM_START + f / 30;
  if (tau < T_T2) {
    return (
      <AbsoluteFill>
        <PhoneBg tau={tau} />
        <Phone tau={tau} />
      </AbsoluteFill>
    );
  }
  const T_X = T_REASON + 0.25;
  if (tau < T_X - 0.22) return <Movie tau={tau} />;
  const pose = STAND([DECK.edgeX - 34, DECK.y + 95.4, 0], Math.PI / 2);
  pose.head.pitch = 0.3;
  if (tau < T_X + 0.22) {
    // a crane chain swings past the lens: the movie's glow on one side, the foundry on the other
    const e = easeInOut(seg(tau, T_X - 0.22, T_X + 0.22));
    const bx = mix(-420, 2340, e);
    const u0 = 0;
    const cam: Cam3 = {pos: lerp3([-40, 1150, 520], [140, 760, 620], u0), target: lerp3([-60, 1100, 120], [-180, 620, 0], u0), fov: 42};
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(${bx}px 0, 1920px 0, 1920px 1080px, ${bx}px 1080px)`}}><Movie tau={Math.min(tau, T_X - 0.01)} /></AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(0 0, ${bx}px 0, ${bx}px 1080px, 0 1080px)`}}>
          <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 'f3', inside: false}]} entries={[]} extra={craneChain(1500, 760)} />
        </AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}><LensChain x={bx} tilt={mix(-6, 6, e)} /></svg>
      </AbsoluteFill>
    );
  }
  if (tau < T_HINT) {
    // match cut: the movie's chain becomes the foundry crane chain; the camera tilts down it to the robot at the edge
    const u = easeInOut(seg(tau, T_X + 0.22, T_BIZ + 0.3)) * 1;
    const drift = smooth(seg(tau, T_BIZ + 0.3, T_HINT));
    const cam: Cam3 = {pos: add(lerp3([-40, 1150, 520], [140, 760, 620], u), [70 * drift, -30 * drift, 40 * drift]), target: lerp3([-60, 1100, 120], [-180, 620, 0], u), fov: 42 - 3 * drift};
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 'f3', inside: false}]} entries={[]} extra={craneChain(1500, 760)} />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          {tau > T_BIZ ? <BizClipboard tau={tau} /> : null}
        </svg>
      </AbsoluteFill>
    );
  }
  // film crew: lights on, a camera crane arm sweeps over the ladle
  const u = easeInOut(seg(tau, T_HINT, FILM_END));
  const cam: Cam3 = {pos: lerp3([900, 980, 1250], [620, 860, 1150], u), target: [-140, 470, 0], fov: 46, roll: mix(-2, 1, u)};
  const sweep = mix(-0.6, 0.5, u);
  const crane = (pr: Parameters<NonNullable<Parameters<typeof FoundryScene>[0]['extra']>>[0], env: Parameters<NonNullable<Parameters<typeof FoundryScene>[0]['extra']>>[1]): Item[] => {
    const base: V3 = [520, 0, 300];
    const tip: V3 = [base[0] + Math.cos(Math.PI - sweep) * 520, 640, base[2] + Math.sin(Math.PI - sweep) * 300];
    return [
      ...box(pr, env, 'crBase', {c: [base[0], 60, base[2]], size: [120, 120, 120], color: '#2B2E33'}),
      tube(pr, env, 'crArm', [base[0], 260, base[2]], tip, 8, '#3A3D44'),
      tube(pr, env, 'crPost', [base[0], 120, base[2]], [base[0], 260, base[2]], 10, '#3A3D44'),
      ...box(pr, env, 'crCam', {c: [tip[0], tip[1] - 30, tip[2]], size: [50, 40, 70], color: '#15171A'}),
      ...filmLights(pr, env, 1),
      line3(pr, 'cable', [[base[0], 2, base[2]], [base[0] - 300, 2, base[2] + 200], [base[0] - 600, 2, base[2] + 260]], '#15171A', 3, {smooth: true}),
    ];
  };
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 'f3b', inside: false}]} entries={[]} extra={crane} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <TitleMonitor tau={tau} />
      </svg>
    </AbsoluteFill>
  );
};
void smooth; void LADLE;
