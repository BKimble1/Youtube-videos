// V5 World 2: inside the science. His ear in section (a coronal cut: pinna, the empty canal, eardrum, ossicles,
// cochlea), and the air just outside it at molecular scale, as one 2D world seen through one 2D camera.
// The world is laid out with his head to the +x side and drawn mirrored, so on screen his head is on the left and the
// beam arrives from the right, as in the atrium shots.
//   S4 tail (6.1..6.95, after M1): the section, locked; a soft light runs down the empty canal.
//   S7 (9.4..13.45, locked): A. light packets travel along the beam; the water molecules in it swallow them, warm and
//   vibrate (others let the light pass). B. the warm molecules jostle their neighbours; the warm pocket of air swells
//   and pushes the air apart. C. the light pulses; each pulse swells the pocket again and sends a pressure band outward.
//   M3 (13.45..14.15): out with the bands to his ear. S8 (14.15..15.0, locked): D. the bands enter the canal; each one
//   pushes the eardrum and the ossicles follow.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, lerp, rnd, W, H, eio, FPS} from '../v4/core4';
import {INK} from '../v4/rig/cast4';
import {SHOT} from './cues5';

const C = {
  air: '#1B3540', skin: '#F2C9A8', flesh: '#E7A48D', fleshDeep: '#D88E78', cart: '#F7D7CB', bone: '#F1E4C4', boneDeep: '#E0CFA6',
  cavity: '#7E3B45', canal: '#284551', drum: '#E9E2EC', ossicle: '#FFF6E2', coch: '#F4B9A6', nerve: '#FFC744', hair: '#C0392B',
  ir: '#FFB347', irGlow: '#FF9A2E', irCore: '#FFF3D6', n2: '#6F93C4', o2: '#B9D3DC', oxy: '#EF6B55', hot: '#FF8A3D', hyd: '#FFFFFF', heat: '#FFB36B', wave: '#CDEFF5',
};
// ---------------------------------------------------------------- the section (units ~ 0.13 mm)
const HEAD = 'M 40 -1400 L 30 -300 C 22 -170 8 -120 2 -96 C -30 -120 -78 -190 -128 -244 C -150 -268 -180 -266 -182 -240 C -184 -214 -160 -198 -142 -176 C -104 -128 -60 -82 -20 -46 L -20 46 C -52 84 -90 126 -104 168 C -112 196 -92 222 -66 212 C -40 202 -14 160 4 120 C 18 160 30 260 40 1400 L 1400 1400 L 1400 -1400 Z';
const CANAL_TOP: [number, number][] = [[-20, -46], [60, -44], [150, -26], [230, -22], [282, -34]];
const CANAL_BOT: [number, number][] = [[-20, 46], [60, 40], [150, 30], [230, 36], [304, 36]];
const lin = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
const CANAL = `${lin(CANAL_TOP)} L 304 36 ${[...CANAL_BOT].reverse().slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ')} Z`;
const DRUM = {a: {x: 282, y: -34}, b: {x: 304, y: 36}};
export const BEAM_Y = -12, BEAM_X1 = -24; // the beam arrives from -x, just above the canal opening
const SRC_X0 = -170; // the stretch of beam beside the ear whose sound reaches it
export const M = {x: -96, y: BEAM_Y}; // the spot we visit at molecular scale

// ---------------------------------------------------------------- camera: centre (world units) and zoom (px / unit)
const SEC_CAM = {x: 70, y: -137, z: 0.95}; // S4: whole section, canal opening right of centre
const MIC = {x: M.x, y: M.y + 0.6, z: 64};
const DCAM = {x: 165, y: 2, z: 2.25}; // S8 / D: the canal and eardrum
const CY = 830;
const camAt = (t: number) => {
  if (t < 8) return SEC_CAM;
  if (t < SHOT.m3[0]) return MIC;
  if (t >= SHOT.m3[1]) return DCAM;
  // M3: zoom out in log space; the centre moves so the screen point under the move stays coherent (no swimming)
  const u = eio(clamp((t - SHOT.m3[0]) / (SHOT.m3[1] - SHOT.m3[0])));
  const z = Math.exp(lerp(Math.log(MIC.z), Math.log(DCAM.z), u));
  const w = (1 / MIC.z - 1 / z) / (1 / MIC.z - 1 / DCAM.z);
  return {x: lerp(MIC.x, DCAM.x, w), y: lerp(MIC.y, DCAM.y, w), z};
};

