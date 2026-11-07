// The film: shots, transitions, scope labels, captions, audio. Every time comes from story.ts (measured word times).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {clamp, DUR, FPS, lerp, ss, ss5} from './lib';
import {resetIds, uid} from './core/ids';
import {add3, Basis, basis, bodyFrame, Frame, orbit, Orbit, P2, poly, proj, unproj, V2, V3, xf} from './three';
import {pose, phiOfPhase, wingPt, HINGE, CRADLE, Pose} from './rig';
import {
  CUT, LAB, T, T_FLAP, V_FLY, arcs, duckCut, duckPos, labFocus, labShellLift, labState, meadowState, openState, pondCam, skyState,
  uOpen, uSky, MEADOW_T0, SKY_T0, ShotState, OPEN_REVEAL, SKY_REVEAL, openReveal, skyReveal,
} from './story';
import {Captions} from './Captions';
import {C, INK} from './art/palette';
import {Bird, NearWing} from './art/bird';
import {Mech, Cradle} from './art/mech';
import {FieldBack, FieldFront, LabBack, LabFront, MeadowBack, MeadowFront, SkyBack} from './art/world';
import {Flock, LivingBird} from './art/flock';
import {Duck, Pond} from './art/duck';

const W = 1080, H = 1920;
const frac = (x: number) => x - Math.floor(x);

import {sweepPath, radialPath} from './reveal';

// ------------------------------------------------------------------ the bird with its drive
/** revealPath: the open part of the flank window (screen space); null = closed (exterior intact) */
const DroneBird: React.FC<{B: Basis; s: ShotState; revealPath?: string | null; focus?: 'P0' | 'A' | 'B' | 'rod' | null; detail?: number; shellLift?: number; tone?: number}> = ({B, s, revealPath = null, focus = null, detail = 0, shellLift = 0, tone = 0}) => (
  <Bird
    B={B}
    F={s.F}
    ps={s.ps}
    look={{cut: revealPath ? 1 : 0, cutReveal: revealPath ? () => revealPath : undefined, phantom: revealPath ? 1 : 0, shellLift, tone}}
    mech={<Mech B={B} F={s.F} ps={s.ps} look={{rate: s.rate, focus, detail}} />}
  />
);

// ------------------------------------------------------------------ shots
const OpenShot: React.FC<{t: number}> = ({t}) => {
  const s = openState(t);
  const B = basis(s.cam);
  const r = openReveal(t);
  return (
    <g>
      <FieldBack B={B} t={t} />
      <DroneBird B={B} s={s} revealPath={r ? sweepPath(B, s.F, r.e, r.mode) : null} detail={0.25} />
      <FieldFront B={B} t={t} />
    </g>
  );
};

const LAB_GEAR_C: [number, number] = [3.4, -1.6];
const LabShot: React.FC<{t: number}> = ({t}) => {
  const s = labState(t);
  const B = basis(s.cam);
  const lift = labShellLift(t);
  const rOpen = ss(t, LAB.cutOpen[0], LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[1]));
  const detail = clamp((s.cam.scale - 16) / 36);
  return (
    <g>
      <LabBack B={B} t={t} />
      <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="back" />
      <DroneBird B={B} s={s} revealPath={radialPath(B, s.F, LAB_GEAR_C, 10.5 * rOpen)} focus={labFocus(t)} detail={detail} shellLift={lift} />
      <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="front" />
      <ExplodeGuides B={B} F={s.F} t={t} lift={lift} />
      <LabFront B={B} t={t} />
    </g>
  );
};
/** dashed alignment guides in the exploded view (shell slots to the frame's hinges; belly to the cradle pads) */
const ExplodeGuides: React.FC<{B: Basis; F: Frame; t: number; lift: number}> = ({B, F, t, lift}) => {
  const a = clamp(ss(t, LAB.lift[0] + 0.55, LAB.lift[0] + 0.9) * (1 - ss(t, LAB.seat[0], LAB.seat[0] + 0.3)));
  if (a <= 0.01 || lift < 1) return null;
  const pairs: [V3, V3][] = [
    [[HINGE.near[0], HINGE.near[1] + 0.8 + lift, 5.2], [HINGE.near[0], HINGE.near[1] + 0.4, 2.2]],
    [[HINGE.far[0], HINGE.far[1] + 0.8 + lift, -5.2], [HINGE.far[0], HINGE.far[1] + 0.4, -2.2]],
    [[-9, -4.6 + lift, 0], [-2.4, -2.4, 0]],
    [[9, -4.2 + lift, 0], [7.2, -1.4, 0]],
  ];
  return (
    <g opacity={a}>
      {pairs.map(([p, q], i) => {
        const P = proj(B, xf(F, p)), Q = proj(B, xf(F, q));
        return (
          <g key={i}>
            <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke="#FFFFFF" strokeWidth={3.2} strokeDasharray="10 9" strokeLinecap="round" opacity={0.85} />
            <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={INK} strokeWidth={1.4} strokeDasharray="10 9" strokeLinecap="round" opacity={0.7} />
            <circle cx={P.x} cy={P.y} r={5} fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
            <circle cx={Q.x} cy={Q.y} r={5} fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
          </g>
        );
      })}
    </g>
  );
};

