// HOOK 10: a travelling signal pulse riding a physical path (cable, lead, cord or nerve): a bright bead with a short,
// fading tail and a soft glow. No free-floating graphics: every pulse is drawn ON its track.
import React from 'react';
import {at, Track} from './body';
import {clamp} from '../rig/math';

export const SIG = '#7FF4FF';
export const SIG_CORE = '#F2FEFF';
export const NAT = '#FFC27A';

export const GlowDefs: React.FC = () => (
  <defs>
    <radialGradient id="h10-glow-sig">
      <stop offset="0" stopColor={SIG_CORE} stopOpacity={0.95} />
      <stop offset="0.25" stopColor={SIG} stopOpacity={0.6} />
      <stop offset="1" stopColor={SIG} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="h10-glow-nat">
      <stop offset="0" stopColor="#FFF1D8" stopOpacity={0.9} />
      <stop offset="0.3" stopColor={NAT} stopOpacity={0.5} />
      <stop offset="1" stopColor={NAT} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="h10-glow-red">
      <stop offset="0" stopColor="#FF9A7A" stopOpacity={0.75} />
      <stop offset="0.4" stopColor="#D2433C" stopOpacity={0.35} />
      <stop offset="1" stopColor="#D2433C" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/** one pulse whose head is at fraction u (0..1) of the track; tail in units; r = bead radius; a = opacity */
export const Pulse: React.FC<{T: Track; u: number; tail?: number; r?: number; a?: number; kind?: 'sig' | 'nat'}> = ({T, u, tail = 60, r = 5, a = 1, kind = 'sig'}) => {
  if (u <= 0 || a <= 0.01) return null;
  const d = clamp(u, 0, 1) * T.L;
  // fade the bead out as it reaches the end of its path (it hands over to the next device)
  const endFade = u > 1 ? clamp(1 - (u - 1) * 8) : 1;
  const aa = a * endFade;
  if (aa <= 0.01) return null;
  const col = kind === 'sig' ? SIG : '#FFD9A0';
  const n = 9;
  const beads = [];
  for (let i = n; i >= 1; i--) {
    const k = i / n;
    const q = at(T, d - tail * k).p;
    beads.push(<circle key={i} cx={q.x.toFixed(2)} cy={q.y.toFixed(2)} r={(r * (1 - k * 0.7)).toFixed(2)} fill={col} opacity={(aa * (1 - k) * 0.7).toFixed(3)} />);
  }
  const h = at(T, d).p;
  return (
    <g>
      <circle cx={h.x.toFixed(2)} cy={h.y.toFixed(2)} r={(r * 5.5).toFixed(2)} fill={`url(#h10-glow-${kind})`} opacity={aa} />
      {beads}
      <circle cx={h.x.toFixed(2)} cy={h.y.toFixed(2)} r={r.toFixed(2)} fill={kind === 'sig' ? SIG_CORE : '#FFF3DE'} opacity={aa} />
    </g>
  );
};

/** a short train of pulses travelling t0 -> t1 (head of the first pulse), spaced `gap` seconds */
export const Train: React.FC<{T: Track; t: number; t0: number; t1: number; n?: number; gap?: number; tail?: number; r?: number; a?: number; kind?: 'sig' | 'nat'; ease?: boolean}> = ({T, t, t0, t1, n = 3, gap = 0.08, tail, r, a = 1, kind}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const u = (t - t0 - i * gap) / (t1 - t0);
      if (u <= 0 || u > 1.15) return null;
      return <Pulse key={i} T={T} u={u} tail={tail} r={r} a={a * (1 - i * 0.18)} kind={kind} />;
    })}
  </g>
);
