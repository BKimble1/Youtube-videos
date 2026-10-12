import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {Building, STYLES} from '../v2/Street2';
import {IconBoat} from '../film/B02';
import {cl, lerp, ramp, sm} from '../film2/ui';
import {PalmWind, Lamp3} from './Street5';
import {T} from './timeline5';

/**
 * The coast (V4). Sea to the WEST (left), the town to the east (right): the water moves screen-right. One source of truth for the water: `crestX/crestH/LF/beta` define the wave, `frontPts`
 * samples its front face, `waterY(x, f)` is the surface the picture draws AND the surface the boat floats on; the water body is drawn AFTER the boat so the submerged hull is masked by the same geometry.
 * Sequence: a swell enters from the left and keeps growing (the boat is lifted up its front face), it reaches the boat and the pier's middle post on "coast" (frame 336),
 * the lip breaks over the boat (capsize), post 2 snaps and takes a deck section with it, and a flood rises through the frame and drains away to the calm.
 * Illustrative, not a forecast: no heights, depths or times are meant.
 */
export const BASE = 1200, WALL_X = 640, PROM_Y = 1140;
const POST_X = [110, 270, 430];
export const swellA = T.swellA;
const mixHex = (a: string, b: string, t: number) => { const tt = Math.max(0, Math.min(1, t)); const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * tt).toString(16).padStart(2, '0')).join(''); };
/** position of the crest: a slow, growing swell that picks up speed */
const X0 = -130; // the swell is already a low hill on the left of the frame when the coast opens (its front ramp spans x -130..210): it is visible, and growing, from the first frames
const crestBase = (f: number) => { const t = Math.max(0, f - swellA); return f < swellA ? X0 : X0 + 0.7 * t + 0.075 * t * t; };
/** after the hit the surge keeps going and speeds up: it runs on toward the seawall and the town while the flood layer takes over the frame */
const surgeExtra = (f: number) => { const u = Math.max(0, f - T.postBreak); return 3.2 * u + 0.18 * u * u; };
export const crestX = (f: number) => crestBase(f) + surgeExtra(f);
/** the frame at which the crest passes world x (inverse of crestX, which only increases) */
export const passF = (x: number) => { let a = swellA, b = swellA + 200; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (crestX(m) < x) a = m; else b = m; } return (a + b) / 2; };
export const crestH = (f: number) => 120 + 640 * E.inOut(cl((f - swellA) / 68));
const wavePh = (f: number) => f * 0.09;
/** the sea is agitated as the swell approaches: the chop grows from f266 (the boat, which floats on this surface, heaves with it) */
const ripple = (x: number, f: number) => (1 + 1.7 * cl((f - 266) / 40)) * (7 * Math.sin(x / 58 - wavePh(f)) + 4 * Math.sin(x / 24 - 1.9 * wavePh(f)));
const yBase = (x: number) => (x < WALL_X ? BASE : PROM_Y);
const LB = 800;
/** length of the front face: long and gentle while the swell builds (the boat rides up it), short and curling once it breaks */
const LF = (f: number) => (f < 330 ? 340 : lerp(340, 90, sm((f - 330) / 14)));
/** how far the lip has curled over (0 = a smooth hill, 1 = a breaking barrel) */
const beta = (f: number) => 0.3 * sm((f - 300) / 20) + 0.7 * sm((f - 334) / 10);
const back = (x: number, f: number) => {
  const xc = crestX(f), h = crestH(f), top = yBase(xc) - h;
  if (f < swellA - 6 || x <= xc - LB) return BASE + ripple(x, f);
  const u = Math.min(1, (xc - x) / LB);
  const g = Math.pow(Math.cos(u * Math.PI / 2), 2); // rounded crest: zero slope at the top, long convex back
  return BASE - (BASE - top) * (0.55 * g + 0.45 * Math.pow(1 - u, 2.6)) + ripple(x, f) * u * 0.5;
};
type Pt = {x: number; y: number};
/** the front face of the wave as a polyline, crest to foot (same cubic the drawn path uses) */
const frontCtrl = (f: number) => {
  const xc = crestX(f), h = crestH(f), lf = LF(f), b = beta(f), top = yBase(xc) - h, yb = yBase(xc + lf);
  const P0 = {x: xc, y: top}, P3 = {x: xc + lf, y: yb};
  // steep just below the crest, flaring gently to the foot (a swell's front); as it breaks the upper face bulges forward into a lip
  const P1 = {x: xc + (0.07 + 0.78 * b) * lf + 120 * b, y: top + 0.34 * (yb - top) * (1 - b) - 70 * b};
  const P2 = {x: xc + (0.52 + 0.4 * b) * lf, y: yb - (0.05 + 0.3 * b) * (yb - top)};
  return {P0, P1, P2, P3};
};
const bez = (c: ReturnType<typeof frontCtrl>, t: number): Pt => { const u = 1 - t; return {x: u * u * u * c.P0.x + 3 * u * u * t * c.P1.x + 3 * u * t * t * c.P2.x + t * t * t * c.P3.x, y: u * u * u * c.P0.y + 3 * u * u * t * c.P1.y + 3 * u * t * t * c.P2.y + t * t * t * c.P3.y}; };
export const frontPts = (f: number, n = 40): Pt[] => { const c = frontCtrl(f); return Array.from({length: n + 1}).map((_, i) => bez(c, i / n)); };
/** the water surface at world x: the shared truth the picture and the boat both use */
export const waterY = (x: number, f: number): number => {
  if (f < swellA - 6) return BASE + ripple(x, f);
  const xc = crestX(f);
  if (x <= xc) return back(x, f);
  const pts = frontPts(f);
  if (x <= pts[pts.length - 1].x) {
    let best = pts[0].y, bd = 1e9;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x) && Math.abs(b.x - a.x) > 1e-6) { const y = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); if (best === pts[0].y || y < bd) { bd = y; best = y; } }
    }
    return best;
  }
  return yBase(x) + ripple(x, f);
};
export const hitShake = (f: number) => { const t = f - T.surgeHit; return t < 0 || t > 16 ? {dx: 0, dy: 0} : {dx: 11 * Math.exp(-t * 0.3) * Math.sin(t * 2.1), dy: 8 * Math.exp(-t * 0.3) * Math.cos(t * 2.4)}; };

