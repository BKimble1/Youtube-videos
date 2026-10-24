// V6 World 2: inside the science, one continuous explanation in one 2D space (his ear in section, and the air just
// outside it), drawn mirrored so his head is on the left and the beam arrives from the right, as in every shot.
//   6.1..8.55   the section, locked: the canal is open air, empty (a soft light runs down it). "The beam is invisible":
//               at first nothing; then its visualisation draws in, a thin dotted amber line to just outside the ear.
//   8.55..9.15  M2: into the air on the beam beside his ear (one continuous zoom to a new scale).
//   9.15..13.55 locked, molecular scale:
//     A  a pulse of infrared light (a short wave train) travels along the beam, through nitrogen and oxygen untouched;
//     B  it reaches a few water molecules: each takes some of its energy (the train shrinks after each) and starts to
//        vibrate (its hydrogens swing on their bonds);
//     C  the vibrating molecules knock into their neighbours, which speed up; the warm pocket of air swells and pushes
//        the surrounding air outward;
//     D  the light comes in pulses: each one swells the pocket again, and a ring of squeezed air travels outward.
//   13.55..14.15 M3: out with the rings to the ear (one continuous zoom back to the section's scale).
//   14.15..15.0 E: the rings travel into the (empty) canal; each one pushes the eardrum, the little bones follow.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, lerp, rnd, W, H, eio, FPS} from '../v4/core4';
import {INK} from '../v4/rig/cast4';
import {SHOT} from './cues6';

const C = {
  air: '#DCEEF2', airDeep: '#C7E2E9', skin: '#F2C9A8', flesh: '#E7A48D', fleshDeep: '#D88E78', cart: '#F7D7CB', bone: '#F1E4C4', boneDeep: '#E0CFA6',
  cavity: '#8E4A54', drum: '#F4EEF6', ossicle: '#FFF6E2', coch: '#F4B9A6', nerve: '#FFC744', hair: '#C0392B',
  ir: '#F2A93B', irGlow: '#FF9A2E', irCore: '#FFF3D6', n2: '#7C9CC7', o2: '#A9C9D4', oxy: '#E55B45', oxyHot: '#F08A32', hyd: '#FFFFFF', ring: '#5FA9C2', warm: '#FFB36B',
};
// ---------------------------------------------------------------- the section (units ~0.13 mm), V5 geometry
const HEAD = 'M 40 -1400 L 30 -300 C 22 -170 8 -120 2 -96 C -30 -120 -78 -190 -128 -244 C -150 -268 -180 -266 -182 -240 C -184 -214 -160 -198 -142 -176 C -104 -128 -60 -82 -20 -46 L -20 46 C -52 84 -90 126 -104 168 C -112 196 -92 222 -66 212 C -40 202 -14 160 4 120 C 18 160 30 260 40 1400 L 1400 1400 L 1400 -1400 Z';
const CANAL_TOP: [number, number][] = [[-20, -46], [60, -44], [150, -26], [230, -22], [282, -34]];
const CANAL_BOT: [number, number][] = [[-20, 46], [60, 40], [150, 30], [230, 36], [304, 36]];
const lin = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
const CANAL = `${lin(CANAL_TOP)} L 304 36 ${[...CANAL_BOT].reverse().slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ')} Z`;
const DRUM = {a: {x: 282, y: -34}, b: {x: 304, y: 36}};
const BEAM_Y = -12, BEAM_X1 = -30;
const M = {x: -88, y: BEAM_Y}; // the spot in the air we visit

// ---------------------------------------------------------------- camera
const SEC_CAM = {x: 35, y: -120, z: 1.05};
const MIC = {x: M.x, y: M.y + 0.3, z: 108};
const ECAM = {x: 150, y: 0, z: 2.15};
const CY = 830;
const logZoom = (a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}, u: number) => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u));
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
const camAt = (t: number) => {
  if (t < SHOT.m2[0]) return SEC_CAM;
  if (t < SHOT.m2[1]) return logZoom(SEC_CAM, MIC, eio(clamp((t - SHOT.m2[0]) / (SHOT.m2[1] - SHOT.m2[0]))));
  if (t < SHOT.m3[0]) return MIC;
  if (t < SHOT.m3[1]) return logZoom(MIC, ECAM, eio(clamp((t - SHOT.m3[0]) / (SHOT.m3[1] - SHOT.m3[0]))));
  return ECAM;
};

