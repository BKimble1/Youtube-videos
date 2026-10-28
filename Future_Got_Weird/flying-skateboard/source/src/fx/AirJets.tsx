// V3: the air leaving the ten ducts. Each duct exit sheds thin, short-lived wisps that travel down the jet. The jet's
// direction is the duct axis (down from the deck) combined with the relative wind, so in fast forward flight the
// columns sweep back behind the board. A little swirl near the exit (the fan's rotation, decaying downstream) and a
// sideways wander that grows with distance (turbulent mixing) keep the wisps from reading as rays or rings. Faint,
// moving, and gone within a couple of metres.
import React from 'react';
import {BD, ductWorld} from '../art/Board';
import {hash, noise1} from '../dc/math';
import {f2} from '../eng/draw';
import {a3, c3, d3, Frame, Lens, m3, n3, s3, V3, v3} from '../eng/v3';

export const AirJets: React.FC<{L: Lens; B: Frame; t: number; thrust: number; vel?: V3; reach?: number; alpha?: number; dense?: number; speed?: number; bias?: number}> = ({L, B, t, thrust, vel = v3(0, 0, 0), reach = 1.3, alpha = 1, dense = 0, speed = 1, bias = 0}) => {
  if (thrust < 0.05 || alpha < 0.01) return null;
  const jetV = 13 + 6 * thrust;
  const dir = n3(a3(m3(B.y, -jetV), m3(vel, -1)));
  // two directions across the jet for the wander
  const sx = n3(c3(dir, Math.abs(dir.y) > 0.9 ? B.x : v3(0, 1, 0)));
  const sz = n3(c3(dir, sx));
  const lines: Record<string, string[]> = {a: [], b: []};
  const len = reach * (0.55 + 0.45 * thrust);
  for (let i = 0; i < BD.ducts.length; i++) {
    const exit = ductWorld(B, i, -BD.thick);
    // V9: `bias` (-1..1) is the thrust difference across the board: the toe-side ducts (x > 0) blow harder for bias > 0
    const g = Math.max(0.35, Math.min(1.9, 1 + bias * Math.sign(BD.ducts[i][0])));
    const lenI = len * g;
    for (let k = 0; k < 3 + Math.round(3 * dense) + (g > 1.25 ? 3 : 0); k++) {
      const h = hash(i * 17 + k, 61);
      const ang0 = h * Math.PI * 2;
      const rr = BD.ductR * (0.3 + 0.55 * hash(i * 5 + k, 62));
      // (V5: `speed` < 1 slows the wisps where they are short and close: travelling further than their own width each
      // frame, they read as lines redrawn in new places)
      const ph = (t * (1.6 + 1.2 * thrust) * speed + h) % 1;
      const pts: string[] = [];
      let ok = true;
      for (let q = 0; q <= 6; q++) {
        const u = Math.min(1, ph * 1.25 - 0.25 + q * 0.035);
        if (u < 0) continue;
        const dist = u * lenI;
        const swirl = ang0 + (i % 2 ? -1 : 1) * (1.4 * Math.exp(-dist / 0.35)) * u * 3;
        const wander = 0.06 * dist * dist + 0.02;
        const off = a3(m3(sx, Math.cos(swirl) * rr * (1 + 0.5 * dist) + wander * noise1(t * 2.1 + i + k * 1.7 + dist, 63)), m3(sz, Math.sin(swirl) * rr * (1 + 0.5 * dist) + wander * noise1(t * 1.9 + i * 2 + k + dist, 64)));
        const p3 = a3(a3(exit, m3(dir, dist)), off);
        if (d3(s3(p3, L.pos), L.f) < 0.2) {
          ok = false;
          break;
        }
        const p = L.p(p3);
        pts.push(`${f2(p.x)},${f2(p.y)}`);
      }
      if (!ok || pts.length < 2) continue;
      (k % 2 ? lines.b : lines.a).push(`M${pts.join('L')}`);
    }
  }
  const kk = L.p(B.o).k;
  const w = Math.max(0.8, Math.min(3.2, 0.011 * kk));
  return (
    <g opacity={alpha * Math.min(1, thrust * 1.3)}>
      <path d={lines.a.join('')} stroke="#FFFFFF" strokeOpacity={0.3 + 0.3 * dense} strokeWidth={f2(w)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={lines.b.join('')} stroke="#D9EEF6" strokeOpacity={0.22 + 0.25 * dense} strokeWidth={f2(w * 0.7)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
};
