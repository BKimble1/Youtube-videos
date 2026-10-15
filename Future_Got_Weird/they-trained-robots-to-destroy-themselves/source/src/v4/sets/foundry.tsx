// SET-FOUNDRY-2D (V4): an illustrated side/three-quarter cross-section of the foundry. One coherent geography used by
// every foundry beat: the launch deck on the left, the ladle in the middle, a raised control-room window on the right.
// Layers: back wall (parallax), deck (with far rail), ladle back + molten surface, [robots / fx], ladle front lip.
import React from 'react';
import {C} from '../../theme';
import {rnd, clamp01, lerp} from '../kit/scene';

export const FD = {
  floor: 1000,
  deck: {x0: -900, edge: 300, top: 560, th: 34},
  ladle: {cx: 790, rim: 770, rx: 300, ry: 64, surf: 800, srx: 262, sry: 50, bot: 990, brx: 236},
  booth: {x0: 1300, x1: 1760, y0: 330, y1: 640},
};
export const FCOL = {
  sky: '#221A21', wall: '#3A2D34', panel: '#45353E', panelLine: '#54424C', col: '#4B3A43', colHi: '#5C4752', ink: '#120C10',
  deck: '#5B5860', deckTop: '#77737C', deckSide: '#46434B', hz: '#F2B632', hzD: '#2B2930', rail: '#E8A928', railD: '#B98316',
  shell: '#4A3E3E', shellHi: '#6A5A57', shellD: '#2C2425', brick: '#9A5A3E', brickD: '#6A3826', band: '#1E1819',
  m0: '#FFF6CF', m1: '#FFD45A', m2: '#FF9A2A', m3: '#E0561A', crust: '#5A1E0C', crustHot: '#FFB13B',
};

const E = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
const halfE = (cx: number, cy: number, rx: number, ry: number, front: boolean) => `M${cx - rx} ${cy}A${rx} ${ry} 0 0 ${front ? 0 : 1} ${cx + rx} ${cy}`;

/** The back of the building (draw in a parallax layer ~0.55). */
export const FoundryBack: React.FC<{lw: number; t: number; lights?: number; hook?: boolean}> = ({lw, t, lights = 1, hook = true}) => {
  const els: React.ReactNode[] = [];
  els.push(<rect key="bg" x={-3000} y={-1500} width={7000} height={4000} fill={FCOL.wall} />);
  for (let i = -6; i <= 12; i++) {
    const x = i * 260;
    els.push(<rect key={'p' + i} x={x + 8} y={-400} width={244} height={1400} fill={FCOL.panel} />);
    els.push(<line key={'pl' + i} x1={x + 8} y1={-400} x2={x + 8} y2={1000} stroke={FCOL.panelLine} strokeWidth={lw * 0.8} />);
  }
  // tall windows with a cool sky and light shafts
  for (const x of [-520, 260, 1040, 1820]) {
    els.push(<rect key={'w' + x} x={x} y={-240} width={180} height={420} rx={6} fill="#3B4A5E" stroke={FCOL.ink} strokeWidth={lw} />);
    els.push(<line key={'wm' + x} x1={x + 90} y1={-240} x2={x + 90} y2={180} stroke={FCOL.ink} strokeWidth={lw * 0.8} />);
    els.push(<line key={'wh' + x} x1={x} y1={-30} x2={x + 180} y2={-30} stroke={FCOL.ink} strokeWidth={lw * 0.8} />);
    els.push(<path key={'sh' + x} d={`M${x} -200 L${x + 180} -200 L${x + 520} 1000 L${x + 140} 1000 Z`} fill="#FFE2B0" opacity={0.05 * lights} />);
  }
  // columns
  for (const x of [-700, 80, 860, 1640]) {
    els.push(<rect key={'c' + x} x={x - 40} y={-500} width={80} height={1500} fill={FCOL.col} stroke={FCOL.ink} strokeWidth={lw} />);
    els.push(<rect key={'ch' + x} x={x - 30} y={-500} width={14} height={1500} fill={FCOL.colHi} />);
  }
  // warm work-light pools on the wall (separate dark robots from the background)
  els.push(
    <defs key="wl"><radialGradient id="wallLight" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFC98A" stopOpacity={0.32 * lights} /><stop offset="1" stopColor="#FFC98A" stopOpacity={0} /></radialGradient></defs>,
  );
  for (const [x, y, r] of [[60, 260, 520], [900, 360, 640], [1560, 300, 480]] as [number, number, number][]) els.push(<ellipse key={'wl' + x} cx={x} cy={y} rx={r} ry={r * 0.9} fill="url(#wallLight)" />);
  // overhead crane girder + trolley + hook
  els.push(<rect key="gird" x={-1600} y={60} width={4400} height={70} fill={FCOL.col} stroke={FCOL.ink} strokeWidth={lw} />);
  for (let i = -15; i < 28; i++) els.push(<path key={'gx' + i} d={`M${i * 100} 64 L${i * 100 + 50} 126 L${i * 100 + 100} 64`} fill="none" stroke={FCOL.ink} strokeWidth={lw * 0.7} opacity={0.6} />);
  els.push(<rect key="trol" x={430} y={128} width={170} height={60} rx={6} fill="#4F5562" stroke={FCOL.ink} strokeWidth={lw} />);
  if (hook) els.push(<line key="cable" x1={515} y1={188} x2={515} y2={300} stroke={FCOL.ink} strokeWidth={lw * 1.2} />);
  if (hook) els.push(<path key="hook" d="M500 300 h30 v20 q0 30 -22 30 q-20 0 -20 -18" fill="none" stroke={FCOL.ink} strokeWidth={lw * 2} strokeLinecap="round" />);
  // floor
  els.push(<rect key="floor" x={-3000} y={FD.floor} width={7000} height={1200} fill="#251C21" />);
  els.push(<line key="fl" x1={-3000} y1={FD.floor} x2={4000} y2={FD.floor} stroke={FCOL.ink} strokeWidth={lw} />);
  void t;
  return <g>{els}</g>;
};

