// The mechanism, in the air just beside the lead's exposed ear (head units, the same coordinates as the head, so the
// camera keeps the ear rim and the jaw line in view while it enlarges the air around them: no inset, no labels).
// V3: one connected illustration with a clear focal hierarchy.
//   9.2-9.9    the room behind him settles into the colour of the air (the head stays lit) and the air's molecules
//              resolve as the zoom passes their (stylised) scale: N2, O2 and a few H2O, sparse and calm.
//   9.99-10.76 one infrared packet (amber) arrives along the path and is absorbed by one water molecule (10.76 tick).
//   10.8-12.05 a brief, contained energy change: the molecule flashes warm, then jostles; two or three neighbours
//              pick up the motion.
//   12.3       the warmed pocket expands and pushes its neighbours out (12.3 puff) ...
//   12.42-14.7 ... and the compressions travel to the ear as a few pressure fronts: drawn as bands of crowded
//              molecules with a faint teal shading (pressure), never as rings of molecules. The canal takes them in.
import React from 'react';
import {Pt, P, Mat, matStr, clamp, lerp, inv, ramp, eout, rnd, f3} from './lib3';
import {AIR, LIGHT, C} from './theme3';
import {EAR_OPEN, HEAD_PTS, HAIR_PTS} from './art/LeadHead';

const ABS_D = 122; // absorber distance from the canal entrance, back along the incoming path (head units)
export const MECH = {
  tPacket: 9.99, tHit: 10.76, tHeat: [10.85, 12.05], tExpand: 12.3, fronts: [12.42, 12.98, 13.54], speed: 78,
  haze: [9.2, 9.9, 14.85, 15.45],
};
export const absorberAt = (dirDeg: number): Pt => {
  const r = (dirDeg * Math.PI) / 180;
  return P(EAR_OPEN.x - Math.cos(r) * ABS_D, EAR_OPEN.y - Math.sin(r) * ABS_D);
};
const inPoly = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
// keep molecules out of the head, hair, ear, neck and shirt (with a small margin)
const outside = (p: Pt) => {
  const m = 9;
  for (const [dx, dy] of [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]]) {
    const q = P(p.x + dx, p.y + dy);
    if (inPoly(q, HEAD_PTS) || inPoly(q, HAIR_PTS)) return false;
    if ((q.x + 164) ** 2 / 44 ** 2 + (q.y - 36) ** 2 / 70 ** 2 < 1) return false; // ear
    if (q.y > 160 && q.x > -100 && q.x < 70) return false; // neck
    if (q.y > 250 && q.x > -215 && q.x < 185) return false; // shoulders and shirt
  }
  return true;
};
type Mol = {p: Pt; kind: 0 | 1 | 2; a: number; ph: number};
const molsFor = (tgt: Pt): Mol[] => {
  const out: Mol[] = [];
  let i = 0;
  for (let y = -260; y <= 520; y += 31) for (let x = -560; x <= 120; x += 31) {
    i++;
    const p = P(x + (rnd(i * 1.7) - 0.5) * 16, y + (rnd(i * 2.9) - 0.5) * 16);
    if (!outside(p)) continue;
    if (Math.hypot(p.x - tgt.x, p.y - tgt.y) < 20) continue;
    const r = rnd(i * 5.3);
    out.push({p, kind: r < 0.72 ? 0 : r < 0.93 ? 1 : 2, a: rnd(i * 7.7) * 360, ph: rnd(i * 3.1) * 100});
  }
  out.push({p: tgt, kind: 2, a: 20, ph: 0});
  return out;
};
let cache: {key: string; mols: Mol[]} | null = null;

export const hazeAt = (t: number) => clamp(Math.min(inv(MECH.haze[0], MECH.haze[1], t), 1 - inv(MECH.haze[2], MECH.haze[3], t)));

