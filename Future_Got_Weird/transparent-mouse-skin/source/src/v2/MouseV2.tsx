// V2 mouse: V1's mouse (art/Mouse.tsx, same geometry, palette and anatomy), with
//  - a growing reveal: transparency appears only inside `reveal` (a soft stroke along the applicator's track, plus a
//    full-patch amount), so the clear window can spread behind the swab; the wet dye film can lead it (`wetPts`);
//  - layers for restrained 2.5D: 'under' (the opaque skin floor and the anatomy) and 'over' (everything above it,
//    with a hole where the patch is), so the skin surface and the organs can sit at different depths and show
//    parallax when the camera tilts; 'all' draws both in one SVG;
//  - a rinse: a moving water sheet and the orange dye carried off toward the flanks.
// Nothing here changes the anatomy with the optical state: transmission only changes how much the skin hides it.
import React from 'react';
import {rgba} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, hash, lerp, V} from '../dc/math';
import {Anatomy, BEADS, BODY_D, BREATH_C, COL, crPath, FURLINES, MC, PATCH, PORES, STUBBLE} from '../art/Mouse';

export type MouseV2State = {
  t: number;
  T: number;            // transmission inside the revealed region, 0..1
  tint: number;         // red-orange cast of dye held in the skin, 0..1
  reveal: {pts: V[]; w: number; full: number}; // where the skin is treated: track stroke (width w) + full patch (0..1)
  wetPts?: V[];         // wet solution on the surface (leads the reveal), drawn along this track
  wetW?: number;
  wet: number;          // generic surface wetness (application gloss) 0..1
  rinse: number;        // rinse water sheet 0..1
  rinseFlow: number;    // rinse progress along the patch 0..1 (the front of the water sheet)
  sweep?: number;       // raking light across the patch, -1..1
  bodySweep?: number;   // raking light along the whole belly, -1..1
};
export type Layer = 'all' | 'under' | 'over';