// ---------------------------------------------------------------- the physics of the picture
const T_ABS = 10.44;
const HEROES = [{dx: -9.5, dy: 0.7, th: 0.3, t: 9.98}, {dx: -4.2, dy: -1.0, th: 2.2, t: 10.2}, {dx: 0.4, dy: 0.2, th: -0.6, t: T_ABS}, {dx: 5.6, dy: -0.6, th: 1.1, t: 10.72}];
const C_LIGHT = 10; // packet speed, units/s (picture time)
const PASS = [{t0: 9.25, through: true}]; // a packet that crosses the frame untouched: nitrogen and oxygen let it pass
const heatAt = (t: number) => ss(11.5, 12.4, t);
const expandAt = (t: number) => ss(11.95, 13.0, t);
const PULSE0 = 12.95, PULSE_HZ = 2.5;
const pulseOn = (t: number) => (t < PULSE0 ? 1 : ((t - PULSE0) * PULSE_HZ) % 1 < 0.45 ? 1 : 0.15);
const PX_SPEED = 330; // pressure bands move at a steady speed on screen, whatever the scale
// front radii (world units) by integrating the screen speed through the camera's zoom
const FRONTS: number[][] = (() => {
  const dt = 1 / (FPS * 4);
  const times: number[] = [];
  for (let k = 0; k < 8; k++) times.push(PULSE0 + k / PULSE_HZ);
  const table: number[][] = [];
  const r = times.map(() => 0);
  for (let t = PULSE0; t <= SHOT.s9 + 0.05; t += dt) {
    const z = camAt(t).z;
    times.forEach((tk, i) => { if (t >= tk) r[i] += (PX_SPEED / z) * dt; });
    table.push([t, ...r]);
  }
  return table;
})();
const frontsAt = (t: number): number[] => {
  if (t < PULSE0) return [];
  const i = Math.min(FRONTS.length - 1, Math.max(0, Math.round((t - PULSE0) * FPS * 4)));
  return FRONTS[i].slice(1).filter((r, k) => t >= PULSE0 + k / PULSE_HZ);
};

type Mol = {x: number; y: number; kind: 0 | 1 | 2; th: number; w: number; ph: number; hero?: number};
const MOLS: Mol[] = (() => {
  const out: Mol[] = [];
  const S = 3.3;
  for (let i = -6; i <= 6; i++) for (let j = -11; j <= 11; j++) {
    const n = (i + 20) * 61 + (j + 30);
    const x = M.x + i * S + (rnd(n) - 0.5) * S * 0.8, y = M.y + j * S + (rnd(n + 7) - 0.5) * S * 0.8;
    if (Math.abs(y - M.y) < 2.2) continue; // the band holds the heroes (and two nitrogens below)
    const r = rnd(n + 13);
    out.push({x, y, kind: (r < 0.12 ? 2 : r < 0.7 ? 0 : 1) as 0 | 1 | 2, th: rnd(n + 3) * 6.28, w: (rnd(n + 5) - 0.5) * 1.6, ph: rnd(n + 11) * 20});
  }
  out.push({x: M.x + 9.5, y: M.y + 1.2, kind: 0, th: 0.5, w: 0.4, ph: 2}, {x: M.x - 7, y: M.y - 1.4, kind: 1, th: 1.4, w: -0.5, ph: 5}, {x: M.x + 2.6, y: M.y + 1.5, kind: 0, th: 2.4, w: 0.3, ph: 8});
  HEROES.forEach((h, k) => out.push({x: M.x + h.dx, y: M.y + h.dy, kind: 2, th: h.th, w: 0.2, ph: k * 3, hero: k}));
  return out;
})();