/** Launch deck (side elevation): girder legs, hazard edge, far railing (behind the robot). */
export const Deck: React.FC<{lw: number; edge?: number}> = ({lw, edge = FD.deck.edge}) => {
  const {x0, top, th} = FD.deck;
  const els: React.ReactNode[] = [];
  // legs + cross bracing
  for (const x of [x0 + 120, (x0 + edge) / 2, edge - 50]) {
    els.push(<rect key={'lg' + x} x={x - 18} y={top + th} width={36} height={FD.floor - top - th} fill={FCOL.deckSide} stroke={FCOL.ink} strokeWidth={lw} />);
  }
  els.push(<path key="brace" d={`M${x0 + 120} ${top + th + 20} L${(x0 + edge) / 2} ${FD.floor - 20} M${(x0 + edge) / 2} ${top + th + 20} L${edge - 50} ${FD.floor - 20} M${(x0 + edge) / 2} ${top + th + 20} L${x0 + 120} ${FD.floor - 20} M${edge - 50} ${top + th + 20} L${(x0 + edge) / 2} ${FD.floor - 20}`} stroke={FCOL.deckSide} strokeWidth={lw * 3} />);
  // access stair to the left
  for (let i = 0; i < 9; i++) els.push(<rect key={'st' + i} x={x0 - 60 - i * 42} y={top + th + i * 46} width={60} height={10} fill={FCOL.deck} stroke={FCOL.ink} strokeWidth={lw * 0.8} />);
  // far railing (behind the robot)
  for (let i = 0; i < 8; i++) {
    const x = x0 + 60 + i * 130;
    if (x > edge - 120) break;
    els.push(<rect key={'rp' + i} x={x - 5} y={top - 120} width={10} height={120} fill={FCOL.railD} stroke={FCOL.ink} strokeWidth={lw * 0.7} />);
  }
  els.push(<rect key="rr" x={x0 + 50} y={top - 124} width={edge - 170 - x0} height={12} rx={6} fill={FCOL.railD} stroke={FCOL.ink} strokeWidth={lw * 0.7} />);
  els.push(<rect key="rm" x={x0 + 50} y={top - 66} width={edge - 170 - x0} height={8} rx={4} fill={FCOL.railD} stroke={FCOL.ink} strokeWidth={lw * 0.6} />);
  // deck slab: top surface strip (slight top view) + front face with hazard stripes near the edge
  els.push(<path key="dtop" d={`M${x0} ${top - 16} L${edge - 6} ${top - 16} L${edge} ${top} L${x0} ${top} Z`} fill={FCOL.deckTop} stroke={FCOL.ink} strokeWidth={lw} strokeLinejoin="round" />);
  els.push(<rect key="dface" x={x0} y={top} width={edge - x0} height={th} fill={FCOL.deck} stroke={FCOL.ink} strokeWidth={lw} />);
  for (let i = 0; i < 9; i++) {
    const x = edge - 180 + i * 20;
    els.push(<path key={'hz' + i} d={`M${x} ${top} L${x + 10} ${top} L${x + 10 - 16} ${top + th} L${x - 16} ${top + th} Z`} fill={i % 2 ? FCOL.hzD : FCOL.hz} />);
  }
  els.push(<rect key="dface2" x={edge - 180} y={top} width={180} height={th} fill="none" stroke={FCOL.ink} strokeWidth={lw} />);
  // tread lines on the top strip
  for (let i = 0; i < 14; i++) els.push(<line key={'tr' + i} x1={x0 + 40 + i * 80} y1={top - 12} x2={x0 + 30 + i * 80} y2={top - 3} stroke={FCOL.ink} strokeWidth={lw * 0.5} opacity={0.4} />);
  // painted launch strip
  els.push(<path key="ls" d={`M${edge - 70} ${top - 16} L${edge - 40} ${top - 16} L${edge - 36} ${top} L${edge - 66} ${top} Z`} fill={FCOL.hz} />);
  return <g>{els}</g>;
};

