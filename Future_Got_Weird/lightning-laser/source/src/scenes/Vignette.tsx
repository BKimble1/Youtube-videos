// Shot D: the clearly illustrative danger vignette (a separate, simplified stage: plain backdrop, a cartoon cloud, a
// grassy hump; the "Illustration" caption is drawn by the film). The lead looks up as his hair lifts, a short
// downward bolt hits, he recoils once and follows through while two brief skeleton exposures flicker with the bolt,
// then stands frazzled and singed. The camera then follows the bolt's fading path into the air beside his head,
// where the molecular view (scenes/Micro) shows ordinary air holding its electrons except along that one path.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {mix} from '../dc/color';
import {Man, ManPose, lerpPose, manJoints} from '../dc/Man';
import {mixHand} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {clamp, fmt, hash, noise1, V} from '../dc/math';
import {E_FRAZZLED, E_JOLT, E_WARY, H_FIST, H_REST, H_SPLAY, LEAD, P} from '../cast';
import {Skeleton, XRayFilter} from '../art/Skeleton';
import {ss} from '../lib';
import {AX_ANG} from '../world/site';
import {M, MicroField, RESIST_MOLS} from './Micro';

// --- timing (film seconds)
export const VG = {t0: 4.31, strike: 4.95, x1: 5.0, x1e: 5.1, x2: 5.47, x2e: 5.57, follow: 5.6, calm: 5.85, rush: 6.3, micro: 6.75, t1: 7.81};

// --- poses (feet planted at the stand pose's ankles)
const STAND0: ManPose = P({x: 470, y: 1208, s: 0.9, torso: 3, chest: 3, neck: -4, turn: 0.45, lTu: -330, lTv: 60, lElb: -1, rTu: -325, rTv: -75, rElb: 1, lHip: 8, lKnee: 3, rHip: -7, rKnee: 3});
const J0 = manJoints(STAND0);
const plant = (p: ManPose): ManPose => ({...p, lAx: J0.lLeg.A.x, lAy: J0.lLeg.A.y, lA: 1, rAx: J0.rLeg.A.x, rAy: J0.rLeg.A.y, rA: 1});
const STAND = plant(STAND0);
const TENSE = plant({...STAND0, chest: 8, neck: -14, torso: 1, lTu: -150, lTv: -50, lElb: -1, rTu: -150, rTv: -80, rElb: -1, breath: 0.8});
const JOLT = plant({...STAND0, y: 1222, torso: -9, chest: -8, neck: 10, lTu: 20, lTv: -200, lElb: -1, rTu: 40, rTv: 180, rElb: -1});
const FOLLOW = plant({...STAND0, y: 1214, torso: 7, chest: 9, neck: -2, lTu: -210, lTv: 95, lElb: -1, rTu: -200, rTv: -130, rElb: 1});
const FRAZ = plant({...STAND0, torso: 2, chest: 1, neck: 2, lTu: -300, lTv: 80, lElb: -1, rTu: -300, rTv: -95, rElb: 1});

export const leadPose = (t: number): ManPose => {
  if (t < VG.strike) return lerpPose(STAND, TENSE, ss(t, VG.t0 + 0.1, VG.strike - 0.05));
  if (t < VG.strike + 0.2) return lerpPose(TENSE, JOLT, ss(t, VG.strike, VG.strike + 0.16));
  if (t < VG.follow + 0.15) return lerpPose(JOLT, FOLLOW, ss(t, VG.strike + 0.22, VG.follow + 0.1));
  return lerpPose(FOLLOW, FRAZ, ss(t, VG.follow + 0.15, VG.calm + 0.15));
};
const leadExpr = (t: number) => {
  if (t < VG.strike) return E_WARY;
  if (t < VG.follow) return mixExpr(E_WARY, E_JOLT, ss(t, VG.strike, VG.strike + 0.06));
  return mixExpr(E_JOLT, E_FRAZZLED, ss(t, VG.follow, VG.calm));
};
export const exposure = (t: number) => (t >= VG.x1 && t < VG.x1e) || (t >= VG.x2 && t < VG.x2e);

/** the bolt: from the cloud's underside down to the top of his hair, on the 18 deg line through Q */
const hairTop = (p: ManPose): V => {
  const j = manJoints(p);
  return {x: j.head.x + 6, y: j.head.y - 96 * p.s * 1.2};
};
const HT = hairTop(TENSE);
const TAN = Math.tan((AX_ANG * Math.PI) / 180);
const lineAt = (y: number): V => ({x: HT.x + (HT.y - y) * TAN, y});
export const CLOUD_V = 400;
export const QV: V = lineAt((HT.y + CLOUD_V) / 2);
const boltPts = (() => {
  const pts: V[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const y = HT.y - ((HT.y - CLOUD_V) * i) / n;
    const base = lineAt(y);
    const mid = Math.abs(i - n / 2) <= 1 ? 0.15 : 1; // straight through Q
    pts.push({x: base.x + mid * 22 * (hash(i, 501) - 0.5) * 2 * (i === 0 || i === n ? 0 : 1), y});
  }
  return pts;
})();
const fork = [boltPts[9], {x: boltPts[9].x + 40, y: boltPts[9].y + 22}, {x: boltPts[9].x + 62, y: boltPts[9].y + 58}];

