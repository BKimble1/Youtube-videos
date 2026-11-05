// The chip and the culture, drawn in micrometres through one affine map (um -> screen px), so the same artwork serves
// every scale: the carrier and its well at the CL1 lid, the culture haze, the electrode array, single neurons.
// Electronic parts are geometric and metallic (gold leads and electrodes); living parts are organic and translucent
// (warm somata, tapering dendrites, one long axon). Stimulation is cyan and runs IN along a lead to its electrode;
// recorded activity is amber and runs OUT. `scope` (0..1) turns the same view into a phase-contrast micrograph.
import React from 'react';
import {mix, rgba} from '../color';
import {ACT, ELECTRODES, ER, NEURONS, Neuron, recorded, spikeGlow, spikes, stimOn} from './culture';

export type MicroMap = {sx: number; sy: number; tx: number; ty: number}; // screen = (X*sx + tx, Y*sy + ty)
export const CYAN = '#46D2FF', AMBER = '#FFB23F';

const pal = (scope: number) => ({
  glass: mix('#0F2B35', '#A6B09D', scope),
  glass2: mix('#163B47', '#BDC6B2', scope),
  lead: mix('#C2913F', '#1D1F1C', scope),
  leadInk: mix('#172B3A', '#141513', scope),
  elec0: mix('#F6D684', '#2A2B28', scope),
  elec1: mix('#A9782A', '#0C0D0C', scope),
  neurite: mix('#EBA791', '#4D5648', scope),
  axon: mix('#E39A85', '#5A6455', scope),
  soma0: mix('#FAD3BE', '#8B9886', scope),
  soma1: mix('#D7836C', '#56614F', scope),
  ink: mix('#6B2C2A', '#3B4337', scope),
  nuc: mix('#B9604F', '#6C7867', scope),
  halo: mix('#FFE6B0', '#F3F7EC', scope),
});

