// V4 worlds 2 and 3: his ear in section (a coronal cut: pinna, an empty ear canal, eardrum, ossicles, cochlea) and,
// nested inside it, the air just outside his ear at molecular scale. One 2D world (units: 1 = 1 px at zoom 1; the
// canal opening at the origin, his head to the right), seen through one 2D camera that zooms continuously from the
// section into the air and back out, so every transition in sections B and C is a camera move.
//   B (5.85..6.85): in from the 3D ear, down the empty canal.
//   C (9.05..15.0): along the infrared light into the air -> water vapour -> one molecule absorbs -> the air in the
//   beam heats and expands -> pulse after pulse, pressure waves -> out, with them, into the canal -> the eardrum moves.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, kv, ss, lerp, rnd, W, H, eio} from './core4';
import {INK} from './rig/cast4';
import {SEC} from './cues4';

const C = {
  air: '#1D3640', airHi: '#25444F', skin: '#F2C9A8', skinDeep: '#DDA586', flesh: '#E7A48D', fleshDeep: '#D88E78', cart: '#F7D7CB', bone: '#F1E4C4', boneDeep: '#E0CFA6',
  cavity: '#7E3B45', canal: '#2A4651', drum: '#E9E2EC', ossicle: '#FFF6E2', coch: '#F4B9A6', nerve: '#FFC744', hair: '#C0392B',
  ir: '#FFB347', irGlow: '#FF9A2E', irCore: '#FFF3D6', n2: '#7FA6D9', o2: '#CFE6EE', oxy: '#EF6B55', hyd: '#FFFFFF', heat: '#FFC27A', wave: '#BFE9F0',
};
// ---------------------------------------------------------------- geometry (section units)
const HEAD = 'M 40 -1400 L 30 -300 C 22 -170 8 -120 2 -96 C -30 -120 -78 -190 -128 -244 C -150 -268 -180 -266 -182 -240 C -184 -214 -160 -198 -142 -176 C -104 -128 -60 -82 -20 -46 L -20 46 C -52 84 -90 126 -104 168 C -112 196 -92 222 -66 212 C -40 202 -14 160 4 120 C 18 160 30 260 40 1400 L 1400 1400 L 1400 -1400 Z';
const CANAL_TOP: [number, number][] = [[-20, -46], [60, -44], [150, -26], [230, -22], [282, -34]];
const CANAL_BOT: [number, number][] = [[-20, 46], [60, 40], [150, 30], [230, 36], [304, 36]];
const smoothPath = (pts: [number, number][]) => pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
const CANAL = `${smoothPath(CANAL_TOP)} L ${CANAL_BOT[4][0]} ${CANAL_BOT[4][1]} ${[...CANAL_BOT].reverse().slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ')} Z`;
const CANAL_Y = (x: number) => {
  // centre line of the canal at x
  const yt = interp(CANAL_TOP, x), yb = interp(CANAL_BOT, x);
  return (yt + yb) / 2;
};
const interp = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return pts[pts.length - 1][1];
};
// the infrared beam in the section: it arrives from the left, just above the canal opening
export const BEAM_Y = -12, BEAM_X1 = -24;
// the molecular-scale spot we visit: in the beam, in the air just outside the ear
export const M = {x: -96, y: BEAM_Y};
// where the light makes sound that reaches this ear: the stretch of beam just outside it
const SRC_X0 = -170;
const DRUM = {a: {x: 282, y: -34}, b: {x: 304, y: 36}};

