// V2 shot V1 (4.31-5.30) and M1 (5.30-7.81): an imagined example on a simplified stage. The lead stands balanced
// (A-stance, feet apart and planted, arms hanging beside the body), looks up; a short bolt hits his hair; the
// skeleton shows inside his own outline (4 frames, then a 2-frame flicker) while he jolts stiffly (arms snap out,
// fingers splay, shoulders up), then settles with an overshoot, singed and smoking. The camera then rises into the
// air between the cloud and his head: the molecular view (charged cloud base above, charged ground side below, air
// in between) where a streamer tries to push down, steps, branches, stalls and fades: air resists.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {mix} from '../dc/color';
import {Man, ManPose, lerpPose, manJoints} from '../dc/Man';
import {mixHand} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {clamp, fmt, hash, noise1, V} from '../dc/math';
import {E_FRAZZLED, E_JOLT, E_WARY, H_REST, H_SPLAY, LEAD, P} from '../cast';
import {Skeleton, XRayFilter} from '../art/Skeleton';
import {ss} from '../lib';
import {sm5} from '../camera';

export const VG2 = {t0: 4.31, strike: 4.52, x1: 4.55, x1e: 4.69, x2: 4.73, x2e: 4.79, settle: 5.05, rise: 5.0, micro: 5.45, t1: 7.81};

// --- poses: feet planted where the stance puts them (no foot slides)
const STAND0: ManPose = P({x: 520, y: 1196, s: 0.92, torso: 5, chest: 2, neck: -10, turn: 0.45, lTu: -440, lTv: 110, lElb: -1, rTu: -430, rTv: -150, rElb: 1, lHip: -8, rHip: 10, lKnee: 2, rKnee: 2, breath: 0.3});
const J0 = manJoints(STAND0);
const plant = (p: ManPose): ManPose => ({...p, lAx: J0.lLeg.A.x, lAy: J0.lLeg.A.y, lA: 1, rAx: J0.rLeg.A.x, rAy: J0.rLeg.A.y, rA: 1});
const STAND = plant(STAND0);
const JOLT = plant({...STAND0, y: 1186, torso: -3, chest: 8, neck: 10, lTu: -230, lTv: 175, rTu: -215, rTv: -245});
const SAG = plant({...STAND0, y: 1206, torso: 7, chest: 4, neck: 4, lTu: -400, lTv: 125, rTu: -395, rTv: -175, lWr: -8, rWr: 8});
const FRAZ = plant({...STAND0, y: 1198, torso: 4, chest: 2, neck: 0, lTu: -415, lTv: 120, rTu: -410, rTv: -165, lWr: -6, rWr: 6});

export const leadPose2 = (t: number): ManPose => {
  if (t < VG2.strike) return {...STAND, neck: STAND.neck - 3 * ss(t, VG2.t0, VG2.strike), breath: 0.3 + 0.4 * Math.sin(t * 3)};
  if (t < VG2.x1e) return lerpPose(STAND, JOLT, sm5(clamp((t - VG2.strike) / 0.07)));
  if (t < VG2.settle) return lerpPose(JOLT, SAG, sm5(clamp((t - VG2.x1e) / (VG2.settle - VG2.x1e))));
  return lerpPose(SAG, FRAZ, sm5(clamp((t - VG2.settle) / 0.3)));
};
const expr2 = (t: number) => {
  if (t < VG2.strike) return mixExpr({...E_WARY, gy: -0.6}, {...E_WARY, gy: -0.95, pupil: 0.75, open: 0.1}, ss(t, VG2.t0, VG2.strike));
  if (t < VG2.x2e + 0.04) return E_JOLT;
  return mixExpr(E_JOLT, E_FRAZZLED, ss(t, VG2.x2e, VG2.settle + 0.1));
};
export const exposure2 = (t: number) => (t >= VG2.x1 && t < VG2.x1e) || (t >= VG2.x2 && t < VG2.x2e);