export type Disturb = {x: number; t: number}; // entry x and seconds since entry

/** Ladle back half: inner wall, back rim, molten surface (with crust, ripples). */
export const LadleBack: React.FC<{lw: number; t: number; hit?: Disturb; scar?: number}> = ({lw, t, hit, scar = 0}) => {
  const L = FD.ladle;
  const els: React.ReactNode[] = [];
  // trunnion stand behind
  els.push(<rect key="stand" x={L.cx - 360} y={L.rim + 70} width={720} height={40} fill={FCOL.shellD} stroke={FCOL.ink} strokeWidth={lw} />);
  // outer back rim ellipse
  els.push(<path key="rimB" d={E(L.cx, L.rim, L.rx, L.ry)} fill={FCOL.brick} stroke={FCOL.ink} strokeWidth={lw} />);
  els.push(<path key="inner" d={E(L.cx, L.rim + 4, L.rx - 26, L.ry - 10)} fill={FCOL.brickD} stroke={FCOL.ink} strokeWidth={lw * 0.8} />);
  // molten surface
  els.push(
    <defs key="d">
      <radialGradient id="moltenG" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stopColor={FCOL.m0} />
        <stop offset="0.35" stopColor={FCOL.m1} />
        <stop offset="0.72" stopColor={FCOL.m2} />
        <stop offset="1" stopColor={FCOL.m3} />
      </radialGradient>
      <clipPath id="moltenClip"><path d={E(L.cx, L.surf, L.srx, L.sry)} /></clipPath>
    </defs>,
  );
  els.push(<path key="surf" d={E(L.cx, L.surf, L.srx, L.sry)} fill="url(#moltenG)" />);
  const g: React.ReactNode[] = [];
  // drifting crust rafts with hot cracks
  for (let i = 0; i < 7; i++) {
    const a = rnd(i * 7 + 3) * Math.PI * 2 + t * (0.06 + 0.04 * rnd(i));
    const rr = 0.25 + rnd(i * 13) * 0.6;
    let x = L.cx + Math.cos(a) * L.srx * rr, y = L.surf + Math.sin(a) * L.sry * rr;
    if (hit && hit.t >= 0) {
      const dx = x - hit.x, push = 60 * (1 - Math.exp(-hit.t * 2.4)) * Math.exp(-Math.abs(dx) / 160);
      x += Math.sign(dx || 1) * push;
    }
    const sz = 20 + rnd(i * 5) * 26;
    const pts: string[] = [];
    for (let k = 0; k < 9; k++) {
      const aa = (k / 9) * Math.PI * 2;
      const j = 0.7 + 0.4 * rnd(i * 31 + k);
      pts.push(`${x + Math.cos(aa) * sz * j} ${y + Math.sin(aa) * sz * j * 0.35}`);
    }
    g.push(<path key={'cr' + i} d={'M' + pts.join('L') + 'Z'} fill={FCOL.crust} fillOpacity={0.85} stroke={FCOL.crustHot} strokeWidth={lw * 0.7} strokeLinejoin="round" />);
  }
  // slow convection glints
  for (let i = 0; i < 5; i++) {
    const ph = t * 0.4 + i * 1.3;
    const x = L.cx + Math.sin(ph) * L.srx * 0.55, y = L.surf + Math.cos(ph * 0.7) * L.sry * 0.4;
    g.push(<ellipse key={'gl' + i} cx={x} cy={y} rx={34} ry={8} fill="#FFFBE8" opacity={0.35} />);
  }
  if (hit && hit.t >= 0) {
    for (let k = 0; k < 5; k++) {
      const tt = hit.t - k * 0.22;
      if (tt <= 0) continue;
      const r = 20 + tt * 170;
      const fade = Math.max(0, 1 - tt / 2.2);
      if (fade <= 0) continue;
      g.push(<ellipse key={'rip' + k} cx={hit.x} cy={L.surf} rx={r} ry={r * (L.sry / L.srx)} fill="none" stroke="#FFF7CF" strokeWidth={lw * (2.2 - k * 0.25)} opacity={fade * 0.9} />);
    }
    if (scar > 0) g.push(<ellipse key="scar" cx={hit.x} cy={L.surf} rx={46} ry={11} fill={FCOL.crust} opacity={0.55 * scar} />);
  }
  els.push(<g key="g" clipPath="url(#moltenClip)">{g}</g>);
  els.push(<path key="surfEdge" d={E(L.cx, L.surf, L.srx, L.sry)} fill="none" stroke="#B8400E" strokeWidth={lw * 1.4} opacity={0.6} />);
  return <g>{els}</g>;
};

