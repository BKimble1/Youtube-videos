// V5 material close-up (frames 86-160): the camera has followed a band of the web into its material. Silk protein
// chains drift in a liquid on the left and lock into straight, bundled fibrils as a front sweeps across the frame
// ("turn into a web"); the bundle draws tight ("that catches them"); then the fibrils curve into the wound pattern of
// a cocoon's outer silk, and the lab (Lab6) takes over on a close view of a real cocoon. An illustration of the idea,
// in screen space; no labels.
import React from 'react';
import {clamp, fmt, lerp} from './dc/math';
import {INK} from './dc/ink';

export const MC = {start: 62, in1: 69, front0: 72, front1: 106, tight0: 108, tight1: 138, curl0: 134, end: 160};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
/** the band's screen direction when the camera arrives (degrees) */
export const MACRO_ANG = -4;

const N = 16;
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** the strands the chains zip into behind the front (screen y before rotation) */
const BUNDLES = [430, 800, 1170, 1540];
const CH = Array.from({length: N}, (_, i) => {
  const b = i % 4;
  const depth = hash(i, 9); // 0 far .. 1 near
  return {
    y0: -40 + (i + 0.5) * (2000 / N) + (hash(i, 1) - 0.5) * 60,
    b,
    slot: (Math.floor(i / 4) - 1.5) * 11 + (hash(i, 6) - 0.5) * 5,
    depth,
    w: lerp(12, 30, depth),
    amp: 45 + 55 * hash(i, 3),
    per: 60 + 50 * hash(i, 4),
    ph: hash(i, 2) * 6.28,
  };
});