const Masks: React.FC<{id: string; s: MouseV2State}> = ({id, s}) => {
  const d = s.reveal.pts.length > 1 ? crPath(s.reveal.pts, false) : '';
  const shape = (on: string, off: string) => (
    <>
      <rect x={-500} y={-500} width={2200} height={3000} fill={off} />
      <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 8} ry={PATCH.ry + 8} fill={on} opacity={clamp(s.reveal.full)} />
      {d && <path d={d} stroke={on} strokeWidth={s.reveal.w} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{filter: 'blur(9px)'}} />}
    </>
  );
  return (
    <defs>
      <mask id={`${id}-rv`} maskContentUnits="userSpaceOnUse">{shape('#fff', '#000')}</mask>
      <mask id={`${id}-irv`} maskContentUnits="userSpaceOnUse">{shape('#000', '#fff')}</mask>
      <radialGradient id={`${id}-pm`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.7" stopColor="#fff" />
        <stop offset="0.98" stopColor="#000" />
      </radialGradient>
      <mask id={`${id}-patch`} maskContentUnits="userSpaceOnUse">
        <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx} ry={PATCH.ry} fill={`url(#${id}-pm)`} />
      </mask>
      <mask id={`${id}-hole`} maskContentUnits="userSpaceOnUse">
        <rect x={-500} y={-500} width={2200} height={3000} fill="#fff" />
        <ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 2} ry={PATCH.ry + 2} fill="#000" />
      </mask>
      <radialGradient id={`${id}-rim`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.66" stopColor={COL.skin} stopOpacity="0" />
        <stop offset="0.93" stopColor={COL.skin} stopOpacity="0.8" />
        <stop offset="1" stopColor={COL.skin} stopOpacity="1" />
      </radialGradient>
      <radialGradient id={`${id}-belly`} cx="0.42" cy="0.38" r="0.75">
        <stop offset="0" stopColor="#FBF7F1" />
        <stop offset="0.6" stopColor={COL.furBelly} />
        <stop offset="1" stopColor={COL.furShade} />
      </radialGradient>
      <clipPath id={`${id}-pclip`}><ellipse cx={MC.x} cy={MC.y} rx={PATCH.rx + 4} ry={PATCH.ry + 4} /></clipPath>
      <clipPath id={`${id}-body`}><path d={BODY_D} /></clipPath>
      <filter id={`${id}-scatter`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={(1.0 + 9 * (1 - clamp(s.T)) ** 1.4).toFixed(2)} />
      </filter>
      <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#FFF4E6" stopOpacity="0.38" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
};

export const MouseV2: React.FC<{id: string; s: MouseV2State; layer?: Layer}> = ({id, s, layer = 'all'}) => {
  const br = Math.sin(s.t * 2 * Math.PI * 1.05);
  const breath = `translate(${BREATH_C.x} ${BREATH_C.y}) scale(${(1 + 0.011 * br).toFixed(4)} ${(1 + 0.005 * br).toFixed(4)}) translate(${-BREATH_C.x} ${-BREATH_C.y})`;
  const T = clamp(s.T);
  const E = {cx: MC.x, cy: MC.y, rx: PATCH.rx + 6, ry: PATCH.ry + 6};
  const under = (
    <g>
      {/* the skin floor: opaque skin wherever the patch is not (yet) treated */}
      <ellipse {...E} fill={COL.skin} />
      <g mask={`url(#${id}-patch)`}>
        <g mask={`url(#${id}-rv)`}>
          <g filter={`url(#${id}-scatter)`} opacity={clamp(T * 1.15)}>
            <Anatomy t={s.t} />
          </g>
        </g>
      </g>
    </g>
  );
  const body = (
    <g>
      <path d="M540,1440 C560,1560 650,1590 640,1700 C632,1790 560,1820 590,1930" fill="none" stroke={INK} strokeWidth={27} strokeLinecap="round" />
      <path d="M540,1440 C560,1560 650,1590 640,1700 C632,1790 560,1820 590,1930" fill="none" stroke={COL.paw} strokeWidth={21} strokeLinecap="round" />
      {[0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((u, i) => <circle key={i} cx={lerp(560, 600, u) + 40 * Math.sin(u * 5)} cy={1460 + u * 450} r={1.6} fill={COL.pawDeep} />)}
      {[-1, 1].map((sd) => (
        <g key={`h${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
          <path d="M700,1280 C760,1300 790,1350 800,1420 C806,1470 780,1500 760,1480 C740,1440 720,1400 690,1370 Z" fill={COL.furBack} stroke={INK} strokeWidth={4} />
          <path d="M770,1410 C800,1440 826,1500 822,1556 C820,1586 796,1590 786,1566 C772,1520 756,1470 752,1430 Z" fill={COL.paw} stroke={INK} strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={790 + k * 9 - 12} cy={1572 + Math.abs(k - 2) * -4} rx={6} ry={9} fill={COL.paw} stroke={INK} strokeWidth={2.4} />)}
          <ellipse cx={792} cy={1500} rx={9} ry={14} fill={COL.pawDeep} opacity={0.45} />
        </g>
      ))}
      {[-1, 1].map((sd) => (
        <g key={`f${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
          <path d="M680,800 C726,790 750,760 748,720 C746,700 726,698 716,716 C708,740 690,756 670,766 Z" fill={COL.furBack} stroke={INK} strokeWidth={4} />
          <ellipse cx={738} cy={700} rx={20} ry={16} fill={COL.paw} stroke={INK} strokeWidth={3.5} />
          {[-1, 0, 1, 2].map((k) => <ellipse key={k} cx={734 + k * 10} cy={684 - Math.abs(k - 0.5) * -3} rx={4.6} ry={7} fill={COL.paw} stroke={INK} strokeWidth={2.2} />)}
        </g>
      ))}
      {[-1, 1].map((sd) => (
        <g key={`e${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
          <ellipse cx={700} cy={600} rx={74} ry={66} fill={COL.furBack} stroke={INK} strokeWidth={4.5} transform="rotate(-20 700 600)" />
          <ellipse cx={706} cy={598} rx={50} ry={44} fill={COL.pink} transform="rotate(-20 706 598)" />
          <path d="M676,586 C696,570 726,574 738,596" stroke={COL.pawDeep} strokeWidth={3} fill="none" opacity={0.5} />
        </g>
      ))}
      <g mask={layer === 'over' ? `url(#${id}-hole)` : undefined}>
        <path d={BODY_D} fill={COL.furBack} stroke={INK} strokeWidth={5} />
        <path d={BODY_D} fill={`url(#${id}-belly)`} transform="translate(540 960) scale(0.93 0.985) translate(-540 -960)" />
        <g clipPath={`url(#${id}-body)`}>
          {FURLINES.map((f, i) => (
            <path key={i} d={`M${f.x},${f.y} q${(6 * Math.sin(f.a)).toFixed(1)},6 ${(10 * Math.sin(f.a) + 2).toFixed(1)},14`} stroke={COL.furShade} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.55} />
          ))}
          <path d="M420,830 C470,875 610,875 660,830" stroke={COL.furShade} strokeWidth={6} fill="none" opacity={0.55} />
          {s.bodySweep !== undefined && (
            <rect x={540 - 70 + s.bodySweep * 360} y={420} width={140} height={1100} fill={`url(#${id}-sweep)`} transform="rotate(12 540 1000)" />
          )}
        </g>
      </g>
      {[-1, 1].map((sd) => (
        <g key={`ey${sd}`} transform={`translate(540 0) scale(${sd} 1) translate(-540 0)`}>
          <path d="M586,602 C600,612 618,612 630,600" stroke={INK} strokeWidth={4.2} fill="none" strokeLinecap="round" />
          <path d="M592,596 C604,592 618,592 628,596" stroke={COL.furShade} strokeWidth={3} fill="none" opacity={0.7} />
        </g>
      ))}
    </g>
  );
  const wetD = s.wetPts && s.wetPts.length > 1 ? crPath(s.wetPts, false) : '';
  const flowY = MC.y - PATCH.ry - 40 + s.rinseFlow * (2 * PATCH.ry + 80);
  const over = (
    <g>
      {/* untreated area of the patch: ordinary opaque skin */}
      <g mask={`url(#${id}-irv)`}><ellipse {...E} fill={COL.skin} /></g>
      {/* treated area: skin that lets the anatomy through, with the red-orange cast */}
      <g mask={`url(#${id}-patch)`}>
        <g mask={`url(#${id}-rv)`}>
          <ellipse {...E} fill={COL.skin} opacity={1 - 0.9 * T} />
          <ellipse {...E} fill={COL.dyeDeep} opacity={0.26 * s.tint} style={{mixBlendMode: 'multiply'}} />
          <ellipse {...E} fill="#FFB27A" opacity={0.14 * T} />
        </g>
      </g>
      <ellipse {...E} fill={`url(#${id}-rim)`} />
      <g mask={`url(#${id}-rv)`}><ellipse {...E} fill={COL.dyeDeep} opacity={0.1 * s.tint} style={{mixBlendMode: 'multiply'}} /></g>
      <g clipPath={`url(#${id}-pclip)`}>
        {PORES.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={rgba('#8A4A44', 0.22 + 0.12 * T)} />)}
        <ellipse cx={MC.x - 58} cy={MC.y - 96} rx={70} ry={120} fill="#FFF4EC" opacity={0.08} transform={`rotate(-18 ${MC.x - 58} ${MC.y - 96})`} style={{filter: 'blur(10px)'}} />
        {/* the wet solution, leading the clearing */}
        {wetD && (
          <g>
            <path d={wetD} stroke={COL.dye} strokeWidth={s.wetW ?? 130} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.24 * s.wet} style={{filter: 'blur(10px)'}} />
            <path d={wetD} stroke="#FFF1C2" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.34 * s.wet} transform="translate(-16 -20)" style={{filter: 'blur(3px)'}} />
          </g>
        )}
        {/* rinse: a clear water sheet running down the patch, carrying the dye; beads left behind */}
        {s.rinse > 0 && (
          <g opacity={s.rinse}>
            <rect x={MC.x - 200} y={MC.y - 260} width={400} height={Math.max(0, flowY - (MC.y - 260))} fill="#E4F6FF" opacity={0.2} />
            <ellipse cx={MC.x} cy={flowY} rx={190} ry={34} fill="#F2FBFF" opacity={0.55} style={{filter: 'blur(6px)'}} />
            <ellipse cx={MC.x} cy={flowY + 6} rx={180} ry={20} fill={COL.dye} opacity={0.45 * (1 - s.rinseFlow * 0.7)} style={{filter: 'blur(8px)'}} />
            {Array.from({length: 7}, (_, k) => {
              const x = MC.x - 130 + k * 43, ph = (s.t * 1.6 + k * 0.37) % 1;
              const y = MC.y - 220 + ph * Math.max(10, flowY - (MC.y - 220));
              return <ellipse key={k} cx={x} cy={y} rx={10} ry={26} fill="#FFFFFF" opacity={0.35 * (1 - ph)} style={{filter: 'blur(3px)'}} />;
            })}
            {BEADS.filter((q) => q.y < flowY).map((q, i) => (
              <g key={i}>
                <circle cx={q.x} cy={q.y} r={q.r} fill="#E9F8FF" opacity={0.55} stroke="#7FB5CF" strokeWidth={1.4} />
                <circle cx={q.x - q.r * 0.35} cy={q.y - q.r * 0.35} r={q.r * 0.35} fill="#FFFFFF" />
              </g>
            ))}
          </g>
        )}
        {s.sweep !== undefined && (
          <rect x={MC.x - 60 + s.sweep * 260} y={MC.y - 260} width={120} height={520} fill={`url(#${id}-sweep)`} transform={`rotate(14 ${MC.x} ${MC.y})`} />
        )}
      </g>
      {STUBBLE.map((q, i) => <path key={i} d={`M${q.x.toFixed(1)},${q.y.toFixed(1)} L${q.x2.toFixed(1)},${q.y2.toFixed(1)}`} stroke={i % 4 ? COL.furShade : '#FFFFFF'} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />)}
      {/* nose cone (sedation) and whiskers */}
      <path d="M540,0 C540,120 540,260 540,360" stroke={INK} strokeWidth={42} fill="none" />
      <path d="M540,0 C540,120 540,260 540,360" stroke="#C9D3DA" strokeWidth={34} fill="none" />
      <path d="M528,0 L528,360" stroke="#fff" strokeWidth={6} opacity={0.5} />
      <path d="M512,360 L568,360 L612,500 C590,520 490,520 468,500 Z" fill="#CFE3EC" fillOpacity={0.55} stroke={INK} strokeWidth={5} />
      <path d="M520,372 L486,494" stroke="#fff" strokeWidth={8} opacity={0.6} strokeLinecap="round" />
      <rect x={506} y={340} width={68} height={26} rx={6} fill={COL.cone} stroke={INK} strokeWidth={4} />
      <ellipse cx={540} cy={505} rx={72} ry={14} fill="none" stroke={INK} strokeWidth={4} />
      <ellipse cx={540} cy={470} rx={18} ry={12} fill={COL.nose} opacity={0.9} />
      {[-1, 1].map((sd) => [0, 1, 2].map((k) => (
        <path key={`w${sd}${k}`} d={`M${540 + sd * 52},${508 + k * 6} q${sd * 50},${-6 + k * 8} ${sd * 110},${-20 + k * 22}`} stroke={INK} strokeWidth={2} fill="none" opacity={0.6} />
      )))}
    </g>
  );
  return (
    <g>
      <Masks id={id} s={s} />
      {layer !== 'under' && <ellipse cx={548} cy={1000} rx={250} ry={560} fill="rgba(20,40,60,0.16)" style={{filter: 'blur(18px)'}} />}
      <g transform={breath}>
        {layer !== 'under' && body}
        {layer !== 'over' && under}
        {layer !== 'under' && over}
      </g>
    </g>
  );
};

/** the applicator's track over the patch: diagonal sweeps covering it (world coords), and a point at u in 0..1 */
export const TRACK: V[] = (() => {
  const pts: V[] = [];
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y = MC.y + PATCH.ry * 0.82 - (r / (rows - 1)) * PATCH.ry * 1.64;
    const half = PATCH.rx * 0.86 * Math.sqrt(Math.max(0.05, 1 - ((y - MC.y) / (PATCH.ry * 1.02)) ** 2));
    const a = {x: MC.x - half, y: y + 18}, b = {x: MC.x + half, y: y - 18};
    pts.push(...(r % 2 ? [b, a] : [a, b]));
  }
  return pts;
})();
const TL = (() => {
  const L = [0];
  for (let i = 1; i < TRACK.length; i++) L.push(L[i - 1] + Math.hypot(TRACK[i].x - TRACK[i - 1].x, TRACK[i].y - TRACK[i - 1].y));
  return L;
})();
export const trackAt = (u: number): V => {
  const s = clamp(u) * TL[TL.length - 1];
  let i = 1;
  while (i < TL.length - 1 && TL[i] < s) i++;
  const f = (s - TL[i - 1]) / (TL[i] - TL[i - 1] || 1);
  return {x: lerp(TRACK[i - 1].x, TRACK[i].x, f), y: lerp(TRACK[i - 1].y, TRACK[i].y, f)};
};
/** the track sampled from 0 to u (for masks) */
export const trackTo = (u: number, n = 80): V[] => {
  if (u <= 0) return [];
  const out: V[] = [];
  for (let k = 0; k <= n; k++) out.push(trackAt((k / n) * u));
  return out;
};
export {hash};