/** living birds beyond the drone (alive and natural; they fly on, unaware of it). Each is placed by where it should sit
 *  on screen at the middle of its shot (x, y px) and how far beyond the drone it is (cm of extra depth), then given a
 *  cruising speed close to the drone's, so the tracking camera keeps it in the frame's upper half, over the far land. */
type Spot = [number, number, number, number, number, number]; // screen x, screen y, extra depth, dvx (cm/s), freq, phase
const placeFlock = (state: (t: number) => ShotState, t0: number, tc: number, spots: Spot[]): LivingBird[] => {
  const s = state(tc);
  const B = basis(s.cam);
  const d0 = proj(B, s.F.o).z;
  return spots.map(([x, y, extra, dvx, freq, phase]) => {
    const v: V3 = [V_FLY + dvx, 0, 0];
    const p = unproj(B, x, y, d0 + extra);
    return {o: [p[0] - v[0] * (tc - t0), p[1], p[2]], v, scale: 1, phase, freq};
  });
};
const MEADOW_FLOCK: LivingBird[] = placeFlock(meadowState, MEADOW_T0, MEADOW_T0 + 1.5, [
  [330, 640, 2600, 4, 2.3, 0.1], [560, 720, 1700, -3, 2.1, 0.55], [740, 580, 3300, 2, 2.5, 0.3], [860, 700, 2200, -4, 2.2, 0.8], [450, 540, 3900, 3, 2.4, 0.05],
]);
const SKY_FLOCK: LivingBird[] = placeFlock(skyState, SKY_T0, SKY_T0 + 1.3, [
  [430, 560, 2400, 3, 2.2, 0.2], [610, 640, 1600, -2, 2.4, 0.65], [770, 520, 3000, 2, 2.1, 0.4], [850, 680, 2000, -4, 2.5, 0.9], [540, 470, 3600, 1, 2.3, 0.15],
]);
const MeadowShot: React.FC<{t: number}> = ({t}) => {
  const s = meadowState(t);
  const B = basis(s.cam);
  const tf = t - MEADOW_T0;
  const ar = arcs(t);
  return (
    <g>
      <MeadowBack B={B} t={tf} />
      <Flock B={B} t={tf} birds={MEADOW_FLOCK} />
      <DroneBird B={B} s={s} />
      {ar.a > 0.01 && <SoundArcs B={B} F={s.F} a={ar.a} r={ar.r} />}
      <MeadowFront B={B} t={tf} />
    </g>
  );
};
/** restrained sound arcs around the drone that diminish (the low-disturbance research aim; no numbers, no "silent") */
const SoundArcs: React.FC<{B: Basis; F: Frame; a: number; r: number}> = ({B, F, a, r}) => {
  const c = proj(B, xf(F, [0, 1, 0]));
  const base = 30 * c.s * r;
  const arc = (R: number, a0: number, a1: number) => {
    const p0 = {x: c.x + R * Math.cos(a0), y: c.y + R * Math.sin(a0)}, p1 = {x: c.x + R * Math.cos(a1), y: c.y + R * Math.sin(a1)};
    return `M${P2(p0)} A${R.toFixed(1)},${R.toFixed(1)} 0 0,1 ${P2(p1)}`;
  };
  return (
    <g opacity={a} fill="none" strokeLinecap="round">
      {[1, 1.35, 1.7].map((k, i) => (
        <g key={i} opacity={(1 - i * 0.28) * 0.75}>
          <path d={arc(base * k, -0.55, 0.55)} stroke="#FFFFFF" strokeWidth={4} />
          <path d={arc(base * k, Math.PI - 0.55, Math.PI + 0.55)} stroke="#FFFFFF" strokeWidth={4} />
        </g>
      ))}
    </g>
  );
};

