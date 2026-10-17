// Facades — NYC buildings along the north side of the avenue (behind the action), and a darker near-side variant for
// foreground framing. Base line at `base` (default −140 = back of the far sidewalk). Story ≈ 760 units (≈3 m).
// Window states: lit / dark / broken / burning (fire inside, soot above). Storefront level with roll-down shutters,
// awnings and abstract signs (no letters). Fire escapes, cornices, rooftop water towers, collapsed corners and holes.
import React from 'react';
import {CITY} from '../theme';
import {rnd, noise, f2, range, polyPath, Flames, Glow, SmokeColumn, INK, K, jagged, V2} from './cityKit';

const STORY = 760, GROUND = 950;
const MATS = [
  {wall: CITY.brick, dark: CITY.brickDark, trim: K.limestone},
  {wall: K.brick2, dark: K.brick3, trim: K.stoneLight},
  {wall: K.limestone, dark: K.limestoneDark, trim: '#E2D6C2'},
  {wall: CITY.stone, dark: CITY.stoneDark, trim: K.stoneLight},
  {wall: K.brick3, dark: '#5A2C22', trim: K.limestone},
];

export type BuildingSpec = {x: number; w: number; stories: number; mat: number; seed: number; fireEscape: boolean; tank: boolean; collapse: number; holes: number};

/** The deterministic row of buildings between x0 and x1. */
export const buildingRow = (x0: number, x1: number, seed: number): BuildingSpec[] => {
  const out: BuildingSpec[] = [];
  let x = x0, i = 0;
  while (x < x1) {
    const k = seed * 101 + i * 17;
    const w = Math.round((1400 + rnd(k) * 1500) / 70) * 70;
    out.push({
      x, w, stories: 5 + Math.floor(rnd(k + 1) * 5), mat: Math.floor(rnd(k + 2) * MATS.length), seed: k,
      fireEscape: rnd(k + 3) > 0.45, tank: rnd(k + 4) > 0.55, collapse: rnd(k + 5) > 0.72 ? 0.4 + rnd(k + 6) * 0.5 : 0, holes: rnd(k + 7) > 0.6 ? 1 + Math.floor(rnd(k + 8) * 2) : 0,
    });
    x += w + (rnd(k + 9) > 0.8 ? 120 : 0);
    i++;
  }
  return out;
};

const WaterTower: React.FC<{x: number; y: number; s: number; ink: number}> = ({x, y, s, ink}) => (
  <g>
    {[-0.36, -0.12, 0.12, 0.36].map((u, i) => <line key={i} x1={x + u * 300 * s} y1={y} x2={x + u * 260 * s} y2={y - 260 * s} stroke={K.tankDark} strokeWidth={22 * s} />)}
    <line x1={x - 120 * s} y1={y - 130 * s} x2={x + 120 * s} y2={y - 130 * s} stroke={K.tankDark} strokeWidth={10 * s} />
    <rect x={x - 150 * s} y={y - 600 * s} width={300 * s} height={340 * s} fill={K.tank} stroke={INK} strokeWidth={ink} />
    {[0.33, 0.66].map((u, i) => <line key={i} x1={x - 150 * s} y1={y - 600 * s + u * 340 * s} x2={x + 150 * s} y2={y - 600 * s + u * 340 * s} stroke={K.tankDark} strokeWidth={ink * 0.8} />)}
    <path d={`M ${f2(x - 168 * s)} ${f2(y - 600 * s)} L ${f2(x)} ${f2(y - 760 * s)} L ${f2(x + 168 * s)} ${f2(y - 600 * s)} Z`} fill={K.tankDark} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
  </g>
);

