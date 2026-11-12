import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {SignalWorld} from './SignalWorld';
import {FPS, SEG, EVENTS_EXT, spikeTrace, uvOn, UV, T} from './timing';
import {clamp, ss, noise1} from './lib';
import {C, INK} from './palette';
import {poly, Pt} from './g2';
import TL from './data/timeline.json';

const W = 1080, H = 1920;

/** UV beat: a scope strip with the fungus signal and the leg steps on one time axis, so the order reads plainly:
 * lamp on -> spikes bigger and more frequent -> steps come faster */
const Scope: React.FC<{t: number}> = ({t}) => {
  const k = ss(UV.swingIn0 + 0.9, UV.swingIn0 + 1.3, t) * (1 - ss(UV.off + 0.1, UV.off + 0.45, t));
  if (k < 0.005) return null;
  const x0 = 70, x1 = 1010, y0 = 120 - (1 - k) * 420, h = 300;
  const span = 5;
  const X = (tt: number) => x0 + 30 + ((tt - (t - span)) / span) * (x1 - x0 - 60);
  const tr: Pt[] = [];
  for (let i = 0; i <= 220; i++) {
    const tt = t - span + (i / 220) * span;
    const v = spikeTrace(tt) + 0.05 * noise1(tt * 38, 3) + 0.03 * noise1(tt * 90, 7);
    tr.push([X(tt), y0 + 150 - clamp(v * 52, -40, 110)]);
  }
  const uvRuns: Pt[][] = [];
  let run: Pt[] = [];
  for (let i = 0; i <= 220; i++) {
    const tt = t - span + (i / 220) * span;
    if (uvOn(tt) > 0.5) run.push([X(tt), y0 + 38]); else { if (run.length > 1) uvRuns.push(run); run = []; }
  }
  if (run.length > 1) uvRuns.push(run);
  const steps = EVENTS_EXT.filter((e) => e.start > t - span && e.start <= t);
  return (
    <g opacity={Math.min(1, k * 1.5)}>
      <rect x={x0} y={y0} width={x1 - x0} height={h} rx={26} fill={C.screen} opacity={0.88} stroke={INK} strokeWidth={4} />
      {uvRuns.map((r, i) => <path key={i} d={poly(r, false)} stroke={C.uv} strokeWidth={14} strokeLinecap="round" />)}
      {uvOn(t) > 0.5 && <text x={x1 - 40} y={y0 + 50} textAnchor="end" fill={C.uvLight} fontFamily="Nunito Variable" fontWeight={900} fontSize={34}>UV ON</text>}
      <text x={x0 + 30} y={y0 + 52} fill="#9FC3D2" fontFamily="Nunito Variable" fontWeight={800} fontSize={30}>fungus signal</text>
      <path d={poly(tr, false)} stroke={C.trace} strokeWidth={10} opacity={0.25} fill="none" strokeLinejoin="round" />
      <path d={poly(tr, false)} stroke={C.trace} strokeWidth={4} fill="none" strokeLinejoin="round" />
      <path d={`M${x0 + 30} ${y0 + 232}L${x1 - 30} ${y0 + 232}`} stroke={C.grid} strokeWidth={3} />
      <text x={x0 + 30} y={y0 + 280} fill="#9FC3D2" fontFamily="Nunito Variable" fontWeight={800} fontSize={30}>leg steps</text>
      {steps.map((e, i) => <rect key={i} x={X(e.start) - 7} y={y0 + 206} width={14} height={52} rx={5} fill="#F2F1EA" stroke={INK} strokeWidth={2} />)}
    </g>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => {
  const c = (TL.captions as {text: string; show: number; hide: number}[]).find((x) => t >= x.show && t < x.hide);
  if (!c) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
      <span style={{fontFamily: 'Nunito Variable', fontWeight: 900, fontSize: 58, color: '#fff', background: 'rgba(16,28,38,0.82)', padding: '10px 22px', borderRadius: 18}}>{c.text}</span>
    </div>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const showA = t < SEG.matchA1 || t >= SEG.wipe0;
  const showB = t >= SEG.matchA0 && t < SEG.wipe1;
  // the match: B (same network, same affine) fades up over the robot shot's dome
  const bOp = t < SEG.matchA1 ? ss(SEG.matchA0, SEG.matchA1, t) : 1;
  // the wipe: a soft air line passes up across the lens; B above its centre line, A below
  const wk = ss(SEG.wipe0, SEG.wipe1, t);
  const lineY = H + 380 - wk * (H + 760);
  const tilt = -120;
  const wiping = t >= SEG.wipe0 && t < SEG.wipe1;
  const tag = ss(3.1, 3.45, t) * (1 - ss(6.3, 6.6, t));
  return (
    <AbsoluteFill style={{background: '#0C171F'}}>
      {showA && <RobotWorld t={t} />}
      {showB && (
        <div style={{position: 'absolute', inset: 0, opacity: bOp,
          clipPath: wiping ? `polygon(0 0, ${W}px 0, ${W}px ${lineY + tilt / 2}px, 0 ${lineY - tilt / 2}px)` : undefined}}>
          <SignalWorld t={t} />
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="fblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10" /></filter></defs>
        {wiping && (
          <g filter="url(#fblur)">
            <path d={`M-60 ${lineY - tilt / 2 + 60}L${W + 60} ${lineY + tilt / 2 + 60}`} stroke={INK} strokeWidth={330} opacity={0.9} />
            <path d={`M-60 ${lineY - tilt / 2 + 60}L${W + 60} ${lineY + tilt / 2 + 60}`} stroke={C.tube} strokeWidth={290} opacity={0.95} />
            <path d={`M-60 ${lineY - tilt / 2 + 10}L${W + 60} ${lineY + tilt / 2 + 10}`} stroke="#FFFFFF" strokeWidth={60} opacity={0.8} />
            {[0, 1, 2].map((k) => <circle key={k} cx={300 + k * 260 + wk * 200} cy={lineY + 60 - (300 + k * 260 + wk * 200 - W / 2) * (tilt / W)} r={80} fill="#FFFFFF" opacity={0.7} />)}
          </g>
        )}
        <Scope t={t} />
        {tag > 0.01 && <rect x={70} y={H - 160} width={W - 140} height={58} rx={18} fill="#0C171F" opacity={0.7 * tag} />}
        {tag > 0.01 && <text x={W / 2} y={H - 120} textAnchor="middle" opacity={0.85 * tag} fill="#CFE0E8" fontFamily="Nunito Variable" fontWeight={700} fontSize={28}>Illustration · based on Mishra et al., Science Robotics (2024), Cornell University</text>}
      </svg>
      {captions && <Captions t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
void T;