// ---------------------------------------------------------------- camera (centre in world units, zoom = px per unit)
type EK = [number, number, number, number]; // t, x, y, zoom
const KEYS: EK[] = [
  // B: from the 3D ear: in at the canal opening, down the empty canal, back out to the whole section
  [5.7, 10, 0, 2.4], [6.05, 50, 0, 2.05], [6.45, 160, 2, 1.7], [6.95, 190, 10, 1.05],
  // C: in the beam in the air beside the ear, at molecular scale
  [8.95, M.x - 22, M.y, 22], [9.6, M.x - 8, M.y, 48], [10.25, M.x - 1, M.y, 62], [10.65, M.x, M.y, 66], [11.5, M.x + 0.5, M.y + 0.5, 60],
  // heats and expands: back off to see the warm air push out
  [12.3, M.x + 1, M.y + 1, 42], [13.05, M.x + 2, M.y + 2, 30],
  // sound waves: out, with them, to the ear
  [13.55, M.x + 25, M.y + 6, 7.5], [13.95, 40, 4, 2.0],
  // into the canal with the waves; the eardrum moves
  [14.45, 200, 2, 2.3], [15.0, 262, 0, 3.0],
];
const camAt = (t: number) => {
  const ks = KEYS;
  if (t <= ks[0][0]) return {x: ks[0][1], y: ks[0][2], z: ks[0][3]};
  if (t >= ks[ks.length - 1][0]) return {x: ks[ks.length - 1][1], y: ks[ks.length - 1][2], z: ks[ks.length - 1][3]};
  let i = 0;
  while (t > ks[i + 1][0]) i++;
  const [t0, x0, y0, z0] = ks[i], [t1, x1, y1, z1] = ks[i + 1];
  // B and C are separate moves: no easing across the gap between them
  const u = (t - t0) / (t1 - t0);
  const e = t0 < 8 && t1 > 8 ? u : eio(u) * 0.75 + u * 0.25;
  // zoom in log space; centre moves so the point under the zoom's fixed point stays put (no swimming)
  const lz = lerp(Math.log(z0), Math.log(z1), e);
  const z = Math.exp(lz);
  const w = z0 === z1 ? e : (1 / z0 - 1 / z) / (1 / z0 - 1 / z1);
  return {x: lerp(x0, x1, clamp(w)), y: lerp(y0, y1, clamp(w)), z};
};
const CY = 800; // screen y of the camera centre (above the captions)

// ---------------------------------------------------------------- physics of the picture (C)
const T_ABS = 10.44; // "absorbs"
const HEAT0 = 11.55, EXPAND = [11.6, 13.05], WAVES = 12.9;
const PULSE_HZ = 2.6; // visual modulation rate of the beam (the real one is an audio frequency)
const heatAt = (t: number) => ss(T_ABS - 0.05, HEAT0 + 0.9, t);
const expandAt = (t: number) => ss(EXPAND[0], EXPAND[1], t);
const C_SND = 230; // wavefront speed, units/s (picture time)
// pressure wavefronts launched from the beam line, one per pulse
const fronts = (t: number) => {
  const out: number[] = [];
  for (let k = 0; k < 40; k++) {
    const t0 = WAVES + k / PULSE_HZ;
    if (t0 > t) break;
    out.push((t - t0) * C_SND);
  }
  return out;
};

// molecules in a patch of air around M (deterministic)
type Mol = {x: number; y: number; kind: 0 | 1 | 2; th: number; w: number; ph: number};
const MOLS: Mol[] = (() => {
  const out: Mol[] = [];
  const S = 2.35;
  for (let i = -26; i <= 26; i++) for (let j = -40; j <= 40; j++) {
    const n = (i + 40) * 101 + (j + 50);
    const x = M.x + i * S + (rnd(n) - 0.5) * S * 0.9, y = M.y + j * S * 0.92 + (rnd(n + 7) - 0.5) * S * 0.9;
    if (x > -26) continue; // stay in the air
    const r = rnd(n + 13);
    const kind = (r < 0.17 ? 2 : r < 0.62 ? 0 : 1) as 0 | 1 | 2; // water vapour (exaggerated share), nitrogen, oxygen
    out.push({x, y, kind, th: rnd(n + 3) * Math.PI * 2, w: (rnd(n + 5) - 0.5) * 2.2, ph: rnd(n + 11) * 20});
  }
  // the one we watch absorb: a water molecule exactly at M
  out.push({x: M.x + 0.2, y: M.y - 0.15, kind: 2, th: -0.4, w: 0.25, ph: 3});
  return out;
})();
const HERO = MOLS.length - 1;