const hairTop = (p: ManPose): V => {
  const j = manJoints(p);
  return {x: j.head.x + 4, y: j.head.y - 96 * p.s * 1.25};
};
const HT = hairTop(STAND);
export const CLOUD_V2 = 330;
/** the point in the air above his head the camera rises into */
export const Q2: V = {x: HT.x + 18, y: CLOUD_V2 + 205};
const boltPts: V[] = (() => {
  const pts: V[] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const y = CLOUD_V2 + 40 + ((HT.y - CLOUD_V2 - 40) * i) / n;
    const x = HT.x + 60 - 60 * (i / n) + (i === 0 || i === n ? 0 : 26 * (hash(i, 701) - 0.5) * 2);
    pts.push({x, y});
  }
  return pts;
})();
const forks: V[][] = [[boltPts[4], {x: boltPts[4].x - 46, y: boltPts[4].y + 30}, {x: boltPts[4].x - 70, y: boltPts[4].y + 66}], [boltPts[7], {x: boltPts[7].x + 40, y: boltPts[7].y + 24}, {x: boltPts[7].x + 52, y: boltPts[7].y + 58}]];
const boltK2 = (t: number) => {
  if (t < VG2.strike) return 0;
  const draw = clamp((t - VG2.strike) / 0.04);
  const fl = exposure2(t) ? 1.25 : 0.5 + 0.2 * noise1(t * 60, 3);
  return draw * fl * (1 - ss(t, VG2.x2e + 0.02, VG2.x2e + 0.16));
};

const Cloud: React.FC<{lit: number; rumble: number}> = ({lit, rumble}) => {
  const bumps = [[-170, 0, 84], [-80, -50, 100], [30, -66, 110], [140, -38, 92], [222, 4, 74], [60, 16, 96], [-60, 20, 90]];
  const cx = HT.x + 40, cy = CLOUD_V2 - 30;
  return (
    <g>
      <g fill="#142230" stroke="#142230" strokeWidth={14}>{bumps.map(([x, y, r], i) => <circle key={i} cx={cx + x} cy={cy + y} r={r} />)}</g>
      {bumps.map(([x, y, r], i) => <circle key={i} cx={cx + x} cy={cy + y} r={r} fill={mix('#46546A', '#A4AEE8', clamp(lit + rumble * 0.25))} />)}
      {bumps.slice(0, 5).map(([x, y, r], i) => <circle key={`h${i}`} cx={cx + x - r * 0.25} cy={cy + y - r * 0.3} r={r * 0.45} fill="#FFFFFF" opacity={0.08} />)}
      <path d={`M${cx - 240},${cy + 40} Q${cx},${cy + 96} ${cx + 290},${cy + 40}`} fill="none" stroke="#0E1822" strokeOpacity={0.4} strokeWidth={10} />
    </g>
  );
};