export const Mechanism: React.FC<{t: number; zHead: number; mat: Mat; dirDeg: number}> = ({t, zHead, mat, dirDeg}) => {
  const hz = hazeAt(t);
  const lod = clamp(inv(2.6, 4.6, zHead));
  const vis = Math.min(hz, lod);
  if (vis <= 0.002) return null;
  const TGT = absorberAt(dirDeg);
  const key = `${Math.round(TGT.x)}:${Math.round(TGT.y)}`;
  if (!cache || cache.key !== key) cache = {key, mols: molsFor(TGT)};
  const MOLS = cache.mols;
  const sw = Math.max(1.4 / zHead, 0.25);
  const dr = (dirDeg * Math.PI) / 180, dc = Math.cos(dr), ds = Math.sin(dr);
  const front = (i: number) => (t - MECH.fronts[i]) * MECH.speed;
  const toEar = Math.hypot(EAR_OPEN.x - TGT.x, EAR_OPEN.y - TGT.y);
  // packet
  const pk = clamp(inv(MECH.tPacket, MECH.tHit, t));
  const dist = (1 - pk) * 190;
  const head = P(TGT.x - dc * dist, TGT.y - ds * dist);
  const pkA = t >= MECH.tPacket - 0.05 && t < MECH.tHit + 0.1 ? 1 - clamp((t - MECH.tHit) / 0.1) : 0;
  const hit = t >= MECH.tHit ? Math.exp(-(t - MECH.tHit) / 0.32) : 0; // the contained flash
  const heat = (d: number) => {
    const spread = lerp(0, 46, ramp(MECH.tHeat[0], MECH.tHeat[1], t, eout));
    const core = t >= MECH.tHit ? Math.exp(-((d / Math.max(3, spread)) ** 2)) : 0;
    return core * (1 - 0.7 * ramp(13.0, 14.4, t));
  };
  const displace = (p: Pt): Pt => {
    const dx = p.x - TGT.x, dy = p.y - TGT.y, d = Math.hypot(dx, dy) || 1;
    let s = ramp(MECH.tExpand - 0.08, MECH.tExpand + 0.4, t, eout) * Math.exp(-((d / 44) ** 2)) * 13;
    MECH.fronts.forEach((_, i) => {
      const R = front(i);
      if (R > 0) s += 13 * Math.exp(-(((d - R) / 18) ** 2)) * Math.exp(-R / 300);
    });
    return P(p.x + (dx / d) * s, p.y + (dy / d) * s);
  };
  const arrive = MECH.fronts.reduce((m, _, i) => Math.max(m, Math.exp(-(((front(i) - toEar) / 14) ** 2))), 0);
  const out: React.ReactNode[] = [];
  MOLS.forEach((m, i) => {
    const isT = i === MOLS.length - 1;
    const d0 = Math.hypot(m.p.x - TGT.x, m.p.y - TGT.y);
    const hot = isT ? Math.max(heat(0), hit) : heat(d0) * (d0 < 70 ? 1 : 0);
    const q = displace(m.p);
    // focal hierarchy: the interaction and the route to the ear are full strength, the periphery recedes
    const dl = Math.abs((m.p.x - TGT.x) * -ds + (m.p.y - TGT.y) * dc); // distance from the path line
    const focus = isT ? 1 : clamp(1 - Math.max(0, Math.min(d0, Math.hypot(m.p.x - EAR_OPEN.x, m.p.y - EAR_OPEN.y), dl + 40) - 70) / 180, 0.38, 1);
    const jig = 1.6 + 5.5 * hot, spd = 1 + 3 * hot;
    const p = P(q.x + jig * Math.sin(t * 1.2 * spd + m.ph), q.y + jig * Math.cos(t * 1.0 * spd + m.ph * 1.3));
    const ang = m.a + 22 * Math.sin(t * 0.6 * spd + m.ph) + 110 * hot * Math.sin(t * 7 + m.ph);
    out.push(
      <g key={i} transform={`translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(ang)})`} opacity={focus}>
        {hot > 0.15 && (
          <g opacity={clamp(hot)} transform={`rotate(${f3(-ang + 25 * Math.sin(t * 9 + m.ph))})`}>
            <path d="M-11 -4 Q-13.5 0 -11 4 M11 -4 Q13.5 0 11 4" fill="none" stroke={AIR.bandCream} strokeWidth={Math.max(sw * 1.8, 1)} strokeLinecap="round" />
          </g>
        )}
        {m.kind === 2 ? (() => {
          const st = 1 + (isT && hit > 0 ? 0.3 * hit * Math.sin(t * 40) : 0);
          return (
            <g>
              {isT && hit > 0.02 && <circle cx={0} cy={0} r={10 + 12 * (1 - hit)} fill={AIR.warm} opacity={0.5 * hit} />}
              <circle cx={-5.4 * st} cy={4 * st} r={3} fill={AIR.h} stroke={C.ink} strokeWidth={sw} />
              <circle cx={5.4 * st} cy={4 * st} r={3} fill={AIR.h} stroke={C.ink} strokeWidth={sw} />
              <circle cx={0} cy={0} r={4.9} fill={hot > 0.3 ? AIR.hot : AIR.o} stroke={C.ink} strokeWidth={sw} />
            </g>
          );
        })() : (
          <g>
            <circle cx={-2.1} cy={0} r={3.3} fill={m.kind === 0 ? AIR.n2 : AIR.o2} stroke={C.ink} strokeWidth={sw} />
            <circle cx={2.1} cy={0} r={3.3} fill={m.kind === 0 ? AIR.n2 : AIR.o2} stroke={C.ink} strokeWidth={sw} />
          </g>
        )}
      </g>,
    );
  });
  // the packet: an amber wave train along the path
  const packet = pkA > 0.003 ? (() => {
    const pts: string[] = [];
    for (let k = 0; k <= 70; k++) {
      const u = k / 70, along = -70 * (1 - u), env = Math.sin(Math.PI * u) ** 0.7;
      const off = 5.5 * env * Math.sin((along / 13) * 2 * Math.PI - t * 30);
      pts.push(`${f3(head.x + dc * along - ds * off)} ${f3(head.y + ds * along + dc * off)}`);
    }
    return (
      <g opacity={pkA}>
        <path d={'M' + pts.join('L')} fill="none" stroke={LIGHT.irGlow} strokeWidth={Math.max(sw * 5, 7)} strokeLinecap="round" opacity={0.35} />
        <path d={'M' + pts.join('L')} fill="none" stroke={LIGHT.ir} strokeWidth={Math.max(sw * 2.4, 3)} strokeLinecap="round" />
      </g>
    );
  })() : null;
  const warmA = (t > MECH.tHit ? 0.38 : 0) * (1 - ramp(12.6, 13.6, t));
  const warmR = lerp(10, 40, ramp(MECH.tHeat[0], MECH.tHeat[1], t, eout)) * (1 + 0.5 * ramp(MECH.tExpand - 0.1, MECH.tExpand + 0.5, t, eout));
  return (
    <g transform={matStr(mat)} opacity={vis}>
      <defs>
        <radialGradient id="mech3-warm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={AIR.warm} stopOpacity={0.7} />
          <stop offset="0.6" stopColor={AIR.hot} stopOpacity={0.25} />
          <stop offset="1" stopColor={AIR.hot} stopOpacity={0} />
        </radialGradient>
      </defs>
      {warmA > 0 && <circle cx={TGT.x} cy={TGT.y} r={warmR * 1.5} fill="url(#mech3-warm)" opacity={warmA} />}
      {/* pressure: soft teal shading riding each front (kept faint; the molecules carry the compression) */}
      {MECH.fronts.map((_, i) => {
        const R = front(i);
        if (R <= 0 || R > 340) return null;
        const a = Math.exp(-R / 230) * (1 - ramp(14.4, 14.9, t));
        return <circle key={i} cx={TGT.x} cy={TGT.y} r={R} fill="none" stroke={AIR.band} strokeWidth={26} opacity={0.08 * a} />;
      })}
      {out}
      {packet}
      {/* the canal entrance takes the sound in */}
      <ellipse cx={EAR_OPEN.x} cy={EAR_OPEN.y} rx={9} ry={12} fill={AIR.band} opacity={0.55 * arrive} />
    </g>
  );
};