const molState = (m: Mol, idx: number, t: number) => {
  const dy = m.y - BEAM_Y;
  const inBeam = Math.abs(dy) < 3.1;
  const hot = m.kind === 2 && inBeam;
  // when the light's crest reaches this molecule (the crests travel to the right)
  const tHit = idx === HERO ? T_ABS : T_ABS + (m.x - M.x) * 0.045 + 0.35 * rnd(idx + 99);
  const absorbed = hot && t > tHit ? 1 : 0;
  const heat = heatAt(t) * (inBeam ? 1 : clamp(1 - (Math.abs(dy) - 3.1) / 5)) ;
  const jig = 0.18 + 0.55 * heat + (absorbed ? 0.3 : 0);
  const f = 1.4 + 3.5 * heat;
  let x = m.x + 0.55 * Math.sin(0.9 * t + m.ph) + jig * 0.35 * Math.sin(f * 7.1 * t + m.ph * 3);
  let y = m.y + 0.55 * Math.sin(0.7 * t + m.ph * 1.7) + jig * 0.35 * Math.sin(f * 6.3 * t + m.ph * 5);
  // expansion: the heated column pushes its neighbours away from the beam line
  const ex = expandAt(t);
  const side = Math.sign(dy) || 1;
  y += side * ex * 4.5 * Math.exp(-Math.pow(Math.max(0, Math.abs(dy) - 1.5) / 7, 2));
  // pressure waves: longitudinal displacement across the beam line
  const fs = fronts(t);
  for (const r of fs) {
    const d = Math.abs(dy) - r;
    y += side * 0.9 * Math.exp(-(d * d) / 6) * clamp(1 - r / 60);
  }
  const th = m.th + m.w * t + (absorbed ? 0.25 * Math.sin(30 * t) : 0);
  const vib = absorbed ? 0.07 * Math.sin(48 * t + m.ph) : 0;
  return {x, y, th, vib, absorbed, glow: absorbed ? clamp(1 - (t - tHit) / 0.7) : 0, heat};
};

