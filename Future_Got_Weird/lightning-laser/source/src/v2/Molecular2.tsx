// V2 molecular sequence (11.42-18.79), four distinct scenes in one continuous "micro world" (units: micro units,
// molecules ~130 apart; an infinite hashed field so the camera can travel):
//   M2 (11.42-12.33) side-on: one laser pulse races left to right through the air; the camera tracks it; the molecules
//       it passes lose electrons (they spark off and drift), leaving ions behind along a thin violet line.
//   M3 (12.33-13.33) close-up: the pulse's light field sweeps over two molecules; each electron cloud stretches and one
//       electron tears away with a spark: the molecule is now an ion (warm rim).
//   M4 (13.33-15.83) heating: in the column the pulse ionized, the molecules jostle faster and warm, then push outward;
//       the camera pulls back to show the result, a narrow, thinner (lower-density) channel running up the sky.
//   M5 (15.83-18.79) the discharge: a leader enters the channel from below and races up it while the camera tracks
//       alongside; side branches into ordinary air stall within a short distance; the camera pulls out as it runs on
//       (M6 then pulls out further, in 3D, to the beam above the tower).
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {sm5} from '../camera';
import {S} from './timeline2';

const INK = '#0D1A24';
type MCam = {x: number; y: number; z: number; roll?: number};
type Mol = {x: number; y: number; o2: boolean; th: number; ph: number; id: number; r1: number; r2: number};
type MS = {dx: number; dy: number; ion: number; heat: number; jig: number; spin?: number};
const SP = 130;

/** molecules of the hashed field that can be seen through `cam` (depth < 1 = farther layer, parallax) */
const visible = (cam: MCam, seed: number, depth = 1, pad = 1.15): Mol[] => {
  const z = cam.z * depth;
  const R = (Math.hypot(540, 960) * pad) / z;
  const cx = cam.x * depth, cy = cam.y * depth;
  const out: Mol[] = [];
  if ((2 * R / SP) ** 2 > 5200) return out; // too far to draw one by one: the caller shows FarAir instead
  const i0 = Math.floor((cx - R) / SP), i1 = Math.ceil((cx + R) / SP);
  const j0 = Math.floor((cy - R) / SP), j1 = Math.ceil((cy + R) / SP);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const id = (i * 7919 + j * 104729 + seed * 31) | 0;
    const x = (i + 0.15 + 0.7 * hash(id, 3)) * SP, y = (j + 0.15 + 0.7 * hash(id, 5)) * SP;
    if (Math.abs(x - cx) > R || Math.abs(y - cy) > R) continue;
    out.push({x: x / depth, y: y / depth, o2: hash(id, 7) < 0.21, th: 360 * hash(id, 9), ph: 6.283 * hash(id, 11), id, r1: hash(id, 13), r2: hash(id, 15)});
  }
  return out;
};
const camTr = (c: MCam) => `translate(540 960) rotate(${fmt(c.roll ?? 0)}) scale(${fmt(c.z)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`;