/** Ladle front: shell body, bands, trunnions and the near lip (draw after robots/fx inside the vessel). */
export const LadleFront: React.FC<{lw: number; glow?: number}> = ({lw, glow = 1}) => {
  const L = FD.ladle;
  const els: React.ReactNode[] = [];
  const body = `M${L.cx - L.rx} ${L.rim} L${L.cx - L.brx} ${L.bot} A${L.brx} ${L.ry * 0.8} 0 0 0 ${L.cx + L.brx} ${L.bot} L${L.cx + L.rx} ${L.rim} A${L.rx} ${L.ry} 0 0 1 ${L.cx - L.rx} ${L.rim} Z`;
  els.push(
    <defs key="d">
      <linearGradient id="shellG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={FCOL.shellD} /><stop offset="0.35" stopColor={FCOL.shellHi} /><stop offset="0.55" stopColor={FCOL.shell} /><stop offset="1" stopColor={FCOL.shellD} />
      </linearGradient>
      <linearGradient id="lipGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFB04A" stopOpacity={0.55 * glow} /><stop offset="1" stopColor="#FFB04A" stopOpacity={0} />
      </linearGradient>
    </defs>,
  );
  els.push(<path key="body" d={body} fill="url(#shellG)" stroke={FCOL.ink} strokeWidth={lw} strokeLinejoin="round" />);
  for (const y of [L.rim + 70, L.bot - 70]) {
    const k = (y - L.rim) / (L.bot - L.rim), rx = lerp(L.rx, L.brx, k);
    els.push(<path key={'band' + y} d={halfE(L.cx, y, rx, L.ry * 0.9, true)} fill="none" stroke={FCOL.ink} strokeWidth={lw * 7} />);
    els.push(<path key={'bandh' + y} d={halfE(L.cx, y, rx, L.ry * 0.9, true)} fill="none" stroke={FCOL.shellHi} strokeWidth={lw * 4} />);
    for (let r = 1; r < 12; r++) {
      const a = Math.PI * (r / 12);
      els.push(<circle key={`rv${y}_${r}`} cx={L.cx - Math.cos(a) * rx} cy={y + Math.sin(a) * L.ry * 0.9} r={lw * 1.3} fill={FCOL.shellD} stroke={FCOL.ink} strokeWidth={lw * 0.4} />);
    }
  }
  // heat-tint on the upper shell
  els.push(<path key="tint" d={`M${L.cx - L.rx} ${L.rim} L${L.cx - lerp(L.rx, L.brx, 0.35)} ${L.rim + (L.bot - L.rim) * 0.35} A${lerp(L.rx, L.brx, 0.35)} ${L.ry} 0 0 0 ${L.cx + lerp(L.rx, L.brx, 0.35)} ${L.rim + (L.bot - L.rim) * 0.35} L${L.cx + L.rx} ${L.rim} Z`} fill="#FF7A22" opacity={0.12 * glow} />);
  // trunnions
  for (const s of [-1, 1]) {
    els.push(<rect key={'tr' + s} x={L.cx + s * (L.rx - 6) - (s < 0 ? 46 : 0)} y={L.rim + 50} width={46} height={56} rx={10} fill={FCOL.shellD} stroke={FCOL.ink} strokeWidth={lw} />);
  }
  // front lip: brick rim near half
  els.push(<path key="lip" d={`${halfE(L.cx, L.rim, L.rx, L.ry, true)} L${L.cx + L.rx - 26} ${L.rim + 4} A${L.rx - 26} ${L.ry - 10} 0 0 1 ${L.cx - L.rx + 26} ${L.rim + 4} Z`} fill={FCOL.brick} stroke={FCOL.ink} strokeWidth={lw} strokeLinejoin="round" />);
  for (let k = 1; k < 14; k++) {
    const a = Math.PI * (k / 14);
    const x0 = L.cx - Math.cos(a) * L.rx, y0 = L.rim + Math.sin(a) * L.ry;
    const x1 = L.cx - Math.cos(a) * (L.rx - 26), y1 = L.rim + 4 + Math.sin(a) * (L.ry - 10);
    els.push(<line key={'bj' + k} x1={x0} y1={y0} x2={x1} y2={y1} stroke={FCOL.ink} strokeWidth={lw * 0.6} opacity={0.6} />);
  }
  els.push(<path key="lipG" d={`M${L.cx - L.rx} ${L.rim} A${L.rx} ${L.ry} 0 0 0 ${L.cx + L.rx} ${L.rim} L${L.cx + L.rx} ${L.rim + 60} A${L.rx} ${L.ry} 0 0 1 ${L.cx - L.rx} ${L.rim + 60} Z`} fill="url(#lipGlow)" />);
  return <g>{els}</g>;
};