const Skyline: React.FC = () => (
  <g>
    <path d="M -100 1040 L -100 990 Q 40 950 160 972 Q 300 936 420 974 Q 520 990 560 1040 Z" fill={C.tealDeep} opacity={0.5} stroke={C.ink} strokeWidth={3} />
    {[[660, 300, 90], [760, 420, 110], [884, 250, 80], [980, 360, 100], [1090, 460, 120], [1210, 280, 90]].map(([x, h, w], i) => (
      <g key={i} opacity={0.85}>
        <rect x={x} y={1040 - h} width={w} height={h} fill={i % 2 ? C.tealDeep : '#2B6A72'} stroke={C.ink} strokeWidth={4} />
        {Array.from({length: Math.floor(h / 46)}).map((_, r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 16 + c * 34} y={1040 - h + 22 + r * 46} width={16} height={22} fill={C.saffronLight} opacity={0.65} />))}
      </g>
    ))}
  </g>
);
const Promenade: React.FC<{f: number}> = ({f}) => {
  const k = 0.55 + 0.45 * sm((f - 238) / 50);
  return (
    <g>
      <g transform={`translate(0 ${PROM_Y - 1150})`}>
        <Building x={700} w={560} h={700} s={STYLES[1]} />
        <Building x={1274} w={540} h={640} s={STYLES[0]} />
      </g>
      <rect x={WALL_X} y={PROM_Y} width={W - WALL_X + 400} height={H - PROM_Y} fill={C.paperDeep} stroke={C.ink} strokeWidth={5} />
      <rect x={WALL_X} y={PROM_Y} width={W - WALL_X + 400} height={26} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <rect x={WALL_X - 54} y={PROM_Y} width={54} height={H - PROM_Y} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 8}).map((_, r) => <g key={r}><line x1={WALL_X - 54} y1={PROM_Y + 90 + r * 100} x2={WALL_X} y2={PROM_Y + 90 + r * 100} stroke="#C9B27F" strokeWidth={5} /><line x1={WALL_X - 27 + (r % 2) * 14} y1={PROM_Y + r * 100 - 10} x2={WALL_X - 27 + (r % 2) * 14} y2={PROM_Y + 90 + r * 100} stroke="#C9B27F" strokeWidth={4} /></g>)}
      <g>{[0, 62].map((dx) => <line key={dx} x1={WALL_X + 120 + dx} y1={PROM_Y + 10} x2={WALL_X + 120 + dx} y2={PROM_Y + 520} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />)}{Array.from({length: 9}).map((_, i) => <line key={i} x1={WALL_X + 120} y1={PROM_Y + 56 + i * 54} x2={WALL_X + 182} y2={PROM_Y + 56 + i * 54} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />)}</g>
      <g transform={`translate(${WALL_X + 330} ${PROM_Y + 260})`}><circle r={52} fill="none" stroke={C.ink} strokeWidth={34} /><circle r={52} fill="none" stroke={C.coral} strokeWidth={24} /><circle r={52} fill="none" stroke={C.cream} strokeWidth={24} strokeDasharray="41 41" /></g>
      {[760, 960].map((x, i) => <PalmWind key={x} x={x + 40} baseY={PROM_Y} h={i ? 430 : 520} k={k} f={f} seed={i * 2.1 + 5} />)}
      <Lamp3 x={1000} wob={1.4 * k * Math.sin(f * 0.6)} />
    </g>
  );
};