// ---------------------------------------------------------------- the story at molecular scale (world units ~ 0.13 mm,
// drawn hugely enlarged: one unit spans ~58 px here)
const PULSE_V = 7.5; // units/s along the beam (slowed for the picture)
// the water molecules in the beam (relative to M) and when the first pulse reaches each
const WATER = [{dx: 2.6, dy: 0.7, th: 0.4, z: 1}, {dx: -0.4, dy: -0.8, th: 2.1, z: 1}, {dx: -3.2, dy: 0.5, th: -0.7, z: 0.92}, {dx: 0.9, dy: 1.6, th: 1.3, z: 0.85}];
const P0 = {x: M.x + 9, t: 9.2}; // the first pulse's head enters at the right of frame (world x decreasing is screen-right .. left)
// in the world (unmirrored) the beam travels toward +x (to the ear); the pulse head position
const pulseX = (t: number, t0: number) => M.x - 9 + PULSE_V * (t - t0);
const hitT = (dx: number, t0: number) => t0 + (M.x + dx - (M.x - 9)) / PULSE_V;
const T_FIRST = 9.25;
const absorbT = WATER.map((w) => hitT(w.dx, T_FIRST));
// later pulses (D): each swells the pocket and launches a ring
const PULSES = [12.75, 13.15, 13.55, 13.95, 14.35, 14.75];
const RING_PX = 310; // rings travel at a steady screen speed whatever the scale
const RINGS: number[][] = (() => {
  const dt = 1 / (FPS * 4), table: number[][] = [], r = PULSES.map(() => 0);
  const starts = PULSES.map((p) => p + 0.18);
  for (let t = 12.6; t <= SHOT.c1 + 0.05; t += dt) {
    const z = camAt(t).z;
    starts.forEach((s0, i) => { if (t >= s0) r[i] += (RING_PX / z) * dt; });
    table.push([t, ...r]);
  }
  return table;
})();
const ringsAt = (t: number): {r: number; age: number}[] => {
  if (t < 12.6) return [];
  const row = RINGS[Math.min(RINGS.length - 1, Math.max(0, Math.round((t - 12.6) * FPS * 4)))];
  return PULSES.map((p, i) => ({r: row[i + 1], age: t - p - 0.18})).filter((x) => x.age > 0);
};
const swellAt = (t: number) => ss(11.65, 12.9, t) + 0.25 * PULSES.reduce((s, p) => s + Math.exp(-Math.pow((t - p - 0.12) / 0.12, 2)), 0);

// the other air molecules: sparse, in three depth layers (near ones larger and softer)
type Mol = {x: number; y: number; kind: 0 | 1; th: number; w: number; ph: number; depth: number};
const AIR: Mol[] = (() => {
  const out: Mol[] = [];
  for (let i = 0; i < 46; i++) {
    const x = M.x + (rnd(i * 3 + 1) - 0.5) * 22, y = M.y + (rnd(i * 3 + 2) - 0.5) * 34;
    if (Math.abs(x - M.x) < 4.6 && Math.abs(y - M.y) < 2.6) continue;
    const dp = rnd(i * 7 + 5);
    out.push({x, y, kind: rnd(i * 5 + 3) < 0.72 ? 0 : 1, th: rnd(i * 11) * 6.28, w: (rnd(i * 13) - 0.5) * 1.4, ph: rnd(i * 17) * 20, depth: dp < 0.3 ? 0.6 : dp < 0.85 ? 0.85 : 1.15});
  }
  return out;
})();