// --------------------------------------------------------------- the molecular view of the air (M1)
const MM = 22; // micro units per stage px
const TOPB = 600; // the charged layers sit above -TOPB and below +TOPB (micro units)
type Mol = {a: number; b: number; o2: boolean; th: number; ph: number; i: number};
const AIR: Mol[] = (() => {
  const out: Mol[] = [];
  let i = 0;
  for (let gy = -13; gy <= 13; gy++) for (let gx = -8; gx <= 8; gx++) {
    if (Math.abs(gy * 112) > TOPB - 60 && Math.abs(gy * 112) < TOPB + 40) continue;
    const k = i++;
    out.push({a: gx * 120 + (hash(k, 811) - 0.5) * 70 + (gy % 2) * 60, b: gy * 112 + (hash(k, 813) - 0.5) * 60, o2: hash(k, 815) < 0.21, th: 360 * hash(k, 817), ph: 6.28 * hash(k, 819), i: k});
  }
  return out;
})();
/** the streamer's attempts: each grows from the charged layer above in steps, then stalls and fades */
const ATTEMPTS = [{t0: 5.6, seed: 3, x: -150, reach: 0.5}, {t0: 6.35, seed: 7, x: 120, reach: 0.42}, {t0: 7.05, seed: 11, x: -20, reach: 0.34}];
const streamer = (seed: number, x0: number, len: number) => {
  const pts: V[] = [{x: x0, y: -TOPB}];
  let x = x0, y = -TOPB;
  for (let k = 0; k < 40 && y + TOPB < len; k++) {
    y += 34 + 20 * hash(k, seed);
    x += 40 * (hash(k, seed + 1) - 0.5);
    pts.push({x, y});
  }
  return pts;
};
const MicroAir: React.FC<{t: number; bg: number; mol: number}> = ({t, bg, mol}) => {
  if (bg <= 0.01) return null;
  return (
    <g>
      <rect x={-40000} y={-40000} width={80000} height={80000} fill="#141D2C" opacity={bg} />
      <g opacity={mol}>
      {/* the charged regions: the cloud base above (negative), the ground side below (positive) */}
      <defs>
        <linearGradient id="ma-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E86FF" stopOpacity={0.75} />
          <stop offset="1" stopColor="#8E86FF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="ma-bot" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FF9C6A" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FF9C6A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-2400} y={-TOPB - 900} width={4800} height={900} fill="#2A2560" />
      <rect x={-2400} y={-TOPB - 40} width={4800} height={420} fill="url(#ma-top)" />
      <rect x={-2400} y={TOPB} width={4800} height={900} fill="#3A2420" />
      <rect x={-2400} y={TOPB - 380} width={4800} height={420} fill="url(#ma-bot)" />
      {Array.from({length: 46}, (_, i) => {
        const x = -1100 + 48 * i + 14 * Math.sin(t * 2 + i);
        const y = -TOPB - 30 + 24 * hash(i, 41) + 6 * Math.sin(t * 5 + i * 2);
        return <circle key={`n${i}`} cx={fmt(x)} cy={fmt(y)} r={9} fill="#D9D4FF" stroke="#0D1A24" strokeWidth={2} />;
      })}
      {Array.from({length: 40}, (_, i) => {
        const x = -1080 + 55 * i;
        const y = TOPB + 30 - 24 * hash(i, 43);
        return (
          <g key={`p${i}`} stroke="#FFD8C2" strokeWidth={4} strokeLinecap="round" opacity={0.75}>
            <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
            <line x1={x} y1={y - 9} x2={x} y2={y + 9} />
          </g>
        );
      })}
      {/* the air: molecules jostle; their electrons are tugged toward the advancing streamer, then snap back */}
      {AIR.map((m) => {
        const front = ATTEMPTS.map((a) => {
          const g = clamp((t - a.t0) / 0.5);
          const fade = 1 - clamp((t - a.t0 - 0.55) / 0.3);
          const fy = -TOPB + 2 * TOPB * a.reach * g;
          const d = Math.hypot(m.a - a.x, m.b - fy);
          return Math.exp(-d / 220) * fade * (g > 0 ? 1 : 0);
        }).reduce((p, q) => Math.max(p, q), 0);
        const jig = 8 + 10 * front;
        const x = m.a + jig * noise1(t * 1.6 + m.ph, m.i), y = m.b + jig * noise1(t * 1.4 + m.ph * 2, m.i + 9);
        const th = m.th + 30 * t * (m.i % 2 ? 1 : -1);
        const c = Math.cos((th * Math.PI) / 180), s = Math.sin((th * Math.PI) / 180);
        const r = m.o2 ? 17 : 18, d = m.o2 ? 13 : 14;
        const col = mix(m.o2 ? '#E0806E' : '#86A9C9', '#E8ECFF', 0.55 * front);
        const tug = front * 34 * Math.max(0, Math.sin(t * 9 + m.ph));
        const ex = x + 30 * Math.cos(t * 2.6 + m.ph), ey = y + 22 * Math.sin(t * 2.6 + m.ph) - tug;
        return (
          <g key={m.i}>
            {[-1, 1].map((k) => (
              <g key={k}>
                <circle cx={fmt(x + c * d * k)} cy={fmt(y + s * d * k)} r={r} fill={col} stroke="#0D1A24" strokeWidth={3} />
                <circle cx={fmt(x + c * d * k - r * 0.3)} cy={fmt(y + s * d * k - r * 0.32)} r={r * 0.34} fill="#FFFFFF" opacity={0.35} />
              </g>
            ))}
            <circle cx={fmt(ex)} cy={fmt(ey)} r={6} fill="#BFEFFF" stroke="#0D1A24" strokeWidth={2} />
          </g>
        );
      })}
      {/* the streamer attempts */}
      {ATTEMPTS.map((a, k) => {
        const g = clamp((t - a.t0) / 0.5);
        if (g <= 0) return null;
        // stepped growth: holds, then jumps
        const steps = Math.floor(g * 6) / 6 + (g * 6 - Math.floor(g * 6)) ** 6 / 6;
        const fade = 1 - clamp((t - a.t0 - 0.55) / 0.3);
        if (fade <= 0) return null;
        const pts = streamer(a.seed, a.x, 2 * TOPB * a.reach * steps);
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
        const tip = pts[pts.length - 1];
        const br = pts.filter((_, i) => i > 1 && i % 3 === 0).map((p, i) => `M${fmt(p.x)},${fmt(p.y)} l${fmt((i % 2 ? 1 : -1) * 60)},${fmt(50)} l${fmt((i % 2 ? 1 : -1) * 20)},${fmt(40)}`).join(' ');
        return (
          <g key={k} style={{mixBlendMode: 'screen'}} opacity={fade}>
            <path d={d} fill="none" stroke="#7C88FF" strokeOpacity={0.3} strokeWidth={80} strokeLinejoin="round" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#B9C4FF" strokeOpacity={0.6} strokeWidth={30} strokeLinejoin="round" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
            <path d={br} fill="none" stroke="#DCE3FF" strokeOpacity={0.75} strokeWidth={6} strokeLinecap="round" />
            <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={70 + 30 * Math.sin(t * 50)} fill="#C9D2FF" opacity={0.3 + 0.2 * fade} />
            <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={20} fill="#FFFFFF" opacity={fade} />
          </g>
        );
      })}
      </g>
    </g>
  );
};