/** one molecule (two atoms + one orbiting electron unless ionized), with heat colour and an ion's warm rim */
const MolG: React.FC<{m: Mol; s: MS; t: number; z: number; detail?: number}> = ({m, s, t, z, detail = 1}) => {
  const jg = s.jig;
  const x = m.x + s.dx + jg * noise1(t * (1.6 + 3 * s.heat) + m.ph, m.id % 997), y = m.y + s.dy + jg * noise1(t * (1.4 + 3 * s.heat) + m.ph * 2, (m.id % 997) + 9);
  const th = ((m.th + (30 + 200 * s.heat) * t * (m.id % 2 ? 1 : -1)) * Math.PI) / 180;
  const c = Math.cos(th), sn = Math.sin(th);
  const r = m.o2 ? 17 : 18, d = m.o2 ? 13 : 14;
  const base = m.o2 ? '#E0806E' : '#86A9C9';
  const col = mix(base, '#FFB070', clamp(s.heat) * 0.85);
  if (z < 0.34 || detail < 0.5) {
    // far: one dot per molecule
    return <circle cx={fmt(x)} cy={fmt(y)} r={22} fill={col} opacity={0.3 + 0.55 * clamp(s.heat + s.ion)} />;
  }
  const ex = x + 34 * Math.cos(t * 2.6 + m.ph), ey = y + 24 * Math.sin(t * 2.6 + m.ph);
  return (
    <g>
      {s.ion > 0.01 && <circle cx={fmt(x)} cy={fmt(y)} r={44} fill="#FFB27A" opacity={0.4 * s.ion} />}
      {[-1, 1].map((k) => (
        <g key={k}>
          <circle cx={fmt(x + c * d * k)} cy={fmt(y + sn * d * k)} r={r} fill={col} stroke={s.ion > 0.5 ? '#FFCB9A' : INK} strokeWidth={3} />
          <circle cx={fmt(x + c * d * k - r * 0.3)} cy={fmt(y + sn * d * k - r * 0.32)} r={r * 0.34} fill="#FFFFFF" opacity={0.35} />
        </g>
      ))}
      {s.ion < 0.5 && <circle cx={fmt(ex)} cy={fmt(ey)} r={6} fill="#BFEFFF" stroke={INK} strokeWidth={2} opacity={1 - 2 * s.ion} />}
    </g>
  );
};

const Backdrop: React.FC<{cam: MCam; t: number; tint?: number}> = ({cam, t, tint = 0}) => {
  // a farther, dimmer layer of the same air (parallax), so the field reads as depth, not a flat pattern
  const far = visible(cam, 77, 0.55);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={mix('#111A28', '#1C1626', tint)} />
      <g transform={camTr({...cam, x: cam.x, y: cam.y, z: cam.z * 0.55})} opacity={0.32}>
        {far.map((m) => (
          <circle key={m.id} cx={fmt((m.x * 0.55) + 10 * noise1(t + m.ph, m.id % 97))} cy={fmt((m.y * 0.55) + 10 * noise1(t * 1.2 + m.ph, (m.id % 97) + 3))} r={14} fill={m.o2 ? '#A86A60' : '#5E7A94'} />
        ))}
      </g>
    </g>
  );
};

const spark = (x: number, y: number, k: number, s = 1) => {
  const L = 26 * s * (0.6 + 0.4 * k);
  return `M${fmt(x - L)},${fmt(y)} L${fmt(x + L)},${fmt(y)} M${fmt(x)},${fmt(y - L)} L${fmt(x)},${fmt(y + L)} M${fmt(x - L * 0.5)},${fmt(y - L * 0.5)} L${fmt(x + L * 0.5)},${fmt(y + L * 0.5)} M${fmt(x - L * 0.5)},${fmt(y + L * 0.5)} L${fmt(x + L * 0.5)},${fmt(y - L * 0.5)}`;
};

