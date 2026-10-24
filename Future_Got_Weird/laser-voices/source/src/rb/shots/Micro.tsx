// 8.55-15.0: the air at his ear, magnified. One continuous world (no resets): the skin and canal opening at the left,
// the beam's path (instructional) entering it from the right, water vapour among the air.
//  8.55-9.3   arriving: the push from the ear close-up continues into the air at the opening
//  9.15-9.8   "water vapor": the water molecules are picked out (a brief rim glow)
// 10.1-11.3   "absorbs its light": pulses of light run down the path; each water molecule on it flashes as it absorbs
//             a pulse and starts to vibrate
// 11.6-12.35  "heats up": the absorbers glow warm and jostle, their neighbours speed up
// 12.35-13.05 "expands": the warm pocket along the path swells and shoves the molecules apart
// 13.26-14.7  "creating tiny sound waves": each pulse's expansion sends a pressure front outward; the camera follows the
//             fronts left into the canal (a cutaway), where each one pushes the eardrum
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, fmt, hash, lerp} from '../lib/math';
import {eio, ss} from './common';

const BAND = 960; // the path's height in micro space
const C = {air: '#0F3340', airDeep: '#0A2129', o: '#E5484D', h: '#F3F6F8', n: '#6E8DE6', warm: '#FF9D4D', front: '#BFF6FF', path: '#FFAA5E'};
// pulse launch times (the laser's pulses) and their speed along the path (micro units / s)
const PULSES = [10.05, 10.4, 10.75, 11.1, 11.45, 11.8, 12.15, 12.5, 12.85, 13.2, 13.55, 13.9, 14.25];
const PULSE_V = 1400;
const PATH_X0 = 1900; // where pulses enter from the right
/** fronts: one per pulse from 12.35 on, launched from the pocket's centre */
const POCKET = {x: 560, y: BAND};
const FRONT_V = 1100;

type Mol = {kind: 'w' | 'n'; x: number; y: number; r: number; a: number; ph: number; layer: number; onPath: boolean};
const MOLS: Mol[] = (() => {
  const out: Mol[] = [];
  // water on the path (the absorbers), placed so pulses reach them in turn
  [260, 420, 560, 700, 860, 1020].forEach((x, i) => out.push({kind: 'w', x, y: BAND + (hash(i, 31) - 0.5) * 70, r: 1, a: hash(i, 32) * 360, ph: hash(i, 33) * 6, layer: 1, onPath: true}));
  for (let i = 0; i < 110; i++) {
    const layer = i < 52 ? 1 : i < 92 ? 2 : 0.6;
    const x = -1500 + hash(i, 41) * 3400;
    let y = 120 + hash(i, 42) * 1700;
    if (layer === 1 && Math.abs(y - BAND) < 120) y += 260 * Math.sign(y - BAND || 1);
    // only in the air: outside the head, or inside the canal
    const half = x < 40 ? lerp(300, 210, clamp((40 - x) / 1390)) - 60 : 9999;
    if (x < -1340 || Math.abs(y - BAND) > half || (layer !== 1 && x < 380)) continue;
    out.push({kind: hash(i, 43) < 0.6 ? 'w' : 'n', x, y, r: layer === 2 ? 0.75 : layer === 0.6 ? 2.2 : 1, a: hash(i, 44) * 360, ph: hash(i, 45) * 6, layer, onPath: false});
  }
  return out;
})();

/** when the first pulse reaches x (pulses travel left from PATH_X0) */
const hitT = (x: number) => PULSES[0] + (PATH_X0 - x) / PULSE_V;
/** pressure-front radii and strengths at time t */
const fronts = (t: number) => PULSES.filter((p) => p >= 12.15).map((p, i) => ({r: (t - (p + 0.12)) * FRONT_V, k: 0.55 + 0.45 * Math.min(1, i / 2)})).filter((f) => f.r > 0);

/** a molecule's displacement from the expansion and the passing fronts */
const displace = (x: number, y: number, t: number) => {
  const dx = x - POCKET.x;
  const dy = (y - POCKET.y) * 1.6;
  const d = Math.hypot(dx, dy) || 1;
  const swell = ss(12.3, 12.95, t);
  let push = swell * 130 * Math.exp(-d / 420);
  for (const f of fronts(t)) push += 34 * f.k * Math.exp(-(((d - f.r) / 70) ** 2));
  return {x: (dx / d) * push, y: ((dy / d) * push) / 1.6};
};