/* ------------------------------------------------------------------ the boat: floats on waterY, tilts with the local slope (lagged), is carried east, capsizes as the lip breaks over it */
export const BOAT = {x0: 185, tFoot: 274, tCap: 335, s: 2.4};
const BOAT_D = 10.5 * BOAT.s; // waterline offset: the keel sits about a third of the hull height below the surface
const boatX0 = (f: number) => BOAT.x0 + 1.55 * Math.max(0, Math.min(f, BOAT.tCap) - BOAT.tFoot);
const slopeAt = (x: number, f: number) => Math.max(-38, Math.min(38, Math.atan((waterY(x + 22, f) - waterY(x - 22, f)) / 44) * 57.3 * 0.9));
/** after the capsize the hull is thrown over the lip and slides down the front face, upside down, on the same curve the water is drawn with */
const boatX = (f: number) => (f <= BOAT.tCap ? boatX0(f) : bez(frontCtrl(f), faceT(f)).x);
const faceT = (f: number) => lerp(0.12, 0.8, E.inOut(cl((f - BOAT.tCap) / 14)));
export const boatPose = (f: number) => {
  const lag = (g: (ff: number) => number) => 0.5 * g(f) + 0.3 * g(f - 1) + 0.2 * g(f - 2);
  const bob = 5 * Math.sin(f * 0.16) * cl((292 - f) / 22); // the mooring bob fades out as the swell lifts the boat
  if (f <= BOAT.tCap) { const x = boatX(f); return {x, y: waterY(x, f) + BOAT_D + bob, ang: lag((ff) => slopeAt(boatX(Math.min(ff, BOAT.tCap)), Math.min(ff, BOAT.tCap))), flip: 0, afloat: true}; }
  const k = cl((f - BOAT.tCap) / 12), flip = E.inOut(k);
  const c = frontCtrl(f), p = bez(c, faceT(f)), p2 = bez(c, Math.min(1, faceT(f) + 0.05));
  const tang = Math.atan2(p2.y - p.y, p2.x - p.x) * 57.3;
  return {x: p.x, y: p.y + BOAT_D - 80 * flip, ang: slopeAt(boatX0(BOAT.tCap), BOAT.tCap) * (1 - flip) + (168 + 0.25 * (tang - 90)) * flip + 3 * Math.sin(f * 0.5) * flip, flip, afloat: k >= 1};
};
const Boat: React.FC<{f: number}> = ({f}) => {
  const b = boatPose(f);
  return <g transform={`translate(${b.x} ${b.y}) rotate(${b.ang}) scale(${BOAT.s})`}><IconBoat /></g>;
};
/** foam around the hull at the waterline, in front of the water: it climbs with the boat, which is what ties the hull to the surface */
const BoatFoam: React.FC<{f: number}> = ({f}) => {
  if (f < BOAT.tFoot - 8 || f > T.floodA + 6) return null;
  const b = boatPose(f), wy = f <= BOAT.tCap ? waterY(b.x, f) : b.y - BOAT_D + 80 * b.flip;
  return <g>{[-96, -62, -30, 0, 30, 62, 96].map((dx, i) => <ellipse key={i} cx={b.x + dx * 1.4 * (1 + 0.2 * b.flip)} cy={wy - 4 + 4 * Math.sin(f * 0.4 + i)} rx={26 - 4 * Math.abs(i - 3) + 4 * rand(i + 3)} ry={12} fill={C.cream} opacity={0.9 - 0.12 * Math.abs(i - 3)} />)}</g>;
};