/** the field seen from far away: two offset dot lattices (cheap), thinner inside the channel when `chan` > 0 */
const FarAir: React.FC<{cam: MCam; a: number; chan: number; id: string}> = ({cam, a, chan, id}) => {
  if (a <= 0.01) return null;
  return (
    <g opacity={a}>
      <defs>
        <pattern id={`${id}-p1`} width={SP} height={SP} patternUnits="userSpaceOnUse">
          <circle cx={40} cy={50} r={22} fill="#86A9C9" />
        </pattern>
        <pattern id={`${id}-p2`} width={SP * 1.7} height={SP * 1.3} patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
          <circle cx={90} cy={30} r={22} fill="#E0806E" />
          <circle cx={30} cy={120} r={22} fill="#86A9C9" />
        </pattern>
        <linearGradient id={`${id}-cm`} x1={-CH_W * 1.5} y1={0} x2={CH_W * 1.5} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.35" stopColor={mix('#FFFFFF', '#262626', chan)} />
          <stop offset="0.65" stopColor={mix('#FFFFFF', '#262626', chan)} />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect x={-90000} y={-90000} width={180000} height={180000} fill={`url(#${id}-cm)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`} opacity={0.36}>
        <rect x={fmt(cam.x - 20000)} y={fmt(cam.y - 30000)} width={40000} height={60000} fill={`url(#${id}-p1)`} />
        <rect x={fmt(cam.x - 20000)} y={fmt(cam.y - 30000)} width={40000} height={60000} fill={`url(#${id}-p2)`} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------- M2: the race
const M2_V = 1350; // packet speed (micro units/s, drawn)
const xpM2 = (t: number) => M2_V * (t - S.M2) - 200;
const BEAM_W = 150;
export const M2Race: React.FC<{t: number}> = ({t}) => {
  const xp = xpM2(t);
  const cam: MCam = {x: 450 * (t - S.M2), y: 40 - 30 * ss(t, S.M2, S.M3), z: 1.15};
  const mols = visible(cam, 1);
  const free: React.ReactNode[] = [];
  const nodes = mols.map((m) => {
    const inBeam = Math.abs(m.y) < BEAM_W && m.r1 < 0.75;
    const tion = S.M2 + (m.x + 200) / M2_V + 0.01;
    const ion = inBeam ? clamp((t - tion) / 0.04) : 0;
    if (inBeam && t > tion) {
      const age = t - tion;
      const vx = 260 * (m.r2 - 0.3), vy = (m.y >= 0 ? 1 : -1) * (180 + 260 * m.r1);
      const ex = m.x + vx * age, ey = m.y + vy * age;
      free.push(
        <g key={`e${m.id}`} opacity={clamp(1.3 - age)}>
          {age < 0.09 && <path d={spark(m.x, m.y, 1 - age / 0.09)} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />}
          <circle cx={fmt(ex)} cy={fmt(ey)} r={13} fill="#BFEFFF" opacity={0.35} />
          <circle cx={fmt(ex)} cy={fmt(ey)} r={7} fill="#DFF8FF" stroke={INK} strokeWidth={2} />
        </g>,
      );
    }
    return <MolG key={m.id} m={m} s={{dx: 0, dy: 0, ion, heat: 0, jig: 9}} t={t} z={cam.z} />;
  });
  const x0 = cam.x - 1200;
  return (
    <g>
      <Backdrop cam={cam} t={t} />
      <g transform={camTr(cam)}>
        {/* the ionized wake behind the packet: a faint warm band, a thin violet line (the beam is infrared) */}
        <rect x={fmt(x0)} y={-BEAM_W} width={fmt(Math.max(0, xp - x0))} height={BEAM_W * 2} fill="#FFB27A" opacity={0.06} />
        <path d={`M${fmt(x0)},0 L${fmt(xp)},0`} stroke="#9C84FF" strokeOpacity={0.35} strokeWidth={14} />
        {nodes}
        {free}
        <g style={{mixBlendMode: 'screen'}}>
          <ellipse cx={fmt(xp)} cy={0} rx={260} ry={110} fill="#8C6CFF" opacity={0.3} />
          <ellipse cx={fmt(xp)} cy={0} rx={150} ry={46} fill="#D8C8FF" opacity={0.6} />
          <ellipse cx={fmt(xp)} cy={0} rx={70} ry={14} fill="#FFFFFF" />
          {[1, 2, 3].map((k) => <path key={k} d={`M${fmt(xp - 60 - k * 60)},${-36 + k * 2} L${fmt(xp - 120 - k * 110)},${-36 + k * 2} M${fmt(xp - 60 - k * 60)},${36 - k * 2} L${fmt(xp - 120 - k * 110)},${36 - k * 2}`} stroke="#E8E0FF" strokeOpacity={0.5 / k} strokeWidth={5} strokeLinecap="round" />)}
        </g>
      </g>
    </g>
  );
};

// -------------------------------------------------------------------------------------------- M3: ionization close-up
const M3_MOLS = [{x: 30, y: -70, o2: false, th: 24, tYank: 12.62}, {x: -50, y: 95, o2: true, th: -38, tYank: 12.92}];
export const M3Ionize: React.FC<{t: number}> = ({t}) => {
  const u = ss(t, S.M3, S.M4);
  const cam: MCam = {x: -8 + 6 * u, y: 14 - 6 * u, z: 6.0 + 0.7 * u};
  const back = visible({...cam, z: cam.z * 0.4}, 5, 1);
  const wx = -700 + 2600 * clamp((t - S.M3 - 0.05) / 0.9); // the light field sweeping across
  return (
    <g>
      <Backdrop cam={{...cam, z: cam.z * 0.3}} t={t} />
      {/* a blurred mid layer of other molecules (out of focus) */}
      <g transform={camTr({...cam, z: cam.z * 0.4})} opacity={0.45}>
        {back.map((m) => <circle key={m.id} cx={fmt(m.x + 12 * noise1(t + m.ph, m.id % 91))} cy={fmt(m.y)} r={26} fill={m.o2 ? '#9E6A62' : '#5C7894'} />)}
      </g>
      <g transform={camTr(cam)}>
        <defs>
          <radialGradient id="m3-cloud">
            <stop offset="0" stopColor="#BFEFFF" stopOpacity={0.4} />
            <stop offset="1" stopColor="#BFEFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the light field: violet wave crests passing over */}
        <g style={{mixBlendMode: 'screen'}}>
          {[0, 1, 2, 3, 4].map((k) => {
            const x = wx - k * 70;
            const a = Math.exp(-k * 0.45) * clamp((t - S.M3) / 0.1) * (1 - ss(t, 13.1, 13.33));
            return <path key={k} d={`M${fmt(x)},-400 Q${fmt(x + 24)},-200 ${fmt(x)},0 T${fmt(x)},400`} fill="none" stroke="#B8A0FF" strokeOpacity={0.55 * a} strokeWidth={10 - k * 1.4} />;
          })}
        </g>
        {M3_MOLS.map((m, i) => {
          const pre = clamp((wx - m.x + 120) / 140); // the field reaches it: the cloud stretches toward the field
          const age = t - m.tYank;
          const ion = clamp(age / 0.05);
          const th = ((m.th + 10 * Math.sin(t * 6 + i)) * Math.PI) / 180;
          const c = Math.cos(th), sn = Math.sin(th);
          const r = m.o2 ? 17 : 18, d = m.o2 ? 13 : 14;
          const col = m.o2 ? '#E0806E' : '#86A9C9';
          const st = age < 0 ? pre : 0;
          const el = age < 0 ? {x: m.x + 30 * Math.cos(t * 4 + i) + 22 * st, y: m.y + 22 * Math.sin(t * 4 + i) - 12 * st} : {x: m.x + 40 + 420 * age + 120 * age * age, y: m.y - 30 - 260 * age};
          return (
            <g key={i}>
              <ellipse cx={fmt(m.x + 10 * st)} cy={fmt(m.y)} rx={fmt(56 + 30 * st)} ry={fmt(48 - 6 * st)} fill="url(#m3-cloud)" opacity={1 - ion * 0.7} />
              {ion > 0 && <circle cx={m.x} cy={m.y} r={36} fill="#FFB27A" opacity={0.2 * ion} />}
              {[-1, 1].map((k) => (
                <g key={k}>
                  <circle cx={fmt(m.x + c * d * k)} cy={fmt(m.y + sn * d * k)} r={r} fill={col} stroke={ion > 0.5 ? '#FFCB9A' : INK} strokeWidth={2.4} />
                  <circle cx={fmt(m.x + c * d * k - r * 0.3)} cy={fmt(m.y + sn * d * k - r * 0.32)} r={r * 0.34} fill="#FFFFFF" opacity={0.35} />
                </g>
              ))}
              {/* the electron, then its escape */}
              <circle cx={fmt(el.x)} cy={fmt(el.y)} r={age > 0 ? 9 : 5.5} fill="#BFEFFF" opacity={age > 0 ? 0.4 : 0} />
              <circle cx={fmt(el.x)} cy={fmt(el.y)} r={5.5} fill="#DFF8FF" stroke={INK} strokeWidth={1.6} />
              {age > 0 && age < 0.12 && <path d={spark(m.x + 34, m.y - 22, 1 - age / 0.12, 1.2)} stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" style={{mixBlendMode: 'screen'}} />}
              {age > 0 && <path d={`M${fmt(m.x + 30)},${fmt(m.y - 22)} L${fmt(el.x)},${fmt(el.y)}`} stroke="#BFEFFF" strokeOpacity={0.35 * clamp(1 - age * 2)} strokeWidth={3} strokeDasharray="3 7" />}
            </g>
          );
        })}
      </g>
    </g>
  );
};

// --------------------------------------------------------------------------------------- M4: heating and expansion
const CH_W = 260; // the channel's half-width after expansion (micro units)
const heatAt = (t: number) => ss(t, S.M4 + 0.05, S.M4 + 0.9);
const pushAt = (t: number) => ss(t, S.M4 + 0.55, S.M4 + 1.7);
/** the state of a molecule relative to the channel at x = 0 (after M2's pulse ionized the column) */
const chanState = (m: Mol, t: number, heatK: number, pushK: number): MS => {
  const ax = Math.abs(m.x);
  const inside = Math.exp(-((ax / 200) ** 2));
  const heat = heatK * inside;
  // inside molecules are pushed out past the channel edge; those just outside are crowded a little
  const out = ax < CH_W ? (CH_W + 40 * m.r1 - ax) * 0.92 * pushK : Math.max(0, 80 - (ax - CH_W) * 0.3) * pushK * 0.5;
  const keep = m.r2 < 0.22; // a few stay inside: lower density, not a vacuum
  return {dx: keep ? 0 : Math.sign(m.x || 1) * out, dy: 0, ion: ax < 150 && m.r1 < 0.7 ? 1 - 0.5 * pushK : 0, heat, jig: 9 + 30 * heat};
};
export const M4Heat: React.FC<{t: number}> = ({t}) => {
  const pb = sm5(clamp((t - (S.M4 + 1.25)) / (S.M5 - S.M4 - 1.25)));
  const z = Math.exp(Math.log(1.05) + (Math.log(0.2) - Math.log(1.05)) * pb);
  const cam: MCam = {x: 40 - 10 * pb, y: -200 * pb, z, roll: 0};
  const hk = heatAt(t), pk = pushAt(t);
  const mols = visible(cam, 2);
  return (
    <g>
      <Backdrop cam={cam} t={t} tint={0.3 * hk} />
      <g transform={camTr(cam)}>
        <defs>
          <linearGradient id="m4-ch" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FF9A5A" stopOpacity={0} />
            <stop offset="0.5" stopColor="#FFB27A" stopOpacity={0.5} />
            <stop offset="1" stopColor="#FF9A5A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={-CH_W * 1.4} y={-30000} width={CH_W * 2.8} height={60000} fill="url(#m4-ch)" opacity={0.25 * hk + 0.35 * pk} />
        <path d="M0,-30000 L0,30000" stroke="#9C84FF" strokeOpacity={0.3 * (1 - pk)} strokeWidth={12} />
        <FarAir cam={cam} a={mols.length ? 0 : 1} chan={pk} id="m4f" />
        {mols.map((m) => <MolG key={m.id} m={m} s={chanState(m, t, hk, pk)} t={t} z={cam.z} />)}
        {/* edge lines of the thinner channel once it has opened (at distance, it reads as a column through the air) */}
        {pk > 0.4 && [-1, 1].map((k) => <path key={k} d={`M${k * CH_W},-30000 L${k * CH_W},30000`} stroke="#FFCB9A" strokeOpacity={0.25 * (pk - 0.4) * pb} strokeWidth={fmt(3 / z)} strokeDasharray={`${fmt(20 / z)} ${fmt(18 / z)}`} />)}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------- M5: the leader runs it
const leaderY = (t: number) => {
  const u = t - (S.M5 + 0.15);
  return 1400 - 750 * u - 300 * u * u; // accelerating up the channel
};
const leaderX = (y: number) => 34 * noise1(y / 260, 5) + 14 * noise1(y / 70, 9);
export const M5Leader: React.FC<{t: number}> = ({t}) => {
  const yl = leaderY(t);
  const pb = sm5(clamp((t - 17.35) / (S.M6 - 17.35)));
  const z = Math.exp(Math.log(0.62) + (Math.log(0.11) - Math.log(0.62)) * pb);
  // tracking alongside: the channel sits left of centre, the camera holds the tip a little above centre
  // at the end it rolls to the real beam's on-screen lean and turns to the 3D channel's colour, for the cut to M6
  const hand = ss(t, 18.15, S.M6);
  const cam: MCam = {x: 330 * (1 - pb), y: Math.min(900, 450 + 0.5 * (yl + 260)) - 1200 * pb, z, roll: 22 * sm5(hand)};
  const mols = visible(cam, 2, 1, 1.05);
  const ystart = 2600;
  const ys: number[] = [];
  for (let y = ystart; y > yl; y -= 40) ys.push(y);
  ys.push(yl);
  const path = ys.map((y, i) => `${i ? 'L' : 'M'}${fmt(leaderX(y))},${fmt(y)}`).join(' ');
  // side branches: every so often the leader tries ordinary air and stalls within a short distance
  const branches = Array.from({length: 18}, (_, k) => {
    const y0 = 1300 - k * 420 - 120 * hash(k, 3);
    if (yl > y0) return null;
    const age = (y0 - yl) / 1500;
    const side = hash(k, 5) < 0.5 ? -1 : 1;
    const len = 220 + 160 * hash(k, 7);
    const grow = clamp(age / 0.18);
    const pts = Array.from({length: 6}, (_, i) => ({x: leaderX(y0) + side * (len * grow * i) / 5, y: y0 - 50 * (i / 5) * grow + 26 * (hash(k * 9 + i, 11) - 0.5)}));
    return {d: pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' '), a: clamp(1 - (age - 0.18) / 0.35), tip: pts[5]};
  }).filter(Boolean) as {d: string; a: number; tip: {x: number; y: number}}[];
  const ww = (px: number) => px / Math.pow(z, 0.55);
  const flick = 0.85 + 0.15 * noise1(t * 40, 3);
  return (
    <g>
      <Backdrop cam={cam} t={t} tint={0.3} />
      <g transform={camTr(cam)}>
        <rect x={-CH_W * 1.4} y={-60000} width={CH_W * 2.8} height={120000} fill={mix('#FFB27A', '#5FD6E0', hand)} opacity={0.13 + 0.12 * hand} />
        <g opacity={1 - 0.75 * hand}>
        <FarAir cam={cam} a={mols.length ? 0 : 1} chan={1} id="m5f" />
        {mols.map((m) => {
          const s = chanState(m, t, 0.5, 1);
          const near = Math.abs(m.x) < CH_W * 1.3 && m.y > yl ? 1 : 0;
          return <MolG key={m.id} m={m} s={{...s, ion: Math.max(s.ion, near * 0.8), heat: 0.4 * s.heat + 0.3 * near}} t={t} z={cam.z} />;
        })}
        </g>
        <g style={{mixBlendMode: 'screen'}} opacity={1 - 0.85 * hand}>
          {branches.map((b, i) => (
            <g key={i} opacity={b.a}>
              <path d={b.d} fill="none" stroke="#8E9CFF" strokeOpacity={0.35} strokeWidth={fmt(ww(30))} strokeLinejoin="round" strokeLinecap="round" />
              <path d={b.d} fill="none" stroke="#E8ECFF" strokeWidth={fmt(ww(6))} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
          <path d={path} fill="none" stroke="#7C88FF" strokeOpacity={0.3 * flick} strokeWidth={fmt(ww(130))} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path} fill="none" stroke="#C6D0FF" strokeOpacity={0.6 * flick} strokeWidth={fmt(ww(46))} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path} fill="none" stroke="#FFFFFF" strokeWidth={fmt(ww(16))} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={fmt(leaderX(yl))} cy={fmt(yl)} r={fmt(ww(150))} fill="#C9D2FF" opacity={0.35} />
          <circle cx={fmt(leaderX(yl))} cy={fmt(yl)} r={fmt(ww(46))} fill="#FFFFFF" opacity={0.9} />
        </g>
      </g>
    </g>
  );
};
