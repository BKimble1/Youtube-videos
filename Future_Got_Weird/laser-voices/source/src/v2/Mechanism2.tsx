// The mechanism, in the air just outside the lead's exposed ear (head units; the same coordinates as the head, so
// the camera simply keeps diving into the air it was looking at: no magnifier, no inset, no labels).
//   9.25-9.9   the ear close-up enlarges; everything but the ear settles into the dark of the air (depth haze), and
//              the air's molecules resolve as the zoom passes their scale (N2, O2, a few H2O).
//   9.99-10.76 one infrared packet (amber) arrives along the path and is absorbed by a water molecule (10.76 tick).
//   10.8-12.05 the absorbed energy becomes motion: the molecule and then its neighbours jostle faster; a warm patch.
//   12.3       the warmed pocket expands, compressing the air around it (12.3 puff) ...
//   12.4-14.8  ... and the compressions travel outward as pressure fronts (teal/cream bands), reaching the ear
//              opening; the camera tracks them there and the sequence ends before the exit.
import React from 'react';
import {Pt, P, Mat, matStr, clamp, lerp, inv, ramp, eout, eio, rnd, f3, fadeWin} from './lib2';
import {AIR, LIGHT, C} from './theme2';
import {EarShape, EAR_OPEN} from './art/LeadHead';

export const MECH = {
  anchor: P(-218, 96), // the absorbing water molecule (just outside the ear, against the dark beside the jaw)
  dir: (-36.4 * Math.PI) / 180, // the packet's travel direction (up and to the right, as the path arrives)
  tPacket: 9.99, tHit: 10.76, tHeat: [10.85, 12.05], tExpand: 12.3, fronts: [12.42, 12.95, 13.48], speed: 58,
  haze: [9.22, 9.9, 14.83, 15.42],
};
const TGT = MECH.anchor;
type Mol = {p: Pt; kind: 0 | 1 | 2; a: number; ph: number};
// N2 : O2 : H2O drawn roughly 70 : 22 : 8 (water is over-represented so the absorber can be found)
const MOLS: Mol[] = (() => {
  const out: Mol[] = [];
  let i = 0;
  for (let y = -60; y <= 230; y += 12.5) for (let x = -360; x <= -60; x += 12.5) {
    i++;
    const p = P(x + (rnd(i * 1.7) - 0.5) * 9, y + (rnd(i * 2.9) - 0.5) * 9);
    const ex = (p.x + 162) ** 2 / 46 ** 2 + (p.y - 36) ** 2 / 70 ** 2; // keep the ear itself clear
    if (ex < 1) continue;
    if (Math.hypot(p.x - TGT.x, p.y - TGT.y) < 9) continue;
    const r = rnd(i * 5.3);
    out.push({p, kind: r < 0.7 ? 0 : r < 0.92 ? 1 : 2, a: rnd(i * 7.7) * 360, ph: rnd(i * 3.1) * 100});
  }
  out.push({p: TGT, kind: 2, a: 20, ph: 0});
  return out;
})();
const front = (t: number, i: number) => (t - MECH.fronts[i]) * MECH.speed; // radius of front i
const heatAt = (t: number, d: number) => {
  // warmth of a molecule at distance d from the absorber
  const spread = lerp(0, 18, ramp(MECH.tHeat[0], MECH.tHeat[1], t, eout));
  const core = t >= MECH.tHit ? Math.exp(-((d / Math.max(2, spread)) ** 2)) : 0;
  return core * (1 - 0.6 * ramp(13.0, 14.6, t));
};
const displace = (t: number, p: Pt): Pt => {
  // radial displacement: the warm pocket swells, and each front carries a band of compression outward
  const dx = p.x - TGT.x, dy = p.y - TGT.y, d = Math.hypot(dx, dy) || 1;
  let s = 0;
  const swell = ramp(MECH.tExpand - 0.1, MECH.tExpand + 0.45, t, eout) * Math.exp(-((d / 16) ** 2)) * 5;
  s += swell;
  MECH.fronts.forEach((_, i) => {
    const R = front(t, i);
    if (R > 0) s += 3.2 * Math.exp(-(((d - R) / 5) ** 2)) * Math.exp(-R / 140);
  });
  return P(p.x + (dx / d) * s, p.y + (dy / d) * s);
};