/** One building. Returns the wall, windows, details. `burn` scales how many windows are on fire. */
export const Building: React.FC<{b: BuildingSpec; base: number; t: number; ink: number; burn?: number; lit?: number; detail?: number}> = ({b, base, t, ink, burn = 0.18, lit = 0.12, detail = 1}) => {
  const m = MATS[b.mat];
  const H = GROUND + b.stories * STORY;
  const top = base - H;
  const bays = Math.max(2, Math.floor(b.w / 420));
  const bw = b.w / bays;
  // collapsed corner: a jagged top-right edge
  const roof: V2[] = b.collapse > 0
    ? [{x: b.x, y: top}, {x: b.x + b.w * (1 - b.collapse * 0.7), y: top}, ...jagged({x: b.x + b.w * (1 - b.collapse * 0.7), y: top}, {x: b.x + b.w, y: top + STORY * (1 + b.collapse * 2.2)}, b.seed, 90, 7).slice(1)]
    : [{x: b.x, y: top}, {x: b.x + b.w, y: top}];
  const wallPts: V2[] = [{x: b.x, y: base}, ...roof, {x: b.x + b.w, y: base}];
  const wallD = polyPath(wallPts);
  const cutY = (x: number) => {
    // y of the (possibly collapsed) roof line at x
    for (let i = 0; i < roof.length - 1; i++) if (x >= roof[i].x && x <= roof[i + 1].x) return roof[i].y + ((x - roof[i].x) / (roof[i + 1].x - roof[i].x || 1)) * (roof[i + 1].y - roof[i].y);
    return top;
  };
  const els: React.ReactElement[] = [];
  const glows: React.ReactElement[] = [];
  const clipId = `bw${b.seed}`;
  // windows
  for (let f = 0; f < b.stories; f++) {
    const fy = base - GROUND - (f + 1) * STORY;
    for (let c = 0; c < bays; c++) {
      const wx = b.x + c * bw + bw * 0.28, ww = bw * 0.44, wy = fy + STORY * 0.2, wh = STORY * 0.52;
      if (wy < cutY(wx + ww / 2) + 40) continue;
      const k = b.seed * 13 + f * 7 + c;
      const r = rnd(k);
      const burning = r < burn * (f < 3 ? 1.2 : 0.8);
      const isLit = !burning && rnd(k + 1) < lit;
      const broken = !burning && !isLit && rnd(k + 2) < 0.35;
      els.push(<rect key={`s${f}_${c}`} x={wx - 14} y={wy + wh} width={ww + 28} height={26} fill={m.trim} stroke={INK} strokeWidth={ink * 0.5} />);
      els.push(<rect key={`l${f}_${c}`} x={wx - 10} y={wy - 34} width={ww + 20} height={34} fill={m.trim} stroke={INK} strokeWidth={ink * 0.5} />);
      if (burning) {
        const fl = 0.8 + 0.2 * noise(t * 2 + k, k);
        els.push(<rect key={`w${f}_${c}`} x={wx} y={wy} width={ww} height={wh} fill={CITY.ember} stroke={INK} strokeWidth={ink * 0.7} />);
        els.push(<g key={`fl${f}_${c}`} transform={`translate(${f2(wx + ww / 2)} ${f2(wy + wh)})`}><Flames w={ww * 0.95} h={wh * 0.95 * fl} t={t} seed={k} n={3} /></g>);
        // soot stain and flame tongues licking out of the top
        els.push(<path key={`so${f}_${c}`} d={`M ${f2(wx)} ${f2(wy)} Q ${f2(wx + ww / 2)} ${f2(wy - STORY * 0.7)} ${f2(wx + ww)} ${f2(wy)} Z`} fill={K.soot} opacity={0.55} />);
        if (rnd(k + 3) > 0.4) els.push(<g key={`ft${f}_${c}`} transform={`translate(${f2(wx + ww / 2)} ${f2(wy + 10)})`}><Flames w={ww * 0.7} h={STORY * 0.45} t={t + 1.3} seed={k + 99} n={2} /></g>);
        glows.push(<Glow key={`gw${f}_${c}`} id={`gw${b.seed}_${f}_${c}`} cx={wx + ww / 2} cy={wy + wh * 0.5} rx={ww * 1.6} ry={wh * 1.3} op={0.45} />);
      } else {
        els.push(<rect key={`w${f}_${c}`} x={wx} y={wy} width={ww} height={wh} fill={isLit ? K.glassLit : broken ? K.glassDark : K.glassBlue} stroke={INK} strokeWidth={ink * 0.7} opacity={isLit ? 0.9 : 1} />);
        els.push(<line key={`m${f}_${c}`} x1={wx} y1={wy + wh * 0.5} x2={wx + ww} y2={wy + wh * 0.5} stroke={INK} strokeWidth={ink * 0.45} />);
        if (broken) els.push(<path key={`b${f}_${c}`} d={`M ${f2(wx)} ${f2(wy + wh * 0.15)} L ${f2(wx + ww * 0.35)} ${f2(wy + wh * 0.32)} L ${f2(wx + ww * 0.1)} ${f2(wy + wh * 0.5)} Z M ${f2(wx + ww)} ${f2(wy + wh * 0.62)} L ${f2(wx + ww * 0.7)} ${f2(wy + wh)} L ${f2(wx + ww)} ${f2(wy + wh)} Z`} fill={K.glassBlue} opacity={0.85} />);
        else if (!isLit) els.push(<path key={`r${f}_${c}`} d={`M ${f2(wx + ww * 0.15)} ${f2(wy + wh * 0.42)} L ${f2(wx + ww * 0.42)} ${f2(wy + wh * 0.1)}`} stroke="#6E8496" strokeWidth={ink * 0.6} opacity={0.6} />);
      }
    }
    // string course
    if (detail > 0.5 && f % 2 === 1) els.push(<rect key={`sc${f}`} x={b.x} y={fy + STORY - 18} width={b.w} height={18} fill={m.dark} opacity={0.55} />);
  }
  // holes (blast damage)
  for (let h = 0; h < b.holes; h++) {
    const k = b.seed * 3 + h * 41;
    const hx = b.x + b.w * (0.2 + rnd(k) * 0.6), hy = base - GROUND - STORY * (1 + rnd(k + 1) * (b.stories - 2));
    if (hy < cutY(hx) + 300) continue;
    const r = 180 + rnd(k + 2) * 160;
    const pts = range(12).map((i) => { const a = (i / 12) * Math.PI * 2; const q = 0.72 + rnd(k + i * 3) * 0.32; return {x: hx + Math.cos(a) * r * q, y: hy + Math.sin(a) * r * 0.8 * q}; });
    els.push(<path key={`h${h}`} d={polyPath(pts)} fill="#120C10" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />);
    els.push(<path key={`hr${h}`} d={`M ${f2(hx - r * 0.5)} ${f2(hy + r * 0.2)} l ${f2(r * 0.3)} ${f2(-r * 0.5)} M ${f2(hx + r * 0.2)} ${f2(hy + r * 0.4)} l ${f2(r * 0.25)} ${f2(-r * 0.6)}`} stroke={K.rebar} strokeWidth={ink * 1.2} strokeLinecap="round" />);
    if (rnd(k + 5) > 0.4) els.push(<g key={`hf${h}`} transform={`translate(${f2(hx)} ${f2(hy + r * 0.55)})`}><Flames w={r * 1.0} h={r * 1.1} t={t} seed={k} n={3} /></g>);
  }
  // fire escape over one column of windows
  if (b.fireEscape && detail > 0.5) {
    const c = Math.floor(rnd(b.seed + 77) * bays);
    const fx = b.x + c * bw + bw * 0.12, fw = bw * 0.76;
    for (let f = 0; f < b.stories; f++) {
      const py = base - GROUND - f * STORY - STORY * 0.18;
      if (py - STORY < cutY(fx + fw / 2)) break;
      els.push(<rect key={`fe${f}`} x={fx} y={py} width={fw} height={16} fill={K.fireEscape} stroke={INK} strokeWidth={ink * 0.5} />);
      els.push(<path key={`fr${f}`} d={`M ${f2(fx)} ${f2(py)} V ${f2(py - 140)} H ${f2(fx + fw)} V ${f2(py)}`} fill="none" stroke={K.fireEscape} strokeWidth={ink * 1.2} />);
      if (f < b.stories - 1) {
        const dir = f % 2 ? 1 : -1;
        els.push(<line key={`fl${f}`} x1={dir > 0 ? fx + fw * 0.1 : fx + fw * 0.9} y1={py} x2={dir > 0 ? fx + fw * 0.85 : fx + fw * 0.15} y2={py - STORY} stroke={K.fireEscape} strokeWidth={ink * 1.6} />);
      }
    }
  }
  // storefront level
  const sf: React.ReactElement[] = [];
  const shops = Math.max(1, Math.floor(b.w / 900));
  const sw = b.w / shops;
  for (let i = 0; i < shops; i++) {
    const k = b.seed * 5 + i;
    const sx = b.x + i * sw + 60, sww = sw - 120;
    const sy = base - GROUND + 160;
    const open = rnd(k) < 0.35 ? 0.4 + rnd(k + 1) * 0.5 : 0;
    sf.push(<rect key={`sh${i}`} x={sx} y={sy + 150} width={sww} height={GROUND - 310} fill="#1A1316" stroke={INK} strokeWidth={ink} />);
    const shH = (GROUND - 310) * (1 - open);
    sf.push(<rect key={`ss${i}`} x={sx} y={sy + 150} width={sww} height={shH} fill={K.shutter} stroke={INK} strokeWidth={ink * 0.7} />);
    range(3).forEach((j) => sf.push(<line key={`sl${i}_${j}`} x1={sx} y1={sy + 150 + ((j + 1) * shH) / 4} x2={sx + sww} y2={sy + 150 + ((j + 1) * shH) / 4} stroke={K.shutterDark} strokeWidth={ink * 0.7} />));
    // awning + abstract sign band
    const col = K.awning[Math.floor(rnd(k + 3) * K.awning.length)];
    sf.push(<rect key={`sg${i}`} x={sx - 20} y={sy} width={sww + 40} height={110} fill={col} stroke={INK} strokeWidth={ink} />);
    sf.push(<rect key={`sga${i}`} x={sx + sww * 0.18} y={sy + 34} width={sww * 0.38} height={16} rx={8} fill="#E9DCC0" opacity={0.8} />);
    sf.push(<circle key={`sgb${i}`} cx={sx + sww * 0.75} cy={sy + 55} r={26} fill="#E9DCC0" opacity={0.8} />);
    if (rnd(k + 6) > 0.5) sf.push(<path key={`aw${i}`} d={`M ${f2(sx - 30)} ${f2(sy + 110)} L ${f2(sx + sww + 30)} ${f2(sy + 110)} L ${f2(sx + sww + 70)} ${f2(sy + 230)} L ${f2(sx - 70)} ${f2(sy + 230)} Z`} fill={col} stroke={INK} strokeWidth={ink} strokeLinejoin="round" opacity={0.95} />);
  }
  // cornice + parapet
  const cornice = b.collapse > 0 ? null : (
    <g>
      <rect x={b.x - 30} y={top - 10} width={b.w + 60} height={70} fill={m.trim} stroke={INK} strokeWidth={ink} />
      <rect x={b.x - 10} y={top + 60} width={b.w + 20} height={34} fill={m.dark} stroke={INK} strokeWidth={ink * 0.7} />
    </g>
  );
  return (
    <g>
      <defs><clipPath id={clipId}><path d={wallD} /></clipPath></defs>
      <path d={wallD} fill={m.wall} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>
        <rect x={b.x} y={base - GROUND} width={b.w} height={GROUND} fill={m.dark} opacity={0.35} />
        {els}
      </g>
      {glows}
      {sf}
      {cornice}
      {b.tank && b.collapse === 0 && <WaterTower x={b.x + b.w * (0.3 + rnd(b.seed + 21) * 0.4)} y={top - 10} s={1} ink={ink} />}
      {b.collapse > 0 && <path d={polyPath(jagged({x: b.x + b.w * (1 - b.collapse * 0.7), y: top + 30}, {x: b.x + b.w, y: top + STORY * (1 + b.collapse * 2.2) + 30}, b.seed + 3, 60, 7).concat([{x: b.x + b.w, y: top + STORY * (1 + b.collapse * 2.2) + 120}]), true)} fill={m.dark} opacity={0.5} />}
    </g>
  );
};