const PondShot: React.FC<{t: number}> = ({t}) => {
  const cam = pondCam(t);
  const B = basis(cam);
  const k = duckCut(t);
  const o = duckPos(t);
  return (
    <g>
      <Pond B={B} t={t} layer="back" />
      <Pond B={B} t={t} layer="under" />
      <Duck B={B} t={t} o={o} look={{cut: k, wake: 1}} />
      <Pond B={B} t={t} layer="surface" />
      <Pond B={B} t={t} layer="front" />
    </g>
  );
};

const SkyShot: React.FC<{t: number}> = ({t}) => {
  const s = skyState(t);
  const B = basis(s.cam);
  const r = skyReveal(t);
  const tf = t - SKY_T0;
  return (
    <g>
      <SkyBack B={B} t={tf} />
      <Flock B={B} t={tf} birds={SKY_FLOCK} />
      <DroneBird B={B} s={s} revealPath={r ? sweepPath(B, s.F, r.e, r.mode) : null} detail={0.25} />
    </g>
  );
};

// ------------------------------------------------------------------ transitions
/** a near wing passing close to the lens (seen from above, its span across the frame, trailing edge up) sweeps DOWN the
 *  frame: above its mid-chord the incoming shot, below it the outgoing one */
const WING_PS: Pose = pose(phiOfPhase(0.25));
const WingWipe: React.FC<{p: number; under: React.ReactNode; over: React.ReactNode}> = ({p, under, over}) => {
  const id = uid('ww');
  const y = lerp(-420, H + 420, p);
  const W0 = WING_PS.wing.near;
  const mid = wingPt(W0, 21, 5);
  const cam = (yy: number): Basis => basis({target: mid, yaw: 90, pitch: 89.5, dist: 3000, scale: 41, cx: 540, cy: yy, roll: -6 + 10 * p});
  const F0 = bodyFrame([0, 0, 0]);
  const v = (H + 840) / 0.45; // px/s nominal, for the ghosts
  return (
    <g>
      <defs>
        <clipPath id={`${id}u`}><rect x={-50} y={y} width={W + 100} height={H + 900} /></clipPath>
        <clipPath id={`${id}o`}><rect x={-50} y={-900} width={W + 100} height={y + 900} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}u)`}>{under}</g>
      <g clipPath={`url(#${id}o)`}>{over}</g>
      <g opacity={0.22}><NearWing B={cam(y - v / FPS * 0.66)} F={F0} ps={WING_PS} /></g>
      <g opacity={0.4}><NearWing B={cam(y - v / FPS * 0.33)} F={F0} ps={WING_PS} /></g>
      <NearWing B={cam(y)} F={F0} ps={WING_PS} />
    </g>
  );
};
/** a water surface rises up the frame: below it the pond, above it the meadow */
const WaterlineWipe: React.FC<{p: number; t: number; under: React.ReactNode; over: React.ReactNode}> = ({p, t, under, over}) => {
  const id = uid('wl');
  const y0 = lerp(H + 80, -80, p);
  const pts: V2[] = [];
  for (let i = 0; i <= 36; i++) {
    const x = (i / 36) * (W + 120) - 60;
    pts.push({x, y: y0 + 16 * Math.sin(x / 95 + t * 7) + 7 * Math.sin(x / 37 - t * 11)});
  }
  const surf = `M-60,${H + 900} L${pts.map(P2).join(' L')} L${W + 60},${H + 900} Z`;
  const line = `M${pts.map(P2).join(' L')}`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}a`}><path d={surf} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" y1={y0 - 10} x2="0" y2={y0 + 120} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.waterLit} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.water} stopOpacity={0} />
        </linearGradient>
      </defs>
      {over}
      <g clipPath={`url(#${id}a)`}>{under}</g>
      <path d={surf} fill={`url(#${id}g)`} clipPath={`url(#${id}a)`} />
      <path d={line} fill="none" stroke="#FFFFFF" strokeWidth={7} opacity={0.85} strokeLinecap="round" />
      <path d={line} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.5} transform="translate(0,6)" />
    </g>
  );
};
/** a foreground water crest crosses the frame left to right: behind it (to its left) the next shot */
const CrestWipe: React.FC<{p: number; t: number; under: React.ReactNode; over: React.ReactNode}> = ({p, t, under, over}) => {
  const id = uid('cw');
  const x0 = lerp(-160, W + 160, p);
  const pts: V2[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * (H + 200) - 100;
    pts.push({x: x0 + 40 * Math.sin(y / 160 + t * 5) + 18 * Math.sin(y / 53 - t * 9) - 0.12 * (y - H / 2), y});
  }
  const left = `M-400,-100 L${pts.map(P2).join(' L')} L-400,${H + 100} Z`;
  const edge = `M${pts.map(P2).join(' L')}`;
  return (
    <g>
      <defs><clipPath id={`${id}l`}><path d={left} /></clipPath></defs>
      {under}
      <g clipPath={`url(#${id}l)`}>{over}</g>
      <path d={edge} fill="none" stroke={C.waterLit} strokeWidth={70} opacity={0.55} strokeLinecap="round" />
      <path d={edge} fill="none" stroke="#FFFFFF" strokeWidth={14} opacity={0.9} strokeLinecap="round" />
      <path d={edge} fill="none" stroke={C.water} strokeWidth={4} opacity={0.6} transform="translate(-20,0)" />
    </g>
  );
};

