// V3: where the downwash meets the surface below. The air reaches the surface a moment after leaving the ducts, so in
// forward flight the disturbed patch sits behind the board. On water: a darker roughened patch and short choppy
// cat's-paw crests spreading out from it, with spray when the board is low. On the ground: dust puffs pushed outward
// and grit. No rings. Strength falls with height (it is gone well before 11 m).
import React from 'react';
import {hash, noise1} from '../dc/math';
import {f2, polyD} from '../eng/draw';
import {d3, Lens, m3, s3, V3, v3, a3} from '../eng/v3';

export const Wash: React.FC<{id: string; L: Lens; at: V3; alt: number; thrust: number; t: number; vel?: V3; surface?: 'water' | 'ground'; foam?: number; soft?: boolean}> = ({id, L, at, alt, thrust, t, vel = v3(0, 0, 0), surface = 'water', foam = 0, soft = false}) => {
  const k = thrust * Math.pow(Math.max(0, Math.min(1, 1 - (alt - 0.3) / 10.5)), 1.2);
  if (k < 0.02) return null;
  // V5 (soft): the patch centres where the swept-back jets actually reach the surface (AirJets' jet speed)
  const lagT = soft ? alt / (13 + 6 * thrust) : alt / 12;
  const c = a3(v3(at.x, 0.02, at.z), m3(v3(vel.x, 0, vel.z), -lagT));
  if (d3(s3(c, L.pos), L.f) < 0.6) return null;
  const R = 0.9 + alt * 0.32;
  const sp = Math.hypot(vel.x, vel.z);
  const ux = sp > 0.1 ? vel.x / sp : 1, uz = sp > 0.1 ? vel.z / sp : 0;
  const stretch = 1 + sp * 0.12;
  // a point in the patch frame: along the travel (stretched behind) and across it
  const P = (a: number, r: number) => {
    let along = Math.cos(a) * r, across = Math.sin(a) * r;
    if (along < 0) along *= stretch;
    return v3(c.x + ux * along - uz * across, c.y, c.z + uz * along + ux * across);
  };
  const blob: V3[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    blob.push(P(a, R * (1 + 0.18 * noise1(a * 1.3 + t * 0.6, 71))));
  }
  const blobP = blob.map((q) => L.p(q));
  const kc = L.p(c).k;
  if (surface === 'water') {
    const paws: string[] = [];
    const spray: React.ReactNode[] = [];
    for (let i = 0; i < 46; i++) {
      const a = hash(i, 72) * Math.PI * 2;
      const ph = (t * (0.9 + 0.5 * hash(i, 73)) + hash(i, 74)) % 1;
      const r = R * (0.35 + 1.5 * ph);
      const q = P(a, r);
      if (d3(s3(q, L.pos), L.f) < 0.5) continue;
      // a short crest across the outward direction, with a kink
      const t0 = P(a - 0.12 / (0.5 + ph), r), t1 = P(a + 0.12 / (0.5 + ph), r * 1.02);
      const m = P(a + 0.02, r * 1.06);
      const pa = L.p(t0), pm = L.p(m), pb = L.p(t1);
      const op = (1 - ph) * k;
      if (op < 0.05) continue;
      paws.push(`M${f2(pa.x)},${f2(pa.y)}L${f2(pm.x)},${f2(pm.y)}L${f2(pb.x)},${f2(pb.y)}`);
    }
    if (alt < 3.2 + 2.2 * foam) {
      for (let i = 0; i < 24; i++) {
        const a = hash(i, 75) * Math.PI * 2;
        const ph = (t * 1.4 + hash(i, 76)) % 1;
        const q0 = P(a, R * (0.6 + ph * 0.9));
        const q = v3(q0.x, 0.05 + Math.sin(ph * Math.PI) * 0.5 * Math.max(0.3, 1 - alt / (3.5 + 2.2 * foam)), q0.z);
        if (d3(s3(q, L.pos), L.f) < 0.4) continue;
        const p = L.p(q);
        spray.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(Math.max(0.6, 0.03 * p.k))} fill="#FFFFFF" opacity={0.6 * k * (1 - ph)} />);
      }
    }
    // V5: the churned patch has soft edges (a hard-edged pale shape read as a rock under the water)
    const sd = Math.max(2, Math.min(36, 0.22 * kc));
    return (
      <g>
        <defs>
          <filter id={`${id}-wb`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={f2(sd)} />
          </filter>
        </defs>
        <g filter={soft ? `url(#${id}-wb)` : undefined}>
          <path d={polyD(blobP)} fill="#24585A" opacity={(soft ? 0.42 : 0.3) * k} />
          {foam > 0 && <path d={polyD(blobP)} fill="#CFEDE6" opacity={(soft ? 0.45 : 0.32) * k * foam} />}
        </g>
        <path d={paws.join('')} stroke="#EEF9F6" strokeWidth={f2(Math.max(0.7, Math.min(3, 0.03 * kc)))} strokeOpacity={Math.min(1, 0.55 * k * (1 + 0.8 * foam))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {spray}
      </g>
    );
  }
  // ground: dust pushed out from under the board
  const puffs: React.ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const a = hash(i, 77) * Math.PI * 2;
    const ph = (t * (0.7 + 0.4 * hash(i, 78)) + hash(i, 79)) % 1;
    const q0 = P(a, R * (0.4 + 1.6 * ph));
    const q = v3(q0.x, 0.12 + 0.35 * ph, q0.z);
    if (d3(s3(q, L.pos), L.f) < 0.4) continue;
    const p = L.p(q);
    puffs.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2((0.12 + 0.28 * ph) * p.k)} fill="#D9C9A6" opacity={0.22 * k * (1 - ph)} />);
  }
  const grit: string[] = [];
  for (let i = 0; i < 30; i++) {
    const a = hash(i, 80) * Math.PI * 2;
    const ph = (t * 1.8 + hash(i, 81)) % 1;
    const q = P(a, R * (0.5 + 1.4 * ph));
    if (d3(s3(q, L.pos), L.f) < 0.4) continue;
    const p = L.p(v3(q.x, 0.03 + 0.1 * Math.sin(ph * Math.PI), q.z));
    const r = Math.max(0.6, 0.012 * p.k);
    grit.push(`M${f2(p.x - r)},${f2(p.y)}a${f2(r)},${f2(r)} 0 1,0 ${f2(2 * r)},0a${f2(r)},${f2(r)} 0 1,0 ${f2(-2 * r)},0`);
  }
  return (
    <g>
      <defs>
        <filter id={`${id}-db`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path d={polyD(blobP)} fill="#A2916F" opacity={0.18 * k} />
      <g filter={`url(#${id}-db)`}>{puffs}</g>
      <path d={grit.join('')} fill="#7E6E52" opacity={0.7 * k} />
    </g>
  );
};