const Molecule: React.FC<{m: Mol; t: number; sw: number; hot: number; hit?: number}> = ({m, t, sw, hot, hit = 0}) => {
  const jig = 0.9 + 3.2 * hot;
  const sp = 1 + 3 * hot;
  const p = P(m.p.x + jig * Math.sin(t * 1.3 * sp + m.ph), m.p.y + jig * Math.cos(t * 1.1 * sp + m.ph * 1.3));
  const ang = m.a + 30 * Math.sin(t * 0.7 * sp + m.ph) + 120 * hot * Math.sin(t * 5 + m.ph);
  // agitation marks (motion, not colour): short cream ticks either side once a molecule is jostling hard
  const glow = hot > 0.15 ? (
    <g opacity={clamp(hot)} transform={`rotate(${f3(-ang + 25 * Math.sin(t * 9 + m.ph))})`}>
      <path d="M-4.6 -1.6 Q-5.6 0 -4.6 1.6 M4.6 -1.6 Q5.6 0 4.6 1.6" fill="none" stroke={AIR.bandCream} strokeWidth={Math.max(sw * 1.8, 0.35)} strokeLinecap="round" />
    </g>
  ) : null;
  if (m.kind === 2) {
    const str = 1 + (hit > 0 ? 0.35 * hit * Math.sin(t * 40) : 0);
    const h1 = P(-2.3 * str, 1.7 * str), h2 = P(2.3 * str, 1.7 * str);
    return (
      <g transform={`translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(ang)})`}>
        {glow}
        {hit > 0 && <circle cx={0} cy={0} r={4 + 4 * hit} fill={AIR.warm} opacity={0.35 * hit} />}
        <circle cx={h1.x} cy={h1.y} r={1.25} fill={AIR.h} stroke={C.ink} strokeWidth={sw} />
        <circle cx={h2.x} cy={h2.y} r={1.25} fill={AIR.h} stroke={C.ink} strokeWidth={sw} />
        <circle cx={0} cy={0} r={2.05} fill={hot > 0.3 ? AIR.hot : AIR.o} stroke={C.ink} strokeWidth={sw} />
      </g>
    );
  }
  const col = m.kind === 0 ? AIR.n2 : AIR.o2;
  return (
    <g transform={`translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(ang)})`}>
      {glow}
      <circle cx={-0.85} cy={0} r={1.35} fill={col} stroke={C.ink} strokeWidth={sw} />
      <circle cx={0.85} cy={0} r={1.35} fill={col} stroke={C.ink} strokeWidth={sw} />
    </g>
  );
};

// a wave packet travelling along `dir`, head at `head` (head units), `len` long
const Packet: React.FC<{head: Pt; len: number; sw: number; a: number; t: number}> = ({head, len, sw, a, t}) => {
  if (a <= 0.003) return null;
  const c = Math.cos(MECH.dir), s = Math.sin(MECH.dir);
  const pts: string[] = [];
  for (let k = 0; k <= 60; k++) {
    const u = k / 60, along = -len * (1 - u);
    const env = Math.sin(Math.PI * u) ** 0.7;
    const off = 2.2 * env * Math.sin((along / 5.2) * 2 * Math.PI - t * 30);
    pts.push(`${f3(head.x + c * along - s * off)} ${f3(head.y + s * along + c * off)}`);
  }
  return (
    <g opacity={a}>
      <path d={'M' + pts.join('L')} fill="none" stroke={LIGHT.irGlow} strokeWidth={sw * 5} strokeLinecap="round" opacity={0.35} />
      <path d={'M' + pts.join('L')} fill="none" stroke={LIGHT.ir} strokeWidth={sw * 2.2} strokeLinecap="round" />
    </g>
  );
};

export const hazeAt = (t: number) => 0.93 * clamp(Math.min(inv(MECH.haze[0], MECH.haze[1], t), 1 - inv(MECH.haze[2], MECH.haze[3], t)));