const molAt = (m: Mol, t: number) => {
  const dy = m.y - BEAM_Y, side = Math.sign(dy) || 1, ad = Math.abs(dy);
  const hero = m.hero !== undefined ? HEROES[m.hero] : null;
  const absorbed = hero ? clamp((t - hero.t) / 0.15) : 0;
  // heat: the hot water molecules first, then their neighbours (collisions), spreading out from the beam
  const spread = heatAt(t) * Math.exp(-Math.pow(ad / (2.4 + 4.5 * expandAt(t)), 2));
  const heat = Math.max(absorbed * (0.6 + 0.4 * heatAt(t)), spread);
  const jig = 0.1 + 0.42 * heat;
  const f = 5 + 6 * heat;
  let x = m.x + 0.28 * Math.sin(0.8 * t + m.ph) + jig * Math.sin(f * t + m.ph * 3);
  let y = m.y + 0.28 * Math.sin(0.6 * t + m.ph * 1.7) + jig * Math.sin(f * 1.13 * t + m.ph * 5);
  // B: the warm pocket swells and pushes its neighbours outward from the beam
  y += side * expandAt(t) * 3.4 * Math.exp(-Math.pow(Math.max(0, ad - 1.2) / 6.5, 2));
  // C: each light pulse swells it again: pressure bands (bunched-up air) travel out across the beam
  for (const r of frontsAt(t)) {
    const d = ad - r;
    y += side * 1.6 * Math.exp(-(d * d) / 2.0) * clamp(1 - r / 40);
  }
  const vib = absorbed > 0 ? 0.075 * Math.sin(55 * t + m.ph) : 0;
  return {x, y, th: m.th + m.w * t + (absorbed ? 0.3 * Math.sin(17 * t) : 0), vib, absorbed, heat, flash: hero ? clamp(1 - Math.abs(t - hero.t - 0.05) / 0.2) : 0};
};