// ------------------------------------------------------------------ the scope labels
const ScopeLabel: React.FC<{text: string; a: number; x: number; y: number}> = ({text, a, x, y}) =>
  a <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x, top: y, opacity: a, transform: 'translateZ(0)', padding: '7px 16px 8px', borderRadius: 999, background: C.labelBg,
      border: '1.5px solid rgba(244,241,232,0.55)', color: C.labelText, fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 27, letterSpacing: '0.16em', lineHeight: 1}}>
      {text}
    </div>
  );
const labelOps = (t: number) => {
  const sch = Math.max(
    ss(t, 0.3, 0.55) * (1 - ss(t, OPEN_REVEAL.close[0], OPEN_REVEAL.close[1])),
    ss(t, LAB.lift[0] + 0.45, LAB.lift[0] + 0.75) * (1 - ss(t, LAB.seat[1] - 0.25, LAB.seat[1] + 0.05)),
    ss(t, LAB.cutOpen[0] + 0.15, LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[0] + 0.25)),
    ss(t, T.using2, T.using2 + 0.2) * (1 - ss(t, T.duckEnd, T.duckEnd + 0.25)),
    ss(t, SKY_REVEAL.open[0], SKY_REVEAL.open[0] + 0.15) * (1 - ss(t, SKY_REVEAL.close[0], SKY_REVEAL.close[1])),
  );
  const res = ss(t, MEADOW_T0 + 0.5, MEADOW_T0 + 0.75) * (1 - ss(t, CUT.meadowToPond[0] - 0.1, CUT.meadowToPond[0] + 0.1));
  return {sch, res};
};

// ------------------------------------------------------------------ the frame
export const pictureAt = (t: number): React.ReactNode => {
  const [lm0, lm1] = CUT.labToMeadow, [mp0, mp1] = CUT.meadowToPond, [ps0, ps1] = CUT.pondToSky, [lp0, lp1] = CUT.loop;
  if (t < CUT.openToLab) return <OpenShot t={t} />;
  if (t < lm0) return <LabShot t={t} />;
  if (t < lm1) return <WingWipe p={ss5(t, lm0, lm1) * 0.5 + 0.5 * (t - lm0) / (lm1 - lm0)} under={<LabShot t={t} />} over={<MeadowShot t={t} />} />;
  if (t < mp0) return <MeadowShot t={t} />;
  if (t < mp1) return <WaterlineWipe p={ss(t, mp0, mp1)} t={t} under={<PondShot t={t} />} over={<MeadowShot t={t} />} />;
  if (t < ps0) return <PondShot t={t} />;
  if (t < ps1) return <CrestWipe p={ss(t, ps0, ps1)} t={t} under={<PondShot t={t} />} over={<SkyShot t={t} />} />;
  if (t < lp0) return <SkyShot t={t} />;
  if (t < lp1) return <WingWipe p={ss5(t, lp0, lp1) * 0.6 + 0.4 * (t - lp0) / (lp1 - lp0)} under={<SkyShot t={t} />} over={<OpenShot t={t - DUR} />} />;
  return <OpenShot t={t - DUR} />;
};

export const FilmFrame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  resetIds(`f${f}_`);
  const L = labelOps(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#CFE3EE', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {pictureAt(t)}
      </svg>
      <ScopeLabel text="SCHEMATIC" a={L.sch} x={64} y={1418} />
      <ScopeLabel text="RESEARCH GOAL" a={L.res} x={64} y={1418} />
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};
export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FilmFrame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet: React.FC<{fs: number[]; captions: boolean; cols?: number}> = ({fs, captions, cols = 4}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * W * k, top: Math.floor(i / cols) * H * k, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <FilmFrame f={f} captions={captions} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
// unused helpers kept typed
void orbit; void add3; void uOpen; void uSky; void V_FLY; void T_FLAP; void frac; void duckCut; void (null as unknown as Orbit);