/** Heat glow over everything near the vessel (screen-space friendly: give world coords; draw in world layer). */
export const HeatGlow: React.FC<{k?: number}> = ({k = 1}) => {
  const L = FD.ladle;
  return (
    <g style={{mixBlendMode: 'screen'}} pointerEvents="none">
      <defs>
        <radialGradient id="heatG" cx={L.cx} cy={L.surf - 40} r={900} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB04A" stopOpacity={0.42 * k} />
          <stop offset="0.4" stopColor="#FF7A22" stopOpacity={0.16 * k} />
          <stop offset="1" stopColor="#FF7A22" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={L.cx - 1600} y={L.surf - 1400} width={3200} height={2600} fill="url(#heatG)" />
    </g>
  );
};

/** Embers rising from the vessel. */
export const Embers: React.FC<{t: number; n?: number; lw: number}> = ({t, n = 26, lw}) => {
  const L = FD.ladle;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const life = 2.2 + rnd(i * 3) * 1.6;
    const ph = ((t + rnd(i) * life) % life) / life;
    const x = L.cx + (rnd(i * 7) - 0.5) * L.srx * 1.6 + Math.sin(t * 1.3 + i) * 20;
    const y = L.surf - ph * 520;
    els.push(<circle key={i} cx={x} cy={y} r={lw * (0.7 + rnd(i * 11) * 0.9)} fill={ph < 0.5 ? '#FFE08A' : '#FF8A3A'} opacity={(1 - ph) * 0.9} />);
  }
  return <g>{els}</g>;
};