export type FacadesProps = {x0: number; x1: number; base?: number; t: number; seed?: number; ink?: number; burn?: number; lit?: number; smoke?: boolean};

/** The north-side row with occasional smoke from burning buildings. */
export const Facades: React.FC<FacadesProps> = ({x0, x1, base = -140, t, seed = 1, ink = 6, burn = 0.14, lit = 0.12, smoke = true}) => {
  const row = buildingRow(x0, x1, seed);
  return (
    <g>
      {row.map((b) => <Building key={b.seed} b={b} base={base} t={t} ink={ink} burn={burn} lit={lit} />)}
      {smoke && row.filter((b, i) => rnd(b.seed + 404) < 0.45 || i === 1).map((b) => (
        <SmokeColumn key={`sm${b.seed}`} x={b.x + b.w * 0.6} y={base - GROUND - b.stories * STORY + 200} h={5200} w={1300} t={t} seed={b.seed} op={0.62} drift={0.3} />
      ))}
    </g>
  );
};

/** Near-side (south) buildings for foreground framing: lower floors only, in shadow with a warm rim from the fires. */
export const FacadesNear: React.FC<FacadesProps & {shade?: number; rim?: number}> = ({x0, x1, base = 900, t, seed = 9, ink = 8, burn = 0.1, shade = 0.62, rim = 1}) => {
  const row = buildingRow(x0, x1, seed);
  return (
    <g>
      {row.map((b) => (
        <g key={b.seed}>
          <Building b={{...b, stories: Math.min(b.stories, 3), tank: false, collapse: 0, fireEscape: b.fireEscape}} base={base} t={t} ink={ink} burn={burn} lit={0.05} detail={0.6} />
          <rect x={b.x} y={base - GROUND - 3 * STORY - 120} width={b.w} height={GROUND + 3 * STORY + 140} fill="#140C10" opacity={shade} />
          {rim > 0 && <rect x={b.x} y={base - GROUND - 3 * STORY - 110} width={14} height={GROUND + 3 * STORY} fill={CITY.fire} opacity={0.35 * rim} />}
        </g>
      ))}
    </g>
  );
};