const Atom: React.FC<{x: number; y: number; r: number; fill: string; glow?: number}> = ({x, y, r, fill, glow = 0}) => (
  <g>
    {glow > 0.01 && <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r * 2.1)} fill={C.warm} opacity={0.35 * glow} filter="url(#mc-soft)" />}
    <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r)} fill={fill} />
    <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r)} fill="url(#mc-shade)" />
    <ellipse cx={fmt(x - r * 0.32)} cy={fmt(y - r * 0.38)} rx={fmt(r * 0.34)} ry={fmt(r * 0.22)} transform={`rotate(-30 ${fmt(x - r * 0.32)} ${fmt(y - r * 0.38)})`} fill="#FFFFFF" opacity={0.75} />
  </g>
);

const Molecule: React.FC<{m: Mol; t: number}> = ({m, t}) => {
  const s = m.r * 52;
  const absorbed = m.onPath ? ss(hitT(m.x) - 0.02, hitT(m.x) + 0.06, t) : 0;
  const heat = m.onPath ? Math.max(absorbed * 0.45, ss(11.6, 12.3, t)) * (1 - 0.6 * ss(13.6, 14.6, t)) : 0;
  const near = Math.exp(-Math.hypot(m.x - POCKET.x, (m.y - POCKET.y) * 1.5) / 520);
  const agitation = 1 + 6 * heat + 3 * near * ss(11.7, 12.5, t);
  // drift + thermal jiggle (faster when heated) + expansion and pressure fronts
  const jx = Math.sin(t * 1.1 * agitation + m.ph) * 9 * agitation + Math.sin(t * 0.37 + m.ph * 2) * 26;
  const jy = Math.cos(t * 1.3 * agitation + m.ph * 1.7) * 9 * agitation + Math.cos(t * 0.29 + m.ph) * 22;
  const dsp = m.layer === 1 ? displace(m.x, m.y, t) : {x: 0, y: 0};
  const x = m.x + jx + dsp.x;
  const y = m.y + jy + dsp.y;
  const a = m.a + t * 20 * (m.ph > 3 ? 1 : -1) * agitation;
  const R = (q: number) => (q * Math.PI) / 180;
  if (m.kind === 'n') {
    const d = s * 0.55;
    return (
      <g>
        <Atom x={x - Math.cos(R(a)) * d} y={y - Math.sin(R(a)) * d} r={s * 0.62} fill={C.n} />
        <Atom x={x + Math.cos(R(a)) * d} y={y + Math.sin(R(a)) * d} r={s * 0.62} fill={C.n} />
      </g>
    );
  }
  // water: O with two H at 104.5 deg; absorbed molecules stretch and bend (vibrating bonds)
  const vib = absorbed * (0.25 + 0.75 * heat);
  const bond = s * (0.78 + 0.12 * vib * Math.sin(t * 46 + m.ph));
  const bend = 52 + 9 * vib * Math.sin(t * 38 + m.ph * 2);
  const oCol = heat > 0.01 ? `rgb(${Math.round(lerp(229, 255, heat))},${Math.round(lerp(72, 140, heat))},${Math.round(lerp(77, 60, heat))})` : C.o;
  const flash = m.onPath ? Math.exp(-(((t - hitT(m.x)) / 0.07) ** 2)) : 0;
  const pick = m.kind === 'w' && m.layer === 1 ? Math.exp(-(((t - 9.5) / 0.3) ** 2)) : 0;
  return (
    <g>
      {flash > 0.02 && <circle cx={fmt(x)} cy={fmt(y)} r={fmt(s * 2.6)} fill="#FFE0A8" opacity={0.65 * flash} filter="url(#mc-soft)" />}
      {pick > 0.02 && <circle cx={fmt(x)} cy={fmt(y)} r={fmt(s * 1.7)} fill="none" stroke="#9FF1FF" strokeWidth={4} opacity={0.6 * pick} />}
      <Atom x={x + Math.cos(R(a - bend)) * bond} y={y + Math.sin(R(a - bend)) * bond} r={s * 0.52} fill={C.h} />
      <Atom x={x + Math.cos(R(a + bend)) * bond} y={y + Math.sin(R(a + bend)) * bond} r={s * 0.52} fill={C.h} />
      <Atom x={x} y={y} r={s * 0.82} fill={oCol} glow={heat} />
    </g>
  );
};