/** the stage camera: hold on him, then rise into the air above his head and zoom into the molecular scale */
export const vignetteCam = (t: number): Cam => {
  const hold = {x: 520, y: 1010 - 20 * ss(t, VG2.t0, VG2.rise), z: 1.18 + 0.05 * ss(t, VG2.t0, VG2.rise)};
  if (t < VG2.rise) return hold;
  // tilt up first (his head leaves the bottom of frame), then push into the air at molecular scale
  const tl = sm5(clamp((t - VG2.rise) / 0.18));
  const c = {x: hold.x + (Q2.x - hold.x) * tl, y: hold.y + (Q2.y - hold.y) * tl};
  const u = sm5(clamp((t - VG2.rise - 0.12) / (VG2.micro - VG2.rise - 0.12)));
  const z = Math.exp(Math.log(hold.z) + (Math.log(MM * 1.25) - Math.log(hold.z)) * u);
  if (t < VG2.micro) return {...c, z};
  // drift with the streamer attempts and push in slowly
  const k = ss(t, VG2.micro, VG2.t1 + 0.4);
  const fx = ATTEMPTS.reduce((x, a) => x + (a.x * 0.45 - x) * ss(t, a.t0 - 0.3, a.t0 + 0.4), 0);
  return {x: Q2.x + fx / MM, y: Q2.y + (60 * k) / MM, z: MM * (1.25 + 0.12 * k)};
};