const ol = 2.6;
const Water: React.FC<{X: number; Y: number; k: number; th: number; vib: number; warm: number}> = ({X, Y, k, th, vib, warm}) => {
  const a = 52 * (Math.PI / 180);
  const d1 = 0.4 + 0.07 * vib * Math.sin(45 * 0), sw = vib;
  const h = [th - a + 0.25 * sw, th + a - 0.25 * sw].map((ang, i) => ({x: X - Math.cos(ang) * (0.4 + (i ? -1 : 1) * 0.06 * sw) * k, y: Y + Math.sin(ang) * (0.4 + (i ? -1 : 1) * 0.06 * sw) * k}));
  void d1;
  const oc = warm > 0.5 ? C.oxyHot : C.oxy;
  return (
    <g>
      {h.map((p, i) => <line key={`b${i}`} x1={X} y1={Y} x2={p.x} y2={p.y} stroke={INK} strokeWidth={k * 0.12} />)}
      {h.map((p, i) => <g key={`h${i}`}><circle cx={p.x} cy={p.y} r={k * 0.21} fill={C.hyd} stroke={INK} strokeWidth={ol} /><circle cx={p.x - k * 0.06} cy={p.y - k * 0.07} r={k * 0.06} fill="#FFFFFF" /></g>)}
      <circle cx={X} cy={Y} r={k * 0.38} fill={oc} stroke={INK} strokeWidth={ol} />
      <ellipse cx={X - k * 0.12} cy={Y - k * 0.14} rx={k * 0.12} ry={k * 0.08} fill="#FFFFFF" opacity={0.55} />
      {/* vibration: short motion arcs either side of the swinging hydrogens */}
      {vib > 0.05 && h.map((p, i) => (
        <path key={`m${i}`} d={`M ${p.x - k * 0.34} ${p.y - k * 0.18} Q ${p.x} ${p.y - k * 0.44} ${p.x + k * 0.34} ${p.y - k * 0.18}`} fill="none" stroke={INK} strokeWidth={2} opacity={0.45 * Math.min(1, vib)} />
      ))}
    </g>
  );
};
const Pair: React.FC<{X: number; Y: number; k: number; th: number; kind: 0 | 1; trail: number; tx: number; ty: number}> = ({X, Y, k, th, kind, trail, tx, ty}) => {
  const d = 0.2 * k;
  const c1 = {x: X + Math.cos(th) * d, y: Y + Math.sin(th) * d}, c2 = {x: X - Math.cos(th) * d, y: Y - Math.sin(th) * d};
  const col = kind === 0 ? C.n2 : C.o2;
  return (
    <g>
      {trail > 0.05 && <line x1={X} y1={Y} x2={X - tx * k * 0.9 * trail} y2={Y - ty * k * 0.9 * trail} stroke={col} strokeWidth={k * 0.24} strokeLinecap="round" opacity={0.35 * trail} />}
      <circle cx={c1.x} cy={c1.y} r={0.27 * k} fill={col} stroke={INK} strokeWidth={ol} />
      <circle cx={c2.x} cy={c2.y} r={0.27 * k} fill={col} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

export const Section6: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const z = cam.z;
  const toS = (x: number, y: number) => ({x: W / 2 - (x - cam.x) * z, y: CY + (y - cam.y) * z});
  const tf = `translate(${(W / 2 + cam.x * z).toFixed(2)} ${(CY - cam.y * z).toFixed(2)}) scale(${(-z).toFixed(4)} ${z.toFixed(4)})`;
  const sw = (px: number) => px / z;
  const micro = clamp((z - 22) / 40);
  // "the beam is invisible": nothing, then a faint outline (7.25), then the visualisation (7.7 ..)
  const beamGhost = ss(7.2, 7.45, t) * (1 - ss(7.7, 7.9, t));
  const beamVis = ss(7.65, 8.1, t);
  const drawTo = lerp(-1400, BEAM_X1, ss(7.65, 8.25, t));
  const rings = ringsAt(t);
  let drum = 0;
  const drumDist = Math.hypot(DRUM.a.x - M.x, 0);
  for (const r of rings) drum += Math.exp(-Math.pow((r.r - drumDist) / 26, 2)) * 12;
  const scan = clamp((t - 6.25) / 0.65);
  // ---- molecular-scale state
  const absorbed = WATER.map((w, i) => clamp((t - absorbT[i]) / 0.18));
  const pulseAmp = (x: number) => {
    // the first pulse loses a share of its energy at each water molecule it passes
    let a = 1;
    WATER.forEach((w) => { if (x > M.x + w.dx) a *= 0.66; });
    return a;
  };
  const heat = ss(11.6, 12.4, t);
  const swell = swellAt(t);
  const pocketR = 2.3 + 2.4 * clamp(swell);
  return (
    <AbsoluteFill style={{background: C.air}}>
      <svg width={W} height={H}>
        <defs>
          <clipPath id="s6air"><path d={`M -3000 -3000 L 3000 -3000 L 3000 3000 L -3000 3000 Z ${HEAD} ${CANAL}`} clipRule="evenodd" /></clipPath>
          <clipPath id="s6canal"><path d={CANAL} /></clipPath>
          <filter id="s6blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={8} /></filter>
          <filter id="s6soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3} /></filter>
          <linearGradient id="s6scan" x1="0" x2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.8} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
          <radialGradient id="s6pocket"><stop offset="0" stopColor={C.warm} stopOpacity={0.5} /><stop offset="0.75" stopColor={C.warm} stopOpacity={0.22} /><stop offset="1" stopColor={C.warm} stopOpacity={0} /></radialGradient>
        </defs>
        <g transform={tf}>
          <path d={HEAD} fill={C.skin} stroke={INK} strokeWidth={sw(4)} strokeLinejoin="round" />
          <path d="M 60 -1400 L 52 -300 C 46 -200 40 -140 40 -90 L 40 90 C 50 170 54 260 60 1400 L 1400 1400 L 1400 -1400 Z" fill={C.flesh} />
          <path d="M -6 -100 C -40 -130 -90 -190 -126 -230 C -150 -252 -168 -246 -166 -228 C -160 -206 -120 -168 -96 -140 C -64 -104 -40 -76 -12 -54 Z" fill={C.cart} stroke={C.fleshDeep} strokeWidth={sw(2)} />
          <path d="M -12 54 C -40 86 -70 126 -86 166 C -92 188 -80 200 -64 192 C -44 180 -20 140 -2 104 Z" fill={C.cart} stroke={C.fleshDeep} strokeWidth={sw(2)} opacity={0.7} />
          <path d="M 120 -230 C 260 -260 520 -250 640 -170 C 700 -110 700 120 640 190 C 520 260 300 250 120 220 C 100 120 100 -120 120 -230 Z" fill={C.bone} stroke={INK} strokeWidth={sw(3)} />
          {[[200, -170], [520, -200], [600, 120], [260, 170], [430, 200], [640, -60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={C.boneDeep} />)}
          <path d="M 296 -96 C 340 -120 420 -112 430 -60 C 440 -10 430 50 400 80 C 380 100 330 96 304 60 Z" fill={C.cavity} stroke={INK} strokeWidth={sw(3)} />
          <path d="M 390 76 C 420 140 460 220 520 300 L 548 286 C 490 210 450 130 420 70 Z" fill={C.cavity} stroke={INK} strokeWidth={sw(3)} />
          <path d="M 590 -10 C 650 -10 700 40 760 30 L 1400 10" fill="none" stroke={INK} strokeWidth={sw(4) + 18} strokeLinecap="round" />
          <path d="M 590 -10 C 650 -10 700 40 760 30 L 1400 10" fill="none" stroke={C.nerve} strokeWidth={18} strokeLinecap="round" />
          <circle cx={520} cy={-10} r={74} fill={C.coch} stroke={INK} strokeWidth={sw(3)} />
          <path d={Array.from({length: 81}, (_, i) => { const a = i * 0.21, r = 62 * (1 - i / 92); return `${i ? 'L' : 'M'} ${(520 + Math.cos(a) * r).toFixed(1)} ${(-10 + Math.sin(a) * r).toFixed(1)}`; }).join(' ')} fill="none" stroke={INK} strokeWidth={sw(3)} />
          {/* the canal: open air, the same air as outside (lined with skin, nothing in it) */}
          <path d={CANAL} fill={C.air} />
          <path d={lin(CANAL_TOP)} fill="none" stroke={INK} strokeWidth={sw(4)} strokeLinecap="round" />
          <path d={lin(CANAL_BOT)} fill="none" stroke={INK} strokeWidth={sw(4)} strokeLinecap="round" />
          <path d={lin(CANAL_TOP.map(([x, y]) => [x, y + 5] as [number, number]))} fill="none" stroke={C.skin} strokeWidth={sw(6)} opacity={0.8} />
          <path d={lin(CANAL_BOT.map(([x, y]) => [x, y - 5] as [number, number]))} fill="none" stroke={C.skin} strokeWidth={sw(6)} opacity={0.8} />
          {[[8, -45, 6, 8], [30, -44, 10, 9], [52, -43, 4, 9], [14, 44, 8, -8], [40, 41, 2, -9], [66, 39, 10, -8]].map(([x, y, dx, dy], i) => <line key={i} x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={C.hair} strokeWidth={sw(2)} strokeLinecap="round" opacity={0.7} />)}
          {t < 7.0 && scan > 0 && scan < 1 && <g clipPath="url(#s6canal)"><rect x={-60 + scan * 360} y={-60} width={80} height={120} fill="url(#s6scan)" /></g>}
          {/* eardrum and ossicles */}
          {(() => {
            const mx = (DRUM.a.x + DRUM.b.x) / 2 + drum, my = (DRUM.a.y + DRUM.b.y) / 2;
            const oss = `M ${mx + 8} ${my} L ${330 + drum * 0.6} -58 L ${362 + drum * 0.4} -44 L ${396 + drum * 0.3} -26`;
            return (
              <g>
                <path d={`M ${DRUM.a.x} ${DRUM.a.y} Q ${mx + 14} ${my} ${DRUM.b.x} ${DRUM.b.y}`} fill="none" stroke={INK} strokeWidth={sw(4) + 6} strokeLinecap="round" />
                <path d={`M ${DRUM.a.x} ${DRUM.a.y} Q ${mx + 14} ${my} ${DRUM.b.x} ${DRUM.b.y}`} fill="none" stroke={C.drum} strokeWidth={6} strokeLinecap="round" />
                <path d={oss} fill="none" stroke={INK} strokeWidth={sw(4) + 10} strokeLinecap="round" strokeLinejoin="round" />
                <path d={oss} fill="none" stroke={C.ossicle} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
                <rect x={392 + drum * 0.3} y={-38} width={10} height={24} rx={3} fill={C.ossicle} stroke={INK} strokeWidth={sw(3)} />
              </g>
            );
          })()}
          {/* the beam at section scale: invisible, a faint outline, then the visualisation */}
          {beamGhost > 0 && <line x1={-1400} y1={BEAM_Y} x2={BEAM_X1} y2={BEAM_Y} stroke={C.ir} strokeWidth={sw(2)} strokeDasharray={`${sw(3)} ${sw(14)}`} opacity={0.35 * beamGhost} />}
          {beamVis > 0 && micro < 0.99 && (
            <g opacity={beamVis * (1 - micro)}>
              <line x1={-1400} y1={BEAM_Y} x2={drawTo} y2={BEAM_Y} stroke={C.irGlow} strokeWidth={sw(14)} opacity={0.4} filter="url(#s6blur)" />
              <line x1={-1400} y1={BEAM_Y} x2={drawTo} y2={BEAM_Y} stroke={C.ir} strokeWidth={sw(5)} strokeDasharray={`${sw(14)} ${sw(8)}`} strokeDashoffset={sw(-(t * 240) % 22)} />
            </g>
          )}
          {/* rings of squeezed air at the ear's scale (in the air and the canal only) */}
          {rings.length > 0 && (
            <g clipPath="url(#s6air)" opacity={1 - micro * 0.85}>
              {rings.map((r, i) => r.r < 2 ? null : <circle key={i} cx={M.x} cy={M.y} r={r.r} fill="none" stroke={C.ring} strokeWidth={sw(7)} opacity={0.75 * clamp(1 - r.r / 900)} />)}
            </g>
          )}
        </g>
        {/* ---- molecular scale (screen space) */}
        {micro > 0.01 && (() => {
          const k = z;
          const band = toS(0, BEAM_Y).y;
          const bh = 2.2 * k;
          const nodes: React.ReactNode[] = [];
          // the beam: a soft amber band (a visualisation of where the light is)
          nodes.push(<rect key="band" x={0} y={band - bh / 2} width={W} height={bh} fill={C.ir} opacity={0.13} />);
          nodes.push(<rect key="bandG" x={0} y={band - bh * 0.7} width={W} height={bh * 1.4} fill={C.irGlow} opacity={0.08} filter="url(#s6blur)" />);
          // C: the warm pocket (behind the molecules), swelling
          if (heat > 0.01) { const c = toS(M.x, M.y); nodes.push(<circle key="pocket" cx={c.x} cy={c.y} r={pocketR * k} fill="url(#s6pocket)" opacity={heat} />); }
          // D: rings of squeezed air leaving the pocket (thick soft bands)
          for (const r of rings) {
            if (r.r > 40) continue;
            const c = toS(M.x, M.y);
            nodes.push(<circle key={`rg${r.age}`} cx={c.x} cy={c.y} r={(pocketR + r.r) * k} fill="none" stroke={C.ring} strokeWidth={0.32 * k} opacity={0.6 * clamp(1 - r.r / 30)} />);
          }
          // the air molecules, far layer first
          const air = AIR.map((m) => {
            const dx = m.x - M.x, dy = m.y - M.y, dist = Math.hypot(dx, dy) || 1;
            const near = Math.exp(-Math.pow(Math.max(0, dist - 2) / 6, 2));
            const speed = 0.12 + 0.55 * heat * near;
            let x = m.x + 0.35 * Math.sin(0.7 * t + m.ph) + speed * Math.sin((4 + 5 * heat) * t + m.ph * 3);
            let y = m.y + 0.35 * Math.sin(0.5 * t + m.ph * 1.7) + speed * Math.cos((4.3 + 5 * heat) * t + m.ph * 5);
            // C: pushed outward by the swelling pocket
            const push = 3.0 * clamp(swell) * Math.exp(-Math.pow(Math.max(0, dist - pocketR * 0.6) / 7, 2));
            x += (dx / dist) * push; y += (dy / dist) * push;
            // D: each ring squeezes the air as it passes
            for (const r of rings) { const dd = dist - (pocketR + r.r); const f = Math.exp(-(dd * dd) / 2.5) * clamp(1 - r.r / 30); x += (dx / dist) * 1.1 * f; y += (dy / dist) * 1.1 * f; }
            const trail = clamp(heat * near * 1.6);
            return {m, x, y, trail, tx: (dx / dist), ty: (dy / dist)};
          }).sort((a, b) => a.m.depth - b.m.depth);
          for (const a of air) {
            const p = toS(a.x, a.y);
            if (p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) continue;
            const node = <Pair key={`a${a.m.ph}`} X={p.x} Y={p.y} k={k * a.m.depth} th={a.m.th + a.m.w * t} kind={a.m.kind} trail={a.trail} tx={-a.tx} ty={a.ty} />;
            nodes.push(a.m.depth < 0.7 ? <g key={`f${a.m.ph}`} opacity={0.5} filter="url(#s6soft)">{node}</g> : a.m.depth > 1 ? <g key={`n${a.m.ph}`} opacity={0.85} filter="url(#s6soft)">{node}</g> : node);
          }
          // the water molecules in the beam: absorb, vibrate, then share the energy (move more)
          WATER.forEach((w, i) => {
            const ab = absorbed[i];
            const jig = 0.1 + 0.45 * heat;
            const dist = Math.hypot(w.dx, w.dy) || 1;
            const push = 2.2 * clamp(swell) * (dist / 3);
            const x = M.x + w.dx + jig * Math.sin(6 * t + i * 2) + (w.dx / dist) * push, y = M.y + w.dy + jig * Math.cos(5.3 * t + i) + (w.dy / dist) * push;
            const p = toS(x, y);
            const vib = ab * (1 - 0.5 * heat) * Math.sin(38 * t + i);
            nodes.push(<Water key={`w${i}`} X={p.x} Y={p.y} k={k * w.z} th={w.th + 0.3 * Math.sin(1.3 * t + i)} vib={vib} warm={ab} />);
          });
          // A/B: the first pulse (a wave train) travels along the beam and gives up energy at each water molecule
          if (t > T_FIRST - 0.1 && t < 11.0) {
            const hx = pulseX(t, T_FIRST);
            const pts: string[] = [];
            for (let i = 0; i <= 60; i++) {
              const u = i / 60, xx = hx - 3.4 * u;
              const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) * pulseAmp(xx);
              const p = toS(xx, BEAM_Y + 0.7 * env * Math.sin(((xx - hx) / 0.8) * 2 * Math.PI));
              pts.push(`${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
            }
            const fade = 1 - ss(10.55, 10.95, t);
            nodes.push(<path key="pulse" d={pts.join('')} fill="none" stroke={C.irGlow} strokeWidth={9} opacity={0.3 * fade} filter="url(#s6soft)" />);
            nodes.push(<path key="pulse2" d={pts.join('')} fill="none" stroke={C.ir} strokeWidth={4} strokeLinecap="round" opacity={fade} />);
          }
          // D: each later pulse is a quick flicker of the band
          for (const p of PULSES) { const a = Math.exp(-Math.pow((t - p) / 0.08, 2)); if (a > 0.02) nodes.push(<rect key={`fl${p}`} x={0} y={band - bh / 2} width={W} height={bh} fill={C.ir} opacity={0.35 * a} />); }
          return <g opacity={micro}>{nodes}</g>;
        })()}
      </svg>
    </AbsoluteFill>
  );
};
export {P0};
