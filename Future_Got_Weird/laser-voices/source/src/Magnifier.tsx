// Beat C: a local magnification of the air just outside her ear. It opens from that point (a callout ring with two
// leader lines back to it), so the ear rim stays in view beside it, and closes back into the same point. Inside, one
// cause-and-effect sequence, drawn once:
//   light packet arrives along the path -> a water molecule absorbs it -> it heats (a brief warm glow) -> the air
//   around it expands slightly (a compression ring, neighbouring particles nudged outward) -> smooth teal pressure
//   fronts travel to the ear's surface (a few more pulses repeat the cycle quickly, as a modulated beam would).
// Local frame: x along the beam's screen direction, unit = the ring's radius. The ear lies in the direction `toEar`.
import React from 'react';
import {clamp, hash, inv, lerp, noise1, smooth} from './lib/math';
import {fmt} from './p3';
import {INK} from './lib/ink';
import {C} from './Room';
import {arcD} from './Overlay';

export type MagCue = {open0: number; open1: number; close0: number; close1: number; packet0: number; hit: number; heat1: number; expand: number; waves: number};

export const Magnifier: React.FC<{t: number; anchor: {x: number; y: number}; center: {x: number; y: number}; R: number; beamAng: number; earAng: number; cue: MagCue}> = ({t, anchor, center, R, beamAng, earAng, cue}) => {
  const open = smooth(clamp(inv(cue.open0, cue.open1, t))) * (1 - smooth(clamp(inv(cue.close0, cue.close1, t))));
  if (open <= 0.002) return null;
  const cx = lerp(anchor.x, center.x, open), cy = lerp(anchor.y, center.y, open);
  const r = R * open;
  // local -> screen
  const ca = Math.cos(beamAng), sa = Math.sin(beamAng);
  const S = (x: number, y: number) => ({x: cx + (x * ca - y * sa) * r, y: cy + (x * sa + y * ca) * r});
  const earLocal = earAng - beamAng; // direction to the ear in local coordinates
  const ex = Math.cos(earLocal), ey = Math.sin(earLocal);
  const target = {x: 0.02, y: 0.03};
  // ---- timeline
  const pk = clamp(inv(cue.packet0, cue.hit, t)); // first packet's travel
  const heat = t < cue.hit ? 0 : Math.min(1, (t - cue.hit) / Math.max(0.1, cue.heat1 - cue.hit)) * (1 - smooth(clamp(inv(cue.expand + 0.3, cue.expand + 1.2, t))));
  const exp = clamp(inv(cue.expand, cue.expand + 0.8, t)); // expansion ring progress
  // later pulses (quick repeats): packet arrival times
  const pulses = [cue.hit, cue.waves + 0.0, cue.waves + 0.55, cue.waves + 1.1];
  const sc = (k: number) => k * r;
  // ---- leader lines from the anchor to the ring (tangent points)
  const dx = cx - anchor.x, dy = cy - anchor.y, dd = Math.hypot(dx, dy);
  const leaders = dd > r + 4 ? (() => {
    const base = Math.atan2(dy, dx), off = Math.acos(clamp(r / dd));
    const t1 = {x: cx - r * Math.cos(base - off), y: cy - r * Math.sin(base - off)};
    const t2 = {x: cx - r * Math.cos(base + off), y: cy - r * Math.sin(base + off)};
    return (
      <g opacity={0.9}>
        <path d={`M${fmt(anchor.x)},${fmt(anchor.y)} L${fmt(t1.x)},${fmt(t1.y)} M${fmt(anchor.x)},${fmt(anchor.y)} L${fmt(t2.x)},${fmt(t2.y)}`} stroke="#FFFFFF" strokeWidth={3} />
        <path d={`M${fmt(anchor.x)},${fmt(anchor.y)} L${fmt(t1.x)},${fmt(t1.y)} M${fmt(anchor.x)},${fmt(anchor.y)} L${fmt(t2.x)},${fmt(t2.y)}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
        <circle cx={fmt(anchor.x)} cy={fmt(anchor.y)} r={10} fill="none" stroke="#FFFFFF" strokeWidth={3} />
      </g>
    );
  })() : null;
  // ---- particles: faint air molecules (N2/O2 as small pairs) and a few clearly drawn water molecules
  const air: React.ReactNode[] = [];
  const push = (px: number, py: number) => {
    // the expansion nudges neighbours outward from the target
    const ddx = px - target.x, ddy = py - target.y, dr = Math.hypot(ddx, ddy) || 1;
    const wave = exp > 0 && exp < 1 ? Math.exp(-((dr - exp * 0.9) ** 2) / 0.01) * 0.05 * (1 - exp) : 0;
    const swell = heat * 0.04 * Math.exp(-dr * dr / 0.08);
    return {x: px + (ddx / dr) * (wave + swell), y: py + (ddy / dr) * (wave + swell)};
  };
  for (let i = 0; i < 46; i++) {
    let px = hash(i, 3) * 2 - 1, py = hash(i, 7) * 2 - 1;
    if (px * px + py * py > 0.95) continue;
    if (Math.hypot(px - target.x, py - target.y) < 0.12) continue;
    px += 0.03 * noise1(t * 0.9 + i * 3.1, 11); py += 0.03 * noise1(t * 0.8 + i * 1.7, 13);
    const q = push(px, py);
    const p = S(q.x, q.y);
    const rot = hash(i, 9) * Math.PI;
    const d = sc(0.018);
    air.push(
      <g key={`a${i}`} opacity={0.55}>
        <circle cx={fmt(p.x + Math.cos(rot) * d)} cy={fmt(p.y + Math.sin(rot) * d)} r={fmt(sc(0.017))} fill="#B9C3C9" />
        <circle cx={fmt(p.x - Math.cos(rot) * d)} cy={fmt(p.y - Math.sin(rot) * d)} r={fmt(sc(0.017))} fill="#B9C3C9" />
      </g>,
    );
  }
  const water = [target, {x: -0.55, y: -0.42}, {x: -0.38, y: 0.5}, {x: 0.44, y: -0.52}, {x: 0.5, y: 0.46}, {x: -0.72, y: 0.12}];
  const H2O = (i: number, px: number, py: number, glow: number) => {
    const q = i === 0 ? {x: px, y: py} : push(px + 0.02 * noise1(t + i * 5, 21), py + 0.02 * noise1(t + i * 7, 23));
    const p = S(q.x, q.y);
    const rot = (hash(i, 31) - 0.5) * 1.4 + (i === 0 ? 0.25 * heat * Math.sin(t * 40) : 0.15 * noise1(t * 0.7 + i, 41));
    const R0 = sc(0.05), RH = sc(0.03), bond = sc(0.06);
    const hA = {x: p.x + Math.cos(rot - 0.9) * bond, y: p.y + Math.sin(rot - 0.9) * bond};
    const hB = {x: p.x + Math.cos(rot + 0.9) * bond, y: p.y + Math.sin(rot + 0.9) * bond};
    return (
      <g key={`w${i}`}>
        {glow > 0.01 && <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(sc(0.16) * (0.6 + 0.6 * glow))} fill="url(#magHeat)" opacity={glow} />}
        <circle cx={fmt(hA.x)} cy={fmt(hA.y)} r={fmt(RH)} fill="#F4F6F8" stroke={INK} strokeWidth={1.6} />
        <circle cx={fmt(hB.x)} cy={fmt(hB.y)} r={fmt(RH)} fill="#F4F6F8" stroke={INK} strokeWidth={1.6} />
        <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(R0)} fill={glow > 0.01 ? lerpHex('#4F8FB0', '#F2A93B', glow * 0.7) : '#4F8FB0'} stroke={INK} strokeWidth={1.8} />
        <circle cx={fmt(p.x - R0 * 0.35)} cy={fmt(p.y - R0 * 0.35)} r={fmt(R0 * 0.28)} fill="#FFFFFF" opacity={0.6} />
      </g>
    );
  };
  // ---- light packets along the beam (local x axis through the target), absorbed on arrival
  const packets: React.ReactNode[] = [];
  pulses.forEach((ta, k) => {
    const dur = k === 0 ? cue.hit - cue.packet0 : 0.38;
    const u = clamp(1 - (ta - t) / dur);
    if (t < ta - dur || t > ta + 0.12) return;
    const x = lerp(-1.05, target.x - 0.06, k === 0 ? pk : u);
    const fade = t > ta ? 1 - (t - ta) / 0.12 : 1;
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const xx = x - 0.22 + (0.22 * i) / 24;
      const env = Math.sin((Math.PI * i) / 24);
      const yy = target.y + 0.035 * env * Math.sin(i * 1.9 - t * 30);
      const p = S(xx, yy);
      pts.push(`${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`);
    }
    packets.push(<path key={`p${k}`} d={pts.join('')} fill="none" stroke={C.amber} strokeWidth={fmt(Math.max(2.5, sc(0.016)))} strokeLinecap="round" opacity={fade} />);
  });
  // the dashed beam line through the field (the same convention as outside)
  const b0 = S(-1.1, target.y), b1 = S(target.x - 0.04, target.y);
  // ---- pressure: the expansion ring, then fronts travelling toward the ear (drawn on the ear-facing side only)
  const fronts: React.ReactNode[] = [];
  const earAngDeg = (Math.atan2(ey, ex) * 180) / Math.PI + (beamAng * 180) / Math.PI;
  const tc = S(target.x, target.y);
  const frontAt = (t0: number, key: string, strength: number) => {
    const age = t - t0;
    if (age < 0 || age > 1.6) return;
    const rr = 0.08 + age * 0.62;
    if (rr > 0.98) return;
    const op = strength * (1 - clamp((rr - 0.6) / 0.38)) * clamp(age / 0.12);
    fronts.push(<path key={key} d={arcD(tc.x, tc.y, sc(rr), earAngDeg, 58)} fill="none" stroke={C.teal} strokeWidth={fmt(sc(0.05))} strokeLinecap="round" opacity={op * 0.75} />);
    fronts.push(<path key={key + 'b'} d={arcD(tc.x, tc.y, sc(rr), earAngDeg, 58)} fill="none" stroke="#E8FFFB" strokeWidth={fmt(sc(0.012))} strokeLinecap="round" opacity={op * 0.8} />);
  };
  if (exp > 0 && exp < 1) {
    // the initial expansion: a faint full ring of compressed air around the warmed molecule
    const er = sc(0.1 + exp * 0.35);
    fronts.push(<circle key="exp" cx={fmt(tc.x)} cy={fmt(tc.y)} r={fmt(er)} fill="none" stroke={C.teal} strokeWidth={fmt(sc(0.03))} opacity={0.5 * (1 - exp)} />);
  }
  frontAt(cue.expand + 0.25, 'f0', 1);
  pulses.slice(1).forEach((ta, k) => frontAt(ta + 0.12, `f${k + 1}`, 0.9));
  // later pulses: the same warm flash, brief
  const flash = pulses.slice(1).reduce((m, ta) => Math.max(m, t > ta ? Math.max(0, 1 - (t - ta) / 0.35) : 0), 0);
  // ---- the ear's surface at the ring's ear-facing edge (skin), so the destination is in the picture
  const skin = (() => {
    const pts: string[] = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = earLocal + ((i / n) - 0.5) * 1.6;
      const rr = 0.86 + 0.05 * Math.cos((i / n - 0.5) * Math.PI * 2);
      const p = S(Math.cos(a) * rr, Math.sin(a) * rr);
      pts.push(`${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`);
    }
    for (let i = n; i >= 0; i--) {
      const a = earLocal + ((i / n) - 0.5) * 1.6;
      const p = S(Math.cos(a) * 1.2, Math.sin(a) * 1.2);
      pts.push(`L${fmt(p.x)},${fmt(p.y)}`);
    }
    return pts.join('') + 'Z';
  })();
  const label = clamp(inv(cue.open1 - 0.1, cue.open1 + 0.25, t)) * (1 - clamp(inv(cue.hit + 0.6, cue.hit + 1.0, t)));
  const lp = S(target.x + 0.02, target.y + 0.2);
  return (
    <g>
      {leaders}
      <defs>
        <clipPath id="magClip">
          <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} />
        </clipPath>
        <radialGradient id="magBg" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FBFAF6" />
          <stop offset="1" stopColor="#E6EDEF" />
        </radialGradient>
        <radialGradient id="magHeat">
          <stop offset="0" stopColor="#FFD27A" stopOpacity={0.95} />
          <stop offset="0.5" stopColor={C.amber} stopOpacity={0.45} />
          <stop offset="1" stopColor={C.coral} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={fmt(cx)} cy={fmt(cy + 8)} r={fmt(r + 6)} fill="#000" opacity={0.18} />
      <g clipPath="url(#magClip)">
        <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fill="url(#magBg)" />
        <path d={skin} fill="#E9B68F" stroke={INK} strokeWidth={2} />
        <path d={`M${fmt(b0.x)},${fmt(b0.y)} L${fmt(b1.x)},${fmt(b1.y)}`} stroke={C.amber} strokeWidth={4} strokeDasharray="16 11" strokeDashoffset={fmt(-t * 70)} opacity={0.75} />
        {air}
        {fronts}
        {water.map((p, i) => H2O(i, p.x, p.y, i === 0 ? Math.max(heat, flash * 0.8) : 0))}
        {packets}
        {label > 0.01 && (
          <g opacity={label}>
            <rect x={fmt(lp.x - 42)} y={fmt(lp.y - 22)} width={84} height={40} rx={20} fill="#132430" opacity={0.85} />
            <text x={fmt(lp.x)} y={fmt(lp.y + 9)} textAnchor="middle" fontFamily='"Nunito Variable", system-ui' fontWeight={900} fontSize={26} fill="#FFFFFF">H₂O</text>
          </g>
        )}
      </g>
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fill="none" stroke="#FFFFFF" strokeWidth={7} />
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(r + 3.5)} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.6} />
    </g>
  );
};

const lerpHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('');
};