/** the canal in section: the opening's skin at x 0, the canal running left to the eardrum at x -1350 */
const CANAL = {x0: 40, x1: -1350, top0: BAND - 300, bot0: BAND + 300, top1: BAND - 210, bot1: BAND + 210};
const Canal: React.FC<{t: number; drum: number}> = ({t, drum}) => {
  const {x0, x1, top0, bot0, top1, bot1} = CANAL;
  const wallTop = `M${x0 + 300},-600 L${x0 + 300},${top0 - 120} C${x0 + 120},${top0 - 40} ${x0},${top0} ${x0 - 200},${top0 + 10} C${(x0 + x1) / 2},${top0 + 40} ${x1 + 200},${top1 - 10} ${x1},${top1} L${x1 - 700},${top1} L${x1 - 700},-600 Z`;
  const wallBot = `M${x0 + 300},2600 L${x0 + 300},${bot0 + 140} C${x0 + 120},${bot0 + 50} ${x0},${bot0} ${x0 - 200},${bot0 - 10} C${(x0 + x1) / 2},${bot0 - 40} ${x1 + 200},${bot1 + 10} ${x1},${bot1} L${x1 - 700},${bot1} L${x1 - 700},2600 Z`;
  // the eardrum: a membrane across the canal's end, pushed in by each front (drum 0..1 displacement)
  const bulge = 70 * drum;
  const dTop = {x: x1, y: top1};
  const dBot = {x: x1, y: bot1};
  const drumD = `M${fmt(dTop.x)},${fmt(dTop.y)} Q${fmt(x1 - 40 - bulge)},${BAND} ${fmt(dBot.x)},${fmt(dBot.y)} L${fmt(dBot.x - 16)},${fmt(dBot.y)} Q${fmt(x1 - 56 - bulge)},${BAND} ${fmt(dTop.x - 16)},${fmt(dTop.y)} Z`;
  return (
    <g>
      <defs>
        <linearGradient id="mc-tissue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C46A5E" />
          <stop offset="0.5" stopColor="#E59A86" />
          <stop offset="1" stopColor="#C46A5E" />
        </linearGradient>
        <linearGradient id="mc-skin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9B08C" />
          <stop offset="1" stopColor="#F1C4A3" />
        </linearGradient>
      </defs>
      {/* the middle ear behind the drum (dark), with the hammer bone riding on the drum */}
      <rect x={x1 - 700} y={top1 - 40} width={700} height={bot1 - top1 + 80} fill="#2A0E14" />
      {/* the hammer (malleus): its handle rides on the drum, its head rocks in the cavity */}
      <path d={`M${fmt(x1 - 44 - bulge * 0.95)},${BAND + 30} C${fmt(x1 - 90 - bulge * 0.8)},${BAND - 60} ${fmt(x1 - 150 - bulge * 0.6)},${BAND - 120} ${fmt(x1 - 190 - bulge * 0.5)},${BAND - 150} L${fmt(x1 - 214 - bulge * 0.5)},${BAND - 128} C${fmt(x1 - 170 - bulge * 0.6)},${BAND - 96} ${fmt(x1 - 110 - bulge * 0.8)},${BAND - 40} ${fmt(x1 - 70 - bulge * 0.95)},${BAND + 34} Z`} fill="#F2E6D0" stroke="#3A1A1A" strokeWidth={4} />
      <ellipse cx={fmt(x1 - 226 - bulge * 0.5)} cy={BAND - 178} rx={44} ry={36} transform={`rotate(-30 ${fmt(x1 - 226 - bulge * 0.5)} ${BAND - 178})`} fill="#F2E6D0" stroke="#3A1A1A" strokeWidth={4} />
      <ellipse cx={fmt(x1 - 236 - bulge * 0.5)} cy={BAND - 190} rx={14} ry={9} fill="#FFFFFF" opacity={0.6} />
      <path d={wallTop} fill="url(#mc-tissue)" stroke="#5A2422" strokeWidth={5} />
      <path d={wallBot} fill="url(#mc-tissue)" stroke="#5A2422" strokeWidth={5} />
      {/* deeper layers of the cut: dermis and cartilage bands following the canal, small vessels */}
      {[60, 130].map((o, i) => (
        <g key={i} opacity={0.5 - i * 0.15}>
          <path d={`M${x0 + 300},${top0 - 120 - o} C${x0 + 120},${top0 - 40 - o} ${x0},${top0 - o} ${x0 - 200},${top0 + 10 - o} C${(x0 + x1) / 2},${top0 + 40 - o} ${x1 + 200},${top1 - 10 - o} ${x1},${top1 - o}`} fill="none" stroke={i ? '#F1D7C6' : '#B95A50'} strokeWidth={i ? 38 : 16} />
          <path d={`M${x0 + 300},${bot0 + 140 + o} C${x0 + 120},${bot0 + 50 + o} ${x0},${bot0 + o} ${x0 - 200},${bot0 - 10 + o} C${(x0 + x1) / 2},${bot0 - 40 + o} ${x1 + 200},${bot1 + 10 + o} ${x1},${bot1 + o}`} fill="none" stroke={i ? '#F1D7C6' : '#B95A50'} strokeWidth={i ? 38 : 16} />
        </g>
      ))}
      {Array.from({length: 7}, (_, i) => (
        <circle key={i} cx={x0 - 150 - i * 170} cy={top0 - 70 - (i % 3) * 30} r={8 + (i % 2) * 5} fill="#9C2638" opacity={0.6} />
      ))}
      {/* skin lining the canal and the outer ear's edge */}
      <path d={`M${x0 + 300},${top0 - 120} C${x0 + 120},${top0 - 40} ${x0},${top0} ${x0 - 200},${top0 + 10} C${(x0 + x1) / 2},${top0 + 40} ${x1 + 200},${top1 - 10} ${x1},${top1}`} fill="none" stroke="url(#mc-skin)" strokeWidth={26} />
      <path d={`M${x0 + 300},${bot0 + 140} C${x0 + 120},${bot0 + 50} ${x0},${bot0} ${x0 - 200},${bot0 - 10} C${(x0 + x1) / 2},${bot0 - 40} ${x1 + 200},${bot1 + 10} ${x1},${bot1}`} fill="none" stroke="url(#mc-skin)" strokeWidth={26} />
      <defs>
        <linearGradient id="mc-drum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9CFC8" />
          <stop offset="0.45" stopColor="#F7F1EC" />
          <stop offset="1" stopColor="#C9B9B0" />
        </linearGradient>
      </defs>
      <path d={drumD} fill="url(#mc-drum)" stroke="#6B4A44" strokeWidth={5} />
      <path d={`M${fmt(x1 - 6)},${top1 + 40} Q${fmt(x1 - 34 - bulge)},${BAND} ${fmt(x1 - 6)},${bot1 - 40}`} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
      {void t}
    </g>
  );
};