/* ------------------------------------------------------------------ the sea: the horizon band behind the boat, and the water body (calm bay + swell + front face + lip) in front of it */
const SeaBack: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-200} y={1030} width={W + 600} height={BASE - 1030} fill={C.tealLight} />
    <line x1={-200} y1={1030} x2={W + 400} y2={1030} stroke={C.teal} strokeWidth={6} />
    {Array.from({length: 12}).map((_, i) => <path key={`h${i}`} d={`M ${-100 + i * 80 + ((f * 0.5) % 80)} ${1070 + (i % 3) * 36} h 46`} stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.7} />)}
  </g>
);
const SeaFront: React.FC<{f: number}> = ({f}) => {
  const on = f >= swellA - 6, xc = crestX(f), h = crestH(f), top = yBase(xc) - h, c = frontCtrl(f), foot = c.P3.x;
  const x0 = -700, xEnd = Math.max(WALL_X, foot); // x0 is left of the crest for every frame the swell is on, so the body path is never empty
  const pts: string[] = [];
  const xs: number[] = [];
  for (let x = x0; x <= Math.min(xc, WALL_X + 2000); x += 22) xs.push(x);
  xs.forEach((x) => pts.push(`${x},${back(x, f)}`));
  const calm: string[] = [];
  for (let x = Math.ceil(foot / 22) * 22; x <= WALL_X; x += 22) calm.push(`${x},${BASE + ripple(x, f)}`);
  const front = `C ${c.P1.x} ${c.P1.y}, ${c.P2.x} ${c.P2.y}, ${c.P3.x} ${c.P3.y}`;
  const tailLine = calm.length ? ` L ${calm.join(' L ')}` : '';
  const body = on && xc > x0 - 50
    ? `M ${x0} 1990 L ${pts.join(' L ')} L ${xc} ${top} ${front}${tailLine} L ${xEnd} 1990 Z`
    : `M ${x0} ${BASE} L ${Array.from({length: Math.ceil((WALL_X - x0) / 22) + 1}).map((_, i) => `${x0 + i * 22},${BASE + ripple(x0 + i * 22, f)}`).join(' L ')} L ${WALL_X} 1990 L ${x0} 1990 Z`;
  const fp = frontPts(f, 18);
  const spray: React.ReactNode[] = [];
  if (on && f > swellA + 20 && xc > -150) {
    for (let i = 0; i < 40; i++) {
      const age = ((f * 1.0 + i * 3.1) % 34), kk = rand(i + 4), x = xc + 30 + age * (4 + 5 * kk) + rand(i) * 40, y = top + 30 - age * (5 + 4 * rand(i + 2)) + age * age * 0.3 + rand(i + 9) * 60;
      spray.push(<circle key={i} cx={x} cy={y} r={(4 + 9 * rand(i + 3)) * (1 - age / 44)} fill={C.cream} opacity={cl(1 - age / 36) * (0.4 + 0.6 * beta(f + 14))} />);
    }
  }
  return (
    <g>
      <defs>
        <clipPath id="waveClip4"><path d={body} /></clipPath>
        <linearGradient id="waveG4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2FBDB3" /><stop offset="0.35" stopColor={C.teal} /><stop offset="1" stopColor="#0E706A" /></linearGradient>
      </defs>
      <path d={body} fill="url(#waveG4)" />
      <g clipPath="url(#waveClip4)">
        {Array.from({length: 12}).map((_, i) => { const y = Math.max(BASE + 60, top + 140) + i * 80, x = ((i * 233 + (f - swellA) * (18 + 4 * i)) % 1100) - 160; return <path key={i} d={`M ${x} ${y} q 80 -26 170 0`} stroke={C.tealLight} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.45} />; })}
        {on && <path d={`M ${xc - 120} ${top + 80} C ${xc - 40} ${top + 60}, ${xc + 20} ${top + 120}, ${xc + 40} ${top + 220} L ${xc - 60} ${top + 380} L ${xc - 260} ${top + 300} Z`} fill={C.ink} opacity={0.16} />}
        {on && beta(f) > 0.1 && <path d={`M ${c.P0.x} ${c.P0.y} C ${c.P1.x} ${c.P1.y}, ${c.P2.x} ${c.P2.y}, ${c.P3.x} ${c.P3.y} L ${c.P3.x - 80} ${c.P3.y} L ${c.P0.x - 40} ${top + 60} Z`} fill={C.ink} opacity={0.28 * beta(f)} />}
        {on && [70, 150, 240].map((off, i) => <path key={off} d={`M ${Array.from({length: 18}).map((_, k) => { const x = xc - 60 - k * 38; return `${x},${back(x, f) + off + 6 * Math.sin(k + f * 0.2)}`; }).join(' L ')}`} fill="none" stroke={C.cream} strokeWidth={12 - i * 2} strokeLinecap="round" strokeDasharray="30 22" opacity={0.5 - i * 0.1} />)}
      </g>
      <path d={body} fill="none" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      {/* foam: a scalloped line along the back slope and blobs along the crest and the front face (it travels with the water because it is placed on the same curve) */}
      {on && xc > -100 && <path d={`M ${xs.filter((x) => x > xc - 760).map((x) => `${x},${back(x, f)}`).join(' L ')}`} fill="none" stroke={C.cream} strokeWidth={24} strokeLinecap="round" strokeDasharray="34 16" />}
      {on && fp.map((p, i) => i % 1 === 0 && <ellipse key={i} cx={p.x + 4 * Math.sin(f * 0.5 + i)} cy={p.y + 3 * Math.sin(f * 0.4 + i * 2)} rx={(24 - 8 * (i / 18) + 6 * rand(i + 1)) * (0.5 + 0.5 * beta(f))} ry={(15 - 4 * (i / 18)) * (0.5 + 0.5 * beta(f))} fill={C.cream} />)}
      {spray}
    </g>
  );
};