export const MacroScene6: React.FC<{f: number}> = ({f}) => {
  const front = lerp(1250, -760, ss(f, MC.front0, MC.front1 + 8)); // x of the liquid -> fibre front (screen)
  const tight = ss(f, MC.tight0, MC.tight1);
  const curl = ss(f, MC.curl0, MC.end);
  const drift = (f - MC.start) * 7; // the material flows along the band
  const a = (MACRO_ANG * Math.PI) / 180;
  const R = (x: number, y: number) => ({x: 540 + x * Math.cos(a) - (y - 960) * Math.sin(a), y: 960 + x * Math.sin(a) + (y - 960) * Math.cos(a)});
  type Seg = {d: string; w: number; depth: number};
  const liquid: Seg[] = [];
  const solid: Seg[] = [];
  const glint: string[] = [];
  CH.forEach((c, i) => {
    const L: {x: number; y: number}[] = [];
    const S: {x: number; y: number}[] = [];
    for (let k = 0; k <= 64; k++) {
      const x = -720 + k * 38;
      const sx = x + 540;
      const liq = sx < front;
      // behind the front the chain straightens and zips toward its strand: further behind = more merged
      const zip = liq ? 0 : sm(clamp((sx - front) / 520));
      // as the bundle draws tight the three strands close up on one another
      const target = lerp(BUNDLES[c.b], 960 + (BUNDLES[c.b] - 960) * 0.42, tight) + c.slot * lerp(1, 0.5, tight);
      let y = lerp(c.y0, target, zip);
      const wave = c.amp * Math.sin((x + drift * (0.6 + 0.4 * c.depth)) / c.per + c.ph) * (1 - zip * 0.94) * (1 - 0.6 * tight * zip);
      const bend = curl * (0.00042 * (x - (hash(i, 5) - 0.5) * 300) ** 2 - 60);
      y += wave + bend;
      (liq ? L : S).push(R(x, y));
    }
    const dl = (P: {x: number; y: number}[]) => `M${P.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
    // the chain that crosses the front keeps one point on each side so it stays connected
    if (L.length > 1) liquid.push({d: dl(S.length ? [...L, S[0]] : L), w: c.w, depth: c.depth});
    if (S.length > 1) {
      solid.push({d: dl(S), w: c.w * 1.25, depth: c.depth});
      if (c.depth > 0.55) glint.push(dl(S));
    }
  });
  liquid.sort((a, b) => a.depth - b.depth);
  solid.sort((a, b) => a.depth - b.depth);
  // a deeper layer behind (thinner, softer, drifting slower) for depth
  const deep: string[] = [];
  for (let i = 0; i < 9; i++) {
    const y = -60 + (i + 0.5) * (2040 / 9) + 70;
    const pts: string[] = [];
    for (let k = 0; k <= 30; k++) {
      const x = -700 + k * 80;
      const sx = x + 540;
      const liq = sx < front - 160;
      const wave = liq ? 20 * Math.sin((x + drift * 0.6) / 90 + i) : 2 * Math.sin((x + drift * 0.6) / 120 + i);
      const p = R(x, y + wave + curl * (0.0003 * x * x - 40));
      pts.push(`${fmt(p.x)},${fmt(p.y)}`);
    }
    deep.push(`M${pts.join(' L')}`);
  }
  const bg = `M0,0 H1080 V1920 H0 Z`;
  const gl = ((f - MC.tight0) * 60) % 2400;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`mc-bl-${f}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <linearGradient id={`mc-bg-${f}`} gradientUnits="userSpaceOnUse" x1={fmt(front - 260)} y1="0" x2={fmt(front + 260)} y2="0">
          <stop offset="0" stopColor="#EBCB7E" />
          <stop offset="1" stopColor="#D9C7A0" />
        </linearGradient>
      </defs>
      <path d={bg} fill={`url(#mc-bg-${f})`} />
      {/* a slow push along with the material */}
      <g transform={`translate(540 960) scale(${fmt(1 + 0.28 * ss(f, MC.front0 + 10, MC.end))}) translate(-540 -960)`}>
      <g opacity={0.45} filter={`url(#mc-bl-${f})`}>
        {deep.map((d, i) => (
          <path key={`dp${i}`} d={d} fill="none" stroke="#C99A3A" strokeWidth={9} strokeLinecap="round" />
        ))}
      </g>
      {liquid.map((q, i) => (
        <g key={`l${i}`} opacity={lerp(0.55, 1, q.depth)} filter={q.depth < 0.25 ? `url(#mc-bl-${f})` : undefined}>
          <path d={q.d} fill="none" stroke={INK} strokeWidth={q.w + 7} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
          <path d={q.d} fill="none" stroke={q.depth > 0.5 ? '#D59A2E' : '#DDAF55'} strokeWidth={q.w} strokeLinecap="round" strokeLinejoin="round" />
          <path d={q.d} fill="none" stroke="#F6D58A" strokeWidth={q.w * 0.32} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} transform={`translate(-2 ${fmt(-q.w * 0.22)})`} />
        </g>
      ))}
      {solid.map((q, i) => (
        <g key={`s${i}`} opacity={lerp(0.7, 1, q.depth)}>
          <path d={q.d} fill="none" stroke={INK} strokeWidth={q.w + 7} strokeLinecap="round" opacity={0.85} />
          <path d={q.d} fill="none" stroke={q.depth > 0.5 ? '#FFFDF6' : '#F1E8D2'} strokeWidth={q.w} strokeLinecap="round" />
          <path d={q.d} fill="none" stroke="#E2D1A8" strokeWidth={q.w * 0.3} strokeLinecap="round" transform={`translate(1 ${fmt(q.w * 0.25)})`} opacity={0.8} />
        </g>
      ))}
      {tight > 0.05 &&
        glint.map((d, i) => (
          <path key={`g${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeDasharray="220 2400" strokeDashoffset={fmt(-gl - i * 300)} opacity={0.9 * tight} />
        ))}
      {/* the front: a soft bright seam where liquid becomes fibre */}
      {front > -200 && front < 1280 && (
        <g opacity={0.5}>
          <path d={`M${fmt(R(front - 540, -100).x)},${fmt(R(front - 540, -100).y)} L${fmt(R(front - 540, 2020).x)},${fmt(R(front - 540, 2020).y)}`} stroke="#FFF6D8" strokeWidth={50} />
        </g>
      )}
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="#FFF8E6" opacity={0.25 * clamp(1 - (f - MC.start) / 10)} />
    </svg>
  );
};