const MolArt: React.FC<{m: Mol; s: ReturnType<typeof molState>; X: number; Y: number; z: number; hi: number}> = ({m, s, X, Y, z, hi}) => {
  const k = z;
  const ol = Math.max(1.2, Math.min(3, k * 0.08));
  const warm = s.heat;
  if (m.kind === 2) {
    const a = 52.25 * (Math.PI / 180), d = 0.36 + s.vib;
    const h1 = {x: X + Math.cos(s.th - a) * d * k, y: Y + Math.sin(s.th - a) * d * k}, h2 = {x: X + Math.cos(s.th + a) * d * k, y: Y + Math.sin(s.th + a) * d * k};
    return (
      <g>
        {(s.glow > 0 || hi > 0) && <circle cx={X} cy={Y} r={k * (0.8 + 0.5 * s.glow)} fill={s.glow > 0 ? C.heat : C.wave} opacity={Math.max(0.55 * s.glow, 0.28 * hi)} />}
        <line x1={X} y1={Y} x2={h1.x} y2={h1.y} stroke={INK} strokeWidth={k * 0.14} />
        <line x1={X} y1={Y} x2={h2.x} y2={h2.y} stroke={INK} strokeWidth={k * 0.14} />
        <circle cx={h1.x} cy={h1.y} r={k * 0.2} fill={C.hyd} stroke={INK} strokeWidth={ol} />
        <circle cx={h2.x} cy={h2.y} r={k * 0.2} fill={C.hyd} stroke={INK} strokeWidth={ol} />
        <circle cx={X} cy={Y} r={k * 0.36} fill={warm > 0.3 || s.absorbed ? '#FF7F50' : C.oxy} stroke={INK} strokeWidth={ol} />
      </g>
    );
  }
  const d = 0.2;
  const col = m.kind === 0 ? C.n2 : C.o2;
  const p1 = {x: X + Math.cos(s.th) * d * k, y: Y + Math.sin(s.th) * d * k}, p2 = {x: X - Math.cos(s.th) * d * k, y: Y - Math.sin(s.th) * d * k};
  return (
    <g opacity={0.92}>
      <circle cx={p1.x} cy={p1.y} r={k * 0.27} fill={col} stroke={INK} strokeWidth={ol} />
      <circle cx={p2.x} cy={p2.y} r={k * 0.27} fill={col} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

// ---------------------------------------------------------------- the world
export const EarWorld: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const z = cam.z;
  const sx = (x: number) => (x - cam.x) * z + W / 2, sy = (y: number) => (y - cam.y) * z + CY;
  const inC = t > 8.5;
  // the drum's motion: driven by the waves once they arrive
  const fs = inC ? fronts(t) : [];
  let drum = 0;
  for (const r of fs) {
    const dist = r - (290 - M.x + 20); // the path to the drum is longer than straight-line; roughly
    drum += Math.exp(-(dist * dist) / 900) * 9;
  }
  drum = clamp(drum, 0, 12);
  const micro = clamp((z - 12) / 12); // molecules visible
  const beam = inC ? 1 : 0;
  // world-to-screen group transform
  const tf = `translate(${(W / 2 - cam.x * z).toFixed(2)} ${(CY - cam.y * z).toFixed(2)}) scale(${z.toFixed(4)})`;
  const sw = (px: number) => px / z; // stroke width in px regardless of zoom
  // light crests: travelling to the right along the beam (stylised; spacing in units)
  const crestSp = 1.6, crestOff = (t * 9) % crestSp;
  const beamTop = BEAM_Y - 2.6, beamBot = BEAM_Y + 2.6;
  // the visible molecule window
  const vx0 = cam.x - W / 2 / z - 2, vx1 = cam.x + W / 2 / z + 2, vy0 = cam.y - CY / z - 2, vy1 = cam.y + (H - CY) / z + 2;
  const hiWater = inC ? ss(9.35, 9.7, t) * (1 - ss(10.3, 10.6, t)) : 0;
  const drumBulge = inC ? drum : 0;
  return (
    <AbsoluteFill style={{background: C.air}}>
      <svg width={W} height={H}>
        <defs>
          <clipPath id="ewAir"><path d={`M -2000 -2000 L 2000 -2000 L 2000 2000 L -2000 2000 Z ${HEAD} ${CANAL}`} clipRule="evenodd" /></clipPath>
          <radialGradient id="ewHeat"><stop offset="0" stopColor={C.heat} stopOpacity={0.55} /><stop offset="1" stopColor={C.heat} stopOpacity={0} /></radialGradient>
          <filter id="ewBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={8} /></filter>
        </defs>
        <g transform={tf}>
          {/* ---- head in section */}
          <path d={HEAD} fill={C.skin} stroke={INK} strokeWidth={sw(4)} strokeLinejoin="round" />
          {/* flesh under the skin, cartilage in the pinna, the bone around the inner canal and middle ear */}
          <path d="M 60 -1400 L 52 -300 C 46 -200 40 -140 40 -90 L 40 90 C 50 170 54 260 60 1400 L 1400 1400 L 1400 -1400 Z" fill={C.flesh} />
          <path d="M -6 -100 C -40 -130 -90 -190 -126 -230 C -150 -252 -168 -246 -166 -228 C -160 -206 -120 -168 -96 -140 C -64 -104 -40 -76 -12 -54 Z" fill={C.cart} stroke={C.fleshDeep} strokeWidth={sw(2)} />
          <path d="M -12 54 C -40 86 -70 126 -86 166 C -92 188 -80 200 -64 192 C -44 180 -20 140 -2 104 Z" fill={C.cart} stroke={C.fleshDeep} strokeWidth={sw(2)} opacity={0.7} />
          <path d="M 120 -230 C 260 -260 520 -250 640 -170 C 700 -110 700 120 640 190 C 520 260 300 250 120 220 C 100 120 100 -120 120 -230 Z" fill={C.bone} stroke={INK} strokeWidth={sw(3)} />
          {[[200, -170], [520, -200], [600, 120], [260, 170], [430, 200], [640, -60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={C.boneDeep} />)}
          {/* middle ear cavity, Eustachian tube */}
          <path d="M 296 -96 C 340 -120 420 -112 430 -60 C 440 -10 430 50 400 80 C 380 100 330 96 304 60 Z" fill={C.cavity} stroke={INK} strokeWidth={sw(3)} />
          <path d="M 390 76 C 420 140 460 220 520 300 L 548 286 C 490 210 450 130 420 70 Z" fill={C.cavity} stroke={INK} strokeWidth={sw(3)} />
          {/* cochlea and nerve */}
          <path d="M 590 -10 C 650 -10 700 40 760 30 L 1400 10" fill="none" stroke={INK} strokeWidth={sw(20) + 18} strokeLinecap="round" />
          <path d="M 590 -10 C 650 -10 700 40 760 30 L 1400 10" fill="none" stroke={C.nerve} strokeWidth={18} strokeLinecap="round" />
          <circle cx={520} cy={-10} r={74} fill={C.coch} stroke={INK} strokeWidth={sw(3)} />
          <path d={(() => {
            let d = '';
            for (let i = 0; i <= 80; i++) {
              const a = i * 0.21, r = 62 * (1 - i / 92);
              d += `${i ? 'L' : 'M'} ${(520 + Math.cos(a) * r).toFixed(1)} ${(-10 + Math.sin(a) * r).toFixed(1)} `;
            }
            return d;
          })()} fill="none" stroke={INK} strokeWidth={sw(3)} />
          {/* the canal: empty; a few fine hairs near the opening */}
          <path d={CANAL} fill={C.canal} stroke={INK} strokeWidth={sw(4)} strokeLinejoin="round" />
          {[[8, -45, 6, 8], [30, -44, 10, 9], [52, -43, 4, 9], [14, 44, 8, -8], [40, 41, 2, -9], [66, 39, 10, -8]].map(([x, y, dx, dy], i) => (
            <line key={i} x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={C.hair} strokeWidth={sw(2)} strokeLinecap="round" opacity={0.7} />
          ))}
          {/* the eardrum and the ossicles riding on it */}
          {(() => {
            const mx = (DRUM.a.x + DRUM.b.x) / 2 + drumBulge, my = (DRUM.a.y + DRUM.b.y) / 2;
            return (
              <g>
                <path d={`M ${DRUM.a.x} ${DRUM.a.y} Q ${mx + 14} ${my} ${DRUM.b.x} ${DRUM.b.y}`} fill="none" stroke={INK} strokeWidth={sw(4) + 6} strokeLinecap="round" />
                <path d={`M ${DRUM.a.x} ${DRUM.a.y} Q ${mx + 14} ${my} ${DRUM.b.x} ${DRUM.b.y}`} fill="none" stroke={C.drum} strokeWidth={6} strokeLinecap="round" />
                <path d={`M ${mx + 8} ${my} L ${330 + drumBulge * 0.6} -58 L ${362 + drumBulge * 0.4} -44 L ${396 + drumBulge * 0.3} -26`} fill="none" stroke={INK} strokeWidth={sw(4) + 10} strokeLinecap="round" strokeLinejoin="round" />
                <path d={`M ${mx + 8} ${my} L ${330 + drumBulge * 0.6} -58 L ${362 + drumBulge * 0.4} -44 L ${396 + drumBulge * 0.3} -26`} fill="none" stroke={C.ossicle} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
                <rect x={392 + drumBulge * 0.3} y={-38} width={10} height={24} rx={3} fill={C.ossicle} stroke={INK} strokeWidth={sw(3)} />
              </g>
            );
          })()}
          {/* ---- C: the infrared beam (visualised: it is invisible), and the air it heats */}
          {beam > 0 && (
            <g>
              <rect x={-2000} y={beamTop - 3} width={2000 + BEAM_X1} height={beamBot - beamTop + 6} fill={C.irGlow} opacity={0.18} filter="url(#ewBlur)" />
              <rect x={-2000} y={beamTop} width={2000 + BEAM_X1} height={beamBot - beamTop} fill={C.ir} opacity={0.16 + 0.1 * Math.sin(t * PULSE_HZ * 2 * Math.PI) * ss(12.5, 13, t)} />
              <line x1={-2000} y1={BEAM_Y} x2={BEAM_X1} y2={BEAM_Y} stroke={C.irCore} strokeWidth={sw(2.2) * (1 - micro * 0.6)} opacity={0.9} />
              {/* light as waves: crests crossing the band */}
              {micro > 0.02 && Array.from({length: Math.ceil((vx1 - vx0) / crestSp) + 2}, (_, i) => {
                const x = Math.floor(vx0 / crestSp) * crestSp + i * crestSp + crestOff;
                if (x > BEAM_X1) return null;
                return <path key={i} d={`M ${x} ${beamTop + 0.3} Q ${x + 0.35} ${BEAM_Y} ${x} ${beamBot - 0.3}`} fill="none" stroke={C.irCore} strokeWidth={sw(2.2)} opacity={0.5 * micro} />;
              })}
              {/* warm air in the beam */}
              <rect x={-2000} y={beamTop - 1.5 * expandAt(t)} width={2000 + BEAM_X1} height={beamBot - beamTop + 3 * expandAt(t)} fill={C.heat} opacity={0.22 * heatAt(t)} />
            </g>
          )}
          {/* ---- C: pressure waves (crests drawn as thin bright lines), only in the air and the canal */}
          {inC && (
            <g clipPath="url(#ewAir)">
              {fs.map((r, i) => {
                if (r < 2) return null;
                const op = clamp(1 - r / 900) * 0.75 * (1 - micro * 0.75);
                // the offset curve of the beam segment (a capsule around it), at distance r
                const x0 = SRC_X0, x1 = BEAM_X1;
                const d = `M ${x0} ${BEAM_Y - r} L ${x1} ${BEAM_Y - r} A ${r} ${r} 0 0 1 ${x1} ${BEAM_Y + r} L ${x0} ${BEAM_Y + r}`;
                return <path key={i} d={d} fill="none" stroke={C.wave} strokeWidth={sw(4) + Math.min(10, r * 0.04)} opacity={op} strokeLinecap="round" />;
              })}
            </g>
          )}
        </g>
        {/* ---- molecules (screen space, so their outlines stay crisp) */}
        {inC && micro > 0.01 && (
          <g opacity={micro}>
            {MOLS.map((m, i) => {
              if (m.x < vx0 - 3 || m.x > vx1 + 3 || m.y < vy0 - 6 || m.y > vy1 + 6) return null;
              const s = molState(m, i, t);
              return <MolArt key={i} m={m} s={s} X={sx(s.x)} Y={sy(s.y)} z={z} hi={m.kind === 2 ? hiWater : 0} />;
            })}
          </g>
        )}
        {/* the heated spot around the molecule that absorbed */}
        {inC && micro > 0.01 && t > T_ABS && <circle cx={sx(M.x)} cy={sy(M.y)} r={z * (1.2 + 6 * heatAt(t))} fill="url(#ewHeat)" opacity={micro * clamp(1 - (t - 12.6) / 0.6)} />}
      </svg>
    </AbsoluteFill>
  );
};
export {CANAL_Y};