const boltK = (t: number) => {
  // on at the strike, bright again at each exposure, dim between, gone by the follow-through
  if (t < VG.strike) return 0;
  const draw = clamp((t - VG.strike) / 0.05);
  const fl = exposure(t) ? 1.25 : 0.55 + 0.2 * noise1(t * 60, 3);
  return draw * fl * (1 - ss(t, VG.follow, VG.follow + 0.2));
};
/** a faint afterglow along the path, which the camera follows into the air */
const afterglow = (t: number) => ss(t, VG.follow - 0.1, VG.follow + 0.1) * (0.35 + 0.65 * ss(t, VG.rush, VG.micro));

const Cloud: React.FC<{flash: number; rumble: number}> = ({flash, rumble}) => {
  const bumps = [[-150, 0, 80], [-70, -46, 96], [30, -60, 104], [130, -34, 88], [200, 6, 70], [60, 14, 90], [-60, 18, 84]];
  const cx = QV.x + 80, cy = CLOUD_V - 70;
  return (
    <g>
      <g fill="#162430" stroke="#162430" strokeWidth={14}>
        {bumps.map(([x, y, r], i) => <circle key={i} cx={cx + x} cy={cy + y} r={r} />)}
      </g>
      <g>
        {bumps.map(([x, y, r], i) => (
          <circle key={i} cx={cx + x} cy={cy + y} r={r} fill={mix('#4A5868', '#9AA6E0', clamp(flash + rumble * 0.3))} />
        ))}
        {bumps.slice(0, 5).map(([x, y, r], i) => <circle key={`h${i}`} cx={cx + x - r * 0.25} cy={cy + y - r * 0.3} r={r * 0.45} fill="#FFFFFF" opacity={0.08} />)}
      </g>
    </g>
  );
};