/* ------------------------------------------------------------------ the pier: loads, one post snaps, a deck section goes with it */
const DECK = {y: 1092, h: 52, secs: [{x0: 10, x1: 190}, {x0: 190, x1: 350}, {x0: 350, x1: 530}]};
export const PF = POST_X.map((x) => passF(x));
export const BRK = {post: Math.ceil(PF[1]) + 1, deck: T.deckGo};
const planks = Array.from({length: 9}).map((_, i) => ({x: 200 + rand(i + 11) * 150, dly: Math.floor(rand(i + 13) * 4), vx: 7 + rand(i + 15) * 10, vy: -9 - rand(i + 17) * 14, sp: (rand(i + 19) - 0.35) * 30, w: 60 + rand(i + 21) * 40}));
const splinters = Array.from({length: 12}).map((_, i) => ({x: 220 + rand(i + 31) * 130, dly: Math.floor(rand(i + 33) * 5), vx: 9 + rand(i + 35) * 14, vy: -12 - rand(i + 37) * 16, sp: (rand(i + 39) - 0.5) * 50}));
const ragged = (x: number, y0: number, y1: number, dir: 1 | -1, seed: number) => Array.from({length: 5}).map((_, i) => `${x + dir * (i % 2 ? 14 + 8 * rand(seed + i) : 0)} ${y0 + (y1 - y0) * i / 4}`).join(' L ');
const DeckSec: React.FC<{x0: number; x1: number; ragL?: boolean; ragR?: boolean; seed?: number}> = ({x0, x1, ragL, ragR, seed = 1}) => {
  const y0 = DECK.y, y1 = DECK.y + DECK.h;
  const d = `M ${x0} ${y0} L ${x1} ${y0} L ${ragR ? ragged(x1, y0, y1, -1, seed) : `${x1} ${y1}`} L ${x0} ${y1} ${ragL ? `L ${ragged(x0, y1, y0, 1, seed + 9)}` : ''} Z`;
  const n = Math.floor((x1 - x0) / 50);
  return (
    <g>
      <path d={d} fill={C.woodLight} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: n}).map((_, i) => <line key={i} x1={x0 + 22 + i * 50} y1={y0 + 4} x2={x0 + 22 + i * 50} y2={y1 - 4} stroke={C.woodDeep} strokeWidth={3} />)}
    </g>
  );
};
const PostShaft: React.FC<{x: number; y0: number; y1: number}> = ({x, y0, y1}) => (
  <g>
    <rect x={x - 30} y={y0} width={60} height={y1 - y0} fill={C.woodDeep} stroke={C.ink} strokeWidth={6} />
    {[1260, 1350, 1440, 1530, 1620, 1710].filter((y) => y >= y0 && y + 24 <= y1).map((y, k) => <rect key={y} x={x - 30} y={y} width={60} height={24} fill={k % 2 ? C.cream : C.coral} stroke={C.ink} strokeWidth={3} />)}
  </g>
);
const PostCap: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 38} y={1084} width={76} height={24} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={5} />
    <rect x={x - 12} y={1040} width={24} height={50} rx={6} fill={C.ink} />
  </g>
);
const Pier: React.FC<{f: number}> = ({f}) => {
  const loadT = (i: number) => f - PF[i];
  const trem = (i: number) => { const t = loadT(i); return t > -10 && t < 12 ? 3 * Math.sin(f * 2.3) * (t < 0 ? 1 + t / 10 : Math.exp(-t / 5)) : 0; };
  // post 3 leans east once the deck section beside it is gone; post 1 shudders; post 2 snaps at the waterline
  const lean3 = 9 * E.in(cl((f - (BRK.deck + 1)) / 14));
  const t2 = Math.max(0, f - BRK.post), th2 = 34 * E.in(cl(t2 / 11));
  const broken = f >= BRK.post;
  const deckGone = f >= BRK.deck;
  const td = Math.max(0, f - BRK.deck);
  const a2a = 74 * E.in(cl(td / 12));             // the half still hinged to deck 1 swings down
  const flingT = td, fx = 14 * flingT, fy = -17 * flingT + 1.7 * flingT * flingT, fr = 24 * flingT;
  const a3 = -11 * E.in(cl((f - (BRK.deck + 1)) / 12));
  const sag1 = 1.8 * E.in(cl(td / 10));
  const capPos = (i: number) => ({x: POST_X[i] + (i === 0 ? trem(0) : i === 1 ? (broken ? 0 : trem(1)) : trem(2) + 0), y: 1096});
  void capPos;
  return (
    <g>
      {/* the far end of the pier is a quiet silhouette until the surge arrives */}
      <g transform={`translate(${trem(0)} 0)`}><PostShaft x={POST_X[0]} y0={1144} y1={2024} /></g>
      {/* post 2: lower stub stays; the upper part snaps at the waterline and rotates east */}
      {!broken && <g transform={`translate(${trem(1)} 0)`}><PostShaft x={POST_X[1]} y0={1144} y1={2024} /></g>}
      {broken && <g>
        <path d={`M ${POST_X[1] - 30} 2024 L ${POST_X[1] - 30} 1300 L ${POST_X[1] - 16} 1286 L ${POST_X[1] - 4} 1306 L ${POST_X[1] + 10} 1280 L ${POST_X[1] + 30} 1298 L ${POST_X[1] + 30} 2024 Z`} fill={C.woodDeep} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <g transform={`rotate(${th2} ${POST_X[1]} 1290) translate(${t2 * 2} 0)`}><PostShaft x={POST_X[1]} y0={1144} y1={1288} /><PostCap x={POST_X[1]} /></g>
      </g>}
      <g transform={`translate(${trem(2)} 0) rotate(${lean3} ${POST_X[2]} 1380)`}><PostShaft x={POST_X[2]} y0={1144} y1={2024} /></g>
      {/* deck sections: 1 intact (ragged right edge once the middle section goes), 2 splits (one half hangs from the hinge, one is flung), 3 loses its left support and tips */}
      <g transform={`rotate(${sag1} 10 1118) translate(${trem(0)} 0)`}><DeckSec x0={DECK.secs[0].x0} x1={DECK.secs[0].x1} ragR={deckGone} seed={3} /></g>
      {!deckGone && <g transform={`translate(${trem(1)} 0)`}><DeckSec x0={DECK.secs[1].x0} x1={DECK.secs[1].x1} seed={5} /></g>}
      {deckGone && <g transform={`rotate(${a2a} ${DECK.secs[1].x0} 1118)`}><DeckSec x0={DECK.secs[1].x0} x1={270} ragR seed={7} /></g>}
      {deckGone && f < BRK.deck + 16 && <g transform={`translate(${fx} ${fy}) rotate(${fr} 310 1118)`}><DeckSec x0={270} x1={DECK.secs[1].x1} ragL seed={9} /></g>}
      <g transform={`rotate(${a3} ${POST_X[2]} 1118) translate(${trem(2)} 0)`}><DeckSec x0={DECK.secs[2].x0} x1={DECK.secs[2].x1} ragL={deckGone} seed={11} /></g>
      {/* caps */}
      <g transform={`translate(${trem(0)} 0)`}><PostCap x={POST_X[0]} /></g>
      <g transform={`rotate(${lean3} ${POST_X[2]} 1380) translate(${trem(2)} 0)`}><PostCap x={POST_X[2]} /></g>
      {/* the rope: between the caps that are still standing; once post 2 goes it hangs from post 1 and trails */}
      <path d={`M ${POST_X[0]} 1050 q 80 46 ${POST_X[1] - POST_X[0]} 0 q 80 46 ${POST_X[2] - POST_X[1]} 0`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" opacity={deckGone ? 0 : 1} />
      {deckGone && <path d={`M ${POST_X[0]} 1050 q 40 ${60 + 60 * cl(td / 10)} 70 ${120 + 60 * cl(td / 10)}`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />}
      {deckGone && <path d={`M ${POST_X[2] + 4 * lean3 / 9} 1056 q -30 50 -60 ${70 + 30 * cl(td / 10)}`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />}
    </g>
  );
};
/** fragments fly from the identified break (deck section 2): planks and splinters, in front of everything */
const Fragments: React.FC<{f: number}> = ({f}) => {
  if (f < BRK.deck) return null;
  const t0 = f - BRK.deck;
  return (
    <g>
      {planks.map((p, i) => { const t = t0 - p.dly; if (t < 0 || t > 30) return null; const x = p.x + p.vx * t, y = 1110 + p.vy * t + 1.4 * t * t; return <rect key={i} x={x - p.w / 2} y={y - 8} width={p.w} height={16} fill={C.woodLight} stroke={C.ink} strokeWidth={4} transform={`rotate(${p.sp * t} ${x} ${y})`} />; })}
      {splinters.map((p, i) => { const t = t0 - p.dly; if (t < 0 || t > 26) return null; const x = p.x + p.vx * t, y = 1110 + p.vy * t + 1.4 * t * t; return <rect key={`s${i}`} x={x - 14} y={y - 4} width={28} height={8} fill={C.woodLight} stroke={C.ink} strokeWidth={3} transform={`rotate(${p.sp * t} ${x} ${y})`} />; })}
    </g>
  );
};
/** foam bursts in front of the pier at each point of contact (the crest passes behind a post; the burst is the water arriving at it) */
const Bursts: React.FC<{f: number}> = ({f}) => (
  <g>
    {POST_X.map((px, k) => {
      const t = f - PF[k]; if (t < -1 || t > 16) return null;
      const big = k === 1 ? 1.5 : 1;
      return (
        <g key={px}>
          {Array.from({length: 11}).map((_, i) => { const a = rand(i + k * 20 + 5), r = (14 + 26 * a) * big * Math.min(1, (t + 2) / 4) * (1 - t / 20), x = px - 40 + 80 * rand(i + k * 20 + 6) + t * (4 + 6 * a), y = 1200 - 40 * a * big - t * (9 + 10 * a) * big + 0.75 * t * t * (0.7 + a); return <circle key={i} cx={x} cy={y} r={Math.max(0, r)} fill={C.cream} opacity={cl(1 - t / 15)} stroke={C.ink} strokeWidth={r > 18 ? 3 : 0} />; })}
          {Array.from({length: 9}).map((_, i) => { const a = rand(i + k * 20 + 7), x = px - 30 + 60 * a + t * (6 + 8 * a), y = 1180 - t * (14 + 16 * a) * big + 1.1 * t * t; return <circle key={`d${i}`} cx={x} cy={y} r={4 + 4 * a} fill={C.tealLight} opacity={cl(1 - t / 14)} />; })}
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ the scene */
export const CoastScene: React.FC<{f: number}> = ({f}) => {
  const sh = hitShake(f), z = 1 + 0.04 * cl((f - T.coastA) / 90);
  const storm = 0.12 + 0.26 * cl((f - swellA) / 80);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id="skyC4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mixHex(C.saffron, '#B84A38', 0.3 + storm * 1.8)} /><stop offset="0.7" stopColor={mixHex(C.saffronLight, C.saffronDeep, 0.2 + storm * 1.2)} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#skyC4)" />
        <g transform={`translate(${sh.dx} ${sh.dy}) translate(540 1300) scale(${z}) translate(-540 -1300)`}>
          <circle cx={860} cy={380} r={110} fill={C.saffron} opacity={0.5} /><circle cx={860} cy={380} r={74} fill={C.saffronLight} />
          {[0, 1, 2].map((i) => <path key={i} d={`M -200 ${-200 + i * 120 + (1 - storm * 3) * -300} L -200 ${120 + i * 130} ${Array.from({length: 12}).map((_, k) => `Q ${-200 + k * 190 + 95} ${170 + i * 130 + 60 * Math.sin(k + i)} ${-200 + (k + 1) * 190} ${120 + i * 130 + 14 * Math.sin(k * 2 + i)}`).join(' ')} L ${W + 200} ${-200 + i * 120} Z`} fill={mixHex('#3A4A52', '#26343C', i / 2)} opacity={0.5 + 0.2 * i} />)}
          <Skyline />
          <Promenade f={f} />
          <SeaBack f={f} />
          <Boat f={f} />
          <SeaFront f={f} />
          <BoatFoam f={f} />
          <Pier f={f} />
          <Fragments f={f} />
          <Bursts f={f} />
        </g>
        {Array.from({length: 8}).map((_, i) => { const y = 300 + rand(i + 40) * 900, len = 200 + rand(i + 3) * 260, x = ((rand(i + 70) * (W + 700) + f * (80 + rand(i + 9) * 50)) % (W + 700)) - 350; return <line key={i} x1={x} y1={y} x2={x - len} y2={y} stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={0.45} />; })}
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ the transition: the flood rises through the frame (the surge climbing the lens, spray flying up), covers it for a few frames, then drains downward in sheets
   and rivulets, revealing the calm stage. One continuous body of water: its surface line carries foam, it is not a band. */
const floodLevel = (f: number) => (f < T.floodA ? H + 200 : f < T.floodB ? lerp(H + 200, -230, E.inOut(cl((f - T.floodA) / (T.floodB - T.floodA)))) : lerp(-230, H + 260, Math.pow(cl((f - T.drainA) / (T.drainB - T.drainA)), 1.15)));
export const FloodLayer: React.FC<{f: number}> = ({f}) => {
  if (f < T.floodA - 1 || f > T.drainB + 1) return null;
  const L = floodLevel(f), draining = f >= T.drainA + 2;
  const surf = (x: number) => L + 30 * Math.sin(x / 70 + f * 0.55) + 16 * Math.sin(x / 31 + f * 0.9);
  const xs = Array.from({length: 49}).map((_, i) => -20 + i * 24);
  const top = xs.map((x) => `${x},${surf(x)}`).join(' L ');
  const body = `M -20 ${H + 40} L ${top} L ${W + 20} ${H + 40} Z`;
  const speed = draining ? (floodLevel(f + 1) - floodLevel(f - 1)) / 2 : (floodLevel(f + 1) - floodLevel(f - 1)) / 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="floodClip"><path d={body} /></clipPath>
        <linearGradient id="floodG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2FBDB3" /><stop offset="0.5" stopColor={C.teal} /><stop offset="1" stopColor="#0E706A" /></linearGradient>
      </defs>
      <path d={body} fill="url(#floodG)" />
      <g clipPath="url(#floodClip)">
        {Array.from({length: 16}).map((_, i) => { const y = L + 120 + i * 130 + ((f * 18) % 130), x = ((i * 211 + f * (14 + 3 * i)) % 1500) - 200; return <path key={i} d={`M ${x} ${y} q 90 -28 190 0`} stroke={C.tealLight} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.5} />; })}
      </g>
      <path d={`M ${top.split(' L ')[0]} L ${top}`} fill="none" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      {/* foam along the surface line */}
      {xs.filter((_, i) => i % 2 === 0).map((x, i) => <ellipse key={i} cx={x + 10} cy={surf(x) - 4} rx={30 + 12 * rand(i + 1)} ry={22 + 6 * rand(i + 2)} fill={C.cream} />)}
      {/* spray thrown up on the way up; droplets falling and rivulets sheeting off on the way down */}
      {!draining && Array.from({length: 36}).map((_, i) => { const age = (f * 1.4 + i * 4) % 22, x = rand(i + 50) * W, y = surf(x) - 20 - age * (10 + 10 * rand(i + 51)) + age * age * 0.5; return <circle key={i} cx={x} cy={y} r={(5 + 12 * rand(i + 52)) * (1 - age / 30)} fill={C.cream} opacity={cl(1 - age / 22)} />; })}
      {draining && xs.filter((_, i) => i % 2 === 1).map((x, i) => { const len = (30 + 220 * rand(i + 60)) * cl(1 - (f - T.drainA) / (T.drainB - T.drainA) * 0.6), w = 10 + 10 * rand(i + 61); return <rect key={i} x={x - w / 2} y={surf(x) - len} width={w} height={len + 6} rx={w / 2} fill={C.tealLight} opacity={0.85} />; })}
      {draining && Array.from({length: 26}).map((_, i) => { const age = (f * 1.2 + i * 3) % 18, x = rand(i + 70) * W, y = surf(x) - 40 + age * (12 + 10 * rand(i + 71)) + age * age * 0.4; return <ellipse key={i} cx={x} cy={y} rx={5 + 5 * rand(i + 72)} ry={9 + 8 * rand(i + 73)} fill={C.tealLight} opacity={cl(1 - age / 18)} />; })}
      {void speed}
    </svg>
  );
};
