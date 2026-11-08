// The film: shots, transitions, scope labels, captions, audio. Every time comes from story.ts (measured word times).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {clamp, DUR, FPS, lerp, ss, ss5} from './lib';
import {resetIds, uid} from './core/ids';
import {add3, Basis, basis, bodyFrame, Frame, orbit, Orbit, P2, poly, proj, unproj, V2, V3, xf} from './three';
import {pose, phiOfPhase, wingPt, HINGE, CRADLE, Pose} from './rig';
import {
  CUT, LAB, T, T_FLAP, V_FLY, arcs, labFrameLift, duckCut, duckPos, labFocus, labShellLift, labState, meadowState, openState, pondCam, skyState,
  uOpen, uSky, MEADOW_T0, SKY_T0, ShotState, OPEN_REVEAL, SKY_REVEAL, openReveal, skyReveal, meadowReveal, MEADOW_REVEAL,
} from './story';
import {Captions} from './Captions';
import {C, INK} from './art/palette';
import {Bird, BirdLook} from './art/bird';
import {Mech, Cradle} from './art/mech';
import {FieldBack, FieldFront, LabBack, LabFront, MeadowBack, MeadowFront, SkyBack, MEADOW, SKY} from './art/world';
import {Flock, LivingBird} from './art/flock';
import {Duck, Pond} from './art/duck';

const W = 1080, H = 1920;
const LABEL_Y = 1440;
const frac = (x: number) => x - Math.floor(x);

import {sweepPath, radialPath} from './reveal';

// ------------------------------------------------------------------ the bird with its drive
/** revealPath: the open part of the flank window (screen space); null = closed (exterior intact) */
const DroneBird: React.FC<{B: Basis; s: ShotState; revealPath?: string | null; focus?: 'P0' | 'A' | 'B' | 'rod' | null; detail?: number; shellLift?: number; shellTilt?: number; phantom?: number; tone?: number}> = ({B, s, revealPath = null, focus = null, detail = 0, shellLift = 0, shellTilt = 0, phantom = 0, tone = 0}) => {
  // the near wing is ghosted over the drive whenever the drive is shown (a cutaway, or the frame in the exploded view)
  const look: BirdLook & {shellTilt?: number} = {cut: revealPath ? 1 : 0, cutReveal: revealPath ? () => revealPath : undefined, phantom: revealPath ? 1 : phantom, shellLift, shellTilt, tone};
  return <Bird B={B} F={s.F} ps={s.ps} look={look as BirdLook} mech={<Mech B={B} F={s.F} ps={s.ps} look={{rate: s.rate, focus, detail}} />} />;
};
/** a shot in three layers, so a transition can sweep its background and keep one continuous drone */
type Parts = {back: React.ReactNode; bird: React.ReactNode; front: React.ReactNode};
const Shot: React.FC<{p: Parts}> = ({p}) => <g>{p.back}{p.bird}{p.front}</g>;

// ------------------------------------------------------------------ shots
const openParts = (t: number): Parts => {
  const s = openState(t);
  const B = basis(s.cam);
  const r = openReveal(t);
  return {
    back: <FieldBack B={B} t={t} />,
    bird: <DroneBird B={B} s={s} revealPath={r ? sweepPath(B, s.F, r.e, r.mode) : null} focus={openFocus(t)} detail={detailOf(s.cam.scale)} />,
    front: <FieldFront B={B} t={t} />,
  };
};
const OpenShot: React.FC<{t: number}> = ({t}) => <Shot p={openParts(t)} />;
/** drive detail by on-screen scale (px/cm) */
const detailOf = (scale: number) => clamp((scale - 16) / 36);
/** (V2) the hook's highlight follows the words: the motor on 'motor', then the rod, lever and wing root on 'dead bird' */
const openFocus = (t: number): 'P0' | 'A' | 'B' | 'rod' | null => {
  if (t >= 0.35 && t < 0.95) return 'motor' as unknown as 'P0';
  if (t >= 0.95 && t < 2.0) return 'rod';
  return null;
};