export const VignetteWorld: React.FC<{cam: Cam; t: number}> = ({cam, t}) => {
  const p = leadPose(t);
  const j = manJoints(p);
  const bk = boltK(t);
  const xr = exposure(t);
  const singe = ss(t, VG.strike + 0.05, VG.follow);
  const outfit = {...LEAD, hair: mix(LEAD.hair, '#3A1A16', singe * 0.45)};
  const rumble = t < VG.strike ? 0.5 + 0.5 * Math.sin(t * 22) * (t > VG.t0 + 0.3 ? 1 : 0) : 0;
  const flash = bk * 0.6;
  const lHand = t < VG.strike ? mixHand(H_REST, H_FIST, ss(t, VG.t0 + 0.2, VG.strike)) : mixHand(H_SPLAY, H_REST, ss(t, VG.follow, VG.calm + 0.2));
  const sway = t < VG.strike ? 4 * Math.sin(t * 31) * ss(t, VG.t0 + 0.2, VG.strike) : 9 * Math.exp(-(t - VG.strike) * 5) * Math.sin((t - VG.strike) * 40);
  const ag = afterglow(t);
  const zm = cam.z / M;
  // the molecules take over across a wide band of the zoom (log scale), so the hand-over spans several frames
  const microA = clamp((Math.log(cam.z) - Math.log(6)) / (Math.log(24) - Math.log(6)));
  const stageA = 1 - clamp((cam.z - 26) / 10);
  const boltD = boltPts.map((q, i) => `${i ? 'L' : 'M'}${fmt(q.x)},${fmt(q.y)}`).join(' ');
  const forkD = fork.map((q, i) => `${i ? 'L' : 'M'}${fmt(q.x)},${fmt(q.y)}`).join(' ');
  const ww = (px: number) => (px * Math.pow(cam.z, 0.42)) / cam.z;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#2D3A4E" />
      <g opacity={stageA}>
        <Layer cam={cam} depth={1.8}>
          <path d="M-900,1500 Q-200,1380 400,1450 Q1000,1520 1900,1420 L1900,2600 L-900,2600 Z" fill="#32485A" />
        </Layer>
        <Layer cam={cam} depth={1}>
          <defs>
            <XRayFilter id="vg-xr" />
            <radialGradient id="vg-hl" gradientUnits="userSpaceOnUse" cx={fmt(HT.x)} cy={fmt(HT.y)} r={360}>
              <stop offset="0" stopColor="#DDE4FF" stopOpacity={0.55} />
              <stop offset="1" stopColor="#8E9CFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* grassy hump and his shadow */}
          <path d="M-600,1700 Q100,1580 540,1600 Q1000,1620 1700,1720 L1700,2600 L-600,2600 Z" fill="#4E7A5A" stroke="#162430" strokeWidth={5} />
          <path d="M-600,1720 Q100,1610 540,1630 Q1000,1650 1700,1740" fill="none" stroke="#6E9C72" strokeWidth={10} opacity={0.6} />
          <ellipse cx={J0.lLeg.A.x + 30} cy={J0.lLeg.A.y + 26} rx={190} ry={24} fill="#1E3326" opacity={0.45} />
          {/* cartoon rain from the cloud only (localized weather) */}
          <g stroke="#9DB3C8" strokeOpacity={0.45 * clamp(1 - (cam.z - 1.5) / 1.5)} strokeWidth={3} strokeLinecap="round">
            {Array.from({length: 26}, (_, i) => {
              const x = QV.x - 160 + 340 * hash(i, 601);
              const y = CLOUD_V - 10 + ((260 * hash(i, 603) + t * 900) % 300);
              return <line key={i} x1={fmt(x)} y1={fmt(y)} x2={fmt(x - 5)} y2={fmt(y + 26)} />;
            })}
          </g>
          <Cloud flash={flash} rumble={rumble * 0.4} />
          {/* static before the strike: small sparks at the hair tips */}
          {t > VG.t0 + 0.35 && t < VG.strike && [0, 1, 2].map((k) => {
            const on = noise1(t * 14 + k * 3, 7 + k) > 0.35;
            const a = {x: j.head.x - 50 + 50 * k, y: j.head.y - 96 * p.s * (1.15 + 0.1 * (k === 1 ? 1 : 0))};
            return on ? <path key={k} d={`M${fmt(a.x)},${fmt(a.y)} l-6,-12 l8,-2 l-5,-12`} fill="none" stroke="#DCE6FF" strokeWidth={2.5} strokeLinecap="round" /> : null;
          })}
          {/* the figure, or its x-ray during an exposure */}
          <g filter={xr ? 'url(#vg-xr)' : undefined}>
            <Man id="vg" pose={p} expr={leadExpr(t)} lHand={lHand} rHand={lHand} outfit={outfit} hairSway={sway} />
          </g>
          {xr && <Skeleton pose={p} />}
          {/* soot and smoke after the strike */}
          {singe > 0.01 && !xr && (
            <g opacity={singe}>
              <ellipse cx={j.head.x - 30} cy={j.head.y + 30} rx={14} ry={8} fill="#2A2020" opacity={0.35} />
              <ellipse cx={j.head.x + 44} cy={j.head.y + 34} rx={10} ry={6} fill="#2A2020" opacity={0.3} />
              {[0, 1, 2].map((k) => {
                const age = ((t - VG.follow + k * 0.27) % 0.8) / 0.8;
                const x = j.head.x - 40 + k * 40 + 12 * Math.sin(age * 5 + k);
                const y = j.head.y - 96 * p.s * 1.2 - age * 120;
                return t > VG.follow ? <circle key={k} cx={fmt(x)} cy={fmt(y)} r={10 + 18 * age} fill="#C9D0D8" opacity={0.45 * (1 - age)} /> : null;
              })}
            </g>
          )}
          {/* the bolt (downward, localized) and its light on him */}
          {(bk > 0 || ag > 0) && (
            <g style={{mixBlendMode: 'screen'}}>
              {bk > 0 && <circle cx={fmt(HT.x)} cy={fmt(HT.y)} r={360} fill="url(#vg-hl)" opacity={bk} />}
              {[boltD, forkD].map((d, i) => (
                <g key={i} opacity={Math.max(bk, ag * 0.5) * (i ? 0.7 : 1) * (1 - microA)}>
                  <path d={d} fill="none" stroke="#7C88FF" strokeOpacity={0.3} strokeWidth={fmt(ww(34))} strokeLinejoin="round" strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#C6D0FF" strokeOpacity={0.55} strokeWidth={fmt(ww(12))} strokeLinejoin="round" strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={fmt(ww(4))} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ))}
            </g>
          )}
        </Layer>
      </g>
      {/* the air beside his head, at the bolt's path: the molecular view as a nested scale */}
      {microA > 0 && (
        <Layer cam={cam} depth={1}>
          <g transform={`translate(${fmt(QV.x)} ${fmt(QV.y)}) rotate(${AX_ANG}) scale(${1 / M})`}>
            <rect x={-3000} y={-3000} width={6000} height={6000} fill="#1A2436" opacity={microA} />
            <MicroField id="vgm" mols={RESIST_MOLS} view={{a0: -560, a1: 560, b0: -800, b1: 800}} mode={{pulses: [], release: () => Infinity, t, heat: 0, front: null, frontK: 0, breakdown: ag, tug: ss(t, VG.micro - 0.2, VG.micro + 0.3), alpha: microA, zm}} />
          </g>
        </Layer>
      )}
    </g>
  );
};