/** Entry splash at (x, surface): back crown, front crown, droplets. `part` splits draw order around the robot. */
export const Splash: React.FC<{x: number; t: number; lw: number; part: 'back' | 'front'; scale?: number}> = ({x, t, lw, part, scale = 1}) => {
  if (t < 0) return null;
  const L = FD.ladle;
  const S = scale;
  const y = L.surf;
  const els: React.ReactNode[] = [];
  if (t < 0.9) {
    const rise = Math.max(0, (520 * t - 0.5 * 1500 * t * t)) * S;
    const fade = 1 - clamp01((t - 0.55) / 0.35);
    const rx = (40 + 90 * (1 - Math.exp(-t * 6))) * S, ry = rx * (L.sry / L.srx);
    const n = 14;
    const front = part === 'front';
    const pts: string[] = [];
    for (let k = 0; k <= n; k++) {
      const a = Math.PI * (k / n);
      const ex = x - Math.cos(a) * rx * 1.25, ey = y + (front ? 1 : -1) * Math.sin(a) * ry * 1.25;
      const h = rise * (0.75 + 0.35 * Math.sin(a)) * (k % 2 ? 0.82 : 1);
      pts.push(`${ex} ${ey - h}`);
    }
    for (let k = n; k >= 0; k--) {
      const a = Math.PI * (k / n);
      pts.push(`${x - Math.cos(a) * rx * 0.75} ${y + (front ? 1 : -1) * Math.sin(a) * ry * 0.75}`);
    }
    els.push(
      <g key="crown" opacity={fade}>
        <path d={'M' + pts.join('L') + 'Z'} fill={front ? '#FFC24A' : '#F2861E'} stroke={FCOL.ink} strokeWidth={lw * 0.8} strokeLinejoin="round" opacity={front ? 0.92 : 1} />
        <path d={'M' + pts.slice(0, n + 1).join('L')} fill="none" stroke="#FFF6D0" strokeWidth={lw * 1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }
  if (part === 'front') {
    for (let i = 0; i < 26; i++) {
      const t0 = rnd(i * 5) * 0.18;
      const tt = t - t0;
      if (tt <= 0 || tt > 1.3) continue;
      const ang = -Math.PI / 2 + (rnd(i * 7) - 0.5) * 2.2;
      const v = (320 + rnd(i * 11) * 420) * S;
      const px = x + Math.cos(ang) * v * tt * 0.9, py = y - 10 - (Math.sin(-ang) * v * tt - 0.5 * 1500 * tt * tt);
      if (py > y + 10) continue;
      const r = lw * (1.4 + rnd(i * 13) * 1.8) * S;
      els.push(<circle key={'d' + i} cx={px} cy={py} r={r} fill={tt < 0.35 ? '#FFF2B8' : tt < 0.8 ? '#FFB43A' : '#E0561A'} stroke={FCOL.ink} strokeWidth={lw * 0.35} />);
    }
  }
  // flash ring on contact
  if (part === 'front' && t < 0.25) els.push(<ellipse key="flash" cx={x} cy={y} rx={(60 + 300 * t) * S} ry={(16 + 70 * t) * S} fill="#FFF3C0" opacity={(1 - t / 0.25) * 0.8} />);
  return <g>{els}</g>;
};

/** Raised control-room booth on the right with a silhouetted witness (generic, no likeness). */
export const Booth: React.FC<{lw: number; k?: number; children?: React.ReactNode}> = ({lw, k = 1, children}) => {
  const B = FD.booth;
  return (
    <g opacity={k}>
      <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} fill="#3A3138" stroke={FCOL.ink} strokeWidth={lw} />
      <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="#4A3A3C" stroke={FCOL.ink} strokeWidth={lw} />
      {children}
      <path d={`M${B.x0 + 30} ${B.y0 + 30} L${B.x0 + 140} ${B.y0 + 30} L${B.x0 + 60} ${B.y0 + 220} L${B.x0 + 30} ${B.y0 + 220} Z`} fill="#FFFFFF" opacity={0.06} />
      <line x1={B.x0 + 30} y1={B.y0 + 30} x2={B.x0 + 30} y2={B.y0 + 220} stroke={FCOL.ink} strokeWidth={lw} />
      <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="none" stroke={FCOL.ink} strokeWidth={lw * 1.4} />
      {/* legs down to the floor */}
      {[B.x0 + 40, B.x1 - 40].map((x) => <rect key={x} x={x - 14} y={B.y1} width={28} height={FD.floor - B.y1} fill={FCOL.deckSide} stroke={FCOL.ink} strokeWidth={lw} />)}
    </g>
  );
};