export const Mechanism: React.FC<{t: number; zHead: number; mat: Mat}> = ({t, zHead, mat}) => {
  const hz = hazeAt(t);
  const lod = clamp(inv(6, 11, zHead));
  if (hz <= 0.002 && lod <= 0.002) return null;
  const px = 1 / zHead; // one screen pixel in head units
  const sw = 1.6 * px;
  const sk = Math.min(1, 14 / (3.2 * zHead));
  // packet
  const pk = clamp(inv(MECH.tPacket, MECH.tHit, t));
  const dist = (1 - pk) * 110;
  const head = P(TGT.x - Math.cos(MECH.dir) * dist, TGT.y - Math.sin(MECH.dir) * dist);
  const pkA = t >= MECH.tPacket - 0.05 && t < MECH.tHit + 0.12 ? 1 - clamp((t - MECH.tHit) / 0.12) : 0;
  const hit = t >= MECH.tHit ? Math.exp(-(t - MECH.tHit) / 0.45) : 0;
  const warmR = lerp(4, 18, ramp(MECH.tHeat[0], MECH.tHeat[1], t, eout)) * (1 + 0.6 * ramp(MECH.tExpand - 0.1, MECH.tExpand + 0.5, t, eout));
  const warmA = (t > MECH.tHit ? 0.42 : 0) * (1 - ramp(13.2, 14.6, t));
  const arrive = MECH.fronts.reduce((m, _, i) => Math.max(m, Math.exp(-(((front(t, i) - Math.hypot(EAR_OPEN.x - TGT.x, EAR_OPEN.y - TGT.y)) / 8) ** 2))), 0);
  return (
    <g transform={matStr(mat)}>
      <defs>
        <radialGradient id="mech-warm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={AIR.warm} stopOpacity={0.75} />
          <stop offset="0.6" stopColor={AIR.hot} stopOpacity={0.3} />
          <stop offset="1" stopColor={AIR.hot} stopOpacity={0} />
        </radialGradient>
      </defs>
      {hz > 0.002 && (
        <g>
          <rect x={-4000} y={-4000} width={8000} height={8000} fill={AIR.bg} opacity={hz} />
          <EarShape sk={sk} />
          {/* the canal entrance takes the sound in */}
          <ellipse cx={EAR_OPEN.x} cy={EAR_OPEN.y} rx={9} ry={12} fill={AIR.band} opacity={0.5 * arrive * hz} />
        </g>
      )}
      <g opacity={lod * Math.max(hz / 0.93, 0)}>
        {warmA > 0 && <circle cx={TGT.x} cy={TGT.y} r={warmR * 1.6} fill="url(#mech-warm)" opacity={warmA} />}
        {MECH.fronts.map((_, i) => {
          const R = front(t, i);
          if (R <= 0 || R > 220) return null;
          const a = Math.exp(-R / 160) * (1 - ramp(14.5, 15.0, t));
          return (
            <g key={i} opacity={a}>
              <circle cx={TGT.x} cy={TGT.y} r={R} fill="none" stroke={AIR.band} strokeWidth={4.2} opacity={0.32} />
              <circle cx={TGT.x} cy={TGT.y} r={R} fill="none" stroke={AIR.band} strokeWidth={Math.max(sw * 3, 0.9)} />
              <circle cx={TGT.x} cy={TGT.y} r={R - 1.6} fill="none" stroke={AIR.bandCream} strokeWidth={Math.max(sw * 1.6, 0.45)} opacity={0.85} />
            </g>
          );
        })}
        {MOLS.map((m, i) => {
          const d = Math.hypot(m.p.x - TGT.x, m.p.y - TGT.y);
          const isT = i === MOLS.length - 1;
          const q = displace(t, m.p);
          return <Molecule key={i} m={{...m, p: q}} t={t} sw={sw} hot={isT ? Math.max(heatAt(t, 0), hit) : heatAt(t, d)} hit={isT ? hit : 0} />;
        })}
        <Packet head={head} len={30} sw={Math.max(sw, 0.35)} a={pkA} t={t} />
      </g>
    </g>
  );
};