const LAB_GEAR_C: [number, number] = [3.4, -1.6];
const labParts = (t: number): Parts => {
  const s = labState(t);
  const B = basis(s.cam);
  const lift = labShellLift(t);
  const rOpen = ss(t, LAB.cutOpen[0], LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[1]));
  const detail = clamp((s.cam.scale - 16) / 36);
  const k = clamp(lift / LAB.liftH);
  return {
    back: (
      <g>
        <LabBack B={B} t={t} />
        <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="back" />
      </g>
    ),
    // while the shell is up it tips toward the camera (its open underside shows) and the near wing is ghosted over the frame
    bird: <DroneBird B={B} s={s} revealPath={radialPath(B, s.F, LAB_GEAR_C, 10.5 * rOpen)} focus={labFocus(t)} detail={detail} shellLift={lift} shellTilt={14 * k} phantom={ss(k, 0.15, 0.6)} />,
    front: (
      <g>
        <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="front" ps={s.ps} />
        <ExplodeGuides B={B} F={s.F} t={t} lift={lift} />
        <LabFront B={B} t={t} />
      </g>
    ),
  };
};
const LabShot: React.FC<{t: number}> = ({t}) => <Shot p={labParts(t)} />;
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
  // the frame off the cradle (three-layer schematic): body bottom to the cradle pads, in world coords for the pads
  const fl = labFrameLift(t);
  const worldPairs: [V3, V3][] = fl > 0.3 ? CRADLE.xs.map((x) => [xf(F, [x, CRADLE.contactY + 0.3, 0]), [x, CRADLE.contactY - 0.2, 0]] as [V3, V3]) : [];
  return (
    <g opacity={a}>
      {[...pairs.map(([p, q]) => [xf(F, p), xf(F, q)] as [V3, V3]), ...worldPairs].map(([p, q], i) => {
        const P = proj(B, p), Q = proj(B, q);
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
// meadow: five far birds over the reeds and two nearer ones (about two-thirds of the drone's size) flying calmly beside
// it, none within ~60 px of its wing envelope, all below the caption band (paths checked with a projection script). The
// camera's rotation is fixed for the shot, so the far birds hold their places; they fly on with the drone at the end.
const MEADOW_FLOCK: LivingBird[] = placeFlock(meadowState, MEADOW_T0, MEADOW_T0 + 1.2, [
  [120, 610, 3300, 3, 2.4, 0.05], [330, 690, 2400, 4, 2.3, 0.1], [560, 585, 3800, 2, 2.5, 0.3], [720, 660, 2000, -4, 2.2, 0.8], [960, 600, 2900, -3, 2.1, 0.55],
  [215, 880, 650, 2, 2.2, 0.35], [890, 790, 800, -2, 2.3, 0.7],
]);
// sky: the flock holds the upper right, ahead of the drone (its eye line), with one nearer bird behind it on the left, and
// stays in frame through the punchline; all clear of the caption column and the drone's wingtips at every phase
const SKY_FLOCK: LivingBird[] = placeFlock(skyState, SKY_T0, 21.5, [
  [720, 600, 3000, 0, 2.2, 0.2], [860, 690, 2200, 0, 2.4, 0.65], [985, 560, 3600, 0, 2.1, 0.4], [830, 820, 1600, 0, 2.5, 0.9],
  [230, 650, 900, 0, 2.2, 0.5],
]);
const meadowParts = (t: number): Parts => {
  const s = meadowState(t);
  const B = basis(s.cam);
  const tf = t - MEADOW_T0;
  const ar = arcs(t);
  return {
    back: (
      <g>
        <MeadowBack B={B} t={tf} />
        <Flock B={B} t={tf} birds={MEADOW_FLOCK} haze={MEADOW.haze} />
      </g>
    ),
    bird: (() => {
      const r = meadowReveal(t);
      return <DroneBird B={B} s={s} revealPath={r ? sweepPath(B, s.F, r.e, r.mode) : null} detail={detailOf(s.cam.scale)} />;
    })(),
    front: (
      <g>
        {ar.a > 0.01 && <SoundArcs B={B} F={s.F} a={ar.a} n={ar.n} r={ar.r} />}
        <MeadowFront B={B} t={tf} />
      </g>
    ),
  };
};
const MeadowShot: React.FC<{t: number}> = ({t}) => <Shot p={meadowParts(t)} />;
/** restrained sound arcs around the drone: three, then on 'less disturbance' they shrink to one faint arc that stays
 *  (a reduction, never silence; no numbers) */
const SoundArcs: React.FC<{B: Basis; F: Frame; a: number; n: number; r: number}> = ({B, F, a, n, r}) => {
  const c = proj(B, xf(F, [0, 1, 0]));
  const base = 30 * c.s * r;
  const arc = (R: number, a0: number, a1: number) => {
    const p0 = {x: c.x + R * Math.cos(a0), y: c.y + R * Math.sin(a0)}, p1 = {x: c.x + R * Math.cos(a1), y: c.y + R * Math.sin(a1)};
    return `M${P2(p0)} A${R.toFixed(1)},${R.toFixed(1)} 0 0,1 ${P2(p1)}`;
  };
  return (
    <g opacity={a} fill="none" strokeLinecap="round">
      {[1, 1.32, 1.64].map((k, i) => {
        const o = clamp(n - i);
        if (o <= 0.01) return null;
        const ds = [arc(base * k, -0.5, 0.5), arc(base * k, Math.PI - 0.5, Math.PI + 0.5)];
        return (
          <g key={i} opacity={o * (1 - i * 0.22)}>
            {ds.map((d, j) => <path key={`u${j}`} d={d} stroke={INK} strokeWidth={9.5} opacity={0.28} />)}
            {ds.map((d, j) => <path key={`w${j}`} d={d} stroke="#FFFFFF" strokeWidth={6} />)}
          </g>
        );
      })}
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

const skyParts = (t: number): Parts => {
  const s = skyState(t);
  const B = basis(s.cam);
  const r = skyReveal(t);
  const tf = t - SKY_T0;
  return {
    back: (
      <g>
        <SkyBack B={B} t={tf} />
        <Flock B={B} t={tf} birds={SKY_FLOCK} haze={SKY.haze} />
      </g>
    ),
    bird: <DroneBird B={B} s={s} revealPath={r ? sweepPath(B, s.F, r.e, r.mode) : null} detail={detailOf(s.cam.scale)} />,
    front: null,
  };
};
const SkyShot: React.FC<{t: number}> = ({t}) => <Shot p={skyParts(t)} />;

// ------------------------------------------------------------------ transitions
/** the place changes behind one continuous drone: the incoming background sweeps DOWN the frame on the drone's
 *  downstroke (an edge curved like the wingtip's arc, with a soft streak of light above it), under the drone; the drone
 *  and the foreground are swept with their backgrounds, and since both shots frame the same drone at the same place,
 *  scale and wing phase, it does not change */
const SweepWipe: React.FC<{p: number; out: Parts; inn: Parts}> = ({p, out, inn}) => {
  const id = uid('sw');
  const sag = 80;
  const y = lerp(-2 * sag - 40, H + 40, p);
  const curve = (dy: number) => `-60,${(y + dy).toFixed(1)} Q${W / 2},${(y + dy + 2 * sag).toFixed(1)} ${W + 60},${(y + dy).toFixed(1)}`;
  const above = `M-60,-800 L${W + 60},-800 L${W + 60},${y.toFixed(1)} Q${W / 2},${(y + 2 * sag).toFixed(1)} -60,${y.toFixed(1)} Z`;
  const below = `M-60,${H + 800} L${W + 60},${H + 800} L${W + 60},${y.toFixed(1)} Q${W / 2},${(y + 2 * sag).toFixed(1)} -60,${y.toFixed(1)} Z`;
  const band = `M${curve(-170)} L${W + 60},${y.toFixed(1)} Q${W / 2},${(y + 2 * sag).toFixed(1)} -60,${y.toFixed(1)} Z`;
  const both = (k: keyof Parts) => (
    <g>
      <g mask={`url(#${id}mb)`}>{out[k]}</g>
      <g mask={`url(#${id}ma)`}>{inn[k]}</g>
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`${id}a`}><path d={above} /></clipPath>
        <clipPath id={`${id}b`}><path d={below} /></clipPath>
        {/* masks, not clip paths, on the swept layers: a clipped group holding blur filters can leave a filter tile at the
            frame origin in Chromium */}
        <mask id={`${id}ma`} maskUnits="userSpaceOnUse" x={-100} y={-900} width={W + 200} height={H + 1800}><path d={above} fill="#FFFFFF" /></mask>
        <mask id={`${id}mb`} maskUnits="userSpaceOnUse" x={-100} y={-900} width={W + 200} height={H + 1800}><path d={below} fill="#FFFFFF" /></mask>
        <linearGradient id={`${id}g`} x1="0" y1={y - 170} x2="0" y2={y + 2 * sag} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.42} />
        </linearGradient>
      </defs>
      {both('back')}
      <path d={band} fill={`url(#${id}g)`} />
      <path d={`M${curve(0)}`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.55} />
      {both('bird')}
      {both('front')}
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
      <path d={edge} fill="none" stroke={C.water} strokeWidth={96} strokeLinecap="round" />
      <path d={edge} fill="none" stroke={C.waterLit} strokeWidth={56} strokeLinecap="round" transform="translate(10,0)" />
      <path d={edge} fill="none" stroke="#FFFFFF" strokeWidth={14} opacity={0.95} strokeLinecap="round" transform="translate(30,0)" />
      <path d={edge} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.45} transform="translate(-46,0)" />
    </g>
  );
};

// ------------------------------------------------------------------ the scope labels
const ScopeLabel: React.FC<{text: string; a: number; y: number}> = ({text, a, y}) =>
  a <= 0.01 ? null : (
    <div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', opacity: a, transform: 'translateZ(0)'}}>
      <span style={{display: 'inline-block', padding: '7px 16px 8px', borderRadius: 999, background: C.labelBg, border: '1.5px solid rgba(244,241,232,0.55)', color: C.labelText,
        fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 27, letterSpacing: '0.16em', lineHeight: 1}}>
        {text}
      </span>
    </div>
  );
const labelOps = (t: number) => {
  const sch = Math.max(
    1 - ss(t, OPEN_REVEAL.close[0], OPEN_REVEAL.close[1]), // the hook cutaway (open from frame 0)
    ss(t, LAB.lift[0] + 0.45, LAB.lift[0] + 0.75) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[0] + 0.25)), // exploded view through the close drive
    ss(t, MEADOW_REVEAL.open[0] + 0.1, MEADOW_REVEAL.open[1] + 0.1) * (1 - ss(t, CUT.pondToSky[0], CUT.pondToSky[0] + 0.2)), // the match through the duck's schematic
    ss(t, SKY_REVEAL.open[0], SKY_REVEAL.open[0] + 0.15), // the callback, open into the loop
  );
  const res = ss(t, MEADOW_T0 + 0.5, MEADOW_T0 + 0.75) * (1 - ss(t, MEADOW_REVEAL.open[0] - 0.05, MEADOW_REVEAL.open[0] + 0.1));
  return {sch, res};
};

// ------------------------------------------------------------------ the frame
export const pictureAt = (t: number): React.ReactNode => {
  const [lm0, lm1] = CUT.labToMeadow, [mp0, mp1] = CUT.meadowToPond, [ps0, ps1] = CUT.pondToSky, [lp0, lp1] = CUT.loop;
  if (t < CUT.openToLab) return <OpenShot t={t} />;
  if (t < lm0) return <LabShot t={t} />;
  if (t < lm1) return <SweepWipe p={ss(t, lm0, lm1)} out={labParts(t)} inn={meadowParts(t)} />;
  if (t < mp0) return <MeadowShot t={t} />;
  if (t < mp1) return <WaterlineWipe p={ss(t, mp0, mp1)} t={t} under={<PondShot t={t} />} over={<MeadowShot t={t} />} />;
  if (t < ps0) return <PondShot t={t} />;
  if (t < ps1) return <CrestWipe p={ss(t, ps0, ps1)} t={t} under={<PondShot t={t} />} over={<SkyShot t={t} />} />;
  if (t < lp0) return <SkyShot t={t} />;
  if (t < lp1) return <SweepWipe p={ss(t, lp0, lp1)} out={skyParts(t)} inn={openParts(t - DUR)} />;
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
      <ScopeLabel text="SCHEMATIC" a={L.sch} y={LABEL_Y} />
      <ScopeLabel text="RESEARCH GOAL" a={L.res} y={LABEL_Y} />
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