export const microCam = (t: number) => {
  // arrive (zooming out of the opening into the air beside it), hold on the absorbers, pull back for the expansion,
  // then follow the fronts left into the canal to the drum
  const arrive = eio(clamp((t - 8.55) / 0.75));
  let x = lerp(260, 620, arrive);
  let y = BAND;
  let z = Math.exp(lerp(Math.log(0.5), Math.log(1.0), arrive));
  const pb = eio(clamp((t - 12.2) / 0.9));
  z = lerp(z, 0.82, pb);
  x = lerp(x, 600, pb);
  const follow = eio(clamp((t - 13.3) / 1.35));
  x = lerp(x, -1180, follow);
  z = lerp(z, 0.95, follow);
  y = lerp(y, BAND, follow);
  // the whip back up the path toward the emitter (into the next shot)
  const whip = Math.pow(clamp((t - 14.8) / 0.2), 2);
  x += whip * 4200;
  return {x, y, z};
};

export const MicroShot: React.FC<{t: number; amt?: number}> = ({t, amt = 1}) => {
  const cam = microCam(t);
  const pulsesNow = PULSES.map((p) => ({x: PATH_X0 - (t - p) * PULSE_V, p})).filter((q) => t >= q.p && q.x > -100);
  const pocket = ss(11.55, 12.3, t);
  const swell = ss(12.3, 12.95, t);
  const fr = fronts(t);
  // the drum is pushed by fronts reaching it
  const drumDist = Math.hypot(CANAL.x1 - POCKET.x, 0);
  const drum = fr.reduce((s, f) => s + f.k * Math.exp(-(((f.r - drumDist) / 120) ** 2)), 0) * Math.min(1, 1);
  const pathOn = 1;
  const layers = [2, 1, 0.6];
  return (
    <g opacity={amt}>
      <defs>
        <radialGradient id="mc-shade" cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.85" stopColor="#0A1C24" stopOpacity={0.35} />
          <stop offset="1" stopColor="#0A1C24" stopOpacity={0.6} />
        </radialGradient>
        <filter id="mc-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <filter id="mc-far" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
        <filter id="mc-near" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
        <radialGradient id="mc-bg" cx="0.6" cy="0.45" r="0.8">
          <stop offset="0" stopColor="#164556" />
          <stop offset="1" stopColor={C.airDeep} />
        </radialGradient>
        <radialGradient id="mc-pocket">
          <stop offset="0" stopColor={C.warm} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={C.warm} stopOpacity={0.22} />
          <stop offset="1" stopColor={C.warm} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill="url(#mc-bg)" />
      {layers.map((ly) => (
        <Layer key={ly} cam={cam} depth={ly === 2 ? 2.2 : ly === 0.6 ? 0.55 : 1}>
          {ly === 1 && <Canal t={t} drum={drum} />}
          {ly === 1 && (
            // the pocket: warm air swelling along the path
            <ellipse cx={POCKET.x + 150} cy={BAND} rx={fmt(260 + 220 * swell)} ry={fmt(90 + 150 * swell)} fill="url(#mc-pocket)" opacity={pocket * (1 - 0.5 * ss(13.4, 14.5, t))} />
          )}
          {ly === 1 &&
            fr.map((f, i) => (
              // pressure fronts: compressed air (a bright crest with a soft lagging rarefaction)
              <g key={i} opacity={clamp(1.15 - f.r / 3200) * f.k}>
                <ellipse cx={POCKET.x} cy={POCKET.y} rx={fmt(f.r)} ry={fmt(f.r / 1.6)} fill="none" stroke={C.front} strokeWidth={14} opacity={0.5} />
                <ellipse cx={POCKET.x} cy={POCKET.y} rx={fmt(Math.max(1, f.r - 26))} ry={fmt(Math.max(1, (f.r - 26) / 1.6))} fill="none" stroke={C.front} strokeWidth={5} opacity={0.35} />
                <ellipse cx={POCKET.x} cy={POCKET.y} rx={fmt(Math.max(1, f.r - 70))} ry={fmt(Math.max(1, (f.r - 70) / 1.6))} fill="none" stroke="#08202A" strokeWidth={20} opacity={0.2} />
              </g>
            ))}
          <g filter={ly === 2 ? 'url(#mc-far)' : ly === 0.6 ? 'url(#mc-near)' : undefined} opacity={ly === 2 ? 0.55 : ly === 0.6 ? 0.45 : 1}>
            {MOLS.filter((m) => m.layer === ly).map((m, i) => (
              <Molecule key={i} m={m} t={t} />
            ))}
          </g>
          {ly === 1 && pathOn && (
            // the path (instructional) and the light pulses running down it
            <g>
              <line x1={PATH_X0 + 400} y1={BAND} x2={-40} y2={BAND} stroke={C.path} strokeWidth={6} strokeDasharray="30 22" strokeDashoffset={fmt(-t * 260)} opacity={0.6} />
              {pulsesNow.map((q, i) => (
                <g key={i}>
                  <path
                    d={Array.from({length: 25}, (_, k) => {
                      const xx = q.x - 120 + k * 10;
                      const env = Math.sin((k / 24) * Math.PI);
                      return `${k ? 'L' : 'M'}${fmt(xx)},${fmt(BAND + Math.sin(k * 1.3 - t * 40) * 26 * env)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#FFC37A"
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                  <ellipse cx={fmt(q.x)} cy={BAND} rx={140} ry={44} fill="#FF9D4D" opacity={0.3} filter="url(#mc-soft)" />
                </g>
              ))}
            </g>
          )}
        </Layer>
      ))}
    </g>
  );
};
