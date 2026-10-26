// V4: the laser packets on the beam, drawn as v3/Scene3.tsx Beam3D draws them (a cyan glow stroke round a cyan-white
// core, Beam3D's near-lens fade), optionally with v3/Open3_fx.tsx PulseBloom's soft bloom, plus two controls V3 lacks:
//   - size: a packet's size against V3's near the telescope. V3's packets are 4.4 m long and their glow and bloom are
//     metres across (clamped to a minimum screen size), so beside the physically sized 2.3 m telescope and the summit
//     station they read as glowing capsules the size of the building (V4 review ST-2, ST-8). Here a packet leaves the
//     exit window in proportion to the tube (about 0.6 m long, its glow inside the 0.6 m aperture) and grows to V3's
//     size by ~50 m up the beam; the minimum screen sizes shrink with it;
//   - dim: a per-packet opacity factor (F uses it to keep packets from sliding through the lit bolt where it joins the
//     rod tip, V4 review F4-7).
// With size 1 and dim 1 everywhere it draws exactly what Beam3D (and PulseBloom) draw.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, projector} from '../v2/p3';
import {PAL} from '../v3/palette';
import {EXIT_H} from '../world/site';

/** V3's packet length (site px along the axis) and the top of the drawn beam (Beam3D's hTop, G + 700) */
const LEN = 26, H_TOP = 1000;
const grow = (h: number) => ss(h - EXIT_H, 6, 300);
/** the packet's length and width factors against V3's at axis height h */
export const pktSizeL = (h: number) => 0.15 + 0.85 * grow(h);
export const pktSizeW = (h: number) => 0.12 + 0.88 * grow(h);

export const Packets4: React.FC<{cam: Cam3; pulses: number[]; alpha: number; bloom?: number; dim?: (h: number) => number; id: string}> = ({cam, pulses, alpha, bloom = 0, dim, id}) => {
  if (alpha <= 0.002 || !pulses.length) return null;
  const P = projector(cam);
  const f = cam.f;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {bloom > 0 && (
        <defs>
          <radialGradient id={`${id}-pb`}>
            <stop offset="0" stopColor={PAL.packet} stopOpacity={0.75} />
            <stop offset="0.35" stopColor={PAL.laser} stopOpacity={0.32} />
            <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
          </radialGradient>
        </defs>
      )}
      {pulses.map((h, i) => {
        if (h < EXIT_H || h > H_TOP) return null;
        const dk = dim ? clamp(dim(h)) : 1;
        if (dk <= 0.01) return null;
        const k = pktSizeL(h), kw = pktSizeW(h);
        const p0 = P(axis3(Math.max(EXIT_H, h - LEN * k))), p1 = P(axis3(h));
        if (!p0.ok || !p1.ok) return null;
        const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        // packets passing close to the lens would smear into huge capsules: fade those out (Beam3D's rule, scaled)
        const near = clamp(1 - (L - 110 / k) / 120);
        if (near <= 0.02) return null;
        const w = clamp((f * 1.4 * kw) / p1.z, 3 * kw, 12 / kw);
        const o = alpha * near * dk;
        const ob = bloom * near * dk * clamp((h - EXIT_H) / (LEN * k)); // the bloom grows out of the exit window
        const r = clamp((f * 2.6 * kw) / p1.z, 8 * kw, 64 / kw);
        const ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
        const cx = (p0.x + p1.x) / 2, cy = (p0.y + p1.y) / 2;
        return (
          <g key={i}>
            <g opacity={fmt(o)}>
              <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.laserGlow} strokeOpacity={0.45} strokeWidth={fmt(w * 2.4)} strokeLinecap="round" />
              <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.packet} strokeWidth={fmt(w * 0.7)} strokeLinecap="round" />
            </g>
            {ob > 0.01 && <ellipse cx={fmt(cx)} cy={fmt(cy)} rx={fmt(r + L * 0.6)} ry={fmt(r)} transform={`rotate(${fmt(ang)} ${fmt(cx)} ${fmt(cy)})`} fill={`url(#${id}-pb)`} opacity={fmt(ob)} />}
          </g>
        );
      })}
    </g>
  );
};