const MolArt: React.FC<{m: Mol; s: ReturnType<typeof molAt>; X: number; Y: number; z: number; hi: number}> = ({m, s, X, Y, z, hi}) => {
  const ol = Math.max(1.2, Math.min(3, z * 0.05));
  if (m.kind === 2) {
    const big = m.hero !== undefined ? 1.12 : 0.9;
    const k = z * big;
    const a = 52.25 * (Math.PI / 180), d = 0.36 + s.vib;
    // mirrored world: angles flip so the molecule matches its mirrored position
    const h1 = {x: X - Math.cos(s.th - a) * d * k, y: Y + Math.sin(s.th - a) * d * k}, h2 = {x: X - Math.cos(s.th + a) * d * k, y: Y + Math.sin(s.th + a) * d * k};
    const warm = Math.max(s.absorbed, clamp((s.heat - 0.3) * 2));
    return (
      <g>
        {(s.flash > 0 || hi > 0) && <circle cx={X} cy={Y} r={k * (0.75 + 0.6 * s.flash)} fill={s.flash > 0 ? C.heat : C.wave} opacity={Math.max(0.6 * s.flash, 0.3 * hi)} />}
        <line x1={X} y1={Y} x2={h1.x} y2={h1.y} stroke={INK} strokeWidth={k * 0.13} />
        <line x1={X} y1={Y} x2={h2.x} y2={h2.y} stroke={INK} strokeWidth={k * 0.13} />
        <circle cx={h1.x} cy={h1.y} r={k * 0.2} fill={C.hyd} stroke={INK} strokeWidth={ol} />
        <circle cx={h2.x} cy={h2.y} r={k * 0.2} fill={C.hyd} stroke={INK} strokeWidth={ol} />
        <circle cx={X} cy={Y} r={k * 0.36} fill={warm > 0.5 ? C.hot : C.oxy} stroke={INK} strokeWidth={ol} />
      </g>
    );
  }
  const k = z * 0.8, d = 0.2;
  const col = m.kind === 0 ? C.n2 : C.o2;
  const warm = clamp((s.heat - 0.35) * 1.6);
  const p1 = {x: X + Math.cos(s.th) * d * k, y: Y + Math.sin(s.th) * d * k}, p2 = {x: X - Math.cos(s.th) * d * k, y: Y - Math.sin(s.th) * d * k};
  return (
    <g opacity={0.85}>
      {warm > 0.05 && <circle cx={X} cy={Y} r={k * 0.55} fill={C.heat} opacity={0.22 * warm} />}
      <circle cx={p1.x} cy={p1.y} r={k * 0.27} fill={col} stroke={INK} strokeWidth={ol} />
      <circle cx={p2.x} cy={p2.y} r={k * 0.27} fill={col} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

/** a short train of light waves along the beam, centred at x (world), amplitude a (0..1) */
const packetPath = (x: number, a: number, toS: (x: number, y: number) => {x: number; y: number}) => {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, xx = x - 2.6 + 3.0 * u;
    const env = Math.sin(Math.PI * u);
    const p = toS(xx, BEAM_Y + 0.9 * a * env * Math.sin(((xx - x) / 0.9) * 2 * Math.PI));
    pts.push(`${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join('');
};

export const Section5: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const z = cam.z;
  const toS = (x: number, y: number) => ({x: W / 2 - (x - cam.x) * z, y: CY + (y - cam.y) * z});
  const tf = `translate(${(W / 2 + cam.x * z).toFixed(2)} ${(CY - cam.y * z).toFixed(2)}) scale(${(-z).toFixed(4)} ${z.toFixed(4)})`;
  const sw = (px: number) => px / z;
  const inSci = t > 8.5;
  const micro = inSci ? clamp((z - 24) / 18) : 0;
  const fronts = frontsAt(t);
  // D: the eardrum pushed in by each band as it arrives (distance from the source stretch to the drum ~ 300 units)
  let drum = 0;
  for (const r of fronts) drum += Math.exp(-Math.pow((r - 300) / 22, 2)) * 11;
  // S4: a soft light runs down the empty canal (6.25..6.85)
  const scan = !inSci ? clamp((t - 6.25) / 0.6) : -1;
  const vx0 = cam.x - W / 2 / z - 3, vx1 = cam.x + W / 2 / z + 3, vy0 = cam.y - CY / z - 4, vy1 = cam.y + (H - CY) / z + 4;
  const hiWater = inSci ? ss(9.55, 9.8, t) * (1 - ss(10.0, 10.3, t)) : 0;
  const bandOn = pulseOn(t);
  const beamTop = BEAM_Y - 2.4, beamBot = BEAM_Y + 2.4;
  return (
    <AbsoluteFill style={{background: C.air}}>
      <svg width={W} height={H}>
        <defs>
          <clipPath id="s5air"><path d={`M -3000 -3000 L 3000 -3000 L 3000 3000 L -3000 3000 Z ${HEAD} ${CANAL}`} clipRule="evenodd" /></clipPath>
          <filter id="s5blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10} /></filter>
 <linearGradient id="s5warm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.heat} stopOpacity={0} /><stop offset="0.5" stopColor={C.heat} stopOpacity={1} /><stop offset="1" stopColor={C.heat} stopOpacity={0} /></linearGradient>
          <clipPath id="s5canal"><path d={CANAL} /></clipPath>
          <linearGradient id="s5scan" x1="0" x2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.55} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        </defs>
        <g transform={tf}>
          {/* the head in section */}
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
          {/* the canal: open, empty */}
          <path d={CANAL} fill={C.canal} stroke={INK} strokeWidth={sw(4)} strokeLinejoin="round" />
          {[[8, -45, 6, 8], [30, -44, 10, 9], [52, -43, 4, 9], [14, 44, 8, -8], [40, 41, 2, -9], [66, 39, 10, -8]].map(([x, y, dx, dy], i) => <line key={i} x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={C.hair} strokeWidth={sw(2)} strokeLinecap="round" opacity={0.7} />)}
          {scan >= 0 && scan < 1 && (
            <g clipPath="url(#s5canal)">
              <rect x={-60 + scan * 360} y={-60} width={80} height={120} fill="url(#s5scan)" />
            </g>
          )}
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
          {/* the beam (a visualisation) and, at molecular scale, the warm pocket of air around it */}
          {inSci && (
            <g>
              <rect x={-3000} y={beamTop - 2} width={3000 + BEAM_X1} height={beamBot - beamTop + 4} fill={C.irGlow} opacity={0.14 * bandOn} filter="url(#s5blur)" />
              <rect x={-3000} y={beamTop} width={3000 + BEAM_X1} height={beamBot - beamTop} fill={C.ir} opacity={(0.05 + 0.12 * (1 - micro)) * bandOn} />
              <line x1={-3000} y1={BEAM_Y} x2={BEAM_X1} y2={BEAM_Y} stroke={C.irCore} strokeWidth={sw(2.2)} opacity={(1 - micro * 0.75) * bandOn} />
              <rect x={-3000} y={BEAM_Y - 2.4 - 3.5 * expandAt(t)} width={3000 + BEAM_X1} height={4.8 + 7 * expandAt(t)} fill={C.heat} opacity={0.2 * heatAt(t) * micro} filter="url(#s5blur)" />
            </g>
          )}
          {/* pressure bands at ear scale (only in the air and the canal) */}
          {inSci && fronts.length > 0 && (
            <g clipPath="url(#s5air)" opacity={1 - micro}>
              {fronts.map((r, i) => r < 1 ? null : (
                <path key={i} d={`M ${SRC_X0} ${BEAM_Y - r} L ${BEAM_X1} ${BEAM_Y - r} A ${r} ${r} 0 0 1 ${BEAM_X1} ${BEAM_Y + r} L ${SRC_X0} ${BEAM_Y + r} A ${r} ${r} 0 0 1 ${SRC_X0} ${BEAM_Y - r}`}
                  fill="none" stroke={C.wave} strokeWidth={sw(5)} opacity={0.75 * clamp(1 - r / 700)} />
              ))}
            </g>
          )}
        </g>
        {/* ---- molecular scale (screen space) */}
        {inSci && micro > 0.01 && (
          <g opacity={micro}>
            {/* faint lines along the pressure bands, so their travel reads */}
            {fronts.map((r, i) => r < 0.5 || r > 30 ? null : [1, -1].map((sd) => {
              const y = toS(0, BEAM_Y + sd * r).y;
              return <line key={`${i}${sd}`} x1={0} y1={y} x2={W} y2={y} stroke={C.wave} strokeWidth={4} opacity={0.4 * clamp(1 - r / 30)} />;
            }))}
            {/* B: the warm pocket of air around the beam, swelling */}
            {(() => {
              const hh = (2.6 + 4.2 * expandAt(t)) * z, yc = toS(0, BEAM_Y).y;
              const op = 0.38 * heatAt(t);
              return op > 0.01 ? <rect x={0} y={yc - hh * 1.6} width={W} height={hh * 3.2} fill="url(#s5warm)" opacity={op} /> : null;
            })()}
            {MOLS.map((m, i) => {
              if (m.x < vx0 || m.x > vx1 || m.y < vy0 || m.y > vy1) return null;
              const s = molAt(m, t);
              const p = toS(s.x, s.y);
              return <MolArt key={i} m={m} s={s} X={p.x} Y={p.y} z={z} hi={m.hero !== undefined ? hiWater : 0} />;
            })}
            {/* A: light packets; each one aimed at a water molecule is swallowed by it */}
            {HEROES.map((h, k) => {
              const xh = M.x + h.dx;
              if (t > h.t + 0.12 || t < h.t - 2.6) return null;
              const xp = xh - C_LIGHT * Math.max(0, h.t - t);
              const a = t <= h.t ? 1 : clamp(1 - (t - h.t) / 0.12);
              return <path key={`pk${k}`} d={packetPath(xp, a, toS)} fill="none" stroke={C.irCore} strokeWidth={4} strokeLinecap="round" opacity={0.95 * bandOn} />;
            })}
            {PASS.map((p, k) => {
              const xp = vx0 - 3 + C_LIGHT * (t - p.t0);
              if (xp < vx0 - 4 || xp > vx1 + 4) return null;
              return <path key={`ps${k}`} d={packetPath(xp, 1, toS)} fill="none" stroke={C.irCore} strokeWidth={4} strokeLinecap="round" opacity={0.85} />;
            })}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