/** point along a polyline at arc length s (clamped) */
const along = (pts: [number, number][], cum: number[], s: number): [number, number] => {
  if (s <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++)
    if (s <= cum[i]) {
      const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    }
  return pts[pts.length - 1];
};
const cumOf = (pts: [number, number][]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const LEADCUM = new Map(ELECTRODES.map((e) => [e.c, cumOf(e.lead)]));

export const Micro: React.FC<{
  t: number; m: MicroMap; W: number; H: number; scope?: number; id: string;
  /** neuron detail multiplier (the lens uses a little less) */
  detail?: number;
  /** a soft vignette and depth-of-field look for the close-up */
  dof?: number;
}> = ({t, m, W, H, scope = 0, id, dof = 0}) => {
  const P = pal(scope);
  const ppu = Math.abs(m.sx); // px per um (horizontal)
  // the visible um rectangle
  const x0 = (0 - m.tx) / m.sx, x1 = (W - m.tx) / m.sx;
  const y0 = (0 - m.ty) / m.sy, y1 = (H - m.ty) / m.sy;
  const vx0 = Math.min(x0, x1), vx1 = Math.max(x0, x1), vy0 = Math.min(y0, y1), vy1 = Math.max(y0, y1);
  const showNeurons = ppu > 0.28;
  const nAlpha = Math.min(1, (ppu - 0.28) / 0.35);
  const showArray = ppu > 0.02;
  const haze = ppu < 0.45 ? Math.min(1, (0.45 - ppu) / 0.2) * Math.min(1, ppu / 0.003) : 0;
  const medium = Math.max(0, Math.min(1, Math.log(0.3 / ppu) / 1.4)) * (1 - scope);
  const tf = `matrix(${m.sx} 0 0 ${m.sy} ${m.tx} ${m.ty})`;
  const vis = (n: Neuron, pad: number) => n.x > vx0 - pad && n.x < vx1 + pad && n.y > vy0 - pad && n.y < vy1 + pad;
  const neurons = showNeurons ? NEURONS.filter((n) => vis(n, 320)) : [];
  // per-neuron spike state
  const st = neurons.map((n) => {
    const sp = spikes(n, t - 0.7, t);
    const age = sp.length ? t - Math.max(...sp) : Infinity;
    return {n, sp, glow: spikeGlow(age)};
  });
  const lw = (px: number) => px / ppu; // a stroke width given in screen px
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'hidden'}}>
      <defs>
        <radialGradient id={`${id}-el`} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor={P.elec0} />
          <stop offset="0.7" stopColor={mix(P.elec0, P.elec1, 0.35)} />
          <stop offset="1" stopColor={P.elec1} />
        </radialGradient>
        <radialGradient id={`${id}-soma`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={P.soma0} />
          <stop offset="1" stopColor={P.soma1} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#FFE9A6" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#FFC65A" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFB23F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-cy`}>
          <stop offset="0" stopColor={CYAN} stopOpacity="0.55" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-am`}>
          <stop offset="0" stopColor={AMBER} stopOpacity="0.6" />
          <stop offset="1" stopColor={AMBER} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-well`} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor={P.glass2} />
          <stop offset="1" stopColor={P.glass} />
        </radialGradient>
        <pattern id={`${id}-hz`} width="157" height="157" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
          {Array.from({length: 23}, (_, k) => {
            const a = (k * 97.3) % 157, b = (k * 53.7 + 31) % 157;
            return <circle key={k} cx={a} cy={b} r={6 + (k % 4) * 2} fill={P.soma1} opacity={0.55} />;
          })}
          {Array.from({length: 23}, (_, k) => {
            const a = (k * 97.3) % 157, b = (k * 53.7 + 31) % 157;
            return <path key={`n${k}`} d={`M${a} ${b} l ${((k * 37) % 50) - 25} ${((k * 61) % 50) - 25}`} stroke={P.neurite} strokeWidth={2.5} opacity={0.4} />;
          })}
        </pattern>
        <radialGradient id={`${id}-med`}>
          <stop offset="0" stopColor="#E9789A" stopOpacity="0.55" />
          <stop offset="0.8" stopColor="#D65A86" stopOpacity="0.6" />
          <stop offset="1" stopColor="#B8406E" stopOpacity="0.75" />
        </radialGradient>
      </defs>
      <g transform={tf}>
        {/* the MEA carrier: a glass plate with contact pads round its edge, a clear culture ring glued on top */}
        {ppu < 0.2 && (
          <g>
            <rect x={-12500} y={-12500} width={25000} height={25000} rx={900} fill={P.leadInk} />
            <rect x={-12100} y={-12100} width={24200} height={24200} rx={700} fill={mix('#9FB8BF', '#A6B09D', scope)} />
            {Array.from({length: 4 * 15}, (_, k) => {
              const side = Math.floor(k / 15), i = k % 15, a = -9800 + i * 1400;
              const [x, y, w, h] = side === 0 ? [-11900, a - 350, 1300, 700] : side === 1 ? [10600, a - 350, 1300, 700] : side === 2 ? [a - 350, -11900, 700, 1300] : [a - 350, 10600, 700, 1300];
              return <rect key={k} x={x} y={y} width={w} height={h} rx={120} fill={P.lead} stroke={P.leadInk} strokeWidth={90} />;
            })}
          </g>
        )}
        {/* the well floor: glass under the culture medium */}
        <circle cx={0} cy={0} r={6000} fill={`url(#${id}-well)`} />
        {haze > 0.01 && <circle cx={0} cy={0} r={4800} fill={`url(#${id}-hz)`} opacity={haze * 0.6} />}
        {showArray && (
          <g>
            {/* leads: an ink edge under the metal */}
            {ELECTRODES.map((e) => (
              <polyline key={`li${e.c}`} points={e.lead.map((p) => p.join(',')).join(' ')} fill="none" stroke={P.leadInk} strokeWidth={Math.max(11, lw(1.4))} strokeLinejoin="round" opacity={0.85} />
            ))}
            {ELECTRODES.map((e) => (
              <polyline key={`l${e.c}`} points={e.lead.map((p) => p.join(',')).join(' ')} fill="none" stroke={P.lead} strokeWidth={Math.max(7, lw(0.8))} strokeLinejoin="round" />
            ))}
            {ELECTRODES.map((e) => {
              const s = stimOn(e.c, t), r = Math.min(1, recorded(e.c, t) / 1.1);
              const fill = s > 0.02 ? mix(P.elec0, CYAN, s * 0.9) : r > 0.02 ? mix(P.elec0, AMBER, r * 0.9) : null;
              return (
                <g key={`e${e.c}`}>
                  <circle cx={e.x} cy={e.y} r={ER + 2.2} fill={P.leadInk} />
                  <circle cx={e.x} cy={e.y} r={ER} fill={fill ?? `url(#${id}-el)`} opacity={e.live ? 1 : 0.55} />
                  {scope < 0.5 && <path d={`M${e.x - 10} ${e.y - 4} A ${ER - 3} ${ER - 3} 0 0 1 ${e.x + 3} ${e.y - 11}`} fill="none" stroke="#FFF7DE" strokeWidth={2} strokeLinecap="round" opacity={0.5 * (1 - scope)} />}
                </g>
              );
            })}
          </g>
        )}
        {medium > 0.01 && <circle cx={0} cy={0} r={6000} fill={`url(#${id}-med)`} opacity={medium} />}
        {ppu < 0.2 && (
          <g>
            <circle cx={0} cy={0} r={6420} fill="none" stroke={P.leadInk} strokeWidth={1100} opacity={0.85} />
            <circle cx={0} cy={0} r={6420} fill="none" stroke="#9FC3CF" strokeWidth={760} opacity={0.55} />
            <path d="M -4300 -4600 A 6300 6300 0 0 1 3200 -5400" fill="none" stroke="#FFFFFF" strokeWidth={200} strokeLinecap="round" opacity={0.55} />
          </g>
        )}
        {/* neurons: neurites under somata */}
        {showNeurons && (
          <g opacity={nAlpha}>
            {st.map(({n, glow}) => (
              <g key={`d${n.id}`}>
                {n.dend.map((d, k) => (
                  <path key={k} d={d.d} fill="none" stroke={glow > 0.05 ? mix(P.neurite, '#FFE2A0', glow * 0.6) : P.neurite} strokeWidth={d.w} strokeLinecap="round" opacity={0.86} />
                ))}
                <path d={n.axD} fill="none" stroke={P.axon} strokeWidth={1.15} strokeLinecap="round" opacity={0.62} />
              </g>
            ))}
            {/* spike halos */}
            {st.map(({n, glow}) => glow > 0.03 && <circle key={`h${n.id}`} cx={n.x} cy={n.y} r={n.r * 3.4} fill={`url(#${id}-glow)`} opacity={glow * (1 - scope * 0.6)} />)}
            {st.map(({n, glow}) => (
              <g key={`s${n.id}`}>
                {scope > 0.05 && <path d={n.soma} fill="none" stroke={P.halo} strokeWidth={3.2} opacity={scope * 0.85} />}
                <path d={n.soma} fill={glow > 0.03 ? mix(P.soma0, '#FFF1C6', glow) : `url(#${id}-soma)`} stroke={P.ink} strokeWidth={Math.max(0.7, lw(0.9))} />
                <ellipse cx={n.nucleus[0]} cy={n.nucleus[1]} rx={n.nucleus[2]} ry={n.nucleus[2] * 0.86} fill={glow > 0.03 ? mix(P.nuc, '#FFD98A', glow) : P.nuc} opacity={0.75} />
                <circle cx={n.nucleus[0] + n.nucleus[2] * 0.25} cy={n.nucleus[1] - n.nucleus[2] * 0.2} r={n.nucleus[2] * 0.28} fill={mix(P.nuc, '#3A1512', 0.5)} opacity={0.7} />
              </g>
            ))}
            {/* action potentials running down the axons */}
            {st.map(({n, sp}) =>
              sp.map((s, k) => {
                const a = t - s - 0.02;
                const L = n.axCum[n.axCum.length - 1];
                const d = a * 620;
                if (a < 0 || d > L + 10) return null;
                const p = along(n.axon, n.axCum, d), q = along(n.axon, n.axCum, d - 16);
                const fade = 1 - Math.max(0, d - L * 0.75) / (L * 0.25 + 10);
                return (
                  <g key={`p${n.id}_${k}`} opacity={fade * (1 - scope * 0.5)}>
                    <line x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke="#FFD772" strokeWidth={3.2} strokeLinecap="round" opacity={0.75} />
                    <circle cx={p[0]} cy={p[1]} r={6} fill={`url(#${id}-glow)`} />
                    <circle cx={p[0]} cy={p[1]} r={1.9} fill="#FFF6D6" />
                  </g>
                );
              }),
            )}
          </g>
        )}
        {/* stimulation: cyan pulses arrive along the lead, then a ring spreads from the electrode */}
        {showArray &&
          ACT.stims.flatMap((s, si) =>
            s.cs.map((c) => {
              const e = ELECTRODES.find((z) => z.c === c)!;
              const cum = LEADCUM.get(c)!;
              const out: React.ReactNode[] = [];
              for (let k = 0; k < (s.pulses ?? 1); k++) {
                const tk = s.t + k * 0.09;
                const a = t - tk;
                // inbound: the pulse travels from 700 um out along the lead to the electrode
                if (a > -0.4 && a < 0) {
                  const p = along(e.lead, cum, -a * 1750 + ER);
                  out.push(<circle key={`ci${si}${c}${k}`} cx={p[0]} cy={p[1]} r={9} fill={`url(#${id}-cy)`} />, <circle key={`cj${si}${c}${k}`} cx={p[0]} cy={p[1]} r={3.6} fill="#E6FAFF" />);
                }
                if (a >= 0 && a < 0.32) {
                  const u = a / 0.32;
                  out.push(<circle key={`cr${si}${c}${k}`} cx={e.x} cy={e.y} r={ER + 8 + u * 75} fill="none" stroke={CYAN} strokeWidth={Math.max(2.2, lw(2))} opacity={(1 - u) * 0.85} />);
                  if (k === 0) out.push(<circle key={`cg${si}${c}`} cx={e.x} cy={e.y} r={ER * 3.2} fill={`url(#${id}-cy)`} opacity={1 - u} />);
                }
              }
              return <g key={`st${si}_${c}`}>{out}</g>;
            }),
          )}
        {/* recording: amber pulses leave each responding electrode along its lead */}
        {showArray &&
          ACT.resps.flatMap((r, ri) =>
            r.cs.map((c) => {
              const e = ELECTRODES.find((z) => z.c === c)!;
              const cum = LEADCUM.get(c)!;
              const out: React.ReactNode[] = [];
              for (let k = 0; k < 3; k++) {
                const a = t - (r.t + 0.06 + k * 0.07);
                if (a < 0 || a > 1.4) continue;
                const p = along(e.lead, cum, ER + a * 1500);
                out.push(<circle key={`ra${ri}${c}${k}`} cx={p[0]} cy={p[1]} r={10} fill={`url(#${id}-am)`} />, <circle key={`rb${ri}${c}${k}`} cx={p[0]} cy={p[1]} r={3.6} fill="#FFF0CC" />);
              }
              return <g key={`rs${ri}_${c}`}>{out}</g>;
            }),
          )}
      </g>
      {dof > 0 && (
        <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-vig)`} opacity={dof}>
          <title>vignette</title>
        </rect>
      )}
      {dof > 0 && (
        <defs>
          <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#07141A" stopOpacity="0" />
            <stop offset="1" stopColor="#07141A" stopOpacity="0.75" />
          </radialGradient>
        </defs>
      )}
    </svg>
  );
};
export {rgba};