export const VignetteV2: React.FC<{t: number}> = ({t}) => {
  const cam = vignetteCam(t);
  const p = leadPose2(t);
  const j = manJoints(p);
  const bk = boltK2(t);
  const xr = exposure2(t);
  const singe = ss(t, VG2.strike + 0.03, VG2.settle);
  const outfit = {...LEAD, hair: mix(LEAD.hair, '#3A1A16', singe * 0.4)};
  const hand = t < VG2.strike ? H_REST : mixHand(H_SPLAY, H_REST, ss(t, VG2.x2e, VG2.settle + 0.15));
  const sway = t < VG2.strike ? 3 * Math.sin(t * 29) * ss(t, VG2.t0 + 0.05, VG2.strike) : 10 * Math.exp(-(t - VG2.strike) * 6) * Math.sin((t - VG2.strike) * 42);
  const microBg = clamp((Math.log(cam.z) - Math.log(3.2)) / (Math.log(8) - Math.log(3.2)));
  const microMol = clamp((Math.log(cam.z) - Math.log(3.6)) / (Math.log(9) - Math.log(3.6)));
  const ww = (px: number) => (px * Math.pow(cam.z, 0.42)) / cam.z;
  const lineD = (pts: V[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${fmt(q.x)},${fmt(q.y)}`).join(' ');
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#2B394C" />
      <Layer cam={cam} depth={2.2}>
        <path d="M-900,1480 Q-100,1360 500,1430 Q1100,1500 1900,1400 L1900,2600 L-900,2600 Z" fill="#30475A" />
      </Layer>
      <Layer cam={cam} depth={1}>
        <defs>
          <XRayFilter id="vg2-xr" />
          <radialGradient id="vg2-hl" gradientUnits="userSpaceOnUse" cx={fmt(HT.x)} cy={fmt(HT.y)} r={380}>
            <stop offset="0" stopColor="#DDE4FF" stopOpacity={0.6} />
            <stop offset="1" stopColor="#8E9CFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d="M-700,1660 Q100,1560 540,1580 Q1000,1600 1800,1690 L1800,2600 L-700,2600 Z" fill="#4C785A" stroke="#14232C" strokeWidth={5} />
        <path d="M-700,1684 Q100,1590 540,1610 Q1000,1630 1800,1712" fill="none" stroke="#6E9C72" strokeWidth={10} opacity={0.55} />
        <ellipse cx={(J0.lLeg.A.x + J0.rLeg.A.x) / 2 + 20} cy={J0.lLeg.A.y + 24} rx={200} ry={24} fill="#1C3024" opacity={0.45} />
        <g stroke="#9DB3C8" strokeOpacity={0.42 * clamp(1 - (cam.z - 1.6) / 1.5)} strokeWidth={3} strokeLinecap="round">
          {Array.from({length: 24}, (_, i) => {
            const x = HT.x - 170 + 380 * hash(i, 601);
            const y = CLOUD_V2 + 40 + ((300 * hash(i, 603) + t * 900) % 320);
            return <line key={i} x1={fmt(x)} y1={fmt(y)} x2={fmt(x - 5)} y2={fmt(y + 26)} />;
          })}
        </g>
        <Cloud lit={bk * 0.55} rumble={t < VG2.strike ? 0.5 + 0.5 * Math.sin(t * 22) : 0} />
        {/* the figure, or (during an exposure) its own outline turned to x-ray with the skeleton inside */}
        <g filter={xr ? 'url(#vg2-xr)' : undefined}>
          <Man id="vg2" pose={p} expr={expr2(t)} lHand={hand} rHand={hand} outfit={outfit} hairSway={sway} />
        </g>
        {xr && <Skeleton pose={p} spreadL={0.95} spreadR={0.95} />}
        {singe > 0.01 && !xr && (
          <g opacity={singe}>
            <ellipse cx={j.head.x - 30} cy={j.head.y + 30} rx={14} ry={8} fill="#2A2020" opacity={0.3} />
            {[0, 1, 2].map((k) => {
              const age = ((t - VG2.x2e + k * 0.22) % 0.7) / 0.7;
              const x = j.head.x - 40 + k * 40 + 10 * Math.sin(age * 5 + k);
              const y = j.head.y - 96 * p.s * 1.2 - age * 110;
              return t > VG2.x2e ? <circle key={k} cx={fmt(x)} cy={fmt(y)} r={9 + 16 * age} fill="#C9D0D8" opacity={0.45 * (1 - age)} /> : null;
            })}
          </g>
        )}
        {bk > 0 && (
          <g style={{mixBlendMode: 'screen'}}>
            <circle cx={fmt(HT.x)} cy={fmt(HT.y)} r={380} fill="url(#vg2-hl)" opacity={bk} />
            {[boltPts, ...forks].map((pts, i) => (
              <g key={i} opacity={bk * (i ? 0.7 : 1)}>
                <path d={lineD(pts)} fill="none" stroke="#7C88FF" strokeOpacity={0.3} strokeWidth={fmt(ww(34))} strokeLinejoin="round" strokeLinecap="round" />
                <path d={lineD(pts)} fill="none" stroke="#C6D0FF" strokeOpacity={0.55} strokeWidth={fmt(ww(12))} strokeLinejoin="round" strokeLinecap="round" />
                <path d={lineD(pts)} fill="none" stroke="#FFFFFF" strokeWidth={fmt(ww(4.5))} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}
      </Layer>
      {/* the molecular view: a zoom-dissolve nested at Q2 (it never shrinks below 3/4 of its final size, so the
          field always fills the frame while it fades in) */}
      {microBg > 0 && (
        <g transform={`translate(${fmt(540 + (Q2.x - cam.x) * cam.z)} ${fmt(960 + (Q2.y - cam.y) * cam.z)}) scale(${fmt(Math.max(cam.z, MM * 0.95) / MM)})`}>
          <MicroAir t={t} bg={microBg} mol={microMol} />
        </g>
      )}
    </g>
  );
};
